// js/app.js - Main application logic

class StreamBingo {
    constructor() {
        this.auth = window.authManager;
        
        // Initialize app components
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeApp();
        });
    }
    
    initializeApp() {
        // Check if user is authenticated
        if (this.auth && this.auth.isLoggedIn()) {
            this.loadDashboard();
        } else {
            this.loadLogin();
        }
    }
    
    loadDashboard() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Stream Bingo</div>
                <p class="subtitle">Welcome, ${this.auth.getUsername()}</p>
                
                <div class="admin-panel">
                    <div class="admin-sidebar">
                        <div class="card">
                            <h2>Your Rooms</h2>
                            <div id="userRoomsList" class="player-list">
                                <p>Loading your rooms...</p>
                            </div>
                        </div>
                        <button id="logoutBtn" class="btn btn-secondary">Logout</button>
                    </div>
                    
                    <div class="admin-main">
                        <div class="card">
                            <h2>Create a Room</h2>
                            <div class="form-group">
                                <label for="nickname">Your Nickname:</label>
                                <input type="text" id="nickname" class="form-control" placeholder="Enter your nickname">
                            </div>
                            <div class="form-group">
                                <label for="roomCode">Room Code:</label>
                                <input type="text" id="roomCode" class="form-control" placeholder="Enter room code (4-6 chars)" maxlength="6">
                            </div>
                            <div class="form-group">
                                <label for="gridSize">Grid Size:</label>
                                <select id="gridSize" class="form-control">
                                    <option value="3">3x3</option>
                                    <option value="5" selected>5x5</option>
                                    <option value="7">7x7</option>
                                </select>
                            </div>
                            <button id="createRoomBtn" class="btn btn-primary">Create Room</button>
                        </div>
                        
                        <div class="card">
                            <h2>Join a Room</h2>
                            <div class="form-group">
                                <label for="joinNickname">Your Nickname:</label>
                                <input type="text" id="joinNickname" class="form-control" placeholder="Enter your nickname">
                            </div>
                            <div class="form-group">
                                <label for="joinRoomCode">Room Code:</label>
                                <input type="text" id="joinRoomCode" class="form-control" placeholder="Enter room code" maxlength="6">
                            </div>
                            <button id="joinRoomBtn" class="btn btn-primary">Join Room</button>
                        </div>
                        
                        <div class="card">
                            <h2>Bingo Lists</h2>
                            <div id="bingoListsContainer">
                                <p>Your bingo lists will appear here.</p>
                                <button id="createListBtn" class="btn btn-secondary">Create New List</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('createListBtn').addEventListener('click', () => this.createBingoList());
        
        // Load user's rooms
        this.loadUserRooms();
    }
    
    loadLogin() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Stream Bingo</div>
                <div class="subtitle">Login to create or join bingo games for your stream</div>
                
                <div class="form-group">
                    <button id="twitchLoginBtn" class="btn btn-primary">Login with Twitch</button>
                </div>
                <div class="form-group">
                    <button id="testLoginBtn" class="btn btn-secondary">Login as Test User</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('twitchLoginBtn').addEventListener('click', () => this.auth.loginWithTwitch());
        document.getElementById('testLoginBtn').addEventListener('click', () => {
            this.auth.loginWithTestAccount('admin');
            this.loadDashboard();
        });
    }
    
    logout() {
        this.auth.logout();
        this.loadLogin();
    }
    
    async loadUserRooms() {
        try {
            const userId = this.auth.getUsername();
            const roomsList = document.getElementById('userRoomsList');
            
            if (!window.db) {
                roomsList.innerHTML = `<p class="error">Database connection not available</p>`;
                return;
            }
            
            const roomsRef = window.db.collection('rooms').where('creatorId', '==', userId);
            const snapshot = await roomsRef.get();
            
            if (snapshot.empty) {
                roomsList.innerHTML = `<p>You haven't created any rooms yet.</p>`;
                return;
            }
            
            let roomsHTML = '';
            snapshot.forEach(doc => {
                const room = doc.data();
                const roomId = doc.id;
                roomsHTML += `
                    <div class="player-item">
                        <div class="player-info">
                            <span>${roomId}</span>
                            <span>${room.gridSize}x${room.gridSize}</span>
                        </div>
                        <button class="delete-player" data-room-id="${roomId}">×</button>
                    </div>
                `;
            });
            
            roomsList.innerHTML = roomsHTML;
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-player').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roomId = e.target.getAttribute('data-room-id');
                    this.deleteRoom(roomId);
                });
            });
        } catch (error) {
            console.error('Error loading rooms:', error);
            document.getElementById('userRoomsList').innerHTML = `
                <p class="error">Failed to load your rooms: ${error.message}</p>
            `;
        }
    }
    
    async joinRoom() {
        try {
            const nickname = document.getElementById('joinNickname').value.trim();
            const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
            
            if (!nickname || !roomCode) {
                this.showNotification('Please enter both your nickname and the room code');
                return;
            }
            
            if (!window.db) {
                this.showNotification('Database connection not available');
                return;
            }
            
            // Check if room exists
            const roomRef = window.db.collection('rooms').doc(roomCode);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                this.showNotification('Room not found. Please check the room code and try again.', 'error');
                return;
            }
            
            const roomData = roomDoc.data();
            
            if (roomData.status === 'closed') {
                this.showNotification('This room is closed and not accepting new players.', 'error');
                return;
            }
            
            // Add player to room
            await roomRef.update({
                players: firebase.firestore.FieldValue.arrayUnion({
                    nickname: nickname,
                    joinedAt: new Date().toISOString()
                })
            });
            
            this.showNotification(`Successfully joined room ${roomCode}!`, 'success');
            
            // Redirect to game room (implementation pending)
            // this.loadGameRoom(roomCode, nickname);
        } catch (error) {
            console.error('Error joining room:', error);
            
            if (error.code === 'permission-denied') {
                this.showNotification('You do not have permission to join this room.', 'error');
            } else {
                this.showNotification(`Error joining room: ${error.message}`, 'error');
            }
        }
    }
    
    async deleteRoom(roomId) {
        try {
            if (!confirm(`Are you sure you want to delete room ${roomId}?`)) {
                return;
            }
            
            if (!window.db) {
                this.showNotification('Database connection not available');
                return;
            }
            
            const userId = this.auth.getUsername();
            const roomRef = window.db.collection('rooms').doc(roomId);
            const userRoomCountRef = window.db.collection('user_room_counts').doc(userId);
            
            // Check if room exists and belongs to user
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) {
                this.showNotification('Room not found.', 'error');
                return;
            }
            
            const roomData = roomDoc.data();
            if (roomData.creatorId !== userId) {
                this.showNotification('You do not have permission to delete this room.', 'error');
                return;
            }
            
            // Delete room and update count
            await window.db.runTransaction(async (transaction) => {
                const userRoomCountDoc = await transaction.get(userRoomCountRef);
                const currentCount = userRoomCountDoc.exists 
                    ? (userRoomCountDoc.data().room_count || 0)
                    : 0;
                
                transaction.delete(roomRef);
                transaction.set(userRoomCountRef, 
                    { room_count: Math.max(0, currentCount - 1) }, 
                    { merge: true }
                );
            });
            
            this.showNotification(`Room ${roomId} deleted successfully.`, 'success');
            this.loadUserRooms(); // Refresh the list
        } catch (error) {
            console.error('Error deleting room:', error);
            this.showNotification(`Error deleting room: ${error.message}`, 'error');
        }
    }
    
    createBingoList() {
        // Implementation pending
        this.showNotification('Bingo list creation is coming soon!');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        if (type === 'error') {
            notification.style.backgroundColor = '#ff4444';
        } else if (type === 'success') {
            notification.style.backgroundColor = '#4CAF50';
        }
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async createRoom() {
        try {
            const nickname = document.getElementById('nickname').value.trim();
            const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
            const gridSize = parseInt(document.getElementById('gridSize').value);
            
            if (!nickname || !roomCode) {
                this.showNotification('Please enter both nickname and room code');
                return;
            }
            
            if (!window.db) {
                this.showNotification('Database connection not available');
                return;
            }
            
            // Ensure user is authenticated
            if (!this.auth || !this.auth.isLoggedIn()) {
                this.showNotification('You must be logged in to create a room');
                return;
            }
            
            // Get the current user's username
            const userId = this.auth.getUsername();
            
            // Reference to user's room count document
            const userRoomCountRef = window.db.collection('user_room_counts').doc(userId);
            
            // Reference to the new room
            const roomRef = window.db.collection('rooms').doc(roomCode);
            
            // Use a transaction to ensure atomic operations
            await window.db.runTransaction(async (transaction) => {
                // Get current room count
                const userRoomCountDoc = await transaction.get(userRoomCountRef);
                const currentCount = userRoomCountDoc.exists 
                    ? (userRoomCountDoc.data().room_count || 0)
                    : 0;
                
                // Check room count limit
                if (currentCount >= 5) {
                    throw new Error('Room creation limit reached. Maximum 5 rooms per user.');
                }
                
                // Check if room already exists
                const roomDoc = await transaction.get(roomRef);
                if (roomDoc.exists) {
                    throw new Error('Room code already exists. Please choose a different code.');
                }
                
                // Create room data
                const roomData = {
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    gridSize: gridSize,
                    creatorId: userId,
                    creatorNickname: nickname,
                    active: true,
                    status: 'waiting',
                    players: [{
                        nickname: nickname,
                        joinedAt: new Date().toISOString()
                    }]
                };
                
                // Create room and update room count in the same transaction
                transaction.set(roomRef, roomData);
                transaction.set(userRoomCountRef, 
                    { room_count: currentCount + 1 }, 
                    { merge: true }
                );
            });
            
            this.showNotification(`Created room ${roomCode} with grid size ${gridSize}x${gridSize}`, 'success');
            this.loadUserRooms(); // Refresh the list
        } catch (error) {
            console.error('Error creating room:', error);
            
            // More specific error handling
            if (error.message.includes('Room creation limit reached')) {
                this.showNotification('You have reached the maximum of 5 rooms. Delete an existing room to create a new one.', 'error');
            } else if (error.message.includes('Room code already exists')) {
                this.showNotification('Room code already exists. Please choose a different code.', 'error');
            } else if (error.code === 'permission-denied') {
                this.showNotification('You do not have permission to create a room.', 'error');
            } else if (error.code === 'unavailable') {
                this.showNotification('Cannot create room. Network is unavailable.', 'error');
            } else {
                this.showNotification(`Error creating room: ${error.message}`, 'error');
            }
        }
    }
}

// Initialize the application
window.streamBingo = new StreamBingo();

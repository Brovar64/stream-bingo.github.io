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
                        <div>
                            <button class="enter-room" data-room-id="${roomId}">Enter</button>
                            <button class="delete-player" data-room-id="${roomId}">×</button>
                        </div>
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
            
            // Add event listeners for enter buttons
            document.querySelectorAll('.enter-room').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roomId = e.target.getAttribute('data-room-id');
                    this.enterRoom(roomId);
                });
            });
        } catch (error) {
            console.error('Error loading rooms:', error);
            document.getElementById('userRoomsList').innerHTML = `
                <p class="error">Failed to load your rooms: ${error.message}</p>
            `;
        }
    }
    
    enterRoom(roomId) {
        // Get current user nickname
        const nickname = this.auth.getUsername();
        this.loadGameRoom(roomId, nickname);
    }
    
    loadGameRoom(roomId, nickname) {
        // First, load the room data to get the grid size
        window.db.collection('rooms').doc(roomId).get().then(doc => {
            if (!doc.exists) {
                this.showNotification('Room not found', 'error');
                return;
            }
            
            const roomData = doc.data();
            const gridSize = roomData.gridSize;
            
            // Create the game room interface
            const appDiv = document.getElementById('app');
            appDiv.innerHTML = `
                <div class="container">
                    <div class="title">Stream Bingo - Room ${roomId}</div>
                    <p class="subtitle">Playing as: ${nickname}</p>
                    
                    <div class="bingo-grid grid-${gridSize}" id="bingoGrid">
                        ${this.generateBingoGrid(gridSize)}
                    </div>
                    
                    <div class="card">
                        <h2>Room Details</h2>
                        <p>Grid Size: ${gridSize}x${gridSize}</p>
                        <p>Created by: ${roomData.creatorNickname}</p>
                        <p>Status: ${roomData.status}</p>
                        <button id="backToDashboardBtn" class="btn btn-secondary">Back to Dashboard</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('backToDashboardBtn').addEventListener('click', () => this.loadDashboard());
            
            // Add event listeners to the bingo cells
            document.querySelectorAll('.bingo-cell').forEach(cell => {
                cell.addEventListener('click', (e) => {
                    e.target.classList.toggle('marked');
                });
            });
            
            this.showNotification(`Entered room ${roomId}!`, 'success');
        }).catch(error => {
            console.error('Error loading game room:', error);
            this.showNotification(`Error loading game room: ${error.message}`, 'error');
        });
    }
    
    generateBingoGrid(size) {
        let gridHtml = '';
        const totalCells = size * size;
        
        for (let i = 0; i < totalCells; i++) {
            // Create free space in the middle for odd-sized grids
            const isFreeSpace = (size % 2 === 1) && (i === Math.floor(totalCells / 2));
            
            gridHtml += `
                <div class="bingo-cell${isFreeSpace ? ' marked' : ''}" data-index="${i}">
                    ${isFreeSpace ? 'FREE' : `Item ${i+1}`}
                </div>
            `;
        }
        
        return gridHtml;
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
            
            try {
                // First try to read the room data
                await roomRef.get();
                
                // Then add the player to the room's players array
                await roomRef.set({
                    players: firebase.firestore.FieldValue.arrayUnion({
                        nickname: nickname,
                        joinedAt: new Date().toISOString()
                    })
                }, { merge: true });
                
                this.showNotification(`Successfully joined room ${roomCode}!`, 'success');
                this.loadGameRoom(roomCode, nickname);
            } catch (updateError) {
                console.error('Error updating room:', updateError);
                this.showNotification(`Error joining room: ${updateError.message}`, 'error');
                
                // Fallback - if updating fails, just enter the room anyway
                this.loadGameRoom(roomCode, nickname);
            }
        } catch (error) {
            console.error('Error joining room:', error);
            
            if (error.code === 'permission-denied') {
                // If we get a permission denied error, fallback to just entering the room
                this.showNotification('Permission error. Entering the room in read-only mode.', 'error');
                const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
                const nickname = document.getElementById('joinNickname').value.trim();
                this.loadGameRoom(roomCode, nickname);
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
            try {
                // Simple delete rather than transaction to avoid permission issues
                await roomRef.delete();
                this.showNotification(`Room ${roomId} deleted successfully.`, 'success');
                this.loadUserRooms(); // Refresh the list
            } catch (deleteError) {
                console.error('Error deleting room:', deleteError);
                this.showNotification(`Error deleting room: ${deleteError.message}`, 'error');
            }
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
        console.log(`Notification: ${message} (${type})`);
        
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
            
            // Reference to the new room
            const roomRef = window.db.collection('rooms').doc(roomCode);
            
            // First check if the room exists
            const existingRoom = await roomRef.get();
            if (existingRoom.exists) {
                this.showNotification('Room code already exists. Please choose a different code.', 'error');
                return;
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
            
            // Create room directly without transaction
            await roomRef.set(roomData);
            
            this.showNotification(`Created room ${roomCode} with grid size ${gridSize}x${gridSize}`, 'success');
            
            // Automatically enter the room after creation
            this.loadGameRoom(roomCode, nickname);
        } catch (error) {
            console.error('Error creating room:', error);
            
            if (error.message && error.message.includes('Room code already exists')) {
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

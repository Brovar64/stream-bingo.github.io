class StreamBingo {
    constructor() {
        this.app = document.getElementById('app');
        this.currentUser = null;
        this.currentRoom = null;
        this.isAdmin = false;
        this.selectedPlayer = null;
        this.bingoWords = [];
        this.bingoGrid = [];
        this.bingoSize = 3; // Default grid size
        this.debug = true;
        this.log = (...args) => {
            if (this.debug) console.log('[StreamBingo]', ...args);
        };
        this.auth = window.authManager || null;
    }

    async checkRoomExists(roomCode) {
        try {
            // Ensure Firestore is available
            if (!window.db) {
                console.error('Firestore is not available');
                this.showNotification('Database connection not available');
                return false;
            }
            
            console.log(`Checking if room ${roomCode} exists...`);
            
            // Use a more robust room existence check
            const roomRef = window.db.collection('rooms').doc(roomCode);
            const roomDoc = await roomRef.get();
            
            console.log(`Room ${roomCode} exists:`, roomDoc.exists);
            return roomDoc.exists;
        } catch (error) {
            console.error('Error checking room:', error);
            
            // More detailed error handling
            if (error.code === 'unavailable') {
                this.showNotification('Network is offline. Please check your connection.');
            } else if (error.code === 'permission-denied') {
                this.showNotification('Access denied. Check your Firestore rules.');
            } else {
                this.showNotification(`Error checking room: ${error.message}`);
            }
            
            return false;
        }
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
            
            // Check if room already exists with more robust error handling
            const roomExists = await this.checkRoomExists(roomCode);
            
            if (roomExists) {
                this.showNotification('Room code already exists. Please choose a different code.');
                return;
            }
            
            // Create room with additional metadata
            const roomData = {
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                gridSize: gridSize,
                creatorId: this.auth ? this.auth.getUsername() : nickname,
                creatorNickname: nickname,
                active: true,
                status: 'waiting', // Add a status field
                players: [] // Initialize empty players array
            };
            
            // Use set with merge: false to ensure we don't accidentally overwrite
            await window.db.collection('rooms').doc(roomCode).set(roomData, { merge: false });
            
            this.showNotification(`Created room ${roomCode} with grid size ${gridSize}x${gridSize}`);
        } catch (error) {
            console.error('Error creating room:', error);
            
            // More specific error handling
            if (error.code === 'permission-denied') {
                this.showNotification('You do not have permission to create a room.');
            } else if (error.code === 'unavailable') {
                this.showNotification('Cannot create room. Network is unavailable.');
            } else {
                this.showNotification(`Error creating room: ${error.message}`);
            }
        }
    }

    async handleJoinRoom() {
        try {
            const nickname = document.getElementById('nickname').value.trim();
            const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
            
            if (!nickname || !roomCode) {
                this.showNotification('Please enter both nickname and room code');
                return;
            }
            
            if (!window.db) {
                this.showNotification('Database connection not available');
                return;
            }
            
            // Check if the room exists
            const roomExists = await this.checkRoomExists(roomCode);
            
            if (!roomExists) {
                this.showNotification('Room not found. Please check the room code.');
                return;
            }
            
            // Get room reference
            const roomRef = window.db.collection('rooms').doc(roomCode);
            
            // Add player to the room
            await roomRef.update({
                players: firebase.firestore.FieldValue.arrayUnion({
                    nickname: nickname,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
            });
            
            this.showNotification(`Joined room ${roomCode} as ${nickname}`);
        } catch (error) {
            console.error('Error joining room:', error);
            
            // More specific error handling
            if (error.code === 'permission-denied') {
                this.showNotification('You do not have permission to join this room.');
            } else if (error.code === 'unavailable') {
                this.showNotification('Cannot join room. Network is unavailable.');
            } else {
                this.showNotification(`Error joining room: ${error.message}`);
            }
        }
    }

    showNotification(message) {
        console.log('NOTIFICATION:', message);
        
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    init() {
        console.log('Initializing StreamBingo app...');
        
        // Check if user is logged in
        if (this.auth && this.auth.isLoggedIn()) {
            console.log('User is logged in, showing dashboard');
            this.showDashboard();
        } else {
            console.log('User is not logged in, showing login screen');
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        // Your existing login screen implementation
        this.app.innerHTML = `
            <div class="container">
                <h1 class="title">Stream Bingo</h1>
                <p class="subtitle">Create and play bingo during streams!</p>
                
                <div class="login-box">
                    <button id="twitchLogin" class="btn btn-twitch">
                        Login with Twitch
                    </button>
                    
                    <div class="separator">
                        <span>or</span>
                    </div>
                    
                    <div class="form-group">
                        <input type="text" id="testUsername" class="form-control" placeholder="Enter test username">
                    </div>
                    
                    <button id="testLogin" class="btn btn-secondary">
                        Login for Testing
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('twitchLogin').addEventListener('click', () => {
            if (this.auth) {
                this.auth.loginWithTwitch();
            }
        });

        document.getElementById('testLogin').addEventListener('click', () => {
            const username = document.getElementById('testUsername').value.trim();
            if (username) {
                if (this.auth) this.auth.loginWithTestAccount(username);
            }
        });
    }

    showDashboard() {
        // Your existing dashboard implementation
        this.app.innerHTML = `
            <div class="container">
                <h1 class="title">Stream Bingo Dashboard</h1>
                
                <div class="dashboard-options">
                    <div class="option-card">
                        <h2>Create Room</h2>
                        <button id="createRoomBtn" class="btn btn-primary">Create Room</button>
                    </div>
                    
                    <div class="option-card">
                        <h2>Join Room</h2>
                        <button id="joinRoomBtn" class="btn btn-primary">Join Room</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('createRoomBtn').addEventListener('click', () => this.showCreateRoomScreen());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showJoinRoomScreen());
    }

    showCreateRoomScreen() {
        this.app.innerHTML = `
            <div class="container">
                <h1 class="title">Create Room</h1>
                
                <div class="room-form">
                    <div class="form-group">
                        <label for="nickname">Your Nickname</label>
                        <input type="text" id="nickname" class="form-control" placeholder="Enter your nickname">
                    </div>
                    
                    <div class="form-group">
                        <label for="roomCode">Room Code</label>
                        <input type="text" id="roomCode" class="form-control" placeholder="Enter a room code">
                    </div>
                    
                    <div class="form-group">
                        <label for="gridSize">Grid Size</label>
                        <select id="gridSize" class="form-control">
                            <option value="3">3x3</option>
                            <option value="4">4x4</option>
                            <option value="5">5x5</option>
                        </select>
                    </div>
                    
                    <button id="createRoomSubmit" class="btn btn-primary">Create Room</button>
                    <button id="backToDashboard" class="btn btn-secondary">Back to Dashboard</button>
                </div>
            </div>
        `;

        document.getElementById('createRoomSubmit').addEventListener('click', () => this.createRoom());
        document.getElementById('backToDashboard').addEventListener('click', () => this.showDashboard());
    }

    showJoinRoomScreen() {
        this.app.innerHTML = `
            <div class="container">
                <h1 class="title">Join Room</h1>
                
                <div class="room-form">
                    <div class="form-group">
                        <label for="nickname">Your Nickname</label>
                        <input type="text" id="nickname" class="form-control" placeholder="Enter your nickname">
                    </div>
                    
                    <div class="form-group">
                        <label for="roomCode">Room Code</label>
                        <input type="text" id="roomCode" class="form-control" placeholder="Enter the room code">
                    </div>
                    
                    <button id="joinRoomSubmit" class="btn btn-primary">Join Room</button>
                    <button id="backToDashboard" class="btn btn-secondary">Back to Dashboard</button>
                </div>
            </div>
        `;

        document.getElementById('joinRoomSubmit').addEventListener('click', () => this.handleJoinRoom());
        document.getElementById('backToDashboard').addEventListener('click', () => this.showDashboard());
    }
}

// Initialize the app when the script loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new StreamBingo();
    window.streamBingo = app;
    app.init();
});
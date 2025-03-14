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
                players: [{
                    nickname: nickname,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                }] // Initialize with creator
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
            
            // Add player to the room using atomic update
            await roomRef.update({
                players: firebase.firestore.FieldValue.arrayUnion({
                    nickname: nickname,
                    joinedAt: new Date() // Use standard Date instead of serverTimestamp()
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
        this.app.innerHTML = `
        <div class="container">
            <h1 class="title">Stream Bingo</h1>
            <p class="subtitle">Create and play bingo during streams!</p>
            
            <div class="login-box">
                <button id="twitchLogin" class="btn btn-twitch">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                        <path d="M11.6461 4.50039H13.9461V9.10039H11.6461V4.50039Z" fill="white"/>
                        <path d="M7.54614 4.50039H9.84614V9.10039H7.54614V4.50039Z" fill="white"/>
                        <path d="M4.09238 1.20001L2.09238 5.20001V18.8H6.89238V22H9.69238L12.8924 18.8H16.9924L21.8924 13.9V1.20001H4.09238ZM19.9924 13L16.6924 16.3H11.6924L8.59238 19.4V16.3H4.49238V3.20001H19.9924V13Z" fill="white"/>
                    </svg>
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
            
            <div id="loginStatus" style="margin-top: 20px; color: #ccc;"></div>
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
        this.app.innerHTML = `
        <div class="container">
            <h1 class="title">Stream Bingo</h1>
            
            <div class="dashboard-options">
                <div class="option-card">
                    <h2>Create Room</h2>
                    <p>Create a new bingo room for your stream</p>
                    <button id="createRoomBtn" class="btn btn-primary">Create Room</button>
                </div>
                
                <div class="option-card">
                    <h2>Join Room</h2>
                    <p>Join an existing bingo room</p>
                    <button id="joinRoomBtn" class="btn btn-primary">Join Room</button>
                </div>
                
                <div class="option-card">
                    <h2>My Bingo Lists</h2>
                    <p>Manage your saved bingo word lists</p>
                    <button id="bingoListsBtn" class="btn btn-primary">Manage Lists</button>
                </div>
            </div>
        </div>
    `;

        // Add event listeners
        document.getElementById('createRoomBtn').addEventListener('click', () => this.showCreateRoomScreen());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showJoinRoomScreen());
        document.getElementById('bingoListsBtn').addEventListener('click', () => this.showBingoListsScreen());
    }

    showCreateRoomScreen() {
        this.app.innerHTML = `
        <div class="container">
            <h1 class="title">Create Room</h1>
            
            <div class="join-screen">
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
                
                <div class="form-group">
                    <button id="create" class="btn btn-primary" style="width: 100%;">Create Room</button>
                </div>
                
                <div class="form-group" style="margin-bottom: 0;">
                    <button id="back" class="btn btn-secondary" style="width: 100%;">Back</button>
                </div>
            </div>
        </div>
    `;

        document.getElementById('back').addEventListener('click', () => this.showDashboard());
        document.getElementById('create').addEventListener('click', () => this.createRoom());
    }

    showJoinRoomScreen() {
        this.app.innerHTML = `
        <div class="container">
            <h1 class="title">Join Room</h1>
            
            <div class="join-screen">
                <div class="form-group">
                    <label for="nickname">Your Nickname</label>
                    <input type="text" id="nickname" class="form-control" placeholder="Enter your nickname">
                </div>
                
                <div class="form-group">
                    <label for="roomCode">Room Code</label>
                    <input type="text" id="roomCode" class="form-control" placeholder="Enter the room code">
                </div>
                
                <div class="form-group">
                    <button id="join" class="btn btn-primary" style="width: 100%;">Join Room</button>
                </div>
                
                <div class="form-group" style="margin-bottom: 0;">
                    <button id="back" class="btn btn-secondary" style="width: 100%;">Back</button>
                </div>
            </div>
        </div>
    `;

        document.getElementById('back').addEventListener('click', () => this.showDashboard());
        document.getElementById('join').addEventListener('click', () => this.handleJoinRoom());
    }

    showBingoListsScreen() {
        this.showNotification('Bingo lists management coming soon!');
    }
}

// Initialize the app when the script loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new StreamBingo();
    window.streamBingo = app;
    app.init();
});
// Stream Bingo App
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, initializing app...');
    try {
        // Show loading state
        document.getElementById('app').innerHTML = `
            <div style="text-align: center; margin-top: 100px;">
                <h2>Loading Stream Bingo...</h2>
                <p>Please wait while the application initializes.</p>
            </div>
        `;
        
        // Check for hash in URL (this might be a Twitch redirect)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
            console.log('Found access token in URL hash, likely a Twitch redirect');
        }
        
        const app = new StreamBingo();
        window.streamBingo = app;
        
        // Small delay to ensure Firebase and auth managers are initialized
        setTimeout(() => {
            try {
                app.init();
                
                // Check if we need to show the dashboard after auth callback
                if (window.showDashboardAfterLoad) {
                    console.log('Showing dashboard after auth callback');
                    app.showDashboard();
                    window.showDashboardAfterLoad = false;
                }
            } catch (err) {
                console.error('Error during app initialization:', err);
                document.getElementById('app').innerHTML = `
                    <div style="text-align: center; margin-top: 100px;">
                        <h2>Initialization Error</h2>
                        <p>There was a problem loading the application.</p>
                        <p style="color: #ff6b6b;">Error: ${err.message || 'Unknown error'}</p>
                        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 20px;">Reload App</button>
                    </div>
                `;
            }
        }, 100);
    } catch (err) {
        console.error('Critical error during app startup:', err);
        document.getElementById('app').innerHTML = `
            <div style="text-align: center; margin-top: 100px;">
                <h2>Application Error</h2>
                <p>There was a critical problem starting the application.</p>
                <p style="color: #ff6b6b;">Error: ${err.message || 'Unknown error'}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #ff4081; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">Reload App</button>
            </div>
        `;
    }
});



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
        
        if (!this.auth) {
            console.error('Auth manager not initialized! This might cause login issues.');
        }
    }

    init() {
        console.log('Initializing StreamBingo app...');
        console.log('Auth manager available:', !!this.auth);
        
        if (this.auth) {
            console.log('User logged in:', this.auth.isLoggedIn());
        }
        
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
        console.log('Displaying login screen');
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

        // Add styles for new elements
        const style = document.createElement('style');
        style.textContent = `
        .login-box {
            background-color: #1E1E1E;
            border-radius: 12px;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        .btn-twitch {
            background-color: #9146FF;
            color: white;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
        }
        
        .btn-twitch:hover {
            background-color: #7D2DF8;
        }
        
        .separator {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 1.5rem 0;
            color: #888;
        }
        
        .separator::before,
        .separator::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #444;
        }
        
        .separator span {
            padding: 0 10px;
        }
    `;
        document.head.appendChild(style);

        // Add event listeners
        document.getElementById('twitchLogin').addEventListener('click', () => {
            if (this.auth) {
                document.getElementById('loginStatus').textContent = 'Redirecting to Twitch for authentication...';
                this.auth.loginWithTwitch();
            } else {
                this.showNotification('Authentication service not available');
                document.getElementById('loginStatus').textContent = 'Error: Authentication service not available';
            }
        });

        document.getElementById('testLogin').addEventListener('click', () => {
            const username = document.getElementById('testUsername').value.trim();
            if (username) {
                if (this.auth) this.auth.loginWithTestAccount(username);
                this.showDashboard();
            } else {
                this.showNotification('Please enter a username');
            }
        });
    }

    showDashboard() {
        console.log('Showing dashboard...');
        const username = this.auth ? this.auth.getUsername() : 'User';
        const profileImage = this.auth && this.auth.getProfileImage();
        
        console.log('Username:', username);
        console.log('Profile image:', profileImage);

        this.app.innerHTML = `
        <div class="container">
            <header class="dashboard-header">
                <h1 class="title">Stream Bingo</h1>
                
                <div class="user-profile">
                    ${profileImage ? `<img src="${profileImage}" alt="${username}" class="profile-image">` : ''}
                    <span class="username">${username}</span>
                    <button id="logoutBtn" class="btn btn-small">Logout</button>
                </div>
            </header>
            
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

        // Add styles for dashboard
        const style = document.createElement('style');
        style.textContent = `
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        
        .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .profile-image {
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }
        
        .username {
            font-weight: 500;
            color: #FFF;
        }
        
        .btn-small {
            padding: 6px 12px;
            font-size: 0.85rem;
        }
        
        .dashboard-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        
        .option-card {
            background-color: #1E1E1E;
            border-radius: 12px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        
        .option-card h2 {
            margin-bottom: 0.75rem;
            color: #FF4081;
        }
        
        .option-card p {
            color: #B0BEC5;
            margin-bottom: 1.5rem;
            flex-grow: 1;
        }
    `;
        document.head.appendChild(style);

        // Add event listeners
        document.getElementById('createRoomBtn').addEventListener('click', () => this.showCreateRoomScreen());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showJoinRoomScreen());
        document.getElementById('bingoListsBtn').addEventListener('click', () => this.showBingoListsScreen());
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (this.auth) this.auth.logout();
            this.showLoginScreen();
        });
        
        console.log('Dashboard displayed successfully');
    }

// The rest of the class remains the same as it's working fine
// Add a new screen for managing bingo lists
    showBingoListsScreen() {
        // We'll add this part next if you like this approach
    }

    async checkRoomExists(roomCode) {
        try {
            const roomDoc = await db.collection('rooms').doc(roomCode).get();
            return roomDoc.exists;
        } catch (error) {
            console.error('Error checking room:', error);
            return false;
        }
    }

    showWelcomeScreen() {
        this.app.innerHTML = `
            <div class="container">
                <h1 class="title">Stream Bingo</h1>
                <p class="subtitle">Play bingo with your favorite streamers</p>
                
                <div class="join-screen">
                    <div class="form-group">
                        <button id="createRoom" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">Create a Room</button>
                        <button id="joinRoom" class="btn btn-secondary" style="width: 100%;">Join a Room</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('createRoom').addEventListener('click', () => this.showCreateRoomScreen());
        document.getElementById('joinRoom').addEventListener('click', () => this.showJoinRoomScreen());
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

        document.getElementById('back').addEventListener('click', () => this.showWelcomeScreen());
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

        document.getElementById('back').addEventListener('click', () => this.showWelcomeScreen());
        document.getElementById('join').addEventListener('click', () => this.joinRoom());
    }

    // Rest of methods would go here, keeping the existing implementation
    
    showNotification(message) {
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
            notification.remove();
        }, 3000);
    }
}

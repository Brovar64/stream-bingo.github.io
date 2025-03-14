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
                
                <div class="card">
                    <h2>Create a Bingo Room (Admin)</h2>
                    <div class="form-group">
                        <label for="roomCode">Room Code:</label>
                        <input type="text" id="roomCode" class="form-control" placeholder="Enter room code (4-6 chars)" maxlength="6">
                    </div>
                    <div class="form-group">
                        <label for="gridSize">Grid Size:</label>
                        <select id="gridSize" class="form-control">
                            <option value="3">3x3</option>
                            <option value="4">4x4</option>
                            <option value="5" selected>5x5</option>
                        </select>
                    </div>
                    <button id="createRoomBtn" class="btn btn-primary">Create Room</button>
                </div>
                
                <div class="card">
                    <h2>Join Existing Room (Player)</h2>
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
                    <h2>Your Created Rooms</h2>
                    <div id="userRoomsList" class="player-list">
                        <p>Loading your rooms...</p>
                    </div>
                </div>
                
                <button id="logoutBtn" class="btn btn-secondary">Logout</button>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
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
                const playerCount = room.players ? room.players.length : 0;
                roomsHTML += `
                    <div class="player-item">
                        <div class="player-info">
                            <span>Room: ${roomId}</span>
                            <span>${room.gridSize}x${room.gridSize}</span>
                            <span>Players: ${playerCount}</span>
                        </div>
                        <div>
                            <button class="enter-room btn-primary" data-room-id="${roomId}">Manage</button>
                            <button class="delete-player" data-room-id="${roomId}">×</button>
                        </div>
                    </div>
                `;
            });
            
            roomsList.innerHTML = roomsHTML;
            
            // Add event listeners for buttons
            document.querySelectorAll('.delete-player').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roomId = e.target.getAttribute('data-room-id');
                    this.deleteRoom(roomId);
                });
            });
            
            document.querySelectorAll('.enter-room').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roomId = e.target.getAttribute('data-room-id');
                    this.loadAdminRoom(roomId);
                });
            });
        } catch (error) {
            console.error('Error loading rooms:', error);
            document.getElementById('userRoomsList').innerHTML = `
                <p class="error">Failed to load your rooms: ${error.message}</p>
            `;
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
            
            // Delete room
            await roomRef.delete();
            this.showNotification(`Room ${roomId} deleted successfully.`, 'success');
            this.loadUserRooms(); // Refresh the list
        } catch (error) {
            console.error('Error deleting room:', error);
            this.showNotification(`Error deleting room: ${error.message}`, 'error');
        }
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
            const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
            const gridSize = parseInt(document.getElementById('gridSize').value);
            
            if (!roomCode) {
                this.showNotification('Please enter a room code');
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
                active: true,
                status: 'setup', // Room starts in setup mode before admin adds words
                players: [],
                words: [], // Will be populated by admin later
                pendingApprovals: [] // For tracking player marks that need admin approval
            };
            
            // Create room
            await roomRef.set(roomData);
            
            this.showNotification(`Created room ${roomCode} with grid size ${gridSize}x${gridSize}`, 'success');
            
            // Load admin interface for setting up the room
            this.loadAdminRoom(roomCode);
        } catch (error) {
            console.error('Error creating room:', error);
            this.showNotification(`Error creating room: ${error.message}`, 'error');
        }
    }
    
    async loadAdminRoom(roomId) {
        try {
            // Get room data
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                this.showNotification('Room not found', 'error');
                return;
            }
            
            const roomData = roomDoc.data();
            const gridSize = roomData.gridSize;
            const words = roomData.words || [];
            const players = roomData.players || [];
            const pendingApprovals = roomData.pendingApprovals || [];
            
            // Create admin interface
            const appDiv = document.getElementById('app');
            appDiv.innerHTML = `
                <div class="container">
                    <div class="title">Admin Panel - Room ${roomId}</div>
                    <p class="subtitle">Grid Size: ${gridSize}x${gridSize}</p>
                    
                    <div class="admin-panel">
                        <div class="admin-sidebar">
                            <div class="card">
                                <h2>Room Status</h2>
                                <p>Current status: <strong>${roomData.status}</strong></p>
                                <p>Room code: <strong>${roomId}</strong> (Share this with players)</p>
                                <p>Players: <strong>${players.length}</strong></p>
                                <button id="startGameBtn" class="btn btn-primary" ${words.length < gridSize * gridSize ? 'disabled' : ''}>
                                    Start Game
                                </button>
                                <button id="backToDashboardBtn" class="btn btn-secondary">Back to Dashboard</button>
                            </div>
                            
                            <div class="card">
                                <h2>Players</h2>
                                <div id="playersList" class="player-list">
                                    ${players.length === 0 ? '<p>No players have joined yet.</p>' : ''}
                                    ${players.map(player => `
                                        <div class="player-item">
                                            <span>${player.nickname}</span>
                                            <button class="view-player-grid" data-player="${player.nickname}">View Grid</button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="admin-main">
                            <div class="card">
                                <h2>Bingo Word List</h2>
                                <p>Add at least ${gridSize * gridSize} words for your bingo grid.</p>
                                <div class="form-group">
                                    <input type="text" id="newWord" class="form-control" placeholder="Enter a word or phrase">
                                    <button id="addWordBtn" class="btn btn-primary">Add Word</button>
                                </div>
                                <div id="wordList" class="bingo-words-grid">
                                    ${words.length === 0 ? '<p>No words added yet.</p>' : ''}
                                    ${words.map((word, index) => `
                                        <div class="bingo-word">
                                            <span>${word}</span>
                                            <button class="delete-word" data-index="${index}">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="card">
                                <h2>Pending Approvals</h2>
                                <div id="pendingApprovalsList">
                                    ${pendingApprovals.length === 0 ? '<p>No pending approvals.</p>' : ''}
                                    ${pendingApprovals.map((approval, index) => `
                                        <div class="approval-item">
                                            <p>${approval.playerName} marked "${approval.word}"</p>
                                            <div>
                                                <button class="approve-mark" data-index="${index}">Approve</button>
                                                <button class="reject-mark" data-index="${index}">Reject</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('backToDashboardBtn').addEventListener('click', () => this.loadDashboard());
            document.getElementById('addWordBtn').addEventListener('click', () => this.addWordToRoom(roomId));
            document.getElementById('startGameBtn').addEventListener('click', () => this.startGame(roomId));
            
            // Add event listeners to delete word buttons
            document.querySelectorAll('.delete-word').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.deleteWordFromRoom(roomId, index);
                });
            });
            
            // Add event listeners to view player grid buttons
            document.querySelectorAll('.view-player-grid').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const playerName = e.target.getAttribute('data-player');
                    this.viewPlayerGrid(roomId, playerName);
                });
            });
            
            // Add event listeners to approval buttons
            document.querySelectorAll('.approve-mark').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.approvePlayerMark(roomId, index);
                });
            });
            
            document.querySelectorAll('.reject-mark').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.rejectPlayerMark(roomId, index);
                });
            });
            
            // Set up real-time listener for players joining and approvals
            this.setupRoomListener(roomId);
        } catch (error) {
            console.error('Error loading admin room:', error);
            this.showNotification(`Error loading admin room: ${error.message}`, 'error');
        }
    }
    
    setupRoomListener(roomId) {
        const roomRef = window.db.collection('rooms').doc(roomId);
        
        // Unsubscribe from previous listener if exists
        if (this.roomListener) {
            this.roomListener();
        }
        
        // Set up new listener
        this.roomListener = roomRef.onSnapshot(doc => {
            if (doc.exists) {
                const roomData = doc.data();
                
                // Update players list
                const playersList = document.getElementById('playersList');
                if (playersList) {
                    const players = roomData.players || [];
                    if (players.length === 0) {
                        playersList.innerHTML = '<p>No players have joined yet.</p>';
                    } else {
                        playersList.innerHTML = players.map(player => `
                            <div class="player-item">
                                <span>${player.nickname}</span>
                                <button class="view-player-grid" data-player="${player.nickname}">View Grid</button>
                            </div>
                        `).join('');
                        
                        // Re-add event listeners
                        document.querySelectorAll('.view-player-grid').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const playerName = e.target.getAttribute('data-player');
                                this.viewPlayerGrid(roomId, playerName);
                            });
                        });
                    }
                }
                
                // Update pending approvals list
                const pendingApprovalsList = document.getElementById('pendingApprovalsList');
                if (pendingApprovalsList) {
                    const pendingApprovals = roomData.pendingApprovals || [];
                    if (pendingApprovals.length === 0) {
                        pendingApprovalsList.innerHTML = '<p>No pending approvals.</p>';
                    } else {
                        pendingApprovalsList.innerHTML = pendingApprovals.map((approval, index) => `
                            <div class="approval-item">
                                <p>${approval.playerName} marked "${approval.word}"</p>
                                <div>
                                    <button class="approve-mark" data-index="${index}">Approve</button>
                                    <button class="reject-mark" data-index="${index}">Reject</button>
                                </div>
                            </div>
                        `).join('');
                        
                        // Re-add event listeners
                        document.querySelectorAll('.approve-mark').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const index = parseInt(e.target.getAttribute('data-index'));
                                this.approvePlayerMark(roomId, index);
                            });
                        });
                        
                        document.querySelectorAll('.reject-mark').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const index = parseInt(e.target.getAttribute('data-index'));
                                this.rejectPlayerMark(roomId, index);
                            });
                        });
                    }
                }
            }
        }, error => {
            console.error('Error in room listener:', error);
        });
    }
    
    async addWordToRoom(roomId) {
        try {
            const newWordInput = document.getElementById('newWord');
            const word = newWordInput.value.trim();
            
            if (!word) {
                this.showNotification('Please enter a word or phrase', 'error');
                return;
            }
            
            const roomRef = window.db.collection('rooms').doc(roomId);
            
            // Add word to the words array
            await roomRef.update({
                words: firebase.firestore.FieldValue.arrayUnion(word)
            });
            
            // Clear input
            newWordInput.value = '';
            this.showNotification(`Added "${word}" to the word list`, 'success');
            
            // Refresh word list
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            const words = roomData.words || [];
            const gridSize = roomData.gridSize;
            
            const wordList = document.getElementById('wordList');
            wordList.innerHTML = words.map((w, index) => `
                <div class="bingo-word">
                    <span>${w}</span>
                    <button class="delete-word" data-index="${index}">×</button>
                </div>
            `).join('');
            
            // Re-add event listeners
            document.querySelectorAll('.delete-word').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.deleteWordFromRoom(roomId, index);
                });
            });
            
            // Update Start Game button state
            const startGameBtn = document.getElementById('startGameBtn');
            if (startGameBtn) {
                startGameBtn.disabled = words.length < gridSize * gridSize;
            }
        } catch (error) {
            console.error('Error adding word:', error);
            this.showNotification(`Error adding word: ${error.message}`, 'error');
        }
    }
    
    async deleteWordFromRoom(roomId, index) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            const words = [...(roomData.words || [])];
            
            if (index >= 0 && index < words.length) {
                const wordToRemove = words[index];
                words.splice(index, 1);
                
                await roomRef.update({ words });
                this.showNotification(`Removed "${wordToRemove}" from the word list`, 'success');
                
                // Refresh word list
                const wordList = document.getElementById('wordList');
                if (words.length === 0) {
                    wordList.innerHTML = '<p>No words added yet.</p>';
                } else {
                    wordList.innerHTML = words.map((word, idx) => `
                        <div class="bingo-word">
                            <span>${word}</span>
                            <button class="delete-word" data-index="${idx}">×</button>
                        </div>
                    `).join('');
                    
                    // Re-add event listeners
                    document.querySelectorAll('.delete-word').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const idx = parseInt(e.target.getAttribute('data-index'));
                            this.deleteWordFromRoom(roomId, idx);
                        });
                    });
                }
                
                // Update Start Game button state
                const startGameBtn = document.getElementById('startGameBtn');
                if (startGameBtn) {
                    startGameBtn.disabled = words.length < roomData.gridSize * roomData.gridSize;
                }
            }
        } catch (error) {
            console.error('Error deleting word:', error);
            this.showNotification(`Error deleting word: ${error.message}`, 'error');
        }
    }
    
    async startGame(roomId) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            if (roomData.status === 'active') {
                this.showNotification('Game is already started', 'error');
                return;
            }
            
            if ((roomData.words || []).length < roomData.gridSize * roomData.gridSize) {
                this.showNotification(`Need at least ${roomData.gridSize * roomData.gridSize} words to start the game`, 'error');
                return;
            }
            
            // Update room status to active
            await roomRef.update({
                status: 'active',
                startedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showNotification('Game started successfully!', 'success');
            
            // Assign random words to each player's grid
            await this.assignPlayerGrids(roomId);
            
            // Refresh admin view
            this.loadAdminRoom(roomId);
        } catch (error) {
            console.error('Error starting game:', error);
            this.showNotification(`Error starting game: ${error.message}`, 'error');
        }
    }
    
    async assignPlayerGrids(roomId) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            const gridSize = roomData.gridSize;
            const totalCells = gridSize * gridSize;
            const words = roomData.words || [];
            const players = roomData.players || [];
            
            if (words.length < totalCells) {
                this.showNotification(`Not enough words for the grid size (${totalCells} needed)`, 'error');
                return;
            }
            
            // Create player grids
            const playerGrids = {};
            
            for (const player of players) {
                // Shuffle words and pick the first gridSize*gridSize words
                const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, totalCells);
                
                // Create grid
                const grid = [];
                for (let i = 0; i < gridSize; i++) {
                    const row = [];
                    for (let j = 0; j < gridSize; j++) {
                        const index = i * gridSize + j;
                        row.push({
                            word: shuffledWords[index],
                            marked: false,
                            approved: false
                        });
                    }
                    grid.push(row);
                }
                
                // Add free space in the middle for odd-sized grids
                if (gridSize % 2 === 1) {
                    const middleRow = Math.floor(gridSize / 2);
                    const middleCol = Math.floor(gridSize / 2);
                    grid[middleRow][middleCol] = {
                        word: "FREE",
                        marked: true,
                        approved: true
                    };
                }
                
                playerGrids[player.nickname] = grid;
            }
            
            // Update room with player grids
            await roomRef.update({ playerGrids });
            this.showNotification('Assigned bingo grids to all players', 'success');
        } catch (error) {
            console.error('Error assigning player grids:', error);
            this.showNotification(`Error assigning player grids: ${error.message}`, 'error');
        }
    }
    
    async viewPlayerGrid(roomId, playerName) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            if (!roomData.playerGrids || !roomData.playerGrids[playerName]) {
                this.showNotification(`No grid found for player ${playerName}`, 'error');
                return;
            }
            
            const grid = roomData.playerGrids[playerName];
            const gridSize = roomData.gridSize;
            
            // Create modal for grid view
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${playerName}'s Bingo Grid</h2>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="bingo-grid grid-${gridSize}">
                            ${grid.map(row => row.map(cell => `
                                <div class="bingo-cell ${cell.marked ? 'marked' : ''} ${cell.approved ? 'approved' : (cell.marked ? 'pending' : '')}">
                                    ${cell.word}
                                </div>
                            `).join('')).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add close button event
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error viewing player grid:', error);
            this.showNotification(`Error viewing player grid: ${error.message}`, 'error');
        }
    }
    
    async approvePlayerMark(roomId, approvalIndex) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            const pendingApprovals = [...(roomData.pendingApprovals || [])];
            if (approvalIndex < 0 || approvalIndex >= pendingApprovals.length) {
                this.showNotification('Invalid approval index', 'error');
                return;
            }
            
            const approval = pendingApprovals[approvalIndex];
            const { playerName, row, col } = approval;
            
            // Update player grid
            if (roomData.playerGrids && roomData.playerGrids[playerName]) {
                const playerGrid = roomData.playerGrids[playerName];
                if (playerGrid[row] && playerGrid[row][col]) {
                    playerGrid[row][col].approved = true;
                    
                    // Update the playerGrids and remove the approval
                    const updatedPlayerGrids = { ...roomData.playerGrids };
                    pendingApprovals.splice(approvalIndex, 1);
                    
                    await roomRef.update({
                        playerGrids: updatedPlayerGrids,
                        pendingApprovals
                    });
                    
                    this.showNotification(`Approved ${playerName}'s mark`, 'success');
                    
                    // Check if player has achieved bingo
                    const hasBingo = this.checkForBingo(playerGrid, roomData.gridSize);
                    if (hasBingo) {
                        this.showNotification(`${playerName} has BINGO!`, 'success');
                        
                        // Update room with bingo winner
                        await roomRef.update({
                            bingoWinners: firebase.firestore.FieldValue.arrayUnion(playerName)
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error approving mark:', error);
            this.showNotification(`Error approving mark: ${error.message}`, 'error');
        }
    }
    
    async rejectPlayerMark(roomId, approvalIndex) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            const pendingApprovals = [...(roomData.pendingApprovals || [])];
            if (approvalIndex < 0 || approvalIndex >= pendingApprovals.length) {
                this.showNotification('Invalid approval index', 'error');
                return;
            }
            
            const approval = pendingApprovals[approvalIndex];
            const { playerName, row, col } = approval;
            
            // Update player grid
            if (roomData.playerGrids && roomData.playerGrids[playerName]) {
                const playerGrid = roomData.playerGrids[playerName];
                if (playerGrid[row] && playerGrid[row][col]) {
                    playerGrid[row][col].marked = false;
                    playerGrid[row][col].approved = false;
                    
                    // Update the playerGrids and remove the approval
                    const updatedPlayerGrids = { ...roomData.playerGrids };
                    pendingApprovals.splice(approvalIndex, 1);
                    
                    await roomRef.update({
                        playerGrids: updatedPlayerGrids,
                        pendingApprovals
                    });
                    
                    this.showNotification(`Rejected ${playerName}'s mark`, 'success');
                }
            }
        } catch (error) {
            console.error('Error rejecting mark:', error);
            this.showNotification(`Error rejecting mark: ${error.message}`, 'error');
        }
    }
    
    checkForBingo(grid, gridSize) {
        // Check rows
        for (let i = 0; i < gridSize; i++) {
            let rowBingo = true;
            for (let j = 0; j < gridSize; j++) {
                if (!grid[i][j].marked || !grid[i][j].approved) {
                    rowBingo = false;
                    break;
                }
            }
            if (rowBingo) return true;
        }
        
        // Check columns
        for (let j = 0; j < gridSize; j++) {
            let colBingo = true;
            for (let i = 0; i < gridSize; i++) {
                if (!grid[i][j].marked || !grid[i][j].approved) {
                    colBingo = false;
                    break;
                }
            }
            if (colBingo) return true;
        }
        
        // Check diagonal (top-left to bottom-right)
        let diag1Bingo = true;
        for (let i = 0; i < gridSize; i++) {
            if (!grid[i][i].marked || !grid[i][i].approved) {
                diag1Bingo = false;
                break;
            }
        }
        if (diag1Bingo) return true;
        
        // Check diagonal (top-right to bottom-left)
        let diag2Bingo = true;
        for (let i = 0; i < gridSize; i++) {
            if (!grid[i][gridSize - 1 - i].marked || !grid[i][gridSize - 1 - i].approved) {
                diag2Bingo = false;
                break;
            }
        }
        return diag2Bingo;
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
            
            // Check if nickname is already taken in this room
            const existingPlayer = (roomData.players || []).find(p => p.nickname === nickname);
            if (existingPlayer) {
                // If player already exists, just load the player view
                this.loadPlayerRoom(roomCode, nickname);
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
            
            // Load player view
            this.loadPlayerRoom(roomCode, nickname);
        } catch (error) {
            console.error('Error joining room:', error);
            this.showNotification(`Error joining room: ${error.message}`, 'error');
        }
    }
    
    async loadPlayerRoom(roomId, playerName) {
        try {
            // Get room data
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                this.showNotification('Room not found', 'error');
                return;
            }
            
            const roomData = roomDoc.data();
            const gridSize = roomData.gridSize;
            
            // Check if game has started
            if (roomData.status !== 'active') {
                // Show waiting screen
                const appDiv = document.getElementById('app');
                appDiv.innerHTML = `
                    <div class="container">
                        <div class="title">Stream Bingo - Room ${roomId}</div>
                        <p class="subtitle">Playing as: ${playerName}</p>
                        
                        <div class="card">
                            <h2>Waiting for Game to Start</h2>
                            <p>The admin is still setting up the game. Please wait.</p>
                            <p>Room Status: ${roomData.status}</p>
                            <button id="backToDashboardBtn" class="btn btn-secondary">Back to Dashboard</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('backToDashboardBtn').addEventListener('click', () => this.loadDashboard());
                
                // Set up real-time listener for game status
                this.setupPlayerWaitingListener(roomId, playerName);
                return;
            }
            
            // If game is active, show player's bingo grid
            const playerGrid = roomData.playerGrids && roomData.playerGrids[playerName];
            
            if (!playerGrid) {
                this.showNotification('Your bingo grid is not ready yet', 'error');
                return;
            }
            
            // Create player interface
            const appDiv = document.getElementById('app');
            appDiv.innerHTML = `
                <div class="container">
                    <div class="title">Stream Bingo - Room ${roomId}</div>
                    <p class="subtitle">Playing as: ${playerName}</p>
                    
                    <div class="bingo-grid grid-${gridSize}" id="playerBingoGrid">
                        ${playerGrid.map((row, rowIndex) => row.map((cell, colIndex) => `
                            <div class="bingo-cell ${cell.marked ? 'marked' : ''} ${cell.approved ? 'approved' : (cell.marked ? 'pending' : '')}" 
                                 data-row="${rowIndex}" data-col="${colIndex}">
                                ${cell.word}
                            </div>
                        `).join('')).join('')}
                    </div>
                    
                    <div class="card">
                        <h2>Game Info</h2>
                        <p>Click on a cell to mark it when the streamer mentions that word.</p>
                        <p>The admin will need to approve your marks.</p>
                        <button id="backToDashboardBtn" class="btn btn-secondary">Back to Dashboard</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('backToDashboardBtn').addEventListener('click', () => this.loadDashboard());
            
            // Add event listeners to the bingo cells
            document.querySelectorAll('.bingo-cell').forEach(cell => {
                cell.addEventListener('click', (e) => {
                    const row = parseInt(e.target.getAttribute('data-row'));
                    const col = parseInt(e.target.getAttribute('data-col'));
                    
                    // Don't allow clicking on already marked or approved cells
                    if (!playerGrid[row][col].marked && !playerGrid[row][col].approved) {
                        this.markPlayerCell(roomId, playerName, row, col);
                    }
                });
            });
            
            // Set up real-time listener for grid updates
            this.setupPlayerGridListener(roomId, playerName);
        } catch (error) {
            console.error('Error loading player room:', error);
            this.showNotification(`Error loading player room: ${error.message}`, 'error');
        }
    }
    
    setupPlayerWaitingListener(roomId, playerName) {
        const roomRef = window.db.collection('rooms').doc(roomId);
        
        // Unsubscribe from previous listener if exists
        if (this.playerListener) {
            this.playerListener();
        }
        
        // Set up new listener
        this.playerListener = roomRef.onSnapshot(doc => {
            if (doc.exists) {
                const roomData = doc.data();
                
                // If game has started, load player view
                if (roomData.status === 'active') {
                    this.showNotification('The game has started!', 'success');
                    this.loadPlayerRoom(roomId, playerName);
                }
            }
        }, error => {
            console.error('Error in player waiting listener:', error);
        });
    }
    
    setupPlayerGridListener(roomId, playerName) {
        const roomRef = window.db.collection('rooms').doc(roomId);
        
        // Unsubscribe from previous listener if exists
        if (this.playerListener) {
            this.playerListener();
        }
        
        // Set up new listener
        this.playerListener = roomRef.onSnapshot(doc => {
            if (doc.exists) {
                const roomData = doc.data();
                
                // Update player's grid if available
                if (roomData.playerGrids && roomData.playerGrids[playerName]) {
                    const playerGrid = roomData.playerGrids[playerName];
                    const gridSize = roomData.gridSize;
                    
                    const bingoGridElement = document.getElementById('playerBingoGrid');
                    if (bingoGridElement) {
                        bingoGridElement.innerHTML = playerGrid.map((row, rowIndex) => row.map((cell, colIndex) => `
                            <div class="bingo-cell ${cell.marked ? 'marked' : ''} ${cell.approved ? 'approved' : (cell.marked ? 'pending' : '')}" 
                                 data-row="${rowIndex}" data-col="${colIndex}">
                                ${cell.word}
                            </div>
                        `).join('')).join('');
                        
                        // Re-add event listeners
                        document.querySelectorAll('.bingo-cell').forEach(cell => {
                            cell.addEventListener('click', (e) => {
                                const row = parseInt(e.target.getAttribute('data-row'));
                                const col = parseInt(e.target.getAttribute('data-col'));
                                
                                // Don't allow clicking on already marked or approved cells
                                if (!playerGrid[row][col].marked && !playerGrid[row][col].approved) {
                                    this.markPlayerCell(roomId, playerName, row, col);
                                }
                            });
                        });
                    }
                    
                    // Check if player has won
                    if (roomData.bingoWinners && roomData.bingoWinners.includes(playerName)) {
                        this.showNotification('BINGO! You won!', 'success');
                    }
                }
            }
        }, error => {
            console.error('Error in player grid listener:', error);
        });
    }
    
    async markPlayerCell(roomId, playerName, row, col) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            if (!roomData.playerGrids || !roomData.playerGrids[playerName]) {
                this.showNotification('Your grid data is not available', 'error');
                return;
            }
            
            const playerGrid = roomData.playerGrids[playerName];
            if (!playerGrid[row] || !playerGrid[row][col]) {
                this.showNotification('Invalid cell coordinates', 'error');
                return;
            }
            
            // If cell is already marked or approved, do nothing
            if (playerGrid[row][col].marked || playerGrid[row][col].approved) {
                return;
            }
            
            // Mark the cell
            playerGrid[row][col].marked = true;
            
            // Update player grid
            const updatedPlayerGrids = { ...roomData.playerGrids };
            
            // Add to pending approvals
            const pendingApprovals = [...(roomData.pendingApprovals || [])];
            pendingApprovals.push({
                playerName,
                row,
                col,
                word: playerGrid[row][col].word,
                timestamp: new Date().toISOString()
            });
            
            // Update room
            await roomRef.update({
                playerGrids: updatedPlayerGrids,
                pendingApprovals
            });
            
            this.showNotification('Marked cell, waiting for admin approval', 'success');
        } catch (error) {
            console.error('Error marking cell:', error);
            this.showNotification(`Error marking cell: ${error.message}`, 'error');
        }
    }
}

// Initialize the application
window.streamBingo = new StreamBingo();

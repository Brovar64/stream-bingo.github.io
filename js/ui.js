// js/ui.js - User interface rendering and event handling

class UIController {
    constructor() {
        this.auth = window.authManager;
        this.adminController = window.adminController;
        this.playerController = window.playerController;
        
        this.currentView = null;
        this.currentRoomId = null;
        this.currentPlayerName = null;
        
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
        document.getElementById('createRoomBtn').addEventListener('click', () => this.handleCreateRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.handleJoinRoom());
        document.getElementById('logoutBtn').addEventListener('click', () => this.auth.logout());
        
        // Load user's rooms
        this.loadUserRooms();
        
        this.currentView = 'dashboard';
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
        
        this.currentView = 'login';
    }
    
    async loadUserRooms() {
        const rooms = await this.adminController.loadUserRooms();
        const roomsList = document.getElementById('userRoomsList');
        
        if (!rooms) {
            roomsList.innerHTML = `<p class="error">Failed to load rooms. Database connection error.</p>`;
            return;
        }
        
        if (rooms.length === 0) {
            roomsList.innerHTML = `<p>You haven't created any rooms yet.</p>`;
            return;
        }
        
        let roomsHTML = '';
        rooms.forEach(room => {
            const playerCount = room.players ? room.players.length : 0;
            roomsHTML += `
                <div class="player-item">
                    <div class="player-info">
                        <span>Room: ${room.id}</span>
                        <span>${room.gridSize}x${room.gridSize}</span>
                        <span>Players: ${playerCount}</span>
                    </div>
                    <div>
                        <button class="enter-room btn-primary" data-room-id="${room.id}">Manage</button>
                        <button class="delete-player" data-room-id="${room.id}">×</button>
                    </div>
                </div>
            `;
        });
        
        roomsList.innerHTML = roomsHTML;
        
        // Add event listeners for buttons
        document.querySelectorAll('.delete-player').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.getAttribute('data-room-id');
                if (confirm(`Are you sure you want to delete room ${roomId}?`)) {
                    this.handleDeleteRoom(roomId);
                }
            });
        });
        
        document.querySelectorAll('.enter-room').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.getAttribute('data-room-id');
                this.loadAdminRoom(roomId);
            });
        });
    }
    
    async handleCreateRoom() {
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        const gridSize = parseInt(document.getElementById('gridSize').value);
        
        const createdRoomId = await this.adminController.createRoom(roomCode, gridSize);
        if (createdRoomId) {
            this.loadAdminRoom(createdRoomId);
        }
    }
    
    async handleJoinRoom() {
        const nickname = document.getElementById('joinNickname').value.trim();
        const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
        
        const roomData = await this.playerController.joinRoom(nickname, roomCode);
        if (roomData) {
            this.loadPlayerRoom(roomCode, nickname, roomData);
        }
    }
    
    async handleDeleteRoom(roomId) {
        const success = await this.adminController.deleteRoom(roomId);
        if (success) {
            this.loadUserRooms();
        }
    }
    
    async loadAdminRoom(roomId) {
        const roomData = await this.adminController.loadAdminRoom(roomId);
        if (!roomData) {
            return;
        }
        
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
        document.getElementById('addWordBtn').addEventListener('click', () => this.handleAddWord(roomId));
        document.getElementById('startGameBtn').addEventListener('click', () => this.handleStartGame(roomId));
        
        // Add event listeners to delete word buttons
        document.querySelectorAll('.delete-word').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.handleDeleteWord(roomId, index);
            });
        });
        
        // Add event listeners to view player grid buttons
        document.querySelectorAll('.view-player-grid').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerName = e.target.getAttribute('data-player');
                this.viewPlayerGrid(roomId, playerName, roomData);
            });
        });
        
        // Add event listeners to approval buttons
        document.querySelectorAll('.approve-mark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.handleApprovePlayerMark(roomId, index);
            });
        });
        
        document.querySelectorAll('.reject-mark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.handleRejectPlayerMark(roomId, index);
            });
        });
        
        // Set up real-time listener for players joining and approvals
        this.adminController.setupRoomListener(roomId, (updatedRoomData) => {
            this.updateAdminRoomUI(roomId, updatedRoomData);
        });
        
        this.currentView = 'admin';
        this.currentRoomId = roomId;
    }
    
    updateAdminRoomUI(roomId, roomData) {
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
                        this.viewPlayerGrid(roomId, playerName, roomData);
                    });
                });
            }
        }
        
        // Update word list
        const wordList = document.getElementById('wordList');
        if (wordList) {
            const words = roomData.words || [];
            if (words.length === 0) {
                wordList.innerHTML = '<p>No words added yet.</p>';
            } else {
                wordList.innerHTML = words.map((word, index) => `
                    <div class="bingo-word">
                        <span>${word}</span>
                        <button class="delete-word" data-index="${index}">×</button>
                    </div>
                `).join('');
                
                // Re-add event listeners
                document.querySelectorAll('.delete-word').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = parseInt(e.target.getAttribute('data-index'));
                        this.handleDeleteWord(roomId, index);
                    });
                });
                
                // Update Start Game button state
                const startGameBtn = document.getElementById('startGameBtn');
                if (startGameBtn) {
                    startGameBtn.disabled = words.length < roomData.gridSize * roomData.gridSize;
                }
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
                        this.handleApprovePlayerMark(roomId, index);
                    });
                });
                
                document.querySelectorAll('.reject-mark').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = parseInt(e.target.getAttribute('data-index'));
                        this.handleRejectPlayerMark(roomId, index);
                    });
                });
            }
        }
    }
    
    async handleAddWord(roomId) {
        const newWordInput = document.getElementById('newWord');
        const word = newWordInput.value.trim();
        
        if (!word) {
            window.showNotification('Please enter a word or phrase', 'error');
            return;
        }
        
        const success = await this.adminController.addWordToRoom(roomId, word);
        if (success) {
            newWordInput.value = '';
        }
    }
    
    async handleDeleteWord(roomId, index) {
        await this.adminController.deleteWordFromRoom(roomId, index);
    }
    
    async handleStartGame(roomId) {
        await this.adminController.startGame(roomId);
    }
    
    async handleApprovePlayerMark(roomId, index) {
        await this.adminController.approvePlayerMark(roomId, index);
    }
    
    async handleRejectPlayerMark(roomId, index) {
        await this.adminController.rejectPlayerMark(roomId, index);
    }
    
    viewPlayerGrid(roomId, playerName, roomData) {
        if (!roomData.playerGrids || !roomData.playerGrids[playerName]) {
            window.showNotification(`No grid found for player ${playerName}`, 'error');
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
    }
    
    async loadPlayerRoom(roomId, playerName, roomData) {
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
            this.playerController.setupPlayerListener(roomId, playerName, (updatedRoomData) => {
                // If game has started, load player view
                if (updatedRoomData.status === 'active') {
                    window.showNotification('The game has started!', 'success');
                    this.loadPlayerRoom(roomId, playerName, updatedRoomData);
                }
            });
            
            this.currentView = 'player-waiting';
            this.currentRoomId = roomId;
            this.currentPlayerName = playerName;
            
            return;
        }
        
        // If game is active, show player's bingo grid
        const playerGrid = roomData.playerGrids && roomData.playerGrids[playerName];
        
        if (!playerGrid) {
            window.showNotification('Your bingo grid is not ready yet', 'error');
            return;
        }
        
        // Create player interface
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Stream Bingo - Room ${roomId}</div>
                <p class="subtitle">Playing as: ${playerName}</p>
                
                <div class="bingo-grid grid-${roomData.gridSize}" id="playerBingoGrid">
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
                    this.handleMarkPlayerCell(roomId, playerName, row, col);
                }
            });
        });
        
        // Set up real-time listener for grid updates
        this.playerController.setupPlayerListener(roomId, playerName, (updatedRoomData) => {
            this.updatePlayerRoomUI(roomId, playerName, updatedRoomData);
        });
        
        this.currentView = 'player';
        this.currentRoomId = roomId;
        this.currentPlayerName = playerName;
    }
    
    updatePlayerRoomUI(roomId, playerName, roomData) {
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
                        if (playerGrid[row][col] && !playerGrid[row][col].marked && !playerGrid[row][col].approved) {
                            this.handleMarkPlayerCell(roomId, playerName, row, col);
                        }
                    });
                });
            }
            
            // Check if player has won
            if (roomData.bingoWinners && roomData.bingoWinners.includes(playerName)) {
                window.showNotification('BINGO! You won!', 'success');
            }
        }
    }
    
    async handleMarkPlayerCell(roomId, playerName, row, col) {
        await this.playerController.markPlayerCell(roomId, playerName, row, col);
    }
}

// Initialize the application
window.uiController = new UIController();
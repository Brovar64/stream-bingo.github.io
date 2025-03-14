// js/ui_admin.js - Admin UI functionality

class AdminUIController {
    constructor(baseUI) {
        this.baseUI = baseUI;
        this.auth = window.authManager;
        this.adminController = window.adminController;
    }
    
    async loadRoom(roomId) {
        // Show loading indicator
        const appDiv = document.getElementById('app');
        this.baseUI.showLoading(appDiv, `Loading Room ${roomId}...`);
        
        const roomData = await this.adminController.loadAdminRoom(roomId);
        if (!roomData) {
            return;
        }
        
        const gridSize = roomData.gridSize;
        const words = roomData.words || [];
        const players = roomData.players || [];
        const pendingApprovals = roomData.pendingApprovals || [];
        const gameStatus = roomData.status;
        
        // Update base UI reference tracking
        this.baseUI.currentView = 'admin';
        this.baseUI.currentRoomId = roomId;
        
        // Create admin interface
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Admin Panel - Room ${roomId}</div>
                <p class="subtitle">Grid Size: ${gridSize}x${gridSize}</p>
                
                <div class="admin-panel">
                    <div class="admin-sidebar">
                        <div class="card">
                            <h2>Room Status</h2>
                            <p>Current status: <span class="status-badge ${gameStatus}">${gameStatus}</span></p>
                            <p>Room code: <strong>${roomId}</strong> (Share this with players)</p>
                            <p>Players: <strong>${players.length}</strong></p>
                            <div id="gameControlPanel">
                            ${gameStatus === 'setup' ? `
                                <button id="startGameBtn" class="btn btn-primary ${words.length < gridSize * gridSize ? 'disabled' : ''}" 
                                        ${words.length < gridSize * gridSize ? 'disabled' : ''}>
                                    Start Game
                                </button>
                                <p class="setup-note ${words.length < gridSize * gridSize ? 'visible' : 'hidden'}">
                                    Add ${gridSize * gridSize - words.length} more words to start game
                                </p>
                            ` : `
                                <div class="game-active-panel">
                                    <p class="active-note">Game is active and players can join</p>
                                    <button id="viewGameBtn" class="btn btn-primary">View Game</button>
                                </div>
                            `}
                            </div>
                            <button id="backToDashboardBtn" class="btn btn-secondary mt-10">Back to Dashboard</button>
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
                            <div class="word-count-display">
                                Words: ${words.length}/${gridSize * gridSize} 
                                <div class="progress-bar">
                                    <div class="progress" style="width: ${Math.min(100, (words.length / (gridSize * gridSize)) * 100)}%"></div>
                                </div>
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
        document.getElementById('backToDashboardBtn').addEventListener('click', () => this.baseUI.loadDashboard());
        document.getElementById('addWordBtn').addEventListener('click', () => this.handleAddWord(roomId));
        
        // Add start game button listener if in setup mode
        if (gameStatus === 'setup') {
            const startGameBtn = document.getElementById('startGameBtn');
            if (startGameBtn && !startGameBtn.disabled) {
                startGameBtn.addEventListener('click', () => this.handleStartGame(roomId));
            }
        } else {
            // Game is active, add view game button listener
            const viewGameBtn = document.getElementById('viewGameBtn');
            if (viewGameBtn) {
                viewGameBtn.addEventListener('click', () => this.viewActiveGame(roomId, roomData));
            }
        }
        
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
            this.updateRoomUI(roomId, updatedRoomData);
        });
    }
    
    updateRoomUI(roomId, roomData) {
        const gameStatus = roomData.status;
        
        // Update status badge
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge ${gameStatus}`;
            statusBadge.textContent = gameStatus;
        }
        
        // Update game control panel based on status
        const gameControlPanel = document.getElementById('gameControlPanel');
        if (gameControlPanel) {
            const words = roomData.words || [];
            const gridSize = roomData.gridSize;
            
            if (gameStatus === 'setup') {
                gameControlPanel.innerHTML = `
                    <button id="startGameBtn" class="btn btn-primary ${words.length < gridSize * gridSize ? 'disabled' : ''}" 
                            ${words.length < gridSize * gridSize ? 'disabled' : ''}>
                        Start Game
                    </button>
                    <p class="setup-note ${words.length < gridSize * gridSize ? 'visible' : 'hidden'}">
                        Add ${gridSize * gridSize - words.length} more words to start game
                    </p>
                `;
                
                // Re-add event listener
                const startGameBtn = document.getElementById('startGameBtn');
                if (startGameBtn && !startGameBtn.disabled) {
                    startGameBtn.addEventListener('click', () => this.handleStartGame(roomId));
                }
            } else {
                gameControlPanel.innerHTML = `
                    <div class="game-active-panel">
                        <p class="active-note">Game is active and players can join</p>
                        <button id="viewGameBtn" class="btn btn-primary">View Game</button>
                    </div>
                `;
                
                // Re-add event listener
                const viewGameBtn = document.getElementById('viewGameBtn');
                if (viewGameBtn) {
                    viewGameBtn.addEventListener('click', () => this.viewActiveGame(roomId, roomData));
                }
            }
        }
        
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
            const gridSize = roomData.gridSize;
            
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
                
                // Update word count and progress
                const wordCountDisplay = document.querySelector('.word-count-display');
                if (wordCountDisplay) {
                    wordCountDisplay.innerHTML = `
                        Words: ${words.length}/${gridSize * gridSize} 
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(100, (words.length / (gridSize * gridSize)) * 100)}%"></div>
                        </div>
                    `;
                }
                
                // Update Start Game button state
                const startGameBtn = document.getElementById('startGameBtn');
                if (startGameBtn) {
                    const isDisabled = words.length < gridSize * gridSize;
                    startGameBtn.disabled = isDisabled;
                    startGameBtn.className = `btn btn-primary ${isDisabled ? 'disabled' : ''}`;
                    
                    // Update setup note
                    const setupNote = document.querySelector('.setup-note');
                    if (setupNote) {
                        setupNote.className = `setup-note ${isDisabled ? 'visible' : 'hidden'}`;
                        setupNote.textContent = `Add ${gridSize * gridSize - words.length} more words to start game`;
                    }
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
        
        // Disable button while adding
        const addWordBtn = document.getElementById('addWordBtn');
        const originalText = addWordBtn.textContent;
        addWordBtn.disabled = true;
        addWordBtn.textContent = 'Adding...';
        
        const success = await this.adminController.addWordToRoom(roomId, word);
        
        // Restore button
        addWordBtn.disabled = false;
        addWordBtn.textContent = originalText;
        
        if (success) {
            newWordInput.value = '';
            // Focus back on input for quick entry of multiple words
            newWordInput.focus();
        }
    }
    
    async handleDeleteWord(roomId, index) {
        await this.adminController.deleteWordFromRoom(roomId, index);
    }
    
    async handleStartGame(roomId) {
        // Get the current room status and update the button to show loading state
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.disabled = true;
            startGameBtn.textContent = 'Starting Game...';
            startGameBtn.classList.add('loading');
        }
        
        const roomRef = window.db.collection('rooms').doc(roomId);
        const roomDoc = await roomRef.get();
        const roomData = roomDoc.data();
        
        // If the game is already active, just refresh the view
        if (roomData.status === 'active') {
            window.showNotification('Game is already active - refreshing view', 'success');
            
            // Make sure player grids are assigned
            if (!roomData.playerGrids || Object.keys(roomData.playerGrids || {}).length === 0) {
                if (startGameBtn) {
                    startGameBtn.textContent = 'Assigning Player Grids...';
                }
                await this.adminController.assignPlayerGrids(roomId);
            }
            
            // Reload the admin room to show the active game
            this.loadRoom(roomId);
            return;
        }
        
        // Otherwise try to start the game
        const success = await this.adminController.startGame(roomId);
        
        if (success) {
            // Show success animation
            window.showNotification('Game started successfully!', 'success');
            
            // Create a temporary overlay to show game started
            const overlay = document.createElement('div');
            overlay.className = 'game-start-overlay';
            overlay.innerHTML = `
                <div class="game-start-content">
                    <h2>Game Started!</h2>
                    <p>Players can now join and play</p>
                    <div class="confetti"></div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Remove overlay after animation
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    // Reload the admin view to reflect the game started
                    this.loadRoom(roomId);
                }, 500);
            }, 2000);
        } else {
            // Restore the button if game start failed
            if (startGameBtn) {
                startGameBtn.disabled = false;
                startGameBtn.textContent = 'Start Game';
                startGameBtn.classList.remove('loading');
            }
        }
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
        
        const playerGrid = roomData.playerGrids[playerName];
        const gridSize = roomData.gridSize;
        
        // Convert flat object grid to a 2D structure for display
        const gridCells = [];
        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                const cellKey = `${i}_${j}`;
                const cell = playerGrid[cellKey] || { word: '', marked: false, approved: false };
                row.push(cell);
            }
            gridCells.push(row);
        }
        
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
                        ${gridCells.flat().map(cell => `
                            <div class="bingo-cell ${cell.marked ? 'marked' : ''} ${cell.approved ? 'approved' : (cell.marked ? 'pending' : '')}">
                                ${cell.word}
                            </div>
                        `).join('')}
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
    
    viewActiveGame(roomId, roomData) {
        // Create a modal to display the active game status and grids
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Get player count and winner count
        const playerCount = roomData.players ? roomData.players.length : 0;
        const bingoWinners = roomData.bingoWinners || [];
        const winnerCount = bingoWinners.length;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Active Game Status - Room ${roomId}</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="game-status-panel">
                        <div class="status-card">
                            <h3>Players</h3>
                            <div class="stat-value">${playerCount}</div>
                        </div>
                        <div class="status-card">
                            <h3>Bingo Winners</h3>
                            <div class="stat-value">${winnerCount}</div>
                        </div>
                        <div class="status-card">
                            <h3>Game Runtime</h3>
                            <div class="stat-value" id="gameRuntime">Calculating...</div>
                        </div>
                    </div>
                    
                    ${winnerCount > 0 ? `
                        <div class="winners-list">
                            <h3>Winners:</h3>
                            <ul>
                                ${bingoWinners.map(winner => `<li>${winner}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="player-grids-panel">
                        <h3>Player Grids</h3>
                        <div class="player-grid-list">
                            ${roomData.players && roomData.players.map(player => `
                                <button class="view-player-grid-btn" data-player="${player.nickname}">
                                    ${player.nickname}'s Grid
                                </button>
                            `).join('')}
                        </div>
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
        
        // Add event listeners to view player grid buttons in the modal
        modal.querySelectorAll('.view-player-grid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerName = e.target.getAttribute('data-player');
                this.viewPlayerGrid(roomId, playerName, roomData);
            });
        });
        
        // Calculate game runtime if startedAt is available
        if (roomData.startedAt) {
            const startTime = roomData.startedAt.toDate ? roomData.startedAt.toDate() : new Date(roomData.startedAt);
            const updateRuntime = () => {
                const now = new Date();
                const diffMs = now - startTime;
                const diffMins = Math.floor(diffMs / 60000);
                const diffSecs = Math.floor((diffMs % 60000) / 1000);
                document.getElementById('gameRuntime').textContent = `${diffMins}m ${diffSecs}s`;
            };
            
            updateRuntime();
            const runtimeInterval = setInterval(updateRuntime, 1000);
            
            // Clear interval when modal is closed
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.className === 'close-modal') {
                    clearInterval(runtimeInterval);
                }
            });
        }
    }
}

// Export globally
window.AdminUIController = AdminUIController;
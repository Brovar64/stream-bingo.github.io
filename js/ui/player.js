// js/ui/player.js - Player UI functionality

class PlayerUIController {
    constructor(baseUI) {
        this.baseUI = baseUI;
        this.playerController = window.playerController;
    }
    
    async loadRoom(roomId, playerName, roomData) {
        this.baseUI.currentView = 'player';
        this.baseUI.currentRoomId = roomId;
        this.baseUI.currentPlayerName = playerName;
        
        // Check if game has started
        if (roomData.status !== 'active') {
            this.showWaitingScreen(roomId, playerName, roomData);
            return;
        }
        
        this.showActiveGame(roomId, playerName, roomData);
    }
    
    showWaitingScreen(roomId, playerName, roomData) {
        // Show waiting screen
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Stream Bingo - Room ${roomId}</div>
                <p class="subtitle">Playing as: ${playerName}</p>
                
                <div class="card">
                    <h2>Waiting for Game to Start</h2>
                    <p>The admin is still setting up the game. Please wait.</p>
                    <p>Room Status: <span class="status-badge setup">${roomData.status}</span></p>
                    <div class="waiting-animation">
                        <div class="dots">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                        <p>Waiting for admin to start the game</p>
                    </div>
                    <button id="backToDashboardBtn" class="btn btn-secondary">Back to Dashboard</button>
                </div>
            </div>
        `;
        
        document.getElementById('backToDashboardBtn').addEventListener('click', () => this.baseUI.loadDashboard());
        
        // Set up real-time listener for game status
        this.playerController.setupPlayerListener(roomId, playerName, (updatedRoomData) => {
            // If game has started, load player view
            if (updatedRoomData.status === 'active') {
                window.showNotification('The game has started!', 'success');
                this.loadRoom(roomId, playerName, updatedRoomData);
            }
        });
        
        this.baseUI.currentView = 'player-waiting';
    }
    
    showActiveGame(roomId, playerName, roomData) {
        // If game is active, show player's bingo grid
        if (!roomData.playerGrids || !roomData.playerGrids[playerName]) {
            window.showNotification('Your bingo grid is not ready yet', 'error');
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
                row.push({...cell, row: i, col: j});
            }
            gridCells.push(row);
        }
        
        // Create player interface
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Stream Bingo - Room ${roomId}</div>
                <p class="subtitle">Playing as: ${playerName}</p>
                
                <div class="bingo-grid grid-${gridSize}" id="playerBingoGrid">
                    ${gridCells.flat().map(cell => `
                        <div class="bingo-cell ${cell.marked ? 'marked' : ''} ${cell.approved ? 'approved' : (cell.marked ? 'pending' : '')}" 
                             data-row="${cell.row}" data-col="${cell.col}">
                            ${cell.word}
                        </div>
                    `).join('')}
                </div>
                
                <div class="card">
                    <h2>Game Info</h2>
                    <p>Click on a cell to mark it when the streamer mentions that word.</p>
                    <p>The admin will need to approve your marks.</p>
                    <div class="status-section">
                        <div class="status-item">
                            <span class="status-label">Waiting for approval:</span>
                            <span class="status-count" id="pendingCount">${this.countPendingMarks(playerGrid)}</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Approved marks:</span>
                            <span class="status-count" id="approvedCount">${this.countApprovedMarks(playerGrid)}</span>
                        </div>
                    </div>
                    <button id="backToDashboardBtn" class="btn btn-secondary">Back to Dashboard</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('backToDashboardBtn').addEventListener('click', () => this.baseUI.loadDashboard());
        
        // Add event listeners to the bingo cells
        document.querySelectorAll('.bingo-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const row = parseInt(e.target.getAttribute('data-row'));
                const col = parseInt(e.target.getAttribute('data-col'));
                const cellKey = `${row}_${col}`;
                
                // Don't allow clicking on already marked or approved cells
                if (playerGrid[cellKey] && !playerGrid[cellKey].marked && !playerGrid[cellKey].approved) {
                    this.handleMarkCell(roomId, playerName, row, col);
                }
            });
        });
        
        // Set up real-time listener for grid updates
        this.playerController.setupPlayerListener(roomId, playerName, (updatedRoomData) => {
            this.updateRoomUI(roomId, playerName, updatedRoomData);
        });
    }
    
    countPendingMarks(playerGrid) {
        let count = 0;
        for (const key in playerGrid) {
            if (playerGrid[key].marked && !playerGrid[key].approved) {
                count++;
            }
        }
        return count;
    }
    
    countApprovedMarks(playerGrid) {
        let count = 0;
        for (const key in playerGrid) {
            if (playerGrid[key].approved) {
                count++;
            }
        }
        return count;
    }
    
    updateRoomUI(roomId, playerName, roomData) {
        // Update player's grid if available
        if (roomData.playerGrids && roomData.playerGrids[playerName]) {
            const playerGrid = roomData.playerGrids[playerName];
            const gridSize = roomData.gridSize;
            
            // Convert flat object grid to a 2D structure for display
            const gridCells = [];
            for (let i = 0; i < gridSize; i++) {
                const row = [];
                for (let j = 0; j < gridSize; j++) {
                    const cellKey = `${i}_${j}`;
                    const cell = playerGrid[cellKey] || { word: '', marked: false, approved: false };
                    row.push({...cell, row: i, col: j});
                }
                gridCells.push(row);
            }
            
            const bingoGridElement = document.getElementById('playerBingoGrid');
            if (bingoGridElement) {
                bingoGridElement.innerHTML = gridCells.flat().map(cell => `
                    <div class="bingo-cell ${cell.marked ? 'marked' : ''} ${cell.approved ? 'approved' : (cell.marked ? 'pending' : '')}" 
                         data-row="${cell.row}" data-col="${cell.col}">
                        ${cell.word}
                    </div>
                `).join('');
                
                // Re-add event listeners
                document.querySelectorAll('.bingo-cell').forEach(cell => {
                    cell.addEventListener('click', (e) => {
                        const row = parseInt(e.target.getAttribute('data-row'));
                        const col = parseInt(e.target.getAttribute('data-col'));
                        const cellKey = `${row}_${col}`;
                        
                        // Don't allow clicking on already marked or approved cells
                        if (playerGrid[cellKey] && !playerGrid[cellKey].marked && !playerGrid[cellKey].approved) {
                            this.handleMarkCell(roomId, playerName, row, col);
                        }
                    });
                });
                
                // Update status counts
                const pendingCount = document.getElementById('pendingCount');
                const approvedCount = document.getElementById('approvedCount');
                
                if (pendingCount) pendingCount.textContent = this.countPendingMarks(playerGrid);
                if (approvedCount) approvedCount.textContent = this.countApprovedMarks(playerGrid);
            }
            
            // Check if player has won
            if (roomData.bingoWinners && roomData.bingoWinners.includes(playerName)) {
                // Show winning celebration if it's the first time we've seen this
                if (!this.hasShownWinMessage) {
                    this.showWinningCelebration();
                    this.hasShownWinMessage = true;
                }
            }
        }
    }
    
    showWinningCelebration() {
        // Create overlay for winning celebration
        const overlay = document.createElement('div');
        overlay.className = 'win-overlay';
        overlay.innerHTML = `
            <div class="win-content">
                <h1>BINGO!</h1>
                <p>Congratulations, you won!</p>
                <div class="confetti"></div>
                <button class="btn btn-primary close-win">Continue Playing</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listener to close button
        overlay.querySelector('.close-win').addEventListener('click', () => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 500);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                }, 500);
            }
        }, 5000);
    }
    
    async handleMarkCell(roomId, playerName, row, col) {
        // Visually mark cell immediately for responsiveness
        const cellElement = document.querySelector(`.bingo-cell[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add('marking');
        }
        
        await this.playerController.markPlayerCell(roomId, playerName, row, col);
        
        // Remove animation class after the update
        if (cellElement) {
            cellElement.classList.remove('marking');
        }
    }
}

// Export globally
window.PlayerUIController = PlayerUIController;
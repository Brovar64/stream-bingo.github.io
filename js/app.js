// Stream Bingo App
document.addEventListener('DOMContentLoaded', () => {
    const app = new StreamBingo();
    app.init();
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
    }

    init() {
        // Check if user is in session storage
        const savedUser = sessionStorage.getItem('streamBingoUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            
            // Check if room exists
            this.checkRoomExists(this.currentUser.roomCode)
                .then(exists => {
                    if (exists) {
                        this.currentRoom = this.currentUser.roomCode;
                        if (this.currentUser.isAdmin) {
                            this.isAdmin = true;
                            this.showAdminDashboard();
                        } else {
                            this.showPlayerGame();
                        }
                    } else {
                        sessionStorage.removeItem('streamBingoUser');
                        this.showWelcomeScreen();
                    }
                });
        } else {
            this.showWelcomeScreen();
        }
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

    async createRoom() {
        const nickname = document.getElementById('nickname').value.trim();
        const roomCode = document.getElementById('roomCode').value.trim();
        const gridSize = parseInt(document.getElementById('gridSize').value);

        if (!nickname || !roomCode) {
            this.showNotification('Nickname and Room Code are required');
            return;
        }

        try {
            // Check if room already exists
            const roomExists = await this.checkRoomExists(roomCode);
            if (roomExists) {
                this.showNotification('Room already exists. Please choose a different code.');
                return;
            }

            // Create room in Firebase
            await db.collection('rooms').doc(roomCode).set({
                adminId: nickname,
                gridSize: gridSize,
                words: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Save user to session
            this.currentUser = {
                nickname: nickname,
                roomCode: roomCode,
                isAdmin: true
            };
            this.currentRoom = roomCode;
            this.isAdmin = true;
            this.bingoSize = gridSize;
            
            sessionStorage.setItem('streamBingoUser', JSON.stringify(this.currentUser));
            
            // Show admin dashboard
            this.showAdminDashboard();
        } catch (error) {
            console.error('Error creating room:', error);
            this.showNotification('Error creating room. Please try again.');
        }
    }

    async joinRoom() {
        const nickname = document.getElementById('nickname').value.trim();
        const roomCode = document.getElementById('roomCode').value.trim();

        if (!nickname || !roomCode) {
            this.showNotification('Nickname and Room Code are required');
            return;
        }

        try {
            // Check if room exists
            const roomExists = await this.checkRoomExists(roomCode);
            if (!roomExists) {
                this.showNotification('Room does not exist');
                return;
            }

            // Get room data
            const roomDoc = await db.collection('rooms').doc(roomCode).get();
            const roomData = roomDoc.data();
            
            // Check if user is admin
            const isAdmin = roomData.adminId === nickname;
            
            // Save user to session
            this.currentUser = {
                nickname: nickname,
                roomCode: roomCode,
                isAdmin: isAdmin
            };
            this.currentRoom = roomCode;
            this.isAdmin = isAdmin;
            this.bingoSize = roomData.gridSize;
            
            sessionStorage.setItem('streamBingoUser', JSON.stringify(this.currentUser));
            
            // Check if player already exists, if not create them
            const playerRef = db.collection('rooms').doc(roomCode)
                .collection('players').doc(nickname);
            
            const playerDoc = await playerRef.get();
            
            if (!playerDoc.exists && !isAdmin) {
                // Generate bingo card for the player
                const words = roomData.words || [];
                
                if (words.length < this.bingoSize * this.bingoSize) {
                    this.showNotification('Room is not fully set up yet. Please try again later.');
                    return;
                }
                
                // Shuffle and slice words for this player's card
                const shuffledWords = this.shuffleArray([...words]);
                const bingoGrid = shuffledWords.slice(0, this.bingoSize * this.bingoSize);
                
                // Create player document
                await playerRef.set({
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    bingoGrid: bingoGrid,
                    markedCells: []
                });
            }
            
            // Show appropriate interface
            if (isAdmin) {
                this.showAdminDashboard();
            } else {
                this.showPlayerGame();
            }
            
        } catch (error) {
            console.error('Error joining room:', error);
            this.showNotification('Error joining room. Please try again.');
        }
    }

    async showAdminDashboard() {
        try {
            // Get room data
            const roomDoc = await db.collection('rooms').doc(this.currentRoom).get();
            const roomData = roomDoc.data();
            
            this.bingoSize = roomData.gridSize;
            this.bingoWords = roomData.words || [];
            
            let wordListHTML = '';
            
            if (this.bingoWords.length > 0) {
                wordListHTML = `
                    <div class="words-container" style="margin-top: 1rem;">
                        <h3 style="margin-bottom: 1rem;">Bingo Words</h3>
                        <ul class="player-list">
                            ${this.bingoWords.map((word, index) => `
                                <li class="player-item">${word}</li>
                            `).join('')}
                        </ul>
                        
                        <button id="editWords" class="btn btn-secondary" style="margin-top: 1rem;">Edit Words</button>
                    </div>
                `;
            }
            
            this.app.innerHTML = `
                <div class="container">
                    <h1 class="title">Admin Dashboard</h1>
                    <p class="subtitle">Room Code: <strong>${this.currentRoom}</strong></p>
                    
                    <div style="margin-bottom: 2rem;">
                        <div id="wordSetup">
                            ${this.bingoWords.length === 0 ? `
                                <h3>Add Bingo Words</h3>
                                <p style="margin-bottom: 1rem;">You need at least ${this.bingoSize * this.bingoSize} words for the bingo cards.</p>
                                
                                <div class="form-group">
                                    <label for="bingoWords">Enter one word or phrase per line:</label>
                                    <textarea id="bingoWords" class="form-control" rows="10" placeholder="Enter bingo words here, one per line"></textarea>
                                </div>
                                
                                <button id="saveWords" class="btn btn-primary">Save Words</button>
                            ` : wordListHTML}
                        </div>
                    </div>
                    
                    <div id="playersSection">
                        <h3>Players</h3>
                        <div class="admin-panel">
                            <div class="admin-sidebar">
                                <h4 style="margin-bottom: 1rem;">Players List</h4>
                                <ul id="playersList" class="player-list">
                                    <li>Loading players...</li>
                                </ul>
                            </div>
                            
                            <div class="admin-main" id="selectedPlayerView">
                                <p>Select a player to view their bingo card</p>
                            </div>
                        </div>
                    </div>
                    
                    <button id="leaveRoom" class="btn btn-secondary" style="margin-top: 2rem;">Leave Room</button>
                </div>
            `;

            // Add event listeners
            if (this.bingoWords.length === 0) {
                document.getElementById('saveWords').addEventListener('click', () => this.saveWords());
            } else {
                document.getElementById('editWords').addEventListener('click', () => this.showEditWords());
            }
            
            document.getElementById('leaveRoom').addEventListener('click', () => this.leaveRoom());
            
            // Load players list
            this.loadPlayersList();
            
            // Set up real-time updates for players list
            this.setupPlayersListener();
        } catch (error) {
            console.error('Error showing admin dashboard:', error);
            this.showNotification('Error loading admin dashboard');
        }
    }

    async loadPlayersList() {
        try {
            const playersRef = db.collection('rooms').doc(this.currentRoom)
                .collection('players');
                
            const snapshot = await playersRef.get();
            
            const playersList = document.getElementById('playersList');
            
            if (snapshot.empty) {
                playersList.innerHTML = '<li>No players yet</li>';
                return;
            }
            
            playersList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const playerItem = document.createElement('li');
                playerItem.className = 'player-item';
                playerItem.dataset.playerId = doc.id;
                playerItem.textContent = doc.id;
                
                playerItem.addEventListener('click', () => {
                    this.showPlayerBingoCard(doc.id);
                    
                    // Set active class
                    document.querySelectorAll('.player-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    playerItem.classList.add('active');
                });
                
                playersList.appendChild(playerItem);
            });
        } catch (error) {
            console.error('Error loading players list:', error);
        }
    }

    setupPlayersListener() {
        db.collection('rooms').doc(this.currentRoom)
            .collection('players')
            .onSnapshot(snapshot => {
                this.loadPlayersList();
                
                // Refresh selected player view if one is selected
                if (this.selectedPlayer) {
                    this.showPlayerBingoCard(this.selectedPlayer);
                }
            });
    }

    async showPlayerBingoCard(playerId) {
        try {
            this.selectedPlayer = playerId;
            
            const playerDoc = await db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(playerId).get();
                
            if (!playerDoc.exists) {
                document.getElementById('selectedPlayerView').innerHTML = `
                    <p>Player not found</p>
                `;
                return;
            }
            
            const playerData = playerDoc.data();
            const bingoGrid = playerData.bingoGrid || [];
            const markedCells = playerData.markedCells || [];
            
            let gridHTML = `
                <h3>${playerId}'s Bingo Card</h3>
                <div class="bingo-grid grid-${this.bingoSize}" style="margin-top: 1rem; margin-bottom: 1rem;">
            `;
            
            bingoGrid.forEach((word, index) => {
                const isMarked = markedCells.includes(index);
                const pendingMarks = playerData.pendingMarks || [];
                const isPending = pendingMarks.includes(index);
                
                gridHTML += `
                    <div class="bingo-cell ${isMarked ? 'marked' : ''} ${isPending ? 'pending' : ''}" 
                         data-index="${index}" data-player="${playerId}">
                        ${word}
                        ${isPending ? `
                            <div style="margin-top: 0.5rem;">
                                <button class="approve-mark" data-index="${index}" data-player="${playerId}">✓</button>
                                <button class="reject-mark" data-index="${index}" data-player="${playerId}">✗</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            gridHTML += `</div>`;
            
            // Check if player has bingo
            const hasBingo = this.checkBingo(markedCells, this.bingoSize);
            
            if (hasBingo) {
                gridHTML += `
                    <div style="background-color: #FF4081; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h3 style="margin: 0;">BINGO! 🎉</h3>
                    </div>
                `;
            }
            
            document.getElementById('selectedPlayerView').innerHTML = gridHTML;
            
            // Add event listeners for approve/reject buttons
            document.querySelectorAll('.approve-mark').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(button.dataset.index);
                    const playerId = button.dataset.player;
                    this.approveMark(playerId, index);
                });
            });
            
            document.querySelectorAll('.reject-mark').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(button.dataset.index);
                    const playerId = button.dataset.player;
                    this.rejectMark(playerId, index);
                });
            });
            
        } catch (error) {
            console.error('Error showing player bingo card:', error);
        }
    }

    async approveMark(playerId, index) {
        try {
            const playerRef = db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(playerId);
                
            const playerDoc = await playerRef.get();
            const playerData = playerDoc.data();
            
            const pendingMarks = playerData.pendingMarks || [];
            const markedCells = playerData.markedCells || [];
            
            // Remove from pending and add to marked
            const updatedPending = pendingMarks.filter(i => i !== index);
            const updatedMarked = [...markedCells, index];
            
            await playerRef.update({
                pendingMarks: updatedPending,
                markedCells: updatedMarked
            });
            
            this.showNotification(`Approved mark for ${playerId}`);
        } catch (error) {
            console.error('Error approving mark:', error);
        }
    }

    async rejectMark(playerId, index) {
        try {
            const playerRef = db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(playerId);
                
            const playerDoc = await playerRef.get();
            const playerData = playerDoc.data();
            
            const pendingMarks = playerData.pendingMarks || [];
            
            // Remove from pending
            const updatedPending = pendingMarks.filter(i => i !== index);
            
            await playerRef.update({
                pendingMarks: updatedPending
            });
            
            this.showNotification(`Rejected mark for ${playerId}`);
        } catch (error) {
            console.error('Error rejecting mark:', error);
        }
    }

    async saveWords() {
        const wordsTextarea = document.getElementById('bingoWords');
        const wordsText = wordsTextarea.value.trim();
        
        if (!wordsText) {
            this.showNotification('Please enter some words');
            return;
        }
        
        // Split by new line and remove empty lines
        let words = wordsText.split('\n')
            .map(word => word.trim())
            .filter(word => word.length > 0);
            
        // Remove duplicates
        words = [...new Set(words)];
        
        const minWords = this.bingoSize * this.bingoSize;
        
        if (words.length < minWords) {
            this.showNotification(`You need at least ${minWords} unique words`);
            return;
        }
        
        try {
            // Save words to room
            await db.collection('rooms').doc(this.currentRoom).update({
                words: words
            });
            
            this.bingoWords = words;
            this.showNotification('Words saved successfully');
            this.showAdminDashboard();
            
        } catch (error) {
            console.error('Error saving words:', error);
            this.showNotification('Error saving words');
        }
    }

    showEditWords() {
        const wordSetup = document.getElementById('wordSetup');
        
        wordSetup.innerHTML = `
            <h3>Edit Bingo Words</h3>
            <p style="margin-bottom: 1rem;">You need at least ${this.bingoSize * this.bingoSize} words for the bingo cards.</p>
            
            <div class="form-group">
                <label for="bingoWords">Enter one word or phrase per line:</label>
                <textarea id="bingoWords" class="form-control" rows="10">${this.bingoWords.join('\n')}</textarea>
            </div>
            
            <button id="updateWords" class="btn btn-primary">Update Words</button>
            <button id="cancelEdit" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</button>
        `;
        
        document.getElementById('updateWords').addEventListener('click', () => this.updateWords());
        document.getElementById('cancelEdit').addEventListener('click', () => this.showAdminDashboard());
    }

    async updateWords() {
        const wordsTextarea = document.getElementById('bingoWords');
        const wordsText = wordsTextarea.value.trim();
        
        if (!wordsText) {
            this.showNotification('Please enter some words');
            return;
        }
        
        // Split by new line and remove empty lines
        let words = wordsText.split('\n')
            .map(word => word.trim())
            .filter(word => word.length > 0);
            
        // Remove duplicates
        words = [...new Set(words)];
        
        const minWords = this.bingoSize * this.bingoSize;
        
        if (words.length < minWords) {
            this.showNotification(`You need at least ${minWords} unique words`);
            return;
        }
        
        try {
            // Update words in room
            await db.collection('rooms').doc(this.currentRoom).update({
                words: words
            });
            
            this.bingoWords = words;
            this.showNotification('Words updated successfully');
            
            // Regenerate bingo cards for all players
            const playersRef = db.collection('rooms').doc(this.currentRoom)
                .collection('players');
                
            const snapshot = await playersRef.get();
            
            const batch = db.batch();
            
            snapshot.forEach(doc => {
                const playerId = doc.id;
                
                // Skip admin
                if (playerId === this.currentUser.nickname) {
                    return;
                }
                
                const playerRef = playersRef.doc(playerId);
                
                // Shuffle and slice words for this player's card
                const shuffledWords = this.shuffleArray([...words]);
                const bingoGrid = shuffledWords.slice(0, this.bingoSize * this.bingoSize);
                
                batch.update(playerRef, {
                    bingoGrid: bingoGrid,
                    markedCells: [],
                    pendingMarks: []
                });
            });
            
            await batch.commit();
            
            this.showAdminDashboard();
            
        } catch (error) {
            console.error('Error updating words:', error);
            this.showNotification('Error updating words');
        }
    }

    async showPlayerGame() {
        try {
            // Get player data
            const playerDoc = await db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(this.currentUser.nickname).get();
                
            if (!playerDoc.exists) {
                this.showNotification('Player not found');
                this.leaveRoom();
                return;
            }
            
            const playerData = playerDoc.data();
            const bingoGrid = playerData.bingoGrid || [];
            const markedCells = playerData.markedCells || [];
            const pendingMarks = playerData.pendingMarks || [];
            
            // Get room data for grid size
            const roomDoc = await db.collection('rooms').doc(this.currentRoom).get();
            const roomData = roomDoc.data();
            
            this.bingoSize = roomData.gridSize;
            
            let gridHTML = `
                <div class="bingo-grid grid-${this.bingoSize}">
            `;
            
            bingoGrid.forEach((word, index) => {
                const isMarked = markedCells.includes(index);
                const isPending = pendingMarks.includes(index);
                
                gridHTML += `
                    <div class="bingo-cell ${isMarked ? 'marked' : ''} ${isPending ? 'pending' : ''}" 
                         data-index="${index}" style="${isPending ? 'background-color: #FFA000;' : ''}">
                        ${word}
                        ${isPending ? '<div style="font-size: 0.8em; margin-top: 5px;">Pending approval</div>' : ''}
                    </div>
                `;
            });
            
            gridHTML += `</div>`;
            
            // Check if player has bingo
            const hasBingo = this.checkBingo(markedCells, this.bingoSize);
            
            this.app.innerHTML = `
                <div class="container">
                    <h1 class="title">Stream Bingo</h1>
                    <p class="subtitle">Room: <strong>${this.currentRoom}</strong> | Player: <strong>${this.currentUser.nickname}</strong></p>
                    
                    ${hasBingo ? `
                        <div style="background-color: #FF4081; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <h2 style="margin: 0;">BINGO! 🎉</h2>
                        </div>
                    ` : ''}
                    
                    ${gridHTML}
                    
                    <button id="leaveRoom" class="btn btn-secondary" style="margin-top: 2rem;">Leave Room</button>
                </div>
            `;
            
            // Add event listeners
            document.querySelectorAll('.bingo-cell').forEach(cell => {
                cell.addEventListener('click', () => {
                    if (!cell.classList.contains('marked') && !cell.classList.contains('pending')) {
                        this.markCell(parseInt(cell.dataset.index));
                    }
                });
            });
            
            document.getElementById('leaveRoom').addEventListener('click', () => this.leaveRoom());
            
            // Set up real-time updates
            this.setupPlayerListener();
            
        } catch (error) {
            console.error('Error showing player game:', error);
            this.showNotification('Error loading game');
        }
    }

    setupPlayerListener() {
        db.collection('rooms').doc(this.currentRoom)
            .collection('players').doc(this.currentUser.nickname)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const playerData = doc.data();
                    const markedCells = playerData.markedCells || [];
                    const pendingMarks = playerData.pendingMarks || [];
                    
                    // Update UI based on changes
                    document.querySelectorAll('.bingo-cell').forEach(cell => {
                        const index = parseInt(cell.dataset.index);
                        
                        // Reset classes
                        cell.classList.remove('marked', 'pending');
                        cell.style.backgroundColor = '';
                        cell.innerHTML = playerData.bingoGrid[index];
                        
                        if (markedCells.includes(index)) {
                            cell.classList.add('marked');
                        } else if (pendingMarks.includes(index)) {
                            cell.classList.add('pending');
                            cell.style.backgroundColor = '#FFA000';
                            cell.innerHTML = playerData.bingoGrid[index] + 
                                '<div style="font-size: 0.8em; margin-top: 5px;">Pending approval</div>';
                        }
                    });
                    
                    // Check for bingo
                    const hasBingo = this.checkBingo(markedCells, this.bingoSize);
                    
                    // Update bingo notification
                    const bingoNotification = document.querySelector('.container > div');
                    
                    if (hasBingo && !bingoNotification) {
                        const notificationDiv = document.createElement('div');
                        notificationDiv.style.backgroundColor = '#FF4081';
                        notificationDiv.style.color = 'white';
                        notificationDiv.style.padding = '1rem';
                        notificationDiv.style.borderRadius = '8px';
                        notificationDiv.style.marginBottom = '1rem';
                        
                        notificationDiv.innerHTML = `<h2 style="margin: 0;">BINGO! 🎉</h2>`;
                        
                        const container = document.querySelector('.container');
                        container.insertBefore(notificationDiv, container.firstChild.nextSibling.nextSibling);
                    } else if (!hasBingo && bingoNotification) {
                        bingoNotification.remove();
                    }
                }
            });
    }

    async markCell(index) {
        try {
            const playerRef = db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(this.currentUser.nickname);
                
            const playerDoc = await playerRef.get();
            const playerData = playerDoc.data();
            
            const pendingMarks = playerData.pendingMarks || [];
            
            // Add to pending
            const updatedPending = [...pendingMarks, index];
            
            await playerRef.update({
                pendingMarks: updatedPending
            });
            
            this.showNotification('Marked! Waiting for admin approval.');
            
        } catch (error) {
            console.error('Error marking cell:', error);
            this.showNotification('Error marking cell');
        }
    }

    checkBingo(markedCells, size) {
        if (markedCells.length < size) {
            return false;
        }
        
        // Convert to 2D array for easier checking
        const grid = Array(size).fill().map(() => Array(size).fill(false));
        
        markedCells.forEach(index => {
            const row = Math.floor(index / size);
            const col = index % size;
            grid[row][col] = true;
        });
        
        // Check rows
        for (let row = 0; row < size; row++) {
            if (grid[row].every(cell => cell)) {
                return true;
            }
        }
        
        // Check columns
        for (let col = 0; col < size; col++) {
            if (grid.every(row => row[col])) {
                return true;
            }
        }
        
        // Check diagonal 1
        if (grid.every((row, i) => row[i])) {
            return true;
        }
        
        // Check diagonal 2
        if (grid.every((row, i) => row[size - 1 - i])) {
            return true;
        }
        
        return false;
    }

    leaveRoom() {
        sessionStorage.removeItem('streamBingoUser');
        this.currentUser = null;
        this.currentRoom = null;
        this.isAdmin = false;
        this.selectedPlayer = null;
        this.bingoWords = [];
        this.bingoGrid = [];
        this.showWelcomeScreen();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

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
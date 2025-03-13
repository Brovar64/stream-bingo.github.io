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

        // Add debug logging
        this.debug = true;
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

            // Create room in Firebase with new data structure
            await db.collection('rooms').doc(roomCode).set({
                adminId: nickname,
                gridSize: gridSize,
                words: [],
                approvedWords: [],  // New: tracks approved word indexes
                pendingWords: {},   // New: maps word indexes to arrays of player names
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

        this.log('Joining room:', roomCode, 'as', nickname);

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
            const approvedWords = roomData.approvedWords || [];
            const pendingWords = roomData.pendingWords || {};

            // Generate HTML for the bingo words
            let wordsHTML = '';

            if (this.bingoWords.length > 0) {
                wordsHTML = `
                <div class="words-container" style="margin-top: 1rem;">
                    <h3 style="margin-bottom: 1rem;">Bingo Words</h3>
                    <div class="bingo-words-grid">
                        ${this.bingoWords.map((word, index) => {
                    const isApproved = approvedWords.includes(index);
                    const pendingPlayers = pendingWords[index] || [];

                    return `
                                <div class="bingo-word ${isApproved ? 'approved' : ''}" 
                                     data-index="${index}" data-word="${word}">
                                    <span class="word-text">${word}</span>
                                    
                                    ${isApproved ?
                        '<span class="approved-indicator">✓</span>' : ''}
                                    
                                    ${pendingPlayers.length > 0 ?
                        `<div class="player-indicators">
                                            ${pendingPlayers.map(player =>
                            `<div class="player-icon" title="${player}">${player.charAt(0).toUpperCase()}</div>`
                        ).join('')}
                                        </div>` : ''}
                                </div>
                            `;
                }).join('')}
                    </div>
                </div>
            `;
            } else {
                wordsHTML = `
                <h3>Add Bingo Words</h3>
                <p style="margin-bottom: 1rem;">You need at least ${this.bingoSize * this.bingoSize} words for the bingo cards.</p>
                
                <div class="form-group">
                    <label for="bingoWords">Enter one word or phrase per line:</label>
                    <textarea id="bingoWords" class="form-control" rows="10" placeholder="Enter bingo words here, one per line"></textarea>
                </div>
                
                <button id="saveWords" class="btn btn-primary">Save Words</button>
            `;
            }

            // Generate the full admin UI
            this.app.innerHTML = `
            <div class="container">
                <h1 class="title">Admin Dashboard</h1>
                <p class="subtitle">Room Code: <strong>${this.currentRoom}</strong></p>
                
                <div style="margin-bottom: 2rem;">
                    <div id="wordSetup">
                        ${wordsHTML}
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

            // Add CSS for the new elements
            const style = document.createElement('style');
            style.textContent = `
            .bingo-words-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            
            .bingo-word {
                background-color: #2D2D2D;
                border-radius: 8px;
                padding: 12px;
                position: relative;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .bingo-word:hover {
                background-color: #3A3A3A;
            }
            
            .bingo-word.approved {
                background-color: #4CAF50;
                color: white;
            }
            
            .approved-indicator {
                position: absolute;
                top: 8px;
                right: 8px;
                font-size: 16px;
                font-weight: bold;
            }
            
            .player-indicators {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 8px;
            }
            
            .player-icon {
                width: 24px;
                height: 24px;
                background-color: #FF4081;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
            }
        `;
            document.head.appendChild(style);

            // Add event listeners for bingo words
            if (this.bingoWords.length > 0) {
                document.querySelectorAll('.bingo-word').forEach(wordElement => {
                    wordElement.addEventListener('click', () => {
                        const index = parseInt(wordElement.dataset.index);
                        this.toggleWordApproval(index);
                    });
                });
            } else {
                document.getElementById('saveWords').addEventListener('click', () => this.saveWords());
            }

            document.getElementById('leaveRoom').addEventListener('click', () => this.leaveRoom());

            // Load players list
            this.loadPlayersList();

            // Set up real-time updates
            setTimeout(() => {
                this.setupRoomListener();
                this.setupPlayersListener();
            }, 100);
        } catch (error) {
            console.error('Error showing admin dashboard:', error);
            this.showNotification('Error loading admin dashboard');
        }
    }


    setupRoomListener() {
        console.log('Setting up room listener for real-time updates');

        if (this.roomUnsubscribe) {
            this.roomUnsubscribe();
        }

        this.roomUnsubscribe = db.collection('rooms').doc(this.currentRoom)
            .onSnapshot({
                includeMetadataChanges: true
            }, async (doc) => {
                console.log('Room update received!', new Date().toISOString());

                if (doc.exists) {
                    const roomData = doc.data();

                    // Update bingo words grid
                    const wordElements = document.querySelectorAll('.bingo-word');
                    if (wordElements.length > 0) {
                        const approvedWords = roomData.approvedWords || [];
                        const pendingWords = roomData.pendingWords || {};

                        console.log('Processing room update:',
                            'Approved:', approvedWords.length,
                            'Pending:', Object.keys(pendingWords).length);

                        wordElements.forEach(wordElement => {
                            const index = parseInt(wordElement.dataset.index);
                            const pendingPlayers = pendingWords[index] || [];

                            // Update approved status
                            if (approvedWords.includes(index)) {
                                wordElement.classList.add('approved');
                                if (!wordElement.querySelector('.approved-indicator')) {
                                    const indicator = document.createElement('span');
                                    indicator.className = 'approved-indicator';
                                    indicator.textContent = '✓';
                                    wordElement.appendChild(indicator);
                                }
                            } else {
                                wordElement.classList.remove('approved');
                                const indicator = wordElement.querySelector('.approved-indicator');
                                if (indicator) {
                                    indicator.remove();
                                }
                            }

                            // Update pending players
                            let indicators = wordElement.querySelector('.player-indicators');
                            if (pendingPlayers.length > 0) {
                                if (!indicators) {
                                    indicators = document.createElement('div');
                                    indicators.className = 'player-indicators';
                                    wordElement.appendChild(indicators);
                                }

                                indicators.innerHTML = pendingPlayers.map(player =>
                                    `<div class="player-icon" title="${player}">${player.charAt(0).toUpperCase()}</div>`
                                ).join('');
                            } else if (indicators) {
                                indicators.remove();
                            }
                        });
                    }

                    // IMPORTANT: Update the selected player's view if one is selected
                    if (this.selectedPlayer) {
                        // Get fresh player data for this player
                        const playerDoc = await db.collection('rooms')
                            .doc(this.currentRoom)
                            .collection('players')
                            .doc(this.selectedPlayer)
                            .get();

                        if (playerDoc.exists) {
                            // Update the selected player's view
                            this.updatePlayerBingoCard(this.selectedPlayer, playerDoc.data(), roomData);
                        }
                    }
                }
            }, error => {
                console.error('Error in room listener:', error);
            });
    }

    // Add this method if it's missing
    setupPlayerListener() {
        this.log('Setting up player listener');

        // Listen for changes to the room document (for approved words)
        if (this.roomUnsubscribe) {
            this.roomUnsubscribe();
        }

        // First get the player data to get the bingoGrid
        const playerRef = db.collection('rooms').doc(this.currentRoom)
            .collection('players').doc(this.currentUser.nickname);

        playerRef.get().then(playerDoc => {
            if (playerDoc.exists) {
                const playerData = playerDoc.data();
                this.bingoGrid = playerData.bingoGrid || [];

                // Now listen for room changes
                this.roomUnsubscribe = db.collection('rooms').doc(this.currentRoom)
                    .onSnapshot(roomDoc => {
                        if (roomDoc.exists) {
                            const roomData = roomDoc.data();
                            const approvedWords = roomData.approvedWords || [];
                            const pendingWords = roomData.pendingWords || {};

                            // Update player's grid based on approved words
                            const cells = document.querySelectorAll('.bingo-cell');

                            cells.forEach(cell => {
                                const index = parseInt(cell.dataset.index);
                                const word = this.bingoGrid[index];
                                const wordIndex = roomData.words.indexOf(word);

                                // Reset cell state
                                cell.classList.remove('marked', 'pending');
                                cell.innerHTML = word;

                                // Mark as approved if word is approved
                                if (approvedWords.includes(wordIndex)) {
                                    cell.classList.add('marked');
                                }
                                // Mark as pending if this player has requested it
                                else if (
                                    pendingWords[wordIndex] &&
                                    pendingWords[wordIndex].includes(this.currentUser.nickname)
                                ) {
                                    cell.classList.add('pending');
                                    cell.innerHTML = word +
                                        '<div style="font-size: 0.8em; margin-top: 5px;">Pending approval</div>';
                                }
                            });

                            // Update markedCells for bingo checking
                            const markedCells = [];
                            cells.forEach((cell, index) => {
                                if (cell.classList.contains('marked')) {
                                    markedCells.push(index);
                                }
                            });

                            // Check for bingo
                            const hasBingo = this.checkBingo(markedCells, this.bingoSize);

                            // Update bingo notification
                            const bingoContainer = document.querySelector('.container');
                            let bingoNotification = document.querySelector('.container > div:nth-child(3)');

                            if (bingoNotification && !bingoNotification.textContent.includes('BINGO')) {
                                bingoNotification = null;
                            }

                            if (hasBingo && !bingoNotification) {
                                const notificationDiv = document.createElement('div');
                                notificationDiv.style.backgroundColor = '#FF4081';
                                notificationDiv.style.color = 'white';
                                notificationDiv.style.padding = '1rem';
                                notificationDiv.style.borderRadius = '8px';
                                notificationDiv.style.marginBottom = '1rem';

                                notificationDiv.innerHTML = `<h2 style="margin: 0;">BINGO! 🎉</h2>`;

                                const gridElement = document.querySelector('.bingo-grid');
                                bingoContainer.insertBefore(notificationDiv, gridElement);
                            } else if (!hasBingo && bingoNotification) {
                                bingoNotification.remove();
                            }
                        }
                    });
            }
        }).catch(error => {
            console.error('Error setting up player listener:', error);
        });
    }

// Add/update the log method if needed
    log(...args) {
        if (this.debug) console.log('[StreamBingo]', ...args);
    }

// Make sure constructor includes debug flag


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

            // Get room data for approved words
            const roomDoc = await db.collection('rooms').doc(this.currentRoom).get();
            const roomData = roomDoc.data();

            // Use the new update method
            this.updatePlayerBingoCard(playerId, playerData, roomData);

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
        this.log('Showing player game view');
        try {
            // Get room data first to confirm grid size
            const roomDoc = await db.collection('rooms').doc(this.currentRoom).get();
            if (!roomDoc.exists) {
                this.showNotification('Room not found');
                this.leaveRoom();
                return;
            }

            const roomData = roomDoc.data();
            this.bingoSize = roomData.gridSize;
            this.log('Room found, grid size:', this.bingoSize);

            // Get player data
            const playerRef = db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(this.currentUser.nickname);

            const playerDoc = await playerRef.get();

            if (!playerDoc.exists) {
                this.log('Player not found, creating player entry');
                // Create player if they don't exist
                if (roomData.words && roomData.words.length >= this.bingoSize * this.bingoSize) {
                    // Generate bingo card for the player
                    const shuffledWords = this.shuffleArray([...roomData.words]);
                    this.bingoGrid = shuffledWords.slice(0, this.bingoSize * this.bingoSize);

                    // Create player document
                    await playerRef.set({
                        nickname: this.currentUser.nickname,
                        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        bingoGrid: this.bingoGrid,
                        markedCells: [],
                        pendingMarks: []
                    });
                    this.log('Created new player entry with grid');
                } else {
                    this.showNotification('Room not fully set up yet');
                    this.leaveRoom();
                    return;
                }
            } else {
                const playerData = playerDoc.data();
                this.bingoGrid = playerData.bingoGrid || [];
                this.log('Found existing player data');
            }

            if (!this.bingoGrid || this.bingoGrid.length === 0) {
                this.log('ERROR: No bingo grid available');
                this.showNotification('Error loading bingo card');
                this.leaveRoom();
                return;
            }

            // Get markedCells and pendingMarks
            const latestPlayerDoc = await playerRef.get();
            const playerData = latestPlayerDoc.data();
            const markedCells = playerData.markedCells || [];
            const pendingMarks = playerData.pendingMarks || [];

            // Render player UI
            this.log('Rendering bingo grid with', this.bingoGrid.length, 'cells');
            let gridHTML = `<div class="bingo-grid grid-${this.bingoSize}">`;

            this.bingoGrid.forEach((word, index) => {
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

            // Build the complete UI
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
            this.log('Adding cell click listeners');
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
            this.log('Player view setup complete');

        } catch (error) {
            console.error('Error showing player game:', error);
            this.showNotification('Error loading game');
            setTimeout(() => this.leaveRoom(), 2000);
        }
    }

    async markCell(index) {
        try {
            const playerRef = db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(this.currentUser.nickname);

            const playerDoc = await playerRef.get();
            const playerData = playerDoc.data();

            // Get the word that was clicked
            const word = playerData.bingoGrid[index];

            // Find the word's index in the room's word list
            const roomRef = db.collection('rooms').doc(this.currentRoom);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();

            const wordIndex = roomData.words.indexOf(word);

            if (wordIndex === -1) {
                this.showNotification('Word not found in bingo list');
                return;
            }

            // Check if already approved
            const approvedWords = roomData.approvedWords || [];
            if (approvedWords.includes(wordIndex)) {
                this.showNotification('This word is already approved!');
                return;
            }

            // Add player to pending list for this word
            let pendingWords = roomData.pendingWords || {};
            pendingWords[wordIndex] = pendingWords[wordIndex] || [];

            if (!pendingWords[wordIndex].includes(this.currentUser.nickname)) {
                pendingWords[wordIndex].push(this.currentUser.nickname);
            }

            // Update the room document
            await roomRef.update({
                pendingWords: pendingWords
            });

            // Also update UI immediately for better UX
            const cell = document.querySelector(`.bingo-cell[data-index="${index}"]`);
            if (cell) {
                cell.classList.add('pending');
                cell.innerHTML = word +
                    '<div style="font-size: 0.8em; margin-top: 5px;">Pending approval</div>';
            }

            this.showNotification('Requested approval for: ' + word);

        } catch (error) {
            console.error('Error marking cell:', error);
            this.showNotification('Error requesting approval');
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
        // Clean up listeners
        if (this.playerUnsubscribe) {
            this.playerUnsubscribe();
            this.playerUnsubscribe = null;
        }

        if (this.playersUnsubscribe) {
            this.playersUnsubscribe();
            this.playersUnsubscribe = null;
        }

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

    async toggleWordApproval(wordIndex) {
        try {
            const roomRef = db.collection('rooms').doc(this.currentRoom);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();

            let approvedWords = roomData.approvedWords || [];
            let pendingWords = roomData.pendingWords || {};

            // Toggle approved state
            if (approvedWords.includes(wordIndex)) {
                // Remove from approved
                approvedWords = approvedWords.filter(index => index !== wordIndex);
            } else {
                // Add to approved
                approvedWords.push(wordIndex);

                // Clear any pending requests for this word
                if (pendingWords[wordIndex]) {
                    delete pendingWords[wordIndex];
                }
            }

            // Create updated room data
            const updatedRoomData = {
                ...roomData,
                approvedWords: approvedWords,
                pendingWords: pendingWords
            };

            // Update the word element UI immediately
            const wordElement = document.querySelector(`.bingo-word[data-index="${wordIndex}"]`);
            if (wordElement) {
                if (approvedWords.includes(wordIndex)) {
                    wordElement.classList.add('approved');
                    if (!wordElement.querySelector('.approved-indicator')) {
                        const indicator = document.createElement('span');
                        indicator.className = 'approved-indicator';
                        indicator.textContent = '✓';
                        wordElement.appendChild(indicator);
                    }
                } else {
                    wordElement.classList.remove('approved');
                    const indicator = wordElement.querySelector('.approved-indicator');
                    if (indicator) {
                        indicator.remove();
                    }
                }

                // Remove any pending indicators
                const pendingIndicators = wordElement.querySelector('.player-indicators');
                if (pendingIndicators) {
                    pendingIndicators.remove();
                }
            }

            // If a player is selected, update their card immediately
            if (this.selectedPlayer) {
                const playerDoc = await db.collection('rooms')
                    .doc(this.currentRoom)
                    .collection('players')
                    .doc(this.selectedPlayer)
                    .get();

                if (playerDoc.exists) {
                    const playerData = playerDoc.data();

                    // Update marked cells based on approved words
                    let markedCells = [];
                    const bingoGrid = playerData.bingoGrid || [];

                    bingoGrid.forEach((word, index) => {
                        const wordIdx = this.bingoWords.indexOf(word);
                        if (approvedWords.includes(wordIdx)) {
                            markedCells.push(index);
                        }
                    });

                    // Update the player view immediately
                    this.updatePlayerBingoCard(this.selectedPlayer, {
                        ...playerData,
                        markedCells: markedCells
                    }, updatedRoomData);
                }
            }

            // Now update the database
            await roomRef.update({
                approvedWords: approvedWords,
                pendingWords: pendingWords
            });

            // Update all players' cards
            const playersSnapshot = await db.collection('rooms').doc(this.currentRoom)
                .collection('players').get();

            const batch = db.batch();

            playersSnapshot.forEach(playerDoc => {
                const playerData = playerDoc.data();
                const bingoGrid = playerData.bingoGrid || [];

                // Find which cells in this player's grid match the approved words
                let markedCells = [];
                bingoGrid.forEach((word, index) => {
                    // If this cell's word index is in the approved list
                    if (approvedWords.includes(this.bingoWords.indexOf(word))) {
                        markedCells.push(index);
                    }
                });

                batch.update(playerDoc.ref, {
                    markedCells: markedCells
                });
            });

            await batch.commit();

            const word = this.bingoWords[wordIndex];
            this.showNotification(`${approvedWords.includes(wordIndex) ? 'Approved' : 'Unapproved'}: ${word}`);
        } catch (error) {
            console.error('Error toggling word approval:', error);
            this.showNotification('Error updating word status');
        }
    }

    updatePlayerBingoCard(playerId, playerData, roomData) {
        const playerView = document.getElementById('selectedPlayerView');

        // If no player view, return
        if (!playerView) return;

        const bingoGrid = playerData.bingoGrid || [];
        const markedCells = playerData.markedCells || [];
        const approvedWords = roomData.approvedWords || [];
        const pendingWords = roomData.pendingWords || {};

        // Check which cells should be marked based on approved words
        const shouldBeMarked = [];
        bingoGrid.forEach((word, index) => {
            const wordIndex = this.bingoWords.indexOf(word);
            if (approvedWords.includes(wordIndex)) {
                shouldBeMarked.push(index);
            }
        });

        // Find which cells have pending approval
        const hasPendingApproval = [];
        bingoGrid.forEach((word, index) => {
            const wordIndex = this.bingoWords.indexOf(word);
            const pendingPlayers = pendingWords[wordIndex] || [];
            if (pendingPlayers.includes(playerId)) {
                hasPendingApproval.push(index);
            }
        });

        let gridHTML = `
        <h3>${playerId}'s Bingo Card</h3>
        <div class="bingo-grid grid-${this.bingoSize}" style="margin-top: 1rem; margin-bottom: 1rem;">
    `;

        bingoGrid.forEach((word, index) => {
            const isMarked = shouldBeMarked.includes(index);
            const isPending = hasPendingApproval.includes(index);

            gridHTML += `
            <div class="bingo-cell ${isMarked ? 'marked' : ''} ${isPending ? 'pending' : ''}" 
                 data-index="${index}" data-player="${playerId}">
                ${word}
                ${isPending ? `
                    <div style="font-size: 0.8em; margin-top: 5px;">Pending approval</div>
                ` : ''}
            </div>
        `;
        });

        gridHTML += `</div>`;

        // Check if player has bingo
        const hasBingo = this.checkBingo(shouldBeMarked, this.bingoSize);

        if (hasBingo) {
            gridHTML += `
            <div style="background-color: #FF4081; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h3 style="margin: 0;">BINGO! 🎉</h3>
            </div>
        `;
        }

        playerView.innerHTML = gridHTML;
    }

}
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
        this.debug = true;
        this.log = (...args) => {
            if (this.debug) console.log('[StreamBingo]', ...args);
        };
        this.auth = window.authManager || null;
    }

    init() {
        // Check if user is logged in
        if (this.auth && this.auth.isLoggedIn()) {
            this.showDashboard();
        } else {
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
                    <img src="img/twitch-icon.png" alt="Twitch" style="width: 24px; margin-right: 8px;"> 
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
            if (this.auth) this.auth.loginWithTwitch();
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
        const username = this.auth ? this.auth.getUsername() : 'User';
        const profileImage = this.auth && this.auth.getProfileImage();

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
    }

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
                approvedWords: [],
                pendingWords: {},
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp() // Add this line
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
        this.updateRoomActivity();
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

            // Generate the full admin UI - with sort controls already in the players list
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
                                <div class="sort-controls">
                                    <span>Sort by:</span>
                                    <button id="sortByName" class="btn-sort">Name</button>
                                    <button id="sortByScore" class="btn-sort active">Score</button>
                                </div>
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

            // Add CSS for the bingo words grid if needed
            const style = document.createElement('style');
            style.textContent = `
            /* Add this to your existing CSS */
            .bingo-cell.pending {
                background-color: #FFA000;
                position: relative;
            }
            
            .bingo-cell.pending:after {
                content: 'Pending approval';
                position: absolute;
                bottom: 5px;
                left: 0;
                right: 0;
                font-size: 0.65rem;
                font-weight: normal;
                opacity: 0.9;
            }
            
            .bingo-cell {
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;
                min-height: 80px;
            }
            
            .bingo-cell.marked {
                background-color: #FF4081;
                color: white;
            }
            
            /* Updated styles for bingo words */
            .bingo-words-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 10px;
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

            // Add event listeners for sort buttons AFTER the DOM is created
            document.getElementById('sortByName').addEventListener('click', () => {
                this.sortPlayers('name');
            });

            document.getElementById('sortByScore').addEventListener('click', () => {
                this.sortPlayers('score');
            });

            document.getElementById('leaveRoom').addEventListener('click', () => this.leaveRoom());

            // Set up real-time listeners after DOM is ready
            setTimeout(() => {
                this.setupRoomListener();
                this.setupPlayersListener();
                this.checkInactiveRooms(); // Check for inactive rooms
            }, 100);

        } catch (error) {
            console.error('Error showing admin dashboard:', error);
            this.showNotification('Error loading admin dashboard');
        }
    }

    sortPlayers(sortBy) {
        const playersList = document.getElementById('playersList');
        if (!playersList) return;

        const sortButtons = document.querySelectorAll('.btn-sort');

        // Update active button
        sortButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        if (sortBy === 'name') {
            document.getElementById('sortByName').classList.add('active');
        } else {
            document.getElementById('sortByScore').classList.add('active');
        }

        // Get all player items (skip the sort controls)
        const sortControls = playersList.querySelector('.sort-controls');
        const playerItems = Array.from(document.querySelectorAll('.player-item'));

        // Skip if we don't have players yet
        if (playerItems.length === 0 || !sortControls) return;

        // Sort players
        playerItems.sort((a, b) => {
            if (sortBy === 'name') {
                return a.querySelector('.player-name').textContent.localeCompare(
                    b.querySelector('.player-name').textContent
                );
            } else {
                // Sort by bingo first
                const aHasBingo = a.querySelector('.score.bingo') !== null;
                const bHasBingo = b.querySelector('.score.bingo') !== null;

                if (aHasBingo && !bHasBingo) return -1;
                if (!aHasBingo && bHasBingo) return 1;

                // Then by score
                if (!aHasBingo && !bHasBingo) {
                    const aScore = a.querySelector('.score').textContent.split('/');
                    const bScore = b.querySelector('.score').textContent.split('/');

                    return parseInt(bScore[0]) - parseInt(aScore[0]);
                }

                return 0;
            }
        });

        // Save the sort controls
        const tempControls = sortControls.cloneNode(true);

        // Clear the list
        playersList.innerHTML = '';

        // Add back the sort controls
        playersList.appendChild(tempControls);

        // Restore sort button event listeners
        playersList.querySelector('#sortByName').addEventListener('click', () => {
            this.sortPlayers('name');
        });

        playersList.querySelector('#sortByScore').addEventListener('click', () => {
            this.sortPlayers('score');
        });

        // Add sorted players
        playerItems.forEach(item => {
            playersList.appendChild(item);
        });
    }

    async deletePlayer(playerId) {
        if (!confirm(`Are you sure you want to remove player "${playerId}"?`)) {
            return;
        }

        try {
            // Delete player document
            await db.collection('rooms').doc(this.currentRoom)
                .collection('players').doc(playerId).delete();

            // Clean up pending words requests from this player
            const roomRef = db.collection('rooms').doc(this.currentRoom);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();

            let pendingWords = roomData.pendingWords || {};
            let hasChanges = false;

            // Remove player from all pending word requests
            Object.keys(pendingWords).forEach(wordIndex => {
                const players = pendingWords[wordIndex];
                const updatedPlayers = players.filter(player => player !== playerId);

                if (updatedPlayers.length !== players.length) {
                    pendingWords[wordIndex] = updatedPlayers;
                    hasChanges = true;
                }

                // Remove empty arrays
                if (pendingWords[wordIndex].length === 0) {
                    delete pendingWords[wordIndex];
                }
            });

            if (hasChanges) {
                await roomRef.update({ pendingWords });
            }

            // If this was the selected player, clear the view
            if (this.selectedPlayer === playerId) {
                this.selectedPlayer = null;
                document.getElementById('selectedPlayerView').innerHTML =
                    '<p>Select a player to view their bingo card</p>';
            }

            this.showNotification(`Player "${playerId}" removed`);

            // Refresh the player list
            this.loadPlayersList();
        } catch (error) {
            console.error('Error deleting player:', error);
            this.showNotification('Error removing player');
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

    setupPlayersListener() {
        console.log('Setting up players listener for real-time updates');

        // Clean up existing listener if any
        if (this.playersUnsubscribe) {
            this.playersUnsubscribe();
        }

        // We'll use a separate listener to track all players at once
        this.playersUnsubscribe = db.collection('rooms').doc(this.currentRoom)
            .collection('players')
            .onSnapshot(snapshot => {
                // Process changes in player data
                snapshot.docChanges().forEach(async change => {
                    const playerId = change.doc.id;
                    const playerData = change.doc.data();

                    // Skip processing if we don't have a player list yet
                    const playersList = document.getElementById('playersList');
                    if (!playersList) return;

                    // Get the approved words to calculate scores
                    const roomDoc = await db.collection('rooms').doc(this.currentRoom).get();
                    const roomData = roomDoc.data();
                    const approvedWords = roomData.approvedWords || [];

                    // Calculate player's score
                    const bingoGrid = playerData.bingoGrid || [];
                    const markedCells = [];

                    // Calculate marked cells based on approved words
                    bingoGrid.forEach((word, index) => {
                        const wordIndex = this.bingoWords.indexOf(word);
                        if (approvedWords.includes(wordIndex)) {
                            markedCells.push(index);
                        }
                    });

                    // Check if player has bingo
                    const hasBingo = this.checkBingo(markedCells, this.bingoSize);

                    // Update or add player in the list
                    if (change.type === 'added' || change.type === 'modified') {
                        let playerItem = document.querySelector(`.player-item[data-player-id="${playerId}"]`);

                        // If player doesn't exist in list yet, create it
                        if (!playerItem && change.type === 'added') {
                            playerItem = document.createElement('li');
                            playerItem.className = 'player-item';
                            playerItem.dataset.playerId = playerId;

                            playerItem.addEventListener('click', (e) => {
                                // Skip if the delete button was clicked
                                if (e.target.classList.contains('delete-player')) return;

                                this.showPlayerBingoCard(playerId);

                                // Set active class
                                document.querySelectorAll('.player-item').forEach(i => {
                                    i.classList.remove('active');
                                });
                                playerItem.classList.add('active');
                            });

                            // Add to list
                            playersList.appendChild(playerItem);
                        }

                        // Update the player item content if it exists
                        if (playerItem) {
                            const score = hasBingo ?
                                `<span class="score bingo">BINGO! 🎉</span>` :
                                `<span class="score">${markedCells.length}/${bingoGrid.length}</span>`;

                            playerItem.innerHTML = `
                            <div class="player-info">
                                <span class="player-name">${playerId}</span>
                                ${score}
                            </div>
                            <button class="delete-player" title="Remove player">✕</button>
                        `;

                            // Add delete button event listener
                            const deleteBtn = playerItem.querySelector('.delete-player');
                            if (deleteBtn) {
                                deleteBtn.addEventListener('click', (e) => {
                                    e.stopPropagation(); // Prevent player selection
                                    this.deletePlayer(playerId);
                                });
                            }
                        }

                        // Refresh sort order after updating
                        this.sortPlayers(document.getElementById('sortByScore').classList.contains('active') ? 'score' : 'name');
                    }
                    else if (change.type === 'removed') {
                        // Remove player from list
                        const playerItem = document.querySelector(`.player-item[data-player-id="${playerId}"]`);
                        if (playerItem) {
                            playerItem.remove();
                        }
                    }

                    // Also update selected player card if this is the selected player
                    if (this.selectedPlayer === playerId) {
                        this.showPlayerBingoCard(playerId);
                    }
                });
            });
    }

    log(...args) {
        if (this.debug) console.log('[StreamBingo]', ...args);
    }

    checkInactiveRooms() {
        console.log("Checking for inactive rooms...");

        const threeHoursAgo = new Date();
        threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

        db.collection('rooms')
            .where('lastActive', '<', threeHoursAgo)
            .limit(5) // Process a few at a time
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No inactive rooms found");
                    return;
                }

                console.log(`Found ${snapshot.size} inactive rooms to clean up`);

                snapshot.forEach(async (doc) => {
                    const roomId = doc.id;

                    // Skip if it's the current room
                    if (roomId === this.currentRoom) return;

                    try {
                        // Get all players
                        const playersSnapshot = await db.collection('rooms')
                            .doc(roomId)
                            .collection('players')
                            .get();

                        // Delete all players
                        const batch = db.batch();
                        playersSnapshot.forEach(playerDoc => {
                            batch.delete(playerDoc.ref);
                        });

                        // Delete the room
                        batch.delete(doc.ref);

                        await batch.commit();
                        console.log(`Deleted inactive room: ${roomId}`);
                    } catch (error) {
                        console.error(`Error deleting room ${roomId}:`, error);
                    }
                });
            })
            .catch(error => {
                console.error('Error checking inactive rooms:', error);
            });
    }

    async updateRoomActivity() {
        try {
            await db.collection('rooms').doc(this.currentRoom).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating room activity:', error);
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

            // Get room data for the approved words
            const roomDoc = await db.collection('rooms').doc(this.currentRoom).get();
            const roomData = roomDoc.data();
            const approvedWords = roomData.approvedWords || [];

            // Create an array of player data for sorting
            const players = [];

            snapshot.forEach(doc => {
                const playerData = doc.data();
                const playerId = doc.id;
                const bingoGrid = playerData.bingoGrid || [];
                const markedCells = [];

                // Calculate marked cells based on approved words
                bingoGrid.forEach((word, index) => {
                    const wordIndex = this.bingoWords.indexOf(word);
                    if (approvedWords.includes(wordIndex)) {
                        markedCells.push(index);
                    }
                });

                // Check if player has bingo
                const hasBingo = this.checkBingo(markedCells, this.bingoSize);

                players.push({
                    id: playerId,
                    markedCount: markedCells.length,
                    totalCells: bingoGrid.length,
                    hasBingo: hasBingo
                });
            });

            // Sort players by score (default sort)
            players.sort((a, b) => {
                // Sort by bingo first
                if (a.hasBingo && !b.hasBingo) return -1;
                if (!a.hasBingo && b.hasBingo) return 1;

                // Then by marked count
                return b.markedCount - a.markedCount;
            });

            // Add sorting controls
            playersList.innerHTML = `
            <div class="sort-controls">
                <span>Sort by:</span>
                <button id="sortByName" class="btn-sort">Name</button>
                <button id="sortByScore" class="btn-sort active">Score</button>
            </div>
        `;

            // Add the sorted players
            players.forEach(player => {
                const score = player.hasBingo ?
                    `<span class="score bingo">BINGO! 🎉</span>` :
                    `<span class="score">${player.markedCount}/${player.totalCells}</span>`;

                const playerItem = document.createElement('li');
                playerItem.className = 'player-item';
                playerItem.dataset.playerId = player.id;

                playerItem.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.id}</span>
                    ${score}
                </div>
                <button class="delete-player" title="Remove player">✕</button>
            `;

                playersList.appendChild(playerItem);
            });

            // Add event listeners to players
            document.querySelectorAll('.player-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    // Skip if the delete button was clicked
                    if (e.target.classList.contains('delete-player')) return;

                    const playerId = item.dataset.playerId;
                    this.showPlayerBingoCard(playerId);

                    // Set active class
                    document.querySelectorAll('.player-item').forEach(i => {
                        i.classList.remove('active');
                    });
                    item.classList.add('active');
                });
            });

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-player').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent player selection
                    const playerId = button.closest('.player-item').dataset.playerId;
                    this.deletePlayer(playerId);
                });
            });

            // Add event listeners to sort buttons
            document.getElementById('sortByName').addEventListener('click', () => {
                this.sortPlayers('name');
            });

            document.getElementById('sortByScore').addEventListener('click', () => {
                this.sortPlayers('score');
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

        this.updateRoomActivity();
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
        this.updateRoomActivity();
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
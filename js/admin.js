// js/admin.js - Admin functionality for room management

class AdminController {
    constructor() {
        this.roomListener = null;
    }
    
    async createRoom(roomCode, gridSize) {
        try {
            if (!roomCode) {
                window.showNotification('Please enter a room code');
                return;
            }
            
            if (!window.db) {
                window.showNotification('Database connection not available');
                return;
            }
            
            // Ensure user is authenticated
            const auth = window.authManager;
            if (!auth || !auth.isLoggedIn()) {
                window.showNotification('You must be logged in to create a room');
                return;
            }
            
            // Get the current user's username
            const userId = auth.getUsername();
            
            // Reference to the new room
            const roomRef = window.db.collection('rooms').doc(roomCode);
            
            // First check if the room exists
            const existingRoom = await roomRef.get();
            if (existingRoom.exists) {
                window.showNotification('Room code already exists. Please choose a different code.', 'error');
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
            
            window.showNotification(`Created room ${roomCode} with grid size ${gridSize}x${gridSize}`, 'success');
            
            // Load admin interface for setting up the room
            return roomCode;
        } catch (error) {
            console.error('Error creating room:', error);
            window.showNotification(`Error creating room: ${error.message}`, 'error');
            return null;
        }
    }
    
    async loadAdminRoom(roomId) {
        try {
            // Get room data
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                window.showNotification('Room not found', 'error');
                return null;
            }
            
            const roomData = roomDoc.data();
            return roomData;
        } catch (error) {
            console.error('Error loading admin room:', error);
            window.showNotification(`Error loading admin room: ${error.message}`, 'error');
            return null;
        }
    }
    
    setupRoomListener(roomId, callbackFunction) {
        const roomRef = window.db.collection('rooms').doc(roomId);
        
        // Unsubscribe from previous listener if exists
        if (this.roomListener) {
            this.roomListener();
        }
        
        // Set up new listener
        this.roomListener = roomRef.onSnapshot(doc => {
            if (doc.exists) {
                const roomData = doc.data();
                callbackFunction(roomData);
            }
        }, error => {
            console.error('Error in room listener:', error);
        });
        
        return this.roomListener;
    }
    
    async addWordToRoom(roomId, word) {
        try {
            if (!word) {
                window.showNotification('Please enter a word or phrase', 'error');
                return false;
            }
            
            const roomRef = window.db.collection('rooms').doc(roomId);
            
            // Add word to the words array
            await roomRef.update({
                words: firebase.firestore.FieldValue.arrayUnion(word)
            });
            
            window.showNotification(`Added "${word}" to the word list`, 'success');
            return true;
        } catch (error) {
            console.error('Error adding word:', error);
            window.showNotification(`Error adding word: ${error.message}`, 'error');
            return false;
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
                window.showNotification(`Removed "${wordToRemove}" from the word list`, 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting word:', error);
            window.showNotification(`Error deleting word: ${error.message}`, 'error');
            return false;
        }
    }
    
    async startGame(roomId) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            if (roomData.status === 'active') {
                window.showNotification('Game is already started', 'error');
                return false;
            }
            
            if ((roomData.words || []).length < roomData.gridSize * roomData.gridSize) {
                window.showNotification(`Need at least ${roomData.gridSize * roomData.gridSize} words to start the game`, 'error');
                return false;
            }
            
            // Update room status to active
            await roomRef.update({
                status: 'active',
                startedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            window.showNotification('Game started successfully!', 'success');
            
            // Assign random words to each player's grid
            await this.assignPlayerGrids(roomId);
            return true;
        } catch (error) {
            console.error('Error starting game:', error);
            window.showNotification(`Error starting game: ${error.message}`, 'error');
            return false;
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
                window.showNotification(`Not enough words for the grid size (${totalCells} needed)`, 'error');
                return false;
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
            window.showNotification('Assigned bingo grids to all players', 'success');
            return true;
        } catch (error) {
            console.error('Error assigning player grids:', error);
            window.showNotification(`Error assigning player grids: ${error.message}`, 'error');
            return false;
        }
    }
    
    async approvePlayerMark(roomId, approvalIndex) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            const pendingApprovals = [...(roomData.pendingApprovals || [])];
            if (approvalIndex < 0 || approvalIndex >= pendingApprovals.length) {
                window.showNotification('Invalid approval index', 'error');
                return false;
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
                    
                    window.showNotification(`Approved ${playerName}'s mark`, 'success');
                    
                    // Check if player has achieved bingo
                    const hasBingo = this.checkForBingo(playerGrid, roomData.gridSize);
                    if (hasBingo) {
                        window.showNotification(`${playerName} has BINGO!`, 'success');
                        
                        // Update room with bingo winner
                        await roomRef.update({
                            bingoWinners: firebase.firestore.FieldValue.arrayUnion(playerName)
                        });
                    }
                    
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error approving mark:', error);
            window.showNotification(`Error approving mark: ${error.message}`, 'error');
            return false;
        }
    }
    
    async rejectPlayerMark(roomId, approvalIndex) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            const pendingApprovals = [...(roomData.pendingApprovals || [])];
            if (approvalIndex < 0 || approvalIndex >= pendingApprovals.length) {
                window.showNotification('Invalid approval index', 'error');
                return false;
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
                    
                    window.showNotification(`Rejected ${playerName}'s mark`, 'success');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error rejecting mark:', error);
            window.showNotification(`Error rejecting mark: ${error.message}`, 'error');
            return false;
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
    
    async deleteRoom(roomId) {
        try {
            const auth = window.authManager;
            const userId = auth.getUsername();
            const roomRef = window.db.collection('rooms').doc(roomId);
            
            // Check if room exists and belongs to user
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) {
                window.showNotification('Room not found.', 'error');
                return false;
            }
            
            const roomData = roomDoc.data();
            if (roomData.creatorId !== userId) {
                window.showNotification('You do not have permission to delete this room.', 'error');
                return false;
            }
            
            // Delete room
            await roomRef.delete();
            window.showNotification(`Room ${roomId} deleted successfully.`, 'success');
            return true;
        } catch (error) {
            console.error('Error deleting room:', error);
            window.showNotification(`Error deleting room: ${error.message}`, 'error');
            return false;
        }
    }
    
    async loadUserRooms() {
        try {
            const auth = window.authManager;
            const userId = auth.getUsername();
            
            if (!window.db) {
                return null;
            }
            
            const roomsRef = window.db.collection('rooms').where('creatorId', '==', userId);
            const snapshot = await roomsRef.get();
            
            if (snapshot.empty) {
                return [];
            }
            
            // Convert snapshot to array of room data
            const rooms = [];
            snapshot.forEach(doc => {
                rooms.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return rooms;
        } catch (error) {
            console.error('Error loading rooms:', error);
            window.showNotification(`Failed to load your rooms: ${error.message}`, 'error');
            return null;
        }
    }
}

// Export globally
window.adminController = new AdminController();
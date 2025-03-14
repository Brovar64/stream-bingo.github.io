// js/player.js - Player functionality for joining rooms and marking bingo cells

class PlayerController {
    constructor() {
        this.roomListener = null;
    }
    
    async joinRoom(nickname, roomCode) {
        try {
            if (!nickname) {
                window.showNotification('Please enter your nickname', 'error');
                return null;
            }
            
            if (!roomCode) {
                window.showNotification('Please enter a room code', 'error');
                return null;
            }
            
            if (!window.db) {
                window.showNotification('Database connection not available', 'error');
                return null;
            }
            
            // Get room reference
            const roomRef = window.db.collection('rooms').doc(roomCode);
            
            // Check if room exists
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) {
                window.showNotification(`Room ${roomCode} not found`, 'error');
                return null;
            }
            
            // Get room data
            const roomData = roomDoc.data();
            
            // Check if room is active
            if (!roomData.active) {
                window.showNotification('This room is no longer active', 'error');
                return null;
            }
            
            // Add player to the room if not already present
            const playerExists = (roomData.players || []).some(player => player.nickname === nickname);
            
            if (!playerExists) {
                // Create player data
                const playerData = {
                    nickname: nickname,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add to players array
                const players = [...(roomData.players || []), playerData];
                
                // Update room
                await roomRef.set({ players }, { merge: true });
                window.showNotification(`Joined room ${roomCode} as ${nickname}`, 'success');
            } else {
                window.showNotification(`Resumed session in room ${roomCode} as ${nickname}`, 'success');
            }
            
            return roomData;
        } catch (error) {
            console.error('Error joining room:', error);
            window.showNotification(`Error joining room: ${error.message}`, 'error');
            return null;
        }
    }
    
    setupRoomListener(roomId, callbackFunction) {
        // Clean up previous listener if exists
        if (this.roomListener) {
            this.roomListener();
        }
        
        // Set up new listener
        const roomRef = window.db.collection('rooms').doc(roomId);
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
    
    async markCell(roomId, playerName, row, col) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                window.showNotification('Room not found', 'error');
                return false;
            }
            
            const roomData = roomDoc.data();
            
            // Check if the game is in active status
            if (roomData.status !== 'active') {
                window.showNotification('Cannot mark cells - game is not active', 'error');
                return false;
            }
            
            // Check if player exists in the room
            const playerExists = (roomData.players || []).some(player => player.nickname === playerName);
            if (!playerExists) {
                window.showNotification('You are not registered in this room', 'error');
                return false;
            }
            
            // Check if player's grid exists
            if (!roomData.playerGrids || !roomData.playerGrids[playerName]) {
                window.showNotification('Your bingo grid is not ready yet', 'error');
                return false;
            }
            
            // Get the cell in question
            const cellKey = `${row}_${col}`;
            const grid = roomData.playerGrids[playerName];
            
            if (!grid[cellKey]) {
                window.showNotification('Invalid cell selection', 'error');
                return false;
            }
            
            // If cell is already marked, don't allow changing
            if (grid[cellKey].marked) {
                window.showNotification('This cell is already marked', 'info');
                return false;
            }
            
            // Create a copy of player grids to update
            const playerGrids = JSON.parse(JSON.stringify(roomData.playerGrids));
            
            // Update the cell as marked but pending approval
            playerGrids[playerName][cellKey].marked = true;
            
            // Create approval request for admin
            const pendingApprovals = [...(roomData.pendingApprovals || [])];
            
            // Check if approval already exists
            const approvalExists = pendingApprovals.some(
                approval => approval.playerName === playerName && approval.row === row && approval.col === col
            );
            
            if (!approvalExists) {
                pendingApprovals.push({
                    playerName: playerName,
                    row: row,
                    col: col,
                    word: grid[cellKey].word,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Update room data
            await roomRef.set({
                playerGrids: playerGrids,
                pendingApprovals: pendingApprovals
            }, { merge: true });
            
            window.showNotification('Cell marked! Waiting for admin approval.', 'success');
            return true;
        } catch (error) {
            console.error('Error marking cell:', error);
            window.showNotification(`Error marking cell: ${error.message}`, 'error');
            return false;
        }
    }
}

// Export globally
window.playerController = new PlayerController();
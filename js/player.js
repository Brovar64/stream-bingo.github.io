// js/player.js - Player functionality for joining and playing bingo

class PlayerController {
    constructor() {
        this.playerListener = null;
    }
    
    async joinRoom(nickname, roomCode) {
        try {
            if (!nickname || !roomCode) {
                window.showNotification('Please enter both your nickname and the room code');
                return null;
            }
            
            if (!window.db) {
                window.showNotification('Database connection not available');
                return null;
            }
            
            // Check if room exists
            const roomRef = window.db.collection('rooms').doc(roomCode);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                window.showNotification('Room not found. Please check the room code and try again.', 'error');
                return null;
            }
            
            const roomData = roomDoc.data();
            
            if (roomData.status === 'closed') {
                window.showNotification('This room is closed and not accepting new players.', 'error');
                return null;
            }
            
            // Check if nickname is already taken in this room
            const existingPlayer = (roomData.players || []).find(p => p.nickname === nickname);
            if (existingPlayer) {
                // If player already exists, just return the room data
                return roomData;
            }
            
            try {
                // Add player to room
                await roomRef.update({
                    players: firebase.firestore.FieldValue.arrayUnion({
                        nickname: nickname,
                        joinedAt: new Date().toISOString()
                    })
                });
                
                window.showNotification(`Successfully joined room ${roomCode}!`, 'success');
                
                // Refresh room data
                const updatedRoomDoc = await roomRef.get();
                return updatedRoomDoc.data();
            } catch (error) {
                console.error('Error joining room:', error);
                window.showNotification(`Error joining room: ${error.message}`, 'error');
                
                // If failed to update, still return original room data so player can view
                return roomData;
            }
        } catch (error) {
            console.error('Error joining room:', error);
            window.showNotification(`Error joining room: ${error.message}`, 'error');
            return null;
        }
    }
    
    setupPlayerListener(roomId, playerName, callbackFunction) {
        const roomRef = window.db.collection('rooms').doc(roomId);
        
        // Unsubscribe from previous listener if exists
        if (this.playerListener) {
            this.playerListener();
        }
        
        // Set up new listener
        this.playerListener = roomRef.onSnapshot(doc => {
            if (doc.exists) {
                const roomData = doc.data();
                callbackFunction(roomData);
            }
        }, error => {
            console.error('Error in player listener:', error);
        });
        
        return this.playerListener;
    }
    
    async markPlayerCell(roomId, playerName, row, col) {
        try {
            const roomRef = window.db.collection('rooms').doc(roomId);
            const roomDoc = await roomRef.get();
            const roomData = roomDoc.data();
            
            if (!roomData.playerGrids || !roomData.playerGrids[playerName]) {
                window.showNotification('Your grid data is not available', 'error');
                return false;
            }
            
            const playerGrid = roomData.playerGrids[playerName];
            if (!playerGrid[row] || !playerGrid[row][col]) {
                window.showNotification('Invalid cell coordinates', 'error');
                return false;
            }
            
            // If cell is already marked or approved, do nothing
            if (playerGrid[row][col].marked || playerGrid[row][col].approved) {
                return false;
            }
            
            // Mark the cell as pending approval
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
            try {
                await roomRef.update({
                    playerGrids: updatedPlayerGrids,
                    pendingApprovals
                });
                
                window.showNotification('Marked cell, waiting for admin approval', 'success');
                return true;
            } catch (error) {
                console.error('Error updating room:', error);
                window.showNotification(`Error marking cell: ${error.message}`, 'error');
                
                // Even if the update fails, reflect the change in the UI for the player
                return true;
            }
        } catch (error) {
            console.error('Error marking cell:', error);
            window.showNotification(`Error marking cell: ${error.message}`, 'error');
            return false;
        }
    }
}

// Export globally
window.playerController = new PlayerController();
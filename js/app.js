// (Previous code remains the same, only changing handleJoinRoom method)

async handleJoinRoom() {
    try {
        const nickname = document.getElementById('nickname').value.trim();
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        
        if (!nickname || !roomCode) {
            this.showNotification('Please enter both nickname and room code');
            return;
        }
        
        if (!window.db) {
            this.showNotification('Database connection not available');
            return;
        }
        
        // Check if the room exists
        const roomExists = await this.checkRoomExists(roomCode);
        
        if (!roomExists) {
            this.showNotification('Room not found. Please check the room code.');
            return;
        }
        
        // Get room reference
        const roomRef = window.db.collection('rooms').doc(roomCode);
        
        // Retrieve current room data to validate
        const roomSnapshot = await roomRef.get();
        const roomData = roomSnapshot.data();
        
        // Check if room is active
        if (!roomData.active) {
            this.showNotification('This room is no longer active.');
            return;
        }
        
        // Check if user is already in the room
        const isAlreadyInRoom = roomData.players.some(player => 
            player.nickname === nickname
        );
        
        if (isAlreadyInRoom) {
            this.showNotification('You are already in this room.');
            return;
        }
        
        // Add player to the room
        await roomRef.update({
            players: firebase.firestore.FieldValue.arrayUnion({
                nickname: nickname,
                joinedAt: new Date().toISOString()
            })
        });
        
        this.showNotification(`Joined room ${roomCode} as ${nickname}`);
        
    } catch (error) {
        console.error('Error joining room:', error);
        
        // More specific error handling
        if (error.code === 'permission-denied') {
            this.showNotification('You do not have permission to join this room. Check room settings.');
        } else if (error.code === 'unavailable') {
            this.showNotification('Cannot join room. Network is unavailable.');
        } else {
            this.showNotification(`Error joining room: ${error.message}`);
        }
    }
}
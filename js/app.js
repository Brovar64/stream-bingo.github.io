// (Previous class code remains the same, only modifying createRoom method)

async createRoom() {
    try {
        const nickname = document.getElementById('nickname').value.trim();
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        const gridSize = parseInt(document.getElementById('gridSize').value);
        
        if (!nickname || !roomCode) {
            this.showNotification('Please enter both nickname and room code');
            return;
        }
        
        if (!window.db) {
            this.showNotification('Database connection not available');
            return;
        }
        
        // Ensure user is authenticated
        if (!this.auth || !this.auth.isLoggedIn()) {
            this.showNotification('You must be logged in to create a room');
            return;
        }
        
        // Get the current user's username
        const userId = this.auth.getUsername();
        
        // Reference to user's room count document
        const userRoomCountRef = window.db.collection('user_room_counts').doc(userId);
        
        // Reference to the new room
        const roomRef = window.db.collection('rooms').doc(roomCode);
        
        // Use a transaction to ensure atomic operations
        await window.db.runTransaction(async (transaction) => {
            // Get current room count
            const userRoomCountDoc = await transaction.get(userRoomCountRef);
            const currentCount = userRoomCountDoc.exists 
                ? (userRoomCountDoc.data().room_count || 0)
                : 0;
            
            // Check room count limit
            if (currentCount >= 5) {
                throw new Error('Room creation limit reached. Maximum 5 rooms per user.');
            }
            
            // Check if room already exists
            const roomDoc = await transaction.get(roomRef);
            if (roomDoc.exists) {
                throw new Error('Room code already exists. Please choose a different code.');
            }
            
            // Create room data
            const roomData = {
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                gridSize: gridSize,
                creatorId: userId,
                creatorNickname: nickname,
                active: true,
                status: 'waiting',
                players: [{
                    nickname: nickname,
                    joinedAt: new Date().toISOString()
                }]
            };
            
            // Create room and update room count in the same transaction
            transaction.set(roomRef, roomData);
            transaction.set(userRoomCountRef, 
                { room_count: currentCount + 1 }, 
                { merge: true }
            );
        });
        
        this.showNotification(`Created room ${roomCode} with grid size ${gridSize}x${gridSize}`);
    } catch (error) {
        console.error('Error creating room:', error);
        
        // More specific error handling
        if (error.message.includes('Room creation limit reached')) {
            this.showNotification('You have reached the maximum of 5 rooms. Delete an existing room to create a new one.');
        } else if (error.message.includes('Room code already exists')) {
            this.showNotification('Room code already exists. Please choose a different code.');
        } else if (error.code === 'permission-denied') {
            this.showNotification('You do not have permission to create a room.');
        } else if (error.code === 'unavailable') {
            this.showNotification('Cannot create room. Network is unavailable.');
        } else {
            this.showNotification(`Error creating room: ${error.message}`);
        }
    }
}
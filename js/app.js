// Modify the checkRoomExists method
async checkRoomExists(roomCode) {
    try {
        // Ensure Firestore is available
        if (!window.db) {
            console.error('Firestore is not available');
            this.showNotification('Database connection not available');
            return false;
        }
        
        console.log(`Checking if room ${roomCode} exists...`);
        
        // Use a more robust room existence check
        const roomRef = window.db.collection('rooms').doc(roomCode);
        const roomDoc = await roomRef.get();
        
        console.log(`Room ${roomCode} exists:`, roomDoc.exists);
        return roomDoc.exists;
    } catch (error) {
        console.error('Error checking room:', error);
        
        // More detailed error handling
        if (error.code === 'unavailable') {
            this.showNotification('Network is offline. Please check your connection.');
        } else if (error.code === 'permission-denied') {
            this.showNotification('Access denied. Check your Firestore rules.');
        } else {
            this.showNotification(`Error checking room: ${error.message}`);
        }
        
        return false;
    }
}

// Modify the createRoom method
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
        
        // Check if room already exists with more robust error handling
        const roomExists = await this.checkRoomExists(roomCode);
        
        if (roomExists) {
            this.showNotification('Room code already exists. Please choose a different code.');
            return;
        }
        
        // Create room with additional metadata
        const roomData = {
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            gridSize: gridSize,
            creatorId: this.auth ? this.auth.getUsername() : nickname,
            creatorNickname: nickname,
            active: true,
            status: 'waiting', // Add a status field
            players: [] // Initialize empty players array
        };
        
        // Use set with merge: false to ensure we don't accidentally overwrite
        await window.db.collection('rooms').doc(roomCode).set(roomData, { merge: false });
        
        this.showNotification(`Created room ${roomCode} with grid size ${gridSize}x${gridSize}`);
        
        // Optional: Additional setup for the room
        
    } catch (error) {
        console.error('Error creating room:', error);
        
        // More specific error handling
        if (error.code === 'permission-denied') {
            this.showNotification('You do not have permission to create a room.');
        } else if (error.code === 'unavailable') {
            this.showNotification('Cannot create room. Network is unavailable.');
        } else {
            this.showNotification(`Error creating room: ${error.message}`);
        }
    }
}

// Modify the handleJoinRoom method
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
        
        // Add player to the room
        await roomRef.update({
            players: firebase.firestore.FieldValue.arrayUnion({
                nickname: nickname,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
        });
        
        this.showNotification(`Joined room ${roomCode} as ${nickname}`);
        
    } catch (error) {
        console.error('Error joining room:', error);
        
        // More specific error handling
        if (error.code === 'permission-denied') {
            this.showNotification('You do not have permission to join this room.');
        } else if (error.code === 'unavailable') {
            this.showNotification('Cannot join room. Network is unavailable.');
        } else {
            this.showNotification(`Error joining room: ${error.message}`);
        }
    }
}
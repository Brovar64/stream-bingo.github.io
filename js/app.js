    async checkRoomExists(roomCode) {
        try {
            // Use window.db instead of db
            const roomDoc = await window.db.collection('rooms').doc(roomCode).get();
            return roomDoc.exists;
        } catch (error) {
            console.error('Error checking room:', error);
            return false;
        }
    }
    async checkRoomExists(roomCode) {
        try {
            const roomDoc = await db.collection('rooms').doc(roomCode).get();
            return roomDoc.exists;
        } catch (error) {
            console.error('Error checking room:', error);
            return false;
        }
    }
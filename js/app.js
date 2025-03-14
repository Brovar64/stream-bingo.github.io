    async checkRoomExists(roomCode) {
        try {
            console.log('Checking if room exists:', roomCode);
            console.log('Firestore instance available:', !!window.db);
            
            // Make sure Firebase is initialized
            if (!window.db) {
                console.error('Firestore is not initialized');
                this.showNotification('Database not available. Please try again later.');
                return false;
            }
            
            try {
                // Test the Firestore connection first
                const testDoc = await window.db.collection('_connection_test').doc('test').get();
                console.log('Firestore connection test successful');
            } catch (connectionError) {
                console.error('Firestore connection test failed:', connectionError);
                this.showNotification('Cannot connect to the database. Please check your internet connection.');
                return false;
            }
            
            // Now try to get the actual room
            const roomDoc = await window.db.collection('rooms').doc(roomCode).get();
            console.log('Room document retrieved, exists:', roomDoc.exists);
            return roomDoc.exists;
        } catch (error) {
            console.error('Error checking room:', error);
            
            // More detailed error handling
            if (error.code === 'unavailable') {
                this.showNotification('Cannot connect to the server. Please check your internet connection.');
            } else if (error.code === 'permission-denied') {
                this.showNotification('Access denied. You do not have permission to access this room.');
            } else {
                this.showNotification('Error checking room: ' + error.message);
            }
            
            return false;
        }
    }
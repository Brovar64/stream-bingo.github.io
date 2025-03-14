// js/config.js - Firebase configuration and initialization

// Initialize Firebase - ensure this runs first
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyC6HO0LPJwI4tlWYlYSxw2IEGUu6Fu-fOU",
            authDomain: "stream-bingo-ecb40.firebaseapp.com",
            projectId: "stream-bingo-ecb40",
            storageBucket: "stream-bingo-ecb40.appspot.com",
            messagingSenderId: "814141306111",
            appId: "1:814141306111:web:319ac02de11210186408ca",
            measurementId: "G-1DYM2MTE10"
        };
        
        // Initialize Firebase
        console.log('Initializing Firebase...');
        firebase.initializeApp(firebaseConfig);
        
        // Initialize services with public read/write permissions for development
        window.db = firebase.firestore();
        
        // Enable offline persistence
        firebase.firestore().enablePersistence()
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence can only be enabled in one tab.');
                } else if (err.code === 'unimplemented') {
                    console.warn('Browser does not support offline persistence.');
                }
            });
        
        window.auth = firebase.auth();
        
        console.log('Firebase initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = 'Failed to connect to database. Please check console for details.';
        notification.style.backgroundColor = '#ff4444';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
    }
});

// Global utility functions
window.showNotification = function(message, type = 'info') {
    console.log(`Notification: ${message} (${type})`);
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    if (type === 'error') {
        notification.style.backgroundColor = '#ff4444';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
};
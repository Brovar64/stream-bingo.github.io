// Production Firebase Configuration
function initializeFirebase() {
    try {
        // Production Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyA-test-key-for-fallback",
            authDomain: "test-project.firebaseapp.com",
            projectId: "test-project",
            storageBucket: "test-project.appspot.com",
            messagingSenderId: "123456789012",
            appId: "1:123456789012:web:abcdef123456",
            measurementId: "G-ABCDEF1234"
        };
        
        console.log('Initializing Firebase with test project ID...');
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Set up services
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        try {
            firebase.analytics();
        } catch (e) {
            console.log('Analytics not initialized:', e);
        }
        
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

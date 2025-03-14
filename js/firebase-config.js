// Production Firebase Configuration
function initializeFirebase() {
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
        
        console.log('Initializing Firebase with production configuration...');
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Set up services
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
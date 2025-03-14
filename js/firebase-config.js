// Production Firebase Configuration
function initializeFirebase() {
    try {
        // Production Firebase configuration from GitHub Secrets
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        };
        
        console.log('Initializing Firebase with production configuration...');
        
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
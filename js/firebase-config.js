// Temporary Firebase Configuration Helper
// This will be replaced by the secure GitHub Actions workflow
// but provides an immediate fix for testing

function initializeFirebase() {
    try {
        // Firebase configuration with environment variable placeholders
        // GitHub Actions will replace these with actual values during build
        const firebaseConfig = {
            apiKey: "{{FIREBASE_API_KEY}}",
            authDomain: "{{FIREBASE_AUTH_DOMAIN}}",
            projectId: "{{FIREBASE_PROJECT_ID}}",
            storageBucket: "{{FIREBASE_STORAGE_BUCKET}}",
            messagingSenderId: "{{FIREBASE_MESSAGING_SENDER_ID}}",
            appId: "{{FIREBASE_APP_ID}}",
            measurementId: "{{FIREBASE_MEASUREMENT_ID}}"
        };
        
        console.log('Attempting Firebase initialization...');
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Additional Firebase service initializations
        firebase.analytics();
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

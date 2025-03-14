// Production Firebase Configuration
function initializeFirebase() {
    try {
        // Production Firebase configuration
        const firebaseConfig = {
            apiKey: "{{FIREBASE_API_KEY}}",
            authDomain: "{{FIREBASE_AUTH_DOMAIN}}",
            projectId: "{{FIREBASE_PROJECT_ID}}",
            storageBucket: "{{FIREBASE_STORAGE_BUCKET}}",
            messagingSenderId: "{{FIREBASE_MESSAGING_SENDER_ID}}",
            appId: "{{FIREBASE_APP_ID}}",
            measurementId: "{{FIREBASE_MEASUREMENT_ID}}"
        };
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Set up services
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        firebase.analytics();
        
        console.log('Firebase initialized for production');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

// Secure Firebase Configuration Loader
async function initializeFirebase() {
    try {
        // Use the global CONFIG object directly
        const firebaseConfig = CONFIG.FIREBASE;
        
        console.log('Initializing Firebase with config:', firebaseConfig);
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Set up global Firebase services
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        window.analytics = firebase.analytics();
        
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

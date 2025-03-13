// Secure Firebase Configuration Loader
async function initializeFirebase() {
    try {
        // Try to load configuration from external file (for local development)
        const configResponse = await fetch('./firebase-config.json');
        
        // If config file exists, use it
        if (configResponse.ok) {
            const firebaseConfig = await configResponse.json();
            initializeWithConfig(firebaseConfig);
            console.log('Firebase initialized from config file');
            return;
        }
    } catch (error) {
        console.log('No local config file found, using environment config');
    }
    
    // Fallback to environment config for production
    // These will be replaced during the build process
    const firebaseConfig = {
        apiKey: "FIREBASE_API_KEY",
        authDomain: "FIREBASE_AUTH_DOMAIN",
        projectId: "FIREBASE_PROJECT_ID",
        storageBucket: "FIREBASE_STORAGE_BUCKET",
        messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
        appId: "FIREBASE_APP_ID",
        measurementId: "FIREBASE_MEASUREMENT_ID"
    };
    
    initializeWithConfig(firebaseConfig);
}

function initializeWithConfig(firebaseConfig) {
    // Initialize Firebase with the config
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    window.analytics = firebase.analytics();
}

// Initialize Firebase when the script loads
initializeFirebase();
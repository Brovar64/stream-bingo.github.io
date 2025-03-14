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
    
    // Use the CONFIG object for configuration
    const firebaseConfig = CONFIG.FIREBASE;
    
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
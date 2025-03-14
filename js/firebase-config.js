// Secure Firebase Configuration Loader
async function initializeFirebase() {
    try {
        // Try to load configuration from a deployed config file first
        let firebaseConfig;
        
        try {
            // For local development, you can use:
            // 1. Create a firebase-config.json file with your actual credentials for local testing
            // 2. This file should be in .gitignore to keep your credentials private
            const response = await fetch('/firebase-config.json');
            if (response.ok) {
                firebaseConfig = await response.json();
                console.log('Using external Firebase configuration file');
            } else {
                throw new Error('External configuration not available');
            }
        } catch (configError) {
            // Fallback configuration for demo/testing purposes
            // This allows the app to initialize in a demo mode when no credentials are available
            console.log('Using fallback Firebase configuration for testing');
            firebaseConfig = {
                apiKey: "AIzaSyDOCAbC123dEf456GhI789jKl01-MnO",
                authDomain: "demo-project.firebaseapp.com",
                projectId: "demo-project",
                storageBucket: "demo-project.appspot.com",
                messagingSenderId: "123456789012",
                appId: "1:123456789012:web:f9e5efa56c5f5bdf",
                measurementId: "G-ABCDEF1234"
            };
        }
        
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

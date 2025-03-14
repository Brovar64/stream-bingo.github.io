// Secure Firebase Configuration Loader
async function initializeFirebase() {
    try {
        // Load Firebase configuration from the JSON file created by GitHub Actions
        const response = await fetch('/firebase-config.json');
        if (!response.ok) {
            console.warn('Failed to load Firebase configuration from JSON file. The app might not work correctly.');
            console.warn('Make sure your GitHub Actions workflow is running correctly.');
            return;
        }
        
        const firebaseConfig = await response.json();
        console.log('Firebase configuration loaded successfully');
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Additional Firebase service initializations
        firebase.analytics();
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        console.error('The app will not function correctly without proper Firebase configuration.');
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

// Firebase Configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase project values
function initializeFirebase() {
    try {
        // Firebase configuration - REPLACE THESE VALUES with your actual Firebase project values
        const firebaseConfig = {
            apiKey: "AIzaSyDOCAbC123dEf456GhI789jKl01-MnO",  // REPLACE THIS
            authDomain: "demo-project.firebaseapp.com",       // REPLACE THIS
            projectId: "demo-project",                        // REPLACE THIS
            storageBucket: "demo-project.appspot.com",        // REPLACE THIS
            messagingSenderId: "123456789012",               // REPLACE THIS
            appId: "1:123456789012:web:f9e5efa56c5f5bdf",    // REPLACE THIS
            measurementId: "G-ABCDEF1234"                     // REPLACE THIS
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

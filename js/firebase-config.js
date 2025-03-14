// Temporary Firebase Configuration Helper
// This will be replaced by the secure GitHub Actions workflow
// but provides an immediate fix for testing

function initializeFirebase() {
    try {
        // Firebase configuration with environment variable placeholders
        // GitHub Actions will replace these with actual values during build
        const firebaseConfig = {
            apiKey: "AIzaSyC6HO0LPJwI4tlWYlYSxw2IEGUu6Fu-fOU",
            authDomain: "stream-bingo-ecb40.firebaseapp.com",
            projectId: "stream-bingo-ecb40",
            storageBucket: "stream-bingo-ecb40.appspot.com",
            messagingSenderId: "814141306111",
            appId: "1:814141306111:web:319ac02de11210186408ca",
            measurementId: "G-1DYM2MTE10"
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

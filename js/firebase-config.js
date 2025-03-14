// Production Firebase Configuration
function initializeFirebase() {
    try {
        // Production Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyC6HO0LPJwI4tlWYlYSxw2IEGUu6Fu-fOU",
            authDomain: "stream-bingo-ecb40.firebaseapp.com",
            projectId: "stream-bingo-ecb40",
            storageBucket: "stream-bingo-ecb40.appspot.com",
            messagingSenderId: "814141306111",
            appId: "1:814141306111:web:319ac02de11210186408ca",
            measurementId: "G-1DYM2MTE10"
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

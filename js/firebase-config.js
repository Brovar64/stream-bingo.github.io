// Enhanced Firebase Configuration Helper
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
        
        console.log('Attempting Firebase initialization with project:', firebaseConfig.projectId);
        
        // Check if any credentials are still using placeholders
        const hasPlaceholders = Object.values(firebaseConfig).some(value => 
            value.includes('{{') && value.includes('}}')
        );
        
        if (hasPlaceholders) {
            console.error('Firebase configuration contains placeholders. GitHub Actions build might have failed.');
        }
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Test Firestore availability
        const db = firebase.firestore();
        console.log('Firestore initialized, testing connection...');
        
        // Create a test document to verify connection
        db.collection('_connection_test').doc('test').set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Successfully connected to Firestore!');
        }).catch(error => {
            console.error('Firestore connection test failed:', error);
            if (error.code === 'permission-denied') {
                console.error('Firebase security rules are preventing database access.');
                console.error('Please update your Firestore security rules to allow read/write access for testing.');
            }
        });
        
        // Additional Firebase service initializations
        firebase.analytics();
        window.db = db;
        window.auth = firebase.auth();
        
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // Show an error message on the page
        if (document.getElementById('app')) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '20px';
            errorDiv.style.margin = '20px';
            errorDiv.style.backgroundColor = '#ffeeee';
            errorDiv.style.border = '1px solid red';
            errorDiv.style.borderRadius = '5px';
            errorDiv.innerHTML = `
                <h3>Firebase Connection Error</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>Please check:</p>
                <ul>
                    <li>Firebase project is properly set up</li>
                    <li>Firestore Database is enabled</li>
                    <li>Security rules allow read/write access</li>
                    <li>Firebase credentials are correct</li>
                </ul>
            `;
            document.getElementById('app').prepend(errorDiv);
        }
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

// Firebase App Check implementation
// This adds an extra layer of security to prevent abuse of your Firebase resources

// This function should be called after Firebase is initialized
function initializeAppCheck() {
    // Check if App Check is available
    if (typeof firebase.appCheck !== 'undefined') {
        // For production, you should use reCAPTCHA v3
        const appCheck = firebase.appCheck();
        
        // Initialize with reCAPTCHA
        appCheck.activate(
            'APP_CHECK_TOKEN_HERE',  // Replace with your actual reCAPTCHA site key
            true  // Set to true for debug tokens in development
        );
        
        console.log('Firebase App Check initialized');
    } else {
        console.warn('Firebase App Check is not available in this version');
    }
}

// Export the function to be called after Firebase initialization
window.initializeAppCheck = initializeAppCheck;
// js/auth.js - updated to use CONFIG
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.TWITCH_CLIENT_ID = CONFIG.TWITCH.CLIENT_ID;
        
        // Dynamically determine base URL
        const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8080'
            : 'https://brovar64.github.io/stream-bingo';
            
        // Use index.html as the redirect URI
        this.REDIRECT_URI = CONFIG.TWITCH.REDIRECT_URI || `${baseUrl}/index.html`;
        
        console.log('=== TWITCH REDIRECT URI ===');
        console.log(this.REDIRECT_URI);
        console.log('==========================');
        
        // Rest of the method remains the same as in the original file
        const isHandlingCallback = this.checkForAuthCallback();

        if (!isHandlingCallback) {
            this.loadUserFromStorage();
        }
    }

    // Rest of the existing methods from the original auth.js
    loadUserFromStorage() {
        const userData = localStorage.getItem('streamBingoUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('User loaded from storage:', this.currentUser.username);
                return true;
            } catch (e) {
                console.error('Error parsing user data from storage:', e);
                return false;
            }
        }
        return false;
    }

    // Include all other methods from the original auth.js
    // ... (full method list from the original implementation)
}

// Export globally
window.authManager = new AuthManager();
// js/auth.js - Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        
        // Dynamically determine base URL
        const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8080'
            : 'https://brovar64.github.io/stream-bingo.github.io';
            
        // Use index.html as the redirect URI
        this.REDIRECT_URI = "https://brovar64.github.io/stream-bingo/twitch-callback.html" || `${baseUrl}/index.html`;
        
        console.log('Auth Manager initialized');
        console.log('Redirect URI:', this.REDIRECT_URI);
        
        this.loadUserFromStorage();
    }

    // Check for authentication callback from Twitch
    checkForAuthCallback() {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
            console.log('Found access token in URL hash');
            // Extract access token
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            
            if (accessToken) {
                console.log('Successfully extracted access token');
                // TODO: In a production app, validate the token with Twitch
                // For now, just store it and create a user
                this.currentUser = {
                    username: 'TwitchUser',
                    avatar: null,
                    token: accessToken,
                    authMethod: 'twitch'
                };
                
                this.saveUserToStorage();
                
                // Set flag to show dashboard after load
                window.showDashboardAfterLoad = true;
                
                // Remove hash from URL
                window.history.replaceState(null, null, window.location.pathname);
                
                return true;
            }
        }
        return false;
    }

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
    
    saveUserToStorage() {
        if (this.currentUser) {
            localStorage.setItem('streamBingoUser', JSON.stringify(this.currentUser));
            console.log('User saved to storage:', this.currentUser.username);
            return true;
        }
        return false;
    }
    
    loginWithTwitch() {
        // Redirect to Twitch OAuth flow
        // In a production app, you should use a proper OAuth flow with state parameter
        // This is a simplified example for demonstration purposes
        const scope = 'user:read:email';
        const clientId = "k53e9s8oc2leprhcgyoa010e38bm6s";
        
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&response_type=token&scope=${scope}`;
        
        console.log('Redirecting to Twitch auth URL:', authUrl);
        window.location.href = authUrl;
    }
    
    loginWithTestAccount(username) {
        this.currentUser = {
            username: username || 'TestUser',
            avatar: null,
            authMethod: 'test'
        };
        
        this.saveUserToStorage();
        console.log('Logged in with test account:', username);
        return true;
    }
    
    logout() {
        localStorage.removeItem('streamBingoUser');
        this.currentUser = null;
        console.log('User logged out');
        return true;
    }
    
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    getUsername() {
        return this.currentUser ? this.currentUser.username : null;
    }
    
    getProfileImage() {
        return this.currentUser ? this.currentUser.avatar : null;
    }
}

// Export globally
window.authManager = new AuthManager();

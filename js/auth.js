// js/auth.js - handles authentication logic
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.TWITCH_CLIENT_ID = 'k53e9s8oc2leprhcgyoa010e38bm6s';
        
        // Use the window.location to dynamically determine the current origin
        const baseUrl = window.location.origin;
        
        // Use our simple redirect handler
        this.REDIRECT_URI = `${baseUrl}/twitch-redirect.html`;
        
        console.log('=== TWITCH AUTH DETAILS ===');
        console.log('Base URL:', baseUrl);
        console.log('Redirect URI:', this.REDIRECT_URI);
        console.log('Protocol:', window.location.protocol);
        console.log('Hostname:', window.location.hostname);
        console.log('Port:', window.location.port);
        console.log('==========================');
        
        // Check for stored Twitch token
        this.checkTwitchToken();
        
        // Only try to load from storage if we're not handling a callback
        if (this.isLoggedIn() === false) {
            this.loadUserFromStorage();
        }
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

    saveUserToStorage(user) {
        localStorage.setItem('streamBingoUser', JSON.stringify(user));
        this.currentUser = user;
        console.log('User saved to storage:', user.username);
    }

    clearUserFromStorage() {
        localStorage.removeItem('streamBingoUser');
        localStorage.removeItem('twitchAccessToken');
        this.currentUser = null;
        console.log('User cleared from storage');
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isTwitchUser() {
        return this.currentUser && this.currentUser.provider === 'twitch';
    }

    getUsername() {
        return this.currentUser ? this.currentUser.username : null;
    }

    getProfileImage() {
        return this.currentUser && this.currentUser.profileImage ? this.currentUser.profileImage : null;
    }

    // Check if we have a Twitch token stored from the redirect page
    checkTwitchToken() {
        const token = localStorage.getItem('twitchAccessToken');
        if (token) {
            console.log('Found Twitch access token in storage, fetching user data...');
            
            // Process the token and fetch user info
            this.handleTwitchCallback(token)
                .then(() => {
                    console.log('Successfully processed stored Twitch token');
                    // Remove the token now that we've processed it
                    localStorage.removeItem('twitchAccessToken');
                    
                    // Redirect to dashboard if needed
                    if (window.streamBingo && window.streamBingo.showDashboard) {
                        console.log('Showing dashboard after token processing');
                        window.streamBingo.showDashboard();
                    }
                })
                .catch(error => {
                    console.error('Error processing stored token:', error);
                    localStorage.removeItem('twitchAccessToken');
                });
        }
    }

    // Initiate Twitch login
    loginWithTwitch() {
        console.log('Initiating Twitch login...');
        
        // Double check our redirect URI before sending
        console.log('Using redirect URI:', this.REDIRECT_URI);
        
        const scopes = 'user:read:email';
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${this.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&response_type=token&scope=${scopes}`;
        console.log('Full auth URL:', authUrl);
        
        // Navigate to Twitch for authentication
        window.location.href = authUrl;
    }

    // Handle Twitch authentication response
    handleTwitchCallback(accessToken) {
        console.log("Fetching user data from Twitch API");
        return fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': this.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    console.error("Error response from Twitch API:", response.status);
                    throw new Error(`Twitch API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Received user data:", data);
                if (data.data && data.data.length > 0) {
                    const userData = data.data[0];
                    const user = {
                        provider: 'twitch',
                        id: userData.id,
                        username: userData.login,
                        displayName: userData.display_name,
                        profileImage: userData.profile_image_url,
                        accessToken: accessToken
                    };

                    console.log("Saving user to storage:", user);
                    this.saveUserToStorage(user);
                    return user;
                }
                throw new Error('Failed to get user data');
            });
    }

    // Create a test user (for development)
    loginWithTestAccount(username) {
        const user = {
            provider: 'test',
            id: `test_${Date.now()}`,
            username: username,
            displayName: username,
            profileImage: null
        };

        this.saveUserToStorage(user);
        return user;
    }

    logout() {
        this.clearUserFromStorage();
    }
}

// Export globally
window.authManager = new AuthManager();
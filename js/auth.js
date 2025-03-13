// js/auth.js - handles authentication logic
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.TWITCH_CLIENT_ID = 'k53e9s8oc2leprhcgyoa010e38bm6s';
        this.REDIRECT_URI = 'http://localhost:63342/stream-bingo/';

        // Check for existing login
        this.checkForAuthCallback();
        this.loadUserFromStorage();
    }

    checkForAuthCallback() {
        const hash = window.location.hash.substring(1);
        if (hash && hash.includes('access_token=')) {
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');

            if (accessToken) {
                // Clear the hash from the URL to prevent issues on refresh
                history.replaceState(null, null, ' ');

                // Handle the auth callback
                this.handleTwitchCallback(accessToken)
                    .then(() => {
                        console.log('Successfully authenticated with Twitch');
                        // Force refresh to load proper UI after auth
                        window.location.reload();
                    })
                    .catch(error => {
                        console.error('Authentication error:', error);
                    });
            }
        }
    }

    loadUserFromStorage() {
        const userData = localStorage.getItem('streamBingoUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            return true;
        }
        return false;
    }

    saveUserToStorage(user) {
        localStorage.setItem('streamBingoUser', JSON.stringify(user));
        this.currentUser = user;
    }

    clearUserFromStorage() {
        localStorage.removeItem('streamBingoUser');
        this.currentUser = null;
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

    // Initiate Twitch login
    loginWithTwitch() {
        const scopes = 'user:read:email';
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${this.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&response_type=token&scope=${scopes}`;
    }

    // Handle Twitch authentication response
    handleTwitchCallback(accessToken) {
        return fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': this.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
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
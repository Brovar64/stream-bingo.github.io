// js/auth.js - handles authentication logic
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.TWITCH_CLIENT_ID = 'k53e9s8oc2leprhcgyoa010e38bm6s';
        this.REDIRECT_URI = 'http://localhost:63342/stream-bingo/auth-callback.html';

        // Check for existing login
        this.loadUserFromStorage();
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
        console.log("Handling Twitch callback with token:", accessToken);
        return fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': this.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Received Twitch user data:", data);
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
            })
            .catch(error => {
                console.error("Error in Twitch callback:", error);
                throw error;
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
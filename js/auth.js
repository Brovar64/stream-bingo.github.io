// js/auth.js - handles authentication logic
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.TWITCH_CLIENT_ID = 'k53e9s8oc2leprhcgyoa010e38bm6s';
        this.REDIRECT_URI = 'http://localhost:8080/index.html';
        // Check for existing login
        const isHandlingCallback = this.checkForAuthCallback();

        // Only try to load from storage if we're not handling a callback
        if (!isHandlingCallback) {
            this.loadUserFromStorage();
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

    checkForAuthCallback() {
        console.log("Checking for auth callback...");
        const hash = window.location.hash.substring(1);

        if (hash && hash.includes('access_token=')) {
            console.log("Found access token in URL");
            // Parse the hash fragment to get the token
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');

            if (accessToken) {
                console.log("Processing Twitch access token");
                // Remove the hash from URL to avoid issues on reload
                history.replaceState(null, null, window.location.pathname);

                // Show a loading indicator
                document.getElementById('app').innerHTML = `
                <div style="text-align: center; margin-top: 100px;">
                    <h2>Authenticating...</h2>
                    <p>Please wait while we complete your login.</p>
                </div>
            `;

                // Process the token and fetch user info
                this.handleTwitchCallback(accessToken)
                    .then(() => {
                        console.log("Successfully authenticated with Twitch!");
                        // Ensure streamBingo is initialized properly
                        if (window.streamBingo) {
                            // Force a dashboard display after authentication
                            if (window.streamBingo.showDashboard) {
                                window.streamBingo.showDashboard();
                            } else {
                                window.streamBingo.init();
                            }
                        } else {
                            // If streamBingo object isn't available yet, create a flag to show dashboard
                            window.showDashboardAfterLoad = true;
                            // Reload as fallback
                            window.location.reload();
                        }
                    })
                    .catch(error => {
                        console.error('Authentication error:', error);
                        document.getElementById('app').innerHTML = `
                        <div style="text-align: center; margin-top: 100px;">
                            <h2>Authentication Error</h2>
                            <p>There was a problem logging in with Twitch.</p>
                            <button onclick="window.location.reload()">Try Again</button>
                        </div>
                    `;
                    });

                return true;
            }
        }

        return false;
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
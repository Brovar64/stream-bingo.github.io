// js/auth.js - handles authentication logic
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.TWITCH_CLIENT_ID = 'k53e9s8oc2leprhcgyoa010e38bm6s';
        
        // Make sure this exactly matches one of your configured redirect URLs
        const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8080'
            : 'https://brovar64.github.io/stream-bingo';
            
        // Use index.html as the redirect URI since that's what's configured in Twitch
        this.REDIRECT_URI = `${baseUrl}/index.html`;
        
        // Log the redirect URI to make it very clear what we're using
        console.log('=== TWITCH REDIRECT URI ===');
        console.log(this.REDIRECT_URI);
        console.log('==========================');
        
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

    // Initiate Twitch login
    loginWithTwitch() {
        console.log('Initiating Twitch login...');
        
        // Double check our redirect URI before sending
        console.log('Using redirect URI:', this.REDIRECT_URI);
        
        const scopes = 'user:read:email';
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${this.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&response_type=token&scope=${scopes}`;
        console.log('Redirecting to:', authUrl);
        
        // Navigate to Twitch for authentication
        window.location.href = authUrl;
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
                            console.log('Showing dashboard via streamBingo object');
                            if (window.streamBingo.showDashboard) {
                                window.streamBingo.showDashboard();
                            } else {
                                window.streamBingo.init();
                            }
                        } else {
                            // If streamBingo object isn't available yet, create a flag to show dashboard
                            console.log('Setting flag to show dashboard after load');
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
                            <p>Error details: ${error.message || 'Unknown error'}</p>
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
// js/ui_base.js - Core UI Controller functionality

class UIBaseController {
    constructor() {
        this.auth = window.authManager;
        this.adminController = window.adminController;
        this.playerController = window.playerController;
        
        this.currentView = null;
        this.currentRoomId = null;
        this.currentPlayerName = null;
        
        // Load UI modules
        this.dashboardUI = new DashboardUIController(this);
        this.adminUI = new AdminUIController(this);
        this.playerUI = new PlayerUIController(this);
        
        // Initialize app components
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeApp();
        });
    }
    
    initializeApp() {
        // Check if user is authenticated
        if (this.auth && this.auth.isLoggedIn()) {
            this.loadDashboard();
        } else {
            this.loadLogin();
        }
    }
    
    loadDashboard() {
        this.dashboardUI.load();
        this.currentView = 'dashboard';
    }
    
    loadLogin() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Stream Bingo</div>
                <div class="subtitle">Login to create or join bingo games for your stream</div>
                
                <div class="form-group">
                    <button id="twitchLoginBtn" class="btn btn-primary">Login with Twitch</button>
                </div>
                <div class="form-group">
                    <button id="testLoginBtn" class="btn btn-secondary">Login as Test User</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('twitchLoginBtn').addEventListener('click', () => this.auth.loginWithTwitch());
        document.getElementById('testLoginBtn').addEventListener('click', () => {
            this.auth.loginWithTestAccount('admin');
            this.loadDashboard();
        });
        
        this.currentView = 'login';
    }
    
    loadAdminRoom(roomId) {
        this.adminUI.loadRoom(roomId);
    }
    
    loadPlayerRoom(roomId, playerName, roomData) {
        this.playerUI.loadRoom(roomId, playerName, roomData);
    }
    
    // Common UI helper methods
    showLoading(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

// Export globally so it's accessible to other modules
window.UIBaseController = UIBaseController;
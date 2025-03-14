// js/ui_base.js - Core UI Controller functionality

class UIBaseController {
    constructor() {
        console.log('UIBaseController constructor called');
        
        // Store references to controllers
        this.auth = window.authManager;
        this.adminController = window.adminController;
        this.playerController = window.playerController;
        
        // Initialize state
        this.currentView = null;
        this.currentRoomId = null;
        this.currentPlayerName = null;
        
        // Initialize app components on DOM content loaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM content loaded, initializing app...');
            this.initializeUIControllers();
        });
    }
    
    initializeUIControllers() {
        // Log diagnostic information
        console.log('Initializing UI controllers');
        console.log('Auth manager available:', !!this.auth);
        console.log('Admin controller available:', !!this.adminController);
        console.log('Player controller available:', !!this.playerController);
        
        try {
            // Check if the required UI controllers are defined
            if (typeof DashboardUIController === 'undefined') {
                console.error('DashboardUIController is not defined');
                this.showError('Application error: UI components not loaded properly');
                return;
            }
            
            if (typeof AdminUIController === 'undefined') {
                console.error('AdminUIController is not defined');
                this.showError('Application error: UI components not loaded properly');
                return;
            }
            
            if (typeof PlayerUIController === 'undefined') {
                console.error('PlayerUIController is not defined');
                this.showError('Application error: UI components not loaded properly');
                return;
            }
            
            // Create UI controllers
            this.dashboardUI = new DashboardUIController(this);
            this.adminUI = new AdminUIController(this);
            this.playerUI = new PlayerUIController(this);
            
            console.log('UI controllers initialized successfully');
            
            // Initialize the app
            this.initializeApp();
        } catch (error) {
            console.error('Error initializing UI controllers:', error);
            this.showError(`Application error: ${error.message}`);
        }
    }
    
    showError(message) {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="error-message">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()">Reload Application</button>
                </div>
            </div>
        `;
    }
    
    initializeApp() {
        // Check if user is authenticated
        if (this.auth && this.auth.isLoggedIn()) {
            console.log('User is logged in, loading dashboard...');
            this.loadDashboard();
        } else {
            console.log('User is not logged in, loading login screen...');
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
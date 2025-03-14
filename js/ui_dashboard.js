// js/ui_dashboard.js - Dashboard UI functionality

class DashboardUIController {
    constructor(baseUI) {
        this.baseUI = baseUI;
        this.auth = window.authManager;
        this.adminController = window.adminController;
        this.playerController = window.playerController;
    }
    
    load() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="container">
                <div class="title">Stream Bingo</div>
                <p class="subtitle">Welcome, ${this.auth.getUsername()}</p>
                
                <div class="card">
                    <h2>Create a Bingo Room (Admin)</h2>
                    <div class="form-group">
                        <label for="roomCode">Room Code:</label>
                        <input type="text" id="roomCode" class="form-control" placeholder="Enter room code (4-6 chars)" maxlength="6">
                    </div>
                    <div class="form-group">
                        <label for="gridSize">Grid Size:</label>
                        <select id="gridSize" class="form-control">
                            <option value="3">3x3</option>
                            <option value="4">4x4</option>
                            <option value="5" selected>5x5</option>
                        </select>
                    </div>
                    <button id="createRoomBtn" class="btn btn-primary">Create Room</button>
                </div>
                
                <div class="card">
                    <h2>Join Existing Room (Player)</h2>
                    <div class="form-group">
                        <label for="joinNickname">Your Nickname:</label>
                        <input type="text" id="joinNickname" class="form-control" placeholder="Enter your nickname">
                    </div>
                    <div class="form-group">
                        <label for="joinRoomCode">Room Code:</label>
                        <input type="text" id="joinRoomCode" class="form-control" placeholder="Enter room code" maxlength="6">
                    </div>
                    <button id="joinRoomBtn" class="btn btn-primary">Join Room</button>
                </div>
                
                <div class="card">
                    <h2>Your Created Rooms</h2>
                    <div id="userRoomsList" class="player-list">
                        <p>Loading your rooms...</p>
                    </div>
                </div>
                
                <button id="logoutBtn" class="btn btn-secondary">Logout</button>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('createRoomBtn').addEventListener('click', () => this.handleCreateRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.handleJoinRoom());
        document.getElementById('logoutBtn').addEventListener('click', () => this.auth.logout());
        
        // Load user's rooms
        this.loadUserRooms();
    }
    
    async loadUserRooms() {
        const rooms = await this.adminController.loadUserRooms();
        const roomsList = document.getElementById('userRoomsList');
        
        if (!rooms) {
            roomsList.innerHTML = `<p class="error">Failed to load rooms. Database connection error.</p>`;
            return;
        }
        
        if (rooms.length === 0) {
            roomsList.innerHTML = `<p>You haven't created any rooms yet.</p>`;
            return;
        }
        
        let roomsHTML = '';
        rooms.forEach(room => {
            const playerCount = room.players ? room.players.length : 0;
            const statusBadge = room.status === 'active' ? 
                '<span class="status-badge active">Active</span>' : 
                '<span class="status-badge setup">Setup</span>';
            
            roomsHTML += `
                <div class="player-item">
                    <div class="player-info">
                        <span>Room: ${room.id} ${statusBadge}</span>
                        <span>${room.gridSize}x${room.gridSize}</span>
                        <span>Players: ${playerCount}</span>
                    </div>
                    <div>
                        <button class="enter-room btn-primary" data-room-id="${room.id}">Manage</button>
                        <button class="delete-player" data-room-id="${room.id}">×</button>
                    </div>
                </div>
            `;
        });
        
        roomsList.innerHTML = roomsHTML;
        
        // Add event listeners for buttons
        document.querySelectorAll('.delete-player').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.getAttribute('data-room-id');
                if (confirm(`Are you sure you want to delete room ${roomId}?`)) {
                    this.handleDeleteRoom(roomId);
                }
            });
        });
        
        document.querySelectorAll('.enter-room').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.getAttribute('data-room-id');
                this.baseUI.loadAdminRoom(roomId);
            });
        });
    }
    
    async handleCreateRoom() {
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        const gridSize = parseInt(document.getElementById('gridSize').value);
        
        // Disable button and show loading state
        const createButton = document.getElementById('createRoomBtn');
        const originalText = createButton.textContent;
        createButton.disabled = true;
        createButton.textContent = 'Creating...';
        
        const createdRoomId = await this.adminController.createRoom(roomCode, gridSize);
        
        // Restore button state
        createButton.disabled = false;
        createButton.textContent = originalText;
        
        if (createdRoomId) {
            this.baseUI.loadAdminRoom(createdRoomId);
        }
    }
    
    async handleJoinRoom() {
        const nickname = document.getElementById('joinNickname').value.trim();
        const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
        
        // Disable button and show loading state
        const joinButton = document.getElementById('joinRoomBtn');
        const originalText = joinButton.textContent;
        joinButton.disabled = true;
        joinButton.textContent = 'Joining...';
        
        const roomData = await this.playerController.joinRoom(nickname, roomCode);
        
        // Restore button state
        joinButton.disabled = false;
        joinButton.textContent = originalText;
        
        if (roomData) {
            this.baseUI.loadPlayerRoom(roomCode, nickname, roomData);
        }
    }
    
    async handleDeleteRoom(roomId) {
        const success = await this.adminController.deleteRoom(roomId);
        if (success) {
            this.loadUserRooms();
        }
    }
}

// Export globally
window.DashboardUIController = DashboardUIController;
// js/ui.js - Main UI entry point

// This file serves as the main entry point for UI components
// It initializes and exports the UI controllers to make them globally available

// Wait for all UI components to load
document.addEventListener('DOMContentLoaded', () => {
    // Add enhanced CSS styles for new UI components
    addEnhancedStyles();
    
    // Initialize the main UI controller
    window.uiController = new UIBaseController();
});

// Add enhanced styles for improved UI experience
function addEnhancedStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* Enhanced loading indicator */
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 64, 129, 0.1);
            border-radius: 50%;
            border-top-color: #FF4081;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Status badges */
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status-badge.setup {
            background-color: #FFA000;
            color: white;
        }
        
        .status-badge.active {
            background-color: #4CAF50;
            color: white;
        }
        
        /* Progress bar */
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #333;
            border-radius: 4px;
            margin-top: 5px;
            overflow: hidden;
        }
        
        .progress {
            height: 100%;
            background-color: #FF4081;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        /* Word count display */
        .word-count-display {
            margin: 10px 0;
            font-size: 0.9rem;
            color: #B0BEC5;
        }
        
        /* Setup note */
        .setup-note {
            font-size: 0.8rem;
            color: #FFA000;
            margin-top: 5px;
            opacity: 0;
            height: 0;
            transition: opacity 0.3s, height 0.3s;
        }
        
        .setup-note.visible {
            opacity: 1;
            height: 1.2em;
        }
        
        /* Button states */
        .btn.disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .btn.loading {
            position: relative;
            padding-left: 35px;
        }
        
        .btn.loading:before {
            content: '';
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
        }
        
        /* Game start overlay */
        .game-start-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 1;
            transition: opacity 0.5s;
        }
        
        .game-start-overlay.fade-out {
            opacity: 0;
        }
        
        .game-start-content {
            text-align: center;
            background-color: #1E1E1E;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
        }
        
        .game-start-content h2 {
            color: #4CAF50;
            font-size: 2.5rem;
            margin-bottom: 10px;
            animation: scale-in 0.5s ease-out;
        }
        
        @keyframes scale-in {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        /* Win celebration */
        .win-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 1;
            transition: opacity 0.5s;
        }
        
        .win-overlay.fade-out {
            opacity: 0;
        }
        
        .win-content {
            text-align: center;
            background-color: #1E1E1E;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
            animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .win-content h1 {
            color: #FFD700;
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        @keyframes bounce-in {
            0% { transform: scale(0); }
            50% { transform: scale(1.1); }
            70% { transform: scale(0.95); }
            100% { transform: scale(1); }
        }
        
        /* Toast notifications */
        .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            transform: translateX(100%);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .toast-info {
            background-color: #2196F3;
        }
        
        .toast-success {
            background-color: #4CAF50;
        }
        
        .toast-error {
            background-color: #F44336;
        }
        
        .toast-warning {
            background-color: #FFC107;
            color: #333;
        }
        
        /* Player waiting animation */
        .waiting-animation {
            margin: 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .dots {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .dot {
            width: 12px;
            height: 12px;
            background-color: #FF4081;
            border-radius: 50%;
            animation: dot-pulse 1.5s infinite ease-in-out;
        }
        
        .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes dot-pulse {
            0%, 100% {
                transform: scale(0.8);
                opacity: 0.6;
            }
            50% {
                transform: scale(1.2);
                opacity: 1;
            }
        }
        
        /* Status section for player UI */
        .status-section {
            display: flex;
            gap: 20px;
            margin: 15px 0;
            background-color: #2D2D2D;
            border-radius: 8px;
            padding: 10px;
        }
        
        .status-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .status-label {
            font-size: 0.8rem;
            color: #B0BEC5;
        }
        
        .status-count {
            font-size: 1.5rem;
            font-weight: bold;
            color: #FF4081;
        }
        
        /* Game status cards in admin view */
        .game-status-panel {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .status-card {
            background-color: #2D2D2D;
            border-radius: 8px;
            padding: 15px;
            flex: 1;
            text-align: center;
        }
        
        .status-card h3 {
            font-size: 0.9rem;
            color: #B0BEC5;
            margin-bottom: 8px;
        }
        
        .stat-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #FF4081;
        }
        
        /* Modal improvements */
        .modal {
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(3px);
        }
        
        .modal-content {
            border: 1px solid #333;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
        }
        
        /* Confirm dialog */
        .confirm-dialog {
            padding: 10px 0;
        }
        
        .confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        
        /* Cell marking animation */
        .bingo-cell.marking {
            animation: pulse 0.5s;
        }
        
        /* Spacing utility */
        .mt-10 {
            margin-top: 10px;
        }
    `;
    
    document.head.appendChild(styleEl);
}
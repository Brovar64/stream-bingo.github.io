// js/ui-controller.js - UI Base Controller

class UIBaseController {
    constructor() {
        console.log('UIBaseController initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add global event listeners for UI components
        document.addEventListener('click', (event) => {
            // Handle global click events if needed
        });

        // Add any other global event listeners
    }

    // Method to show notifications
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`Notification (${type}): ${message}`);
        }
    }

    // Render the main dashboard
    renderDashboard() {
        // Implementation for rendering the main dashboard UI
        console.log('Rendering dashboard');
    }

    // Helper method to clear the app container
    clearAppContainer() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = '';
        }
    }

    // Helper method to create and append elements
    createElement(tag, attributes = {}, text = '') {
        const element = document.createElement(tag);
        
        // Set attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        // Set text content if provided
        if (text) {
            element.textContent = text;
        }
        
        return element;
    }
}

// Export globally
window.UIBaseController = UIBaseController;

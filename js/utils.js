// js/utils.js - Utility functions for the application

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (info, success, error, warning)
 */
window.showNotification = function(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and style based on type
    notification.textContent = message;
    notification.className = 'notification';
    
    // Add type-specific styling
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#F44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#FFA000';
            break;
        default: // info
            notification.style.backgroundColor = '#FF4081';
    }
    
    // Show notification
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
};

/**
 * Generates a random room code
 * @returns {string} A random 6-character alphanumeric code
 */
window.generateRandomRoomCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Checks if a string is empty or only contains whitespace
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is empty or only contains whitespace
 */
window.isEmptyString = function(str) {
    return !str || /^\s*$/.test(str);
};

/**
 * Formats a timestamp to a readable date string
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
window.formatTimestamp = function(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} html - String that might contain HTML
 * @returns {string} Escaped string
 */
window.escapeHtml = function(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
};

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
window.isValidEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

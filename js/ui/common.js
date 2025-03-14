// js/ui/common.js - Shared UI utilities and components

class UICommon {
    static createModal(title, content, options = {}) {
        // Default options
        const defaultOptions = {
            width: '80%',
            maxWidth: '800px',
            closeOnClickOutside: true,
            showCloseButton: true,
            onClose: null
        };
        
        const settings = { ...defaultOptions, ...options };
        
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="width: ${settings.width}; max-width: ${settings.maxWidth};">
                <div class="modal-header">
                    <h2>${title}</h2>
                    ${settings.showCloseButton ? '<span class="close-modal">&times;</span>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close button event
        if (settings.showCloseButton) {
            modal.querySelector('.close-modal').addEventListener('click', () => {
                this.closeModal(modal, settings.onClose);
            });
        }
        
        // Close modal when clicking outside
        if (settings.closeOnClickOutside) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal, settings.onClose);
                }
            });
        }
        
        return modal;
    }
    
    static closeModal(modal, callback = null) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }
        }, 300);
    }
    
    static createConfirmDialog(message, onConfirm, onCancel = null) {
        const content = `
            <div class="confirm-dialog">
                <p>${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        
        const modal = this.createModal('Confirm Action', content, {
            width: '400px',
            closeOnClickOutside: false
        });
        
        // Add event listeners
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            this.closeModal(modal);
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeModal(modal);
            if (onCancel && typeof onCancel === 'function') {
                onCancel();
            }
        });
        
        return modal;
    }
    
    static createToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const toastContainer = document.querySelector('.toast-container') || (() => {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        })();
        
        toastContainer.appendChild(toast);
        
        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide and remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
                
                // Remove container if empty
                if (toastContainer.children.length === 0) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, duration);
        
        return toast;
    }
    
    static formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    }
}

// Export globally
window.UICommon = UICommon;
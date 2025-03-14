// js/app-init.js - Initialize the application after all scripts are loaded

window.addEventListener('load', function() {
    console.log('All scripts loaded, initializing application...');
    
    // Check if UI classes are defined
    const uiClassesDefined = 
        typeof UIBaseController !== 'undefined' &&
        typeof DashboardUIController !== 'undefined' &&
        typeof AdminUIController !== 'undefined' &&
        typeof PlayerUIController !== 'undefined';
    
    console.log('UI Classes defined:', uiClassesDefined);
    
    // Check if module controllers are defined
    const controllersExist = 
        window.authManager !== undefined &&
        window.adminController !== undefined &&
        window.playerController !== undefined;
    
    console.log('Controllers exist:', controllersExist);
    
    // Initialize UI if not already done
    if (uiClassesDefined && !window.uiController) {
        console.log('Creating UI controller...');
        window.uiController = new UIBaseController();
    } else if (!uiClassesDefined) {
        console.error('UI classes not defined! Application cannot initialize');
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.innerHTML = `
                <div class="container">
                    <div class="error-message">
                        <h2>Application Error</h2>
                        <p>The application failed to initialize properly.</p>
                        <p>Missing components: ${!uiClassesDefined ? 'UI Classes' : ''}${!controllersExist ? ', Controllers' : ''}</p>
                        <button onclick="location.reload()">Reload Application</button>
                    </div>
                </div>
            `;
        }
    }
});
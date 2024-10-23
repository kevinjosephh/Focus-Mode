chrome.storage.sync.get(['focusMode', 'blockedSites'], function (data) {
    if (data.focusMode && data.blockedSites) {
        const currentSite = window.location.hostname; // Get the current hostname
        if (data.blockedSites.includes(currentSite)) {
            // Create a full-screen block message
            const blockMessage = document.createElement('div');
            blockMessage.style.position = 'fixed';
            blockMessage.style.top = '0';
            blockMessage.style.left = '0';
            blockMessage.style.width = '100%';
            blockMessage.style.height = '100%';
            blockMessage.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Semi-transparent background
            blockMessage.style.color = 'black';
            blockMessage.style.display = 'flex';
            blockMessage.style.alignItems = 'center';
            blockMessage.style.justifyContent = 'center';
            blockMessage.style.zIndex = '9999';
            blockMessage.style.padding = '20px';
            blockMessage.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
            blockMessage.style.pointerEvents = 'all'; // Ensure it captures all events
            blockMessage.innerHTML = `
                <div>
                    <h1>This website is blocked during Focus Mode!</h1>
                    <button id="timeout-button">Take 5-Minute Timeout</button>
                </div>
            `;
            document.body.appendChild(blockMessage);

            // Add event listener for the timeout button
            document.getElementById('timeout-button').addEventListener('click', function () {
                blockMessage.remove(); // Remove the block message

                // Allow access for 5 minutes
                setTimeout(() => {
                    // Show a custom notification that the site is blocked again after 5 minutes
                    const notification = document.createElement('div');
                    notification.style.position = 'fixed';
                    notification.style.top = '10px';
                    notification.style.left = '50%';
                    notification.style.transform = 'translateX(-50%)';
                    notification.style.backgroundColor = 'red';
                    notification.style.color = 'white';
                    notification.style.padding = '10px';
                    notification.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
                    notification.style.zIndex = '9999';
                    notification.innerText = `${currentSite} is blocked again.`;
                    document.body.appendChild(notification);

                    // Automatically remove the notification after 5 seconds
                    setTimeout(() => {
                        notification.remove();
                        // Optionally, refresh the page to apply the block
                        location.reload();
                    }, 5000); // 5 seconds
                }, 5 * 60 * 1000); // 5 minutes in milliseconds
            });
        }
    }
});

// Listen for tab updates and inject content script if Focus Mode is on
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkFocusMode') {
        chrome.storage.sync.get('focusMode', (data) => {
            sendResponse({ focusMode: data.focusMode });
        });
        return true; // Indicates you wish to send a response asynchronously
    }
});

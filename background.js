// Create context menu for adding current site to the block list
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        id: "addToBlockList",
        title: "Add to Block List",
        contexts: ["page"]
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "addToBlockList") {
        const site = new URL(tab.url).hostname;
        chrome.storage.sync.get('blockedSites', function (data) {
            const blockedSites = data.blockedSites || [];
            if (!blockedSites.includes(site)) {
                blockedSites.push(site);
                chrome.storage.sync.set({ blockedSites: blockedSites });
                alert(`${site} added to block list`);
            } else {
                alert(`${site} is already in the block list`);
            }
        });
    }
});

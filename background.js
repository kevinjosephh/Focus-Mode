// Create context menu for adding current site to the block list
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "addToBlockList",
    title: "Add to Block List",
    contexts: ["page"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "addToBlockList") {
    const site = new URL(tab.url).hostname; // Get the hostname
    const baseSite = site.replace(/^www\./, ""); // Normalize by removing 'www.' if present

    chrome.storage.sync.get("blockedSites", function (data) {
      const blockedSites = data.blockedSites || [];

      // Check if the baseSite is already in the block list (ignoring 'www.')
      if (!blockedSites.includes(baseSite)) {
        blockedSites.push(baseSite);
        chrome.storage.sync.set({ blockedSites: blockedSites });
        // Notify the user about the addition
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Site Added to Block List",
          message: `${baseSite} added to block list`,
          priority: 2,
        });
      } else {
        // Notify that the site is already blocked
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Site Already Blocked",
          message: `${baseSite} is already in the block list`,
          priority: 2,
        });
      }
    });
  }
});

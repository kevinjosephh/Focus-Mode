document.addEventListener("DOMContentLoaded", function () {
  const focusToggle = document.getElementById("focus-toggle");
  const websiteInput = document.getElementById("website-input");
  const addWebsiteBtn = document.getElementById("add-website-btn");
  const blockList = document.getElementById("block-list");
  const breakButtons = document.querySelectorAll('button[id^="break-"]');

  // Regular expression to validate URL
  const urlPattern = /^(https?:\/\/)?([\w\d-]+\.)+[\w-]{2,}(\/.*)?$/;

  // Load focus mode state, block list and break info from storage
  chrome.storage.sync.get(["focusMode", "blockedSites", "breakUntil"], function (data) {
    if (data.focusMode) {
      focusToggle.checked = true;
    }
    
    // Notify the user about active breaks
    const currentTime = Date.now();
    if (data.breakUntil && currentTime < data.breakUntil) {
      const timeLeft = Math.floor((data.breakUntil - currentTime) / 60000); // Time left in minutes
      alert(`You are currently on a break. Focus mode will resume in ${timeLeft} minutes.`);
    }

    // Display blocked sites
    if (data.blockedSites) {
      const normalizedSites = data.blockedSites.map((site) =>
        site.replace(/^www\./, "")
      );
      const uniqueSites = [...new Set(normalizedSites)];
      uniqueSites.forEach((site) => addSiteToList(site));
    }
  });

  // Toggle focus mode
  focusToggle.addEventListener("change", function () {
    chrome.storage.sync.set({ focusMode: focusToggle.checked });
  });

  // Add website to block list with URL validation
  addWebsiteBtn.addEventListener("click", function () {
    const website = websiteInput.value.trim();

    // If no input
    if (!website) {
      alert("Please enter a website URL.");
      return;
    }

    // Check if URL format is valid using regex
    if (!urlPattern.test(website)) {
      alert("Invalid URL format. Please enter a valid website.");
      return;
    }

    try {
      const urlWithProtocol = website.includes("://") ? website : "http://" + website;
      const formattedSite = new URL(urlWithProtocol).hostname.replace(/^www\./, "");

      chrome.storage.sync.get("blockedSites", function (data) {
        const blockedSites = data.blockedSites || [];
        const normalizedSites = blockedSites.map((site) => site.replace(/^www\./, ""));

        // Check if the site is already in the block list
        if (!normalizedSites.includes(formattedSite)) {
          blockedSites.push(formattedSite); // Add the non-www version
          blockedSites.push("www." + formattedSite); // Store the www version
          chrome.storage.sync.set({ blockedSites: blockedSites });
          addSiteToList(formattedSite);
          websiteInput.value = ""; // Clear the input field
        } else {
          alert(`${formattedSite} is already in the block list`);
        }
      });
    } catch (error) {
      alert("Invalid URL. Please enter a valid website.");
    }
  });

  // Function to add site to the list display
  function addSiteToList(site) {
    const li = document.createElement("li");
    li.textContent = site;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.style.marginLeft = "10px";
    removeBtn.addEventListener("click", function () {
      removeSiteFromList(site, li);
    });

    li.appendChild(removeBtn);
    blockList.appendChild(li);
  }

  // Function to remove site from the block list
  function removeSiteFromList(site, listItem) {
    chrome.storage.sync.get("blockedSites", function (data) {
      const blockedSites = data.blockedSites || [];
      const updatedSites = blockedSites.filter((s) => s !== site && s !== "www." + site); // new array that replaces inital array except the removed site
      chrome.storage.sync.set({ blockedSites: updatedSites });
      blockList.removeChild(listItem);
    });
  }

  // Break buttons click event
  breakButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const minutes = parseInt(this.id.split("-")[1]);
      startBreak(minutes);
    });
  });

  // Start break function
  function startBreak(minutes) {
    const breakUntil = Date.now() + minutes * 60000; // Calculate when the break ends
    chrome.storage.sync.set({ focusMode: false, breakUntil: breakUntil }, function () {
      alert(`Break taken for ${minutes} minutes. Focus mode disabled.`);
      setTimeout(() => {
        chrome.storage.sync.set({ focusMode: true });
        // Notify all tabs that focus mode has resumed by sending action
        chrome.runtime.sendMessage({ action: "focusModeResumed" });
        alert("Focus mode resumed.");
      }, minutes * 60000);
    });
  }  
});

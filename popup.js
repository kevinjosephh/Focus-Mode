document.addEventListener("DOMContentLoaded", function () {
  const focusToggle = document.getElementById("focus-toggle");
  const websiteInput = document.getElementById("website-input");
  const addWebsiteBtn = document.getElementById("add-website-btn");
  const blockList = document.getElementById("block-list");
  const breakButtons = document.querySelectorAll('button[id^="break-"]');

  // Load focus mode state and block list from storage
  chrome.storage.sync.get(["focusMode", "blockedSites"], function (data) {
    if (data.focusMode) {
      focusToggle.checked = true;
    }
    if (data.blockedSites) {
      const normalizedSites = data.blockedSites.map((site) =>
        site.replace(/^www\./, "")
      ); // Normalize stored sites
      const uniqueSites = [...new Set(normalizedSites)]; // Remove duplicates
      uniqueSites.forEach((site) => addSiteToList(site)); // Display unique sites
    }
  });

  // Toggle focus mode
  focusToggle.addEventListener("change", function () {
    chrome.storage.sync.set({ focusMode: focusToggle.checked });
  });

  // Add website to block list
  addWebsiteBtn.addEventListener("click", function () {
    const website = websiteInput.value.trim();
    if (website) {
      try {
        // Ensure the URL has a protocol
        const urlWithProtocol = website.includes("://")
          ? website
          : "http://" + website;
        const formattedSite = new URL(urlWithProtocol).hostname.replace(
          /^www\./,
          ""
        ); // Normalize by removing 'www.'

        chrome.storage.sync.get("blockedSites", function (data) {
          const blockedSites = data.blockedSites || [];
          const normalizedSites = blockedSites.map((site) =>
            site.replace(/^www\./, "")
          ); // Normalize current blocked sites

          // Check if the site is already in the block list
          if (!normalizedSites.includes(formattedSite)) {
            blockedSites.push(formattedSite); // Add the non-www version
            blockedSites.push("www." + formattedSite); // Store the www version
            chrome.storage.sync.set({ blockedSites: blockedSites });
            addSiteToList(formattedSite); // Display only the non-www version
            websiteInput.value = ""; // Clear the input field
          } else {
            alert(`${website} is already in the block list`);
          }
        });
      } catch (error) {
        alert("Invalid URL. Please enter a valid website.");
      }
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
      const updatedSites = blockedSites.filter(
        (s) => s !== site && s !== "www." + site
      ); // Remove both versions
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

  // Start Time-Out function
  function startBreak(minutes) {
    chrome.storage.sync.set({ focusMode: false }, function () {
      alert(`Break taken for ${minutes} minutes. Focus mode disabled.`);
      setTimeout(() => {
        chrome.storage.sync.set({ focusMode: true });
        alert("Focus mode resumed.");
      }, minutes * 60000);
    });
  }
});

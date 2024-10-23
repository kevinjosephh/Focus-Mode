document.addEventListener('DOMContentLoaded', function () {
  const focusToggle = document.getElementById('focus-toggle');
  const websiteInput = document.getElementById('website-input');
  const addWebsiteBtn = document.getElementById('add-website-btn');
  const blockList = document.getElementById('block-list');
  const breakButtons = document.querySelectorAll('button[id^="break-"]');

  // Load focus mode state and block list from storage
  chrome.storage.sync.get(['focusMode', 'blockedSites'], function (data) {
      if (data.focusMode) {
          focusToggle.checked = true;
      }
      if (data.blockedSites) {
          data.blockedSites.forEach(site => addSiteToList(site));
      }
  });

  // Toggle focus mode
  focusToggle.addEventListener('change', function () {
      chrome.storage.sync.set({ focusMode: focusToggle.checked });
  });

  // Add website to block list
  addWebsiteBtn.addEventListener('click', function () {
      const website = websiteInput.value.trim();
      if (website) {
          try {
              const formattedSite = new URL(website).hostname;
              chrome.storage.sync.get('blockedSites', function (data) {
                  const blockedSites = data.blockedSites || [];
                  if (!blockedSites.includes(formattedSite)) {
                      blockedSites.push(formattedSite);
                      chrome.storage.sync.set({ blockedSites: blockedSites });
                      addSiteToList(formattedSite);
                      websiteInput.value = '';
                  } else {
                      alert(`${formattedSite} is already in the block list`);
                  }
              });
          } catch (error) {
              alert('Invalid URL. Please enter a valid website.');
          }
      }
  });

  // Function to add site to the list display
  function addSiteToList(site) {
      const li = document.createElement('li');
      li.textContent = site;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.style.marginLeft = '10px';
      removeBtn.addEventListener('click', function () {
          removeSiteFromList(site, li);
      });

      li.appendChild(removeBtn);
      blockList.appendChild(li);
  }

  // Function to remove site from the block list
  function removeSiteFromList(site, listItem) {
      chrome.storage.sync.get('blockedSites', function (data) {
          const blockedSites = data.blockedSites || [];
          const updatedSites = blockedSites.filter(s => s !== site);
          chrome.storage.sync.set({ blockedSites: updatedSites });
          blockList.removeChild(listItem);
      });
  }

  // Break buttons click event
  breakButtons.forEach(button => {
      button.addEventListener('click', function () {
          const minutes = parseInt(this.id.split('-')[1]);
          startBreak(minutes);
      });
  });

  // Start Time-Out function
  function startBreak(minutes) {
      chrome.storage.sync.set({ focusMode: false }, function() {
          alert(`Break taken for ${minutes} minutes. Focus mode disabled.`);
          setTimeout(() => {
              chrome.storage.sync.set({ focusMode: true });
              alert('Focus mode resumed.');
          }, minutes * 60000); 
      });
  }
});

// Load focus mode state, break, blocked sites and specificsite break info from storage
chrome.storage.sync.get(["focusMode", "breakUntil", "blockedSites", "siteTimeouts"], function (data) {
  const currentTime = Date.now();
  const breakUntil = data.breakUntil || 0;

  // Check if break is still active for overall focus mode
  const isOverallBreakActive = currentTime < breakUntil;

  // Check if break is active for the specific site
  const siteTimeout = data.siteTimeouts && data.siteTimeouts[window.location.hostname];
  const isSiteBreakActive = siteTimeout && currentTime < siteTimeout;

  // Display the appropriate message if the user is on a break
  if (isOverallBreakActive || isSiteBreakActive) {
      const breakEndTime = isOverallBreakActive ? breakUntil : siteTimeout;
      
      const breakMessage = document.createElement("div");
      breakMessage.style.position = "fixed";
      breakMessage.style.top = "0";
      breakMessage.style.left = "0";
      breakMessage.style.width = "100%";
      breakMessage.style.backgroundColor = "rgba(255, 255, 0, 0.9)"; // Yellow color for visibility
      breakMessage.style.color = "black";
      breakMessage.style.display = "flex";
      breakMessage.style.alignItems = "center";
      breakMessage.style.justifyContent = "center";
      breakMessage.style.zIndex = "9999";
      breakMessage.style.padding = "10px";
      breakMessage.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.5)";
      document.body.appendChild(breakMessage);

      const updateBreakMessage = () => {
          const timeLeft = Math.floor((breakEndTime - Date.now()) / 1000); // Time left in seconds
          const minutesLeft = Math.floor(timeLeft / 60);
          const secondsLeft = timeLeft % 60;

          if (timeLeft <= 0) {
              breakMessage.remove();
              chrome.storage.sync.set({ breakUntil: 0, focusMode: true }); // Reset breakUntil and set focusMode to true
              location.reload(); // Reload to re-enable focus mode
          } else {
              breakMessage.innerHTML = `
                  <div>
                      <strong>You are on a break!</strong>
                      <span>Focus mode will resume in ${minutesLeft} minutes ${secondsLeft} seconds.</span>
                  </div>
              `;
          }
      };

      // Initial message update
      updateBreakMessage();

      // Update the message every second
      const intervalId = setInterval(() => {
          updateBreakMessage();
      }, 1000);

      // Clear the interval when break ends
      const breakDuration = breakEndTime - currentTime;
      setTimeout(() => {
          clearInterval(intervalId);
      }, breakDuration);
  } else if (data.focusMode) {
      // If focus mode is active and break is over, apply blocking logic
      const currentSite = window.location.hostname;
      const baseCurrentSite = currentSite.replace(/^www\./, "");

      const isBlocked = data.blockedSites.some(
          (site) => baseCurrentSite === site || baseCurrentSite.endsWith("." + site)
      );

      // Logging for debugging
      console.log("Current Site:", currentSite);
      console.log("Blocked Sites:", data.blockedSites);
      console.log("Is Blocked:", isBlocked);

      if (isBlocked) {
          // Block the site
          document.body.innerHTML = ''; // Clear the page content

          const blockMessage = document.createElement("div");
          blockMessage.style.position = "fixed";
          blockMessage.style.top = "0";
          blockMessage.style.left = "0";
          blockMessage.style.width = "100%";
          blockMessage.style.height = "100%";
          blockMessage.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
          blockMessage.style.color = "white";
          blockMessage.style.display = "flex";
          blockMessage.style.alignItems = "center";
          blockMessage.style.justifyContent = "center";
          blockMessage.style.zIndex = "9999";
          blockMessage.style.fontSize = "24px";
          blockMessage.innerHTML = `
              <div>
                  <h1>This website is blocked during Focus Mode!</h1>
                  <button id="timeout-button">Take 5-Minute Timeout</button>
              </div>
          `;
          document.body.appendChild(blockMessage);

          document.getElementById("timeout-button").addEventListener("click", function () {
              blockMessage.remove(); // Remove the block message

              const fiveMinutesLater = Date.now() + 5 * 60 * 1000; // 5 minutes in future
              chrome.storage.sync.set(
                  { siteTimeouts: { ...data.siteTimeouts, [window.location.hostname]: fiveMinutesLater } },
                  function () {
                      // Inform all tabs that a break is happening
                      chrome.runtime.sendMessage({ action: "breakStarted" });
                  }
              );
          });
      }
  }
});

// Listen for storage changes to sync break status across tabs
chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === "sync" && (changes.breakUntil || changes.focusMode || changes.siteTimeouts)) {
      location.reload(); // Reload the tab when break status changes
  }
});

// Consolidate message listener for focus mode and break status
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "focusModeResumed") {
      location.reload(); // Reload to refresh the blocking logic
  }

  if (request.action === "checkFocusMode") {
      chrome.storage.sync.get("focusMode", (data) => {
          sendResponse({ focusMode: data.focusMode });
      });
      return true; // Indicates you wish to send a response asynchronously
  }

  // Listen for break started action to handle break across tabs
  if (request.action === "breakStarted") {
      chrome.storage.sync.get(["breakUntil", "siteTimeouts"], function (data) {
          const currentTime = Date.now();
          const breakUntil = data.breakUntil || 0;

          // Check if a global break is active
          const isOverallBreakActive = currentTime < breakUntil;

          // Check if a site-specific break is active
          const siteTimeout = data.siteTimeouts && data.siteTimeouts[window.location.hostname];
          const isSiteBreakActive = siteTimeout && currentTime < siteTimeout;

          if (isOverallBreakActive || isSiteBreakActive) {
              location.reload(); // Reload the tab to update state
          }
      });
  }
});

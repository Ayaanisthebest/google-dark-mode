document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".option-btn");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  function updateStatus(mode) {
    if (mode === "dark") {
      statusDot.style.background = "#0a84ff";
      statusText.textContent = "Always Dark is on";
      return;
    }
    if (mode === "light") {
      statusDot.style.background = "#ffd60a";
      statusText.textContent = "Always Light is on";
      return;
    }
    if (systemIsDark) {
      statusDot.style.background = "#30d158";
      statusText.textContent = "Auto: Mac is in Dark Mode";
      return;
    }
    statusDot.style.background = "#8e8e93";
    statusText.textContent = "Auto: Mac is in Light Mode";
  }

  function setActiveButton(mode) {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    updateStatus(mode);
  }

  chrome.storage.local.get(["themeMode"], (result) => {
    setActiveButton(result.themeMode || "auto");
  });

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      chrome.storage.local.set({ themeMode: mode }, () => {
        setActiveButton(mode);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0]?.id;
          if (!tabId) return;
          chrome.tabs.sendMessage(tabId, { action: "setTheme", mode }).catch(() => {});
        });
      });
    });
  });
});

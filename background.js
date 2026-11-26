async function toggleActiveWindowFullscreen() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || tab.windowId == null) return;

  let htmlWorked = false;
  try {
    htmlWorked = await chrome.tabs.sendMessage(
      tab.id,
      { action: "toggleFullscreen" },
      { frameId: 0 }
    );
  } catch {
    htmlWorked = false;
  }

  if (htmlWorked) return;

  const win = await chrome.windows.get(tab.windowId);
  const nextState = win.state === "fullscreen" ? "normal" : "fullscreen";
  await chrome.windows.update(tab.windowId, { state: nextState });
}

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-fullscreen") return;
  void toggleActiveWindowFullscreen();
});

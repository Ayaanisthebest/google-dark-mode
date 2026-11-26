function isFullscreenShortcut(event) {
  return (
    event.altKey &&
    event.shiftKey &&
    !event.metaKey &&
    !event.ctrlKey &&
    event.key.toLowerCase() === "f"
  );
}

function getFullscreenDocument() {
  try {
    return window.top.document;
  } catch {
    return document;
  }
}

function toggleHtmlFullscreen() {
  const doc = getFullscreenDocument();
  if (doc.fullscreenElement) {
    return doc.exitFullscreen().then(() => true).catch(() => false);
  }

  const root = doc.documentElement;
  const request = () => root.requestFullscreen({ navigationUI: "hide" });
  try {
    const result = request();
    if (result && typeof result.catch === "function") {
      return result.then(() => true).catch(() => {
        return root.requestFullscreen().then(() => true).catch(() => false);
      });
    }
    return Promise.resolve(Boolean(doc.fullscreenElement));
  } catch {
    return Promise.resolve(false);
  }
}

window.addEventListener(
  "keydown",
  (event) => {
    if (!isFullscreenShortcut(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void toggleHtmlFullscreen();
  },
  true
);

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.action !== "toggleFullscreen") return;
    toggleHtmlFullscreen().then(sendResponse);
    return true;
  });
}

const media = window.matchMedia("(prefers-color-scheme: dark)");
let themeMode = "auto";
let tagTimer = 0;

function shouldUseDark() {
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;
  return media.matches;
}

function applyTheme() {
  const dark = shouldUseDark();
  document.documentElement.classList.toggle("gdocs-dark", dark);
  if (dark) {
    scheduleTagChrome();
  } else {
    clearChromeTags();
    clearRulerPaint();
  }
}

function setMode(mode) {
  themeMode = mode === "dark" || mode === "light" ? mode : "auto";
  applyTheme();
}

function scheduleTagChrome() {
  window.clearTimeout(tagTimer);
  tagTimer = window.setTimeout(() => {
    tagChrome();
    paintRulers();
  }, 50);
}

function clearChromeTags() {
  document.querySelectorAll(".gdocs-invert-chrome").forEach((el) => {
    el.classList.remove("gdocs-invert-chrome");
  });
}

function isRulerNode(el) {
  if (!el || el.nodeType !== 1) return false;
  const id = (el.id || "").toLowerCase();
  const className = String(el.className || "").toLowerCase();
  return (
    id.includes("ruler") ||
    className.includes("kix-ruler") ||
    className.includes("docs-ruler") ||
    className.includes("docs-horizontal-ruler")
  );
}

function isInsideEditor(el) {
  if (isRulerNode(el) || el.closest("[data-gdocs-ruler]")) return false;
  return Boolean(
    el.closest(
      "#docs-editor, .kix-appview-editor, .kix-canvas-tile-content, .kix-page, .kix-page-paginated"
    )
  );
}

function tagIfNeeded(el) {
  if (!el || isInsideEditor(el)) return;
  if (isRulerNode(el)) return;
  if (el.closest(".gdocs-invert-chrome")) return;
  el.classList.add("gdocs-invert-chrome");
}

function tagChrome() {
  if (!shouldUseDark()) return;

  const byId = [
    "docs-header",
    "docs-bars",
    "docs-toolbar",
    "docs-toolbar-wrapper",
    "docs-titlebar-container",
    "gb",
  ];
  byId.forEach((id) => tagIfNeeded(document.getElementById(id)));

  document
    .querySelectorAll(
      ".docs-titlebar-buttons, .docs-titlebar-container, .docs-titlebar, #docs-toolbar-wrapper, .docs-toolbar-wrapper, .docs-material-header"
    )
    .forEach((el) => tagIfNeeded(el));

  const share = document.querySelector(
    "#docs-titlebar-share-client-button, [aria-label='Share'], [aria-label^='Share'], button[aria-label*='Share']"
  );
  if (share && !share.closest(".gdocs-invert-chrome")) {
    let node = share.parentElement;
    for (let i = 0; i < 6 && node; i += 1) {
      const style = window.getComputedStyle(node);
      const radius = Number.parseFloat(style.borderRadius) || 0;
      if (radius >= 12 && isLightColor(style.backgroundColor)) {
        tagIfNeeded(node);
        break;
      }
      node = node.parentElement;
    }
    if (share && !share.closest(".gdocs-invert-chrome")) {
      tagIfNeeded(share.parentElement);
    }
  }
}

function collectRulerRoots() {
  const roots = [];
  document
    .querySelectorAll(
      "#kix-horizontal-ruler, #kix-vertical-ruler, #kix-ruler, #kix-horizontal-ruler-container, #kix-vertical-ruler-container, .docs-horizontal-ruler, .docs-ruler-mask, [id*='ruler'], [id*='Ruler'], [class*='kix-ruler'], [class*='docs-ruler']"
    )
    .forEach((el) => {
      if (el.closest(".kix-canvas-tile-content")) return;
      roots.push(el);
    });

  const editor =
    document.getElementById("docs-editor") ||
    document.querySelector(".kix-appview-editor");
  const editorTop = editor ? editor.getBoundingClientRect().top : 220;

  document.querySelectorAll("div, canvas, svg, table").forEach((el) => {
    if (el.closest(".kix-canvas-tile-content")) return;
    const box = el.getBoundingClientRect();
    if (box.width < 360 || box.height < 12 || box.height > 40) return;
    if (box.top < 70 || box.top > editorTop + 24) return;
    if (box.bottom < editorTop - 8) return;
    if (!isLightColor(window.getComputedStyle(el).backgroundColor) && el.tagName !== "CANVAS") {
      return;
    }
    roots.push(el);
  });

  return roots;
}

function paintRulerTree(root) {
  root.setAttribute("data-gdocs-ruler", "1");
  const nodes = [root, ...root.querySelectorAll("*")];
  nodes.forEach((el) => {
    const tag = el.tagName;
    if (tag === "CANVAS" || tag === "SVG" || tag === "IMG") {
      el.style.setProperty("filter", "invert(1) hue-rotate(180deg)", "important");
      return;
    }
    el.style.setProperty("background-color", "#000000", "important");
    el.style.setProperty("background-image", "none", "important");
    el.style.setProperty("color", "#cccccc", "important");
    el.style.setProperty("border-color", "#555555", "important");
    el.style.setProperty("box-shadow", "none", "important");
    el.style.setProperty("fill", "#cccccc", "important");
    el.style.setProperty("stroke", "#cccccc", "important");
  });
}

function clearRulerPaint() {
  document.querySelectorAll("[data-gdocs-ruler]").forEach((root) => {
    const nodes = [root, ...root.querySelectorAll("*")];
    nodes.forEach((el) => {
      el.style.removeProperty("filter");
      el.style.removeProperty("background-color");
      el.style.removeProperty("background-image");
      el.style.removeProperty("color");
      el.style.removeProperty("border-color");
      el.style.removeProperty("box-shadow");
      el.style.removeProperty("fill");
      el.style.removeProperty("stroke");
    });
    root.removeAttribute("data-gdocs-ruler");
  });
}

function paintRulers() {
  if (!shouldUseDark()) return;
  collectRulerRoots().forEach((el) => paintRulerTree(el));
}

function isLightColor(color) {
  const match = color && color.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!match) return false;
  const red = Number(match[1]);
  const green = Number(match[2]);
  const blue = Number(match[3]);
  return 0.299 * red + 0.587 * green + 0.114 * blue > 160;
}

media.addEventListener("change", applyTheme);
applyTheme();

const observer = new MutationObserver(() => {
  if (shouldUseDark()) scheduleTagChrome();
});
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["themeMode"], (result) => {
    setMode(result.themeMode || "auto");
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.themeMode) {
      setMode(changes.themeMode.newValue || "auto");
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.action === "setTheme") {
      setMode(message.mode);
      sendResponse({ status: "ok" });
    }
  });
}

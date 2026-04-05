const SCRIPT_FLAG = "data-treelocator-extension-script";

function isSupportedDocumentType(): boolean {
  return (
    document.contentType === "text/html" ||
    document.contentType === "application/xhtml+xml" ||
    document.contentType === ""
  );
}

function appendScript(src: string, onLoaded?: () => void): void {
  const parent = document.documentElement;
  if (!parent) {
    return;
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = false;
  script.setAttribute(SCRIPT_FLAG, "true");

  script.onload = () => {
    script.remove();
    if (onLoaded) {
      onLoaded();
    }
  };

  script.onerror = () => {
    script.remove();
  };

  parent.appendChild(script);
}

function initBridgeMetadata(): { hookUrl: string; clientUrl: string } | null {
  const root = document.documentElement;
  if (!root) {
    return null;
  }

  const hookUrl = chrome.runtime.getURL("hook.bundle.js");
  const clientUrl = chrome.runtime.getURL("client.bundle.js");

  // Compatibility field for existing LocatorJS hook bridge conventions.
  root.dataset.locatorClientUrl = clientUrl;

  // TreeLocator-specific bridge metadata.
  root.dataset.treelocatorHookUrl = hookUrl;
  root.dataset.treelocatorClientUrl = clientUrl;
  root.dataset.treelocatorBridge = "enabled";

  return { hookUrl, clientUrl };
}

function bootstrapPageRuntime(): void {
  if (!isSupportedDocumentType()) {
    return;
  }

  const metadata = initBridgeMetadata();
  if (!metadata) {
    return;
  }

  appendScript(metadata.hookUrl, () => {
    appendScript(metadata.clientUrl);
  });
}

bootstrapPageRuntime();

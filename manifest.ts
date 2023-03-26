import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  options_page: "src/pages/options/index.html",
  background: {
    service_worker: "src/pages/serviceWorker/index.js",
    type: "module",
  },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: "64.png",
  },
  icons: {
    "128": "128.png",
    "64": "64.png",
    "32": "32.png",
    "16": "16.png"
  },
  omnibox: {
    keyword: "notes"
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Alt+N",
        mac: "Alt+N"
      }
    }
  },
  permissions: [
    "storage",
    "activeTab",
    "contextMenus"
  ],
  default_locale: "en",
  content_scripts: [
    {
      "matches": [ "https://lars.koelker.dev/extensions/note/?version=*" ],
      "js": [ "src/pages/hideUpdateNotice/index.js" ]
    }
  ],
  web_accessible_resources: [{
    "resources": [ "manifest.json" ],
    "matches": [ "https://*.koelker.dev/*" ]
  }]
};

export default manifest;

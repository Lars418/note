import reloadOnUpdate from "virtual:reload-on-update-in-background-script";
import Utils from '@src/utils/utils';
import ContextType = chrome.contextMenus.ContextType;


reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion}) => {
    switch (reason) {
        case chrome.runtime.OnInstalledReason.INSTALL:
            await handleInstall();
            break;
        case chrome.runtime.OnInstalledReason.UPDATE:
            await handleUpdate(previousVersion);
            break;
    }

    await Utils.initContextMenus();
});

async function handleInstall() {
    const defaultStorage = await Utils.getDefaultStorage();

    await chrome.storage.local.set(defaultStorage);
}

async function handleUpdate(previousVersion: string) {
    const { version } = chrome.runtime.getManifest();
    const { settings } = await chrome.storage.local.get('settings');
    const defaultStorage = await Utils.getDefaultStorage();

    if (version === previousVersion) {
        return;
    }

    await chrome.storage.local.set({
        previousVersion: { visible: true, value: previousVersion  },
    });

    await chrome.storage.local.set({
        settings: {
            ...settings,
            default: defaultStorage.settings.default
        }
    });
}


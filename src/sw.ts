import reloadOnUpdate from "virtual:reload-on-update-in-background-script";
import Utils from '@src/utils/utils';
import ContextType = chrome.contextMenus.ContextType;
import Alarm = chrome.alarms.Alarm;
import Query from "@src/utils/query";
import UrlCache from "@src/utils/urlCache";
import {PreviewBase} from "@src/@types/interface/linkPreview/previewBase";


reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

//#region Install / Update
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

    await chrome.storage.local.set({
        settings: {
            ...settings,
            default: defaultStorage.settings.default
        }
    });

    if (version === previousVersion) {
        return;
    }

    await chrome.storage.local.set({
        previousVersion: { visible: true, value: previousVersion  },
    });
}
//#endregion

//#region Link preview updater
chrome.alarms.onAlarm.addListener(async (alarm: Alarm) => {
    const { type, url } = JSON.parse(alarm.name);

    if (type === 'URL_CACHE_EXPIRATION') {
        console.log('Updating URL cache for: ', url);
        const linkPreview = await Query.getLinkPreview(url);

        if (linkPreview.type !== 'error') {
            chrome.alarms.create(JSON.stringify({
                type: 'URL_CACHE_EXPIRATION',
                url
            }), {
                when: new Date((linkPreview as PreviewBase).exp).getTime()
            });
        }

        await UrlCache.setOrUpdate(url, linkPreview);
    }
});
//#endregion


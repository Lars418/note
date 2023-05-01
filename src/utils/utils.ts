import ContextType = chrome.contextMenus.ContextType;
import {DefaultStorage} from '@src/@types/interface/defaultStorage';

class Utils {
    static async getDefaultStorage(): Promise<DefaultStorage> {
        const request = await fetch('/config/defaultStorage.json');

        return await request.json();
    };

    /**
     * @description Initializes extension badge
     * */
    static async initBadge(): Promise<void> {
        const { notes } = await chrome.storage.local.get('notes');
        const noteAmount: number = notes.filter(note => !note.completed).length;

        await chrome.action.setBadgeText({
            text: noteAmount.toString(),
        });
        await chrome.action.setBadgeBackgroundColor({
            color: '#3367d6',
        });
    }

    /**
     * @description Initializes context menus
     * */
    static async initContextMenus(): Promise<void> {
        const translationPrefix = 'contextMenu';
        const contexts: ContextType[] = [ 'selection', 'link', 'image', 'video', 'audio' ];
        const { settings } = await chrome.storage.local.get('settings');

        await this._removeAllContextMenus();

        contexts.forEach(ctx => {
            const capitalizedCtx = ctx.charAt(0).toUpperCase() + ctx.slice(1);

            chrome.contextMenus.create({
                id: crypto.randomUUID(),
                contexts: [ ctx ],
                title: chrome.i18n.getMessage(translationPrefix + capitalizedCtx),
                visible: settings.custom.showContextMenu ?? settings.default.showContextMenu,
            });
        });
    }

    /**
     * @description Clears context menus
     * @private
     * @async
     * */
    static async _removeAllContextMenus(): Promise<boolean> {
        return new Promise(resolve => {
            chrome.contextMenus.removeAll(() => resolve(true));
        });
    }

    /**
     * @private
     * @async
     * */
    static async _getSupportedLanguages(): Promise<string[]> {
        return new Promise(resolve => {
           chrome.runtime.getPackageDirectoryEntry(callback => {
                callback.getDirectory('_locales', { create: false }, directory => {
                   directory
                       .createReader()
                       .readEntries(results => {
                           const locales = results.map(result => result.name);

                           resolve(locales);
                       });
                });
           });
        });
    }

    static async getLanguage() {
        const supportedLanguages = await this._getSupportedLanguages();
        const language = chrome.i18n.getUILanguage();
        const countryCode = language.split('-')[0];

        if (supportedLanguages.includes(language)) {
           return language;
        }

        if (supportedLanguages.includes(countryCode)) {
            return countryCode;
        }

        return 'en';
    }

    /**
     * @description Returns a random message of the day
     * @returns {string} Message of the day
     * @async
     * */
    static async getRandomMotd(): Promise<string> {
        const rawMotds = await fetch('/config/motd.json').then(response => response.json());
        let motds = [];
        const lang = await this.getLanguage();
        motds = rawMotds[lang];

        const randomIndex = Math.floor(Math.random() * motds.length);

        return motds?.[randomIndex];
    }
}

export default Utils;

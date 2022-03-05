const {
    i18n: { getMessage },
    runtime,
    storage,
    tabs,
    contextMenus,
    action,
    omnibox,
} = chrome;

runtime.onInstalled.addListener(async ({ reason }) => {
    const installReason = runtime.OnInstalledReason;

    if(reason === installReason.INSTALL) {
        // Load default settings
        await fetch("../json/defaultSettings.json")
        .then(res => res.json())
        .then(async (json) => {
            Object.keys(json.notePriorities).map(async (x) => {
                json.notePriorities[x] = {
                    ...json.notePriorities[x],
                    default: {
                        ...json.notePriorities[x].default,
                        value: await _getMessage(json.notePriorities[x].default.value)
                    }
                }
            });

            storage.local.set(json);

            await initContextMenu();

            tabs.create({
                url: "https://lars.koelker.dev/extensions/note/install.php"
            })
        });

    }

    if(reason === installReason.UPDATE) {
        const { version, version_name, previousVersion } = runtime.getManifest();

        storage.local.get('settings', async ({ settings }) => {
            // Show version changelog if enabled (silent update if version name starts with "&shy;" (shy char: "­"))
            if((settings.custom.advancedShowChangelog ?? settings.default.advancedShowChangelog) && !version_name.startsWith("­")) {
                runtime.getPlatformInfo(info => {
                    tabs.create({
                        url: `https://lars.koelker.dev/extensions/note/changelog.php?v=${encodeURIComponent(version)}&previous=${encodeURIComponent(previousVersion)}&os=${info.os}`
                    });
                });
            }

            // Update default settings in case new ones have been added
            const defaultSettings = await fetch("../json/defaultSettings.json").then(res => res.json());

            console.log('Updating default settings', defaultSettings);

            storage.local.set({
                settings: {
                    ...settings,
                    default: defaultSettings.settings.default,
                },
            });

            await initContextMenu();
            contextMenus.update('1', {
                visible: settings.custom.showContextMenu ?? settings.default.showContextMenu
            });
        });
    }

    storage.local.get('userId',async ({ userId }) => {
        if (!userId) {
            storage.local.set({
                userId: (await createUuid()),
            })
        }
    });

    initBadge();
});

runtime.onStartup.addListener(async () => {
    initBadge();

    storage.local.get('settings', ({ settings }) => {
        contextMenus.update('1', {
            visible: settings.custom.showContextMenu ?? settings.default.showContextMenu
        });
    })

    await initContextMenu();
});

storage.onChanged.addListener(({ notes }) => {
    if (notes) {
        action.setBadgeText({
            text: notes.newValue.filter(note => !note.completed).length.toString()
        });
    }
});

omnibox.onInputEntered.addListener((text) => addNote(text));

//#region helper
function addNote(value, origin = null, priority = 'MEDIUM') {
    storage.local.get('notes', ({ notes }) => {
        notes.push({
            completed: false,
            date: new Date().toISOString(),
            id: createId(),
            priority,
            value,
            origin
        });

        storage.local.set({ notes });
    });
}

function initBadge() {
    action.setBadgeBackgroundColor({
        color: '#3367d6'
    });
    storage.local.get('notes', ({ notes }) => {
        action.setBadgeText({
            text: notes.filter(note => !note.completed).length.toString()
        });
    });
}

async function initContextMenu() {
    const title = await _getMessage('contextMenuText');

    contextMenus.create({
        id: '1',
        contexts: [ 'selection' ],
        title,
        visible: true
    });

    contextMenus.onClicked.addListener((e) => {
        switch (e.menuItemId) {
            case '1':
                addNote(e.selectionText, e.pageUrl);
                break;
            default:
                return;
        }
    });
}

/**
 * Create an id
 * @author https://stackoverflow.com/a/2117523/8463645
 */
function createId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function createUuid() {
    return new Promise((resolve) => {
        runtime.getPlatformInfo(({ os, arch, nacl_arch }) => {
             resolve(btoa(`${createId()};${os};${arch};${nacl_arch}`));
        });
    });
}

// TODO: Change when Chrome v100 rolled out (starting at 29.03.2022)
/** This method ignores placeholders, but hence it is only being used for two keys who don't need placeholders, it's fine */
async function _getMessage(key) {
    if (typeof getMessage === 'undefined') {
        const lang = navigator.language.toLowerCase().includes('de') ? 'de' : 'en';
        const path = `./_locales/${lang}/messages.json`;

        const translations = await fetch(path).then(res => res.json());
        const preparedTranslations = Object.fromEntries(Object.entries(translations).map(translation => [translation[0], translation[1].message]))

        return preparedTranslations[key];
    }

    return getMessage(key);
}
//#endregion
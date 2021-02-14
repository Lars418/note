function getMsg(msg) {
    return chrome.i18n.getMessage(msg);
}

chrome.runtime.onInstalled.addListener(async e => {
    // use svg icon instead of png
    chrome.browserAction.setIcon({ path: 'img/extension_icon/file.svg' });
    
    if(e.reason === 'install') {
        // Load default settings
        await fetch("../json/defaultSettings.json")
        .then(res => res.json())
        .then(json => {
            Object.keys(json.notePriorities).map(x => {
                json.notePriorities[x] = {
                    ...json.notePriorities[x],
                    default: {
                        ...json.notePriorities[x].default,
                        value: getMsg(json.notePriorities[x].default.value)
                    }
                }
            });

            chrome.storage.local.set(json);

            initContextMenu();

            chrome.tabs.create({
                url: "https://lars.koelker.dev/extensions/note/install.php"
            })
        });

    }
    else if(e.reason === "update") {
        const { version, previousVersion } = chrome.runtime.getManifest();

        chrome.storage.local.get("settings", res => {
            // show version changelog if enabled
            if(res.settings.custom.advancedShowChangelog ?? res.settings.default.advancedShowChangelog) {
                chrome.runtime.getPlatformInfo(info => {
                    chrome.tabs.create({
                        url: `https://lars.koelker.dev/extensions/note/changelog.php?v=${encodeURIComponent(version)}&previous=${encodeURIComponent(previousVersion)}&os=${info.os}`
                    });
                });
            };

            // update context menu
            initContextMenu();
            chrome.contextMenus.update("1", {
                visible: res.settings.custom.showContextMenu ?? res.settings.default.showContextMenu
            });
        });
    }

    initBadge();
});

chrome.runtime.onStartup.addListener(() => {
    initBadge();
    initContextMenu();
})

chrome.storage.onChanged.addListener(res => {
    if(res.notes) {
        chrome.browserAction.setBadgeText({
            text: res.notes.newValue.filter(note => !note.completed).length.toString()
        });
    }
})

//#region helper
function addNoteThroughContextmenu(value, origin, priority = "MEDIUM") {
    chrome.storage.local.get("notes", res => {
        const notes = res.notes;

        notes.push({
            completed: false,
            date: new Date().toISOString(),
            id: uuidv4(),
            priority,
            value,
            origin
        });

        chrome.storage.local.set({notes});
    })
}

function initBadge() {
    chrome.browserAction.setBadgeBackgroundColor({
        color: "#3367d6"
    });
    chrome.storage.local.get("notes", res => {
        chrome.browserAction.setBadgeText({
            text: res.notes.filter(note => !note.completed).length.toString()
        });
    });
}

function initContextMenu() {
    chrome.contextMenus.create({
        id: "1",
        contexts: [ "selection" ],
        title: chrome.i18n.getMessage("contextMenuText"),
        onclick: res => addNoteThroughContextmenu(res.selectionText, res.pageUrl),
        visible: true
    });
}

/**
 * Generated a uuidv4
 * @author https://stackoverflow.com/a/2117523/8463645
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
//#endregion
//#region vars
const generalOptionsWrapper = document.getElementById("generalOptionsWrapper");
const advancedOptionsWrapper = document.getElementById("advancedOptionsWrapper");
const priorityNamesWrapper = document.getElementById("priorityNamesWrapper");
const clearCompletedNotesBtn = document.getElementById("clearCompletedNotes");
const resetSettingsBtn = document.getElementById("resetSettings");
const exportNotesBtn = document.getElementById("exportNotes");
const donwloadAnchor = document.getElementById("downloadAnchor");
const importNotesBtn = document.getElementById("importNotes");
const importNotesInput = document.getElementById("importNotesInput");
const debug = document.getElementById("debug");
const debugWrapper = document.getElementById("debugInformationWrapper");
const optionDialog = document.getElementById("dialogOption");
const optionDialogOk = document.getElementById("dialogOk");
const optionDialogClose = document.getElementById("dialogClose");
const uiLang =  chrome.i18n.getUILanguage();
const manifest = chrome.runtime.getManifest();
const osMapping = {
    android: "Android",
    cros: "Cr OS Linux",
    linux: "Linux",
    mac: "MacOS",
    openbsd: "OpenBSD",
    win: "Windows",
}
//#endregion


//#region init
document.documentElement.lang = chrome.i18n.getMessage("@@ui_locale");
document.title = chrome.i18n.getMessage("optionsTitle");

document.getElementById("copyright").innerHTML = chrome.i18n.getMessage("optionsCopyrightNotice", new Date().getFullYear().toString());

// dropdowns
document.querySelectorAll(".dropdown").forEach(btn => {
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");

    btn.addEventListener("keydown", e => {
        if(e.key === " " || e.key === "Enter") {
            e.preventDefault();
            btn.click();
        }
    })

    btn.addEventListener("click", e => {
        e.preventDefault();

        if(btn.getAttribute("aria-expanded") === "false") btn.setAttribute("aria-expanded", "true");
        else btn.setAttribute("aria-expanded", "false");
    });
});

// option dialog
[optionDialogClose, optionDialogOk].forEach(btn => btn.onclick = closeOptionDialog);

// debug
if(new URL(location.href).searchParams.get("debug") === "1") debug.style.display = "block";
//#endregion

//#region i18n
const i18n = document.querySelectorAll("[intl]");
const i18nTitle = document.querySelectorAll("[intl-title]");
i18n.forEach(msg => {
    msg.innerHTML = chrome.i18n.getMessage(msg.getAttribute("intl") || msg.id);
    msg.removeAttribute("intl");
});
i18nTitle.forEach(msg => {
    msg.title = chrome.i18n.getMessage(msg.getAttribute("intl-title"));
    msg.removeAttribute("intl-title");
});
//#endregion

//#region load settings
chrome.storage.local.get(["settings", "notePriorities"], res => {
    const settings = Object.keys(res.settings.default);
    const notePriorities = res.notePriorities;
    
    const generalOptions = settings.filter(x => !x.startsWith("advanced") && typeof res.settings.default[x] === "boolean");
    const advancedOptions = settings.filter(x => x.startsWith("advanced") && typeof res.settings.default[x] === "boolean");

    generalOptions.map(setting => createOption(setting, res.settings, generalOptionsWrapper));
    advancedOptions.map(setting => createOption(setting, res.settings, advancedOptionsWrapper));
    notePriorities.map(priority => createPriority(priority, priorityNamesWrapper));

    if(res.settings.custom.advancedUser ?? res.settings.default.advancedUser) debug.style.display = "initial";
})
//#endregion

//#region actions
clearCompletedNotesBtn.onclick = () => {
    chrome.storage.local.get("notes", res => {
        const { notes } = res;
        const updatedNotes = notes.filter(note => !note.completed);

        chrome.storage.local.set({
            notes: updatedNotes
        });
        showSuccessOnBtn(clearCompletedNotesBtn);
    });
}

resetSettingsBtn.onclick = async () => {
    await fetch("../json/defaultSettings.json")
    .then(res => res.json())
    .then(json => {
        Object.keys(json.notePriorities).map(x => {
            json.notePriorities[x] = {
                ...json.notePriorities[x],
                default: {
                    ...json.notePriorities[x].default,
                    value: chrome.i18n.getMessage(json.notePriorities[x].default.value)
                }
            }
        });

        chrome.storage.local.get("notes", noteRes => {
            const { notes } = noteRes;

            chrome.storage.local.set({
                ...json,
                notes
            });
            showSuccessOnBtn(resetSettingsBtn, 800, true);
        });
    });
}

exportNotesBtn.onclick = () => {
    chrome.storage.local.get("notes", res => {
        const { notes } = res;

        donwloadAnchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(notes))}`;
        donwloadAnchor.download = chrome.i18n.getMessage("downloadFileName", new Intl.DateTimeFormat(uiLang).format(new Date()));
        donwloadAnchor.click();
        showSuccessOnBtn(exportNotesBtn);
    })
}

importNotesInput.onchange = e => {
    const file = importNotesInput.files[0];
    const reader = new FileReader();

    if(file.type !== "application/json") return;

    reader.addEventListener("load", e => {
        const notes = JSON.parse(e.target.result);

        chrome.storage.local.set({ notes });
        showSuccessOnBtn(importNotesBtn);  
    });
    reader.readAsText(file);
}
//#endregion

//#region debug
chrome.runtime.getPlatformInfo(info => {
    debugWrapper.innerHTML = `
        <p>${manifest.name} - v${manifest.version}</p>
        <p>${osMapping[info.os]} ${info.arch} (${info.nacl_arch})</p>
    `;
});
//#endregion

//#region helper functions
function createOption(setting, settingsObject, wrapper) {
    const settingWrapper = document.createElement("div");
    settingWrapper.classList.add("setting-item");
    settingWrapper.innerHTML = `
    <div class="label-wrapper">
        <label
        for="${setting}"
        id="${setting}Desc"
        >
            ${chrome.i18n.getMessage(setting)}
        </label>
        <button title="${chrome.i18n.getMessage("optionMoreInformation")}" class="option-dialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        </button>
    </div>

    <input
        type="checkbox"
        ${(settingsObject.custom[setting] ?? settingsObject.default[setting]) && "checked"}
        id="${setting}"
    />
    <label
        for="${setting}"
        tabindex="0"
        role="button"
        aria-describedby="${setting}Desc"
        class="is-switch"
    ></label>
    `;

    const toggleSwitch = settingWrapper.querySelector("label.is-switch");
    const input = settingWrapper.querySelector("input");
    const optionHelp = settingWrapper.querySelector(".option-dialog");

    input.onchange = () => updateSetting(setting, input.checked);

    optionHelp.onclick = () => showOptionDialog(setting);

    toggleSwitch.onkeydown = e => {
        if(e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggleSwitch.click();
        }
    }

    wrapper.appendChild(settingWrapper);
}

function createPriority(priority, wrapper) {
    const prio = document.createElement("div");
    console.log(priority);
    prio.style.backgroundColor = priority.custom.color || priority.default.color;
    prio.innerHTML = 
    `
        ${priority.custom.icon ||priority.default.icon}
        <input
            type="text"
            value="${priority.custom.value || priority.default.value}"
            name="${priority.name}"
        />
    `;

    const prioInput = prio.querySelector("input");
    prioInput.oninput = () => {
        chrome.storage.local.get("notePriorities", res => {
            const { notePriorities } = res;
            const updatedPriorities = notePriorities.find(p => p.name === priority.name);
            updatedPriorities.custom.value = prioInput.value.trim();

            chrome.storage.local.set({notePriorities});
        })
    }

    wrapper.appendChild(prio);
}

function showOptionDialog(option) {
    const optionDialogTitle = document.getElementById("optionTitle");
    const optionDialogDescription = document.getElementById("optionDescription");

    optionDialogTitle.textContent = chrome.i18n.getMessage(option);
    optionDialogDescription.innerHTML = chrome.i18n.getMessage(option + "Desc").replace("\n", "<br>");

    optionDialog.showModal();
}

function closeOptionDialog() {
    optionDialog.close();
}

function updateSetting(key, value) {
    chrome.storage.local.get("settings", res => {

        if(key === "showContextMenu") {
            chrome.permissions.contains({permissions: [ "contextMenus" ]}, bool => {
                if(!bool) {
                    chrome.permissions.request({permissions: [ "contextMenus" ]}, granted => {
                        if(granted) {
                            chrome.contextMenus.create({
                                id: "1",
                                contexts: [ "selection" ],
                                title: chrome.i18n.getMessage("contextMenuText"),
                                onclick: res => addNoteThroughContextmenu(res.selectionText, res.pageUrl)
                            });
                        }
                    })
                }
            })
        }

        const oldSettings = res.settings;
        const custom = oldSettings.custom;
        custom[key] = value;

        chrome.storage.local.set({
            settings: {
                ...oldSettings,
                custom
            } 
        });
    });
}

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

function showSuccessOnBtn(btn, duration = 800, forceReload = false) {
    btn.style.backgroundColor = "var(--success)";
    setTimeout(() => {
        btn.style.backgroundColor = null;
        if(forceReload) location.reload();
    }, duration);
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
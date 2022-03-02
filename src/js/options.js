//#region vars
import { applyTranslations } from './util.js';

const generalOptionsWrapper = document.getElementById('generalOptionsWrapper');
const advancedOptionsWrapper = document.getElementById('advancedOptionsWrapper');
const priorityNamesWrapper = document.getElementById('priorityNamesWrapper');
const clearCompletedNotesBtn = document.getElementById('clearCompletedNotes');
const resetSettingsBtn = document.getElementById('resetSettings');
const exportNotesBtn = document.getElementById('exportNotes');
const downloadAnchor = document.getElementById('downloadAnchor');
const importNotesBtn = document.getElementById('importNotes');
const importNotesInput = document.getElementById('importNotesInput');
const debug = document.getElementById('debug');
const debugWrapper = document.getElementById('debugInformationWrapper');
const optionDialog = document.getElementById('dialogOption');
const optionDialogOk = document.getElementById('dialogOk');
const optionDialogClose = document.getElementById('dialogClose');
const uiLang =  chrome.i18n.getUILanguage();
const { i18n: { getMessage }, storage, runtime, contextMenus } = chrome;
const manifest = chrome.runtime.getManifest();
const osMapping = {
    android: 'Android',
    cros: 'Cr OS Linux',
    linux: 'Linux',
    mac: 'MacOS',
    openbsd: 'OpenBSD',
    win: 'Windows',
}
//#endregion

//#region init
document.documentElement.lang = uiLang;
document.getElementById('copyright').innerHTML = getMessage('optionsCopyrightNotice', new Date().getFullYear().toString());

document.querySelectorAll('.dropdown').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');

    btn.addEventListener('keydown', e => {
        if(e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            btn.click();
        }
    })

    btn.addEventListener('click', e => {
        e.preventDefault();

        if (btn.getAttribute('aria-expanded') === 'false') {
            btn.setAttribute('aria-expanded', 'true');
        } else {
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});

[optionDialogClose, optionDialogOk].forEach(btn => btn.onclick = closeOptionDialog);

if (new URL(location.href).searchParams.get('debug') === '1') debug.style.display = 'block';

applyTranslations(document);
//#endregion

//#region load settings
storage.local.get(['settings', 'notePriorities'], ({ settings, notePriorities }) => {
    const defaultSettings = Object.keys(settings.default);
    const generalOptions = defaultSettings.filter(x => !x.startsWith('advanced') && typeof settings.default[x] === 'boolean');
    const advancedOptions = defaultSettings.filter(x => x.startsWith('advanced') && typeof settings.default[x] === 'boolean');

    generalOptions.map(setting => createOption(setting, settings, generalOptionsWrapper));
    advancedOptions.map(setting => createOption(setting, settings, advancedOptionsWrapper));
    notePriorities.map(priority => createPriority(priority, priorityNamesWrapper));

    if (settings.custom.advancedUser ?? settings.default.advancedUser) {
        debug.style.display = 'initial';
    }
})
//#endregion

//#region actions
clearCompletedNotesBtn.onclick = () => {
    storage.local.get('notes', res => {
        const { notes } = res;
        const updatedNotes = notes.filter(note => !note.completed);

        storage.local.set({
            notes: updatedNotes
        });
        showSuccessOnBtn(clearCompletedNotesBtn);
    });
}

resetSettingsBtn.onclick = async () => {
    await fetch('../json/defaultSettings.json')
    .then(res => res.json())
    .then(json => {
        Object.keys(json.notePriorities).map(x => {
            json.notePriorities[x] = {
                ...json.notePriorities[x],
                default: {
                    ...json.notePriorities[x].default,
                    value: getMessage(json.notePriorities[x].default.value)
                }
            }
        });

        storage.local.get('notes', ({ notes }) => {
            storage.local.set({
                ...json,
                notes
            });
            showSuccessOnBtn(resetSettingsBtn, 800, true);
        });
    });
}

exportNotesBtn.onclick = () => {
    storage.local.get('notes', ({ notes }) => {
        downloadAnchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(notes))}`;
        downloadAnchor.download = getMessage('downloadFileName', new Intl.DateTimeFormat(uiLang).format(new Date()));
        downloadAnchor.click();
        showSuccessOnBtn(exportNotesBtn);
    })
}
importNotesBtn.addEventListener('keyup', event => {
   if (event.key === ' ' || event.key === 'Enter') {
       event.preventDefault();
       importNotesBtn.click();
   }
});
importNotesInput.onchange = e => {
    const file = importNotesInput.files[0];
    const reader = new FileReader();

    if(file.type !== 'application/json') return;

    reader.addEventListener('load', ({ target: { result }}) => {
        const notes = JSON.parse(result);

        storage.local.set({ notes });
        showSuccessOnBtn(importNotesBtn);  
    });
    reader.readAsText(file);
}
//#endregion

//#region debug
runtime.getPlatformInfo(({ os, arch, nacl_arch }) => {
    storage.local.get('userId', ({ userId }) => {
        debugWrapper.innerHTML = `
        <p>${manifest.name} - v${manifest.version}</p>
        <p>${osMapping[os]} ${arch} (${nacl_arch})</p>
        <small>${userId}</small>
    `;
    });
});
//#endregion

//#region helper functions
function createOption(setting, settingsObject, wrapper) {
    const settingWrapper = document.createElement('div');
    settingWrapper.classList.add('setting-item');
    settingWrapper.innerHTML = `
    <div class="label-wrapper">
        <label
        for="${setting}"
        id="${setting}Desc"
        >
            ${getMessage(setting)}
        </label>
        <button title="${getMessage('optionMoreInformation')}" class="option-dialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        </button>
    </div>

    <input
        type="checkbox"
        ${(settingsObject.custom[setting] ?? settingsObject.default[setting]) && 'checked'}
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

    const toggleSwitch = settingWrapper.querySelector('label.is-switch');
    const input = settingWrapper.querySelector('input');
    const optionHelp = settingWrapper.querySelector('.option-dialog');

    input.onchange = () => updateSetting(setting, input.checked);

    optionHelp.onclick = () => showOptionDialog(setting);

    toggleSwitch.onkeydown = e => {
        if(e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleSwitch.click();
        }
    }

    wrapper.appendChild(settingWrapper);
}

function createPriority(priority, wrapper) {
    const priorityElement = document.createElement('div');
    priorityElement.style.backgroundColor = priority.custom.color || priority.default.color;
    priorityElement.innerHTML =
    `
        ${priority.custom.icon ||priority.default.icon}
        <input
            type="text"
            value="${priority.custom.value || priority.default.value}"
            name="${priority.name}"
        />
    `;

    const priorityInput = priorityElement.querySelector("input");
    priorityInput.oninput = () => {
        storage.local.get('notePriorities', res => {
            const { notePriorities } = res;
            const updatedPriorities = notePriorities.find(p => p.name === priority.name);
            updatedPriorities.custom.value = priorityInput.value.trim();

            storage.local.set({notePriorities});
        })
    }

    wrapper.appendChild(priorityElement);
}

function showOptionDialog(option) {
    const optionDialogTitle = document.getElementById('optionTitle');
    const optionDialogDescription = document.getElementById('optionDescription');

    optionDialogTitle.textContent = getMessage(option);
    optionDialogDescription.innerHTML = getMessage(`${option}Desc`).replace("\n", "<br>");

    optionDialog.showModal();
}

function closeOptionDialog() {
    optionDialog.close();
}

function updateSetting(key, value) {
    storage.local.get('settings', ({ settings: oldSettings }) => {
        const custom = oldSettings.custom;
        custom[key] = value;

        if(key === 'showContextMenu') {
            contextMenus.update('1', {
                visible: value
            });
        }

        storage.local.set({
            settings: {
                ...oldSettings,
                custom
            } 
        });
    });
}

function showSuccessOnBtn(btn, duration = 800, forceReload = false) {
    btn.style.backgroundColor = 'var(--success)';
    setTimeout(() => {
        btn.style.backgroundColor = null;
        if(forceReload) location.reload();
    }, duration);
}
//#endregion
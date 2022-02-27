//#region vars
import {applyTranslations, createId, formatDateTime, formatTimestamp, lightenDarkenColor} from './util.js';
import { constant } from './constant.js';

const {
    i18n: { getMessage, getUILanguage },
    storage,
    runtime,
    windows,
    tabs,
} = chrome;
const { searchParams } = new URL(window.location.href);
const uiLang = getUILanguage();
const addNoteInput = document.getElementById('addNote');
const addNoteWrapper = document.getElementById('addNoteWrapper');
const noteTag = document.getElementById('tag');
const recentlyAdded = document.getElementById('recentlyAdded');
const noteMenu = document.getElementById('noteMenu');
const prioritySelection = document.getElementById('prioritySelection');
const addNoteBtn = document.getElementById('addNoteBtn');

let noteActionBtnHandle = null;
//#endregion

//#region Init
document.documentElement.lang = uiLang;

if(searchParams.get('standalone') === '1') document.documentElement.classList.add('standalone');
if(searchParams.get('predefinedMessage')) {
    addNoteInput.value = decodeURIComponent(searchParams.get('predefinedMessage'));

    if (addNoteInput.value.trim()) {
        addNoteBtn.classList.remove('is-hidden');
    }
}
if(searchParams.get('priority')) setPriority(searchParams.get('priority'));


function loadDraft() {
    storage.local.get(['settings', 'draft'], ({ settings, draft }) => {
        if(settings.custom.saveCurrentNote ?? settings.default.saveCurrentNote) {
            addNoteInput.value = draft.value;
            if(draft.priority) setPriority(draft.priority);

            // draft value gets reset for some reason, adding a short delay fixes it
            setTimeout(() => {
                storage.local.set({
                    draft: {
                        value: draft.value,
                        priority: draft.priority
                    }
                });

                if (addNoteInput.value.trim()) {
                    addNoteBtn.classList.remove('is-hidden');
                }
            }, 50)
        }
    });
}

function clearDraft() {
    storage.local.set({
        draft: {
            value: '',
            priority: null
        }
    });
}

function loadNotes() {
    recentlyAdded.textContent = '';

    storage.local.get('notes', ({ notes }) => {
        notes.forEach(note => addNote(note));
        recentlyAdded.dataset.amount = notes.length;
    });
}

function loadPrioritySelection() {
    storage.local.get([ 'notePriorities' ], ({ notePriorities }) => {
        notePriorities.forEach(priority => {
            const prio = document.createElement('button');
            prio.textContent = priority.custom.value || priority.default.value;
            prio.dataset.priority = priority.name;
            prio.setAttribute('style', `background-color:${priority.custom.color || priority.default.color};color:${lightenDarkenColor((priority.custom.color || priority.default.color), -70)}`);
            prio.onclick = () => {
                changeNotePriority(prioritySelection.dataset.id, prio.dataset.priority);
            };
            prioritySelection.append(prio);
        })
    })
}

// execute
loadNotes();
loadDraft();
loadPrioritySelection();
applyTranslations(document);
//#endregion

//#region newTab
const newTab = document.getElementById('newTab');
newTab.onclick = () => {
    windows.create({
        url: `popup.html?standalone=1&predefinedMessage=${encodeURIComponent(addNoteInput.value.trim()) || ''}&priority=${noteTag.getAttribute('priority') || ''}`,
        type: 'popup',
        width: 500,
        height: 750,
        top: 0
    });
    window.close();
}
//#endregion

//#region settings
const optionsBtn = document.getElementById('settings');
optionsBtn.onclick = () => runtime.openOptionsPage();
//#endregion

//#region add priority, add "enter"
// addNoteInput.setAttribute('placeholder', getMessage('addNotePlaceholder'));
addNoteInput.oninput = () => {
    const currentValue = addNoteInput.value.slice(0, 2);
    const parent = addNoteInput.parentElement;

    if (addNoteInput.value.trim()) {
        addNoteBtn.classList.remove('is-hidden');
    } else {
        addNoteBtn.classList.add('is-hidden');
    }

    if(/^(\+.)$/i.test(currentValue)) {
        addNoteInput.value = addNoteInput.value.substr(1);
        parent.removeAttribute('priority');
        setPriority('MEDIUM');
    }
    else if(/^(!.)$/i.test(currentValue)) {
        addNoteInput.value = addNoteInput.value.substr(1);
        parent.setAttribute('priority', 'HIGH');
        setPriority('HIGH');
    }
    else if(/^(-.)$/i.test(currentValue)) {
        addNoteInput.value = addNoteInput.value.substr(1);
        parent.setAttribute('priority', 'LOW');
        setPriority('LOW');
    }

    // save draft
    storage.local.set({
        draft: {
            value: addNoteInput.value.trim(),
            priority: addNoteInput.parentElement.getAttribute('priority') || null
        }
    });
}
//#endregion

//#region add note
// spellcheck
storage.local.get('settings', ({ settings }) => {
    if(!(settings.custom.advancedEnableSpellcheck ?? settings.default.advancedEnableSpellcheck)) {
        addNoteInput.spellcheck = false;
    }
});

[addNoteInput, addNoteBtn].forEach(element => {
    element.addEventListener('keypress', (event) => {
        if(!event.shiftKey && event.key === 'Enter') {
            event.preventDefault();
            saveNote();
        }
    });
});
addNoteBtn.addEventListener('click', saveNote);

function saveNote() {
    storage.local.get([ 'notes' ], ({ notes }) => {
        const note = {
            value: addNoteInput.value.trim(),
            priority: addNoteInput.parentElement.getAttribute("priority") || "MEDIUM",
            completed: false,
            date: new Date().toISOString(),
            id: createId(),
            origin: null
        };
        notes.push(note);
        
        storage.local.set({ notes });
        addNoteInput.value = '';
        addNoteBtn.classList.add('is-hidden');
        clearTag();
        addNote(note);
    });
}
//#endregion

//#region note tags
function setPriority(name) {
    storage.local.get(['notePriorities'], ({ notePriorities }) => {
        const priority = notePriorities.find(x => x.name === name);

        noteTag.innerHTML = `
            <span>${priority.custom.value || priority.default.value}</span>
            ${priority.default.icon}
        `;
        noteTag.style.background = priority.custom.color || priority.default.color;
        noteTag.style.color = lightenDarkenColor(priority.custom.color || priority.default.color, -70);
        noteTag.setAttribute('priority', priority.name);
    });
}

function clearTag() {
    noteTag.removeAttribute('style');
    noteTag.removeAttribute('priority');
    noteTag.textContent = '';
    addNoteWrapper.removeAttribute('priority');
}
//#endregion

//#region note specific methods

// handle menu close
document.body.onclick = () => document.activeElement === document.body && closeNoteMenu();

// handle keys
noteMenu.querySelectorAll('li').forEach(option => {
    option.addEventListener('keydown', e => {
        e.preventDefault();
        e.stopPropagation();

        switch(e.key) {
            case 'ArrowDown':
                option.nextElementSibling
                    ? option.nextElementSibling.focus()
                    : noteMenu.querySelector('li').focus();
                break;
            case 'ArrowUp':
                option.previousElementSibling
                    ? option.previousElementSibling.focus()
                    : noteMenu.querySelector('li:last-child').focus();
                break;
            case 'Home':
                noteMenu.querySelector("li").focus();
                break;
            case 'End':
                noteMenu.querySelector("li:last-child").focus();
                break;
            case 'Escape':
                closeNoteMenu();
                break;
            case 'Enter':
                option.click();
                break;
            default: 
                Array.from(noteMenu.querySelectorAll('li')).find(x => x.textContent.startsWith(e.key))?.focus();
                break;
        }
    });

    option.addEventListener('click', e => {
        const id = noteActionBtnHandle.dataset.id;
        let focusNoteMenu = true;

        switch(e.target.id) {
            case 'changeNotePriority':
                focusNoteMenu = false;
                showNotePrioritySelection(noteActionBtnHandle);
                break;
            case 'deleteNote':
                deleteNote(id);
                break;
            case 'editNote':
                focusNoteMenu = false;
                editNote(id);
                break;
        }

        closeNoteMenu(focusNoteMenu);
    })
})

function openNoteMenu(e) {
    e.stopPropagation();

    // store reference to button to be able to set focus on it after closing the menu
    noteActionBtnHandle = e.target.closest(".note");

    noteMenu.style.display = "flex";
    // to allow calculation of an elements width, its display state has to be != "none",
    // therefore the visibility is being to used to bypass this limitation.
    noteMenu.style.visibility = "hidden";
    
    const buffer = 50;
    const rect = noteMenu.getBoundingClientRect();
    const left = e.clientX - rect.width;
    const top = ((rect.bottom + buffer) > window.innerHeight) ? (e.clientY - rect.height) : e.clientY;

    noteMenu.style.visibility = null;
    noteMenu.style.left = `${left}px`;
    noteMenu.style.top = `${top}px`;

    noteMenu.querySelector("li").focus();
    noteActionBtnHandle.querySelector(".note-actions").setAttribute("aria-expanded", "true");
    noteMenu.dataset.id = noteActionBtnHandle.dataset.id;
}

function closeNoteMenu(retainFocus) {
    noteMenu.style.display = null;
    noteMenu.dataset.id = "";
    document.querySelector(".note-actions[aria-expanded]")?.removeAttribute("aria-expanded");
    if(retainFocus) noteActionBtnHandle.querySelector(".note-actions")?.focus();
}

function deleteNote(id) {
    storage.local.get("notes", res => {
        const { notes } = res;
        const updatedNotes = notes.filter(note => note.id !== id);

        storage.local.set({
            notes: updatedNotes
        }, () => {
            try {
                const deletedNote = recentlyAdded.querySelector(`div[data-id="${id}"]`);
                recentlyAdded.removeChild(deletedNote);
            }
            catch(e) {
                console.warn("Could not delete note: ", id);
            }
        })
        
    })
}

function addNote(note) {
    storage.local.get(["notePriorities", "settings"], async ({ notePriorities, settings }) => {
        const priority = notePriorities.find(p => p.name === note.priority);
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.dataset.id = note.id;
        noteElement.innerHTML = `
            <div class="note-priority">
                <div
                style="background-color:${priority.custom.color || priority.default.color};color:${lightenDarkenColor((priority.custom.color || priority.default.color), -70)}"
                >
                    ${priority.custom.icon || priority.default.icon}
                </div>
            </div>
            <article>
                <div
                    class="note-value"
                    ${((!settings.custom.advancedEnableSpellcheck ?? !settings.default.advancedEnableSpellcheck) && 'spellcheck="false"') || ""}
                >
                    ${((settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls) && formatNoteValue(note.value)) || note.value}
                </div>

                <div class="note-meta">
                    <time 
                        datetime="${note.date}"
                        title="${formatDateTime(note.date, uiLang)}"
                    >
                        ${formatTimestamp(note.date)}
                    </time>

                    ${(await getNoteOrigin(note.origin, note.value))}
                </div>
            </article>
        `;

        // anchors are not working properly in a popup
        const origin = noteElement.querySelector(".note-origin");
        if(origin) {
            origin.addEventListener("click", e => {
                e.preventDefault();
                tabs.create({url: origin.href});
            });
        }

        const noteActionWrapper = document.createElement("div");
        noteActionWrapper.classList.add("note-action-wrapper");

        // completed checkbox
        const completedBtn = document.createElement("input");
        completedBtn.type = "checkbox";
        completedBtn.classList.add("note-action-complete");
        completedBtn.title = getMessage("noteActionCompletedTitle");
        completedBtn.checked = note.completed;
        if(note.completed) noteElement.classList.toggle("is-completed");
        completedBtn.onclick = e => {
            e.stopImmediatePropagation();
            noteElement.classList.toggle("is-completed");

            storage.local.get("notes", res => {
                const oldNotes = res.notes;
                const updateNote = oldNotes.find(note => note.id === noteElement.dataset.id);
                updateNote.completed = completedBtn.checked;

                storage.local.set({
                    notes: oldNotes
                });
            })
        }
        noteActionWrapper.appendChild(completedBtn);

        // more actions btn
        const noteActionBtn = document.createElement("button");
        noteActionBtn.title = getMessage("noteActionsTitle");
        noteActionBtn.classList.add("note-actions");
        noteActionBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
        </svg>`;
        noteActionBtn.setAttribute("aria-haspopup", "true");
        noteActionBtn.onclick = openNoteMenu;
        noteActionWrapper.appendChild(noteActionBtn);


        noteElement.ondblclick = editNote.bind(null, note.id);

        // on blur
        const noteContent = noteElement.querySelector(".note-value");
        if(settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls) addNoteLinkListeners(noteContent);
        noteContent.onblur = () => {
            noteContent.removeAttribute("contenteditable");
            noteContent.removeAttribute("tabindex");
        }

        noteElement.appendChild(noteActionWrapper);
        recentlyAdded.append(noteElement);
        clearDraft();
    });
}

function editNote(id) {
    const selectedNote = Array.from(recentlyAdded.querySelectorAll(".note")).find(note => note.dataset.id === id);
    if(!selectedNote) return;

    const selectedNoteContent = selectedNote.querySelector(".note-value");

    // get rid of html markup
    Array.from(selectedNoteContent.querySelectorAll("a"))
    .filter(a => !a.href.startsWith("mailto:"))
    .forEach(a => a.textContent = a.href);
    selectedNoteContent.textContent = selectedNoteContent.textContent.trim();

    selectedNoteContent.setAttribute("contenteditable", "true");
    selectedNoteContent.setAttribute("tabindex", "-1");
    selectedNoteContent.focus();

    selectedNoteContent.onkeydown = e => {
        if(!e.shiftKey && e.key === "Enter") {
            e.preventDefault();

            selectedNoteContent.removeAttribute("contenteditable"); // this triggers the onblur handler
            selectedNoteContent.removeAttribute("tabindex");
        }
    }

    selectedNoteContent.onblur = e => {
        e.preventDefault();

        storage.local.get(["notes", "settings"], ({ settings, notes: oldNotes}) => {
            const updateNote = oldNotes.find(note => note.id === id);
            updateNote.value = selectedNoteContent.textContent.trim();

            storage.local.set({
                notes: oldNotes
            });

            selectedNoteContent.innerHTML = ((settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls) && formatNoteValue(selectedNoteContent.textContent)) || selectedNoteContent.innerHTML;
            selectedNoteContent.removeAttribute("contenteditable");
            selectedNoteContent.removeAttribute("tabindex");
            addNoteLinkListeners(selectedNoteContent);
            selectedNoteContent.onkeydown = null;
        }); 
    }
}

function changeNotePriority(id, priority) {
    storage.local.get(["notes", "notePriorities"], ({notes, notePriorities}) => {
        const updateNote = notes.find(note => note.id === id);
        const oldNoteElement = Array.from(recentlyAdded.querySelectorAll(".note")).find(note => note.dataset.id === id);

        if(!updateNote || !oldNoteElement) return;

        updateNote.priority = priority;
    
        storage.local.set({
            notes: notes
        });

        const newPriority = notePriorities.find(prio => prio.name === priority);
        const oldNotePriority = oldNoteElement.querySelector(".note-priority");
    
        oldNotePriority.innerHTML = `
            <div style="background-color:${newPriority.custom.color || newPriority.default.color};color:${lightenDarkenColor((newPriority.custom.color || newPriority.default.color), -70)}">
                ${newPriority.custom.icon || newPriority.default.icon}
            </div>
        `;

        recentlyAdded.style.overflowY = null;
        prioritySelection.style.display = null;
        prioritySelection.dataset.id = null;
    })
}

function showNotePrioritySelection(note) {
    recentlyAdded.style.overflowY = "hidden";
    const rect = note.getBoundingClientRect();
    
    prioritySelection.style.top = rect.top + "px";
    prioritySelection.style.left = 0;
    prioritySelection.style.height = rect.height + "px";
    prioritySelection.dataset.id = note.dataset.id;

    prioritySelection.style.display = "flex";
}
//#endregion

//#region helper functions
function getNoteOrigin(url, value = null) {
    return new Promise(((resolve) => {
        storage.local.get('settings', ({ settings }) => {
            if (!url) {
                resolve('');
                return;
            }

            const { hash, host, protocol } = new URL(url);
            const hasHash = hash !== '';
            const preparedUrl = hasHash && value
                ? url
                : url + '#:~:text=' + encodeURIComponent(value);
            const formattedDomain = `${protocol}//${host}`;
            const faviconTemplateUrl = constant.FAVICON_TEMPLATE_URL.replace('{URL}', formattedDomain);
            const faviconEnabled = settings.custom.advancedShowUrlFavicon ?? settings.default.advancedShowUrlFavicon;

            resolve(
            `
                    <span class="seperator">•</span>
                    <a
                        class="note-origin"
                        href="${preparedUrl}"
                        title="${url}"
                        target="_parent"
                        rel="noopener noreferrer"
                    >   
                        ${(protocol.includes('http') && faviconEnabled) ? `              
                            <img
                                src="${faviconTemplateUrl}"
                                alt="${host}"
                                class="note-origin-favicon"
                            />
                        ` : ''}
                        ${getUrlFormat(url)}
                    </a>
                `
            )
        })
    }));
}

function formatNoteValue(value) {
    value.match(constant.EMAIL_REGEX)?.forEach(email => {
        value = value.replace(email, `<a href="mailto:${email}" rel="noopener noreferrer">${email}</a>`);
    });

    value.match(constant.URL_REGEX)?.forEach(url => {
        value = value.replace(url, `<a href="${url}" rel="noopener noreferrer">${url.replace(/https?:\/\//gi, "")}</a>`);
    })

    return value;
}

function addNoteLinkListeners(note) {
    note.querySelectorAll(".note-value a").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();

            tabs.create({
                url: a.href
            });
        })
    })
}

function getUrlFormat(uri) {
    const { host, pathname, protocol} = new URL(uri);

    if(protocol === "file:") {
        const paths = pathname.split('/');

        return paths[(paths.length - 1)];
    }

    if(protocol === "chrome-extension:") return getMessage("contextMenuFileUrl");

    if(protocol === "data:") {
        return "data-uri"
    }

    return host;
}
//#endregion
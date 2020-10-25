//#region vars
const searchParams = new URL(window.location.href).searchParams;
const uiLang = chrome.i18n.getUILanguage();
const addNoteInput = document.getElementById("addNote");
const addNoteWrapper = document.getElementById("addNoteWrapper");
const noteTag = document.getElementById("tag");
const recentlyAdded = document.getElementById("recentlyAdded");
const noteMenu = document.getElementById("noteMenu");
const prioritySelection = document.getElementById("prioritySelection");
const addNoteHint = document.getElementById("addHint");

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const EMAIL_REGEX = /\S+@\S+\.\S+/gi;

let noteActionBtnHandle = null;
//#endregion

//#region Init
document.documentElement.lang = uiLang;
document.title = chrome.i18n.getMessage("popupTitle");
if(searchParams.get("standalone") === "1") document.documentElement.classList.add("standalone");
if(searchParams.get("predefMsg")) addNoteInput.value = decodeURIComponent(searchParams.get("predefMsg"));
if(searchParams.get("priority")) setPriority(searchParams.get("priority"));


function loadDraft() {
    chrome.storage.local.get(["settings", "draft"], res => {
        const { settings, draft } = res;

        if(settings.custom.saveCurrentNote ?? settings.default.saveCurrentNote) {
            addNoteInput.value = draft.value;
            if(draft.priority) setPriority(draft.priority);

            // draft value gets reset for some reason, adding a short delay fixes it
            setTimeout(() => {
                chrome.storage.local.set({
                    draft: {
                        value: draft.value,
                        priority: draft.priority
                    }
                });
            }, 50)
        }
    });
}

function clearDraft() {
    chrome.storage.local.set({
        draft: {
            value: "",
            priority: null
        }
    });
}

function loadNotes() {
    recentlyAdded.textContent = "";

    chrome.storage.local.get("notes", res => {
        const { notes } = res;
        
        notes.forEach(note => addNote(note));
        recentlyAdded.dataset.amount = notes.length;
    })
}

function loadPrioritySelection() {
    chrome.storage.local.get(["notePriorities"], res => {
        res.notePriorities.forEach(priority => {
            const prio = document.createElement("button");
            prio.textContent = priority.custom.value || priority.default.value;
            prio.dataset.priority = priority.name;
            prio.setAttribute("style", `background-color:${priority.custom.color || priority.default.color};color:${lightenDarkenColor((priority.custom.color || priority.default.color), -70)}`);
            prio.onclick = () => {
                changeNotePirority(prioritySelection.dataset.id, prio.dataset.priority);
            };
            prioritySelection.append(prio);
        })
    })
}

// Multi window support
setInterval(() => {
    chrome.storage.local.get("notes", res => {
        const { notes } = res;

        if(notes.length !== Number(recentlyAdded.dataset.amount)) loadNotes();
    })
}, 1000 * 15);

// execute
loadNotes();
loadDraft();
loadPrioritySelection();
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

//#region newTab
const newTab = document.getElementById("newTab");
newTab.onclick = () => {
    chrome.windows.create({
        url: `popup.html?standalone=1&predefMsg=${encodeURIComponent(addNoteInput.value.trim()) || ''}&priority=${noteTag.getAttribute("priority") || ''}`,
        type: "popup",
        width: 500,
        height: 750,
        top: 0
    });
    window.close();
}
//#endregion

//#region settings
const optionsBtn = document.getElementById("settings");
optionsBtn.onclick = () => chrome.runtime.openOptionsPage();
optionsBtn.oncontextmenu = e => {
    e.preventDefault();
    // TODO: Implement menu with quick actions
}
//#endregion

//#region add priority, add "enter"
addNoteInput.setAttribute("placeholder", chrome.i18n.getMessage("addNotePlaceholder"));
addNoteInput.oninput = () => {
    const currentValue = addNoteInput.value.slice(0, 2);
    const parent = addNoteInput.parentElement;

    if(/^(\+.)$/i.test(currentValue)) {
        addNoteInput.value = addNoteInput.value.substr(1);
        parent.removeAttribute("priority");
        setPriority("MEDIUM");
    }
    else if(/^(!.)$/i.test(currentValue)) {
        addNoteInput.value = addNoteInput.value.substr(1);
        parent.setAttribute("priority", "HIGH");
        setPriority("HIGH");
    }
    else if(/^(-.)$/i.test(currentValue)) {
        addNoteInput.value = addNoteInput.value.substr(1);
        parent.setAttribute("priority", "LOW");
        setPriority("LOW");
    }

    // show "enter"
    if(addNoteInput.value.trim().length > 0) addNoteHint.style.opacity = 1;
    else addNoteHint.style.opacity = 0;

    // save draft
    chrome.storage.local.set({
        draft: {
            value: addNoteInput.value.trim(),
            priority: addNoteInput.parentElement.getAttribute("priority") || null
        }
    });
}
//#endregion

//#region add note
// spellcheck
chrome.storage.local.get("settings", res => {
    const settings = res.settings;

    if(!(settings.custom.advancedEnableSpellcheck ?? settings.default.advancedEnableSpellcheck)) {
        addNoteInput.spellcheck = false;
    }
});

[addNoteInput, addNoteHint].forEach(el => {
    el.onkeypress = e => {
        if(!e.shiftKey && e.key === "Enter") {
            e.preventDefault();
            saveNote();
        }
    }
});

addNoteHint.onclick = saveNote;

function saveNote() {
    chrome.storage.local.get(["notes"], res => {
        const note = {
            value: addNoteInput.value.trim(),
            priority: addNoteInput.parentElement.getAttribute("priority") || "MEDIUM",
            completed: false,
            date: new Date().toISOString(),
            id: uuidv4(),
            origin: null
        };
        res.notes.push(note);
        
        chrome.storage.local.set({notes: res.notes});
        addNoteInput.value = "";
        addNoteHint.style.opacity = 0;
        clearTag();
        addNote(note);
    });
}
//#endregion

//#region note tags
function setPriority(name) {
    chrome.storage.local.get(["notePriorities"], res => {
        const priority = res.notePriorities.find(x => x.name === name);

        noteTag.innerHTML = `
            <span>${priority.custom.value || priority.default.value}</span>
            ${priority.default.icon}
        `;
        noteTag.style.background = priority.custom.color || priority.default.color;
        noteTag.style.color = lightenDarkenColor(priority.custom.color || priority.default.color, -70);
        noteTag.setAttribute("priority", priority.name);
    });
}

function clearTag() {
    noteTag.removeAttribute("style");
    noteTag.removeAttribute("priority");
    noteTag.textContent = "";
    addNoteWrapper.removeAttribute("priority");
}
//#endregion

//#region note specific methods

// handle menu close
document.body.onclick = () => document.activeElement == document.body && closeNoteMenu();

// handle keys
noteMenu.querySelectorAll("li").forEach(option => {
    option.addEventListener("keydown", e => {
        e.preventDefault();
        e.stopPropagation();

        switch(e.key) {
            case "ArrowDown":
                option.nextElementSibling ? option.nextElementSibling.focus() : noteMenu.querySelector("li").focus();
                break;
            case "ArrowUp":
                option.previousElementSibling ? option.previousElementSibling.focus() : noteMenu.querySelector("li:last-child").focus();
                break;
            case "Home":
                noteMenu.querySelector("li").focus();
                break;
            case "End": 
                noteMenu.querySelector("li:last-child").focus();
                break;
            case "Escape":
                closeNoteMenu();
                break;
            case "Enter":
                option.click();
                break;
            default: 
                Array.from(noteMenu.querySelectorAll("li")).find(x => x.textContent.startsWith(e.key))?.focus();
                break;
        }
    });

    option.addEventListener("click", e => {
        const id = noteActionBtnHandle.dataset.id;
        let focusNoteMenu = true;

        switch(e.target.id) {
            case "changeNotePriority":
                focusNoteMenu = false;
                showNotePrioritySelection(noteActionBtnHandle);
                break;
            case "deleteNote":
                deleteNote(id);
                break;
            case "editNote":
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
    chrome.storage.local.get("notes", res => {
        const { notes } = res;
        const updatedNotes = notes.filter(note => note.id !== id);

        chrome.storage.local.set({
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
    chrome.storage.local.get(["notePriorities", "settings"], res => {
        const { notePriorities, settings } = res;

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
                    ${((!settings.custom.advancedEnableSpellcheck ?? !settings.default.advancedEnableSpellcheck) && "spellcheck='false'") || ""}
                >
                    ${((settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls) && formatNoteValue(note.value)) || note.value}
                </div>

                <div class="note-meta">
                    <time 
                        datetime="${note.date}"
                        title="${formatDatetime(note.date)}"
                    >
                        ${generatedTimestamp(note.date)}
                    </time>

                    ${(note.origin && (
                        `
                        <span class="seperator">•</span>
                        <a
                            class="note-origin"
                            href="${note.origin}"
                            title="${note.origin}"
                            target="_parent"
                        >
                            ${getUrlFormat(note.origin)}
                        </a>
                        `
                    )) || ""}
                </div>
            </article>
        `;

        // anchors are not working properly in a popup
        const origin = noteElement.querySelector(".note-origin");
        if(origin) {
            origin.addEventListener("click", e => {
                e.preventDefault();
                chrome.tabs.create({url: origin.href});
            });
        }

        const noteActionWrapper = document.createElement("div");
        noteActionWrapper.classList.add("note-action-wrapper");

        // completed checkbox
        const completedBtn = document.createElement("input");
        completedBtn.type = "checkbox";
        completedBtn.classList.add("note-action-complete");
        completedBtn.title = chrome.i18n.getMessage("noteActionCompletedTitle");
        completedBtn.checked = note.completed;
        if(note.completed) noteElement.classList.toggle("is-completed");
        completedBtn.onclick = e => {
            e.stopImmediatePropagation();
            noteElement.classList.toggle("is-completed");

            chrome.storage.local.get("notes", res => {
                const oldNotes = res.notes;
                const updateNote = oldNotes.find(note => note.id === noteElement.dataset.id);
                updateNote.completed = completedBtn.checked;

                chrome.storage.local.set({
                    notes: oldNotes
                });
            })
        }
        noteActionWrapper.appendChild(completedBtn);

        // more actions btn
        const noteActionBtn = document.createElement("button");
        noteActionBtn.title = chrome.i18n.getMessage("noteActionsTitle");
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
    selectedNoteContent.textContent = selectedNoteContent.textContent;

    selectedNoteContent.setAttribute("contenteditable", "true");
    selectedNoteContent.setAttribute("tabindex", "-1");
    selectedNoteContent.focus();

    selectedNoteContent.onkeydown = e => {
        if(!e.shiftKey && e.key === "Enter") {
            e.preventDefault();

            chrome.storage.local.get(["notes", "settings"], res => {
                const { settings } = res;
                const oldNotes = res.notes;
                const updateNote = oldNotes.find(note => note.id === id);
                updateNote.value = selectedNoteContent.textContent.trim();

                chrome.storage.local.set({
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
}

function changeNotePirority(id, priority) {
    chrome.storage.local.get(["notes", "notePriorities"], res => {

        const {notes, notePriorities} = res;
        const updateNote = notes.find(note => note.id === id);
        const oldNoteElement = Array.from(recentlyAdded.querySelectorAll(".note")).find(note => note.dataset.id === id);

        if(!updateNote || !oldNoteElement) return;

        updateNote.priority = priority;
    
        chrome.storage.local.set({
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

/**
 * Lightens or darkens a hex color
 * @param {*} col 
 * @param {*} amt 
 * @author https://stackoverflow.com/q/5560248/8463645 (this version is slightly modified from the linked one)
 */
function lightenDarkenColor(col, amt) {
    if(col.startsWith("var(--")) {
        const cssVar = col.replace("var(", "").replace(")", "");
        col = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
    }

    col = col.replace("#", "");
    col = parseInt(col, 16);

    const color = (((col & 0x0000FF) + amt) | ((((col >> 8) & 0x00FF) + amt) << 8) | (((col >> 16) + amt) << 16)).toString(16).replace("-", "");
    return color < 1 ? "var(--black)" : ("#" + color);
}

function generatedTimestamp(date) {
    const today = new Date();
    const noteDate = new Date(date);
    const minute = 60 * 1000;
    const diff = Math.round(Math.abs((today - noteDate) / minute));

    if(diff === 0) return chrome.i18n.getMessage("justNow");
    else if(diff === 1) return chrome.i18n.getMessage("oneMinuteAgo");
    else if(diff < 60) return chrome.i18n.getMessage("nMinutesAgo", diff.toString());
    else if(diff < 120) return chrome.i18n.getMessage("oneHourAgo");
    else if(diff < (60 * 24)) return chrome.i18n.getMessage("nHoursAgo", Math.round(diff / 60).toString());
    else if(diff < 60 * 24 * 2) return chrome.i18n.getMessage("oneDayAgo");
    else if(diff < (60 * 24 * 30)) return chrome.i18n.getMessage("nDaysAgo", Math.round(diff / (60*24)).toString());
    else return chrome.i18n.getMessage("overAMonth");
}

function formatDatetime(date) {
    return new Intl
    .DateTimeFormat(uiLang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    })
    .format(new Date(date));
}

function formatNoteValue(value) {
    value.match(EMAIL_REGEX)?.forEach(email => {
        value = value.replace(email, `<a href="mailto:${email}">${email}</a>`);
    });

    value.match(URL_REGEX)?.forEach(url => {
        value = value.replace(url, `<a href="${url}">${url.replace(/https?:\/\//gi, "")}</a>`);
    })

    return value;
}

function addNoteLinkListeners(note) {
    note.querySelectorAll(".note-value a").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();

            chrome.tabs.create({
                url: a.href
            });
        })
    })
}

function getUrlFormat(uri) {
    const { host, pathname, protocol} = new URL(uri);

    if(protocol === "file:") {
        const filename = pathname.split('/');
        return filename[filename.split('?')[0] ?? filename.length].replace(/\//g, "");
    }

    // Context menu returns chrome-extension uri if being used in a file:/// uri
    if(protocol === "chrome-extension:") return chrome.i18n.getMessage("contextMenuFileUrl");

    if(protocol === "data:") {
        return "data-uri"
    }

    return host;
}
//#endregion
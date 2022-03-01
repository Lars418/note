//#region vars
import {
    applyTranslations,
    createId,
    formatDateTime,
    formatShortDate,
    formatTimestamp, getFaviconUrl,
    lightenDarkenColor
} from './util.js';
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

loadNotes();
loadDraft();
applyTranslations(document);
//#endregion

//#region Standalone
const newTab = document.getElementById('newTab');
newTab.addEventListener('click', () => {
    windows.create({
        url: `popup.html?standalone=1&predefinedMessage=${encodeURIComponent(addNoteInput.value.trim()) || ''}&priority=${noteTag.getAttribute('priority') || ''}`,
        type: 'popup',
        width: 500,
        height: 750,
        top: 0
    });
    window.close();
});
//#endregion

//#region settings
const optionsBtn = document.getElementById('settings');
optionsBtn.addEventListener('click', () => runtime.openOptionsPage());
//#endregion

//#region add priority, add "enter"
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

//#region Add note
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
        noteElement.setAttribute('tabindex', '0');
        noteElement.setAttribute('style', `border-left-color:${priority.custom.color || priority.default.color}`);
        const formattedNoteValue = (settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls)
            ? await formatNoteValue(note.value)
            : note.value;
        noteElement.innerHTML = `
            <article>
                <div
                    class="note-value"
                    ${((!settings.custom.advancedEnableSpellcheck ?? !settings.default.advancedEnableSpellcheck) && 'spellcheck="false"') || ''}
                >
                    ${formattedNoteValue}
                </div>

                <div class="note-footer">
                    <div class="note-meta">
                        <time 
                            datetime="${note.date}"
                            title="${formatDateTime(note.date, uiLang)}"
                        >${formatTimestamp(note.date)}</time>
    
                        ${(await getNoteOrigin(note.origin, note.value))}
                    </div>
                    
                    <div class="note-actions">
                        <button class="note-action-edit" title="${getMessage('noteActionEdit')}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                        
                        <button class="note-action-delete" title="${getMessage('noteActionDelete')}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>                       
                    </div>
                </div>
            </article>
        `;

        const editNoteBtn = noteElement.querySelector('.note-action-edit');
        const deleteNoteBtn = noteElement.querySelector('.note-action-delete');
        const origin = noteElement.querySelector('.note-origin');
        const noteValue = noteElement.querySelector('.note-value');

        noteElement.onkeypress = event => {
            const editKeys = [ 'e', ' ', 'enter' ];

            if (event.ctrlKey || event.shiftKey || document.activeElement !== noteElement) {
                return;
            }

            if (editKeys.includes(event.key.toLowerCase())) {
                event.preventDefault();

                editNote(note.id);
            }
        };

        noteElement.onkeyup = event => {
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                event.stopPropagation();

                const previousElement = noteElement.previousElementSibling;

                if (previousElement?.classList?.contains('note')) {
                    previousElement.focus();
                } else {
                    const notes = recentlyAdded.querySelectorAll('.note');
                    notes[notes.length -1]?.focus();
                }
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                event.stopPropagation();

                const nextElement = noteElement.nextElementSibling;

                if (nextElement?.classList?.contains('note')) {
                    nextElement.focus();
                } else {
                    recentlyAdded.querySelector('.note')?.focus();
                }
            }
        }

        editNoteBtn.onclick = () => editNote(note.id);
        deleteNoteBtn.onclick = () => deleteNote(note.id);

        if (origin) {
            origin.addEventListener("click", e => {
                e.preventDefault();
                tabs.create({ url: origin.href });
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

        noteElement.ondblclick = editNote.bind(null, note.id);

        if (settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls) {
            addNoteLinkListeners(noteValue);
        }

        noteValue.onblur = () => {
            noteValue.removeAttribute("contenteditable");
            noteValue.removeAttribute("tabindex");
        }

        noteElement.appendChild(noteActionWrapper);
        recentlyAdded.append(noteElement);
        clearDraft();

        if (settings.custom.advancedShowLinkPreview ?? settings.default.advancedShowLinkPreview) {
            const urls = Array.from(noteValue.querySelectorAll('a')).filter(anchor => !anchor.href.startsWith('mailto:'));
            for (const url of urls) {
                url.outerHTML = await createOgpCard(url.href);
            }
            addNoteLinkListeners(noteValue);
        }
    });
}

function editNote(id) {
    const selectedNote = Array.from(recentlyAdded.querySelectorAll(".note")).find(note => note.dataset.id === id);
    if (!selectedNote) return;

    const selectedNoteContent = selectedNote.querySelector(".note-value");

    // Get rid of html markup
    Array.from(selectedNoteContent.querySelectorAll("a"))
    .filter(a => !a.href.startsWith("mailto:"))
    .forEach(a => a.textContent = a.href);
    selectedNoteContent.textContent = selectedNoteContent.textContent.trim();

    selectedNoteContent.setAttribute('contenteditable', 'true');
    selectedNoteContent.setAttribute('role', 'textbox');
    selectedNoteContent.setAttribute('tabindex', '-1');
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

        storage.local.get(['notes', 'settings'], async ({ settings, notes: oldNotes}) => {
            const updateNote = oldNotes.find(note => note.id === id);
            updateNote.value = selectedNoteContent.textContent.trim();

            storage.local.set({
                notes: oldNotes
            });

            selectedNoteContent.innerHTML = (settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls)
                ? formatNoteValue(selectedNoteContent.textContent)
                : selectedNoteContent.innerHTML;
            selectedNoteContent.removeAttribute("contenteditable");
            selectedNoteContent.removeAttribute("tabindex");
            selectedNoteContent.removeAttribute('role');
            addNoteLinkListeners(selectedNoteContent);
            selectedNoteContent.onkeydown = null;

            if (settings.custom.advancedShowLinkPreview ?? settings.default.advancedShowLinkPreview) {
                const urls = Array.from(selectedNoteContent.querySelectorAll('a')).filter(url => !url.href.startsWith('mailto:'));

                for (const url of urls) {
                    url.outerHTML = await createOgpCard(url.href);
                }
            }
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
                    <span class="separator">•</span>
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
    });

    return value;
}

function addNoteLinkListeners(note) {
    note.querySelectorAll('.note-value a').forEach(a => {
        a.addEventListener('click', e => {
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

async function createOgpCard(url) {
    const controller = new AbortController();
    const ogpOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
    };
    setTimeout(() => controller.abort(), constant.DEFAULT_TIMEOUT_IN_MS);
    const ogp = await fetch(constant.OGP_URL, ogpOptions).then(res => res.json());
    const media = ogp.media ?
        `<img src="${ogp.media.url}" alt="${ogp.title}" draggable="false" class="ogp-banner" />`
        : '';
    const favicon = ogp.favicon
        ? `<img src="${getFaviconUrl(url, ogp.favicon)}" aria-hidden="true" draggable="false" class="ogp-favicon" />`
        : '';
    const lang = ogp.locale ? `hreflang="${ogp.locale}" lang="${ogp.locale}"` : '';
    const description = ogp.description ? `
        <div class="ogp-meta">
            <span class="ogp-description">${ogp.description}</span>
        </div>   
    ` : '';

    return `
        <a
            href="${url}"
            ${lang}
            class="ogp-card"          
        >
            ${media}
            ${favicon}
            <div class="ogp-data">
                <div class="ogp-meta">
                    <span class="ogp-page-name">${ogp.pageName}</span>
                    ${ogp.publicationDate ? `
                        <span class="ogp-separator">•</span>
                        <time datetime="${ogp.publicationDate}">${formatShortDate(ogp.publicationDate, uiLang)}</time>
                    ` : ''}
                </div>
                <strong class="ogp-page-title">${ogp.title}</strong>
               ${description}         
            </div>
        </a>
    `;
}
//#endregion
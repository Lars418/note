//#region vars
import {
    applyTranslations,
    formatDateTime,
    formatShortDate,
    formatTimestamp,
    getUrlFormat,
    lightenDarkenColor,
    loadTheme
} from './util.js';
import {constant} from './constant.js';
import {Notes} from './notes.js';

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
const addNoteBtn = document.getElementById('addNoteBtn');
const standalone = searchParams.get('standalone') === '1';
//#endregion

//#region Init
document.documentElement.lang = uiLang;

if (standalone) {
    document.documentElement.classList.add('standalone')
}

if (searchParams.get('predefinedMessage')) {
    addNoteInput.value = decodeURIComponent(searchParams.get('predefinedMessage'));

    if (addNoteInput.value.trim()) {
        addNoteBtn.classList.remove('is-hidden');
    }
}

if (searchParams.get('priority')) {
    setPriority(searchParams.get('priority'));
}


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
loadTheme();
applyTranslations(document);
//#endregion

//#region Standalone
const newTab = document.getElementById('newTab');
newTab.addEventListener('click', () => {
    windows.create({
        url: `popup.html?standalone=1&predefinedMessage=${encodeURIComponent(addNoteInput.value.trim()) || ''}&priority=${noteTag.getAttribute('priority') || ''}`,
        type: 'popup',
        width: 420,
        height: 600,
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
addNoteInput.addEventListener('input', () => {
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
});
//#endregion

//#region Add note
storage.local.get('settings', ({ settings }) => {
    if(!(settings.custom.advancedEnableSpellcheck ?? settings.default.advancedEnableSpellcheck)) {
        addNoteInput.spellcheck = false;
    }
});

[addNoteInput, addNoteBtn].forEach(element => {
    element.addEventListener('keypress', async (event) => {

        if (!event.shiftKey && event.key === 'Enter' && addNoteInput.value.trim()) {
            event.preventDefault();
            await saveNote();
        }
    });
});
addNoteBtn.addEventListener('click', saveNote);

async function saveNote() {
    const content = addNoteInput.value.trim();
    const priority = addNoteInput.parentElement.getAttribute('priority');
    const note = await Notes.save(content, priority);

    addNoteInput.value = '';
    addNoteBtn.classList.add('is-hidden');
    clearTag();
    addNote(note);
}
//#endregion

//#region note priority
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

async function deleteNote(id) {
    try {
        await Notes.delete(id);
        const deletedNote = recentlyAdded.querySelector(`div[data-id="${id}"]`);
        recentlyAdded.removeChild(deletedNote);
    } catch (e) {
        console.warn('Could not delete note: ', id);
    }
}

function addNote(note) {
    storage.local.get(['notePriorities', 'settings'], async ({ notePriorities, settings }) => {
        const priority = notePriorities.find(p => p.name === note.priority);
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.dataset.id = note.id;
        noteElement.setAttribute('tabindex', '0');
        noteElement.setAttribute('role', 'option');
        noteElement.setAttribute('aria-selected', 'false');
        noteElement.setAttribute('style', `border-left-color:${priority.custom.color || priority.default.color}`);
        const formattedNoteValue = (settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls)
            ? await formatNoteValue(note.value)
            : note.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
                        ${!note.mediaType ? 
                            `<button class="note-action-edit" title="${getMessage('noteActionEdit')}" aria-keyshortcuts="E">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                            </button>`
                        : ''}
                        
                        <button class="note-action-delete" title="${getMessage('noteActionDelete')}" aria-keyshortcuts="Backspace Delete">
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
            console.log(document.activeElement);
            const editKeys = [ 'e', ' ', 'enter' ];

            // Editing media notes is prohibited
            if (note.mediaType) {
                return;
            }

            if (document.activeElement !== noteElement) {
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                return;
            }

            if (editKeys.includes(event.key.toLowerCase())) {
                event.preventDefault();

                editNote(note.id);
            }
        };
        noteElement.onkeyup = event => {
            const notes = recentlyAdded.querySelectorAll('.note');
            const firstElement = recentlyAdded.querySelector('.note');
            const lastElement = notes[notes.length -1];

            if (!document.activeElement.classList.contains('note')) {
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();

                const previousElement = noteElement.previousElementSibling;

                if (previousElement?.classList?.contains('note')) {
                    previousElement.focus();
                } else {
                    lastElement?.focus();
                }
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();

                const nextElement = noteElement.nextElementSibling;

                if (nextElement?.classList?.contains('note')) {
                    nextElement.focus();
                } else {
                    firstElement?.focus();
                }
            }

            if (event.key === 'Home') {
                firstElement?.focus();
            }

            if (event.key === 'End') {
                lastElement?.focus();
            }

            if (event.key === 'Backspace' || event.key === 'Delete') {
                if (noteElement.dataset.preselectedForDeletion === 'true') {
                    deleteNote(note.id);
                } else {
                    noteElement.dataset.preselectedForDeletion = 'true';
                    setTimeout(() => noteElement.removeAttribute('data-preselected-for-deletion'), constant.DELETION_TIMEOUT_IN_MS);
                }
            }
        }
        noteElement.onfocus = () => noteElement.setAttribute('aria-selected', 'true');
        noteElement.onblur = () => noteElement.setAttribute('aria-selected', 'false');

        if (!note.mediaType) {
            editNoteBtn.onclick = () => editNote(note.id);
            noteElement.ondblclick = editNote.bind(null, note.id);
        }

        deleteNoteBtn.onclick = () => deleteNote(note.id);

        if (origin) {
            origin.addEventListener('click', e => {
                e.preventDefault();
                tabs.create({ url: origin.href });
            });
        }

        const noteActionWrapper = document.createElement('div');
        noteActionWrapper.classList.add('note-action-wrapper');

        // completed checkbox
        const completedBtn = document.createElement('input');
        completedBtn.type = 'checkbox';
        completedBtn.classList.add('note-action-complete');
        completedBtn.title = getMessage('noteActionCompletedTitle');
        completedBtn.checked = note.completed;

        if (note.completed) {
            noteElement.classList.toggle('is-completed')
        }

        completedBtn.onclick = async (e) => {
            e.stopImmediatePropagation();
            noteElement.classList.toggle('is-completed');

            await Notes.update(noteElement.dataset.id, 'completed', completedBtn.checked);
        }
        noteActionWrapper.appendChild(completedBtn);

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
                url.outerHTML = await createOgpCard(note, url.href);
            }
            addNoteLinkListeners(noteValue, true);
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

    Array.from(selectedNoteContent.querySelectorAll('code'))
        .forEach(code => code.textContent = `\`${code.textContent}\``);

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

        storage.local.get(['notes', 'settings'], async ({ settings }) => {
            const value = selectedNoteContent.textContent.trim();
            const updatedNote = await Notes.update(id, 'value', value);

            selectedNoteContent.innerHTML = (settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls)
                ? formatNoteValue(selectedNoteContent.textContent)
                : selectedNoteContent.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            selectedNoteContent.removeAttribute("contenteditable");
            selectedNoteContent.removeAttribute("tabindex");
            selectedNoteContent.removeAttribute('role');
            addNoteLinkListeners(selectedNoteContent);
            selectedNoteContent.onkeydown = null;

            if (settings.custom.advancedShowLinkPreview ?? settings.default.advancedShowLinkPreview) {
                const urls = Array.from(selectedNoteContent.querySelectorAll('a')).filter(url => !url.href.startsWith('mailto:'));

                for (const url of urls) {
                    url.outerHTML = await createOgpCard(updatedNote, url.href);
                }

                addNoteLinkListeners(selectedNote, true);
            }
        }); 
    }
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
    value = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    value?.match(constant.EMAIL_REGEX)?.forEach(email => {
        value = value.replace(email, `<a href="mailto:${email}" rel="noopener noreferrer">${email}</a>`);
    });

    value?.match(constant.URL_REGEX)?.forEach(url => {
        value = value.replace(url, `<a href="${url}" rel="noopener noreferrer">${url.replace(/https?:\/\//gi, "")}</a>`);
    });

    value?.match(constant.CODE_REGEX)?.forEach(code => {
       const preparedCode = code.slice(1).slice(0, -1);
       value = value.replace(code, `<code>${preparedCode}</code>`);
    });

    return value;
}

function addNoteLinkListeners(note, httpLinksOnly=false) {
    const noteLinks = note.querySelectorAll('.note-value a');

    for (const a of noteLinks) {
        if (httpLinksOnly && a.href.startsWith('mailto:')) {
            continue;
        }

        a.addEventListener('click', e => {
            e.preventDefault();

            tabs.create({
                url: a.href
            });
        });
    }
}

async function createOgpCard(note, url) {
    if (note.mediaType) {
        return getMediaPreview(note.mediaType, url);
    }

    const ogp = await getCachedOrDefaultOgpData(note, url);

    if (!ogp) {
        return formatNoteValue(url);
    }

    const media = ogp.img ?
        `<img src="${ogp.img}" aria-hidden="true" draggable="false" class="ogp-banner" />`
        : '';
    const favicon = ogp.favicon
        ? `<img src="${ogp.favicon}" aria-hidden="true" draggable="false" class="ogp-favicon" />`
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
            ${standalone ? '' : `title="${url.replace(/https?:\/\//i, '')}"`}
            ${lang}
            class="ogp-card"          
        >
            ${media}
            ${media ? favicon : ''}
            <div class="ogp-data">
                <div class="ogp-meta">
                    <span class="ogp-page-name">${ogp.pageName}</span>
                    ${ogp.publicationDate ? `
                        <span class="ogp-separator">•</span>
                        <time datetime="${ogp.publicationDate}">${formatShortDate(ogp.publicationDate, uiLang)}</time>
                    ` : ''}
                </div>
                <strong class="ogp-page-title">${ogp.title ?? getMessage('ogpNoTitle')}</strong>
               ${description}         
            </div>
        </a>
    `;
}

async function getCachedOrDefaultOgpData(note, url) {
    if (note.ogp?.[url] && new Date() < new Date(note.ogp?.[url]?.exp)) {
        return note.ogp[url];
    }

    const ogp = await getOgpData(url);
    await Notes.updateOgp(note.id, url, ogp);

    return ogp;
}

async function getOgpData(url) {
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

    try {
        return await fetch(constant.OGP_URL, ogpOptions).then(res => res.json());
    } catch (e) {}
}

function getMediaPreview(mediaType, url) {
    switch (mediaType) {
        case 'img':
            return `<img
                        src="${url}"
                        style="width: 100%"
                    />`;
        case 'video':
            return `<video
                        controls="controls"
                        ${!standalone ? 'controlslist="nofullscreen"': ''}
                        src="${url}"
                        preload="metadata"
                        style="width: 100%"
                    >                           
                    </video>`;
        case 'audio':
            return `<audio
                        src="${url}"
                        controls="controls"
                        preload="metadata"
                        style="width: 100%"
                    >                       
                    </audio>`;
        default:
            break;
    }
}
//#endregion
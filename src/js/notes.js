import { createId } from './util.js';

export class Notes {
    /**
     * @description Get's all notes that are open (not completed)
     * */
    static getAllOpenNotes() {
        return new Promise((resolve) => {
            chrome.storage.local.get('notes', ({ notes }) => {
                const openNotes = notes.filter(note => !note.completed);

                resolve(openNotes);
            });
        });
    }

    static getAllCompletedNotes() {
        return new Promise((resolve) => {
            chrome.storage.local.get('notes', ({ notes }) => {
                const openNotes = notes.filter(note => note.completed);

                resolve(openNotes);
            });
        });
    }

    /**
     * @description Deletes the specified note and removes it from the wrapper element
     * @param id {string}
     * */
    static delete(id) {
        return new Promise((resolve) => {
            chrome.storage.local.get('notes', res => {
                const { notes } = res;
                const updatedNotes = notes.filter(note => note.id !== id);

                chrome.storage.local.set({
                    notes: updatedNotes
                });

                resolve(updatedNotes);
            });
        });
    }

    /**
     * @description Saves the note
     * @param content {string} Note content
     * @param priority {string} Note priority
     * */
    static save(content, priority) {
        return new Promise((resolve) => {
            chrome.storage.local.get([ 'notes' ], ({ notes }) => {
                const note = {
                    value: content,
                    priority: priority || 'MEDIUM',
                    completed: false,
                    date: new Date().toISOString(),
                    id: createId(),
                    origin: null
                };
                notes.push(note);

                chrome.storage.local.set({ notes });

                resolve(note);
            });
        });
    }

    /**
     * @description Updates the note using given key and value
     * @param id {string} Note ID
     * @param key {string} Data key to be updated
     * @param value {string|boolean|number|object} Data value to be updated
     * */
    static update(id, key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.get('notes', res => {
                const oldNotes = res.notes;
                const noteToBeUpdated = oldNotes.find(note => note.id === id);
                noteToBeUpdated[key] = value;

                chrome.storage.local.set({
                    notes: oldNotes
                });

                resolve(noteToBeUpdated);
            });
        });
    }


    /**
     * @description Updates the note ogp for the given url
     * @param id {string} Note ID
     * @param url {string} URL inside the note to update the ogp
     * @param value {object} New OGP data
     * */
    static updatePreview(id, url, value) {
        return new Promise((resolve) => {
            chrome.storage.local.get('notes', res => {
                const oldNotes = res.notes;
                const noteToBeUpdated = oldNotes.find(note => note.id === id);
                noteToBeUpdated.preview = {
                    ...(noteToBeUpdated.preview || {}),
                    [url]: value
                };

                chrome.storage.local.set({
                    notes: oldNotes
                });

                resolve(noteToBeUpdated);
            });
        });
    }
}
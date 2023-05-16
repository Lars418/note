import {BlankNote, Note} from '@src/@types/interface/note';

export class NoteStorage {
    static getAll = async (): Promise<Note[]> => {
        return (await chrome.storage.local.get('notes')).notes;
    };
    static get = async (id: string): Promise<Note|undefined> => {
        const notes = await this.getAll();

        return notes.find(note => note.id === id);
    };
    static save = async (note: BlankNote): Promise<void> => {
        const notes = await this.getAll();

        await chrome.storage.local.set({
            notes: [
                ...notes,
                {
                    ...note,
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                }
            ]
        });
    };
    static update = async (id: string, value: string) => {
        const notes = await this.getAll();
        const note = await this.get(id);

        note.value = value.trim();
        note.modifiedAt = new Date().toISOString();

        await chrome.storage.local.set({
            notes: [
                ...notes,
                note,
            ]
        });
    }
}
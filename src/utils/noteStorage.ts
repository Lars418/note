import { Note } from '@src/@types/interface/note';

export class NoteStorage {
    static getAll = async (): Promise<Note[]> => {
        return (await chrome.storage.local.get('notes')).notes;
    };
    static get = async (id: string): Promise<Note|undefined> => {
        const notes = await this.getAll();

        return notes.find(note => note.id === id);
    };
    static save = async (note: Note): Promise<void> => {
        const notes = await this.getAll();

        await chrome.storage.local.set({
            notes: [
                ...notes,
                {
                    id: crypto.randomUUID(),
                    ...note,
                }
            ]
        });
    }
}
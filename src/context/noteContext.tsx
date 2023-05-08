import React from 'react';

interface INoteContext {
    editModeEnabled: boolean;
    noteRef?: HTMLElement;
    initialValue: string;
    value: string;

    setEditModeEnabled(editMode: boolean): void;
    setNoteRef(noteRef: HTMLElement): void;
    setValue(value: string): void;
    setInitialValue(value: string): void;
    handleUpdateNote(value: string): Promise<void>;
}

const NoteContext = React.createContext<INoteContext>({
    editModeEnabled: false,
    noteRef: undefined,
    initialValue: '',
    value: '',

    setEditModeEnabled: (editMode: boolean) => {},
    setNoteRef: (noteRef: HTMLElement) => {},
    setValue: (value: string) => {},
    setInitialValue: (value: string) => {},
    handleUpdateNote: async (value: string) => {},
});

export default NoteContext;
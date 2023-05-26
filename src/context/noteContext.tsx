import React from 'react';

interface INoteContext {
    editModeEnabled: boolean;
    initialValue: string;
    value: string;

    setEditModeEnabled(editMode: boolean): void;
    setValue(value: string): void;
    setInitialValue(value: string): void;
    handleUpdateNote(value: string): Promise<void>;
}

const NoteContext = React.createContext<INoteContext>({
    editModeEnabled: false,
    initialValue: '',
    value: '',

    setEditModeEnabled: (editMode: boolean) => {},
    setValue: (value: string) => {},
    setInitialValue: (value: string) => {},
    handleUpdateNote: async (value: string) => {},
});

export default NoteContext;
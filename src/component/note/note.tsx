import React, {useContext, useEffect, useState} from 'react';
import {Note as INote} from '@src/@types/interface/note';
import {Formatter} from '@src/utils/formatter';
import './note.scss';
import NoteOrigin from '@src/component/note/noteOrigin';
import FormattedNoteValue from '@src/component/note/formattedNoteValue';
import NoteContext from '@src/context/noteContext';

interface INoteComponent {
    note: INote;
    alternateBackground?: boolean;
}

const Note: React.FC<INoteComponent> = (props) => {
    const { note, alternateBackground } = props;
    const [formattedCreatedAt, setFormattedCreatedAt] = useState<string>('');
    const [editModeEnabled, setEditModeEnabled] = useState(false);
    const [noteRef, setNoteRef] = useState<HTMLElement|undefined>(null);
    const [value, setValue] = useState<string>(note.value);
    const [initialValue, setInitialValue] = useState<string>(note.value);

    const handleUpdateNote = async (value: string) => {
        const { notes } = (await chrome.storage.local.get('notes'));
        const updatedNote: INote = notes.find(_note => _note.id === note.id);

        updatedNote.value = value;
        updatedNote.modifiedAt = new Date().toISOString();

        await chrome.storage.local.set({
            notes,
        });
    };

    const handleDoubleClick = (event: React.MouseEvent<HTMLLIElement>) => {
        event.preventDefault();

        setEditModeEnabled(true);
    };

    useEffect(() => {
        (async () => {
            const formatted = await Formatter.formatDateTime(note.createdAt);
            setFormattedCreatedAt(formatted);
        })();
    }, []);

    useEffect(() => {
        if (editModeEnabled) {
            noteRef?.focus();
        }
    }, [editModeEnabled, noteRef]);

    return (
        <NoteContext.Provider
            value={{
                editModeEnabled,
                noteRef,
                initialValue,
                value,

                setEditModeEnabled,
                setNoteRef,
                setInitialValue,
                setValue,
                handleUpdateNote,
            }}
        >
            <li
                className={['note-wrapper', alternateBackground ? 'alternate': ''].join(' ').trim()}
                onDoubleClick={handleDoubleClick}
                data-id={note.id}
            >
                <div className="note-body">
                    <FormattedNoteValue />
                </div>

                <aside className="note-footer">
                    <ul className="note-meta">
                        <li>
                            <time dateTime={note.createdAt} title={formattedCreatedAt}>{Formatter.formatTimestamp(note.createdAt)}</time>
                        </li>

                        {
                            note.origin && (
                                <>
                                    <li className="separator" aria-hidden>•</li>
                                    <li>
                                        <NoteOrigin
                                            origin={note.origin}
                                            value={note.value}
                                        />
                                    </li>
                                </>
                            )
                        }
                    </ul>
                </aside>
            </li>
        </NoteContext.Provider>
    );
}

export default Note;

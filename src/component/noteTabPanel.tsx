import React from 'react';
import {Note as INote} from '@src/@types/interface/note';
import Note from '@src/component/note';

interface INotesStatusTabPanel {
    id: string;
    notes: INote[];
    hidden?: boolean;
}

const NoteTabPanel: React.FC<INotesStatusTabPanel> = (props) => {
    const { id, notes, hidden } = props;

    return (
        <div
            role="tabpanel"
            id={`tabpanel-${id}`}
            aria-labelledby={`tab-${id}`}
            hidden={hidden}
        >
            {
                notes.map(note => (
                    <Note
                        note={note}
                    />
                ))
            }
        </div>
    )
}

export default NoteTabPanel;

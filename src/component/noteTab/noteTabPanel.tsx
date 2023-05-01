import React from 'react';
import {Note as INote} from '@src/@types/interface/note';
import Note from '@src/component/note/note';
import FormattedMessage from '@src/component/formattedMessage';
import './noteTabPanel.scss';
import {CheckSquare, Edit3} from "react-feather";

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
                notes.length === 0 && (
                    <div className="noNotes-container">
                        {
                            id === 'completedNotes' ? (
                                <>
                                    <CheckSquare role="presentation" />
                                    <FormattedMessage id="noCompletedNotes" />
                                </>
                            ) : (
                                <>
                                    <Edit3 role="presentation" />
                                    <FormattedMessage id="noNotes" />
                                </>
                            )
                        }
                    </div>
                )
            }

            <ol className="note-list">
                {
                    notes.map(note => (
                        <Note
                            key={note.id}
                            note={note}
                        />
                    ))
                }
            </ol>
        </div>
    )
}

export default NoteTabPanel;

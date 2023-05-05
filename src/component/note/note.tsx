import React, {useEffect, useState} from 'react';
import {Note as INote} from '@src/@types/interface/note';
import {Formatter} from '@src/utils/formatter';
import './note.scss';
import NoteOrigin from "@src/component/note/noteOrigin";
import FormattedNoteValue from '@src/component/note/formattedNoteValue';

interface INoteComponent {
    note: INote;
    alternateBackground?: boolean;
}

const Note: React.FC<INoteComponent> = (props) => {
    const { note, alternateBackground } = props;
    const [formattedCreatedAt, setFormattedCreatedAt] = useState<string>('');

    useEffect(() => {
        (async () => {
            const formatted = await Formatter.formatDateTime(note.createdAt);
            setFormattedCreatedAt(formatted);
        })();
    }, []);

    return (
        <li className={['note-wrapper', alternateBackground ? 'alternate': ''].join(' ').trim()}>
            <div className="note-body">
                <FormattedNoteValue value={note.value} />
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
    );
}

export default Note;

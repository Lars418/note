import React from 'react';
import {Note as INote} from '@src/@types/interface/note';

interface INoteComponent {
    note: INote;
}

const Note: React.FC<INoteComponent> = (props) => {
    const { note } = props;

    return (
        <article>
            {note.title}
        </article>
    );
}

export default Note;

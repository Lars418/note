import './addNote.min.css';
import React, {useEffect, useState} from 'react';
import useIntl from "@src/hook/useIntl";
import Utils from "@src/utils/utils";
import { NoteStorage } from '@src/utils/noteStorage';

const AddNote: React.FC = () => {
    const intl = useIntl();
    const [motd, setMotd] = useState<string>('');
    const [draft, setDraft] = useState<string>('');

    useEffect(() => {
        (async () => {
            const _motd = await Utils.getRandomMotd();
            setMotd(_motd);
        })();
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(event.target.value);
    };

    const handleKeyPress = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== 'Enter') {
            return;
        }

        await NoteStorage.save({
            id: crypto.randomUUID(),
            value: draft,
            createdAt: new Date().toISOString()
        });
        setDraft('');
    };

    return (
        <textarea
            className="addNoteInput"
            aria-label={intl.formatMessage('addNotePlaceholder')}
            placeholder={motd}
            autoFocus
            value={draft}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
        />
    )
}

export default AddNote;

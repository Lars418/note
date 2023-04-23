import './addNote.min.css';
import React, {useEffect, useState} from 'react';
import useIntl from "@src/hook/useIntl";
import Utils from "@src/utils/utils";

const AddNote: React.FC = () => {
    const intl = useIntl();
    const [motd, setMotd] = useState<string>('');

    useEffect(() => {
        (async () => {
            const _motd = await Utils.getRandomMotd();
            setMotd(_motd);
        })();
    }, []);

    return (
        <textarea
            className="addNoteInput"
            aria-label={intl.formatMessage('addNotePlaceholder')}
            placeholder={motd}
        />
    )
}

export default AddNote;

import React from 'react';

interface IFormattedNoteOrigin {
    origin: string;
    value?: string;
}

const NoteOrigin: React.FC<IFormattedNoteOrigin> = (props) => {
    const { origin, value } = props;
    const { hash, host, protocol, pathname } = new URL(origin);
    const hasHash = hash !== '';
    const preparedUrl = hasHash && value
        ? origin
        : origin + '#:~:text=' + encodeURIComponent(value);
    let displayUrl = host;

    if (!origin) {
        return;
    }

    switch (protocol) {
        case 'file:':
            displayUrl = pathname.split('/')[pathname.split('/').length - 1];
            break;
        case 'data:':
        case 'chrome-extension':
            displayUrl = chrome.i18n.getMessage('contextMenuFileUrl');
            break;
    }

    return (
        <a
            className="note-origin"
            href={preparedUrl}
            target="_parent"
        >
            {displayUrl}
        </a>
    );
}

export default NoteOrigin;

import React from 'react';

interface INoteTabPanelContext {
    spellcheckEnabled: boolean;
    parseUrlsEnabled: boolean;
    linkPreviewEnabled: boolean;

    setSpellcheckEnabled(spellcheckEnabled: boolean): void;
    setParseUrlsEnabled(parseUrlsEnabled: boolean): void;
    setLinkPreviewEnabled(linkPreviewEnabled: boolean): void;
}

const NoteTabPanelContext = React.createContext({
    spellcheckEnabled: true,
    parseUrlsEnabled: true,
    linkPreviewEnabled: true,

    setSpellcheckEnabled: (spellcheckEnabled: boolean) => {},
    setParseUrlsEnabled: (parseUrlsEnabled: boolean) => {},
    setLinkPreviewEnabled: (linkPreviewEnabled: boolean) => {},
});

export default NoteTabPanelContext;

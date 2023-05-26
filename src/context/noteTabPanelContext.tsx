import React from 'react';
import {PreviewDataContainer} from "@src/@types/interface/linkPreview/previewDataContainer";

interface INoteTabPanelContext {
    spellcheckEnabled: boolean;
    parseUrlsEnabled: boolean;
    linkPreviewEnabled: boolean;
    previewData: PreviewDataContainer;

    setSpellcheckEnabled(spellcheckEnabled: boolean): void;
    setParseUrlsEnabled(parseUrlsEnabled: boolean): void;
    setLinkPreviewEnabled(linkPreviewEnabled: boolean): void;
    setPreviewData(previewData: PreviewDataContainer): void;
}

const NoteTabPanelContext = React.createContext<INoteTabPanelContext>({
    spellcheckEnabled: true,
    parseUrlsEnabled: true,
    linkPreviewEnabled: true,
    previewData: {},

    setSpellcheckEnabled: (spellcheckEnabled: boolean) => {},
    setParseUrlsEnabled: (parseUrlsEnabled: boolean) => {},
    setLinkPreviewEnabled: (linkPreviewEnabled: boolean) => {},
    setPreviewData: (previewData: PreviewDataContainer) => {},
});

export default NoteTabPanelContext;

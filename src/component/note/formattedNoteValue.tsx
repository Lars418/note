import React, { useEffect, useState } from 'react';

interface IFormattedNoteValue {
    value: string;
}

const FormattedNoteValue: React.FC<IFormattedNoteValue> = (props) => {
    const { value } = props;
    const [editModeEnabled, setEditModeEnabled] = useState<boolean>(false);
    const [spellcheckEnabled, setSpellcheckEnabled] = useState(true);
    const [parseUrlsEnabled, setParseUrlsEnabled] = useState<boolean>(false);
    const [linkPreviewEnabled, setLinkPreviewEnabled] = useState<boolean>(false);
    const defaultPreparedValue = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const [preparedValue, setPreparedValue] = useState(defaultPreparedValue);

    useEffect(() => {
        if (parseUrlsEnabled) {
            setPreparedValue(preparedValue => preparedValue);
        }

        if (linkPreviewEnabled) {
            setPreparedValue(preparedValue => {
                return preparedValue;
            });
        }
    }, []);

    useEffect(() => {
        (async () => {
            const { settings } = await chrome.storage.local.get('settings');

            setSpellcheckEnabled(settings.custom.advancedEnableSpellcheck ?? settings.default.advancedEnableSpellcheck);
            setParseUrlsEnabled(settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls);
            setLinkPreviewEnabled(settings.custom.advancedShowLinkPreview ?? settings.default.advancedShowLinkPreview);
        })();
    }, []);

    return (
      <article
          spellCheck={spellcheckEnabled}
          contentEditable={editModeEnabled}
          dangerouslySetInnerHTML={{ __html: preparedValue }}
      />

    );
}

export default FormattedNoteValue;

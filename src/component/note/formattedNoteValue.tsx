import React, {useContext, useEffect, useRef, useState} from 'react';
import NoteContext from '@src/context/noteContext';
import NoteTabPanelContext from '@src/context/noteTabPanelContext';
import './formattedNoteValue.scss';
import { constant } from '@src/utils/constant';
import { Formatter } from '@src/utils/formatter';
import NoteLink from '@src/component/note/noteLink';
import LinkPreviewCard from '@src/component/linkPreview/linkPreviewCard';

const FormattedNoteValue: React.FC = () => {
    const {
        editModeEnabled,
        value: currentValue,
        setEditModeEnabled,
        setValue,
        handleUpdateNote,
    } = useContext(NoteContext);
    const { parseUrlsEnabled, spellcheckEnabled, linkPreviewEnabled } = useContext(NoteTabPanelContext);
    const [draftValue, setDraftValue] = useState(currentValue);
    const [richValue, setRichValue] = useState<any>([]);
    const noteEditorRef = useRef<HTMLTextAreaElement>();

    const updateNote = async () => {
        setEditModeEnabled(false);

        const preparedValue = Formatter.formatNoteValue(draftValue);

        await handleUpdateNote(preparedValue);
        setValue(preparedValue);
    };

    const handleKeyPress = async (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();

            setEditModeEnabled(false);
            setDraftValue(currentValue);
        }

        if (event.ctrlKey && (event.code === 'Enter' || event.code === 'NumpadEnter')) {
            event.preventDefault();
            event.stopPropagation();

            await updateNote();
        }
    };

    const handleBlur = async () => {
        await updateNote();
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraftValue(event.target.value);
    };

    const renderNoteValue = (rawRichValue: string) => {
        const combinedRegex = new RegExp(`${constant.LINEBREAK_REGEX.source}|${constant.EMAIL_REGEX.source}|${constant.URL_REGEX.source}`);
        const preparedLines = rawRichValue.split(combinedRegex).filter(value => value);

        if (editModeEnabled) {
            return currentValue.split(constant.LINEBREAK_REGEX).map(line => {
                if (line.match(constant.LINEBREAK_REGEX)) {
                    return <br />;
                }

                return line;
            });
        }

        return preparedLines.map(value => {
            if (value?.match(constant.LINEBREAK_REGEX)) {
                return <br />;
            }

            if (parseUrlsEnabled) {
                if (value?.match(constant.URL_REGEX)) {
                    if (linkPreviewEnabled) {
                        return <LinkPreviewCard url={value} />;
                    }

                    return <NoteLink url={value} />;
                }

                if (value?.match(constant.EMAIL_REGEX)) {
                    return <NoteLink url={value} />;
                }
            }

            return value;
        });
    };

    useEffect(() => {
        const renderedRichNoteValue = renderNoteValue(currentValue);

        setRichValue(renderedRichNoteValue);
    }, [currentValue]);

    useEffect(() => {
        if (editModeEnabled) {
            noteEditorRef.current?.focus();
            noteEditorRef.current.selectionStart = currentValue.length;
            noteEditorRef.current.selectionEnd = currentValue.length;
        }
    }, [editModeEnabled]);

    return (
      <>
          <article
              className="formattedNoteValue"
              hidden={editModeEnabled}
          >{richValue}</article>
          <textarea
              className="formattedNoteValue-editor"
              ref={noteEditorRef}
              onKeyDown={handleKeyPress}
              onBlur={handleBlur}
              onChange={handleChange}
              spellCheck={spellcheckEnabled}
              hidden={!editModeEnabled}
              value={draftValue}
              rows={draftValue.split('\n').length}
          />
      </>
    );
}

export default FormattedNoteValue;

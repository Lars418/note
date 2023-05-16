import React, {useContext, useEffect, useRef, useState} from 'react';
import NoteContext from '@src/context/noteContext';
import NoteTabPanelContext from '@src/context/noteTabPanelContext';
import './formattedNoteValue.scss';
import { constant } from '@src/utils/constant';
import { Formatter } from '@src/utils/formatter';

const FormattedNoteValue: React.FC = () => {
    const {
        editModeEnabled,
        value,
        setEditModeEnabled,
        setNoteRef,
        setValue,
        handleUpdateNote,
    } = useContext(NoteContext);
    const { parseUrlsEnabled, spellcheckEnabled, linkPreviewEnabled } = useContext(NoteTabPanelContext);
    const [richValue, setRichValue] = useState<string>('');
    const noteRef = useRef<HTMLElement>();

    const updateNote = async (value: string) => {
        setEditModeEnabled(false);
        const preparedValue = Formatter.formatNoteValue(value);
        setValue(preparedValue);
        await handleUpdateNote(preparedValue);
    };

    const handleKeyPress = async (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();

            setEditModeEnabled(false);
            event.currentTarget.innerHTML = value;
        }

        if (event.ctrlKey && event.code === 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            await updateNote(event.currentTarget.innerHTML);
        }
    };

    const handleBlur = async (event: React.FocusEvent<HTMLElement>) => {
        await updateNote(event.currentTarget.innerHTML);
    };

    useEffect(() => {
        setNoteRef(noteRef.current);
    }, [noteRef.current])

    useEffect(() => {
        let _value = value.replace(/\n/gi, '<br>');

        setValue(_value);

        if (parseUrlsEnabled) {

            _value?.match(constant.EMAIL_REGEX)?.forEach(email => {
                _value = _value.replace(email, `<a href='mailto:${email}'>${email}</a>`);
            });

            _value?.match(constant.URL_REGEX)?.forEach(url => {
                _value = _value.replace(url, `<a href='${url}'>${url.replace(/https?:\/\//gi, '')}</a>`);
            });

            _value?.match(constant.CODE_REGEX)?.forEach(code => {
                const preparedCode = code.slice(1).slice(0, -1);
                _value = _value.replace(code, `<code>${preparedCode}</code>`);
            });

            setRichValue(_value);
        }

        if (linkPreviewEnabled) {
            // TODO
        }
    }, [value]);

    return (
      <article
          className="formattedNoteValue"
          ref={noteRef}
          spellCheck={spellcheckEnabled}
          contentEditable={editModeEnabled}
          dangerouslySetInnerHTML={{ __html: editModeEnabled
                  ? value
                  : richValue || value
          }}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
      />
    );
}

export default FormattedNoteValue;

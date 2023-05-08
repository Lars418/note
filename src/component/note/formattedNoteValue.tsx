import React, {useContext, useEffect, useRef, useState} from 'react';
import NoteContext from '@src/context/noteContext';
import NoteTabPanelContext from '@src/context/noteTabPanelContext';
import './formattedNoteValue.scss';

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
    const noteRef = useRef<HTMLElement>();

    const updateNote = async (value: string) => {
        setEditModeEnabled(false);
        const preparedValue = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

        if (!event.shiftKey && event.key === 'Enter') {
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
        if (parseUrlsEnabled) {
            // TODO
        }

        if (linkPreviewEnabled) {
            // TODO
        }
    }, []);

    return (
      <article
          className="formattedNoteValue"
          ref={noteRef}
          spellCheck={spellcheckEnabled}
          contentEditable={editModeEnabled}
          dangerouslySetInnerHTML={{ __html: value }}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
      />
    );
}

export default FormattedNoteValue;

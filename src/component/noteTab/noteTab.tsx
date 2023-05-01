import React, {LegacyRef, useEffect, useRef} from 'react';
import FormattedMessage from '@src/component/formattedMessage';
import './noteTab.scss';

interface INoteTab {
    onRefChange(ref: React.MutableRefObject<HTMLButtonElement>): void;
    name: string;
    active: boolean;
    onClick(event: React.MouseEvent<HTMLButtonElement>): void;
}

const NoteTab: React.FC<INoteTab> = (props) => {
    const ref = useRef<HTMLButtonElement>();
    const { onRefChange, name, active, onClick } = props;

    useEffect(() => {
        onRefChange(ref);
    }, [ref]);

    return (
        <button
            ref={ref}
            className="note-tab"
            id={`tab-${name}`}
            key={name}
            data-tab={name}
            onClick={onClick}
            role="tab"
            aria-controls={`tabpanel-${name}`}
            aria-selected={active}
        >
            <FormattedMessage id={name} />
        </button>
    )
}

export default NoteTab;

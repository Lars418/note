import React from 'react';
import './noteTabs.scss';

interface INoteTabs {
    children: React.ReactNode;
    activeTabCoordinates: DOMRect;
}

const NoteTabs: React.FC<INoteTabs> = (props) => {
    const { children, activeTabCoordinates } = props;

    return (
        <div
            className="note-tabs"
            role="tablist"
        >
            {children}

            <span
                className="activeTab-highlight"
                role="presentation"
                style={{
                    width: activeTabCoordinates.width,
                    left: activeTabCoordinates.x
                }}
            />
        </div>
    )
}

export default NoteTabs;

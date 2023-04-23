import React, {useEffect, useState} from 'react';
import './updateNotice.min.css';
import useIntl from '@src/hook/useIntl';

interface PreviousVersion {
    value?: string;
    visible?: boolean;
}

const UpdateNotice: React.FC = () => {
    const intl = useIntl();
    const { name, version } = chrome.runtime.getManifest();
    const [previousVersion, setPreviousVersion] = useState<PreviousVersion>({});

    useEffect(() => {
        (async () => {
            const { previousVersion } = await chrome.storage.local.get('previousVersion') as { previousVersion?: PreviousVersion };
            setPreviousVersion(previousVersion);
        })();
    }, []);

    if (!previousVersion?.visible) {
        return null;
    }

    return (
        <a
            href="#"
            className="extensionUpdateNotice"
            title={intl.formatMessage('updateTitle', {
                extension_name: name,
                previous_version: previousVersion.value,
                version
            })}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <g className="extensionUpdateNotice-arrow">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <polyline points="16 16 12 12 8 16"/>
                </g>
                <path
                    d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"
                    className="extensionUpdateNotice-cloud"
                />
                <circle
                    className="extensionUpdateNotice-dot"
                    cx="20"
                    cy="4"
                    r="4"
                    fill="#ffc156"
                    stroke="none"
                />
            </svg>
        </a>
    );
}

export default UpdateNotice;

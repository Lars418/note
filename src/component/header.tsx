import React from 'react';
import './header.min.css';
import FormattedMessage from '@src/component/formattedMessage';
import {Maximize2, Settings} from "react-feather";
import useIntl from "@src/hook/useIntl";
import UpdateNotice from '@src/component/updateNotice';

const Header: React.FC = () => {
    const intl = useIntl();

    const handleOpenSettings = () => {
        chrome.runtime.openOptionsPage();
    };

    const handleOpenNewTab = async () => {
        await chrome.windows.create({
            url: `/src/pages/popup/index.html?standalone=1&predefinedMessage=&priority=`,
            type: 'popup',
            width: 433,
            height: 600,
            top: 0
        });
        window.close();
    };

    return (
        <header>
            <h1>
                <FormattedMessage id="name" />
            </h1>

            <div className="header-actions">
                <UpdateNotice />

                <button
                    title={intl.formatMessage('settingsTitle')}
                    onClick={handleOpenSettings}
                >
                    <Settings />
                </button>

                <button
                    title={intl.formatMessage('newTabTitle')}
                    onClick={handleOpenNewTab}
                >
                    <Maximize2 />
                </button>
            </div>
        </header>
    )
}

export default Header;

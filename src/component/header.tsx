import React from 'react';
import './header.min.css';
import FormattedMessage from '@src/component/formattedMessage';
import {Maximize2, Settings} from "react-feather";
import useIntl from "@src/hook/useIntl";
import UpdateNotice from '@src/component/updateNotice';

const Header: React.FC = () => {
    const intl = useIntl();
    const isStandalone = new URL(window.location.href).searchParams.get('standalone') === '1';

    const handleOpenSettings = () => {
        chrome.runtime.openOptionsPage();
    };

    const handleOpenNewTab = async () => {
        const { settings } = await chrome.storage.local.get('settings');

        await chrome.windows.create({
            url: `/src/pages/popup/index.html?standalone=1&predefinedMessage=&priority=`,
            type: 'popup',
            width: settings.custom?._standalone?.width ?? settings.default._standalone.width,
            height: settings.custom?._standalone?.height ?? settings.default._standalone.height,
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
                    type="button"
                >
                    <Settings />
                </button>

                {
                    !isStandalone && (
                        <button
                            title={intl.formatMessage('newTabTitle')}
                            onClick={handleOpenNewTab}
                            type="button"
                        >
                            <Maximize2 />
                        </button>
                    )
                }
            </div>
        </header>
    )
}

export default Header;

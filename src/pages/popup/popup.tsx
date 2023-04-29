import React, {useEffect, useState} from 'react';
import Header from '@src/component/header';
import '../../css/colors.min.css';
import '../../css/reset.min.css';
import './popup.min.css';
import AddNote from "@src/component/addNote";
import NoteTabPanel from "@src/component/noteTabPanel";
import NoteTab from "@src/component/noteTab";
import NoteTabs from "@src/component/noteTabs";

const Popup = () => {
    const tabs = ['myNotes', 'completedNotes'];
    const [tabRefs, setTabRefs] = useState<{ [tab: string]: HTMLButtonElement }>({});
    const [activeTab, setActiveTab] = useState<HTMLButtonElement|undefined>();

    const handleTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setActiveTab(event.target as HTMLButtonElement);
    };

    const handleChangeRef = (tab: string, ref: React.MutableRefObject<HTMLButtonElement>) => {
        setTabRefs(prevState => ({
            ...prevState,
            [tab]: ref.current
        }));
    };

    useEffect(() => {
        const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isStandalone = new URL(window.location.href).searchParams.get('standalone') === '1';

        if (prefersDarkTheme) {
            document.documentElement.classList.add('dark-theme');
        }

        if (isStandalone) {
            document.documentElement.classList.add('standalone');
            document.title = '­';

            window.addEventListener('resize', async (event) => {
                const { settings } = await chrome.storage.local.get('settings');
                await chrome.storage.local.set({
                    settings: {
                        ...settings,
                        custom: {
                            ...settings.custom,
                            _standalone: {
                                width: (event.target as Window).outerWidth,
                                height: (event.target as Window).outerHeight,
                            }
                        }
                    }
                })
            });
        }
    }, []);

    useEffect(() => {
        const defaultNoteTab = tabRefs[tabs[0]];

        if (!activeTab && defaultNoteTab) {
            setActiveTab(defaultNoteTab);
        }
    }, [tabRefs]);

  return (
    <>
        <Header />

        <AddNote />

        <NoteTabs activeTabCoordinates={activeTab?.getBoundingClientRect() ?? {} as DOMRect}>
            {
                tabs.map(tab => (
                    <NoteTab
                        onRefChange={(ref) => handleChangeRef(tab, ref)}
                        key={tab}
                        name={tab}
                        active={activeTab?.dataset.tab === tab}
                        onClick={handleTabClick}
                    />
                ))
            }
        </NoteTabs>

        {
            tabs.map(tab => (
                <NoteTabPanel
                    key={tab}
                    id={tab}
                    notes={[{
                        title: tab
                    }]}
                    hidden={activeTab?.dataset.tab !== tab}
                />
            ))
        }
    </>
  );
};

export default Popup;

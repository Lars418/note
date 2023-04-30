import React, { useEffect, useState } from 'react';
import NoteTabs from '@src/component/noteTabs';
import NoteTab from '@src/component/noteTab';
import NoteTabPanel from '@src/component/noteTabPanel';

const NoteTabContainer: React.FC = () => {
    const [tabs, setTabs] = useState<string[]>([]);
    const [tabRefs, setTabRefs] = useState<{ [tab: string]: HTMLButtonElement }>({});
    const [activeTab, setActiveTab] = useState<HTMLButtonElement|null>(null);

    const handleTabClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        const { settings } = await chrome.storage.local.get('settings');
        const _activeTab = event.target as HTMLButtonElement;

        setActiveTab(_activeTab);
        await chrome.storage.local.set({
            settings: {
                ...settings,
                custom: {
                    ...settings.custom,
                    _selectedTab: _activeTab.dataset.tab,
                },
            },
        });
    };

    const handleChangeRef = (tab: string, ref: React.MutableRefObject<HTMLButtonElement>) => {
        setTabRefs(prevState => ({
            ...prevState,
            [tab]: ref.current
        }));
    };

    useEffect(() => {
        (async () => {
            const { settings } = await chrome.storage.local.get('settings');
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

            setTabs(!settings.custom._tabs?.length ? settings.default._tabs : settings.custom._tabs);
        })()
    }, []);

    useEffect(() => {
        (async () => {
            const { settings } = await chrome.storage.local.get('settings');
            const firstTab = settings.custom._tabs?.[0] ?? settings.default._tabs[0];
            const key = settings.custom._selectedTab ?? settings.default._selectedTab ?? firstTab;
            const defaultNoteTab = tabRefs[key];

            if (!activeTab && defaultNoteTab) {
                setActiveTab(defaultNoteTab);
            }
        })();
    }, [tabRefs]);

    return (
        <>
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
    )
}

export default NoteTabContainer;

import React, { useEffect, useState } from 'react';
import NoteTabs from '@src/component/noteTab/noteTabs';
import NoteTab from '@src/component/noteTab/noteTab';
import NoteTabPanel from '@src/component/noteTab/noteTabPanel';
import { NoteStorage } from '@src/utils/noteStorage';
import { Note } from '@src/@types/interface/note';

const NoteTabContainer: React.FC = () => {
    const [tabs, setTabs] = useState<string[]>([]);
    const [tabRefs, setTabRefs] = useState<{ [tab: string]: HTMLButtonElement }>({});
    const [activeTab, setActiveTab] = useState<HTMLButtonElement|null>(null);
    const [notes, setNotes] = useState<{ [category: string]: Note[] }>({});

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

    const getNotes = async (tab: string) => {
        const _notes = await NoteStorage.getAll();

        switch (tab) {
            case 'myNotes':
                return setNotes(notes => ({
                    ...notes,
                    myNotes: _notes.filter(note => !note.completedAt)
                }));
            case 'completed':
                return setNotes(notes => ({
                    ...notes,
                    completed: _notes.filter(note => note.completedAt)
                }));
            default:
                return setNotes(notes => ({
                    ...notes,
                    [tab]: _notes.filter(note => note.category === tab)
                }));
        }
    };

    useEffect(() => {
        (async () => {
            const { settings } = await chrome.storage.local.get('settings');
            const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isStandalone = new URL(window.location.href).searchParams.get('standalone') === '1';
            const _tabs = !settings.custom._tabs?.length ? settings.default._tabs : settings.custom._tabs;

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

            setTabs(_tabs);

            for (const tab of _tabs) {
                await getNotes(tab);
            }

            chrome.storage.onChanged.addListener(async (changes) => {
                if (changes.notes) {
                    for (const tab of _tabs) {
                        console.log('Updating notes for tab ' + tab);
                       await getNotes(tab);
                    }
               }
            });
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
                        notes={notes[tab] ?? []}
                        hidden={activeTab?.dataset.tab !== tab}
                    />
                ))
            }
        </>
    )
}

export default NoteTabContainer;

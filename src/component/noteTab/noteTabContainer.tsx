import React, { useEffect, useState } from 'react';
import NoteTabs from '@src/component/noteTab/noteTabs';
import NoteTab from '@src/component/noteTab/noteTab';
import NoteTabPanel from '@src/component/noteTab/noteTabPanel';
import { NoteStorage } from '@src/utils/noteStorage';
import { Note } from '@src/@types/interface/note';
import NoteTabPanelContext from "@src/context/noteTabPanelContext";
import {PreviewDataContainer} from "@src/@types/interface/linkPreview/previewDataContainer";
import UrlCache from "@src/utils/urlCache";

const NoteTabContainer: React.FC = () => {
    const [tabs, setTabs] = useState<string[]>([]);
    const [tabRefs, setTabRefs] = useState<{ [tab: string]: HTMLButtonElement }>({});
    const [activeTab, setActiveTab] = useState<HTMLButtonElement|null>(null);
    const [notes, setNotes] = useState<{ [category: string]: Note[] }>({});
    const [spellcheckEnabled, setSpellcheckEnabled] = useState(true);
    const [parseUrlsEnabled, setParseUrlsEnabled] = useState<boolean>(false);
    const [linkPreviewEnabled, setLinkPreviewEnabled] = useState<boolean>(false);
    const [previewData, setPreviewData] = useState<PreviewDataContainer>({});

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
            const { settings, urlCache } = await chrome.storage.local.get(['settings', 'urlCache']);
            const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isStandalone = new URL(window.location.href).searchParams.get('standalone') === '1';
            const _tabs = !settings.custom._tabs?.length ? settings.default._tabs : settings.custom._tabs;

            setSpellcheckEnabled(settings.custom.advancedEnableSpellcheck ?? settings.default.advancedEnableSpellcheck);
            setParseUrlsEnabled(settings.custom.advancedParseUrls ?? settings.default.advancedParseUrls);
            setLinkPreviewEnabled(settings.custom.advancedShowLinkPreview ?? settings.default.advancedShowLinkPreview);
            setPreviewData(urlCache);

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

    useEffect(() => {
        (async () => {
            if (Object.keys(previewData).length > 0) {
                await UrlCache.setOrUpdateComplete(previewData);
            }
        })();
    }, [previewData]);

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

            <NoteTabPanelContext.Provider
                value={{
                    spellcheckEnabled,
                    parseUrlsEnabled,
                    linkPreviewEnabled,
                    previewData,

                    setSpellcheckEnabled,
                    setParseUrlsEnabled,
                    setLinkPreviewEnabled,
                    setPreviewData,
                }}
            >
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
            </NoteTabPanelContext.Provider>
        </>
    )
}

export default NoteTabContainer;

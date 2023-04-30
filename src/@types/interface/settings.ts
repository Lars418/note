export interface Settings {
    advancedParseUrls: boolean;
    advancedEnableSpellcheck: boolean;
    advancedShowLinkPreview: boolean;

    saveCurrentNote: boolean;
    showContextMenu: boolean;
    darkMode: boolean;

    _standalone: {
        width: number;
        height: number;
    };
    _selectedTab: string;
}
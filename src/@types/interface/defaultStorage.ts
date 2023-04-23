import { Settings } from '@src/@types/interface/settings';
import { Note } from '@src/@types/interface/note';

export interface DefaultStorage {
    draft: {
        value: string;
        priority: string;
    };
    settings: {
        default: Settings;
        custom: Settings | {};
    };
    notes: Note[];
}
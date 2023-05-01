import utils from "@src/utils/utils";

export class Formatter {
    static async formatDateTime (date: string) {
        const language = await utils.getLanguage();

        return new Intl
            .DateTimeFormat(language, {
                year: 'numeric',
                month: 'long',
                weekday: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            })
            .format(new Date(date));
    };

    static async formatShortDate (date: string) {
        const language = await utils.getLanguage();

        return new Intl
            .DateTimeFormat(language, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            })
            .format(new Date(date));
    };

    static formatTimestamp(date) {
        const { getMessage } = chrome.i18n;
        const today = new Date();
        const noteDate = new Date(date);
        const oneMinute = 60 * 1_000;
        const diff = Math.round(Math.abs((today.getTime() - noteDate.getTime()) / oneMinute));

        if (diff === 0) return getMessage('justNow');
        else if (diff === 1) return getMessage('oneMinuteAgo');
        else if (diff < 60) return getMessage('nMinutesAgo', diff.toString());
        else if (diff < 120) return getMessage('oneHourAgo');
        else if (diff < (60 * 24)) return getMessage('nHoursAgo', Math.round (diff / 60).toString());
        else if (diff < 60 * 24 * 2) return getMessage('oneDayAgo');
        else if (diff < (60 * 24 * 30)) return getMessage('nDaysAgo', Math.round(diff / (60*24)).toString());

        return getMessage('overAMonth');
    }
}
import utils from "@src/utils/utils";

export class Formatter {
    static escape(unescapedValue: string) {
        return unescapedValue
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }

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
    };

    static formatNoteValue(rawValue: string) {
        const parser = new DOMParser();
        const preparedValue = rawValue?.replace(/<br>/gi, '\n');
        const dom = parser.parseFromString(preparedValue, 'text/html');
        const linesToBeAdded = [];

        dom.querySelectorAll('div').forEach((line) => {
            const lineContent = line.textContent.trim();

            if (lineContent) {
                linesToBeAdded.push(lineContent);
            }

            line.parentNode.removeChild(line);
        });

        linesToBeAdded.forEach(line => {
           dom.body.textContent += `\n${line}`;
        });

        return this.escape(dom.body.textContent);
    };

    static async formatDuration(rawDuration: number) {
        const language = await utils.getLanguage();
        const options: { [key: string]: string|boolean } = {
            second: 'numeric',
            hour12: false,
        };

        if (rawDuration >= 60) {
            options.minute = 'numeric';
        }

        if (rawDuration >= 3600) {
            options.hour = 'numeric';
        }

        const formatter = new Intl.DateTimeFormat(language, options as any);
        const date = new Date(0);
        date.setSeconds(rawDuration);

        const formattedDate =  formatter.format(date);

        if (!options.minute) {
            return `00:${formattedDate}`;
        }

        return formattedDate;

    };

    static async formatCurrency(value: number, currency: string) {
        const language = await utils.getLanguage();

        return new Intl
            .NumberFormat(language, {
                style: 'currency',
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
            .format(value);
    }
}
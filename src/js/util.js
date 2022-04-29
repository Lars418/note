/**
 * Creates an Id
 * @author https://stackoverflow.com/a/2117523/8463645
 */
export function createId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Lightens or darkens a hex color
 * @param {*} col
 * @param {*} amt
 * @author https://stackoverflow.com/q/5560248/8463645 (this version is slightly modified from the linked one)
 */
export function lightenDarkenColor(col, amt) {
    if(col.startsWith("var(--")) {
        const cssVar = col.replace("var(", "").replace(")", "");
        col = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
    }

    col = col.replace("#", "");
    col = parseInt(col, 16);

    const color = (((col & 0x0000FF) + amt) | ((((col >> 8) & 0x00FF) + amt) << 8) | (((col >> 16) + amt) << 16)).toString(16).replace("-", "");
    return color < 1 ? "var(--black)" : ("#" + color);
}

/**
 * @param date {string}
 * @param language {string}
 * */
export function formatDateTime(date, language) {
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
}

/**
 * @param date {string}
 * @param language {string}
 * */
export function formatShortDate(date, language) {
    return new Intl
        .DateTimeFormat(language, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        })
        .format(new Date(date));
}

/**
 * @param number {number}
 * @param language {string}
 * @param minimumFractionDigits {number}
 * */
export function formatNumber(number, language, minimumFractionDigits = 0) {
    return new Intl
        .NumberFormat(language, {
            minimumFractionDigits
        })
        .format(number);
}

/**
 * @param date {string}
 * */
export function formatTimestamp(date) {
    const { getMessage } = chrome.i18n;
    const today = new Date();
    const noteDate = new Date(date);
    const oneMinute = 60 * 1_000;
    const diff = Math.round(Math.abs((today - noteDate) / oneMinute));

    if(diff === 0) return getMessage("justNow");
    else if(diff === 1) return getMessage("oneMinuteAgo");
    else if(diff < 60) return getMessage("nMinutesAgo", diff.toString());
    else if(diff < 120) return getMessage("oneHourAgo");
    else if(diff < (60 * 24)) return getMessage("nHoursAgo", Math.round(diff / 60).toString());
    else if(diff < 60 * 24 * 2) return getMessage("oneDayAgo");
    else if(diff < (60 * 24 * 30)) return getMessage("nDaysAgo", Math.round(diff / (60*24)).toString());

    return getMessage("overAMonth");
}

export function applyTranslations(document) {
    const { getMessage } = chrome.i18n;
    const elements = Array.from(document.querySelectorAll('*'))
        .filter(element => Object.keys(element.dataset).some(attribute => attribute.startsWith('intl')));

    elements.forEach(element => {
       const dataAttributes = Object.keys(element.dataset).filter(attribute => attribute.startsWith('intl'));

       dataAttributes.forEach(attribute => {
            if (attribute === 'intl') {
                element.innerHTML = getMessage(element.dataset.intl);
            } else {
                const preparedAttribute = attribute
                    .replace(/^intl/i, '')
                    .split(/(?=[A-Z])/).join('-').toLowerCase();

                element.setAttribute(preparedAttribute, getMessage(element.dataset[attribute]));
            }
       });
    });
}

/**
 * @param url {string}
 * */
export function getUrlFormat(url) {
    const { getMessage } = chrome.i18n;
    const { host, pathname, protocol} = new URL(url);

    if(protocol === "file:") {
        const paths = pathname.split('/');

        return paths[(paths.length - 1)];
    }

    if(protocol === "chrome-extension:") return getMessage("contextMenuFileUrl");

    if(protocol === "data:") {
        return "data-uri"
    }

    return host;
}

/** Load theme */
export function loadTheme() {
    const { storage } = chrome;

    storage.local.get([ 'settings' ], ({ settings }) => {
        if (settings.custom.darkMode === undefined) {
            const useDarkTheme = window.matchMedia('(prefers-color-scheme: dark').matches;

            storage.local.set({
                settings: {
                    ...settings,
                    custom: {
                        ...settings.custom,
                        darkMode: useDarkTheme
                    }
                }
            });

            if (useDarkTheme) {
                document.documentElement.classList.add('dark-theme');
            }
        }

        if (settings.custom.darkMode ?? settings.default.darkMode) {
            document.documentElement.classList.add('dark-theme');
        }
    })
}

/**
 * @description Formats the given ISO 8601 duration to a more readable format.
 * @returns {string} Absolute duration (no leading '-')
 * */
export function formatIso8601Duration(duration) {
    const {getMessage} = chrome.i18n;
    /** @author for regex https://stackoverflow.com/users/2294168/ser */
    const regex = /(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?(?:T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?)?/i;
    let [years, months, weeks, days, hours, minutes, seconds] = duration.match(regex)
        .slice(2)
        .map(entry => !entry ? 0 : +entry);

    if (seconds > 59) {
        const originalSeconds = seconds;
        seconds %= 60;
        minutes += ((originalSeconds - seconds) / 60);
    }

    if (minutes > 59) {
        const originalMinutes = minutes;
        minutes %= 60;
        hours += ((originalMinutes - minutes) / 60);
    }

    if (hours > 23) {
        const originalHours = hours;
        hours %= 24;
        days += ((originalHours - hours) / 24);
    }

    if (days > 6) {
        const originalDays = days;
        days %= 7;
        weeks += ((originalDays - days) / 7);
    }

    if (weeks > 3) {
        const originalWeeks = weeks;
        weeks %= 4;
        months += ((originalWeeks - weeks) / 4);
    }

    if (months > 11) {
        const originalMonths = months;
        months %= 12;
        years += ((originalMonths - months) / 12);
    }

    const translation = {
        years: getMessage((years) === 1 ? 'year' : 'years'),
        months: getMessage((months) === 1 ? 'month' : 'months'),
        weeks: getMessage((weeks) === 1 ? 'week' : 'weeks'),
        days: getMessage((days) === 1 ? 'day' : 'days'),
        hours: getMessage((hours) === 1 ? 'hour' : 'hours'),
        minutes: getMessage((minutes) === 1 ? 'minute' : 'minutes'),
        seconds: getMessage((seconds) === 1 ? 'second' : 'seconds'),
    };

    return `
        ${years !== 0 ? ` ${years} ${translation.years},` : ''}
        ${months !== 0 ? ` ${months} ${translation.months},` : ''}
        ${weeks !== 0 ? ` ${weeks} ${translation.weeks},` : ''}
        ${days !== 0 ? ` ${days} ${translation.days},` : ''}
        ${hours !== 0 ? ` ${hours} ${translation.hours},` : ''}
        ${minutes !== 0 ? ` ${minutes} ${translation.minutes},` : ''}
        ${seconds !== 0 ? ` ${seconds} ${translation.seconds},` : ''}
    `.trim().replace(/,+$/g, '');
}
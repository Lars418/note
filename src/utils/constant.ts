export const constant = {
    //URL_REGEX: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi,
    URL_REGEX: /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*))/gi,
    EMAIL_REGEX: /(\S+@\S+\.\S+)/gi,
    LINEBREAK_REGEX: /(\n)/gi,
    PREVIEW_BASE_URL: 'http://localhost:3000' // 'https://api.l4j.de',
};

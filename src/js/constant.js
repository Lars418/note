export const constant = {
    URL_REGEX: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    EMAIL_REGEX: /\S+@\S+\.\S+/gi,
    CODE_REGEX: /`.+?`/gi,
    OGP_URL: 'https://api.l4j.de/preview',
    DEFAULT_TIMEOUT_IN_MS: 5000,
    DELETION_TIMEOUT_IN_MS: 2000,
};
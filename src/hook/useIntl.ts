function useIntl() {
    return {
        formatMessage: (id: string, values?: { [key: string]: string }) => {
            if (!id) {
                throw new Error(`Message '${id}' not found!`);
            }

            return chrome.i18n.getMessage(id, values ? Object.values(values) : undefined);
        }
    };
}

export default useIntl;
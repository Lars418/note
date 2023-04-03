import React from 'react';
import useIntl from '@src/hook/useIntl';

interface IFormattedMessage {
    id: string;
    values?: {
        [key: string]: string;
    }
}

const FormattedMessage: React.FC<IFormattedMessage> = (props) => {
    const { id, values } = props;
    const intl = useIntl();

    return (
        <>
            {intl.formatMessage(id, values)}
        </>
    );
}

export default FormattedMessage;

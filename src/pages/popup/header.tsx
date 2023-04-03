import React from 'react';
import './header.min.css';
import FormattedMessage from '@src/component/formattedMessage';

const Header: React.FC = () => {
    return (
        <header>
            <FormattedMessage id="name" />
        </header>
    )
}

export default Header;

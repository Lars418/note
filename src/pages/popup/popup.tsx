import React, { useEffect } from 'react';
import Header from '@pages/popup/header';
import '../../css/colors.min.css';
import '../../css/reset.min.css';
import './popup.min.css';

const Popup = () => {
    useEffect(() => {
        const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (prefersDarkTheme) {
            document.documentElement.classList.add('dark-theme');
        }
    }, []);

  return (
    <>
        <Header />
    </>
  );
};

export default Popup;

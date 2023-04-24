import React, { useEffect } from 'react';
import Header from '@src/component/header';
import '../../css/colors.min.css';
import '../../css/reset.min.css';
import './popup.min.css';
import AddNote from "@src/component/addNote";

const Popup = () => {
    useEffect(() => {
        const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isStandalone = new URL(window.location.href).searchParams.get('standalone') === '1';

        if (prefersDarkTheme) {
            document.documentElement.classList.add('dark-theme');
        }

        if (isStandalone) {
            document.documentElement.classList.add('standalone');
            document.title = '­';

            window.addEventListener('resize', async (event) => {
               const { settings } = await chrome.storage.local.get('settings');
               await chrome.storage.local.set({
                   settings: {
                       ...settings,
                       custom: {
                           ...settings.custom,
                           _standalone: {
                               width: (event.target as Window).outerWidth,
                               height: (event.target as Window).outerHeight,
                           }
                       }
                   }
               })
            });
        }
    }, []);

  return (
    <>
        <Header />

        <AddNote />
    </>
  );
};

export default Popup;

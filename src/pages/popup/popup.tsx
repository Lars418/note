import React, { useEffect } from 'react';
import Header from '@src/component/header';
import '../../css/colors.min.css';
import '../../css/reset.min.css';
import './popup.min.css';
import AddNote from "@src/component/addNote";

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

        <AddNote />
    </>
  );
};

export default Popup;

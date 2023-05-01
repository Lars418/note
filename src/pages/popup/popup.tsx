import React from 'react';
import Header from '@src/component/header';
import '../../css/colors.min.css';
import '../../css/reset.min.css';
import './popup.min.css';
import AddNote from "@src/component/addNote";
import NoteTabContainer from '@src/component/noteTab/noteTabContainer';

const Popup = () => {
  return (
    <>
        <Header />

        <AddNote />

        <NoteTabContainer />
    </>
  );
};

export default Popup;

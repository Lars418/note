import React, {useEffect, useState} from 'react';
import Header from '@src/component/header';
import '../../css/colors.min.css';
import '../../css/reset.min.css';
import './popup.min.css';
import AddNote from "@src/component/addNote";
import NoteTabPanel from "@src/component/noteTabPanel";
import NoteTab from "@src/component/noteTab";
import NoteTabs from "@src/component/noteTabs";
import NoteTabContainer from '@src/component/noteTabContainer';

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

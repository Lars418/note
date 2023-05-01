import React, {useEffect, useState} from 'react';
import Header from '@src/component/header';
import '../../css/colors.min.css';
import '../../css/reset.min.css';
import './popup.min.css';
import AddNote from "@src/component/addNote";
import NoteTabPanel from "@src/component/noteTab/noteTabPanel";
import NoteTab from "@src/component/noteTab/noteTab";
import NoteTabs from "@src/component/noteTab/noteTabs";
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

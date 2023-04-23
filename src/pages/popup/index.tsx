import React from "react";
import { createRoot } from "react-dom/client";
import "@pages/popup/index.min.css";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
import Popup from '@pages/popup/popup';

refreshOnUpdate("pages/popup");

function init() {
  const appContainer = document.querySelector("#root");

  const root = createRoot(appContainer);
  root.render(<Popup />);
}

init();

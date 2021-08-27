initNoteHighlights();

function initNoteHighlights() {
    const noteMarks = document.querySelectorAll(".note-ext-highlight");

    if(!noteMarks) {
        return;
    }

    const addNoteBtn = createNoteHighlightInteractionBtn();

    noteMarks.forEach(mark => {
        mark.addEventListener("mouseenter", () => {
            console.log(mark.getBoundingClientRect());
        });

        mark.addEventListener("mouseleave", () => {
            addNoteBtn.style.opacity = 0;
            setTimeout(() => addNoteBtn.style.visibility = "hidden", 200);
        });
    });
}

function createNoteHighlightInteractionBtn() {
    const btn = document.createElement("button");
    btn.classList.add("note-ext-highlight-btn");
    btn.textContent = chrome.i18n.getMessage("addMarkedNote");

    document.body.appendChild(btn);
    return btn;
}
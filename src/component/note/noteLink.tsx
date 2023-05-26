import React from 'react';
import {constant} from "@src/utils/constant";

interface IFormattedNoteLink {
    url: string;
}

const NoteLink: React.FC<IFormattedNoteLink> = (props) => {
    const { url } = props;
    const formattedUrl = url.replace(/https?:\/\//gi, '');
    const isEmail = url.match(constant.EMAIL_REGEX);

    const handleClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        event.stopPropagation();

        await chrome.tabs.create({
            url,
        });
    }

    return (
        <a
            href={isEmail ? `mailto:${url}` : url}
            className="note-link"
            target="_blank"
            onClick={isEmail ? undefined : handleClick}
        >
            {formattedUrl}
        </a>
    );
}

export default NoteLink;

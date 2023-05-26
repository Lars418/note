import React from 'react';
import {Author} from "@src/@types/interface/linkPreview/author";
import './linkPreviewAuthor.min.css';

interface ILinkPreviewAuthor {
    author: Author;
}

const LinkPreviewAuthor: React.FC<ILinkPreviewAuthor> = (props) => {
    const { author: { name, jobTitle, images } } = props;
    const title = jobTitle ? `${name} (${jobTitle})` : name;

    return (
        <div
            className="linkPreview-author"
            title={title}
        >
            {
                images.length === 0
                    ? name
                    : (
                    <img
                        src={images[0].url}
                        alt={images[0].alt}
                        draggable={false}
                    />
                )
            }
        </div>
    );
}

export default LinkPreviewAuthor;

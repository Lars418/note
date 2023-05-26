import React, {useContext, useEffect, useState} from 'react';
import NoteTabPanelContext from "@src/context/noteTabPanelContext";
import {PreviewArticle} from "@src/@types/interface/linkPreview/previewArticle";
import {PreviewQA} from "@src/@types/interface/linkPreview/PreviewQA";
import {PreviewBase} from "@src/@types/interface/linkPreview/previewBase";
import Query from "@src/utils/query";
import PreviewError from "@src/@types/interface/linkPreview/previewError";
import {LinkPreview} from "@src/@types/type/linkPreview/linkPreview";
import './linkPreviewCard.min.css';
import LinkPreviewAuthor from "@src/component/linkPreview/linkPreviewAuthor";
import utils from "@src/utils/utils";
import {Formatter} from "@src/utils/formatter";

interface ILinkPreview {
    url: string;
}

const LinkPreviewCard: React.FC<ILinkPreview> = (props) => {
    const { url } = props;
    const { previewData, setPreviewData } = useContext(NoteTabPanelContext);
    const [rawUrlPreview, setRawUrlPreview] = useState<PreviewError|PreviewBase|PreviewArticle|PreviewQA|undefined>();
    const urlPreview = rawUrlPreview as LinkPreview;

    useEffect(() => {
        (async () => {
            if (previewData?.[url]) {
                setRawUrlPreview(previewData[url]);
                return;
            }

            const linkPreview = await Query.getLinkPreview(url);

            setRawUrlPreview(linkPreview);
            setPreviewData(previewData => ({
                ...previewData,
                [url]: linkPreview
            }));
        })();
    }, []);

    if (!rawUrlPreview) {
        return (
            <a href={url}>Loading...</a>
        );
    }

    if (rawUrlPreview.type === 'error') {
        return (
            <a href={url} target="_blank">
                {url}
            </a>
        )
    }


    return (
        <a
            href={url}
            hrefLang={urlPreview.locale}
            target="_blank"
            className="linkPreview"
        >
            <article>
                {
                    urlPreview.previewImages.length > 0 && (
                        <img
                            className="linkPreview-previewImage"
                            src={urlPreview.previewImages[0].url}
                            alt={urlPreview.previewImages[0].alt}
                            draggable={false}
                        />
                    )
                }

                <div className={urlPreview.previewImages.length > 0 ? 'move-up' : undefined}>
                    {
                        urlPreview.type === 'article' && (urlPreview as PreviewArticle).author.length > 0 && (
                            <ol className="linkPreview-author-list">
                                {
                                    (urlPreview as PreviewArticle).author.map(author => (
                                        <LinkPreviewAuthor
                                            key={author.name + author.jobTitle}
                                            author={author}
                                        />
                                    ))
                                }
                            </ol>
                        )
                    }

                    <h2>
                        {urlPreview.title}
                    </h2>

                    <p>
                        {urlPreview.description}
                    </p>

                    <small>
                        <span>
                            {urlPreview.pageName}
                        </span>
                        {' '}
                        <time dateTime={urlPreview.publicationDate}>
                            {urlPreview.publicationDate}
                        </time>
                    </small>
                </div>
            </article>
        </a>
    )
}

export default LinkPreviewCard;

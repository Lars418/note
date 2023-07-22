import React, {useEffect, useState} from 'react';
import {PreviewProduct} from "@src/@types/interface/linkPreview/previewProduct";
import './linkPreviewCardProduct.scss';
import {Formatter} from "@src/utils/formatter";
import useIntl from '@src/hook/useIntl';

interface ILinkPreviewCardProduct {
    url: string;
    urlPreview: PreviewProduct;
}

const LinkPreviewCardProduct: React.FC<ILinkPreviewCardProduct> = (props) => {
    const { url, urlPreview } = props;
    const intl = useIntl();
    const [formattedPrice, setFormattedPrice] = useState<string>('');
    const formattedCondition = urlPreview.product.availability ? intl.formatMessage(`linkPreview_ItemAvailability_${urlPreview.product.availability}`) : undefined;
    const formattedOffers = (() => {
        if (!urlPreview.product.offerCount) {
            return;
        }

        if (urlPreview.product.offerCount === 1) {
            return intl.formatMessage('linkPreview_offerCountOne');
        }

        return intl.formatMessage('linkPreview_offerCount', {
            offer_count: urlPreview.product.offerCount.toString()
        });
    })();
    const previewImages = (() => {
        if (urlPreview.product.previewImages?.length > 0 ) {
            return urlPreview.product.previewImages.slice(0, 2);
        }

        if (urlPreview.previewImages?.length > 0) {
            return urlPreview.previewImages.slice(0, 2);
        }

        return [];
    })();
    const metaData = [formattedPrice, formattedCondition, formattedOffers].filter(x => x);

    useEffect(() => {
        (async () => {
            const price = urlPreview?.product?.price;

            if (!price?.currency) {
                setFormattedPrice('');
                return;
            }

            if (price?.low === price?.high || price?.low) {
                const formattedPrice = await Formatter.formatCurrency(urlPreview.product.price?.low, urlPreview.product.price.currency);
                setFormattedPrice(formattedPrice);
            } else if (price?.low !== null && price?.low !== undefined && price?.high !== null && price?.high !== undefined) {
                const formattedLowPrice = await Formatter.formatCurrency(urlPreview.product.price.low, urlPreview.product.price.currency);
                const formattedHighPrice = await Formatter.formatCurrency(urlPreview.product.price.high, urlPreview.product.price.currency);

                setFormattedPrice(`${formattedLowPrice} - ${formattedHighPrice}`);
            } else {
                setFormattedPrice('');
            }
        })()
    }, [urlPreview.product?.price]);

    return (
        <a
            href={url}
            hrefLang={urlPreview.locale}
            target="_blank"
            className="linkPreview linkPreviewCardProduct"
        >
            <article>
                <div className="product-content-wrapper">
                    {
                        previewImages.length > 0 && previewImages.map(previewImage => (
                            <img
                                className="product-image"
                                src={previewImage.url}
                                alt={previewImage.alt}
                            />
                        ))
                    }
                </div>

                <div
                    className="linkPreview-textContent"
                >
                    <p className="linkPreview-pageName">
                        {urlPreview.pageName}
                    </p>

                    <h2>
                        <span>{urlPreview.product.name || urlPreview.title}</span>
                    </h2>

                    {
                        metaData.length > 0 && (
                            <ul className="product-meta">
                                {
                                    metaData.map((entry, index) => (
                                        <React.Fragment key={entry}>
                                            <li>
                                                {entry}
                                            </li>

                                            {
                                                index !== (metaData.length - 1) && (
                                                    <li className="product-meta-separator">
                                                        &bull;
                                                    </li>
                                                )
                                            }
                                        </React.Fragment>

                                    ))
                                }
                            </ul>
                        )
                    }

                    <p className="linkPreview-description">
                        {urlPreview.product.description || urlPreview.description}
                    </p>
                </div>
            </article>
        </a>
    );
};

export default LinkPreviewCardProduct;

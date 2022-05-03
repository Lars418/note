import {formatDateTime, formatIso8601Duration, formatNumber, formatShortDate, createId} from "./util.js";
const { i18n: { getMessage, getUILanguage } } = chrome;

export class Preview {
    /**
     * @description Creates a preview card
     * @param url {string} Preview url
     * @param previewData {object} Preview data
     * @param isStandalone {boolean} Standalone (in a new window)
     * */
    static async renderCard(url, previewData, isStandalone) {
        const card = this._getRenderedFields(previewData);
        const meta1 = this._formatMetaColumn([ card.pageName, card.author ]);
        const meta2 = this._formatMetaColumn([
            card.modificationDate || card.publicationDate,
            card.duration,
            card.category,
            card.commentCount,
            card.trackCount,
            card.albumCount,
            card.seasonCount,
        ]);
        const media = card.videoUrl || card.previewImage || '';
        const standalone = isStandalone ? '' : `title="${url.replace(/https?:\/\//i, '')}"`;

        if (previewData.type === 'spotify') {
            return `
                <div
                    data-type="spotify"
                    data-href="${url}"
                    class="spotify-preview-card"
                    ${card.lang}
                    ${standalone}
                >
                    ${previewData.audioUrl ? `
                        <audio src="${previewData.audioUrl}"></audio>
                    ` : ''}
                    <button
                        class="spotify-preview-card-image-wrapper"     
                        data-song="${previewData.title}"                                   
                    >
                        ${media}
                        <svg                              
                            class="spotify-play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(0, 0, 0, .2)" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="10 8 16 12 10 16 10 8"></polygon>
                        </svg>
                        
                        <svg class="spotify-pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(0, 0, 0, .2)" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="10" y1="15" x2="10" y2="9"></line>
                            <line x1="14" y1="15" x2="14" y2="9"></line>
                        </svg>
                    </button>
                    
                    <div class="spotify-preview-card-data">
                        ${card.title}
                        <div class="preview-card-metadata-column">
                            ${card.author}
                            ${card.duration}
                        </div>
                    </div>
                    
                    <a class="spotify-preview-card-new-tab" href="${url}" target="_blank">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
            `;
        }

        return `
            <a
                data-type="${card.type}"
                href="${url}"
                class="preview-card"
                ${card.lang}
                ${standalone}
            >
                ${media}
                ${media ? card.favicon : ''}
                <div class="preview-card-special-metadata">
                    ${card.paywall}
                    ${card.liveUpdate}
                    ${card.explicit}
                </div>
                <div class="preview-card-data">
                    <div class="preview-card-metadata">
                        ${meta1}
                        ${meta2}
                    </div>
                    ${card.title}
                    ${card.description}
                </div>
            </a>`;
    }

    static addAudioListener(url, wrapper) {
        const ref = Array.from(wrapper.querySelectorAll('a, .spotify-preview-card')).find(el =>
            el.getAttribute('href') === url
            || el.dataset.href === url
        );
        const audio = ref?.querySelector('audio');
        const button = ref?.querySelector('button.spotify-preview-card-image-wrapper');

        if (ref?.dataset?.type !== 'spotify' || !audio) {
            return;
        }

        button.title = getMessage('playMusicTitle', [ button.dataset.song ]);
        button.ondblclick = (event) => event.stopPropagation();
        button.onclick = async () => {
            if (audio.paused) {
                button.title = getMessage('pauseMusicTitle', [ button.dataset.song ]);
                await audio.play();
            } else {
                button.title = getMessage('playMusicTitle', [ button.dataset.song ]);
                audio.pause();
            }

            button.dataset.playing = (!audio.paused).toString();
        };
        audio.onended = () => {
            button.title = getMessage('playMusicTitle', [ button.dataset.song ]);
            button.dataset.playing = 'false';
        };
    }

    static _getRenderedFields(previewData) {
        const title = `
        <strong class="preview-card-title">
            ${previewData.title || getMessage('previewCardNoTitle') }
        </strong>`;
        const description = `
            <p class="preview-card-description">
                ${previewData.description ?? ''}
            </p>`;
        const pageName = `
            <strong class="preview-card-page-name">
                ${previewData.pageName}
            </strong>`;
        const favicon = previewData._favicon
            ? `<img
                    src="${previewData._favicon}"
                    aria-hidden="true"
                    draggable="false"
                    class="preview-card-favicon"
                />`
            : '';
        const lang = previewData.locale
            ? `hreflang="${previewData.locale}"`
            : '';
        const publicationDate = previewData.publicationDate
            ? `
            <time
                datetime="${previewData.publicationDate}"
                title="${getMessage('previewCardPublicationDate', [formatDateTime(previewData.publicationDate, getUILanguage())])}"
                class="preview-card-publication-date preview-card-metadata-container"
            >
                ${formatShortDate(previewData.publicationDate, getUILanguage())}
            </time>`
            : '';
        const modificationDate = previewData.modificationDate
            ? `
            <time
                datetime="${previewData.modificationDate}"
                title="${getMessage('previewCardModificationDate', [formatDateTime(previewData.modificationDate, getUILanguage())])}"
                class="preview-card-modification-date preview-card-metadata-container"
            >
                ${formatShortDate(previewData.modificationDate, getUILanguage())}
            </time>`
            : '';
        const author = previewData.author
            ? `
                <div
                    class="preview-card-author preview-card-metadata-container"
                    title="${getMessage('previewCardAuthor', [previewData.author])}"
                >
                    ${(previewData.author?.includes(',') || previewData.author?.includes('et al.'))
                        ? `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>`
                        : `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        `
                     }
               
                    <span>
                        ${previewData.author}
                    </span>
                </div>`
            : '';
        const category = previewData.category
            ? `
            <div
                title="${getMessage('previewCardCategory', [previewData.category])}"
                class="preview-card-category preview-card-metadata-container"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span>
                    ${previewData.category}
                </span>
            </div>`
            : '';
        const paywall = previewData.isPaid
            ? `
            <div
                class="preview-card-paywall"
                title="${getMessage('previewCardPaywall')}"
                >
                <div class="preview-card-paywall-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
            </div>`
            : '';
        const commentCount = previewData.commentCount
            ? `
            <div
                class="preview-card-comment-count preview-card-metadata-container"
                title="${getMessage('previewCardCommentCount', [formatNumber(previewData.commentCount, getUILanguage())])}"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>
                    ${formatNumber(previewData.commentCount, getUILanguage())}
                </span>
            </div>`
            : '';
        const wordCount = previewData.wordCount
            ? `
                <div
                    class="preview-card-word-count"
                    title="${getMessage('previewCardWordCount', [formatNumber(previewData.wordCount, getUILanguage())])}"
                >
                        <span>
                            ${formatNumber(previewData.wordCount, getUILanguage())}
                        </span>
                </div>`
            : '';
        const duration = previewData.duration
            ? `
            <div class="preview-card-duration preview-card-metadata-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>
                    ${formatIso8601Duration(previewData.duration)}
                </span>
            </div>`
            : '';
        const rating = previewData.rating
            ? `
            <span class="preview-card-rating">
                ${previewData.rating.value}/${previewData.rating.max}
            </span>`
            : '';
        const liveUpdate = previewData.isLive
            ? `
            <div
                class="preview-card-live-update"
                title="${
                    previewData.liveUpdateCount
                    ? getMessage('previewCardIsLiveCountTitle', [formatNumber(previewData.liveUpdateCount, getUILanguage())])
                    : getMessage('previewCardIsLiveTitle')
                }"
            >                
                ${getMessage('previewCardIsLive')}               
            </div>`
            : '';
        const trackCount = previewData.trackCount
            ? `
            <div
                class="preview-card-track-count preview-card-metadata-container"
                title="${getMessage('previewCardTrackCount', [formatNumber(previewData.trackCount, getUILanguage())])}"
            >
                <span>
                    ${formatNumber(previewData.trackCount, getUILanguage())}
                </span>
            </div>`
            : '';
        const albumCount = previewData.albumCount
            ? `
            <div
                class="preview-card-album-count preview-card-metadata-container"
                title="${getMessage('previewCardAlbumCount', [formatNumber(previewData.albumCount, getUILanguage())])}"
            >
                <span>
                    ${formatNumber(previewData.albumCount, getUILanguage())}
                </span>
            </div>`
            : '';
        const seasonCount = previewData.seasonCount
            ? `
            <div
                class="preview-card-season-count preview-card-metadata-container"
                title="${getMessage('previewCardSeasonCount', [formatNumber(previewData.seasonCount, getUILanguage())])}"
            >
                <span>
                    ${formatNumber(previewData.seasonCount, getUILanguage())}
                </span>
            </div>`
            : '';
        const videoUrl = (previewData.videoUrl || previewData.trailer)
            ? `
            <video
                src="${previewData.videoUrl || previewData.trailer}"
                controls="controls"
                class="preview-card-banner"
            ></video>`
            : '';
        const contentRating = previewData.contentRating
            ? `
            <span class="preview-card-content-rating">
                ${previewData.contentRating}
            </span>`
            : '';
        const resolution = previewData.resolution
            ? `
            <span class="preview-card-resolution">
                ${previewData.resolution}
            </span>`
            : '';
        const explicit = previewData.explicit
            ? `
            <span class="preview-card-explicit" title="Explicit">
                E
            </span>
            `
            : '';

        let previewImage = '';

        if (previewData.previewImages) {
            const _img = previewData.previewImages[0];
            previewImage = `
                <img
                    class="preview-card-banner"
                    src="${_img.url}"
                    ${_img.alt ? `alt="${_img.alt}"` : ''}
                />
            `;
        }

        return {
            title,
            description,
            pageName,
            favicon,
            previewImage,
            publicationDate,
            modificationDate,
            author,
            category,
            paywall,
            commentCount,
            wordCount,
            duration,
            rating,
            liveUpdate,
            trackCount,
            albumCount,
            seasonCount,
            videoUrl,
            contentRating,
            resolution,
            explicit,
            lang
        };
    }

    /**
     * @param entries {string[]}
     * */
    static _formatMetaColumn(entries) {
        const separator = '<span class="preview-card-metadata-separator">•</span>';

        return `
        <div class="preview-card-metadata-column">
            ${entries.filter(entry => !!entry).join(separator)}
        </div>`;
    }
}
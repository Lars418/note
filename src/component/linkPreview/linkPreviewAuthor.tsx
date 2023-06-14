import React from 'react';
import {Author} from "@src/@types/interface/linkPreview/author";
import './linkPreviewAuthor.min.css';
// @ts-ignore
import { ReactComponent as Silhouette } from '@assets/img/silhouette.svg';
import useIntl from "@src/hook/useIntl";
import Tooltip from "@src/component/tooltip";
import FormattedMessage from '@src/component/formattedMessage';

interface ILinkPreviewAuthor {
    author: Author;
    onTooltipEnter?(): void;
    onTooltipLeave?(): void;
}

const LinkPreviewAuthor: React.FC<ILinkPreviewAuthor> = (props) => {
    const { author: { name, jobTitle, images, url }, onTooltipEnter, onTooltipLeave } = props;
    const title = jobTitle ? `${name} (${jobTitle})` : name;
    const intl = useIntl();
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    const WrapperComponent = url ? 'a' : 'div';

    return (
        <Tooltip
            onTooltipEnter={onTooltipEnter}
            onTooltipLeave={onTooltipLeave}
            arrow
            title={(
                <>
                    <span className="linkPreviewAuthor-tooltip-title">{name}</span>
                    {jobTitle && (
                        <span className="linkPreviewAuthor-tooltip-subtitle">
                            {jobTitle}
                        </span>
                    )}
                    {
                        url && (
                            <span className="linkPreviewAuthor-tooltip-linkHint">
                                <FormattedMessage id="linkPreviewAuthorUrlHint" />
                            </span>
                        )
                    }
                </>
            )}
        >
            <WrapperComponent
                className="linkPreview-author"
                href={url ? url : undefined}
                target={url ? '_blank' : undefined}
            >
                {
                    !images?.length ? (
                        <svg
                            role="img"
                            aria-label={intl.formatMessage('previewCardAuthorSilhouetteAlt')}
                            version="1.0" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1529.000000 1533.000000"
                            preserveAspectRatio="xMidYMid meet">
                            <g
                                transform="translate(0.000000,1533.000000) scale(0.100000,-0.100000)"
                                fill="var(--text-translucent)"
                                stroke="none"
                            >
                                <path d="M7400 14726 c-3 -3 -96 -10 -205 -16 -110 -6 -238 -15 -284 -21 -191
-23 -452 -98 -711 -206 -103 -43 -460 -254 -575 -341 -92 -69 -364 -348 -471
-482 -37 -47 -90 -110 -119 -140 -95 -100 -167 -232 -239 -437 -50 -144 -58
-222 -41 -363 8 -63 24 -217 35 -341 20 -230 24 -254 86 -604 l36 -200 -18
-115 c-28 -174 -25 -465 9 -720 47 -353 112 -525 285 -755 85 -112 137 -148
226 -153 33 -2 80 1 102 6 73 16 82 4 119 -163 36 -158 153 -515 204 -618 23
-47 84 -138 142 -212 119 -152 143 -199 169 -332 10 -54 35 -162 54 -240 49
-192 49 -195 -24 -243 -19 -13 -73 -56 -120 -95 -47 -40 -104 -84 -126 -98
-59 -37 -348 -197 -579 -322 -107 -58 -241 -133 -298 -168 -56 -35 -174 -103
-262 -152 -278 -154 -607 -345 -676 -393 -37 -26 -169 -137 -294 -246 -258
-226 -278 -250 -380 -476 -34 -74 -102 -218 -150 -320 -184 -391 -207 -472
-330 -1160 -72 -405 -89 -474 -180 -725 -43 -119 -71 -228 -80 -310 -4 -33
-22 -121 -41 -195 -19 -74 -48 -200 -65 -279 -25 -119 -40 -166 -93 -280 -35
-75 -76 -165 -92 -201 -16 -36 -44 -84 -61 -108 -32 -40 -33 -46 -33 -131 l0
-88 113 -58 c225 -115 315 -168 326 -192 14 -30 14 -170 1 -286 -6 -48 -19
-205 -30 -350 -22 -301 -34 -393 -95 -752 -54 -317 -95 -579 -95 -611 l0 -24
830 0 830 0 0 48 c0 61 26 284 44 390 39 214 110 400 167 431 34 19 75 7 92
-27 33 -64 57 -233 58 -400 1 -93 -22 -354 -36 -419 l-5 -23 5061 0 5061 0 -6
28 c-10 50 -128 878 -163 1148 -5 40 -3 44 61 113 36 40 66 81 66 92 0 11 -15
79 -34 152 -39 150 -77 374 -101 587 -9 80 -26 201 -40 270 -13 69 -26 170
-30 225 -7 107 -90 628 -125 785 -11 52 -47 203 -80 335 -32 132 -82 353 -110
490 -90 440 -244 1015 -376 1400 -129 379 -226 626 -274 703 -8 13 -98 95
-200 181 -102 87 -248 225 -325 306 -250 264 -282 285 -1170 745 -220 114
-581 298 -803 410 -221 111 -463 240 -538 286 -149 93 -178 107 -277 135 -90
26 -168 66 -256 132 -72 54 -73 55 -164 62 -99 7 -147 24 -224 76 -87 59 -205
163 -264 232 -64 77 -81 124 -119 340 l-21 117 25 178 c14 97 30 220 36 272 6
52 16 127 22 167 11 75 18 83 75 83 97 0 185 54 227 139 24 47 103 375 130
536 55 331 55 676 0 910 -25 107 -26 120 -29 495 -3 403 -11 517 -45 616 -38
108 -59 217 -75 384 -15 157 -17 169 -54 245 -43 86 -146 245 -219 335 -73 91
-322 338 -407 405 -44 35 -125 91 -179 125 -55 35 -133 89 -174 122 -64 51
-298 196 -387 240 -16 9 -60 18 -96 21 -36 3 -147 25 -245 47 -183 43 -265 56
-274 46z"/>
                            </g
                            >
                        </svg>
                    ) : (
                        <img
                            src={images[0].url}
                            alt={images[0].alt}
                            draggable={false}
                        />
                    )
                }
            </WrapperComponent>
        </Tooltip>
    );
}

export default LinkPreviewAuthor;

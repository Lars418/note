import { Author } from '@src/@types/interface/linkPreview/author';
import { Image } from '@src/@types/interface/linkPreview/image';
import {PreviewBase} from "@src/@types/interface/linkPreview/previewBase";

export interface PreviewArticle extends PreviewBase {
    type: 'article';
    article: {
        author: Author[];
        category?: string;
        isPaid: boolean;
        isLive?: boolean;
        liveUpdateCount?: number;
    };
}
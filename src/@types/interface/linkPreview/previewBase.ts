import {Image} from "@src/@types/interface/linkPreview/image";

export interface PreviewBase {
    type: string;
    page: string;
    pageName: string;
    title: string;
    description: string;
    previewImages: Image[];
    publicationDate: string;
    modificationDate?: string;
    audioUrl?: string;
    locale: string;
    favicon?: string;
    themeColor?: string;
    exp: string;
}
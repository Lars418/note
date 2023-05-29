import { Image } from '@src/@types/interface/linkPreview/image';

export interface Author {
    name: string;
    jobTitle?: string;
    images: Image[];
    url?: string;
}
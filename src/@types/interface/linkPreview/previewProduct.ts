import { Author } from '@src/@types/interface/linkPreview/author';
import { Image } from '@src/@types/interface/linkPreview/image';
import {PreviewBase} from "@src/@types/interface/linkPreview/previewBase";

export interface PreviewProduct extends PreviewBase {
    type: 'product';
    product: {
        name: string;
        description: string;
        offerCount?: number;
        availability?: string;
        brand?: string;
        previewImages: Image[];
        price: {
            currency?: string;
            high: number;
            low: number;
        };
        rating?: {
            count?: number;
            min?: number;
            max?: number;
            value?: number;
        }
    }
}
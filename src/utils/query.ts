import {constant} from "@src/utils/constant";
import {PreviewBase} from "@src/@types/interface/linkPreview/previewBase";
import {PreviewArticle} from "@src/@types/interface/linkPreview/previewArticle";
import {PreviewQA} from "@src/@types/interface/linkPreview/PreviewQA";
import PreviewError from "@src/@types/interface/linkPreview/previewError";

export default class Query {
    static async getLinkPreview(url: string): Promise<PreviewBase|PreviewArticle|PreviewQA|PreviewError> {
        const result = await fetch(`${constant.PREVIEW_BASE_URL}/preview?url=${encodeURIComponent(url)}`);
        const response: PreviewBase|PreviewError = await result.json();

        if ('error' in response) {
            return {
                type: 'error',
                ...response,
                retryCount: 0
            };
        }

        switch (response.type) {
            case 'article':
                return response as PreviewArticle;
            case 'qaPage':
                return response as PreviewQA;
            default:
                return response;
        }
    }
}
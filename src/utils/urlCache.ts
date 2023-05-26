import {PreviewDataContainer} from "@src/@types/interface/linkPreview/previewDataContainer";
import {LinkPreview} from "@src/@types/type/linkPreview/linkPreview";
import PreviewError from "@src/@types/interface/linkPreview/previewError";

export default class UrlCache {
    static getComplete = async (): Promise<PreviewDataContainer> => {
        return (await chrome.storage.local.get('urlCache')).urlCache;
    };
    static get = async (url: string): Promise<LinkPreview|PreviewError> => {
        const urlCache = await this.getComplete();

        return urlCache[url];
    };
    static setOrUpdate = async (url: string, linkPreview: LinkPreview|PreviewError): Promise<void> => {
        const urlCache = await this.getComplete();

        urlCache[url] = linkPreview;
        await chrome.storage.local.set({ urlCache });
    };
    static setOrUpdateComplete = async (previewDataContainer: PreviewDataContainer): Promise<void> => {
        await chrome.storage.local.set({ urlCache: previewDataContainer });
    };
}
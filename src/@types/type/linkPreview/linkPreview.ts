import {PreviewArticle} from "@src/@types/interface/linkPreview/previewArticle";
import {PreviewQA} from "@src/@types/interface/linkPreview/PreviewQA";
import {PreviewBase} from "@src/@types/interface/linkPreview/previewBase";

export type LinkPreview =
    PreviewBase
    | PreviewArticle
    | PreviewQA;

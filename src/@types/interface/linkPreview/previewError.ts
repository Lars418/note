export default interface PreviewError {
    type: 'error';
    error: string;
    retryCount: number;
}
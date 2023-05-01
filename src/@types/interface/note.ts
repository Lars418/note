export interface Note {
    id: string;
    value: string;
    origin?: string;
    createdAt: string;
    modifiedAt?: string;
    completedAt?: string;
    dueAt?: string;
    category?: string;
}
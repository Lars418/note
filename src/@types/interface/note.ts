export interface BlankNote {
    value: string;
    origin?: string;
    completedAt?: string;
    dueAt?: string;
    category?: string;
}

export interface Note extends BlankNote {
    id: string;
    createdAt: string;
    modifiedAt?: string;
}
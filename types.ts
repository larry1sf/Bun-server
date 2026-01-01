export type cerebrasMessage =
    | {
        role: "system";
        content: string;
    }
    | {
        role: "user";
        content: string;
    }
    | {
        role: "assistant";
        content?: string;
    };

export type cerebrasChunk = {
    delta?: {
        content?: string
    }
}[]

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface AIService {
    name: string;
    chat: (messages: ChatMessage[]) => Promise<AsyncGenerator<string, void, unknown>>;
}


export interface User {
    id: number;
    email: string;
    password: string;
    date: string;
}
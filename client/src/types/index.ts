// Shared data shapes for user, project, and chat content.
export interface User {
    id: string;
    email: string;
    fullName?: string;
    imageUrl?: string;
    name?: string;
    image?: string;
}

// Single chat message in the project conversation.
export interface Message {
    id: string;
    role: any;
    content: string;
    timestamp: string;
}

// Stored code snapshot for a project version.
export interface Version {
    id: string;
    timestamp: string;
    code: string;
}

// Main project model used throughout the UI.
export interface Project {
    id: string;
    name: string;
    initial_prompt: string;
    current_code: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user?: User;
    isPublished?: boolean;
    versionId?: string;
    conversation: Message[];
    versions: Version[];
    current_version_index: string;
}

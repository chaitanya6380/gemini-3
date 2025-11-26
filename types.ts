export enum MessageRole {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export enum ContentType {
  Text = 'text',
  Image = 'image',
  Video = 'video'
}

export enum AppMode {
  Chat = 'chat', // gemini-flash-lite-latest (Fast) or gemini-3-pro-preview (Analysis)
  ImageGen = 'image-gen', // gemini-3-pro-image-preview
  ImageEdit = 'image-edit', // gemini-2.5-flash-image
  VideoGen = 'video-gen' // veo-3.1-fast-generate-preview
}

export interface Attachment {
  base64: string;
  mimeType: string;
}

export interface MessageContent {
  type: ContentType;
  text?: string;
  mediaUrl?: string; // For displayed images/videos
  attachment?: Attachment; // For user uploads
}

export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent[];
  timestamp: number;
  isLoading?: boolean;
}

export interface GenerationSettings {
  aspectRatio: string;
  imageSize: string; // 1K, 2K, 4K
  videoResolution: string; // 720p, 1080p
}

// Window interface extension for AI Studio key selection
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}
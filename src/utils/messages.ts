// Message types for communication between components
export type MessageType = 
  | 'GET_PAGE_MARKDOWN'
  | 'GET_SELECTION_MARKDOWN'
  | 'CHECK_SELECTION'
  | 'CONVERT_CONTEXT_SELECTION';

export interface Message {
  type: MessageType;
  data?: Record<string, unknown>;
}

export interface MarkdownResponse {
  success: boolean;
  markdown?: string;
  error?: string;
  hasSelection?: boolean;
  title?: string;
  url?: string;
}

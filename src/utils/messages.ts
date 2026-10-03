// Message types for communication between components
export type MessageType = 
  | 'GET_PAGE_MARKDOWN'
  | 'GET_SELECTION_MARKDOWN'
  | 'CHECK_SELECTION'
  | 'CONVERT_CONTEXT_SELECTION'
  | 'COPY_PAGE_AS_MARKDOWN';

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

const messageTypes: readonly string[] = [
  'GET_PAGE_MARKDOWN', 'GET_SELECTION_MARKDOWN', 'CHECK_SELECTION',
  'CONVERT_CONTEXT_SELECTION', 'COPY_PAGE_AS_MARKDOWN'
];

export function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const message = value as Record<string, unknown>;
  return typeof message.type === 'string' && messageTypes.includes(message.type) &&
    (message.data === undefined || (message.data !== null && typeof message.data === 'object' && !Array.isArray(message.data)));
}

export function isMarkdownResponse(value: unknown): value is MarkdownResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const response = value as Record<string, unknown>;
  return typeof response.success === 'boolean' &&
    ['markdown', 'error', 'title', 'url'].every(key => response[key] === undefined || typeof response[key] === 'string') &&
    (response.hasSelection === undefined || typeof response.hasSelection === 'boolean');
}

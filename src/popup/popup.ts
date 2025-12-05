import { Message, MarkdownResponse } from '../utils/messages';
import { showStatus, getElement } from '../utils/ui';

// DOM elements with null checks
const copyPageBtn = getElement<HTMLButtonElement>('copyPage', HTMLButtonElement);
const copySelectionBtn = getElement<HTMLButtonElement>('copySelection', HTMLButtonElement);
const savePageBtn = getElement<HTMLButtonElement>('savePage', HTMLButtonElement);
const saveSelectionBtn = getElement<HTMLButtonElement>('saveSelection', HTMLButtonElement);
const openOptionsLink = getElement<HTMLAnchorElement>('openOptions', HTMLAnchorElement);
const statusDiv = getElement<HTMLDivElement>('status', HTMLDivElement);

// Exit early if critical elements are missing
if (!copyPageBtn || !copySelectionBtn || !savePageBtn || !saveSelectionBtn || !statusDiv) {
  console.error('Content to Markdown: Required popup elements not found');
  throw new Error('Required popup elements not found');
}

// Store non-null references after validation
const elements = {
  copyPageBtn,
  copySelectionBtn,
  savePageBtn,
  saveSelectionBtn,
  statusDiv
} as const;

// Local reference to status element for helper function
function displayStatus(message: string, isError = false): void {
  showStatus(elements.statusDiv, message, isError);
}

// Ensure content script is loaded before sending messages
async function ensureContentScriptLoaded(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch {
    // Script already loaded or page doesn't support injection (chrome://, etc.)
  }
}

// Send message to content script
async function sendToContentScript(message: Message): Promise<MarkdownResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error('No active tab found');
  }

  // Ensure content script is injected before sending message
  await ensureContentScriptLoaded(tab.id);

  return chrome.tabs.sendMessage(tab.id, message);
}

// Copy text to clipboard with error handling
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('Clipboard access denied:', error);
    return false;
  }
}

// Download text as file (with memory leak fix)
function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, () => {
    // Revoke the blob URL after download starts to prevent memory leak
    URL.revokeObjectURL(url);
  });
}

// Generate filename from title
function generateFilename(title: string): string {
  const sanitized = title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);

  return `${sanitized || 'page'}.md`;
}

// Generic handler for markdown operations
async function handleMarkdownAction(
  button: HTMLButtonElement,
  messageType: Message['type'],
  onSuccess: (response: MarkdownResponse) => Promise<void> | void,
  errorMessage: string
): Promise<void> {
  try {
    button.disabled = true;
    const response = await sendToContentScript({ type: messageType });

    if (response.success && response.markdown) {
      await onSuccess(response);
    } else {
      displayStatus(response.error || errorMessage, true);
    }
  } catch (error) {
    console.warn(`Action ${messageType} failed:`, error);
    displayStatus(errorMessage, true);
  } finally {
    button.disabled = false;
  }
}

// Check for selection on page load
async function checkSelection(): Promise<void> {
  try {
    const response = await sendToContentScript({ type: 'CHECK_SELECTION' });

    if (response.success && response.hasSelection) {
      elements.copySelectionBtn.disabled = false;
      elements.saveSelectionBtn.disabled = false;
    }
  } catch (error) {
    // Content script might not be loaded on some pages (e.g., chrome:// URLs)
    console.warn('Could not check selection:', error);
  }
}

// Copy page as markdown
elements.copyPageBtn.addEventListener('click', () => {
  handleMarkdownAction(
    elements.copyPageBtn,
    'GET_PAGE_MARKDOWN',
    async (response) => {
      const copied = await copyToClipboard(response.markdown!);
      if (copied) {
        displayStatus('Page copied as Markdown!');
      } else {
        displayStatus('Failed to copy to clipboard', true);
      }
    },
    'Error: Could not access page content'
  );
});

// Copy selection as markdown
elements.copySelectionBtn.addEventListener('click', () => {
  handleMarkdownAction(
    elements.copySelectionBtn,
    'GET_SELECTION_MARKDOWN',
    async (response) => {
      const copied = await copyToClipboard(response.markdown!);
      if (copied) {
        displayStatus('Selection copied as Markdown!');
      } else {
        displayStatus('Failed to copy to clipboard', true);
      }
    },
    'Error: Could not access selection'
  );
});

// Save page as file
elements.savePageBtn.addEventListener('click', () => {
  handleMarkdownAction(
    elements.savePageBtn,
    'GET_PAGE_MARKDOWN',
    (response) => {
      const filename = generateFilename(response.title || 'page');
      downloadAsFile(response.markdown!, filename);
      displayStatus('Saving file...');
    },
    'Error: Could not access page content'
  );
});

// Save selection as file
elements.saveSelectionBtn.addEventListener('click', () => {
  handleMarkdownAction(
    elements.saveSelectionBtn,
    'GET_SELECTION_MARKDOWN',
    (response) => {
      const filename = generateFilename(response.title || 'selection');
      downloadAsFile(response.markdown!, filename);
      displayStatus('Saving file...');
    },
    'Error: Could not access selection'
  );
});

// Open options page
openOptionsLink?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
checkSelection();

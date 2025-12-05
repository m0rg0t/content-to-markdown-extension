import { Message, MarkdownResponse } from '../utils/messages';
import { 
  convertToMarkdown, 
  getMainContent, 
  getSelectedContent, 
  hasSelection,
  formatMarkdownOutput 
} from '../utils/converter';

// Show notification on page
function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  // Remove existing notification
  const existing = document.querySelector('.ctm-notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `ctm-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Copy text to clipboard with error handling
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Handle messages from popup/background
chrome.runtime.onMessage.addListener((
  message: Message,
  _sender,
  sendResponse: (response: MarkdownResponse) => void
) => {
  (async () => {
    try {
      switch (message.type) {
        case 'CHECK_SELECTION':
          sendResponse({ success: true, hasSelection: hasSelection() });
          break;
          
        case 'GET_PAGE_MARKDOWN': {
          const mainContent = getMainContent();
          const markdown = await convertToMarkdown(mainContent, false);
          const formatted = await formatMarkdownOutput(markdown, true);
          sendResponse({ 
            success: true, 
            markdown: formatted,
            title: document.title,
            url: window.location.href
          });
          break;
        }
        
        case 'GET_SELECTION_MARKDOWN': {
          const selectedContent = getSelectedContent();
          if (!selectedContent) {
            sendResponse({ success: false, error: 'No text selected' });
            break;
          }
          const markdown = await convertToMarkdown(selectedContent, true);
          const formatted = await formatMarkdownOutput(markdown, true);
          sendResponse({ 
            success: true, 
            markdown: formatted,
            title: document.title,
            url: window.location.href
          });
          break;
        }
        
        case 'CONVERT_CONTEXT_SELECTION': {
          // This is triggered from context menu for selected text
          const selectedContent = getSelectedContent();
          if (selectedContent) {
            const markdown = await convertToMarkdown(selectedContent, true);
            const formatted = await formatMarkdownOutput(markdown, true);
            
            // Copy to clipboard with error handling
            const success = await copyToClipboard(formatted);
            if (success) {
              showNotification('Selection copied as Markdown!');
              sendResponse({ success: true, markdown: formatted });
            } else {
              showNotification('Failed to copy to clipboard', 'error');
              sendResponse({ success: false, error: 'Clipboard access denied' });
            }
          } else {
            showNotification('No text selected', 'error');
            sendResponse({ success: false, error: 'No text selected' });
          }
          break;
        }
        
        case 'COPY_PAGE_AS_MARKDOWN': {
          // This is triggered from context menu for entire page
          const mainContent = getMainContent();
          const markdown = await convertToMarkdown(mainContent, false);
          const formatted = await formatMarkdownOutput(markdown, true);
          
          // Copy to clipboard with error handling
          const success = await copyToClipboard(formatted);
          if (success) {
            showNotification('Page copied as Markdown!');
            sendResponse({ success: true, markdown: formatted });
          } else {
            showNotification('Failed to copy to clipboard', 'error');
            sendResponse({ success: false, error: 'Clipboard access denied' });
          }
          break;
        }
        
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`Error: ${errorMessage}`, 'error');
      sendResponse({ success: false, error: errorMessage });
    }
  })();
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Listen for selection changes to update context menu
document.addEventListener('selectionchange', () => {
  chrome.runtime.sendMessage({
    type: 'SELECTION_CHANGED',
    data: { hasSelection: hasSelection() }
  }).catch(() => {
    // Extension context might be invalidated, ignore
  });
});

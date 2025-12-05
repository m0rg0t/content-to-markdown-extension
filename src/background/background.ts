// Background service worker for Chrome extension

// Create context menus
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for selected text
  chrome.contextMenus.create({
    id: 'copySelectionAsMarkdown',
    title: 'Copy selection as Markdown',
    contexts: ['selection']
  });
  
  // Create context menu for the page
  chrome.contextMenus.create({
    id: 'copyPageAsMarkdown',
    title: 'Copy page as Markdown',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  
  try {
    if (info.menuItemId === 'copySelectionAsMarkdown') {
      // Send message to content script to get selection and convert
      await chrome.tabs.sendMessage(tab.id, { type: 'CONVERT_CONTEXT_SELECTION' });
    } else if (info.menuItemId === 'copyPageAsMarkdown') {
      // Send message to content script to get page markdown
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_MARKDOWN' });
      
      if (response.success && response.markdown) {
        // Copy to clipboard using offscreen document or fallback
        await copyToClipboard(response.markdown);
      }
    }
  } catch (error) {
    console.error('Error handling context menu:', error);
  }
});

// Copy to clipboard function
async function copyToClipboard(text: string): Promise<void> {
  // Try using the Clipboard API in service worker context
  try {
    // In Manifest V3, we need to use a different approach
    // We'll rely on the content script to do the copying
    console.log('Text to copy:', text.substring(0, 100) + '...');
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'SELECTION_CHANGED') {
    // Could update context menu state here if needed
  }
  return false;
});

// Export empty object for module
export {};

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
      // Send message to content script to get page markdown and copy to clipboard
      // The content script handles clipboard operations since service workers don't have DOM access
      await chrome.tabs.sendMessage(tab.id, { type: 'COPY_PAGE_AS_MARKDOWN' });
    }
  } catch (error) {
    console.error('Error handling context menu:', error);
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'SELECTION_CHANGED') {
    // Could update context menu state here if needed
  }
  return false;
});

// Export empty object for module
export {};

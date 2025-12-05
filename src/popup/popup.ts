import { Message, MarkdownResponse } from '../utils/messages';

// DOM elements
const copyPageBtn = document.getElementById('copyPage') as HTMLButtonElement;
const copySelectionBtn = document.getElementById('copySelection') as HTMLButtonElement;
const savePageBtn = document.getElementById('savePage') as HTMLButtonElement;
const saveSelectionBtn = document.getElementById('saveSelection') as HTMLButtonElement;
const openOptionsLink = document.getElementById('openOptions') as HTMLAnchorElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

// Show status message
function showStatus(message: string, isError = false): void {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isError ? 'error' : 'success'}`;
  
  // Hide after 3 seconds
  setTimeout(() => {
    statusDiv.className = 'status hidden';
  }, 3000);
}

// Send message to content script
async function sendToContentScript(message: Message): Promise<MarkdownResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab?.id) {
    throw new Error('No active tab found');
  }
  
  return chrome.tabs.sendMessage(tab.id, message);
}

// Copy text to clipboard
async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

// Download text as file
function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

// Generate filename from title
function generateFilename(title: string): string {
  // Sanitize the title for filename
  const sanitized = title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);
  
  return `${sanitized || 'page'}.md`;
}

// Check for selection on page load
async function checkSelection(): Promise<void> {
  try {
    const response = await sendToContentScript({ type: 'CHECK_SELECTION' });
    
    if (response.success && response.hasSelection) {
      copySelectionBtn.disabled = false;
      saveSelectionBtn.disabled = false;
    }
  } catch {
    // Content script might not be loaded on some pages
    console.log('Could not check selection');
  }
}

// Copy page as markdown
copyPageBtn.addEventListener('click', async () => {
  try {
    copyPageBtn.disabled = true;
    const response = await sendToContentScript({ type: 'GET_PAGE_MARKDOWN' });
    
    if (response.success && response.markdown) {
      await copyToClipboard(response.markdown);
      showStatus('Page copied as Markdown!');
    } else {
      showStatus(response.error || 'Failed to convert page', true);
    }
  } catch (error) {
    showStatus('Error: Could not access page content', true);
  } finally {
    copyPageBtn.disabled = false;
  }
});

// Copy selection as markdown
copySelectionBtn.addEventListener('click', async () => {
  try {
    copySelectionBtn.disabled = true;
    const response = await sendToContentScript({ type: 'GET_SELECTION_MARKDOWN' });
    
    if (response.success && response.markdown) {
      await copyToClipboard(response.markdown);
      showStatus('Selection copied as Markdown!');
    } else {
      showStatus(response.error || 'Failed to convert selection', true);
    }
  } catch (error) {
    showStatus('Error: Could not access selection', true);
  } finally {
    copySelectionBtn.disabled = false;
  }
});

// Save page as file
savePageBtn.addEventListener('click', async () => {
  try {
    savePageBtn.disabled = true;
    const response = await sendToContentScript({ type: 'GET_PAGE_MARKDOWN' });
    
    if (response.success && response.markdown) {
      const filename = generateFilename(response.title || 'page');
      downloadAsFile(response.markdown, filename);
      showStatus('Saving file...');
    } else {
      showStatus(response.error || 'Failed to convert page', true);
    }
  } catch (error) {
    showStatus('Error: Could not access page content', true);
  } finally {
    savePageBtn.disabled = false;
  }
});

// Save selection as file
saveSelectionBtn.addEventListener('click', async () => {
  try {
    saveSelectionBtn.disabled = true;
    const response = await sendToContentScript({ type: 'GET_SELECTION_MARKDOWN' });
    
    if (response.success && response.markdown) {
      const filename = generateFilename(response.title || 'selection');
      downloadAsFile(response.markdown, filename);
      showStatus('Saving file...');
    } else {
      showStatus(response.error || 'Failed to convert selection', true);
    }
  } catch (error) {
    showStatus('Error: Could not access selection', true);
  } finally {
    saveSelectionBtn.disabled = false;
  }
});

// Open options page
openOptionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
checkSelection();

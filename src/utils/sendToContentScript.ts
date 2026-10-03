import { Message, MarkdownResponse, isMarkdownResponse } from './messages';

export async function sendToContentScript(message: Message): Promise<MarkdownResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) throw new Error('No active tab found');
  let response: unknown;
  try {
    // Existing content scripts must not be injected again on every popup action.
    response = await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      response = await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      throw new Error('Could not access this page. Open a regular webpage and try again.');
    }
  }
  if (!isMarkdownResponse(response)) throw new Error('Invalid response from page');
  return response;
}

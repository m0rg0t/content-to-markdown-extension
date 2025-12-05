import TurndownService from 'turndown';
import { ExtensionSettings, getSettings } from '../utils/settings';

// Initialize Turndown service
function createTurndownService(settings: ExtensionSettings): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
    strongDelimiter: '**',
    linkStyle: 'inlined'
  });

  // Handle images based on settings
  if (!settings.includeImages) {
    turndownService.addRule('removeImages', {
      filter: 'img',
      replacement: () => ''
    });
  }

  // Handle links based on settings
  if (!settings.includeLinks) {
    turndownService.addRule('removeLinks', {
      filter: 'a',
      replacement: (_content, node) => {
        return (node as HTMLElement).textContent || '';
      }
    });
  }

  // Handle tables
  if (settings.preserveTables) {
    turndownService.addRule('table', {
      filter: 'table',
      replacement: function(_content, node) {
        const table = node as HTMLTableElement;
        const rows = Array.from(table.querySelectorAll('tr'));
        
        if (rows.length === 0) return '';
        
        let markdown = '\n\n';
        
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          const cellContents = cells.map(cell => {
            const text = (cell.textContent || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
            return text;
          });
          
          markdown += '| ' + cellContents.join(' | ') + ' |\n';
          
          // Add header separator after first row
          if (rowIndex === 0) {
            markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
          }
        });
        
        return markdown + '\n';
      }
    });
  }

  return turndownService;
}

// Get exclusion selectors based on settings
function getExclusionSelectors(settings: ExtensionSettings): string[] {
  const selectors: string[] = [];
  
  if (settings.excludeNav) {
    selectors.push('nav', 'header nav', '[role="navigation"]', '.navigation', '.nav', '#nav', '#navigation');
  }
  
  if (settings.excludeFooter) {
    selectors.push('footer', '[role="contentinfo"]', '.footer', '#footer');
  }
  
  if (settings.excludeSidebar) {
    selectors.push('aside', '[role="complementary"]', '.sidebar', '#sidebar', '.side-bar');
  }
  
  if (settings.excludeAds) {
    selectors.push(
      '[class*="ad-"]', '[class*="ads-"]', '[class*="advertisement"]',
      '[id*="ad-"]', '[id*="ads-"]', '[id*="advertisement"]',
      '.ad', '.ads', '.advert', '.banner-ad', '[data-ad]',
      'ins.adsbygoogle'
    );
  }
  
  if (settings.excludeComments) {
    selectors.push(
      '#comments', '.comments', '.comment-section', '[id*="comment"]',
      '#disqus_thread', '.disqus', '[class*="comment"]'
    );
  }
  
  if (settings.excludeForms) {
    selectors.push('form', 'input', 'button', 'select', 'textarea');
  }
  
  if (settings.excludeScripts) {
    selectors.push('script', 'style', 'noscript', 'link[rel="stylesheet"]');
  }
  
  // Add custom exclusions
  if (settings.customExclusions) {
    const customSelectors = settings.customExclusions
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    selectors.push(...customSelectors);
  }
  
  return selectors;
}

// Clone and clean the document for conversion
function prepareContent(element: Element, settings: ExtensionSettings): Element {
  const clone = element.cloneNode(true) as Element;
  
  const exclusionSelectors = getExclusionSelectors(settings);
  
  // Remove excluded elements
  exclusionSelectors.forEach(selector => {
    try {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    } catch {
      // Invalid selector, skip
    }
  });
  
  return clone;
}

// Convert HTML content to Markdown
export async function convertToMarkdown(html: string | Element, isSelection = false): Promise<string> {
  const settings = await getSettings();
  const turndownService = createTurndownService(settings);
  
  let content: string;
  
  if (typeof html === 'string') {
    content = html;
  } else {
    // It's an element
    const preparedContent = isSelection ? html : prepareContent(html, settings);
    content = preparedContent.innerHTML;
  }
  
  let markdown = turndownService.turndown(content);
  
  // Clean up excessive whitespace
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return markdown;
}

// Get the main content of the page
export function getMainContent(): Element {
  // Try to find main content area
  const mainSelectors = [
    'main',
    '[role="main"]',
    'article',
    '.main-content',
    '#main-content',
    '.content',
    '#content',
    '.post-content',
    '.article-content',
    '.entry-content'
  ];
  
  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  
  // Fallback to body
  return document.body;
}

// Get selected content
export function getSelectedContent(): Element | null {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());
  
  return container;
}

// Check if there is text selected
export function hasSelection(): boolean {
  const selection = window.getSelection();
  return !!(selection && !selection.isCollapsed && selection.toString().trim().length > 0);
}

// Format the final markdown output with metadata
export async function formatMarkdownOutput(markdown: string, includeMetadata = true): Promise<string> {
  const settings = await getSettings();
  let output = '';
  
  if (includeMetadata) {
    if (settings.includeTitle) {
      output += `# ${document.title}\n\n`;
    }
    
    if (settings.includeUrl) {
      output += `> Source: ${window.location.href}\n\n`;
    }
  }
  
  output += markdown;
  
  return output;
}

// Site-specific rule interface
export interface SiteRule {
  domain: string;
  contentSelector: string;
}

// Built-in site rules for popular websites
// User rules take priority over built-in rules
export const builtInSiteRules: SiteRule[] = [
  // VK Developer Portal
  { domain: 'dev.vk.com', contentSelector: '[data-t="page-content"]' },
  // Medium and its subdomains
  { domain: '*.medium.com', contentSelector: 'article' },
  { domain: 'medium.com', contentSelector: 'article' },
  // GitHub
  { domain: 'github.com', contentSelector: '.markdown-body' },
  // Stack Overflow
  { domain: 'stackoverflow.com', contentSelector: '.s-prose' },
  // Wikipedia
  { domain: '*.wikipedia.org', contentSelector: '#mw-content-text' },
  // Dev.to
  { domain: 'dev.to', contentSelector: '#article-body' },
  // Habr
  { domain: 'habr.com', contentSelector: '.tm-article-body' },
];

// Default settings interface
export interface ExtensionSettings {
  // Elements to exclude
  excludeNav: boolean;
  excludeFooter: boolean;
  excludeSidebar: boolean;
  excludeAds: boolean;
  excludeComments: boolean;
  excludeForms: boolean;
  excludeScripts: boolean;
  
  // Custom exclusions
  customExclusions: string;
  
  // Site-specific rules (stored as JSON string for chrome.storage compatibility)
  siteRules: string;
  
  // Output options
  includeImages: boolean;
  includeLinks: boolean;
  preserveTables: boolean;
  includeTitle: boolean;
  includeUrl: boolean;
  
  // Index signature for chrome.storage compatibility
  [key: string]: boolean | string;
}

export const defaultSettings: ExtensionSettings = {
  excludeNav: true,
  excludeFooter: true,
  excludeSidebar: true,
  excludeAds: true,
  excludeComments: true,
  excludeForms: true,
  excludeScripts: true,
  customExclusions: '',
  siteRules: '[]',
  includeImages: true,
  includeLinks: true,
  preserveTables: true,
  includeTitle: true,
  includeUrl: true
};

// Validate that an object has the required ExtensionSettings structure
function isValidSettings(obj: Record<string, unknown>): obj is ExtensionSettings {
  const requiredBooleanKeys = [
    'excludeNav', 'excludeFooter', 'excludeSidebar', 'excludeAds',
    'excludeComments', 'excludeForms', 'excludeScripts',
    'includeImages', 'includeLinks', 'preserveTables', 'includeTitle', 'includeUrl'
  ];
  
  for (const key of requiredBooleanKeys) {
    if (typeof obj[key] !== 'boolean') {
      return false;
    }
  }
  
  if (typeof obj['customExclusions'] !== 'string') {
    return false;
  }
  
  if (typeof obj['siteRules'] !== 'string') {
    return false;
  }
  
  return true;
}

// Parse site rules from JSON string
export function parseSiteRules(rulesJson: string): SiteRule[] {
  try {
    const parsed = JSON.parse(rulesJson);
    if (Array.isArray(parsed)) {
      return parsed.filter(rule => 
        typeof rule.domain === 'string' && 
        typeof rule.contentSelector === 'string'
      );
    }
  } catch {
    // Invalid JSON, return empty array
  }
  return [];
}

// Stringify site rules to JSON
export function stringifySiteRules(rules: SiteRule[]): string {
  return JSON.stringify(rules);
}

// Find matching rule in a rules array
function findMatchingRule(rules: SiteRule[], domain: string): SiteRule | null {
  // Normalize domains by removing www prefix for comparison
  const normalizeD = (d: string) => d.replace(/^www\./, '');
  const normalizedDomain = normalizeD(domain);

  // Try exact match first (with normalization)
  const exactMatch = rules.find(rule => {
    const normalizedRule = normalizeD(rule.domain);
    return normalizedRule === normalizedDomain || rule.domain === domain;
  });
  if (exactMatch) {
    return exactMatch;
  }

  // Try wildcard/partial matching (e.g., *.example.com)
  // Wildcard matches subdomains only, not the base domain itself
  const wildcardMatch = rules.find(rule => {
    if (rule.domain.startsWith('*.')) {
      const baseDomain = rule.domain.slice(2);
      // Must be a subdomain (have a dot before the base domain)
      return domain.endsWith(`.${baseDomain}`);
    }
    return false;
  });
  if (wildcardMatch) {
    return wildcardMatch;
  }

  return null;
}

// Get content selector for a specific domain
// User rules take priority over built-in rules
export function getContentSelectorForDomain(rules: SiteRule[], domain: string): string | null {
  // First check user-defined rules (they take priority)
  const userMatch = findMatchingRule(rules, domain);
  if (userMatch) {
    return userMatch.contentSelector;
  }

  // Fall back to built-in rules
  const builtInMatch = findMatchingRule(builtInSiteRules, domain);
  if (builtInMatch) {
    return builtInMatch.contentSelector;
  }

  return null;
}

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (result) => {
      // Validate the result and merge with defaults
      if (isValidSettings(result)) {
        resolve(result);
      } else {
        // Return defaults if validation fails
        resolve({ ...defaultSettings });
      }
    });
  });
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

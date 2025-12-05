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
  
  return true;
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

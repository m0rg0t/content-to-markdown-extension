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

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings as unknown as Record<string, unknown>, (result) => {
      resolve(result as unknown as ExtensionSettings);
    });
  });
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings as unknown as Record<string, unknown>, () => {
      resolve();
    });
  });
}

import { ExtensionSettings, defaultSettings, getSettings, saveSettings } from '../utils/settings';

// DOM elements
const excludeNavCheckbox = document.getElementById('excludeNav') as HTMLInputElement;
const excludeFooterCheckbox = document.getElementById('excludeFooter') as HTMLInputElement;
const excludeSidebarCheckbox = document.getElementById('excludeSidebar') as HTMLInputElement;
const excludeAdsCheckbox = document.getElementById('excludeAds') as HTMLInputElement;
const excludeCommentsCheckbox = document.getElementById('excludeComments') as HTMLInputElement;
const excludeFormsCheckbox = document.getElementById('excludeForms') as HTMLInputElement;
const excludeScriptsCheckbox = document.getElementById('excludeScripts') as HTMLInputElement;

const customExclusionsTextarea = document.getElementById('customExclusions') as HTMLTextAreaElement;

const includeImagesCheckbox = document.getElementById('includeImages') as HTMLInputElement;
const includeLinksCheckbox = document.getElementById('includeLinks') as HTMLInputElement;
const preserveTablesCheckbox = document.getElementById('preserveTables') as HTMLInputElement;
const includeTitleCheckbox = document.getElementById('includeTitle') as HTMLInputElement;
const includeUrlCheckbox = document.getElementById('includeUrl') as HTMLInputElement;

const saveOptionsBtn = document.getElementById('saveOptions') as HTMLButtonElement;
const resetOptionsBtn = document.getElementById('resetOptions') as HTMLButtonElement;
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

// Load settings into form
function loadSettingsIntoForm(settings: ExtensionSettings): void {
  excludeNavCheckbox.checked = settings.excludeNav;
  excludeFooterCheckbox.checked = settings.excludeFooter;
  excludeSidebarCheckbox.checked = settings.excludeSidebar;
  excludeAdsCheckbox.checked = settings.excludeAds;
  excludeCommentsCheckbox.checked = settings.excludeComments;
  excludeFormsCheckbox.checked = settings.excludeForms;
  excludeScriptsCheckbox.checked = settings.excludeScripts;
  
  customExclusionsTextarea.value = settings.customExclusions;
  
  includeImagesCheckbox.checked = settings.includeImages;
  includeLinksCheckbox.checked = settings.includeLinks;
  preserveTablesCheckbox.checked = settings.preserveTables;
  includeTitleCheckbox.checked = settings.includeTitle;
  includeUrlCheckbox.checked = settings.includeUrl;
}

// Get settings from form
function getSettingsFromForm(): ExtensionSettings {
  return {
    excludeNav: excludeNavCheckbox.checked,
    excludeFooter: excludeFooterCheckbox.checked,
    excludeSidebar: excludeSidebarCheckbox.checked,
    excludeAds: excludeAdsCheckbox.checked,
    excludeComments: excludeCommentsCheckbox.checked,
    excludeForms: excludeFormsCheckbox.checked,
    excludeScripts: excludeScriptsCheckbox.checked,
    customExclusions: customExclusionsTextarea.value,
    includeImages: includeImagesCheckbox.checked,
    includeLinks: includeLinksCheckbox.checked,
    preserveTables: preserveTablesCheckbox.checked,
    includeTitle: includeTitleCheckbox.checked,
    includeUrl: includeUrlCheckbox.checked
  };
}

// Initialize
async function init(): Promise<void> {
  const settings = await getSettings();
  loadSettingsIntoForm(settings);
}

// Save settings
saveOptionsBtn.addEventListener('click', async () => {
  try {
    const settings = getSettingsFromForm();
    await saveSettings(settings);
    showStatus('Settings saved successfully!');
  } catch (error) {
    showStatus('Failed to save settings', true);
  }
});

// Reset to defaults
resetOptionsBtn.addEventListener('click', async () => {
  try {
    await saveSettings(defaultSettings);
    loadSettingsIntoForm(defaultSettings);
    showStatus('Settings reset to defaults!');
  } catch (error) {
    showStatus('Failed to reset settings', true);
  }
});

// Load settings on page load
init();

import { ExtensionSettings, SiteRule, defaultSettings, getSettings, saveSettings, parseSiteRules, stringifySiteRules } from '../utils/settings';

// DOM elements
const excludeNavCheckbox = document.getElementById('excludeNav') as HTMLInputElement;
const excludeFooterCheckbox = document.getElementById('excludeFooter') as HTMLInputElement;
const excludeSidebarCheckbox = document.getElementById('excludeSidebar') as HTMLInputElement;
const excludeAdsCheckbox = document.getElementById('excludeAds') as HTMLInputElement;
const excludeCommentsCheckbox = document.getElementById('excludeComments') as HTMLInputElement;
const excludeFormsCheckbox = document.getElementById('excludeForms') as HTMLInputElement;
const excludeScriptsCheckbox = document.getElementById('excludeScripts') as HTMLInputElement;

const customExclusionsTextarea = document.getElementById('customExclusions') as HTMLTextAreaElement;
const siteRulesContainer = document.getElementById('siteRulesContainer') as HTMLDivElement;
const addSiteRuleBtn = document.getElementById('addSiteRule') as HTMLButtonElement;

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

// Default empty site rule
const EMPTY_SITE_RULE: SiteRule = { domain: '', contentSelector: '' };

// Create a site rule row element
function createSiteRuleRow(rule: SiteRule = EMPTY_SITE_RULE): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'site-rule';
  
  const domainInput = document.createElement('input');
  domainInput.type = 'text';
  domainInput.placeholder = 'example.com';
  domainInput.value = rule.domain;
  domainInput.className = 'domain-input';
  
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.textContent = '→';
  
  const selectorInput = document.createElement('input');
  selectorInput.type = 'text';
  selectorInput.placeholder = '.article-content';
  selectorInput.value = rule.contentSelector;
  selectorInput.className = 'selector-input';
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-rule-btn';
  removeBtn.textContent = '✕';
  removeBtn.type = 'button';
  removeBtn.addEventListener('click', () => {
    row.remove();
  });
  
  row.appendChild(domainInput);
  row.appendChild(arrow);
  row.appendChild(selectorInput);
  row.appendChild(removeBtn);
  
  return row;
}

// Load site rules into UI
function loadSiteRulesIntoForm(rulesJson: string): void {
  siteRulesContainer.innerHTML = '';
  const rules = parseSiteRules(rulesJson);
  
  rules.forEach(rule => {
    const row = createSiteRuleRow(rule);
    siteRulesContainer.appendChild(row);
  });
}

// Get site rules from UI
function getSiteRulesFromForm(): SiteRule[] {
  const rules: SiteRule[] = [];
  const rows = siteRulesContainer.querySelectorAll('.site-rule');
  
  rows.forEach(row => {
    const domainInput = row.querySelector('.domain-input') as HTMLInputElement;
    const selectorInput = row.querySelector('.selector-input') as HTMLInputElement;
    
    const domain = domainInput.value.trim();
    const contentSelector = selectorInput.value.trim();
    
    if (domain && contentSelector) {
      rules.push({ domain, contentSelector });
    }
  });
  
  return rules;
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
  loadSiteRulesIntoForm(settings.siteRules);
  
  includeImagesCheckbox.checked = settings.includeImages;
  includeLinksCheckbox.checked = settings.includeLinks;
  preserveTablesCheckbox.checked = settings.preserveTables;
  includeTitleCheckbox.checked = settings.includeTitle;
  includeUrlCheckbox.checked = settings.includeUrl;
}

// Get settings from form
function getSettingsFromForm(): ExtensionSettings {
  const siteRules = getSiteRulesFromForm();
  
  return {
    excludeNav: excludeNavCheckbox.checked,
    excludeFooter: excludeFooterCheckbox.checked,
    excludeSidebar: excludeSidebarCheckbox.checked,
    excludeAds: excludeAdsCheckbox.checked,
    excludeComments: excludeCommentsCheckbox.checked,
    excludeForms: excludeFormsCheckbox.checked,
    excludeScripts: excludeScriptsCheckbox.checked,
    customExclusions: customExclusionsTextarea.value,
    siteRules: stringifySiteRules(siteRules),
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

// Add new site rule
addSiteRuleBtn.addEventListener('click', () => {
  const row = createSiteRuleRow();
  siteRulesContainer.appendChild(row);
  // Focus on the domain input of the new row
  const domainInput = row.querySelector('.domain-input') as HTMLInputElement;
  domainInput.focus();
});

// Load settings on page load
init();

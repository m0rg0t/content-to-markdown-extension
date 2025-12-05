import { ExtensionSettings, SiteRule, defaultSettings, getSettings, saveSettings, parseSiteRules, stringifySiteRules } from '../utils/settings';
import { showStatus, getElement } from '../utils/ui';

// DOM elements with null checks
const excludeNavCheckbox = getElement<HTMLInputElement>('excludeNav', HTMLInputElement);
const excludeFooterCheckbox = getElement<HTMLInputElement>('excludeFooter', HTMLInputElement);
const excludeSidebarCheckbox = getElement<HTMLInputElement>('excludeSidebar', HTMLInputElement);
const excludeAdsCheckbox = getElement<HTMLInputElement>('excludeAds', HTMLInputElement);
const excludeCommentsCheckbox = getElement<HTMLInputElement>('excludeComments', HTMLInputElement);
const excludeFormsCheckbox = getElement<HTMLInputElement>('excludeForms', HTMLInputElement);
const excludeScriptsCheckbox = getElement<HTMLInputElement>('excludeScripts', HTMLInputElement);

const customExclusionsTextarea = getElement<HTMLTextAreaElement>('customExclusions', HTMLTextAreaElement);
const siteRulesContainer = getElement<HTMLDivElement>('siteRulesContainer', HTMLDivElement);
const addSiteRuleBtn = getElement<HTMLButtonElement>('addSiteRule', HTMLButtonElement);

const includeImagesCheckbox = getElement<HTMLInputElement>('includeImages', HTMLInputElement);
const includeLinksCheckbox = getElement<HTMLInputElement>('includeLinks', HTMLInputElement);
const preserveTablesCheckbox = getElement<HTMLInputElement>('preserveTables', HTMLInputElement);
const includeTitleCheckbox = getElement<HTMLInputElement>('includeTitle', HTMLInputElement);
const includeUrlCheckbox = getElement<HTMLInputElement>('includeUrl', HTMLInputElement);

const saveOptionsBtn = getElement<HTMLButtonElement>('saveOptions', HTMLButtonElement);
const resetOptionsBtn = getElement<HTMLButtonElement>('resetOptions', HTMLButtonElement);
const statusDiv = getElement<HTMLDivElement>('status', HTMLDivElement);

// Validate required elements
if (!statusDiv || !saveOptionsBtn || !resetOptionsBtn || !siteRulesContainer || !addSiteRuleBtn) {
  console.error('Content to Markdown: Required options elements not found');
  throw new Error('Required options elements not found');
}

// Store validated required elements
const requiredElements = {
  statusDiv,
  saveOptionsBtn,
  resetOptionsBtn,
  siteRulesContainer,
  addSiteRuleBtn
} as const;

// Local reference for showing status
function displayStatus(message: string, isError = false): void {
  showStatus(requiredElements.statusDiv, message, isError);
}

// Safely clear all children from an element
function clearChildren(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
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
  clearChildren(requiredElements.siteRulesContainer);
  const rules = parseSiteRules(rulesJson);

  rules.forEach(rule => {
    const row = createSiteRuleRow(rule);
    requiredElements.siteRulesContainer.appendChild(row);
  });
}

// Get site rules from UI
function getSiteRulesFromForm(): SiteRule[] {
  const rules: SiteRule[] = [];
  const rows = requiredElements.siteRulesContainer.querySelectorAll('.site-rule');

  rows.forEach(row => {
    const domainInput = row.querySelector('.domain-input');
    const selectorInput = row.querySelector('.selector-input');

    // Safe type checking
    if (!(domainInput instanceof HTMLInputElement) || !(selectorInput instanceof HTMLInputElement)) {
      return;
    }

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
  // Use optional chaining for all checkboxes
  if (excludeNavCheckbox) excludeNavCheckbox.checked = settings.excludeNav;
  if (excludeFooterCheckbox) excludeFooterCheckbox.checked = settings.excludeFooter;
  if (excludeSidebarCheckbox) excludeSidebarCheckbox.checked = settings.excludeSidebar;
  if (excludeAdsCheckbox) excludeAdsCheckbox.checked = settings.excludeAds;
  if (excludeCommentsCheckbox) excludeCommentsCheckbox.checked = settings.excludeComments;
  if (excludeFormsCheckbox) excludeFormsCheckbox.checked = settings.excludeForms;
  if (excludeScriptsCheckbox) excludeScriptsCheckbox.checked = settings.excludeScripts;

  if (customExclusionsTextarea) customExclusionsTextarea.value = settings.customExclusions;
  loadSiteRulesIntoForm(settings.siteRules);

  if (includeImagesCheckbox) includeImagesCheckbox.checked = settings.includeImages;
  if (includeLinksCheckbox) includeLinksCheckbox.checked = settings.includeLinks;
  if (preserveTablesCheckbox) preserveTablesCheckbox.checked = settings.preserveTables;
  if (includeTitleCheckbox) includeTitleCheckbox.checked = settings.includeTitle;
  if (includeUrlCheckbox) includeUrlCheckbox.checked = settings.includeUrl;
}

// Get settings from form
function getSettingsFromForm(): ExtensionSettings {
  const siteRules = getSiteRulesFromForm();

  return {
    excludeNav: excludeNavCheckbox?.checked ?? defaultSettings.excludeNav,
    excludeFooter: excludeFooterCheckbox?.checked ?? defaultSettings.excludeFooter,
    excludeSidebar: excludeSidebarCheckbox?.checked ?? defaultSettings.excludeSidebar,
    excludeAds: excludeAdsCheckbox?.checked ?? defaultSettings.excludeAds,
    excludeComments: excludeCommentsCheckbox?.checked ?? defaultSettings.excludeComments,
    excludeForms: excludeFormsCheckbox?.checked ?? defaultSettings.excludeForms,
    excludeScripts: excludeScriptsCheckbox?.checked ?? defaultSettings.excludeScripts,
    customExclusions: customExclusionsTextarea?.value ?? defaultSettings.customExclusions,
    siteRules: stringifySiteRules(siteRules),
    includeImages: includeImagesCheckbox?.checked ?? defaultSettings.includeImages,
    includeLinks: includeLinksCheckbox?.checked ?? defaultSettings.includeLinks,
    preserveTables: preserveTablesCheckbox?.checked ?? defaultSettings.preserveTables,
    includeTitle: includeTitleCheckbox?.checked ?? defaultSettings.includeTitle,
    includeUrl: includeUrlCheckbox?.checked ?? defaultSettings.includeUrl
  };
}

// Initialize with error handling
async function init(): Promise<void> {
  try {
    const settings = await getSettings();
    loadSettingsIntoForm(settings);
  } catch (error) {
    console.warn('Failed to load settings:', error);
    displayStatus('Failed to load settings', true);
  }
}

// Save settings
requiredElements.saveOptionsBtn.addEventListener('click', async () => {
  try {
    const settings = getSettingsFromForm();
    await saveSettings(settings);
    displayStatus('Settings saved successfully!');
  } catch (error) {
    console.warn('Failed to save settings:', error);
    displayStatus('Failed to save settings', true);
  }
});

// Reset to defaults
requiredElements.resetOptionsBtn.addEventListener('click', async () => {
  try {
    await saveSettings(defaultSettings);
    loadSettingsIntoForm(defaultSettings);
    displayStatus('Settings reset to defaults!');
  } catch (error) {
    console.warn('Failed to reset settings:', error);
    displayStatus('Failed to reset settings', true);
  }
});

// Add new site rule
requiredElements.addSiteRuleBtn.addEventListener('click', () => {
  const row = createSiteRuleRow();
  requiredElements.siteRulesContainer.appendChild(row);
  // Focus on the domain input of the new row
  const domainInput = row.querySelector('.domain-input');
  if (domainInput instanceof HTMLInputElement) {
    domainInput.focus();
  }
});

// Load settings on page load
init();

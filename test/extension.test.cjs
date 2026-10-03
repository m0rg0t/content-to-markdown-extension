const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { defaultSettings, parseSiteRules, getContentSelectorForDomain } = require('../.test-build/utils/settings');
const converter = require('../.test-build/utils/converter');
const { isMessage, isMarkdownResponse } = require('../.test-build/utils/messages');
const { sendToContentScript } = require('../.test-build/utils/sendToContentScript');
let dom, settings;
beforeEach(() => {
  dom = new JSDOM('<title>Synthetic fixture</title><body></body>', { url: 'https://fixture.invalid/' });
  global.window = dom.window; global.document = dom.window.document;
  settings = { ...defaultSettings };
  global.chrome = { storage: { sync: { get: (_defaults, callback) => callback(settings) } } };
});
afterEach(() => { dom.window.close(); delete global.window; delete global.document; delete global.chrome; });
test('table escaping handles pipe, backslash, CR/LF without duplicate nested rows', async () => {
  const result = await converter.convertToMarkdown('<table><tr><th>Title</th><th>Value</th></tr><tr><td>A|B\\C\r\nD</td><td><table><tr><td>nested</td></tr></table></td></tr></table>');
  assert.equal(result, '| Title | Value |\n| --- | --- |\n| A\\|B\\\\C D | nested |');
  assert.equal(await converter.convertToMarkdown('<table></table>'), '');
});
test('exclusions preserve live DOM and selection mode preserves selected navigation', async () => {
  document.body.innerHTML = '<main><h1>Keep</h1><nav>navigation</nav><p class="omit">remove</p><p>body</p></main>';
  settings.customExclusions = '[invalid\n.omit';
  const main = document.querySelector('main'); const original = main.outerHTML;
  assert.equal(await converter.convertToMarkdown(main), '# Keep\n\nbody');
  assert.match(await converter.convertToMarkdown(main, true), /navigation/);
  assert.equal(main.outerHTML, original);
});
test('site selector invalid/missing fallback and body fallback', async () => {
  document.body.innerHTML = '<main>Main</main><article>Article</article>';
  for (const selector of ['[invalid', '.missing']) {
    settings.siteRules = JSON.stringify([{ domain: 'fixture.invalid', contentSelector: selector }]);
    assert.equal(await converter.getMainContent(), document.querySelector('main'));
  }
  document.body.innerHTML = '<p>Body</p>';
  assert.equal(await converter.getMainContent(), document.body);
});
test('malformed rules cannot discard valid rules and wildcards do not match base or impostor domains', () => {
  const rules = parseSiteRules('[null,2,{"domain":"*.fixture.invalid","contentSelector":"article"}]');
  assert.equal(rules.length, 1);
  assert.equal(getContentSelectorForDomain(rules, 'a.fixture.invalid'), 'article');
  assert.equal(getContentSelectorForDomain(rules, 'fixture.invalid'), null);
  assert.equal(getContentSelectorForDomain(rules, 'notfixture.invalid'), null);
});
test('selected content uses cloned synthetic selection', () => {
  assert.equal(converter.getSelectedContent(), null);
  document.body.innerHTML = '<p>Select <b>this</b></p>';
  const range = document.createRange(); range.selectNodeContents(document.querySelector('p'));
  window.getSelection().addRange(range);
  assert.equal(converter.hasSelection(), true);
  assert.equal(converter.getSelectedContent().innerHTML, 'Select <b>this</b>');
});
test('message/response validators reject malformed runtime input', () => {
  for (const value of [null, undefined, [], 3, {}, { type: 'NOPE' }, {type:'CHECK_SELECTION',data:null}]) assert.equal(isMessage(value), false);
  assert.equal(isMessage({type:'CHECK_SELECTION'}), true);
  for (const value of [null, {}, {success:'true'}, {success:true,markdown:3}]) assert.equal(isMarkdownResponse(value), false);
  assert.equal(isMarkdownResponse({success:false,error:'no receiver'}), true);
});
test('content listener rejects malformed messages synchronously without clipboard access', () => {
  let listener;
  chrome.runtime = { onMessage: { addListener: fn => { listener = fn; } }, sendMessage: async () => {} };
  const path = require.resolve('../.test-build/content/content'); delete require.cache[path]; require(path);
  let response;
  assert.equal(listener(null, {}, value => { response = value; }), false);
  assert.deepEqual(response, {success:false,error:'Invalid message'});
});
test('available receiver is not reinjected, including tab ID zero', async () => {
  chrome.tabs = { query: async () => [{id:0}], sendMessage: async () => ({success:true,hasSelection:false}) };
  chrome.scripting = { executeScript: async () => { throw new Error('must not inject'); } };
  assert.deepEqual(await sendToContentScript({type:'CHECK_SELECTION'}), {success:true,hasSelection:false});
});
test('missing receiver retries injection once and restricted pages get actionable error', async () => {
  let sends = 0, injections = 0;
  chrome.tabs = { query: async () => [{id:1}], sendMessage: async () => { if (++sends === 1) throw new Error('no receiver'); return {success:true}; } };
  chrome.scripting = { executeScript: async () => { injections++; } };
  assert.deepEqual(await sendToContentScript({type:'CHECK_SELECTION'}), {success:true});
  assert.equal(sends, 2); assert.equal(injections, 1);
  chrome.tabs.sendMessage = async () => { throw new Error('no receiver'); };
  chrome.scripting.executeScript = async () => { throw new Error('restricted'); };
  await assert.rejects(sendToContentScript({type:'CHECK_SELECTION'}), /regular webpage/);
});
test('invalid receiver response is rejected without reinjection', async () => {
  chrome.tabs = { query: async () => [{id:1}], sendMessage: async () => null };
  await assert.rejects(sendToContentScript({type:'CHECK_SELECTION'}), /Invalid response/);
});
test('worker listeners register on each restart without DOM/clipboard dependencies', async () => {
  const path = require.resolve('../.test-build/background/background');
  for (let restart=0;restart<2;restart++) {
    const listeners = {}; const sent = [];
    chrome.runtime = { onInstalled: {addListener: fn => listeners.install = fn}, onMessage: {addListener: fn => listeners.message = fn} };
    chrome.contextMenus = { create: () => {}, onClicked: {addListener: fn => listeners.click = fn} };
    chrome.tabs = { sendMessage: async (...args) => sent.push(args) };
    delete require.cache[path]; require(path);
    assert.equal(listeners.message(null, {}, () => {}), false);
    await listeners.click({menuItemId:'copyPageAsMarkdown'}, {id:0});
    assert.deepEqual(sent, [[0,{type:'COPY_PAGE_AS_MARKDOWN'}]]);
  }
});

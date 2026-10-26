import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

it('keeps private routes, query values and referrer paths out of tracking across SPA navigation', () => {
  const sent: any[] = [];
  const attrs: Record<string, string> = { 'data-website-id': 'site123456', 'data-safe-queries': '', 'data-exclude-paths': '/portal,/agent,/directory-submission-report' };
  const loc = new URL('https://citewing.com/?email=private@example.com&workspace=secret&utm_source=x#private');
  const doc = {
    currentScript: { src: 'https://analytics.example.com/js/script.js', getAttribute: (k: string) => attrs[k] ?? null, hasAttribute: (k: string) => k in attrs },
    cookie: '', visibilityState: 'visible', referrer: 'https://citewing.com/directory-submission-report/private-token?token=private',
    addEventListener() {}, querySelectorAll: () => [], readyState: 'complete',
  };
  const win: any = { location: loc, document: doc, navigator: {}, screen: { width: 1440 }, addEventListener() {}, history: { pushState() {}, replaceState() {} } };
  runInNewContext(readFileSync('public/js/script.js', 'utf8'), {
    window: win, screen: win.screen, document: doc, URL, URLSearchParams, localStorage: { getItem: () => null }, setTimeout: (fn: () => void) => fn(), setInterval() {},
    fetch: (_: string, init: any) => { sent.push(JSON.parse(init.body)); return Promise.resolve(); },
  });
  expect(sent).toHaveLength(1);
  expect(sent[0].u).toBe('https://citewing.com/?utm_source=x');
  expect(sent[0].r).toBe('https://citewing.com');
  loc.pathname = '/portal/settings';
  win.history.pushState();
  win.minilytics('goal', 'private_goal');
  expect(sent).toHaveLength(1);
  loc.pathname = '/directory-submission-report/private-token';
  win.history.pushState();
  expect(sent).toHaveLength(1);
  loc.pathname = '/start';
  win.history.pushState();
  expect(sent).toHaveLength(2);
  expect(sent[1].u).toBe('https://citewing.com/start?utm_source=x');
});

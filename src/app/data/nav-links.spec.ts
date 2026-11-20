import en from '../../assets/i18n/en.json';
import zhTw from '../../assets/i18n/zh-TW.json';
import { NAV_LINKS } from './nav-links';

function lookup(tree: unknown, key: string): unknown {
  return key.split('.').reduce<any>((node, part) => node?.[part], tree);
}

describe('NAV_LINKS', () => {
  it('lists home, practice, statistics, settings and information, in this order', () => {
    expect(NAV_LINKS.map((l) => l.routerLink)).toEqual([
      '/',
      '/practice',
      '/statistics',
      '/settings',
      '/information',
    ]);
  });

  it('only matches the home link exactly, so it is not lit on every page', () => {
    expect(NAV_LINKS.map((l) => l.routerLinkActiveOptions.exact)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('gives each link its own icon', () => {
    const icons = NAV_LINKS.map((l) => l.icon);
    expect(icons).toEqual([
      'home',
      'my_location',
      'trending_up',
      'settings',
      'info',
    ]);
  });

  it('has a title, label and tooltip, in both languages, for every link', () => {
    for (const link of NAV_LINKS) {
      for (const key of [link.title, link.ariaLabel, link.tooltipMessage]) {
        expect(typeof lookup(en, key))
          .withContext(`en ${key}`)
          .toBe('string');
        expect(typeof lookup(zhTw, key))
          .withContext(`zh-TW ${key}`)
          .toBe('string');
      }
    }
  });

  it('names its texts after its own page', () => {
    for (const link of NAV_LINKS) {
      const page = link.routerLink === '/' ? 'home' : link.routerLink.slice(1);
      expect(link.title).toBe(`nav.page.${page}.title`);
      expect(link.ariaLabel).toBe(`nav.page.${page}.aria-label`);
      expect(link.tooltipMessage).toBe(`nav.page.${page}.tooltip`);
    }
  });
});

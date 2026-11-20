import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { InformationPageComponent } from './information-page.component';

describe('InformationPageComponent', () => {
  let el: HTMLElement;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService()],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
    const fixture = TestBed.createComponent(InformationPageComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });
  const clean = (e: Element | null) =>
    e!.textContent!.replace(/\s+/g, ' ').trim();

  it('has a description and three section headings, in order', () => {
    expect(el.textContent).toContain(en['information-page'].description);
    expect(Array.from(el.querySelectorAll('h2')).map(clean)).toEqual([
      'Page Introductions',
      'How Throughput Is Calculated',
      'Disclaimers',
    ]);
  });

  it('introduces the practice, statistics and settings pages, each linking to it', () => {
    const links = Array.from(
      el.querySelectorAll('h3 a'),
    ) as HTMLAnchorElement[];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/practice',
      '/statistics',
      '/settings',
    ]);
    expect(links.map(clean)).toEqual([
      'my_location Practice Page',
      'trending_up Statistics Page',
      'settings Settings Page',
    ]);
    expect(el.textContent).toContain(
      en['information-page']['practice-page'].description[0],
    );
    expect(el.textContent).toContain(
      en['information-page']['practice-page'].description[1],
    );
    expect(el.textContent).toContain(
      en['information-page']['statistics-page'].description,
    );
    expect(el.textContent).toContain(
      en['information-page']['settings-page'].description,
    );
  });

  it('gives the throughput formulas next to the methodology', () => {
    expect(el.textContent).toContain('ID = log2(A / W + 1)');
    expect(el.textContent).toContain('TP = mean(ID) / mean(MT)');
    expect(el.textContent).toContain(
      en['information-page'].methodology.description[0],
    );
    expect(el.textContent).toContain(
      en['information-page'].methodology.description[1],
    );
  });

  it('lists two disclaimers, with safe external links', () => {
    const items = el.querySelectorAll('ol li');
    expect(items.length).toBe(2);
    const ext = Array.from(el.querySelectorAll('ol a')) as HTMLAnchorElement[];
    expect(ext.map((a) => a.getAttribute('href'))).toEqual([
      'https://www.charachorder.com/',
      'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
      'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
    ]);
    expect(
      ext.every((a) => a.target === '_blank' && a.rel === 'noopener'),
    ).toBeTrue();
  });
});

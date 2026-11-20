import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  function create() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService()],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }
  const clean = (e: Element | null) =>
    e!.textContent!.replace(/\s+/g, ' ').trim();

  it('shows the name and what the tool is', () => {
    const el = create();
    expect(clean(el.querySelector('h1'))).toBe('Alnasl');
    expect(el.textContent).toContain(en['home-page'].summary);
  });

  it('explains fast and slow mouse speeds and the goal', () => {
    const el = create();
    expect(el.textContent).toContain('How the CharaChorder Mouse Speed Works');
    expect(el.textContent).toContain(en['home-page']['speed-mechanic'].fast);
    expect(el.textContent).toContain(en['home-page']['speed-mechanic'].slow);
    expect(el.textContent).toContain(en['home-page']['speed-mechanic'].goal);
  });

  it('has a start button leading to the practice page', () => {
    const el = create();
    const a = el.querySelector(
      'a[routerLink], a[href="/practice"]',
    ) as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('/practice');
    expect(clean(a)).toBe('my_location Start Practice');
  });

  it('links to the official docs and the source code, in new tabs, safely', () => {
    const el = create();
    const ext = Array.from(
      el.querySelectorAll('a[target=_blank]'),
    ) as HTMLAnchorElement[];
    expect(ext.map((a) => a.getAttribute('href'))).toEqual([
      'https://docs.charachorder.com/GenerativeTextMenu.html#mouse',
      'https://github.com/andy23512/alnasl',
    ]);
    expect(ext.map((a) => a.rel)).toEqual(['noopener', 'noopener']);
    expect(ext.map(clean)).toEqual([
      'menu_book Official Mouse Docs',
      'code Source Code',
    ]);
  });

  it('ends with the remark about the star', () => {
    const el = create();
    expect(clean(el.querySelector('.absolute'))).toBe(
      `★ ${en['home-page'].remark} ★`,
    );
  });

  it('fills the page, so the remark sits at the bottom', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService()],
    });
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('relative');
    expect(host.classList).toContain('h-full');
  });
});

import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import en from '../../../assets/i18n/en.json';
import { NAV_LINKS } from '../../data/nav-links';
import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let handset: BehaviorSubject<{ matches: boolean }>;
  let fixture: ComponentFixture<NavComponent>;
  let queries: unknown[];

  beforeEach(() => {
    queries = [];
    handset = new BehaviorSubject<{ matches: boolean }>({ matches: false });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: (query: unknown) => {
              queries.push(query);
              return handset;
            },
          },
        },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
  });

  function create() {
    fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
    return fixture;
  }
  const el = () => fixture.nativeElement as HTMLElement;
  const brand = () =>
    el().querySelector('mat-toolbar > a') as HTMLAnchorElement;

  it('always shows the brand, linking to the home page', () => {
    create();
    expect(brand().textContent!.replace(/\s+/g, ' ').trim()).toBe(
      'my_locationAlnasl',
    );
    expect(brand().getAttribute('href')).toBe('/');
    handset.next({ matches: true });
    fixture.detectChanges();
    expect(brand().getAttribute('href')).toBe('/');
  });

  describe('on a wide screen', () => {
    it('shows a button for every page, in order, with its icon and title', () => {
      create();
      const links = Array.from(el().querySelectorAll('.gap-1 > a'));
      expect(links.map((a) => a.getAttribute('href'))).toEqual(
        NAV_LINKS.map((l) => l.routerLink),
      );
      expect(
        links.map((a) => a.textContent!.replace(/\s+/g, ' ').trim()),
      ).toEqual([
        'home Home',
        'my_location Practice',
        'trending_up Stats',
        'settings Settings',
        'info Info',
      ]);
    });

    it('labels each link for screen readers', () => {
      create();
      const links = Array.from(el().querySelectorAll('.gap-1 > a'));
      expect(links.map((a) => a.getAttribute('aria-label'))).toEqual([
        'home page link',
        'practice page link',
        'statistics page link',
        'settings page link',
        'information page link',
      ]);
    });

    it('has no menu button', () => {
      create();
      expect(el().querySelector('[mat-icon-button]')).toBeNull();
    });

    it('marks the current page as the primary button; home only on the home page', async () => {
      const router = TestBed.inject((await import('@angular/router')).Router);
      create();
      const classes = () =>
        Array.from(el().querySelectorAll('.gap-1 > a button')).map((b) =>
          b.classList.contains('mat-primary'),
        );
      await router.navigateByUrl('/');
      fixture.detectChanges();
      expect(classes()).toEqual([true, false, false, false, false]);
    });
  });

  describe('on a handset', () => {
    beforeEach(() => handset.next({ matches: true }));

    it('shows a labelled menu button instead of the page buttons', () => {
      create();
      const button = el().querySelector(
        'button[mat-icon-button]',
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe('toggle navigation menu');
      expect(button.textContent!.trim()).toBe('menu');
      expect(el().querySelector('.gap-1 > a')).toBeNull();
    });

    it('lists every page in the menu once it is opened', () => {
      create();
      (
        el().querySelector('button[mat-icon-button]') as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      const items = Array.from(document.querySelectorAll('a[mat-menu-item]'));
      expect(items.map((a) => a.getAttribute('href'))).toEqual(
        NAV_LINKS.map((l) => l.routerLink),
      );
      expect(
        items.map((a) => a.textContent!.replace(/\s+/g, ' ').trim()),
      ).toEqual([
        'homeHome',
        'my_locationPractice',
        'trending_upStats',
        'settingsSettings',
        'infoInfo',
      ]);
    });
  });

  it('asks whether the screen is a handset', () => {
    create();
    expect(queries).toEqual([Breakpoints.Handset]);
  });

  it('switches layout when the screen size changes', () => {
    create();
    expect(el().querySelector('.gap-1 > a')).not.toBeNull();
    handset.next({ matches: true });
    fixture.detectChanges();
    expect(el().querySelector('.gap-1 > a')).toBeNull();
    expect(el().querySelector('button[mat-icon-button]')).not.toBeNull();
    handset.next({ matches: false });
    fixture.detectChanges();
    expect(el().querySelector('.gap-1 > a')).not.toBeNull();
  });
});

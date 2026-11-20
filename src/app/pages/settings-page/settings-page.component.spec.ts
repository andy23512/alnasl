import { TestBed } from '@angular/core/testing';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { By } from '@angular/platform-browser';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { db } from '../../db';
import { UiLanguage } from '../../models/language-setting.models';
import { PracticeMode, SessionSummary } from '../../models/practice.models';
import { LanguageSettingStore } from '../../stores/language-setting.store';
import { SettingsPageComponent } from './settings-page.component';

const SESSION: Omit<SessionSummary, 'id'> = {
  timestamp: 1,
  mode: PracticeMode.Click,
  targetWidth: 40,
  amplitude: 360,
  targetCount: 9,
  rounds: 3,
  trialCount: 27,
  errorCount: 0,
  errorRate: 0,
  meanMovementTimeMs: 800,
  throughputBitsPerSecond: 4,
};

describe('SettingsPageComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.sessions.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
    localStorage.setItem(
      'languageSetting',
      JSON.stringify({ uiLanguage: 'en' }),
    );
  });
  afterEach(async () => {
    localStorage.clear();
    await db.sessions.clear();
  });

  async function create() {
    const fixture = TestBed.createComponent(SettingsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  type F = Awaited<ReturnType<typeof create>>;
  const el = (f: F) => f.nativeElement as HTMLElement;
  const panels = (f: F) =>
    Array.from(el(f).querySelectorAll('mat-expansion-panel'));
  const headers = (f: F) =>
    Array.from(el(f).querySelectorAll('mat-expansion-panel-header')).map((h) =>
      h.textContent!.trim(),
    );

  it('has a title and three panels, in order', async () => {
    const f = await create();
    expect(el(f).querySelector('h2')!.textContent!.trim()).toBe('Settings');
    expect(headers(f)).toEqual([
      'Practice Defaults',
      'UI Language',
      'Data Deletion',
    ]);
  });

  it('opens only the practice defaults at first, which hold the setting form', async () => {
    const f = await create();
    expect(panels(f).map((p) => p.classList.contains('mat-expanded'))).toEqual([
      true,
      false,
      false,
    ]);
    expect(
      panels(f)[0].querySelector('app-practice-setting-form'),
    ).not.toBeNull();
  });

  describe('language', () => {
    const toggles = (f: F) =>
      f.debugElement.queryAll(By.directive(MatButtonToggle));
    // the first toggle group on the page is the form's practice mode, so skip its three buttons
    const languageToggles = (f: F) => toggles(f).slice(3);

    it('offers English and 繁體中文, with the current language chosen', async () => {
      const f = await create();
      expect(
        languageToggles(f).map((t) => t.nativeElement.textContent.trim()),
      ).toEqual(['English', '繁體中文']);
      expect(
        languageToggles(f).map((t) => t.componentInstance.checked),
      ).toEqual([true, false]);
    });

    it('shows the saved language when it is not English', async () => {
      localStorage.setItem(
        'languageSetting',
        JSON.stringify({ uiLanguage: 'zh-TW' }),
      );
      const f = await create();
      expect(
        languageToggles(f).map((t) => t.componentInstance.checked),
      ).toEqual([false, true]);
    });

    it('changes the language when a button is pressed', async () => {
      const f = await create();
      const store = TestBed.inject(LanguageSettingStore);
      (
        languageToggles(f)[1].nativeElement.querySelector(
          'button',
        ) as HTMLElement
      ).click();
      f.detectChanges();
      expect(store.uiLanguage()).toBe(UiLanguage.ZH_TW);
      (
        languageToggles(f)[0].nativeElement.querySelector(
          'button',
        ) as HTMLElement
      ).click();
      f.detectChanges();
      expect(store.uiLanguage()).toBe(UiLanguage.EN);
    });

    it('lists every supported language by its own name', async () => {
      const f = await create();
      expect(f.componentInstance.supportedLanguages).toEqual([
        { id: UiLanguage.EN, name: 'English' },
        { id: UiLanguage.ZH_TW, name: '繁體中文' },
      ]);
    });
  });

  describe('data deletion', () => {
    const button = (f: F) =>
      panels(f)[2].querySelector('button') as HTMLButtonElement;

    it('has a red delete button for the practice history', async () => {
      const f = await create();
      expect(button(f).textContent!.replace(/\s+/g, ' ').trim()).toBe(
        'delete Delete All Practice History',
      );
      expect(button(f).classList).toContain('mat-warn');
    });

    it('does not delete anything until it is pressed', async () => {
      await db.sessions.add({ ...SESSION });
      await create();
      expect(await db.sessions.count()).toBe(1);
    });

    it('deletes every recorded session when pressed', async () => {
      await db.sessions.bulkAdd([
        { ...SESSION },
        { ...SESSION, timestamp: 2 },
        { ...SESSION, timestamp: 3 },
      ]);
      const f = await create();
      button(f).click();
      await f.whenStable();
      expect(await db.sessions.count()).toBe(0);
    });

    it('keeps the settings when the history is deleted', async () => {
      localStorage.setItem('practiceSetting', JSON.stringify({ rounds: 5 }));
      const f = await create();
      button(f).click();
      await f.whenStable();
      expect(JSON.parse(localStorage.getItem('practiceSetting')!).rounds).toBe(
        5,
      );
      expect(
        JSON.parse(localStorage.getItem('languageSetting')!).uiLanguage,
      ).toBe('en');
    });
  });
});

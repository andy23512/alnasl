import { TestBed } from '@angular/core/testing';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { PracticeMode } from '../../models/practice.models';
import { PracticeSettingStore } from '../../stores/practice-setting.store';
import { PracticeSettingFormComponent } from './practice-setting-form.component';

describe('PracticeSettingFormComponent', () => {
  let store: InstanceType<typeof PracticeSettingStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
    store = TestBed.inject(PracticeSettingStore);
  });
  afterEach(() => localStorage.clear());

  async function create() {
    const fixture = TestBed.createComponent(PracticeSettingFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  type F = Awaited<ReturnType<typeof create>>;
  const root = (f: F) => f.nativeElement as HTMLElement;
  const inputs = (f: F) =>
    Array.from(
      root(f).querySelectorAll('input[type=number]'),
    ) as HTMLInputElement[];
  const labels = (f: F) =>
    Array.from(root(f).querySelectorAll('mat-label')).map((l) =>
      l.textContent!.trim(),
    );
  const type = async (f: F, input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
  };
  const choose = async (f: F, select: number, value: number) => {
    const sel = f.debugElement.queryAll(By.directive(MatSelect))[select]
      .componentInstance as MatSelect;
    sel.open();
    f.detectChanges();
    await f.whenStable();
    const option = Array.from(document.querySelectorAll('mat-option')).find(
      (o) => o.textContent!.trim() === String(value),
    ) as HTMLElement;
    option.click();
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
  };
  const toggles = (f: F) =>
    f.debugElement.queryAll(By.directive(MatButtonToggle));

  describe('mode', () => {
    it('offers move, click and drag, in this order, with the current one chosen', async () => {
      const f = await create();
      expect(
        toggles(f).map((t) =>
          t.nativeElement.textContent.replace(/\s+/g, ' ').trim(),
        ),
      ).toEqual(['open_with Move', 'ads_click Click', 'drag_pan Drag']);
      expect(toggles(f).map((t) => t.componentInstance.checked)).toEqual([
        false,
        true,
        false,
      ]);
    });

    it('describes the chosen mode', async () => {
      const f = await create();
      const d = () => root(f).querySelector('p')!.textContent!.trim();
      expect(d()).toBe(en['practice-setting'].mode.description.click);
      store.set('mode', PracticeMode.Drag);
      f.detectChanges();
      expect(d()).toBe(en['practice-setting'].mode.description.drag);
    });

    it('changes the setting for each button', async () => {
      const f = await create();
      (
        toggles(f)[0].nativeElement.querySelector('button') as HTMLElement
      ).click();
      f.detectChanges();
      expect(store.mode()).toBe(PracticeMode.Move);
      (
        toggles(f)[2].nativeElement.querySelector('button') as HTMLElement
      ).click();
      f.detectChanges();
      expect(store.mode()).toBe(PracticeMode.Drag);
      (
        toggles(f)[1].nativeElement.querySelector('button') as HTMLElement
      ).click();
      f.detectChanges();
      expect(store.mode()).toBe(PracticeMode.Click);
    });
  });

  describe('selects', () => {
    it('show the current target count and rounds', async () => {
      store.set('targetCount', 11);
      store.set('rounds', 5);
      const f = await create();
      const sels = f.debugElement
        .queryAll(By.directive(MatSelect))
        .map((d) => d.componentInstance as MatSelect);
      expect(sels.map((s) => s.value)).toEqual([11, 5]);
    });

    it('offer the odd target counts 5 to 13, which an every-other-target walk needs', async () => {
      const f = await create();
      const sel = f.debugElement.queryAll(By.directive(MatSelect))[0]
        .componentInstance as MatSelect;
      sel.open();
      f.detectChanges();
      await f.whenStable();
      expect(
        Array.from(document.querySelectorAll('mat-option')).map((o) =>
          o.textContent!.trim(),
        ),
      ).toEqual(['5', '7', '9', '11', '13']);
    });

    it('offer 1 to 5 rounds', async () => {
      const f = await create();
      const sel = f.debugElement.queryAll(By.directive(MatSelect))[1]
        .componentInstance as MatSelect;
      sel.open();
      f.detectChanges();
      await f.whenStable();
      expect(
        Array.from(document.querySelectorAll('mat-option')).map((o) =>
          o.textContent!.trim(),
        ),
      ).toEqual(['1', '2', '3', '4', '5']);
    });

    it('change the target count and the rounds', async () => {
      const f = await create();
      await choose(f, 0, 13);
      expect(store.targetCount()).toBe(13);
      expect(store.rounds()).toBe(3);
      await choose(f, 1, 2);
      expect(store.rounds()).toBe(2);
      expect(store.targetCount()).toBe(13);
    });
  });

  describe('number fields', () => {
    it('show the current size and distance, in pixels, and are labelled', async () => {
      store.set('targetWidth', 55);
      store.set('amplitude', 420);
      const f = await create();
      expect(inputs(f).map((i) => i.value)).toEqual(['55', '420']);
      expect(labels(f)).toEqual([
        'Target Count',
        'Rounds',
        'Target Size',
        'Distance',
      ]);
      expect(
        Array.from(root(f).querySelectorAll('[matTextSuffix]')).map(
          (s) => s.textContent,
        ),
      ).toEqual(['px', 'px']);
    });

    it('change the target size and the distance', async () => {
      const f = await create();
      await type(f, inputs(f)[0], '80');
      expect(store.targetWidth()).toBe(80);
      await type(f, inputs(f)[1], '500');
      expect(store.amplitude()).toBe(500);
    });

    it('keep the target size between 16 and 160', async () => {
      const f = await create();
      await type(f, inputs(f)[0], '5');
      expect(store.targetWidth()).toBe(16);
      await type(f, inputs(f)[0], '16');
      expect(store.targetWidth()).toBe(16);
      await type(f, inputs(f)[0], '160');
      expect(store.targetWidth()).toBe(160);
      await type(f, inputs(f)[0], '999');
      expect(store.targetWidth()).toBe(160);
    });

    it('keep the distance between 100 and 900', async () => {
      const f = await create();
      await type(f, inputs(f)[1], '10');
      expect(store.amplitude()).toBe(100);
      await type(f, inputs(f)[1], '900');
      expect(store.amplitude()).toBe(900);
      await type(f, inputs(f)[1], '5000');
      expect(store.amplitude()).toBe(900);
    });

    it('fall back to the smallest value when left empty', async () => {
      const f = await create();
      await type(f, inputs(f)[0], '');
      expect(store.targetWidth()).toBe(16);
      await type(f, inputs(f)[1], '');
      expect(store.amplitude()).toBe(100);
    });
  });

  describe('hold time', () => {
    it('is only offered for move mode, in milliseconds', async () => {
      const f = await create();
      expect(inputs(f).length).toBe(2);
      store.set('mode', PracticeMode.Move);
      f.detectChanges();
      await f.whenStable();
      expect(inputs(f).length).toBe(3);
      expect(inputs(f)[2].value).toBe('350');
      expect(labels(f).at(-1)).toBe('Hold Time');
      expect(root(f).querySelectorAll('[matTextSuffix]')[2].textContent).toBe(
        'ms',
      );
      store.set('mode', PracticeMode.Drag);
      f.detectChanges();
      expect(inputs(f).length).toBe(2);
    });

    it('is kept between 100 and 1500', async () => {
      store.set('mode', PracticeMode.Move);
      const f = await create();
      await type(f, inputs(f)[2], '20');
      expect(store.dwellTimeMs()).toBe(100);
      await type(f, inputs(f)[2], '700');
      expect(store.dwellTimeMs()).toBe(700);
      await type(f, inputs(f)[2], '1500');
      expect(store.dwellTimeMs()).toBe(1500);
      await type(f, inputs(f)[2], '2000');
      expect(store.dwellTimeMs()).toBe(1500);
      await type(f, inputs(f)[2], '');
      expect(store.dwellTimeMs()).toBe(100);
    });
  });

  describe('setters', () => {
    it('treat a value that is not a number as the smallest allowed', async () => {
      const f = await create();
      f.componentInstance.setTargetWidth(NaN);
      f.componentInstance.setAmplitude(NaN);
      f.componentInstance.setDwellTimeMs(NaN);
      expect(store.targetWidth()).toBe(16);
      expect(store.amplitude()).toBe(100);
      expect(store.dwellTimeMs()).toBe(100);
    });

    it('write the value through to the store as it is, for the options', async () => {
      const f = await create();
      f.componentInstance.setTargetCount(7);
      f.componentInstance.setRounds(4);
      f.componentInstance.setMode(PracticeMode.Drag);
      expect([store.targetCount(), store.rounds(), store.mode()]).toEqual([
        7,
        4,
        PracticeMode.Drag,
      ]);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { TargetArenaComponent } from '../../components/target-arena/target-arena.component';
import { db } from '../../db';
import { PracticeMode, TrialResult } from '../../models/practice.models';
import { PracticeSettingStore } from '../../stores/practice-setting.store';
import { PracticePageComponent } from './practice-page.component';

function trial(over: Partial<TrialResult> = {}): TrialResult {
  return {
    index: 0,
    mode: PracticeMode.Click,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
    targetWidth: 40,
    amplitude: 120,
    endX: 0,
    endY: 0,
    movementTimeMs: 1000,
    isError: false,
    pathLength: 120,
    ...over,
  };
}

describe('PracticePageComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.sessions.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
  });
  afterEach(async () => {
    localStorage.clear();
    await db.sessions.clear();
  });

  async function create() {
    const fixture = TestBed.createComponent(PracticePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  type F = Awaited<ReturnType<typeof create>>;
  const root = (f: F) => f.nativeElement as HTMLElement;
  const text = (f: F) => root(f).textContent!.replace(/\s+/g, ' ').trim();
  const arena = (f: F) =>
    f.debugElement.query(By.directive(TargetArenaComponent))
      .componentInstance as TargetArenaComponent;
  const hud = (f: F) => root(f).querySelector('.justify-between');
  const results = (f: F) =>
    Array.from(root(f).querySelectorAll('.text-xl')).map((e) =>
      e.textContent!.replace(/\s+/g, ' ').trim(),
    );
  const done = async (f: F, trials: TrialResult[]) => {
    arena(f).sessionCompleted.emit(trials);
    await f.whenStable();
    f.detectChanges();
  };

  it('has a title, a collapsed settings panel and the arena', async () => {
    const f = await create();
    expect(root(f).querySelector('h2')!.textContent!.trim()).toBe('Practice');
    expect(
      root(f).querySelector('mat-expansion-panel-header')!.textContent!.trim(),
    ).toBe('Setting');
    expect(
      root(f).querySelector('mat-expansion-panel')!.classList,
    ).not.toContain('mat-expanded');
    expect(root(f).querySelector('app-practice-setting-form')).not.toBeNull();
    expect(arena(f)).toBeTruthy();
  });

  it('shows neither the progress nor a result before a session', async () => {
    const f = await create();
    expect(hud(f)).toBeNull();
    expect(results(f)).toEqual([]);
  });

  describe('settings', () => {
    it('gives the arena what is set in the store', async () => {
      const store = TestBed.inject(PracticeSettingStore);
      store.set('mode', PracticeMode.Drag);
      store.set('targetCount', 7);
      store.set('rounds', 2);
      store.set('targetWidth', 33);
      store.set('amplitude', 444);
      store.set('dwellTimeMs', 555);
      const f = await create();
      expect(arena(f).settings()).toEqual({
        mode: PracticeMode.Drag,
        targetCount: 7,
        rounds: 2,
        targetWidth: 33,
        amplitude: 444,
        dwellTimeMs: 555,
      });
    });

    it('follows a change of settings', async () => {
      const f = await create();
      TestBed.inject(PracticeSettingStore).set('targetWidth', 99);
      f.detectChanges();
      expect(arena(f).settings().targetWidth).toBe(99);
    });
  });

  describe('during a session', () => {
    it('shows the trial number and the error count, from the start', async () => {
      const f = await create();
      arena(f).sessionStarted.emit({ totalTrials: 27 });
      f.detectChanges();
      expect(hud(f)!.textContent!.replace(/\s+/g, ' ')).toContain(
        'trial 0 / 27',
      );
      expect(hud(f)!.textContent!.replace(/\s+/g, ' ')).toContain('errors: 0');
      expect(hud(f)!.querySelector('mat-icon')!.textContent!.trim()).toBe(
        'error',
      );
    });

    it('follows the progress of each trial', async () => {
      const f = await create();
      arena(f).sessionStarted.emit({ totalTrials: 27 });
      arena(f).trialCompleted.emit({
        result: trial(),
        trialNumber: 4,
        totalTrials: 27,
        errorCount: 2,
      });
      f.detectChanges();
      const s = hud(f)!.textContent!.replace(/\s+/g, ' ');
      expect(s).toContain('trial 4 / 27');
      expect(s).toContain('errors: 2');
    });

    it('starts the counts again, and clears the last result, for the next session', async () => {
      const f = await create();
      arena(f).sessionStarted.emit({ totalTrials: 5 });
      arena(f).trialCompleted.emit({
        result: trial(),
        trialNumber: 5,
        totalTrials: 5,
        errorCount: 3,
      });
      await done(f, [trial()]);
      expect(results(f).length).toBe(4);
      arena(f).sessionStarted.emit({ totalTrials: 9 });
      f.detectChanges();
      expect(results(f)).toEqual([]);
      const s = hud(f)!.textContent!.replace(/\s+/g, ' ');
      expect(s).toContain('trial 0 / 9');
      expect(s).toContain('errors: 0');
    });
  });

  describe('after a session', () => {
    it('hides the progress and shows the four results, in order, with their units', async () => {
      const f = await create();
      arena(f).sessionStarted.emit({ totalTrials: 4 });
      await done(f, [
        trial({
          isError: true,
          movementTimeMs: 1000,
          amplitude: 100,
          targetWidth: 50,
        }),
        trial({ movementTimeMs: 2000, amplitude: 100, targetWidth: 50 }),
        trial({ movementTimeMs: 1000, amplitude: 100, targetWidth: 50 }),
        trial({ movementTimeMs: 1000, amplitude: 100, targetWidth: 50 }),
      ]);
      expect(hud(f)).toBeNull();
      const labels = Array.from(root(f).querySelectorAll('.grid .text-xs')).map(
        (e) => e.textContent!.trim(),
      );
      expect(labels).toEqual([
        'trials',
        'error rate',
        'avg. movement time',
        'throughput',
      ]);
      const r = results(f);
      expect(r[0]).toBe('4');
      expect(r[1]).toBe('25%');
      expect(r[2]).toBe('1,250 ms');
      // log2(100 / 50 + 1) = 1.585 bits over 1.25 s
      expect(r[3]).toBe('1.27 bit/s');
    });

    it('rounds the movement time to whole milliseconds', async () => {
      const f = await create();
      await done(f, [
        trial({ movementTimeMs: 1000 }),
        trial({ movementTimeMs: 1001 }),
      ]);
      expect(results(f)[2]).toBe('1,001 ms');
    });

    it('rounds the error rate to one decimal place', async () => {
      const f = await create();
      await done(f, [trial({ isError: true }), trial(), trial()]);
      expect(results(f)[1]).toBe('33.3%');
    });

    it('stores the session summary with the time it ended', async () => {
      const f = await create();
      spyOn(Date, 'now').and.returnValue(1_700_000_000_000);
      const store = TestBed.inject(PracticeSettingStore);
      store.set('mode', PracticeMode.Drag);
      await done(f, [trial({ isError: true }), trial()]);
      const rows = await db.sessions.toArray();
      expect(rows.length).toBe(1);
      expect(rows[0].timestamp).toBe(1_700_000_000_000);
      expect(rows[0].mode).toBe(PracticeMode.Drag);
      expect(rows[0].trialCount).toBe(2);
      expect(rows[0].errorCount).toBe(1);
      expect(rows[0].targetWidth).toBe(40);
      expect(rows[0].amplitude).toBe(360);
      expect(rows[0].targetCount).toBe(9);
      expect(rows[0].rounds).toBe(3);
      expect(rows[0].id).toBeDefined();
    });

    it('stores each session as its own record', async () => {
      const f = await create();
      await done(f, [trial()]);
      await done(f, [trial(), trial()]);
      const rows = await db.sessions.orderBy('id').toArray();
      expect(rows.map((r) => r.trialCount)).toEqual([1, 2]);
    });
  });
});

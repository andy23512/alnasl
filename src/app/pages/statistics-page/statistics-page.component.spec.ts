import { TestBed } from '@angular/core/testing';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { By } from '@angular/platform-browser';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { db } from '../../db';
import { PracticeMode, SessionSummary } from '../../models/practice.models';
import { StatisticsPageComponent } from './statistics-page.component';

function session(over: Partial<SessionSummary>): Omit<SessionSummary, 'id'> {
  return {
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
    ...over,
  };
}

describe('StatisticsPageComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.sessions.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
  });
  afterEach(async () => {
    await db.sessions.clear();
  });

  async function create() {
    const fixture = TestBed.createComponent(StatisticsPageComponent);
    fixture.detectChanges();
    // Dexie's live query answers asynchronously
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 20));
      fixture.detectChanges();
    }
    return fixture;
  }
  type F = Awaited<ReturnType<typeof create>>;
  const el = (f: F) => f.nativeElement as HTMLElement;
  const options = (f: F) => f.componentInstance.chartOptions()!;
  const series = (f: F) =>
    (options(f).series as { name: string; data: [number, number][] }[]).map(
      (s) => ({
        name: s.name,
        data: s.data,
      }),
    );
  const tip = (f: F, name: string, y: number) =>
    (
      options(f).tooltip!.formatter as unknown as (this: unknown) => string
    ).call({
      series: { name },
      y,
    });
  const toggle = async (f: F, index: number) => {
    const t = f.debugElement.queryAll(By.directive(MatButtonToggle))[index];
    (t.nativeElement.querySelector('button') as HTMLElement).click();
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 20));
    f.detectChanges();
  };

  it('offers throughput, movement time and error rate, with throughput chosen first', async () => {
    const f = await create();
    const ts = f.debugElement.queryAll(By.directive(MatButtonToggle));
    expect(ts.map((t) => t.nativeElement.textContent.trim())).toEqual([
      'Throughput',
      'Movement Time',
      'Error Rate',
    ]);
    expect(ts.map((t) => t.componentInstance.checked)).toEqual([
      true,
      false,
      false,
    ]);
    expect(el(f).querySelector('section span')!.textContent!.trim()).toBe(
      'Metric',
    );
  });

  describe('without any session', () => {
    it('says there is nothing recorded yet, and draws no chart', async () => {
      const f = await create();
      expect(el(f).querySelector('p')!.textContent!.trim()).toBe(
        en['statistics-page']['no-data-message'],
      );
      expect(el(f).querySelector('highcharts-chart')).toBeNull();
    });
  });

  describe('with sessions', () => {
    beforeEach(async () => {
      await db.sessions.bulkAdd([
        session({
          timestamp: 300,
          mode: PracticeMode.Click,
          throughputBitsPerSecond: 5,
          meanMovementTimeMs: 700,
          errorRate: 0.1,
        }),
        session({
          timestamp: 100,
          mode: PracticeMode.Click,
          throughputBitsPerSecond: 3,
          meanMovementTimeMs: 900,
          errorRate: 0.25,
        }),
        session({
          timestamp: 200,
          mode: PracticeMode.Drag,
          throughputBitsPerSecond: 2,
          meanMovementTimeMs: 1500,
          errorRate: 0,
        }),
      ]);
    });

    it('draws a chart instead of the message', async () => {
      const f = await create();
      expect(el(f).querySelector('highcharts-chart')).not.toBeNull();
      expect(el(f).querySelector('p')).toBeNull();
    });

    it('draws a line for each mode that has sessions, named after the mode, oldest first', async () => {
      const f = await create();
      expect(series(f)).toEqual([
        {
          name: 'click',
          data: [
            [100, 3],
            [300, 5],
          ],
        },
        { name: 'drag', data: [[200, 2]] },
      ]);
    });

    it('titles the axis and the tooltip with the unit', async () => {
      const f = await create();
      expect((options(f).yAxis as { title: { text: string } }).title.text).toBe(
        'bit/s',
      );
      expect(tip(f, 'click', 4.567)).toBe('click: 4.57 bit/s');
    });

    it('shows movement time in milliseconds', async () => {
      const f = await create();
      await toggle(f, 1);
      expect(series(f)[0].data).toEqual([
        [100, 900],
        [300, 700],
      ]);
      expect(series(f)[1].data).toEqual([[200, 1500]]);
      expect((options(f).yAxis as { title: { text: string } }).title.text).toBe(
        'ms',
      );
    });

    it('shows the error rate as a percentage', async () => {
      const f = await create();
      await toggle(f, 2);
      expect(series(f)[0].data).toEqual([
        [100, 25],
        [300, 10],
      ]);
      expect(series(f)[1].data).toEqual([[200, 0]]);
      expect((options(f).yAxis as { title: { text: string } }).title.text).toBe(
        '%',
      );
      expect(tip(f, 'drag', 12.5)).toBe('drag: 12.50 %');
    });

    it('goes back to throughput', async () => {
      const f = await create();
      await toggle(f, 2);
      await toggle(f, 0);
      expect(series(f)[0].data).toEqual([
        [100, 3],
        [300, 5],
      ]);
    });

    it('groups lines that are too close together to tell apart', async () => {
      const f = await create();
      const first = (
        options(f).series as { dataGrouping: { groupPixelWidth: number } }[]
      )[0];
      expect(first.dataGrouping.groupPixelWidth).toBe(20);
    });

    it('leaves out modes that have no sessions', async () => {
      const f = await create();
      expect(series(f).map((s) => s.name)).not.toContain('move');
    });

    it('shows time in local time, with an even spacing for time itself', async () => {
      const f = await create();
      expect(options(f).time).toEqual({ useUTC: false });
      expect(
        (options(f).xAxis as { type: string; ordinal: boolean }).type,
      ).toBe('datetime');
      expect((options(f).xAxis as { ordinal: boolean }).ordinal).toBeFalse();
    });

    it('shows a legend', async () => {
      const f = await create();
      expect(options(f).legend!.enabled).toBeTrue();
      expect(options(f).scrollbar!.enabled).toBeFalse();
    });

    it('picks up a session recorded while the page is open', async () => {
      const f = await create();
      await db.sessions.add(
        session({
          timestamp: 400,
          mode: PracticeMode.Move,
          throughputBitsPerSecond: 6,
        }),
      );
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 20));
        f.detectChanges();
      }
      expect(series(f).map((s) => s.name)).toEqual(['move', 'click', 'drag']);
    });

    it('labels the lines with the translated mode names when the language changes', async () => {
      const f = await create();
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('xx', {
        ...en,
        'practice-setting': {
          ...en['practice-setting'],
          mode: { ...en['practice-setting'].mode, click: 'CLICK-XX' },
        },
      });
      translate.use('xx');
      f.detectChanges();
      await new Promise((r) => setTimeout(r, 20));
      f.detectChanges();
      expect(series(f)[0].name).toBe('CLICK-XX');
    });
  });
});

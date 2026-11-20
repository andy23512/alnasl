import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import {
  PracticeMode,
  PracticeSettings,
  TargetPoint,
  TrialResult,
} from '../../models/practice.models';
import { TargetArenaComponent, TrialProgress } from './target-arena.component';

const SETTINGS: PracticeSettings = {
  mode: PracticeMode.Click,
  targetCount: 9,
  rounds: 3,
  targetWidth: 40,
  amplitude: 360,
  dwellTimeMs: 350,
};

describe('TargetArenaComponent', () => {
  let now: number;
  let fixture: ComponentFixture<TargetArenaComponent>;
  let started: { totalTrials: number }[];
  let progress: TrialProgress[];
  let completed: TrialResult[][];

  beforeEach(() => {
    now = 1000;
    spyOn(performance, 'now').and.callFake(() => now);
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
  });

  /** An arena of the given size, at the top left of the page. */
  function create(over: Partial<PracticeSettings> = {}, size = 560) {
    fixture = TestBed.createComponent(TargetArenaComponent);
    fixture.componentRef.setInput('settings', { ...SETTINGS, ...over });
    started = [];
    progress = [];
    completed = [];
    fixture.componentInstance.sessionStarted.subscribe((e) => started.push(e));
    fixture.componentInstance.trialCompleted.subscribe((e) => progress.push(e));
    fixture.componentInstance.sessionCompleted.subscribe((e) =>
      completed.push(e),
    );
    fixture.detectChanges();
    spyOn(arena(), 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 0, size, size),
    );
    return fixture;
  }
  const el = () => fixture.nativeElement as HTMLElement;
  const arena = () => el().querySelector('div') as HTMLDivElement;
  const comp = () => fixture.componentInstance;
  const startButton = () => el().querySelector('button') as HTMLButtonElement;
  const text = () => el().textContent!.replace(/\s+/g, ' ').trim();
  const target = () => comp().targetPoint()!;
  const source = () => comp().sourcePoint()!;
  const start = () => {
    startButton().click();
    fixture.detectChanges();
  };
  const at = (type: string, p: { x: number; y: number }) => {
    const Ctor = type === 'click' ? MouseEvent : PointerEvent;
    arena().dispatchEvent(
      new Ctor(type, { clientX: p.x, clientY: p.y, bubbles: true }),
    );
    fixture.detectChanges();
  };
  const dot = () =>
    el().querySelector('.pointer-events-none') as HTMLElement | null;
  const targetDisc = () =>
    el().querySelector('.bg-alnasl-500') as HTMLElement | null;
  const dashed = () =>
    el().querySelector('.border-dashed') as HTMLElement | null;
  const ring = () =>
    el().querySelector('svg circle') as SVGCircleElement | null;
  const miss = (p: TargetPoint) => ({ x: p.x + 100, y: p.y });

  describe('before it starts', () => {
    it('explains the practice mode and offers to start, showing no target', () => {
      create();
      expect(text()).toContain(en['target-arena']['idle-hint'].click);
      expect(startButton().textContent).toContain('Start');
      expect(targetDisc()).toBeNull();
      expect(comp().phase()).toBe('idle');
    });

    it('explains each of the other modes in turn', () => {
      create({ mode: PracticeMode.Move });
      expect(text()).toContain(en['target-arena']['idle-hint'].move);
      create({ mode: PracticeMode.Drag });
      expect(text()).toContain(en['target-arena']['idle-hint'].drag);
    });

    it('ignores the pointer and clicks', () => {
      create();
      at('click', { x: 280, y: 100 });
      at('pointermove', { x: 280, y: 100 });
      expect(progress).toEqual([]);
      expect(comp().phase()).toBe('idle');
    });
  });

  describe('starting', () => {
    it('tells its parent how many trials there will be (targets × rounds)', () => {
      create();
      start();
      expect(started).toEqual([{ totalTrials: 27 }]);
      expect(comp().phase()).toBe('running');
    });

    it('hides the hint and the button, and shows the first target at the top of the ring', () => {
      create();
      start();
      expect(text()).not.toContain(en['target-arena']['idle-hint'].click);
      expect(startButton()).toBeNull();
      expect(target().x).toBeCloseTo(280, 6);
      expect(target().y).toBeCloseTo(100, 6); // centre 280, radius 180
    });

    it('draws the target with the configured size, centred on its point', () => {
      create({ targetWidth: 60 });
      start();
      const d = targetDisc()!;
      expect(d.style.width).toBe('60px');
      expect(d.style.height).toBe('60px');
      expect(parseFloat(d.style.left)).toBeCloseTo(target().x - 30, 2);
      expect(parseFloat(d.style.top)).toBeCloseTo(target().y - 30, 2);
    });

    it('does not count the click on the start button as a trial', () => {
      create();
      start();
      expect(progress).toEqual([]);
    });

    it('shrinks the ring to fit a small arena, but never below 80', () => {
      create({}, 200);
      start();
      // room for 200 - 40 - 32 = 128, so a radius of 64
      expect(Math.hypot(target().x - 100, target().y - 100)).toBeCloseTo(64, 6);
      create({}, 100);
      start();
      expect(Math.hypot(target().x - 50, target().y - 50)).toBeCloseTo(40, 6);
    });

    it('keeps the configured distance when there is room for it', () => {
      create({ amplitude: 200 });
      start();
      expect(Math.hypot(target().x - 280, target().y - 280)).toBeCloseTo(
        100,
        6,
      );
    });
  });

  describe('click mode', () => {
    beforeEach(() => {
      create();
      start();
    });

    it('does not show the pick-up circle', () => {
      expect(dashed()).toBeNull();
      expect(ring()).toBeNull();
    });

    it('counts a click on the target as a hit and moves on to the next one', () => {
      const first = target();
      now = 1800;
      at('click', first);
      expect(progress.length).toBe(1);
      expect(progress[0].trialNumber).toBe(2);
      expect(progress[0].totalTrials).toBe(27);
      expect(progress[0].errorCount).toBe(0);
      expect(progress[0].result.isError).toBeFalse();
      expect(progress[0].result.movementTimeMs).toBe(800);
      expect(target()).not.toBe(first);
      expect(source().index).toBe(first.index);
    });

    it('counts a click beside the target as an error', () => {
      at('click', miss(target()));
      expect(progress[0].result.isError).toBeTrue();
      expect(progress[0].errorCount).toBe(1);
      at('click', target());
      expect(progress[1].errorCount).toBe(1);
      at('click', miss(target()));
      expect(progress[2].errorCount).toBe(2);
    });

    it('times each trial from when it appeared', () => {
      now = 2000;
      at('click', target());
      now = 2300;
      at('click', target());
      expect(progress.map((p) => p.result.movementTimeMs)).toEqual([1000, 300]);
    });

    it('is a hit on the edge of the target, and an error clearly outside', () => {
      const t = target();
      at('click', { x: t.x, y: t.y + 20 });
      expect(progress[0].result.isError).toBeFalse();
      const t2 = target();
      at('click', { x: t2.x, y: t2.y + 25 }); // the browser rounds a click to whole pixels
      expect(progress[1].result.isError).toBeTrue();
    });

    it('ignores the pointer moving over the arena', () => {
      at('pointermove', target());
      expect(progress).toEqual([]);
    });

    it('ignores presses and releases', () => {
      at('pointerdown', source());
      at('pointerup', target());
      expect(progress).toEqual([]);
    });

    it('marks where the click landed, green for a hit and red for an error, for a moment', fakeAsync(() => {
      const t = target();
      at('click', { x: t.x + 5, y: t.y });
      expect(dot()!.classList).toContain('bg-green-400');
      expect(dot()!.classList).not.toContain('bg-red-400');
      expect(dot()!.style.left).toBe(`${t.x + 5}px`);
      expect(dot()!.style.top).toBe(`${t.y}px`);
      tick(219);
      fixture.detectChanges();
      expect(dot()).not.toBeNull();
      tick(1);
      fixture.detectChanges();
      expect(dot()).toBeNull();
      at('click', miss(target()));
      expect(dot()!.classList).toContain('bg-red-400');
      expect(dot()!.classList).not.toContain('bg-green-400');
      tick(220);
    }));

    it('finishes after the last trial, handing over every result', () => {
      for (let i = 0; i < 27; i++) {
        expect(comp().phase()).toBe('running');
        at('click', target());
      }
      expect(comp().phase()).toBe('finished');
      expect(progress.length).toBe(27);
      expect(progress.at(-1)!.trialNumber).toBe(27);
      expect(progress.at(-1)!.totalTrials).toBe(27);
      expect(completed.length).toBe(1);
      expect(completed[0].length).toBe(27);
      expect(completed[0].map((r) => r.index)).toEqual([...Array(27).keys()]);
    });

    it('counts errors up to the very last trial', () => {
      for (let i = 0; i < 26; i++) at('click', target());
      at('click', miss(target()));
      expect(progress.at(-1)!.errorCount).toBe(1);
    });

    it('shows a finished message with a button to practise again, and no target', () => {
      for (let i = 0; i < 27; i++) at('click', target());
      expect(text()).toContain(en['target-arena']['finished-message']);
      expect(startButton().textContent).toContain('Practice Again');
      expect(targetDisc()).toBeNull();
    });

    it('ignores clicks once finished', () => {
      for (let i = 0; i < 27; i++) at('click', target());
      at('click', { x: 280, y: 100 });
      expect(progress.length).toBe(27);
    });

    it('starts over, with the counts back at zero', () => {
      for (let i = 0; i < 27; i++) at('click', miss(target()));
      expect(progress.at(-1)!.errorCount).toBe(27);
      start();
      expect(started.length).toBe(2);
      expect(comp().phase()).toBe('running');
      at('click', target());
      expect(progress.at(-1)!.errorCount).toBe(0);
      expect(progress.at(-1)!.trialNumber).toBe(2);
    });
  });

  describe('arena position', () => {
    it('measures the pointer from the corner of the arena, not of the page', () => {
      create();
      (arena().getBoundingClientRect as jasmine.Spy).and.returnValue(
        new DOMRect(50, 70, 560, 560),
      );
      start();
      const t = target();
      arena().dispatchEvent(
        new MouseEvent('click', {
          clientX: t.x + 50,
          clientY: t.y + 70,
          bubbles: true,
        }),
      );
      expect(progress[0].result.isError).toBeFalse();
    });
  });

  describe('move mode', () => {
    beforeEach(() => {
      create({ mode: PracticeMode.Move, dwellTimeMs: 400 });
      start();
    });

    it('shows a progress ring on the target, empty at first', () => {
      expect(ring()!.getAttribute('stroke-dashoffset')).toBe('100');
      expect(dashed()).toBeNull();
    });

    it('ignores clicks', () => {
      at('click', target());
      expect(progress).toEqual([]);
    });

    it('fills the ring while the pointer stays on the target, and pulses', () => {
      const t = target();
      at('pointermove', t);
      expect(comp().dwellProgress()).toBe(0);
      expect(comp().dwelling()).toBeTrue();
      expect(targetDisc()!.classList).toContain('animate-pulse');
      now = 1200;
      at('pointermove', t);
      expect(comp().dwellProgress()).toBeCloseTo(0.5, 6);
      expect(Number(ring()!.getAttribute('stroke-dashoffset'))).toBeCloseTo(
        50,
        6,
      );
      expect(progress).toEqual([]);
    });

    it('completes the trial once the pointer has stayed for the hold time', () => {
      const t = target();
      at('pointermove', t);
      now = 1399;
      at('pointermove', t);
      expect(progress).toEqual([]);
      now = 1400;
      at('pointermove', t);
      expect(progress.length).toBe(1);
      expect(progress[0].result.isError).toBeFalse();
      expect(progress[0].result.movementTimeMs).toBe(400);
      expect(progress[0].trialNumber).toBe(2);
      expect(comp().dwellProgress()).toBe(0);
      expect(comp().dwelling()).toBeFalse();
    });

    it('starts the hold again if the pointer leaves the target', () => {
      const t = target();
      at('pointermove', t);
      now = 1300;
      at('pointermove', t);
      expect(comp().dwellProgress()).toBeGreaterThan(0);
      at('pointermove', miss(t));
      expect(comp().dwellProgress()).toBe(0);
      expect(comp().dwelling()).toBeFalse();
      expect(targetDisc()!.classList).not.toContain('animate-pulse');
      now = 1600;
      at('pointermove', t);
      expect(comp().dwellProgress()).toBe(0); // counting from now, not from before
      now = 1900;
      at('pointermove', t);
      expect(progress).toEqual([]);
    });

    it('counts the hold from the first moment on the target, and starts the next one afresh', () => {
      const t = target();
      at('pointermove', t);
      now = 1400;
      at('pointermove', t);
      const next = target();
      now = 1500;
      at('pointermove', next);
      expect(comp().dwellProgress()).toBe(0);
    });

    it('does not count the pointer beside the target, even close to it', () => {
      const t = target();
      at('pointermove', { x: t.x + 30, y: t.y }); // radius is 20
      expect(comp().dwelling()).toBeFalse();
      expect(comp().dwellProgress()).toBe(0);
    });

    it('does not move on while the pointer is off the target', () => {
      now = 5000;
      at('pointermove', miss(target()));
      expect(progress).toEqual([]);
    });
  });

  describe('drag mode', () => {
    beforeEach(() => {
      create({ mode: PracticeMode.Drag });
      start();
    });

    it('shows the pick-up circle, dashed, where the trial starts, besides the target', () => {
      const s = source();
      expect(dashed()).not.toBeNull();
      expect(parseFloat(dashed()!.style.left)).toBeCloseTo(s.x - 20, 2);
      expect(parseFloat(dashed()!.style.top)).toBeCloseTo(s.y - 20, 2);
      expect(dashed()!.style.width).toBe('40px');
      expect(targetDisc()).not.toBeNull();
      expect(ring()).toBeNull();
    });

    it('ignores clicks', () => {
      at('click', source());
      at('click', target());
      expect(progress).toEqual([]);
    });

    it('does not start when the press is outside the pick-up circle', () => {
      const s = source();
      at('pointerdown', { x: s.x + 21, y: s.y });
      at('pointerup', target());
      expect(progress).toEqual([]);
    });

    it('starts when pressed on the pick-up circle, even at its edge', () => {
      const s = source();
      at('pointerdown', { x: s.x, y: s.y + 20 });
      at('pointerup', target());
      expect(progress.length).toBe(1);
    });

    it('does not finish without a press first', () => {
      at('pointerup', target());
      expect(progress).toEqual([]);
    });

    it('completes the trial when released, timed from the press', () => {
      const s = source();
      now = 2000;
      at('pointerdown', s);
      now = 2900;
      at('pointerup', target());
      expect(progress.length).toBe(1);
      expect(progress[0].result.movementTimeMs).toBe(900);
      expect(progress[0].result.isError).toBeFalse();
      expect(progress[0].trialNumber).toBe(2);
    });

    it('is an error when released away from the target', () => {
      at('pointerdown', source());
      at('pointerup', miss(target()));
      expect(progress[0].result.isError).toBeTrue();
      expect(progress[0].errorCount).toBe(1);
    });

    it('adds up the path travelled while pressed', () => {
      const s = source();
      at('pointerdown', s);
      at('pointermove', { x: s.x + 300, y: s.y });
      at('pointermove', { x: s.x + 300, y: s.y + 400 });
      at('pointerup', target());
      expect(progress[0].result.pathLength).toBeCloseTo(700, 6);
    });

    it('does not count movement before the press', () => {
      const s = source();
      at('pointermove', { x: s.x + 1000, y: s.y });
      at('pointerdown', s);
      at('pointerup', target());
      expect(progress[0].result.pathLength).toBeCloseTo(
        progress[0].result.amplitude,
        6,
      );
    });

    it('does not count movement after the release', () => {
      const s = source();
      at('pointerdown', s);
      at('pointerup', target());
      const t = target();
      at('pointermove', { x: t.x + 1000, y: t.y });
      at('pointerdown', source());
      at('pointerup', target());
      expect(progress[1].result.pathLength).toBeCloseTo(
        progress[1].result.amplitude,
        6,
      );
    });

    it('counts a release only once', () => {
      at('pointerdown', source());
      at('pointerup', target());
      at('pointerup', target());
      expect(progress.length).toBe(1);
    });

    it('moves the pick-up circle to where the last target was', () => {
      const first = target();
      at('pointerdown', source());
      at('pointerup', first);
      expect(source().index).toBe(first.index);
    });

    it('finishes after every trial has been dragged', () => {
      for (let i = 0; i < 27; i++) {
        at('pointerdown', source());
        at('pointerup', target());
      }
      expect(comp().phase()).toBe('finished');
      expect(completed[0].length).toBe(27);
      expect(dashed()).toBeNull();
    });

    it('forgets an unfinished drag when started over', () => {
      at('pointerdown', source());
      for (let i = 0; i < 26; i++) {
        at('pointerup', target());
        at('pointerdown', source());
      }
      at('pointerup', target());
      start();
      at('pointerup', target()); // no press since starting over
      expect(progress.length).toBe(27);
    });
  });
});

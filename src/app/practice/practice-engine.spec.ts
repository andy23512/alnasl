import { PracticeMode, PracticeSettings } from '../models/practice.models';
import { PracticeEngine } from './practice-engine';

const SETTINGS: PracticeSettings = {
  mode: PracticeMode.Click,
  targetCount: 5,
  rounds: 2,
  targetWidth: 40,
  amplitude: 100,
  dwellTimeMs: 350,
};

describe('PracticeEngine', () => {
  function create(over: Partial<PracticeSettings> = {}) {
    return new PracticeEngine({ ...SETTINGS, ...over }, { x: 0, y: 0 });
  }

  describe('layout', () => {
    it('lays the targets on a ring around the centre', () => {
      const e = new PracticeEngine(SETTINGS, { x: 10, y: 20 });
      expect(e.positions.length).toBe(5);
      expect(e.positions[0].x).toBeCloseTo(10, 6);
      expect(e.positions[0].y).toBeCloseTo(20 - 50, 6);
    });

    it('visits the targets in the ISO order, for the given rounds', () => {
      const e = create();
      expect(e.sequence).toEqual([0, 2, 4, 1, 3, 0, 2, 4, 1, 3]);
      expect(e.totalTrials).toBe(10);
      expect(e.startIndex).toBe(3);
    });
  });

  describe('progress', () => {
    it('starts at trial 1, not finished', () => {
      const e = create();
      expect(e.currentTrialNumber).toBe(1);
      expect(e.isFinished).toBeFalse();
    });

    it('moves from the start target to the first target', () => {
      const e = create();
      expect(e.sourcePoint).toBe(e.positions[3]);
      expect(e.targetPoint).toBe(e.positions[0]);
    });

    it('then from each target to the next one', () => {
      const e = create();
      e.startTrial(0);
      e.completeTrial(100, 0, 0);
      expect(e.currentTrialNumber).toBe(2);
      expect(e.sourcePoint).toBe(e.positions[0]);
      expect(e.targetPoint).toBe(e.positions[2]);
      e.startTrial(100);
      e.completeTrial(200, 0, 0);
      expect(e.sourcePoint).toBe(e.positions[2]);
      expect(e.targetPoint).toBe(e.positions[4]);
    });

    it('finishes after the last trial, and the trial number stops at the total', () => {
      const e = create({ rounds: 1 });
      for (let i = 0; i < 5; i++) {
        expect(e.isFinished).toBeFalse();
        e.startTrial(i * 100);
        e.completeTrial(i * 100 + 50, 0, 0);
      }
      expect(e.isFinished).toBeTrue();
      expect(e.currentTrialNumber).toBe(5);
      expect(e.results.length).toBe(5);
    });
  });

  describe('a finished trial', () => {
    it('records where it went from, to, and how, with its index', () => {
      const e = create({ mode: PracticeMode.Drag, targetWidth: 30 });
      const from = e.sourcePoint;
      const to = e.targetPoint;
      e.startTrial(0);
      const r = e.completeTrial(100, to.x + 1, to.y + 2);
      expect(r).toBe(e.results[0]);
      expect(r.index).toBe(0);
      expect(r.mode).toBe(PracticeMode.Drag);
      expect([r.startX, r.startY]).toEqual([from.x, from.y]);
      expect([r.targetX, r.targetY]).toEqual([to.x, to.y]);
      expect([r.endX, r.endY]).toEqual([to.x + 1, to.y + 2]);
      expect(r.targetWidth).toBe(30);
      expect(r.amplitude).toBeCloseTo(
        Math.hypot(to.x - from.x, to.y - from.y),
        10,
      );
      e.startTrial(100);
      expect(e.completeTrial(200, 0, 0).index).toBe(1);
    });

    it('measures the time from the start of the trial', () => {
      const e = create();
      e.startTrial(1000);
      expect(e.completeTrial(1750, 0, 0).movementTimeMs).toBe(750);
    });

    it('never gives a negative time', () => {
      const e = create();
      e.startTrial(1000);
      expect(e.completeTrial(900, 0, 0).movementTimeMs).toBe(0);
    });

    it('is a hit within half the target width of its centre, an error beyond that', () => {
      const e = create({ targetWidth: 40 });
      const t = e.targetPoint;
      e.startTrial(0);
      // the first target is at (0, -50), so this distance is exactly 20
      expect(e.completeTrial(1, t.x, t.y + 20).isError).toBeFalse();
      const next = e.targetPoint;
      e.startTrial(1);
      expect(e.completeTrial(2, next.x, next.y).isError).toBeFalse();
    });

    it('is an error when it ends outside the target', () => {
      const e = create({ targetWidth: 40 });
      const t = e.targetPoint;
      e.startTrial(0);
      expect(e.completeTrial(1, t.x, t.y + 20.5).isError).toBeTrue();
      e.startTrial(1);
      expect(e.completeTrial(2, t.x + 100, t.y).isError).toBeTrue();
    });

    it('uses the straight distance as the path length when nothing was tracked', () => {
      const e = create();
      e.startTrial(0);
      const r = e.completeTrial(1, 0, 0);
      expect(r.pathLength).toBeCloseTo(r.amplitude, 10);
    });

    it('adds up the tracked path, from the start target', () => {
      const e = create();
      const s = e.sourcePoint;
      e.startTrial(0);
      e.trackPathPoint(s.x + 300, s.y);
      e.trackPathPoint(s.x + 300, s.y + 400);
      expect(e.completeTrial(1, 0, 0).pathLength).toBeCloseTo(700, 10);
    });

    it('never has a path shorter than the straight distance', () => {
      const e = create();
      const s = e.sourcePoint;
      e.startTrial(0);
      e.trackPathPoint(s.x + 1, s.y);
      const r = e.completeTrial(1, 0, 0);
      expect(r.pathLength).toBeCloseTo(r.amplitude, 10);
    });

    it('starts the path afresh for each trial', () => {
      const e = create();
      const s = e.sourcePoint;
      e.startTrial(0);
      e.trackPathPoint(s.x + 1000, s.y);
      e.completeTrial(1, 0, 0);
      e.startTrial(1);
      const second = e.completeTrial(2, 0, 0);
      expect(second.pathLength).toBeCloseTo(second.amplitude, 10);
    });

    it('ignores a tracked point from before the trial started when measuring the first step', () => {
      const e = create();
      e.trackPathPoint(500, 500);
      e.startTrial(0);
      const s = e.sourcePoint;
      e.trackPathPoint(s.x, s.y + 400);
      expect(e.completeTrial(1, 0, 0).pathLength).toBeCloseTo(400, 10);
    });
  });
});

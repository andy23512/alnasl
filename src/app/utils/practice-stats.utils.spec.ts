import {
  PracticeMode,
  PracticeSettings,
  TrialResult,
} from '../models/practice.models';
import { summarizeTrials } from './practice-stats.utils';

const SETTINGS: PracticeSettings = {
  mode: PracticeMode.Drag,
  targetCount: 9,
  rounds: 3,
  targetWidth: 40,
  amplitude: 360,
  dwellTimeMs: 350,
};

function trial(over: Partial<TrialResult>): TrialResult {
  return {
    index: 0,
    mode: PracticeMode.Drag,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
    targetWidth: 50,
    amplitude: 100,
    endX: 0,
    endY: 0,
    movementTimeMs: 1000,
    isError: false,
    pathLength: 100,
    ...over,
  };
}

describe('summarizeTrials', () => {
  it('copies the settings of the session', () => {
    const s = summarizeTrials([trial({})], SETTINGS);
    expect(s.mode).toBe(PracticeMode.Drag);
    expect(s.targetWidth).toBe(40);
    expect(s.amplitude).toBe(360);
    expect(s.targetCount).toBe(9);
    expect(s.rounds).toBe(3);
  });

  it('counts trials, errors and the error rate', () => {
    const s = summarizeTrials(
      [trial({ isError: true }), trial({}), trial({}), trial({})],
      SETTINGS,
    );
    expect(s.trialCount).toBe(4);
    expect(s.errorCount).toBe(1);
    expect(s.errorRate).toBe(0.25);
    expect(summarizeTrials([trial({}), trial({})], SETTINGS).errorCount).toBe(
      0,
    );
    expect(
      summarizeTrials(
        [trial({ isError: true }), trial({ isError: true })],
        SETTINGS,
      ).errorRate,
    ).toBe(1);
  });

  it('averages the movement time', () => {
    const s = summarizeTrials(
      [trial({ movementTimeMs: 500 }), trial({ movementTimeMs: 1500 })],
      SETTINGS,
    );
    expect(s.meanMovementTimeMs).toBe(1000);
  });

  it('calculates throughput as mean Shannon index of difficulty over mean time in seconds', () => {
    const s = summarizeTrials(
      [
        trial({ amplitude: 100, targetWidth: 50, movementTimeMs: 500 }),
        trial({ amplitude: 300, targetWidth: 100, movementTimeMs: 1500 }),
      ],
      SETTINGS,
    );
    // ID = log2(A / W + 1): log2(3) and log2(4) = 2
    const meanId = (Math.log2(3) + 2) / 2;
    expect(s.throughputBitsPerSecond).toBeCloseTo(meanId / 1, 10);
  });

  it('is faster, so higher, for shorter times', () => {
    const slow = summarizeTrials([trial({ movementTimeMs: 2000 })], SETTINGS);
    const fast = summarizeTrials([trial({ movementTimeMs: 500 })], SETTINGS);
    expect(fast.throughputBitsPerSecond).toBeCloseTo(
      slow.throughputBitsPerSecond * 4,
      10,
    );
  });

  it('gives 0 for everything measured when there are no trials', () => {
    const s = summarizeTrials([], SETTINGS);
    expect(s.trialCount).toBe(0);
    expect(s.errorCount).toBe(0);
    expect(s.errorRate).toBe(0);
    expect(s.meanMovementTimeMs).toBe(0);
    expect(s.throughputBitsPerSecond).toBe(0);
  });

  it('gives a throughput of 0, not infinity, when no time passed', () => {
    const s = summarizeTrials([trial({ movementTimeMs: 0 })], SETTINGS);
    expect(s.throughputBitsPerSecond).toBe(0);
  });

  it('does not include the id or timestamp, which are added when it is stored', () => {
    const s = summarizeTrials([trial({})], SETTINGS) as Record<string, unknown>;
    expect('id' in s).toBeFalse();
    expect('timestamp' in s).toBeFalse();
  });
});

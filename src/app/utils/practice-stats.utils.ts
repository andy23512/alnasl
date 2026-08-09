import { PracticeSettings, SessionSummary, TrialResult } from '../models/practice.models';

/**
 * Summarizes a completed session using the Shannon formulation of Fitts's law:
 * ID = log2(A/W + 1), throughput (bits/s) = mean(ID) / mean(movement time in seconds).
 */
export function summarizeTrials(
  trials: TrialResult[],
  settings: PracticeSettings,
): Omit<SessionSummary, 'id' | 'timestamp'> {
  const trialCount = trials.length;
  const errorCount = trials.filter((t) => t.isError).length;
  const meanMovementTimeMs = trialCount
    ? trials.reduce((sum, t) => sum + t.movementTimeMs, 0) / trialCount
    : 0;
  const meanIndexOfDifficulty = trialCount
    ? trials.reduce(
        (sum, t) => sum + Math.log2(t.amplitude / t.targetWidth + 1),
        0,
      ) / trialCount
    : 0;
  const meanMovementTimeSeconds = meanMovementTimeMs / 1000;
  const throughputBitsPerSecond =
    meanMovementTimeSeconds > 0
      ? meanIndexOfDifficulty / meanMovementTimeSeconds
      : 0;

  return {
    mode: settings.mode,
    targetWidth: settings.targetWidth,
    amplitude: settings.amplitude,
    targetCount: settings.targetCount,
    rounds: settings.rounds,
    trialCount,
    errorCount,
    errorRate: trialCount ? errorCount / trialCount : 0,
    meanMovementTimeMs,
    throughputBitsPerSecond,
  };
}

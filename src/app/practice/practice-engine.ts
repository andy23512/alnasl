import { PracticeSettings, TargetPoint, TrialResult } from '../models/practice.models';
import { generateTargetPositions, generateTrialSequence } from '../utils/target-sequence.utils';

/**
 * Framework-agnostic stepper for a ring-based (ISO 9241-9 style) pointing session.
 * The host component drives it with DOM timestamps/coordinates and reads
 * `sourcePoint`/`targetPoint` to know what to render next.
 */
export class PracticeEngine {
  readonly positions: TargetPoint[];
  readonly sequence: number[];
  readonly startIndex: number;
  readonly results: TrialResult[] = [];

  private stepIndex = 0;
  private trialStartTime = 0;
  private pathLength = 0;
  private lastPathPoint: { x: number; y: number } | null = null;

  constructor(
    private readonly settings: PracticeSettings,
    center: { x: number; y: number },
  ) {
    this.positions = generateTargetPositions(
      center,
      settings.targetCount,
      settings.amplitude,
    );
    const { startIndex, targets } = generateTrialSequence(
      settings.targetCount,
      settings.rounds,
    );
    this.startIndex = startIndex;
    this.sequence = targets;
  }

  get totalTrials(): number {
    return this.sequence.length;
  }

  get currentTrialNumber(): number {
    return Math.min(this.stepIndex + 1, this.totalTrials);
  }

  get isFinished(): boolean {
    return this.stepIndex >= this.sequence.length;
  }

  get sourcePoint(): TargetPoint {
    const idx = this.stepIndex === 0 ? this.startIndex : this.sequence[this.stepIndex - 1];
    return this.positions[idx];
  }

  get targetPoint(): TargetPoint {
    return this.positions[this.sequence[this.stepIndex]];
  }

  /** Marks the beginning of the current trial's measured movement time. */
  startTrial(now: number): void {
    this.trialStartTime = now;
    this.pathLength = 0;
    this.lastPathPoint = this.sourcePoint;
  }

  /** Accumulates travelled distance; used for the drag mode's path-length stat. */
  trackPathPoint(x: number, y: number): void {
    if (this.lastPathPoint) {
      this.pathLength += Math.hypot(
        x - this.lastPathPoint.x,
        y - this.lastPathPoint.y,
      );
    }
    this.lastPathPoint = { x, y };
  }

  completeTrial(now: number, endX: number, endY: number): TrialResult {
    const target = this.targetPoint;
    const source = this.sourcePoint;
    const distanceFromCenter = Math.hypot(endX - target.x, endY - target.y);
    const amplitude = Math.hypot(target.x - source.x, target.y - source.y);
    const result: TrialResult = {
      index: this.stepIndex,
      mode: this.settings.mode,
      startX: source.x,
      startY: source.y,
      targetX: target.x,
      targetY: target.y,
      targetWidth: this.settings.targetWidth,
      amplitude,
      endX,
      endY,
      movementTimeMs: Math.max(0, now - this.trialStartTime),
      isError: distanceFromCenter > this.settings.targetWidth / 2,
      pathLength: Math.max(this.pathLength, amplitude),
    };
    this.results.push(result);
    this.stepIndex++;
    return result;
  }
}

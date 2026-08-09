export enum PracticeMode {
  Move = 'move',
  Click = 'click',
  Drag = 'drag',
}

export interface PracticeSettings {
  mode: PracticeMode;
  targetCount: number;
  rounds: number;
  targetWidth: number;
  amplitude: number;
  dwellTimeMs: number;
}

export interface TargetPoint {
  index: number;
  x: number;
  y: number;
}

export interface TrialResult {
  index: number;
  mode: PracticeMode;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetWidth: number;
  amplitude: number;
  endX: number;
  endY: number;
  movementTimeMs: number;
  isError: boolean;
  pathLength: number;
}

export interface SessionSummary {
  id?: number;
  timestamp: number;
  mode: PracticeMode;
  targetWidth: number;
  amplitude: number;
  targetCount: number;
  rounds: number;
  trialCount: number;
  errorCount: number;
  errorRate: number;
  meanMovementTimeMs: number;
  throughputBitsPerSecond: number;
}

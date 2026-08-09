import { TargetPoint } from '../models/practice.models';

/**
 * Lays out `targetCount` points evenly around a circle of diameter `amplitude`,
 * starting at the top and going clockwise (ISO 9241-9 style ring layout).
 */
export function generateTargetPositions(
  center: { x: number; y: number },
  targetCount: number,
  amplitude: number,
): TargetPoint[] {
  const radius = amplitude / 2;
  const positions: TargetPoint[] = [];
  for (let i = 0; i < targetCount; i++) {
    const angle = (2 * Math.PI * i) / targetCount - Math.PI / 2;
    positions.push({
      index: i,
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return positions;
}

/**
 * Generates the classic ISO 9241-9 "each-to-near-opposite" visiting order: jumping
 * by roughly half the ring each step maximizes movement amplitude and keeps the next
 * target's direction unpredictable. `targetCount` should be odd so every index is
 * visited before the walk repeats.
 */
export function generateTrialSequence(
  targetCount: number,
  rounds: number,
): { startIndex: number; targets: number[] } {
  const step = Math.floor(targetCount / 2);
  const targets: number[] = [];
  let current = 0;
  for (let i = 0; i < targetCount * rounds; i++) {
    targets.push(current);
    current = (current + step) % targetCount;
  }
  const startIndex = (targets[0] - step + targetCount) % targetCount;
  return { startIndex, targets };
}

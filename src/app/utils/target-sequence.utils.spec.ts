import {
  generateTargetPositions,
  generateTrialSequence,
} from './target-sequence.utils';

describe('generateTargetPositions', () => {
  it('puts the first target at the top and goes clockwise', () => {
    const p = generateTargetPositions({ x: 100, y: 200 }, 4, 100);
    expect(p.map((t) => t.index)).toEqual([0, 1, 2, 3]);
    const at = (i: number) => [Math.round(p[i].x), Math.round(p[i].y)];
    expect(at(0)).toEqual([100, 150]); // top (the screen's y grows downwards)
    expect(at(1)).toEqual([150, 200]); // right
    expect(at(2)).toEqual([100, 250]); // bottom
    expect(at(3)).toEqual([50, 200]); // left
  });

  it('spreads the targets on a circle whose diameter is the amplitude', () => {
    const c = { x: 30, y: -20 };
    const p = generateTargetPositions(c, 9, 360);
    expect(p.length).toBe(9);
    for (const t of p) {
      expect(Math.hypot(t.x - c.x, t.y - c.y)).toBeCloseTo(180, 6);
    }
  });

  it('spaces the targets evenly', () => {
    const p = generateTargetPositions({ x: 0, y: 0 }, 9, 360);
    const gap = (a: number, b: number) =>
      Math.hypot(p[a].x - p[b].x, p[a].y - p[b].y);
    for (let i = 0; i < 9; i++) {
      expect(gap(i, (i + 1) % 9)).toBeCloseTo(gap(0, 1), 6);
    }
  });

  it('makes opposite targets of an even ring exactly one amplitude apart', () => {
    const p = generateTargetPositions({ x: 0, y: 0 }, 8, 250);
    expect(Math.hypot(p[0].x - p[4].x, p[0].y - p[4].y)).toBeCloseTo(250, 6);
  });

  it('gives no targets for a count of zero', () => {
    expect(generateTargetPositions({ x: 0, y: 0 }, 0, 100)).toEqual([]);
  });
});

describe('generateTrialSequence', () => {
  it('jumps about half way round the ring each time', () => {
    expect(generateTrialSequence(9, 1).targets).toEqual([
      0, 4, 8, 3, 7, 2, 6, 1, 5,
    ]);
    expect(generateTrialSequence(5, 1).targets).toEqual([0, 2, 4, 1, 3]);
  });

  it('visits every target once per round, for an odd count', () => {
    const { targets } = generateTrialSequence(9, 1);
    expect([...targets].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it('repeats the walk for each round', () => {
    const one = generateTrialSequence(9, 1).targets;
    const three = generateTrialSequence(9, 3).targets;
    expect(three.length).toBe(27);
    expect(three).toEqual([...one, ...one, ...one]);
  });

  it('starts from the target the walk would have come from, so every trial has a source', () => {
    expect(generateTrialSequence(9, 3).startIndex).toBe(5);
    expect(generateTrialSequence(5, 1).startIndex).toBe(3);
    // for an odd ring this is the last target of a round
    const { targets, startIndex } = generateTrialSequence(7, 2);
    expect(startIndex).toBe(targets[6]);
  });

  it('has no trials without rounds', () => {
    expect(generateTrialSequence(9, 0).targets).toEqual([]);
  });
});

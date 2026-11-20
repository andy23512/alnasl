import { RealTitleCasePipe } from './real-title-case.pipe';

describe('RealTitleCasePipe', () => {
  it('turns a text into a title', () => {
    expect(new RealTitleCasePipe().transform('war and peace')).toBe(
      'War and Peace',
    );
  });
});

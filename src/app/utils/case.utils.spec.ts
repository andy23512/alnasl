import { toTitleCase } from './case.utils';

describe('toTitleCase', () => {
  it('capitalizes each word', () => {
    expect(toTitleCase('practice settings')).toBe('Practice Settings');
  });

  it('keeps small words small in the middle of a title', () => {
    expect(toTitleCase('war and peace')).toBe('War and Peace');
    expect(toTitleCase('the lord of the rings')).toBe('The Lord of the Rings');
    expect(toTitleCase('turn on the light')).toBe('Turn on the Light');
  });

  it('knows every small word in the list', () => {
    for (const w of [
      'a',
      'an',
      'and',
      'as',
      'at',
      'but',
      'by',
      'for',
      'in',
      'nor',
      'of',
      'on',
      'or',
      'the',
      'to',
      'up',
    ]) {
      expect(toTitleCase(`go ${w} go`))
        .withContext(w)
        .toBe(`Go ${w} Go`);
    }
  });

  it('lets other short words be capitalized', () => {
    expect(toTitleCase('go with it')).toBe('Go With It');
  });

  it('capitalizes a small word at the start or the end', () => {
    expect(toTitleCase('the end')).toBe('The End');
    expect(toTitleCase('what is it for')).toBe('What Is It For');
    expect(toTitleCase('of')).toBe('Of');
  });

  it('lowercases a small word in the middle even when it was written in capitals', () => {
    expect(toTitleCase('Click AND Drag')).toBe('Click and Drag');
  });

  it('leaves the rest of each word as it is', () => {
    expect(toTitleCase('use wORLD api')).toBe('Use WORLD Api');
  });

  it('keeps the spaces as they are', () => {
    expect(toTitleCase('a  b')).toBe('A  B');
    expect(toTitleCase(' go ')).toBe(' Go ');
  });

  it('gives an empty string for an empty string', () => {
    expect(toTitleCase('')).toBe('');
  });
});

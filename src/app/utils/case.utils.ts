const STOP_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up']);

export function toTitleCase(value: string): string {
  const words = value.split(' ');
  return words
    .map((word, index) => {
      if (!word) {
        return word;
      }
      if (index !== 0 && index !== words.length - 1 && STOP_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

import { sanitizeText } from './sanitize';

describe('sanitizeText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeText('<b>hello</b>')).toBe('hello');
    expect(sanitizeText('<img src=x onerror=alert(1)>nice photo')).toBe('nice photo');
  });

  it('neutralizes a script payload', () => {
    expect(sanitizeText('<script>alert("xss")</script>caption')).toBe('alert("xss")caption');
  });

  it('removes stray angle brackets', () => {
    expect(sanitizeText('2 < 3 and 5 > 4')).toBe('2  3 and 5  4');
  });

  it('passes through clean text and trims', () => {
    expect(sanitizeText('  Golden hour over Patagonia  ')).toBe('Golden hour over Patagonia');
  });

  it('recurses into arrays', () => {
    expect(sanitizeText(['<i>a</i>', 'b'])).toEqual(['a', 'b']);
  });

  it('leaves non-strings untouched', () => {
    expect(sanitizeText(42)).toBe(42);
    expect(sanitizeText(undefined)).toBeUndefined();
  });
});

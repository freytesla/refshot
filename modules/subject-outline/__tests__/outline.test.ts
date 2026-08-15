import { normalizeOutlineResult, generateOutline } from '../index';

describe('normalizeOutlineResult', () => {
  it('passes through a successful result', () => {
    const result = normalizeOutlineResult({
      outputUri: 'file:///outline.png',
      type: 'person',
      error: '',
    });
    expect(result).toEqual({ outputUri: 'file:///outline.png', type: 'person', error: null });
  });

  it('maps empty outputUri to null', () => {
    const result = normalizeOutlineResult({ outputUri: '', type: 'contour', error: '' });
    expect(result.outputUri).toBeNull();
    expect(result.type).toBe('contour');
  });

  it('falls back gracefully on malformed input', () => {
    const result = normalizeOutlineResult(null);
    expect(result).toEqual({ outputUri: null, type: 'fallback', error: null });
  });

  it('keeps error string when present', () => {
    const result = normalizeOutlineResult({ outputUri: '', type: 'fallback', error: 'boom' });
    expect(result.error).toBe('boom');
  });
});

describe('generateOutline without native module', () => {
  it('resolves to a fallback result instead of throwing', async () => {
    const result = await generateOutline({
      sourceUri: 'file:///in.jpg',
      outputUri: 'file:///out.png',
    });
    expect(result.outputUri).toBeNull();
    expect(result.type).toBe('fallback');
    expect(result.error).toBeTruthy();
  });
});

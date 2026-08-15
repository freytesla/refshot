import {
  clamp,
  clampDivider,
  clampOverlayScale,
  containScale,
  coverScale,
  MAX_OVERLAY_SCALE,
  MIN_OVERLAY_SCALE,
} from '../geometry';

describe('clamp', () => {
  it('bounds values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('coverScale', () => {
  it('scales up to cover wider container', () => {
    expect(coverScale({ width: 100, height: 200 }, { width: 200, height: 200 })).toBe(2);
  });
  it('scales up to cover taller container', () => {
    expect(coverScale({ width: 200, height: 100 }, { width: 200, height: 200 })).toBe(2);
  });
  it('returns 1 on invalid sizes', () => {
    expect(coverScale({ width: 0, height: 100 }, { width: 200, height: 200 })).toBe(1);
  });
});

describe('containScale', () => {
  it('fits image inside container', () => {
    expect(containScale({ width: 200, height: 100 }, { width: 200, height: 200 })).toBe(1);
    expect(containScale({ width: 400, height: 100 }, { width: 200, height: 200 })).toBe(0.5);
  });
});

describe('overlay scale bounds', () => {
  it('clamps to configured min/max', () => {
    expect(clampOverlayScale(0.01)).toBe(MIN_OVERLAY_SCALE);
    expect(clampOverlayScale(100)).toBe(MAX_OVERLAY_SCALE);
    expect(clampOverlayScale(2)).toBe(2);
  });
});

describe('clampDivider', () => {
  it('keeps divider handle inside the stage', () => {
    expect(clampDivider(0)).toBe(0.05);
    expect(clampDivider(1)).toBe(0.95);
    expect(clampDivider(0.5)).toBe(0.5);
  });
});

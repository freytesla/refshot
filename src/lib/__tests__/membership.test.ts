import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  grantProTrial,
  getMembership,
  isProActive,
  Membership,
  unlockPro,
} from '../membership';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const make = (isPro: boolean, proExpiresAt: number | null): Membership => ({ isPro, proExpiresAt });

describe('isProActive', () => {
  it('free is not active', () => {
    expect(isProActive(make(false, null))).toBe(false);
  });
  it('lifetime pro is active', () => {
    expect(isProActive(make(true, null))).toBe(true);
  });
  it('future expiry is active', () => {
    expect(isProActive(make(true, Date.now() + 100000))).toBe(true);
  });
  it('expired is not active', () => {
    expect(isProActive(make(true, Date.now() - 1000))).toBe(false);
  });
});

describe('membership storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to free', async () => {
    expect(await getMembership()).toEqual({ isPro: false, proExpiresAt: null });
  });

  it('unlockPro grants lifetime', async () => {
    const m = await unlockPro();
    expect(m.isPro).toBe(true);
    expect(m.proExpiresAt).toBeNull();
    expect(isProActive(await getMembership())).toBe(true);
  });

  it('grantProTrial extends from now', async () => {
    const m = await grantProTrial(1);
    expect(m.isPro).toBe(true);
    expect(m.proExpiresAt).not.toBeNull();
    expect(m.proExpiresAt! - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);
  });
});

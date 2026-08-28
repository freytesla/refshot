import AsyncStorage from '@react-native-async-storage/async-storage';

/** 会员状态：isPro + 到期时间（ms 时间戳；null = 永久） */
export interface Membership {
  isPro: boolean;
  proExpiresAt: number | null;
}

export const MEMBERSHIP_KEY = 'refshot.membership.v1';

/** 看几个激励视频获得试用 */
export const TRIAL_ADS_REQUIRED = 3;
/** 试用时长（天） */
export const TRIAL_DAYS = 1;

export function isProActive(m: Membership): boolean {
  return m.isPro && (m.proExpiresAt == null || m.proExpiresAt > Date.now());
}

export async function getMembership(): Promise<Membership> {
  try {
    const raw = await AsyncStorage.getItem(MEMBERSHIP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isPro: parsed.isPro === true,
        proExpiresAt: typeof parsed.proExpiresAt === 'number' ? parsed.proExpiresAt : null,
      };
    }
  } catch {
    // ignore
  }
  return { isPro: false, proExpiresAt: null };
}

export async function saveMembership(m: Membership): Promise<void> {
  await AsyncStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(m));
}

/** 一键开通永久 Pro（开发/测试用，之后换成真实 IAP 购买） */
export async function unlockPro(): Promise<Membership> {
  const m: Membership = { isPro: true, proExpiresAt: null };
  await saveMembership(m);
  return m;
}

/** 发放 Pro 试用：从当前有效期内顺延 days 天 */
export async function grantProTrial(days: number): Promise<Membership> {
  const current = await getMembership();
  const base = isProActive(current) && current.proExpiresAt ? current.proExpiresAt : Date.now();
  const m: Membership = { isPro: true, proExpiresAt: base + days * 24 * 60 * 60 * 1000 };
  await saveMembership(m);
  return m;
}

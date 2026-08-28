import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from './i18n';
import { ADS_CONFIG } from './adsConfig';

export type AdModalKind = 'rewarded' | 'interstitial' | 'splash';

export interface AdsApi {
  /** 激励视频：用户完整看完返回 true，中途关闭返回 false */
  showRewarded: () => Promise<boolean>;
  /** 插屏广告：展示完自动关闭 */
  showInterstitial: () => Promise<void>;
  /** 开屏广告：展示完/跳过自动关闭 */
  showSplash: () => Promise<void>;
}

const AdsContext = createContext<AdsApi | null>(null);

export function useAds(): AdsApi {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('useAds must be used inside AdsProvider');
  return ctx;
}

/**
 * 广告 Provider（模拟骨架）。
 * 接真 SDK（react-native-google-mobile-ads / 穿山甲）时：
 * 保留 useAds 接口，把 showRewarded/showInterstitial/showSplash 内部替换为真广告调用即可。
 */
export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<AdModalKind | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [splashSkippable, setSplashSkippable] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const closeModal = useCallback((ok: boolean) => {
    setModal(null);
    setCountdown(0);
    setSplashSkippable(false);
    resolver.current?.(ok);
    resolver.current = null;
  }, []);

  const showRewarded = useCallback((): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setCountdown(ADS_CONFIG.rewardedSeconds);
      setModal('rewarded');
    });
  }, []);

  const showInterstitial = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolver.current = () => resolve();
      setCountdown(ADS_CONFIG.interstitialSeconds);
      setModal('interstitial');
    });
  }, []);

  const showSplash = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolver.current = () => resolve();
      setCountdown(ADS_CONFIG.splashSeconds);
      setSplashSkippable(false);
      setModal('splash');
    });
  }, []);

  useEffect(() => {
    if (!modal) return;
    if (modal === 'splash') {
      const skipTimer = setTimeout(() => setSplashSkippable(true), 2000);
      const autoTimer = setTimeout(() => closeModal(true), ADS_CONFIG.splashSeconds * 1000);
      return () => {
        clearTimeout(skipTimer);
        clearTimeout(autoTimer);
      };
    }
    if (countdown <= 0) {
      closeModal(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [modal, countdown, closeModal]);

  const api = useMemo<AdsApi>(
    () => ({ showRewarded, showInterstitial, showSplash }),
    [showRewarded, showInterstitial, showSplash]
  );

  return (
    <AdsContext.Provider value={api}>
      {children}
      <Modal visible={modal !== null} transparent animationType="fade" onRequestClose={() => closeModal(false)}>
        {modal === 'splash' ? (
          <View style={styles.splash}>
            <Text style={styles.splashApp}>参照拍照</Text>
            <View style={styles.splashAdBox}>
              <Text style={styles.splashAd}>{t('adsSplashTitle')}</Text>
              <Text style={styles.splashCountdown}>{countdown}s</Text>
            </View>
            {splashSkippable ? (
              <Pressable style={styles.skipBtn} onPress={() => closeModal(true)}>
                <Text style={styles.skipText}>{t('adsSkip')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.mask}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {modal === 'rewarded' ? t('adsRewardedTitle') : t('adsInterstitialTitle')}
              </Text>
              <Text style={styles.cardCountdown}>{countdown}s</Text>
              {modal === 'rewarded' ? (
                <Pressable style={styles.doneBtn} onPress={() => closeModal(true)}>
                  <Text style={styles.doneText}>{t('adsRewardedDone')}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.closeBtn} onPress={() => closeModal(false)} hitSlop={8}>
                <Text style={styles.closeText}>{t('adsClose')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </AdsContext.Provider>
  );
}

/** Banner 占位（选照片界面/相机页底部）。真 SDK 时替换为 AdBanner 组件。 */
export function MockBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{t('adsBanner')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashApp: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginBottom: 24 },
  splashAdBox: { alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 14, padding: 20 },
  splashAd: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },
  splashCountdown: { color: '#FFD60A', fontSize: 22, fontWeight: '700', marginTop: 8 },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 280,
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  cardTitle: { color: '#F5F5F7', fontSize: 17, fontWeight: '700' },
  cardCountdown: { color: '#FFD60A', fontSize: 26, fontWeight: '800', marginTop: 10, marginBottom: 14 },
  doneBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#FFD60A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneText: { color: '#0B0B0F', fontSize: 15, fontWeight: '700' },
  closeBtn: { marginTop: 12, padding: 6 },
  closeText: { color: '#8E8E93', fontSize: 13 },
  banner: {
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(28,28,30,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
});

/**
 * 广告骨架配置：真 SDK（AdMob/穿山甲）接入前，先用这里统一开关。
 * 以后接真广告时，只需要改 src/lib/ads.tsx 里的 Provider 实现，和这里的产品开关。
 */
export const ADS_CONFIG = {
  /** 开屏广告（骨架默认开启，仅非会员、每会话一次） */
  enableSplash: true,
  /** 选照片界面底部 Banner（非会员显示） */
  enableBannerOnPicker: true,
  /** 拍完照片后插屏广告（非会员） */
  enableInterstitialAfterCapture: true,
  /** 保存时插屏（可选，默认关，避免打扰） */
  enableInterstitialOnSave: false,
  /** 模拟广告时长（秒） */
  rewardedSeconds: 4,
  interstitialSeconds: 2,
  splashSeconds: 3,
};

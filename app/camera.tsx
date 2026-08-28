import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReferenceImage } from '../src/types';
import {
  clearCurrentReferenceId,
  findReference,
  getCurrentReferenceId,
  getHoldBehavior,
  setCurrentReferenceId,
  HoldBehavior,
} from '../src/lib/storage';
import { clampOverlayScale } from '../src/lib/geometry';
import { t } from '../src/lib/i18n';
import { useAds } from '../src/lib/ads';
import { ADS_CONFIG } from '../src/lib/adsConfig';
import { getMembership, isProActive } from '../src/lib/membership';
import { Icon } from '../src/components/Icon';

type FlashMode = 'off' | 'on' | 'auto';

const showOutlineMode = Platform.OS !== 'web';
const CAM_ASPECT = 3 / 4; // 取景框宽:高 = 3:4
const BOTTOM_CONTROLS_H = 122; // 底部：编辑/查看 + 三件套

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();

  const [reference, setReference] = useState<ReferenceImage | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraAvailable, setCameraAvailable] = useState(true);

  // 叠加模式：默认原图（半透明），剪影为开关（默认关）
  const [outlineOn, setOutlineOn] = useState(false);
  const [opacity, setOpacity] = useState(0.3);
  const [mirrored, setMirrored] = useState(false);
  const [gridOn, setGridOn] = useState(true);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [torchOn, setTorchOn] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [zoom, setZoom] = useState(0);

  const [baseVisible, setBaseVisible] = useState(true);
  const [holdBehavior, setHoldBehavior] = useState<HoldBehavior>('hide');
  const [peekHolding, setPeekHolding] = useState(false);
  const [shutterHiding, setShutterHiding] = useState(false);
  const [taking, setTaking] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // 顶部下拉小面板（iOS 相机 ⌃ 展开的那条）
  const [controlsOpen, setControlsOpen] = useState(false);


  // 编辑模式：仅编辑模式下手势作用于参考图（默认双指=相机变焦）
  const [editMode, setEditMode] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const ads = useAds();
  const referenceIdRef = useRef<string | null>(null);

  // 取景框 3:4，居中放在顶部控制区与底部控制区之间，框外全黑
  const topBarH = insets.top + 52;
  const availableH = H - topBarH - BOTTOM_CONTROLS_H;
  const camW = Math.min(W, availableH * CAM_ASPECT);
  const camH = camW / CAM_ASPECT;
  const camTop = topBarH + (availableH - camH) / 2;
  const camLeft = (W - camW) / 2;

  // 恢复上次使用的参考图 + 按住行为设置
  // 每次回到相机页时重载：会员 / 按住行为 / 当前参考图（应用内选图后返回也能生效）
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const membership = await getMembership();
        if (!cancelled) setIsPro(isProActive(membership));
        const behavior = await getHoldBehavior();
        if (!cancelled) {
          setHoldBehavior(behavior);
          setBaseVisible(behavior === 'hide');
        }
        const id = await getCurrentReferenceId();
        if (cancelled || !id) return;
        const found = await findReference(id);
        if (!cancelled && found) {
          if (referenceIdRef.current !== found.id) {
            resetOverlay();
          }
          referenceIdRef.current = found.id;
          setReference(found);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // 剪影仍在生成时轮询更新
  useEffect(() => {
    if (!reference || reference.outlineStatus !== 'pending') return;
    const timer = setInterval(async () => {
      const updated = await findReference(reference.id);
      if (updated) setReference(updated);
    }, 1200);
    return () => clearInterval(timer);
  }, [reference?.id, reference?.outlineStatus]);

  // 检测相机是否可用（尤其 Web 环境）
  useEffect(() => {
    let cancelled = false;
    CameraView.isAvailableAsync()
      .then((available) => {
        if (!cancelled) setCameraAvailable(available);
      })
      .catch(() => {
        if (!cancelled) setCameraAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 叠加层手势状态
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(editMode)
    .onUpdate((event) => {
      tx.value = savedTx.value + event.translationX;
      ty.value = savedTy.value + event.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(editMode)
    .onUpdate((event) => {
      scale.value = clampOverlayScale(savedScale.value * event.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const rotateGesture = Gesture.Rotation()
    .enabled(editMode)
    .onUpdate((event) => {
      rotation.value = savedRotation.value + event.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

  // 屏幕级双指缩放 → 相机变焦（仅非编辑模式；编辑模式下双指是缩放参考图）
  const pinchStartZoom = useSharedValue(0);
  const zoomRef = useRef(0);
  const updateZoom = (z: number) => {
    setZoom(z);
  };
  const cameraPinch = Gesture.Pinch()
    .enabled(!editMode)
    .onStart(() => {
      pinchStartZoom.value = zoomRef.current;
    })
    .onUpdate((event) => {
      const z = Math.min(1, Math.max(0, pinchStartZoom.value * event.scale));
      zoomRef.current = z;
      runOnJS(updateZoom)(z);
    });

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  const resetOverlay = () => {
    tx.value = 0;
    ty.value = 0;
    scale.value = 1;
    rotation.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
    savedScale.value = 1;
    savedRotation.value = 0;
  };

  // 最终可见性：快门时强制隐藏；按住时按设置切换；否则用默认显隐
  const effectiveVisible = shutterHiding ? false : peekHolding ? holdBehavior === 'show' : baseVisible;
  const effectiveOpacity = effectiveVisible ? (outlineOn ? 1 : opacity) : 0;

  const overlayUri = outlineOn && reference?.stencilUri ? reference.stencilUri : reference?.sourceUri;

  const onClearReference = () => {
    Alert.alert(t('referenceClearTitle'), t('referenceClearBody'), [
      { text: t('commonCancel'), style: 'cancel' },
      {
        text: t('commonDelete'),
        style: 'destructive',
        onPress: async () => {
          setReference(null);
          await clearCurrentReferenceId();
          resetOverlay();
        },
      },
    ]);
  };

  const onShutter = async () => {
    if (!cameraRef.current || taking || !permission?.granted) return;
    setTaking(true);
    setShutterHiding(true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: false,
        base64: false,
        // 前置自拍：成片与镜像预览保持一致，避免自拍后照片左右翻转（web 端生效，原生端忽略）
        isImageMirror: facing === 'front',
      });
      if (photo) {
        setShutterHiding(false);
        if (ADS_CONFIG.enableInterstitialAfterCapture && !isPro) {
          await ads.showInterstitial();
        }
        router.push({
          pathname: '/compare',
          params: { refId: reference?.id ?? '', photo: photo.uri },
        });
        return;
      }
      Alert.alert(t('photoFailed'));
      setShutterHiding(false);
    } catch (error) {
      Alert.alert(t('photoFailed'), String(error));
      setShutterHiding(false);
    } finally {
      setTaking(false);
    }
  };

  const cycleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'));
  };

  const flashLabel = flash === 'auto' ? 'A' : flash === 'on' ? 'ON' : 'OFF';

  const renderPermission = () => {
    if (!permission) return null;
    if (permission.granted) return null;
    if (permission.canAskAgain) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>{t('permissionNeeded')}</Text>
          <Text style={styles.centerBody}>{t('permissionNeededBody')}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => void requestPermission()}>
            <Text style={styles.primaryBtnText}>{t('grant')}</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.centerBox}>
        <Text style={styles.centerTitle}>{t('permissionDenied')}</Text>
        <Text style={styles.centerBody}>{t('permissionDeniedBody')}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void Linking.openSettings()}>
          <Text style={styles.primaryBtnText}>{t('openSettings')}</Text>
        </Pressable>
      </View>
    );
  };

  const renderCameraUnavailable = () => (
    <View style={styles.centerBox}>
      <Text style={styles.centerTitle}>{t('cameraUnavailable')}</Text>
      <Text style={styles.centerBody}>{t('cameraUnavailableBody')}</Text>
    </View>
  );

  return (
    <GestureDetector gesture={cameraPinch}>
      <View style={styles.screen}>
      {cameraAvailable && permission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={{ position: 'absolute', left: camLeft, top: camTop, width: camW, height: camH }}
          facing={facing}
          flash={flash}
          zoom={zoom}
          enableTorch={torchOn}
          mode="picture"
          autofocus="on"
          mirror={false}
        />
      ) : null}

      {/* 3:4 取景框内的叠加层与网格 */}
      {cameraAvailable && permission?.granted && overlayUri ? (
        <View
          style={{ position: 'absolute', left: camLeft, top: camTop, width: camW, height: camH }}
          pointerEvents="box-none"
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                overlayStyle,
                { opacity: effectiveOpacity, pointerEvents: effectiveVisible ? 'auto' : 'none' },
              ]}
            >
              <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: mirrored ? -1 : 1 }] }]}>
                <Image source={{ uri: overlayUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              </View>
            </Animated.View>
          </GestureDetector>

          {gridOn ? (
            <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
              <View style={[styles.gridLineV, { left: '33.333%' }]} />
              <View style={[styles.gridLineV, { left: '66.666%' }]} />
              <View style={[styles.gridLineH, { top: '33.333%' }]} />
              <View style={[styles.gridLineH, { top: '66.666%' }]} />
            </View>
          ) : null}

        </View>
      ) : null}

      {editMode && reference && cameraAvailable && permission?.granted ? (
        <View style={[styles.editHint, { top: camTop + 8 }]} pointerEvents="none">
          <Text style={styles.editHintText}>{t('editModeHint')}</Text>
        </View>
      ) : null}

      {!cameraAvailable ? (
        renderCameraUnavailable()
      ) : permission?.granted ? null : (
        renderPermission()
      )}

      {!reference && permission?.granted && cameraAvailable ? (
        <View style={[styles.noRefHint, { top: camTop + camH / 2 - 16, pointerEvents: 'none' }]}>
          <Text style={styles.noRefText}>{t('noReferenceHint')}</Text>
        </View>
      ) : null}

      {/* 顶部：闪光灯 + ⌃ 小面板（黑条内） */}
      <View style={[styles.topRow, { top: insets.top + 6 }]}>
        <Pressable style={styles.topIcon} onPress={cycleFlash} hitSlop={6} accessibilityLabel={t('flash')}>
          <Icon name="zap" size={21} color={flash !== 'off' ? '#FFD60A' : '#FFFFFF'} />
          <Text style={[styles.topIconLabel, flash !== 'off' && styles.topIconLabelActive]}>{flashLabel}</Text>
        </Pressable>
        <Pressable style={styles.topIcon} onPress={() => setControlsOpen((v) => !v)} hitSlop={6} accessibilityLabel={t('controls')}>
          <Icon name={controlsOpen ? 'chevron-down' : 'chevron-up'} size={21} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* 顶部下拉小面板：剪影 / 网格 / 镜像 / 照明 / 重置 / 设置 */}
      {controlsOpen ? (
        <BlurView intensity={80} tint="dark" style={[styles.controlsPanel, { top: topBarH + 4 }]}>
          <View style={styles.panelGrid}>
            {showOutlineMode ? (
              <Pressable
                style={[styles.panelBtn, outlineOn && styles.panelBtnActive]}
                onPress={() => setOutlineOn((v) => !v)}
              >
                <Icon name="eye" size={20} color={outlineOn ? '#FFD60A' : '#FFFFFF'} />
                <Text style={styles.panelBtnLabel}>{t('modeOutline')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.panelBtn, gridOn && styles.panelBtnActive]}
              onPress={() => setGridOn((v) => !v)}
            >
              <Icon name="layout-grid" size={20} color={gridOn ? '#FFD60A' : '#FFFFFF'} />
              <Text style={styles.panelBtnLabel}>{t('grid')}</Text>
            </Pressable>
            <Pressable
              style={[styles.panelBtn, mirrored && styles.panelBtnActive]}
              onPress={() => setMirrored((v) => !v)}
            >
              <Icon name="flip-horizontal-2" size={20} color={mirrored ? '#FFD60A' : '#FFFFFF'} />
              <Text style={styles.panelBtnLabel}>{t('mirror')}</Text>
            </Pressable>
            <Pressable
              style={[styles.panelBtn, torchOn && styles.panelBtnActive]}
              onPress={() => setTorchOn((v) => !v)}
            >
              <Icon name="flashlight" size={20} color={torchOn ? '#FFD60A' : '#FFFFFF'} />
              <Text style={styles.panelBtnLabel}>{t('torch')}</Text>
            </Pressable>
            {reference ? (
              <Pressable style={styles.panelBtn} onPress={resetOverlay}>
                <Icon name="rotate-cw" size={20} />
                <Text style={styles.panelBtnLabel}>{t('reset')}</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.panelBtn} onPress={() => router.push('/settings')}>
              <Icon name="settings" size={20} />
              <Text style={styles.panelBtnLabel}>{t('settingsTitle')}</Text>
            </Pressable>
          </View>
        </BlurView>
      ) : null}

      {/* 底部：编辑 / 查看（按住）+ 三件套 */}
      <View style={[styles.bottomArea, { height: BOTTOM_CONTROLS_H, paddingBottom: insets.bottom + 6 }]}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.bottomPill, editMode && styles.bottomPillActive]}
            onPress={() => setEditMode((v) => !v)}
            accessibilityLabel={t('editMode')}
          >
            <Icon name="move-horizontal" size={15} color={editMode ? '#FFD60A' : '#FFFFFF'} />
            <Text style={styles.bottomPillText}>{t('editMode')}</Text>
          </Pressable>
          <Pressable
            style={[styles.bottomPill, peekHolding && styles.bottomPillActive]}
            onPressIn={() => setPeekHolding(true)}
            onPressOut={() => setPeekHolding(false)}
            accessibilityLabel={t('peek')}
          >
            <Icon name={peekHolding ? 'eye' : holdBehavior === 'show' ? 'eye-off' : 'eye'} size={15} color="#FFFFFF" />
            <Text style={styles.bottomPillText}>{t('peek')}</Text>
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <Pressable
            style={styles.thumbBtn}
            onPress={() => router.push('/picker')}
            onLongPress={onClearReference}
            accessibilityLabel={t('cameraTitle')}
          >
            {reference ? (
              <Image source={{ uri: reference.sourceUri }} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <Icon name="image" size={22} color="rgba(255,255,255,0.85)" />
            )}
          </Pressable>

          <Pressable
            style={[styles.shutter, (taking || !permission?.granted) && styles.shutterDisabled]}
            onPress={() => void onShutter()}
            accessibilityLabel={t('shutter')}
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable style={styles.flipBtn} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
            <Icon name="repeat" size={24} />
          </Pressable>
        </View>
      </View>

      {/* 编辑模式：透明度 / 变焦 */}
      {editMode && reference ? (
        <BlurView intensity={70} tint="dark" style={[styles.editPanel, { bottom: insets.bottom + 132 }]}>
          <View style={styles.editPanelHeader}>
            <Text style={styles.editPanelTitle}>{t('editMode')}</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{t('opacity')}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={opacity}
              onValueChange={setOpacity}
              minimumTrackTintColor="#FFD60A"
              maximumTrackTintColor="#3A3A3C"
              thumbTintColor="#FFFFFF"
            />
            <Text style={styles.sliderValue}>{Math.round(opacity * 100)}%</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{t('zoom')}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={zoom}
              onValueChange={(v) => {
                setZoom(v);
                zoomRef.current = v;
              }}
              minimumTrackTintColor="#FFD60A"
              maximumTrackTintColor="#3A3A3C"
              thumbTintColor="#FFFFFF"
            />
          </View>
        </BlurView>
      ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  centerTitle: { color: '#F5F5F7', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  centerBody: { color: '#8E8E93', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  primaryBtnText: { color: '#0B0B0F', fontSize: 15, fontWeight: '700' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  noRefHint: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  noRefText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  topRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topIcon: { alignItems: 'center', minWidth: 30 },
  topIconLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2, fontWeight: '600' },
  topIconLabelActive: { color: '#FFD60A' },
  controlsPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  panelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  panelBtn: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, minWidth: 62 },
  panelBtnActive: { backgroundColor: 'rgba(255,214,10,0.18)' },
  panelBtnLabel: { color: '#AEAEB2', fontSize: 11, marginTop: 4 },
  editPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  editPanelHeader: { marginBottom: 2 },
  editPanelTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 8 },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bottomPillActive: { backgroundColor: 'rgba(255,214,10,0.26)' },
  bottomPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  editHint: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  editHintText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sliderLabel: { color: '#E5E5EA', fontSize: 13, width: 52 },
  sliderValue: { color: '#8E8E93', fontSize: 13, width: 44, textAlign: 'right' },
  slider: { flex: 1, height: 30 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 10,
  },
  thumbBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(20,20,22,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: 48, height: 48, borderRadius: 9 },
  thumbSpinner: { position: 'absolute' },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
  flipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(20,20,22,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

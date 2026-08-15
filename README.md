# 参照拍照 (RefShot)

iPhone 辅助拍照工具：打开就是正常相机界面，点左上角从**相册**选一张参考图，叠加在相机画面上（半透明原图 / 主体剪影描边），自由缩放/旋转/定位后参照拍摄，拍完与参考图划杆对比、保存、分享。所有图片均在设备本地处理，不上传网络。

技术栈：Expo SDK 57（React Native 0.86 / React 19）+ TypeScript + expo-router + expo-camera + react-native-gesture-handler + react-native-reanimated。iOS 16.4+，仅 iPhone 竖屏。

> **相机库说明**：方案原计划用 react-native-vision-camera，但 SDK 57 对应的 v5 依赖新的 Nitro 图像栈且 API 复杂，对 v1（不需要帧处理器）风险过高，因此改用 Expo 内置的 `expo-camera`（API 简单、支持 Expo Go 与 Web 快速验证）。后续 v2 如需实时帧处理（贴合度评分），再评估 vision-camera。

## 目录结构

```
app/                        expo-router 页面
  _layout.tsx               路由与根布局
  index.tsx                 重定向到相机页
  camera.tsx                相机页（主界面：选参考图/叠加/拍摄）
  compare.tsx               参考图 vs 成片 划杆对比
  settings.tsx              设置（隐私说明/关于/清除参考图）
src/
  types.ts                  数据模型
  lib/storage.ts            AsyncStorage 持久化 + 当前参考图 id
  lib/geometry.ts           叠加几何纯函数（cover/clamp/边界）
  lib/import.ts             相册导入管线（原生复制文件/Web 直接引用 + 剪影生成）
  lib/i18n.ts               中/英（跟随系统语言）
  components/Icon.tsx         Lucide SVG 图标组件（数据在 icon-data.ts，源文件在 scripts/_icons/）
modules/subject-outline/    iOS 原生 Expo 模块（Swift）
  ios/SubjectOutlineModule.swift   Vision 人像分割→描边 / 轮廓回退
  index.ts                  JS 绑定与结果归一化
```

## 快速开始（Windows 可直接运行 JS 侧）

```bash
npm install
npm run web        # 浏览器预览（相机用浏览器摄像头，导入用相册/文件选择器）
npm test           # Jest 单测
npm run typecheck  # tsc --noEmit
```

原生能力（相机、剪影模块）需要开发构建版才能在真机运行，见下文。

## 在手机上试用（无需 Apple 开发者账号）

> iPhone 的浏览器只在 HTTPS（或 localhost）下才允许调用摄像头，所以「手机直接访问电脑的 http://局域网IP」不可行。

### 方式一：Expo Go 真机运行

1. iPhone 在 App Store 安装免费 App **Expo Go**。
2. 电脑与手机连同一个 Wi-Fi。
3. 电脑终端运行 `npx expo start --go`，用 Expo Go 扫描二维码或手动输入 `exp://<电脑局域网IP>:8081`。
4. 即可用手机真实相机体验叠加拍摄。

- ⚠️ **当前注意**：SDK 57 太新，App Store 的 Expo Go 还没支持（官方说 56/57 的 Expo Go 未上架）。如果报「Project is incompatible / 需要更新的 Expo Go」，需要把项目 SDK 降级到商店版支持的版本（54/55/56），或等商店更新后再用。
- 剪影描边依赖 iOS 原生模块，Expo Go 里会自动降级为「半透明原图」模式；其余功能完整可用。

### 方式二：网页版（HTTPS 链接，手机 Safari 可用）

- 本地临时链接（Cloudflare 隧道，无需账号）：`npx cloudflared tunnel --url http://localhost:8081`，取输出的 `https://xxx.trycloudflare.com`。
- 长期链接：部署到 GitHub Pages（仓库里已备好 `.github/workflows/deploy-web.yml` 与 `npm run deploy`；项目页需在 app.json 加 `"experiments": { "baseUrl": "/<仓库名>" }`）。
- 网页版限制：剪影模式隐藏、保存到相册/分享不可用；导入用「相册导入」（网页上是文件选择器）。

## iOS 真机与上架（无 Mac 工作流）

1. 注册 [Apple Developer Program](https://developer.apple.com/programs/)（$99/年），在 [App Store Connect](https://appstoreconnect.apple.com) 创建 App。
2. 安装 EAS CLI 并登录：`npm i -g eas-cli && eas login`，然后 `eas build:configure`（会写入 `extra.eas.projectId`）。
3. 注册你的 iPhone（EAS 会引导，或到 Apple 开发者后台添加设备 UDID）。
4. 出开发构建版：`eas build --profile development --platform ios`，装到 iPhone 后 `npx expo start` 用 Expo Dev Client 局域网热更新迭代。
5. 出正式包并上架：`eas build --profile production --platform ios` → `eas submit`。准备 6.9/6.5 寸截图、App 描述、隐私政策链接；隐私问卷勾选「不收集任何数据」。

`npx expo prebuild` 生成 iOS 工程需在 macOS 上执行（Windows 上会跳过 iOS 生成），CNG 模式下 `/ios`、`/android` 不进版本库。

## 剪影原生模块（subject-outline）

接口：`generateOutline({ sourceUri, outputUri, lineColor?, lineWidth? }) -> Promise<{ outputUri, type: 'person' | 'contour' | 'fallback', error? }>`

- 优先 `VNGeneratePersonSegmentationRequest` 人像分割取蒙版，沿蒙版描边输出透明底 PNG（type=`person`）。
- 无人像时回退 `VNDetectContoursRequest` 整图轮廓（线稿式，type=`contour`）。
- 失败返回 `fallback`，JS 侧自动降级为半透明原图模式，不阻塞主流程。
- Web 端无此模块，导入时直接标记 failed，不会卡在「剪影生成中」。

## v1 范围与 v2 规划

v1：标准相机布局（满屏取景框，底部「参考图/快门/翻转」三件套，其他调节项收进可展开的毛玻璃面板）、相册导入参考图（左下角按钮，长按可清除）、半透明/剪影叠加、手势（拖动/缩放/旋转）、镜像、九宫格、闪光灯/照明/前后摄/变焦、按住查看参考图按钮（设置里可切换「长按隐藏 / 长按出现」）、快门隐藏叠加、划杆对比、保存/分享、中英双语、纯本地处理、Lucide SVG 图标。

v2（未做）：实时贴合度评分（需帧处理器）、多参考图层、混合模式（差值/正片叠底）、iCloud 同步、内购、iPad 适配。

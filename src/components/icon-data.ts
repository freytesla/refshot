// 图标数据来自 lucide-static（ISC 许可证，https://lucide.dev）
// 生成脚本：scripts/convert-icons.js（_icons/*.svg -> 本文件）

export type IconName =
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-up'
  | 'eye-off'
  | 'eye'
  | 'flashlight'
  | 'flip-horizontal-2'
  | 'image'
  | 'layout-grid'
  | 'move-horizontal'
  | 'repeat'
  | 'rotate-cw'
  | 'settings'
  | 'sliders-horizontal'
  | 'trash-2'
  | 'x'
  | 'zap';

export type IconElementType = 'path' | 'circle' | 'line' | 'rect' | 'polyline' | 'polygon' | 'ellipse';

export interface IconElement {
  type: IconElementType;
  attrs: Record<string, string | number>;
}

export const ICON_DATA: Record<IconName, IconElement[]> = {
  "chevron-down": [
    { type: 'path', attrs: {"d":"m6 9 6 6 6-6"} },
  ],
  "chevron-left": [
    { type: 'path', attrs: {"d":"m15 18-6-6 6-6"} },
  ],
  "chevron-up": [
    { type: 'path', attrs: {"d":"m18 15-6-6-6 6"} },
  ],
  "eye-off": [
    { type: 'path', attrs: {"d":"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"} },
    { type: 'path', attrs: {"d":"M14.084 14.158a3 3 0 0 1-4.242-4.242"} },
    { type: 'path', attrs: {"d":"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"} },
    { type: 'path', attrs: {"d":"m2 2 20 20"} },
  ],
  "eye": [
    { type: 'path', attrs: {"d":"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"} },
    { type: 'circle', attrs: {"cx":12,"cy":12,"r":3} },
  ],
  "flashlight": [
    { type: 'path', attrs: {"d":"M12 13v1"} },
    { type: 'path', attrs: {"d":"M17 2a1 1 0 0 1 1 1v4a3 3 0 0 1-.6 1.8l-.6.8A4 4 0 0 0 16 12v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a4 4 0 0 0-.8-2.4l-.6-.8A3 3 0 0 1 6 7V3a1 1 0 0 1 1-1z"} },
    { type: 'path', attrs: {"d":"M6 6h12"} },
  ],
  "flip-horizontal-2": [
    { type: 'path', attrs: {"d":"m3 7 5 5-5 5V7"} },
    { type: 'path', attrs: {"d":"m21 7-5 5 5 5V7"} },
    { type: 'path', attrs: {"d":"M12 20v2"} },
    { type: 'path', attrs: {"d":"M12 14v2"} },
    { type: 'path', attrs: {"d":"M12 8v2"} },
    { type: 'path', attrs: {"d":"M12 2v2"} },
  ],
  "image": [
    { type: 'rect', attrs: {"width":18,"height":18,"x":3,"y":3,"rx":2,"ry":2} },
    { type: 'circle', attrs: {"cx":9,"cy":9,"r":2} },
    { type: 'path', attrs: {"d":"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"} },
  ],
  "layout-grid": [
    { type: 'rect', attrs: {"width":7,"height":7,"x":3,"y":3,"rx":1} },
    { type: 'rect', attrs: {"width":7,"height":7,"x":14,"y":3,"rx":1} },
    { type: 'rect', attrs: {"width":7,"height":7,"x":14,"y":14,"rx":1} },
    { type: 'rect', attrs: {"width":7,"height":7,"x":3,"y":14,"rx":1} },
  ],
  "move-horizontal": [
    { type: 'path', attrs: {"d":"m18 8 4 4-4 4"} },
    { type: 'path', attrs: {"d":"M2 12h20"} },
    { type: 'path', attrs: {"d":"m6 8-4 4 4 4"} },
  ],
  "repeat": [
    { type: 'path', attrs: {"d":"m17 2 4 4-4 4"} },
    { type: 'path', attrs: {"d":"M3 11v-1a4 4 0 0 1 4-4h14"} },
    { type: 'path', attrs: {"d":"m7 22-4-4 4-4"} },
    { type: 'path', attrs: {"d":"M21 13v1a4 4 0 0 1-4 4H3"} },
  ],
  "rotate-cw": [
    { type: 'path', attrs: {"d":"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"} },
    { type: 'path', attrs: {"d":"M21 3v5h-5"} },
  ],
  "settings": [
    { type: 'path', attrs: {"d":"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"} },
    { type: 'circle', attrs: {"cx":12,"cy":12,"r":3} },
  ],
  "sliders-horizontal": [
    { type: 'path', attrs: {"d":"M10 5H3"} },
    { type: 'path', attrs: {"d":"M12 19H3"} },
    { type: 'path', attrs: {"d":"M14 3v4"} },
    { type: 'path', attrs: {"d":"M16 17v4"} },
    { type: 'path', attrs: {"d":"M21 12h-9"} },
    { type: 'path', attrs: {"d":"M21 19h-5"} },
    { type: 'path', attrs: {"d":"M21 5h-7"} },
    { type: 'path', attrs: {"d":"M8 10v4"} },
    { type: 'path', attrs: {"d":"M8 12H3"} },
  ],
  "trash-2": [
    { type: 'path', attrs: {"d":"M10 11v6"} },
    { type: 'path', attrs: {"d":"M14 11v6"} },
    { type: 'path', attrs: {"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"} },
    { type: 'path', attrs: {"d":"M3 6h18"} },
    { type: 'path', attrs: {"d":"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"} },
  ],
  "x": [
    { type: 'path', attrs: {"d":"M18 6 6 18"} },
    { type: 'path', attrs: {"d":"m6 6 12 12"} },
  ],
  "zap": [
    { type: 'path', attrs: {"d":"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"} },
  ],
};

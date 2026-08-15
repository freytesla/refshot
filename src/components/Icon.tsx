import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { ICON_DATA, IconElementType, IconName } from './icon-data';

const TAG_MAP = {
  path: Path,
  circle: Circle,
  line: Line,
  rect: Rect,
  polyline: Polyline,
  polygon: Polygon,
  ellipse: Ellipse,
} as const;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** 统一的线性图标组件（Lucide 风格，24x24 视口） */
export function Icon({ name, size = 24, color = '#FFFFFF', strokeWidth = 2 }: IconProps) {
  const elements = ICON_DATA[name] ?? [];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {elements.map((el, index) => {
        const Tag = TAG_MAP[el.type as IconElementType];
        return <Tag key={index} {...el.attrs} />;
      })}
    </Svg>
  );
}

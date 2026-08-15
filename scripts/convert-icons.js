const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '_icons');
const names = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.svg')).map((f) => f.replace(/\.svg$/, ''));

const NUMERIC = new Set(['cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2']);

function parse(svg) {
  const elements = [];
  const tagRe = /<(path|circle|line|rect|polyline|polygon|ellipse)\b([^>]*?)\/?>/g;
  let m;
  while ((m = tagRe.exec(svg))) {
    const type = m[1];
    const attrs = {};
    const attrRe = /([\w-]+)\s*=\s*"([^"]*)"/g;
    let a;
    while ((a = attrRe.exec(m[2]))) {
      const key = a[1];
      const val = a[2];
      if (key === 'fill' && val === 'none') continue;
      attrs[key] = NUMERIC.has(key) ? Number(val) : val;
    }
    elements.push({ type, attrs });
  }
  return elements;
}

const lines = [];
lines.push('// 图标数据来自 lucide-static（ISC 许可证，https://lucide.dev）');
lines.push('// 生成脚本：scripts/convert-icons.js（_icons/*.svg -> 本文件）');
lines.push('');
lines.push('export type IconName =');
names.forEach((n, i) => lines.push(`  | '${n}'${i === names.length - 1 ? ';' : ''}`));
lines.push('');
lines.push('export type IconElementType = \'path\' | \'circle\' | \'line\' | \'rect\' | \'polyline\' | \'polygon\' | \'ellipse\';');
lines.push('');
lines.push('export interface IconElement {');
lines.push('  type: IconElementType;');
lines.push('  attrs: Record<string, string | number>;');
lines.push('}');
lines.push('');
lines.push('export const ICON_DATA: Record<IconName, IconElement[]> = {');
for (const n of names) {
  const svg = fs.readFileSync(path.join(iconsDir, n + '.svg'), 'utf8');
  const els = parse(svg);
  lines.push(`  ${JSON.stringify(n)}: [`);
  for (const el of els) {
    lines.push(`    { type: '${el.type}', attrs: ${JSON.stringify(el.attrs)} },`);
  }
  lines.push('  ],');
}
lines.push('};');
lines.push('');

fs.writeFileSync(path.join(__dirname, '..', 'src', 'components', 'icon-data.ts'), lines.join('\n'));
console.log('icon-data.ts generated:', names.length, 'icons');

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const channels = (block: string) => Object.fromEntries([...block.matchAll(/--theme-([\w-]+):\s*(\d+ \d+ \d+);/g)].map((m) => [m[1], m[2].split(' ').map(Number)]));
const dark = channels(css.match(/:root \{([\s\S]*?)\n\}/)![1]);
const light = { ...dark, ...channels(css.match(/:root\[data-theme="light"\] \{([\s\S]*?)\n\}/)![1]) };
function luminance(rgb: number[]) {
  const linear = rgb.map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}
function contrast(a: number[], b: number[]) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
for (const [theme, palette] of Object.entries({ dark, light })) {
  test(`${theme}: avatar initials remain readable on nested active-profile tints`, () => {
    const avatar = readFileSync(new URL('../src/components/common/ProfileAvatar.tsx', import.meta.url), 'utf8');
    assert.match(avatar, /bg-champagne\/15[^"\n]*\btext-ink\b/);
    const blend = (foreground: number[], background: number[], alpha: number) => foreground.map((v, i) => v * alpha + background[i] * (1 - alpha));
    for (const surface of ['page', 'surface', 'elevated', 'hover']) {
      const active = blend(palette.accent, palette[surface], .1);
      const background = blend(palette.accent, active, .15);
      assert.ok(contrast(palette.text, background) >= 4.5, `Avatar on ${surface}`);
    }
  });
  test(`${theme}: normal text and muted/accent copy meet AA on every neutral surface`, () => {
    for (const ink of ['text', 'secondary', 'muted', 'accent', 'accent-hover']) {
      for (const background of ['page', 'surface', 'elevated', 'hover']) {
        const ratio = contrast(palette[ink], palette[background]);
        assert.ok(ratio >= 4.5, `${ink}/${background}: ${ratio.toFixed(2)}`);
      }
    }
  });
  test(`${theme}: form boundaries and keyboard focus meet 3:1 on neutral surfaces`, () => {
    for (const boundary of ['control-border', 'focus']) {
      for (const background of ['page', 'surface', 'elevated', 'hover']) {
        const ratio = contrast(palette[boundary], palette[background]);
        assert.ok(ratio >= 3, `${boundary}/${background}: ${ratio.toFixed(2)}`);
      }
    }
  });
  test(`${theme}: actions, statuses and Stage 2.1 attention labels meet AA`, () => {
    for (const [ink, background] of [
      ['on-action', 'action'], ['on-action', 'action-hover'], ['on-badge', 'badge'],
      ...['success', 'warning', 'error', 'info', 'progress', 'pending'].map(status => [status, `${status}-surface`]),
    ]) {
      const ratio = contrast(palette[ink], palette[background]);
      assert.ok(ratio >= 4.5, `${ink}/${background}: ${ratio.toFixed(2)}`);
    }
    assert.notDeepEqual(palette['pending-surface'], palette.surface);
    assert.notDeepEqual(palette.page, palette.surface);
    assert.notDeepEqual(palette.surface, palette.elevated);
  });
}
test('theme uses shared tokens, keeps photography ink and visible keyboard focus', () => {
  assert.match(css, /\.photo-copy\s*\{/);
  assert.match(css, /\.payment-needs-verification\s*\{[^}]*var\(--theme-pending-surface\)/);
  assert.match(css, /\.staff-attention-badge\s*\{[^}]*var\(--theme-badge\)/);
  assert.match(css, /:focus-visible\s*\{\s*outline: 2px solid rgb\(var\(--theme-focus\)\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  const provider = readFileSync(new URL('../src/lib/theme-context.tsx', import.meta.url), 'utf8');
  assert.match(provider, /try \{ localStorage\.setItem/);
  assert.match(provider, /applyTheme\(nextTheme, false\)/);
});

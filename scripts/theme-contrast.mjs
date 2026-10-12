// Serializable browser audit. It returns selectors/colours only, never private text.
// Photographic/gradient backgrounds need a separate visual review, not a guessed ratio.
export function inspectThemeContrast() {
  const rgba = value => {
    const n = value.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0];
    return [n[0], n[1], n[2], n[3] ?? 1];
  };
  const composite = (top, below) => top.slice(0, 3).map((v, i) => v * top[3] + below[i] * (1 - top[3]));
  const luminance = rgb => {
    const c = rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
  };
  const ratio = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const backdrop = node => {
    if (!node) return [255, 255, 255];
    const s = getComputedStyle(node), c = rgba(s.backgroundColor);
    if (s.backgroundImage !== 'none') return null;
    if (c[3] === 1) return c.slice(0, 3);
    const below = backdrop(node.parentElement);
    return below && composite(c, below);
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const failures = new Map(); let checked = 0, photographic = 0, decorative = 0, minimum = Infinity;
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent.trim()) continue;
    const node = walker.currentNode.parentElement;
    if (!node || node.closest('script,style,option,svg,[inert],[aria-hidden="true"],:disabled')) continue;
    // The Client header uses standalone pipes as decorative dividers, not copy.
    // Keep this exemption narrow: punctuation in labels still needs text contrast.
    if (node.tagName === 'SPAN' && node.classList.contains('select-none') && node.textContent.trim() === '|') { decorative++; continue; }
    const rect = node.getBoundingClientRect(), s = getComputedStyle(node);
    if (!rect.width || !rect.height || s.visibility !== 'visible' || rect.width <= 1 || rect.height <= 1) continue;
    let inactive = false;
    for (let p = node; p; p = p.parentElement) if (Number(getComputedStyle(p).opacity) < .99) { inactive = true; break; }
    // Disabled and intentionally hidden transitions are exempt; opacity copy is reviewed separately.
    if (inactive) continue;
    if (node.closest('.photo-copy,[class*="text-photo"],[class*="bg-black/"]')) { photographic++; continue; }
    const background = backdrop(node);
    if (!background) { photographic++; continue; }
    const value = ratio(composite(rgba(s.color), background), background);
    const large = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700);
    const target = large ? 3 : 4.5;
    checked++; minimum = Math.min(minimum, value);
    if (value + .005 < target) {
      const result = { tag: node.tagName.toLowerCase(), classes: typeof node.className === 'string' ? node.className : '', colour: s.color, background: background.map(Math.round), ratio: Number(value.toFixed(2)), target };
      failures.set(JSON.stringify(result), result);
    }
  }
  return { checked, photographic, decorative, minimum: Number(minimum.toFixed(2)), failures: [...failures.values()] };
}

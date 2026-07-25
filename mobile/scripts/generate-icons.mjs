#!/usr/bin/env node
/**
 * Generate the Expo app icon set from the existing Muscat Bay brand assets.
 *
 * Source of truth (read-only, owned by the web app):
 *   muscatbay/app/public/mb-logo.png                  — brand mark, transparent
 *   muscatbay/app/public/icons/icon-512x512-maskable.png — mark on brand purple
 *
 * Everything this script writes lands in mobile/assets/images/ and is committed,
 * so a normal `npx expo prebuild` / EAS build never needs Python or PIL.
 *
 * Run:  node scripts/generate-icons.mjs      (requires python3 + Pillow)
 *
 * KNOWN LIMITATION: the brand master is only 512x512 raster. Everything above
 * that size is a Lanczos upscale of a 512px source and is therefore slightly
 * soft at 1024px. Replace assets/images/icon.png with a true 1024x1024 export
 * (or a vector re-render) before the App Store submission — see README.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(here, '..');
const webPublic = path.resolve(mobileRoot, '../muscatbay/app/public');
const out = path.join(mobileRoot, 'assets/images');

const py = `
import os
from PIL import Image

WEB = ${JSON.stringify(webPublic)}
OUT = ${JSON.stringify(out)}
BRAND_PURPLE = (78, 68, 86, 255)   # --primary #4E4456

os.makedirs(OUT, exist_ok=True)

mark = Image.open(os.path.join(WEB, 'mb-logo.png')).convert('RGBA')
maskable = Image.open(os.path.join(WEB, 'icons', 'icon-512x512-maskable.png')).convert('RGBA')

def on_bg(img, size, bg, scale=1.0):
    """Composite img centred on a solid square canvas."""
    canvas = Image.new('RGBA', (size, size), bg)
    inner = int(size * scale)
    resized = img.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.alpha_composite(resized, (off, off))
    return canvas

def transparent(img, size, scale=1.0):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    inner = int(size * scale)
    resized = img.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.alpha_composite(resized, (off, off))
    return canvas

# iOS / store icon: opaque, no alpha channel allowed by App Store Connect.
# Built from the transparent mark rather than the PWA maskable icon, because the
# latter has a faint rounded-square outline baked in that iOS would double up on.
on_bg(mark, 1024, BRAND_PURPLE, scale=0.66).convert('RGB').save(os.path.join(OUT, 'icon.png'))

# Android adaptive icon foreground: transparent, mark inside the 66% safe zone.
transparent(mark, 1024, scale=0.62).save(os.path.join(OUT, 'adaptive-icon.png'))

# Splash mark: transparent, rendered small and centred over the brand background.
transparent(mark, 512, scale=1.0).save(os.path.join(OUT, 'splash-icon.png'))

# Android notification icon: white silhouette on transparent (Android tints it).
sil = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
small = mark.resize((96, 96), Image.LANCZOS)
alpha = small.getchannel('A')
white = Image.new('RGBA', (96, 96), (255, 255, 255, 255))
sil.paste(white, (0, 0), alpha)
sil.save(os.path.join(OUT, 'notification-icon.png'))

# Web favicon (expo web export only).
on_bg(mark, 48, BRAND_PURPLE, scale=0.8).convert('RGB').save(os.path.join(OUT, 'favicon.png'))

for name in ('icon.png', 'adaptive-icon.png', 'splash-icon.png', 'notification-icon.png', 'favicon.png'):
    p = os.path.join(OUT, name)
    print(name, Image.open(p).size, Image.open(p).mode)
`;

execFileSync('python3', ['-c', py], { stdio: 'inherit' });

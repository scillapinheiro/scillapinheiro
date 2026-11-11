// Gera os assets estáticos do perfil: banner e divisor.
// Uso: node scripts/build-static.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

const C = {
  surface: '#1E2327',
  ink: '#15191C',
  cream: '#F2ECE2',
  coral: '#FF6B4A',
  lilac: '#B8A4FF',
  mint: '#8FE3C0',
  mute: '#8B9298',
};

// ---------- Banner: só forma, sem texto ----------
const banner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320" role="img" aria-label="Composição abstrata com formas arredondadas e uma curva de Bézier com pontos de ancoragem">
  <defs><clipPath id="r"><rect width="1200" height="320" rx="44"/></clipPath></defs>
  <g clip-path="url(#r)">
    <rect width="1200" height="320" fill="${C.surface}"/>
    <circle cx="1020" cy="110" r="175" fill="${C.coral}"/>
    <g transform="rotate(-10 795 165)">
      <rect x="700" y="70" width="190" height="190" rx="56" fill="${C.lilac}"/>
      <rect x="692" y="62" width="206" height="206" rx="6" fill="none" stroke="${C.cream}" stroke-width="2"/>
      <circle cx="692" cy="62" r="7" fill="${C.surface}" stroke="${C.cream}" stroke-width="2.5"/>
      <circle cx="898" cy="62" r="7" fill="${C.surface}" stroke="${C.cream}" stroke-width="2.5"/>
      <circle cx="692" cy="268" r="7" fill="${C.surface}" stroke="${C.cream}" stroke-width="2.5"/>
      <circle cx="898" cy="268" r="7" fill="${C.surface}" stroke="${C.cream}" stroke-width="2.5"/>
    </g>
    <rect x="440" y="214" width="210" height="72" rx="36" fill="${C.cream}"/>
    <circle cx="476" cy="250" r="16" fill="${C.ink}"/>
    <circle cx="170" cy="66" r="30" fill="${C.mint}"/>
    <g stroke="${C.cream}" stroke-width="1.5" stroke-dasharray="3 5" opacity="0.7" stroke-linecap="round">
      <line x1="-30" y1="250" x2="260" y2="70"/>
      <line x1="470" y1="300" x2="930" y2="60"/>
    </g>
    <path d="M -30 250 C 260 70, 470 300, 700 180 S 1000 260, 1240 150" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="260" cy="70" r="7" fill="${C.coral}"/>
    <circle cx="470" cy="300" r="7" fill="${C.coral}"/>
    <circle cx="930" cy="60" r="7" fill="${C.coral}"/>
    <circle cx="700" cy="180" r="10" fill="${C.surface}" stroke="${C.cream}" stroke-width="4"/>
  </g>
</svg>
`;
writeFileSync(join(out, 'banner.svg'), banner);

// ---------- Divisor ----------
const divider = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 28" role="presentation" aria-hidden="true">
  <path d="M 10 14 C 200 -6, 340 34, 415 14 S 640 -4 820 14" fill="none" stroke="${C.mute}" stroke-opacity="0.55" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="10" cy="14" r="6" fill="${C.coral}"/>
  <circle cx="415" cy="14" r="5" fill="${C.surface}" stroke="${C.mute}" stroke-width="2.5"/>
  <circle cx="820" cy="14" r="6" fill="${C.lilac}"/>
</svg>
`;
writeFileSync(join(out, 'divider.svg'), divider);

console.log('assets gerados em', out);

// Gera os badges de tecnologias (logo + nome, cantos arredondados), um SVG por grupo.
//
// Os logos vêm do simple-icons (CC0), a mesma fonte do shields.io. Na primeira execução
// cada ícone é baixado e guardado em scripts/icons/, e depois sempre usa a cópia local.
//
// Uso:  node scripts/build-badges.mjs
// Teste de layout sem internet: node scripts/build-badges.mjs --fake-icons --out ./preview
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const FAKE = args.includes('--fake-icons');
const outDir = resolve(opt('--out') ?? join(root, 'assets'));
const iconDir = join(root, 'scripts', 'icons');

const FONT = "ui-rounded, 'SF Pro Rounded', Nunito, 'Segoe UI', system-ui, -apple-system, sans-serif";
const INK = '#15191C';
const WHITE = '#FFFFFF';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// [nome, [slugs do simple-icons em ordem de tentativa], cor de fundo, cor do logo (opcional)]
// As cores são as mesmas dos shields que já estavam no README.
const groups = {
  'tech-frontend': [
    ['React', ['react'], '#20232A', '#61DAFB'],
    ['TypeScript', ['typescript'], '#007ACC'],
    ['JavaScript', ['javascript'], '#323330', '#F7DF1E'],
    ['Next.js', ['nextdotjs'], '#000000'],
    ['Gatsby', ['gatsby'], '#663399'],
    ['Vue.js', ['vuedotjs'], '#35495E', '#4FC08D'],
    ['Tailwind CSS', ['tailwindcss'], '#38B2AC'],
    ['Ant Design', ['antdesign'], '#0170FE'],
    ['Bootstrap', ['bootstrap'], '#563D7C'],
    ['CSS3', ['css3'], '#1572B6'],
    ['HTML5', ['html5'], '#E34F26'],
  ],
  'tech-backend': [
    ['Node.js', ['nodedotjs'], '#6DA55F'],
    ['NestJS', ['nestjs'], '#E0234E'],
    ['Fastify', ['fastify'], '#000000'],
    ['Prisma', ['prisma'], '#3982CE'],
    ['API REST', [], '#005571'],
    ['BFF', [], '#6B7280'],
  ],
  'tech-mobile': [
    ['Flutter', ['flutter'], '#02569B'],
    ['Dart', ['dart'], '#0175C2'],
  ],
  'tech-outras': [
    ['PHP', ['php'], '#777BB4'],
    ['Laravel', ['laravel'], '#FF2D20'],
  ],
  'tech-banco': [
    ['Supabase', ['supabase'], '#3FCF8E'],
    ['PostgreSQL', ['postgresql'], '#4169E1'],
    ['DBeaver', ['dbeaver'], '#382923'],
  ],
  'tech-ferramentas': [
    ['Postman', ['postman'], '#FF6C37'],
    ['Insomnia', ['insomnia'], '#4000BF'],
    ['Git', ['git'], '#F05032'],
    ['GitHub', ['github'], '#181717'],
    ['Bitbucket', ['bitbucket'], '#0052CC'],
  ],
  'tech-ia': [
    ['Claude Code', ['claudecode', 'claude'], '#D97757'],
    ['Codex', [], '#000000'],
  ],
};

// ---------- Ícones ----------
const VERSIONS = ['latest', '14', '13', '11'];
const FAKE_PATH = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10z';
const missing = [];

async function iconPath(name, slugs) {
  if (FAKE) return slugs.length ? FAKE_PATH : null;
  mkdirSync(iconDir, { recursive: true });
  for (const slug of slugs) {
    const file = join(iconDir, `${slug}.svg`);
    let svg = existsSync(file) ? readFileSync(file, 'utf8') : null;
    if (!svg) {
      for (const v of VERSIONS) {
        try {
          const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@${v}/icons/${slug}.svg`);
          if (!res.ok) continue;
          const text = await res.text();
          if (text.includes('<path')) { svg = text; writeFileSync(file, text); break; }
        } catch { /* tenta a próxima versão */ }
      }
    }
    const m = svg && svg.match(/<path[^>]*\sd="([^"]+)"/);
    if (m) return m[1];
  }
  if (slugs.length) missing.push(name);
  return null;
}

// ---------- Cores ----------
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// branco quando contrasta bem com o fundo, grafite quando o fundo é claro (ex.: verde do Supabase)
const textOn = (bg) => (contrast(bg, WHITE) >= 3.5 ? WHITE : INK);

// ---------- Desenho ----------
const H = 34, GAP = 8, MAX = 830, PAD = 2, LOGO = 18;

async function badges(items) {
  let x = PAD, y = PAD;
  const parts = [];
  for (const [name, slugs, bg, logoColor] of items) {
    const d = await iconPath(name, slugs);
    const fg = textOn(bg);
    const textX = d ? 14 + LOGO + 8 : 18;
    const w = textX + Math.ceil([...name].length * 8.8) + 18;
    if (x + w > MAX - PAD) { x = PAD; y += H + GAP; }
    const logo = d
      ? `<path transform="translate(14 ${(H - LOGO) / 2}) scale(${LOGO / 24})" d="${d}" fill="${logoColor ?? fg}"/>`
      : '';
    parts.push(
      `  <g transform="translate(${x} ${y})">` +
      `<rect width="${w}" height="${H}" rx="${H / 2}" fill="${bg}" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1"/>` +
      logo +
      `<text x="${textX}" y="${H / 2 + 5}" font-family="${FONT}" font-size="14" font-weight="700" fill="${fg}">${esc(name)}</text>` +
      `</g>`
    );
    x += w + GAP;
  }
  const total = y + H + PAD;
  const label = items.map(([n]) => n).join(', ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAX} ${total}" role="img" aria-label="${esc(label)}">\n${parts.join('\n')}\n</svg>\n`;
}

mkdirSync(outDir, { recursive: true });
for (const [file, items] of Object.entries(groups)) {
  writeFileSync(join(outDir, `${file}.svg`), await badges(items));
}
console.log('badges gerados em', outDir);
if (missing.length) console.log('sem logo (ícone não encontrado):', missing.join(', '));

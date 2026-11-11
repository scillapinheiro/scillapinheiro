// Gera os cards do perfil (stats, linguagens, atividade) como SVG.
//
// Dados reais:   GITHUB_TOKEN=... GH_LOGIN=scillapinheiro node scripts/generate-cards.mjs
// Dados de teste: node scripts/generate-cards.mjs --fixture scripts/fixture.sample.json --out ./preview
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const outDir = resolve(opt('--out') ?? join(root, 'assets'));

const C = {
  ink: '#15191C',
  surface: '#1E2327',
  cream: '#F2ECE2',
  coral: '#FF6B4A',
  lilac: '#B8A4FF',
  mint: '#8FE3C0',
  mute: '#8B9298',
  other: '#4A525A',
  empty: '#2A3138',
};
const FONT = "ui-rounded, 'SF Pro Rounded', Nunito, 'Segoe UI', system-ui, -apple-system, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => Number(n).toLocaleString('pt-BR');
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;

// ---------- Dados ----------
async function fetchLive(login, token) {
  const query = `query($login:String!){
    user(login:$login){
      followers{ totalCount }
      pullRequests{ totalCount }
      repositories(ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC, first:100){
        totalCount
        nodes{ stargazerCount languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } }
      }
      contributionsCollection{
        contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
      }
    }
  }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-cards' },
    body: JSON.stringify({ query, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub respondeu ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  const u = json.data.user;

  const langs = new Map();
  let stars = 0;
  for (const r of u.repositories.nodes) {
    stars += r.stargazerCount;
    for (const e of r.languages.edges) langs.set(e.node.name, (langs.get(e.node.name) ?? 0) + e.size);
  }
  const cal = u.contributionsCollection.contributionCalendar;
  return {
    totals: {
      repos: u.repositories.totalCount,
      stars,
      prs: u.pullRequests.totalCount,
      followers: u.followers.totalCount,
      contributions: cal.totalContributions,
    },
    languages: [...langs].map(([name, size]) => ({ name, size })).sort((a, b) => b.size - a.size),
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))),
  };
}

function streaks(weeks) {
  const days = weeks.flat();
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--; // hoje ainda pode estar zerado
  let current = 0;
  while (i >= 0 && days[i].count > 0) { current++; i--; }
  return { current, longest };
}

// ---------- Cards ----------
function statsCard(d) {
  const tiles = [
    [d.totals.repos, 'repositórios'],
    [d.totals.stars, 'estrelas'],
    [d.totals.prs, 'pull requests'],
  ];
  const tileW = 112, gap = 10, x0 = 24;
  const tileSvg = tiles.map(([n, label], i) => {
    const x = x0 + i * (tileW + gap);
    return `<rect x="${x}" y="150" width="${tileW}" height="84" rx="22" fill="${C.ink}"/>` +
      `<text x="${x + 16}" y="192" font-family="${FONT}" font-size="28" font-weight="800" fill="${C.cream}">${fmt(n)}</text>` +
      `<text x="${x + 16}" y="214" font-family="${FONT}" font-size="12" font-weight="600" fill="${C.mute}">${esc(label)}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 405 260" role="img" aria-label="${fmt(d.totals.contributions)} contribuições no último ano, ${fmt(d.totals.repos)} repositórios, ${fmt(d.totals.stars)} estrelas, ${fmt(d.totals.prs)} pull requests">
  <rect width="405" height="260" rx="32" fill="${C.surface}"/>
  <text x="28" y="44" font-family="${FONT}" font-size="13" font-weight="600" fill="${C.mute}">contribuições no último ano</text>
  <text x="26" y="118" font-family="${FONT}" font-size="76" font-weight="800" fill="${C.coral}">${fmt(d.totals.contributions)}</text>
  ${tileSvg}
</svg>
`;
}

function languagesCard(d) {
  const total = d.languages.reduce((s, l) => s + l.size, 0) || 1;
  const top = d.languages.slice(0, 4).map((l) => ({ name: l.name, pct: (l.size / total) * 100 }));
  const rest = 100 - top.reduce((s, l) => s + l.pct, 0);
  if (rest > 0.05) top.push({ name: 'outras', pct: rest });
  const colors = [C.coral, C.lilac, C.mint, C.cream, C.other];

  const barX = 28, barW = 349, barY = 62, barH = 22;
  let cx = barX;
  const segs = top.map((l, i) => {
    const w = (l.pct / 100) * barW;
    const s = `<rect x="${cx.toFixed(2)}" y="${barY}" width="${w.toFixed(2)}" height="${barH}" fill="${colors[i]}" stroke="${C.surface}" stroke-width="3"/>`;
    cx += w;
    return s;
  }).join('');
  const rows = top.map((l, i) => {
    const y = 122 + i * 28;
    return `<circle cx="34" cy="${y - 5}" r="6" fill="${colors[i]}"/>` +
      `<text x="50" y="${y}" font-family="${FONT}" font-size="15" font-weight="600" fill="${C.cream}">${esc(l.name)}</text>` +
      `<text x="377" y="${y}" text-anchor="end" font-family="${FONT}" font-size="15" font-weight="700" fill="${C.mute}">${l.pct.toFixed(1).replace('.', ',')}%</text>`;
  }).join('');
  const label = top.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 405 260" role="img" aria-label="Linguagens mais usadas: ${esc(label)}">
  <defs><clipPath id="bar"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="11"/></clipPath></defs>
  <rect width="405" height="260" rx="32" fill="${C.surface}"/>
  <text x="28" y="44" font-family="${FONT}" font-size="13" font-weight="600" fill="${C.mute}">linguagens mais usadas</text>
  <g clip-path="url(#bar)">${segs}</g>
  ${rows}
</svg>
`;
}

function activityCard(d) {
  const { current, longest } = streaks(d.weeks);
  const all = d.weeks.flat().map((x) => x.count);
  const max = Math.max(1, ...all);
  const level = (n) => (n <= 0 ? 0 : Math.max(1, Math.ceil((n / max) * 4)));
  const fills = [C.empty, C.coral, C.coral, C.coral, C.coral];
  const opac = [1, 0.35, 0.55, 0.78, 1];

  const r = 5.5, gx = 32, gy = 112;
  // distribui as semanas na largura do card, com a mesma margem dos dois lados
  const pitch = Math.min(16, (830 - 2 * gx - 2 * r) / Math.max(1, d.weeks.length - 1));
  const dots = d.weeks.map((week, wi) => week.map((day, di) => {
    const lv = level(day.count);
    return `<circle cx="${(gx + r + wi * pitch).toFixed(1)}" cy="${(gy + r + di * pitch).toFixed(1)}" r="${r}" fill="${fills[lv]}" fill-opacity="${opac[lv]}"/>`;
  }).join('')).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 240" role="img" aria-label="Sequência atual de ${plural(current, 'dia', 'dias')}, maior sequência de ${plural(longest, 'dia', 'dias')}, mapa de contribuições do último ano">
  <rect width="830" height="240" rx="32" fill="${C.surface}"/>
  <text x="32" y="44" font-family="${FONT}" font-size="13" font-weight="600" fill="${C.mute}">sequência atual</text>
  <text x="32" y="84" font-family="${FONT}" font-size="34" font-weight="800" fill="${C.cream}">${plural(current, 'dia', 'dias')}</text>
  <text x="250" y="44" font-family="${FONT}" font-size="13" font-weight="600" fill="${C.mute}">maior sequência</text>
  <text x="250" y="84" font-family="${FONT}" font-size="34" font-weight="800" fill="${C.cream}">${plural(longest, 'dia', 'dias')}</text>
  ${dots}
</svg>
`;
}

// ---------- Main ----------
async function main() {
  let data;
  const fixture = opt('--fixture');
  if (fixture) {
    data = JSON.parse(readFileSync(resolve(fixture), 'utf8'));
  } else {
    const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
    const login = process.env.GH_LOGIN;
    if (!token || !login) throw new Error('Defina GITHUB_TOKEN e GH_LOGIN (ou use --fixture).');
    data = await fetchLive(login, token);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'stats.svg'), statsCard(data));
  writeFileSync(join(outDir, 'languages.svg'), languagesCard(data));
  writeFileSync(join(outDir, 'activity.svg'), activityCard(data));
  console.log('cards gerados em', outDir);
}

main().catch((e) => { console.error(e.message); process.exit(1); });

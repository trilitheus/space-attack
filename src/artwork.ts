import type { AlienKind } from './waves';

// SVG artwork is rasterised at double resolution by Phaser for crisp, smooth sprites.
const palettes = {
  1: { light: '#ffb7ad', body: '#ef677b', shadow: '#91384f' },
  2: { light: '#ffe0a0', body: '#f4aa55', shadow: '#a45a32' },
  3: { light: '#e2fbb0', body: '#a1ce69', shadow: '#4e8051' },
};
const wrap = (width: number, height: number, content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;

const silhouettes: Record<AlienKind, string> = {
  scout: 'M24 5 C30 5 33 11 35 16 L45 27 Q47 31 42 31 L32 28 Q24 36 16 28 L6 31 Q1 31 3 27 L13 16 C15 11 18 5 24 5Z',
  crab: 'M13 15 Q9 6 5 9 Q1 13 7 22 L4 28 Q3 32 8 31 L14 27 Q24 35 34 27 L40 31 Q45 32 44 28 L41 22 Q47 13 43 9 Q39 6 35 15 Q24 6 13 15Z',
  manta: 'M24 9 C15 16 9 18 3 8 Q0 26 14 29 Q19 29 24 36 Q29 29 34 29 Q48 26 45 8 C39 18 33 16 24 9Z',
  squid: 'M10 22 C8 12 14 4 24 4 C34 4 40 12 38 22 L36 29 Q37 34 41 34 Q35 39 31 30 Q28 39 24 32 Q20 39 17 30 Q13 39 7 34 Q11 34 12 29Z',
};

export function alienArtwork(kind: AlienKind, health: number): string {
  const p = palettes[health as keyof typeof palettes];
  const eyeY = kind === 'manta' ? 22 : 19;
  const antenna = kind === 'scout'
    ? '<path d="M24 6V2" stroke="#c4d6e2" stroke-width="2"/><circle cx="24" cy="2" r="1.7" fill="#f8efd5"/>'
    : kind === 'crab' ? '<path d="M17 12L14 5M31 12L34 5" stroke="#536078" stroke-width="2.2" stroke-linecap="round"/>' : '';
  return wrap(48, 40, `
    <defs><linearGradient id="body-${kind}-${health}" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="${p.light}"/><stop offset=".45" stop-color="${p.body}"/><stop offset="1" stop-color="${p.shadow}"/></linearGradient></defs>
    ${antenna}<path d="${silhouettes[kind]}" fill="url(#body-${kind}-${health})" stroke="#202938" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M18 12Q24 8 30 12" fill="none" stroke="${p.light}" stroke-width="2" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="18" cy="${eyeY}" rx="4.6" ry="4" fill="#182333"/>
    <ellipse cx="30" cy="${eyeY}" rx="4.6" ry="4" fill="#182333"/>
    <ellipse cx="18.8" cy="${eyeY-.5}" rx="2.2" ry="2.6" fill="#f8efda"/>
    <ellipse cx="29.2" cy="${eyeY-.5}" rx="2.2" ry="2.6" fill="#f8efda"/>
    <circle cx="19.4" cy="${eyeY}" r="1.1" fill="#26364b"/><circle cx="28.6" cy="${eyeY}" r="1.1" fill="#26364b"/>
    <path d="M13 14L22 17M35 14L26 17" stroke="${p.shadow}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M21 27Q24 28.5 27 27" fill="none" stroke="#263044" stroke-width="1.4" stroke-linecap="round"/>
  `);
}

export const shipArtwork = wrap(56, 62, `
  <defs>
    <linearGradient id="hull" x2=".8" y2="1"><stop stop-color="#f5f1df"/><stop offset=".5" stop-color="#c0d1d7"/><stop offset="1" stop-color="#647a91"/></linearGradient>
    <linearGradient id="wing" x2="0" y2="1"><stop stop-color="#a8cf91"/><stop offset="1" stop-color="#477264"/></linearGradient>
    <linearGradient id="glass" x2=".7" y2="1"><stop stop-color="#a2edf0"/><stop offset=".4" stop-color="#377a96"/><stop offset="1" stop-color="#19354f"/></linearGradient>
  </defs>
  <path d="M20 26L5 42Q2 46 4 52L20 47M36 26L51 42Q54 46 52 52L36 47" fill="url(#wing)" stroke="#1c293c" stroke-width="2" stroke-linejoin="round"/>
  <path d="M28 3C22 11 18 23 18 38L20 53Q28 58 36 53L38 38C38 23 34 11 28 3Z" fill="url(#hull)" stroke="#202d41" stroke-width="2"/>
  <path d="M28 14Q21 24 23 35Q28 39 33 35Q35 24 28 14Z" fill="url(#glass)" stroke="#314b60" stroke-width="1.5"/>
  <path d="M27 19Q24 25 25 30" stroke="#ddffff" stroke-width="1.7" stroke-linecap="round" fill="none" opacity=".7"/>
  <path d="M22 43H34L33 51H23Z" fill="#4f6576"/>
  <path d="M25 45H31M25 48H31" stroke="#a8ce94" stroke-width="1.4"/>
  <path d="M8 44L15 40M48 44L41 40" stroke="#d7e8bb" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="8" cy="49" r="1.8" fill="#d4f5b2"/><circle cx="48" cy="49" r="1.8" fill="#d4f5b2"/>
`);

export const flameArtwork = wrap(20, 36, `
  <defs><linearGradient id="flame" x2="0" y2="1"><stop stop-color="#f7eac4"/><stop offset=".4" stop-color="#76d2dd"/><stop offset="1" stop-color="#4387bd" stop-opacity="0"/></linearGradient></defs>
  <path d="M3 2Q10 0 17 2Q20 17 10 34Q0 17 3 2Z" fill="url(#flame)"/>
  <path d="M7 2H13Q15 13 10 22Q5 13 7 2Z" fill="#eefbff" opacity=".8"/>
`);

export const shotArtwork = wrap(14, 30, `
  <defs><linearGradient id="missile-hull" x2="1" y2="0"><stop stop-color="#476372"/><stop offset=".45" stop-color="#e4efe8"/><stop offset="1" stop-color="#789599"/></linearGradient></defs>
  <ellipse cx="7" cy="7" rx="6" ry="6" fill="#b9f398" opacity=".12"/>
  <path d="M4 19L1 26L5 24M10 19L13 26L9 24" fill="#7ba886" stroke="#273d46" stroke-width=".8" stroke-linejoin="round"/>
  <path d="M7 3Q4 6 4 10V23Q7 26 10 23V10Q10 6 7 3Z" fill="url(#missile-hull)" stroke="#2b404c" stroke-width="1"/>
  <path d="M7 3Q4 6 4 10H10Q10 6 7 3Z" fill="#c9f4a7"/>
  <path d="M5.5 11V18" stroke="#f5fff2" stroke-width="1" stroke-linecap="round"/>
  <path d="M4 20H10M5 24H9" stroke="#416350" stroke-width="1"/>
`);

export const hostileShotArtwork = wrap(14, 30, `
  <defs><linearGradient id="alien-missile" x2="1" y2="0"><stop stop-color="#713746"/><stop offset=".45" stop-color="#f0c4bd"/><stop offset="1" stop-color="#a45d71"/></linearGradient></defs>
  <ellipse cx="7" cy="7" rx="6" ry="6" fill="#ff887e" opacity=".15"/>
  <path d="M4 19L1 25L5 23M10 19L13 25L9 23" fill="#ba647b" stroke="#422a40" stroke-width=".8" stroke-linejoin="round"/>
  <path d="M7 3L11 10L9 23Q7 25 5 23L3 10Z" fill="url(#alien-missile)" stroke="#492b40" stroke-width="1" stroke-linejoin="round"/>
  <path d="M7 3L11 10H3Z" fill="#ffada0"/>
  <path d="M6 12L5.8 17" stroke="#ffe4d4" stroke-width="1" stroke-linecap="round"/>
  <path d="M5 20H9" stroke="#87475e" stroke-width="1"/>
`);

export const wormholeArtwork = wrap(220, 220, `
  <defs>
    <radialGradient id="portal-glow"><stop offset=".48" stop-color="#10102b"/><stop offset=".68" stop-color="#474099" stop-opacity=".7"/><stop offset=".8" stop-color="#a28bea" stop-opacity=".5"/><stop offset="1" stop-color="#7762ce" stop-opacity="0"/></radialGradient>
    <radialGradient id="portal-core"><stop stop-color="#060a16"/><stop offset=".8" stop-color="#171b3e"/><stop offset="1" stop-color="#5655a1"/></radialGradient>
  </defs>
  <circle cx="110" cy="110" r="108" fill="url(#portal-glow)"/>
  <circle cx="110" cy="110" r="70" fill="url(#portal-core)" stroke="#bca6f3" stroke-width="2"/>
  <circle cx="110" cy="110" r="75" fill="none" stroke="#8eaef1" stroke-width="3" opacity=".45"/>
  <g fill="none" stroke-linecap="round">
    <path d="M45 108C46 35 154 28 177 92" stroke="#dacaff" stroke-width="3"/>
    <path d="M175 116C174 185 66 193 43 128" stroke="#97dce9" stroke-width="3"/>
    <path d="M70 114C63 73 124 57 143 92C161 127 119 151 94 132C73 116 91 91 110 102" stroke="#a39de7" stroke-width="2" opacity=".7"/>
    <path d="M133 165C184 143 163 67 125 65" stroke="#c9b4ff" stroke-width="1.5" opacity=".7"/>
  </g>
  <circle cx="47" cy="93" r="3" fill="#e3d9ff"/><circle cx="171" cy="130" r="2.5" fill="#b8f1ff"/>
`);

export const earthArtwork = wrap(1200, 220, `
  <defs><radialGradient id="earth-atmosphere" cx=".5" cy="1" r=".9"><stop stop-color="#193951"/><stop offset=".76" stop-color="#102336"/><stop offset=".94" stop-color="#317088"/><stop offset="1" stop-color="#90cddd"/></radialGradient></defs>
  <path d="M-100 240Q600 -110 1300 240Z" fill="url(#earth-atmosphere)" stroke="#81bbc9" stroke-width="2"/>
  <path d="M60 186Q170 140 280 158L333 195L264 220H95ZM726 152L789 130L876 141L917 182L1040 209H835L780 183Z" fill="#376866" opacity=".3"/>
  <path d="M130 185Q295 111 423 142M722 131Q875 126 999 184" fill="none" stroke="#bddee0" stroke-width="8" opacity=".12" stroke-linecap="round"/>
`);

// Phaser's data-URL loader decodes with atob, so it requires a base64 payload.
export const svgData = (svg: string) => {
  const bytes = new TextEncoder().encode(svg);
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return `data:image/svg+xml;base64,${btoa(binary)}`;
};

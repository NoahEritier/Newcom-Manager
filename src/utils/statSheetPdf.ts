import { STAT_FIELDS } from './statFields';

export type StatSheetMatchInfo = {
  opponent: string;
  matchDateLabel: string;
};

export type StatSheetPlayer = {
  id: string;
  full_name: string;
  jersey_number: number | null;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderBoxes(maxCount: number): string {
  const boxes: string[] = [];
  for (let i = 0; i < maxCount; i++) {
    boxes.push(`<div class="box"><span>${i}</span></div>`);
  }
  boxes.push(`<div class="box box-plus"><span>${maxCount}+</span></div>`);
  return boxes.join('');
}

function renderRow(label: string, maxCount: number): string {
  return `
    <div class="stat-row">
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="boxes">${renderBoxes(maxCount)}</div>
    </div>
  `;
}

function renderSections(): string {
  const sections: string[] = [];
  let currentSection: string | null = null;
  let sectionHtml = '';
  for (const field of STAT_FIELDS) {
    if (field.section !== currentSection) {
      if (currentSection !== null) sections.push(sectionHtml);
      currentSection = field.section;
      sectionHtml = `<div class="section-title">${escapeHtml(field.section)}</div>`;
    }
    sectionHtml += renderRow(field.label, field.maxCount);
  }
  if (currentSection !== null) sections.push(sectionHtml);
  return sections.join('');
}

function renderPlayerPage(match: StatSheetMatchInfo, player: StatSheetPlayer): string {
  const jersey = player.jersey_number != null ? ` &nbsp;&nbsp; Camiseta: #${player.jersey_number}` : '';
  return `
    <section class="player-page">
      <div class="header">
        <h1>Newcom Manager — Planilla de estadísticas</h1>
        <p>Partido: vs ${escapeHtml(match.opponent)} &nbsp;&nbsp; Fecha: ${escapeHtml(match.matchDateLabel)}</p>
        <p class="player-name">Jugador: ${escapeHtml(player.full_name)}${jersey}</p>
        <p class="instructions">Marcá UN casillero por fila: el número total de esa estadística en este partido.</p>
      </div>
      <div class="grid-frame">
        <div class="fiducial fiducial-tl"></div>
        <div class="fiducial fiducial-tr"></div>
        <div class="fiducial fiducial-bl"></div>
        <div class="fiducial fiducial-br"></div>
        ${renderSections()}
      </div>
    </section>
  `;
}

const CSS = `
  @page { size: A4; margin: 12mm; }
  body { font-family: Helvetica, Arial, sans-serif; color: #111; }
  .player-page { page-break-after: always; }
  .player-page:last-child { page-break-after: avoid; }
  .header h1 { font-size: 13pt; margin: 0 0 4mm 0; }
  .header p { font-size: 9pt; margin: 0 0 1mm 0; }
  .player-name { font-size: 11pt !important; font-weight: bold; margin-top: 2mm !important; }
  .instructions { font-style: italic; color: #444; margin-top: 2mm !important; }
  .grid-frame { position: relative; border: 0.3mm solid #000; margin-top: 5mm; padding: 8mm 6mm; }
  .fiducial { position: absolute; width: 6mm; height: 6mm; background: #000; }
  .fiducial-tl { top: -3mm; left: -3mm; }
  .fiducial-tr { top: -3mm; right: -3mm; }
  .fiducial-bl { bottom: -3mm; left: -3mm; }
  .fiducial-br { bottom: -3mm; right: -3mm; }
  .section-title { font-size: 10pt; font-weight: bold; margin-top: 4mm; margin-bottom: 1mm; }
  .stat-row { display: flex; align-items: center; margin-bottom: 1mm; }
  .stat-label { width: 28mm; flex-shrink: 0; font-size: 8pt; }
  .boxes { display: flex; flex-wrap: nowrap; gap: 0.8mm; }
  .box {
    width: 7mm; height: 7mm; border: 0.3mm solid #000;
    display: flex; align-items: center; justify-content: center;
    font-size: 6pt; flex-shrink: 0;
  }
  .box-plus { font-size: 5pt; }
`;

export function buildStatSheetHtml(match: StatSheetMatchInfo, players: StatSheetPlayer[]): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><style>${CSS}</style></head>
  <body>
    ${players.map((p) => renderPlayerPage(match, p)).join('')}
  </body>
</html>`;
}

// Ember Court — canvas rendering. Every frame draws the whole table from
// the state, and returns the hit regions the input layer uses.
import { CARDS, COLORS, HEROES, RULES, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const HAND_W = 148;
const HAND_H = 196;
const BOARD_W = 118;
const BOARD_H = 148;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// Small drawn sigils — the game's own art, no images.
export function drawSigil(ctx, sigil, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.08;
  ctx.lineJoin = 'round';
  if (sigil === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.bezierCurveTo(s * 0.45, -s * 0.1, s * 0.35, s * 0.35, 0, s * 0.5);
    ctx.bezierCurveTo(-s * 0.35, s * 0.35, -s * 0.45, -s * 0.1, 0, -s * 0.55);
    ctx.fill();
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.arc(0, s * 0.18, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (sigil === 'shield') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(s * 0.42, -s * 0.28);
    ctx.lineTo(s * 0.36, s * 0.2);
    ctx.quadraticCurveTo(s * 0.2, s * 0.5, 0, s * 0.55);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.5, -s * 0.36, s * 0.2);
    ctx.lineTo(-s * 0.42, -s * 0.28);
    ctx.closePath();
    ctx.fill();
  } else if (sigil === 'claw') {
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.28 - s * 0.1, s * 0.45);
      ctx.quadraticCurveTo(i * s * 0.28 - s * 0.22, -s * 0.1, i * s * 0.28, -s * 0.5);
      ctx.quadraticCurveTo(i * s * 0.28 + s * 0.22, -s * 0.1, i * s * 0.28 + s * 0.1, s * 0.45);
      ctx.closePath();
      ctx.fill();
    }
  } else if (sigil === 'wing') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.35);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.5, s * 0.15, -s * 0.45);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.4, s * 0.45, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.2, s * 0.05, s * 0.05, s * 0.2);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.45, -s * 0.5, s * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (sigil === 'stone') {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const px = Math.cos(a) * s * 0.5;
      const py = Math.sin(a) * s * 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(s * 0.43, -s * 0.25);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  } else if (sigil === 'crown') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, s * 0.4);
    ctx.lineTo(-s * 0.45, -s * 0.1);
    ctx.lineTo(-s * 0.2, s * 0.08);
    ctx.lineTo(0, -s * 0.45);
    ctx.lineTo(s * 0.2, s * 0.08);
    ctx.lineTo(s * 0.45, -s * 0.1);
    ctx.lineTo(s * 0.45, s * 0.4);
    ctx.closePath();
    ctx.fill();
  } else if (sigil === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(s * 0.12, -s * 0.55);
    ctx.lineTo(-s * 0.3, s * 0.08);
    ctx.lineTo(-s * 0.02, s * 0.08);
    ctx.lineTo(-s * 0.12, s * 0.55);
    ctx.lineTo(s * 0.3, -s * 0.08);
    ctx.lineTo(s * 0.02, -s * 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (sigil === 'heart') {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.45);
    ctx.bezierCurveTo(-s * 0.55, 0, -s * 0.4, -s * 0.5, 0, -s * 0.15);
    ctx.bezierCurveTo(s * 0.4, -s * 0.5, s * 0.55, 0, 0, s * 0.45);
    ctx.fill();
  } else if (sigil === 'burst') {
    ctx.beginPath();
    for (let i = 0; i < 16; i += 1) {
      const a = (Math.PI / 8) * i - Math.PI / 2;
      const r = i % 2 === 0 ? s * 0.52 : s * 0.22;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (sigil === 'eye') {
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#171019';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGem(ctx, x, y, r, fill, label, labelColor = '#fff') {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.stroke();
  text(ctx, String(label), x, y + 1, r * 1.05, labelColor);
}

function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const { selected = false, playable = true, dimmed = false, small = false } = opts;
  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.55;
  // Card body.
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = card.kind === 'spell' ? '#3a2338' : '#33202c';
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? COLORS.gold : COLORS.panelEdge;
  ctx.stroke();
  // Cost gem.
  drawGem(ctx, x + 20, y + 20, 15, '#2b6cb0', card.cost);
  // Name: centred on full-size cards; on small board cards it starts clear
  // of the cost gem so the first letter is never covered.
  const nameSize = small ? 12 : 15;
  ctx.fillStyle = COLORS.ink;
  ctx.font = `bold ${nameSize}px Georgia, serif`;
  ctx.textBaseline = 'middle';
  if (small) {
    ctx.textAlign = 'left';
    ctx.fillText(card.name, x + 38, y + 20);
  } else {
    ctx.textAlign = 'center';
    const name = card.name.length > 14 ? card.name.replace(' ', '\n') : card.name;
    const lines = name.split('\n');
    lines.forEach((line, i) => ctx.fillText(line, x + w / 2 + 6, y + 20 + (i - (lines.length - 1) / 2) * (nameSize + 2)));
  }
  // Art panel with sigil.
  const artY = y + 44;
  const artH = small ? h * 0.42 : h * 0.44;
  rr(ctx, x + 10, artY, w - 20, artH, 6);
  ctx.fillStyle = '#1d1218';
  ctx.fill();
  ctx.strokeStyle = 'rgba(242,181,68,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawSigil(ctx, card.sigil, x + w / 2, artY + artH / 2, Math.min(w, artH) * 0.62, card.kind === 'spell' ? COLORS.blue : COLORS.ember);
  // Rules text.
  ctx.fillStyle = '#ddd0bd';
  ctx.font = `italic ${small ? 11 : 12}px Georgia, serif`;
  ctx.textAlign = 'center';
  const words = card.text.split(' ');
  let line = '';
  const wrapped = [];
  for (const word of words) {
    if ((line + ' ' + word).trim().length > 20) {
      wrapped.push(line.trim());
      line = word;
    } else line += ' ' + word;
  }
  wrapped.push(line.trim());
  wrapped.slice(0, 2).forEach((l, i) => ctx.fillText(l, x + w / 2, y + h - (small ? 46 : 52) + i * 13));
  // Attack / health pips for creatures.
  if (card.kind === 'creature') {
    drawGem(ctx, x + 22, y + h - 20, 15, '#c05621', card.attack);
    drawGem(ctx, x + w - 22, y + h - 20, 15, '#c0392b', Math.max(0, card.health));
  } else {
    ctx.fillStyle = COLORS.blue;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPELL', x + w / 2, y + h - 20);
  }
  if (!playable) {
    ctx.fillStyle = 'rgba(10,5,8,0.45)';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeroPanel(ctx, side, x, y, w, align, isActive) {
  const hero = HEROES[side.hero];
  const hpFrac = Math.max(0, side.hp) / side.maxHp;
  ctx.save();
  rr(ctx, x, y, w, 86, 10);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.lineWidth = isActive ? 3 : 1.5;
  ctx.strokeStyle = isActive ? COLORS.gold : COLORS.panelEdge;
  ctx.stroke();
  // Portrait.
  const px = align === 'left' ? x + 44 : x + w - 44;
  ctx.beginPath();
  ctx.arc(px, y + 43, 32, 0, Math.PI * 2);
  ctx.fillStyle = side.hero === 'player' ? '#7a3b12' : '#3d2b4d';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  drawSigil(ctx, hero.sigil, px, y + 43, 34, COLORS.gold);
  // Name + title.
  const tx = align === 'left' ? x + 88 : x + w - 88;
  const tAlign = align === 'left' ? 'left' : 'right';
  text(ctx, hero.name, tx, y + 22, 19, COLORS.ink, tAlign);
  text(ctx, hero.title, tx, y + 44, 11, COLORS.inkDim, tAlign, 'normal italic');
  // HP bar.
  const barX = align === 'left' ? x + 88 : x + w - 88 - 150;
  const barY = y + 60;
  rr(ctx, barX, barY, 150, 14, 7);
  ctx.fillStyle = '#1a1214';
  ctx.fill();
  if (hpFrac > 0) {
    rr(ctx, barX, barY, Math.max(14, 150 * hpFrac), 14, 7);
    ctx.fillStyle = hpFrac > 0.5 ? COLORS.green : hpFrac > 0.25 ? COLORS.gold : COLORS.red;
    ctx.fill();
  }
  text(ctx, `${Math.max(0, side.hp)} / ${side.maxHp}`, barX + 75, barY + 7, 11, '#fff');
  ctx.restore();
  return { x, y, w, h: 86 };
}

function drawMana(ctx, side, x, y) {
  for (let i = 0; i < RULES.maxMana; i += 1) {
    const cx = x + i * 24;
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    const filled = i < side.mana;
    if (filled) {
      ctx.fillStyle = '#6fd3ff';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.fillStyle = 'rgba(76,194,255,0.12)';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    }
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  }
  text(ctx, `${side.mana}/${side.maxMana}`, x + RULES.maxMana * 24 + 8, y, 14, COLORS.mana, 'left');
}

function drawDeckPile(ctx, count, x, y, label) {
  ctx.save();
  for (let i = 2; i >= 0; i -= 1) {
    rr(ctx, x + i * 3, y + i * 3, 54, 74, 6);
    ctx.fillStyle = COLORS.cardBack;
    ctx.fill();
    ctx.strokeStyle = COLORS.goldDim;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  drawSigil(ctx, 'flame', x + 27, y + 30, 30, COLORS.ember);
  // Count sits on the pile; the label goes to its right so nothing clips.
  text(ctx, String(count), x + 27, y + 62, 14, COLORS.ink);
  text(ctx, label, x + 66, y + 37, 11, COLORS.inkDim, 'left', 'normal');
  ctx.restore();
}

function drawTitle(ctx, ui) {
  const { width, height } = VIEW;
  // Warm glow behind the title.
  const glow = ctx.createRadialGradient(width / 2, 190, 20, width / 2, 190, 420);
  glow.addColorStop(0, 'rgba(255,122,47,0.28)');
  glow.addColorStop(1, 'rgba(255,122,47,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  text(ctx, 'EMBER COURT', width / 2, 150, 84, COLORS.gold);
  text(ctx, 'a duel of cards, fire and nerve', width / 2, 205, 20, COLORS.inkDim, 'center', 'normal italic');
  // Fanned sample cards.
  const samples = [CARDS.phoenix, CARDS.drake, CARDS.queen, CARDS.golem, CARDS.falcon];
  samples.forEach((def, i) => {
    const cx = width / 2 + (i - 2) * 152;
    ctx.save();
    ctx.translate(cx, 400);
    ctx.rotate((i - 2) * 0.06);
    drawCard(ctx, { ...def, uid: 0, attack: def.attack ?? 0, health: def.health ?? 0 }, -HAND_W / 2, -HAND_H / 2, HAND_W, HAND_H, {});
    ctx.restore();
  });
  // Play button.
  const btn = { x: width / 2 - 150, y: 540, w: 300, h: 56 };
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 12);
  ctx.fillStyle = COLORS.ember;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  text(ctx, 'PLAY  —  Enter', width / 2, btn.y + 29, 24, '#fff');
  text(ctx, 'Click a card to play it · Click a creature, then a target, to attack', width / 2, 625, 14, COLORS.inkDim, 'center', 'normal');
  text(ctx, 'Keys: 1–7 select a card · Enter ends the turn · R restarts · M mutes', width / 2, 650, 14, COLORS.inkDim, 'center', 'normal');
  text(ctx, 'An original game — no network, no build step, just the cards.', width / 2, 688, 12, COLORS.inkDim, 'center', 'normal italic');
  return { playButton: btn };
}

function drawBoardRow(ctx, side, y, isEnemy, hit, ui) {
  const n = side.board.length;
  const total = n * (BOARD_W + 14) - 14;
  let x = (VIEW.width - total) / 2;
  const rects = [];
  side.board.forEach((creature) => {
    const canAtk = ui.canAttack && ui.canAttack(creature);
    const selected = ui.selectedAttacker === creature.uid;
    const targetable = ui.targeting && ui.targeting.side === (isEnemy ? 'enemy' : 'player');
    drawCard(ctx, creature, x, y, BOARD_W, BOARD_H, {
      selected: selected || targetable,
      playable: true,
      small: true,
    });
    if (canAtk) {
      ctx.save();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      rr(ctx, x - 4, y - 4, BOARD_W + 8, BOARD_H + 8, 12);
      ctx.stroke();
      ctx.restore();
    }
    if (creature.justPlayed) {
      text(ctx, 'summoning', x + BOARD_W / 2, y + BOARD_H + 14, 12, COLORS.goldDim, 'center', 'normal italic');
    }
    rects.push({ uid: creature.uid, x, y, w: BOARD_W, h: BOARD_H });
    x += BOARD_W + 14;
  });
  if (n === 0) {
    text(ctx, isEnemy ? 'The Ash Regent has no creatures yet.' : 'Your side of the board is empty — play a creature.', VIEW.width / 2, y + 60, 14, COLORS.inkDim, 'center', 'normal italic');
  }
  return rects;
}

export function render(ctx, game, ui) {
  const { width, height } = VIEW;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(0, 0, width, height);
  // Felt table.
  ctx.fillStyle = COLORS.felt;
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2 + 20, 620, 300, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.tableEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  // A few drifting embers so the corners are not bare darkness.
  const embers = [
    [70, 640, 3], [150, 90, 2], [1180, 620, 3], [1120, 90, 2], [640, 60, 2],
    [980, 660, 2], [320, 680, 3], [60, 300, 2], [1220, 300, 2], [520, 690, 2],
  ];
  for (const [ex, ey, er] of embers) {
    const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 4);
    g.addColorStop(0, 'rgba(255,158,94,0.85)');
    g.addColorStop(1, 'rgba(255,158,94,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ex, ey, er * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const hit = { hand: [], board: { player: [], enemy: [] }, hero: {}, endTurn: null, playButton: null, restartButton: null };

  if (ui.screen === SCREEN_TITLE) {
    hit.playButton = drawTitle(ctx, ui).playButton;
    ctx.restore();
    return hit;
  }

  const state = game;
  // Enemy hero (top-left), player hero (bottom-left, beside the hand).
  hit.hero.enemy = drawHeroPanel(ctx, state.enemy, 24, 16, 330, 'left', state.active === 'enemy');
  hit.hero.player = drawHeroPanel(ctx, state.player, 24, height - 250, 300, 'left', state.active === 'player');
  // Turn + log, top centre.
  text(ctx, `TURN ${state.turn}`, width / 2, 30, 18, COLORS.gold);
  const lastLog = state.log[state.log.length - 1] || '';
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = 'italic 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lastLog.slice(0, 90), width / 2, 56, 560);
  // Decks: enemy top-right, yours at the left edge under the enemy hero.
  drawDeckPile(ctx, state.enemy.deck.length, width - 160, 16, 'enemy deck');
  drawDeckPile(ctx, state.player.deck.length, 24, 130, 'your deck');
  // Mana, under your hero panel.
  text(ctx, 'MANA', 24, height - 150, 12, COLORS.inkDim, 'left');
  drawMana(ctx, state.player, 24, height - 128);
  // End turn button.
  const endBtn = { x: width - 210, y: 330, w: 170, h: 52 };
  const canEnd = state.phase === 'play' && state.active === 'player';
  rr(ctx, endBtn.x, endBtn.y, endBtn.w, endBtn.h, 10);
  ctx.fillStyle = canEnd ? COLORS.ember : '#3a2a30';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = canEnd ? COLORS.gold : COLORS.panelEdge;
  ctx.stroke();
  text(ctx, state.active === 'enemy' ? 'ENEMY TURN' : 'END TURN', endBtn.x + endBtn.w / 2, endBtn.y + 27, 19, canEnd ? '#fff' : COLORS.inkDim);
  hit.endTurn = endBtn;
  text(ctx, 'Enter', endBtn.x + endBtn.w / 2, endBtn.y + 68, 11, COLORS.inkDim, 'center', 'normal');

  // Board rows.
  hit.board.enemy = drawBoardRow(ctx, state.enemy, 128, true, hit, ui);
  hit.board.player = drawBoardRow(ctx, state.player, 300, false, hit, ui);

  // Player hand, fanned in the space right of the hero panel.
  const hand = state.player.hand;
  const handX0 = 344;
  const handX1 = width - 24;
  const stride = hand.length > 1 ? Math.min(HAND_W + 10, (handX1 - handX0 - HAND_W) / (hand.length - 1)) : 0;
  const handTotal = HAND_W + stride * (hand.length - 1);
  let hx = handX0 + Math.max(0, (handX1 - handX0 - handTotal) / 2);
  hand.forEach((card) => {
    const playable = ui.canPlay ? ui.canPlay(card) : false;
    const selected = ui.selectedCard === card.uid;
    const y = selected ? height - HAND_H - 26 : height - HAND_H - 8;
    drawCard(ctx, card, hx, y, HAND_W, HAND_H, { selected, playable, small: false });
    hit.hand.push({ uid: card.uid, x: hx, y, w: HAND_W, h: HAND_H });
    hx += stride;
  });

  if (state.phase !== 'play') {
    // End overlay.
    ctx.fillStyle = 'rgba(10,5,8,0.78)';
    ctx.fillRect(0, 0, width, height);
    const won = state.phase === 'won';
    text(ctx, won ? 'VICTORY' : 'DEFEAT', width / 2, 220, 72, won ? COLORS.gold : COLORS.red);
    text(ctx, won ? 'The Ash Regent falls. The court is yours.' : 'Your flame gutters out. The Ash Regent keeps the court.', width / 2, 285, 20, COLORS.ink, 'center', 'normal italic');
    text(ctx, `Turns played: ${state.turn}      Cards played: ${state.stats.cardsPlayed}      Damage dealt: ${state.stats.damageDealt}`, width / 2, 340, 16, COLORS.inkDim, 'center', 'normal');
    text(ctx, `Final life — You ${Math.max(0, state.player.hp)} · Ash Regent ${Math.max(0, state.enemy.hp)}`, width / 2, 372, 16, COLORS.inkDim, 'center', 'normal');
    const btn = { x: width / 2 - 150, y: 420, w: 300, h: 56 };
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 12);
    ctx.fillStyle = COLORS.ember;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.gold;
    ctx.stroke();
    text(ctx, 'PLAY AGAIN  —  R', width / 2, btn.y + 29, 22, '#fff');
    hit.restartButton = btn;
  }

  ctx.restore();
  return hit;
}

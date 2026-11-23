// Ember Court — mouse and keyboard input. Translates clicks and keys into
// calls on the world, and keeps the small selection state the renderer needs.
import { CARDS } from './config.js';
import { attack, canAttack, canPlayCard, endTurn, playCard, restart } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function makeUi() {
  return {
    screen: SCREEN_TITLE,
    selectedCard: null, // uid of a hand card chosen for play
    selectedAttacker: null, // uid of a board creature chosen to attack
    targeting: null, // { side, kind, uid? } once a spell or attacker awaits a target
    muted: false,
    hit: null,
  };
}

function inside(rect, x, y) {
  return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function handleClick(ui, game, x, y, sfx) {
  const hit = ui.hit;
  if (!hit) return;
  if (ui.screen === SCREEN_TITLE) {
    if (inside(hit.playButton, x, y)) {
      ui.screen = SCREEN_PLAY;
      sfx('start');
    }
    return;
  }
  if (game.phase !== 'play') {
    if (inside(hit.restartButton, x, y)) {
      restart(game);
      ui.screen = SCREEN_PLAY;
      ui.selectedCard = null;
      ui.selectedAttacker = null;
      ui.targeting = null;
      sfx('start');
    }
    return;
  }
  if (game.active !== 'player') return;

  // A target is already being chosen (spell or attack).
  if (ui.targeting) {
    const t = ui.targeting;
    if (t.kind === 'hero') {
      if (inside(hit.hero.enemy, x, y)) resolveTarget(ui, game, { side: 'enemy', kind: 'hero' }, sfx);
      else if (inside(hit.hero.player, x, y)) resolveTarget(ui, game, { side: 'player', kind: 'hero' }, sfx);
      else clearSelection(ui);
      return;
    }
    for (const side of ['enemy', 'player']) {
      for (const rect of hit.board[side]) {
        if (inside(rect, x, y)) {
          resolveTarget(ui, game, { side, kind: 'creature', uid: rect.uid }, sfx);
          return;
        }
      }
    }
    if (inside(hit.hero.enemy, x, y)) resolveTarget(ui, game, { side: 'enemy', kind: 'hero' }, sfx);
    else if (inside(hit.hero.player, x, y)) resolveTarget(ui, game, { side: 'player', kind: 'hero' }, sfx);
    else clearSelection(ui);
    return;
  }

  // End turn.
  if (inside(hit.endTurn, x, y)) {
    endTurn(game);
    clearSelection(ui);
    sfx('end');
    return;
  }
  // Hand: pick a card (or play a no-target spell at once).
  for (const rect of hit.hand) {
    if (!inside(rect, x, y)) continue;
    const card = game.player.hand.find((c) => c.uid === rect.uid);
    if (!card || !canPlayCard(game, game.player, card)) return;
    const def = CARDS[card.id];
    if (def.target === 'none' || def.target === 'self' || def.target === 'all-enemy') {
      if (playCard(game, game.player, card.uid)) sfx('play');
      clearSelection(ui);
    } else if (def.target === 'any') {
      ui.selectedCard = card.uid;
      ui.selectedAttacker = null;
      ui.targeting = { kind: 'spell', cardUid: card.uid };
      sfx('select');
    } else {
      ui.selectedCard = card.uid;
      ui.selectedAttacker = null;
      ui.targeting = null;
      if (playCard(game, game.player, card.uid)) sfx('play');
      clearSelection(ui);
    }
    return;
  }
  // Own board: pick an attacker.
  for (const rect of hit.board.player) {
    if (!inside(rect, x, y)) continue;
    const creature = game.player.board.find((c) => c.uid === rect.uid);
    if (!creature) return;
    if (canAttack(game, game.player, creature)) {
      ui.selectedAttacker = creature.uid;
      ui.selectedCard = null;
      ui.targeting = { kind: 'attack', attackerUid: creature.uid };
      sfx('select');
    } else {
      ui.selectedAttacker = null;
      ui.targeting = null;
    }
    return;
  }
  // Clicking empty table clears the selection.
  clearSelection(ui);
}

function resolveTarget(ui, game, target, sfx) {
  const t = ui.targeting;
  if (!t) return;
  if (t.kind === 'spell') {
    if (playCard(game, game.player, t.cardUid, target)) sfx('play');
  } else if (t.kind === 'attack') {
    if (attack(game, game.player, t.attackerUid, target)) sfx('hit');
  }
  clearSelection(ui);
}

function clearSelection(ui) {
  ui.selectedCard = null;
  ui.selectedAttacker = null;
  ui.targeting = null;
}

export function handleKey(ui, game, key, sfx) {
  const k = key.toLowerCase();
  if (k === 'm') {
    ui.muted = !ui.muted;
    return;
  }
  if (ui.screen === SCREEN_TITLE) {
    if (k === 'enter' || k === ' ') {
      ui.screen = SCREEN_PLAY;
      sfx('start');
    }
    return;
  }
  if (game.phase !== 'play') {
    if (k === 'r') {
      restart(game);
      ui.screen = SCREEN_PLAY;
      clearSelection(ui);
      sfx('start');
    }
    return;
  }
  if (k === 'r') {
    restart(game);
    clearSelection(ui);
    sfx('start');
    return;
  }
  if (game.active !== 'player') return;
  if (k === 'enter') {
    endTurn(game);
    clearSelection(ui);
    sfx('end');
    return;
  }
  if (k === 'escape') {
    clearSelection(ui);
    return;
  }
  const num = Number.parseInt(k, 10);
  if (num >= 1 && num <= 7) {
    const card = game.player.hand[num - 1];
    if (!card || !canPlayCard(game, game.player, card)) return;
    const def = CARDS[card.id];
    if (def.target === 'any') {
      ui.selectedCard = card.uid;
      ui.targeting = { kind: 'spell', cardUid: card.uid };
      sfx('select');
    } else {
      if (playCard(game, game.player, card.uid)) sfx('play');
      clearSelection(ui);
    }
  }
}

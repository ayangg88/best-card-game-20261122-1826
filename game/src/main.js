// Ember Court — the loop: scale the 1280x720 table to the window, draw every
// frame, and wire mouse + keyboard into the input layer.
import { VIEW } from './config.js';
import { canAttack, canPlayCard, newGame } from './world.js';
import { render } from './render.js';
import { handleClick, handleKey, makeUi } from './input.js';
import { ensureAudio, playSfx } from './audio.js';
import { buildShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

const ui = makeUi();
let game;
if (shotName) {
  const scene = buildShot(shotName, seed);
  game = scene.game;
  ui.screen = scene.screen;
} else {
  game = newGame(1);
}

function sfx(name) {
  playSfx(name, ui.muted);
}

// Live affordances the renderer asks about while drawing.
ui.canPlay = (card) => canPlayCard(game, game.player, card);
ui.canAttack = (creature) => canAttack(game, game.player, creature);

function resize() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

function toGameCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

canvas.addEventListener('click', (event) => {
  ensureAudio();
  const { x, y } = toGameCoords(event);
  handleClick(ui, game, x, y, sfx);
});
window.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'Enter') ensureAudio();
  handleKey(ui, game, event.key, sfx);
});

let lastStatus = '';
function frame() {
  ui.hit = render(ctx, game, ui);
  const status =
    ui.screen === 'title'
      ? 'Ember Court title screen. Press Enter to play.'
      : game.phase === 'play'
        ? `Turn ${game.turn}. You have ${game.player.hp} life, the Ash Regent has ${game.enemy.hp}. ${game.log[game.log.length - 1] || ''}`
        : game.phase === 'won'
          ? 'Victory. The Ash Regent falls.'
          : 'Defeat. The Ash Regent keeps the court.';
  if (status !== lastStatus) {
    statusEl.textContent = status;
    lastStatus = status;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

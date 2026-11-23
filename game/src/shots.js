// Ember Court — the screenshot scenes behind ?shot=start|play|win|loss.
// Each scene plays the real rules forward from a fresh world with a fixed
// seed and a fixed script, so the same seed always gives the same frame.
// The win and loss scenes set the scene (a nearly-beaten hero, a lethal
// board) and then finish the game through the real playCard / attack calls.
import { CARDS } from './config.js';
import { attack, canAttack, canPlayCard, endTurn, makeCardInstance, newGame, playCard } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

// The player's scripted turn: play creatures greedily, bolt the hero when
// nothing else is playable, then send every ready creature at the hero.
function scriptedPlayerTurn(state) {
  let guard = 0;
  while (guard < 20) {
    guard += 1;
    const playable = state.player.hand
      .filter((c) => canPlayCard(state, state.player, c))
      .sort((a, b) => a.cost - b.cost);
    if (playable.length === 0) break;
    const card = playable[0];
    const def = CARDS[card.id];
    if (def.target === 'any') playCard(state, state.player, card.uid, { side: 'enemy', kind: 'hero' });
    else playCard(state, state.player, card.uid);
    if (state.phase !== 'play') return;
  }
  for (const creature of state.player.board.slice()) {
    if (state.phase !== 'play') return;
    if (canAttack(state, state.player, creature)) {
      attack(state, state.player, creature.uid, { side: 'enemy', kind: 'hero' });
    }
  }
}

function playTurns(state, count) {
  for (let i = 0; i < count && state.phase === 'play'; i += 1) {
    scriptedPlayerTurn(state);
    if (state.phase !== 'play') return;
    endTurn(state); // the Ash Regent answers, then a new player turn begins
  }
}

export function buildShot(shot, seed) {
  if (shot === 'start') {
    const game = newGame(seed);
    return { game, screen: SCREEN_TITLE };
  }
  if (shot === 'play') {
    const game = newGame(seed);
    playTurns(game, 5);
    return { game, screen: SCREEN_PLAY };
  }
  if (shot === 'win') {
    const game = newGame(seed);
    playTurns(game, 4);
    // Scene: the Regent is nearly beaten and the Warden holds the last bolt.
    game.enemy.hp = 3;
    game.player.mana = 10;
    game.player.maxMana = 10;
    const bolt = makeCardInstance('bolt');
    game.player.hand.push(bolt);
    playCard(game, game.player, bolt.uid, { side: 'enemy', kind: 'hero' });
    return { game, screen: game.phase === 'play' ? SCREEN_PLAY : SCREEN_OVER };
  }
  if (shot === 'loss') {
    const game = newGame(seed);
    playTurns(game, 4);
    // Scene: the Warden is nearly beaten and the Regent's hound is ready.
    game.player.hp = 2;
    game.active = 'enemy';
    const hound = makeCardInstance('hound');
    hound.canAttack = true;
    game.enemy.board.push(hound);
    attack(game, game.enemy, hound.uid, { side: 'player', kind: 'hero' });
    return { game, screen: game.phase === 'play' ? SCREEN_PLAY : SCREEN_OVER };
  }
  return null;
}

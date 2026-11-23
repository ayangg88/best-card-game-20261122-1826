// Ember Court — the rules. Pure state, no drawing, no input.
// A state is plain data, so the screenshot scenes can build one through
// exactly the same functions the player uses.
import { CARDS, DECK_LIST, RULES } from './config.js';
import { makeRng, shuffle } from './random.js';

let uidCounter = 1;
export function makeCardInstance(cardId) {
  const def = CARDS[cardId];
  return {
    uid: uidCounter++,
    id: cardId,
    name: def.name,
    kind: def.kind,
    cost: def.cost,
    attack: def.attack ?? 0,
    health: def.health ?? 0,
    maxHealth: def.health ?? 0,
    text: def.text,
    sigil: def.sigil,
    canAttack: false,
    attacked: false,
    justPlayed: false,
  };
}

export function makeSide(heroKey) {
  return {
    hero: heroKey,
    hp: RULES.startHp,
    maxHp: RULES.startHp,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    board: [],
    fatigue: 0,
  };
}

export function newGame(seed = 1) {
  uidCounter = 1;
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    turn: 1,
    active: 'player', // 'player' | 'enemy'
    phase: 'play', // 'play' | 'won' | 'lost'
    winner: null,
    log: ['The court assembles. Ember Warden, your move.'],
    stats: { cardsPlayed: 0, damageDealt: 0, creaturesSummoned: 0 },
    player: makeSide('player'),
    enemy: makeSide('enemy'),
  };
  state.player.deck = shuffle(DECK_LIST, rng).map(makeCardInstance);
  state.enemy.deck = shuffle(DECK_LIST, rng).map(makeCardInstance);
  for (let i = 0; i < RULES.startHand; i += 1) {
    drawCard(state, state.player);
    drawCard(state, state.enemy);
  }
  startTurn(state, state.player);
  return state;
}

export function drawCard(state, side) {
  if (side.hand.length >= RULES.maxHand) {
    state.log.push('Hand is full — a card burns away.');
    side.deck.shift();
    return null;
  }
  const card = side.deck.shift();
  if (!card) {
    side.fatigue += 1;
    side.hp -= side.fatigue;
    state.log.push(`The deck is empty — fatigue bites for ${side.fatigue}.`);
    checkEnd(state);
    return null;
  }
  side.hand.push(card);
  return card;
}

export function startTurn(state, side) {
  side.maxMana = Math.min(RULES.maxMana, side.maxMana + 1);
  side.mana = side.maxMana;
  for (const creature of side.board) {
    creature.canAttack = true;
    creature.attacked = false;
    creature.justPlayed = false;
  }
}

function otherSide(state, side) {
  return side === state.player ? state.enemy : state.player;
}

export function canPlayCard(state, side, card) {
  if (state.phase !== 'play') return false;
  if (state.active === 'player' && side !== state.player) return false;
  if (state.active === 'enemy' && side !== state.enemy) return false;
  if (card.cost > side.mana) return false;
  if (card.kind === 'creature' && side.board.length >= RULES.maxBoard) return false;
  return true;
}

// Play a card from a hand. For spells with target 'any', `target` is
// { side: 'player'|'enemy', kind: 'hero'|'creature', uid? }.
export function playCard(state, side, cardUid, target = null) {
  const index = side.hand.findIndex((c) => c.uid === cardUid);
  if (index === -1) return false;
  const card = side.hand[index];
  if (!canPlayCard(state, side, card)) return false;
  const def = CARDS[card.id];
  side.mana -= card.cost;
  side.hand.splice(index, 1);
  state.stats.cardsPlayed += 1;

  if (card.kind === 'creature') {
    card.canAttack = false;
    card.attacked = false;
    card.justPlayed = true;
    side.board.push(card);
    state.stats.creaturesSummoned += 1;
    state.log.push(`${side.hero === 'player' ? 'You summon' : 'Ash Regent summons'} ${card.name}.`);
  } else if (def.target === 'self') {
    side.hp = Math.min(side.maxHp, side.hp + def.heal);
    state.log.push(`${side.hero === 'player' ? 'You mend' : 'Ash Regent mends'} ${def.heal} life.`);
  } else if (def.target === 'none') {
    drawCard(state, side);
    drawCard(state, side);
    state.log.push(`${side.hero === 'player' ? 'You consult' : 'Ash Regent consults'} the omen and draw 2.`);
  } else if (def.target === 'all-enemy') {
    const foe = otherSide(state, side);
    for (const creature of foe.board) creature.health -= def.damage;
    foe.board = foe.board.filter((c) => c.health > 0);
    state.log.push(`Cinder Blast scorches every enemy creature for ${def.damage}.`);
  } else if (def.target === 'any' && target) {
    const targetSide = target.side === 'player' ? state.player : state.enemy;
    if (target.kind === 'hero') {
      targetSide.hp -= def.damage;
      if (side === state.player) state.stats.damageDealt += def.damage;
      state.log.push(`Spark Bolt hits ${target.side === 'player' ? 'you' : 'Ash Regent'} for ${def.damage}.`);
    } else {
      const creature = targetSide.board.find((c) => c.uid === target.uid);
      if (!creature) return false;
      creature.health -= def.damage;
      if (side === state.player) state.stats.damageDealt += def.damage;
      if (creature.health <= 0) targetSide.board = targetSide.board.filter((c) => c.uid !== creature.uid);
      state.log.push(`Spark Bolt hits ${creature.name} for ${def.damage}.`);
    }
  } else {
    return false;
  }
  checkEnd(state);
  return true;
}

export function canAttack(state, side, creature) {
  if (state.phase !== 'play') return false;
  if (side === state.player && state.active !== 'player') return false;
  if (side === state.enemy && state.active !== 'enemy') return false;
  return creature.canAttack && !creature.attacked && creature.attack > 0;
}

export function attack(state, side, attackerUid, target) {
  const attacker = side.board.find((c) => c.uid === attackerUid);
  if (!attacker || !canAttack(state, side, attacker)) return false;
  const foe = otherSide(state, side);
  attacker.attacked = true;
  attacker.canAttack = false;
  if (target.kind === 'hero') {
    foe.hp -= attacker.attack;
    if (side === state.player) state.stats.damageDealt += attacker.attack;
    state.log.push(`${attacker.name} strikes ${target.side === 'player' ? 'you' : 'Ash Regent'} for ${attacker.attack}.`);
  } else {
    const defender = foe.board.find((c) => c.uid === target.uid);
    if (!defender) return false;
    defender.health -= attacker.attack;
    attacker.health -= defender.attack;
    if (side === state.player) state.stats.damageDealt += attacker.attack;
    state.log.push(`${attacker.name} trades blows with ${defender.name}.`);
    if (defender.health <= 0) foe.board = foe.board.filter((c) => c.uid !== defender.uid);
    if (attacker.health <= 0) side.board = side.board.filter((c) => c.uid !== attacker.uid);
  }
  checkEnd(state);
  return true;
}

export function endTurn(state) {
  if (state.phase !== 'play') return;
  state.active = state.active === 'player' ? 'enemy' : 'player';
  if (state.active === 'enemy') {
    startTurn(state, state.enemy);
    drawCard(state, state.enemy);
    aiTakeTurn(state);
    if (state.phase !== 'play') return;
    state.active = 'player';
    state.turn += 1;
    startTurn(state, state.player);
    drawCard(state, state.player);
    state.log.push(`Turn ${state.turn} — your move.`);
  }
  checkEnd(state);
}

// The Ash Regent's heuristic: play what it can afford, biggest first,
// then send every ready creature at the player's face unless a clean
// trade kills a bigger threat.
export function aiTakeTurn(state) {
  const side = state.enemy;
  const foe = state.player;
  let guard = 0;
  while (guard < 20) {
    guard += 1;
    const playable = side.hand
      .filter((c) => canPlayCard(state, side, c))
      .sort((a, b) => b.cost - a.cost);
    if (playable.length === 0) break;
    const card = playable[0];
    const def = CARDS[card.id];
    if (def.target === 'any') {
      const weak = foe.board.find((c) => c.health <= def.damage);
      if (weak) playCard(state, side, card.uid, { side: 'player', kind: 'creature', uid: weak.uid });
      else playCard(state, side, card.uid, { side: 'player', kind: 'hero' });
    } else if (def.target === 'self') {
      if (side.hp <= side.maxHp - def.heal) playCard(state, side, card.uid);
      else break;
    } else {
      playCard(state, side, card.uid);
    }
    if (state.phase !== 'play') return;
  }
  for (const creature of side.board.slice()) {
    if (state.phase !== 'play') return;
    if (!canAttack(state, side, creature)) continue;
    const prey = foe.board
      .filter((c) => c.attack < creature.attack && c.health <= creature.attack)
      .sort((a, b) => b.attack - a.attack)[0];
    if (prey) attack(state, side, creature.uid, { side: 'player', kind: 'creature', uid: prey.uid });
    else attack(state, side, creature.uid, { side: 'player', kind: 'hero' });
  }
}

export function checkEnd(state) {
  if (state.phase !== 'play') return;
  if (state.enemy.hp <= 0 && state.player.hp <= 0) {
    state.phase = 'won';
    state.winner = 'player';
    state.log.push('Both heroes fall — but the hearth burns on. You win.');
  } else if (state.enemy.hp <= 0) {
    state.phase = 'won';
    state.winner = 'player';
    state.log.push('The Ash Regent falls. The court is yours.');
  } else if (state.player.hp <= 0) {
    state.phase = 'lost';
    state.winner = 'enemy';
    state.log.push('Your flame gutters out. The Ash Regent keeps the court.');
  }
}

export function restart(state) {
  const fresh = newGame(state.seed + 1);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
}

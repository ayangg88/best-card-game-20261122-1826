// Ember Court — configuration: table size, palette, and the whole card set.
// Every name, number and colour below is original to this game.
export const VIEW = { width: 1280, height: 720 };

export const RULES = {
  startHp: 30,
  startHand: 4,
  maxMana: 10,
  maxBoard: 5,
  maxHand: 10,
  deckSize: 24,
};

export const COLORS = {
  table: '#171019',
  tableEdge: '#2a1a26',
  felt: '#241626',
  gold: '#f2b544',
  goldDim: '#b98a2e',
  ember: '#ff7a2f',
  emberSoft: '#ff9e5e',
  red: '#e5484d',
  green: '#46a758',
  blue: '#3e9bff',
  ink: '#f5ead6',
  inkDim: '#c9b8a3',
  panel: '#2b1d2e',
  panelEdge: '#4a3345',
  cardBack: '#5b2a35',
  mana: '#4cc2ff',
  manaEmpty: '#2c3a4a',
};

// Card kinds: 'creature' fights on the board, 'spell' resolves at once.
export const CARDS = {
  imp:     { id: 'imp',     name: 'Cinder Imp',   kind: 'creature', cost: 1, attack: 2, health: 1, text: 'Quick and reckless.', sigil: 'flame' },
  squire:  { id: 'squire',  name: 'Ember Squire', kind: 'creature', cost: 2, attack: 2, health: 3, text: 'Holds the line.', sigil: 'shield' },
  hound:   { id: 'hound',   name: 'Flame Hound',  kind: 'creature', cost: 2, attack: 3, health: 2, text: 'It smells fear.', sigil: 'claw' },
  falcon:  { id: 'falcon',  name: 'Ash Falcon',   kind: 'creature', cost: 3, attack: 4, health: 2, text: 'Strikes from above.', sigil: 'wing' },
  golem:   { id: 'golem',   name: 'Stone Golem',  kind: 'creature', cost: 4, attack: 3, health: 6, text: 'Patient as a mountain.', sigil: 'stone' },
  phoenix: { id: 'phoenix', name: 'Phoenix',      kind: 'creature', cost: 5, attack: 5, health: 4, text: 'Rises again, brighter.', sigil: 'flame' },
  drake:   { id: 'drake',   name: 'Inferno Drake', kind: 'creature', cost: 6, attack: 6, health: 5, text: 'Its shadow is smoke.', sigil: 'wing' },
  queen:   { id: 'queen',   name: 'Ember Queen',  kind: 'creature', cost: 7, attack: 7, health: 7, text: 'The court kneels.', sigil: 'crown' },
  bolt:    { id: 'bolt',    name: 'Spark Bolt',   kind: 'spell', cost: 2, text: 'Deal 3 damage to any target.', sigil: 'bolt', damage: 3, target: 'any' },
  mend:    { id: 'mend',    name: 'Mend Flame',   kind: 'spell', cost: 2, text: 'Restore 6 life to your hero.', sigil: 'heart', heal: 6, target: 'self' },
  blast:   { id: 'blast',   name: 'Cinder Blast', kind: 'spell', cost: 4, text: 'Deal 4 damage to all enemy creatures.', sigil: 'burst', damage: 4, target: 'all-enemy' },
  draw:    { id: 'draw',    name: 'Ember Omen',   kind: 'spell', cost: 2, text: 'Draw 2 cards.', sigil: 'eye', draw: 2, target: 'none' },
};

// Two copies of every card make the 24-card deck.
export const DECK_LIST = Object.keys(CARDS).flatMap((id) => [id, id]);

export const HEROES = {
  player: { name: 'Ember Warden', title: 'Keeper of the Last Hearth', sigil: 'flame' },
  enemy: { name: 'Ash Regent', title: 'Usurper of the Cold Court', sigil: 'crown' },
};

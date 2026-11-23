# Ember Court — a card duel

[![Play](https://make.fun/badge/best-card-game-20261122-1826/ayangg88/best-card-game-20261122-1826/play.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/ayangg88/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Referral](https://make.fun/badge/referral/ye9vf8mj.svg)](https://make.fun/?ref=ye9vf8mj)

**Ember Court** is an original turn-based card duel for the
[best-card-game-20261122-1826](https://make.fun/bounty/best-card-game-20261122-1826)
bounty on make.fun. You are the Ember Warden, keeper of the last hearth,
duelling the Ash Regent for the court. Both heroes start at 30 life; the
first to 0 loses.

## How to play

Serve the game and open it in a desktop browser — no build step, no network:

```sh
node serve.ts
# open http://localhost:8080
```

- **Mana** grows by 1 each turn (up to 10) and refills every turn.
- **Creatures** cost mana, join your side of the board, and can attack from
  the turn after they are played. Click one, then click an enemy creature
  or the Ash Regent to strike. Creatures trade damage with each other.
- **Spells** resolve at once: Spark Bolt deals 3 damage to any target,
  Mend Flame restores 6 life, Cinder Blast scorches all enemy creatures,
  Ember Omen draws 2 cards.
- Your deck has 24 cards — 8 creatures and 4 spells, two copies of each.
  An empty deck bites back with growing fatigue damage.

Mouse and keyboard both work: click cards and targets, or press `1–7` to
play a hand card, `Enter` to end the turn, `R` to restart, `M` to mute.
Sounds are synthesised live with WebAudio; the art is drawn on the canvas.

## Files

- `game/` — the playable game as static files (`index.html` + `src/*.js`)
- `screenshots/` — title, mid-game, victory and defeat, rendered by the
  game's own `?shot=` scenes
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes
  the dossier
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `shots.json` — the four screenshot scenes and their seeds

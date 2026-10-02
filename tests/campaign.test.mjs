import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';

// Exercise the real scene's campaign/collision logic without a GPU or browser.
// Only Phaser's rendering/input surfaces and the DOM are replaced.
const cache = new Map();
function moduleURL(name) {
  if (cache.has(name)) return cache.get(name);
  let source = fs.readFileSync(path.resolve('src', `${name}.ts`), 'utf8');
  if (name === 'main') {
    source = source.replace("import Phaser from 'phaser';", 'const Phaser = globalThis.fakePhaser;')
      .replace("import './style.css';", '')
      .replace("import { Starfield } from './starfield';", 'class Starfield { update() {} }');
  }
  source = stripTypeScriptTypes(source).replace(/from ['"]\.\/([\w-]+)['"]/g, (_, dependency) => `from '${moduleURL(dependency)}'`);
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  cache.set(name, url);
  return url;
}

class Image {
  active = true; visible = true; alpha = 1; rotation = 0;
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  setPosition(x, y) { this.x = x; this.y = y; return this; }
  setVisible(value) { this.visible = value; return this; }
  setAlpha(value) { this.alpha = value; return this; }
  setRotation(value) { this.rotation = value; return this; }
  setDisplaySize() { return this; }
  setDepth() { return this; }
  setTint() { return this; }
  setTexture() { return this; }
  setOrigin() { return this; }
  setScale() { return this; }
  destroy() { this.active = false; }
}
const elements = new Map();
const element = id => {
  if (!elements.has(id)) {
    const classes = new Set();
    elements.set(id, {
      innerHTML: '', textContent: '', style: {}, attributes: {},
      setAttribute(key, value) { this.attributes[key] = value; },
      classList: { add: value => classes.add(value), remove: value => classes.delete(value),
        contains: value => classes.has(value), toggle(value, active) { active ? classes.add(value) : classes.delete(value); } },
    });
  }
  return elements.get(id);
};
globalThis.document = { querySelector: () => element('app'), getElementById: element, querySelectorAll: () => [] };
globalThis.window = { addEventListener() {} };
globalThis.localStorage = { values: new Map(), getItem(key) { return this.values.get(key) ?? null; }, setItem(key, value) { this.values.set(key, value); } };
let SceneClass;
globalThis.fakePhaser = {
  Scene: class {
    add = { image: (x,y) => new Image(x,y), circle: (x,y) => new Image(x,y), container: (x,y) => new Image(x,y), text: (x,y) => new Image(x,y) };
    input = { keyboard: { addKeys: keys => Object.fromEntries(keys.split(',').map(key => [key, { isDown: false, on() {} }])), addCapture() {}, removeCapture() {} } };
    tweens = { add() {}, pauseAll() {}, resumeAll() {} };
    cameras = { main: { shake() {} } };
  },
  Game: class { constructor(config) { SceneClass = config.scene; } },
  Scale: {},
  Math: { Between: (min,max) => (min+max)/2, FloatBetween: (min,max) => (min+max)/2,
    Linear: (a,b,t) => a+(b-a)*t, Clamp: (value,min,max) => Math.max(min,Math.min(max,value)) },
  Utils: { Array: { GetRandom: values => values[0] } },
};
await import(moduleURL('main'));
const { bossSettings, bossPosition, bossVolley, nextLevel } = await import(moduleURL('campaign'));
const { synthesise } = await import(moduleURL('sound'));

function scene(difficulty = 'medium') {
  const game = new SceneClass();
  game.create();game.difficulty = difficulty;
  game.sounds = [];
  game.effects = { stop() {}, play(effect) { game.sounds.push(effect); } };
  game.start();
  return game;
}
function advanceToBoss(game) {
  for (let level = 1; level < 10; level++) {
    for (const enemy of game.enemies) enemy.sprite.destroy();
    game.enemies = [];
    game.update(0,16);
    game.elapsed = game.nextWave + .01;
    game.update(0,16);
    assert.equal(game.wave,level+1);
  }
  game.elapsed = game.arrivalEnds + .1;
  game.invulnerable = 1000;
  game.update(0,16);
}

for (const difficulty of ['easy','medium','hard']) test(`${difficulty}: ten levels, defended boss, health, victory and restart`, () => {
  const game = scene(difficulty);
  advanceToBoss(game);
  const settings = bossSettings(difficulty);
  assert.equal(game.boss.hp,settings.health);
  assert.equal(game.enemies.length,settings.defenderRows*settings.defenderColumns);
  assert.equal(element('boss-health').attributes['aria-valuenow'],String(settings.health));
  assert.equal(element('boss-panel').classList.contains('hidden'),false);
  // Clearing the escorts must not skip the living boss or spawn level 11.
  for (const enemy of game.enemies) enemy.sprite.destroy();
  game.enemies=[];game.update(0,16);
  assert.equal(game.wave,10);assert.equal(game.nextWave,0);assert.equal(game.mode,'playing');
  game.elapsed = game.boss.nextAttack + .01;game.update(0,16);
  assert.equal(game.hostile.length,3);
  for (let hit=1;hit<=settings.health;hit++) {
    const position=bossPosition(game.elapsed-game.waveStarted+.016,difficulty);
    game.shots.push({sprite:new Image(position.x,position.y+620*.016),vx:0,vy:-620});
    game.update(0,16);
    if(hit<settings.health) {
      assert.equal(game.mode,'playing');assert.equal(game.boss.hp,settings.health-hit);
      assert.equal(element('boss-health-text').textContent,`${settings.health-hit} / ${settings.health}`);
    }
  }
  assert.equal(game.mode,'won');assert.equal(game.wave,10);assert.equal(game.score,5000);
  assert.equal(game.boss,undefined);assert.equal(game.hostile.length,0);assert.equal(game.shots.length,0);
  assert.equal(game.sounds.filter(effect=>effect==='victory').length,1);
  assert.match(element('description').innerHTML,/Congratulations/);
  assert.equal(element('boss-panel').classList.contains('hidden'),true);
  assert.equal(globalThis.localStorage.getItem(`space-attack-best-${difficulty}`),'5000');
  game.victory();game.update(0,1000);assert.equal(game.score,5000);assert.equal(game.wave,10);
  game.start();assert.equal(game.mode,'playing');assert.equal(game.wave,1);assert.equal(game.score,0);
  assert.equal(game.lives,3);assert.equal(game.boss,undefined);assert.equal(game.difficulty,difficulty);
});

test('boss death and player defeat have distinct endings', () => {
  const game=scene();advanceToBoss(game);game.lives=1;game.invulnerable=0;game.hitPlayer();
  assert.equal(game.mode,'over');assert.equal(game.sounds.includes('victory'),false);
  assert.match(element('title').innerHTML,/GAME/);
  assert.equal(element('boss-panel').classList.contains('hidden'),true);
  game.start();assert.equal(game.boss,undefined);assert.equal(game.wave,1);
});

test('escorts intercept shots, boss fight pauses, and victory clears surviving threats', () => {
  const game=scene();advanceToBoss(game);
  const defender=game.enemies[0];
  defender.hp=1;
  game.shots.push({sprite:new Image(defender.sprite.x,defender.sprite.y),vx:0,vy:0});
  game.update(0,0);
  assert.equal(defender.sprite.active,false);assert.equal(game.boss.hp,36);
  game.pause();const elapsed=game.elapsed,bossX=game.boss.sprite.x;
  game.update(0,1000);assert.equal(game.elapsed,elapsed);assert.equal(game.boss.sprite.x,bossX);
  game.pause();assert.equal(game.mode,'playing');
  const survivors=game.enemies.map(enemy=>enemy.sprite);
  assert(survivors.length>0);
  game.boss.hp=1;
  game.shots.push({sprite:new Image(game.boss.sprite.x,game.boss.sprite.y),vx:0,vy:0});
  const missile=new Image(600,600);game.hostile.push({sprite:missile,vx:0,vy:0});
  game.update(0,0);
  assert.equal(game.mode,'won');assert.equal(game.hostile.length,0);assert.equal(missile.active,false);
  assert(survivors.every(sprite=>!sprite.active));assert.equal(game.enemies.length,0);
});

test('level cap, aimed boss volleys and victory sound', () => {
  assert.equal(nextLevel(9),10);assert.equal(nextLevel(10),null);assert.equal(nextLevel(11),null);
  for(const difficulty of ['easy','medium','hard']) {
    const origin={x:600,y:180},target={x:750,y:650};
    for(const fraction of [1,.5]) {
      const volley=bossVolley(origin,target,difficulty,fraction);
      assert.equal(volley.length,fraction>.5?3:5);
      for(const shot of volley) {
        assert(Math.abs(Math.hypot(shot.vx,shot.vy)-bossSettings(difficulty).missileSpeed)<1e-9);
        assert(shot.vy>0);
      }
    }
  }
  for(const rate of [44100,48000]) {
    const audio=synthesise('victory',rate);
    assert.equal(audio.length,Math.ceil(2.6*rate));
    assert(audio.every(value=>Number.isFinite(value)&&Math.abs(value)<1));
    assert(audio.some(value=>Math.abs(value)>.05));assert.equal(audio[0],0);assert.equal(audio.at(-1),0);
  }
});

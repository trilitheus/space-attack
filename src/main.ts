import Phaser from 'phaser';
import './style.css';
import { GameAudio } from './sound';
import { Starfield } from './starfield';
import { movePlayer } from './controls';
import { alienArtwork, shipArtwork, flameArtwork, shotArtwork, hostileShotArtwork, wormholeArtwork, earthArtwork, svgData } from './artwork';
import { FIELD, ALIENS, alienKind, waveSettings, formationPosition, sweepStep, approach, arrivalPosition, wormholeAppearance, WORMHOLE, type AlienKind, DIFFICULTIES, type Difficulty } from './waves';

const readBest = (difficulty: Difficulty = 'medium') => { try {
  const value=localStorage.getItem(`space-attack-best-${difficulty}`);
  return Number(value ?? (difficulty==='medium'?localStorage.getItem('space-attack-best'):0)) || 0;
} catch { return 0; } };
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header><div class="brand"><span>✦</span> SPACE ATTACK</div><div class="tag"><i></i>EARTH DEFENCE COMMAND</div></header>
<main><div class="intro"><div><div class="eyebrow">ONE PLANET. ONE LAST LINE OF DEFENCE.</div><h1>HUMANITY NEEDS YOU.</h1></div><p>An alien invasion is closing in.<br>The future of Earth is in your hands.</p></div>
<section class="arcade" aria-label="Space Attack game"><div class="hud"><div class="stats"><div><div class="label">SCORE</div><div id="score" class="value green">000000</div></div><div><div class="label">BEST</div><div id="best" class="value">${String(readBest()).padStart(6,'0')}</div></div><div><div class="label wave-label">WAVE · <span id="difficulty-label">MEDIUM</span></div><div id="wave" class="value">01</div></div></div><div class="hud-right"><div><div class="label">SHIELDS</div><div id="lives" class="lives">◆◆◆</div></div><button id="mute" class="icon" aria-label="Toggle sound">SOUND OFF</button></div></div>
<div class="screen"><div id="game"></div><div id="overlay" class="overlay"><div id="badge" class="badge">EARTH IS UNDER ATTACK</div><h2 id="title">SPACE<br><span>ATTACK</span></h2><p id="description">Alien fleets are breaching our orbit through wormholes.<br>Defend Earth. The future of humanity is at stake.</p><fieldset id="difficulty-picker" class="difficulty-picker"><legend>CHOOSE YOUR MISSION DIFFICULTY</legend><div class="difficulty-options">${(['easy','medium','hard'] as Difficulty[]).map(level=>`<label><input type="radio" name="difficulty" value="${level}" ${level==='medium'?'checked':''}><span>${level.toUpperCase()}</span></label>`).join('')}</div><div id="difficulty-description" class="difficulty-description">${DIFFICULTIES.medium.description}</div></fieldset><button id="launch" class="launch">DEFEND EARTH ↗</button><div id="hint" class="hint">OR PRESS ENTER TO START</div></div></div>
<div class="bottom"><span>● <span id="status">EARTH DEFENCE SYSTEMS READY</span></span><span>HOLD THE LINE · SAVE HUMANITY</span></div></section>
<div class="touch"><div class="dpad"><button id="up" aria-label="Move up">▲</button><button id="left" aria-label="Move left">◀</button><button id="down" aria-label="Move down">▼</button><button id="right" aria-label="Move right">▶</button></div><button id="fire">FIRE ✦</button></div>
<section class="support"><article><h3>01 / FLIGHT CONTROLS</h3><p>Arrow keys or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move<br>Evade within the bottom third of the screen.<br><kbd>SPACE</kbd> to fire · <kbd>P</kbd> to pause</p></article><article><h3>02 / INVASION INTELLIGENCE</h3><p><i class="dot red"></i>1 hit &nbsp; <i class="dot orange"></i>2 hits &nbsp; <i class="dot green-dot"></i>3 hits<br>Armoured enemies arrive on waves 3 & 5.</p></article><article><h3>03 / DEFEND OUR HOME</h3><p>Invaders emerge through a wormhole each wave.<br>Watch for sweeping attacks. Protect Earth.</p></article></section><footer><span>EARTH IS OUR HOME. KEEP IT THAT WAY.</span><span>THE FUTURE OF HUMANITY IS IN YOUR HANDS.</span></footer></main>`;

const el = (id: string) => document.getElementById(id)!;
type Enemy = { sprite: Phaser.GameObjects.Image; hp: number; maxHp: number; kind: AlienKind; homeX: number; homeY: number; dive: number; phase: number; state: 'formation' | 'diving' | 'returning' | 'entering'; arrivalIndex: number; sweep: boolean; vx: number; targetX: number };
type Shot = { sprite: Phaser.GameObjects.Image; vx: number; vy: number };
class SpaceAttack extends Phaser.Scene {
  player!: Phaser.GameObjects.Image;
  engine!: Phaser.GameObjects.Image;
  wormhole!: Phaser.GameObjects.Container;
  vortex!: Phaser.GameObjects.Image;
  waveStarted = 0; arrivalEnds = 0;
  starfield!: Starfield;
  effects = new GameAudio();
  enemies: Enemy[] = []; shots: Shot[] = []; hostile: Shot[] = [];
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  mode: 'ready'|'playing'|'paused'|'over' = 'ready';
  score = 0; best = readBest(); wave = 1; lives = 3; elapsed = 0;
  nextFire = 0; nextAttack = 0; nextWave = 0; invulnerable = 0;
  difficulty: Difficulty = 'medium';
  touch = { left: false, right: false, up: false, down: false, fire: false };
  preload() {
    const load = (key: string, svg: string) => this.load.svg(key, svgData(svg), { scale: 2 });
    load('ship', shipArtwork);load('engine', flameArtwork);load('shot', shotArtwork);load('hostile-shot', hostileShotArtwork);load('wormhole', wormholeArtwork);load('earth', earthArtwork);
    for (const kind of Object.keys(ALIENS) as AlienKind[]) {
      for (let hp=1;hp<=3;hp++) load(`${kind}-${hp}`, alienArtwork(kind,hp));
    }
  }
  create() {
    this.starfield=new Starfield(this);
    this.add.circle(FIELD.width/2,FIELD.height*.42,240,0x16304b,.09);
    this.add.image(FIELD.width/2,FIELD.height-15,'earth').setDisplaySize(FIELD.width,220).setAlpha(.35).setDepth(-1);
    this.vortex=this.add.image(0,0,'wormhole').setDisplaySize(220,220);
    this.wormhole=this.add.container(WORMHOLE.x,WORMHOLE.y,[this.vortex]).setScale(.48,.288).setDepth(1).setAlpha(.55);
    this.player=this.add.image(FIELD.width/2,FIELD.playerY,'ship').setDisplaySize(48,54).setDepth(5);
    this.engine=this.add.image(this.player.x,this.player.y+34,'engine').setDisplaySize(14,28).setDepth(4);
    this.keys=this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,W,A,S,D,SPACE,ENTER,P,ESC',false) as Record<string,Phaser.Input.Keyboard.Key>;
    for(const input of document.querySelectorAll<HTMLInputElement>('input[name=difficulty]')){
      input.onchange=()=>{
        if(this.mode!=='ready'&&this.mode!=='over')return;
        this.difficulty=input.value as Difficulty;this.best=readBest(this.difficulty);
        el('difficulty-description').textContent=DIFFICULTIES[this.difficulty].description;
        if(this.mode==='ready'){this.clearObjects();this.formation(true);el('status').textContent='EARTH DEFENCE SYSTEMS READY';}
        this.hud();
      };
    }
    this.keys.ENTER.on('down',()=>{if(this.mode==='ready'||this.mode==='over')this.start();else if(this.mode==='paused')this.pause();});
    this.keys.P.on('down',()=>this.pause());this.keys.ESC.on('down',()=>this.pause());
    el('launch').onclick=()=>this.mode==='paused'?this.pause():this.start();
    el('mute').setAttribute('aria-pressed','false');
    el('mute').onclick=()=>{this.effects.setMuted(!this.effects.muted);el('mute').textContent=this.effects.muted?'SOUND OFF':'SOUND ON';el('mute').setAttribute('aria-pressed',String(!this.effects.muted));};
    for(const id of ['left','right','up','down','fire'] as const){const b=el(id);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.touch[id]=true;};b.onpointerup=b.onpointercancel=()=>{this.touch[id]=false;};}
    window.addEventListener('blur',()=>{this.touch={left:false,right:false,up:false,down:false,fire:false};if(this.mode==='playing')this.pause();});
    this.formation(true);el('status').textContent='EARTH DEFENCE SYSTEMS READY';
  }
  clearObjects(){for(const e of this.enemies)e.sprite.destroy();for(const s of [...this.shots,...this.hostile])s.sprite.destroy();this.enemies=[];this.shots=[];this.hostile=[];}
  start(){this.input.keyboard!.addCapture(['SPACE','LEFT','RIGHT','UP','DOWN']);this.best=readBest(this.difficulty);el('difficulty-picker').classList.add('hidden');this.effects.stop();this.clearObjects();this.mode='playing';this.score=0;this.lives=3;this.wave=1;this.elapsed=0;this.nextFire=0;this.nextWave=0;this.invulnerable=1.5;this.player.setPosition(FIELD.width/2,FIELD.playerY).setAlpha(1);this.engine.setVisible(true);el('overlay').classList.add('hidden');this.formation();this.hud();this.effects.play('launch');}
  formation(preview=false){
    this.waveStarted=this.elapsed;
    const { rows, columns, attackInterval } = waveSettings(this.wave,this.difficulty);
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const hp=this.wave>=5&&row===0?3:this.wave>=3&&row<2?2:1;
      const x=FIELD.width/2+(col-(columns-1)/2)*70,y=95+row*54;
      const kind=alienKind(this.wave,row,col);
      this.enemies.push({sprite:this.add.image(x,y,`${kind}-${hp}`).setDisplaySize(44,37).setAlpha(preview?.42:0).setVisible(preview),hp,maxHp:hp,kind,homeX:x,homeY:y,dive:0,phase:Math.random()*6.28,state:preview?'formation':'entering',arrivalIndex:row*columns+col,sweep:false,vx:0,targetX:x});
    }
    this.arrivalEnds=this.elapsed+WORMHOLE.leadIn+(rows*columns-1)*WORMHOLE.stagger+WORMHOLE.travel;
    this.nextAttack=this.arrivalEnds+attackInterval;
    this.wormhole.setVisible(true);el('status').textContent=`WAVE ${String(this.wave).padStart(2,'0')} · ${this.wave>=5?'HEAVY ARMOUR DETECTED':this.wave>=3?'ARMOURED CONTACTS':'INVADERS IN EARTH ORBIT'}`;
    if(!preview){if(this.wave>1)this.effects.play('wave');el('status').textContent=`WAVE ${this.wave} · WORMHOLE BREACH DETECTED`;const text=this.add.text(FIELD.width/2,FIELD.height/2,`INVASION WAVE ${String(this.wave).padStart(2,'0')}`,{fontFamily:'monospace',fontSize:'30px',color:'#a5f664',letterSpacing:5}).setOrigin(.5);this.tweens.add({targets:text,alpha:0,y:FIELD.height/2-20,duration:1300,onComplete:()=>text.destroy()});}
  }
  colour(hp:number){return hp===3?0xa5f664:hp===2?0xffb45e:0xff617b;}
  hud(){el('score').textContent=String(this.score).padStart(6,'0');el('best').textContent=String(this.best).padStart(6,'0');el('wave').textContent=String(this.wave).padStart(2,'0');el('difficulty-label').textContent=this.difficulty.toUpperCase();el('lives').textContent='◆'.repeat(this.lives)+'◇'.repeat(3-this.lives);}
  pause(){if(this.mode!=='playing'&&this.mode!=='paused')return;const paused=this.mode==='playing';if(paused){this.effects.stop();this.input.keyboard!.removeCapture(['SPACE','LEFT','RIGHT','UP','DOWN']);}else{this.input.keyboard!.addCapture(['SPACE','LEFT','RIGHT','UP','DOWN']);}this.mode=paused?'paused':'playing';this.tweens[paused?'pauseAll':'resumeAll']();el('overlay').classList.toggle('hidden',!paused);if(paused){el('badge').textContent='EARTH DEFENCE ON STANDBY';el('title').innerHTML='MISSION<br><span>PAUSED</span>';el('description').innerHTML='Regroup, pilot. Humanity is counting on you.';el('launch').textContent='RESUME MISSION ↗';el('hint').textContent='PRESS P OR ENTER TO RESUME';}el('status').textContent=paused?'MISSION PAUSED':`WAVE ${this.wave} · DEFEND EARTH`;}
  burst(x:number,y:number,colour:number,count=14){for(let i=0;i<count;i++){const p=this.add.circle(x,y,Phaser.Math.FloatBetween(1.5,3.5),colour).setDepth(8);this.tweens.add({targets:p,x:x+Phaser.Math.Between(-60,60),y:y+Phaser.Math.Between(-60,60),alpha:0,angle:180,duration:Phaser.Math.Between(250,600),onComplete:()=>p.destroy()});}}
  hitPlayer(){if(this.invulnerable>0||this.mode!=='playing')return;this.lives--;this.invulnerable=2;this.burst(this.player.x,this.player.y,0xa5f664,22);this.cameras.main.shake(160,.007);this.effects.play(this.lives>0?'damage':'gameOver');this.hud();if(this.lives<=0){this.mode='over';el('difficulty-picker').classList.remove('hidden');this.input.keyboard!.removeCapture(['SPACE','LEFT','RIGHT','UP','DOWN']);this.player.setAlpha(0);this.engine.setVisible(false);if(this.score>this.best){this.best=this.score;try{localStorage.setItem(`space-attack-best-${this.difficulty}`,String(this.best));}catch{/* Storage may be unavailable. */}}this.hud();el('overlay').classList.remove('hidden');el('badge').textContent=this.score===this.best&&this.score>0?'NEW PERSONAL BEST':'DEFENDER DOWN';el('title').innerHTML='GAME<br><span>OVER</span>';el('description').innerHTML=`${String(this.score).padStart(6,'0')} POINTS · WAVE ${String(this.wave).padStart(2,'0')} · ${this.difficulty.toUpperCase()}<br>Earth needs another defender. Answer the call.`;el('launch').textContent='REDEPLOY ↗';el('hint').textContent='OR PRESS ENTER TO RESTART';el('status').textContent='DEFENDER LOST · EARTH NEEDS YOU';}}
  update(_time:number,delta:number){
    const dt=Math.min(delta/1000,.04);
    if(this.mode==='paused')return;
    this.starfield.update(dt);
    if(this.mode!=='playing')return;
    const tuning=waveSettings(this.wave,this.difficulty);
    this.elapsed+=dt;
    const arrivalTime=this.elapsed-this.waveStarted;
    const portal=wormholeAppearance(arrivalTime,this.arrivalEnds-this.waveStarted);
    this.wormhole.setAlpha(portal.alpha).setScale(portal.scaleX,portal.scaleY);
    this.vortex.rotation+=dt*(this.elapsed<this.arrivalEnds?.9:.25);
    if(this.elapsed>=this.arrivalEnds&&this.elapsed-dt<this.arrivalEnds){
      el('status').textContent=`WAVE ${this.wave} · DEFEND EARTH`;
    }this.invulnerable=Math.max(0,this.invulnerable-dt);this.player.setAlpha(this.invulnerable>0?(Math.sin(this.elapsed*30)>0?.35:1):1);
    const left=this.keys.LEFT.isDown||this.keys.A.isDown||this.touch.left,right=this.keys.RIGHT.isDown||this.keys.D.isDown||this.touch.right;
    const up=this.keys.UP.isDown||this.keys.W.isDown||this.touch.up,down=this.keys.DOWN.isDown||this.keys.S.isDown||this.touch.down;
    const position=movePlayer(this.player.x,this.player.y,(right?1:0)-(left?1:0),(down?1:0)-(up?1:0),dt);
    this.player.setPosition(position.x,position.y);
    this.player.rotation=Phaser.Math.Linear(this.player.rotation,((right?1:0)-(left?1:0))*.12,Math.min(1,dt*10));
    this.engine.setPosition(this.player.x,this.player.y+34).setAlpha(this.player.alpha).setDisplaySize(14,26+Math.sin(this.elapsed*32)*4);
    if((this.keys.SPACE.isDown||this.touch.fire)&&this.elapsed>=this.nextFire){this.shots.push({sprite:this.add.image(this.player.x,this.player.y-30,'shot').setDisplaySize(12,26),vx:0,vy:-620});this.nextFire=this.elapsed+.18;this.effects.play('fire');}
    if(this.enemies.length&&this.elapsed>=this.nextAttack){
      const available=this.enemies.filter(e=>e.state==='formation');
      const e=Phaser.Utils.Array.GetRandom(available) as Enemy|undefined;
      if(e){
        e.state='diving';e.dive=0;e.targetX=this.player.x;
        e.sweep=e.kind==='manta'||e.kind==='squid'||Math.random()<.35;
        const direction=this.player.x>=e.sprite.x?1:-1;
        e.vx=direction*(190+Math.min(this.wave,12)*12)*ALIENS[e.kind].speed*tuning.speedMultiplier;
        e.sprite.setDepth(4);
      }
      this.nextAttack=this.elapsed+tuning.attackInterval;
      const shooters=this.enemies.filter(e=>e.state!=='returning'&&e.state!=='entering'&&e.sprite.y<this.player.y-50);
      const shooter=Phaser.Utils.Array.GetRandom(shooters) as Enemy|undefined;
      if(shooter){
        this.effects.play('alienFire');
        const dx=this.player.x-shooter.sprite.x,dy=this.player.y-shooter.sprite.y;
        const len=Math.hypot(dx,dy)||1,speed=tuning.shotSpeed;
        this.hostile.push({sprite:this.add.image(shooter.sprite.x,shooter.sprite.y+15,'hostile-shot').setDisplaySize(12,26).setRotation(Math.atan2(dx/len*speed,-Math.max(65,dy/len*speed))),vx:dx/len*speed,vy:Math.max(65,dy/len*speed)});
      }
    }
    for(const e of this.enemies){
      const home=formationPosition(e.homeX,e.homeY,e.phase,this.elapsed,this.wave,this.difficulty);
      if(e.state==='entering'){
        const entry=arrivalPosition(e.arrivalIndex,arrivalTime,home);
        e.sprite.setVisible(entry.visible).setPosition(entry.x,entry.y)
          .setDisplaySize(44*entry.scale,37*entry.scale).setAlpha(entry.alpha);
        if(entry.done){e.state='formation';e.sprite.setAlpha(1).setDisplaySize(44,37);}
      }else if(e.state==='diving'){
        e.dive+=dt;
        e.sprite.y+=tuning.diveSpeed*ALIENS[e.kind].speed*dt;
        if(e.sweep){
          const step=sweepStep(e.sprite.x,e.vx,dt);
          e.sprite.x=step.x;e.vx=step.velocity;
          e.sprite.rotation=Phaser.Math.Clamp(e.vx/650,-.5,.5);
        }else{
          const vx=(e.targetX-e.sprite.x)*.55+Math.sin(e.dive*2.2+e.phase)*ALIENS[e.kind].weave*2.2*tuning.speedMultiplier;
          e.sprite.x=Phaser.Math.Clamp(e.sprite.x+vx*dt,24,FIELD.width-24);
          e.sprite.rotation=Phaser.Math.Clamp(vx/500,-.5,.5);
        }
        if(e.sprite.y>FIELD.height+40){
          // Wrap only while fully offscreen, then visibly descend back to formation.
          e.state='returning';e.dive=0;e.sprite.y=-40;e.sprite.setRotation(0);
        }
      }else if(e.state==='returning'){
        e.sprite.x=approach(e.sprite.x,home.x,320*dt);
        e.sprite.y=approach(e.sprite.y,home.y,180*dt);
        if(e.sprite.x===home.x&&e.sprite.y===home.y){e.state='formation';e.sprite.setDepth(0);}
      }else{
        e.sprite.setPosition(home.x,home.y);
      }
      if(Math.abs(e.sprite.x-this.player.x)<26&&Math.abs(e.sprite.y-this.player.y)<26){
        this.hitPlayer();
        e.state='diving';e.sprite.y=FIELD.height+45;
      }
    }
    for(const shot of this.shots){shot.sprite.y+=shot.vy*dt;for(const e of this.enemies){if(!shot.sprite.active)break;if(e.sprite.active&&e.sprite.visible&&e.sprite.alpha>.3&&Math.abs(shot.sprite.x-e.sprite.x)<18&&Math.abs(shot.sprite.y-e.sprite.y)<21){shot.sprite.destroy();e.hp--;this.burst(e.sprite.x,e.sprite.y,this.colour(Math.max(1,e.hp)),e.hp?5:14);this.effects.play(e.hp?'hit':'explosion');if(e.hp<=0){this.score+=e.maxHp*100+(e.state==='diving'?50:0);e.sprite.destroy();}else{e.sprite.setTexture(`${e.kind}-${e.hp}`);}this.hud();}}if(shot.sprite.active&&shot.sprite.y< -20)shot.sprite.destroy();}
    this.enemies=this.enemies.filter(e=>e.sprite.active);this.shots=this.shots.filter(s=>s.sprite.active);
    for(const shot of this.hostile){shot.sprite.x+=shot.vx*dt;shot.sprite.y+=shot.vy*dt;if(Math.abs(shot.sprite.x-this.player.x)<17&&Math.abs(shot.sprite.y-this.player.y)<23){shot.sprite.destroy();this.hitPlayer();}else if(shot.sprite.y>FIELD.height+20||shot.sprite.x< -20||shot.sprite.x>FIELD.width+20)shot.sprite.destroy();}this.hostile=this.hostile.filter(s=>s.sprite.active);
    if(!this.enemies.length&&this.mode==='playing'){if(!this.nextWave){this.nextWave=this.elapsed+1.8;this.effects.play('clear');for(const s of this.hostile)s.sprite.destroy();this.hostile=[];el('status').textContent='EARTH ORBIT CLEAR · NEXT BREACH INBOUND';}else if(this.elapsed>=this.nextWave){this.wave++;this.nextWave=0;this.formation();this.hud();}}
  }
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:FIELD.width,height:FIELD.height,backgroundColor:'#090e1b',pixelArt:false,antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:SpaceAttack});

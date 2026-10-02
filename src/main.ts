import Phaser from 'phaser';
import './style.css';

const readBest = () => { try { return Number(localStorage.getItem('space-attack-best')) || 0; } catch { return 0; } };
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header><div class="brand"><span>✦</span> SPACE ATTACK</div><div class="tag"><i></i>THE ARCADE IS OPEN</div></header>
<main><div class="intro"><div><div class="eyebrow">ONE SHIP. ENDLESS POSSIBILITIES.</div><h1>DEFEND YOUR CORNER OF SPACE.</h1></div><p>A classic arcade mission.<br>A new personal best awaits.</p></div>
<section class="arcade" aria-label="Space Attack game"><div class="hud"><div class="stats"><div><div class="label">SCORE</div><div id="score" class="value green">000000</div></div><div><div class="label">BEST</div><div id="best" class="value">${String(readBest()).padStart(6,'0')}</div></div><div><div class="label">WAVE</div><div id="wave" class="value">01</div></div></div><div class="hud-right"><div><div class="label">SHIELDS</div><div id="lives" class="lives">◆◆◆</div></div><button id="mute" class="icon" aria-label="Toggle sound">SOUND OFF</button></div></div>
<div class="screen"><div id="game"></div><div id="overlay" class="overlay"><div id="badge" class="badge">READY, PILOT?</div><h2 id="title">SPACE<br><span>ATTACK</span></h2><p id="description">Hold your ground. Break the formation.<br>How many waves can you survive?</p><button id="launch" class="launch">LAUNCH MISSION ↗</button><div id="hint" class="hint">OR PRESS ENTER TO START</div></div></div>
<div class="bottom"><span>● <span id="status">SYSTEMS READY</span></span><span>MOVE · AIM · SURVIVE</span></div></section>
<div class="touch"><div><button id="left" aria-label="Move left">◀</button><button id="right" aria-label="Move right">▶</button></div><button id="fire">FIRE ✦</button></div>
<section class="support"><article><h3>01 / FLIGHT CONTROLS</h3><p><kbd>←</kbd><kbd>→</kbd> or <kbd>A</kbd><kbd>D</kbd> to move<br><kbd>SPACE</kbd> to fire · <kbd>P</kbd> to pause</p></article><article><h3>02 / KNOW YOUR ENEMY</h3><p><i class="dot red"></i>1 hit &nbsp; <i class="dot orange"></i>2 hits &nbsp; <i class="dot green-dot"></i>3 hits<br>Armoured enemies arrive on waves 3 & 5.</p></article><article><h3>03 / STAY SHARP</h3><p>Watch for enemies breaking formation.<br>Every wave is faster. Every shot counts.</p></article></section><footer><span>BUILT FOR THE HIGH SCORE.</span><span>INSERT COURAGE. NO COINS REQUIRED.</span></footer></main>`;

const el = (id: string) => document.getElementById(id)!;
type Enemy = { sprite: Phaser.GameObjects.Image; hp: number; maxHp: number; homeX: number; homeY: number; dive: number; phase: number };
type Shot = { sprite: Phaser.GameObjects.Image; vx: number; vy: number };
class SpaceAttack extends Phaser.Scene {
  player!: Phaser.GameObjects.Image;
  stars: { dot: Phaser.GameObjects.Rectangle; speed: number }[] = [];
  enemies: Enemy[] = []; shots: Shot[] = []; hostile: Shot[] = [];
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  mode: 'ready'|'playing'|'paused'|'over' = 'ready';
  score = 0; best = readBest(); wave = 1; lives = 3; elapsed = 0;
  nextFire = 0; nextAttack = 0; nextWave = 0; invulnerable = 0;
  muted = true; audio?: AudioContext; touch = { left: false, right: false, fire: false };
  create() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xffffff); g.fillPoints([{x:18,y:0},{x:23,y:20},{x:34,y:31},{x:34,y:38},{x:22,y:33},{x:18,y:38},{x:14,y:33},{x:2,y:38},{x:2,y:31},{x:13,y:20}].map(p=>new Phaser.Math.Vector2(p.x,p.y)),true); g.generateTexture('ship',36,40); g.clear();
    g.fillStyle(0xffffff); g.fillRect(3,0,5,5);g.fillRect(23,0,5,5);g.fillRect(7,5,17,5);g.fillRect(2,10,27,10);g.fillRect(0,15,5,12);g.fillRect(26,15,5,12);g.fillRect(6,20,6,8);g.fillRect(19,20,6,8);g.fillStyle(0x111626);g.fillRect(8,12,4,4);g.fillRect(19,12,4,4);g.generateTexture('enemy',31,29);g.clear();
    g.fillStyle(0xffffff);g.fillRoundedRect(0,0,4,15,2);g.generateTexture('shot',4,15);g.destroy();
    for(let i=0;i<110;i++) this.stars.push({dot:this.add.rectangle(Phaser.Math.Between(0,960),Phaser.Math.Between(0,540),i%9===0?2:1,i%9===0?2:1,0x9ebcde,Phaser.Math.FloatBetween(.15,.65)),speed:Phaser.Math.Between(12,55)});
    this.add.circle(480,230,180,0x16304b,.09);
    this.player=this.add.image(480,478,'ship').setTint(0xa5f664).setDepth(5);
    this.keys=this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,SPACE,ENTER,P,ESC') as Record<string,Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['SPACE','LEFT','RIGHT']);
    this.keys.ENTER.on('down',()=>{if(this.mode==='ready'||this.mode==='over')this.start();else if(this.mode==='paused')this.pause();});
    this.keys.P.on('down',()=>this.pause());this.keys.ESC.on('down',()=>this.pause());
    el('launch').onclick=()=>this.mode==='paused'?this.pause():this.start();
    el('mute').onclick=()=>{this.muted=!this.muted;el('mute').textContent=this.muted?'SOUND OFF':'SOUND ON';if(!this.muted)this.tone(440,.08);};
    for(const id of ['left','right','fire'] as const){const b=el(id);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.touch[id]=true;};b.onpointerup=b.onpointercancel=()=>{this.touch[id]=false;};}
    window.addEventListener('blur',()=>{this.touch={left:false,right:false,fire:false};if(this.mode==='playing')this.pause();});
    this.formation(true);el('status').textContent='SYSTEMS READY';
  }
  tone(frequency:number,duration:number,type:OscillatorType='square') {
    if(this.muted)return;
    try{this.audio??=new AudioContext();void this.audio.resume();const osc=this.audio.createOscillator(),gain=this.audio.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,this.audio.currentTime);osc.frequency.exponentialRampToValueAtTime(frequency*.4,this.audio.currentTime+duration);gain.gain.setValueAtTime(.035,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+duration);osc.connect(gain);gain.connect(this.audio.destination);osc.start();osc.stop(this.audio.currentTime+duration);}catch{/* Audio is optional. */}
  }
  clearObjects(){for(const e of this.enemies)e.sprite.destroy();for(const s of [...this.shots,...this.hostile])s.sprite.destroy();this.enemies=[];this.shots=[];this.hostile=[];}
  start(){this.clearObjects();this.mode='playing';this.score=0;this.lives=3;this.wave=1;this.elapsed=0;this.nextFire=0;this.nextWave=0;this.invulnerable=1.5;this.player.setPosition(480,478).setAlpha(1);el('overlay').classList.add('hidden');this.formation();this.hud();this.tone(660,.2,'triangle');}
  formation(preview=false){
    const rows=Math.min(5,3+Math.floor((this.wave-1)/2));
    for(let row=0;row<rows;row++)for(let col=0;col<10;col++){
      const hp=this.wave>=5&&row===0?3:this.wave>=3&&row<2?2:1;
      const x=210+col*60,y=85+row*48;
      this.enemies.push({sprite:this.add.image(x,y,'enemy').setTint(this.colour(hp)).setAlpha(preview?.42:1),hp,maxHp:hp,homeX:x,homeY:y,dive:0,phase:Math.random()*6.28});
    }
    this.nextAttack=this.elapsed+1.4;el('status').textContent=`WAVE ${String(this.wave).padStart(2,'0')} · ${this.wave>=5?'HEAVY ARMOUR DETECTED':this.wave>=3?'ARMOURED CONTACTS':'HOSTILES INBOUND'}`;
    if(!preview){const text=this.add.text(480,300,`WAVE ${String(this.wave).padStart(2,'0')}`,{fontFamily:'monospace',fontSize:'26px',color:'#a5f664',letterSpacing:5}).setOrigin(.5);this.tweens.add({targets:text,alpha:0,y:280,duration:1300,onComplete:()=>text.destroy()});}
  }
  colour(hp:number){return hp===3?0xa5f664:hp===2?0xffb45e:0xff617b;}
  hud(){el('score').textContent=String(this.score).padStart(6,'0');el('best').textContent=String(this.best).padStart(6,'0');el('wave').textContent=String(this.wave).padStart(2,'0');el('lives').textContent='◆'.repeat(this.lives)+'◇'.repeat(3-this.lives);}
  pause(){if(this.mode!=='playing'&&this.mode!=='paused')return;const paused=this.mode==='playing';this.mode=paused?'paused':'playing';this.tweens[paused?'pauseAll':'resumeAll']();el('overlay').classList.toggle('hidden',!paused);if(paused){el('badge').textContent='TAKE A BREATHER';el('title').innerHTML='MISSION<br><span>PAUSED</span>';el('description').innerHTML='Your corner of space can wait.';el('launch').textContent='RESUME MISSION ↗';el('hint').textContent='PRESS P OR ENTER TO RESUME';}el('status').textContent=paused?'MISSION PAUSED':`WAVE ${this.wave} · MISSION ACTIVE`;}
  burst(x:number,y:number,colour:number,count=14){for(let i=0;i<count;i++){const p=this.add.rectangle(x,y,Phaser.Math.Between(2,5),Phaser.Math.Between(2,5),colour).setDepth(8);this.tweens.add({targets:p,x:x+Phaser.Math.Between(-60,60),y:y+Phaser.Math.Between(-60,60),alpha:0,angle:180,duration:Phaser.Math.Between(250,600),onComplete:()=>p.destroy()});}}
  hitPlayer(){if(this.invulnerable>0||this.mode!=='playing')return;this.lives--;this.invulnerable=2;this.burst(this.player.x,this.player.y,0xa5f664,22);this.cameras.main.shake(160,.007);this.tone(90,.25,'sawtooth');this.hud();if(this.lives<=0){this.mode='over';this.player.setAlpha(0);if(this.score>this.best){this.best=this.score;try{localStorage.setItem('space-attack-best',String(this.best));}catch{/* Storage may be unavailable. */}}this.hud();el('overlay').classList.remove('hidden');el('badge').textContent=this.score===this.best&&this.score>0?'NEW PERSONAL BEST':'MISSION COMPLETE';el('title').innerHTML='GAME<br><span>OVER</span>';el('description').innerHTML=`${String(this.score).padStart(6,'0')} POINTS · WAVE ${String(this.wave).padStart(2,'0')}<br>Another flight. Another chance.`;el('launch').textContent='FLY AGAIN ↗';el('hint').textContent='OR PRESS ENTER TO RESTART';el('status').textContent='SIGNAL LOST · READY TO REDEPLOY';}}
  update(_time:number,delta:number){
    const dt=Math.min(delta/1000,.04);
    if(this.mode==='paused')return;
    for(const star of this.stars){star.dot.y+=star.speed*dt;if(star.dot.y>540)star.dot.y=0;}
    if(this.mode!=='playing')return;
    this.elapsed+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.player.setAlpha(this.invulnerable>0?(Math.sin(this.elapsed*30)>0?.35:1):1);
    const left=this.keys.LEFT.isDown||this.keys.A.isDown||this.touch.left,right=this.keys.RIGHT.isDown||this.keys.D.isDown||this.touch.right;
    this.player.x=Phaser.Math.Clamp(this.player.x+((right?1:0)-(left?1:0))*370*dt,28,932);
    if((this.keys.SPACE.isDown||this.touch.fire)&&this.elapsed>=this.nextFire){this.shots.push({sprite:this.add.image(this.player.x,this.player.y-27,'shot').setTint(0xc3ff8c),vx:0,vy:-620});this.nextFire=this.elapsed+.18;this.tone(800,.055);}
    if(this.enemies.length&&this.elapsed>=this.nextAttack){const available=this.enemies.filter(e=>e.dive===0);const e=Phaser.Utils.Array.GetRandom(available) as Enemy|undefined;if(e){e.dive=.001;e.phase=this.player.x;e.sprite.setDepth(4);}this.nextAttack=this.elapsed+Math.max(.36,1.9-this.wave*.14);const shooter=Phaser.Utils.Array.GetRandom(this.enemies) as Enemy;const dx=this.player.x-shooter.sprite.x,dy=this.player.y-shooter.sprite.y,len=Math.hypot(dx,dy)||1,speed=145+this.wave*16;this.hostile.push({sprite:this.add.image(shooter.sprite.x,shooter.sprite.y+15,'shot').setTint(0xff617b),vx:dx/len*speed,vy:Math.max(80,dy/len*speed)});}
    for(const e of this.enemies){if(e.dive>0){e.dive+=dt;const speed=115+this.wave*13;e.sprite.y+=speed*dt;e.sprite.x+=((e.phase-e.sprite.x)*.8+Math.sin(e.dive*4)*100)*dt;e.sprite.rotation=Math.sin(e.dive*4)*.45;if(e.sprite.y>575){e.dive=0;e.sprite.setPosition(e.homeX,e.homeY).setRotation(0);}}else{e.sprite.x=e.homeX+Math.sin(this.elapsed*.9)*Math.min(100,45+this.wave*6);e.sprite.y=e.homeY+Math.sin(this.elapsed*2+e.phase)*4;}
      if(Math.abs(e.sprite.x-this.player.x)<26&&Math.abs(e.sprite.y-this.player.y)<26){this.hitPlayer();e.sprite.y=580;}}
    for(const shot of this.shots){shot.sprite.y+=shot.vy*dt;for(const e of this.enemies){if(!shot.sprite.active)break;if(e.sprite.active&&Math.abs(shot.sprite.x-e.sprite.x)<18&&Math.abs(shot.sprite.y-e.sprite.y)<21){shot.sprite.destroy();e.hp--;this.burst(e.sprite.x,e.sprite.y,this.colour(Math.max(1,e.hp)),e.hp?5:14);this.tone(e.hp?200:140,.09,'triangle');if(e.hp<=0){this.score+=e.maxHp*100+(e.dive>0?50:0);e.sprite.destroy();}else{e.sprite.setTint(this.colour(e.hp));}this.hud();}}if(shot.sprite.active&&shot.sprite.y< -20)shot.sprite.destroy();}
    this.enemies=this.enemies.filter(e=>e.sprite.active);this.shots=this.shots.filter(s=>s.sprite.active);
    for(const shot of this.hostile){shot.sprite.x+=shot.vx*dt;shot.sprite.y+=shot.vy*dt;if(Math.abs(shot.sprite.x-this.player.x)<17&&Math.abs(shot.sprite.y-this.player.y)<23){shot.sprite.destroy();this.hitPlayer();}else if(shot.sprite.y>560||shot.sprite.x< -20||shot.sprite.x>980)shot.sprite.destroy();}this.hostile=this.hostile.filter(s=>s.sprite.active);
    if(!this.enemies.length&&this.mode==='playing'){if(!this.nextWave){this.nextWave=this.elapsed+1.8;for(const s of this.hostile)s.sprite.destroy();this.hostile=[];el('status').textContent='SECTOR CLEAR · NEXT WAVE INBOUND';}else if(this.elapsed>=this.nextWave){this.wave++;this.nextWave=0;this.formation();this.hud();this.tone(520,.2,'triangle');}}
  }
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:960,height:540,backgroundColor:'#090e1b',pixelArt:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:SpaceAttack});

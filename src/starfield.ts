import Phaser from 'phaser';
import { FIELD } from './waves';

export class Starfield {
  private stars: { dot: Phaser.GameObjects.Arc; glow?: Phaser.GameObjects.Arc; speed: number; alpha: number; phase: number }[] = [];
  private time = 0;

  constructor(scene: Phaser.Scene) {
    // Distant, middle, and near layers: fewer than 80 small stars across the playfield.
    const layers = [
      { count: 42, radius: .65, speed: 2, alpha: .26 },
      { count: 23, radius: .95, speed: 4, alpha: .36 },
      { count: 9, radius: 1.3, speed: 7, alpha: .47 },
    ];
    for (const layer of layers) for (let i=0;i<layer.count;i++) {
      const x=Phaser.Math.FloatBetween(8,FIELD.width-8), y=Phaser.Math.FloatBetween(0,FIELD.height);
      const colour=i%7===0?0xd8cfc0:0xbed2e7;
      const dot=scene.add.circle(x,y,layer.radius,colour,layer.alpha).setDepth(-3);
      const glow=layer.radius>1?scene.add.circle(x,y,3,colour,.045).setDepth(-3):undefined;
      this.stars.push({dot,glow,speed:layer.speed,alpha:layer.alpha,phase:Math.random()*Math.PI*2});
    }
  }

  update(dt: number) {
    this.time += dt;
    for (const star of this.stars) {
      star.dot.y=(star.dot.y+star.speed*dt) % FIELD.height;
      star.dot.alpha=star.alpha*(.92+.08*Math.sin(this.time*.65+star.phase));
      star.glow?.setPosition(star.dot.x,star.dot.y);
    }
  }
}

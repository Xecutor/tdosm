import { Point } from "./util/point";
import { Weapon, Sword, DamageInfo } from "./weapon";
import { Pushable } from "./pushable";

export class Player{
    tile:Phaser.Physics.Arcade.Sprite
    weapon:Weapon

    pushable = new Pushable

    hp = 30
    maxHp = 30

    dashPos : Point
    dashCooldownTime:number = 2000
    dashEndOfCooldown = 0
    dashActive = false

    damageInfo : DamageInfo[] = []

    constructor(scene:Phaser.Scene, pp:Point, playerSprite:string) {
        this.weapon = new Sword(scene)
        this.tile = scene.physics.add.sprite(pp.x, pp.y, playerSprite, 0)
        //this.tile.setOrigin(0.5, 0.5)/*.setOffset(8,8)*/.setSize(12,12)
        this.tile.setSize(12,12)
        this.tile.setDepth(100)
        scene.anims.create({
            key: 'player-down',
            frames: scene.anims.generateFrameNumbers(playerSprite, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })
        scene.anims.create({
            key: 'player-left',
            frames: scene.anims.generateFrameNumbers(playerSprite, { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        })
        scene.anims.create({
            key: 'player-right',
            frames: scene.anims.generateFrameNumbers(playerSprite, { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        })
        scene.anims.create({
            key: 'player-up',
            frames: scene.anims.generateFrameNumbers(playerSprite, { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        })
    }
    startAttack(gameTime: number, dir: number) {
        if(this.weapon) {
            this.weapon.startAttack(gameTime, dir)
        }
    }
    stop() {
        let body = this.tile.body as Phaser.Physics.Arcade.Body
        body.setVelocity(0,0)
    }
    getPos() {
        const x = this.tile.body.x
        const y = this.tile.body.y
        return {x, y}
    }
    move(gameTime:number, x:number, y:number) {
        if(this.hp<=0) {
            x=0
            y=0
        }

        let body = this.tile.body as Phaser.Physics.Arcade.Body
        if(this.pushable.isActive(gameTime)) {
            body.setVelocity(this.pushable.pushDir.x, this.pushable.pushDir.y)
            body.setMaxSpeed(200)
        }
        else {
            body.setVelocity(x,y)
            body.setMaxSpeed(50)
        }
    }
    playAni(ani:string) {
        this.tile.anims.play('player-'+ani, true)
    }
    activatePush(dir:Point, gameTime:number, pushTime:number) {
        this.pushable.activatePush(dir, gameTime, pushTime)
    }
    updateWeapon(gameTime:number, mx:number, my:number) {
        if(!this.weapon) {
            return
        }
        const px = this.tile.body.x
        const py = this.tile.body.y

        let M = Phaser.Math
        let va = M.Angle.Between(px, py, mx, my)
        this.weapon.update(gameTime, px, py, va)
    }
    pause() {
        this.tile.anims.pause()
    }
    
    takeDamage(amount:number, dir:Point) {
        this.hp-=amount
        this.damageInfo.push({
            point:this.getPos(), 
            dir,
            amount,
            tint:0xff8080
        })
    }
    dash(gameTime:number, p:Point) {
        if(this.dashEndOfCooldown>gameTime) {
            return
        }
        this.dashPos = {...p}
        this.dashActive = true
    }
}

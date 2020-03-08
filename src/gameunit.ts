import { Point } from "./util/point"
import { Pushable } from "./pushable"
import { Player } from "./player"

export interface Projectile{
    spriteName: string
    spriteNum : number
    startPos : Point
    dir : Point
    damage : number
    sprite?:Phaser.Physics.Arcade.Sprite
}

export class GameUnit {
    tile: Phaser.Physics.Arcade.Sprite
    aniKey: string

    pushable = new Pushable

    moveSpeed = 30

    hp = 100
    deathTime: number
    canBeRemoved = false

    damage = 5
    attackCooldown = 400
    attackCooldownEnd = 0

    active = false

    melee = true

    projectileSprite: string
    projectileSpriteNum : number

    pendingProjectile : Projectile

    moveDir : Point
    nextDirChangeTime : number = 0

    constructor(private scene: Phaser.Scene, x: number, y: number, tilesetKey: string, tileno: number) {
        this.tile = scene.physics.add.sprite(x, y, tilesetKey + "0", tileno)
        this.tile.setDepth(50)
        let f0 = scene.anims.generateFrameNames(tilesetKey + "0", { start: tileno, end: tileno })
        let f1 = scene.anims.generateFrameNames(tilesetKey + "1", { start: tileno, end: tileno })
        this.aniKey = `${tilesetKey}:${tileno}-ani`
        scene.anims.create({
            key: this.aniKey,
            frames: [...f0, ...f1],
            frameRate: 10,
            repeat: -1
        })
        this.tile.setFlipX(true)
        this.tile.setOffset(8, 8).setSize(12, 12)
        this.tile.visible = false
    }

    playAni() {
        this.tile.anims.play(this.aniKey, true)
    }

    getCollisionCircle() {
        return new Phaser.Geom.Circle(this.tile.x, this.tile.y, 8)
    }

    activatePush(dir: Point, gameTime: number, pushTime: number) {
        this.pushable.activatePush(dir, gameTime, pushTime)
    }

    activate() {
        this.active = true
        this.tile.visible = true
    }

    takeDamage(amount: number) {
        if (!this.active) {
            return
        }
        this.hp -= amount

        if (this.isDead()) {
            this.active = false
        }
    }

    isDead() {
        return this.hp < 0
    }

    stop() {
        (this.tile.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0)
    }

    update(gameTime: number, p: Player) {
        let pp = p.getPos()
        if (this.isDead()) {
            if (this.deathTime === undefined) {
                this.deathTime = gameTime
            }
            let passed = gameTime - this.deathTime
            if (passed > 500) {
                this.tile.destroy()
                this.canBeRemoved = true
                return
            }
            this.tile.alpha = 1 - passed / 500
            return
        }
        if (!this.active) {
            return;
        }
        let M = Phaser.Math
        let d: Point
        if (this.pushable.isActive(gameTime)) {
            d = this.pushable.pushDir
        } else {

            let a = M.Angle.BetweenPoints(this.tile, pp)
            d = M.Rotate({ x: this.moveSpeed, y: 0 }, a)
            this.tile.setFlipX(d.x > 0)
            let dst = M.Distance.Between(this.tile.body.x, this.tile.body.y, pp.x, pp.y)
            if(this.melee) {
                if (dst < 16) {
                    let pd = { ...d }
                    pd.x *= 4
                    pd.y *= 4
                    console.log("pd=", pd)
                    p.activatePush(pd, gameTime, 200)
                    if (this.attackCooldownEnd < gameTime) {
                        p.takeDamage(this.damage, d)
                        this.attackCooldownEnd = gameTime + this.attackCooldown
                    }
                }
            } else {
                if(dst<32) {
                    if(this.nextDirChangeTime < gameTime) {
                        this.moveDir = Phaser.Math.Rotate({x:this.moveSpeed, y:0}, Math.random() * Math.PI * 2)
                        this.nextDirChangeTime = gameTime + 1000
                    }
                    else {
                        d = this.moveDir
                    }
                }
                else {
                    if(this.attackCooldownEnd<gameTime) {
                        console.log('fire?')
                        this.pendingProjectile = {
                            spriteName : this.projectileSprite,
                            spriteNum : this.projectileSpriteNum,
                            damage : this.damage,
                            startPos : {x:this.tile.body.x, y:this.tile.body.y},
                            dir:d
                        }
                        this.attackCooldownEnd = gameTime + this.attackCooldown
                    }
                    d = {x:0, y:0}
                }
                
            }
        }
        this.playAni()
        let body = this.tile.body as Phaser.Physics.Arcade.Body
        body.setVelocity(d.x, d.y)
        body.setMaxSpeed(this.moveSpeed)
    }
    pause() {
        this.tile.anims.pause()
    }
}
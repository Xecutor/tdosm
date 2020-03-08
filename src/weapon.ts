import { GameUnit } from "./gameunit"
import { Point } from "./util/point"

enum WeaponMode {
    idle,
    buildup,
    swing,
    cooldown
}

enum WeaponSpriteType {
    left,
    right
}

function extractComponents(color: number): [number, number, number] {
    let r = ((color & 0xff0000) >> 16)
    let g = (color & 0xff00) >> 8
    let b = color & 0xff
    return [r, g, b]
}

function interpolateNumber(from: number, to: number, progress: number) {
    if (progress > 1) {
        progress = 1
    }
    return (from + (to - from) * progress) | 0
}

function interpolateColor(from: number, to: number, progress: number) {
    let [rf, gf, bf] = extractComponents(from)
    let [rt, gt, bt] = extractComponents(to)
    let r = interpolateNumber(rf, rt, progress)
    let g = interpolateNumber(gf, gt, progress)
    let b = interpolateNumber(bf, bt, progress)
    let rv = (r<<16)|(g<<8)|b
    // console.log(`${from.toString(16)}->${to.toString(16)}@${progress.toFixed(2)} = ${rv.toString(16)}`)
    return rv

}

export interface DamageInfo{
    point:Point
    dir:Point
    amount:number
    tint:number
}

export class Weapon {
    tile: Phaser.Physics.Arcade.Sprite
    spriteType = WeaponSpriteType.left
    angle = 0

    constructor(scene: Phaser.Scene, spriteName:string, spriteNum:number) {
        this.tile = scene.physics.add.sprite(0, 0, spriteName, spriteNum)
        this.tile.setOrigin(0.5, 0.5)
    }
    startAttack(gameTime: number, dir: number) {
    }
    checkCollision(gameTime:number, enemies:GameUnit[]) {
        let rv : DamageInfo[] = []
        return rv
    }
    isSwinging() {
        return false
    }
    update(gameTime: number, x: number, y: number, va: number) {
        let M = Phaser.Math
        let ad = M.Angle.ShortestBetween(va * 180 / Math.PI, this.angle * 180 / Math.PI + 90) * Math.PI / 180
        this.angle += ad / 50
        this.angle = M.Angle.Wrap(this.angle)
        let sd = M.Rotate({ x: 0, y: -16 }, this.angle)
        this.tile.body.x = x + sd.x
        this.tile.body.y = y + sd.y
        let fix = this.spriteType == WeaponSpriteType.left ? 45 : -45
        this.tile.setAngle(this.angle * 180 / Math.PI + fix)
    }

}

export class Sword extends Weapon{
    mode = WeaponMode.idle
    modeStartTime: number
    swingDir: number
    swingStartAngle: number

    buildupTime = 500
    swingTime = 200
    cooldownTime = 300

    damage = 10

    constructor(scene: Phaser.Scene) {
        super(scene, "long-wep", 11)
    }
    startAttack(gameTime: number, dir: number) {
        if (this.mode != WeaponMode.idle) {
            return
        }
        this.swingDir = dir
        this.swingStartAngle = this.angle
        this.mode = WeaponMode.buildup
        this.modeStartTime = gameTime
    }
    checkCollision(gameTime:number, enemies:GameUnit[]) {
        let M = Phaser.Math
        let v = M.Rotate({ x: 0, y: -4 }, this.angle)
        let x0 = this.tile.x+v.x
        let y0 = this.tile.y+v.y
        let x1 = this.tile.x-v.x
        let y1 = this.tile.y-v.y

        let l = new Phaser.Geom.Line(x0, y0, x1,y1)
        let rv : DamageInfo[] = []
        for(let enemy of enemies) {
            if(Phaser.Geom.Intersects.LineToCircle(l, enemy.getCollisionCircle())) {
                console.log('COLLISION!')
                let pushDir = {x:(x0-x1)*4, y:(y0-y1)*4}
                console.log(`pushDir=${pushDir.x},${pushDir.y}`)
                enemy.activatePush(pushDir, gameTime, 300)
                enemy.takeDamage(this.damage)
                rv.push({
                    point:enemy.tile,
                    dir:pushDir,
                    amount:this.damage,
                    tint:0xffffff
                })
            }
        }
        return rv
    }
    isSwinging() {
        return this.mode == WeaponMode.swing
    }
    update(gameTime: number, x: number, y: number, va: number) {
        let M = Phaser.Math
        if (this.mode == WeaponMode.idle || this.mode == WeaponMode.cooldown) {
            if (this.mode == WeaponMode.cooldown) {
                let cooldownProgress = (gameTime - this.modeStartTime)/this.cooldownTime
                this.tile.tint = interpolateColor(0xff8080, 0xffffff, cooldownProgress)
                // console.log(`cooldown, gameTime=${gameTime}`)
                if (this.modeStartTime + this.cooldownTime < gameTime) {
                    // console.log(`cooldown finished at ${gameTime}`)
                    this.mode = WeaponMode.idle
                }
            }
            let ad = M.Angle.ShortestBetween(va * 180 / Math.PI, this.angle * 180 / Math.PI + 90) * Math.PI / 180
            this.angle += ad / 50
        } else if (this.mode == WeaponMode.buildup) {
            // console.log(`buildup, gameTime=${gameTime}, modeStartTime=${this.modeStartTime}`)
            let buildupProgress = (gameTime - this.modeStartTime) / this.buildupTime
            this.tile.tint = interpolateColor(0xffffff, 0xff8080, buildupProgress)
            if (this.modeStartTime + this.buildupTime < gameTime) {
                // console.log(`buildup finished at ${gameTime}`)
                this.mode = WeaponMode.swing
                this.modeStartTime = gameTime
            }
        } else if (this.mode == WeaponMode.swing) {
            // console.log(`swinging, gameTime=${gameTime}`)
            let targetAngle = this.swingStartAngle + Math.PI * this.swingDir
            let swingProgress = (gameTime - this.modeStartTime) / this.swingTime
            // console.log(`targetAngle=${targetAngle}, swingProgress=${swingProgress}`)
            this.angle = this.swingStartAngle + (targetAngle - this.swingStartAngle) * swingProgress
            // console.log(`angle=${this.angle}`)
            if (this.modeStartTime + this.swingTime < gameTime) {
                // console.log(`swing finished at ${gameTime}`)
                this.mode = WeaponMode.cooldown
                this.modeStartTime = gameTime
            }
        }
        this.angle = M.Angle.Wrap(this.angle)
        let sd = M.Rotate({ x: 0, y: -16 }, this.angle)
        this.tile.body.x = x + sd.x
        this.tile.body.y = y + sd.y

        let fix = this.spriteType == WeaponSpriteType.left ? 45 : -45

        this.tile.setAngle(this.angle * 180 / Math.PI + fix)
    }
}
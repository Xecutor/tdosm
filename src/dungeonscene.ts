import 'phaser';
import { Rect, RectFrame } from './util/areaiters';
import { DungeonGeneratorFactory } from './generators/dungeongeneratorfactory';
import { DamageInfo } from './weapon';
import { GameUnit, Projectile } from './gameunit';
import { Player } from './player';
import { Dungeon, Room } from './generators/dungeon';
import { Door, InteractiveObject } from './objects';
import { Point, xy } from './util/point';
import { Pickable } from './pickable';

const floorTilesBase = [
    [63, 64, 65],
    [84, 85, 86],
    [105, 106, 107]
]

function GetFloorTilesBase(num: number) {
    let xoff = (num % 3) | 0
    let yoff = (num / 3) | 0
    return floorTilesBase.map(r => r.map(off => off + xoff * 7 + yoff * 21))
}

const wallTiles = [
    [1060, 1061, 1062],
    [1080, 1081, 1080],
    [1100, 1061, 1102]
]

interface DamageText {
    damageInfo: DamageInfo
    expTime: number
    txt: Phaser.GameObjects.BitmapText
}

export class DungeonScene extends Phaser.Scene {
    map: Phaser.Tilemaps.Tilemap

    backLayer: Phaser.Tilemaps.DynamicTilemapLayer
    objectsLayer: Phaser.Tilemaps.DynamicTilemapLayer

    cursors: Phaser.Types.Input.Keyboard.CursorKeys

    dungeon: Dungeon

    player: Player

    interactiveObj: InteractiveObject

    txt: Phaser.GameObjects.BitmapText

    dmgTxt: DamageText[]

    enemies: GameUnit[]
    
    enemyProjectilesGroup : Phaser.Physics.Arcade.Group
    enemyProjectiles : Projectile[]

    gameTime: number = 0

    hearts: Phaser.GameObjects.Sprite[]

    trail: Phaser.GameObjects.Sprite[]

    pickableGroup : Phaser.Physics.Arcade.Group
    pickable : Pickable[]

    constructor() {
        super({ key: 'dungeon' })
    }

    preload() {
        this.load.image('floor', 'assets/sprites/Objects/Floor.png')
        this.load.image('wall', 'assets/sprites/Objects/Wall.png')
        this.load.image('door0', 'assets/sprites/Objects/door0.png')
        this.load.image('door1', 'assets/sprites/Objects/door1.png')
        this.load.spritesheet('mage', 'assets/sprites/Commissions/Mage.png', { frameWidth: 16, frameHeight: 16 })
        this.load.spritesheet('warrior', 'assets/sprites/Commissions/Warrior.png', { frameWidth: 16, frameHeight: 16 })
        this.load.spritesheet('long-wep', 'assets/sprites/Items/LongWep.png', { frameWidth: 16, frameHeight: 16 })
        this.load.spritesheet('potion', 'assets/sprites/Items/Potion.png', { frameWidth: 16, frameHeight: 16 })
        this.loadSpritesheet('daemon', 'Characters/Demon')
        this.loadSpritesheet('reptile', 'Characters/Reptile')
        this.loadSpritesheet('elemental', 'Characters/Elemental')
        this.loadSpritesheet('effect', 'Objects/Effect')
        this.loadSpritesheet('gui', 'GUI/GUI')
        this.load.bitmapFont("sds_8x8", "assets/fonts/sds8x8.png", "assets/fonts/sds8x8.fnt")
        this.load.bitmapFont("sds_16x16", "assets/fonts/sds16x16.png", "assets/fonts/sds16x16.fnt")
    }

    loadSpritesheet(basename:string, relPath:string) {
        this.load.spritesheet(basename+'0', 'assets/sprites/'+relPath+'0.png', { frameWidth: 16, frameHeight: 16 })
        this.load.spritesheet(basename+'1', 'assets/sprites/'+relPath+'1.png', { frameWidth: 16, frameHeight: 16 })
    }

    create() {

        this.dmgTxt = []
        this.enemies = []
        this.hearts = []
        this.gameTime = 0
        this.enemyProjectiles = []
        this.pickable = []

        let dg = new DungeonGeneratorFactory()
        let gen = dg.create({ size: { w: 100, h: 100 }, maxRooms: 10 })
        this.dungeon = gen.generate()
        this.map = this.make.tilemap({
            tileWidth: 16,
            tileHeight: 16,
            width: 100,
            height: 100
        })
        let floor = this.map.addTilesetImage('floor', null, 16, 16, 0, 0, 0)
        let wall = this.map.addTilesetImage('wall', null, 16, 16, 0, 0, 1000)

        this.backLayer = this.map.createBlankDynamicLayer('back', [floor, wall])
        this.backLayer.fill(4)

        let door0 = this.map.addTilesetImage('door0', null, 16, 16, 0, 0, 0)
        let door1 = this.map.addTilesetImage('door1', null, 16, 16, 0, 0, 1000)

        this.objectsLayer = this.map.createBlankDynamicLayer('obj', [door0, door1])

        let floorTiles = GetFloorTilesBase(0)

        let startRoomIndex = 0

        let rooms = this.dungeon.getRooms()

        let doors = new Map<string, { door: Phaser.Tilemaps.Tile, room: Room }>()

        for (let r of rooms) {
            for (let [x, y, tx, ty] of Rect(r.point.x + 1, r.point.y + 1, r.size.w - 2, r.size.h - 2)) {
                this.backLayer.getTileAt(x, y).index = floorTiles[ty][tx]
            }
            for (let [x, y, tx, ty] of RectFrame(r.point.x, r.point.y, r.size.w, r.size.h)) {
                this.backLayer.getTileAt(x, y).index = wallTiles[ty][tx]
            }
            for (let d of r.getDoors()) {
                let ax = r.point.x + d.x
                let ay = r.point.y + d.y
                this.backLayer.getTileAt(ax, ay).index = floorTiles[1][1]

                let door = this.objectsLayer.putTileAt(0, ax, ay)
                door.tint = 0
                doors.set(`${ax}:${ay}`, { door, room: r })
            }
            for (let [x, y] of Rect(r.point.x, r.point.y, r.size.w, r.size.h)) {
                this.backLayer.getTileAt(x, y).tint = 0
            }
        }

        console.log(`doors.size=${doors.size}`)

        for (let [id, info] of doors) {
            let p = { x: info.door.x, y: info.door.y }
            console.log('searching pair for ', id)
            let pair: { door: Phaser.Tilemaps.Tile, room: Room }

            let d4 = [[1, 0], [0, 1], [-1, 0], [0, -1]]
            for (let [x, y] of d4) {
                let id2 = `${p.x + x}:${p.y + y}`
                console.log('checking ', id2)
                if (doors.has(id2)) {
                    pair = doors.get(id2)
                    break
                }
            }

            info.door["interactive"] = new Door(p, () => {
                this.objectsLayer.putTileAt(1000, p.x, p.y)
                this.objectsLayer.putTileAt(1000, pair.door.x, pair.door.y)
                this.showRoom(pair.room)
            })
        }

        let startRoom = rooms[startRoomIndex]
        this.showRoom(startRoom)

        this.txt = this.add.bitmapText(0, 0, "sds_8x8", "").setScrollFactor(0)


        let startPoint = { ...startRoom.point }
        startPoint.x = startPoint.x * 16 + startRoom.size.w * 16 / 2
        startPoint.y = startPoint.y * 16 + startRoom.size.h * 16 / 2

        this.player = new Player(this, startPoint, 'warrior')

        rooms.forEach((r, idx) => {
            if (idx != startRoomIndex) {
                let x0 = (r.point.x + 2) * 16
                let y0 = (r.point.y + 2) * 16
                let w0 = (r.size.w - 4) * 16
                let h0 = (r.size.h - 4) * 16
                let n1 = Math.floor(2+Math.random()*2)
                for(let i=0;i<n1;++i) {
                    let x = x0 + Math.random() * w0
                    let y = y0 + Math.random() * h0
                    this.enemies.push(new GameUnit(this, x, y, 'daemon', Math.floor(8+Math.random()*8)))
                }
                let n2 = Math.floor(3+Math.random()*3)
                for(let i=0;i<n2;++i) {
                    let x = x0 + Math.random() * w0
                    let y = y0 + Math.random() * h0
                    let u = new GameUnit(this, x, y, 'elemental', 34)
                    u.hp = 50
                    u.attackCooldown = 1000
                    u.projectileSprite = 'effect0'
                    u.projectileSpriteNum = 168
                    this.enemies.push(u)
                    u.melee = false
                }
            }
        })

        let lastRoom = rooms[1/*rooms.length-1*/]

        {
            let ex = (lastRoom.point.x+Math.floor(lastRoom.size.w/2))
            let ey = (lastRoom.point.y+Math.floor(lastRoom.size.h/2))
            let exit = this.objectsLayer.putTileAt(41, ex, ey)
            exit["interactive"] = new Door({x:ex,y:ey}, ()=>{
                console.log("next level")
            })
        }

        this.input.keyboard.createCombo('IDDQD')
        this.input.keyboard.on('keycombomatch',()=>{
            console.log('combo!')
            this.txt.setText('As if!')
            let p = this.player.getPos()
            let u = new GameUnit(this, p.x+32, p.y+32, 'reptile', 99)
            u.moveSpeed = 70
            u.hp = 200
            this.enemies.push(u)
            u.activate()
        })

        this.backLayer.setCollisionBetween(1000, 2000)
        this.objectsLayer.setCollisionBetween(0, 999)
        this.physics.add.collider(this.player.tile, this.backLayer)
        this.physics.add.collider(this.player.tile, this.objectsLayer)

        this.objectsLayer.setTileIndexCallback([0,41], (obj, tile) => {
            console.log(tile.interactive)
            this.interactiveObj = tile.interactive
        }, null)

        let enemiesGroup = this.physics.add.group()
        enemiesGroup.addMultiple(this.enemies.map(e => e.tile))

        this.physics.add.collider(enemiesGroup, this.backLayer)
        this.physics.add.collider(enemiesGroup, this.objectsLayer)
        this.physics.add.collider(enemiesGroup, enemiesGroup)
        this.physics.add.collider(this.player.tile, enemiesGroup)

        this.enemyProjectilesGroup = this.physics.add.group()
        this.physics.add.collider(this.enemyProjectilesGroup, this.backLayer, prj=>prj.destroy())
        this.physics.add.collider(this.enemyProjectilesGroup, this.objectsLayer, prj=>prj.destroy())
        this.physics.add.collider(this.enemyProjectilesGroup, this.player.tile, (plr,prj:Phaser.Physics.Arcade.Sprite)=>{
            console.log(prj, plr)
            let x = this.player.getPos().x - prj.body.x
            let y = this.player.getPos().y - prj.body.y
            let v = new Phaser.Math.Vector2(x,y).normalize().scale(10)
            this.player.takeDamage(2, v)
            prj.destroy()
        })

        this.pickableGroup = this.physics.add.group()
        this.physics.add.collider(this.pickableGroup, this.backLayer)
        this.physics.add.collider(this.pickableGroup, this.objectsLayer)
        this.physics.add.overlap(this.pickableGroup, this.player.tile, (plr,pck:Phaser.Physics.Arcade.Sprite)=>{
            console.log('pickable collide',plr, pck)
            this.pickable = this.pickable.filter(item=>{
                if(item.tile==pck) {
                    if(item.tryPick()) {
                        item.tile.destroy()
                        return false
                    }
                    return true
                }
                return true
            })
        })

        const camera = this.cameras.main
        camera.startFollow(this.player.tile)
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)

        this.cursors = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'right': Phaser.Input.Keyboard.KeyCodes.D
        })
        let fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
        fKey.on('down', () => {
            if (this.interactiveObj) {
                this.interactiveObj.interact()
            }
        })
        let spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        spaceKey.on('down', () => {
            this.activateDash()
        })
        this.input.setPollAlways()
        this.input.on("pointerdown", () => this.onMouseDown())
        this.input.mouse.disableContextMenu()
        this.updatePlayerHearts()
    }

    activateDash() {
        let m = this.getMousePos()
        let mt = this.map.worldToTileXY(m.x, m.y)
        let p = this.player.getPos()
        let pt = this.map.worldToTileXY(p.x, p.y)
        let l = Phaser.Geom.Line.BresenhamPoints(new Phaser.Geom.Line(pt.x, pt.y, mt.x, mt.y))
        let dst = p
        for (let lp of l) {
            if (this.backLayer.getTileAt(lp.x, lp.y).collides || this.objectsLayer.getTileAt(lp.x, lp.y)?.collides) {
                break
            }
            dst = this.map.tileToWorldXY(lp.x, lp.y)
        }
        this.player.dash(this.gameTime, dst)
    }

    getMousePos() {
        this.input.activePointer.updateWorldPoint(this.cameras.main)
        const x = this.input.activePointer.worldX
        const y = this.input.activePointer.worldY
        return { x, y }
    }

    updatePlayerHearts() {
        let n = Math.round(this.player.maxHp / 10)
        while (this.hearts.length < n) {
            this.hearts.push(this.add.sprite(this.hearts.length * 16, 16, 'gui0', 16).setScrollFactor(0).setOrigin(0, 0))
        }
        let k = Math.floor(this.player.hp / 10)
        for (let i = 0; i < k; ++i) {
            this.hearts[i].setFrame(16)
        }
        if (k == n) {
            return;
        }
        let nx = k + 1 == n ? this.player.maxHp : (k + 1) * 10
        let d = (nx - this.player.hp) / (nx - k * 10)
        this.hearts[k].setFrame(Math.round(17 + (d * 3)))
        for (let i = k + 1; i < n; ++i) {
            this.hearts[i].setFrame(20)
        }
    }

    showRoom(r: Room) {
        r.explored = true
        for (let [x, y] of Rect(r.point.x, r.point.y, r.size.w, r.size.h)) {
            let t = Math.floor(220 + Math.random() * 35)
            t = (t << 16) | (t << 8) | t
            this.backLayer.getTileAt(x, y).tint = t
            let ot = this.objectsLayer.getTileAt(x, y)
            if (ot) {
                ot.tint = t
            }
        }
        for (let enemy of this.enemies) {
            let p = this.map.worldToTileXY(enemy.tile.body.x, enemy.tile.body.y)
            if (!enemy.active && r.isInside(p)) {
                enemy.activate()
            }
        }
    }

    onMouseDown() {
        if (this.input.activePointer.leftButtonDown() || this.input.activePointer.rightButtonDown()) {
            let ap = this.input.activePointer
            let dir = ap.leftButtonDown() ? -1 : 1
            this.player.startAttack(this.gameTime, dir)
        }
    }

    gameOver() {
        const cam = this.cameras.main;
        cam.fade(2000, 0, 0, 0);
        cam.once("camerafadeoutcomplete", () => {
            this.scene.start('gameover')
        });
    }

    createTrail(f: Point, t: Point) {
        this.trail = []
        for (let i = 0; i < 10; ++i) {
            let d = i / 10
            let x = Phaser.Math.Interpolation.Linear([f.x, t.x], d)
            let y = Phaser.Math.Interpolation.Linear([f.y, t.y], d)
            let s = this.add.sprite(x, y, "warrior")
            s.frame = this.player.tile.frame
            s.alpha = d
            this.trail.push(s)
        }
    }

    updateTrail(delta: number) {
        if (!this.trail) {
            return
        }
        this.trail = this.trail.filter(s => {
            s.alpha -= delta / 1000
            return s.alpha > 0
        })
    }

    update(time: number, delta: number) {

        let ani: string
        let vx = 0
        let vy = 0
        if (this.cursors.up.isDown) {
            ani = 'up'
            vy = -50
        }
        if (this.cursors.down.isDown) {
            ani = 'down'
            vy = 50
        }
        if (this.cursors.left.isDown) {
            ani = 'left'
            vx = -50
        }
        if (this.cursors.right.isDown) {
            ani = 'right'
            vx = 50
        }
        this.player.stop()
        for (let enemy of this.enemies) {
            enemy.stop()
        }
        if (ani || this.player.dashActive) {
            this.gameTime += delta

            this.updateTrail(delta)

            if (this.player.dashActive) {
                this.player.dashActive = false
                this.player.dashEndOfCooldown = this.gameTime + this.player.dashCooldownTime

                this.createTrail(this.player.tile.body, this.player.dashPos)

                this.player.tile.body.x = this.player.dashPos.x
                this.player.tile.body.y = this.player.dashPos.y

            }
            else {
                this.player.move(this.gameTime, vx, vy)
            }

            if (ani) {
                this.player.playAni(ani)
            }

            if (this.player.hp <= 0) {
                this.gameOver()
                return
            }

            this.updatePlayerHearts()

            if (this.interactiveObj) {
                this.txt.setText('Press F to interact')
                let px = this.player.tile.body.x
                let py = this.player.tile.body.y
                let tx = this.interactiveObj.point.x * 16 + 4
                let ty = this.interactiveObj.point.y * 16
                let d = Phaser.Math.Distance.Between(px, py, tx, ty)
                if (d > 24) {
                    this.interactiveObj = undefined
                    this.txt.setText('')
                }
            }

            for (let enemy of this.enemies) {
                enemy.update(this.gameTime, this.player)
                if(enemy.pendingProjectile) {
                    let p = enemy.pendingProjectile
                    enemy.pendingProjectile = undefined
                    let s = this.physics.add.sprite(p.startPos.x, p. startPos.y, p.spriteName, p.spriteNum)
                    s.setCircle(8)
                    s.setDepth(101)
                    this.enemyProjectilesGroup.add(s)
                    p.sprite = s
                    this.enemyProjectiles.push(p)
                }
            }

            this.enemyProjectiles = this.enemyProjectiles.filter(prj=>prj.sprite.body)

            for(let prj of this.enemyProjectiles) {
                prj.sprite.setVelocity(prj.dir.x, prj.dir.y)
            }

            let dmgInfo = this.player.damageInfo
            this.player.damageInfo = []

            if (this.player.weapon && this.player.weapon.isSwinging()) {
                let di = this.player.weapon.checkCollision(this.gameTime, this.enemies)
                if (dmgInfo) {
                    dmgInfo.push(...di)
                }
                else {
                    dmgInfo = di
                }
            }
            for (let dmg of dmgInfo) {
                this.dmgTxt.push({
                    damageInfo: dmg,
                    expTime: this.gameTime + 800,
                    txt: this.add.bitmapText(dmg.point.x, dmg.point.y, "sds_8x8", dmg.amount.toFixed(1)).setTint(dmg.tint)
                })
            }

            this.dmgTxt = this.dmgTxt.filter(t => {
                t.txt.x += t.damageInfo.dir.x / delta
                t.txt.y += t.damageInfo.dir.y / delta
                let rv = t.expTime > this.gameTime
                if (!rv) {
                    t.txt.destroy()
                }
                return rv
            })

            for(let enemy of this.enemies) {
                if(enemy.canBeRemoved && Math.random() < 0.25) {
                    this.spawnPotion(enemy.tile)
                }
            }

            this.enemies = this.enemies.filter(e => !e.canBeRemoved)

            this.input.activePointer.updateWorldPoint(this.cameras.main)
            const mx = this.input.activePointer.worldX
            const my = this.input.activePointer.worldY
            this.player.updateWeapon(this.gameTime, mx, my)
        }
        else {
            this.player.pause()
            for (let enemy of this.enemies) {
                enemy.pause()
            }
            this.enemyProjectilesGroup.setVelocity(0,0)
        }
    }
    spawnPotion(p:Point) {
        let potion = new Pickable(this, p, 'potion', 0)
        potion.tile.setDepth(this.player.tile.depth-1)
        potion.onTryPick = ()=>{
            if(this.player.hp < this.player.maxHp) {
                this.player.hp += 5
                this.player.hp = Math.min(this.player.hp, this.player.maxHp)
                let info : DamageInfo = {
                    amount : 5,
                    point:this.player.getPos(),
                    dir:{x:0, y:-5},
                    tint:0x80ff80
                }
                this.dmgTxt.push({
                    damageInfo: info,
                    expTime: this.gameTime + 800,
                    txt: this.add.bitmapText(info.point.x, info.point.y, "sds_8x8", info.amount.toFixed(1)).setTint(info.tint)
                })
                return true
            }
            return false
        }
        this.pickable.push(potion)
        this.pickableGroup.add(potion.tile)
}
}

import { Point } from "./util/point"
import { Player } from "./player"

export class Pickable{
    tile: Phaser.Physics.Arcade.Sprite
    onTryPick : ()=>boolean
    constructor(scene:Phaser.Scene, p:Point, tileName:string, tileNum:number) {
        this.tile = scene.physics.add.sprite(p.x, p.y, tileName, tileNum)
    }

    tryPick() : boolean{
        return this.onTryPick()
    }
}

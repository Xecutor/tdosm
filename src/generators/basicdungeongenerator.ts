import { DungeonGenerator } from "./dungeongenerator"
import { Room, Dungeon as DungeonItf} from "./dungeon"
import { Point } from "../util/point"

import Dungeon  from "@mikewesthad/dungeon"

//import "@mikewesthad/dungeon"

//let Dungeon = require("@mikewesthad/dungeon")

import { Size } from "../util/size"

class BasicRoom implements Room {
    constructor(public point:Point, public size:Size, public doors:Point[]) {
    }
    getDoors() {
        return this.doors
    }
    isInside(p:Point) {
        return p.x>=this.point.x && p.y>=this.point.y &&
               p.x<=this.point.x+this.size.w &&
               p.y<=this.point.y+this.size.h
    }
}

class BasicDungeon implements DungeonItf {
    dungeon : Dungeon
    rooms : BasicRoom[]
    constructor(size:Size, maxRooms:number) {
        this.dungeon = new Dungeon({
            width:size.w,
            height:size.h,
            rooms:{
                width:{min:8, max:20},
                height:{min:8, max:20},
                maxRooms
            },
        })
        this.rooms = this.dungeon.rooms.map((r)=>new BasicRoom({x:r.x, y:r.y}, {w:r.width, h:r.height},r.getDoorLocations()))
    }
    getRooms(): Room[] {
        return this.rooms
    }

    getRoomAt(p:Point) {
        for(let r of this.rooms) {
            if(r.isInside(p)) {
                return r
            }
        }
        return null
    }
}

export class BasicDungeonGenerator implements DungeonGenerator {
    constructor(private size:Size, private maxRooms:number) {
    }
    generate(): DungeonItf {
        return new BasicDungeon(this.size, this.maxRooms)
    }
    
}

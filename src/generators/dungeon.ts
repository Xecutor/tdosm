import { Point } from "../util/point";
import { Size } from "../util/size";

export interface Room {
    point: Point
    size: Size
    explored?:boolean
    getDoors():Point[]
    isInside(p:Point):boolean
}

export interface Dungeon{
    getRooms():Room[]
    getRoomAt(p:Point):Room|null
}

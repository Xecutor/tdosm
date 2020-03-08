import { Point } from "./util/point"

export class Pushable{
    pushDir:Point
    pushStartTime:number
    pushEndTime:number = 0

    constructor() {
    }

    activatePush(dir:Point, gameTime:number, pushTime:number) {
        this.pushStartTime = gameTime
        this.pushEndTime = gameTime+pushTime
        this.pushDir = {...dir}
    }

    isActive(gameTime:number) {
        return this.pushEndTime > gameTime
    }

}
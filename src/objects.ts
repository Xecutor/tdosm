import { Point } from "./util/point";

export class InteractiveObject {
    constructor(public point:Point) {
    }
    interact(){
    }
}

export class Door extends InteractiveObject {
    constructor(point:Point, private onInteract:()=>void){
        super(point)
    }
    interact() {
        this.onInteract()
    }
}
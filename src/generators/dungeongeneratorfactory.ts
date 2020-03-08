import { DungeonGenerator } from "./dungeongenerator";
import { BasicDungeonGenerator } from "./basicdungeongenerator";
import { Size } from "../util/size";

export interface DungeonParams{
    size:Size
    maxRooms:number
}

export class DungeonGeneratorFactory{
    create(params:DungeonParams):DungeonGenerator {
        return new BasicDungeonGenerator(params.size, params.maxRooms)
    }
}

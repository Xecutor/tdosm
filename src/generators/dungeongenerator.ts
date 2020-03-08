import { Dungeon } from "./dungeon";

export interface DungeonGenerator{
    generate() : Dungeon
}
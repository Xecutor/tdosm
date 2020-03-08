import 'phaser';
import { MainMenuScene } from './mainmenuscene'
import { DungeonScene } from './dungeonscene'
import {GameOverScene} from './gameoverscene'

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    parent: "game",
    width: 640,
    height: 360,
    scene: [MainMenuScene, DungeonScene, GameOverScene],
    zoom: 2,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
    },
    render: {
        pixelArt: true
    }
};

const game = new Phaser.Game(config);

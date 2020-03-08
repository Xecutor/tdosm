
export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({key:'gameover'})
    }
    preload() {
        this.load.bitmapFont("sds_16x16", "assets/fonts/sds16x16.png", "assets/fonts/sds16x16.fnt")
    }
    create() {

        let txt = this.add.bitmapText(0, 0,"sds_16x16", "Game over :(", )
        let w = this.game.config.width as number
        let h = this.game.config.height as number
        txt.setPosition((w - txt.width) / 2, (h - txt.height) / 2)

        this.input.on('pointerdown',()=>{
            const cam = this.cameras.main;
            cam.fade(1000, 0, 0, 0);
            cam.once("camerafadeoutcomplete", () => {
                this.scene.start('mainmenu')
            });        
        })

    }}
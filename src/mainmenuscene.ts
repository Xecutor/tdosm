
export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({key:'mainmenu'})
    }
    preload() {
        this.load.bitmapFont("sds_16x16", "assets/fonts/sds16x16.png", "assets/fonts/sds16x16.fnt")
    }
    create() {

        let txt = this.add.bitmapText(0, 0,"sds_16x16", "Start", )
        
        txt.setInteractive()
        txt.on("pointerdown",()=>{
            this.scene.start("dungeon")
        })
        txt.on("pointerover",()=>{
            txt.tint=0xff9090
        })

        txt.on("pointerout",()=>{
            txt.tint=0xffffff
        })

        let w = this.game.config.width as number
        let h = this.game.config.height as number
        txt.setPosition((w - txt.width) / 2, (h - txt.height) / 2)
    }
}
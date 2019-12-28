import * as PIXI from "pixi.js";
class BaseDrawTool{
    constructor(boarCtrl) {
        this.boarCtrl = boarCtrl
        this.pixiApp = boarCtrl.pixiApp
        this.selectionCtrl = boarCtrl.selectionCtrl
        this.uiRenderTexture = boarCtrl.uiRenderTexture
        this.add = true
        this.baseCanvas = boarCtrl.baseCanvas
        this.layer = null
    }
    mouseDown(pos){}
    mouseUp(pos){}
    mouseMove(pos){}
    setActive(layer,scale){}
    onPhotoScaleChange(scale){}
    setToAdd(){
        if(this.add === true){return}
        this.add = true
        this.onAddChange()
    }
    setToRemove(){
        if(this.add === false){return}
        this.add = false
        this.onAddChange()
    }
    onSelectedLayerPropsChange(){}
    onAddChange(){

    }

    get defaultColorToPaint(){
        return this.add === true ? BaseDrawTool.ADD_COLOR : BaseDrawTool.REMOVE_COLOR
    }
    static REMOVE_COLOR = 0x000000
    static ADD_COLOR = 0xff0000
    static BLANK_DISPLAY_OBJ = new PIXI.Container();
}

export default BaseDrawTool
import * as PIXI from "pixi.js";
import UTILS from "../Utils";
import PixelsSelector from "wayak-pixels-selector"
import BaseDrawTool from "./BaseDrawTool";


class ToolSelectionMagicWand extends BaseDrawTool{
    static CANVAS = document.createElement("canvas")
    static CTX = ToolSelectionMagicWand.CANVAS.getContext("2d")
    constructor(ctrl){
        super(ctrl)
        this.tolerance = 100
        this.baseWidth = this.baseCanvas.width
        this.baseHeight = this.baseCanvas.height
        this.uiHelper = new ToolSelectionMagicWandUIHelper(this.baseWidth,this.baseHeight,this.pixiApp.renderer,this.uiRenderTexture)
        ToolSelectionMagicWand.CANVAS.width = this.baseWidth
        ToolSelectionMagicWand.CANVAS.height = this.baseHeight
        ToolSelectionMagicWand.CTX.drawImage(this.baseCanvas,0,0,this.baseWidth,this.baseHeight)
        this.isDraging = false
        this.previewLayer = new MagicWandPreviewLayer(this.baseWidth,this.baseHeight,this.pixiApp.renderer,this.boarCtrl.blackLayerTexture,this.boarCtrl.whiteLayerTexture);
        this.layersVisibleInfo = []
    }
    setActive(layer){
        if(this.layer==layer){return;}
        this.pixiApp.renderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ,this.uiRenderTexture,true)
        if(layer!=null){
            this.layer=layer;
            this.previewLayer.setLayer(this.layer)
            this.previewLayer.setColor(layer.color)
            this.previewLayer.setDarkLevel(layer.blackLevel)
            this.previewLayer.setWhiteLevel(layer.whiteLevel)
            this.hideLayers()
            this.boarCtrl.layersContainer.addChild(this.previewLayer);
        }else{
            this.layer=null;
            this.pixiApp.renderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ,this.uiRenderTexture,true)
            this.uiHelper.clearPoint()
            this.showLayers()
            this.boarCtrl.layersContainer.removeChild(this.previewLayer);
            this.previewLayer.clear()
            //renderer.render(blankObj,previewLayer.renderTexture,true)
        }

    };

    setTolerance(val, autoFill){
        val = Math.round(val)
        val = val < 0 ? 0 : val
        val = val > 200 ? 200 : val
        this.tolerance = val
        if(autoFill){
            this.fillFromPickedColor()
        }
    }
    getTolerance(){return this.tolerance}

    hideLayers(){
        for(let i in this.boarCtrl.layers){
            const l = this.boarCtrl.layers[i]
            this.layersVisibleInfo.push(l.visible)
            l.visible = false
        }
    }

    showLayers(){
        for(let i in this.boarCtrl.layers){
            this.boarCtrl.layers[i].visible = this.layersVisibleInfo[i]
        }
        this.layersVisibleInfo.length = 0
    }

    onAddChange() {
        this.fillFromPickedColor()
    }

    mouseDown(pos){
        if(this.layer == null){return}
        if(this.uiHelper.point == null){
            const localPoint = this.layer.toLocal(pos)
            let color = PixelsSelector.getPixelInfo(Math.round(localPoint.x),Math.round(localPoint.y),ToolSelectionMagicWand.CANVAS)
            this.uiHelper.addPoint(pos,localPoint,color.uint32)
        }

        if(UTILS.distance2d(pos,this.uiHelper.point.uiPoint) <= this.uiHelper.pointRadius){
            this.isDraging = true
        }
    };
    mouseMove(pos) {
        const {x,y} = pos
        if(this.isDraging){
            const localPoint = this.layer.toLocal(pos)
            let color = PixelsSelector.getPixelInfo(Math.round(localPoint.x),Math.round(localPoint.y),ToolSelectionMagicWand.CANVAS)
            this.uiHelper.movePoint({x,y},localPoint,color.uint32)
        }
    }

    mouseUp(pos) {
        if(this.layer && this.isDraging === true){
            if(this.boarCtrl.magicWandCallBack){
                this.boarCtrl.magicWandCallBack()
            }
            this.fillFromPickedColor()
        }
        this.isDraging = false
    }


    onPhotoScaleChange(scale){
        if(this.layer && this.uiHelper.point){
            this.uiHelper.point.uiPoint = this.layer.toGlobal(this.uiHelper.point.layerPoint)
            this.uiHelper.render()
        }
    };

    fillFromPickedColor(){
        if (this.layer === null || this.uiHelper.point === null || this.uiHelper.point  === undefined){return}
        const point = this.uiHelper.point.layerPoint
        const result = PixelsSelector.floodFill(Math.round(point.x),Math.round(point.y),ToolSelectionMagicWand.CANVAS,this.tolerance,this.defaultColorToPaint)
        this.previewLayer.putImageData(result)
    }

    apply(){
        this.selectionCtrl.draw(this.previewLayer.selectedPixelsSprite,0,0,this.layer);
        this.previewLayer.clear()
        this.previewLayer.setLayer(this.layer)
        this.pixiApp.renderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ,this.uiRenderTexture,true)
        this.uiHelper.clearPoint()
    }

    onSelectedLayerPropsChange() {
        this.previewLayer.setColor(this.layer.color)
        this.previewLayer.setDarkLevel(this.layer.blackLevel)
        this.previewLayer.setWhiteLevel(this.layer.whiteLevel)
    }


}


const ToolSelectionMagicWandUIHelper = function(width,height,renderer,renderTexture){
    this.pointRadius = 20
    /*
    * uiPoint : point for UIrenderer (global position)
    * layerPoint: point in layer (local position)
    * color: number
    * */
    this.addPoint = (uiPoint,layerPoint,color)=>{
        const graphics = new PIXI.Graphics()
        redrawPoint(graphics,color)
        this.point = {uiPoint,layerPoint,color,graphics}
        const matrix = new PIXI.Matrix()
        matrix.translate(uiPoint.x,uiPoint.y)
        renderer.render(graphics,renderTexture,false,matrix)
    }

    this.movePoint = (uiPoint,layerPoint,newColor)=>{
        if(this.point == null){return}
        this.point.uiPoint = uiPoint
        this.point.layerPoint = layerPoint
        if (this.point.color != newColor){
            this.point.color = newColor
            redrawPoint(this.point.graphics,newColor)
        }
        this.render()
    }

    /*
    * pointGraphics : PIXI.Graphics
    * */
    const redrawPoint = (pointGraphics,color)=>{
        pointGraphics.clear()
        pointGraphics.beginFill(color,1)
        pointGraphics.lineStyle(3,0xFFFFFF,1)
        pointGraphics.drawCircle(0,0,this.pointRadius)
        pointGraphics.endFill()

        pointGraphics.beginFill(color,0)
        pointGraphics.lineStyle(1,0x000000,1)
        pointGraphics.drawCircle(0,0,this.pointRadius)
        pointGraphics.endFill()

    }

    this.render = ()=>{
        const point = this.point
        const matrix = new PIXI.Matrix()
        matrix.translate(point.uiPoint.x,point.uiPoint.y)
        renderer.render(point.graphics,renderTexture,true,matrix)
    }

    this.clearPoint = ()=>{
        if(this.point === null){return}
        this.point.graphics.destroy()
        this.point = null
    }
}

const MagicWandPreviewLayer = function(width,height,pixiRenderer,blackLayerTexture,whiteLayerTexture){

    const redrawColor = ()=>{
        colorLayer.clear();
        colorLayer.beginFill(this.currentColor,1);
        colorLayer.drawRect(0,0,width,height);
        colorLayer.endFill();
    };

    this.whiteLevel=.5;
    this.darkLevel=.5;

    PIXI.Container.call(this);

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")

    //this.layer = null


    /*
    * this.brushTexture=PIXI.Texture.from(this.brushCanvas, {scaleMode:PIXI.SCALE_MODES.LINEAR});
    this.brushSprite=new PIXI.Sprite(this.brushTexture);
    * */

    const selectedPixelsTexture = PIXI.Texture.from(canvas, {scaleMode:PIXI.SCALE_MODES.LINEAR});
    this.selectedPixelsSprite =new  PIXI.Sprite(selectedPixelsTexture)
    //const drawMask=new PIXI.Sprite(texture);

    const maskTexture = PIXI.RenderTexture.create({width:width,height:height})
    const drawMask=new PIXI.Sprite(maskTexture);


    drawMask.cacheAsBitmap = false
    drawMask.renderable = true



    const colorLayer=new PIXI.Graphics();
    const lightsSprite=new PIXI.Sprite(whiteLayerTexture);
    //this.lightsSprite.cacheAsBitmap=true;
    lightsSprite.alpha=this.whiteLevel;
    const shadowsSprite=new PIXI.Sprite(blackLayerTexture);
    //this.shadowsSprite.cacheAsBitmap=false;
    shadowsSprite.alpha=this.darkLevel;
    lightsSprite.mask=  drawMask;
    shadowsSprite.mask= drawMask;
    colorLayer.mask= drawMask;

    this.currentColor=0xFF0000;

    this.addChild(colorLayer);
    this.addChild(lightsSprite);
    this.addChild(shadowsSprite);
    this.addChild(drawMask);
    redrawColor();

    this.setColor=(color)=>{
        this.currentColor=color;
        redrawColor();
    };



    this.setWhiteLevel = (level)=> {
        lightsSprite.alpha = level;
        this.whiteLevel = lightsSprite.alpha;
    }

    this.setDarkLevel = (level)=> {
        shadowsSprite.alpha = level;
        this.darkLevel= shadowsSprite.alpha;
    }

    this.putImageData = (imageData)=>{
        ctx.putImageData(imageData,0,0)
        selectedPixelsTexture.update()
        const sp = new PIXI.Sprite(this.layer.renderTexture)
        pixiRenderer.render(sp,maskTexture,true)
        pixiRenderer.render(this.selectedPixelsSprite,maskTexture,false)
        sp.destroy({texture:false,baseTexture:false})
    }

    this.setLayer = (layer)=>{
        this.layer = layer
        const sp = new PIXI.Sprite(this.layer.renderTexture)
        pixiRenderer.render(sp,maskTexture,true)
        sp.destroy({texture:false,baseTexture:false})
    }

    this.clear = ()=>{
        ctx.clearRect(0,0,canvas.width,canvas.height)
        selectedPixelsTexture.update()
        pixiRenderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ,maskTexture,true)
    }

    return this
};

MagicWandPreviewLayer.prototype = Object.create(PIXI.Container.prototype);


export default ToolSelectionMagicWand

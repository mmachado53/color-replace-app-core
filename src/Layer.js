import * as PIXI from 'pixi.js'
import UTILS from "./Utils";
import RGBUtils from "wayak-rgb-utils"

class Layer extends PIXI.Container{

    constructor(width,height,name,id,blackLayerTexture,whiteLayerTexture){
        super()
        this.name=name;
        this.layerID=id;
        this.rendererWidth=width;
        this.rendererHeight=height;
        this.renderTexture = PIXI.RenderTexture.create(this.rendererWidth,this.rendererHeight);
        this.drawMask=new PIXI.Sprite(this.renderTexture);
        this.drawMask.cacheAsBitmap = false
        this.drawMask.renderable = true
        this.colorLayer=new PIXI.Graphics();
        this.whiteLayerSprite=new PIXI.Sprite(whiteLayerTexture);
        this.whiteLayerSprite.alpha= .3;
        this.blackLayerSprite=new PIXI.Sprite(blackLayerTexture);
        this.blackLayerSprite.alpha=.7;
        this.whiteLayerSprite.mask=this.drawMask;
        this.blackLayerSprite.mask=this.drawMask;
        this.colorLayer.mask=this.drawMask;
        this.currentColor=0xFF0000;
        this.addChild(this.colorLayer);
        this.addChild(this.whiteLayerSprite);
        this.addChild(this.blackLayerSprite);
        this.addChild(this.drawMask);
        this.redrawColor()
        this.rebuildColorsInfos()
    }

    set color(color){
        this.currentColor=color;
        this.rebuildColorsInfos()
        this.redrawColor();
    }
    get color(){
        return this.currentColor
    }

    redrawColor(){
        this.colorLayer.clear();
        this.colorLayer.beginFill(this.currentColor,1);
        this.colorLayer.drawRect(0,0,this.rendererWidth,this.rendererHeight);
        this.colorLayer.endFill();
    }

    rebuildColorsInfos(){
        this.currentHexColor = this.currentColor.toString(16)
        if(this.currentHexColor.length < 6){
            this.currentHexColor = "0".repeat(6 - this.currentHexColor.length).concat(this.currentHexColor)
        }
        this.currentRGBColor = RGBUtils.numberToRGB(this.currentColor)
        const {r,g,b} = this.currentRGBColor
        this.currentHSVColor = UTILS.rgb2hsv(r,g,b)
    }


    set whiteLevel(level) {
        this.whiteLayerSprite.alpha=level;
    }
    get whiteLevel() {
        return this.whiteLayerSprite.alpha;
    }

    set blackLevel(level) {
        this.blackLayerSprite.alpha=level;
    }
    get blackLevel() {
        return this.blackLayerSprite.alpha;
    }


    cleanForDestroy(){
        this.removeChild(this.drawMask);
        this.drawMask.destroy(true,true);
        if(this.image){
            this.removeChild(this.image);
            this.image.destroy(true,true);
        }
    };

    get info(){
        return {
            id:this.layerID,
            name:this.name,
            color:this.currentColor,
            hexColor:this.currentHexColor,
            rgbColor:this.currentRGBColor,
            hsvColor:this.currentHSVColor,
            whiteLevel:this.whiteLevel,
            blackLevel:this.blackLevel
        }
    }


}
export default Layer;
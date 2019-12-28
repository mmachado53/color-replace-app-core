import * as PIXI from 'pixi.js'
import BaseDrawTool from "./BaseDrawTool";

class ToolBrush extends BaseDrawTool{

    static BLUR_FILTER =  new PIXI.filters.BlurFilter(0,32);
    static CIRCLE_GRAPHICS = new PIXI.Graphics()

    constructor(boarCtrl){
        super(boarCtrl)
        this.size = 50
        this.uiSize = 0
        this.uiScale = 1
        this.drawing=false;
        this.brushTexture = PIXI.RenderTexture.create({width:1,height:1,scaleMode:PIXI.SCALE_MODES.LINEAR})
        this.brushSprite = new PIXI.Sprite(this.brushTexture)
        this.brushUISprite=new PIXI.Graphics();
        this.hardness=1;
        this.size=50;
        this.setSize(50);
    }
    addPoint(p){
        if(!this.layer){return;}
        const {width} = this.brushSprite.texture
        this.selectionCtrl.draw(this.brushSprite,p.x-(width / 2),p.y-(width / 2),this.layer);
    }
    setActive(layer,scale){
        this.uiScale= scale || 1;
        if(this.layer==layer){return;}
        if(layer!=null){
            this.layer=layer;
            this.redrawBrush();
            this.redrawUIBrush();
        }else{
            this.layer=null;
            this.pixiApp.renderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ,this.uiRenderTexture)
        }

    };

    mouseDown(pos) {
        if(!this.layer){return;}
        this.drawing=true;
        this.addPoint(this.layer.toLocal(pos));
    }
    mouseUp(pos) {
        this.drawing=false;
    }
    mouseMove(pos) {
        if(this.layer != null){
            var matrix=new PIXI.Matrix();
            matrix.translate(pos.x,pos.y);
            this.pixiApp.renderer.render(this.brushUISprite,this.uiRenderTexture,true,matrix)
            if(this.drawing){
                var m=this.layer.toLocal(pos);
                this.addPoint(m);
            }
        }
    }

    onAddChange() {
        this.redrawBrush()
    }

    setSize(size){
        this.size=size;
        this.redrawBrush();
        this.redrawUIBrush();
    }

    setHardness(val){
        val= val >1 ? 1 : val;
        val= val < 0 ? 0: val;
        this.hardness=val;
        this.redrawBrush();
        this.redrawUIBrush();
    }

    redrawBrush(){
        const radius = this.size / 2
        const blurSize = (this.size * .8) * (1 - this.hardness)
        const realSize = (radius+ blurSize) * 2
        ToolBrush.CIRCLE_GRAPHICS.beginFill(this.add === true ? BaseDrawTool.ADD_COLOR : 0x000000)
        ToolBrush.CIRCLE_GRAPHICS.beginFill(this.defaultColorToPaint)
        ToolBrush.CIRCLE_GRAPHICS.drawCircle(radius + blurSize, radius + blurSize, radius)
        ToolBrush.CIRCLE_GRAPHICS.endFill()

        ToolBrush.BLUR_FILTER.blur = blurSize
        ToolBrush.CIRCLE_GRAPHICS.filters = [ToolBrush.BLUR_FILTER]

        this.brushTexture.resize(realSize,realSize,true)
        this.pixiApp.renderer.render( ToolBrush.CIRCLE_GRAPHICS, this.brushTexture,true)
        ToolBrush.CIRCLE_GRAPHICS.clear()
        ToolBrush.CIRCLE_GRAPHICS.filters = []
        this.uiSize = realSize
    }

    redrawUIBrush(){
        this.brushUISprite.clear();
        this.brushUISprite.beginFill(0x69DCFF,0);
        this.brushUISprite.lineStyle(1,0x69DCFF,1);
        this.brushUISprite.drawCircle(0,0,(this.uiSize / 2 ) * this.uiScale);
        this.brushUISprite.endFill();

    };

    onPhotoScaleChange(scale) {
        this.uiScale=scale;
        this.redrawUIBrush();
    }

}

export default ToolBrush
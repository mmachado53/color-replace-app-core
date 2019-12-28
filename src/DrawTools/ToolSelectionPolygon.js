import * as PIXI from 'pixi.js'
import BaseDrawTool from "./BaseDrawTool";

class ToolSelectionPolygon extends BaseDrawTool{

    constructor(ctrl){
        super(ctrl)
        this.uiGraphic=new PIXI.Graphics();
        this.layerPoints=[];
        this.globalPoints=[];
        this.mousePoint=null;
    }

    setActive(layer, scale) {
        console.log(this.pixiApp.renderer)
        const renderer = this.pixiApp.renderer
        if(this.layer==layer){return;}
        renderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ, this.uiRenderTexture,true,null)
        if(layer!=null){
            this.layer=layer;
        }else{
            this.layer=null;
            renderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ, this.uiRenderTexture,true,null)
            this.cancel();
        }
    }
    mouseDown(pos) {
        if(this.layer==null){return;}
        this.mousePoint={x:pos.x,y:pos.y}
        this.redrawUI();
    }

    mouseUp(pos) {
        if(this.layer==null || this.mousePoint==null){return;}
        if(this.selectionCtrl.isSelction){
            this.selectionCtrl.clearSelection();
            return;
        }
        var globalPoint=new PIXI.Point(this.mousePoint.x,this.mousePoint.y);
        this.globalPoints.push(globalPoint);
        this.layerPoints.push(this.layer.toLocal(globalPoint));

        if(this.globalPoints.length>1){
            var dx=pos.x-this.globalPoints[0].x;
            var dy=pos.y-this.globalPoints[0].y;
            var dist = Math.sqrt( dx*dx + dy*dy );
            if(dist<50){
                this.mousePoint=null;
                this.finishPolygon();
            }
        }
    }

    mouseMove(pos) {
        if(this.mousePoint!=null){
            this.mousePoint.x=pos.x;
            this.mousePoint.y=pos.y;
            this.redrawUI();
        }
    }

    redrawUI(){
        this.uiGraphic.clear();
        this.uiGraphic.beginFill(0x69DCFF,.3);
        this.uiGraphic.lineStyle(1,0x69DCFF,1);

        if(this.globalPoints.length==0){
            if(this.mousePoint!=null){
                this.uiGraphic.drawCircle(this.mousePoint.x, this.mousePoint.y,5);
                this.uiGraphic.endFill();
                this.pixiApp.renderer.render(this.uiGraphic,this.uiRenderTexture,true,null)
                //this.UIRenderTexture.render(this.uiGraphic,null,true);
            }
            return;
        }
        this.uiGraphic.moveTo(this.globalPoints[0].x,this.globalPoints[0].y);
        let size=this.globalPoints.length;
        for(var i=1;i<size;i++){
            this.uiGraphic.lineTo(this.globalPoints[i].x,this.globalPoints[i].y);
        }

        this.uiGraphic.lineTo(this.mousePoint.x,this.mousePoint.y);
        this.uiGraphic.endFill();



        this.uiGraphic.drawCircle(this.globalPoints[0].x, this.globalPoints[0].y,5);
        this.uiGraphic.endFill();
        this.pixiApp.renderer.render(this.uiGraphic,this.uiRenderTexture,true,null)
        //this.UIRenderTexture.render(this.uiGraphic,null,true);

    };

    finishPolygon(){
        this.uiGraphic.clear();
        this.uiGraphic.beginFill(this.defaultColorToPaint,1);
        this.uiGraphic.lineStyle(0);

        this.uiGraphic.moveTo(this.layerPoints[0].x,this.layerPoints[0].y);
        var size=this.layerPoints.length;
        for(var i=1;i<size;i++){
            this.uiGraphic.lineTo(this.layerPoints[i].x,this.layerPoints[i].y);
        }

        this.uiGraphic.endFill();

        this.layerPoints.length=0;
        this.globalPoints.length=0;
        this.selectionCtrl.setSelection(this.uiGraphic);
        this.cancel();
    };

    cancel(){
        this.layerPoints.length=0;
        this.globalPoints.length=0;
        this.uiGraphic.clear();
        if(this.layer){
            this.pixiApp.renderer.render(BaseDrawTool.BLANK_DISPLAY_OBJ,this.uiRenderTexture,true,null)
            //this.UIRenderTexture.render(this.blankObj,null,true);
        }
    };

    onPhotoScaleChange(scale){
        if(!this.layer){return}
        if(this.globalPoints.length>0 && this.layerPoints.length>0){
            /*FIX GLOBAL POINTS*/
            var size=this.layerPoints.length;
            this.globalPoints.length=0;
            for(var i=0;i<size;i++){
                this.globalPoints.push(this.layer.toGlobal(this.layerPoints[i]));
            }
            this.redrawUI();
        }
    };


}

/*const ToolSelectionPolygon = function (UIRenderTexture,selectionCtrl,pixiApp) {

    this.setActive = (layer) => {
        const renderer = pixiApp.renderer
        if(this.layer==layer || this.UIRenderTexture==null){return;}
        renderer.render(this.blankObj, this.UIRenderTexture,true,null)
        //this.UIRenderTexture.render(this.blankObj,null,true);
        if(layer!=null){
            this.layer=layer;
            this.active=true;
        }else{
            this.layer=null;
            renderer.render(this.blankObj, this.UIRenderTexture,true,null)
            //this.UIRenderTexture.render(this.blankObj,null,true);
            this.active=false;
            this.cancel();
        }

    };


    this.setToRemove = ()=>{
        this.add=false;
    };

    this.setToAdd=()=>{
        this.add=true;
    };

    this.MouseDown=(mouse)=>{
        if(!this.active){return;}
        if(this.layer==null){return;}
        this.mousePoint={x:mouse.x,y:mouse.y}
        this.redrawUI();
        //this.addPoint(this.layer.toLocal(mouse));
    };

    this.MouseUp=(mouse)=>{
        if(this.layer==null || this.mousePoint==null){return;}
        if(this.selectionCtrl.isSelction){
            this.selectionCtrl.clearSelection();
            return;
        }
        var globalPoint=new PIXI.Point(this.mousePoint.x,this.mousePoint.y);
        this.globalPoints.push(globalPoint);
        this.layerPoints.push(this.layer.toLocal(globalPoint));

        if(this.globalPoints.length>1){
            var dx=mouse.x-this.globalPoints[0].x;
            var dy=mouse.y-this.globalPoints[0].y;
            var dist = Math.sqrt( dx*dx + dy*dy );
            if(dist<50){
                this.mousePoint=null;
                this.finishPolygon();
            }
        }
    };

    this.MouseMove=(mouse)=>{
        if(this.mousePoint!=null){
            this.mousePoint.x=mouse.x;
            this.mousePoint.y=mouse.y;
            this.redrawUI();
        }

    };


    this.redrawUI=()=>{
        this.uiGraphic.clear();
        this.uiGraphic.beginFill(0x69DCFF,.3);
        this.uiGraphic.lineStyle(1,0x69DCFF,1);

        if(this.globalPoints.length==0){
            if(this.mousePoint!=null){
                this.uiGraphic.drawCircle(this.mousePoint.x, this.mousePoint.y,5);
                this.uiGraphic.endFill();
                pixiApp.renderer.render(this.uiGraphic,this.UIRenderTexture,true,null)
                //this.UIRenderTexture.render(this.uiGraphic,null,true);
            }
            return;
        }
        this.uiGraphic.moveTo(this.globalPoints[0].x,this.globalPoints[0].y);
        var size=this.globalPoints.length;
        for(var i=1;i<size;i++){
            this.uiGraphic.lineTo(this.globalPoints[i].x,this.globalPoints[i].y);
        }

        this.uiGraphic.lineTo(this.mousePoint.x,this.mousePoint.y);
        this.uiGraphic.endFill();



        this.uiGraphic.drawCircle(this.globalPoints[0].x, this.globalPoints[0].y,5);
        this.uiGraphic.endFill();
        pixiApp.renderer.render(this.uiGraphic,this.UIRenderTexture,true,null)
        //this.UIRenderTexture.render(this.uiGraphic,null,true);

    };

    this.finishPolygon=()=>{
        var color= this.add==true ? 0xFF0000 : 0x000000;
        this.uiGraphic.clear();
        this.uiGraphic.beginFill(color,1);
        this.uiGraphic.lineStyle(0);

        this.uiGraphic.moveTo(this.layerPoints[0].x,this.layerPoints[0].y);
        var size=this.layerPoints.length;
        for(var i=1;i<size;i++){
            this.uiGraphic.lineTo(this.layerPoints[i].x,this.layerPoints[i].y);
        }

        this.uiGraphic.endFill();

        this.layerPoints.length=0;
        this.globalPoints.length=0;
        this.selectionCtrl.setSelection(this.uiGraphic);
        this.cancel();
    };

    this.cancel=()=>{
        this.layerPoints.length=0;
        this.globalPoints.length=0;
        this.uiGraphic.clear();
        if(this.active){
            pixiApp.renderer.render(this.blankObj,this.UIRenderTexture,true,null)
            //this.UIRenderTexture.render(this.blankObj,null,true);
        }
    };

    this.onPhotoScaleChange=(scale,r)=>{
        if(this.globalPoints.length>0 && this.layerPoints.length>0){
            /*FIX GLOBAL POINTS*/
/*var size=this.layerPoints.length;
this.globalPoints.length=0;
for(var i=0;i<size;i++){
    this.globalPoints.push(this.layer.toGlobal(this.layerPoints[i]));
}
this.redrawUI();
}
};

this.UIRenderTexture=UIRenderTexture;
this.selectionCtrl=selectionCtrl;
this.uiGraphic=new PIXI.Graphics();
this.add=true;
this.active=false;
this.blankObj=new PIXI.Container();
this.typeOfTool=BoardController.TYPE_TOOL_SELECTION;
this.layerPoints=[];
this.globalPoints=[];
this.mousePoint=null;
}*/

export default ToolSelectionPolygon;
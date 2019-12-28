import * as PIXI from 'pixi.js'
import UTILS from "./Utils";
import MagnifyingGlass from "./UI/MagnifyingGlass";
import Layer from "./Layer";
import SelectionPixelsCtrl from "./DrawTools/SelectionPixelsCtrl";
import ToolBrush from "./DrawTools/ToolBrush";
import ToolSelectionPolygon from "./DrawTools/ToolSelectionPolygon";
import ToolSelectionMagicWand from "./DrawTools/ToolSelectionMagicWand";



function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", err => reject(err));
        img.src = src;
    });
};

class BoardController {
    static TOOL_BRUSH = "TOOL_BRUSH"
    static TOOL_MAGIC_WAND = "TOOL_MAGIC_WAND"
    static TOOL_POLYGON = "TOOL_POLYGON"
    static TOOLS = []

    constructor(){
        this.layerCount=0;
        this.layers=[];
        this.currentLayer=null;
        this.currentTool=null;
        this.pixelRatio = window.devicePixelRatio || 1
        this.screenWidth = window.screen.width * this.pixelRatio
        this.screenHeight = window.screen.height * this.pixelRatio

        this.uiRenderTexture = PIXI.RenderTexture.create(this.screenWidth,this.screenHeight)
        this.uiSprite=new PIXI.Sprite(this.uiRenderTexture);

        this.timerForPinchToZoomGesture = null
        this.lastPinchGestureData = null
        this.lastMousePointClicked = null

    }

    async loadImage(containerHTMLElement,url,maxSize){
        this.containerHTMLElement = containerHTMLElement
        var image = await loadImage(url)
        this.buildBaseCanvas(image,maxSize)

        var base = PIXI.BaseTexture.from(this.baseCanvas)
        var texture = new PIXI.Texture(base);

        this.photoWidth=this.baseCanvas.width;
        this.photoHeight=this.baseCanvas.height;

        const blackWhiteLayers=UTILS.getBlackAndWitheLayers(this.baseCanvas);

        this.blackLayerTexture=PIXI.Texture.from(blackWhiteLayers.blackLayer);
        this.whiteLayerTexture=PIXI.Texture.from(blackWhiteLayers.whiteLayer);

        const centerData=UTILS.getCenterData(this.baseCanvas.width,this.baseCanvas.height,this.containerHTMLElement.clientWidth,this.containerHTMLElement.clientHeight);
        this.initSizes=centerData;
        this.photoSprite=new PIXI.Sprite(texture);
        return  this.startPixi()
    }

    buildBaseCanvas(image,maxSize){
        let scale = 1
        if(maxSize && (maxSize < image.width || maxSize < image.height)){
            const scaleX = maxSize / image.width
            const scaleY = maxSize / image.height
            scale = scaleX < scaleY ? scaleX : scaleY
        }
        var canvas=document.createElement("canvas");
        canvas.width=Math.round(image.width * scale);
        canvas.height=Math.round(image.height * scale);
        var ctx=canvas.getContext("2d");
        ctx.drawImage(image,0,0,canvas.width,canvas.height);
        this.baseCanvas = canvas
    }

    startPixi(){
        this.pixiApp = new PIXI.Application({
            autoDensity: true,
            resizeTo: this.containerHTMLElement,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1
        })
        this.pixiApp.stage.interactive = true

        this.selectionCtrl=new SelectionPixelsCtrl(this.photoWidth,this.photoHeight,this.pixiApp)
        //BoardController.TOOLS["BRUSH"]=new ToolBrush(this.uiRenderTexture,this.selectionCtrl,this.pixiApp,this);
        BoardController.TOOLS[BoardController.TOOL_BRUSH]=new ToolBrush(this);
        //BoardController.TOOLS["EREASE"]=new ToolBrush(this.uiRenderTexture,this.selectionCtrl,this.pixiApp);
        //BoardController.TOOLS["EREASE"].setToRemove();
        BoardController.TOOLS[BoardController.TOOL_POLYGON]=new ToolSelectionPolygon(this);
        //BoardController.TOOLS["SELECTION_POLYGON"]=new ToolSelectionPolygon(this.uiRenderTexture,this.selectionCtrl,this.pixiApp);
        //BoardController.TOOLS["SELECTION_MAGIC_WAND"]=new ToolSelectionMagicWand(this.uiRenderTexture,this.selectionCtrl,this.photoImage,this.pixiApp);
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND] = new ToolSelectionMagicWand(this)
        this.buildContainer();
        this.pixiApp.start()
        return this.pixiApp.view
    };

    buildContainer(){
        this.container=new PIXI.Container();
        this.photoAndLayersContainer=new PIXI.Container();
        this.layersContainer=new PIXI.Container();
        this.container.addChild(this.photoAndLayersContainer);
        this.photoAndLayersContainer.addChild(this.photoSprite);
        this.photoAndLayersContainer.addChild(this.layersContainer);
        this.photoAndLayersContainer.addChild(this.selectionCtrl.uiSprite);
        this.container.addChild(this.uiSprite);
        this.pixiApp.stage.addChild(this.container);
        this.container.interactive=true;

        this.pixiApp.view.onwheel = this.onScrollE

        this.pixiApp.view.addEventListener("mousedown",this.mouseDown)
        this.pixiApp.view.addEventListener("touchstart",this.touchStart)


        this.pixiApp.view.addEventListener("mouseup",this.mouseUp)
        this.pixiApp.view.addEventListener("touchend",this.touchEnd)
        this.pixiApp.view.addEventListener("touchcancel",this.touchCancel)



        this.pixiApp.view.addEventListener("mousemove",this.mouseMove)
        this.pixiApp.view.addEventListener("touchmove",this.touchMove)




        this.photoAndLayersContainer.scale.set(this.initSizes.scale,this.initSizes.scale);
        this.photoAndLayersContainer.position.set(this.initSizes.x,this.initSizes.y);
        //this.photoAndLayersContainer.addChild(this.selectionCtrl.selectionSprite);
    };

    getToolsValues(){
        if(!this.toolsValues){
            this.toolsValues=[];
            this.toolsValues[BoardController.TOOL_BRUSH]={};
            //this.toolsValues["EREASE"]={};
            this.toolsValues[BoardController.TOOL_MAGIC_WAND]={};
        }
        this.toolsValues[BoardController.TOOL_BRUSH].size=BoardController.TOOLS[BoardController.TOOL_BRUSH].size;
        this.toolsValues[BoardController.TOOL_BRUSH].hardness=100*BoardController.TOOLS[BoardController.TOOL_BRUSH].hardness;
        this.toolsValues[BoardController.TOOL_BRUSH].type =  BoardController.TOOLS[BoardController.TOOL_BRUSH].add ? 1 : 0
        //this.toolsValues["EREASE"].size=BoardController.TOOLS["EREASE"].size;
        //this.toolsValues["EREASE"].hardness=100*BoardController.TOOLS["EREASE"].hardness;
        this.toolsValues[BoardController.TOOL_MAGIC_WAND].tolerance = BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].getTolerance()
        this.toolsValues[BoardController.TOOL_MAGIC_WAND].type = BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].add ? 1 : 0
        return this.toolsValues;
    }

    setBrushSize(val){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setSize(val);
    };
    setBrushHardness(val){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setHardness(val*.01);
    };
    setBrushToAdd(){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setToAdd()
    }
    setBrushToRemove(){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setToRemove()
    }

    setMagicWandTolerance(val){
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].setTolerance(val)
    }
    fillMagicWand() {
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].fillFromPickedColor()
    }

    setMagicWandToAdd(){
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].setToAdd()
    }
    setMagicWandToRemove(){
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].setToRemove()
    }

    applyMagicWandToSelectedLayer(){
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].apply()
    }

    onScrollE = (e,v)=>{
        const x=e.offsetX;
        const y=e.offsetY;
        const deltaY=e.deltaY;
        if(deltaY<0){
            this.zoomIn(deltaY*-1,x,y);
        }else{
            this.zoomOut(deltaY,x,y);
        }
    }

    touchStart = (event)=>{
        const touches = event.targetTouches
        if(touches.length === 1){
            const position = getPositionFromTouch(touches[0])
            this.timerForPinchToZoomGesture = setTimeout(()=>{
                this.mouseDown({
                    offsetX:position.x,
                    offsetY: position.y
                })
            },100)
            return

        }
        /*PREVENT PAINT WHEN PINCH TO ZOOM*/
        if(this.timerForPinchToZoomGesture){
            clearTimeout(this.timerForPinchToZoomGesture)
        }

        if(touches.length === 2){
            this.lastPinchGestureData = makeNewPinchGestureData(touches[0],touches[1])
        }
    }

    touchMove = (event)=>{
        const touches = event.targetTouches
        if(touches.length === 1){
            const position = getPositionFromTouch(touches[0])
            this.mouseMove({
                offsetX:position.x,
                offsetY: position.y
            })
            return
        }
        /*PINCH TO ZOOM LOGIC*/
        if(touches.length === 2 && this.lastPinchGestureData){
            const pinchGestureData = makeNewPinchGestureData(touches[0],touches[1])
            const movX = pinchGestureData.middlePoint.x - this.lastPinchGestureData.middlePoint.x
            const movY = pinchGestureData.middlePoint.y - this.lastPinchGestureData.middlePoint.y
            let scale = pinchGestureData.distance / this.lastPinchGestureData.distance
            const pivot = this.photoAndLayersContainer.toLocal(this.lastPinchGestureData.middlePoint)
            this.photoAndLayersContainer.pivot.set(pivot.x,pivot.y)
            this.photoAndLayersContainer.position.set(this.lastPinchGestureData.middlePoint.x,this.lastPinchGestureData.middlePoint.y)

            scale = this.photoAndLayersContainer.scale.x * scale
            this.photoAndLayersContainer.scale.set(scale,scale)
            const {x,y} = this.photoAndLayersContainer
            this.photoAndLayersContainer.position.set(x+movX,y+movY)
            this.lastPinchGestureData = pinchGestureData
            this.updateToolUI();
        }
    }

    touchEnd = (event) => {
        this.lastPinchGestureData = null
        this.mouseUp({
            offsetX:null,
            offsetY: null
        })
    }

    touchCancel = (event) => {
        console.log("touchCancel",event)
    }

    mouseDown = (event) => {
        const pos={x:event.offsetX,y:event.offsetY};
        this.lastMousePointClicked = pos
        console.log("mouseDown",pos)
        //var pos=event.data.global;
        if(this.currentTool){
            this.currentTool.mouseDown(pos);
        }
    }

    mouseUp = (event) => {
        const pos={x:event.offsetX,y:event.offsetY};
        if(this.currentTool){
            this.currentTool.mouseUp(pos);
            console.log("MOUSEUP _____------_____")
        }
        this.lastMousePointClicked = null
    }
    mouseMove = (event) => {
        const pos={x:event.offsetX,y:event.offsetY};
        if(this.currentTool){
            this.currentTool.mouseMove(pos);
        }else if(this.lastMousePointClicked){
            const movX = pos.x - this.lastMousePointClicked.x
            const movY = pos.y - this.lastMousePointClicked.y
            const {x,y} = this.photoAndLayersContainer
            this.photoAndLayersContainer.position.set(x+movX,y+movY)
            this.lastMousePointClicked = pos
        }
        if(this.glass && this.glass.visible){
            this.glass.update(pos);
            this.glass.position.x=pos.x;
            this.glass.position.y=pos.y;

        }
    }

    zoomIn(delta,x,y){
        let scale=delta*.01;
        scale=this.photoAndLayersContainer.scale.x+scale;
        var pivot=this.photoAndLayersContainer.toLocal(new PIXI.Point(x, y));
        var position=this.photoAndLayersContainer.toGlobal(pivot);
        this.photoAndLayersContainer.pivot.set(pivot.x,pivot.y);
        this.photoAndLayersContainer.position.set(position.x,position.y);
        this.photoAndLayersContainer.scale.set(scale,scale);
        this.updateToolUI();
    }

    zoomOut(delta,x,y){
        let scale=delta*.01;
        scale=this.photoAndLayersContainer.scale.x-scale;
        if(scale<=this.initSizes.scale){
            this.photoAndLayersContainer.scale.set(this.initSizes.scale,this.initSizes.scale);
            this.photoAndLayersContainer.pivot.set(0,0);
            this.photoAndLayersContainer.position.set(this.initSizes.x,this.initSizes.y);
            this.updateToolUI();
            return
        }
        var pivot=this.photoAndLayersContainer.toLocal(new PIXI.Point(x, y));
        var position=this.photoAndLayersContainer.toGlobal(pivot);
        this.photoAndLayersContainer.pivot.set(pivot.x,pivot.y);
        this.photoAndLayersContainer.position.set(position.x,position.y);
        this.photoAndLayersContainer.scale.set(scale,scale);
        this.updateToolUI();
    }

    setTool(tool){
        if(this.currentTool){this.currentTool.setActive(null);}
        this.currentTool=tool == null ? null : BoardController.TOOLS[tool];
        if(this.currentLayer && this.currentTool){
            this.currentTool.setActive(this.currentLayer,this.photoAndLayersContainer.scale.x);
        }
    }

    updateToolUI(){
        if(this.currentTool && this.currentTool.onPhotoScaleChange){
            this.currentTool.onPhotoScaleChange(this.photoAndLayersContainer.scale.x);
        }
    }

    addLayer(){
        var layerID=this.layerCount;
        var layerName="layer "+this.layerCount;
        var layer=new Layer(this.photoWidth,this.photoHeight,layerName,layerID,this.blackLayerTexture,this.whiteLayerTexture);
        this.layers.push(layer);
        this.layersContainer.addChild(layer);
        this.layerCount+=1;
        this.selectLayer(layer.layerID);
        return layer.info
    }

    findLayer(id){
        var total=this.layers.length;
        for(var i=0;i<total;i++){
            if(this.layers[i].layerID==id){
                return this.layers[i];
            }
        }
        return null;
    }

    selectLayer(id){
        var layer=this.findLayer(id);
        this.currentLayer=layer;

        if(this.currentTool){
            this.currentTool.setActive(layer,this.photoAndLayersContainer.scale.x);
        }
        return layer.info;
    }


    setBlackLevelToSelectedLayer(val){
        if(!this.currentLayer){return;}
        //console.log("setDarkToSelectedLayer: "+val*.001);
        this.currentLayer.blackLevel = val*.01
        //this.currentLayer.setDarkLevel(val*.01);
        if(this.currentTool){this.currentTool.onSelectedLayerPropsChange()}
        return this.currentLayer.info
    }

    setWhiteLevelToSelectedLayer = (val)=>{
        if(!this.currentLayer){return;}
        //console.log("setLightToSelectedLayer: "+val*.001);
        this.currentLayer.whiteLevel = val*.01
        //this.currentLayer.setWhiteLevel(val*.01);
        if(this.currentTool){this.currentTool.onSelectedLayerPropsChange()}
        return this.currentLayer.info
    }

    showGlass(){
        if(!this.glass){
            this.glass=new MagnifyingGlass(200,200,this.pixiApp.renderer,this.container,2);
            this.glass.setPivot(MagnifyingGlass.TOP_RIGHT);
            this.pixiApp.stage.addChild(this.glass);
        }
        this.glass.visible=true;
    }

    hideGlass(){
        if(!this.glass){
            this.glass=new MagnifyingGlass(200,200,this.pixiApp.renderer,this.container);
            this.pixiApp.stage.addChild(this.glass);
        }
        this.glass.visible=false;
    }

    switchGlass(){
        const isVisible = this.glass == null ? false : this.glass.visible
        if(isVisible){
            this.hideGlass()
        }else{
            this.showGlass()
        }

    }

    setColorToSelectedLayer(colorNumber){
        this.currentLayer.color = colorNumber;
        if(this.currentTool){this.currentTool.onSelectedLayerPropsChange()}
        return this.currentLayer.info
    }

    setHueToSelectedLayer(hue){
        const {s,v} = this.currentLayer.currentHSVColor
        return this.setColorToSelectedLayer(UTILS.HSVtoRGBnumber(hue / 360,s / 100,v / 100))
    }

    setSaturationToSelectedLayer(sat){
        const {h,v} = this.currentLayer.currentHSVColor
        return this.setColorToSelectedLayer(UTILS.HSVtoRGBnumber(h / 360,sat / 100, v / 100))
    }

    setBrightnessToSelectedLayer(brightness){
        const {h,s} = this.currentLayer.currentHSVColor
        return this.setColorToSelectedLayer(UTILS.HSVtoRGBnumber(h / 360,s / 100,brightness / 100))
    }

    clearSelection(){
        this.selectionCtrl.clearSelection();
    }

}

const makeNewPinchGestureData = (touchA,touchB)=>{
    const pointA = getPositionFromTouch(touchA)
    const pointB = getPositionFromTouch(touchB)
    const middlePoint = UTILS.middlePoint(pointA,pointB)
    const distance = UTILS.distance2d(pointA,pointB)
    return {middlePoint,distance}
}

const getPositionFromTouch = (touch)=>{
    const rect = touch.target.getBoundingClientRect()
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    }

}
//module.exports = BoardController;
export default BoardController

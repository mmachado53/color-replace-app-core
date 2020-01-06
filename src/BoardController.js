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

/** Class representing a controller for board. "new BoardController()" */
class BoardController {

    /**
     * The BoardController.TOOL_BRUSH is a identifier for a brush tool
     * @static
     */
    static TOOL_BRUSH = "TOOL_BRUSH"
    /**
     * The BoardController.TOOL_MAGIC_WAND is a identifier for a magic wand tool
     * @static
     */
    static TOOL_MAGIC_WAND = "TOOL_MAGIC_WAND"
    /**
     * The BoardController.TOOL_POLYGON is a identifier for a polygon tool
     * @static
     */
    static TOOL_POLYGON = "TOOL_POLYGON"
    /**
     * The BoardController.TOOLS is array with all tools
     * @static
     */
    static TOOLS = []

    /**
     * Create BoardController instance
     * @constructs BoardController
     * @function
     */
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

        this.magicWandCallBack = null

        this.timerForPinchToZoomGesture = null
        this.lastPinchGestureData = null
        this.lastMousePointClicked = null

    }



    /**
     * load the base image and start all the context of the boardController.
     *
     * @async
     * @function loadImage
     * @param {(Window | HTMLElement)} containerHTMLElement - the container element for the board canvas
     * @param {string} url - The URL to download the base image.
     * @param {Int} maxSize - OPTIONAL maximum size for the base image
     * @return {Promise<Canvas>} the html canvas instance of the board.
     * @example
     * boardControllerInstance.loadImage(htmlElement,imageURL,900).then((canvas)=>{
     *    htmlElement.appendChild(canvas)
     * })
     */
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

    /**
     * return tools values
     *
     * @function getToolsValues
     * @return {Array} Associative Array
     * @example
     * // return [
     * //             BoardController.TOOL_BRUSH : {size:0,hardness:0,type:1 ( 1 = paint,0 = erease )},
     * //             BoardController.TOOL_MAGIC_WAND : {tolerance:0,type:1 ( 1 = paint,0 = erease )},
     * //             ]
     * boardControllerInstance.loadImage(htmlElement,imageURL,900).then((canvas)=>{
     *   htmlElement.appendChild(canvas)
     * })
     */
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

    /**
     * Set the size of the brush tool
     *
     * @function setBrushSize
     * @param {Int} val - the new size of the brush
     * @example
     * boardControllerInstance.setBrushSize(20) // the brush size now is 20px
     */
    setBrushSize(val){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setSize(val);
    };
    /**
     * Set the hardness of the brush tool
     *
     * @function setBrushHardness
     * @param {Int} val - the new hardness value of the brush (0-100)
     * @example
     * boardControllerInstance.setBrushHardness(20) // the brush size now is 20
     */
    setBrushHardness(val){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setHardness(val*.01);
    };

    /**
     * Configure the brush tool to paint on the selected layer
     *
     * @function setBrushToAdd
     */
    setBrushToAdd(){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setToAdd()
    }
    /**
     * Configure the brush tool to erease on the selected layer
     *
     * @function setBrushToRemove
     */
    setBrushToRemove(){
        BoardController.TOOLS[BoardController.TOOL_BRUSH].setToRemove()
    }

    /**
     * Configure the magic wand tool with new tolerance
     *
     * @function setMagicWandTolerance
     * @param {Int} val - the new tolerance value  (1-200)
     */
    setMagicWandTolerance(val){
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].setTolerance(val)
    }

    /**
     * Allows you to see the result of the magic wand tool without even applying the changes
     *
     * @function fillMagicWand
     */
    fillMagicWand() {
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].fillFromPickedColor()
    }

    /**
     * Configure the magic wand tool to paint on the selected layer
     *
     * @function setMagicWandToAdd
     */
    setMagicWandToAdd(){
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].setToAdd()
    }

    /**
     * Configure the magic wand tool to erease on the selected layer
     *
     * @function setMagicWandToRemove
     */
    setMagicWandToRemove(){
        BoardController.TOOLS[BoardController.TOOL_MAGIC_WAND].setToRemove()
    }

    /**
     * Apply the results of the magic wand tool in the selected layer
     *
     * @function applyMagicWandToSelectedLayer
     */
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
        let minScale = this.initSizes.scale * 0.3
        if( scale <= minScale ){
            this.photoAndLayersContainer.scale.set(minScale, minScale);
            //this.photoAndLayersContainer.pivot.set(0,0);
            //this.photoAndLayersContainer.position.set(this.initSizes.x,this.initSizes.y);
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

    /**
     * Set the active tool
     *
     * @function setTool
     * @param {String} tool - can be BoardController.TOOL_BRUSH, BoardController.TOOL_MAGIC_WAND or BoardController.TOOL_POLYGON
     */
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

    /**
     * Add a new layer and select it
     *
     * @function addLayer
     * @return {Object} object with info of the created layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
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

    /**
     * Select a layer based on the id
     *
     * @function selectLayer
     * @param id {Int} - Id
     * @return {Object} object with info of the selected layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
    selectLayer(id){
        var layer=this.findLayer(id);
        this.currentLayer=layer;

        if(this.currentTool){
            this.currentTool.setActive(layer,this.photoAndLayersContainer.scale.x);
        }
        return layer.info;
    }

    /**
     * Set a black level in the selected layer
     *
     * @function setBlackLevelToSelectedLayer
     * @param val {Int} - new value 0-100
     * @return {Object} object with info of the selected layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
    setBlackLevelToSelectedLayer(val){
        if(!this.currentLayer){return;}
        //console.log("setDarkToSelectedLayer: "+val*.001);
        this.currentLayer.blackLevel = val*.01
        //this.currentLayer.setDarkLevel(val*.01);
        if(this.currentTool){this.currentTool.onSelectedLayerPropsChange()}
        return this.currentLayer.info
    }

    /**
     * Set a white level in the selected layer
     *
     * @function setWhiteLevelToSelectedLayer
     * @param val {Int} - new value 0-100
     * @return {Object} object with info of the selected layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
    setWhiteLevelToSelectedLayer = (val)=>{
        if(!this.currentLayer){return;}
        //console.log("setLightToSelectedLayer: "+val*.001);
        this.currentLayer.whiteLevel = val*.01
        //this.currentLayer.setWhiteLevel(val*.01);
        if(this.currentTool){this.currentTool.onSelectedLayerPropsChange()}
        return this.currentLayer.info
    }

    /**
     * Show a magnifying glass
     *
     * @function showGlass
     */
    showGlass(){
        if(!this.glass){
            this.glass=new MagnifyingGlass(200,200,this.pixiApp.renderer,this.container,2);
            this.glass.setPivot(MagnifyingGlass.TOP_RIGHT);
            this.pixiApp.stage.addChild(this.glass);
        }
        this.glass.visible=true;
    }

    /**
     * Hide magnifying glass
     *
     * @function hideGlass
     */
    hideGlass(){
        if(!this.glass){
            this.glass=new MagnifyingGlass(200,200,this.pixiApp.renderer,this.container);
            this.pixiApp.stage.addChild(this.glass);
        }
        this.glass.visible=false;
    }

    /**
     * Show/Hide magnifying glass
     *
     * @function switchGlass
     */
    switchGlass(){
        const isVisible = this.glass == null ? false : this.glass.visible
        if(isVisible){
            this.hideGlass()
        }else{
            this.showGlass()
        }

    }

    /**
     * Set a color in the selected layer
     *
     * @function setColorToSelectedLayer
     * @param colorNumber {Int} - A color number like this 0xff0000
     * @return {Object} object with info of the selected layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
    setColorToSelectedLayer(colorNumber){
        this.currentLayer.color = colorNumber;
        if(this.currentTool){this.currentTool.onSelectedLayerPropsChange()}
        return this.currentLayer.info
    }

    /**
     * Set a Hue in the selected layer
     *
     * @function setHueToSelectedLayer
     * @param hue {Int} - hue value (0-359)
     * @return {Object} object with info of the selected layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
    setHueToSelectedLayer(hue){
        const {s,v} = this.currentLayer.currentHSVColor
        return this.setColorToSelectedLayer(UTILS.HSVtoRGBnumber(hue / 360,s / 100,v / 100))
    }

    /**
     * Set a Saturation in the selected layer
     *
     * @function setSaturationToSelectedLayer
     * @param sat {Number} - saturation value (0.0-1.0)
     * @return {Object} object with info of the selected layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
    setSaturationToSelectedLayer(sat){
        const {h,v} = this.currentLayer.currentHSVColor
        return this.setColorToSelectedLayer(UTILS.HSVtoRGBnumber(h / 360,sat / 100, v / 100))
    }

    /**
     * Set a Brightness in the selected layer
     *
     * @function setBrightnessToSelectedLayer
     * @param brightness {Number} - brightness value (0.0-1.0)
     * @return {Object} object with info of the selected layer {id,name,color,hexColor,rgbColor,hsvColor,whiteLevel,blackLevel}
     */
    setBrightnessToSelectedLayer(brightness){
        const {h,s} = this.currentLayer.currentHSVColor
        return this.setColorToSelectedLayer(UTILS.HSVtoRGBnumber(h / 360,s / 100,brightness / 100))
    }

    /**
     * Clear selection "for polygon tool"
     *
     * @function clearSelection
     */
    clearSelection(){
        this.selectionCtrl.clearSelection();
    }

    /**
     * Build and return a result canvas
     *
     * @function getCanvasResult
     * @return {Canvas}
     */
    getCanvasResult(){
        let renderer = PIXI.RenderTexture.create(this.baseCanvas.width,this.baseCanvas.height)
        this.photoAndLayersContainer.children.forEach((children,index)=>{
            this.pixiApp.renderer.render(children,renderer,false)
        })
        return this.pixiApp.renderer.extract.canvas(renderer)
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

export default BoardController

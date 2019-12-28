import * as PIXI from 'pixi.js'
const  SelectionPixelsCtrl = function(width,height,pixiApp){



    const drawRect = (g,width,height,color)=>{
        g.beginFill(color,1);
        g.drawRect(0,0,width,height);
        g.endFill();
    }

    this.setSelection=(displayObject,x,y)=>{
        this.isSelction=true;
        x= x || 0;
        y= y || 0;
        drawRect(this.clearGraphics,this.width,this.height,SelectionPixelsCtrl.REMOVE_COLOR);
        pixiApp.renderer.render(this.clearGraphics, this.selectionTexture,true,null)
        //this.selectionTexture.render(this.clearGraphics,null,true);
        if(x!=0 || y!=0){
            var matrix=new PIXI.Matrix();
            matrix.translate(x,y);
            pixiApp.renderer.render(displayObject,this.selectionTexture,true,matrix)
            //this.selectionTexture.render(displayObject,matrix);
            drawMaskInCanvas(this.selectionTexture,this.imgDataUI,this.ctxUI);
            this.uiTexture.update();
            return;
        }
        pixiApp.renderer.render(displayObject,this.selectionTexture)
        //this.selectionTexture.render(displayObject);
        drawMaskInCanvas(this.selectionTexture,this.imgDataUI,this.ctxUI);
        this.uiTexture.update();

    }

    const drawMaskInCanvas = (texture,pixelData,canvasCtx)=>{
        var texturePixels=pixiApp.renderer.extract.pixels(texture)
        var total=texturePixels.length;
        for(var i=0;i<total;i++){
            pixelData.data[i]=255;
            pixelData.data[i+1]=0;
            pixelData.data[i+2]=0;
            pixelData.data[i+3]=Math.floor((255-texturePixels[i])*.3);
            i+=3;
        }
        canvasCtx.putImageData(pixelData,0,0);

    }

    this.clearSelection=()=> {
        this.isSelction=false;
        drawRect(this.clearGraphics,this.width,this.height,SelectionPixelsCtrl.ADD_COLOR);

        pixiApp.renderer.render(this.clearGraphics,this.selectionTexture,true)
        //this.selectionTexture.render(this.clearGraphics,null,true);
        this.ctxUI.clearRect(0,0,this.canvasUI.width,this.canvasUI.height);
        this.uiTexture.update();
    };

    this.draw = (displayObject,x,y,layer)=>{
        var matrix=new PIXI.Matrix();
        matrix.translate(x,y);
        const renderer = this.pixiApp.renderer;
        if(!this.isSelction){
            renderer.render(displayObject,layer.renderTexture,false,matrix)
            return;
        }

        renderer.render(displayObject,this.canvasTexture,false,matrix)
        //this.canvasTexture.render(displayObject,matrix);
        renderer.render(this.container,layer.renderTexture,false)
        //layer.renderTexture.render(this.container);
        renderer.render(this.blankObj,this.canvasTexture,true)
        //this.canvasTexture.render(this.blankObj,null,true);

    };


    this.width=width;
    this.height=height;
    this.pixiApp=pixiApp;
    //this.renderer = PIXI.autoDetectRenderer()
    this.isSelction = false;
    this.clearGraphics = new PIXI.Graphics();

    this.selectionTexture = PIXI.RenderTexture.create(this.width,this.height)
    this.selectionSprite=new PIXI.Sprite(this.selectionTexture);


    this.canvasTexture = PIXI.RenderTexture.create(this.width,this.height)
    this.canvasSprite= new PIXI.Sprite(this.canvasTexture);
    this.container=new PIXI.Container();
    this.canvasSprite.mask=this.selectionSprite;
    this.container.addChild(this.canvasSprite);
    this.container.addChild(this.selectionSprite);
    this.blankObj=new PIXI.Container();


    this.canvasUI=document.createElement("canvas");
    this.ctxUI=this.canvasUI.getContext("2d");
    this.canvasUI.width=width;
    this.canvasUI.height=height;

    // this.uiBaseTexture = PIXI.BaseTexture.from(this.canvasUI)
    this.uiTexture = PIXI.Texture.from(this.canvasUI)
    this.uiSprite = new PIXI.Sprite(this.uiTexture);
    this.imgDataUI=this.ctxUI.getImageData(0,0,width,height);
    this.clearSelection();

    return this
}

SelectionPixelsCtrl.ADD_COLOR=0xFF0000;
SelectionPixelsCtrl.REMOVE_COLOR=0x000000;

export default SelectionPixelsCtrl
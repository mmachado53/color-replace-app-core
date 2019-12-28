import * as PIXI from 'pixi.js'
const MagnifyingGlass = function (width,height,renderer,displayObject,zoom) {
    this.zoom= zoom || 2;
    this.displayObject=displayObject;
    this.renderer=renderer;
    this.__width=width;
    this.__height=height;
    this.renderTexture = PIXI.RenderTexture.create(width,height)
    this.cropRenderTexture = PIXI.RenderTexture.create(width,height)
    this.cropSprite=new PIXI.Sprite(this.cropRenderTexture);

    PIXI.Sprite.call( this, this.renderTexture);
    this.graphics=new PIXI.Graphics();
    this.graphics.beginFill(0x666666,1);
    this.graphics.drawRect(0,0,width,height);
    this.graphics.endFill();
    this.point=null;

    const borderGraphics = new PIXI.Graphics();




    this.update=(p)=>{
        renderer.render(this.graphics,this.renderTexture,true)
        var p=p || {x:this.x+(this.__width/2),y:this.y+(this.__height/2)}
        var matrix=new PIXI.Matrix();
        var position=getCropPositionData(p,this.__width,this.__height,this.zoom);
        matrix.translate(position.x,position.y);
        renderer.render(this.displayObject,this.cropRenderTexture,true,matrix)

        /* const cropedPixels = renderer.extract.pixels(this.cropRenderTexture)
         let midelPointX = Math.round(this.__width/2)
         let midelPointY = Math.round(this.__height/2)
         const index = (midelPointY * this.__width + midelPointX) * 4;
         const red = cropedPixels[index].toString(16)
         const green = cropedPixels[index+1].toString(16)
         const blue = cropedPixels[index+2].toString(16)
         const hexColor = (red.length == 1 ? `0${red}` : red) + (green.length == 1 ? `0${green}` : green) + (blue.length == 1 ? `0${blue}` : blue)
         redrawBorder(parseInt(hexColor,16))*/

        matrix=new PIXI.Matrix();
        matrix.scale(this.zoom,this.zoom);
        renderer.render(this.cropSprite,this.renderTexture,false,matrix)

        //renderer.render(borderGraphics,this.renderTexture,false)
    }

    const redrawBorder = (color)=>{
        color = color || 0xFF0000
        borderGraphics.clear()
        borderGraphics.lineStyle(20,0x666666,1)
        borderGraphics.drawRect(0,0,this.__width,this.__height)
        borderGraphics.endFill()

        borderGraphics.lineStyle(0)
        borderGraphics.beginFill(color,1)
        borderGraphics.drawRect((this.__width/2)-5,(this.__height/2)-5,10,10)
        borderGraphics.endFill()
    }

    const getCropPositionData = (point,width,height,zoom)=>{
        var result={};
        width=width/(zoom);
        height=height/(zoom);
        result.x=point.x-(width/2);
        result.y=point.y-(height/2);
        result.x=result.x*-1;
        result.y=result.y*-1;
        return result;

    }

    this.setPivot = (position)=>{
        switch(position){
            case MagnifyingGlass.TOP:
                this.pivot.set(this.__width/2,this.__height);
                break;
            case MagnifyingGlass.TOP_RIGHT:
                this.pivot.set(0,this.__height);
                break;
            case MagnifyingGlass.RIGHT:
                this.pivot.set(0,this.__height/2);
                break;
            case MagnifyingGlass.BOTTOM_RIGHT:
                this.pivot.set(0,0);
                break;
            case MagnifyingGlass.BOTTOM:
                this.pivot.set(this.__width/2,0);
                break;
            case MagnifyingGlass.BOTTOM_LEFT:
                this.pivot.set(this.__width,0);
                break;
            case MagnifyingGlass.LEFT:
                this.pivot.set(this.__width,this.__height/2);
                break;
            case MagnifyingGlass.TOP_LEFT:
                this.pivot.set(this.__width,this.__height);
                break;
            default:
                this.pivot.set(this.__width/2,this.__height/2);
                break;

        }
    };

    this.setPoint=(p) => {
        //this.point=point;
    };

    return this
}

MagnifyingGlass.prototype = Object.create( PIXI.Sprite.prototype );

MagnifyingGlass.TOP=1;
MagnifyingGlass.TOP_RIGHT=2;
MagnifyingGlass.RIGHT=3;
MagnifyingGlass.BOTTOM_RIGHT=4;
MagnifyingGlass.BOTTOM=5;
MagnifyingGlass.BOTTOM_LEFT=6;
MagnifyingGlass.LEFT=7;
MagnifyingGlass.TOP_LEFT=8;

export default MagnifyingGlass
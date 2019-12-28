import {func} from "prop-types";
import RGBUtils from "wayak-rgb-utils"

var UTILS={};
UTILS.distance3d=function(vector3_1,vector3_2){
    //console.log("/////distance3d//",vector3_1,vector3_2);
    var dx = vector3_1.x - vector3_2.x;
    var dy = vector3_1.y - vector3_2.y;
    var dz = vector3_1.z - vector3_2.z;
    var result = Math.sqrt(dx*dx+dy*dy+dz*dz);
    //console.log("distance3d //",result);
    return result;
};

UTILS.rgb2hsv = function(r,g,b) {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    var rr, gg, bb,

        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c){
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff === 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        }else if (g === v) {
            h = (1 / 3) + rr - bb;
        }else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}

/*
	RGBToHCL:
		r: 0-255
		g: 0-255
		b: 0-255
*/

/**/

/**/
UTILS.RGBToHCL = function(r,g,b) {

    r = r || 255
    g = g || 255
    b = b || 255

    var Y0 = 100;
    var gamma = 3;
    /*r = r / 255;
    g = g / 255;
    b = b / 255;*/

    var result = {
        H:0,
        C:0,
        L:0
    };


    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);

    if (max == 0) {
        return result;
    }

    var alpha = (min / max) / Y0;
    var Q = Math.exp(alpha * gamma);
    var rg = r - g;
    var gb = g - b;
    var br = b - r;
    var L = ((Q * max) + ((1 - Q) * min)) / 2;
    var C = Q * (Math.abs(rg) + Math.abs(gb) + Math.abs(br)) / 3;
    var H = UTILS.toDegrees(Math.atan2(gb, rg));

    if (rg <  0) {
        if (gb >= 0){
            H = 90 + H
        }else {
            H = H - 90
        }
    }


    result.H = H;
    result.C = C;
    result.L = L;
    return result;
}

UTILS.HSVtoRGB = function(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        var [h,s,v] = h
        //s = h.s v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/*Max distance: 360 */
UTILS.cycldistance = function(hcl1,hcl2) {
    var dl = hcl1.L - hcl2.L;
    var dh = Math.abs(hcl1.H - hcl2.H);
    var c1 = hcl1.C;
    var c2 = hcl2.C;
    return Math.sqrt(dl*dl + c1*c1 + c2*c2 - 2*c1*c2*Math.cos(UTILS.toRadians(dh)));
}

UTILS.distance_hcl = function(hcl1,hcl2) {
    var Al = 1.4456;
    var c1 = hcl1.C;
    var c2 = hcl2.C;
    var Dh = Math.abs(hcl1.H - hcl2.H);
    if (Dh > 180){
        Dh = 360 - Dh
    }
    var AlDl = Al * Math.abs(hcl1.L - hcl2.L);
    return Math.sqrt(AlDl * AlDl + (c1 * c1 + c2 * c2 - 2 * c1 * c2 * Math.cos(UTILS.toRadians(Dh))));
}

UTILS.HSVtoRGBnumber=function(h, s, v){
    var rgbObj=UTILS.HSVtoRGB(h, s, v);
    var rString=rgbObj.r.toString(16);
    var gString=rgbObj.g.toString(16);
    var bString=rgbObj.b.toString(16);
    rString="0".repeat(2-rString.length)+rString;
    gString="0".repeat(2-gString.length)+gString;
    bString="0".repeat(2-bString.length)+bString;
    return parseInt("0x"+rString+gString+bString,16);
}


UTILS.RGBtoXYZ=function(color){
    var result={};
    var r=color.r/255;
    var g=color.g/255;
    var b=color.b/255;
    if(r>0.04045){
        r = (r+0.055)/1.055;
        r = Math.pow(r,2.4);
    }else{
        r = r/12.92;
    }
    if(g>0.04045){
        g = (g+0.055)/1.055;
        g = Math.pow(g,2.4);
    }
    else{
        g = g/12.92;
    }
    if(b>0.04045){
        b = (b+0.055)/1.055;
        b = Math.pow(b,2.4);
    }
    else{
        b = b/12.92;
    }

    r *= 100;
    r *= 100;
    r *= 100;

    //Matrix
    result.x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    result.y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    result.z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    return result;
}
UTILS.hexToRGB=function(hexString){
    hexString=hexString.replace("#","");
    if(hexString.length < 6) {
        hexString = hexString.concat("0".repeat(6 - hexString.length))
    }
    var result={r:0,g:0,b:0};
    if(hexString.length!=6){
        return result;
    }
    result.r=parseInt("0x"+hexString.slice(0,2));
    result.g=parseInt("0x"+hexString.slice(2,4));
    result.b=parseInt("0x"+hexString.slice(4,6));
    return result;
};
UTILS.rgbToHex=function(r,g,b){
    r=Number(r).toString(16);
    r=r.length==1 ? "0"+r : r;
    g=Number(g).toString(16);
    g=g.length==1 ? "0"+g : g;
    b=Number(b).toString(16);
    b=b.length==1 ? "0"+b : b;


    return "#"+r+g+b;
}
UTILS.rgbToNumber=function(r,g,b){
    r=Number(r).toString(16);
    r=r.length==1 ? "0"+r : r;
    g=Number(g).toString(16);
    g=g.length==1 ? "0"+g : g;
    b=Number(b).toString(16);
    b=b.length==1 ? "0"+b : b;
    return parseInt("0x"+r+g+b);
}

UTILS.getCenterData=function(imageWidth,imageHeight,canvasWidth,canvasHeight){
    var scaleX=canvasWidth/imageWidth;
    var scaleY=canvasHeight/imageHeight;
    var scale=scaleX <= scaleY ? scaleX : scaleY;
    imageWidth=imageWidth*scale;
    imageHeight=imageHeight*scale;
    var x=(canvasWidth-imageWidth)/2;
    var y=(canvasHeight-imageHeight)/2;
    return {x:x,y:y,width:imageWidth,height:imageHeight,scale:scale};
}

UTILS.getBlackAndWitheLayers = function(canvas){
    const blackCanvas=document.createElement("canvas");
    blackCanvas.width=canvas.width;
    blackCanvas.height=canvas.height;
    const blackCtx=blackCanvas.getContext('2d');
    const blackImageData = blackCtx.getImageData(0,0,canvas.width,canvas.height)
    const blackBuffer = new Uint32Array(blackImageData.data.buffer)

    const whiteCanvas=document.createElement("canvas");
    whiteCanvas.width=canvas.width;
    whiteCanvas.height=canvas.height;
    const whiteCtx=whiteCanvas.getContext('2d');
    const whiteImageData = whiteCtx.getImageData(0,0,canvas.width,canvas.height)
    const whiteBuffer = new Uint32Array(whiteImageData.data.buffer)

    const ctx = canvas.getContext('2d');
    const canvasBuffer = new Uint32Array(ctx.getImageData(0,0,canvas.width,canvas.height).data.buffer)
    const totalOfPixels = canvasBuffer.length

    for(let i = 0; i < totalOfPixels; i++){
        const pixelUint32 = canvasBuffer[i]
        const {r,g,b,a} = RGBUtils.numberToRGBA(pixelUint32)
        const hsv = UTILS.rgb2hsv(r,g,b)
        const blackRGBAPixel = {r:0,g:0,b:0,a:(255/100)*(100-hsv.v)}
        whiteBuffer[i] = RGBUtils.RGBAToNumber(255,255,255,(255/100)*hsv.v)
        blackBuffer[i] = RGBUtils.RGBAToNumber(0,0,0,(255/100)*(100-hsv.v))
    }
    blackCtx.putImageData(blackImageData,0,0)
    whiteCtx.putImageData(whiteImageData,0,0)
    return {
        blackLayer:blackCanvas,
        whiteLayer:whiteCanvas
    }


}


/*UTILS.getShadowsAndLights=function(canvas){
    var shadowsCanvas=document.createElement("canvas");
    shadowsCanvas.width=canvas.width;
    shadowsCanvas.height=canvas.height;
    var shadowCtx=shadowsCanvas.getContext('2d');
    var ligthsCanvas=document.createElement("canvas");
    ligthsCanvas.width=canvas.width;
    ligthsCanvas.height=canvas.height;
    var ligthsCtx=ligthsCanvas.getContext('2d');
    var ctx=canvas.getContext('2d');
    var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
    var pixels=imgData.data;
    var totalPixelData=pixels.length;
    var shadowsImageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    var lightsImageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    var shadowsPixels=shadowsImageData.data;
    var lightsPixels=lightsImageData.data;

    for(var i=0;i<totalPixelData;i++){
        //Pregunto si no es transparente
        if(pixels[i+3]>0){
            var hsv=UTILS.rgb2hsv(pixels[i],pixels[i+1],pixels[i+2]);
            shadowsPixels[i] =0;
            shadowsPixels[i+1]=0;
            shadowsPixels[i+2]=0;
            shadowsPixels[i+3]=(255/100)*(100-hsv.v);

            lightsPixels[i] =255;
            lightsPixels[i+1]=255;
            lightsPixels[i+2]=255;
            lightsPixels[i+3]=(255/100)*hsv.v;

        }
        i+=3;
    }
    shadowCtx.putImageData(shadowsImageData,0,0);
    ligthsCtx.putImageData(lightsImageData,0,0);
    console.log(shadowsCanvas.toDataURL());
    console.log(ligthsCanvas.toDataURL());
    return {
        shadows:shadowsCanvas,
        ligths:ligthsCanvas
    }
}*/

UTILS.toDegrees = function(n){
    return n * 180 / Math.PI;
}

UTILS.toRadians = function(n){
    return n * Math.PI / 180
}

UTILS.distance2d = function(point1,point2){
    const {x:x1,y:y1} = point1
    const {x:x2,y:y2} = point2
    return Math.sqrt(Math.pow(x2 - x1,2) + Math.pow(y2 - y1, 2) * 1)
}

UTILS.middlePoint = function(point1,point2){
    const x = (point1.x + point2.x) / 2
    const y = (point1.y + point2.y) / 2
    return {x,y}
}

/*
* USAGE
* UTILS.numberToRGB(0xFF0000) return: {r:255,g:0,b:0}
* */
UTILS.numberToRGB = function (number) {
    const r = number >> 16 & 0xFF
    const g = number >> 8 & 0xFF
    const b = number & 0xFF
    return {r,g,b}
}

UTILS.RGBToNumber = function (r,g,b) {
    return ((r << 16) | (g << 8) | (b))
}




export default UTILS
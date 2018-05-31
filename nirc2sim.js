/* HIRES Echelle Format Simulator */

var echellecanvas = document.getElementById("echelle");
// var echeight = parseInt(window.getComputedStyle(document.getElementById("container"),null).getPropertyValue("height"));
var ecwidth = parseInt(window.getComputedStyle(document.getElementById("container"),null).getPropertyValue("width"));
echeight = ecwidth;
echellecanvas.width = ecwidth.toString();
echellecanvas.height = echeight.toString();
var ctx = echellecanvas.getContext("2d");
var echellerect = echellecanvas.getBoundingClientRect();
// //console.log(echellerect.top, echellerect.right, echellerect.bottom, echellerect.left);
var X_LOWER_LIMIT = 10;          //  Lower limit on coord in X direction
var X_UPPER_LIMIT = Math.round(document.documentElement.clientWidth/2);      //  Upper limit on coord in X direction
var Y_LOWER_LIMIT = Math.round((document.documentElement.clientHeight - document.documentElement.clientWidth/2)/2);          //  Lower limit on coord in Y direction
var Y_UPPER_LIMIT = document.documentElement.clientHeight - Y_LOWER_LIMIT;
X_UPPER_LIMIT+=10;
var XRANGE = X_UPPER_LIMIT - X_LOWER_LIMIT;
var YRANGE = Y_UPPER_LIMIT - Y_LOWER_LIMIT;
//console.log(X_LOWER_LIMIT, X_UPPER_LIMIT, Y_LOWER_LIMIT, Y_UPPER_LIMIT);

var yobj_mm,xobj_mm;
var plottedwavelengths=[];

function updateDistance() {
    ecwidth = parseInt(window.getComputedStyle(document.getElementById("container"),null).getPropertyValue("width"));
    echeight = ecwidth;
    echellecanvas.width = ecwidth.toString();
    echellecanvas.height = ecwidth.toString();
    ctx = echellecanvas.getContext("2d");
    echellerect = echellecanvas.getBoundingClientRect();
    // //console.log(echellerect.top, echellerect.right, echellerect.bottom, echellerect.left);
    X_LOWER_LIMIT = 10;          //  Lower limit on coord in X direction
    X_UPPER_LIMIT = Math.round(document.documentElement.clientWidth/2);      //  Upper limit on coord in X direction
    Y_LOWER_LIMIT = Math.round((document.documentElement.clientHeight - document.documentElement.clientWidth/2)/2);          //  Lower limit on coord in Y direction
    Y_UPPER_LIMIT = document.documentElement.clientHeight - Y_LOWER_LIMIT;
    X_UPPER_LIMIT+=10;
    XRANGE = X_UPPER_LIMIT - X_LOWER_LIMIT;
    YRANGE = Y_UPPER_LIMIT - Y_LOWER_LIMIT;
    //console.log(X_LOWER_LIMIT, X_UPPER_LIMIT, Y_LOWER_LIMIT, Y_UPPER_LIMIT);
}

window.onload = updateDistance;
document.onResize = updateDistance;

var spectrumgraph = document.getElementById("spectrumgraph");
var url;

// camera centers, what pixel is slitmm 0.0

const wide_center = [521.4, 512.0]
const medium_center = [528.4, 512.0]
const narrow_center = [533.0, 512.0]

const slitmm_arcsec = .7245

var ARCSECONDS_PER_PIXEL = 0.040
var center = (521.4, 512.0)
var PIXELS_PER_MM = 34.5016

var xobj = document.getElementById("FindX").value;
var yobj = document.getElementById("FindY").value;

var cam = document.getElementById("switchCamera").value;
var filter = document.getElementById("switchFilter").value;
var grism = document.getElementById("switchGrism").value;

var ARCSECONDS_PER_PIXEL = 0.010;
const MARKER_COLOR = "white";

var color = "red";
var ZOOM=4.5;
var border_color = 'black';

var detectordim = [0,0];
var detectorpos = [0,0];

//console.log(data);
//console.log(filterdata)

function transform_mm_to_screen_pixels(mm) {
    var pixels = [0,0];
    pixels[0] = (FOCAL_PLANE_SCREEN_POSITION[0] + ( ZOOM * mm[0] ) - X_LOWER_LIMIT);
    pixels[1] = (FOCAL_PLANE_SCREEN_POSITION[1] -  (ZOOM * mm[1] ) - Y_LOWER_LIMIT);
    return pixels;
}

function transform_screen_pixels_to_mm( px, py) {
    var mm = [0,0];
    mm[0] = ( px - FOCAL_PLANE_SCREEN_POSITION[0] + X_LOWER_LIMIT ) / ZOOM;
    mm[1] = ( FOCAL_PLANE_SCREEN_POSITION[1] - Y_LOWER_LIMIT - py) / ZOOM;
    return mm;
}

function get_filt_passband(lambda) {
    curdata = data[grism][filter][cam];
    // //console.log(curdata,grism,filter,cam)
    lambda_cen = curdata["slit_slope"] * xobj + curdata["slit_const"]

    var centerx = center[0];

    det_up_limit = lambda_cen + centerx*curdata["disp"];
    det_low_limit = lambda_cen - centerx*curdata["disp"];

    var val = (lambda_cen - lambda) / curdata["disp"] + centerx // detector pixels of lambda wavelength [0,1024]

    // //console.log(lambda, val);

    return [val,det_low_limit,det_up_limit];
}

function mm_to_xdetector_pix(mm){
    return (center[0]+(mm/(slitmm_arcsec*ARCSECONDS_PER_PIXEL)));
}

function xdetector_pix_to_mm(px){
    return slitmm_arcsec*ARCSECONDS_PER_PIXEL *(px-center[0]);
}

function drawX(xpos) {

    var size = 3;
    ctx.beginPath();
    ctx.strokeStyle=MARKER_COLOR;
    ctx.fillStyle=MARKER_COLOR;
    ctx.moveTo(ecwidth-(xpos[0]-size),xpos[1]-size);
    ctx.lineTo(ecwidth-(xpos[0]+size),xpos[1]+size);
    ctx.stroke();
    ctx.moveTo(ecwidth-(xpos[0]-size),xpos[1]+size);
    ctx.lineTo(ecwidth-(xpos[0]+size),xpos[1]-size);
    ctx.stroke();

}

function findLambda(cursor_x, cursor_y) {
    // pretty sure this is right, the math DEFINIELY works out - but the red bar
    // and detector don't line up with these numbers at all
    curdata = data[grism][filter][cam];
    var dpx = mm_to_xdetector_pix(transform_screen_pixels_to_mm(cursor_x,cursor_y)[0]);
    lambda_cen = curdata["slit_slope"] * xobj + curdata["slit_const"]

    lambda = lambda_cen - curdata["disp"] * (center[0] - dpx);

    return lambda;
}

function findLambdaLocation(lambda, set=false, add=false) {

    //console.log(lambda)
    lambda=parseFloat(lambda);

    if(lambda==0) {
        return [0,0];
    }

    if(add != true) {
        add=false;
    }

    curdata = data[grism][filter][cam];
    lambda_cen = curdata["slit_slope"] * xobj + curdata["slit_const"];
    var val = (lambda_cen - lambda) / curdata["disp"] + center[0] // detector pixels of lambda wavelength [0,1024]

    var pix = transform_mm_to_screen_pixels([xdetector_pix_to_mm(val),yobj_mm]);

    // //console.log(lambdax.toString()+" "+lambday.toString())

    if (set) {

        drawX(pix);
        ctx.font="10px Georgia";
        ctx.fillText(lambda+" μm",ecwidth-pix[0],pix[1]-8);

        if (add) {
            plottedwavelengths.push(lambda);
            //console.log(plottedwavelengths);
        }
    }

    return pix;

}

function drawExposure() {

    // INPUTS:
    //	filter, nirc2 filter
    //	cam, nirc2 camera
    // 	xobj, xpixel of slit
    //	yobj, y pixel of object postion along the slit
    //	grism, nirc2 dispersing element
    ecwidth = parseInt(window.getComputedStyle(document.getElementById("container"),null).getPropertyValue("width"));
    echeight=ecwidth;
    //console.log("canvas: square of ",ecwidth)
    cam = document.getElementById("switchCamera").value;
    filter = document.getElementById("switchFilter").value;
    grism = document.getElementById("switchGrism").value;

    if (cam == '' || filter == '' || grism == '') {
        var detector = document.getElementById("draggable");
        detector.style.display = "none";
        return;
    }

    url = ("https://www2.keck.hawaii.edu/inst/nirc2/filters/"+filter.replace(/\d/g, '')+".gif");

    spectrumgraph.src = url;
    // spectrumgraph.height = "500px";
    // spectrumgraph.width = "500px";
    // order"+order[ord].toString()+".gif";
    document.getElementById("popup").src = url;

    //console.log(cam,filter,grism)

    if (cam == "narrow") {
        ARCSECONDS_PER_PIXEL = 0.010 // arcsec / pixel
        center = [533.0, 512.0]
        PIXELS_PER_MM = 137.95912
    }
    else if (cam == "medium") {
        ARCSECONDS_PER_PIXEL = 0.020
        center = [528.4, 512.0]
        PIXELS_PER_MM = 68.8478
    }
    else if (cam == "wide") {
        ARCSECONDS_PER_PIXEL = 0.040
        center = [521.4, 512.0]
        PIXELS_PER_MM = 34.5016
    }

    xobj_mm = xdetector_pix_to_mm(parseFloat(xobj));
    yobj_mm = slitmm_arcsec * ARCSECONDS_PER_PIXEL * (parseFloat(yobj)-center[1]);
    ycenter_mm = 0;

    //console.log("slitmm",xobj_mm,yobj_mm,ycenter_mm);

    var filter_cuton = filterdata[filter]["cuton"];
    var filter_cutoff = filterdata[filter]["cutoff"];

    // note: filter cuton/off can be different from actual, as the whole
    // spectrum might not fit onto the detector
    var filterlambda_on = get_filt_passband(filter_cuton);
    var detector_cuts = [filterlambda_on[1],filterlambda_on[2]];
    var filterlambda_off = get_filt_passband(filter_cutoff);
    var cutoff_mm = xdetector_pix_to_mm(filterlambda_on[0]);		//FILTER cuton in focal plane mm
    var cuton_mm = xdetector_pix_to_mm(filterlambda_off[0]);		//FILTER cutoff in focal plane mm

    // info panel cuts, for the line
    document.getElementById("Cut-On").innerHTML = "Cut-On: "+filter_cuton.toFixed(3).toString()+" μm ";
    document.getElementById("Cut-Off").innerHTML = "Cut-Off: "+filter_cutoff.toFixed(3).toString()+" μm ";
    // detector box cuts
    document.getElementById("cuton").innerHTML = detector_cuts[0].toFixed(3).toString()+" μm ";
    document.getElementById("cutoff").innerHTML = detector_cuts[1].toFixed(3).toString()+" μm ";

    if ( detector_cuts[0] > filter_cuton || detector_cuts[1] < filter_cuton ){
        // spectrum is completely to the left of detector
        document.getElementById("cuton").style.color = "red";
    }
    else {
        document.getElementById("cuton").style.color = "green";
    }
    //console.log(detector_cuts[0], filter_cuton);


    if ( detector_cuts[1] < filter_cutoff || detector_cuts[1] < filter_cuton){
        // spectrum is completely to the left of detector
        document.getElementById("cutoff").style.color = "red";
    }
    else {
        document.getElementById("cutoff").style.color = "green";
    }
    //console.log(detector_cuts[1], filter_cutoff)

    //console.log("cuton/off mm: ",cuton_mm,cutoff_mm);
    // FOCAL_PLANE_SCREEN_POSITION = [ parseInt(XRANGE/2),parseInt(YRANGE/2)];
    FOCAL_PLANE_SCREEN_POSITION = [ X_LOWER_LIMIT+parseInt(XRANGE/2), Y_LOWER_LIMIT + parseInt(YRANGE/2)];
    //console.log(FOCAL_PLANE_SCREEN_POSITION);

    // var cutoff_spx = transform_mm_to_screen_pixels([cutoff_mm+0.5,yobj_mm+0.5]);
    // var cuton_spx = transform_mm_to_screen_pixels([cuton_mm+0.5,yobj_mm+0.5]);
    var cutoff_spx = transform_mm_to_screen_pixels([cutoff_mm,yobj_mm]);
    var cuton_spx = transform_mm_to_screen_pixels([cuton_mm,yobj_mm]);
    cuton_spx[0]=ecwidth-cuton_spx[0];cutoff_spx[0]=ecwidth-cutoff_spx[0];
    //console.log("screen px:",cuton_spx,cutoff_spx);


    //console.log(transform_mm_to_screen_pixels([xdetector_pix_to_mm(detector_cuts[0]),yobj_mm]))

    var obj_spx = transform_mm_to_screen_pixels([xobj_mm,yobj_mm]);

    var detector = document.getElementById("draggable");
    detector.style.display = "flex";
    var detectordim = [ZOOM * 1024 / PIXELS_PER_MM, ZOOM * 1024 / PIXELS_PER_MM];
    detector.style.width = detectordim[0].toString()+'px';
    detector.style.height = detectordim[1].toString()+'px';
    var cuton_pop = document.getElementById('cuton');
    var cutoff_pop = document.getElementById('cutoff');
    // cuton_pop.style.fontSize = (detectordim[0]/6).toString()+"px";
    // cutoff_pop.style.fontSize = (detectordim[0]/6).toString()+"px";
    cuton_pop.style.visibility = "visible";
    cutoff_pop.style.visibility = "visible";
    cuton_pop.style.visibility = "visible";
    cutoff_pop.style.visibility = "visible";
    // cuton_pop.style.width = detectordim[0].toString()+'px';
    // cutoff_pop.style.width = detectordim[0].toString()+'px';

    var detectordraggable = document.getElementById('detector');
    // detectordraggable.style.left = Math.round(FOCAL_PLANE_SCREEN_POSITION[0]-detectordim[0]/2).toString() + 'px';
    detectorpos = transform_mm_to_screen_pixels([xdetector_pix_to_mm(detector_cuts[0]),ycenter_mm]);

    var slit_mm = parseFloat(data[grism][filter][cam]["slit_const"])-xobj_mm;

    document.getElementById("Slit").innerHTML = "Slit: "+(slit_mm).toFixed(4).toString()+" μm ";
    document.getElementById("Center").innerHTML = "Centered At:<br>"+data[grism][filter][cam]["slit_const"]+" μm<br>("+center[0]+", "+center[1]+")";

    ctx.beginPath();
    ctx.clearRect(0, 0, 2000, 2000);

    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = ZOOM/2;
    ctx.moveTo(cuton_spx[0],cuton_spx[1]);
    ctx.lineTo(cutoff_spx[0],cutoff_spx[1]);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.rect(detectorpos[0],detectorpos[1]-detectordim[1]/2,detectordim[0],detectordim[1]);
    ctx.stroke();

    // $('#detector').hide();

    detectorpos[0] += X_LOWER_LIMIT;
    detectorpos[1] += (Y_LOWER_LIMIT-detectordim[1]/2);
    detectordraggable.style.left = detectorpos[0].toString() + 'px';
    detectordraggable.style.top = detectorpos[1].toString() + 'px';

    // now draw the spectral test lines
    var SPEC_LINES = [];
    var list = [];
    if (document.getElementById("Argon").checked) {
        list.push(ARGON_LIST);
    }
    if (document.getElementById("Krypton").checked) {
        list.push(KRYPTON_LIST);
    }
    if (document.getElementById("Neon").checked) {
        list.push(NEON_LIST);
    }
    if (document.getElementById("Xenon").checked) {
        list.push(XENON_LIST);
    }
    var maxI = 0;
    for (var a = 0; a < list.length; a++) {
        for (var b = 0; b < list[a].length; b++) {
            // //console.log(list[a][b])
            if (list[a][b].lambda > filter_cuton && list[a][b].lambda < filter_cutoff) {
                SPEC_LINES.push(list[a][b]);
                if (list[a][b].intensity > maxI) {
                    maxI = list[a][b].intensity;
                }
            }
        }
    }

    for (var c = 0; c < SPEC_LINES.length; c++) {
        // var cen = transform_mm_to_screen_pixels([xdetector_pix_to_mm(get_filt_passband(SPEC_LINES[c].lambda)),yobj_mm])
        var cen = transform_mm_to_screen_pixels([xdetector_pix_to_mm(get_filt_passband(SPEC_LINES[c].lambda)[0]),yobj_mm]);
        // //console.log(SPEC_LINES[c].lambda)
        // //console.log(xdetector_pix_to_mm(get_filt_passband(SPEC_LINES[c].lambda)[0]))
        var percentI = SPEC_LINES[c].intensity/maxI;

        // //console.log(cen)

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, '+percentI.toString()+')';
        ctx.lineWidth = 1;
        ctx.moveTo(parseInt(ecwidth-cen[0]),parseInt(cen[1]+(Y_UPPER_LIMIT)));
        ctx.lineTo(parseInt(ecwidth-cen[0]),parseInt(cen[1]-(Y_UPPER_LIMIT)));
        ctx.stroke();

    }

    //draw slit
    var slit_spx = transform_mm_to_screen_pixels([xdetector_pix_to_mm(get_filt_passband(slit_mm)[0]),yobj_mm]);
    //console.log(slit_mm)
    //console.log(slit_spx)
    if(slit_mm > filter_cuton && slit_mm < filter_cutoff){
        ctx.strokeStyle = 'rgba(0, 200, 0, 1)';
        //console.log('green',slit_spx,cuton_spx,cutoff_spx);
    }
    else {
        ctx.strokeStyle = 'rgba(200, 0, 0, 1)';
        //console.log('red',slit_mm,cuton_mm,slit_mm < cutoff_mm);

    }

    ctx.beginPath();
    // ctx.strokeStyle = 'rgba(0, 200, 0, 1)';
    ctx.lineWidth = 1;
    ctx.moveTo(ecwidth-slit_spx[0],slit_spx[1]+Y_UPPER_LIMIT);
    ctx.lineTo(ecwidth-slit_spx[0],slit_spx[1]-Y_UPPER_LIMIT);
    ctx.stroke();

}

function setObjectLocation() {
    xobj = 1024-document.getElementById("FindX").value;
    yobj = document.getElementById("FindY").value;

    // console.log(xobj,yobj)

    drawExposure();
}

window.onload = drawExposure();
window.onload = setObjectLocation();

function OffCenterXheight(x_cursor, order_number) {

    var point = endpoints[order_number];

    if ( point == undefined){
        return undefined;
    }

    var slope = -(point[1]-point[3])/(point[2]-point[0]);
    xheight = (slope*(x_cursor-point[0]))+point[1];

    return Math.round(xheight);
}

function getMouse(e){
    var posx;
    var posy;

    if (!e) var e = window.event;

    if (e.pageX || e.pageY) {
        posx = e.pageX + document.getElementById("container").scrollLeft;
        posy = e.pageY + document.getElementById("container").scrollTop;
    }
    else if (e.clientX || e.clientY) {
        posx = e.clientX + document.getElementById("container").scrollLeft;
        posy = e.clientY + document.getElementById("container").scrollTop;
    }

    return [posx,posy];

}

document.onmousemove = handleMouseMove;
function handleMouseMove(e) {
    var eventDoc, doc, body, pageX, pageY;

    // event = event || window.event; //makes stuff work in IE

    // if (event.pageX == null && event.clientX != null) {
    //     eventDoc = (event.target && event.target.ownerDocument) || document;
    //     doc = eventDoc.documentElement;
    //     body = eventDoc.body;

    //     event.pageX = event.clientX +
    //       (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
    //       (doc && doc.clientLeft || body && body.clientLeft || 0);
    //     event.pageY = event.clientY +
    //       (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
    //       (doc && doc.clientTop  || body && body.clientTop  || 0 );
    //   }

    var posx;
    var posy;

    if (!e) var e = window.event;

    if (e.pageX || e.pageY) {
        posx = e.pageX - X_LOWER_LIMIT;
        posy = e.pageY - Y_LOWER_LIMIT;

        // //console.log("("+posx.toString()+","+posy.toString()+")");
    }
    else if (e.clientX || e.clientY) {
        posx = e.clientX - X_LOWER_LIMIT;
        posy = e.clientY - Y_LOWER_LIMIT;
    }

    // if (e.pageX || e.pageY) {
    //   posx = e.pageX;
    //   posy = e.pageY;
    //
    //   // //console.log("("+posx.toString()+","+posy.toString()+")");
    // }
    // else if (e.clientX || e.clientY) {
    //   posx = e.clientX;
    //   posy = e.clientY;
    // }



    // //console.log(adjusted_x,adjusted_y);
    // <span id="Coords" class="data">Cursor location</span>
    // document.getElementById("Coords").innerHTML = "Cursor location: ("+adjusted_x.toString()+", "+adjusted_y.toString()+")";


    if (posx < X_UPPER_LIMIT && posy < Y_UPPER_LIMIT) {
        if (posx > X_LOWER_LIMIT && posy > Y_LOWER_LIMIT) {
            adjusted_x = posx;
            adjusted_y = posy;

            var lambda = findLambda(adjusted_x,adjusted_y);
            // var lambda = transform_screen_pixels_to_mm(adjusted_x,adjusted_y)[0];
            document.getElementById("CursorLambda").innerHTML = "Lambda (at Cursor): "+lambda.toFixed(3).toString()+" μm ";
        }
    }
}


function clearMarkers() {
    plottedwavelengths = [];
    clear=true;
    update();
}

function fillBG() {
    ctx.beginPath();
    ctx.clearRect(0, 0, 1000, 2000);

    ctx.rect(0, 0, 1000, 2000);
    ctx.fillStyle = "black";
    ctx.fill();

    //console.log('done filling bg')
}

function exportEchelle() {
    fillBG();
    drawExposure();

    // ctx.beginPath();
    // ctx.lineWidth="1";
    // ctx.strokeStyle="black";
    // //console.log(Math.round(detectorpos[0]-X_LOWER_LIMIT),Math.round(detectorpos[1]-Y_LOWER_LIMIT),Math.round(detectordim[0]),Math.round(detectordim[1]));
    //
    // ctx.rect(Math.round(detectorpos[0]-X_LOWER_LIMIT),Math.round(detectorpos[1]-Y_LOWER_LIMIT),Math.round(detectordim[0]),Math.round(detectordim[1]));
    // ctx.stroke();
    var expimg = echellecanvas.toDataURL("image/png");
    window.open(expimg,'blank');
    update();
}

// function incrementX() {
//     $('FindX').value += 1;
//     update();
// }
//
// function decrementX() {
//     $('FindX').value -= 1;
//     update();
// }
//
// function incrementY() {
//     $('FindY').value += 1;
//     update();
// }
//
// function decrementY() {
//     $('FindY').value -= 1;
//     update();
// }

function update() {
    // console.log("updating echelle");
    ZOOM = parseFloat(document.getElementById("zoom").value)/2;
    ctx.beginPath();
    ctx.clearRect(0, 0, 1000, 2000);

    // color=something
    // //console.log("drawing echelle, zoom="+ZOOM.toString());

    drawExposure();

}

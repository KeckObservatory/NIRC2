/* HIRES Echelle Format Simulator */

var echellecanvas = document.getElementById('echelle');
var ecwidth = parseInt($('#container').css("width"));
echeight = ecwidth;
echellecanvas.width = ecwidth.toString();
echellecanvas.height = echeight.toString();
var ctx = echellecanvas.getContext("2d");
var echellerect = echellecanvas.getBoundingClientRect();

var X_LOWER_LIMIT = 10; //  Lower limit on coord in X direction
var X_UPPER_LIMIT = Math.round(document.documentElement.clientWidth/2); //  Upper limit on coord in X direction
var Y_LOWER_LIMIT = Math.round(
    (document.documentElement.clientHeight -
    document.documentElement.clientWidth/2)/2); //  Lower limit on coord in Y direction
var Y_UPPER_LIMIT = document.documentElement.clientHeight - Y_LOWER_LIMIT;

X_UPPER_LIMIT+=10;
var XRANGE = X_UPPER_LIMIT - X_LOWER_LIMIT;
var YRANGE = Y_UPPER_LIMIT - Y_LOWER_LIMIT;

var yobj_mm,xobj_mm;
var plottedwavelengths=[];

function updateDistance() {
    ecwidth = parseInt($('#container').css("width"));
    echeight = ecwidth;
    echellecanvas.width = ecwidth.toString();
    echellecanvas.height = ecwidth.toString();
    ctx = echellecanvas.getContext("2d");
    echellerect = echellecanvas.getBoundingClientRect();

    X_LOWER_LIMIT = 10;
    X_UPPER_LIMIT = Math.round(document.documentElement.clientWidth/2);
    Y_LOWER_LIMIT = Math.round(
        (document.documentElement.clientHeight -
        document.documentElement.clientWidth/2)/2);
    Y_UPPER_LIMIT = document.documentElement.clientHeight - Y_LOWER_LIMIT;
    X_UPPER_LIMIT+=10;
    XRANGE = X_UPPER_LIMIT - X_LOWER_LIMIT;
    YRANGE = Y_UPPER_LIMIT - Y_LOWER_LIMIT;
}

window.onload = updateDistance;
document.onResize = updateDistance;

var url;

// camera centers, what pixel is slitmm 0.0
const wide_center = [521.4, 512.0]
const medium_center = [528.4, 512.0]
const narrow_center = [533.0, 512.0]

const slitmm_arcsec = .7245

// per camera. these are defaults
var ARCSECONDS_PER_PIXEL = 0.040
var center = (521.4, 512.0)
var PIXELS_PER_MM = 34.5016

var xobj = $('#FindX').val();
var yobj = $('#FindY').val();

var cam = $('#switchCamera').val();
var filter = $('#switchFilter').val();
var grism = $('#switchGrism').val();

var ARCSECONDS_PER_PIXEL = 0.010;
const MARKER_COLOR = "white";

var color = "red";
var ZOOM=4.5;
var border_color = 'black';

var detectordim = [0,0];
var detectorpos = [0,0];


function mm_to_xdetector_pix(mm){
    return (center[0]+(mm/(slitmm_arcsec*ARCSECONDS_PER_PIXEL)));
}

function xdetector_pix_to_mm(px){
    return slitmm_arcsec*ARCSECONDS_PER_PIXEL *(px-center[0]);
}

function transform_mm_to_screen_pixels(mm) {
    return [
        (FOCAL_PLANE_SCREEN_POSITION[0] + ( ZOOM * mm[0] ) - X_LOWER_LIMIT),
        (FOCAL_PLANE_SCREEN_POSITION[1] -  (ZOOM * mm[1] ) - Y_LOWER_LIMIT)
        ];
}

function transform_screen_pixels_to_mm( px, py) {
    return [
        ( px - FOCAL_PLANE_SCREEN_POSITION[0] + X_LOWER_LIMIT ) / ZOOM,
        ( FOCAL_PLANE_SCREEN_POSITION[1] - Y_LOWER_LIMIT - py) / ZOOM
        ];
}

function get_filt_passband(lambda) {
    curdata = data[grism][filter][cam];
    lambda_cen = curdata["slit_slope"] * xobj + curdata["slit_const"]
    var centerx = center[0]; // detector pixels

    // upper/lower bounds of detector box (in μm)
    det_up_limit = lambda_cen + centerx*curdata["disp"];
    det_low_limit = lambda_cen - centerx*curdata["disp"];

    // detector pixels of lambda wavelength [0,1024]
    var val = (lambda_cen - lambda) / curdata["disp"] + centerx;

    return [val,det_low_limit,det_up_limit];
}

function findLambda(cursor_x, cursor_y) {
    // find the wavelength of mouse position (inverse of get_filt_passband)

    curdata = data[grism][filter][cam];
    var dpx = mm_to_xdetector_pix(transform_screen_pixels_to_mm(cursor_x,cursor_y)[0]);
    lambda_cen = curdata["slit_slope"] * xobj + curdata["slit_const"]

    lambda = lambda_cen - curdata["disp"] * (center[0] - dpx);

    return lambda;
}

function findLambdaLocation(lambda, set=false, add=false) {

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


function drawExposure() {

    ecwidth = parseInt($('#container').css("width"));
    echeight=ecwidth;

    // INPUTS:
    //	filter, nirc2 filter
    //	cam, nirc2 camera
    // 	xobj, xpixel of slit
    //	yobj, y pixel of object postion along the slit
    //	grism, nirc2 dispersing element

    cam = $('#switchCamera').val();
    filter = $('#switchFilter').val();
    grism = $('#switchGrism').val();

    if (!cam || !filter || !grism) {
        $('.wavelength').hide();
        return;
    }

    url = ("https://www2.keck.hawaii.edu/inst/nirc2/filters/"+filter.replace(/\d/g, '')+".gif");

    $('#spectrumgraph').attr("src", url);
    $('#popup').attr("src", url);
    $('#popup').css('border', '1px solid black');

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
    $('#Cut-On').html("Cut-On: "+filter_cuton.toFixed(3).toString()+" μm ");
    $('#Cut-Off').html("Cut-Off: "+filter_cutoff.toFixed(3).toString()+" μm ");
    // detector box cuts
    $('#cuton').html(detector_cuts[0].toFixed(3).toString()+" μm ");
    $('#cutoff').html(detector_cuts[1].toFixed(3).toString()+" μm ");

    if ( detector_cuts[0] > filter_cuton || detector_cuts[1] < filter_cuton ){
        // spectrum is completely to the left of detector
        $('#cuton').css("color", "red");
    }
    else {
        $('#cuton').css("color", "green");
    }

    if ( detector_cuts[1] < filter_cutoff || detector_cuts[1] < filter_cuton){
        // spectrum is completely to the left of detector
        $('#cutoff').css("color", "red");
    }
    else {
        $('#cutoff').css("color", "green");
    }

    FOCAL_PLANE_SCREEN_POSITION = [ X_LOWER_LIMIT+parseInt(XRANGE/2), Y_LOWER_LIMIT + parseInt(YRANGE/2)];
    var cutoff_spx = transform_mm_to_screen_pixels([cutoff_mm,yobj_mm]);
    var cuton_spx = transform_mm_to_screen_pixels([cuton_mm,yobj_mm]);
    cuton_spx[0]=ecwidth-cuton_spx[0];cutoff_spx[0]=ecwidth-cutoff_spx[0];

    var obj_spx = transform_mm_to_screen_pixels([xobj_mm,yobj_mm]);

    var detector = $('#draggable');
    detector.css("display", "flex");
    var detectordim = [ZOOM * 1024 / PIXELS_PER_MM, ZOOM * 1024 / PIXELS_PER_MM];
    detector.css("width", detectordim[0].toString()+'px');
    detector.css("width", detectordim[1].toString()+'px');
    $('.wavelength').show();

    var detectordraggable = $('#detector');
    detectorpos = transform_mm_to_screen_pixels([xdetector_pix_to_mm(detector_cuts[0]),ycenter_mm]);

    var slit_mm = parseFloat(data[grism][filter][cam]["slit_const"])-xobj_mm;

    $('#Slit').html("Slit: "+(slit_mm).toFixed(4).toString()+" μm ");
    $('#Center').html("Centered At:<br>"+data[grism][filter][cam]["slit_const"]+" μm<br>("+center[0]+", "+center[1]+")");

    ctx.beginPath();
    ctx.clearRect(0, 0, 2000, 2000);

    // detector box
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.rect(detectorpos[0],detectorpos[1]-detectordim[1]/2,detectordim[0],detectordim[1]);
    ctx.stroke();

    // spectrum
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = ZOOM/2;
    ctx.moveTo(cuton_spx[0],cuton_spx[1]);
    ctx.lineTo(cutoff_spx[0],cutoff_spx[1]);
    ctx.stroke();

    detectorpos[0] += X_LOWER_LIMIT;
    detectorpos[1] += (Y_LOWER_LIMIT-detectordim[1]/2);
    detectordraggable.css("left", detectorpos[0].toString() + 'px');
    detectordraggable.css("top", detectorpos[1].toString() + 'px');
    detectordraggable.css("height", detectordim[1].toString() + 'px');

    // now draw the spectral test lines
    var SPEC_LINES = [];
    var list = [];

    if ($('#Argon').prop("checked")) list.push(ARGON_LIST);
    if ($('#Krypton').prop("checked")) list.push(KRYPTON_LIST);
    if ($('#Neon').prop("checked")) list.push(NEON_LIST);
    if ($('#Xenon').prop("checked")) list.push(XENON_LIST);

    // detects the maximum intensity for calibrating line darkness
    var maxI = 0;
    for (var a = 0; a < list.length; a++) {
        for (var b = 0; b < list[a].length; b++) {
            if (list[a][b].lambda > filter_cuton && list[a][b].lambda < filter_cutoff) {
                SPEC_LINES.push(list[a][b]);
                if (list[a][b].intensity > maxI) {
                    maxI = list[a][b].intensity;
                }
            }
        }
    }

    for (var c = 0; c < SPEC_LINES.length; c++) {
        // each line is drawn at an alpha value matching the percent intensity.
        var cen = transform_mm_to_screen_pixels([xdetector_pix_to_mm(get_filt_passband(SPEC_LINES[c].lambda)[0]),yobj_mm]);
        var percentI = SPEC_LINES[c].intensity/maxI;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, '+percentI.toString()+')';
        ctx.lineWidth = 1;
        ctx.moveTo(parseInt(ecwidth-cen[0]),parseInt(cen[1]+(Y_UPPER_LIMIT)));
        ctx.lineTo(parseInt(ecwidth-cen[0]),parseInt(cen[1]-(Y_UPPER_LIMIT)));
        ctx.stroke();

    }

    //draw slit
    var slit_spx = transform_mm_to_screen_pixels([xdetector_pix_to_mm(get_filt_passband(slit_mm)[0]),yobj_mm]);

    // green if within range, otherwise it's red
    if(slit_mm > filter_cuton && slit_mm < filter_cutoff) ctx.strokeStyle = 'rgba(0, 200, 0, 1)';
    else ctx.strokeStyle = 'rgba(200, 0, 0, 1)';

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(ecwidth-slit_spx[0],slit_spx[1]+Y_UPPER_LIMIT);
    ctx.lineTo(ecwidth-slit_spx[0],slit_spx[1]-Y_UPPER_LIMIT);
    ctx.stroke();

}


function getMouse(e){

    var posx;
    var posy;

    if (!e) var e = window.event;

    if (e.pageX || e.pageY) {
        posx = e.pageX + $('#container').scrollLeft;
        posy = e.pageY + $('#container').scrollTop;
    }
    else if (e.clientX || e.clientY) {
        posx = e.clientX + $('#container').scrollLeft;
        posy = e.clientY + $('#container').scrollTop;
    }

    return [posx,posy];

}


document.onmousemove = handleMouseMove;
function handleMouseMove(e) {
    var eventDoc, doc, body, pageX, pageY;

    var posx;
    var posy;

    if (!e) var e = window.event;

    if (e.pageX || e.pageY) {
        posx = e.pageX - X_LOWER_LIMIT;
        posy = e.pageY - Y_LOWER_LIMIT;
    }
    else if (e.clientX || e.clientY) {
        posx = e.clientX - X_LOWER_LIMIT;
        posy = e.clientY - Y_LOWER_LIMIT;
    }

    if (posx < X_UPPER_LIMIT && posy < Y_UPPER_LIMIT) {
        if (posx > X_LOWER_LIMIT && posy > Y_LOWER_LIMIT) {
            adjusted_x = posx;
            adjusted_y = posy;
            var lambda = findLambda(adjusted_x,adjusted_y);
            $('#CursorLambda').html("Lambda (at Cursor): "+lambda.toFixed(3).toString()+" μm ");
        }
    }
}


function setObjectLocation() {
    xobj = 1024-$('#FindX').val();
    yobj = $('#FindY').val();
    drawExposure();
}

function OffCenterXheight(x_cursor, order_number) {

    var point = endpoints[order_number];

    if ( point == undefined){
        return undefined;
    }

    var slope = -(point[1]-point[3])/(point[2]-point[0]);
    xheight = (slope*(x_cursor-point[0]))+point[1];

    return Math.round(xheight);
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

    var expimg = echellecanvas.toDataURL("image/png");
    window.open(expimg,'blank');

    update();
}


function update() {
    // console.log("updating echelle");
    ZOOM = parseFloat($('#zoom').val())/2;
    ctx.beginPath();
    ctx.clearRect(0, 0, 1000, 2000);

    drawExposure();

}

window.onload = drawExposure();
window.onload = setObjectLocation();

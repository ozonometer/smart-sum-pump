
import Poco from "commodetto/Poco";
import Resource from "Resource";
import parseBMF from "commodetto/parseBMF";
import Timer from "timer";
import config from "mc/config";
import Monitor from "pins/digital/monitor";
import Digital from "pins/digital";
import Analog from "pins/analog";
import WiFi from "wifi";
import {Request} from "http";

let dcMotorState = 1; // 1 = high motor is off

let wifiMonitor = new WiFi({
        ssid: "MMG2",
        password: "*****"
    },
    function(msg) {
        switch (msg) {
            case WiFi.gotIP:
                trace("network ready\n");
                break;
            case WiFi.connected:
                trace("connected\n");
                getCurrentTime();
                break;
            case WiFi.disconnected:
                trace("connection lost\n");
                break;
        }
    }
);

function getCurrentTime() {
    let request = new Request({
        host: "worldtimeapi.org",
        path: "/api/timezone/America/Chicago",
        response: String
    });
    request.callback = function(msg, value) {
        if (Request.responseComplete === msg) {
            value = JSON.parse(value);
            trace(`datetime: ${value.datetime}\n`);
            trace(`timezone: ${value.timezone} F\n`);
            trace(`utc_offset: ${value.utc_offset}.\n`);
        }
    }
}

//use poco
let poco = new Poco(screen, {displayListLength: 4000, rotation: config.rotation});

let white = poco.makeColor(255, 255, 255);
let grey = poco.makeColor(196, 197, 204);
let black = poco.makeColor(0, 0, 0);
let yellow = poco.makeColor(255, 255, 0);
let blue = poco.makeColor(24, 37, 153);
let green = poco.makeColor(21, 140, 37);
let orange = poco.makeColor(227, 146, 7);
let red = poco.makeColor(255, 0, 0);

//width 240 height is 320 pixels
trace(`Display width is ${poco.width} pixels.`);
trace(`Display height is ${poco.height} pixels.`);

// text font
let regular16 = parseBMF(new Resource("OpenSans-Regular-16.bf4"));
let bold28 = parseBMF(new Resource("OpenSans-Semibold-28.bf4"));

poco.begin();
// fill screen background
poco.fillRectangle(grey, 0, 0, poco.width, poco.height);

// limits text drawn by screen size
drawSector(poco, black, grey, 0, 0, 159, 79); // 1
drawSector(poco, black, grey, 0, 160, 159, 79); // 2
drawSector(poco, black, grey, 80, 0, 159, 79); // 3
drawSector(poco, black, grey, 80, 160, 159, 79); // 4
drawSector(poco, black, grey, 160, 0, 240, 79); // 5
drawSector(poco, black, grey, 160, 241, 78, 79); // 6
// draw static text
let wtLvText = "Water Level";
let voltageText = "Battery Voltage";
let acText = "AC Motor"
let dcText = "DC Motor"
let offText = "OFF"
poco.drawText(wtLvText, regular16, black, 35, 10); // x, y
poco.drawText(voltageText, regular16, black, 20, 90); // x, y
poco.drawText(acText, regular16, black, 200, 10); // x, y
poco.drawText(dcText, regular16, black, 200, 90); // x, y
let offTextWidth = poco.getTextWidth(offText, bold28);
poco.drawText(offText, bold28, black, 240 - (offTextWidth / 2), 115); // x, y
poco.end();

function drawSector(poco, lineColor, color, xOrigin, yOrigin, width, height) {
    poco.fillRectangle(lineColor, yOrigin, xOrigin, width + 1, height + 1);
// use text width and font height to draw rectangle
    poco.fillRectangle(color, yOrigin + 1, xOrigin + 1, width-1, height-1);

}

let monitor = new Monitor({
    pin: 16,
    mode: Digital.InputPullDown,
    edge: Monitor.Rising
});

let lastState;
let currentState;

const pinA = new Monitor(
    {
        pin: 19,
        mode: Digital.InputPullUp,
        edge: Monitor.Rising | Monitor.Failling
    }
)
const pinB = new Digital(
    {
        pin: 3,
        mode: Digital.InputPullUp
    }
)

const dcMotor = new Monitor(
    {
        pin: 23,
        //mode: Digital.InputPullUp,
        mode: Digital.InputPullUp,
        edge: Monitor.Rising | Monitor.Failling
    }
)

const pinLed = new Digital(
    {
        pin: 4,
        mode: Digital.Output
    }
)
trace("pin A\n");
lastState = pinA.read();
trace(`pinA: ${lastState}\n`);

function rotationDirection() {
    currentState = pinA.read();
    if (currentState !== lastState) {
        if (pinB.read() !== currentState) {
            trace("Clockwise rotation\n");
        } else {
            trace("Conter-clockwise rotation\n");
        }
    }
    lastState = currentState;
}

pinA.onChanged = function() {
    rotationDirection();
}

dcMotor.onChanged = function() {
    dcMotorState = dcMotor.read();
    trace(`dcMotor: ${dcMotorState}\n`);
    pinLed.write(!dcMotorState);
    // 1 = off, 0 = on
    if (dcMotorState) {
        redrawText('ON', 'OFF', bold28, black, grey, 240, 115);
    } else {
        redrawText('OFF', 'ON', bold28, red, grey, 240, 115);
    }
}
////////////////////////////////////////
// uses 100R resistor with gauge to form voltage divider
let gaugePrev = 0;
let voltagePrev = 0;
let currentPrev = 0;
Timer.repeat((id) => {
    //read and display water level
    let gauge = Analog.read(3); //ADC1_3 (VN) pin
    if (Math.abs(gaugePrev - gauge) > 10) {
        let gaugeLevel = gageToLevel(gauge);
        redrawText(gageToLevel(gaugePrev), gaugeLevel, bold28, waterLevelColor(gaugeLevel), grey, 80, 35);
        gaugePrev = gauge;
    }
    //read and display backup battery voltage
    let voltage = Analog.read(0) / 310 * 5; // 1023 resolution * 3.3 voltage ref = 310, 5 is voltage divider ratio
    voltage = Math.round(voltage * 100) / 100;
    // check if voltage changes more than 0.08 volts to remove reading fluctuations
    if (Math.abs(voltagePrev - voltage) > 0.08) {
        let voltageTextColor = voltage < 11 ? red : black;
        redrawText(voltagePrev + 'V', voltage + 'V', bold28, voltageTextColor, grey, 80, 115);
        voltagePrev = voltage;
    }
    //read ac current sensor on AC motor line and display ac motor status
    let current = Analog.read(6); // normal 44, curren detected
    if (Math.abs(currentPrev - current) > 20) {
        trace(`current:${current}\n`);
        if (current > 60) {
            redrawText('OFF', 'ON', bold28, red, grey, 240, 35);
        } else {
            redrawText('ON', 'OFF', bold28, black, grey, 240, 35);
        }
        currentPrev = current;
    }

}, 1000);

/**
 * Redraws text by firs clearing old text and drawing new text, clears area based on which text (old or new) has larger width,
 * calculates and draws text in the center depending on text width.
 * @param oldText old text
 * @param newText new text
 * @param font text font
 * @param color text color
 * @param backgroundColor text background color
 * @param xOrigin x coordinate to start drawing
 * @param yOrigin y coordinate to start drawing
 */
function redrawText(oldText, newText, font, color, backgroundColor, xOrigin, yOrigin) {
    let oldTxtWidth = poco.getTextWidth(oldText, font);
    let newTxtWidth = poco.getTextWidth(newText, font);
    let textWidth = oldTxtWidth > newTxtWidth ? oldTxtWidth : newTxtWidth;
    let xCalculatedOld = Math.floor(xOrigin - (oldTxtWidth / 2));
    let xCalculatedNew = Math.floor(xOrigin - (newTxtWidth / 2));
    let xCalculated = xCalculatedOld < xCalculatedNew ? xCalculatedOld : xCalculatedNew;
    poco.begin(xCalculated, yOrigin, textWidth + 5, font.height);
    poco.fillRectangle(backgroundColor, xCalculated, yOrigin, textWidth + 5, font.height);
    poco.drawText(newText, font, color, xCalculatedNew, yOrigin); // x, y
    poco.end();
}
// removes old text from the screan
function clearText(prevText, font, color, xOrigin, yOrigin) {
    poco.begin(xOrigin, yOrigin, poco.getTextWidth(prevText, font) + 10, font.height);
    poco.fillRectangle(color, xOrigin, yOrigin, poco.getTextWidth(prevText, font) + 10, font.height);
    poco.end();
}

/**
 * Converts analog value reading of A5-U200 liquid sensor to percentage, sensor resistance is not linear and increases in 5 steps
 * @param analogVal analog sensor value
 * @returns {string} percentage string
 */
function gageToLevel(analogVal) {
    if (analogVal <= 400) {
        return '0%';
    } else if (analogVal > 401 && analogVal <= 510) {
        return '20%';
    } else if (analogVal > 511 && analogVal <= 540) {
        return '40%';
    } else if (analogVal > 541 && analogVal <= 620) {
        return '60%';
    } else if (analogVal > 621 && analogVal <= 750) {
        return '80%';
    } else if (analogVal > 751) {
        return '100%';
    } else {
        return 'N/A';
    }
}

/**
 * Return warning text color depending on water level
 * @param level string
 * @returns text color
 */
function waterLevelColor(level){
if (level === '80%' || level === '100%') {
        return red;
    } else {
        return black;
    }
}


////////////////////////////////////////////////////
let x2 = 0, y2 = 150;
let widthM = 78
let heightM = regular16.height;
let count0 = 0;
monitor.onChanged = function() {
    poco.begin(x2, y2, widthM, heightM); // redraw in specific area
    poco.fillRectangle(grey, x2, y2, widthM, heightM); //clear previous value
    let btTextM = `Pressed M Button : ${count0}`;
    widthM = poco.getTextWidth(btTextM, regular16); // get new text width
    poco.drawText(btTextM, regular16, black, x2, y2); //print new value
    trace(`button pressed: ${++count0}\n`);
    getCurrentTime();
    poco.end();
}

let previous = 1;
let count = 0;
let xx = 0, yy = 100;
let widthC = 78
    let heightC = regular16.height;
Timer.repeat(id => {
    poco.begin(xx, yy, widthC, heightC); // redraw in specific area
    //poco.begin();
    let value = Digital.read(0);
    if (value !== previous) {
        if (value) {
            poco.fillRectangle(grey, xx, yy, widthC, heightC); //clear previous value
            count = count +1;
            let btText = `Pressed: ${count}`;
            widthC = poco.getTextWidth(btText, regular16); // get new text width
            //poco.fillRectangle(red, 20, 20, widthBtText, bold28.height);
            trace(`button pressed: ${count}\n`);
            trace(`text width: ${widthC}\n`);
            trace(`text hight: ${heightC}\n`);
            poco.drawText(btText, regular16, black, xx, yy); //print new value
        }
        previous = value;
    }
    poco.end();
}, 100);

function printText() {

}

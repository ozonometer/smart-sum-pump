/*
 * Copyright (c) 2016-2020 Moddable Tech, Inc.
 *
 *   This file is part of the Moddable SDK.
 * 
 *   This work is licensed under the
 *       Creative Commons Attribution 4.0 International License.
 *   To view a copy of this license, visit
 *       <http://creativecommons.org/licenses/by/4.0>
 *   or send a letter to Creative Commons, PO Box 1866,
 *   Mountain View, CA 94042, USA.
 *
 */

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

//connect wifi
/*WiFi.connect({
        ssid: "MMG2",
        password: "PracticalElectronicsForInventors"
    }
);*/

let dcMotorState = 1; // 1 = high motor is off

let wifiMonitor = new WiFi({
        ssid: "MMG2",
        password: "PracticalElectronicsForInventors"
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
// draw red rectangle (color, x start, y start, x length, y height)
//poco.fillRectangle(red, 20, 20, 40, 30);

let textHi = "HII3";
// get text width
let widthText = poco.getTextWidth(textHi, bold28);
// draw rectangle to simulate selection
poco.fillRectangle(black, 18, 18, widthText + 3, bold28.height + 3);
// use text width and font height to draw rectangle
poco.fillRectangle(red, 20, 20, widthText, bold28.height);
// draw text
//poco.drawText(textHi, bold28, black, 20, 20);
// limits text drawn by screen size
//poco.drawText(textHi, bold28, black, 20, 20, poco.width);
drawSector(poco, black, grey, 0, 0, 159, 79); // 1
drawSector(poco, black, grey, 0, 160, 159, 79); // 2
drawSector(poco, black, grey, 80, 0, 159, 79); // 3
drawSector(poco, black, grey, 80, 160, 159, 79); // 4
drawSector(poco, black, grey, 160, 0, 240, 79); // 5
drawSector(poco, black, grey, 160, 241, 78, 79); // 6
// draw static text
let wtLvText = "Water Level";
let voltageText = "Battery Voltage";
poco.drawText(wtLvText, regular16, black, 35, 10); // x, y
poco.drawText(voltageText, regular16, black, 20, 90); // x, y


// draw text
//poco.drawText(textHi, bold28, black, 20, 20);
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
/*let button = new Digital({
    pin: 16,
    mode: Digital.InputPullDown
});

let monitor19 = new Monitor({
    pin: 19,
    mode: Digital.InputPullUp,
    edge: Monitor.Rising
});*/
/*let monitor3 = new Monitor({
    pin: 3,
    mode: Digital.InputPullUp,
    edge: Monitor.Rising
});*/
/*monitor19.onChanged = function() {
    let value3 = Digital.read(3);
    trace(`M19 value21=${value3}\n`)
}*/
/*
monitor3.onChanged = function() {
    let value19 = Digital.read(19);
    trace(`M21 value19=${value19}\n`)
}
*/

/*let rt1 = new Digital({
    pin: 19,
    mode: Digital.InputPullDown
});
let rt2 = new Digital({
    pin: 21,
    mode: Digital.InputPullDown
});
let previous1 = 1;
let previous2 = 1;
trace(`---\n`);
Timer.repeat(id => {
    let value1 = rt1.read();
    let value2 = rt2.read();
    if (value1 !== previous1 || value2 !== previous2) {
        /!*if (value2 === value1){
            trace(`<---\n`);
        } else {
            trace(`--->\n`);
        }*!/
        trace(`previous1=${previous1} previous2=${previous2}\n`)
        trace(`value1=${value1} value2=${value2}\n`)
        previous1 = value1;
        previous2 = value2;
    }
}, 100);*/

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

/*const pinCurrent = new Monitor(
    {
        pin: 22,
        //mode: Digital.InputPullUp,
        mode: Digital.InputPullDown,
        edge: Monitor.Rising | Monitor.Failling
    }
)*/

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

/*pinCurrent.onChanged = function() {
    trace(`pinA: ${pinCurrent.read()}\n`);
}*/

dcMotor.onChanged = function() {
    dcMotorState = dcMotor.read();
    trace(`dcMotor: ${dcMotorState}\n`);
    pinLed.write(!dcMotorState);
}
////////////////////////////////////////
// uses 100R resistor with gauge to form voltage divider
// get text width
//let widthWtLvText= poco.getTextWidth(wtLvText, bold28);

let gaugePrev = 0;
let voltagePrev = 0;
Timer.repeat((id) => {

    let gauge = Analog.read(3); //ADC1_3 (VN) pin
    if (gaugePrev !== gauge) {
        trace(`gauge:${gauge}\n`);
        //clearText(gaugePrev, regular16, grey, 40, 30)
        let gaugeLevel = gageToLevel(gauge);
        redrawText(gageToLevel(gaugePrev), gaugeLevel, bold28, waterLevelColor(gaugeLevel), grey, 55, 35);
        gaugePrev = gauge;
    }

    let current = Analog.read(6); // norlmal 44, curren detected
    trace(`current:${current}\n`);
    let voltage = Analog.read(0) / 310 * 5; // 1023 resolution * 3.3 voltage ref = 310, 5 is voltage divider ratio
    voltage = Math.round(voltage * 100) / 100;
    // check if voltage changes more than 0.08 volts to remove reading fluctuations
    if (Math.abs(voltagePrev - voltage) > 0.08) {
        let voltageTextColor = voltage < 11 ? red : black;
        redrawText(voltagePrev + 'V', voltage + 'V', bold28, voltageTextColor, grey, 35, 115);
        voltagePrev = voltage;
    }

}, 1000);

/**
 * Redraws text by firs clearing old text and drawing new text, clears area based on which text (old or new) has larger width
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
    poco.begin(xOrigin, yOrigin, textWidth + 5, font.height);
    poco.fillRectangle(backgroundColor, xOrigin, yOrigin, textWidth + 5, font.height);
    poco.drawText(newText, font, color, xOrigin, yOrigin); // x, y
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


/*let frame = 3;
let margin = 2;
let x = 10, y = 60;
let tickerWidth = 200;
let width = tickerWidth + frame * 2 + margin * 2;
let height = regular16.height + frame * 2 + margin * 2;
let text = "JavaScript is one of the world's most widely used programming languages.";
let textWidth = poco.getTextWidth(text, regular16);
let dx = tickerWidth;
Timer.repeat(function() {
	poco.begin(x, y, width, height);
	poco.fillRectangle(black, x, y, width, height);
	poco.fillRectangle(yellow, x + frame, y + frame, tickerWidth + margin * 2, regular16.height + margin * 2);

	poco.clip(x + frame + margin, y + frame + margin, tickerWidth, regular16.height);
	poco.drawText(text, regular16, black, x + frame + margin + dx, y + frame);
	poco.clip();

	dx -= 2;
	if (dx < -textWidth)
		dx = tickerWidth;
	poco.end();
}, 16);
 */

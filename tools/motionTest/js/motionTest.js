/**
* @license
* Copyright © 2016 Aeneas Kaiser, Andrea Bianco.
* This file is part of rti.js.
* rti.js is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published
* by the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* rti.js is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
* See the GNU Affero General Public License for more details.
* You should have received a copy of the GNU Affero General Public
* License along with rti.js. If not, see <http://www.gnu.org/licenses/>.
*/

function logStr(val) {
  // if (typeof val === 'undefined') return "UNDEFINED";
  if (val === undefined) return "UNDEFINED";
  if (val === null) return "NULL";
  if (typeof val === 'number') return val.toFixed(4);
  if (typeof val === 'string') return val;
  if (typeof val === 'boolean') return val;

  return "unidentified type";
}
function getMatchMediaScreenOrientation() {
  var screenOrientationMatch = "unknown";
  if (window.matchMedia("(orientation: portrait-primary)").matches) {
    screenOrientationMatch = "portrait-primary";
  } else if (window.matchMedia("(orientation: portrait-secondary)").matches) {
    screenOrientationMatch = "portrait-secondary";
  } else if (window.matchMedia("(orientation: landscape-primary)").matches) {
    screenOrientationMatch = "landscape-primary";
  } else if (window.matchMedia("(orientation: landscape-secondary)").matches) {
    screenOrientationMatch = "landscape-secondary";
  } else if (window.matchMedia("(orientation: portrait)").matches) {
    screenOrientationMatch = "portrait";
  } else if (window.matchMedia("(orientation: landscape)").matches) {
    screenOrientationMatch = "landscape";
  }
  return screenOrientationMatch;
}

function onDeviceMotion(e) {
  console.log("motion");
  debugCont1.innerHTML = "hallo onDeviceMotion";

  // console.log("motion acc incl g x", e.accelerationIncludingGravity.x);
  // console.log("motion acc incl g y", e.accelerationIncludingGravity.y);
  // console.log("motion acc incl g z", e.accelerationIncludingGravity.z);
  // console.log("motion acc x", e.acceleration.x);
  // console.log("motion acc y", e.acceleration.y);
  // console.log("motion acc z", e.acceleration.z);
  // console.log("motion rot alpha", e.rotationRate.alpha);
  // console.log("motion rot beta", e.rotationRate.beta);
  // console.log("motion rot gamma", e.rotationRate.gamma);

  accelerationInclGXBuff.push(e.accelerationIncludingGravity.x);
  accelerationInclGYBuff.push(e.accelerationIncludingGravity.y);
  accelerationInclGZBuff.push(e.accelerationIncludingGravity.z);

  accelerationXView.innerHTML = logStr(e.acceleration.x);
  accelerationYView.innerHTML = logStr(e.acceleration.y);
  accelerationZView.innerHTML = logStr(e.acceleration.z);
  accelerationInclGXView.innerHTML = logStr(e.accelerationIncludingGravity.x);
  accelerationInclGYView.innerHTML = logStr(e.accelerationIncludingGravity.y);
  accelerationInclGZView.innerHTML = logStr(e.accelerationIncludingGravity.z);
  rotationRateAlphaView.innerHTML = logStr(e.rotationRate.alpha);
  rotationRateBetaView.innerHTML = logStr(e.rotationRate.beta);
  rotationRateGammaView.innerHTML = logStr(e.rotationRate.gamma);

  accelerationInclGBufferXView.innerHTML = "b: "+logStr(accelerationInclGXBuff.getAvg());
  accelerationInclGBufferYView.innerHTML = "b: "+logStr(accelerationInclGYBuff.getAvg());
  accelerationInclGBufferZView.innerHTML = "b: "+logStr(accelerationInclGZBuff.getAvg());

  motionIntervalView.innerHTML = logStr(e.interval);

  if (motionIntervalEstStart == 0) {
    motionIntervalEstStart = new Date().getTime();
  } else if (motionCalls%100 == 0) {
    motionIntervalEstEnd = new Date().getTime();
    var d = motionIntervalEstEnd - motionIntervalEstStart;
    var intervalEst = d / 100;
    motionIntervalEstView.innerHTML = logStr(intervalEst);
    motionIntervalEstStart = new Date().getTime();
  }

  motionCalls = motionCalls+1;
  debugCont1.innerHTML = "onDeviceMotion done "+motionCalls;
}

function onDeviceOrientation(e) {
  console.log("orientation");
  debugCont2.innerHTML = "hallo onDeviceOrientation";

  // console.log("orientation absolute", e.absolute);
  // console.log("orientation alpha", e.alpha);
  // console.log("orientation beta", e.beta);
  // console.log("orientation gamma", e.gamma);

  orientationAlphaBuff.push(e.alpha);
  orientationBetaBuff.push(e.beta);
  orientationGammaBuff.push(e.gamma);

  orientationAbsoluteView.innerHTML = logStr(e.absolute);
  orientationAlphaView.innerHTML = logStr(e.alpha);
  orientationBetaView.innerHTML = logStr(e.beta);
  orientationGammaView.innerHTML = logStr(e.gamma);

  orientationBufferAlphaView.innerHTML = "b: "+logStr(orientationAlphaBuff.getAvg());
  orientationBufferBetaView.innerHTML = "b: "+logStr(orientationBetaBuff.getAvg());
  orientationBufferGammaView.innerHTML = "b: "+logStr(orientationGammaBuff.getAvg());

  if (orientationIntervalEstStart == 0) {
    orientationIntervalEstStart = new Date().getTime();
  } else if (orientationCalls%100 == 0) {
    orientationIntervalEstEnd = new Date().getTime();
    var d = orientationIntervalEstEnd - orientationIntervalEstStart;
    var intervalEst = d / 100;
    orientationIntervalEstView.innerHTML = logStr(intervalEst);
    orientationIntervalEstStart = new Date().getTime();
  }

  orientationCalls = orientationCalls+1;
  debugCont2.innerHTML = "onDeviceOrientation done "+orientationCalls;
}

function onCompassNeedsCalibration(e) {
    calibrationCalls = calibrationCalls+1;
    debugCont3.innerHTML = "onCompassNeedsCalibration done "+calibrationCalls;
}

function initMotionTest() {
  testCont = document.getElementById('motionTestCont');
  debugCont = document.getElementById('debugCont');
  debugCont1 = document.getElementById('debugCont1');
  debugCont2 = document.getElementById('debugCont2');
  debugCont3 = document.getElementById('debugCont3');
  debugCont4 = document.getElementById('debugCont4');

  deviceMotionSupportView = document.getElementById('deviceMotionSupport');

  accelerationXView = document.getElementById('accelerationX');
  accelerationYView = document.getElementById('accelerationY');
  accelerationZView = document.getElementById('accelerationZ');

  accelerationInclGXView = document.getElementById('accelerationInclGX');
  accelerationInclGYView = document.getElementById('accelerationInclGY');
  accelerationInclGZView = document.getElementById('accelerationInclGZ');

  accelerationInclGBufferXView = document.getElementById('accelerationInclGBufferX');
  accelerationInclGBufferYView = document.getElementById('accelerationInclGBufferY');
  accelerationInclGBufferZView = document.getElementById('accelerationInclGBufferZ');

  rotationRateAlphaView = document.getElementById('rotationRateAlpha');
  rotationRateBetaView = document.getElementById('rotationRateBeta');
  rotationRateGammaView = document.getElementById('rotationRateGamma');

  motionIntervalView = document.getElementById('motionInterval');
  motionIntervalEstView = document.getElementById('motionIntervalEst');

  deviceOrientationSupportView = document.getElementById('deviceOrientationSupport');

  orientationAbsoluteView = document.getElementById('orientationAbsolute');
  orientationAlphaView = document.getElementById('orientationAlpha');
  orientationBetaView = document.getElementById('orientationBeta');
  orientationGammaView = document.getElementById('orientationGamma');

  orientationBufferAlphaView = document.getElementById('orientationBufferAlpha');
  orientationBufferBetaView = document.getElementById('orientationBufferBeta');
  orientationBufferGammaView = document.getElementById('orientationBufferGamma');

  orientationIntervalEstView = document.getElementById('orientationIntervalEst');

  compassNeedsCalibrationSupportView = document.getElementById('compassNeedsCalibrationSupport');

  userAgentCont = document.getElementById('userAgentCont');

  bufferSizeCont = document.getElementById('bufferSizeCont');

  screenOrientationAttributeCont = document.getElementById('screenOrientationAttributeCont');
  screenOrientationMatchMediaCont = document.getElementById('screenOrientationMatchMediaCont');
  screenOrientationScreenAttributeCont = document.getElementById('screenOrientationScreenAttributeCont');

  motionCalls = 0;
  orientationCalls = 0;
  calibrationCalls = 0;
  screenOrientationCalls = 0;

  motionIntervalEstStart = 0;
  orientationIntervalEstStart = 0;

  var bufferSize = 20;
  orientationAlphaBuff = new CircularBuffer(bufferSize);
  orientationBetaBuff = new CircularBuffer(bufferSize);
  orientationGammaBuff = new CircularBuffer(bufferSize);

  accelerationInclGXBuff = new CircularBuffer(bufferSize);
  accelerationInclGYBuff = new CircularBuffer(bufferSize);
  accelerationInclGZBuff = new CircularBuffer(bufferSize);

  debugCont.innerHTML = "hallo init";

  if (window.DeviceMotionEvent == undefined) {
    console.log("no devicemotionEvent support");
    deviceMotionSupportView.innerHTML = "NO";
  } else {
    console.log("devicemotionEvent support");
    deviceMotionSupportView.innerHTML = "YES";
    window.addEventListener( 'devicemotion', onDeviceMotion, true );
  }

  if (window.DeviceOrientationEvent == undefined) {
    console.log("no deviceorientationEvent support");
    deviceOrientationSupportView.innerHTML = "NO";
  } else {
    console.log("deviceorientationEvent support");
    deviceOrientationSupportView.innerHTML = "YES";
    window.addEventListener( 'deviceorientation', onDeviceOrientation, true );
  }

  if (!('oncompassneedscalibration' in window)) {
    console.log("no compassneedscalibration support");
    compassNeedsCalibrationSupportView.innerHTML = "NO";
  } else {
    console.log("compassneedscalibration support");
    compassNeedsCalibrationSupportView.innerHTML = "YES";
    window.addEventListener( 'compassneedscalibration', onCompassNeedsCalibration, true );
  }

  screenOrientationAttributeCont.innerHTML = window.orientation;
  var screenOrientationUniversal = screen.orientation || screen.mozOrientation || screen.msOrientation;
  if (screenOrientationUniversal) {
    screenOrientationScreenAttributeCont.innerHTML = logStr(screenOrientationUniversal.type);
  } else {
    screenOrientationScreenAttributeCont.innerHTML = "not available";
  }
  var screenOrientationMatch = getMatchMediaScreenOrientation();
  screenOrientationMatchMediaCont.innerHTML = screenOrientationMatch;

  window.addEventListener("orientationchange", function() {
    screenOrientationCalls = screenOrientationCalls+1;
    debugCont4.innerHTML = "screenOrientation done "+screenOrientationCalls;
  }, false);

  setInterval(function() {
    screenOrientationAttributeCont.innerHTML = logStr(window.orientation);
    var screenOrientationUniversal = screen.orientation || screen.mozOrientation || screen.msOrientation;
    if (screenOrientationUniversal) {
      screenOrientationScreenAttributeCont.innerHTML = logStr(screenOrientationUniversal.type);
    } else {
      screenOrientationScreenAttributeCont.innerHTML = "not available";
    }
    var screenOrientationMatch = getMatchMediaScreenOrientation();
    screenOrientationMatchMediaCont.innerHTML = screenOrientationMatch;
  }, 300);

  userAgentCont.innerHTML = navigator.userAgent;

  bufferSizeCont.innerHTML = "buffer size: "+bufferSize;

  debugCont.innerHTML = "init done";
}

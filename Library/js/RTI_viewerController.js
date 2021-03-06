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

/**
 * Handles user events for basic interactions like zooming, dragging, or control
 * of light direction on the div containing the RTIViewer. Acts on the events by
 * interfacing with the API of the RTIViewer.
 *
 * @class
 * @param {RTIViewer} viewer - The viewer to be controlled.
*/
function RTIViewerController(viewer) {
  this._viewer = null;
  this._mouseMode = 0;
  this._isMouseDown = false;
  this._lastMousePos = null;
  this._dPinchLast = 0;

  this._orientationControl = false;
  this._orientationAmplify = false;
  this._orientationAlpha = null;
  this._orientationBeta = null;
  this._orientationGamma = null;

  this._init(viewer);
  return this;
} // RTIViewerController

RTIViewerController.prototype = {
  _init: function(viewer) {
    console.log("RTIViewerController._init:");
    if (typeof(RTI_LIGHTCONTROL_IN_VIEWCONTAINER) == "undefined") {
      RTI_LIGHTCONTROL_IN_VIEWCONTAINER = true;
    }

    this._viewer = viewer;
    if (RTI_LIGHTCONTROL_IN_VIEWCONTAINER)
    this._mouseMode = 1;
    else
    this._mouseMode = 0;

    this._isMouseDown = false;
    this._lastMousePos = new THREE.Vector2();
    this._dPinchLast = 0;

    window.addEventListener("resize", this.onResize.bind(this) );
    this._viewer.getDomElement().addEventListener( 'mousedown', this.onMouseDown.bind(this) );
    this._viewer.getDomElement().addEventListener( 'mousemove', this.onMouseMove.bind(this) );
    this._viewer.getDomElement().addEventListener( 'mouseout', this.onMouseOut.bind(this) );
    this._viewer.getDomElement().addEventListener( 'mouseup', this.onMouseUp.bind(this) );
    this._viewer.getDomElement().addEventListener( 'wheel', this.onWheel.bind(this) );

    if (RTI_LIGHTCONTROL_IN_VIEWCONTAINER) {
    this._viewer.getDomElement().setAttribute("tabindex", -1);
    this._viewer.getDomElement().focus();
    this._viewer.getDomElement().addEventListener( 'keyup', this.onKeyUp.bind(this) );
    }

    this._viewer.getDomElement().addEventListener('touchstart', this.onTouchStart.bind(this) );
    this._viewer.getDomElement().addEventListener('touchmove', this.onTouchMove.bind(this) );
    this._viewer.getDomElement().addEventListener('touchend', this.onTouchEnd.bind(this) );

    if (window.DeviceOrientationEvent == undefined) {
      this._orientationControl = false;
      console.log(" no deviceOrientationEvent support");
    } else {
      this._orientationControl = true;
      console.log(" has deviceOrientationEvent support");
      var bufferSize = 3;
      this._orientationAlpha = new CircularBuffer(bufferSize);
      this._orientationBeta = new CircularBuffer(bufferSize);
      this._orientationGamma = new CircularBuffer(bufferSize);
      window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this) );
    }
  },

  onDeviceOrientation: function(e) {
    if (this._orientationControl && window.orientation != null) {
      this._orientationAlpha.push(e.alpha*Math.PI/180);
      this._orientationBeta.push(e.beta*Math.PI/180);
      this._orientationGamma.push(e.gamma*Math.PI/180);

      var lightDir = new THREE.Vector3(0.0, 0.0, 1.0);

      var axisBeta = new THREE.Vector3(0.0, 0.0, 0.0);
      var axisGamma = new THREE.Vector3(0.0, 0.0, 0.0);

      var orientation = window.orientation;
      if (orientation == 0.0) {
        axisBeta.setX(1.0);
        axisGamma.setY(1.0);
      } else if (orientation == 90) {
        axisBeta.setY(1.0);
        axisGamma.setX(-1.0);
      } else if (orientation == 180) {
        axisBeta.setX(-1.0);
        axisGamma.setY(-1.0);
      } else if (orientation == -90) {
        axisBeta.setY(-1.0);
        axisGamma.setX(1.0);
      }

      var angleBeta = -this._orientationBeta.getAvg();
      var angleGamma = -this._orientationGamma.getAvg();
      if (this._orientationAmplify) {
        angleGamma = 2*angleGamma;
        angleBeta = 2*angleBeta;
      }

      lightDir.applyAxisAngle(axisBeta, angleBeta);
      lightDir.applyAxisAngle(axisGamma, angleGamma);

      lightDir.normalize();
      this._viewer.setDirectionalLightDirection(lightDir);
    }
  },

  onResize: function() {
    this._viewer.resize();
  },

  onMouseOut: function( event_info ) {
    event_info.preventDefault();
    this._isMouseDown = false;
  },

  onMouseUp: function( event_info ) {
    event_info.preventDefault();
    this._isMouseDown = false;
  },

  onMouseDown: function( event_info ) {
    event_info.preventDefault();
    if (event_info.button == 0) {
      this._contactPointStart(event_info);
    }
  },

  onMouseMove: function( event_info ) {
    event_info.preventDefault();
    this._contactPointMove(event_info);
  },

  onWheel: function(event_info) {
    event_info.preventDefault();
    var mousePos = RTIUtils.normalizedMouseCoords(event_info, this._viewer.getDomElement());
    this._viewer.zoomView(event_info.deltaY/40, mousePos); // MAGIC_VALUE
  },

  onTouchStart: function( event ) {
    event.preventDefault();
    if (event.targetTouches.length == 1) {
      var touch = event.changedTouches[0];
      this._contactPointStart(touch);
    }
  },

  onTouchMove: function( event ) {
    event.preventDefault();
    if (event.targetTouches.length == 1) {
      var touch = event.changedTouches[0];
      this._isZoomActive = false;
      this._contactPointMove(touch);
    } else if (event.targetTouches.length == 2) {
      var touch0 = event.changedTouches[0];
      var touch1 = event.changedTouches[1];
      this._isMouseDown = false;
      var newMousePos0 = RTIUtils.normalizedMouseCoords(touch0, this._viewer.getDomElement());
      var newMousePos1 = RTIUtils.normalizedMouseCoords(touch1, this._viewer.getDomElement());
      var dPinchNew = Math.pow(newMousePos1.x - newMousePos0.x, 2) +  Math.pow(newMousePos1.y - newMousePos0.y, 2);
      if (this._isZoomActive) {
        var d = dPinchNew - this._dPinchLast;
        this._viewer.zoomView(d, new THREE.Vector2(0,0));
        this._dPinchLast = dPinchNew;
      } else {
        this._isZoomActive = true;
        this._dPinchLast = dPinchNew;
      }
    }
  },

  onTouchEnd: function( event ) {
    event.preventDefault();
    this._isZoomActive = false;
    this._isMouseDown = false;
  },

  onKeyUp: function(event_info) {
    event_info.preventDefault();
    if (event_info.keyCode == 32) {
      this._mouseMode = 1 - this._mouseMode;
    }
  },

  enableOrientationControl: function(enable) {
    this._orientationControl = enable;
  },

  enableOrientationAmplify: function(enable) {
    this._orientationAmplify = enable;
  },

  setLightDir: function(mousePos2d){
    var lightDir = new THREE.Vector3(mousePos2d.x, mousePos2d.y, 0);

    var sumSquares = lightDir.x*lightDir.x + lightDir.y*lightDir.y;
    if (sumSquares < 1) {
      lightDir.setZ(Math.sqrt(1 - sumSquares));
    } else {
      lightDir.setZ(0.0);
      lightDir.normalize();
    }
    this._viewer.setDirectionalLightDirection(lightDir);
  },

  _contactPointStart: function(contactPoint) {
    this._isMouseDown = true;
    this._viewer.getDomElement().focus();
    var newMousePos = RTIUtils.normalizedMouseCoords(contactPoint, this._viewer.getDomElement());
    if (this._mouseMode == 0) { // dragImage mode
      this._lastMousePos = newMousePos;
    } else if (this._mouseMode == 1) { // setLightDir mode
      this.setLightDir(newMousePos);
    }
  },

  _contactPointMove: function(contactPoint) {
    if (this._isMouseDown) {
      var newMousePos = RTIUtils.normalizedMouseCoords(contactPoint, this._viewer.getDomElement());
      if (this._mouseMode == 0) { // dragImage mode
        this._viewer.dragView(this._lastMousePos, newMousePos);
        this._lastMousePos = newMousePos;
      } else if (this._mouseMode == 1) { // setLightDir mode
        this.setLightDir(newMousePos);
      }
    }
  }
} // RTIViewerController prototype

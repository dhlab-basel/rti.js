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

  this._init(viewer);
  return this;
} // RTIViewerController

RTIViewerController.prototype = {
  _init: function(viewer) {
    console.log("RTIViewerController._init:");
    if (typeof(RTI_LIGHTCONTROL_IN_VIEWCONTAINER) == "undefined") {
      RTI_LIGHTCONTROL_IN_VIEWCONTAINER = true;
    }
    if (typeof(RTI_LOCK_SCREENORIENTATION) == "undefined") {
      RTI_LOCK_SCREENORIENTATION = "NO_LOCK";
    }

    this._viewer = viewer;
    if (RTI_LIGHTCONTROL_IN_VIEWCONTAINER)
    this._mouseMode = 1;
    else
    this._mouseMode = 0;

    this._isMouseDown = false;
    this._lastMousePos = new THREE.Vector2();

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

    if (RTI_LOCK_SCREENORIENTATION != "NO_LOCK") {
      screen.lockOrientationUniversal = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
      if (screen.lockOrientationUniversal) {
        // alert("screen.lockOrientation");
        console.log(" has screen.lockOrientation");
        screen.lockOrientationUniversal("landscape-primary");
      }
      if (screen.orientation && screen.orientation.lock) {
        // alert("has screen.orientation.lock");
        console.log(" has screen.orientation.lock");
        screen.orientation.lock("landscape-primary");
      }
    }

    var self = this;

    this._viewer.getDomElement().addEventListener('touchmove', function(event) {
      // alert("touch move");
      event.preventDefault();
      if (event.targetTouches.length == 1) {
        var touch = event.changedTouches[0];
        if (self._isMouseDown) {
          var newMousePos = RTIUtils.normalizedMouseCoords(touch, self._viewer.getDomElement());
          if (self._mouseMode == 0) { // dragImage mode
            self._viewer.dragView(self._lastMousePos, newMousePos);
            self._lastMousePos = newMousePos;
          } else if (self._mouseMode == 1) { // setLightDir mode
            self.setLightDir(newMousePos);
          }
        }
      }
    }, false);

    this._viewer.getDomElement().addEventListener('touchstart', function(event) {
      // alert("touchstart");
      event.preventDefault();
      if (event.targetTouches.length == 1) {
        var touch = event.changedTouches[0];
        self._isMouseDown = true;
        self._viewer.getDomElement().focus();
        var newMousePos = RTIUtils.normalizedMouseCoords(touch, self._viewer.getDomElement());
        if (self._mouseMode == 0) { // dragViewmage mode
          self._lastMousePos = newMousePos;
        } else if (self._mouseMode == 1) { // setLightDir mode
          self.setLightDir(newMousePos);
        }
      }
    }, false);

    this._viewer.getDomElement().addEventListener('touchend', function(event) {
      // alert("touchend");
      event.preventDefault();
      if (event.targetTouches.length == 1) {
        self._isMouseDown = false;
      }
    }, false);
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
      this._isMouseDown = true;
      this._viewer.getDomElement().focus();
      var newMousePos = RTIUtils.normalizedMouseCoords(event_info, this._viewer.getDomElement());
      if (this._mouseMode == 0) { // dragViewmage mode
        this._lastMousePos = newMousePos;
      } else if (this._mouseMode == 1) { // setLightDir mode
        this.setLightDir(newMousePos);
      }
    }
  },

  onMouseMove: function( event_info ) {
    event_info.preventDefault();
    if (this._isMouseDown) {
      var newMousePos = RTIUtils.normalizedMouseCoords(event_info, this._viewer.getDomElement());
      if (this._mouseMode == 0) { // dragImage mode
        this._viewer.dragView(this._lastMousePos, newMousePos);
        this._lastMousePos = newMousePos;
      } else if (this._mouseMode == 1) { // setLightDir mode
        this.setLightDir(newMousePos);
      }
    }
  },

  onWheel: function(event_info) {
    event_info.preventDefault();
    var mousePos = RTIUtils.normalizedMouseCoords(event_info, this._viewer.getDomElement());
    this._viewer.zoomView(event_info.deltaY/40, mousePos); // MAGIC_VALUE
  },

  onKeyUp: function(event_info) {
    event_info.preventDefault();
    if (event_info.keyCode == 32) {
      this._mouseMode = 1 - this._mouseMode;
    }
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
    this._viewer.setDirectionalLightDirection(lightDir)
  }
} // RTIViewerController prototype

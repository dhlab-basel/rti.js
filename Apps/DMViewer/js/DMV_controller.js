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
 * Controls the interactions between the RTIViewer and the {@link DMViewerGUI}.
 *
 * <p>Provides an API (a set of public functions), which the gui may call on user events. The controller will then process these
 * requests, modify the model (viewer) accordingly, and notify the GUI about success/failure of the request. The focus of the
 * controller is on functionality, while delegating all aspects of design and layouting to the DMViewerGUI. This allows for
 * separation of functionality and presentation.
 * <p>
 * @class
 * @param {RTIViewer} viewer - The viewer to be controlled
 * @param {DMViewerGUI} gui - The GUI which enables the user to control the viewer
 */
function DMViewerController(viewer, gui) {
  this._viewer = null;
  this._gui = null;
  this._deviceOrientationCalls = 0;
  this._lastDeviceOrientationCall = 0;

  this._init(viewer, gui);
  return this;
} // DMViewerController

DMViewerController.prototype = {
  _init: function(viewer, gui) {
    this._viewer = viewer;
    this._gui = gui;
    this._deviceOrientationCalls = 0;
    this._lastDeviceOrientationCall = 0;

    this._initPTM();
    this._viewer.registerController(this);
    this._gui.registerController(this);
    this._testOrientationControlSupport();
  },

  _initPTM: function() {
    console.log("DMViewerController._init: initial vals:");

    var orientation = this._viewer.ptm.orientation;
    this._gui.updateExclusiveChoice("orientation", orientation);
    console.log(" orientation "+ orientation);

    if (this._viewer.ptm.getPTMType() == "LRGB_PTM") {
      this._gui.showLRGBParams(false);
    } else {
      this._gui.showLRGBParams(true);
    }

    var gChannel = this._viewer.ptm.gChannel;
    this._gui.updateExclusiveChoice("gChannel", gChannel);
    console.log(" gChannel "+ gChannel);

    var alpha = this._viewer.ptm.alpha;
    this._gui.updateRangeValue('Alpha', alpha);
    console.log(" alpha "+ alpha);

    var ks = this._viewer.ptm.ks;
    this._gui.updateRangeValue('Ks', ks);
    console.log(" ks "+ ks);

    var gFlat = this._viewer.ptm.flatGSpecular;
    this._gui.updateRangeValue('gFlat', gFlat);
    console.log(" gFlat "+ gFlat);

    var kd = this._viewer.ptm.kd;
    this._gui.updateRangeValue('Kd', kd);
    console.log(" kd "+ kd);

    var kRGB = this._viewer.ptm.kRGB;
    this._gui.updateRangeValue('KR', kRGB.x);
    this._gui.updateRangeValue('KG', kRGB.y);
    this._gui.updateRangeValue('KB', kRGB.z);
    console.log(" kRGB ", kRGB.x, kRGB.y, kRGB.z);

    var ambiLightCol = this._viewer.getAmbientLightColor();
    this._gui.updateRangeValue('R_ambient', ambiLightCol.x);
    this._gui.updateRangeValue('G_ambient', ambiLightCol.y);
    this._gui.updateRangeValue('B_ambient', ambiLightCol.z);
    console.log(" ambiLightCol ", ambiLightCol.x, ambiLightCol.y, ambiLightCol.z);

    var dirLightCol = this._viewer.getDirectionalLightColor();
    this._gui.updateRangeValue('R_directional', dirLightCol.x);
    this._gui.updateRangeValue('G_directional', dirLightCol.y);
    this._gui.updateRangeValue('B_directional', dirLightCol.z);
    console.log(" dirLightCol ", dirLightCol.x, dirLightCol.y, dirLightCol.z);

    var lightDir = this._viewer.getLightDir();
    this._gui.updateLightDirDisplay(lightDir);
    console.log(" lightDir ", lightDir.x, lightDir.y, lightDir.z);

    var settingsList = this._getSettingsList();
    this._gui.setSettingsList(settingsList);

    var currentShaderDescr = this._viewer.getShader().description;
    this._gui.setShader(currentShaderDescr);
    console.log(" shader " + currentShaderDescr);

    this._gui.setDebugMode(this._viewer.ptm.visualizeErrors);
    this._gui.setDebugIndex(this._viewer.ptm.debugIndex);
  },

  /**
   * To be called by the GUI on change requests of type RangeValue.
   * <p>Will set the desired value in the viewer if it is in the allowed range and update the gui accordingly.</p>
   *
   * @param {string} parameterId - The parameter for which a change is being requested
   * @param {float} value - The requested new value for the parameter.
   */
  onRangeValueChange: function(parameterId, value) {
    var range = this.getParameterRange(parameterId);
    if (value >= range.min && value <= range.max){
      this._changeValue(parameterId, value);
      this._gui.updateRangeValue(parameterId, value);
    } else {
      this._gui.updateRangeValue(parameterId, this.getParameterValue(parameterId));
    }
  },

  /**
   * To be called by the GUI on change requests of paramter 'gChannel'.
   * <p>Will set the desired value in the viewer if it is in the allowed range and update the gui accordingly.</p>
   *
   * @param {integer} gChannel - The index of the requested channel (Allowed values: 0 | 1 | 2 ).
   */
  onGChannelChange: function(gChannel) {
    this._viewer.ptm.gChannel = gChannel;
  },

  /**
   * To be called by the GUI on change requests of paramter 'orientation'.
   * <p>Will set the desired value in the viewer if it is in the allowed range and update the gui accordingly.</p>
   *
   * @param {integer} gChannel - The index of the requested rotation (Allowed values: 0 | 1 | 2 | 3  encoding for rotations of 0 | 90 | 180 | 270 degrees CCW).
   */
  onRotationChange: function(orientation){
    this._viewer.ptm.orientation = orientation;
  },

  /**
   * To be called by the GUI on requests to load a different webPTM.
   * <p>Will attempt to load the desired PTM in the viewer and update the gui accordingly.</p>
   *
   * @param {PTMReference} ptmReference - A PTMReference linking to the WebPTM which should be rendered in the viewer.
   */
  onPTMChange: function(ptmReference){
    if (this._viewer.loadPTM(ptmReference)){
      this._gui.reportActionSuccess("changePTM", true);
      this._initPTM();
    } else {
      this._gui.reportActionSuccess("changePTM", false);
    }
  },

  /**
   * To be called by the GUI on requests to load a different shader.
   * <p>Will attempt to load the desired shader in the viewer and update the gui accordingly.</p>
   *
   * @param {ShaderReference} shaderReference - A ShaderReference linking to the shader which should be used in the viewer.
   */
  onShaderChange: function(shaderReference){
    this._viewer.loadShader(shaderReference);
    this._gui.setShader(this._viewer.getShader().description);
  },

  /**
   * To be called by the GUI on requests to save the current viewer settings.
   * <p>Will attempt to save the current viewer settings in the viewer and update the gui accordingly.</p>
   *
   * @param {string} name - A name under whicch the current settings are to be saved.
   * @param {string} description - A description for the settings.
   * @returns {bool} - Success.
   */
  onSaveSettingsAction: function(name, description) {
    var settingsList = this._getSettingsList();
    if (settingsList.indexOf(name) < 0) {
      settingsList.push(name);
      var jsonList = JSON.stringify(settingsList);
      RTIUtils.setCookie("settingsList", jsonList, 30);

      var currentSettings = this._viewer.getSettings();
      currentSettings.name = name;
      currentSettings.description = description;
      var jsonSettings = JSON.stringify(currentSettings);
      RTIUtils.setCookie(name, jsonSettings, 30);

      settingsList = this._getSettingsList();
      this._gui.reportActionSuccess("saveSettings", true);
      this._gui.setSettingsList(settingsList);
    } else {
      this._gui.reportActionSuccess("saveSettings", false, "A setting with name: "+name+" already exists. Please choose another name.");
    }
  },

  /**
   * To be called by the GUI on requests to load a different set of viewer settings.
   * <p>Will attempt to load the desired viewer settings in the viewer and update the gui accordingly.</p>
   *
   * @param {string} name - The name of the settings to be loaded.
   * @returns {bool} - Success.
   */
  onLoadSettingsAction: function(name) {
    if (RTIUtils.hasCookie(name)) {
      var settings = JSON.parse(RTIUtils.getCookie(name));
      this._setSettings(settings);
      this._gui.reportActionSuccess("loadSettings", true);
    } else {
      this._gui.reportActionSuccess("loadSettings", false, "Could not load settings: "+name);
    }
  },

  /**
   * § on requests to reset the viewer settings.
   * <p>Will reset the viewer settings in the viewer and update the gui accordingly.</p>
   */
  onResetSettingsAction: function() {
    var settings = this._viewer.getInitialSettings();
    this._setSettings(settings);
  },

  /**
   * To be called by the GUI on requests to toggle the debug mode of the shaders.
   * <p>Will toggle the debug mode and update the gui accordingly.</p>
   */
  onDebugToggle: function(){
    if(this._viewer.ptm.visualizeErrors == 0) {
      this._viewer.ptm.visualizeErrors  = 1;
    } else {
      this._viewer.ptm.visualizeErrors  = 0;
    }
    this._gui.setDebugMode(this._viewer.ptm.visualizeErrors);
  },

  onDebugIndexChange: function(debugIndex){
    this._viewer.ptm.debugIndex  = debugIndex;
  },

  onEnableOrientationControl: function(enable) {
    this._viewer.enableOrientationControl(enable);
  },

  onEnableOrientationAmplify: function(enable) {
   this._viewer.enableOrientationAmplify(enable);
  },

/**
 * Returns the range of allowed values for the parameter with parameterId 'id'.
 * @param {string} id - The parmeterId of the desired parameter.
 * @returns {string} - A object of the form {min: min, max: max}.
 */
  getParameterRange: function(id) {
    if (id == "KRGB" || id == "KR" || id == "KG" || id == "KB")
      return { min: 0, max: 3};
    else if (id == "RGB_ambient" || id == "R_ambient" || id == "G_ambient" || id == "B_ambient")
      return { min: 0, max: 1};
    else if (id == "RGB_directional" || id == "R_directional" || id == "G_directional" || id == "B_directional")
      return { min: 0, max: 3};
    else if (id == "Kd" || id == "Ks")
      return { min: 0, max: 1};
    else if (id == "Alpha")
      return { min: 0, max: 150};
    else if (id == "gFlat")
      return { min: 0, max: 1};
  },

/**
 * Returns the current value of the parameter with parameterId 'id'.
 * @param {string} id - The parmeterId of the desired parameter.
 * @returns {float} - the current value of the desired parameter.
 */
  getParameterValue: function(id) {
    if (id == "KRGB")
    return this._viewer.ptm.kRGB;
    else if (id == "KR" )
    return this._viewer.ptm.kRGB.x;
    else if ( id == "KG" )
    return this._viewer.ptm.kRGB.y;
    else if ( id == "KB")
    return this._viewer.ptm.kRGB.z;

    else if (id == "RGB_ambient")
    return this._viewer.getAmbientLightColor();
    else if (id == "R_ambient" )
    return this._viewer.getAmbientLightColor().x;
    else if ( id == "G_ambient" )
    return this._viewer.getAmbientLightColor().y;
    else if ( id == "B_ambient")
    return this._viewer.getAmbientLightColor().z;

    else if (id == "RGB_directional")
    return this._viewer.getDirectionalLightColor();
    else if (id == "R_directional" )
    return this._viewer.getDirectionalLightColor().x;
    else if ( id == "G_directional" )
    return this._viewer.getDirectionalLightColor().y;
    else if ( id == "B_directional")
    return this._viewer.getDirectionalLightColor().z;

    else if (id == "Kd" )
    return this._viewer.ptm.kd;
    else if ( id == "Ks")
    return this._viewer.ptm.ks;
    else if (id == "Alpha")
    return this._viewer.ptm.alpha;
    else if (id == "gFlat")
    return this._viewer.ptm.flatGSpecular;
    else
    RTIError("received unknowm param id in DMViewerController.getParameterValue");
  },

  /**
   * To be called by the GUI on requests to change the light direction.
   * <p>Will change the light direction and update the gui accordingly.</p>
   *
   * @param {THREE.Vector2} mousePos2d - The mouse position in normalized device doordinates.
   */
  onLightDirChange: function(mousePos2d){
    var lightDir = new THREE.Vector3(mousePos2d.x, mousePos2d.y, 0);

    var sumSquares = lightDir.x*lightDir.x + lightDir.y*lightDir.y;
    if (sumSquares < 1) {
      lightDir.setZ(Math.sqrt(1 - sumSquares));
    } else {
      lightDir.setZ(0.0);
      lightDir.normalize();
    }
    this._viewer.setDirectionalLightDirection(lightDir)
    this._gui.updateLightDirDisplay(lightDir);
    // console.log(" lightDir ", lightDir.x, lightDir.y, lightDir.z);
  },

  onResize: function() {
    this._viewer.resize();
  },

  notifyLightDirChange: function(direction) {
    this._gui.updateLightDirDisplay(direction);
  },

  _testOrientationControlSupport: function() {
    this._gui.showOrientationToggle(false);
    this._deviceOrientationCalls = 0;
    this._lastDeviceOrientationCall = Date.now();
    var self = this;
    var adaptToOrientationControlSupport = function() {
        self._deviceOrientationCalls++;
        var now = Date.now();
        if (now-self._lastDeviceOrientationCall < 500 && self._deviceOrientationCalls > 1) {
          self._gui.showOrientationToggle(true);
          window.removeEventListener('deviceorientation', adaptToOrientationControlSupport );
        }
        self._lastDeviceOrientationCall = now;
    };
    if (window.DeviceOrientationEvent != null) {
      window.addEventListener('deviceorientation', adaptToOrientationControlSupport);
    }
  },

  _getSettingsList: function() {
    if (RTIUtils.hasCookie("settingsList")) {
      var settingsList = JSON.parse(RTIUtils.getCookie("settingsList"));
      return settingsList;
    } else {
      return [];
    }
  },

  _setSettings: function(settings) {
    var lightDir = new THREE.Vector3(settings.lightDir.x, settings.lightDir.y, settings.lightDir.z);
    this._viewer.setDirectionalLightDirection(lightDir)
    this._gui.updateLightDirDisplay(lightDir);

    this.onRangeValueChange('KR', settings.kRGB.x);
    this.onRangeValueChange('KG', settings.kRGB.y);
    this.onRangeValueChange('KB', settings.kRGB.z);

    this.onRangeValueChange('Kd', settings.kd);
    this.onRangeValueChange('Alpha', settings.alpha);
    this.onRangeValueChange('gFlat', settings.flatGSpecular);

    if (settings.PTMType == "LRGBG_PTM" && this._viewer.ptm.getPTMType() == "LRGBG_PTM") {
      this.onRangeValueChange('Ks', settings.ks);
      this._viewer.ptm.gChannel = settings.gChannel;
      this._gui.updateExclusiveChoice("gChannel", settings.gChannel);
    }
    this._viewer.ptm.orientation = settings.orientation;
    this._gui.updateExclusiveChoice("orientation", settings.orientation);

    this.onRangeValueChange('R_ambient', settings.ambientLightColor.x);
    this.onRangeValueChange('G_ambient', settings.ambientLightColor.y);
    this.onRangeValueChange('B_ambient', settings.ambientLightColor.z);

    this.onRangeValueChange('R_directional', settings.directionalLightColor.x);
    this.onRangeValueChange('G_directional', settings.directionalLightColor.y);
    this.onRangeValueChange('B_directional', settings.directionalLightColor.z);
  },

  _changeValue: function(parameterId, value) {
    switch (parameterId){
      case "KR":
      this._viewer.ptm.kRGB.setX(value);
      break;
      case "KG":
      this._viewer.ptm.kRGB.setY(value);
      break;
      case "KB":
      this._viewer.ptm.kRGB.setZ(value);
      break;
      case "Kd":
      this._viewer.ptm.kd = value;
      break;
      case "Ks":
      this._viewer.ptm.ks = value;
      break;
      case "Alpha":
      this._viewer.ptm.alpha = value;
      break;
      case "gFlat":
      this._viewer.ptm.flatGSpecular = value;
      break;
      case "R_ambient":
      var color = this._viewer.getAmbientLightColor().setX(value);
      this._viewer.setAmbientLightColor(color);
      break;
      case "G_ambient":
      var color = this._viewer.getAmbientLightColor().setY(value);
      this._viewer.setAmbientLightColor(color);
      break;
      case "B_ambient":
      var color = this._viewer.getAmbientLightColor().setZ(value);
      this._viewer.setAmbientLightColor(color);
      break;
      case "R_directional":
      var color = this._viewer.getDirectionalLightColor().setX(value);
      this._viewer.setDirectionalLightColor(color);
      break;
      case "G_directional":
      var color = this._viewer.getDirectionalLightColor().setY(value);
      this._viewer.setDirectionalLightColor(color);
      break;
      case "B_directional":
      var color = this._viewer.getDirectionalLightColor().setZ(value);
      this._viewer.setDirectionalLightColor(color);
      break;
      default:
      console.log("ERROR: unidentified parameterId: " +parameterId + " in DMViewerController.js: _changeValue()");
      break;
    }
 }
}; // DMViewerController prototype

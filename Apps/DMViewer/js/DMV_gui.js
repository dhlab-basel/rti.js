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
 * @constant {bool} DMV_SHOW_ADVANCED_CONTROLS - show advanced controls useful for debugging
 */

/**
 * Implements a graphical user interface in HTML which can be used together with {@link DMViewerController} to
 * control the rti.js RTIViewer from a web browser.
 *
 * <br><br>The GUI simply shows the state of model parameters and provides GUI-elements to interact with these parameters to the user.
 * <br>The GUI does not act directly on user events. The controller provides a set of functions to be called on user events.
 * The GUI will then call these functions upon triggering of events, allowing the controller to act on the events.
 * It is then the controllers responsibility to notify the GUI of any changes in the model.
 *
 * The controller needs to register itself with the gui by calling registerController(DMViewerController), before any events are processed.
 *
 * @class
 * @param {div} container - The div element where all GUI controls should be placed
 * @param {PTMReference[]} availablePTMs - A array of PTMReferences listing and linking to WebPTMs which may be requested by the user.
 * @param {ShaderReference[]} availableShaders - A array of ShaderReferences listing and linking to shaders which may be requested by the user.
 */
function DMViewerGUI(container, availablePTMs, availableShaders) {
  this._availablePTMs = null;
  this._availableShaders = null;
  this._controller = null;

  this._currentPTMIndex = -1;
  this._isMouseDown = false;
  this._eventsConnected = false;

  this._init(container, availablePTMs, availableShaders);
  return this;
} // DMViewerGUI

DMViewerGUI.prototype = {
  _init: function(container, availablePTMs, availableShaders) {
    if (typeof(DMV_SHOW_ADVANCED_CONTROLS) == "undefined") {
      DMV_SHOW_ADVANCED_CONTROLS = false;
    }
    this._availablePTMs = availablePTMs;
    this._availableShaders = availableShaders;

    this._currentPTMIndex = 0;
    this._isMouseDown = false;
    this._eventsConnected = false;

    this._createLightDirControls(container);
    this._createMainSettingsControls(container, availablePTMs, availableShaders);
    this._createLightColorControls(container, false, false);
    this._createPTMParamControls(container);
    this._createRadioForm(container, "Channel used for parameter 'g':", "gChannel", [ "1", "2", "3" ], !DMV_SHOW_ADVANCED_CONTROLS);
    this._createRadioForm(container, "Applied rotation (CCW):", "orientation", [ "0", "90", "180", "270" ], !DMV_SHOW_ADVANCED_CONTROLS);
    this._createDebugElements(container, !DMV_SHOW_ADVANCED_CONTROLS);
    this._createLogoSection(container);

    this.updateLightDirDisplay(new THREE.Vector3(0,0,1));

    // the gui is now set up, but no events are connected yet. They will be connected when the controller calls registerController(DMViewerController).
  },

  /**
   * Registers the {@link DMViewerController} for this GUI.
   * <p>All user events will be passed on to the controller.</p>
   *
   * @param {DMViewerController} controller - The controller
   */
  registerController: function(controller) {
    this.controller = controller;
    this._connectEvents();
  },

  _connectEvents: function() {
    if (!this._eventsConnected) {
      this._eventsConnected = true;
    } else {
      RTIError("already connected");
      return;
    }

    this._getToggle("Kd").onclick = this._onToggleClick.bind(this, "Kd");
    this._getToggle("Ks").onclick = this._onToggleClick.bind(this, "Ks");
    this._getToggle("gFlat").onclick = this._onToggleClick.bind(this, "gFlat");

    this.lightDirCanvas.addEventListener( 'mousedown', this._onMouseDown.bind(this) );
    this.lightDirCanvas.addEventListener( 'mousemove', this._onMouseMove.bind(this) );
    this.lightDirCanvas.addEventListener( 'mouseout', this._onMouseOut.bind(this) );
    this.lightDirCanvas.addEventListener( 'mouseup', this._onMouseUp.bind(this) );

    var rangeValues = [ "KRGB", "KR", "KG",  "KB", "Kd", "Ks", "Alpha", "gFlat",
                        "RGB_ambient", "R_ambient", "G_ambient",  "B_ambient",
                        "RGB_directional", "R_directional", "G_directional",  "B_directional"];

    for (var i = 0; i<rangeValues.length; i++) {
      var parameterId = rangeValues[i];
      this._getSlider(parameterId).onchange = this._onSliderValueChangeEvent.bind(this, parameterId);
      this._getDisplay(parameterId).onchange = this._onDisplayValueChangeEvent.bind(this, parameterId);
    }

    this._getSelector("ptm").onchange = this._onPTMSelectionEvent.bind(this);
    this._getSelector("shader").onchange = this._onShaderSelectionEvent.bind(this);

    document.getElementById("openSaveSettingsDialogButton").onclick = this._showSaveSettingsDialog.bind(this, true);
    document.getElementById("openLoadSettingsDialogButton").onclick = this._showLoadSettingsDialog.bind(this, true);

    document.getElementById("cancelLoadSettingsButton").onclick = this._showLoadSettingsDialog.bind(this, false);
    document.getElementById("cancelSaveSettingsButton").onclick = this._showSaveSettingsDialog.bind(this, false);

    document.getElementById("saveSettingsButton").onclick = this._onSaveSettingsEvent.bind(this);
    document.getElementById("resetSettingsButton").onclick = this._onResetSettingsEvent.bind(this);

    document.getElementById('debugModeButton').onclick = this._onToggleDebugModeEvent.bind(this);

    var radioInputs = this._getRadioInputs("orientation");
    for (var i=0; i<radioInputs.length; i++) {
      radioInputs[i].onclick = this._onExclusiveChoiceChangeEvent.bind(this, "orientation", i);
    }

    radioInputs = this._getRadioInputs("gChannel");
    for (var i=0; i<radioInputs.length; i++) {
      radioInputs[i].onclick = this._onExclusiveChoiceChangeEvent.bind(this, "gChannel", i);
    }

    document.getElementById('kRGBControlsButton').onclick = this._onToggleShowButtonEvent.bind(this, "kRGB");
    document.getElementById('ambientControlsButton').onclick = this._onToggleShowButtonEvent.bind(this, "ambient");
    document.getElementById('directionalControlsButton').onclick = this._onToggleShowButtonEvent.bind(this, "directional");

    document.getElementById('toggleOrientationControl').onclick = this._onToggleOrientationControlEvent.bind(this);
    document.getElementById('toggleOrientationAmplify').onclick = this._onToggleOrientationAmplifyEvent.bind(this);

    document.getElementById('hideControlContButton').onclick = this._onHideControlContEvent.bind(this);
    document.getElementById('showControlContButton').onclick = this._onShowControlContEvent.bind(this);
  },

  /**
   * Sets the view of the viewers debug mode.
   *
   * @param {int} mode - 0 for OFF, all other values for ON
   */
  setDebugMode: function(mode) {
    if (mode == 0) {
      document.getElementById('debugModeButton').classList.remove("switchButtonOn");
    } else {
      document.getElementById('debugModeButton').classList.add("switchButtonOn");
    }
  },

  /**
   * Updates the internal list of available viewer settings names.
   *
   * @param {string[]} settingsList - list of names of viewer settings.
   */
  setSettingsList: function(settingsList) {
    this._settingsList = settingsList;
  },

  /**
   * Notifies the GUI about success or failure of a previously initiated action.
   *
   * @param {string} actionId - identifies the action.
   * @param {bool} success - success or failure of action.
   * @param {string} message - (optional) human readable alert message
   */
  reportActionSuccess: function(actionId, success, message) {
    switch (actionId) {
      case "saveSettings":
        this._showSaveSettingsDialog(!success);
        break;
      case "loadSettings":
          this._showLoadSettingsDialog(!success);
        break;
      case "changePTM":
        this._onPTMSelectionResponse(success);
        break;
      default:
        RTIError("Unknown actionId in RTIViewerrGUI.reportActionSuccess");
        break;
    }
    if (message)
    alert(message);
  },

  /**
  * Updates the view of a RangeValue parameter.
  *
  * RangeValues parameters are numeric parameters associated with a allowed range,
  * typically implemented with a range slider.
   *
   * @param {string} parameterId - identifies the parameter.
   * @param {Number} value - the value of the paramter
   */
  updateRangeValue: function(parameterId, value) {
    this._updateSlider(parameterId, value);
    this._updateSliderDisplay(parameterId, value);
    if (parameterId == 'KR' || parameterId == 'KG' || parameterId == 'KB' ) {
      this._updateKRGBControls(value);
    } else if (parameterId == 'R_ambient' || parameterId == 'G_ambient' || parameterId == 'B_ambient' ) {
      this._updateRGBAmbientControls(value);
    } else if (parameterId == 'R_directional' || parameterId == 'G_directional' || parameterId == 'B_directional' ) {
      this._updateRGBDirectionalControls(value);
    } else if (parameterId == 'Kd' || parameterId == 'Ks' || parameterId == 'gFlat') {
      this._updateToggle(parameterId, value);
    }
  },

  /**
   * Updates the view of a ExclusiveChoice parameter.
   *
   * ExclusiveChoice parameters are parameters associated with a set of mutually exclusive options,
   * typically implemented with  a set of radio buttons.
   *
   * @param {string} parameterId - identifies the parameter.
   * @param {int} index - index value of the chosen option
   */
  updateExclusiveChoice: function(parameterId, index) {
    var radioButton = document.getElementById(parameterId+index);
    radioButton.checked = true;
  },

  /**
   * Updates the view visualizing the current light direction.
   *
   * @param {THREE.Vector3} lightDir - light direction.
   */
  updateLightDirDisplay: function(lightDir){
    var reorientedLPosX = lightDir.x;
    var reorientedLPosY = -lightDir.y;

    var c = this.lightDirCanvas;
    var ctx = c.getContext("2d");
    var size = c.getAttribute("width");
    var center = (size)/2;
    var displayPosX = size*(reorientedLPosX+1)/2;
    var displayPosY = size*(reorientedLPosY+1)/2;

    ctx.clearRect(0,0,c.width,c.height);
    if (lightDir.z >= 0)
      ctx.strokeStyle = "#CCCCCC";
    else
      ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(center,center,center,0,2*Math.PI);
    ctx.stroke();

    ctx.fillStyle = "#FFAA00";
    ctx.beginPath();
    ctx.arc(displayPosX,displayPosY,4,0,2*Math.PI);
    ctx.stroke();
    ctx.fill();
  },

  /**
   * Updates the view showing the description of the currently active shader.
   *
   * @param {string} description - identifies the shader.
   */
  setShader: function(description) {
    var select = this._getSelector("shader");
    var selectedIndex = -1;
    for (var i = 0; i<select.length; i++) {
      if (select.options[i].text == description) selectedIndex = i;
    }
    select.selectedIndex = selectedIndex;
  },

  /**
   * Shows or hides all views of parameters which are exclusive to LRGBG_PTMs.
   *
   * @param {bool} show - show / hide.
   */
  showLRGBParams: function(show) {
    if (show) {
      document.getElementById("divKs").classList.remove("hide");
      // document.getElementById("divAlpha").classList.remove("hide");
      document.getElementById("divgChannel").classList.remove("hide");
    } else {
      document.getElementById("divKs").classList.add("hide");
      // document.getElementById("divAlpha").classList.add("hide");
      document.getElementById("divgChannel").classList.add("hide");
    }
  },

  showOrientationToggle: function(show) {
    if (show)
      document.getElementById("orientationControlDiv").classList.remove("hide");
    else
      document.getElementById("orientationControlDiv").classList.add("hide");
  },

  _getSelector: function(parameterId) {
    return document.getElementById(parameterId+"Selector");
  },

  _getButton: function(parameterId) {
    return document.getElementById(parameterId+"Button");
  },

  _getDisplay: function(parameterId) {
    return document.getElementById("display"+parameterId);
  },

  _getSlider: function(parameterId) {
    return document.getElementById("slider"+parameterId);
  },

  _getRadioInputs: function(parameterId) {
    return document.getElementsByName(parameterId);
  },

  _getToggle: function(parameterId) {
    return document.getElementById("toggle"+parameterId);
  },

  _onMouseOut: function( event_info ) {
    event_info.preventDefault();
    this._isMouseDown = false;
  },

  _onMouseUp: function( event_info ) {
    event_info.preventDefault();
    this._isMouseDown = false;
  },

  _onMouseDown: function( event_info ) {
    event_info.preventDefault();
    if (event_info.button == 0) {
      this._isMouseDown = true;
      var newMousePos = RTIUtils.normalizedMouseCoords(event_info, this.lightDirCanvas);
      this.controller.onLightDirChange(newMousePos);
    }
  },

  _onMouseMove: function( event_info ) {
    event_info.preventDefault();
    if (this._isMouseDown) {
      var newMousePos = RTIUtils.normalizedMouseCoords(event_info, this.lightDirCanvas);
      this.controller.onLightDirChange(newMousePos);
    }
  },

  _onSaveSettingsEvent: function() {
    var name = document.getElementById("settingsNameInput").value;
    var description = document.getElementById("settingsDescrInput").value;
    if (name.trim().length > 0) {
      this.controller.onSaveSettingsAction(name.trim(), description);
    } else {
      alert("Name required.");
    }
  },

  _onLoadSettingsEvent: function(name) {
    this.controller.onLoadSettingsAction(name);
  },

  _onResetSettingsEvent: function() {
    this.controller.onResetSettingsAction();
  },

  _onToggleDebugModeEvent: function() {
    this.controller.onDebugToggle();
  },

  _onToggleClick: function(parameterId) {
    var checkbox =  this._getToggle(parameterId);
    var range = this.controller.getParameterRange(parameterId);
    if (checkbox.value == "on"){
      this.controller.onRangeValueChange(parameterId, range.min);
    } else {
      this.controller.onRangeValueChange(parameterId, (range.min+range.max)/2);
    }
  },

  _onToggleOrientationControlEvent: function() {
    var toggle = document.getElementById('toggleOrientationControl');
    if (toggle.value == "on") {
      this.controller.onEnableOrientationControl(false);
      toggle.value = "off";
      document.getElementById("labelOrientationAmplify").classList.add("inactive");
    } else {
      this.controller.onEnableOrientationControl(true);
      toggle.value = "on";
      document.getElementById("labelOrientationAmplify").classList.remove("inactive");
    }
  },

  _onToggleOrientationAmplifyEvent: function() {
    var toggle = document.getElementById('toggleOrientationAmplify');
    if (toggle.value == "on") {
      this.controller.onEnableOrientationAmplify(false);
      toggle.value = "off";
    } else {
      this.controller.onEnableOrientationAmplify(true);
      toggle.value = "on";
    }
  },

  _onExclusiveChoiceChangeEvent: function(parameterId, index) {
    if (parameterId == "orientation")
      this.controller.onRotationChange(index);
    else if (parameterId == "gChannel")
      this.controller.onGChannelChange(index);
  },

  _onPTMSelectionEvent: function() {
    var select = this._getSelector("ptm");
    var urls =  this._availablePTMs[select.selectedIndex];
    this.controller.onPTMChange(urls);
  },

  _onPTMSelectionResponse: function(success) {
    var select = this._getSelector("ptm");
    if (success) {
      this._currentPTMIndex = select.selectedIndex;
    } else {
      select.selectedIndex = this._currentPTMIndex;
    }
  },

  _onShaderSelectionEvent: function() {
    var select = this._getSelector("shader");
    var urls =  this._availableShaders[select.selectedIndex];
    this.controller.onShaderChange(urls);
  },

  _onSliderValueChangeEvent: function(parameterId) {
    var value = this._getSlider(parameterId).value;
    this._processRangeValueChangeEvent(parameterId, value);
  },

  _onDisplayValueChangeEvent: function(parameterId) {
    var value = parseFloat(this._getDisplay(parameterId).value);
    this._processRangeValueChangeEvent(parameterId, value);
  },

  _processRangeValueChangeEvent: function(parameterId, value) {
    if (parameterId == "KRGB") {
      this.controller.onRangeValueChange("KR", value);
      this.controller.onRangeValueChange("KG", value);
      this.controller.onRangeValueChange("KB", value);
    } else if (parameterId == "RGB_ambient") {
      this.controller.onRangeValueChange("R_ambient", value);
      this.controller.onRangeValueChange("G_ambient", value);
      this.controller.onRangeValueChange("B_ambient", value);
    } else if (parameterId == "RGB_directional") {
      this.controller.onRangeValueChange("R_directional", value);
      this.controller.onRangeValueChange("G_directional", value);
      this.controller.onRangeValueChange("B_directional", value);
    } else
    this.controller.onRangeValueChange( parameterId, value);
  },

  _updateKRGBControls: function(value) {
    if (value == this._getSlider("KR").value &&
    value == this._getSlider("KG").value &&
    value == this._getSlider("KB").value ) {
      this._updateSlider('KRGB', value);
      this._updateSliderDisplay('KRGB', value);
      document.getElementById("labelKRGB").classList.remove("inactive");;
    } else {
      this._updateSlider('KRGB', 0);
      this._updateSliderDisplay('KRGB', "");
      document.getElementById("labelKRGB").classList.add("inactive");
    }
  },

  _updateRGBAmbientControls: function(value) {
    if (value == this._getSlider("R_ambient").value &&
    value == this._getSlider("G_ambient").value &&
    value == this._getSlider("B_ambient").value ) {
      this._updateSlider('RGB_ambient', value);
      this._updateSliderDisplay('RGB_ambient', value);
      document.getElementById("labelRGB_ambient").classList.remove("inactive");;
    } else {
      this._updateSlider('RGB_ambient', 0);
      this._updateSliderDisplay('RGB_ambient', "");
      document.getElementById("labelRGB_ambient").classList.add("inactive");
    }
  },

  _updateRGBDirectionalControls: function(value) {
    if (value == this._getSlider("R_directional").value &&
    value == this._getSlider("G_directional").value &&
    value == this._getSlider("B_directional").value ) {
      this._updateSlider('RGB_directional', value);
      this._updateSliderDisplay('RGB_directional', value);
      document.getElementById("labelRGB_directional").classList.remove("inactive");;
    } else {
      this._updateSlider('RGB_directional', 0);
      this._updateSliderDisplay('RGB_directional', "");
      document.getElementById("labelRGB_directional").classList.add("inactive");
    }
  },

  _updateToggle: function(parameterId, value) {
    var element = this._getToggle(parameterId);
    if (value > 0) {
      element.checked = true;
      element.value = "on";
      if (parameterId == 'Ks' || parameterId == 'gFlat') {
        document.getElementById("sliderAlpha").value = this._lastAlpha;
        document.getElementById("displayAlpha").value = this._lastAlpha;
        document.getElementById("labelAlpha").classList.remove("inactive");
      }
    } else {
      element.checked = false;
      element.value = "off";
      if (parameterId == 'Ks' || parameterId == 'gFlat') {
        if (this._getSlider("Ks").value == 0 && this._getSlider("gFlat").value == 0) {
          this._lastAlpha = document.getElementById("sliderAlpha").value;
          document.getElementById("sliderAlpha").value = 0;
          document.getElementById("displayAlpha").value = "";
          document.getElementById("labelAlpha").classList.add("inactive");
        }
      }
    }
  },

  _updateSlider: function(parameterId, value) {
    var slider = document.getElementById("slider"+parameterId);
    slider.value = value;
  },

  _updateSliderDisplay: function(parameterId, value) {
    var display = document.getElementById("display"+parameterId);
    display.value = value;
  },

  _showSaveSettingsDialog: function(show) {
    if (show) {
      this._showLoadSettingsDialog(false);
      document.getElementById("openSaveSettingsDialogButton").classList.add("currentAction");
      document.getElementById("saveSettingsDialog").classList.remove("noDisplay");
    } else {
      document.getElementById("saveSettingsDialog").classList.add("noDisplay");
      document.getElementById("openSaveSettingsDialogButton").classList.remove("currentAction");
      document.getElementById("settingsNameInput").value = "";
      document.getElementById("settingsDescrInput").value = "";
    }
  },

  _showLoadSettingsDialog: function(show) {
    if (show) {
      this._showSaveSettingsDialog(false);
      document.getElementById("openLoadSettingsDialogButton").classList.add("currentAction");
      var settings = this._settingsList;
      if (settings.length < 1) {
        alert("Could not find any previously saved settings.\n\nSave your custom settings by clicking on 'save Settings'.\n\n(Settings are stored in cookies, make sure to have cookies enabled in your browser.)");
        document.getElementById("openLoadSettingsDialogButton").classList.remove("currentAction");
      } else {
        var ul = document.getElementById("settingsList");
        while (ul.firstChild) {
          ul.removeChild(ul.firstChild);
        }
        for(var i = 0; i < settings.length; i++) {
          var item = document.createElement('li');
          item.appendChild(document.createTextNode(settings[i]));
          item.onclick = this._onLoadSettingsEvent.bind(this, settings[i]);
          item.className = "clickable";
          ul.appendChild(item);
        }
        document.getElementById("loadSettingsDialog").classList.remove("noDisplay");
      }
    } else {
      document.getElementById("openLoadSettingsDialogButton").classList.remove("currentAction");
      document.getElementById("loadSettingsDialog").classList.add("noDisplay");
      var ul = document.getElementById("settingsList");
      while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
      }
    }
  },

  _onToggleShowButtonEvent: function(id) {
    document.getElementById(id+"Params").classList.toggle("hide");
    var button = document.getElementById(id+"ControlsButton");
    if (button.innerHTML == "+")
    button.innerHTML = "-";
    else
    button.innerHTML = "+";
  },

  _onHideControlContEvent: function() {
    var sheet = document.createElement('style')
    sheet.innerHTML = "#viewerCont { width: 97%; height: 100%; } #controlCont { width: 0%; height: 0%; } #hiddenControlCont { width: 3%; height: 100%; display: block; }";
    sheet.id = "hiddenControlContStyleSheet";
    document.body.appendChild(sheet);
    this.controller.onResize();
  },

  _onShowControlContEvent: function() {
    var sheet = document.getElementById("hiddenControlContStyleSheet");
    document.body.removeChild(sheet);
    this.controller.onResize();
  },

  _createLightDirControls: function(container) {
    var lightDirDiv = this._createElement("div", "lightDirCanvasDiv", "section");
    lightDirDiv.appendChild(this._createButton("hideControlContButton", "leftAlign", "-"));
    document.getElementById("hiddenControlCont").appendChild(this._createButton("showControlContButton", "", "+"));;
    var canvas = this._createElement("canvas", "lightDirCanvas");
    canvas.width = 140;
    canvas.height = 140;
    lightDirDiv.appendChild(this._createElement("div").appendChild(canvas));
    var orientationControlDiv = this._createElement("div", "orientationControlDiv", "section");
    var label = this._createLabel("labelOrientationControl", "", "disable motion control ", "toggleOrientationControl");
    var toggle = this._createInput("checkbox", "toggleOrientationControl", "", "on");
    toggle.name = "toggleOrientationControl";
    toggle.checked = true;
    orientationControlDiv.appendChild(toggle);
    orientationControlDiv.appendChild(label);
    orientationControlDiv.appendChild(this._createElement("br"));
    var labelAmplify = this._createLabel("labelOrientationAmplify", "", "amplify motion angles ", "toggleOrientationAmplify");
    var toggleAmplify = this._createInput("checkbox", "toggleOrientationAmplify", "", "off");
    toggleAmplify.name = "toggleOrientationAmplify";
    toggleAmplify.checked = false;
    orientationControlDiv.appendChild(toggleAmplify);
    orientationControlDiv.appendChild(labelAmplify);
    lightDirDiv.appendChild(orientationControlDiv);
    container.appendChild(lightDirDiv);
    this.lightDirCanvas = canvas;
  },

  _createMainSettingsControls: function(container, availablePTMs, availableShaders) {
    var mainSettingsDiv = this._createElement("div", "mainSettingsDiv", "section");
    this._createSelector(mainSettingsDiv, "ptm", availablePTMs);
    this._createSelector(mainSettingsDiv, "shader", availableShaders, !DMV_SHOW_ADVANCED_CONTROLS);
    this._createSettingStorageElements(mainSettingsDiv);
    mainSettingsDiv.appendChild(this._createElement("hr", "mainSettingsBottomSeparator", "bottomSeparator"));
    container.appendChild(mainSettingsDiv);
  },

  _createLightColorControls: function(container, hideAmbient, hideDirectional) {
    var lightControlDiv = this._createElement("div", "lightControlParams", "section");

    var titleDiv = this._createElement("div", "lightsControlTitle", "controlTitle");
    titleDiv.appendChild(document.createTextNode("Lights"));
    lightControlDiv.appendChild(titleDiv);

    lightControlDiv.appendChild(document.createTextNode("Directional Light"));
    var showDirectionalControlsButton = this._createButton("directionalControlsButton", "", "-");
    lightControlDiv.appendChild(showDirectionalControlsButton);
    var directionalParamDiv = this._createElement("div", "directionalParams", "section");
    this._createRangeValueInputs(directionalParamDiv, "RGB", "RGB_directional", 1.5, 0, 3, 0.01);
    this._createRangeValueInputs(directionalParamDiv, "R", "R_directional", 1.5, 0, 3, 0.01);
    this._createRangeValueInputs(directionalParamDiv, "G", "G_directional", 1.5, 0, 3, 0.01);
    this._createRangeValueInputs(directionalParamDiv, "B", "B_directional", 1.5, 0, 3, 0.01);
    lightControlDiv.appendChild(directionalParamDiv);
    if (hideDirectional)
    directionalParamDiv.classList.add("noDisplay");

    lightControlDiv.appendChild(this._createElement("br"));


    lightControlDiv.appendChild(document.createTextNode("Ambient Light"));
    var showAmbientControlsButton = this._createButton("ambientControlsButton", "", "+");
    lightControlDiv.appendChild(showAmbientControlsButton);
    var ambientParamsDiv = this._createElement("div", "ambientParams", "section");
    this._createRangeValueInputs(ambientParamsDiv, "RGB", "RGB_ambient", 1, 0, 1, 0.01);
    this._createRangeValueInputs(ambientParamsDiv, "R", "R_ambient", 1, 0, 1, 0.01);
    this._createRangeValueInputs(ambientParamsDiv, "G", "G_ambient", 1, 0, 1, 0.01);
    this._createRangeValueInputs(ambientParamsDiv, "B", "B_ambient", 1, 0, 1, 0.01);
    ambientParamsDiv.classList.add("hide");
    lightControlDiv.appendChild(ambientParamsDiv);
    if (hideAmbient)
    ambientParamsDiv.classList.add("noDisplay");

    lightControlDiv.appendChild(this._createElement("hr", "lightBottomSeparator", "bottomSeparator"));
    container.appendChild(lightControlDiv);
  },

  _createPTMParamControls: function(container) {
    var ptmParamDiv = this._createElement("div", "ptmParams", "section");

    var titleDiv = this._createElement("div", "ptmControlTitle", "controlTitle");
    titleDiv.appendChild(document.createTextNode("PTM"));
    ptmParamDiv.appendChild(titleDiv);

    ptmParamDiv.appendChild(document.createTextNode("Color Correction"));
    var showKRGBControlsButton = this._createButton("kRGBControlsButton", "", "+");
    ptmParamDiv.appendChild(showKRGBControlsButton);

    var kRGBParamDiv = this._createElement("div", "kRGBParams", "section");
    this._createRangeValueInputs(kRGBParamDiv, "RGB", "KRGB", 1, 0, 3, 0.01);
    this._createRangeValueInputs(kRGBParamDiv, "R", "KR", 1, 0, 3, 0.01);
    this._createRangeValueInputs(kRGBParamDiv, "G", "KG", 1, 0, 3, 0.01);
    this._createRangeValueInputs(kRGBParamDiv, "B", "KB", 1, 0, 3, 0.01);
    kRGBParamDiv.classList.add("hide");
    ptmParamDiv.appendChild(kRGBParamDiv);
    ptmParamDiv.appendChild(this._createElement("br"));
    ptmParamDiv.appendChild(this._createElement("br"));

    var ptmMaterialParamDiv = this._createElement("div", "ptmMaterialParams", "section");
    this._createRangeValueInputs(ptmParamDiv, "Diffuse reflection", "Kd", 0.4, 0, 1, 0.01, true);
    ptmParamDiv.appendChild(this._createElement("br"));
    this._createRangeValueInputs(ptmParamDiv, "Constant specularity", "gFlat", 0.5, 0, 1, 0.01, true);
    this._createRangeValueInputs(ptmParamDiv, "Specular reflection map", "Ks", 0.7, 0, 1, 0.01, true);
    this._createRangeValueInputs(ptmParamDiv, "Specular shininess", "Alpha", 75, 0, 150, 0.1);
    ptmParamDiv.appendChild(ptmMaterialParamDiv);

    ptmParamDiv.appendChild(this._createElement("hr", "ptmParamBottomSeparator", "bottomSeparator"));
    container.appendChild(ptmParamDiv);
  },

  _createRangeValueInputs: function(container, labelString, paramId, value, min, max, stepSize, hasToggle) {
    var label = this._createLabel("label"+paramId, "", labelString+" ", "slider"+paramId);
    var textInput = this._createTextInput("display"+paramId, "sliderDisplay", value, 3, 6);
    textInput.name = labelString;

    var slider = this._createInput("range", "slider"+paramId, "", value);
    slider.step = stepSize;
    slider.min = min;
    slider.max = max;

    var div = this._createElement("div", "div"+paramId);
    if (hasToggle) {
      var toggle = this._createInput("checkbox", "toggle"+paramId, "", "on");
      toggle.name = "toggle"+paramId;
      toggle.checked = true;
      div.appendChild(toggle);
    }
    div.appendChild(label);
    div.appendChild(textInput);
    div.appendChild(slider);
    container.appendChild(div);
  },

  _createSelector: function(container, parameterId, options, hidden) {
    var selector = this._createElement("select", parameterId+"Selector", "section");
    for (var i = 0; i < options.length; i++) {
      var option = document.createElement("option");
      option.value = i;
      option.text = options[i].description;
      selector.appendChild(option);
    }
    if (hidden)
    selector.classList.add("noDisplay");
    container.appendChild(document.createElement("div").appendChild(selector));
  },

  _createRadioForm: function(container, labelString, name, values, hidden) {
    var labelDiv = document.createElement("div");
    labelDiv.appendChild(document.createTextNode(labelString));

    var form = this._createElement("form", "div"+name, "section");
    form.appendChild(labelDiv);
    for (var i=0; i<values.length; i++) {
      var subDiv = document.createElement("div");
      subDiv.appendChild(document.createTextNode(values[i]));
      var input = this._createInput("radio",  name+i, "", values[i]);
      input.name = name;
      if (i == 0)
      input.checked = true;
      subDiv.appendChild(input);
      form.appendChild(subDiv);
    }
    if (hidden)
    form.classList.add("noDisplay");
    container.appendChild(form);
  },

  _createSettingStorageElements: function(container) {
    var openSaveSettingsDialogButton = this._createButton("openSaveSettingsDialogButton", "", "save Settings");
    var openLoadSettingsDialogButton = this._createButton("openLoadSettingsDialogButton", "", "load Settings");
    var resetSettingsButton = this._createButton("resetSettingsButton", "", "reset Settings");

    var div = this._createElement("div", "", "section");
    div.appendChild(openLoadSettingsDialogButton);
    div.appendChild(openSaveSettingsDialogButton);
    div.appendChild(resetSettingsButton);
    container.appendChild(div);

    var saveDialogDiv = this._createSaveSettingsDialog();
    container.appendChild(saveDialogDiv);

    var loadDialogDiv = this._createLoadSettingsDialog();
    container.appendChild(loadDialogDiv);
  },

  _createLoadSettingsDialog: function() {
    var cancelLoadSettingsButton = this._createButton("cancelLoadSettingsButton", "", "Cancel");

    var settingsList = this._createElement("ul", "settingsList");
    var loadDialogDiv = this._createElement("div", "loadSettingsDialog", "noDisplay dialog");
    loadDialogDiv.appendChild(settingsList);
    loadDialogDiv.appendChild(cancelLoadSettingsButton);
    return loadDialogDiv;
  },

  _createSaveSettingsDialog: function() {
    var settingsNameLabel = this._createLabel("labelSettingsNameInput", "", "Name: ", "settingsNameInput");
    var settingsNameInput = this._createTextInput("settingsNameInput", "", "", 30, 30);

    var settingsDescrLabel = this._createLabel("labelSettingsDescrInput", "", "Description: ", "settingsDescrInput");
    var settingsDescrInput = this._createElement("textArea", "settingsDescrInput");
    settingsDescrInput.cols = 30;
    settingsDescrInput.rows = 4;

    var cancelSaveSettingsButton = this._createButton("cancelSaveSettingsButton", "", "Cancel");
    var saveSettingsButton = this._createButton("saveSettingsButton", "", "Save");

    var nameDiv = document.createElement("div");
    nameDiv.appendChild(settingsNameLabel);
    nameDiv.appendChild(settingsNameInput);
    var descrDiv = document.createElement("div");
    descrDiv.appendChild(settingsDescrLabel);
    descrDiv.appendChild(settingsDescrInput);
    descrDiv.classList.add("hide");
    var buttonDiv = document.createElement("div");
    buttonDiv.appendChild(cancelSaveSettingsButton);
    buttonDiv.appendChild(saveSettingsButton);

    var saveDialogDiv = this._createElement("div", "saveSettingsDialog",  "noDisplay dialog");
    saveDialogDiv.appendChild(nameDiv);
    saveDialogDiv.appendChild(descrDiv);
    saveDialogDiv.appendChild(buttonDiv);
    return saveDialogDiv;
  },

  _createDebugElements: function(container, hidden) {
    var div = this._createElement("div", "", "section");
    var labelDiv = document.createElement("div");
    labelDiv.appendChild(document.createTextNode("Shader debug flag:"));
    div.appendChild(labelDiv);

    var button = this._createButton("debugModeButton", "", "Debug");
    div.appendChild(button);
    if (hidden)
      div.classList.add("noDisplay");
    div.appendChild(this._createElement("hr", "debugElementsBottomSeparator", "bottomSeparator"));
    container.appendChild(div);
  },

 _createLogoSection: function(container) {
   var div = this._createElement("div", "", "section");
   var textDiv = this._createElement("div", "", "centerText");
   textDiv.appendChild(document.createTextNode("© Digital Humanities Lab, University of Basel."));

   var linkDHLab = this._createElement("a", "", "");
   linkDHLab.href = "http://dhlab.unibas.ch";
   linkDHLab.target="_blank";
   var logoDHLab = this._createElement("img", "logoDHLab", "logo");
   logoDHLab.src = "res/dhlab-dark-s.png";
   linkDHLab.appendChild(logoDHLab);

   div.appendChild(textDiv);
   div.appendChild(linkDHLab);
   container.appendChild(div);
 },

  _createElement: function(tag, id, className) {
    var elem = document.createElement(tag);
    elem.id = id;
    if (className) { elem.className = className; }
    return elem;
  },

  _createButton: function(id, className,text) {
    var button = this._createElement("button", id, className);
    if (text) { button.appendChild(document.createTextNode(text)); }
    return button;
  },

  _createInput: function(type, id, className, value) {
    var input = this._createElement("input", id, className);
    input.type = type;
    if (value) { input.value = value; }
    return input;
  },

  _createTextInput: function(id, className, value, size, maxLength) {
    var input = this._createInput("text", id, className, value);
    if (size) { input.size = size; }
    if (maxLength) { input.maxLength = maxLength; }
    return input;
  },

  _createLabel: function(id, className, text, htmlFor) {
    var label = this._createElement("label", id, className);
    label.appendChild(document.createTextNode(text));
    label.htmlFor = htmlFor;
    return label;
  }
} // DMViewerGUI prototype

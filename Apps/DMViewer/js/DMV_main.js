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

/** @ignore */
RTI_SHOW_BSPHERES = false;
RTI_LIGHTCONTROL_IN_VIEWCONTAINER = false;

function initDMViewer() {

  var availablePTMsURL = "serverConfigs/availablePTMs.json";
  var availablePTMsReq = RTIUtils.sendSyncRequest(availablePTMsURL);
  try {
    var availablePTMs = JSON.parse(availablePTMsReq.responseText);
  } catch (err) {
     console.log("Unable to parse JSON from "+availablePTMsURL+":\n "+err.message);
     return;
  }

  var availableShadersURL = "serverConfigs/availableShaders.json";
  var availableShadersReq = RTIUtils.sendSyncRequest(availableShadersURL);
  try {
    var availableShaders = JSON.parse(availableShadersReq.responseText);
  } catch (err) {
    console.log("Unable to parse JSON from "+availableShadersURL+":\n "+err.message);
    return;
  }

  var initialPTMReference = availablePTMs[0];

  var viewerCont = document.getElementById('viewerCont');
  var viewer = new RTIViewer(initialPTMReference, viewerCont);

  var controlCont = document.getElementById('controlCont');
  var gui = new DMViewerGUI(controlCont, availablePTMs, availableShaders);

  var controller = new DMViewerController(viewer, gui);

  viewer.startRendering();
}

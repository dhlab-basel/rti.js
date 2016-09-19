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

function initMinimalViewer() {

  var referenceReq = new XMLHttpRequest();
  referenceReq.open("GET", "serverConfigs/examplePTMReference.json", false);
  referenceReq.send();

  var viewerCont = document.getElementById('viewerCont');
  var viewer = new RTIViewer(referenceReq.responseText, viewerCont);

  viewer.startRendering();
}

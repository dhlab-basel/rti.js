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
* Logs a message (and optional object) to the console.
* Logging can be turned on and off with the global constant {@link RTI_LOG}.
* @function RTILog
* @param {string} message - the message
* @param {Object} optionalObject - optional object
*/
function RTILog(message, optionalObject) {
  if (RTI_LOG) {
    if (arguments.length>1)
    console.log(message,optionalObject);
    else
    console.log(message);
  }
}

/**
* Reports a error message.
* Logging to the console can be turned on and off with the global constant {@link RTI_ERROR_LOG}.
* Alerting the user with a alert box can be turned on and off with the global constant {@link RTI_ERROR_ALERT}.
* @function RTIError
* @param {string} message - the message
*/
function RTIError(message) {
  if (RTI_ERROR_LOG)
    console.log("ERROR: "+message);
  if (RTI_ERROR_ALERT)
    alert("ERROR: "+message);
  return false;
}

/**
 * RTIUtils provides a set of utility functions.
 * All functions are static functions, no instance of RTIUtils needs to be created for calling the functions.
 * @class
 */
function RTIUtils() {
  return this;
}

/**
* Caluculates the intersection point between a line and plane in 3D.
* Returns undefined if no solutions exist, or infinitely many solutions exist.
 *
 * @param {THREE.Vector3} lPoint - a point on the line
 * @param {THREE.Vector3} lDir - the normalized direction of the line
 * @param {THREE.Vector3} pPoint - a point on the plane
 * @param {THREE.Vector3} pNormal - the normalized normal vector of the plane
 * @returns {THREE.Vector3 | undefined } - The intersection point or undefined if no/infinitely many solutions exist
 */
RTIUtils.intersect = function(lPoint, lDir, pPoint, pNormal) {
  var numerator = pPoint.clone().sub(lPoint).dot(pNormal);
  var denominator = lDir.clone().dot(pNormal);
  var zerotol = 0.0000000001; // MAGIC_VALUE
  if (Math.abs(denominator) < zerotol ) {
    return undefined;
  } else {
    var d = numerator/denominator;
    return lDir.clone().multiplyScalar(d).add(lPoint);
  }
}

/**
 * Caluculates the normalized device coordinates of a mouse position relative to a DOM element.
 *
 * @param {MouseEvent} mouseEvent - the mouseEvent
 * @param {DOMElement} domElement - the DOM element
 * @returns {THREE.Vector2} - mouse pos in normalized device ccordinates
 */
RTIUtils.normalizedMouseCoords = function(mouseEvent, domElement) {
  var offset = RTIUtils._getOffsetRect(domElement);
  var normalizedX = ( (mouseEvent.clientX - offset.left) / domElement.clientWidth ) * 2 - 1;
  var normalizedY = - ( (mouseEvent.clientY - offset.top) / domElement.clientHeight ) * 2 + 1;
  return new THREE.Vector2(normalizedX, normalizedY);
}

RTIUtils._getOffsetRect = function(elem) {
  var box = elem.getBoundingClientRect();
  var body = document.body;
  var docElem = document.documentElement;
  var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
  var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
  var clientTop = docElem.clientTop || body.clientTop || 0;
  var clientLeft = docElem.clientLeft || body.clientLeft || 0;
  var top  = box.top +  scrollTop - clientTop;
  var left = box.left + scrollLeft - clientLeft;
  return { top: Math.round(top), left: Math.round(left) };
}

/**
 * Splits a string into an array of lines. All lines are trimmed
 * and multiple whitespace characters replaced with a single whitespace.
 *
 * @param {string} text - a string
 * @returns {string[]} - array of lines
 */
RTIUtils.readLines = function(text){
  var splitted = text.split("\n");
  var lines = [];
  for (var i=0; i<splitted.length; ++i) {
    var line = splitted[i].replace( /\s\s+/g, ' ' );
    line = line.trim();
    if (line.length > 0)
      lines.push(line);
  }
  return lines;
}

/**
 * Executes a function asynchronously
 *
 * @param {function} fn - the function to be executed
 * @param {function} callback - (optional) callback to be called after function executed
 */
RTIUtils.runAsync = function(fn, callback) {
  setTimeout(function() {
    fn();
    if (callback) {
      callback();
    }
  }, 0);
}

/**
 * Sets a cookie.
 *
 * @param {string} cname - the name of the cookie.
 * @param {string} cvalue - the value of the cookie.
 * @param {Number} exdays - the number of days before the cookie gets deleted.
 */
RTIUtils.setCookie = function(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + "; " + expires;
}

/**
 * Reads a cookie.
 * Returns a empty string if the cookie could not be found.
 * @param {string} cname - the name of the cookie.
 * @returns {string} - the cookie value.
 */
RTIUtils.getCookie = function(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
  }
  return "";
}

/**
 * Checks if a cookie exists for a particular cookie name.
 * @param {string} cname - the name of the cookie.
 * @returns {bool} - true if cookie exists.
 */
RTIUtils.hasCookie = function(cname) {
  var cookie = RTIUtils.getCookie(cname);
  if (cookie.length > 0)
  return true;
  else
  return false;
}

/**
 * Checks if a string ends with a particular suffix.
 * @param {string} str - the string to check.
 * @param {string} suffix - the suffix to search for.
 * @returns {bool} - true if str ends with suffix.
 */
RTIUtils.endsWith = function(str, suffix) {
  return (str.indexOf(suffix, str.length - suffix.length) !== -1);
}

/**
 * Sends a synchronous XMLHttpRequest.
 * @param {string} url - the request URL.
 * @returns {XMLHttpRequest} - the request after send() was executed.
 */
RTIUtils.sendSyncRequest = function(url) {
  var request = new XMLHttpRequest();
  request.open("GET", url, false);
  request.send();
  return request;
}

/**
 * Requests, parses and returns a PTMConfig file (.json or .xml) from a provided URL.
 * @param {string} configURL - the URL
 * @returns {PTMConfig|bool} - the PTMConfig or false if the config file could not be retrieved or parsed.
 */
RTIUtils.getPTMConfiguration = function(configURL) {
  var infoXMLRequest = RTIUtils.sendSyncRequest(configURL);
  if (infoXMLRequest.status >= 400) {
      return RTIError("RTIUtils.getPTMConfiguration: Unable to load PTMConfiguration file from " + configURL);
  }

  success = true;
  var config;
  if (RTIUtils.endsWith(configURL, "xml")) {
    var doc = infoXMLRequest.responseXML;
    config = RTIUtils.parseXMLConfig(doc);
  } else { // config == "json"
    var doc = infoXMLRequest.responseText;
    try {
      config = JSON.parse(doc);
    } catch (err) {
      return RTIError("RTIUtils.getPTMConfiguration: Unable to parse JSON from " + configURL + ":\n "+err.message);
    }
  }
  return config;
}

/**
 * Parses a PTMConfig file in .xml format.
 * @param {Document} doc - the .xml document
 * @returns {PTMConfig|bool} - the PTMConfig or false if the config file could not be parsed.
 */
RTIUtils.parseXMLConfig = function(doc) {
  var content = doc.getElementsByTagName("Content")[0];
  var ptmType = content.getAttribute("type");

  if (!(ptmType == "LRGBG_PTM" || ptmType == "LRGB_PTM" )) {
    return RTIError("RTIUtils.parseXMLConfig: unsupported ptm format: " + ptmType);
  }

  var geometryType = "PLANE";

  var imageFormat = "jpg";
  var val = parseInt(doc.getElementsByTagName("MultiRes")[0].getAttribute("format"));
  if (!isNaN(val))
  if (val == 1)
  imageFormat = "png";

  var scale = doc.getElementsByTagName("Scale")[0];
  var size = doc.getElementsByTagName("Size")[0];
  var bias = doc.getElementsByTagName("Bias")[0];

  var contentWidth = parseInt(size.getAttribute("width"));
  var contentHeight = parseInt(size.getAttribute("height"));
  var expectedNumberCoeffs = 9; // LRGBG_PTM
  if (ptmType == "LRGB_PTM") {
    expectedNumberCoeffs = 6;
  }
  var numberCoeffs = parseInt(size.getAttribute("coefficients"));
  if (numberCoeffs != expectedNumberCoeffs) {
    return RTIError("RTIUtils.parseXMLConfig: invalid info.xml: attribute 'coefficients' of tag 'Size' must be "+expectedNumberCoeffs+" for type"+ptmType);
  }

  var tokens = scale.childNodes[0].nodeValue.split(" ");
  if (tokens.length < numberCoeffs) {
    return RTIError("RTIUtils.parseXMLConfig: invalid info.xml: number of scale coefficients must be "+expectedNumberCoeffs+" for type"+ptmType);
  }
  var scale = [];
  for (var j = 0; j < numberCoeffs; j++ )
  scale[j] = parseFloat(tokens[j]);

  tokens = bias.childNodes[0].nodeValue.split(" ");
  if (tokens.length < numberCoeffs) {
    return RTIError("RTIUtils.parseXMLConfig: invalid info.xml: number of bias coefficients must be "+expectedNumberCoeffs+" for type"+ptmType);
  }
  var bias = [];
  for (var j = 0; j < numberCoeffs; j++ )
  bias[j] = parseFloat(tokens[j]);

  var orientation = 0;
  var orientationTag = doc.getElementsByTagName("Orientation")[0];
  if (orientationTag) {
    var orientation = parseInt(orientationTag.textContent);
    if (orientation >= 0 && orientation < 4) {
      orientation = orientation;
    }
  }

  var treeTag = doc.getElementsByTagName("Tree")[0];

  var lines = RTIUtils.readLines(treeTag.textContent);
  var n = lines.length;

  var multiresStrategyType = "IMAGE_TREE";

  if (n<3) return false;

  tokens = lines[0].split(" ");
  if (tokens.length < 2) return  false;
  var nodesCount = parseInt(tokens[0]);
  if (nodesCount <= 0) return  false;

  tokens = lines[1].split(" ");
  if (tokens.length < 1) return  false;
  var tileSizeWidth = parseInt(tokens[0]);
  if (tileSizeWidth <= 0) return false;

  var tileSizeHeight = tileSizeWidth;

  tokens = lines[2].split(" ");
  if (tokens.length < 2) return false;
  var maxWidth = parseFloat(tokens[0]);
  var maxHeight = parseFloat(tokens[1]);

  var config = {
    "PTM" : {
     "type" : ptmType,
     "maxResolution" : { "w" : maxWidth, "h" : maxHeight },
     "contentSize" : { "w" : contentWidth, "h" : contentHeight },
     "scale" : scale,
     "bias" : bias,
     "orientation" : orientation,
     "imageFormat" : imageFormat
     },

    "Geometry" : {
     "type" : geometryType
     },

    "MultiresStrategy" : {
     "type" : multiresStrategyType,
     "tileSize" : { "w" : tileSizeWidth, "h" : tileSizeHeight }
     }
  };
  return config;
}

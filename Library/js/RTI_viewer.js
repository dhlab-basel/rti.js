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
 * @constant {bool} RTI_LOG - print log messages made with RTILog() to console
 * @default false
*/
/**
 * @constant {bool} RTI_ERROR_LOG - print error messages made with RTIError() to
 *  console
 * @default true
*/
/**
 * @constant {bool} RTI_ERROR_ALERT - alert the user on error messages made with
 *  RTIError()
 * @default true
*/
/**
 * @constant {bool} RTI_LIGHTCONTROL_IN_VIEWCONTAINER - enable toggling between
 *  dragging and light direction control in view container
 * @default true
*/
/**
 * @constant {bool} RTI_SHOW_BSPHERES - render bounding spheres of individual
 *  tiles for debugging
 * @default false
*/

RTI_LOG = false;
RTI_ERROR_LOG = true;
RTI_ERROR_ALERT = true;

/**
 * Allows the rendering of PTMs in WebPTM format in a web browser.
 *
 * @class
 * @param {PTMReference} ptmReference - A PTMReference linking to the WebPTM
 *  which should be rendered on startup.
 * @param {div} container - The div element where the viewer's WebGL canvas
 *  should be placed.
 *
 * @property {PTM} ptm - the currently displayed ptm
*/
function RTIViewer(ptmReference, container) {
  this.ptm = null;

  this._lightDir = null;
  this._directionalLightColor = null;
  this._directionalLight = null;
  this._ambientLightColor = null;
  this._ambientLight = null;

  this.H = null;

  this._container = null;
  this._scene = null;
  this._camera = null;
  this._renderer = null;
  this._sceneMesh = null;
  this._raycaster = null;
  this._internalController = null;
  this._externalController = null;

  this._rendering = false;

  this._init(ptmReference, container);
  return this;
} // RTIViewer

RTIViewer.prototype = {
  _init: function(ptmReference, container) {
    if (typeof(ptmReference) === 'string') {
      ptmReference = JSON.parse(ptmReference);
    }

    this._container = container;
    var width = container.clientWidth;
    var height = container.clientHeight;

    var fov = 45;
    var aspect = width / height;
    var near = 0.1;
    var far = 1000;

    this._raycaster = new THREE.Raycaster();

    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

    this._scene.add(this._camera);
    this._camera.position.set(0,0,5);
    this._camera.lookAt(this._scene.position);

    this._renderer =  new THREE.WebGLRenderer();
    this._renderer.setSize( width, height );
    container.appendChild( this._renderer.domElement );

    this._H = new THREE.Vector3();

    this._lightDir = new THREE.Vector3(0.0, 0.0, 1.0);
    this._directionalLightColor = new THREE.Vector3( 1.5, 1.5, 1.5 );
    this._directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    this.setDirectionalLightDirection(this._lightDir);
    this.setDirectionalLightColor(this._directionalLightColor);
    this._scene.add( this._directionalLight );

    this._ambientLightColor = new THREE.Vector3(0.0, 0.0, 0.0);
    this._ambientLight = new THREE.AmbientLight(0xffffff);
    this.setAmbientLightColor(this._ambientLightColor);
    this._scene.add(this._ambientLight);

    this.ptm = new PTM(ptmReference);

    this._scene.add(this.ptm.renderObject);
    this._initSceneMesh(ptmReference);
    this._initialSettings = this.getSettings();
    this._requestTextures();
    this._internalController = new RTIViewerController(this);
    this._rendering = false;
  },

/**
 * Loads a new WebPTM.
 *
 * @param {PTMReference} ptmReference - A PTMReference linking to the WebPTM
 *  which should be loaded.
 */
  loadPTM: function(ptmReference) {
    var newPTM = new PTM(ptmReference);
    if (!newPTM.initialized) {
      newPTM.dispose();
      return false;
    }

    if (this.ptm) {
      this._scene.remove(this.ptm.renderObject);
      this.ptm.dispose();
    }

    if (this._sceneMesh) {
      this._scene.remove(this._sceneMesh);
      this._sceneMesh.material.dispose();
      this._sceneMesh.geometry.dispose();
      this._sceneMesh = null;
    }

    this.ptm = newPTM;
    this._scene.add(this.ptm.renderObject);
    this._initSceneMesh(ptmReference);

    this.setDirectionalLightDirection(new THREE.Vector3(0.0, 0.0, 0.1));
    this.setDirectionalLightColor(new THREE.Vector3(  1.5, 1.5, 1.5 ));
    this.setAmbientLightColor(new THREE.Vector3(0.0, 0.0, 0.0));

    this._initialSettings = this.getSettings();

    this.resetCamera();
    return true;
  },

/**
 * Loads a different shader.
 *
 * @param {ShaderReference} shaderReference - A ShaderReference linking to the
 *  shader which should be loaded.
 */
 loadShader: function(shaderReference) {
    return this.ptm.loadShader(shaderReference);
  },

  /**
 * Returns the ShaderReference for the currently used shader.
 *
 * @returns {ShaderReference}
 */
 getShader: function() {
    return this.ptm.getShaderRef();
  },

  startRendering: function() {
    if (!this._rendering){
      this._rendering = true;
      this._animate();
    } else {
      console.log("WARNING: rendering loop already running.");
    }
  },

  stopRendering: function() {
    this._rendering = false;
  },

/**
 * Start the animation loop.
 */
  _animate: function()
  {
    if (!this._rendering)
      return;

    requestAnimationFrame( this._animate.bind(this) );

    var screenRes = new THREE.Vector2(this._renderer.domElement.clientWidth, this._renderer.domElement.clientHeight);
    this.ptm.updateTiles(screenRes, this._camera);

    this.ptm.renderUpdate(this._lightDir, this._H, this._directionalLightColor, this._ambientLightColor);

    this._renderer.render( this._scene, this._camera );
  },

/**
 * To be called on window resize events.
 */
  resize: function() {
    var viewerWidth = this._container.clientWidth;
    var viewerHeight = this._container.clientHeight;
    this._renderer.setSize(viewerWidth, viewerHeight);
    this._camera.aspect = viewerWidth / viewerHeight;
    this._camera.updateProjectionMatrix();
    this._requestTextures();
  },

/**
 * Drag the viewport.
 *
 * @param {THREE.Vector2} lastPos2d - Normalized mouse position on screen on
 *  start of dragging operation.
 * @param {THREE.Vector2} currentPos2 - Normalized mouse position on screen
 *  after dragging operation.
 */
  dragView: function(lastPos2d, currentPos2) {
    this._raycaster.setFromCamera( lastPos2d, this._camera );
    var intersectLast = this._raycaster.intersectObject( this.ptm.getMesh() );

    if (intersectLast[0]) {
    // this._raycaster.setFromCamera( currentPos2, this._camera );
    var camPos = this._camera.position;
    var lDir = new THREE.Vector3(currentPos2.x, currentPos2.y, 0.5).unproject(this._camera).sub(camPos).normalize();
    var intersectCurrent = RTIUtils.intersect(camPos, lDir, intersectLast[0].point, new THREE.Vector3(0,0,-1));

    if (intersectCurrent && intersectLast[0]) {
      var dist = intersectCurrent.clone().sub(intersectLast[0].point);
      this._camera.position.set(camPos.x - dist.x, camPos.y -  dist.y, camPos.z);
      this._requestTextures();
    }
    }
  },

/**
 * Zooms the viewport centered around a mouse position.
 *
 * @param {float} zoomFactor - Amount to zoom. (Unitless number, usually the
 *  magnitude of a mouse wheel event)
 * @param {THREE.Vector2} mousePos2d - Normalized mouse position on screen.
 *  Center of zooming operation.
 */
  zoomView: function(zoomFactor, mousePos2d) {
    if (Math.abs(zoomFactor) >= 1) {
      zoomFactor = Math.sign(zoomFactor)*0.1;
    }
    this._raycaster.setFromCamera( mousePos2d, this._camera );
    var intersect = this._raycaster.intersectObject( this.ptm.getMesh() );
    if (intersect[0]) {
      var viewLine = intersect[0].point.clone().sub(this._camera.position);
      var newDist = (1-zoomFactor)*viewLine.length();
      if (newDist > 3*this._camera.near && newDist < 100) { // MAGIC_VALUE
        this._camera.position.addScaledVector(viewLine, zoomFactor);
        this._requestTextures();
      }
    }
  },

/**
 * Reset the camera to it's initial position.
 */
  resetCamera: function() {
    this._camera.position.set(0,0,5);
    this._requestTextures();
  },

  /**
   * Set the color of the directional light source.
   * @param {THREE.Vector3} color - The color of the directional light.
   */
  setDirectionalLightColor: function(color) {
    this._directionalLightColor = color;
    var dirLightColor = color.clone().normalize();
    this._directionalLight.color.setRGB(dirLightColor.x, dirLightColor.y, dirLightColor.z);
    this._directionalLight.intensity = Math.min(color.length(), 1.0);
  },

  /**
   * Set the direction of the directional light source.
   * @param {THREE.Vector3} direction - The direction of the directional light.
   */
  setDirectionalLightDirection: function(direction) {
    this._lightDir.set(direction.x, direction.y, direction.z);
    this._directionalLight.position.set(direction.x, direction.y, direction.z);
    this._updateH();
    if (this._externalController) {
      this._externalController.notifyLightDirChange(direction);
    }
  },

  /**
   * Set the color of the ambient light source.
   * @param {THREE.Vector3} color - The color of the ambient light.
   */
  setAmbientLightColor: function(color) {
    this._ambientLightColor.set(color.x, color.y, color.z);
    this._ambientLight.color.setRGB(color.x, color.y, color.z);
  },

/**
 * Returns the initial settings of the current PTM.
 * @returns {string} - initial settings as JSON string.
 */
  getInitialSettings: function() {
    return this._initialSettings;
  },

/**
 * Returns the current settings of the viewer and the current PTM.
 * @returns {ViewerSettings} - the current settings.
 */
  getSettings: function() {
    var settings = {
      PTMType : this.ptm.getPTMType(),
      ambientLightColor : this._ambientLightColor.clone(),
      directionalLightColor : this._directionalLightColor.clone(),
      lightDir : this._lightDir.clone(),
      kRGB : this.ptm.kRGB.clone(),
      kd : this.ptm.kd,
      alpha: this.ptm.alpha,
      flatGSpecular: this.ptm.flatGSpecular,
      orientation : this.ptm.orientation
    }
    if (this.ptm.getPTMType() == "LRGBG_PTM") {
      settings.ks = this.ptm.ks,
      settings.gChannel = this.ptm.gChannel;
    }
    return settings;
  },

/**
 * Returns the direction of the directional light.
 * @returns {THREE.Vector3} - directional light direction.
 */
  getLightDir: function() {
    return this._lightDir.clone();
  },

  /**
 * Returns the color of the ambient light.
 * @returns {THREE.Vector3} - color.
 */
  getAmbientLightColor: function() {
    return this._ambientLightColor.clone();
  },

  /**
 * Returns the color of the directional light.
 * @returns {THREE.Vector3} - color.
 */
  getDirectionalLightColor: function() {
    return this._directionalLightColor.clone();
  },

  getDomElement: function() {
    return this._renderer.domElement;
  },

  registerController: function(controller) {
    this._externalController = controller;
  },

  _requestTextures: function() {
    // RTILog("RTIViewer._requestTextures");
    this._scene.updateMatrixWorld();
    this._camera.updateMatrixWorld();
    this._camera.matrixWorldInverse.getInverse( this._camera.matrixWorld );

    var screenRes = new THREE.Vector2(this._renderer.domElement.clientWidth, this._renderer.domElement.clientHeight);
    this.ptm.requestTextures(screenRes, this._camera);
  },

  _updateH: function() {
    var ldir = this._lightDir.clone().normalize();
    var vdir = new THREE.Vector3(0, 0, 1.0);
    this._H.addVectors(ldir,vdir).normalize();
  },

  _initSceneMesh: function(ptmReference) {
    if (ptmReference.sceneMeshURL) {
      var loader = new THREE.JSONLoader();
      var self = this;
      loader.load(
        ptmReference.sceneMeshURL,
        function(geometry) {
          self._sceneMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
          // self.sceneMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ wireframe: true }));
          // account for rotated corrdinated system vs blender
          self._sceneMesh.rotation.x = 2*Math.PI/2;
          self._scene.add(self._sceneMesh);
          // make sure ptm is always visible (no z-fighting) by not having scene objects and ptm in the exact same plane
          var pos = self._sceneMesh.position;
          self._sceneMesh.position.set(pos.x, pos.y, pos.z - 0.2); // MAGIC_VALUE
        },
        function (request) { console.log("loading sceneMesh ..."); },
        function () { RTIError("RTIViewer._initSceneMesh: Unable to load sceneMesh from "+ptmReference.sceneMeshURL); }
      );
    }
  }
}; // RTIViewer prototype

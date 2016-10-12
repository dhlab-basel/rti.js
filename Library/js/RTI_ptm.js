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
 * Pepresents a WebPTM. Holds rendering parameters, a multiresolution strategy
 * and a geometry on which the PTM will be rendered.
 *
 * @class
 * @param {PTMReference} ptmReference - A PTMReference linking to the WebPTM
 *  data which should be rendered.
 *
 * @property {THREE.Vector3} kRGB - scaling factor color (componentwise).
 * @property {float} kd -  scaling factor diffuse term.
 * @property {float} flatGSpecular - constant specularity.
 * @property {float} ks - scaling factor LRGBG specularity map.
 * @property {float} alpha - exponent specular term.
 * @property {int} gChannel - index for RGB-channel of specularity map.
 * @property {float} scale - scaling factor LRGB coefficients.
 * @property {float} bias - bias LRGB coefficients.
 * @property {float} scaleSpecular - scaling factor LRGBG coefficients.
 * @property {float} biasSpecular - bias LRGBG coefficients.
 * @property {int} orientation - index rotation PTM display vs capturing.
 * @property {THREE.Vector2} mirror - index mirror PTM display vs capturing.
 * @property {int} debugMode - flag debugMode shader.
 *
 */
function PTM(ptmReference) {
  this.kRGB = null;
  this.kd = 0;
  this.flatGSpecular = 0;
  this.ks = 0;
  this.alpha = 0;
  this.gChannel = 0;
  this.scale = [];
  this.bias = [];
  this.scaleSpecular = [];
  this.biasSpecular = [];
  this.orientation = 0;
  this.mirror = null;
  this.debugMode = 0;

  this._ptmType = "";
  this._geometryType = "";
  this._ptmContentWidth = 0;
  this._ptmContentHeight = 0;
  this._numberCoeffs = 0;

  this.renderObject = null;

  this._multiresTree = null;
  this._activeTiles = [];

  this._vShader = null;
  this._fShader = null;

  this.initialized = this._load(ptmReference);
  return this;
} // PTM

PTM.prototype = {
  _load: function(ptmReference) {
   if (typeof(RTI_SHOW_BSPHERES) == "undefined") {
      RTI_SHOW_BSPHERES = false;
    }

    var config;
    if (ptmReference.config) {
      config = ptmReference.config;
      console.log("PTM.load: config embedded in PTMReference");
    } else {
      config = RTIUtils.getPTMConfiguration(ptmReference.configURL);
      console.log("PTM.load: configURL: "+ ptmReference.configURL);
      if (!config)
        return false;
    }

    if (!this._applyConfig(config))
      return false;

    this.mirror = new THREE.Vector2(0, 0);

    if (!this._loadShader(ptmReference.shaderReference))
      return false;

    this._multiresTree = new MultiresTree(config, ptmReference.imgURLPrefixes, this, 7.5); // MAGIC_VALUE

    this.debugMode = 0;
    this.kRGB = new THREE.Vector3( 1, 1, 1 );
    this.kd = 0.4;
    this.ks = 0.0;
    this.alpha = 75;
    this.flatGSpecular = 0;

    if (this._ptmType == "LRGBG_PTM") {
      this.ks = 0.7;
      this.gChannel = 2;
    }

    this.renderObject = new THREE.Object3D();

    return true;
  },

/**
 * Free all resources attached to the PTM.
 */
  dispose: function() {
    this._removeActiveTiles();
    if (this._multiresTree)
    this._multiresTree.dispose();
    this._multiresTree = null;
  },

/**
 * Updates the active tiles of the PTM to account for the current viewport
 * defined by a camera and a screen resolution.
 *
 * @param {THREE.Vector2} screenRes - The current screen resolution
 * @param {THREE.Camera} camera - The current camera defining the viewport.
 */
  updateTiles: function(screenRes, camera) {
    this._removeActiveTiles();
    this._activeTiles = this._multiresTree.getAvailableTiles(screenRes, camera);
    this._addActiveTiles();
  },

/**
 * Updates the rendering paramters of the PTM by passing them to the shader.
 *
 * @param {THREE.Vector3} lDir - The current light direction
 */
  renderUpdate: function(lDir, H, directionalLightCol, ambientLightCol){
    for (var t = 0; t< this._activeTiles.length; t++){
        if (!this._activeTiles[t].loadError && this._activeTiles[t].hasContent) {
        this._activeTiles[t].material.uniforms.debugMode.value = this.debugMode;
        this._activeTiles[t].material.uniforms.kRGB.value = this.kRGB;
        this._activeTiles[t].material.uniforms.kd.value = this.kd;
        this._activeTiles[t].material.uniforms.alpha.value = this.alpha;
        this._activeTiles[t].material.uniforms.flatGSpecular.value = this.flatGSpecular;

        this._activeTiles[t].material.uniforms.orientation.value = this.orientation;
        this._activeTiles[t].material.uniforms.mirror.value = this.mirror;

        this._activeTiles[t].material.uniforms.lDir.value = lDir;
        this._activeTiles[t].material.uniforms.H.value = H;
        this._activeTiles[t].material.uniforms.ambientLightCol.value = ambientLightCol;
        this._activeTiles[t].material.uniforms.directionalLightCol.value = directionalLightCol;

        if (this._ptmType == "LRGBG_PTM") {
          this._activeTiles[t].material.uniforms.ks.value = this.ks;
          this._activeTiles[t].material.uniforms.gChannel.value = this.gChannel;
        }
      }
    }
  },

/**
 * Requests all unloaded tiles necessary for the current viewport defined by a
 * camera and a screen resolution.
 *
 * @param {THREE.Vector2} screenRes - The current screen resolution
 * @param {THREE.Camera} camera - The current camera defining the viewport.
 */
  requestTextures: function(screenRes, camera){
    this._multiresTree.requestTextures(screenRes, camera);
  },

/**
 * Returns a mesh representing the PTM in the scene.
 * The returned mesh should only be used for geometric computations such as
 * picking or visibility checks.
 * The returned mesh is usually not the mesh used for actual rendering.
 * @returns {THREE.Mesh} - a mesh representing the PTM in the scene.
 */
  getMesh: function() {
    return this._multiresTree.getMesh();
  },

/**
 * Loads a different shader.
 *
 * @param {ShaderReference} shaderReference - A ShaderReference linking to the
 * shader which should be loaded.
 */
  loadShader: function(shaderReference) {
    this._removeActiveTiles();
    if (!this._loadShader(shaderReference)) {
      return false;
    } else {
      this._multiresTree.updateShaders(this._vShader, this._fShader);
      this._addActiveTiles();
      return true;
    }
  },

/**
 * Returns the ShaderReference for the currently used shader.
 *
 * @returns {ShaderReference}
 */
 getShaderRef: function() {
    return this._currentShaderRef;
  },

/**
 * Returns the shader source for the currently used vertex shader.
 *
 * @returns {string}
 */
 getVShader: function() {
    return this._vShader;
  },

/**
 * Returns the shader source for the currently used fragment shader.
 *
 * @returns {string}
 */
 getFShader: function() {
    return this._fShader;
  },

/**
 * Returns the PTM type.
 *
 * @returns {string}
 */
  getPTMType: function() {
    return this._ptmType;
  },

  /**
 * Returns the PTM type.
 *
 * @returns {string}
 */
  getGeometryType: function() {
    return this._geometryType;
  },

  getCenterPosition: function() {
    return this._multiresTree.getCenterPosition();
  },

  _addActiveTiles: function() {
    for (var t = 0; t<this._activeTiles.length; t++){
      this.renderObject.add(this._activeTiles[t].renderObject);
      if (RTI_SHOW_BSPHERES)
        this.renderObject.add(this._activeTiles[t].bSphereMesh); // debug
    }
  },

  _removeActiveTiles: function() {
    for (var t = 0; t<this._activeTiles.length; t++) {
       this.renderObject.remove(this._activeTiles[t].renderObject);
      if (RTI_SHOW_BSPHERES)
         this.renderObject.remove(this._activeTiles[t].bSphereMesh);
    }
  },

  _loadShader: function(shaderReference) {
    if (shaderReference.supportedGeometries.indexOf(this._geometryType) > -1) {
      var vShaderRequest = RTIUtils.sendSyncRequest(shaderReference.vShaderURL);
      if (vShaderRequest.status >= 400) {
        return RTIError("PTM._loadShader: Unable to load shader from " + shaderReference.vShaderURL);
      }
      this._vShader = vShaderRequest.responseText;

      var fShaderRequest = RTIUtils.sendSyncRequest(shaderReference.fShaderURL);
      if (fShaderRequest.status >= 400) {
        return RTIError("PTM._loadShader: Unable to load shader from " + shaderReference.fShaderURL);
      }
      this._fShader = fShaderRequest.responseText;

      if (this._fShader.indexOf("// !# include utils") > -1) {
        var utilsShaderReq = RTIUtils.sendSyncRequest(shaderReference.utilsShaderURL);
        if (utilsShaderReq.status >= 400) {
          return RTIError("PTM._loadShader: Unable to load shader from " + shaderReference.utilsShaderURL);
        }
        var utilsShader = utilsShaderReq.responseText;
        this._fShader = this._fShader.replace("// !# include utils", utilsShader);
      }

      this._currentShaderRef = shaderReference;
      return true;
    } else
      return RTIError("PTM._loadShader: Requested shader does not support geometry type of current PTM");
  },

  _applyConfig: function(config) {
        var ptmConfig = config.PTM;
        var geometryConfig = config.Geometry;

        this._ptmType = ptmConfig.type;
        if (!(this._ptmType == "LRGBG_PTM" || this._ptmType == "LRGB_PTM")) {
          return RTIError("PTM._applyConfig: unsupported ptm type: " + this._ptmType);
        }

        this._geometryType = geometryConfig.type;

        this._ptmContentWidth = ptmConfig.contentSize.w;
        this._ptmContentHeight = ptmConfig.contentSize.h;

        if (this._ptmType == "LRGBG_PTM")
        this._numberCoeffs = 9;
        else if (this._ptmType == "LRGB_PTM")
        this._numberCoeffs = 6;

        this.scale = ptmConfig.scale.slice(0, 6);
        this.bias = ptmConfig.bias.slice(0, 6);

        if (this._ptmType == "LRGBG_PTM") {
          this.scaleSpecular = ptmConfig.scale.slice(6,9);
          this.biasSpecular = ptmConfig.bias.slice(6,9);
        }

        this.orientation = ptmConfig.orientation;
        return true;
  }
}; // PTM prototype

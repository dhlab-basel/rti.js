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
 * Allows rendering of a WebPTM with a multiresolution strategy by creating a
 * pyramid of tilings of the PTM on different resolution levels.
 * <br>The MultiresTree consists of a tree of {@link MultiresNodes} together
 * with additional configuration parameters. Each level of the tree
 * corresponds to a tiling of the PTM with a certain resolution. Each node holds
 * the texture for a single tile together with the geometry for that tile.
 * <br>The root node corresponds to the lowest resolution level with just a
 * single tile for the whole PTM. On the second level the PTM is tiled into 4
 * equally sized tiles,
 * the 3rd level holds 16 tiles, and more generally the nth level holds 4^(n-1)
 * tiles (starting with n=1). The textures stored in each node all have
 * the same resolution, so the total resolution (in one dimension) over all
 * tiles doubles on each level.
 * <br>The nodes are stored in a simple array 'nodes', each node holds
 * references to its child- and parent nodes, in the form of array indices.
 *
 * <br><br>The MultiresTree will load the lowest resolution level from the
 * server upon creation. Tiles from higher resolution levels must be requested
 * by calling 'MultiresTree.requestTextures(screenRes, camera)' which will
 * request the necessary tiles from the server, and can be used for rendering by
 * calling 'MultiresTree.getAvailableTiles(screenRes, camera)'
 * which will return the necessary tiles for rendering (if they have been
 * successfully loaded from the server yet.)
 *
 * @class
 * @param {PTMConfig} config - Configuration of the WebPTM.
 * @param {string[]} imgURLPrefixes - an array of strings with the absolute or relative URL prefixes for accesssing the individual data images.
 * @param {PTM} ptm - The PTM for which this multiresolution tree will be used.
 * @param {float} scale - The (unitless) size of the object in the scene.
 */
function MultiresTree(config, imgURLPrefixes, ptm, scale) {
  this._multiresStrategyType = "";
  this._format = "";
  this._nodesCount = 0;
  this._maxWidth = 0;
  this._maxHeight = 0;
  this._nodes = [];
  this._resolutions = [];
  this._levelIndices = [];
  this._tileSize = null;
  this._nLevels = 0;
  this._center = null;

  this._frustum = null;
  this._loader = null;
  this._imgPrefixes = [];

  if (!this.load(config, imgURLPrefixes, ptm, scale))
  RTIError("MultiresTree: error while reading tree configuration");

  this._nodes[0].requestTextures(this._loader, this._imgPrefixes, this._multiresStrategyType, this._format, this._initialLoadResponse.bind(this));
  return this;
} // MultiresTree

MultiresTree.prototype = {
  load: function(config, imgURLPrefixes, ptm, scale) {
    this._imgPrefixes = imgURLPrefixes;

    this._format = config.PTM.imageFormat;

    this._applyConfig(config, ptm, scale);

    var temp = this._maxWidth;
    this._nLevels = 1;
    while (temp > this._tileSize.x)
    {
      this._nLevels++;
      temp /= 2;
    }

    var numLayers = 4;
    if (ptm.getPTMType() == "LRGB_PTM")
    numLayers = 3;

    var resolutions = [];
    var levelIndices = [];
    var nodes = [];
    var index = 0;
    for (var i = 0; i < this._nLevels; i++)
    {
      if (i == 0)
      resolutions[i] = new THREE.Vector2(this._tileSize.x, this._tileSize.y);
      else
      resolutions[i] = resolutions[i-1].clone().multiplyScalar(2);

      levelIndices[i] = index;
      var count = Math.pow(4, i);
      for (var j = 0; j < count; j++)
      {
        var node = new MultiresTreeNode(ptm, numLayers);
        node.index = index;
        if (index > 0)
        node.parentIndex = Math.ceil(index / 4) - 1;
        else
        node.parentIndex = -1;
        if (i < this._nLevels - 1)
        for (var c=0; c<4; ++c)
        {
          if (i == this._nLevels - 1)
          node.childrenIndices[c] = -1;
          else
          node.childrenIndices[c] = index * 4 + 1 + (c + 2) % 4;
        }

        nodes[index] = node;
        index++;
      }
    }
    this._nodes = nodes;
    this._resolutions = resolutions;
    this._levelIndices = levelIndices;

    if (ptm.getGeometryType() == "PLANE") {
      this._createTreePlaneGeom(ptm, scale);
      this.centerPlaneUL = new THREE.Vector3(this._nodes[0].position.x-scale/2, this._nodes[0].position.y+scale/2, this._nodes[0].position.z );
      this.centerPlaneLR = new THREE.Vector3(this._nodes[0].position.x+scale/2, this._nodes[0].position.y-scale/2, this._nodes[0].position.z );
    } else {
      console.log("geometryType " + ptm.getGeometryType() + " currently not supported.");
      return false;
    }

    this._createContentLimits();

    if (this._multiresStrategyType == "IIIF") {
      this._createIIIFImageRequestParams();
    }

    this._frustum = new THREE.Frustum();
    this._loader = new THREE.TextureLoader();
    this._loader.crossOrigin = "";

    return true;
  },

/**
 * Free all resources attached to the PTM.
 */
  dispose: function() {
    for (var i=0; i<this._nodes.length; i++) {
      this._nodes[i].dispose();
    }
    this._nodes = [];
    this._frustum = null;
    this._loader = null;
    THREE.Cache.clear();
  },

/**
 * Requests all unloaded tiles necessary for the current viewport (defined by a
 * camera and a screen resolution) from the server.
 *
 * @param {THREE.Vector2} screenRes - The current screen resolution
 * @param {THREE.Camera} camera - The current camera defining the viewport.
 */
  requestTextures: function(screenRes, camera) {
    RTILog("MultiresTree.requestTextures:");
    var requiredLevel = this._getRequiredLevel(screenRes, camera);
    RTILog(" required level: ", requiredLevel);
    var visibleNodes = this._getRequiredNodes(requiredLevel, camera);
    for (var n = 0; n< visibleNodes.length; n++) {
      visibleNodes[n].requestTextures(this._loader, this._imgPrefixes, this._multiresStrategyType, this._format, this._loadResponse.bind(this));
    }
  },

/**
 * Returns the tiles necessary for the current viewport defined by a camera and
 * a screen resolution.
 * If the tiles with the desired resolution are not fully loaded yet, tiles with
 * a lower resolution will be returned.
 *
 * @param {THREE.Vector2} screenRes - The current screen resolution
 * @param {THREE.Camera} camera - The current camera defining the viewport.
 * @returns {MultiresTreeNode[]} - Array of MultiresTreeNodes
 */
  getAvailableTiles: function(screenRes, camera) {
    var requiredLevel = this._getRequiredLevel(screenRes, camera);
    var availableNodes = [];
    while (requiredLevel >= 0) {
      var visibleNodes = this._getRequiredNodes(requiredLevel, camera);
      var allNodesLoaded = true;
      for (var n = 0; n< visibleNodes.length; n++) {
        if (visibleNodes[n].loadState != 2) {
          allNodesLoaded = false;
          break;
        }
      }
      if (allNodesLoaded) {
        availableNodes = visibleNodes;
        // RTILog("MultiresTree.getAvailableTiles: served available nodes level: ", requiredLevel+" number tiles: "+visibleNodes.length);
        break;
      }
      requiredLevel--;
    }
    return availableNodes;
  },

  updateShaders: function(vShader, fShader){
      // TODO: share material
      for (var i = 0; i< this._nodes.length; i++) {
        this._nodes[i].updateShaders(vShader, fShader);
      }
  },

  /**
   * Returns a mesh representing the PTM in the scene.
   * The returned mesh should only be used for geometric computations such as
   * picking or visibility checks.
   * The returned mesh is usually not the mesh used for actual rendering.
   * @returns {THREE.Mesh} - a mesh representing the PTM in the scene.
   */
    getMesh: function() {
      return this._nodes[0].renderObject;
    },

    getCenterPosition: function() {
      return this._center.clone();
    },

  _createTreePlaneGeom: function(ptm, scale) {
    var planeSizes = [];
    var index = 0;
    for (var i = 0; i < this._nLevels; i++)
    {
      var count = Math.pow(4, i);
      for (var j = 0; j < count; j++)
      {
        var node = this._nodes[index];

        if (index > 0)
        {
          var t = index % 4;
          var parentNode = this._nodes[node.parentIndex];
          var parentSize = planeSizes[node.parentIndex];

          var currentPlaneSize = new THREE.Vector2(parentSize.x/2, parentSize.y/2);
          node.geometry = new THREE.PlaneGeometry(parentSize.x/2, parentSize.y/2);
          node.material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
          node.material.transparent = true;
          node.material.opacity = 0.0;
          node.renderObject = new THREE.Mesh(node.geometry, node.material);

          var parentPos = parentNode.position;
          var halfW = parentSize.x/4;
          var halfH = parentSize.y/4;
          var offsetToParent = new THREE.Vector3();
          if (t == 1) {
            offsetToParent.set(-halfW, halfH, 0);
          }else if (t == 2){
            offsetToParent.set(halfW, halfH, 0);
          }else if (t == 3){
            offsetToParent.set(-halfW, -halfH, 0);
          }else if (t == 0){
            offsetToParent.set(halfW, -halfH, 0);
          }
          node.position = parentPos.clone().add(offsetToParent);
          node.renderObject.position.set(node.position.x, node.position.y, node.position.z);
          node.boundingSphere = new THREE.Sphere(node.position, Math.sqrt(Math.pow(currentPlaneSize.x/2,2)+Math.pow(currentPlaneSize.y/2,2)));
          planeSizes[index] = currentPlaneSize;
        }
        else
        {
          var currentPlaneSize = new THREE.Vector2(scale, scale);
          node.geometry = new THREE.PlaneGeometry(scale, scale);
          node.material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
          node.material.transparent = true;
          node.material.opacity = 0.0;
          node.renderObject = new THREE.Mesh(node.geometry, node.material);
          node.position = new THREE.Vector3(0,0,0);
          node.renderObject.position.set(node.position.x, node.position.y, node.position.z);
          node.boundingSphere = new THREE.Sphere(node.position, Math.sqrt(Math.pow(currentPlaneSize.x/2,2)+Math.pow(currentPlaneSize.y/2,2)));
          planeSizes[index] = currentPlaneSize;
        }

        if (RTI_SHOW_BSPHERES) {
          var bSphereGeom = new THREE.SphereGeometry(node.boundingSphere.radius,6,6);
          var bSphereMaterial = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
          var bSphereMesh = new THREE.Mesh(bSphereGeom, bSphereMaterial);
          bSphereMesh.position.set(node.boundingSphere.center.x, node.boundingSphere.center.y, node.boundingSphere.center.z);
          node.bSphereMesh = bSphereMesh;
        }

        index++;
      }
    }
    this._center = this._nodes[0].position;
  },

  _createContentLimits: function() {
    var index = 0;
    for (var i = 0; i < this._nLevels; i++)
    {
      var count = Math.pow(4, i);
      for (var j = 0; j < count; j++)
      {
        var node = this._nodes[index];
        if (index > 0)
        {
          var t = index % 4;
          var parentNode = this._nodes[node.parentIndex];
          var xLimits = new THREE.Vector3();
          var yLimits = new THREE.Vector3();
          var parentXLimits = parentNode.xLimits;
          var parentYLimits = parentNode.yLimits;
          if (t == 1) {
            xLimits.set(parentXLimits.x*2, 2*parentXLimits.y );
            yLimits.set(parentYLimits.x*2 - 1.0, 2*parentYLimits.y - 1.0);
          }else if (t == 2){
            xLimits.set(parentXLimits.x*2 - 1.0, 2*parentXLimits.y - 1.0);
            yLimits.set(parentYLimits.x*2 - 1.0, 2*parentYLimits.y - 1.0);
          }else if (t == 3){
            xLimits.set(parentXLimits.x*2, 2*parentXLimits.y );
            yLimits.set(parentYLimits.x*2, 2*parentYLimits.y );
          }else if (t == 0){
            xLimits.set(parentXLimits.x*2 - 1.0, 2*parentXLimits.y - 1.0);
            yLimits.set(parentYLimits.x*2, 2*parentYLimits.y );
          }
          if (xLimits.x >= 1 || xLimits.y <= 0 ||
              yLimits.x >= 1 || yLimits.y <= 0 ) {
                node.hasContent = false;
          }
          xLimits.clampScalar(0,1.0);
          yLimits.clampScalar(0,1.0);
          node.xLimits = new THREE.Vector2(xLimits.x, xLimits.y);
          node.yLimits = new THREE.Vector2(yLimits.x, yLimits.y);
        } else {
          node.xLimits = new THREE.Vector2(this.xLimits.x/this._maxWidth, this.xLimits.y/this._maxWidth);
          node.yLimits = new THREE.Vector2(this.yLimits.x/this._maxHeight, this.yLimits.y/this._maxHeight);
        }
        index++;
      }
    }
  },

  _createIIIFImageRequestParams: function() {
    var regionULs = [];
    var index = 0;
    for (var i = 0; i < this._nLevels; i++)
    {
      var sizeFactor = Math.pow(2,i);
      var regionSize = new THREE.Vector3(this._maxWidth/sizeFactor, this._maxHeight/sizeFactor);
      var count = Math.pow(4, i);
      for (var j = 0; j < count; j++)
      {
        var node = this._nodes[index];
        if (index > 0)
        {
          var parentRegionUL = regionULs[node.parentIndex];
          var t = index % 4;
          if (t == 1) {
            regionULs[index] = new THREE.Vector3(parentRegionUL.x, parentRegionUL.y);
          }else if (t == 2){
            regionULs[index] = new THREE.Vector3(parentRegionUL.x+regionSize.x, parentRegionUL.y);
          }else if (t == 3){
            regionULs[index] = new THREE.Vector3(parentRegionUL.x, parentRegionUL.y+regionSize.y);
          }else if (t == 0){
            regionULs[index] = new THREE.Vector3(parentRegionUL.x+regionSize.x, parentRegionUL.y+regionSize.y);
          }
          node.imageRequestParams = "/"+regionULs[index].x+","+regionULs[index].y+","+regionSize.x+","+regionSize.y+"/"+this._tileSize.x+","+this._tileSize.y+"/0/default";
        }
        else
        {
          regionULs[index] = new THREE.Vector3(0,0);
          node.imageRequestParams = "/0,0,"+this._maxWidth+","+this._maxHeight+"/"+this._tileSize.x+","+this._tileSize.y+"/0/default";
        }
        index++;
      }
    }
  },

  _getRequiredLevel: function(screenRes, camera) {
    var centerLROnScreen = this.centerPlaneLR.clone().project(camera);
    var centerULOnScreen = this.centerPlaneUL.clone().project(camera);
    var sizeOnScreen = new THREE.Vector3().subVectors(centerLROnScreen, centerULOnScreen);
    sizeOnScreen.set(Math.abs(sizeOnScreen.x),Math.abs(sizeOnScreen.y), sizeOnScreen.z)
    var requiredResolutionFactor = sizeOnScreen.clone().divideScalar(2);
    var requiredResolution = screenRes.clone().multiply(requiredResolutionFactor);

    var level = 0;
    var currResolution;
    while (level < this._resolutions.length){
      currResolution = this._resolutions[level];
      if (currResolution.x >= requiredResolution.x && currResolution.y >= requiredResolution.y)
      break;
      level++;
    }

    // just for debugging
    // if (this.lastlevel != level){
    // console.log(level);
    // // console.log(camera.position);
    // }
    // this.lastlevel = level;

    if (level < this._resolutions.length)
    return level;
    else
    return level - 1;
  },

  _getRequiredNodes: function(level, camera) {
    var count = Math.pow(4,level);
    var nodeIndex = this._levelIndices[level];

    var visibleNodes = [];

    this._frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

    for (var i = 0; i < count; i++) {
      if ( this._frustum.intersectsSphere( this._nodes[nodeIndex].boundingSphere )) {
        visibleNodes.push(this._nodes[nodeIndex]);
      }
      nodeIndex++;
    }

    return visibleNodes;
  },

  _loadResponse: function(nodeIndex, success) {
    // if (success)
    // RTILog("MultiresTree._loadResponse: Success node: "+nodeIndex);
    // else
    // RTILog("MultiresTree_loadResponse: Error node: "+nodeIndex);
  },

  _initialLoadResponse: function(nodeIndex, success) {
    if (!success) {
      var urls = "";
      for (var i = 0; i<this._nodes[nodeIndex].numLayers; i++) {
        var url = this._nodes[nodeIndex].getFullURL(i, this._imgPrefixes, this._multiresStrategyType, this._format);
        urls = urls + url + "\n";
      }
      RTIError("MultiresTree._initialLoadResponse: Unable to load image data for node: "+nodeIndex+", urls:\n"+urls );
    }
    this._loadResponse(nodeIndex, success);
  },

  _applyConfig: function(config, ptm, scale) {
    var ptmConfig = config.PTM;
    var multiresConfig = config.MultiresStrategy;

    this._multiresStrategyType = multiresConfig.type;
    this._maxWidth = ptmConfig.maxResolution.w;
    this._maxHeight = ptmConfig.maxResolution.h;
    var halfContentWidth = ptmConfig.contentSize.w/2;
    var halfContentHeight = ptmConfig.contentSize.h/2;
    var halfWidth = this._maxWidth/2;
    var halfHeight = this._maxHeight/2;
    this.xLimits = new THREE.Vector2(halfWidth-halfContentWidth, halfWidth+halfContentWidth);
    this.yLimits = new THREE.Vector2(halfHeight-halfContentHeight, halfHeight+halfContentHeight);

    this._tileSize   = new THREE.Vector2(multiresConfig.tileSize.w, multiresConfig.tileSize.h);

    var nodesCount = 1;
    var nodesOnCurrentLevel = 1;
    var currentResolution = this._tileSize.x;
    while (currentResolution < this._maxWidth)
    {
      nodesOnCurrentLevel = nodesOnCurrentLevel*4;
      nodesCount += nodesOnCurrentLevel;
      currentResolution = currentResolution*2;
    }
    this._nodesCount = nodesCount;
  }
}; // MultiresTree prototype

/**
 * Pepresents a tile in the multiresolution tree of a WebPTM. Holds textures and
 * geometry for a single tile.
 *
 * @class
 * @param {PTM} ptm - The PTM for which the multiresolution tree will be used.
 * @param {int} numLayers - The number of textures a single tile holds.
 *
 * @property {int} index - index in the array of nodes
 * @property {int} parentIndex - index to parent tile in the array of nodes
 * @property {int[]} childrenIndices - indices o child tiles in the array of nodes
 * @property {THREE.Vector3} position - position
 * @property {THREE.Geometry} geometry - geometry
 * @property {THREE.Material} material - material
 * @property {THREE.Mesh} renderObject - rendered mesh object
 * @property {THREE.Texture[]} textures - textures for each layer
 * @property {bool} hasContent - indicates if tile is inside actual PTM content area
 * @property {int} numLayers - number of texture layers
 * @property {int} loadState - indicates progress texture loading
 * @property {int} loadedLayersCount - number of texture layers where a response from the server has been received
 * @property {bool} loadError - indicates if an error occured while loading textures
 * @property {PTM} ptm - The PTM for which the multiresolution tree will be used.
 * @property {string} imageRequestParams - IIIF request parameters for this tile
 */
function MultiresTreeNode(ptm, numLayers) {
  this.index           = -1;
  this.parentIndex     = -1;
  this.childrenIndices = [ -1, -1, -1, -1 ];
  this.position        = null; // TODO: remove redundancy: position and position of renderobject
  this.geometry       = null;
  this.material        = null;
  this.renderObject    = null;
  this.textures        = [];
  this.hasContent = true;
  this.numLayers = numLayers;

  this.loadState = 0;  // 0: init, 1: textures requested, 2: received reponses for all layers
  this.loadedLayersCount = 0;
  this.loadError = false;

  this.ptm = ptm; // TODO: get rid of ptm reference here

  this.imageRequestParams = "";

  if (RTI_SHOW_BSPHERES) {
    this.bSphereMesh = null;
  }

  return this;
} // MultiresTreeNode

MultiresTreeNode.prototype = {
 /**
 * Free all resources attached to the MultiresTreeNode.
 */
  dispose: function() {
    this.textures = [];
    this.material.dispose();
    this.material = null;
    this.geometry.dispose();
    this.geometry = null;
    this.renderObject.material.dispose();
    this.renderObject.geometry.dispose();
    this.renderObject = null;
    if (RTI_SHOW_BSPHERES) {
      this.bSphereMesh.material.dispose();
      this.bSphereMesh.geometry.dispose();
      this.bSphereMesh = null;
    }
    // THREE.Cache.clear();
  },

  /**
   * Returns the full URL for requesting the texture of a particular layer.
   * @param {int} layer
   * @param {string[]} urlPrefixes
   * @param {string} multiresStrategy
   * @param {string} format
   * @returns {string} url
   */
  getFullURL: function(layer, urlPrefixes, multiresStrategy, format) {
    var fullURL;
    if (multiresStrategy == "IIIF") {
      fullURL = urlPrefixes[layer] + this.imageRequestParams + "." + format;
    } else {
      var nodeId = this.index+1;
      var layerId = layer+1;
      fullURL = urlPrefixes[layer] + nodeId + "_" + layerId + this.imageRequestParams + "." + format;
    }
    return fullURL;
  },

/**
 * Requests the textures of this tile from the server.
 * @param {THREE.Textureloader} loader
 * @param {string[]} urlPrefixes
 * @param {string} multiresStrategy
 * @param {string} format
 * @param {function} loadCallBack
 */
  requestTextures: function(loader, urlPrefixes, multiresStrategy, format, loadCallBack) {
    if (this.loadState == 1 || this.loadState == 2 ) {
      return;
    }

    if (!this.hasContent) {
        this.loadState = 2;
        return;
    }

    this.loadState = 1;
    this.loadedLayersCount = 0;
    this.loadError = false;

    for (var layer = 0; layer < this.numLayers; layer++) {
      var fullURL = this.getFullURL(layer, urlPrefixes, multiresStrategy, format);
      // console.log(fullURL);
      loader.load(
        fullURL,
        this._onLoadSuccess.bind(this)(layer, loadCallBack),
        this._onLoadProgress.bind(this)(layer, loadCallBack),
        this._onLoadError.bind(this)(layer, loadCallBack)
      );
      RTILog("MultiresTreeNode.requestTextures: requesting: ", fullURL);
    }
  },

  updateShaders: function(vShader, fShader){
      if (this.hasContent && !this.loadError && this.loadState == 2) {
        this.material.dispose();
        this.material = null;
        this.renderObject.material.dispose();
        this.renderObject.geometry.dispose();
        this.renderObject = null;
        THREE.Cache.clear();

        this.material = PTMMaterial(this.ptm, this.textures, this.xLimits, this.yLimits);

        this.renderObject = new THREE.Mesh(this.geometry, this.material);
        this.renderObject.position.set(this.position.x, this.position.y, this.position.z);
        if (this.ptm.getGeometryType() == "HALFDOME") {
          this.renderObject.material.side = THREE.BackSide;
          this.renderObject.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);
        }
      }
  },

  _onLoadSuccess: function(layer, loadCallBack) {
    var self = this;
    return function ( texture ) {
      self.textures[layer] = texture;
      self.loadedLayersCount++;
      RTILog('MultiresTreeNode._onLoadSuccess: Loaded texture: ' + self.index + ", layer: " + layer );
      self._setupMaterial(loadCallBack);
    }
  },

  _onLoadError: function(layer, loadCallBack){
    var self = this;
    return function ( xhr ) {
      RTILog('MultiresTreeNode._onLoadError: Unable to load texture of node: ' + self.index + ", layer: " + layer );
      self.loadError = true;
      self.loadedLayersCount++;
      self._setupMaterial(loadCallBack);
    }
  },

  _onLoadProgress: function(layer, loadCallBack) {
    var self = this;
    return function ( xhr ) {
      RTILog('MultiresTreeNode._onLoadProgress: Loading texture of node: ' + self.index + ", layer: " + layer + ". " + (xhr.loaded / xhr.total * 100) + '% loaded');
    }
  },

  _setupMaterial: function(loadCallBack) {
    if (this.loadedLayersCount == this.numLayers) {
      this.loadState = 2;
      if (this.loadError) {
        RTILog('MultiresTreeNode._setupMaterial: LoadError for textures in node: ' + this.index + ", using dummy material for this tile.");
      } else {
        this.material.dispose();
        this.renderObject.material.dispose();
        this.renderObject.geometry.dispose();
        this.renderObject = null;
        THREE.Cache.clear();

        this.material = PTMMaterial(this.ptm, this.textures, this.xLimits, this.yLimits);

        RTILog('MultiresTreeNode._setupMaterial: Success for textures in node: ' + this.index + ", all layers loaded.");

        this.renderObject = new THREE.Mesh(this.geometry, this.material);
        this.renderObject.position.set(this.position.x, this.position.y, this.position.z);
      }
      loadCallBack(this.index, !this.loadError);
    }
  }
};  // MultiresTreeNode prototype

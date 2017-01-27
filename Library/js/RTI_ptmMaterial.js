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
* Returns a new instance of THREE.ShaderMaterial with uniforms for PTM rendering.
* @param {PTM} ptm - The WebPTM which holds the rendering parameters.
* @param {THREE.Texture[]} textures - Array with textures which hold the PTM data.
* @param {THREE.Vector2} contentLimitsX - Normalized limits of PTM content in x direction.
* @param {THREE.Vector2} contentLimitsY - Normalized limits of PTM content in y direction.
* @returns {THREE.ShaderMaterial} - Material with custom uniforms.
*/
function PTMMaterial(ptm, textures, contentLimitsX, contentLimitsY) {
    var texture012Image = textures[0];
    texture012Image.magFilter = THREE.NearestFilter;
    texture012Image.minFilter = THREE.NearestFilter;
    var texture345Image = textures[1];
    texture345Image.magFilter = THREE.NearestFilter;
    texture345Image.minFilter = THREE.NearestFilter;
    var textureRGBImage = textures[2];
    textureRGBImage.magFilter = THREE.NearestFilter;
    textureRGBImage.minFilter = THREE.NearestFilter;

    var material = new THREE.ShaderMaterial({
      uniforms: {
        texture012: {type: 't', value: texture012Image},
        texture345: {type: 't', value: texture345Image},
        textureRGB: {type: 't', value: textureRGBImage},

        flatGSpecular: {type: 'f', value: ptm.flatGSpecular},

        scale: {type: 'fv1', value: ptm.scale},
        bias: {type: 'fv1', value: ptm.bias},

        visualizeErrors: {type: 'i', value: ptm.visualizeErrors},
        debugIndex: {type: 'i', value: ptm.debugIndex},
        kRGB: {type: 'v3', value: ptm.kRGB},
        kd: {type: 'f', value: ptm.kd},
        alpha: {type: 'f', value: ptm.alpha},

        orientation: {type: 'i', value: ptm.orientation},
        mirror: {type: 'v2', value: ptm.mirror},
        lDir: {type: 'v3', value: new THREE.Vector3()},
        H: {type: 'v3', value: new THREE.Vector3()},
        ambientLightCol: {type: 'v3', value: new THREE.Vector3()},
        directionalLightCol: {type: 'v3', value: new THREE.Vector3()},


        xLimits: {type: 'v2', value: contentLimitsX},
        yLimits: {type: 'v2', value: contentLimitsY}
      },

      vertexShader: ptm.getVShader(),
      fragmentShader: ptm.getFShader()
    });

    if (ptm.getPTMType() == "LRGBG_PTM") {

      var textureGSpecularImage = textures[3];
      textureGSpecularImage.magFilter = THREE.NearestFilter;
      textureGSpecularImage.minFilter = THREE.NearestFilter;

      material.uniforms.textureGSpecular =  {type: 't', value: textureGSpecularImage};
      material.uniforms.scaleSpecular = {type: 'fv1', value: ptm.scaleSpecular};
      material.uniforms.biasSpecular = {type: 'fv1', value: ptm.biasSpecular};
      material.uniforms.ks = {type: 'f', value: ptm.ks};
      material.uniforms.gChannel = {type: 'i', value: ptm.gChannel};
    }

    material.transparent = true;
    // material.wireframe = true;
    return material;
} // PTMMaterial

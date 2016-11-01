/**
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

precision highp float;

//////////////////////////////////////////////////////////////////////////////////////////
/// common inputs for all PTM types (LRGB, LRGBG) and all geometries (PLANE, HALFDOME) ///
//////////////////////////////////////////////////////////////////////////////////////////

varying vec2 vUv;
uniform sampler2D texture012;
uniform sampler2D texture345;
uniform sampler2D textureRGB;

uniform float scale[6];
uniform float bias[6];

uniform vec3 lDir;
uniform vec3 H;
uniform vec3 ambientLightCol;
uniform vec3 directionalLightCol;

uniform vec3 kRGB;
uniform float kd;
uniform float alpha;
uniform float flatGSpecular;

uniform vec2 xLimits;
uniform vec2 yLimits;
uniform vec2 mirror;
uniform int orientation;

uniform int visualizeErrors;
uniform int debugIndex;

//////////////////////////////////////////////////////////////////////////////////////////
/// include statements for rti.js glsl preprocessor ///
//////////////////////////////////////////////////////////////////////////////////////////

// !# include utils

//////////////////////////////////////////////////////////////////////////////////////////
/// main ///
//////////////////////////////////////////////////////////////////////////////////////////

void main(void) {
  vec3 color;

  if (!isInsidePTMContentLimits(vUv, xLimits, yLimits)) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  float aCoeffs[6];
  calcCoefficients(vUv, texture012, texture345, scale, bias, aCoeffs);

  vec3 lDirPTM = orient2PTM(lDir, orientation, mirror);

  float lWeights[6];
  calcLWeights(lDirPTM,lWeights);

  // evaluate ptm polynomial
  float lum = calcLuminance(aCoeffs, lWeights);

  bool normalError;
  vec3 N = calcN(aCoeffs, normalError);

  vec3 HPTM = orient2PTM(H, orientation, mirror);
  float nDotHPTM = dot(N,HPTM);

  vec3 diffuseRGB = texture2D(textureRGB, vUv).xyz;

  color = kRGB * (ambientLightCol*diffuseRGB*0.3  + directionalLightCol * lum * (kd*diffuseRGB + flatGSpecular*pow(nDotHPTM,alpha)));

  if(visualizeErrors > 0){
    showErrors(debugIndex, normalError, N, HPTM, lDirPTM, lum, color);
  }

  gl_FragColor = vec4(color, 1.0);
}

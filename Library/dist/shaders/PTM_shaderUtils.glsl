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

///////////////////////////////////////////////////////////////////////////////
/// PTM evaluation functions. All vectors assumed to be in PTM coord system ///
///////////////////////////////////////////////////////////////////////////////

//void calcN(in float a[6], out vec3 N, out bool error) {
vec3 calcN(in float a[6], out bool error) {
  // see ptm.pdf (Polynomial Texture Maps, Tom Malzbender et al.). Equations 16,17 and 18
  float zerotol = 0.000000001;

  error=false;

  vec3 N;
  float denominator = 4.0*a[0]*a[1] - a[2]*a[2];
  if (abs(denominator) < zerotol) {
    N = vec3(0.0, 0.0, 1.0);
    error=true;
  } else if(abs(a[0])<zerotol && abs(a[1])<zerotol && abs(a[2])<zerotol && abs(a[3])<zerotol && abs(a[4])<zerotol ){
    N = vec3(0.0, 0.0, 1.0);
    error=true;
  } else {
    float lu0=0.0;
    float lv0=0.0;
    //Speed up the computation and minimize the errors
    if(abs(a[2])<zerotol){
        lu0 = -a[3]/(2.0*a[0]);
        lv0 = -a[4]/(2.0*a[1]);
    }else{
        lu0 = (a[2]*a[4] - 2.0*a[1]*a[3])/denominator;
        lv0 = (a[2]*a[3] - 2.0*a[0]*a[4])/denominator;
    }
    float sumSquares = lu0*lu0 + lv0*lv0;
    float squareRoot = 0.0;
    if (sumSquares < 0.0) {
      N = vec3(0.0, 0.0, 1.0);
      error=true;
    } else if(sumSquares>1.0){
        sumSquares=sqrt(sumSquares);
        //has to be > 0
        if(sumSquares>zerotol){
            lu0 = lu0/sumSquares;
            lv0 = lv0/sumSquares;
        }else{
            N = vec3(0.0, 0.0, 1);
            error=true;
        }
    }else {
      squareRoot = sqrt(1.0 - sumSquares);
      N = vec3(lu0, lv0, squareRoot);
    }
    N = normalize(N);
  }
  return N;
}

void calcLWeights(in vec3 lDir, out float lWeights[6]) {
  lWeights[0] = lDir.x * lDir.x;
  lWeights[1] = lDir.y * lDir.y;
  lWeights[2] = lDir.x * lDir.y;
  lWeights[3] = lDir.x;
  lWeights[4] = lDir.y;
  lWeights[5] = 1.0;
}

bool isInsidePTMContentLimits(in vec2 vUv, in vec2 xLimits, in vec2 yLimits) {
  if (vUv.x < xLimits.x || vUv.x > xLimits.y || vUv.y < yLimits.x || vUv.y > yLimits.y ){
    return false;
  }
  return true;
}

void calcCoefficients(in vec2 vUv, in sampler2D texture012, in sampler2D texture345, in float scale[6], in float bias[6], out float a[6]) {
  vec3 coeff012 = texture2D(texture012, vUv).xyz;
  vec3 coeff345 = texture2D(texture345, vUv).xyz;
  a[0] = (coeff012.x - bias[0] / 255.0) * scale[0];
  a[1] = (coeff012.y - bias[1] / 255.0) * scale[1];
  a[2] = (coeff012.z - bias[2] / 255.0) * scale[2];
  a[3] = (coeff345.x - bias[3] / 255.0) * scale[3];
  a[4] = (coeff345.y - bias[4] / 255.0) * scale[4];
  a[5] = (coeff345.z - bias[5] / 255.0) * scale[5];
}

float calcLuminance(in float aCoeffs[6], in float lWeights[6]) {
  float lum =
  (
    aCoeffs[0] * lWeights[0] +
    aCoeffs[1] * lWeights[1] +
    aCoeffs[2] * lWeights[2] +
    aCoeffs[3] * lWeights[3] +
    aCoeffs[4] * lWeights[4] +
    aCoeffs[5] * lWeights[5]
  );
  return lum;
}

///////////////////////////////////////////////////////////////////////////////
/// Coord system transformation functions. ///
///////////////////////////////////////////////////////////////////////////////

vec3 orient2PTM(in vec3 vWorld, in int orientation, in vec2 mirror) {
  vec3 vMirrored = vec3(vWorld.x, vWorld.y, vWorld.z);
  if (mirror.x > 0.0) {
    vMirrored.x = -vMirrored.x;
  }
  if (mirror.y > 0.0) {
    vMirrored.y = -vMirrored.y;
  }
  vec3 vPTM;
  if (orientation == 0) {
    vPTM.x = vMirrored.x;
    vPTM.y = vMirrored.y;
  } else if (orientation == 1) {
    vPTM.x = vMirrored.y;
    vPTM.y = -vMirrored.x;
  } else if (orientation == 2) {
    vPTM.x = -vMirrored.x;
    vPTM.y = -vMirrored.y;
  } else if (orientation == 3) {
    vPTM.x = -vMirrored.y;
    vPTM.y = vMirrored.x;
  }
  vPTM.z = vMirrored.z;
  return vPTM;
}

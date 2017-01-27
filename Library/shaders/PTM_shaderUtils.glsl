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

vec3 calcMaxDir(in float a[6], out bool error) {
  // see Polynomial Texture Maps, Tom Malzbender et al., Equations 16,17 and 18
  // and Realistic Visualisation of Cultural Heritage Objects, Lindsay MacDonald), Sections 4.3.2 and 4.4.5
  float zerotol = 0.000000001;

  error=false;

  vec3 maxDir;
  float denominator = 4.0*a[0]*a[1] - a[2]*a[2];
  if (abs(denominator) < zerotol) {
    maxDir = vec3(0.0, 0.0, 1.0);
    error = true;
  } else {
    float lu0 = (a[2]*a[4] - 2.0*a[1]*a[3])/denominator;
    float lv0 = (a[2]*a[3] - 2.0*a[0]*a[4])/denominator;
    float sumSquares = lu0*lu0 + lv0*lv0;
    float squareRoot = 0.0;
    if (sumSquares > 1.0){
      squareRoot = sqrt(sumSquares);
      lu0 = lu0/squareRoot;
      lv0 = lv0/squareRoot;
      maxDir = vec3(lu0, lv0, 0.0);
      error = true;
    } else {
      squareRoot = sqrt(1.0 - sumSquares);
      maxDir = vec3(lu0, lv0, squareRoot);
    }
  }
  return maxDir;
}

vec3 calcN(in float a[6], in float glossFactor, out bool error) {
  // see Realistic Visualisation of Cultural Heritage Objects, Lindsay MacDonald), Sections 4.3.2 and 4.4.5
  float zerotol = 0.000000001;
  vec3 maxDir = calcMaxDir(a, error);

  vec3 N;
  if (glossFactor > zerotol) {
    #ifdef POLAR_NORMAL
      float thetaN = acos(sqrt(1.0 - maxDir.x*maxDir.x - maxDir.y*maxDir.y)) / 2.0;
      float phiN = atan(maxDir.y, maxDir.x);
      N = vec3(cos(phiN)*sin(thetaN), sin(phiN)*sin(thetaN), cos(thetaN));
    #else
      N = vec3(maxDir.x, maxDir.y, maxDir.z + 1.0);
      N = normalize(N);
    #endif
  } else {
    N = maxDir;
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

///////////////////////////////////////////////////////////////////////////////
/// Utils ///
///////////////////////////////////////////////////////////////////////////////

void showErrors(in int debugIndex, in bool normalError, in vec3 NPTM, in vec3 HPTM, in vec3 lDirPTM, in bool lumError, in float lum, inout vec3 color) {
  vec3 debugColMagenta = vec3(1.0, 0.0, 1.0);
  vec3 debugColCyan = vec3(0.0, 1.0, 1.0);

  if (debugIndex == 0) {
    if (normalError)
      color = debugColMagenta;
  } else if (debugIndex == 1) {
    if (NPTM.z <= 0.0) {
      color = debugColMagenta;
      if (NPTM.z < 0.0)
        color = debugColCyan;
    }
  } else if (debugIndex == 2) {
    if (HPTM.z <= 0.0) {
      color = debugColMagenta;
      if (HPTM.z < 0.0)
        color = debugColCyan;
    }
  } else if (debugIndex == 3) {
    if (lDirPTM.z <= 0.0) {
      color = debugColMagenta;
      if (lDirPTM.z < 0.0)
        color = debugColCyan;
    }
  } else if (debugIndex == 4) {
    if (lum <= 0.0) {
      color = debugColMagenta;
      if (lumError)
        color = debugColCyan;
    }
  } else if (debugIndex == 5) {
    if (color.x <= 0.0 || color.y <= 0.0 || color.z <= 0.0) {
      color = debugColMagenta;
      if (color.x < 0.0 || color.y < 0.0 || color.z < 0.0)
        color = debugColCyan;
    }
  }
}

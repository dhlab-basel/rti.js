# rti.js Library #

A JavaScript library enabling the rendering of PTMs in a web browser. Built with JavaScript, ThreeJS and WebGL.


## Contents ##

- [Get Started](#GetStarted)

- [rti.js JSON Datatypes](#RTIJS_JSONDatatypes)

- [Documentation](#Documentation)

- [License](#License)

## <a name="GetStarted"></a> Get Started ##


### Using the library ###

On the master branch you can find an up-to-date build of the library (and all dependencies) in *Library/dist/*. (On all other branches you need to build the library yourself, see [Building](#Building).)

Download or copy the contents of the distribution directory (*Library/dist/* on master, or *Library/build/* - after building - on all other branches) to your project folder.

Additionally you should have some WebPTM data on your server. Specifically:

- a WebPTM (a set of images together with a .json file, see [rti.js JSON Datatypes](#RTIJS_JSONDatatypes).)
    You may find a example WebPTM in this repository under *Apps/resources/leaf_lowRes/*
- a PTMReference (a .json file, see [rti.js JSON Datatypes](#RTIJS_JSONDatatypes), linking to your WebPTM data and the shader sources in the rti.js distribution.

You should then be able to integrate the viewer into your HTML with the following code:

```HTML
  <script src="lib/three.min.js"></script>
  <script src="lib/rti.min.js"></script>

  <div id="viewerContainer" style="width: 500px; height: 500px;"></div>
  <script type="text/javascript">

    var viewerContainer = document.getElementById('viewerContainer');

    var referenceReq = new XMLHttpRequest();
    referenceReq.open("GET", "somewhere/on/the/web/myPTMReference.json", false);
    referenceReq.send();

    var viewer = new RTIViewer(referenceReq.responseText, viewerContainer);
    viewer.animate();

  </script>
```

The viewer variable serves as your main interface to the rti.js API. You may call additional functions on it for e.g. changing the direction of the incoming light. Please refer to the documentation of the library (either directly in the sources, or via generated HTML documentation, see [Documentation](#Documentation)) for more information.

You may also check out the projects under *Apps/* for real life examples on how to use the library for simple (*Apps/simpleViewer/*) or more advanced (*Apps/DMViewer/*) purposes.


### <a name="Building"></a> Building ###

The build process requires a global install of *uglifyJS*. (Please follow instructions at [uglifyJS](https://github.com/mishoo/UglifyJS2) for installation.)


For development purposes the JavaScript code is kept in multiple different src files (all located in *Library/js/* and 3rd party libs in *Library/lib/*). For distribution purposes the sources are then bundled and minified into a single rti.min.js file. The distribution ready for use in 3rd party applications consists of this bundled .js file, together with all other dependencies (shader sources and three.min.js). The distribution has to be built initially and after all subsequent changes to the rti.js library sources by running the
script *build.sh*

```bash
$ bash build.sh
```

The script will (re)build the rti.js library distribution from the current sources, and deploy the distribution to all dependent apps in this repository. You should be able to see the built files inside
the directory *Library/build/*

If you do not get any errors here, you are ready to use the distribution in a 3rd party web application.


## <a name="RTIJS_JSONDatatypes"></a> rti.js JSON Datatypes ##

The PTM data used as input for the rti.js viewer consists of a collection of images, together with a file called *info.json*, (or *info.xml*, see below) which holds metadata like PTM parameters and multiresolution configuration.
The images, together with the .json file are the output of the WebRTIMaker - see [WebRTIMaker](WebRTIMaker/README.md).

For accessing the different parts of the data of a WebPTM, the rti.js viewer uses another JSON struct called *PTMReference*, which lists the URLs of the data together with a short description of the resource - see [PTMReference](#PTMReference).

### info.json ###

A typical LRGB_PTM *info.json* might look like this:

```javascript
{
  "PTM" : {
    "type" : "LRGB_PTM",
    "maxResolution" : { "w" : 8192, "h" : 8192 },
    "contentSize" : { "w" : 3058, "h" : 4368 },
    "scale" : [2.15495, 1.79302, 2.29413, 1.2832, 1.17115, 1.10555, 4.84815, 1, 1 ],
    "bias" : [165, 179, 135, 131, 130, 3, -1, 0, 0],
    "orientation" : 3,
    "imageFormat" : "png"
  },

  "Geometry" : {
    "type" : "PLANE"
  },

  "MultiresStrategy" : {
    "type" : "IMAGE_TREE",
    "tileSize" : { "w" : 256, "h" : 256 }
  }
}
```
The semantics and syntax of the content is explained below:

- `PTM`: Holds information about the image data in the WebPTM.
    - `type`: Describes the type of the PTM data in the images. Currently only one type is supported:
        - `LRGB_PTM`: Luminance RGB.
        <br>The image data for LRGB_PTM has 3 image layers, (this means 3 image files need to be referenced in the corresponding [PTMReference](#PTMReference)).
        <br> The `scale` and `bias` arrays for LRGB_PTM need to have a length of 6.

    - `maxResolution`: Maximum available resolution.
    - `contentSize`: Describes the size of the actual ptm content in the image data.

        The images usually have 1:1, 1:2 or 2:1 dimensions, while the actual PTM data (non black area in the images) might have a smaller size in one of the dimensions. This size is encoded by the w and h parameters.
    - `scale`: The scale parameters for the PTM coefficients. Must have 6 entries for type `LRGB_PTM`.
    - `bias`: The bias parameters for the PTM coefficients. Must have 6 entries for type `LRGB_PTM`.
    - `orientation`: Encodes the rotation to be applied to mouse or light coordinates.

        Some PTMs where not captured in the same orientation that they are displayed. The images provided by the server/WebRTIMaker are already rotated to the desired orientation, while the coefficients in the image data still relate to the coord system of the capturing process.

        `0` for 0°, `1` for 90°,  `2` for 180°,  `3` for 270°, all CCW.
    - `imageFormat`: Describes the format of the images. `jpg` for .jpg, `png` for .png.

- `Geometry`:
    - `type`:   The geometry on which the PTM should be rendered.

        Currently only one type supported: `PLANE` for a flat PTM.

- `MultiresStrategy`:
    - `type`: Describes the type of the multiresolution tiling strategy to be used.

        `IMAGE_TREE`: The server holds a set of already tiled images on multiople resolution levels, which are served by simple http requests.

        `IIIF`: The server holds images with maximum resolution, tiling is achieved by IIIF requests.
    -  `tileSize`: Size of the individual multiresolution tiles.


### <a name="PTMReference"></a> PTMReference ###

For accessing the different parts of the data of a WebPTM, the rti.js viewer uses a JSON struct called 'PTMReference', which lists the URLs of the data together with a short description of the resource.

A PTMReference is a JSON struct with the following format:

```javascript
// typical example for multiresStrategyType IMAGE_TREE
{ "configURL": "localData/Mosaic/info.json",
  "imgURLPrefixes": ["localData/Mosaic/",
                     "localData/Mosaic/",
                     "localData/Mosaic/",
                     "localData/Mosaic/"],
  "description": "Mosaic X from city Y in country Z"
}

// typical example for multiresStrategyType IIIF
{ "configURL": "localData/Mosaic/info.json",
  "imgURLPrefixes": [ "http://xyz.com/ptm/Mosaic_1.tif",
                      "http://xyz.com/ptm/Mosaic_2.tif",
                      "http://xyz.com/ptm/Mosaic_3.tif",
                      "http://xyz.com/ptm/Mosaic_4.tif" ],
  "description": "Mosaic X from city Y in country Z"
}
```


The semantics and syntax of the content is explained below:
- `configURL`: relative or absolute url to the info.xml of this PTM.
- `imgURLPrefixes`: an array of strings with the relative or absolute url prefixes for accesssing the individual data images. Must have 3 entries for type `LRGB_PTM`.
- `description`: a short description of this PTM


The client will append the generic parts of the URLs to the imgURLPrefixes. Depending on the used multiresStrategyType (`IIIF` or `IMAGE_TREE`), the requirements for the contents of the imgURLPrefixes change slightly:
- `IIIF`: the `imgURLPrefixes` should contain the full names (without generic IIIF parameters) of the image files.
- `IMAGE_TREE`: the `imgURLPrefixes` contain just a partial, possibly empty, non generic prefix of the full file paths/names. The full file names will be generated by the client according to a known naming scheme.

### info.xml ###

The rti.js viewer is also able to read the metadata from a *info.xml* file. This enables (restricted) compatibility with the *WebMultires* format which was developed at ISTI. WebMultires info files do not support the `IIIF` MultiresStrategy.

Compared to the original *WebMultires* format the following restrictions apply: The rti.js viewer assumes all tiles to have no spatial offset, and to be in the default order (we ignore all lines after the 3rd line in the `Tree` tag).

Compared to the *info.json* format the following restrictions apply: The geometry must be of type `PLANE`. The multiresStrategy must be of type `IMAGE_TREE`.

A LRGB_PTM *info.xml* should comply with the following format:

```xml

        <!DOCTYPE WebMultiRes>
        <MultiRes format="1">
          <Content type="LRGB_PTM">
            <Size width="1081" height="1542" coefficients="9"/>
            <Scale>1.33038 1.37064 1.16377 0.881122 0.895715 1.04203 0.923156 0.931071 0.447444 </Scale>
            <Bias>218 214 139 108 148 -20 -2 0 0 </Bias>
          </Content>
          <Tree>85 0
            256
            2048 2048 255
            0 0 0
          </Tree>
          <Orientation>1</Orientation>
        </MultiRes>
```
The semantics and syntax of the content is explained below:

- Tag `Multires`:
    - Attribute `format`: Describes the format of the images.
        `0` for .jpg, `1` for .png.
        Optional attribute, default value `0`

- Tag `Content`:
    - Attribute `type`: Describes the type of the PTM data.
        Currently two types are supported:
        - `LRGB_PTM`: Luminance RGB.
        <br>The image data for LRGB_PTM has 3 image layers.
        <br> The `scale` and `bias` arrays for LRGB_PTM need to have 6 entries.

- Tag `Size`:
    - Attributes `width` and `height` : Describes the size of the actual ptm content in the image data.
        The images always have a square dimension, while the actual PTM data (non black area in the images) might have a smaller size in one of the dimensions. This size is encoded by the width and height parameters.
    - Attribute `coefficients`: The number of coefficients that are stored in the image data. Must be `6` for type `LRGB_PTM` .

- Tag `Scale`: The scale parameters for the PTM coefficients. Must have 6 entries for type `LRGB_PTM`.

- Tag `Bias`: The bias parameters for the PTM coefficients. Must have 6 entries for type `LRGB_PTM`.

- Tag `Tree`: Encodes the configuration of the multiresolution tree structure.
    Line 0: 'total nr of images in tree', 'rootIndex' // 'rootIndex' is a relict from ISTI code, not used in dhl code
    Line 1: 'tilesize'
    Line 2: 'max resolution x', 'max resolution y', 'max resolution z' // the z part is a relict from ISTI code, not used in dhl code
    Line 2: 'offset x', 'offset y', 'offset z' // relict from ISTI code, all entries not used in dhl code

- Tag `Orientation`: Encodes the rotation to be applied to mouse or light coordinates.
    Some PTMs where not captured in the same orientation that they are displayed. The images provided by the server/WebRTIMaker are already rotated to the desired orientation, while the coefficients in the image data still relate to the coord system of the capturing process.
    0 for 0°, 1 for 90°, 2 for 180°, 3 for 270°, all CCW.
    Optional Tag, default value: 0


## <a name="Documentation"></a> Documentation ##

The JavaScript sources are documented with *jsDoc* syntax. You may build a HTML documentation from the sources, by first installing jsDoc (requires *npm*, instructions [here](http://blog.npmjs.org/post/85484771375/how-to-install-npm)) with the following command (you may need to prepend \'sudo\'):

```bash
$ npm install -g jsdoc
```
Then you may create the HTML documentation by running the following command (assuming you're in the *Library* directory):

```bash
$ bash generateDocs.sh
```

This will generate the HTML docs in the directory *Library/doc/*. (This particular directory is ignored by .git via the .gitignore file in this repository.)
<br>Two stand-alone html documentations will be created:

- Library/doc/htmlDocumentationAPI/ documentation of the public faced API

- Library/doc/htmlDocumentationInternal/ documentation for internal development of rti.js library

You can access the documentation in your browser by opening the index.html file in one of the created directories.


## <a name="License"></a> License ##

The rti.js library is available under the GNU Affero General Public License, see *license.txt*.

three.js is available under the [MIT Licence](http://threejs.org/license).

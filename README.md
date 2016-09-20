# rti.js

A set of tools for rendering and interacting with RTI/PTM data in a web browser. IIIF compliant, three.js-based and supporting multi-resolution.


## Overview ##

The main components are:


- [rti.js Library](Library/README.md)

    A JavaScript library enabling the rendering of PTMs in a web browser.  
    Built with JavaScript, ThreeJS and WebGL.


- [Apps](Apps/README.md)

    A collection of web applications showcasing and exploring the capabilities of the rti.js library.

    - [simpleViewer](Apps/simpleViewer/README.md)

        A small example application showing the minimal setup for integrating WebPTMs into a custom website by using the rti.js library.  
        Built with HTML, JavaScript and rti.js.


    - [DMViewer](Apps/DMViewer/README.md)

        A more feature rich web application for interfacing with WebPTMs, showcasing the capabilities of the rti.js library.  
        Built with HTML, JavaScript and rti.js.


- [WebRTIMaker](WebRTIMaker/README.md)

    A command line tool to convert a PTM into WebPTM, the data format used by the rti.js library.
    Based on code from the *WebRTIViewer* project from [Visual Computing Library  at ISTI](http://vcg.isti.cnr.it/rti/webviewer.php).
    Built with C++ and Qt.


## Acknowledgements ##

This project was inspired by the *WebRTIViewer* project from [Visual Computing Library  at ISTI](http://vcg.isti.cnr.it/rti/webviewer.php), and uses a similar data format and multi-resolution approach for handling PTM data in a web environment.


## License ##

The rti.js library, DMViewer and simpleViewer are available under the [GNU Affero General Public License](http://www.gnu.org/licenses/agpl-3.0.en.html).

WebRTIMaker is available under the [GNU General Public Licence, version 3](http://www.gnu.org/licenses/).

three.js is available under the [MIT Licence](http://threejs.org/license).

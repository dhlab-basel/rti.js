# simpleViewer #

A small example application showing the minimal setup for integrating WebPTMs into a custom website by using the [rti.js](../../Library/README.md)
 library.
Built with HTML, JavaScript and rti.js.


## Get Started ##

### Prerequisites ###

This application uses the rti.js library.

On the master branch an up-to-date pre-built version the rti.js library distribution is already deployed in the *simpleViewer/lib/* directory. Developers using a version from the master branch may skip the build process explained below, and go directly to [Deployment](#Deployment).

On all other branches you need to build the rti.js library yourself, see [Building](#Building).

### <a name="Building"></a> Building ###

The build process requires a global install of *uglifyJS*. (Please follow instructions at [uglifyJS](https://github.com/mishoo/UglifyJS2) for installation.)


Since this app is currently developed in the same repository as the dependency library rti.js, no
prebuilt distribution of the rti.js library is kept in the development branches of the repository. The distribution has to be built and deployed initially and after all subsequent changes to the rti.js sources by running the
script *build.sh*

```bash
$ bash build.sh
```

The script will (re)build the rti.js library distribution from the current sources, and deploy the distribution to all dependent apps in this repository. You should be able to see the deployed files inside
the directory *simpleViewer/lib/*

If you do not get any errors here, you are ready to deploy the application on your server.


### <a name="Deployment"></a> Deployment ###

The application needs to be served over the http:// protocol, accessing it via the file:// protocol will not work. This means a running http server is needed for using, testing or development of the application.
A quick and easy way is to use python's SimpleHTTPServer. If you have python installed, just run the following command inside the *Apps/* directory:

```bash
$ python -m SimpleHTTPServer
```
You should then be able to run the viewer in your web browser via the URL http://localhost:8000/simpleViewer/simpleViewer.html


## License ##

simpleViewer is available under the GNU Affero General Public License, see *license.txt*.

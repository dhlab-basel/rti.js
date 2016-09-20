# Digital Materiality Viewer (DMViewer) #

A web application for interfacing with WebPTMs, showcasing the capabilities of the [rti.js](Library/README.md)
 library.
Built with HTML, JavaScript and rti.js.


## Get Started ##

This application uses the rti.js library.

On the master branch an up-to-date pre-built version the rti.js library distribution is already deployed in the DMViewer/lib/ directory. Developers using a version from the master branch may skip the build process explained below, and go directly to [Deployment](#Deployment).

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
the directory DMViewer/lib/

If you do not get any errors here, you are ready to deploy the application on your server.


### <a name="Deployment"></a> Deployment ###

The application needs to be served over the http:// protocol, accessing it via the file:// protocol will not work. This means a running http server is needed for using, testing or development of the application.
A quick and easy way is to use python's SimpleHTTPServer. If you have python installed, just run the following command inside the *Apps/* directory:

```bash
$ python -m SimpleHTTPServer
```
You should then be able to run the viewer in your web browser via the URL  http://localhost:8000/DMViewer/DMViewer.html


### Adding more PTMs ###

In order to keep the size of the repository small, the viewer comes just with a single example PTM for testing purposes.
To add further PTMs, you need to place the folder with the corresponding PTM files somewhere where the server has access rights, and then provide a reference to this data to the application by adding a new entry to the JSON file *availablePTMs.json* in the directory *Apps/DMViewer/serverConfigs/*.
The client application will request the file *availablePTMs.json* from the server.
The client will then render the first PTM in the list.
The client will also present the list (for example in a dropdown menu) to the user, who may then select a different PTM from the list for rendering.


## Documentation ##

The JavaScript sources are documented with *jsDoc* syntax. You may build a HTML documentation from the sources, by first installing jsDoc (requires *npm*, instructions [here](http://blog.npmjs.org/post/85484771375/how-to-install-npm)) with the following command (you may need to prepend \'sudo\'):

```bash
$ npm install -g jsdoc
```
Then you may create the HTML documentation by running the following command (assuming you're in the *DMViewer* directory):

```bash
$ bash generateDocs.sh
```

This will generate the HTML docs in the directory DMViewer/doc/htmlDocumentation/. This particular directory is ignored by .git via the .gitignore file in this repository.

The documentation of the rti.js library can be generated in a similar way, see [rti.js](Library/README.md).


## License ##

DMViewer is available under the GNU Affero General Public License, see *license.txt*.

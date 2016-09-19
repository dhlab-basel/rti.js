ABOUT THIS DIRECTORY, AND WHY IT'S INITIALLY EMPTY

The dhlViewer web application expects to find the library files (DMViewer.min.js and the shaders/ directory) of the DMViewer library in this directory.

For a usual 3rd party application using the DMViewer library, we would just copy these files here, and track them via git like other source files.

However, since the DMViewer library is being actively developed in the same repository, and we want to follow these changes, but we don't want to clutter the git repository
with changes in the built files on top of changes in the actual sources, the decision has been made to exclude the contents of this directory (except this README.md) from the git index.
(This is achieved via the .gitignore file in the top level directory of the repo.)

This means the DMViewer library needs to be built and deployed to this directory after all changes to the library code as well as after initial setup of the repository.
To build and deploy the current version of the DMViewer library, the script *DMViewer/buildDist.sh* needs to be run from the *DMViewer* directory:

```bash
$ sh build.sh
```

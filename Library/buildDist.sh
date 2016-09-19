#!/bin/bash

#
# Copyright © 2016 Aeneas Kaiser, Andrea Bianco.
# This file is part of rti.js.
# rti.js is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# rti.js is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero General Public License for more details.
# You should have received a copy of the GNU Affero General Public
# License along with rti.js. If not, see <http://www.gnu.org/licenses/>.
#

# This script builds the final product of the rti.js library project:
# a directory 'dist' containing all dependencies for using the library in 3rd party applications.
#
# This script then also deploys the contents of this 'dist' folder to all the applications in this
# repository which are dependent on the rti.js library.

# get the path to the script, so we can execute it from anywhere
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

##########################
### BUILD DISTRIBUTION ###

DISTDIR=$SCRIPTDIR/dist
mkdir -p $DISTDIR

# clear old contents of distribution
rm -rf $DISTDIR/*

# create new bundle file
touch $DISTDIR/rti.min.js

# add date comment to bundle file
printf "// " >> $DISTDIR/rti.min.js
date >> $DISTDIR/rti.min.js

cat $SCRIPTDIR/copyright.txt >> $DISTDIR/rti.min.js

# bundle and minify .js sources to single .js bundle file
uglifyjs $SCRIPTDIR/js/* -c >> $DISTDIR/rti.min.js

# copy all other dependencies to dist/
cp $SCRIPTDIR/lib/three.min.js $DISTDIR/
mkdir -p $DISTDIR/shaders
cp $SCRIPTDIR/shaders/* $DISTDIR/shaders/


#############################################
### DEPLOY DISTRIBUTION TO DEPENDENT APPS ###

# copy all dependencies to DMViewer project
DEPLOYDIR=$SCRIPTDIR/../Apps/DMViewer/lib
mkdir -p $DEPLOYDIR
cp -r $DISTDIR/* $DEPLOYDIR/

# copy all dependencies to simpleViewer project
DEPLOYDIR=$SCRIPTDIR/../Apps/simpleViewer/lib
mkdir -p $DEPLOYDIR
cp -r $DISTDIR/* $DEPLOYDIR/

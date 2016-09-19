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

# This script builds the html documentation for the rti.js library in:
#  - doc/htmlDocumentationAPI/ (documentation of public faced API)
#  - doc/htmlDocumentationInternal/ (documentation of internal development of rti.js library)


# get the path to the script, so we can execute it from anywhere
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"


### Build public API docs ###

DOCDIR=$SCRIPTDIR/doc/htmlDocumentationAPI
mkdir -p $DOCDIR/

# clear old contents of distribution
rm -rf $DOCDIR/*

# generate jsdoc documentation from source comments
jsdoc $SCRIPTDIR/js/RTI_ptm.js $SCRIPTDIR/js/RTI_viewer.js $SCRIPTDIR/js/RTI_utils.js  -R $SCRIPTDIR/README.md -d $DOCDIR/


### Build internal development docs ###

DOCDIR=$SCRIPTDIR/doc/htmlDocumentationInternal
mkdir -p $DOCDIR/

# clear old contents of distribution
rm -rf $DOCDIR/*

# generate jsdoc documentation from source comments
jsdoc $SCRIPTDIR/js/ -p -R $SCRIPTDIR/README.md -d $DOCDIR/

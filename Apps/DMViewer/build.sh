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

# Run this script with 'bash build.sh' to install or update the locally used distribution (in dhlViewer/lib/)
# of the DMViewer library.
#
# This script is just a convenient shortcut for launching the build script of the DMViewer project.
#
# The invoked build script will rebuild the distribution of the DMViewer library and deploy the
# distribution to all dependent apps in this repository.

SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

bash $SCRIPTDIR/../../Library/build.sh

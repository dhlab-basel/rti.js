/*************************************************************************/
/*                                                                       */
/*  WebGLRtiMaker                                                        */
/*  Command line tool to pre-process a RTI image (or a high              */
/*  resolution standard image) for the pubblication on the web           */
/*                                                                       */
/*  Copyright (C) 2015                                                   */
/*  Gianpaolo Palma                                                      */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it/rti/webviewer.php                             */
/*  mailto: gianpaolo[DOT]palma[AT]isti[DOT]cnr[DOT]it                   */
/*          marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*                                                                       */
/*  This program is free software: you can redistribute it and/or modify */
/*  it under the terms of the GNU General Public License as published by */
/*  the Free Software Foundation, either version 3 of the License, or    */
/*  (at your option) any later version.                                  */
/*                                                                       */
/*  This program is distributed in the hope that it will be useful,      */
/*  but WITHOUT ANY WARRANTY; without even the implied warranty of       */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the        */
/*  GNU General Public License for more details.                         */
/*                                                                       */
/*  You should have received a copy of the GNU General Public License    */
/*  along with this program.  If not, see <http://www.gnu.org/licenses/> */
/*************************************************************************/

/*************************************************************************/
/*                                                                       */
/*  September 2016                                                       */
/*  Modified by Andrea Bianco, Aeneas Kaiser.                      			 */
/*  DHLab - Digital Humanities Lab, University of Basel                  */
/*                                                                       */
/*  Original sources adapted for compatibility with the WebPTM format    */
/*  used in the DMSuite (Digital Materiality Suite) Project of DHLab.		 */
/*************************************************************************/

#ifndef MULTI_IMAGE_H
#define MULTI_IMAGE_H

#include <QImageReader>

#include "multilayer.h"

class Image : public MultiLayerImage
{

protected:

	QImage image;
	QImageReader reader;

public:

	Image();

	virtual ~Image();

	virtual bool setClipRect(const QRect& rect);

	virtual bool isNull();

	virtual bool setFilename(const QString& filename);

	virtual int getNumLayers();

	virtual bool loadData();

	virtual void releaseMemory();

	virtual bool getLayer(int layerIndex, QImage* layer);

    virtual void getLayerInfo(QDomDocument& doc, QDomElement& content);

    virtual void getLayerInfo(cJSON* jsonObj);

private:

	bool checkError();

};

#endif

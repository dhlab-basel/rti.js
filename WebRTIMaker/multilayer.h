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

#ifndef MULTI_LAYER_H
#define MULTI_LAYER_H

#include <QString>
#include <QRect>
#include <QImage>
#include <QDomDocument>
#include <QDomElement>

#include "cJSON.h"

class MultiLayerImage
{

protected:

	int h;
	int w;
    unsigned int rotAngle;


	QString type;
	QString format;
	QString filename;

	QRect clippingRect;

	bool valid;
	bool loaded;

public:

	MultiLayerImage()
	{
		valid = false;
		loaded = false;
	}

	virtual ~MultiLayerImage() {}

	virtual bool setClipRect(const QRect& rect) = 0;

	virtual bool isNull() = 0;

	virtual bool setFilename(const QString& filename) = 0;

	virtual int getNumLayers() = 0;

	virtual bool loadData() = 0;

	virtual void releaseMemory() = 0;

	virtual bool getLayer(int layerIndex, QImage* layer) = 0;

    virtual void getLayerInfo(QDomDocument& doc, QDomElement& content) = 0;

    virtual void getLayerInfo(cJSON* jsonObj) = 0;

	int width()
	{
		return w;
	}

	int height()
	{
		return h;
	}

    unsigned int orientation()
    {
        return rotAngle;
    }

    QString getFileName()
    {
        return filename;
    }

};

#endif

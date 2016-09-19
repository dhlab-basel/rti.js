TEMPLATE 	= app

TARGET 		= webGLRtiMaker
LANGUAGE 	= C++
CONFIG 		+= qt debug_and_release console
QT          += xml gui widgets
 

MOC_DIR 	= moc

SOURCES 	= image.cpp \
			  rti.cpp \
			  splitter.cpp \
                          qgetopt.cpp \
                          cJSON.c \
                          main.cpp \
   
HEADERS 	= multilayer.h \
			  rti.h \
			  image.h \
			  splitter.h \
                          qgetopt.h \
                          cJSON.h

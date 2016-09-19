### serverConfigs/README ###


The JSON files in this directory ('serverConfigs') are used to configure the set of
PTMs and the set of shaders the server wants to present to the client application.


### availablePTMs ###

The file 'availablePTMs.json' contains a list of PTM-References. Each reference contains at least three entries:
  - 'configURL' : the location of the config file of the PTM
                  (may be relative or absolute)
  - 'imgURLPrefixes' : an array of strings with the URL prefixes for accesssing the individual data images.
                      (may be relative or absolute)
  - 'description' : a human readable short name or description of the PTM.

The client application will always request the file 'availablePTMs.json' from
the server.
The client will then render the first PTM in the list.
The client will also present the list (for example in a dropdown menu) to the
user, who may then select a different PTM from the list for rendering.

To present a different set of PTMs to the client, just overwrite the file
'availablePTMs.json' with your custom list.
The file 'availablePTMs.json' is the only PTM-related file requested by the client. The
other files (e.g. availablePTMs_develop.json, availablePTMs_production.json) are just stored here for convenience,
and serve as backup for different server configurations.



### availableShaders ###

The file 'availableShaders.json' contains a list of Shader-References. Each reference contains four entries:
  - 'fShaderURL' : the location of the fragment shader source file
                  (may be relative or absolute)
  - 'vShaderURL' : the location of the vertex shader source file
                  (may be relative or absolute)
  - 'supportedGeometries' : a list of geometryTypes supported by this shader
  - 'description' : a human readable short name or description of the shader.

The client application will always request the file 'availableShaders.json' from
the server.
Upon loading a new PTM, the default shader for its geometry will be used. (Currently hardcoded in the client).
The client will present the list of shaders (for example in a dropdown menu) to the
user, who may then select a different shader from the list for rendering.

To present a different set of shaders to the client, just overwrite the file
'availableShaders.json' with your custom list.

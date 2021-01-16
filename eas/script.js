function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occured compiling the shader: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: '
      + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function initProgramInfo(gl) {
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexNormal;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uNormalMatrix;

    uniform vec4 uLightPosition;
    uniform vec4 uLightAmbient;
    uniform vec4 uLightDiffuse;
    uniform vec4 uLightSpecular;

    uniform vec4 uModelAmbient;
    uniform vec4 uModelDiffuse;
    uniform vec4 uModelSpecular;
    uniform float uModelShininess;

    varying lowp vec4 vColor;

    void main() {
      vec4 vertexPositionEye = uModelViewMatrix * aVertexPosition;

      gl_Position = uProjectionMatrix * vertexPositionEye;

      vec4 vertexNormalEye = normalize(uNormalMatrix * aVertexNormal);
      vec4 vectorToLightSource = normalize(uLightPosition - vertexPositionEye);

      float diffuseWeightning = max(dot(vertexNormalEye, vectorToLightSource), 0.0);

      vec4 reflectionVector = normalize(reflect(-vectorToLightSource, vertexNormalEye));
      vec4 viewVectorEye = -normalize(vertexPositionEye);

      float reflectionView = max(dot(reflectionVector, viewVectorEye), 0.0);
      float specularWeightning = pow(reflectionView, uModelShininess);

      vColor = (uLightAmbient * uModelAmbient)
          + (uLightDiffuse * uModelDiffuse) * diffuseWeightning
          + (uLightSpecular * uModelSpecular) * specularWeightning;
    }
  `;

  const fsSource = `
    varying lowp vec4 vColor;

    void main() {
      gl_FragColor = vColor;
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  if (shaderProgram == null) {
    return null;
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
      lightAmbient: gl.getUniformLocation(shaderProgram, 'uLightAmbient'),
      lightDiffuse: gl.getUniformLocation(shaderProgram, 'uLightDiffuse'),
      lightSpecular: gl.getUniformLocation(shaderProgram, 'uLightSpecular'),
      modelAmbient: gl.getUniformLocation(shaderProgram, 'uModelAmbient'),
      modelDiffuse: gl.getUniformLocation(shaderProgram, 'uModelDiffuse'),
      modelSpecular: gl.getUniformLocation(shaderProgram, 'uModelSpecular'),
      modelShininess: gl.getUniformLocation(shaderProgram, 'uModelShininess'),
    },
  };
}

function initCamera(gl) {
  return {
    fieldOfView: 45.0 * Math.PI / 180.0,
    aspect: gl.canvas.clientWidth / gl.canvas.clientHeight,
    zNear: 0.1,
    zFar: 1000000000000.0,
    distance: 10.0,
    tilt: 45.0,
    getProjectionMatrix: function() {
      const projectionMatrix = mat4.create();
      mat4.perspective(projectionMatrix, this.fieldOfView,
          this.aspect, this.zNear, this.zFar);
      mat4.translate(projectionMatrix, projectionMatrix, [ 0.0, 0.0, -this.distance ]);
      mat4.rotate(projectionMatrix, projectionMatrix,
          this.tilt * Math.PI / 180.0, [ 1.0, 0.0, 0.0 ]);

      return projectionMatrix;
    }
  }
}

function initLight() {
  return {
    ambient: [ 0.1, 0.1, 0.1, 1.0 ],
    diffuse: [ 0.8, 0.8, 0.8, 1.0 ],
    specular: [ 1.0, 1.0, 1.0, 1.0 ],
    distance: 5.0,
    position: 0.0,
    getPosition: function() {
      const rotation = mat4.create();
      mat4.rotate(rotation, rotation,
          this.position * Math.PI / 180.0, [ 0.0, 1.0, 0.0 ]);

      const position = vec4.fromValues(0.0, 0.0, -this.distance, 1.0);
      vec4.transformMat4(position, position, rotation);

      return position;
    }
  };
}

function initCapsuleBuffer(gl, div, width, height) {
  div = (div > 2) ? div : 2;
  width = width || 1.0;
  height = height || 1.0;

  if (height < width + 0.1) {
    height = width + 0.1;
  }

  let positions = [];
  for (let i = 0; i <= div + 1 + (div % 2); ++i) {
    if (i == 0) {
      positions = positions.concat([ 0, height, 0 ]);
    } else if (i == div + 1 + (div % 2)) {
      positions = positions.concat([ 0, -height, 0 ]);
    } else {
      let ai;
      if (div % 2 == 0) {
        if (i == (div + 2) / 2) {
          ai = Math.PI / 2;
        } else if (i < (div + 2) / 2) {
          ai = i * Math.PI / div;
        } else {
          ai = (i - 1) * Math.PI / div;
        }
      } else {
        if (i == (div + 1) / 2 || i == (div + 3) / 2) {
          ai = Math.PI / 2;
        } else if (i < (div + 1) / 2) {
          ai = i * Math.PI / div;
        } else {
          ai = (i - 2) * Math.PI / div;
        }
      }

      const si = Math.sin(ai) * width;

      let ci = Math.cos(ai) * width;
      if (i < (div + 1 + (div % 2)) / 2) {
        ci += (height - width);
      } else {
        ci -= (height - width);
      }

      for (let j = 0; j < div * 2; ++j) {
        const aj = j * Math.PI / div;
        const sj = Math.sin(aj) * width;
        const cj = Math.cos(aj) * width;

        positions = positions.concat([ si * cj, ci, si * sj ]);
      }
    }
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  let indices = []
  for (let i = 0; i < div + 1 + (div % 2); ++i) {
    if (i == 0) {
      const a = 0;
      for (let j = 0; j < div * 2; ++j) {
        const b = 1 + j;
        const c = 1 + (j + 1) % (div * 2);
        indices = indices.concat([ a, b, c ]);
      }
    } else if (i == div + (div % 2)) {
      const a = 1 + (i * div * 2);
      for (let j = 0; j < div * 2; ++j) {
        const b = 1 + ((i - 1) * div * 2) + j;
        const c = 1 + ((i - 1) * div * 2) + (j + 1) % (div * 2);
        indices = indices.concat([ a, c, b ]);
      }
    } else {
      for (let j = 0; j < div * 2; ++j) {
        const a = 1 + ((i - 1) * div * 2) + j;
        const b = 1 + ((i - 1) * div * 2) + (j + 1) % (div * 2);
        const c = 1 + (i * div * 2) + j;
        const d = 1 + (i * div * 2) + (j + 1) % (div * 2);
        indices = indices.concat([ a, d, b, a, c, d ]);
      }
    }
  }

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const calculateNormal = (a, b, c) => {
    const result = vec3.create();

    const na = vec3.create();
    vec3.negate(na, a);

    const ba = vec3.create();
    vec3.add(ba, b, na);

    const ca = vec3.create();
    vec3.add(ca, c, na);

    vec3.cross(result, ba, ca);
    vec3.normalize(result, result);

    return result;
  }

  const vertices = [];
  const normalVertices = [];
  for (let i = 0; i < positions.length; i += 3) {
    const vertex = vec3.fromValues(positions[i], positions[i + 1], positions[i + 2]);

    vertices.push(vertex);
    normalVertices.push(vec3.fromValues(0.0, 0.0, 0.0));
  }

  for (let i = 0; i < indices.length; i += 3) {
    for (let j = 0; j < 3; ++j) {
      const a = vertices[indices[i + j]];
      const b = vertices[indices[i + (j + 1) % 3]];
      const c = vertices[indices[i + (j + 2) % 3]];

      const normal = calculateNormal(a, b, c);
      vec3.add(
        normalVertices[indices[i + j]],
        normalVertices[indices[i + j]],
        normal
      );
    }
  }

  let normals = [];
  for (let i = 0; i < normalVertices.length; ++i) {
    const normal = normalVertices[i];
    vec3.normalize(normal, normal);

    normals = normals.concat([ normal[0], normal[1], normal[2] ]);
  }

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    indices: indexBuffer,
    count: indices.length,
  };
}

function initModels(gl) {
  const capsuleModel = {
    buffers: initCapsuleBuffer(gl, 16, 1.0, 2.0),
    rotation: { x: 0.0, y: 0.0, z: 0.0, },
    material: {
      ambient: [ 1.0, 0.2, 0.2, 1.0 ],
      diffuse: [ 1.0, 0.8, 0.0, 1.0 ],
      specular: [ 1.0, 1.0, 1.0, 1.0 ],
      shininess: 100.0,
    },
  };

  const models = [
    capsuleModel,
  ]

  models.forEach(model => {
    model.getModelViewMatrix = function() {
      const modelViewMatrix = mat4.create();

      mat4.rotate(modelViewMatrix, modelViewMatrix,
          this.rotation.x * Math.PI / 180.0, [ 1.0, 0.0, 0.0 ]);
      mat4.rotate(modelViewMatrix, modelViewMatrix,
          this.rotation.y * Math.PI / 180.0, [ 0.0, 1.0, 0.0 ]);
      mat4.rotate(modelViewMatrix, modelViewMatrix,
          this.rotation.z * Math.PI / 180.0, [ 0.0, 0.0, 1.0 ]);

      return modelViewMatrix;
    };

    model.getNormalMatrix = function() {
      const normalMatrix = mat4.create();
      mat4.invert(normalMatrix, this.getModelViewMatrix());
      mat4.transpose(normalMatrix, normalMatrix);

      return normalMatrix;
    };
  });

  return models;
}

function drawModel(gl, programInfo, model) {
  gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.position);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
      3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.normal);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal,
      3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
    false, model.getModelViewMatrix());
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix,
    false, model.getNormalMatrix());

  gl.uniform4fv(programInfo.uniformLocations.modelAmbient, model.material.ambient);
  gl.uniform4fv(programInfo.uniformLocations.modelDiffuse, model.material.diffuse);
  gl.uniform4fv(programInfo.uniformLocations.modelSpecular, model.material.specular);
  gl.uniform1f(programInfo.uniformLocations.modelShininess, model.material.shininess);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.buffers.indices);

  gl.drawElements(gl.TRIANGLES, model.buffers.count, gl.UNSIGNED_SHORT, 0);
}

function drawScene(gl, programInfo, camera, light, models) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
      false, camera.getProjectionMatrix());

  gl.uniform4fv(programInfo.uniformLocations.lightPosition, light.getPosition());
  gl.uniform4fv(programInfo.uniformLocations.lightAmbient, light.ambient);
  gl.uniform4fv(programInfo.uniformLocations.lightDiffuse, light.diffuse);
  gl.uniform4fv(programInfo.uniformLocations.lightSpecular, light.specular);

  models.forEach(model => {
    drawModel(gl, programInfo, model);
  });
}

function main() {
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  if (gl == null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  const programInfo = initProgramInfo(gl);
  if (programInfo == null) {
    return;
  }

  const camera = initCamera(gl);

  const light = initLight();

  const models = initModels(gl);

  let spacePressed = false;
  let leftPressed = false;
  let rightPressed = false;

  window.onkeydown = (e) => {
    switch (e.keyCode) {
      case 32: spacePressed = true; break;
      case 37: leftPressed = true; break;
      case 39: rightPressed = true; break;
    }
  }

  window.onkeyup = (e) => {
    switch (e.keyCode) {
      case 32: spacePressed = false; break;
      case 37: leftPressed = false; break;
      case 39: rightPressed = false; break;
    }
  }

  let then = null;
  const render = (now) => {
    now *= 0.001;

    if (then) {
      const elapsed = now - then;

      if (leftPressed) {
        light.position -= elapsed * 100.0;
      }

      if (rightPressed) {
        light.position += elapsed * 100.0;
      }

      if (!spacePressed) {
        models.forEach(model => {
          model.rotation.x += elapsed * 100.0;
          model.rotation.y += elapsed * 50.0;
          model.rotation.z += elapsed * 50.0;
        });
      }
    }

    then = now;

    drawScene(gl, programInfo, camera, light, models);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

window.onload = main;
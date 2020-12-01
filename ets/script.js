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

    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;
    uniform vec4 uModelColor;

    varying lowp vec4 vColor;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = uModelColor;
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
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      modelColor: gl.getUniformLocation(shaderProgram, 'uModelColor'),
    },
  };
}

function initPlanets(gl) {
  const sunBuffers = initSphereBuffers(gl, 12);
  const largeBuffers = initSphereBuffers(gl, 8);
  const smallBuffers = initSphereBuffers(gl, 6);

  const sun = {
    parent: null,
    buffers: sunBuffers,
    color: [ 246, 215, 82, 255 ],
    size: 696340.0 / 15,
    distance: 0.0,
    revolution: 1000000000.0,
    rotation: 27.0,
  };

  const mercury = {
    parent: sun,
    buffers: smallBuffers,
    color: [ 203, 169, 131, 255 ],
    size: 2439.7,
    distance: 64902000.0 / 500,
    revolution: 87.97,
    rotation: 58.6,
  };

  const venus = {
    parent: sun,
    buffers: smallBuffers,
    color: [ 171, 109, 43, 255 ],
    size: 6051.8,
    distance: 107730000.0 / 500,
    revolution: 224.7,
    rotation: 243.0,
  };

  const earth = {
    parent: sun,
    buffers: smallBuffers,
    color: [ 15, 34, 99, 255 ],
    size: 6371.0,
    distance: 147530000.0 / 500,
    revolution: 365.26,
    rotation: 0.99,
  };

  const moon = {
    parent: earth,
    buffers: smallBuffers,
    color: [ 70, 86, 82, 255 ],
    size: 1737.1,
    distance: 384400.0 / 20,
    revolution: 27.322,
    rotation: 27.0,
  };

  const mars = {
    parent: sun,
    buffers: smallBuffers,
    color: [ 130, 119, 78, 255 ],
    size: 3389.5,
    distance: 221050000 / 600,
    revolution: 1.88 * 365.26,
    rotation: 1.03,
  };

  const jupiter = {
    parent: sun,
    buffers: largeBuffers,
    color: [ 180, 135, 90, 255 ],
    size: 69911.0 / 2,
    distance: 764390000.0 / 1200,
    revolution: 11.86 * 365.26,
    rotation: 0.41,
  };

  const saturn = {
    parent: sun,
    buffers: largeBuffers,
    color: [ 242, 201, 131, 255 ],
    size: 58232.0 / 2,
    distance: 1492000000.0 / 1400,
    revolution: 29.46 * 365.26,
    rotation: 0.45,
  };

  const uranus = {
    parent: sun,
    buffers: largeBuffers,
    color: [ 172, 214, 238, 255 ],
    size: 25362.0 / 1.5,
    distance: 2958200000.0 / 1800,
    revolution: 84.01 * 365.26,
    rotation: 0.72,
  };

  const neptune = {
    parent: sun,
    buffers: largeBuffers,
    color: [ 112, 139, 186, 255 ],
    size: 24622.0 / 1.5,
    distance: 4476100000.0 / 2200,
    revolution: 164.79 * 365.26,
    rotation: 0.67,
  };

  const pluto = {
    parent: sun,
    buffers: smallBuffers,
    color: [ 253, 253, 253, 255 ],
    size: 6371.0,
    distance: 5900000000.0 / 2600,
    revolution: 248.59 * 365.26,
    rotation: 6.39,
  };

  return [
    sun,
    mercury,
    venus,
    earth,
    moon,
    mars,
    jupiter,
    saturn,
    uranus,
    neptune,
    pluto,
  ];
}

function initSphereBuffers(gl, div) {
  var positions = [];
  for (var i = 0; i <= div; ++i) {
    var ai = i * Math.PI / div;
    var si = Math.sin(ai);
    var ci = Math.cos(ai);
    for (var j = 0; j <= div; ++j) {
      var aj = j * 2 * Math.PI / div;
      var sj = Math.sin(aj);
      var cj = Math.cos(aj);
      positions = positions.concat([ si * sj, ci, si * cj ]);
    }
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var indices = []
  for (var i = 0; i < div; ++i) {
    for (var j = 0; j < div; ++j) {
      var p1 = i * (div + 1) + j;
      var p2 = p1 + (div + 1);
      indices = indices.concat([
        p1, p2, p1 + 1,
        p1 + 1, p2, p2 + 1,
      ]);
    }
  }

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    indices: indexBuffer,
    count: indices.length,
  };
}

function drawModel(gl, programInfo, buffers, projectionMatrix,
    modelViewMatrix, modelColor) {
  gl.useProgram(programInfo.program);

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
  }

  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  gl.uniform4fv(
    programInfo.uniformLocations.modelColor,
    modelColor
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  {
    const vertexCount = buffers.count;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;

    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

function drawScene(gl, programInfo, planets) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const projectionMatrix = mat4.create();
  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 1000000000000.0;

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  mat4.translate(projectionMatrix, projectionMatrix, [ -0.0, 0.0, -600000.0 ]);
  mat4.rotate(projectionMatrix, projectionMatrix, 20 * Math.PI / 180, [ 1.0, 0.0, 0.0 ]);

  const getModelViewMatrix = (planet) => {
    const modelViewMatrix = mat4.create();

    mat4.rotate(modelViewMatrix, modelViewMatrix, planet.position, [ 0.0, 1.0, 0.0 ]);
    mat4.translate(modelViewMatrix, modelViewMatrix, [ -0.0, 0.0, planet.distance ]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, planet.angle, [ 0.0, 1.0, 0.0 ]);

    if (planet.parent) {
      mat4.multiply(modelViewMatrix, getModelViewMatrix(planet.parent), modelViewMatrix);
    }

    return modelViewMatrix;
  }

  planets.forEach(planet => {
    const modelViewMatrix = getModelViewMatrix(planet);
    mat4.scale(modelViewMatrix, modelViewMatrix, new Array(3).fill(planet.size));

    drawModel(
      gl,
      programInfo,
      planet.buffers,
      projectionMatrix,
      modelViewMatrix,
      planet.color
    );
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

  const planets = initPlanets(gl);

  planets.forEach(planet => {
    planet.position = Math.random() * Math.PI;
    planet.angle = Math.random() * Math.PI;
    planet.color.forEach((_, id, arr) => {
      arr[id] = arr[id] / 255.0;
    });
  });

  var then = null;
  const render = (now) => {
    if (then) {
      now *= 0.001;
      const elapsed = now - then;

      planets.forEach(planet => {
        planet.position += elapsed * Math.PI / planet.revolution;
        planet.angle += elapsed * Math.PI / planet.rotation;
      });
    }

    then = now;

    drawScene(gl, programInfo, planets);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

window.onload = main;

var gl;

var canvas;

var shaderProgram;

var vertexPositionBuffer;

var vertexColorBuffer;

var mvMatrix = mat4.create();

var rotAngle = 0;

function degToRad(deg) {
  return deg * 3.14159265359 / 180.0;
}

/* Fungsi untuk membuat WebGL Context */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);

  if (!shaderScript) {
    return null;
  }

  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

/* Setup untuk fragment and vertex shaders */
function setupShaders() {
  vertexShader = loadShaderFromDOM("vs-src");
  fragmentShader = loadShaderFromDOM("fs-src");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

/* Setup buffers dengan data */
function setupBuffers() {
  var blackVertices = [
    53.044, -107.604,
    40.431, -59.694,
    -54.993, -108.444,
    -31.556, -58.444,
    -162.511, -108.444,
    -102.511, -58.444,
    -165.434, -105.521,
    -105.434, -55.521,
    -168.358, -98.771,
    -108.357, -49.211,
    -122.045, 130.556,
    -81.431, 81.929,
    -115.395, 137.306,
    -76.176, 87.056,
    -110.933, 139.556,
    -35.692, 89.351,
    -45.145, 139.556,
    2.428, 90.851,
    20.643, 138.063
  ];

  var yellowVertices = [
    192.392, 138.758,
    183.421, 90.804,
    65.532, 138.938,
    79.897, 88.753,
    54.593, 138.633,
    70.861, 86.892,
    42.960, 137.485,
    64.083, 81.002,
    36.304, 133.668,
    59.131, 67.519,
    31.336, 126.423,
    54.643, 50.346,
    1.730, 50.725,
    56.257, 45.089,
    -4.551, 43.805,
    61.248, 41.514,
    -8.706, 41.054,
    223.407, 39.721,
    -78.271, 38.695,
    215.126, -8.946,
    -87.357, -9.446,
    101.923, -11.706,
    32.143, -10.548,
    98.161, -14.789,
    37.002, -12.623,
    96.643, -19.532,
    41.509, -15.844,
    106.131, -51.540,
    44.156, -18.823,
    110.527, -56.171,
    55.196, -58.007,
    120.893, -58.679,
    66.522, -98.387,
    134.893, -59.268,
    71.226, -103.942,
    153.643, -60.867,
    77.201, -106.952,
    144.111, -107.497
  ];

  var minX = Infinity;
  var maxX = 0;
  var minY = Infinity;
  var maxY = 0;

  for (var i = 1; i < blackVertices.length; i += 2) {
    if (blackVertices[i - 1] < minX) {
      minX = blackVertices[i - 1];
    }

    if (blackVertices[i - 1] > maxX) {
      maxX = blackVertices[i - 1];
    }

    if (blackVertices[i] < minY) {
      minY = blackVertices[i];
    }

    if (blackVertices[i] > maxY) {
      maxY = blackVertices[i];
    }
  }

  for (var i = 1; i < yellowVertices.length; i += 2) {
    if (yellowVertices[i - 1] < minX) {
      minX = yellowVertices[i - 1];
    }

    if (yellowVertices[i - 1] > maxX) {
      maxX = yellowVertices[i - 1];
    }

    if (yellowVertices[i] < minY) {
      minY = yellowVertices[i];
    }

    if (yellowVertices[i] > maxY) {
      maxY = yellowVertices[i];
    }
  }

  var deltaX = maxX - minX;
  var deltaY = maxY - minY;
  if (deltaX > deltaY) {
    minY -= (deltaX - deltaY) / 2;
    deltaY = deltaX;
  } else {
    minX -= (deltaY - deltaX) / 2;
    deltaX = deltaY;
  }

  for (var i = 1; i < blackVertices.length; i += 2) {
    blackVertices[i - 1] = (blackVertices[i - 1] - minX) / deltaX - 0.5;
    blackVertices[i] = (blackVertices[i] - minY) / deltaY - 0.5;
  }

  for (var i = 1; i < yellowVertices.length; i += 2) {
    yellowVertices[i - 1] = (yellowVertices[i - 1] - minX) / deltaX - 0.5;
    yellowVertices[i] = (yellowVertices[i] - minY) / deltaY - 0.5;
  }

  var triangleVertices = [];
  var colorsVertices = [];

  for (var i = 5; i < blackVertices.length; i += 2) {
    triangleVertices = triangleVertices.concat([
      blackVertices[i - 5], blackVertices[i - 4], 0.0,
      blackVertices[i - 3], blackVertices[i - 2], 0.0,
      blackVertices[i - 1], blackVertices[i], 0.0
    ]);

    colorsVertices = colorsVertices.concat([
      0.0, 0.0, 0.0, 1.0,
      0.0, 0.0, 0.0, 1.0,
      0.0, 0.0, 0.0, 1.0
    ]);
  }

  for (var i = 5; i < yellowVertices.length; i += 2) {
    triangleVertices = triangleVertices.concat([
      yellowVertices[i - 5], yellowVertices[i - 4], 0.0,
      yellowVertices[i - 3], yellowVertices[i - 2], 0.0,
      yellowVertices[i - 1], yellowVertices[i], 0.0
    ]);

    colorsVertices = colorsVertices.concat([
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0
    ]);
  }

  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = vertexPositionBuffer.itemSize
    * (blackVertices.length + yellowVertices.length - 4);

  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsVertices), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = vertexColorBuffer.itemSize
    * (blackVertices.length + yellowVertices.length - 4);
}

/* Fungsi Draw */
function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  mat4.identity(mvMatrix);
  mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle));
  mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotAngle));
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
  canvas = document.getElementById("myCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.95, 0.95, 0.95, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

function tick() {
  requestAnimationFrame(tick);
  draw();
  animate();
}

function animate() {
  var timeNow = new Date().getTime();
  if (typeof lastTime !== "undefined") {
    var elapsedTime = timeNow - lastTime;
    rotAngle = (rotAngle + elapsedTime * 0.1) % 360;
  }

  lastTime = timeNow;
}
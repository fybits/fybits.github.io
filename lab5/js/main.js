let layersOrder;

let interfaceLayer;
let tempLayer;
let mainLayer;
let interactionLayer;

function clearScreen () {
  for (let x = 0; x <= width; x++) {
    for (let y = 0; y <= height; y++) {
      set(x, y, color(0));
    }
  }
}

function drawLine(x0, y0, x1, y1, c, layer = mainLayer) {
  x0 = Math.round(x0);
  x1 = Math.round(x1);
  y0 = Math.round(y0);
  y1 = Math.round(y1);

  const deltaX = Math.abs(x1 - x0);
  const deltaY = Math.abs(y1 - y0);

  const dirX = Math.sign(x1 - x0);
  const dirY = Math.sign(y1 - y0);

  let error = deltaX - deltaY;
  let x = x0;
  let y = y0;
  setPixel(x1, y1, c, layer);

  while(x !== x1 || y !== y1) {
    setPixel(x, y, c, layer);
    const doubleError = error * 2;
    if(doubleError > -deltaY) {
      error -= deltaY;
      x += dirX;
    }
    if(doubleError < deltaX) {
      error += deltaX;
      y += dirY;
    }
  }
}

function drawBox(x0, y0, x1, y1, c, layer = mainLayer) {
  drawLine(x0, y0, x1, y0, c, layer);
  drawLine(x0, y0, x0, y1, c, layer);
  drawLine(x0, y1, x1, y1, c, layer);
  drawLine(x1, y0, x1, y1, c, layer);
}

function drawCircle(x0, y0, R, c, layer = mainLayer) {
  var Z = 0, x = 0, y = R;
  while (x <= y) {
    setPixel(x0 + x, y0 + y, c, layer);
    setPixel(x0 + x, y0 - y, c, layer);
    setPixel(x0 - x, y0 + y, c, layer);
    setPixel(x0 - x, y0 - y, c, layer);
    setPixel(x0 + y, y0 + x, c, layer);
    setPixel(x0 + y, y0 - x, c, layer);
    setPixel(x0 - y, y0 + x, c, layer);
    setPixel(x0 - y, y0 - x, c, layer);

    if (Z > 0) {
      y -= 1;
      Z -= 2 * y;
    }
    x += 1;
    Z += 2 * x;
  }
}

function setPixel(x, y, c, layer = mainLayer) {
  const index = (x + y * width) * 4;
  layer[index] = c.levels[0];
  layer[index + 1] = c.levels[1];
  layer[index + 2] = c.levels[2];
  layer[index + 3] = c.levels[3];
}

function trimPolygon(verticies, box) {
  let cp1, cp2, s, e;
  const clipPolygon = [
    { x: box.x0, y: box.y0 },
    { x: box.x1, y: box.y0 },
    { x: box.x1, y: box.y1 },
    { x: box.x0, y: box.y1 },
  ];

  const inside = (p) => (cp2.x-cp1.x)*(p.y-cp1.y) > (cp2.y-cp1.y)*(p.x-cp1.x);
  const intersection = () => {
   const dc = { x: cp1.x - cp2.x, y: cp1.y - cp2.y },
       dp = { x: s.x - e.x, y: s.y - e.y },
       n1 = cp1.x * cp2.y - cp1.y * cp2.x,
       n2 = s.x * e.y - s.y * e.x,
       n3 = 1.0 / (dc.x * dp.y - dc.y * dp.x);
   return { x: (n1*dp.x - n2*dc.x) * n3, y: (n1*dp.y - n2*dc.y) * n3 };
  };

  let outputList = verticies;
  cp1 = clipPolygon[clipPolygon.length-1];
  for (j in clipPolygon) {
   cp2 = clipPolygon[j];
   const inputList = outputList;
   outputList = [];
   s = inputList[inputList.length - 1]; //последняя точка
   for (i in inputList) {
    e = inputList[i];
    if (inside(e)) {
     if (!inside(s)) {
      outputList.push(intersection());
     }
     outputList.push(e);
    }
    else if (inside(s)) {
     outputList.push(intersection());
    }
    s = e;
   }
   cp1 = cp2;
  }
  return outputList;
}

const prevMouse = { x: 0, y: 0 };
const mouse = { x: 0, y: 0, isDown: false };
let doubleClickTimeout;


let toolIndex = 0;
let colorIndex = 0;
let colorName = '';

const maskBoxTool = {
  buttonId: '#maskbox-button',
  currBox: { x0: null, y0: null, x1: null, y1: null },
  isBoxExists: false,

  onSetup() {
    this.currBox.x0 = 0;
    this.currBox.y0 = 0;
    this.currBox.x1 = width;
    this.currBox.y1 = height;
  },

  onDown() {
    drawBox(this.currBox.x0, this.currBox.y0, this.currBox.x1, this.currBox.y1, color(0, 0, 0, 0), interfaceLayer);
    this.currBox.x0 = mouse.x;
    this.currBox.y0 = mouse.y;
    this.currBox.x1 = mouse.x;
    this.currBox.y1 = mouse.y;
  },

  onUp() {
    this.currBox.x1 = mouse.x;
    this.currBox.y1 = mouse.y;

    drawBox(this.currBox.x0, this.currBox.y0, prevMouse.x, prevMouse.y, color(0, 0, 0, 0), tempLayer);
    drawBox(this.currBox.x0, this.currBox.y0, this.currBox.x1, this.currBox.y1, color('white'), interfaceLayer);
  },

  onUpdate() {
    if (mouse.isDown) {
      this.currBox.x1 = mouse.x;
      this.currBox.y1 = mouse.y;

      drawBox(this.currBox.x0, this.currBox.y0, prevMouse.x, prevMouse.y, color(0, 0, 0, 0), tempLayer);
      drawBox(this.currBox.x0, this.currBox.y0, this.currBox.x1, this.currBox.y1, color('white'), tempLayer);
    }
  },
};

function drawPolygon(verticies, c, cycle, layer = mainLayer) {
  if (!verticies || !verticies.length) {
    return;
  }

  for (let i = 0; i < verticies.length - 1; i++) {
    drawLine(verticies[i + 1].x, verticies[i + 1].y, verticies[i].x, verticies[i].y, c, layer);
  }

  if (cycle) {
    drawLine(verticies[0].x, verticies[0].y, verticies[verticies.length - 1].x, verticies[verticies.length - 1].y, c, layer);
  }
}

const polygonTool = {
  buttonId: '#polygon-button',
  drawing: false,
  startPos: { x: null, y: null },
  lastPos: { x: null, y: null },
  tempMousePos: { x: null, y: null },
  verticies: [],

  onSetup() {},

  onDown() {
    this.verticies.push({ x: this.tempMousePos.x, y: this.tempMousePos.y });
    if (this.drawing) {
      drawLine(this.lastPos.x, this.lastPos.y, this.tempMousePos.x, this.tempMousePos.y, color(0, 0, 0, 0), tempLayer);
      drawPolygon(this.verticies, color(colorName), false, interactionLayer);

      if (this.verticies.length === 2) {
        drawCircle(this.startPos.x, this.startPos.y, 15, color('white'), interfaceLayer);
      }

      if (this.isOnFinish) {
        this.drawing = false;
        drawCircle(this.startPos.x, this.startPos.y, 15, color(0, 0, 0, 0), interfaceLayer);
        drawPolygon(this.verticies, color(0, 0, 0, 0), true, interactionLayer);
        drawPolygon(trimPolygon(this.verticies, maskBoxTool.currBox), color(colorName), true);
        this.verticies = [];
        return;
      }
    } else {
      this.startPos.x = mouse.x;
      this.startPos.y = mouse.y;
      this.tempMousePos.x = mouse.x;
      this.tempMousePos.y = mouse.y;

      this.drawing = true;
    }

    this.lastPos.x = mouse.x;
    this.lastPos.y = mouse.y;
  },

  onUp() {},

  onUpdate() {
    if (this.drawing) {
      drawLine(this.lastPos.x, this.lastPos.y, this.tempMousePos.x, this.tempMousePos.y, color(0, 0, 0, 0), tempLayer);
      drawPolygon(this.verticies, color(0, 0, 0, 0), false, interactionLayer);
    }

    if (this.isOnFinish) {
      this.tempMousePos.x = this.startPos.x;
      this.tempMousePos.y = this.startPos.y;
    } else {
      this.tempMousePos.x = mouse.x;
      this.tempMousePos.y = mouse.y;
    }

    if (this.drawing) {
      drawLine(this.lastPos.x, this.lastPos.y, this.tempMousePos.x, this.tempMousePos.y, color(colorName), tempLayer);
      drawPolygon(this.verticies, color(colorName), false, interactionLayer);
    }
  },

  get isOnFinish() {
    return this.verticies.length >= 2 && Math.sqrt((this.startPos.x - mouse.x) ** 2 + (this.startPos.y - mouse.y) ** 2 ) < 15;
  }
};

const tools = [ maskBoxTool, polygonTool ];

function setup () {
  createCanvas(window.innerWidth, window.innerHeight, 'WEBGL');

  loadPixels();
  clearScreen();
  updatePixels();

  interfaceLayer = new Uint8ClampedArray(pixels.length);
  tempLayer = new Uint8ClampedArray(pixels.length);
  interactionLayer = new Uint8ClampedArray(pixels.length);
  mainLayer = new Uint8ClampedArray(pixels.length);

  layersOrder = [ interfaceLayer, tempLayer, interactionLayer, mainLayer ];

  const canvas = document.querySelector('#defaultCanvas0');
  const rect = canvas.getBoundingClientRect();

  document.body.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX - rect.x;
    mouse.y = event.clientY - rect.y;
    tools[toolIndex].onUpdate();
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;
  });

  canvas.addEventListener('mousedown', () => {
    if (mouse.isDown) return;

    tools[toolIndex].onDown();
    mouse.isDown = true;
  });

  canvas.addEventListener('', () => {

  })

  document.body.addEventListener('mouseup', () => {
    if (!mouse.isDown) return;

    tools[toolIndex].onUp();
    mouse.isDown = false;
  });

  tools.forEach(tool => tool.onSetup());
  const toolsButtons = tools.map(tool => document.querySelector(tool.buttonId));
  toolsButtons[toolIndex].classList.add('active');
  toolsButtons.forEach((button, idx) => button.addEventListener('click', () => {
    toolsButtons[toolIndex].classList.remove('active');
    toolIndex = idx;
    button.classList.add('active');
  }));

  const colorButtons = document.querySelectorAll('.toolbar-item.color-circle');
  colorButtons[colorIndex].classList.add('active');
  colorName = colorButtons[colorIndex].getAttribute('data-color');
  colorButtons.forEach((button, idx) => button.addEventListener('click', () => {
    colorButtons[colorIndex].classList.remove('active');
    colorIndex = idx;
    colorName = button.getAttribute('data-color');
    button.classList.add('active');
  }));

  const saveButton = document.querySelector('#save-button');
  saveButton.addEventListener('click', () => {
    loadPixels();
    for (let i = 0; i < mainLayer.length; i++) {
      pixels[i] = mainLayer[i];
    }
    updatePixels();
    save('myCanvas.jpg')
  });
}

function draw() {
  loadPixels();

  let i = 0
  while (i < pixels.length) {
    const layer = layersOrder.find(l => l[i + 3]) || layersOrder[layersOrder.length - 1];

    pixels[i] = layer[i]; i++;
    pixels[i] = layer[i]; i++;
    pixels[i] = layer[i]; i++;
    pixels[i] = layer[i]; i++;
  }

  updatePixels();
}
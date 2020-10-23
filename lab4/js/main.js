let layersOrder;

let interfaceLayer;
let tempLayer;
let mainLayer;

function clearScreen () {
  for (let x = 0; x <= width; x++) {
    for (let y = 0; y <= height; y++) {
      set(x, y, color(0));
    }
  }
}

function drawLine(x0, y0, x1, y1, c, layer = mainLayer) {
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

function drawBow(x0, y0, x1, y1, c, layer = mainLayer) {
  drawLine(x0, y0, x1, y0, c, layer);
  drawLine(x0, y0, x0, y1, c, layer);
  drawLine(x0, y1, x1, y1, c, layer);
  drawLine(x1, y0, x1, y1, c, layer);
}

function setPixel(x, y, c, layer = mainLayer) {
  const index = (x + y * width) * 4;
  layer[index] = c.levels[0];
  layer[index + 1] = c.levels[1];
  layer[index + 2] = c.levels[2];
  layer[index + 3] = c.levels[3];
}

const LEFT = 0b0001;
const RIGHT = 0b0010;
const BOTTOM = 0b0100;
const TOP = 0b1000;

function computeSign(x, y, box) {
  let sign = 0;
  sign |= x < box.x0 && LEFT;
  sign |= x > box.x1 && RIGHT;
  sign |= y < box.y0 && TOP;
  sign |= y > box.y1 && BOTTOM;
  return sign;
}

function trimLine(line, box) {
  if (box.x0 > box.x1) [box.x0, box.x1] = [box.x1, box.x0];
  if (box.y0 > box.y1) [box.y0, box.y1] = [box.y1, box.y0];

  let signStart = computeSign(line.x0, line.y0, box);
  let signEnd = computeSign(line.x1, line.y1, box);

  let accept = false;

  while (((signStart || signEnd) || !++accept) && !(signStart & signEnd)) {
    let signOut;
    if (signStart != 0) {
      signOut = signStart;
    } else {
      signOut = signEnd;
    }

    let dx = line.x1 - line.x0;
    let dy = line.y1 - line.y0;

    let x, y;
    if (signOut & LEFT) {
      y = line.y0 + dy * (box.x0 - line.x0) / dx;
      x = box.x0;
    }
    if (signOut & RIGHT) {
      y = line.y0 + dy * (box.x1 - line.x0) / dx;
      x = box.x1;
    }
    if (signOut & TOP) {
      x = line.x0 + dx * (box.y0 - line.y0) / dy;
      y = box.y0;
    }
    if (signOut & BOTTOM) {
      x = line.x0 + dx * (box.y1 - line.y0) / dy;
      y = box.y1;
    }
    if (signOut === signStart) {
      line.x0 = x;
      line.y0 = y;
      signStart = computeSign(line.x0, line.y0, box);
    } else {
      line.x1 = x;
      line.y1 = y;
      signEnd = computeSign(line.x1, line.y1, box);
    }
  }

  return !accept
    ? null
    : {
      x0: Math.round(line.x0),
      y0: Math.round(line.y0),
      x1: Math.round(line.x1),
      y1: Math.round(line.y1),
    };
}

const prevMouse = { x: 0, y: 0 };
const mouse = { x: 0, y: 0, isDown: false };

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
    drawBow(this.currBox.x0, this.currBox.y0, this.currBox.x1, this.currBox.y1, color(0, 0, 0, 0), interfaceLayer);
    this.currBox.x0 = mouse.x;
    this.currBox.y0 = mouse.y;
    this.currBox.x1 = mouse.x;
    this.currBox.y1 = mouse.y;
  },

  onUp() {
    this.currBox.x1 = mouse.x;
    this.currBox.y1 = mouse.y;

    drawBow(this.currBox.x0, this.currBox.y0, prevMouse.x, prevMouse.y, color(0, 0, 0, 0), tempLayer);
    drawBow(this.currBox.x0, this.currBox.y0, this.currBox.x1, this.currBox.y1, color('white'), interfaceLayer);
  },

  onUpdate() {
    if (mouse.isDown) {
      this.currBox.x1 = mouse.x;
      this.currBox.y1 = mouse.y;

      drawBow(this.currBox.x0, this.currBox.y0, prevMouse.x, prevMouse.y, color(0, 0, 0, 0), tempLayer);
      drawBow(this.currBox.x0, this.currBox.y0, this.currBox.x1, this.currBox.y1, color('white'), tempLayer);
    }
  },
};

const collidingLineTool = {
  buttonId: '#line-button',
  startPos: { x: null, y: null },

  onSetup() {},

  onDown() {
    this.startPos.x = mouse.x;
    this.startPos.y = mouse.y;
  },

  onUp() {
    drawLine(this.startPos.x, this.startPos.y, prevMouse.x, prevMouse.y, color(0, 0, 0, 0), tempLayer);
    const trimmedLine = trimLine({ x0: this.startPos.x, y0: this.startPos.y, x1: mouse.x, y1: mouse.y }, maskBoxTool.currBox);
    console.log(trimmedLine)
    if (trimmedLine) {
      drawLine(trimmedLine.x0, trimmedLine.y0, trimmedLine.x1, trimmedLine.y1, color(colorName));
    }
    console.log(trimmedLine)

  },

  onUpdate() {
    if (mouse.isDown) {
      drawLine(this.startPos.x, this.startPos.y, prevMouse.x, prevMouse.y, color(0, 0, 0, 0), tempLayer);
      drawLine(this.startPos.x, this.startPos.y, mouse.x, mouse.y, color(colorName), tempLayer);
    }
  },
};

const tools = [ maskBoxTool, collidingLineTool ];

function setup () {
  createCanvas(window.innerWidth, window.innerHeight, 'WEBGL');

  loadPixels();
  clearScreen();
  updatePixels();

  interfaceLayer = new Uint8ClampedArray(pixels.length);
  tempLayer = new Uint8ClampedArray(pixels.length);
  mainLayer = new Uint8ClampedArray(pixels.length);

  layersOrder = [ interfaceLayer, tempLayer, mainLayer ];

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
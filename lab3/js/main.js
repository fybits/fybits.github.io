function drawLine(x0, y0, x1, y1, c) {
  const deltaX = Math.abs(x1 - x0);
  const deltaY = Math.abs(y1 - y0);

  const dirX = Math.sign(x1 - x0);
  const dirY = Math.sign(y1 - y0);

  let error = deltaX - deltaY;
  let x = x0;
  let y = y0;
  set(x1, y1, c);

  while(x !== x1 || y !== y1) {
    set(x, y, c);
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

function clearScreen () {
  for (let x = 0; x <= width; x++) {
    for (let y = 0; y <= height; y++) {
      set(x, y, color(0));
    }
  }
}

function autoRedraw(drawFunc, ...args) {
  return function() {
    loadPixels();
    drawFunc(...args);
    updatePixels();
  }
}

function isColorsEqual(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function isInBounds(x, y) {
  return x > 0 && x < width && y > 0 && y < height;
}

function getPixel(x, y) {
  const index = (x + y * width)*4;
  const levels = [];
  for (let i = 0; i < 4; i++) {
    levels.push(pixels[index + i]);
  }
  return levels;
}

function setPixel(x, y, c) {
  const index = (x + y * width)*4;
  pixels[index] = c.levels[0];
  pixels[index + 1] = c.levels[1];
  pixels[index + 2] = c.levels[2];
  pixels[index + 3] = c.levels[3];
}

async function fillBucket(x, y, c) {
  const baseColor = getPixel(x, y);
  if (isColorsEqual(baseColor, c.levels)) return;
  const stack = [];
  stack.push({ x, y })
  loadPixels();
  while (stack.length) {
    const currentPos = stack.pop()
    if (isInBounds(currentPos.x, currentPos.y)) {
      if (isColorsEqual(getPixel(currentPos.x + 1, currentPos.y), baseColor)) {
        setPixel(currentPos.x + 1, currentPos.y, c);
        stack.push({ x: currentPos.x + 1, y: currentPos.y });
      }
      if (isColorsEqual(getPixel(currentPos.x, currentPos.y + 1), baseColor)) {
        setPixel(currentPos.x, currentPos.y + 1, c);
        stack.push({ x: currentPos.x, y: currentPos.y + 1 });
      }
      if (isColorsEqual(getPixel(currentPos.x - 1, currentPos.y), baseColor)) {
        setPixel(currentPos.x - 1, currentPos.y, c);
        stack.push({ x: currentPos.x - 1, y: currentPos.y });
      }
      if (isColorsEqual(getPixel(currentPos.x, currentPos.y - 1), baseColor)) {
        setPixel(currentPos.x, currentPos.y - 1, c);
        stack.push({ x: currentPos.x, y: currentPos.y - 1 });
      }
    }
  }
  updatePixels();
}

let mousePos = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };

let toolIndex = 0;
let colorIndex = 0;
let colorName = '';

const pencilTool = {
  buttonId: "#pencil-button",
  isDrawing: false,
  onDown() {
    this.isDrawing = true;
    lastMousePos.x = mousePos.x;
    lastMousePos.y = mousePos.y;
  },
  onUpdate() {
    if (this.isDrawing) {
      drawLine(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y, color(colorName))
      lastMousePos.x = mousePos.x;
      lastMousePos.y = mousePos.y;
    }
  },
  onUp() {
    this.isDrawing = false;
  },
};

const bucketTool = {
  buttonId: "#bucket-button",
  onDown() {
    fillBucket(mousePos.x, mousePos.y, color(colorName))
  },
  onUp() {},
  onUpdate() {},
}

const tools = [ pencilTool, bucketTool ];

function setup () {
  createCanvas(window.innerWidth, window.innerHeight, 'WEBGL');

  const canvas = document.querySelector('#defaultCanvas0');
  const rect = canvas.getBoundingClientRect();

  document.body.addEventListener('mousemove', (event) => {
    mousePos.x = event.clientX - rect.x;
    mousePos.y = event.clientY - rect.y;
  });

  canvas.addEventListener('mousedown', () => tools[toolIndex].onDown());
  document.body.addEventListener('mouseup', () => tools[toolIndex].onUp());

  loadPixels();
  clearScreen();
  updatePixels();

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
  saveButton.addEventListener('click', () => save('myCanvas.jpg'));
}

function draw() {
  loadPixels();
  tools[toolIndex].onUpdate();
  updatePixels();
}


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

function drawBox(x, y, size, color) {
  const ul = { x: x - size, y: y - size };
  const ur = { x: x + size, y: y - size };
  const bl = { x: x - size, y: y + size };
  const br = { x: x + size, y: y + size };

  // Box
  drawLine(ul.x, ul.y, ur.x, ur.y, color);
  drawLine(ur.x, ur.y, br.x, br.y, color);
  drawLine(br.x, br.y, bl.x, bl.y, color);
  drawLine(bl.x, bl.y, ul.x, ul.y, color);

  // Diagonals
  drawLine(ul.x, ul.y, br.x, br.y, color);
  drawLine(ur.x, ur.y, bl.x, bl.y, color);
}

function clearWindow(x, y, w, h, color) {
  for (let px = x; px <= x + w + 1; px++) {
    for (let py = y; py <= y + h + 1; py++) {
      set(px, py, color);
    }
  }
}

class FloatingBox {
  constructor ({ size, position, movementSpeed, movementAngle, colorShiftSpeed }) {
    this.size = size / 2;
    this.position = position;
    this.movementSpeed = movementSpeed;
    this.movementVector = {
      x: Math.cos(movementAngle * Math.PI / 180),
      y: Math.sin(movementAngle * Math.PI / 180)
    }

    this.color = { r: 255, g: 255, b: 0 };
    this.colorShiftVector = { r: -1, g: 0, b: 0 }
    this.colorShiftSpeed = colorShiftSpeed;
  }

  update(deltaTime) {
    const secDeltaTime = deltaTime / 1000;

    const borders = {
      top: this.size,
      left: this.size,
      bottom: height - this.size - 1,
      right: width - this.size - 1,
    }

    const newPosition = {
      x: this.position.x + this.movementSpeed * secDeltaTime * this.movementVector.x,
      y: this.position.y += this.movementSpeed * secDeltaTime * this.movementVector.y
    };

    if (newPosition.x >= borders.right) { newPosition.x = borders.right; this.movementVector.x *= -1; }
    if (newPosition.y >= borders.bottom) { newPosition.y = borders.bottom; this.movementVector.y *= -1; }
    if (newPosition.x <= borders.left) { newPosition.x = borders.left; this.movementVector.x *= -1; }
    if (newPosition.y <= borders.top) { newPosition.y = borders.top; this.movementVector.y *= -1; }

    this.position = newPosition;

    this.color.r += this.colorShiftSpeed * secDeltaTime * this.colorShiftVector.r;
    this.color.g += this.colorShiftSpeed * secDeltaTime * this.colorShiftVector.g;
    this.color.b += this.colorShiftSpeed * secDeltaTime * this.colorShiftVector.b;

    if (this.colorShiftVector.r === 1 && this.color.r >= 255) { this.color.r = 255; this.colorShiftVector = { r: 0, g: 0, b: -1 }; }
    if (this.colorShiftVector.g === 1 && this.color.g >= 255) { this.color.g = 255; this.colorShiftVector = { r: -1, g: 0, b: 0 }; }
    if (this.colorShiftVector.b === 1 && this.color.b >= 255) { this.color.b = 255; this.colorShiftVector = { r: 0, g: -1, b: 0 }; }
    if (this.colorShiftVector.r === -1 && this.color.r <= 0) { this.color.r = 0; this.colorShiftVector = { r: 0, g: 0, b: +1 }; }
    if (this.colorShiftVector.g === -1 && this.color.g <= 0) { this.color.g = 0; this.colorShiftVector = { r: +1, g: 0, b: 0 }; }
    if (this.colorShiftVector.b === -1 && this.color.b <= 0) { this.color.b = 0; this.colorShiftVector = { r: 0, g: +1, b: 0 }; }
  }
};

const box = new FloatingBox({
  size: 100,
  position: { x: 200, y: 200 },
  movementSpeed: 500,
  movementAngle: 291,
  colorShiftSpeed: 255,
});

let radio;

function setup () {
  createCanvas(window.innerWidth, window.innerHeight * 0.9);
  const container = document.querySelector('.clear-options');
  const p = document.createElement('p');
  p.innerHTML = 'Choose clearing method';
  container.appendChild(p);
  radio = createRadio(container);
  radio.option('window');
  radio.option('image');
  radio.option('none');
  textAlign(CENTER);
}

function draw () {
  loadPixels();
  const method = radio.value();
  switch (method) {
    case 'window':
      clearWindow(box.position.x - box.size, box.position.y - box.size, box.size * 2, box.size * 2, color(0));
      break;
    case 'image':
      drawBox(Math.ceil(box.position.x), Math.ceil(box.position.y), box.size, color(0));
      break;
  }
  box.update(deltaTime);
  drawBox(Math.ceil(box.position.x), Math.ceil(box.position.y), box.size, color(box.color.r, box.color.g, box.color.b));
  updatePixels();
}

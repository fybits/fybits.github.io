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

function drawArc(x0, y0, R, color) {
  var Z = 0, x = 0, y = R;
  while (x <= y) {
    set(x0 + x, y0 + y, color);
    set(x0 + y, y0 + x, color);
    
    if (Z > 0) {
      y -= 1;
      Z -= 2 * y;
    }
    x += 1;
    Z += 2 * x;
  }
}

function drawOctants(cx, cy, r, color) {
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI/4;
    const x = Math.round(Math.cos(angle) * r);
    const y = Math.round(Math.sin(angle) * r);
    drawLine(x + cx, y + cy, cx, cy, color);
  }
}

function drawRandomLine(cx, cy, r, color) {
  const startAngle = Math.PI / 4;
  const randomAngle = Math.random() * startAngle;
  const randomRadius = Math.random() * r;
  const x = Math.round(Math.cos(randomAngle) * randomRadius);
  const y = Math.round(Math.sin(randomAngle) * randomRadius);
  drawLine(cx + x, cy + y, cx, cy, color);
}

function clearScreen () {
  for (let x = 0; x <= width; x++) {
    for (let y = 0; y <= height; y++) {
      set(x, y, color);
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

function setup () {
  createCanvas(window.innerWidth, window.innerHeight * 0.9);
  document.querySelector('#btn-clear').onclick = autoRedraw(clearScreen);
  document.querySelector('#btn-draw-line').onclick = autoRedraw(drawRandomLine,  Math.floor(width/2), Math.floor(height/2), 200, color(255, 0, 0));
  document.querySelector('#btn-draw-octants').onclick = autoRedraw(drawOctants, Math.floor(width/2), Math.floor(height/2), 220, color(255));
  document.querySelector('#btn-draw-arc').onclick = autoRedraw(drawArc, Math.floor(width/2), Math.floor(height/2), 200, color(255, 255, 0));
}

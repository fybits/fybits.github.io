/* eslint-disable no-undef */
// Функция генерации массива чисел от 0 до n
function* range(n) {
  for (let i = 0; i <= n; i++) yield i;
}

// Функция инициализации типовой гистограммы
const createHist = (canvas, color) => new Chart(canvas, {
  type: 'bar',
  data: {
    labels: [...range(255)],
    datasets: [{
      data: Array(256).fill(0),
      backgroundColor: color,
    }],
  },
  options: {
    maintainAspectRatio: false,
    legend: { display: false },
    scales: {
      xAxes: [{
        display: false,
        barPercentage: 1.3,
      }],
      yAxes: [{
        ticks: { beginAtZero: true },
      }],
    },
  },
});

// Инициализация гистограмм
const redHist = createHist(document.getElementById('r-hist').getContext('2d'), 'red');
const greenHist = createHist(document.getElementById('g-hist').getContext('2d'), 'green');
const blueHist = createHist(document.getElementById('b-hist').getContext('2d'), 'blue');

// Сохранение наборов значений гистограмм в отдельные переменные
const red = redHist.data.datasets[0];
const green = greenHist.data.datasets[0];
const blue = blueHist.data.datasets[0];

// Сохранение элементов разметки в переменные
const [imageDisplay] = document.getElementsByClassName('image-display');
const fileDialog = document.getElementById('file-dialog');
const label = document.querySelector('.image-display label');
const fileReader = new FileReader();
const rVal = document.getElementById('r-val');
const gVal = document.getElementById('g-val');
const bVal = document.getElementById('b-val');

fileDialog.addEventListener('change', async () => {
  // Ожидание загрузки файла
  await new Promise((res) => {
    fileReader.onload = res;
    fileReader.readAsDataURL(fileDialog.files[0]);
  });

  // Установка предпросмотра изображения
  label.textContent = '';
  imageDisplay.style['background-image'] = `url(${fileReader.result})`;

  // Конвертация файла изображения в битмап
  const img = new Image();
  await new Promise((res) => {
    img.onload = res;
    img.src = fileReader.result;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  const bmp = ctx.getImageData(0, 0, img.width, img.height).data;

  // Очистка гистограмм
  red.data.fill(0);
  green.data.fill(0);
  blue.data.fill(0);

  // Расчет значений столбоцов гистограмм и общего максимума
  let max = 0;
  for (let i = 0; i < bmp.length; i++) {
    max = Math.max(max, ++red.data[bmp[i++]]);
    max = Math.max(max, ++green.data[bmp[i++]]);
    max = Math.max(max, ++blue.data[bmp[i++]]);
  }

  // Установка общего максимального значения для гистограмм
  const stepSize = Math.ceil(max / 6);
  redHist.options.scales.yAxes[0].ticks = { min: 0, max, stepSize };
  greenHist.options.scales.yAxes[0].ticks = { min: 0, max, stepSize };
  blueHist.options.scales.yAxes[0].ticks = { min: 0, max, stepSize };

  // Расчёт количеств пикселей
  const rPixelsNum = red.data.reduce((total, curr) => total + curr);
  const gPixelsNum = green.data.reduce((total, curr) => total + curr);
  const bPixelsNum = blue.data.reduce((total, curr) => total + curr);

  // Вычисление значений энтропии
  const rEntropy = red.data.reduce((result, curr) => {
    if (!curr) return result;
    const pi = curr / rPixelsNum;
    return result - pi * Math.log2(pi);
  }, 0);

  const gEntropy = green.data.reduce((result, curr) => {
    if (!curr) return result;
    const pi = curr / gPixelsNum;
    return result - pi * Math.log2(pi);
  }, 0);

  const bEntropy = blue.data.reduce((result, curr) => {
    if (!curr) return result;
    const pi = curr / bPixelsNum;
    return result - pi * Math.log2(pi);
  }, 0);

  // Вычисление и отображение значений избыточности
  rVal.textContent = (1 - rEntropy / 8).toFixed(6);
  gVal.textContent = (1 - gEntropy / 8).toFixed(6);
  bVal.textContent = (1 - bEntropy / 8).toFixed(6);

  // Обновление гистограмм
  redHist.update();
  greenHist.update();
  blueHist.update();
});

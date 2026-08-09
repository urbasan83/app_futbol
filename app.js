const canvas = document.getElementById('tablero');
const ctx = canvas.getContext('2d');

// 1. Estado inicial de las piezas
let piezas = [
  { id: 1, x: 100, y: 200, radio: 20, color: '#e74c3c', texto: '1' },
  { id: 2, x: 150, y: 200, radio: 20, color: '#e74c3c', texto: '2' },
  { id: 3, x: 450, y: 200, radio: 20, color: '#3498db', texto: 'A' },
  { id: 4, x: 500, y: 200, radio: 20, color: '#3498db', texto: 'B' }
];

let keyframes = []; // Guarda el historial de posiciones
let piezaArrastrada = null;
let offset = { x: 0, y: 0 };

// 2. Renderizar el tablero y las piezas
function dibujarTablero() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar líneas de campo táctico
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 20);
  ctx.lineTo(canvas.width / 2, canvas.height - 20);
  ctx.stroke();

  // Dibujar piezas
  piezas.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Texto de la pieza
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.texto, p.x, p.y);
  });
}

dibujarTablero();

// 3. Sistema de Arrastre (Drag & Drop)
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  piezaArrastrada = piezas.find(p => {
    const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
    return dist < p.radio;
  });

  if (piezaArrastrada) {
    offset.x = mouseX - piezaArrastrada.x;
    offset.y = mouseY - piezaArrastrada.y;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!piezaArrastrada) return;
  const rect = canvas.getBoundingClientRect();
  piezaArrastrada.x = (e.clientX - rect.left) - offset.x;
  piezaArrastrada.y = (e.clientY - rect.top) - offset.y;
  dibujarTablero();
});

window.addEventListener('mouseup', () => {
  piezaArrastrada = null;
});

// 4. Capturar estado actual (Keyframe)
document.getElementById('btnCapturar').addEventListener('click', () => {
  // Clona profundamente la posición actual de cada pieza
  const copiaEstado = piezas.map(p => ({ id: p.id, x: p.x, y: p.y }));
  keyframes.push(copiaEstado);
  document.getElementById('estado').innerText = `Fotogramas guardados: ${keyframes.length}`;
});

// 5. Motor de Animación entre Fotogramas
function animarSecuencia(onComplete) {
  if (keyframes.length < 2) {
    alert("Debes capturar al menos 2 posiciones para crear una animación.");
    if (onComplete) onComplete();
    return;
  }

  let pasoActual = 0;
  const duracionPaso = 1000; // 1 segundo de transición por paso
  let tiempoInicio = null;

  function interpolar(timestamp) {
    if (!tiempoInicio) tiempoInicio = timestamp;
    const progreso = Math.min((timestamp - tiempoInicio) / duracionPaso, 1);

    const origen = keyframes[pasoActual];
    const destino = keyframes[pasoActual + 1];

    // Calcular posición intermedia (interpolación lineal)
    piezas.forEach(pieza => {
      const pOrigen = origen.find(p => p.id === pieza.id);
      const pDestino = destino.find(p => p.id === pieza.id);

      if (pOrigen && pDestino) {
        pieza.x = pOrigen.x + (pDestino.x - pOrigen.x) * progreso;
        pieza.y = pOrigen.y + (pDestino.y - pOrigen.y) * progreso;
      }
    });

    dibujarTablero();

    if (progreso < 1) {
      requestAnimationFrame(interpolar);
    } else {
      pasoActual++;
      if (pasoActual < keyframes.length - 1) {
        tiempoInicio = null;
        requestAnimationFrame(interpolar);
      } else if (onComplete) {
        onComplete();
      }
    }
  }

  requestAnimationFrame(interpolar);
}

document.getElementById('btnReproducir').addEventListener('click', () => animarSecuencia());

// 6. Exportación a Video con MediaRecorder
document.getElementById('btnExportar').addEventListener('click', () => {
  if (keyframes.length < 2) {
    alert("Debes capturar al menos 2 posiciones.");
    return;
  }

  const stream = canvas.captureStream(30); // 30 FPS
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const fragmentos = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) fragmentos.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(fragmentos, { type: 'video/webm' });
    const url = URL.ObjectURL(url);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tactica-animada.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Posicionar piezas en la primera captura antes de grabar
  piezas.forEach(p => {
    const inicio = keyframes[0].find(k => k.id === p.id);
    if (inicio) { p.x = inicio.x; p.y = inicio.y; }
  });
  dibujarTablero();

  mediaRecorder.start();
  animarSecuencia(() => {
    setTimeout(() => mediaRecorder.stop(), 500); // Pequeña pausa final antes de cortar
  });
});

// Resetear fotogramas
document.getElementById('btnReiniciar').addEventListener('click', () => {
  keyframes = [];
  document.getElementById('estado').innerText = `Fotogramas guardados: 0`;
});

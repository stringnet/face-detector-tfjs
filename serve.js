const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// ✅ CSP extendido para permitir Google Fonts
app.use((req, res, next) => {
  res.setHeader(
  "Content-Security-Policy",
  "default-src 'self'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "script-src 'self' 'unsafe-eval'; " +
  "img-src 'self' data: blob:; " +
  "connect-src 'self' https://tfhub.dev https://storage.googleapis.com;"
);
  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Redirigir cualquier ruta al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});

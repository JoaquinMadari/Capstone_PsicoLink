const express = require('express');
const path = require('path');

const app = express();

// Define la carpeta de archivos estáticos (www/browser)
const staticPath = path.join(__dirname, 'www/browser');
app.use(express.static(staticPath));

// Maneja todas las rutas y redirige al index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Configura el puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
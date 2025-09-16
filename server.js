const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde "www"
app.use(express.static(path.join(__dirname, "www")));

// Fallback a index.html (para apps con routing en Ionic/Angular)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "www", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
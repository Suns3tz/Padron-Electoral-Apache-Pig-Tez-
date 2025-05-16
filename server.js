const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());

function parseLinea(linea) {
  return {
    cedula: linea.slice(0, 9).trim(),
    codelec: linea.slice(9, 15).trim(),
    fechaCaducidad: `${linea.slice(16, 20)}-${linea.slice(20, 22)}-${linea.slice(22, 24)}`,
    junta: linea.slice(24, 29).trim(),
    nombre: (
      linea.slice(29, 59) +
      ' ' + linea.slice(59, 85) +
      ' ' + linea.slice(85, 111)
    ).trim().replace(/\s+/g, ' ')
  };
}

function cargarPadron() {
  const texto = fs.readFileSync('./padron.txt', 'utf8');
  const lineas = texto.split('\n').filter(l => l.trim().length > 0);
  const personasPorDistrito = {};

  for (const linea of lineas) {
    const persona = parseLinea(linea);
    if (!personasPorDistrito[persona.codelec]) {
      personasPorDistrito[persona.codelec] = [];
    }
    personasPorDistrito[persona.codelec].push(persona);
  }

  return personasPorDistrito;
}

const padron = cargarPadron();

app.get('/personas/:codelec', (req, res) => {
  const { codelec } = req.params;
  res.json(padron[codelec] || []);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
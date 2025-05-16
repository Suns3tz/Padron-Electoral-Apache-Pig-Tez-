import express from 'express';
import cors from 'cors';
import { buscarPorCedula, buscarPorDistrito, obtenerDistritos }from './pig/scriptsPig.js';

const app = express();

app.use(cors());
app.use(express.json());

/*
Este es el path que requiere el sistema para llamar la funcion que
va a buscar los datos de la cedula pasada por parametro.
*/

app.post('/buscarCedula', (req, res) => {
    const { cedula } = req.body;
    const cedulaStr = String(cedula).trim();

    if (!cedula) {
        return res.status(400).json({ error: 'Cédula requerida' });
    }

    buscarPorCedula(cedulaStr, (err, datos) => {
        if (err) {
            return res.status(500).json({ error: 'Error al ejecutar Pig', details: err.message });
        }
        if (!datos) {
            return res.status(404).json({ error: 'No se encontraron datos' });
        }

        res.json(datos);
    });
});

/*
Este es el path que requiere el sistema para llamar la funcion que
va a buscar los datos de las personas pertenecientes a 
la region pasada por parametro.
*/

app.post('/buscarDistrito', (req, res) => {
    const { distrito } = req.body;
    const distritoStr = String(distrito).trim();
    if (!distrito) {
        return res.status(400).json({ error: 'Distrito requerido' });
    }

    buscarPorDistrito(distritoStr, (err, datos) => {
        if (err) {
            return res.status(500).json({ error: 'Error al ejecutar Pig', details: err.message });
        }
        if (!datos) {
            return res.status(404).json({ error: 'No se encontraron datos' });
        }

        res.json(datos);
    });
});

/*
Este es el path que requiere el sistema para llamar la funcion que
va a obtener todos los distritos.
*/

app.post('/obtenerDistritos', (req, res) => {
    obtenerDistritos((err, datos) => {
        if (err) {
            return res.status(500).json({ error: 'Error al ejecutar Pig', details: err.message });
        }
        if (!datos) {
            return res.status(404).json({ error: 'No se encontraron datos' });
        }
        res.json(datos);
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});

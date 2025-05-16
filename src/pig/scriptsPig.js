import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obtener __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaPadron = path.join(__dirname, 'PADRON_COMPLETO.txt');
const rutaDistelec = path.join(__dirname, 'distelec.txt');

/*
Función que pone el resultado del script de Pig en formato JSON.
*/
function formatearResultado(stdout) {
    const lineas = stdout.split('\n');

    // Constante que almacena el resultado una vez encontrado
    const lineaResultado = lineas.find(line => line.trim().startsWith('(') && line.trim().endsWith(')'));

    if (!lineaResultado) return null;

    // Se quitan paréntesis y espacios extras
    const valoresCrudos = lineaResultado.trim().slice(1, -1).split(',');
    const valores = valoresCrudos.map(v => v.trim());

    return {
        cedula: valores[0],
        nombre: valores[1],
        apellido1: valores[2],
        apellido2: valores[3],
        fechacaduc: valores[4],
        junta: valores[5],
        provincia: valores[6],
        canton: valores[7],
        distrito: valores[8]
    };
}

/*
Función que pone el resultado del script de Pig en formato JSON.
Pero dado que son numerosos datos, los agrega en un array.
*/
function formatearResultadoD(stdout) {
    const lineas = stdout.split('\n');

    // Filtrar solo las líneas que tienen el formato esperado
    const lineasResultados = lineas.filter(linea =>
        linea.trim().startsWith('(') && linea.trim().endsWith(')')
    );

    if (lineasResultados.length === 0) return [];

    const resultados = lineasResultados.map(linea => {
        const valoresCrudos = linea.trim().slice(1, -1).split(',');
        const valores = valoresCrudos.map(v => v.trim());

        // Validar que hay exactamente 4 campos
        if (valores.length !== 4) return null;

        return {
            cedula: valores[0],
            nombre: valores[1],
            fechacaduc: valores[2],
            junta: valores[3]
        };
    });

    return resultados.filter(r => r !== null);
}

/*
Función que recibe una cédula y ejecuta el script en Pig para buscar
los datos relacionados a dicha cédula.
*/
function buscarPorCedula(cedula, callback) {
    
    // Validar existencia de archivos
    if (!fs.existsSync(rutaPadron)) {
        return callback(new Error(`Archivo no encontrado: ${rutaPadron}`));
    }
    if (!fs.existsSync(rutaDistelec)) {
        return callback(new Error(`Archivo no encontrado: ${rutaDistelec}`));
    }
    
    const script = 
    `
        padron_raw = LOAD '${rutaPadron}' USING PigStorage(',') 
        AS (
            cedula:chararray, 
            codelec:chararray, 
            relleno:chararray, 
            fechacaduc:chararray, 
            junta:chararray, 
            nombre:chararray, 
            apellido1:chararray, 
            apellido2:chararray
        );

        padron_limpio = FOREACH padron_raw GENERATE 
            cedula,
            codelec,
            fechacaduc,
            junta,
            TRIM(nombre) AS nombre,
            TRIM(apellido1) AS apellido1,
            TRIM(apellido2) AS apellido2;

        padron_filtrado = FILTER padron_limpio BY cedula == '${cedula}';

        distritos = LOAD '${rutaDistelec}' USING PigStorage(',') 
        AS (
            codelec:chararray, 
            provincia:chararray, 
            canton:chararray, 
            distrito:chararray
        );

        padron_con_regiones = JOIN padron_filtrado BY codelec, distritos BY codelec;

        resultado = FOREACH padron_con_regiones GENERATE 
            cedula,
            nombre,
            apellido1,
            apellido2,
            fechacaduc,
            junta,
            provincia,
            canton,
            distrito;

        DUMP resultado;
    `;

    const scriptPath = path.join(__dirname, 'script_tmp.pig');
    fs.writeFile(scriptPath, script, (err) => {
        if (err) {
            return callback(err);
        }

        exec(`pig -x local ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                return callback(error);
            }

            if (stderr) {
                console.warn('Advertencia:', stderr);
            }

            fs.unlink(scriptPath, () => {}); // Elimina el archivo temporal

            const resultadoFormateado = formatearResultado(stdout);
            callback(null, resultadoFormateado);
        });
    });
}

/*
Función que recibe un distrito y ejecuta el script en Pig para buscar
las personas asociadas a dicho distrito.
*/
function buscarPorDistrito(distritoBuscado, callback) {
    // Validar existencia de archivos
    if (!fs.existsSync(rutaPadron)) {
        return callback(new Error(`Archivo no encontrado: ${rutaPadron}`));
    }
    if (!fs.existsSync(rutaDistelec)) {
        return callback(new Error(`Archivo no encontrado: ${rutaDistelec}`));
    }
    
    const script = 
    `
        padron_raw = LOAD '${rutaPadron}' USING PigStorage(',') 
        AS (
            cedula:chararray, 
            codelec:chararray, 
            relleno:chararray, 
            fechacaduc:chararray, 
            junta:chararray, 
            nombre:chararray, 
            apellido1:chararray, 
            apellido2:chararray
        );

        padron_limpio = FOREACH padron_raw GENERATE 
            TRIM(cedula) AS cedula,
            TRIM(codelec) AS codelec,
            TRIM(fechacaduc) AS fechacaduc,
            TRIM(junta) AS junta,
            TRIM(nombre) AS nombre,
            TRIM(apellido1) AS apellido1,
            TRIM(apellido2) AS apellido2;

        padron_filtrado = FILTER padron_limpio BY TRIM(codelec) == TRIM('${distritoBuscado}');

        padron_ordenado = ORDER padron_filtrado BY cedula;

        resultado = FOREACH padron_ordenado GENERATE 
            cedula,
            CONCAT(CONCAT(nombre, ' '), CONCAT(apellido1, CONCAT(' ', apellido2))) AS nombreCompleto,
            fechacaduc,
            junta;

        DUMP resultado;

    `;

    const scriptPath = path.join(__dirname, 'script_tmp.pig');
    fs.writeFile(scriptPath, script, (err) => {
        if (err) {
            return callback(err);
        }
        
        exec(`pig -x local ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                return callback(error);
            }

            if (stderr) {
                console.warn('Advertencia:', stderr);
            }

            fs.unlink(scriptPath, () => {}); // Elimina el archivo temporal
            const resultadoFormateado = formatearResultadoD(stdout);
            callback(null, resultadoFormateado);
        });
    });
}

/*
Funcion que devuelve todos los distritos sin repetir.
*/

function obtenerDistritos(callback) {
    if (!fs.existsSync(rutaDistelec)) {
        return callback(new Error(`Archivo no encontrado: ${rutaDistelec}`));
    }

    const script = 
    `
        distritos = LOAD '${rutaDistelec}' USING PigStorage(',') 
        AS (
            codelec:chararray, 
            provincia:chararray, 
            canton:chararray, 
            distrito:chararray
        );

        distritos_limpios = FOREACH distritos GENERATE 
            TRIM(codelec) AS codelec,
            UPPER(TRIM(provincia)) AS provincia,
            UPPER(TRIM(canton)) AS canton,
            UPPER(TRIM(distrito)) AS distrito;

        distritos_unicos = DISTINCT distritos_limpios;

        distritos_ordenados = ORDER distritos_unicos BY provincia, canton, distrito;

        DUMP distritos_ordenados;
    `;

    const scriptPath = path.join(__dirname, 'script_tmp_distritos.pig');
    fs.writeFile(scriptPath, script, (err) => {
        if (err) {
            return callback(err);
        }

        exec(`pig -x local ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                return callback(error);
            }

            if (stderr) {
                console.warn('Advertencia:', stderr);
            }

            fs.unlink(scriptPath, () => {}); // Elimina el archivo temporal
            const distritos = stdout
                .split('\n')
                .filter(line => line.trim().startsWith('(') && line.includes(','))
                .map(line => {
                    const cleanLine = line.replace(/[()]/g, '').trim();
                    const [codelec, provincia, canton, distrito] = cleanLine.split(',').map(x => x.trim());
                    return { codelec, provincia, canton, distrito };
                });

            callback(null, distritos);
        });
    });
}

export { 
    buscarPorCedula, 
    buscarPorDistrito,
    obtenerDistritos
};

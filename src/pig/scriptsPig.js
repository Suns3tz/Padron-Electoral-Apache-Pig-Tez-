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

        // Validar que hay exactamente 7 campos
        if (valores.length !== 7) return null;

        return {
            cedula: valores[0],
            nombre: valores[1],
            apellido1: valores[2],
            apellido2: valores[3],
            provincia: valores[4],
            canton: valores[5],
            distrito: valores[6]
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
        padron_raw = LOAD '/home/william/Documents/GitHub/Padron-Electoral-Apache-Pig-Tez-/src/pig/PADRON_COMPLETO.txt' USING PigStorage(',') 
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

        distritos = LOAD '/home/william/Documents/GitHub/Padron-Electoral-Apache-Pig-Tez-/src/pig/distelec.txt' USING PigStorage(',') 
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
        padron_raw = LOAD '/home/william/Documents/GitHub/Padron-Electoral-Apache-Pig-Tez-/src/pig/PADRON_COMPLETO.txt' USING PigStorage(',') 
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
            TRIM(codelec) AS codelec,
            fechacaduc,
            junta,
            TRIM(nombre) AS nombre,
            TRIM(apellido1) AS apellido1,
            TRIM(apellido2) AS apellido2;

        distritos = LOAD '/home/william/Documents/GitHub/Padron-Electoral-Apache-Pig-Tez-/src/pig/distelec.txt' USING PigStorage(',') 
        AS (
            codelec:chararray, 
            provincia:chararray, 
            canton:chararray, 
            distrito:chararray
        );

        distritos_limpios = FOREACH distritos GENERATE 
            TRIM(codelec) AS codelec, 
            provincia, 
            canton, 
            UPPER(TRIM(distrito)) AS distrito;

        padron_con_regiones = JOIN padron_limpio BY codelec, distritos_limpios BY codelec;

        resultado_filtrado = FILTER padron_con_regiones BY UPPER(TRIM(distrito)) == UPPER(TRIM('${distritoBuscado}'));

        resultado = FOREACH resultado_filtrado GENERATE 
            cedula,
            nombre,
            apellido1,
            apellido2,
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
            const resultadoFormateado = formatearResultadoD(stdout);
            callback(null, resultadoFormateado);
        });
    });
}

export { 
    buscarPorCedula, 
    buscarPorDistrito 
};

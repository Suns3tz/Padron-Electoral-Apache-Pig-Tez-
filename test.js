const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

/*
Funcion que pone el resultado del script de pig en formato JSON.
*/

function formatearResultado(stdout) {
    const lineas = stdout.split('\n');

    // Constante que almacena el resultado una vez encontrado
    const lineaResultado = lineas.find(line => line.trim().startsWith('(') && line.trim().endsWith(')'));

    if (!lineaResultado) return null;

    // Se quitan parentesis y espacios extras
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
Funcion que recibe una cedula y ejecuta el script en pig para buscar
los datos relacionados a dicha cedula.
*/

function ejecutarPig(cedula, callback) {
    const script = 
    `
        padron_raw = LOAD 'PADRON_COMPLETO.txt' USING PigStorage(',') 
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

        distritos = LOAD 'distelec.txt' USING PigStorage(',') 
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

    // Crea temporalmente el script.pig para ejecutarlo
    const scriptPath = path.join(__dirname, 'script_tmp.pig');

    fs.writeFile(scriptPath, script, (err) => {
        if (err) {
            return callback(err);
        }

        // Ejecuta el comando junto al script temporal
        exec(`pig -x local ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                return callback(error);
            }
            if (stderr) {
                console.warn('Advertencia:', stderr);
            }
        
            // Se elimina el archivo .pig termporal
            fs.unlink(scriptPath, () => {});
        
            // Se pone el resultado en formato JSON
            const resultadoFormateado = formatearResultado(stdout);
            callback(null, resultadoFormateado);
        });        
    });
}

/*
Se llama la funcion ejecutarPig con una cedula.
*/
ejecutarPig("103410517", (err, datos) => {
    if (err) {
        console.error("Error al ejecutar Pig:", err);
    } else {
        console.log("Datos estructurados:", JSON.stringify(datos, null, 2));
    }
});

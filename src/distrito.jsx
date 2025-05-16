import React, { useState, useEffect } from 'react';
import './shared/forms.css';

const Distrito = () => {
  const [distritos, setDistritos] = useState([]);
  const [distritoSeleccionado, setDistritoSeleccionado] = useState('');
  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setDistritos(['307002']);
    setPersonas([
      { cedula: '123456789', nombre: 'Juan Pérez', junta: '1', fechaCaducidad: '2030-12-31' },
    ]);
    setDistritoSeleccionado('307002');
    setCargando(false);
  }, []);

  const handleChange = (e) => {
    setDistritoSeleccionado(e.target.value);
  };

  return (
    <div>
      <label htmlFor="distrito">Seleccione un distrito:</label>
      <select id="distrito" value={distritoSeleccionado} onChange={handleChange}>
        <option value="">-- Seleccione --</option>
        {distritos.map(codelec => (
          <option key={codelec} value={codelec}>Distrito {codelec}</option>
        ))}
      </select>

      {cargando && <p>Cargando...</p>}

      {!cargando && personas.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Junta</th>
              <th>Fecha Caducidad</th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p, index) => (
              <tr key={index}>
                <td>{p.cedula}</td>
                <td>{p.nombre}</td>
                <td>{p.junta}</td>
                <td>{p.fechaCaducidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Distrito;
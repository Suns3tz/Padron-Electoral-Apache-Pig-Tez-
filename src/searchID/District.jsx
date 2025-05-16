import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './District.css';
import './SearchIdentification.css'; // Importa los estilos para el componente

const Distrito = () => {
  const [distritos, setDistritos] = useState([]);
  const [distritoSeleccionado, setDistritoSeleccionado] = useState('');
  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Se establece el formato de las fechas de caducidad
  const formatearFecha = (fechaStr) => {
    if (!fechaStr || fechaStr.length !== 8) return fechaStr;
  
    const anio = fechaStr.substring(0, 4);
    const mes = fechaStr.substring(4, 6);
    const dia = fechaStr.substring(6, 8);
  
    return `${dia}/${mes}/${anio}`;
  };  

  useEffect(() => {

    // Se carga el combo box con los distritos
    const cargarDistritos = async () => {
      try {
        const response = await axios.post('http://localhost:3001/obtenerDistritos');
        setDistritos(response.data);
        setCargando(false);
      } catch (error) {
        toast.error('Error cargando distritos');
        setCargando(false);
      }
    };

    cargarDistritos();
  }, []);

  // Se ejecuta la busqueda de personas por distrito
  const buscarPersonasPorDistrito = async (codelec) => {
    try {
      setCargando(true);
      const response = await axios.post('http://localhost:3001/buscarDistrito', { distrito: codelec });

      setPersonas(response.data);
      toast.success('Búsqueda exitosa');
      setCargando(false);
    } catch (error) {
      setPersonas([]);
      setCargando(false);
      if (error.response) {
        toast.error(error.response.data.error || 'Error al buscar personas');
      } else {
        toast.error('Error de conexión con el servidor');
      }
    }
  };

  // Se actualizan los datos segun lo seleccionado
  const handleChange = (e) => {
    const nuevoDistrito = e.target.value;
    setDistritoSeleccionado(nuevoDistrito);
    buscarPersonasPorDistrito(nuevoDistrito);
  };

  // Botones de navegación
  const handleBuscarCedulaClick = () => {
    window.location.href = '/';
  };

  const handleBuscarDistritoClick = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="top-buttons-container">
        <button className="nav-button" onClick={handleBuscarCedulaClick}>
          Buscar por Cédula
        </button>
        <button className="nav-button" onClick={handleBuscarDistritoClick}>
          Buscar por Distrito
        </button>
      </div>

      <div className="search-id-app">
        <header className="navbar">
          <h1>Padrón Electoral</h1>
        </header>

        <main className="main-content">
          <div className="search-container">
            <label htmlFor="distrito">Seleccione un distrito:</label>
            <select id="distrito" value={distritoSeleccionado} onChange={handleChange}>
              <option value="">-- Seleccione --</option>
              {distritos.map(({ codelec, provincia, canton, distrito }) => (
                <option key={codelec} value={codelec}>
                  {provincia} - {canton} - {distrito}
                </option>
              ))}
            </select>
          </div>

          {cargando && <p>Cargando datos...</p>}

          {!cargando && personas.length > 0 && (
            <div className="resultado-container">
              <table className="resultado-tabla">
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
                      <td>{formatearFecha(p.fechacaduc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!cargando && personas.length === 0 && (
            <p>No se encontraron personas para este distrito.</p>
          )}
        </main>

        <ToastContainer />
      </div>
    </>
  );
};

export default Distrito;

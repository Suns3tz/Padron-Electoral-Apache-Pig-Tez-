import React, { useState } from 'react'; // Importa React y useState para manejar estados
import axios from 'axios'; // Importa axios para hacer peticiones

import { ToastContainer, toast } from 'react-toastify'; // Para mostrar mensajes
import 'react-toastify/dist/ReactToastify.css'; // Formato de la caja para los mensajes

import './SearchIdentification.css'; // Importa los estilos para el componente

const SearchIdentification = () => {

  // Se estableces las variables para manejar los estados
  const [cedula, setCedula] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Función que se ejecuta al presionar "Buscar"
  const buscar = async () => {

    if (!cedula.trim()) {
      toast.error('Por favor ingresa una cédula');
      return;
    }

    setBuscando(true); // Comienza la búsqueda

    try {
      // Llamada POST a la API local para buscar la cédula
      const response = await axios.post('http://localhost:3001/buscarCedula', { cedula });

      setResultado(response.data); // Guarda el resultado en el estado
      toast.success('Búsqueda exitosa');
    } catch (err) {
      // Manejo de errores
      if (err.response) {
        toast.error(err.response.data.error || 'Error en la búsqueda');
      } else {
        toast.error('No se pudo conectar con el servidor');
      }
    }finally {
      setBuscando(false); // Termina la búsqueda
    }
  };

  // Manejadores para los botones superiores
  const handleBuscarCedulaClick = () => {
    window.location.reload(); // recarga la página
  };

  const handleBuscarDistritoClick = () => {
    window.location.href = '/district'; // redirige a la busqueda por distrito
  };

  return (
    <>
      {/* Botones arriba del contenedor principal */}
      <div className="top-buttons-container">
      <button className="nav-button" onClick={handleBuscarCedulaClick}>
          Buscar por Cédula
        </button>
        <button className="nav-button" onClick={handleBuscarDistritoClick}>
          Buscar por Distrito
        </button>
      </div>

      <div className="search-id-app">
        {/* Barra de navegación */}
        <header className="navbar">
          <h1>Padrón Electoral</h1>
        </header>

        {/* Contenido principal */}
        <main className="main-content">
          {/* Contenedor de búsqueda */}
          <div className="search-container">
            <label htmlFor="cedula">Buscar por cédula:</label>
            <input
              type="text"
              id="cedula"
              placeholder="Ej: 123456789"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
            <button onClick={buscar} disabled={buscando}>
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Contenedor de resultados */}
          <div className="resultado-container">
            {resultado && (
              <table className="resultado-tabla">
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre</th>
                    <th>Apellido 1</th>
                    <th>Apellido 2</th>
                    <th>Fecha Caducidad</th>
                    <th>Junta</th>
                    <th>Provincia</th>
                    <th>Cantón</th>
                    <th>Distrito</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{resultado.cedula}</td>
                    <td>{resultado.nombre}</td>
                    <td>{resultado.apellido1}</td>
                    <td>{resultado.apellido2}</td>
                    <td>{resultado.fechacaduc}</td>
                    <td>{resultado.junta}</td>
                    <td>{resultado.provincia}</td>
                    <td>{resultado.canton}</td>
                    <td>{resultado.distrito}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* Contenedor para toasts */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          draggable
          pauseOnFocusLoss
        />
      </div>
    </>
  );
};

export default SearchIdentification;

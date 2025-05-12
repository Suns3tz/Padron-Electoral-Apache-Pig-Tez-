import React from 'react'; // Importa React para crear el componente
import './SearchIdentification.css'; // Importa los estilos para el componente

// Componente SearchIdentification
const SearchIdentification = () => {
  return (
    <div className="search-id-app"> {/* Contenedor principal del componente */}
      
      {/* Barra de navegación */}
      <header className="navbar">
        <h1>Padrón Electoral</h1> {/* Título del encabezado */}
      </header>

      {/* Contenido principal de la página */}
      <main className="main-content">
        
        {/* Contenedor para la búsqueda por cédula */}
        <div className="search-container">
          <label htmlFor="cedula">Buscar por cédula:</label> {/* Etiqueta descriptiva del campo */}
          
          {/* Campo de entrada para que el usuario ingrese la cédula */}
          <input
            type="text"
            id="cedula"
            placeholder="Ej: 123456789" // Placeholder que muestra un ejemplo de cédula
          />
          
          {/* Botón de búsqueda que activaría la acción de búsqueda */}
          <button>Buscar</button>
        </div>

        {/* Contenedor donde se mostrarían los resultados de la búsqueda */}
        <div className="resultado-container">
          {/* Aquí se mostraría el resultado de la búsqueda, por ejemplo, el registro encontrado */}
        </div>
      </main>
    </div>
  );
};

// Exporta el componente para poder usarlo en otras partes de la aplicación
export default SearchIdentification;

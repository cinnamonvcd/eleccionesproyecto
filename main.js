const URL_CANDIDATOS = 'https://raw.githubusercontent.com/CesarMCuellarCha/Elecciones/main/candidatos.json';
const URL_ADMINISTRADOR = 'https://raw.githubusercontent.com/CesarMCuellarCha/Elecciones/refs/heads/main/administrador.json';

let votos = JSON.parse(localStorage.getItem('votos')) || {};
let yaVoto = localStorage.getItem('ya_voto') === 'true';
let sesionAdministrador = false;

/**
 * Obtiene la lista de candidatos desde la API.
 * @returns {Promise<Array>} Lista de candidatos.
 */
async function obtenerCandidatos() {
  const respuesta = await fetch(URL_CANDIDATOS);
  const datos = await respuesta.json();
  return datos;
}

/**
 * Renderiza la lista de candidatos en la interfaz.
 * @param {Array} listaCandidatos - Lista de candidatos.
 */
function renderizarCandidatos(listaCandidatos) {
  const contenedor = document.getElementById('main-content');
  const votacionActiva = localStorage.getItem('votacion_activa') === 'true';
  const yaVoto = localStorage.getItem('ya_voto') === 'true';
  const puedeVotar = votacionActiva && !yaVoto;

  contenedor.innerHTML = '<h2 class="text-4xl text-center font-bold text-green-200 mb-8">Candidatos</h2>';

  const advertencia = document.createElement('p');
  advertencia.className = 'text-center text-lg mb-4';
  if (!votacionActiva) {
    advertencia.textContent = 'Las votaciones no están activas. No puedes votar en este momento.';
    advertencia.classList.add('text-red-300');
  } else if (yaVoto) {
    advertencia.textContent = 'Ya has votado. Gracias por tu participación.';
    advertencia.classList.add('text-yellow-300');
  }
  contenedor.appendChild(advertencia);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
  listaCandidatos.forEach(candidato => {
    if (!(candidato.nombre in votos)) votos[candidato.nombre] = 0;
    const tarjeta = document.createElement('div');
    tarjeta.className = 'candidate-card bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-4 text-center border-2 border-transparent hover:border-green-400 transition';
    tarjeta.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-1">${candidato.curso}</h3>
      <img src="${candidato.foto}" alt="${candidato.nombre}" class="w-24 h-24 object-cover rounded-full mx-auto my-4 cursor-pointer">
      <p class="text-green-300 text-sm">Aprendiz: ${candidato.nombre}</p>
      <p class="text-green-300 text-sm">Ficha: ${candidato.ficha}</p>
    `;
    const imagen = tarjeta.querySelector('img');
    if (!puedeVotar) {
      imagen.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      imagen.addEventListener('click', () => registrarVoto(candidato.nombre));
    }
    grid.appendChild(tarjeta);
  });
  contenedor.appendChild(grid);
}

/**
 * Registra el voto de un aprendiz por un candidato.
 * @param {string} nombreCandidato - Nombre del candidato.
 */
function registrarVoto(nombreCandidato) {
  if (!localStorage.getItem('votacion_activa')) return alert('Las votaciones están cerradas.');
  if (localStorage.getItem('ya_voto') === 'true') return alert('Ya has votado.');
  const confirmacion = confirm(`¿Estás seguro que deseas votar por ${nombreCandidato}?`);
  if (confirmacion) {
    votos[nombreCandidato]++;
    localStorage.setItem('votos', JSON.stringify(votos));
    localStorage.setItem('ya_voto', 'true');
    alert(`¡Voto registrado para ${nombreCandidato}!`);
    obtenerCandidatos().then(renderizarCandidatos);
  }
}

document.getElementById('botonInicioSesion').addEventListener('click', () => {
  document.getElementById('contenedorFormularioInicioSesion').classList.remove('hidden');
});

document.getElementById('cancelarInicioSesion').addEventListener('click', () => {
  document.getElementById('contenedorFormularioInicioSesion').classList.add('hidden');
});

/**
 * Maneja el inicio de sesión del administrador y muestra los resultados.
 */
document.getElementById('formularioInicioSesion').addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value.trim();

  try {
    const respuesta = await fetch(URL_ADMINISTRADOR);
    const admin = await respuesta.json();

    if (usuario === admin.username && contrasena === admin.password) {
      sesionAdministrador = true;
      document.getElementById('contenedorFormularioInicioSesion').classList.add('hidden');
      document.getElementById('controlesAdmin').classList.remove('hidden');
      document.getElementById('botonInicioSesion').classList.add('hidden');

      const votacionActiva = localStorage.getItem('votacion_activa') === 'true';
      document.getElementById('botonCerrarVotacion').disabled = !votacionActiva;
      document.getElementById('botonIniciarVotacion').disabled = votacionActiva;

      // Mostrar resultados completos al admin
      const contenedor = document.getElementById('main-content');
      contenedor.innerHTML = `
        <div class="text-center text-white space-y-6">
          <h2 class="text-4xl font-bold">Panel de Administración</h2>
          <p class="text-lg">Desde aquí puedes iniciar o cerrar las votaciones.</p>
        </div>
      `;

      // Mostrar resultados de todos los candidatos
      const listaResultados = document.createElement('div');
      listaResultados.className = 'space-y-4 text-lg text-white text-center mt-8';
      listaResultados.innerHTML = '<h3 class="text-2xl font-bold mb-4">Resultados actuales</h3>';
      for (const [nombre, cantidad] of Object.entries(votos)) {
        const p = document.createElement('p');
        p.innerHTML = `${nombre}: <strong>${cantidad} votos</strong>`;
        listaResultados.appendChild(p);
      }
      contenedor.appendChild(listaResultados);

    } else {
      alert('Credenciales incorrectas.');
      document.getElementById('botonInicioSesion').classList.remove('hidden');
    }
  } catch (error) {
    alert('Error al validar las credenciales');
    document.getElementById('botonInicioSesion').classList.remove('hidden');
  }

  // Limpiar formulario siempre
  document.getElementById('usuario').value = '';
  document.getElementById('contrasena').value = '';
});

/**
 * Maneja el cierre de sesión del administrador y muestra el ganador si corresponde.
 */
document.getElementById('botonCerrarSesion').addEventListener('click', async () => {
  sesionAdministrador = false;
  document.getElementById('controlesAdmin').classList.add('hidden');
  document.getElementById('botonInicioSesion').classList.remove('hidden');
  const candidatos = await obtenerCandidatos();
  const votacionActiva = localStorage.getItem('votacion_activa') === 'true';

  const contenedor = document.getElementById('main-content');
  if (!votacionActiva) {
    // Mostrar solo el ganador
    contenedor.innerHTML = '<h2 class="text-4xl font-bold text-white mb-8 text-center">Ganador</h2>';
    let ganador = null;
    let maxVotos = -1;
    for (const [nombre, cantidad] of Object.entries(votos)) {
      if (cantidad > maxVotos) {
        maxVotos = cantidad;
        ganador = nombre;
      }
    }
    if (ganador !== null) {
      const p = document.createElement('p');
      p.className = 'text-2xl text-center text-green-300 font-bold';
      p.innerHTML = `🎉 <span class="text-white">${ganador}</span> con <span class="text-white">${maxVotos}</span> votos 🎉`;
      contenedor.appendChild(p);
    } else {
      contenedor.innerHTML += '<p class="text-center text-lg text-yellow-300">No hay votos registrados.</p>';
    }

    // Reiniciar votos después de mostrar el ganador
    votos = {};
    localStorage.removeItem('votos');
    localStorage.setItem('ya_voto', 'false');
  } else {
    renderizarCandidatos(candidatos);
  }
});

/**
 * Inicia las votaciones.
 */
document.getElementById('botonIniciarVotacion').addEventListener('click', () => {
  localStorage.setItem('votacion_activa', 'true');
  localStorage.setItem('ya_voto', 'false');
  document.getElementById('botonCerrarVotacion').disabled = false;
  document.getElementById('botonIniciarVotacion').disabled = true;
  alert('Votaciones iniciadas.');
});

/**
 * Detiene las votaciones.
 */
document.getElementById('botonCerrarVotacion').addEventListener('click', () => {
  localStorage.setItem('votacion_activa', 'false');
  document.getElementById('botonCerrarVotacion').disabled = true;
  document.getElementById('botonIniciarVotacion').disabled = false;
  alert('Votaciones cerradas. Los resultados se mostrarán al cerrar sesión.');
});

/**
 * Inicializa la aplicación al cargar la página.
 */
window.onload = async () => {
  const candidatos = await obtenerCandidatos();
  renderizarCandidatos(candidatos);
};
import { useState, useEffect } from 'react';
import { kbService } from '../services/kbService';
import { ticketService } from '../services/ticketService';

function ClientPortal({ usuario, cerrarSesion }) {
  // --- ESTADOS ---
  const [vista, setVista] = useState('HOME'); // HOME, NUEVO_TICKET, MIS_TICKETS, LEER_ARTICULO
  const [articulos, setArticulos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [misTickets, setMisTickets] = useState([]);
  
  // Estado para formulario de ticket
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);

  // --- EFECTOS ---
  useEffect(() => {
    cargarKB();
  }, []); // Cargar KB al inicio

  useEffect(() => {
    if (vista === 'MIS_TICKETS') cargarMisTickets();
  }, [vista]);

  // --- LÓGICA KB ---
  const cargarKB = async (query = "") => {
    try {
      const data = await kbService.buscar(query);
      setArticulos(data.slice(0, 6)); // Solo mostramos los top 6
    } catch (error) {
      console.error(error);
    }
  };

  const buscarEnVivo = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    cargarKB(val);
  };

  const verArticulo = (art) => {
    setArticuloSeleccionado(art);
    setVista('LEER_ARTICULO');
  };

  // --- LÓGICA TICKETS ---
  const cargarMisTickets = async () => {
    try {
      const todos = await ticketService.listar();
      // Filtramos en frontend (idealmente backend filter)
      const propios = todos.filter(t => t.usuario?.id === usuario.id);
      setMisTickets(propios.reverse());
    } catch (error) {
      console.error(error);
    }
  };

  const crearTicket = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevaDescripcion.trim()) return;

    try {
      await ticketService.crear({
        titulo: nuevoTitulo,
        descripcion: nuevaDescripcion,
        usuario: { id: usuario.id }, // Asignamos al cliente actual
        prioridad: 'MEDIA', // Por defecto
        estado: 'NUEVO'
      });
      alert("✅ ¡Ticket creado! Un técnico lo revisará pronto.");
      setNuevoTitulo("");
      setNuevaDescripcion("");
      setVista('MIS_TICKETS');
    } catch (error) {
      alert("Error al crear ticket");
    }
  };

  // --- COMPONENTES VISUALES ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* 1. NAVBAR SUPERIOR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setVista('HOME')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-xl text-gray-800 tracking-tight">Comutel<span className="text-blue-600">Help</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
                onClick={() => setVista('MIS_TICKETS')}
                className={`text-sm font-medium ${vista === 'MIS_TICKETS' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Mis Casos
            </button>
            <div className="flex items-center gap-3 pl-6 border-l">
                <span className="text-sm text-gray-600">Hola, <strong>{usuario.nombre}</strong></span>
                <button onClick={cerrarSesion} className="text-xs text-red-500 hover:underline">Salir</button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. CONTENIDO DINÁMICO */}
      
      {/* VISTA: HOME (BUSCADOR + ACCESOS) */}
      {vista === 'HOME' && (
        <>
            {/* HERO SECTION (BUSCADOR) */}
            <div className="bg-blue-700 pb-20 pt-16 px-6 text-center text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">¿En qué podemos ayudarte hoy?</h1>
                <p className="text-blue-100 mb-8 text-lg">Busca soluciones rápidas o contacta con soporte.</p>
                
                <div className="max-w-2xl mx-auto relative group">
                    <input 
                        type="text" 
                        className="w-full p-4 pl-12 rounded-full text-gray-800 shadow-xl focus:ring-4 focus:ring-blue-400 outline-none transition"
                        placeholder="Ej: 'No tengo internet', 'VPN fallando'..."
                        value={busqueda}
                        onChange={buscarEnVivo}
                    />
                    <span className="absolute left-4 top-4 text-gray-400 text-xl">🔍</span>
                </div>
            </div>

            {/* SECCIÓN PRINCIPAL */}
            <div className="max-w-6xl mx-auto px-6 -mt-10 pb-20">
                
                {/* TARJETAS DE ACCIÓN RÁPIDA */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div 
                        onClick={() => setVista('NUEVO_TICKET')}
                        className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer border-l-8 border-green-500 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Reportar un Problema</h3>
                            <p className="text-gray-500">Abre un ticket para que un técnico te asista.</p>
                        </div>
                        <span className="text-4xl">🎫</span>
                    </div>

                    <div 
                        onClick={() => setVista('MIS_TICKETS')}
                        className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer border-l-8 border-blue-500 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Ver Estado de mis Tickets</h3>
                            <p className="text-gray-500">Consulta el progreso de tus casos abiertos.</p>
                        </div>
                        <span className="text-4xl">📂</span>
                    </div>
                </div>

                {/* RESULTADOS DE BASE DE CONOCIMIENTO */}
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    📚 {busqueda ? 'Resultados de búsqueda' : 'Soluciones Recomendadas'}
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                    {articulos.map(art => (
                        <div 
                            key={art.id} 
                            onClick={() => verArticulo(art)}
                            className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col h-full"
                        >
                            <h3 className="font-bold text-blue-700 mb-2">{art.titulo}</h3>
                            <p className="text-sm text-gray-500 line-clamp-3 flex-1">
                                {art.contenido.substring(0, 100)}...
                            </p>
                            <span className="text-xs text-blue-500 font-bold mt-4 block">Leer artículo →</span>
                        </div>
                    ))}
                    {articulos.length === 0 && (
                        <div className="col-span-3 text-center py-10 text-gray-400 bg-white rounded-lg border border-dashed">
                            No encontramos artículos relacionados. Intenta otra búsqueda.
                        </div>
                    )}
                </div>
            </div>
        </>
      )}

      {/* VISTA: NUEVO TICKET */}
      {vista === 'NUEVO_TICKET' && (
        <div className="max-w-2xl mx-auto py-10 px-6">
            <button onClick={() => setVista('HOME')} className="text-gray-500 mb-6 hover:text-blue-600">← Volver al inicio</button>
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Crear Nuevo Ticket</h2>
                <form onSubmit={crearTicket} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Asunto del Problema</label>
                        <input 
                            type="text" 
                            className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 outline-none transition"
                            placeholder="Ej: Mi computadora no enciende"
                            value={nuevoTitulo}
                            onChange={e => setNuevoTitulo(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Descripción Detallada</label>
                        <textarea 
                            className="w-full border-2 border-gray-200 p-3 rounded-lg h-40 focus:border-blue-500 outline-none transition resize-none"
                            placeholder="Explica qué pasó, cuándo ocurrió y si ves algún mensaje de error..."
                            value={nuevaDescripcion}
                            onChange={e => setNuevaDescripcion(e.target.value)}
                        />
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg transition transform active:scale-95">
                        Enviar Solicitud
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* VISTA: MIS TICKETS */}
      {vista === 'MIS_TICKETS' && (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📂 Mis Tickets</h2>
                <button onClick={() => setVista('NUEVO_TICKET')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm">
                    + Nuevo
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                {misTickets.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No tienes tickets registrados.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {misTickets.map(t => (
                            <div key={t.id} className="p-6 hover:bg-blue-50 transition flex justify-between items-center group">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-gray-400 font-mono text-sm">#{t.id}</span>
                                        <h3 className="font-bold text-gray-800">{t.titulo}</h3>
                                        {t.estado === 'RESUELTO' && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Resuelto</span>}
                                        {t.estado === 'NUEVO' && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold">En Cola</span>}
                                        {t.estado === 'EN_PROCESO' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">Atendiendo</span>}
                                    </div>
                                    <p className="text-sm text-gray-500">Creado el {new Date(t.fechaCreacion).toLocaleDateString()}</p>
                                </div>
                                <span className="text-gray-300 group-hover:text-blue-600 text-2xl">→</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* VISTA: LEER ARTÍCULO (KB) */}
      {vista === 'LEER_ARTICULO' && articuloSeleccionado && (
          <div className="max-w-3xl mx-auto py-10 px-6">
              <button onClick={() => setVista('HOME')} className="text-gray-500 mb-6 hover:text-blue-600">← Volver al buscador</button>
              <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                      Solución KB
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">{articuloSeleccionado.titulo}</h1>
                  <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {articuloSeleccionado.contenido}
                  </div>
                  <div className="mt-10 pt-6 border-t text-sm text-gray-400 flex justify-between">
                      <span>Autor: {articuloSeleccionado.autor?.nombre}</span>
                      <span>¿Te fue útil? 👍 👎</span>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

export default ClientPortal;
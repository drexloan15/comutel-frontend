import { useState, useEffect } from 'react';
import { kbService } from '../services/kbService';

function GestorKB({ usuarioActual }) {
  const [articulos, setArticulos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modoCrear, setModoCrear] = useState(false);
  
  // Formulario Nuevo
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");

  // Estado para expandir articulos (Acordeón)
  const [expandidoId, setExpandidoId] = useState(null);

  useEffect(() => {
    buscarArticulos();
  }, []); // Cargar todo al inicio

  const buscarArticulos = async () => {
    try {
      const data = await kbService.buscar(busqueda);
      // Ordenar por fecha (más reciente primero)
      setArticulos(data.reverse());
    } catch (error) {
      console.error(error);
    }
  };

  // Buscar al presionar Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') buscarArticulos();
  };

  const crearArticulo = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    try {
        await kbService.crear({
            titulo,
            contenido,
            autor: usuarioActual // Enviamos el usuario completo o solo ID según backend
        });
        setModoCrear(false);
        setTitulo("");
        setContenido("");
        setBusqueda(""); // Limpiar búsqueda
        buscarArticulos(); // Recargar lista
    } catch (error) {
        alert("Error al guardar solución");
    }
  };

  const eliminarArticulo = async (id, e) => {
      e.stopPropagation(); // Evitar que se abra el acordeón al borrar
      if(!confirm("¿Borrar este artículo?")) return;
      await kbService.eliminar(id);
      buscarArticulos();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* HEADER Y BUSCADOR */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">📚 Base de Conocimiento</h2>
        <p className="text-gray-500 mb-6">Busca soluciones rápidas a problemas comunes.</p>
        
        <div className="flex max-w-2xl mx-auto gap-2">
            <input 
                type="text" 
                className="flex-1 border-2 border-blue-100 p-4 rounded-full shadow-sm focus:outline-none focus:border-blue-500 text-lg"
                placeholder="Ej: 'Error impresora', 'VPN no conecta'..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button 
                onClick={() => buscarArticulos()}
                className="bg-blue-600 text-white px-8 rounded-full font-bold hover:bg-blue-700 transition shadow-lg"
            >
                Buscar
            </button>
        </div>
      </div>

      {/* BOTÓN CREAR (Solo si no estamos creando ya) */}
      {!modoCrear && (
        <div className="flex justify-end mb-4">
            <button 
                onClick={() => setModoCrear(true)}
                className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded flex items-center gap-2"
            >
                + Nueva Solución
            </button>
        </div>
      )}

      {/* FORMULARIO DE CREACIÓN */}
      {modoCrear && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-8 animate-fade-in-down">
            <h3 className="font-bold text-lg mb-4 text-gray-700">📝 Redactar Nueva Solución</h3>
            <form onSubmit={crearArticulo} className="space-y-4">
                <input 
                    type="text" 
                    placeholder="Título del Problema (Sé breve y claro)" 
                    className="w-full border p-3 rounded font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                />
                <textarea 
                    placeholder="Describe los pasos exactos para solucionar el problema..." 
                    className="w-full border p-3 rounded h-40 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={contenido}
                    onChange={e => setContenido(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setModoCrear(false)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button>
                    <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold shadow">Guardar Artículo</button>
                </div>
            </form>
        </div>
      )}

      {/* LISTA DE RESULTADOS */}
      <div className="space-y-4">
        {articulos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
                <span className="text-4xl block mb-2">🍃</span>
                No se encontraron artículos. Intenta otra búsqueda.
            </div>
        ) : (
            articulos.map((art) => (
                <div 
                    key={art.id} 
                    className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer overflow-hidden"
                    onClick={() => setExpandidoId(expandidoId === art.id ? null : art.id)}
                >
                    {/* CABECERA DE LA TARJETA */}
                    <div className="p-5 flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2">
                                📄 {art.titulo}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Publicado por {art.autor?.nombre || "Admin"} • {new Date(art.fechaCreacion).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-300 transform transition-transform duration-300">
                                {expandidoId === art.id ? '🔼' : '🔽'}
                            </span>
                            <button 
                                onClick={(e) => eliminarArticulo(art.id, e)}
                                className="text-gray-300 hover:text-red-500 px-2"
                                title="Eliminar"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* CONTENIDO EXPANDIBLE */}
                    {expandidoId === art.id && (
                        <div className="px-5 pb-5 pt-0 text-gray-700 leading-relaxed border-t border-gray-100 bg-gray-50">
                            <div className="mt-4 whitespace-pre-wrap font-sans">
                                {art.contenido}
                            </div>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
}

export default GestorKB;
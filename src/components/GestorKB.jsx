import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // 👈 Importante: Estilos del editor
import { kbService } from '../services/kbService';

// Configuración de la barra de herramientas del editor
const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'code-block'],
      ['clean']
    ],
};

const ArticuloCard = ({ art, onClick, activo }) => (
    <div 
        onClick={() => onClick(art)}
        className={`p-4 border-b border-gray-100 cursor-pointer transition hover:bg-slate-50 group ${activo ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
    >
        <h4 className={`font-bold text-sm mb-1 ${activo ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'}`}>{art.titulo}</h4>
        {/* Usamos un truco para quitar etiquetas HTML en la vista previa de la tarjeta */}
        <p className="text-xs text-gray-500 line-clamp-2">
            {art.contenido?.replace(/<[^>]+>/g, '').substring(0, 100)}...
        </p>
        <div className="flex gap-2 mt-2">
            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 border border-gray-200">{art.categoria || "General"}</span>
            <span className="text-[10px] text-gray-400 ml-auto">{new Date(art.fechaCreacion).toLocaleDateString()}</span>
        </div>
    </div>
);

function GestorKB({ usuarioActual }) {
    const [articulos, setArticulos] = useState([]);
    const [seleccionado, setSeleccionado] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);

    const [form, setForm] = useState({ titulo: "", contenido: "", categoria: "General" });

    useEffect(() => {
        cargarArticulos();
    }, []);

    const cargarArticulos = async () => {
        setCargando(true);
        try {
            const data = await kbService.listar();
            setArticulos(data);
        } catch (error) { console.error(error); }
        finally { setCargando(false); }
    };

    const handleNuevo = () => {
        setSeleccionado(null);
        setForm({ titulo: "", contenido: "", categoria: "General" });
        setModoEdicion(true);
    };

    const handleGuardar = async () => {
        if(!form.titulo || !form.contenido) return alert("El título y el contenido son obligatorios");

        try {
            if (seleccionado) {
                await kbService.actualizar(seleccionado.id, { ...form, autorId: usuarioActual.id });
            } else {
                await kbService.crear({ ...form, autorId: usuarioActual.id });
            }
            setModoEdicion(false);
            cargarArticulos();
            setSeleccionado(null); 
        } catch (error) {
            alert("Error al guardar: " + error.message);
        }
    };

    const handleSeleccionar = (art) => {
        setSeleccionado(art);
        setForm(art); 
        setModoEdicion(false);
    };

    const handleEliminar = async () => {
        if(!window.confirm("¿Seguro que deseas eliminar este artículo?")) return;
        await kbService.eliminar(seleccionado.id);
        setSeleccionado(null);
        cargarArticulos();
    };

    const filtrados = articulos.filter(a => 
        a.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
        (a.contenido && a.contenido.toLowerCase().includes(busqueda.toLowerCase()))
    );

    return (
        <div className="flex h-full bg-white font-sans overflow-hidden">
            
            {/* SIDEBAR IZQUIERDO */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white h-full shrink-0">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">📚 Base Conocimiento</h2>
                        <button onClick={handleNuevo} className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full font-bold shadow-sm transition flex items-center justify-center text-xl pb-1">+</button>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
                        <input 
                            className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition" 
                            placeholder="Buscar solución..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {cargando ? <p className="p-4 text-center text-gray-400 text-sm">Cargando...</p> : 
                     filtrados.length === 0 ? (
                        <div className="p-8 text-center text-gray-300 flex flex-col items-center">
                            <span className="text-4xl mb-2">📭</span>
                            <p className="text-sm">No se encontraron artículos</p>
                        </div>
                    ) : (
                        filtrados.map(art => (
                            <ArticuloCard 
                                key={art.id} 
                                art={art} 
                                activo={seleccionado?.id === art.id} 
                                onClick={handleSeleccionar} 
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ÁREA PRINCIPAL */}
            <div className="flex-1 bg-slate-50 p-4 md:p-8 h-full overflow-y-auto">
                {modoEdicion ? (
                    /* --- MODO EDITOR (CON REACT QUILL) --- */
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[90%] animate-fade-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                {seleccionado ? '✏️ Editando Artículo' : '✨ Nueva Solución'}
                            </h3>
                            <button onClick={() => setModoEdicion(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm px-3 py-1 rounded hover:bg-gray-200 transition">Cancelar</button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto space-y-4">
                            <div>
                                <input 
                                    className="w-full text-2xl font-bold border-b border-gray-200 py-2 outline-none focus:border-blue-500 bg-transparent placeholder-gray-300 transition" 
                                    placeholder="Título del Artículo"
                                    value={form.titulo}
                                    onChange={e => setForm({...form, titulo: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                <select 
                                    className="w-full md:w-1/2 border border-gray-200 rounded p-2 bg-white outline-none focus:border-blue-500 transition"
                                    value={form.categoria}
                                    onChange={e => setForm({...form, categoria: e.target.value})}
                                >
                                    <option>General</option>
                                    <option>Redes / Conectividad</option>
                                    <option>Hardware</option>
                                    <option>Software / Licencias</option>
                                    <option>Seguridad</option>
                                    <option>Impresoras</option>
                                </select>
                            </div>

                            <div className="h-[400px] mb-12"> {/* Altura fija para el editor */}
                                <ReactQuill 
                                    theme="snow"
                                    value={form.contenido}
                                    onChange={(content) => setForm({...form, contenido: content})}
                                    modules={modules}
                                    className="h-full"
                                    placeholder="Escribe aquí los pasos detallados, pega imágenes o código..."
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button 
                                onClick={handleGuardar}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Guardar Artículo
                            </button>
                        </div>
                    </div>
                ) : seleccionado ? (
                    /* --- MODO LECTURA --- */
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in min-h-[500px]">
                        {/* Cabecera del Artículo */}
                        {/* Cabecera del Artículo con Botones */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl transform rotate-12 pointer-events-none">💡</div>
                            
                            {/* Fila superior: Categoría y Botones de Acción */}
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <span className="bg-blue-500/20 border border-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                    {seleccionado.categoria}
                                </span>

                                {/* 👇 AQUÍ ESTÁN LOS BOTONES AHORA 👇 */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setModoEdicion(true)} 
                                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 backdrop-blur-sm border border-white/10"
                                        title="Editar Artículo"
                                    >
                                        ✏️ <span className="hidden sm:inline">Editar</span>
                                    </button>
                                    <button 
                                        onClick={handleEliminar} 
                                        className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 backdrop-blur-sm border border-red-500/20"
                                        title="Eliminar Artículo"
                                    >
                                        🗑️ <span className="hidden sm:inline">Borrar</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{seleccionado.titulo}</h1>
                                <div className="flex items-center gap-4 text-sm text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
                                            {seleccionado.autorNombre ? seleccionado.autorNombre.charAt(0) : 'A'}
                                        </div>
                                        <span>{seleccionado.autorNombre || "Admin"}</span>
                                    </div>
                                    <span>•</span>
                                    <span>Actualizado el {new Date(seleccionado.fechaCreacion).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Contenido HTML Renderizado */}
                        <div className="p-8 md:p-12 leading-relaxed bg-white w-full"> {/* Agregamos w-full */}
                            <div 
                                // 👇 AGREGAMOS 'break-words' y 'w-full'
                                className="prose prose-slate max-w-none text-slate-800 break-words w-full"
                                dangerouslySetInnerHTML={{ __html: seleccionado.contenido }} 
                            />
                        </div>

                        
                    </div>
                ) : (
                    /* --- ESTADO VACÍO (BIENVENIDA) --- */
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-fade-in">
                        <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-6xl shadow-inner">
                            📖
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">Centro de Conocimiento</h2>
                        <p className="text-center max-w-md">Selecciona un artículo de la izquierda para ver la solución o crea uno nuevo para ayudar al equipo.</p>
                        <button onClick={handleNuevo} className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition">
                            + Crear primer artículo
                        </button>
                    </div>
                )}
            </div>
            
            {/* Estilos para el contenido generado por Quill */}
            <style>{`
                .prose { color: #334155; } /* Color base gris oscuro */
                .prose p { margin-bottom: 1em; color: #334155; }
                .prose h1, .prose h2, .prose h3 { color: #1e293b; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; }
                .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
                .prose pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-family: monospace; margin: 1rem 0; }
                .prose blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #64748b; font-style: italic; margin: 1rem 0; }
                .prose strong { color: #0f172a; font-weight: 700; } /* Negritas bien negras */
            `}</style>
        </div>
    );
}

export default GestorKB;
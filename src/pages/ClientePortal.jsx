import React, { useState, useEffect, useRef } from 'react';
import { ticketService } from '../services/ticketService';
import { kbService } from '../services/kbService'; 

// --- UTILIDAD: Limpieza profunda de texto ---
const stripHtml = (html) => {
    if (!html) return "";
    // 1. Reemplazar &nbsp; por espacios normales para permitir saltos de línea
    let text = html.replace(/&nbsp;/g, ' ');
    // 2. Extraer solo texto
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.textContent || "";
};

// --- COMPONENTE: CHAT ---
const ClienteChat = ({ ticket, usuario, onVolver, onEnviarMensaje }) => {
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const endRef = useRef(null);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        cargarMensajes();
        const intervalo = setInterval(cargarMensajes, 3000);
        return () => clearInterval(intervalo);
    }, [ticket.id]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

    const cargarMensajes = async () => {
        try {
            const data = await ticketService.listarComentarios(ticket.id);
            setMensajes(data || []);
        } catch (e) { console.error("Error chat", e); }
    };

    const enviar = async (e) => {
        e.preventDefault();
        if(!nuevoMensaje.trim()) return;
        setEnviando(true);
        try {
            await onEnviarMensaje(ticket.id, nuevoMensaje);
            setNuevoMensaje("");
            await cargarMensajes(); 
        } finally { setEnviando(false); }
    };

    return (
        <div className="max-w-4xl mx-auto mt-8 h-[80vh] flex flex-col animate-fade-in-up px-4 w-full">
            <button onClick={onVolver} className="mb-4 text-slate-500 hover:text-blue-600 font-bold flex items-center gap-2 text-sm w-fit">
                ← Volver
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col flex-1 w-full">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <div className="overflow-hidden">
                        <span className="text-xs font-mono text-slate-400 block mb-1">TICKET #{ticket.id}</span>
                        <h2 className="font-bold text-slate-800 text-lg leading-tight truncate">{ticket.titulo}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${ticket.estado === 'RESUELTO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ticket.estado}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {(mensajes || []).map((m) => {
                        const esMio = m.autor?.id === usuario.id;
                        return (
                            <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm relative break-words ${esMio ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`}>
                                    <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                                    <span className="text-[10px] block mt-2 opacity-70 text-right">
                                        {new Date(m.fechaCreacion).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={endRef} />
                </div>

                {ticket.estado !== 'CERRADO' && (
                    <form onSubmit={enviar} className="p-4 bg-white border-t border-slate-100 flex gap-3">
                        <input className="flex-1 bg-slate-100 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 transition w-full" placeholder="Escribe un mensaje..." value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} />
                        <button type="submit" disabled={enviando} className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-700 shrink-0">➤</button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
function ClientePortal({ usuario, onLogout }) {
    const [vista, setVista] = useState('HOME'); 
    const [tickets, setTickets] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [articuloLeido, setArticuloLeido] = useState(null);
    const [ticketActivo, setTicketActivo] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [nuevoTicket, setNuevoTicket] = useState({ titulo: "", descripcion: "", prioridad: "MEDIA" });

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            const [dataTickets, dataKb] = await Promise.all([
                ticketService.listar(),
                kbService.listar()
            ]);
            setTickets(dataTickets.filter(t => t.usuario?.id === usuario.id).sort((a,b) => b.id - a.id));
            setArticulos(dataKb);
        } catch (e) { console.error(e); }
    };

    const handleCrear = async (e) => {
        e.preventDefault();
        try {
            await ticketService.crear({ ...nuevoTicket, usuarioId: usuario.id });
            alert("✅ Solicitud enviada");
            setNuevoTicket({ titulo: "", descripcion: "", prioridad: "MEDIA" });
            setVista('HOME');
            cargarDatos();
        } catch (e) { alert("Error al crear ticket"); }
    };

    const handleEnviarMensajeChat = async (ticketId, texto) => {
        await ticketService.agregarComentario(ticketId, { texto, autorId: usuario.id });
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] font-sans text-slate-800 overflow-x-hidden">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setVista('HOME')}>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                        <span className="font-bold text-lg hidden md:block">Centro de Ayuda</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-700">{usuario.nombre}</span>
                            <span className="text-[10px] text-slate-400 uppercase">Cliente Corporativo</span>
                        </div>
                        
                        <button onClick={onLogout} className="text-sm text-red-500 font-bold border border-red-100 px-3 py-1 rounded-full hover:bg-red-50 transition">Salir</button>
                    </div>
                </div>
            </header>

            {vista === 'HOME' && (
                <>
                    <div className="bg-[#0F172A] py-16 text-center px-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">¿En qué podemos ayudarte?</h1>
                        <div className="max-w-2xl mx-auto relative">
                            <input 
                                type="text" 
                                className="w-full py-4 pl-12 pr-4 rounded-xl text-slate-800 shadow-xl outline-none focus:ring-4 focus:ring-blue-500/40 transition"
                                placeholder="Buscar..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                            <span className="absolute left-4 top-4 text-gray-400 text-xl">🔍</span>
                        </div>
                    </div>

                    <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* COLUMNA KB (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                📚 Artículos Recomendados
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {articulos.filter(a => a.titulo.toLowerCase().includes(busqueda.toLowerCase())).map(art => (
                                    <div 
                                        key={art.id} 
                                        onClick={() => { setArticuloLeido(art); setVista('LEER'); }}
                                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col h-full w-full overflow-hidden"
                                    >
                                        <div className="mb-3 text-blue-500 bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center text-xl">📄</div>
                                        <h4 className="font-bold text-slate-800 mb-2 line-clamp-2">{art.titulo}</h4>
                                        {/* 👇 AQUÍ ESTÁ LA SOLUCIÓN: break-words y whitespace-normal */}
                                        <p className="text-sm text-slate-500 line-clamp-3 mb-4 break-words whitespace-normal overflow-hidden">
                                            {stripHtml(art.contenido)}
                                        </p>
                                        <span className="text-xs text-blue-600 font-bold mt-auto">Leer más →</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* COLUMNA SIDEBAR (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-blue-600 rounded-xl p-6 text-white text-center shadow-lg">
                                <h3 className="font-bold text-lg mb-2">¿Necesitas Ayuda?</h3>
                                <button onClick={() => setVista('NUEVO')} className="bg-white text-blue-700 w-full py-2.5 rounded-lg font-bold mt-4 hover:bg-blue-50 transition">
                                    + Crear Ticket
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-slate-700">Mis Tickets</div>
                                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                                    {tickets.map(t => (
                                        <div key={t.id} className="p-4 hover:bg-slate-50 transition">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs text-gray-400">#{t.id}</span>
                                                <span className={`text-[10px] font-bold px-2 rounded ${t.estado==='RESUELTO'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>{t.estado}</span>
                                            </div>
                                            <h5 className="font-bold text-sm text-slate-800 truncate mb-2">{t.titulo}</h5>
                                            {t.estado !== 'CERRADO' && (
                                                <button onClick={() => { setTicketActivo(t); setVista('CHAT'); }} className="text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded w-full hover:bg-blue-50 font-bold">Abrir Chat</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </>
            )}

            {/* VISTA LEER ARTÍCULO - CORREGIDA PARA QUE NO SE DESBORDE */}
            {vista === 'LEER' && articuloLeido && (
                <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in-up w-full">
                    <button onClick={() => setVista('HOME')} className="mb-6 text-slate-500 hover:text-blue-600 font-bold text-sm">← Volver</button>
                    {/* 👇 w-full y overflow-hidden para evitar scroll horizontal */}
                    <article className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 w-full overflow-hidden break-words">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-6 inline-block">{articuloLeido.categoria || "General"}</span>
                        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-6 break-words">{articuloLeido.titulo}</h1>
                        <div className="flex gap-4 text-sm text-slate-400 border-b border-slate-100 pb-6 mb-6">
                            <span>Autor: {articuloLeido.autorNombre || "Soporte"}</span>
                            <span>{new Date(articuloLeido.fechaCreacion).toLocaleDateString()}</span>
                        </div>
                        {/* 👇 LA CLAVE: prose, break-words, w-full */}
                        <div className="prose prose-blue max-w-none w-full break-words whitespace-normal overflow-hidden" 
                             dangerouslySetInnerHTML={{ __html: articuloLeido.contenido }} />
                    </article>
                </div>
            )}

            {vista === 'NUEVO' && (
                <div className="max-w-2xl mx-auto py-10 px-4">
                    <button onClick={() => setVista('HOME')} className="mb-4 text-slate-500 font-bold text-sm">← Volver</button>
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Nuevo Ticket</h2>
                        <form onSubmit={handleCrear} className="space-y-4">
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Asunto" value={nuevoTicket.titulo} onChange={e => setNuevoTicket({...nuevoTicket, titulo: e.target.value})} />
                            <textarea required rows="5" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descripción" value={nuevoTicket.descripcion} onChange={e => setNuevoTicket({...nuevoTicket, descripcion: e.target.value})} />
                            <select className="w-full border rounded-lg p-3" value={nuevoTicket.prioridad} onChange={e => setNuevoTicket({...nuevoTicket, prioridad: e.target.value})}>
                                <option value="MEDIA">Prioridad Media</option>
                                <option value="ALTA">Prioridad Alta</option>
                                <option value="BAJA">Prioridad Baja</option>
                            </select>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">Enviar</button>
                        </form>
                    </div>
                </div>
            )}

            {vista === 'CHAT' && ticketActivo && (
                <ClienteChat ticket={ticketActivo} usuario={usuario} onVolver={() => setVista('HOME')} onEnviarMensaje={handleEnviarMensajeChat} />
            )}
        </div>
    );
}

export default ClientePortal;
import React, { useEffect, useState, useMemo } from 'react';
import { ticketService } from '../services/ticketService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';

// --- UTILIDADES DE TIEMPO REAL ---

// 1. Definir reglas de negocio (Horas según prioridad)
const obtenerHorasSLA = (prioridad) => {
    switch (prioridad) {
        case 'CRITICA': return 2;
        case 'ALTA': return 8;
        case 'MEDIA': return 24;
        case 'BAJA': return 48;
        default: return 24;
    }
};

// 2. Componente para la celda de tiempo (se actualiza solo)
const TiempoRestante = ({ fechaCreacion, prioridad, estado }) => {
    const [tiempo, setTiempo] = useState("Calculando...");
    const [esVencido, setEsVencido] = useState(false);

    useEffect(() => {
        const calcular = () => {
            if (estado === 'RESUELTO' || estado === 'CERRADO') {
                setTiempo("Finalizado");
                setEsVencido(false);
                return;
            }

            const fechaInicio = new Date(fechaCreacion);
            const horasLimite = obtenerHorasSLA(prioridad);
            const fechaLimite = new Date(fechaInicio.getTime() + horasLimite * 60 * 60 * 1000);
            const ahora = new Date();
            const diff = fechaLimite - ahora;

            if (diff < 0) {
                // VENCIDO (Tiempo negativo)
                const diffPos = Math.abs(diff);
                const h = Math.floor(diffPos / (1000 * 60 * 60));
                const m = Math.floor((diffPos % (1000 * 60 * 60)) / (1000 * 60));
                setTiempo(`-${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                setEsVencido(true);
            } else {
                // A TIEMPO
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTiempo(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                setEsVencido(false);
            }
        };

        calcular(); // Primer cálculo
        const intervalo = setInterval(calcular, 60000); // Actualizar cada minuto
        return () => clearInterval(intervalo);
    }, [fechaCreacion, prioridad, estado]);

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${
            esVencido 
            ? 'bg-red-500 text-white animate-pulse' // Vencido: Rojo
            : 'bg-emerald-500 text-white'          // A tiempo: Verde
        }`}>
            {tiempo}
        </span>
    );
};

// --- SUB-COMPONENTE RELOJ ---
const HeaderReloj = ({ usuarioActual, setConfigOpen, configOpen }) => {
    const [hora, setHora] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setHora(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fechaString = hora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const horaString = hora.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex justify-between items-end mb-8 animate-fade-in">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center text-white text-3xl shadow-md border-4 border-white relative">
                    💬
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Hola, {usuarioActual?.nombre}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="font-semibold text-gray-700">IT Manager</span>
                        <span className="mx-1 text-gray-300">|</span>
                        <span className="text-blue-500">{usuarioActual?.email}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                    <p className="text-sm text-gray-400 font-medium capitalize mb-0.5">{fechaString}</p>
                    <p className="text-3xl font-bold text-gray-800 tracking-tight leading-none font-mono">{horaString}</p>
                </div>
                <button onClick={() => setConfigOpen(!configOpen)} className={`p-2 rounded-lg transition ${configOpen ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-200'}`}>⚙️</button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
function DashboardGraficos({ usuarioActual }) {
  const [tickets, setTickets] = useState([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState(() => {
      const saved = localStorage.getItem(`dash_cfg_${usuarioActual.id}`);
      return saved ? JSON.parse(saved) : { verKPIs: true, verTiempos: true, verGrafica: true, verTablaSLA: true };
  });

  useEffect(() => { localStorage.setItem(`dash_cfg_${usuarioActual.id}`, JSON.stringify(config)); }, [config, usuarioActual.id]);

  useEffect(() => {
    const fetch = async () => { try { const data = await ticketService.listar(); setTickets(data); } catch (e) { console.error(e); } };
    fetch(); 
    const interval = setInterval(fetch, 15000); // Recarga datos cada 15s
    return () => clearInterval(interval);
  }, []);

  // CÁLCULOS REALES (MEMORIZADOS)
  const { kpis, ticketsCriticos } = useMemo(() => {
      // 1. Contadores Reales
      const abiertos = tickets.filter(t => t.estado !== 'RESUELTO' && t.estado !== 'CERRADO').length;
      const resueltos = tickets.filter(t => t.estado === 'RESUELTO' || t.estado === 'CERRADO').length; // Incluimos cerrados en históricos
      const graves = tickets.filter(t => t.estado !== 'RESUELTO' && t.estado !== 'CERRADO' && (t.prioridad === 'ALTA' || t.prioridad === 'CRITICA')).length;
      const sinAsignar = tickets.filter(t => t.estado !== 'RESUELTO' && t.estado !== 'CERRADO' && !t.tecnico).length;

      // 2. Gráfico por Grupo Real
      const gruposMap = {};
      tickets.forEach(t => { 
          if(t.estado !== 'RESUELTO' && t.estado !== 'CERRADO') { 
              const g = t.grupoAsignado || "Sin Grupo"; 
              gruposMap[g] = (gruposMap[g] || 0) + 1; 
          }
      });
      const porGrupo = Object.keys(gruposMap).map(key => ({ name: key, cantidad: gruposMap[key] })).slice(0, 5);

      // 3. Tabla SLA (Ordenada por urgencia real)
      // Filtramos solo los pendientes
      const pendientes = tickets.filter(t => t.estado !== 'RESUELTO' && t.estado !== 'CERRADO');
      
      // Ordenamos: Primero los que tienen menos tiempo restante (o ya vencieron)
      const ordenados = pendientes.sort((a, b) => {
          const limitA = new Date(a.fechaCreacion).getTime() + obtenerHorasSLA(a.prioridad) * 3600000;
          const limitB = new Date(b.fechaCreacion).getTime() + obtenerHorasSLA(b.prioridad) * 3600000;
          return limitA - limitB; // Ascendente: Vencidos primero
      });

      return {
          kpis: { abiertos, resueltos, graves, sinAsignar, porGrupo },
          ticketsCriticos: ordenados // Mostramos todos los pendientes ordenados por urgencia
      };
  }, [tickets]);

  return (
    <div className="h-full bg-[#f8f9fa] p-8 font-sans overflow-y-auto relative">
      <HeaderReloj usuarioActual={usuarioActual} setConfigOpen={setConfigOpen} configOpen={configOpen} />

      {/* Menú Config */}
      {configOpen && (
          <div className="absolute top-24 right-8 z-50 bg-white p-5 rounded-xl shadow-2xl border border-gray-100 w-64 animate-fade-in-down">
              <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Visualización</h4>
              <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer"><span className="text-sm text-gray-600">Tarjetas KPIs</span><input type="checkbox" checked={config.verKPIs} onChange={e => setConfig({...config, verKPIs: e.target.checked})} className="accent-teal-500" /></label>
                  <label className="flex items-center justify-between cursor-pointer"><span className="text-sm text-gray-600">Métricas Tiempo</span><input type="checkbox" checked={config.verTiempos} onChange={e => setConfig({...config, verTiempos: e.target.checked})} className="accent-teal-500" /></label>
                  <label className="flex items-center justify-between cursor-pointer"><span className="text-sm text-gray-600">Gráfico Barras</span><input type="checkbox" checked={config.verGrafica} onChange={e => setConfig({...config, verGrafica: e.target.checked})} className="accent-teal-500" /></label>
                  <label className="flex items-center justify-between cursor-pointer"><span className="text-sm text-gray-600">Tabla SLA</span><input type="checkbox" checked={config.verTablaSLA} onChange={e => setConfig({...config, verTablaSLA: e.target.checked})} className="accent-teal-500" /></label>
              </div>
          </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* COLUMNA IZQUIERDA: KPIs */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4 shrink-0">
            {config.verKPIs && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Abiertos</p><p className="text-3xl font-bold text-teal-500">{kpis.abiertos}</p></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Resueltos</p><p className="text-3xl font-bold text-teal-500">{kpis.resueltos}</p></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Graves</p><p className="text-3xl font-bold text-red-500">{kpis.graves}</p></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sin Asignar</p><p className="text-3xl font-bold text-lime-500">{kpis.sinAsignar}</p></div>
                </div>
            )}
            {/* KPIs TIEMPOS (Estimados mientras no haya histórico real) */}
            {config.verTiempos && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-[9px] font-bold text-gray-400 uppercase">Resp. Prom (h)</p><p className="text-2xl font-bold text-lime-600 mt-1">--</p></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-[9px] font-bold text-gray-400 uppercase">Resol. Prom (h)</p><p className="text-2xl font-bold text-lime-600 mt-1">--</p></div>
                </div>
            )}
            {config.verGrafica && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex-1 min-h-[220px] animate-fade-in">
                    <p className="text-xs font-bold text-gray-700 mb-4 uppercase">Carga por Grupo</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={kpis.porGrupo} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10}} interval={0} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px'}} />
                            <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                                {kpis.porGrupo.map((entry, index) => <Cell key={`cell-${index}`} fill="#0f766e" />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* COLUMNA DERECHA: TABLA SLA REAL */}
        {config.verTablaSLA && (
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">⚠️ Monitoreo SLA ⚠️</h3>
                    <div className="text-xs text-gray-400">Ordenado por urgencia</div>
                </div>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase tracking-wider text-left border-b border-gray-100">
                                <th className="pb-3 w-8">#</th>
                                <th className="pb-3 font-bold">ID</th>
                                <th className="pb-3 font-bold w-1/3">Asunto</th>
                                <th className="pb-3 font-bold">Agente</th>
                                <th className="pb-3 font-bold">Prioridad</th>
                                <th className="pb-3 font-bold text-right">Tiempo Restante</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {ticketsCriticos.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition border-b border-gray-50 last:border-0 group">
                                    <td className="py-3"><div className={`w-2 h-2 rounded-full ${t.prioridad==='CRITICA'?'bg-red-500':t.prioridad==='ALTA'?'bg-orange-400':'bg-blue-400'}`}></div></td>
                                    <td className="py-3 text-gray-400 text-xs font-mono">#{t.id}</td>
                                    <td className="py-3">
                                        <span className="text-gray-800 font-medium block truncate max-w-[200px]">{t.titulo}</span>
                                        <span className="text-[10px] text-gray-400">{t.grupoAsignado || 'General'}</span>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            {t.tecnico ? <><div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[9px] font-bold">{t.tecnico.nombre.charAt(0)}</div><span className="text-gray-600 text-xs hidden xl:block">{t.tecnico.nombre}</span></> 
                                            : <><div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[9px] font-bold">?</div><span className="text-gray-400 text-xs italic hidden xl:block">Sin asignar</span></>}
                                        </div>
                                    </td>
                                    <td className="py-3"><span className="text-xs text-gray-600 capitalize">{t.prioridad.toLowerCase()}</span></td>
                                    <td className="py-3 text-right">
                                        {/* AQUI ESTÁ LA MAGIA DEL TIEMPO REAL */}
                                        <TiempoRestante fechaCreacion={t.fechaCreacion} prioridad={t.prioridad} estado={t.estado} />
                                    </td>
                                </tr>
                            ))}
                            {ticketsCriticos.length === 0 && (
                                <tr><td colSpan="6" className="text-center py-20"><div className="text-4xl mb-2">🎉</div><p className="text-gray-400 text-sm">No hay tickets pendientes</p></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default DashboardGraficos;
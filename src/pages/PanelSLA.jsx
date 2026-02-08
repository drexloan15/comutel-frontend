import { useEffect, useState } from "react";

function PanelSLA() {
    const [tickets, setTickets] = useState([]);

    // Aquí deberías filtrar en el backend, pero por ahora lo simulamos en frontend
    useEffect(() => {
        fetch("http://localhost:8080/api/tickets") // Idealmente: /api/tickets/urgentes
            .then(res => res.json())
            .then(data => setTickets(data));
    }, []);

    // Clasificación
    const vencidos = tickets.filter(t => new Date() > new Date(t.fechaVencimiento) && t.estado !== 'RESUELTO');
    const porVencer = tickets.filter(t => {
        const horasRestantes = (new Date(t.fechaVencimiento) - new Date()) / 36e5;
        return horasRestantes > 0 && horasRestantes < 4 && t.estado !== 'RESUELTO'; // Menos de 4 horas
    });
    const enTiempo = tickets.filter(t => t.estado !== 'RESUELTO' && !vencidos.includes(t) && !porVencer.includes(t));

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Estado de SLA (Service Level Agreement)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TARJETA ROJA: VENCIDOS */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="text-red-700 font-bold">🚨 Vencidos (Breached)</h3>
                        <span className="text-3xl font-bold text-red-600">{vencidos.length}</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                        {vencidos.slice(0, 5).map(t => (
                            <li key={t.id} className="text-xs text-red-800 bg-red-100 p-2 rounded flex justify-between">
                                <span>#{t.id} {t.titulo}</span>
                                <span className="font-bold">Hace {Math.abs(Math.round((new Date() - new Date(t.fechaVencimiento))/36e5))}h</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* TARJETA AMARILLA: POR VENCER */}
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="text-yellow-700 font-bold">⚠️ En Riesgo ( 4h)</h3>
                        <span className="text-3xl font-bold text-yellow-600">{porVencer.length}</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                         {porVencer.slice(0, 5).map(t => (
                            <li key={t.id} className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded flex justify-between">
                                <span>#{t.id} {t.titulo}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                 {/* TARJETA VERDE: EN TIEMPO */}
                 <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="text-green-700 font-bold">✅ En Tiempo</h3>
                        <span className="text-3xl font-bold text-green-600">{enTiempo.length}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-2">Tickets operando dentro de los parámetros normales.</p>
                </div>
            </div>
        </div>
    );
}

export default PanelSLA;
import { useState, useEffect } from "react";

function ContadorSLA({ fechaCreacion, prioridad, estado }) {
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [vencido, setVencido] = useState(false);

  // 1. Definir horas según prioridad
  const obtenerHorasSLA = (p) => {
    switch (p) {
      case "CRITICA": return 2;
      case "ALTA": return 8;
      case "MEDIA": return 24;
      case "BAJA": return 48;
      default: return 24;
    }
  };

  useEffect(() => {
    // Si ya está resuelto, no calculamos nada
    if (estado === 'RESUELTO' || estado === 'CERRADO') return;

    const calcularTiempo = () => {
      const inicio = new Date(fechaCreacion);
      const horasLimite = obtenerHorasSLA(prioridad);
      
      // Calculamos la fecha de vencimiento sumando las horas
      const vencimiento = new Date(inicio.getTime() + horasLimite * 60 * 60 * 1000);
      const ahora = new Date();

      const diferencia = vencimiento - ahora;

      if (diferencia <= 0) {
        setVencido(true);
        setTiempoRestante("00:00:00");
      } else {
        setVencido(false);
        // Convertimos milisegundos a HH:MM:SS
        const horas = Math.floor((diferencia / (1000 * 60 * 60)));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        setTiempoRestante(
          `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
        );
      }
    };

    // Ejecutar inmediatamente y luego cada 1 segundo
    calcularTiempo();
    const intervalo = setInterval(calcularTiempo, 1000);

    return () => clearInterval(intervalo);
  }, [fechaCreacion, prioridad, estado]);

  // --- RENDERIZADO ---

  if (estado === 'RESUELTO' || estado === 'CERRADO') {
    return (
      <div className="bg-orange-370 text-white px-4 py-2 rounded-lg text-center shadow w-full">
        <p className="text-xs font-bold opacity-80 uppercase">SLA CUMPLIDO</p>
        <p className="text-green-300 text-xl font-bold">✅ OK</p>
      </div>
    );
  }

  return (
    <div className={`px-6 py-2 rounded-lg text-center shadow-md w-full transition-colors duration-500 ${
        vencido ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
    } text-white`}>
      <p className="text-xs font-bold opacity-80 uppercase">
        {vencido ? "⚠️ SLA VENCIDO" : "⏳ SLA RESTANTE"}
      </p>
      <p className="text-2xl font-bold font-mono tracking-widest">
        {tiempoRestante || "--:--:--"}
      </p>
      <p className="text-[10px] opacity-75 mt-1">
        Prioridad: {prioridad} ({obtenerHorasSLA(prioridad)}h)
      </p>
    </div>
  );
}

export default ContadorSLA;
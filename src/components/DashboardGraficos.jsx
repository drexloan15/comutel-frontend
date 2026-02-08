import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from "recharts";

function DashboardGraficos() {
  // 1. Estado para guardar los datos que vienen del Backend
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 2. Colores para las barras (Verde, Amarillo, Azul)
  const COLORES = {
    "Nuevos": "#10B981",    // Verde Esmeralda
    "En Proceso": "#F59E0B", // Amarillo Ambar
    "Resueltos": "#3B82F6"   // Azul Real
  };

  useEffect(() => {
    cargarMetricas();
    
    // Opcional: Recargar cada 10 segundos para ver cambios en vivo
    const intervalo = setInterval(cargarMetricas, 10000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarMetricas = async () => {
    try {
      // Petición al Backend
      const respuesta = await fetch("http://localhost:8080/api/tickets/metricas");
      const metricas = await respuesta.json();

      // 3. TRADUCCIÓN: Convertir el Objeto del Backend en Array para Recharts
      const datosFormateados = [
        { name: "Nuevos", cantidad: metricas.nuevos || 0 },
        { name: "En Proceso", cantidad: metricas.proceso || 0 },
        { name: "Resueltos", cantidad: metricas.resueltos || 0 }
      ];

      setDatos(datosFormateados);
      setCargando(false);
    } catch (error) {
      console.error("Error cargando gráficos:", error);
      setCargando(false);
    }
  };

  if (cargando) return <p className="text-center text-gray-500">Cargando estadísticas...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Estado de los Tickets</h2>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} /> {/* Para no mostrar "1.5 tickets" */}
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" name="Cantidad de Tickets">
              {/* Pintar cada barra de su color correspondiente */}
              {datos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORES[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen Numérico Abajo */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-500">Nuevos</p>
          <p className="text-2xl font-bold text-green-600">{datos[0]?.cantidad}</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-500">En Proceso</p>
          <p className="text-2xl font-bold text-yellow-600">{datos[1]?.cantidad}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">Resueltos</p>
          <p className="text-2xl font-bold text-blue-600">{datos[2]?.cantidad}</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardGraficos;
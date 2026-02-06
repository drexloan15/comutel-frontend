import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

function DashboardGraficos() {
  const [datosEstado, setDatosEstado] = useState([])

  // COLORES PARA LA GRÁFICA (Amarillo, Azul, Verde, Gris)
  const COLORES_ESTADO = ['#f1c40f', '#3498db', '#27ae60', '#95a5a6'];

  // DATOS SIMULADOS (Para que se vea lleno como en tu foto)
  const datosOrigen = [
    { name: 'Email', value: 400 },
    { name: 'Teléfono', value: 300 },
    { name: 'WhatsApp', value: 100 },
    { name: 'Portal Web', value: 200 },
  ];
  const COLORES_ORIGEN = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  useEffect(() => {
    // 1. Pedimos los números reales al Backend
    fetch('http://192.168.1.173:8080/api/tickets/metricas')
      .then(res => res.json())
      .then(metricas => {
        // 2. Transformamos los datos para que Recharts los entienda
        const dataTransformada = [
          { name: 'Nuevos', value: metricas.nuevos },
          { name: 'En Proceso', value: metricas.proceso },
          { name: 'Resueltos', value: metricas.resueltos },
        ];
        // Filtramos los que sean 0 para que no salga feo el gráfico
        setDatosEstado(dataTransformada.filter(d => d.value > 0));
      })
  }, [])

  // Componente de Tarjeta para reutilizar diseño
  const CardGrafico = ({ titulo, children }) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', height: '350px', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ margin: '0 0 20px 0', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        📉 {titulo}
      </h4>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
      
      {/* GRÁFICO 1: ESTADO DE TICKETS (DONA) */}
      <CardGrafico titulo="Estado Actual de Incidencias">
        {datosEstado.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datosEstado}
                cx="50%"
                cy="50%"
                innerRadius={60} // Esto hace el agujero de la dona
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {datosEstado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_ESTADO[index % COLORES_ESTADO.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        ) : <p style={{textAlign: 'center', color: '#aaa', marginTop: '50px'}}>No hay datos suficientes</p>}
      </CardGrafico>

      {/* GRÁFICO 2: ORIGEN DEL TICKET (TORTA RELLENA) */}
      <CardGrafico titulo="Origen del Ticket (Simulado)">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datosOrigen}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {datosOrigen.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORES_ORIGEN[index % COLORES_ORIGEN.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </CardGrafico>

      {/* GRÁFICO 3: BARRAS (EXTRA) */}
      <CardGrafico titulo="Volumen por Prioridad">
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosOrigen}> {/* Usamos datos simulados por ahora */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3498db" />
            </BarChart>
         </ResponsiveContainer>
      </CardGrafico>

    </div>
  )
}

export default DashboardGraficos
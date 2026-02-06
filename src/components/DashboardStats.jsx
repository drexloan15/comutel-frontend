import { useEffect, useState } from 'react'

function DashboardStats() {
  const [metricas, setMetricas] = useState({ total: 0, nuevos: 0, proceso: 0, resueltos: 0 })

  const cargarMetricas = () => {
    fetch('http://localhost:8080/api/tickets/metricas')
      .then(res => res.json())
      .then(data => setMetricas(data))
      .catch(err => console.error("Error cargando métricas", err))
  }

  // Cargar al inicio y cada 30 segundos (auto-refresco)
  useEffect(() => {
    cargarMetricas()
    const intervalo = setInterval(cargarMetricas, 30000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
      
      {/* Tarjeta TOTAL */}
      <Card color="#95a5a6" titulo="Total Tickets" numero={metricas.total} icono="📂" />

      {/* Tarjeta NUEVOS (Atención!) */}
      <Card color="#e74c3c" titulo="Pendientes" numero={metricas.nuevos} icono="🔥" />

      {/* Tarjeta EN PROCESO */}
      <Card color="#3498db" titulo="En Proceso" numero={metricas.proceso} icono="⚙️" />

      {/* Tarjeta RESUELTOS */}
      <Card color="#27ae60" titulo="Resueltos" numero={metricas.resueltos} icono="✅" />

    </div>
  )
}

// Sub-componente para no repetir código (Diseño de la tarjeta)
function Card({ color, titulo, numero, icono }) {
  return (
    <div style={{ 
        backgroundColor: 'white', 
        borderLeft: `5px solid ${color}`, 
        borderRadius: '8px', 
        padding: '20px', 
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
      <div>
        <p style={{ margin: '0 0 5px 0', color: '#7f8c8d', fontSize: '14px', textTransform: 'uppercase' }}>{titulo}</p>
        <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '28px' }}>{numero}</h2>
      </div>
      <div style={{ fontSize: '30px', opacity: 0.5 }}>{icono}</div>
    </div>
  )
}

export default DashboardStats
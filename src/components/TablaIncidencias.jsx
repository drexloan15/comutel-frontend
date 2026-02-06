import { useEffect, useState } from 'react'

function TablaIncidencias({ usuarioActual, alSeleccionar }) {
  const [tickets, setTickets] = useState([])

  const cargarTickets = () => {
    fetch('http://localhost:8080/api/tickets')
      .then(res => res.json())
      .then(data => setTickets(data))
      .catch(err => console.error("Error cargando tickets:", err))
  }

  useEffect(() => { cargarTickets() }, [])

  const thStyle = { background: '#f5f5f5', padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'left', fontSize: '12px', color: '#666' }
  const tdStyle = { padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px' }

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#2c3e50' }}>Incidencias / Peticiones</h3>
        <button onClick={cargarTickets} style={{ background: 'none', border: '1px solid #ccc', cursor: 'pointer', padding: '5px 10px', borderRadius: '4px' }}>🔄 Actualizar</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Código</th>
            <th style={thStyle}>Fecha</th>
            <th style={thStyle}>Título</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Solicitante</th>
            <th style={thStyle}>Técnico</th>
            <th style={thStyle}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t.id} style={{ backgroundColor: 'white' }}> {/* Eliminado el hover complejo por ahora para limpiar */}
              <td style={tdStyle}><strong>REQ-{t.id}</strong></td>
              <td style={tdStyle}>{t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString() : '-'}</td>
              <td style={tdStyle}>{t.titulo}</td>
              <td style={tdStyle}>
                <span style={{ 
                  padding: '2px 6px', borderRadius: '4px', fontSize: '11px',
                  backgroundColor: t.estado === 'NUEVO' ? '#f1c40f' : t.estado === 'RESUELTO' ? '#27ae60' : '#3498db',
                  color: 'white'
                }}>
                  {t.estado}
                </span>
              </td>
              <td style={tdStyle}>{t.usuario ? t.usuario.nombre : 'Sin usuario'}</td>
              <td style={tdStyle}>{t.tecnico ? t.tecnico.nombre : 'Sin Asignar'}</td>
              <td style={tdStyle}>
                 <button 
                    onClick={() => alSeleccionar(t)} 
                    style={{ fontSize: '12px', cursor: 'pointer', border: '1px solid #ccc', background: 'white', padding: '2px 8px', borderRadius: '4px' }}>
                    👁️ Ver
                 </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TablaIncidencias
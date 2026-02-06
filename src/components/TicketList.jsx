import { useEffect, useState } from 'react'

function TicketList({ usuarioActual, alSeleccionar }) { // <--- Recibimos alSeleccionar
  const [tickets, setTickets] = useState([])

  const cargarTickets = () => {
    // Si es CLIENTE, solo ve SUS tickets. Si es ADMIN, ve TODOS.
    const url = usuarioActual.rol === 'CLIENTE' 
        ? `http://192.168.1.173:8080/api/tickets/mis-tickets/${usuarioActual.id}` // (Asegúrate que este endpoint exista o usa el filtro en frontend)
        : 'http://192.168.1.173:8080/api/tickets';

    // NOTA: Por simplicidad usaremos el de "todos" y filtraremos en JS si no tienes el endpoint de "mis-tickets" creado
    fetch('http://192.168.1.173:8080/api/tickets')
      .then(res => res.json())
      .then(data => {
         if(usuarioActual.rol === 'CLIENTE') {
             setTickets(data.filter(t => t.usuario.id === usuarioActual.id))
         } else {
             setTickets(data)
         }
      })
  }

  useEffect(() => {
    cargarTickets()
    // Auto-refresco cada 10 seg
    const intervalo = setInterval(cargarTickets, 10000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div>
      {tickets.length === 0 ? <p style={{color: '#999'}}>No tienes tickets recientes.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tickets.map(t => (
              <div key={t.id} style={{ 
                  backgroundColor: 'white', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  borderLeft: `5px solid ${t.estado === 'NUEVO' ? '#f1c40f' : t.estado === 'RESUELTO' ? '#27ae60' : '#3498db'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{t.titulo}</h4>
                  <small style={{ color: '#7f8c8d' }}>
                    {new Date(t.fechaCreacion || Date.now()).toLocaleDateString()} • {t.estado}
                  </small>
                </div>
                
                {/* BOTÓN PARA ABRIR CHAT */}
                <button 
                    onClick={() => alSeleccionar(t)} // <--- ¡AQUÍ ESTÁ LA MAGIA!
                    style={{ 
                        background: '#3498db', color: 'white', border: 'none', 
                        padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' 
                    }}
                >
                    💬 Ver Chat
                </button>
              </div>
            ))}
          </div>
      )}
    </div>
  )
}

export default TicketList
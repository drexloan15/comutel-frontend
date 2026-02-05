import { useState, useEffect } from 'react'

function TicketList() {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    fetch('http://localhost:8080/api/tickets')
      .then(response => response.json())
      .then(data => setTickets(data))
      .catch(error => console.error('Error tickets:', error))
  }, [])

  return (
    <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
      <h2 style={{ color: '#e74c3c' }}>🎫 Tickets de Soporte</h2>
      
      {tickets.length === 0 ? (
        <p>No hay tickets registrados.</p>
      ) : (
        tickets.map(t => (
          <div key={t.id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '10px', backgroundColor: 'white' }}>
            <h3>{t.titulo}</h3>
            <p>{t.descripcion}</p>
            <p><small>Prioridad: {t.prioridad} | Estado: {t.estado}</small></p>
          </div>
        ))
      )}
    </div>
  )
}

export default TicketList
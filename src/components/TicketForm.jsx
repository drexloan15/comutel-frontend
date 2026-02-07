import { useState } from 'react'

function TicketForm({ usuarioActual }) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('MEDIA')

  const handleSubmit = (e) => {
    e.preventDefault() // <--- Evita que la página se recargue sola

    // 1. DIAGNÓSTICO: ¿Llegó el usuario?
    console.log("👤 Usuario intentando enviar:", usuarioActual);

    if (!usuarioActual || !usuarioActual.id) {
        alert("⛔ Error: No se ha identificado al usuario. Cierra sesión y vuelve a entrar.");
        return;
    }

    const nuevoTicket = {
      titulo: titulo,
      descripcion: descripcion,
      prioridad: prioridad,
      estado: 'NUEVO',
      usuario: { id: usuarioActual.id } // <--- Aquí vinculamos el ticket al cliente
    }

    // 2. DIAGNÓSTICO: ¿Qué estamos enviando?
    console.log("📤 Enviando paquete al Backend:", nuevoTicket);

    fetch('http://localhost:8080/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuevoTicket)
    })
    .then(async response => {
      // 3. DIAGNÓSTICO: ¿Qué respondió el servidor?
      if (response.ok) {
        alert('✅ ¡Ticket creado con éxito!');
        setTitulo('');      // Limpiamos los campos
        setDescripcion('');
        window.location.reload(); // Recargamos para ver el cambio
      } else {
        const errorTexto = await response.text();
        console.error("❌ Error del Backend:", errorTexto);
        alert('❌ Error al guardar: ' + errorTexto);
      }
    })
    .catch(error => {
      console.error("🔥 Error de Red:", error);
      alert('❌ Error de conexión: Revisa que el Backend esté encendido.');
    })
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px', backgroundColor: '#fff', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{color: '#2c3e50', marginTop: 0}}>📝 Nuevo Ticket</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Título:</label>
          <input 
            type="text" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            required 
            placeholder="Ej: No tengo internet"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Detalle del Problema:</label>
          <textarea 
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ width: '100%', padding: '10px', height: '80px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            required
            placeholder="Describe qué pasó..."
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Prioridad:</label>
          <select 
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          >
            <option value="BAJA">🟢 Baja</option>
            <option value="MEDIA">🟡 Media</option>
            <option value="ALTA">🔴 Alta</option>
          </select>
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          📩 Enviar Ticket
        </button>
      </form>
    </div>
  )
}

export default TicketForm
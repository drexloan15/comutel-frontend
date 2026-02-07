import { useState, useEffect, useRef } from 'react' // <--- useRef IMPORTANTE

function DetalleTicket({ ticket, usuarioActual, alVolver }) {
  const [comentarios, setComentarios] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null) // <--- NUEVO
  const [ticketActualizado, setTicketActualizado] = useState(ticket)
  
  // Referencia para el input de archivo oculto
  const fileInputRef = useRef(null)

  // ... (cargarComentarios sigue IGUAL) ...
  const cargarComentarios = () => {
    if (!ticket?.id) return;
    fetch(`http://localhost:8080/api/tickets/${ticket.id}/comentarios`)
      .then(res => { if (!res.ok) throw new Error("Error"); return res.json(); })
      .then(data => { if (Array.isArray(data)) setComentarios(data); else setComentarios([]); })
      .catch(err => console.error(err));
  }

  useEffect(() => {
    cargarComentarios()
    const intervalo = setInterval(cargarComentarios, 5000)
    return () => clearInterval(intervalo)
  }, [ticket.id])

  // --- NUEVO: MANEJAR SELECCIÓN DE IMAGEN ---
  const manejarSeleccionArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convertir imagen a Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenSeleccionada(reader.result); // Guardamos la cadena larga
      };
      reader.readAsDataURL(file);
    }
  }

  // --- MODIFICADO: ENVIAR CON IMAGEN ---
  const enviarComentario = (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim() && !imagenSeleccionada) return; // Permitir enviar si hay imagen aunque no haya texto

    const payload = {
      texto: nuevoMensaje,
      autorId: usuarioActual.id,
      imagen: imagenSeleccionada // <--- ENVIAMOS LA FOTO
    }

    fetch(`http://localhost:8080/api/tickets/${ticket.id}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      setNuevoMensaje('')
      setImagenSeleccionada(null) // Limpiar foto
      cargarComentarios()
    })
  }

  // ... (cambiarEstado sigue IGUAL) ...
  const cambiarEstado = (nuevoEstado) => {
     // ... (tu código anterior) ...
     const endpoint = nuevoEstado === 'RESUELTO' ? 'finalizar' : `atender/${usuarioActual.id}`;
     fetch(`http://localhost:8080/api/tickets/${ticket.id}/${endpoint}`, { method: 'PUT' })
      .then(() => {
        alert(`Ticket ${nuevoEstado}!`)
        setTicketActualizado({...ticketActualizado, estado: nuevoEstado, tecnico: usuarioActual})
      })
  }

  const burbujaStyle = (esMio) => ({
    backgroundColor: esMio ? '#dcf8c6' : 'white',
    alignSelf: esMio ? 'flex-end' : 'flex-start',
    padding: '10px',
    borderRadius: '10px',
    margin: '5px 0',
    maxWidth: '70%',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    border: esMio ? '1px solid #cfeeb8' : '1px solid #ddd'
  })

  if (!ticketActualizado) return <div>Cargando...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: '80vh' }}>
      
      {/* CHAT */}
      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#e5ddd5', borderRadius: '8px', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '15px', backgroundColor: '#f0f2f5', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={alVolver} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>⬅</button>
          <div>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>{ticketActualizado.titulo}</h3>
            <small>REQ-{ticketActualizado.id} | {ticketActualizado.usuario?.nombre}</small>
          </div>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ ...burbujaStyle(false), backgroundColor: '#fff3cd', border: '1px solid #ffeeba', width: '90%' }}>
            <strong>Descripción:</strong>
            <p style={{ margin: '5px 0' }}>{ticketActualizado.descripcion}</p>
          </div>

          {Array.isArray(comentarios) && comentarios.map(c => {
             const esMio = c.autor?.id === usuarioActual.id;
             return (
               <div key={c.id} style={burbujaStyle(esMio)}>
                 <strong style={{ fontSize: '11px', color: '#555' }}>{c.autor?.nombre}</strong>
                 
                 {/* RENDERIZAR IMAGEN SI EXISTE */}
                 {c.imagenBase64 && (
                    <img 
                        src={c.imagenBase64} 
                        alt="adjunto" 
                        style={{ display: 'block', maxWidth: '100%', borderRadius: '5px', marginTop: '5px', cursor: 'pointer' }}
                        onClick={() => window.open(c.imagenBase64)} // Click para ver grande
                    />
                 )}

                 <p style={{ margin: '2px 0' }}>{c.texto}</p>
                 <small style={{ fontSize: '10px', color: '#999', float: 'right' }}>{c.fecha ? new Date(c.fecha).toLocaleTimeString() : ''}</small>
               </div>
             )
          })}
        </div>

        {/* --- AREA DE INPUT --- */}
        <div style={{ backgroundColor: '#f0f2f5' }}>
            {/* Previsualización de imagen seleccionada */}
            {imagenSeleccionada && (
                <div style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#e1e1e1' }}>
                    <span style={{fontSize: '12px'}}>📷 Imagen lista para enviar</span>
                    <button onClick={() => setImagenSeleccionada(null)} style={{background:'red', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer'}}>x</button>
                </div>
            )}

            <form onSubmit={enviarComentario} style={{ padding: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            
            {/* BOTÓN CLIP (INPUT OCULTO) */}
            <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                ref={fileInputRef}
                onChange={manejarSeleccionArchivo}
            />
            <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} // Simula click en el input
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                title="Adjuntar imagen"
            >
                📎
            </button>

            <input 
                type="text" 
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribe..." 
                style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>➤</button>
            </form>
        </div>
      </div>

      {/* INFO DERECHA (Igual que antes) */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        {/* ... (Copia aquí el contenido de la columna derecha de tu versión anterior con los botones de acción) ... */}
        <h4 style={{ color: '#2c3e50' }}>Detalles</h4>
        <p><strong>Estado:</strong> {ticketActualizado.estado}</p>
        <p><strong>Solicitante:</strong> {ticketActualizado.usuario?.nombre}</p>
        {/* (Solo pon los botones de acción como en el paso anterior) */}
         {(usuarioActual.rol === 'TECNICO' || usuarioActual.rol === 'ADMIN') && ticketActualizado.estado === 'NUEVO' && (
              <button onClick={() => cambiarEstado('EN_PROCESO')} style={{width:'100%', padding:'10px', background:'#3498db', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Asignármelo</button>
         )}
         {(usuarioActual.rol === 'TECNICO' || usuarioActual.rol === 'ADMIN') && ticketActualizado.estado === 'EN_PROCESO' && (
              <button onClick={() => cambiarEstado('RESUELTO')} style={{width:'100%', padding:'10px', background:'#27ae60', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Resolver</button>
         )}
      </div>
    </div>
  )
}

export default DetalleTicket
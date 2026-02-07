import { useState, useEffect } from 'react'


function GestorKB() {
  const [articulos, setArticulos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')

  // Cargar artículos al iniciar
  const cargarArticulos = () => {
    fetch('http://localhost:8080/api/articulos')
      .then(res => res.json())
      .then(data => setArticulos(data))
  }

  useEffect(() => { cargarArticulos() }, [])

  // Guardar nuevo artículo
  const guardarArticulo = (e) => {
    e.preventDefault()
    const nuevo = { titulo, contenido }

    fetch('http://localhost:8080/api/articulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    }).then(() => {
      alert("✅ Artículo publicado exitosamente")
      setTitulo('')
      setContenido('')
      cargarArticulos()
    })
  }

  // Eliminar artículo
  const eliminar = (id) => {
    if(!confirm("¿Borrar este artículo?")) return;
    fetch(`http://localhost:8080/api/articulos/${id}`, { method: 'DELETE' })
      .then(() => cargarArticulos())
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      
      {/* IZQUIERDA: FORMULARIO DE CREACIÓN */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>✍️ Crear Nuevo Artículo</h3>
        <form onSubmit={guardarArticulo}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Título:</label>
            <input 
              type="text" 
              value={titulo} onChange={e => setTitulo(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              placeholder="Ej: Cómo reiniciar el router"
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Contenido / Solución:</label>
            <textarea 
              value={contenido} onChange={e => setContenido(e.target.value)}
              style={{ width: '100%', height: '150px', padding: '8px', boxSizing: 'border-box' }}
              placeholder="Escribe los pasos aquí..."
              required
            />
          </div>
          <button type="submit" style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px' }}>
            💾 Publicar
          </button>
        </form>
      </div>

      {/* DERECHA: LISTA DE ARTÍCULOS EXISTENTES */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>📚 Artículos Publicados</h3>
        {articulos.length === 0 ? <p>No hay artículos aún.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {articulos.map(art => (
              <li key={art.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <strong>{art.titulo}</strong>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#777' }}>
                        {art.contenido.substring(0, 50)}...
                    </p>
                </div>
                <button 
                    onClick={() => eliminar(art.id)}
                    style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', height: '30px' }}>
                    🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}

export default GestorKB
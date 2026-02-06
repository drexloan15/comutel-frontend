import { useState, useEffect } from 'react'

function UserList() {
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    fetch('http://192.168.1.173:8080/api/usuarios')
      .then(response => response.json())
      .then(data => setUsuarios(data))
      .catch(error => console.error('Error usuarios:', error))
  }, [])

  return (
    <div style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '10px', borderRadius: '10px' }}>
      <h2 style={{ color: '#3498db' }}>👥 Usuarios Registrados</h2>
      <ul>
        {usuarios.map(u => (
          <li key={u.id}>
            <strong>{u.nombre}</strong> ({u.rol})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UserList
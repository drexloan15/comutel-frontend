import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../constants/api'

function UserList() {
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    fetch(`${API_BASE_URL}/usuarios`)
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

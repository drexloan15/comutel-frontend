import { useState } from 'react'

function Login({ alIniciarSesion }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(false) // <--- 1. NUEVO: Estado del checkbox

  const handleLogin = (e) => {
    e.preventDefault()

    const credenciales = { email, password }

    fetch('http://localhost:8080/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credenciales)
    })
    .then(response => {
      if (response.ok) return response.json()
      else throw new Error('Credenciales incorrectas')
    })
    .then(usuario => {
      // 2. NUEVO: Enviamos también la decisión de recordar
      alIniciarSesion(usuario, recordar) 
    })
    .catch(error => alert('❌ Error: Usuario o contraseña incorrectos'))
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div style={{ width: '300px', padding: '30px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '10px', textAlign: 'center', backgroundColor: 'white' }}>
        <h2 style={{ color: '#2c3e50' }}>🔐 Iniciar Sesión</h2>
        <h4 style={{ color: '#3498db', marginTop: '-10px' }}>Comutel Service</h4>
        
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Correo corporativo" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' }}
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' }}
          />

          {/* 3. NUEVO: Checkbox de recordar */}
          <div style={{ textAlign: 'left', marginBottom: '15px', fontSize: '14px', color: '#555' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Mantener sesión activa
            </label>
          </div>

          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
import UserList from './components/UserList'
import TicketList from './components/TicketList'

function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      
      <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>
        🖥️ Comutel Service Dashboard
      </h1>
      
      <p style={{ textAlign: 'center' }}>Sistema de gestión v1.0</p>
      <hr />

      {/* Aquí insertamos nuestros bloques de Lego */}
      <UserList />
      <TicketList />

    </div>
  )
}

export default App
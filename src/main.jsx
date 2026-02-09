import React from 'react'
import ReactDOM from 'react-dom/client' // <--- ¡ESTA LÍNEA ES LA QUE TE FALTA!
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // El Router que agregamos antes

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
import { useState } from 'react';
import { API_BASE_URL } from "../constants/api";
import { userService } from "../services/userService";

function Login({ alIniciarSesion }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [reparandoAdmin, setReparandoAdmin] = useState(false);
  const [error, setError] = useState(null);

  const loginConCredenciales = async () => {
    const credenciales = { email, password };
    const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credenciales)
    });

    if (!response.ok) throw new Error('Credenciales incorrectas');
    return await response.json();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const usuario = await loginConCredenciales();
      setTimeout(() => {
        alIniciarSesion(usuario, recordar);
      }, 800);
    } catch {
      setError("Usuario o contraseña incorrectos.");
      setCargando(false);
    }
  };

  const handleRepararAdmin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Ingresa usuario/email y contraseña para reparar admin.");
      return;
    }

    setError(null);
    setReparandoAdmin(true);
    setCargando(true);

    try {
      await userService.repararAdmin(email, password);
      const usuario = await loginConCredenciales();
      alIniciarSesion(usuario, recordar);
    } catch {
      setError("No se pudo reparar el admin. Verifica permisos del backend.");
    } finally {
      setReparandoAdmin(false);
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans overflow-hidden">
      {/* 1. SECCIÓN IZQUIERDA (IMAGEN + BRANDING) - OCUPA 2/3 (66%) */}
      <div
        className="hidden lg:flex lg:w-2/3 relative flex-col justify-between p-16 text-white bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-blue-900/80 backdrop-blur-[1px]"></div>

        <div className="relative z-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/40">C</div>
            <span className="font-bold text-xl tracking-widest uppercase text-blue-100">Comutel Service</span>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-6xl font-bold leading-tight mb-6 text-white">
              Gestión inteligente <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                para soporte TI.
              </span>
            </h1>
            <p className="text-blue-100 text-xl font-light leading-relaxed max-w-lg">
              Optimiza tiempos de respuesta, gestiona el inventario y centraliza el conocimiento en una sola plataforma segura.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 text-sm text-blue-200/60 font-medium">
          <span>&copy; 2026 Comutel Perú</span>
          <span>•</span>
          <span>Política de Privacidad</span>
          <span>•</span>
          <span>Soporte</span>
        </div>
      </div>

      {/* 2. SECCIÓN DERECHA (FORMULARIO) - OCUPA 1/3 (33%) */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-8 lg:p-12 bg-white shadow-2xl z-20">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-2xl mx-auto mb-2">C</div>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Bienvenido</h2>
            <p className="text-slate-500 mt-2 text-sm">Ingresa tus credenciales para acceder a la plataforma.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm flex gap-3 items-center animate-pulse">
              <span>⚠️</span>
              <span className="text-red-600 font-semibold">{error}</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Correo o Usuario</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-medium bg-slate-50 focus:bg-white"
                    placeholder="jean.puccio o usuario@comutel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-medium bg-slate-50 focus:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                />
                <span className="ml-2 block text-sm text-slate-600">Mantener sesión</span>
              </label>
              <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-500 hover:underline">
                ¿Olvidaste tu clave?
              </a>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-200
                ${cargando ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30 transform hover:-translate-y-0.5'}`}
            >
              {cargando ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </div>
              ) : "Ingresar al Portal"}
            </button>

            {error && (
              <button
                type="button"
                onClick={handleRepararAdmin}
                disabled={reparandoAdmin || cargando}
                className="w-full border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition disabled:opacity-60"
              >
                {reparandoAdmin ? "Reparando administrador..." : "Reparar acceso admin"}
              </button>
            )}
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-center text-xs text-slate-400">
              ¿Problemas de acceso? <a href="#" className="text-blue-500 font-bold hover:underline">Contacta a soporte TI</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

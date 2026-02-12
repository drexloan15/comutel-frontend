import { useState } from "react";
import { API_BASE_URL } from "../constants/api";

function TicketForm({ usuarioActual }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("MEDIA");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!usuarioActual?.id) {
      alert("Error: No se ha identificado al usuario.");
      return;
    }

    // TicketController espera usuarioId (no objeto usuario anidado).
    const nuevoTicket = {
      titulo,
      descripcion,
      prioridad,
      estado: "NUEVO",
      usuarioId: usuarioActual.id,
    };

    fetch(`${API_BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoTicket),
    })
      .then(async (response) => {
        if (response.ok) {
          alert("Ticket creado con exito.");
          setTitulo("");
          setDescripcion("");
          window.location.reload();
        } else {
          const errorTexto = await response.text();
          alert(`Error al guardar: ${errorTexto}`);
        }
      })
      .catch(() => {
        alert("Error de conexion con backend.");
      });
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        backgroundColor: "#fff",
        marginBottom: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ color: "#2c3e50", marginTop: 0 }}>Nuevo Ticket</h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Titulo:</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
            required
            placeholder="Ej: No tengo internet"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Detalle del Problema:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              height: "80px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
            required
            placeholder="Describe que paso..."
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Prioridad:</label>
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Enviar Ticket
        </button>
      </form>
    </div>
  );
}

export default TicketForm;

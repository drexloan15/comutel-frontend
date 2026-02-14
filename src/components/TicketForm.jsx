import { useEffect, useMemo, useState } from "react";
import { ticketService } from "../services/ticketService";
import { catalogoService } from "../services/catalogoService";

function TicketForm({ usuarioActual }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("MEDIA");
  const [processType, setProcessType] = useState("");
  const [workflowKey, setWorkflowKey] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const categoriasFiltradas = useMemo(() => {
    if (!processType) return categorias;
    return categorias.filter((c) => String(c.processType || "").toUpperCase() === processType);
  }, [categorias, processType]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [tiposData, categoriasData] = await Promise.all([
          catalogoService.listarTipos(),
          catalogoService.listarCategorias(),
        ]);
        setTipos(Array.isArray(tiposData) ? tiposData : []);
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      } catch (error) {
        console.error(error);
      }
    };

    cargarCatalogos();
  }, []);

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
      usuarioId: usuarioActual.id,
      processType,
      workflowKey,
      categoriaId,
    };

    ticketService.crear(nuevoTicket)
      .then(() => {
        alert("Ticket creado con exito.");
        setTitulo("");
        setDescripcion("");
        setProcessType("");
        setWorkflowKey("");
        setCategoriaId("");
        window.location.reload();
      })
      .catch((error) => {
        alert(`Error al guardar: ${error?.message || "Error de conexion con backend."}`);
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

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Tipo de ticket (opcional):</label>
          <select
            value={processType}
            onChange={(e) => {
              const selectedType = e.target.value;
              setProcessType(selectedType);
              const tipo = tipos.find((item) => item.clave === selectedType);
              setWorkflowKey(tipo?.workflowKey || "");
              setCategoriaId("");
            }}
            style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value="">Seleccionar...</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.clave}>
                {tipo.nombre} ({tipo.clave})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Categoria (opcional):</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value="">Seleccionar...</option>
            {categoriasFiltradas.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Workflow Key (opcional):</label>
          <input
            type="text"
            value={workflowKey}
            onChange={(e) => setWorkflowKey(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
            placeholder="Ej: ticket-default-v1"
          />
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

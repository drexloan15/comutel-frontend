import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";

function TicketList({ usuarioActual, alSeleccionar }) {
  const [tickets, setTickets] = useState([]);

  const cargarTickets = useCallback(() => {
    // El backend actual no expone /mis-tickets; filtramos en frontend para CLIENTE.
    fetch(`${API_BASE_URL}/tickets`)
      .then((res) => res.json())
      .then((data) => {
        if (usuarioActual.rol === "CLIENTE") {
          setTickets(data.filter((t) => t.usuario?.id === usuarioActual.id));
        } else {
          setTickets(data);
        }
      });
  }, [usuarioActual.id, usuarioActual.rol]);

  useEffect(() => {
    cargarTickets();
    const intervalo = setInterval(cargarTickets, 10000);
    return () => clearInterval(intervalo);
  }, [cargarTickets]);

  return (
    <div>
      {tickets.length === 0 ? (
        <p style={{ color: "#999" }}>No tienes tickets recientes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tickets.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "8px",
                borderLeft: `5px solid ${
                  t.estado === "NUEVO" ? "#f1c40f" : t.estado === "RESUELTO" ? "#27ae60" : "#3498db"
                }`,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 5px 0", color: "#2c3e50" }}>{t.titulo}</h4>
                <small style={{ color: "#7f8c8d" }}>
                  {t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString() : "-"} - {t.estado}
                </small>
              </div>

              <button
                onClick={() => alSeleccionar(t)}
                style={{
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Ver Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketList;

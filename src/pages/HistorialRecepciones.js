import { useEffect, useState } from "react";
import "./HistorialRecepciones.css";

const RECEPCIONES_KEY = "historial_recepciones";
const INVENTARIO_KEY = "inventario_productos";

function HistorialRecepciones() {
  const [historial, setHistorial] = useState([]);
  const [abiertos, setAbiertos] = useState({});

  // Cargar historial
  useEffect(() => {
    const cargarHistorial = () => {
      const data = JSON.parse(localStorage.getItem(RECEPCIONES_KEY)) || [];
      setHistorial([...data].reverse());
    };

    cargarHistorial();

    window.addEventListener("storage", cargarHistorial);
    return () => window.removeEventListener("storage", cargarHistorial);
  }, []);

  // Abrir/cerrar acordeón
  const toggle = (index) => {
    setAbiertos((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Resumen analítico
  const totalEnvios = historial.reduce((acc, r) => acc + Number(r.costoEnvio || 0), 0);
  const totalUnidades = historial.reduce((acc, r) => acc + Number(r.totalUnidades || 0), 0);
  const promedioHistorico = totalUnidades > 0 ? totalEnvios / totalUnidades : 0;

  // Eliminar recepción y descontar del inventario
  const eliminarRecepcion = (id) => {
    if (!window.confirm("¿Eliminar esta recepción?\n\nEsto descontará productos del inventario.")) {
      return;
    }

    const historialOriginal = JSON.parse(localStorage.getItem(RECEPCIONES_KEY)) || [];
    const recepcion = historialOriginal.find((r) => r.id === id);

    if (!recepcion) {
      alert("Recepción no encontrada");
      return;
    }

    const inventario = JSON.parse(localStorage.getItem(INVENTARIO_KEY)) || [];
    const inventarioActualizado = inventario.map((prod) => {
      const recibido = recepcion.productos.find((p) => p.id === prod.id);
      if (!recibido) return prod;

      let cantidadEliminar = Number(recibido.cantidad);
      let lotesActualizados = [...(prod.lotes || [])];

      // Eliminar usando recepcionId
      for (let i = lotesActualizados.length - 1; i >= 0; i--) {
        if (cantidadEliminar <= 0) break;

        const lote = lotesActualizados[i];
        const mismaRecepcion = lote.recepcionId === recepcion.id;

        if (!mismaRecepcion) continue;

        const quitar = Math.min(lote.cantidad, cantidadEliminar);
        lote.cantidad -= quitar;
        cantidadEliminar -= quitar;
      }

      lotesActualizados = lotesActualizados.filter((l) => l.cantidad > 0);

      return {
        ...prod,
        stock: Math.max(0, Number(prod.stock) - Number(recibido.cantidad)),
        lotes: lotesActualizados
      };
    });

    localStorage.setItem(INVENTARIO_KEY, JSON.stringify(inventarioActualizado));

    const nuevoHistorial = historialOriginal.filter((r) => r.id !== id);
    localStorage.setItem(RECEPCIONES_KEY, JSON.stringify(nuevoHistorial));
    setHistorial([...nuevoHistorial].reverse());

    alert("✅ Recepción eliminada correctamente");
  };

  return (
    <div className="historial-container">
      <h2 className="historial-title">📦 Historial de Recepciones</h2>

      {/* RESUMEN ESTADÍSTICO */}
      <div className="resumen-card">
        <h3>📊 Resumen Histórico</h3>
        <div className="resumen-grid">
          <p><span>Total recepciones:</span> <b>{historial.length}</b></p>
          <p><span>Total unidades:</span> <b>{totalUnidades}</b></p>
          <p><span>Envío acumulado:</span> <b className="txt-cian">L. {totalEnvios.toFixed(2)}</b></p>
          <p><span>Promedio histórico:</span> <b className="txt-verde">L. {promedioHistorico.toFixed(2)}</b></p>
        </div>
      </div>

      {/* LISTA DE RECEPCIONES */}
      {historial.length === 0 ? (
        <p className="txt-vacio">No hay recepciones registradas.</p>
      ) : (
        historial.map((r, index) => (
          <div key={r.id || index} className="recepcion-card">
            <div className="recepcion-header" onClick={() => toggle(index)}>
              <div className="recepcion-resumen">
                <span className="badge-id">#{historial.length - index}</span>
                <span className="txt-fecha">📅 {r.fecha}</span>
                <span>📦 <b>{r.totalUnidades}</b> uds</span>
                <span className="txt-cian">🚚 L. {Number(r.costoEnvio || 0).toFixed(2)}</span>
                <span className="txt-gris-luz">📊 L. {Number(r.envioPromedio || 0).toFixed(2)} /ud</span>
              </div>

              <div className="acciones-header">
                <div className="toggle-btn">
                  {abiertos[index] ? "▲" : "▼"}
                </div>
                <button
                  className="btn-eliminar-recepcion"
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarRecepcion(r.id);
                  }}
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>

            {/* CONTENIDO DESPLEGABLE */}
            {abiertos[index] && (
              <div className="recepcion-detalle">
                <h4>Productos recibidos</h4>
                <div className="productos-recibidos-lista">
                  {r.productos?.map((p, i) => (
                    <div key={i} className="producto-item-linea">
                      <span className="prod-name">📌 {p.nombre}</span>
                      <span className="prod-qty"><b>{p.cantidad}</b> unidades</span>
                    </div>
                  ))}
                </div>

                <hr />

                <div className="detalle-desglosado">
                  <p><span>Total unidades:</span> <b>{r.totalUnidades}</b></p>
                  <p><span>Costo envío:</span> <span className="txt-cian">L. {Number(r.costoEnvio || 0).toFixed(2)}</span></p>
                  <p><span>Envío promedio por unidad:</span> <span className="txt-verde">L. {Number(r.envioPromedio || 0).toFixed(2)}</span></p>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default HistorialRecepciones;
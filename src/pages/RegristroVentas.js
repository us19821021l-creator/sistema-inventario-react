import { useEffect, useState } from "react";
import "./RegistroVentas.css";

const SALES_KEY = "registro_ventas";
const INVENTARIO_KEY = "inventario_productos";

function RegistroVentas() {
  const [ventas, setVentas] = useState([]);
  // Estancia para controlar el modal del comprobante adjunto
  const [comprobanteActivo, setComprobanteActivo] = useState(null);

  // 1. Estado para controlar el texto del buscador
  const [busqueda, setBusqueda] = useState("");

  // 🔄 Cargar ventas e inicializar listeners de sincronización
  useEffect(() => {
    const cargarVentas = () => {
      const data = JSON.parse(localStorage.getItem(SALES_KEY)) || [];
      setVentas(data);
    };

    cargarVentas();
    window.addEventListener("storage", cargarVentas);

    return () => window.removeEventListener("storage", cargarVentas);
  }, []);

  // 🔥 Nombre legible del lote consumido
  const getEtiquetaLote = (lote) => {
    if (!lote) return "Lote desconocido";

    const fecha = lote.fecha ? new Date(lote.fecha).toLocaleString() : "Sin fecha";

    if (lote.recepcionId) {
      return `Recepción #${lote.recepcionId} — ${fecha}`;
    }

    return `Lote inicial — ${fecha}`;
  };

  // 🔥 ELIMINAR VENTA + RESTAURAR FIFO COMPLETO
  const eliminarVenta = (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta venta? El stock y los lotes FIFO se restaurarán.")) {
      return;
    }

    const ventasActuales = JSON.parse(localStorage.getItem(SALES_KEY)) || [];
    const ventaEliminada = ventasActuales.find((v) => v.id === id);

    if (!ventaEliminada) {
      alert("Venta no encontrada");
      return;
    }

    const inventario = JSON.parse(localStorage.getItem(INVENTARIO_KEY)) || [];

    const inventarioRestaurado = inventario.map((prod) => {
      const vendido = ventaEliminada.productos?.find((p) => p.id === prod.id);
      if (!vendido) return prod;

      let lotes = [...(prod.lotes || [])];

      if (vendido.lotesConsumidos && vendido.lotesConsumidos.length > 0) {
        vendido.lotesConsumidos.forEach((loteVendido) => {
          const indexLote = lotes.findIndex((l) => {
            if (loteVendido.recepcionId && l.recepcionId) {
              return (
                l.recepcionId === loteVendido.recepcionId &&
                l.fecha === loteVendido.fecha
              );
            }
            return (
              l.fecha === loteVendido.fecha &&
              Number(l.costoBase || 0) === Number(loteVendido.costoBase || 0) &&
              Number(l.envioUnitario || 0) === Number(loteVendido.envioUnitario || 0)
            );
          });

          if (indexLote !== -1) {
            lotes[indexLote] = {
              ...lotes[indexLote],
              cantidad:
                Number(lotes[indexLote].cantidad || 0) +
                Number(loteVendido.cantidad || 0),
            };
          } else {
            lotes.push({
              cantidad: Number(loteVendido.cantidad || 0),
              costoBase: Number(loteVendido.costoBase || 0),
              envioUnitario: Number(loteVendido.envioUnitario || 0),
              fecha: loteVendido.fecha || new Date().toISOString(),
              recepcionId: loteVendido.recepcionId || null,
            });
          }
        });

        lotes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      }

      return {
        ...prod,
        stock: Number(prod.stock || 0) + Number(vendido.cantidad || 0),
        vendido: Math.max(Number(prod.vendido || 0) - Number(vendido.cantidad || 0), 0),
        lotes,
      };
    });

    localStorage.setItem(INVENTARIO_KEY, JSON.stringify(inventarioRestaurado));

    const nuevasVentas = ventasActuales.filter((v) => v.id !== id);
    localStorage.setItem(SALES_KEY, JSON.stringify(nuevasVentas));
    setVentas(nuevasVentas);

    alert("✅ Venta eliminada y FIFO restaurado con éxito.");
  };

  // 2. Lógica de Filtrado Multicriterio en Tiempo Real
  const ventasFiltradas = ventas.filter((v) => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return true;

    const nombreCliente = v.cliente?.nombre ? v.cliente.nombre.toLowerCase() : "consumidor final";
    const telefonoCliente = v.cliente?.telefono ? v.cliente.telefono.toLowerCase() : "";
    const tipoPago = v.tipoPago ? v.tipoPago.toLowerCase() : "";

    const cumpleCliente = nombreCliente.includes(termino) || telefonoCliente.includes(termino) || tipoPago.includes(termino);

    const cumpleProductos = v.productos?.some((p) => 
      p.nombre ? p.nombre.toLowerCase().includes(termino) : false
    );

    return cumpleCliente || cumpleProductos;
  });

  // 🔥 NUEVO: Invertir el orden para mostrar primero las más recientes
  const ventasOrdenadas = [...ventasFiltradas].reverse();

  return (
    <div className="ventas-bg">
      <div className="ventas-container">
        
        <div className="ventas-header-block">
          <h2>Registro Histórico de Ventas FIFO</h2>
          <span className="ventas-count-badge">
            {busqueda ? `${ventasFiltradas.length} encontradas` : `${ventas.length} Operaciones`}
          </span>
        </div>

        {/* 4. BARRA DE BÚSQUEDA INTEGRADA */}
        <div className="ventas-card-search" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            className="ads-input"
            placeholder="🔍 Buscar por cliente, teléfono, tipo de pago o producto vendido..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="ventas-card-table">
          <div className="ventas-tabla-wrapper">
            <table className="ventas-table">
              <thead>
                <tr>
                  <th>Cliente & Pago</th>
                  <th>Artículos & Trazabilidad FIFO</th>
                  <th>Total Cobrado</th>
                  <th>Fecha Operación</th>
                  <th className="txt-centro">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="ventas-txt-vacio">
                      {ventas.length === 0 
                        ? "No se han registrado transacciones comerciales en el sistema."
                        : "No se encontraron ventas que coincidan con los criterios de búsqueda."}
                    </td>
                  </tr>
                ) : (
                  // Mapeamos sobre el array que ya fue filtrado y revertido
                  ventasOrdenadas.map((v) => (
                    <tr key={v.id} className="ventas-fila">
                      
                      {/* 👤 CLIENTE */}
                      <td>
                        <div className="cliente-info-wrapper">
                          <span className="cliente-nombre">
                            {v.cliente?.nombre || "Consumidor Final"}
                          </span>
                          {v.cliente?.telefono && (
                            <span className="cliente-meta telefono">
                              📞 {v.cliente.telefono}
                            </span>
                          )}
                          {v.tipoPago && (
                            <span className="cliente-meta pago-tag">
                              💳 {v.tipoPago}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 📦 PRODUCTOS Y LOTES */}
                      <td>
                        <div className="productos-lista-col">
                          {v.productos?.map((p, i) => (
                            <div key={i} className="producto-item-contenedor">
                              <div className="producto-item-header">
                                <span className="prod-nombre">{p.nombre}</span>
                                <span className="prod-cant">x{p.cantidad} uds</span>
                              </div>

                              {/* Historial de desgloses de Lotes */}
                              {p.lotesConsumidos && p.lotesConsumidos.length > 0 ? (
                                <div className="lotes-consumidos-sublista">
                                  {p.lotesConsumidos.map((l, idx) => {
                                    const costoUnitario =
                                      Number(l.costoBase || 0) + Number(l.envioUnitario || 0);

                                    return (
                                      <div key={idx} className="lote-consumido-row">
                                        <span className="lote-flecha">↳</span>
                                        <span className="lote-detalles">
                                          {getEtiquetaLote(l)} — <b>{l.cantidad} ud(s)</b>
                                        </span>
                                        <span className="lote-costo-calculado">
                                          (Costo: L. {costoUnitario.toFixed(2)})
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="lotes-no-registrados">
                                  Sin desglose de lotes FIFO archivado.
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* 💰 TOTAL */}
                      <td>
                        <span className="ventas-total-monto">
                          L. {Number(v.total || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* 📅 FECHA */}
                      <td>
                        <span className="ventas-fecha-txt">
                          {v.fecha ? new Date(v.fecha).toLocaleString() : "Sin fecha"}
                        </span>
                      </td>

                      {/* ⚙️ ACCIONES */}
                      <td className="txt-centro">
                        <div className="ventas-acciones-wrapper">
                          <button
                            className={`btn-ventas-comprobante ${!v.comprobante ? 'disabled' : ''}`}
                            type="button"
                            title={v.comprobante ? "Ver Comprobante de Pago" : "Sin comprobante adjunto"}
                            disabled={!v.comprobante}
                            onClick={() => setComprobanteActivo(v.comprobante)}
                          >
                            👁️ Adjunto
                          </button>
                          
                          <button
                            className="btn-ventas-eliminar"
                            type="button"
                            onClick={() => eliminarVenta(v.id)}
                          >
                            Anular
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 🖼️ MODAL OVERLAY PARA VISUALIZAR COMPROBANTE */}
      {comprobanteActivo && (
        <div className="comprobante-modal-overlay" onClick={() => setComprobanteActivo(null)}>
          <div className="comprobante-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="comprobante-modal-header">
              <h4>Comprobante de Transacción</h4>
              <button className="btn-close-modal" onClick={() => setComprobanteActivo(null)}>×</button>
            </div>
            <div className="comprobante-modal-body">
              <img src={comprobanteActivo} alt="Comprobante de pago" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistroVentas;
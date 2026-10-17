import { useEffect, useState } from "react";
import "./ReporteInventario.css";

const INVENTARIO_KEY = "inventario_productos";
const ENVIO_KEY = "costo_envio";
const RECEPCIONES_KEY = "historial_recepciones";

function ReporteFaltantes() {
  const [faltantes, setFaltantes] = useState([]);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [recibidos, setRecibidos] = useState({});

  useEffect(() => {
    const cargarDatos = () => {
      const data = JSON.parse(localStorage.getItem(INVENTARIO_KEY)) || [];

      const productosFaltantes = data
        .filter((p) => p.stock < p.stockMinimo)
        .map((p) => ({
          ...p,
          faltante: p.stockMinimo - p.stock
        }));

      const envioGuardado = Number(localStorage.getItem(ENVIO_KEY)) || 0;

      setCostoEnvio(envioGuardado);
      setFaltantes(productosFaltantes);
    };

    cargarDatos();
    window.addEventListener("storage", cargarDatos);

    return () => window.removeEventListener("storage", cargarDatos);
  }, []);

  // 🔥 COSTO FIFO REAL
  const calcularCostoFIFO = (producto) => {
    if (!producto.lotes || producto.lotes.length === 0) {
      return Number(producto.costoBase || 0);
    }

    let total = 0;
    let unidades = 0;

    producto.lotes.forEach((lote) => {
      const costo = Number(lote.costoBase || 0) + Number(lote.envioUnitario || 0);
      total += costo * Number(lote.cantidad || 0);
      unidades += Number(lote.cantidad || 0);
    });

    return unidades > 0 ? total / unidades : Number(producto.costoBase || 0);
  };

  // 🔢 Total unidades faltantes
  const totalPedido = faltantes.reduce((acc, p) => acc + p.faltante, 0);

  // 📊 Recibidos
  const totalRecibido = faltantes.reduce((acc, p) => acc + Number(recibidos[p.id] || 0), 0);

  // 📦 Pendiente real
  const totalPendiente = faltantes.reduce(
    (acc, p) => acc + Math.max(p.faltante - Number(recibidos[p.id] || 0), 0),
    0
  );

  // 💰 Costo real FIFO
  const totalPedidoCosto = faltantes.reduce((acc, p) => {
    const costoUnitario = calcularCostoFIFO(p);
    const recibido = Number(recibidos[p.id] || 0);
    const faltanteReal = Math.max(p.faltante - recibido, 0);

    return acc + costoUnitario * faltanteReal;
  }, 0);

  const totalFinal = totalPedidoCosto + Number(costoEnvio);

  // 📦 Procesar pedido
  const procesarPedido = () => {
    alert("Pedido registrado correctamente. Ahora debes confirmar la recepción cuando llegue la mercancía.");
  };

  // 🧾 Generar orden de impresión
  const generarOrden = () => {
    const ventana = window.open("", "_blank");
    const contenido = `
      <html>
        <head>
          <title>Orden de Compra</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background-color: #f1f5f9; }
            .total-txt { text-align: right; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Orden de Compra</h2>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad Requerida</th>
              </tr>
            </thead>
            <tbody>
              ${faltantes.map((p) => `
                <tr>
                  <td>${p.nombre}</td>
                  <td>${p.faltante}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <p class="total-txt">Total unidades calculadas: ${totalPedido}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    ventana.document.write(contenido);
    ventana.document.close();
  };

  // 📥 Confirmar recepción FIFO
  const confirmarRecepcion = () => {
    const inventario = JSON.parse(localStorage.getItem(INVENTARIO_KEY)) || [];
    const historial = JSON.parse(localStorage.getItem(RECEPCIONES_KEY)) || [];
    const totalRecibidoSuma = Object.values(recibidos).reduce((a, b) => a + Number(b || 0), 0);

    if (totalRecibidoSuma <= 0) {
      alert("No hay productos registrados como recibidos en las entradas del reporte.");
      return;
    }

    const envioPorUnidad = Number(costoEnvio) / totalRecibidoSuma;
    const fechaRecepcion = new Date().toISOString();
    const recepcionId = Date.now();

    const inventarioActualizado = inventario.map((prod) => {
      const recibido = Number(recibidos[prod.id] || 0);

      if (recibido > 0) {
        const nuevoLote = {
          cantidad: recibido,
          costoBase: Number(prod.costoBase),
          envioUnitario: envioPorUnidad,
          fecha: fechaRecepcion,
          recepcionId
        };

        return {
          ...prod,
          stock: Number(prod.stock) + recibido,
          lotes: [...(prod.lotes || []), nuevoLote]
        };
      }
      return prod;
    });

    localStorage.setItem(INVENTARIO_KEY, JSON.stringify(inventarioActualizado));

    historial.push({
      id: recepcionId,
      fecha: new Date().toLocaleString(),
      costoEnvio: Number(costoEnvio),
      envioPromedio: envioPorUnidad,
      totalUnidades: totalRecibidoSuma,
      productos: faltantes
        .filter((p) => Number(recibidos[p.id] || 0) > 0)
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          cantidad: Number(recibidos[p.id] || 0)
        }))
    });

    localStorage.setItem(RECEPCIONES_KEY, JSON.stringify(historial));
    alert("✅ Recepción FIFO guardada y lotes distribuidos correctamente.");
    setRecibidos({});
  };

  return (
    <div className="reporte-bg">
      <div className="reporte-container">
        
        <div className="reporte-header">
          <h2>Módulo de Reabastecimiento & Faltantes</h2>
          <span className="reporte-badge">Control de Stock Crítico</span>
        </div>

        {/* TABLA PRINCIPAL DE FALTANTES */}
        <div className="reporte-card">
          <div className="reporte-table-wrapper">
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                  <th>Cantidad Faltante</th>
                  <th>Unidades Recibidas</th>
                  <th>Costo Prom. FIFO</th>
                  <th>Subtotal Restante</th>
                </tr>
              </thead>
              <tbody>
                {faltantes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="reporte-vacio-txt">
                      Todo el inventario se encuentra correctamente abastecido 👍
                    </td>
                  </tr>
                ) : (
                  faltantes.map((p) => {
                    const costoFIFO = calcularCostoFIFO(p);
                    const faltanteReal = Math.max(p.faltante - Number(recibidos[p.id] || 0), 0);

                    return (
                      <tr key={p.id} className="reporte-fila">
                        <td className="font-destacada">{p.nombre}</td>
                        <td><span className="stock-badge actual">{p.stock}</span></td>
                        <td><span className="stock-badge faltante">{p.faltante}</span></td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={p.faltante}
                            className="reporte-input-cell"
                            placeholder="0"
                            value={recibidos[p.id] || ""}
                            onChange={(e) =>
                              setRecibidos({
                                ...recibidos,
                                [p.id]: e.target.value
                              })
                            }
                          />
                        </td>
                        <td>L. {costoFIFO.toFixed(2)}</td>
                        <td className="monto-resaltado">
                          L. {(costoFIFO * faltanteReal).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL SECUNDARIO: CONFIGURACIÓN DE ENVÍO Y RESUMEN COSTOS */}
        <div className="reporte-grid-footer">
          
          {/* Lado Izquierdo: Configuración de Envío */}
          <div className="reporte-card-panel centralizado-flex">
            <div className="envio-input-block">
              <label htmlFor="costo-envio-field">Costo Global de Envío (L.)</label>
              <input
                id="costo-envio-field"
                type="number"
                className="reporte-input-envio"
                value={costoEnvio}
                onChange={(e) => {
                  const valor = Number(e.target.value);
                  setCostoEnvio(valor);
                  localStorage.setItem(ENVIO_KEY, valor);
                }}
              />
              <p className="envio-descriptor-txt">
                Este valor se prorrateará automáticamente entre todas las unidades recibidas al procesar el lote FIFO.
              </p>
            </div>
          </div>

          {/* Lado Derecho: Resumen de Totales */}
          <div className="reporte-card-panel">
            <h3 className="resumen-titulo">Resumen Matemático del Pedido</h3>
            <table className="reporte-resumen-table">
              <tbody>
                <tr>
                  <td>Total Unidades Pendientes:</td>
                  <td className="txt-derecha font-destacada">{totalPendiente}</td>
                </tr>
                <tr>
                  <td>Total Unidades Ingresadas:</td>
                  <td className="txt-derecha color-cyan">{totalRecibido}</td>
                </tr>
                <tr>
                  <td>Flete / Envío:</td>
                  <td className="txt-derecha">L. {Number(costoEnvio).toFixed(2)}</td>
                </tr>
                <tr className="fila-total-destacada">
                  <td>Inversión Final Proyectada:</td>
                  <td className="txt-derecha">L. {totalFinal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* SECCIÓN DE ACCIONES / BOTONERA */}
        <div className="reporte-actions-bar">
          <button onClick={generarOrden} className="btn-reporte secundario" type="button">
            🧾 Generar Orden de Compra
          </button>
          <button onClick={procesarPedido} className="btn-reporte secundario" type="button">
            📦 Confirmar Envío / Pedido
          </button>
          <button onClick={confirmarRecepcion} className="btn-reporte principal" type="button">
            📥 Registrar Entrada y Lotes FIFO
          </button>
        </div>

      </div>
    </div>
  );
}

export default ReporteFaltantes;
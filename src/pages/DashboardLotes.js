import { useEffect, useState } from "react";
import "./DasboardLotes.css";

const INVENTARIO_KEY = "inventario_productos";

function DashboardLotes() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(INVENTARIO_KEY)) || [];
    setProductos(data);
  }, []);

  // 💰 Calcular valor de lote
  const valorLote = (lote) => {
    const costo = Number(lote.costoBase || 0) + Number(lote.envioUnitario || 0);
    return costo * lote.cantidad;
  };

  // 📊 Total por producto
  const totalProducto = (prod) => {
    return (prod.lotes || []).reduce((acc, l) => acc + valorLote(l), 0);
  };

  return (
    <div className="lotes-bg">
      <div className="lotes-container">
        
        <div className="lotes-header">
          <h2>Trazabilidad de Lotes FIFO</h2>
          <span className="lotes-badge-count">{productos.length} Productos</span>
        </div>

        {productos.length === 0 ? (
          <div className="lotes-vacio-card">
            <p>No se encontraron productos ni lotes activos en el almacén.</p>
          </div>
        ) : (
          productos.map((p) => (
            <div key={p.id} className="producto-lote-card">
              
              {/* HEADER DEL PRODUCTO */}
              <div className="producto-lote-meta">
                <div className="meta-info">
                  <h3>{p.nombre}</h3>
                  <span className={`stock-indicator ${p.stock <= 3 ? "critico" : "estable"}`}>
                    Stock: {p.stock} unidades
                  </span>
                </div>
                <div className="meta-financiera">
                  <span className="label-financiero">Valor Total Inventario</span>
                  <span className="monto-financiero">L. {totalProducto(p).toFixed(2)}</span>
                </div>
              </div>

              {/* TABLA DE LOTES ASOCIADOS */}
              <div className="lotes-table-wrapper">
                <table className="lotes-main-table">
                  <thead>
                    <tr>
                      <th>Fecha de Ingreso</th>
                      <th>Cantidad Disp.</th>
                      <th>Costo Base</th>
                      <th>Costo Envío Unit.</th>
                      <th>Costo Unit. Total</th>
                      <th className="txt-derecha">Valor Comercial Lote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(p.lotes || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="lotes-tabla-vacera">
                          Este producto no cuenta con lotes de entrada vigentes.
                        </td>
                      </tr>
                    ) : (
                      p.lotes.map((l, i) => {
                        const costoUnitario = Number(l.costoBase || 0) + Number(l.envioUnitario || 0);

                        return (
                          <tr key={i} className="fila-lote">
                            <td className="txt-fecha">
                              {new Date(l.fecha).toLocaleString([], {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute:'2-digit'
                              })}
                            </td>
                            <td className="font-resaltado">{l.cantidad} u.</td>
                            <td>L. {Number(l.costoBase || 0).toFixed(2)}</td>
                            <td>L. {Number(l.envioUnitario || 0).toFixed(2)}</td>
                            <td className="txt-costo-consolidado">
                              L. {costoUnitario.toFixed(2)}
                            </td>
                            <td className="txt-derecha font-resaltado color-subtotal">
                              L. {valorLote(l).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardLotes;
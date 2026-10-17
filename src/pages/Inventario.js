import { useState, useEffect } from "react";
import "./inventario.css";

const STORAGE_KEY = "inventario_productos";
const TIME_KEY = "inventario_last_update";

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [costoBase, setCostoBase] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [cargado, setCargado] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [productoEditado, setProductoEditado] = useState({});

  // 1. Estado para el texto del buscador
  const [busqueda, setBusqueda] = useState("");

  // Cargar inventario inicial
  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    const time = localStorage.getItem(TIME_KEY);

    if (data) setProductos(JSON.parse(data));
    if (time) setUltimaActualizacion(time);

    setCargado(true);
  }, []);

  // Sync entre pestañas/ventanas
  useEffect(() => {
    const sync = () => {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) setProductos(JSON.parse(data));
    };

    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Persistencia automática
  useEffect(() => {
    if (!cargado) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    const now = new Date().toLocaleString();
    localStorage.setItem(TIME_KEY, now);
    setUltimaActualizacion(now);
  }, [productos, cargado]);

  // Agregar producto con lote FIFO inicial
  const agregarProducto = (e) => {
    e.preventDefault();

    if (!nombre || !precio || !costoBase || !stock || !stockMinimo) {
      return;
    }

    const fecha = new Date().toISOString();

    const nuevoProducto = {
      id: Date.now(),
      nombre,
      precio: Number(precio),
      costoBase: Number(costoBase),
      stock: Number(stock),
      stockMinimo: Number(stockMinimo),
      lotes: [
        {
          cantidad: Number(stock),
          costoBase: Number(costoBase),
          envioUnitario: 0,
          fecha,
          recepcionId: null,
        },
      ],
      vendido: 0,
      fecha,
    };

    setProductos([...productos, nuevoProducto]);

    setNombre("");
    setPrecio("");
    setCostoBase("");
    setStock("");
    setStockMinimo("");
  };

  // Calcular costo FIFO real ponderado
  const calcularCostoFIFO = (producto) => {
    if (!producto.lotes || producto.lotes.length === 0) {
      return producto.costoBase || 0;
    }

    let stockRestante = producto.stock;
    let costoTotal = 0;

    for (const lote of producto.lotes) {
      if (stockRestante <= 0) break;

      const usar = Math.min(lote.cantidad, stockRestante);
      const costoReal = Number(lote.costoBase || 0) + Number(lote.envioUnitario || 0);

      costoTotal += usar * costoReal;
      stockRestante -= usar;
    }

    return producto.stock > 0 ? costoTotal / producto.stock : 0;
  };

  // Eliminar producto
  const eliminarProducto = (id) => {
    if (!window.confirm("¿Eliminar producto de forma permanente?")) {
      return;
    }
    setProductos(productos.filter((p) => p.id !== id));
  };

  // Iniciar edición en línea
  const iniciarEdicion = (p) => {
    setEditandoId(p.id);
    setProductoEditado({
      nombre: p.nombre,
      precio: p.precio,
      costoBase: p.costoBase,
      stockMinimo: p.stockMinimo,
    });
  };

  // Guardar cambios estructurales del producto (El Stock NO se edita a mano)
  const guardarCambios = (id) => {
    setProductos(
      productos.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            nombre: productoEditado.nombre,
            precio: Number(productoEditado.precio),
            costoBase: Number(productoEditado.costoBase),
            stockMinimo: Number(productoEditado.stockMinimo),
          };
        }
        return p;
      })
    );
    setEditandoId(null);
  };

  const cancelarEdicion = () => setEditandoId(null);

  // 2. Filtrado dinámico en tiempo real (por nombre o alertas de stock crítico)
  const productosFiltrados = productos.filter((p) => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return true;

    const cumpleNombre = p.nombre.toLowerCase().includes(termino);
    
    // Atajo para ver rápidamente los productos agotados o por agotarse
    const esCritico = p.stock <= p.stockMinimo;
    const cumpleAlerta = (termino === "critico" || termino === "crítico" || termino === "alerta") && esCritico;

    return cumpleNombre || cumpleAlerta;
  });

  return (
    <div className="inventario-bg">
      <div className="inventario-container">
        
        <div className="inventario-header-block">
          <h2>Inventario FIFO Profesional</h2>
          {ultimaActualizacion && (
            <span className="sync-timestamp">
              🔄 Sincronizado: {ultimaActualizacion}
            </span>
          )}
        </div>

        {/* FORMULARIO DE REGISTRO */}
        <div className="inventario-card-wrapper">
          <h3>📦 Registrar Nuevo Artículo</h3>
          <form className="inventario-form" onSubmit={agregarProducto}>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio Venta (L.)"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Costo Base (L.)"
                value={costoBase}
                onChange={(e) => setCostoBase(e.target.value)}
              />
              <input
                type="number"
                placeholder="Stock Inicial"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
              <input
                type="number"
                placeholder="Stock Mínimo Alerta"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
              />
            </div>
            <button className="btn-agregar-prod" type="submit">
              ➕ Añadir a Existencias
            </button>
          </form>
        </div>

        {/* TABLA DE CONTROL */}
        <div className="inventario-card-wrapper">
          <div className="inventario-tabla-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>📊 Existencias y Costeo por Lotes</h3>
            
            {/* 3. INPUT DE BÚSQUEDA INTEGRADO */}
            <div className="search-input-wrapper" style={{ flex: "1", maxWidth: "400px" }}>
              <input
                type="text"
                className="inventario-input-search"
                placeholder="🔍 Buscar por nombre o escribir 'alerta'..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="tabla-wrapper">
            <table className="inventario-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio Venta</th>
                  <th className="txt-centro">Stock Actual</th>
                  <th>Costo Real (FIFO)</th>
                  <th className="txt-centro">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* 4. Mapeo de la lista filtrada */}
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="txt-vacio">
                      {productos.length === 0 
                        ? "No hay productos registrados en el inventario."
                        : "No se encontraron artículos que coincidan con la búsqueda."}
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => {
                    const costoFIFO = calcularCostoFIFO(p);
                    const esAlertaStock = p.stock <= p.stockMinimo;

                    return (
                      <tr key={p.id} className={esAlertaStock ? "fila-alerta" : ""}>
                        {/* Celda Nombre */}
                        <td className="txt-blanco">
                          {editandoId === p.id ? (
                            <input
                              className="input-tabla-edit"
                              type="text"
                              value={productoEditado.nombre}
                              onChange={(e) =>
                                setProductoEditado({ ...productoEditado, nombre: e.target.value })
                              }
                            />
                          ) : (
                            <div className="flex-col-info">
                              <span>{p.nombre}</span>
                              {esAlertaStock && <span className="subbadge-critico">Stock Crítico</span>}
                            </div>
                          )}
                        </td>

                        {/* Celda Precio */}
                        <td className="txt-cian">
                          {editandoId === p.id ? (
                            <input
                              className="input-tabla-edit"
                              type="number"
                              step="0.01"
                              value={productoEditado.precio}
                              onChange={(e) =>
                                setProductoEditado({ ...productoEditado, precio: e.target.value })
                              }
                            />
                          ) : (
                            `L. ${p.precio.toFixed(2)}`
                          )}
                        </td>

                        {/* Celda Stock */}
                        <td className="txt-centro">
                          {editandoId === p.id ? (
                            <div className="inputs-edicion-stock-min">
                              <label>Min:</label>
                              <input
                                className="input-tabla-edit compacto"
                                type="number"
                                value={productoEditado.stockMinimo}
                                onChange={(e) =>
                                  setProductoEditado({ ...productoEditado, stockMinimo: e.target.value })
                                }
                              />
                            </div>
                          ) : (
                            <span className={`badge-stock ${esAlertaStock ? "critico" : "normal"}`}>
                              {p.stock} uds
                            </span>
                          )}
                        </td>

                        {/* Celda Costo FIFO */}
                        <td className="txt-verde">
                          {editandoId === p.id ? (
                            <div className="inputs-edicion-stock-min">
                              <label>Costo Base:</label>
                              <input
                                className="input-tabla-edit"
                                type="number"
                                step="0.01"
                                value={productoEditado.costoBase}
                                onChange={(e) =>
                                  setProductoEditado({ ...productoEditado, costoBase: e.target.value })
                                }
                              />
                            </div>
                          ) : (
                            `L. ${costoFIFO.toFixed(2)}`
                          )}
                        </td>

                        {/* Celda Acciones */}
                        <td className="txt-centro">
                          <div className="flex-acciones-botones">
                            {editandoId === p.id ? (
                              <>
                                <button
                                  className="btn-tabla-accion guardar"
                                  type="button"
                                  onClick={() => guardarCambios(p.id)}
                                >
                                  ✔
                                </button>
                                <button
                                  className="btn-tabla-accion cancelar"
                                  type="button"
                                  onClick={cancelarEdicion}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn-tabla-accion editar"
                                  type="button"
                                  onClick={() => iniciarEdicion(p)}
                                >
                                  ✏
                                </button>
                                <button
                                  className="btn-tabla-accion eliminar"
                                  type="button"
                                  onClick={() => eliminarProducto(p.id)}
                                >
                                  🗑
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Inventario;
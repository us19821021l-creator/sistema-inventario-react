import { useEffect, useState } from "react";
import "./Ventas.css";

const INVENTARIO_KEY = "inventario_productos";
const SALES_KEY = "registro_ventas";

function Ventas({ verRecibo }) {
  const [productos, setProductos] = useState([]);
  const [cantidad, setCantidad] = useState({});
  const [seleccionados, setSeleccionados] = useState([]);
  const [tipoPago, setTipoPago] = useState("");

  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: ""
  });

  // Nvo: Estado para el descuento general de la venta
  const [descuento, setDescuento] = useState(0);

  const [comprobante, setComprobante] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const data = localStorage.getItem(INVENTARIO_KEY);
    setProductos(data ? JSON.parse(data) : []);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setComprobante(reader.result);
    reader.readAsDataURL(file);
  };

  // FIFO COSTO PROMEDIO SOLO VISUAL
  const calcularCostoFIFO = (producto) => {
    if (!producto.lotes?.length) return Number(producto.costoBase || 0);

    let total = 0;
    let unidades = 0;

    producto.lotes.forEach((l) => {
      const costo = Number(l.costoBase || 0) + Number(l.envioUnitario || 0);
      total += costo * l.cantidad;
      unidades += l.cantidad;
    });

    return unidades > 0 ? total / unidades : Number(producto.costoBase || 0);
  };

  // SELECCIÓN
  const seleccionarProducto = (producto, checked) => {
    const cant = Number(cantidad[producto.id]);

    if (!checked) {
      setSeleccionados((p) => p.filter((x) => x.id !== producto.id));
      return;
    }

    if (!cant || cant <= 0) return alert("Cantidad inválida");
    if (cant > producto.stock) return alert("Stock insuficiente");

    const snapshot = {
      id: producto.id,
      nombre: producto.nombre,
      cantidad: cant,
      precio: Number(producto.precio) || 0
    };

    setSeleccionados((prev) => {
      const existe = prev.find((x) => x.id === producto.id);

      if (existe) {
        return prev.map((x) =>
          x.id === producto.id ? { ...x, cantidad: cant } : x
        );
      }

      return [...prev, snapshot];
    });
  };

  // VENTA FIFO REAL + COSTO CONSOLIDADO
  const venderTodo = () => {
    if (!tipoPago) return alert("Seleccione tipo de pago");
    if (!cliente.nombre) return alert("Ingrese cliente");
    if (!seleccionados.length) return alert("Seleccione productos");

    if (tipoPago === "transferencia" && !comprobante)
      return alert("Adjunte comprobante");

    let totalBruto = 0; // Subtotal sin el descuento aplicado
    const productosVenta = [];

    const inventarioActualizado = productos.map((prod) => {
      const sel = seleccionados.find((s) => s.id === prod.id);
      if (!sel) return prod;

      let cantidadPendiente = Number(sel.cantidad);
      let lotes = [...(prod.lotes || [])];

      const lotesConsumidos = [];
      let costoTotal = 0;

      while (cantidadPendiente > 0 && lotes.length) {
        const lote = lotes[0];
        const usar = Math.min(cantidadPendiente, lote.cantidad);
        const costoUnitario = Number(lote.costoBase || 0) + Number(lote.envioUnitario || 0);

        costoTotal += usar * costoUnitario;

        lotesConsumidos.push({
          recepcionId: lote.recepcionId || null,
          fecha: lote.fecha,
          cantidad: usar,
          costoBase: Number(lote.costoBase || 0),
          envioUnitario: Number(lote.envioUnitario || 0),
          costoUnitario: Number(lote.costoBase || 0) + Number(lote.envioUnitario || 0)
        });

        lote.cantidad -= usar;
        cantidadPendiente -= usar;

        if (lote.cantidad <= 0) lotes.shift();
      }

      const costoUnitarioReal = costoTotal / Number(sel.cantidad);
      totalBruto += sel.precio * sel.cantidad;

      productosVenta.push({
        id: prod.id,
        nombre: prod.nombre,
        cantidad: sel.cantidad,
        precio: sel.precio,
        costoReal: costoUnitarioReal,
        subtotal: sel.precio * sel.cantidad,
        lotesConsumidos
      });

      return {
        ...prod,
        stock: prod.stock - sel.cantidad,
        vendido: (prod.vendido || 0) + sel.cantidad,
        lotes
      };
    });

    // Validar que el descuento no sea mayor al total bruto de la venta
    const rebaja = Number(descuento) || 0;
    if (rebaja > totalBruto) {
      return alert("El descuento no puede ser mayor que el total de la venta.");
    }

    const totalNeto = totalBruto - rebaja;

    localStorage.setItem(INVENTARIO_KEY, JSON.stringify(inventarioActualizado));

    const ventasPrevias = JSON.parse(localStorage.getItem(SALES_KEY)) || [];

    const nuevaVenta = {
      id: Date.now(),
      cliente,
      productos: productosVenta,
      descuento: rebaja, // Se guarda para que el componente principal reste esto de los ingresos/ganancias
      total: Number(totalNeto.toFixed(2)), 
      fecha: new Date().toISOString(),
      tipoPago,
      comprobante: tipoPago === "transferencia" ? comprobante : null
    };

    localStorage.setItem(SALES_KEY, JSON.stringify([...ventasPrevias, nuevaVenta]));

    alert("✅ Venta realizada correctamente");

    // Limpieza de estados
    setSeleccionados([]);
    setCantidad({});
    setCliente({ nombre: "", telefono: "" });
    setDescuento(0); 
    setTipoPago("");
    setComprobante(null);
    setProductos(inventarioActualizado);

    if (verRecibo) verRecibo(nuevaVenta);
  };

  const botonDeshabilitado =
    !cliente.nombre ||
    !tipoPago ||
    !seleccionados.length ||
    (tipoPago === "transferencia" && !comprobante);

  // Filtrado lógico de productos en tiempo real
  const productosFiltrados = productos.filter((p) => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return true;

    const cumpleNombre = p.nombre.toLowerCase().includes(termino);
    const cumpleAgotado = termino === "agotado" && p.stock <= 0;

    return cumpleNombre || cumpleAgotado;
  });

  return (
    <div className="ventas-bg">
      <div className="ventas-container">
        
        <div className="ventas-header">
          <h2>Despacho de Ventas FIFO</h2>
          <span className="ventas-badge-status">Salidas de Almacén</span>
        </div>

        {/* PANEL DEL CLIENTE Y CONFIGURACIÓN DE PAGO */}
        <div className="ventas-card cliente-box">
          <div className="cliente-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
            <div className="input-group">
              <label>Información del Cliente</label>
              <input
                className="ventas-input"
                placeholder="Nombre completo"
                value={cliente.nombre}
                onChange={(e) =>
                  setCliente({ ...cliente, nombre: e.target.value })
                }
              />
            </div>

            <div className="input-group">
              <label>Contacto</label>
              <input
                className="ventas-input"
                placeholder="Número telefónico"
                value={cliente.telefono}
                onChange={(e) =>
                  setCliente({ ...cliente, telefono: e.target.value })
                }
              />
            </div>

            <div className="input-group">
              <label>Método de Pago</label>
              <select
                className="ventas-select"
                value={tipoPago}
                onChange={(e) => {
                  setTipoPago(e.target.value);
                  setComprobante(null);
                }}
              >
                <option value="">Seleccione opción...</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia Bancaria</option>
              </select>
            </div>

            {/* Nvo campo: Descuento */}
            <div className="input-group">
              <label>Descuento Especial (L.)</label>
              <input
                type="number"
                className="ventas-input"
                placeholder="0.00"
                min="0"
                value={descuento || ""}
                onChange={(e) => setDescuento(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          {/* ÁREA COMPLEMENTARIA PARA TRANSFERENCIAS */}
          {tipoPago === "transferencia" && (
            <div className="comprobante-wrapper">
              <label className="comprobante-label" htmlFor="file-upload">
                {comprobante ? "✅ Comprobante cargado exitosamente" : "📤 Adjuntar captura o comprobante (Obligatorio)"}
              </label>
              <input 
                id="file-upload" 
                type="file" 
                accept="image/*"
                className="ventas-file-input" 
                onChange={handleFileChange} 
              />
            </div>
          )}

          <div className="cliente-action-row">
            <button
              className={`btn-vender ${botonDeshabilitado ? "deshabilitado" : "activo"}`}
              disabled={botonDeshabilitado}
              onClick={venderTodo}
              type="button"
            >
              ⚡ Procesar y Facturar Venta
            </button>
          </div>
        </div>

        {/* TABLA CATÁLOGO DE PRODUCTOS */}
        <div className="ventas-card">
          <div className="ventas-tabla-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>🛍️ Catálogo de Artículos Disponibles</h3>
            <div className="search-input-wrapper" style={{ flex: "1", maxWidth: "350px" }}>
              <input
                type="text"
                className="ventas-input-search"
                placeholder="🔍 Buscar artículo o escribir 'agotado'..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="ventas-table-wrapper">
            <table className="ventas-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio Público</th>
                  <th>Stock Mín.</th>
                  <th>Costo Prom. Lote</th>
                  <th>Cantidad a Vender</th>
                  <th className="txt-centro">Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="ventas-vacio-txt">
                      {productos.length === 0 
                        ? "No hay productos registrados en el inventario general."
                        : "No se encontraron productos que coincidan con la búsqueda."}
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => {
                    const estaSeleccionado = seleccionados.some((x) => x.id === p.id);
                    return (
                      <tr key={p.id} className={`ventas-fila ${estaSeleccionado ? "fila-seleccionada" : ""}`}>
                        <td className="font-enfasis">{p.nombre}</td>
                        <td className="color-precio">L. {Number(p.precio).toFixed(2)}</td>
                        <td>
                          <span className={`badge-stock ${p.stock === 0 ? "agotado" : ""}`}>
                            {p.stock} u.
                          </span>
                        </td>
                        <td className="color-subutil">L. {calcularCostoFIFO(p).toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max={p.stock}
                            disabled={p.stock <= 0}
                            className="ventas-input-table"
                            placeholder="0"
                            value={cantidad[p.id] || ""}
                            onChange={(e) =>
                              setCantidad({
                                ...cantidad,
                                [p.id]: e.target.value
                              })
                            }
                          />
                        </td>
                        <td className="txt-centro">
                          <label className="checkbox-custom-container">
                            <input
                              type="checkbox"
                              disabled={p.stock <= 0}
                              checked={estaSeleccionado}
                              onChange={(e) =>
                                seleccionarProducto(p, e.target.checked)
                              }
                            />
                            <span className="checkbox-checkmark"></span>
                          </label>
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

export default Ventas;
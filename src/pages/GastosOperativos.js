import { useEffect, useState } from "react";
import "./GastosOperativos.css";

const OPERATIVOS_KEY = "gastos_operativos";

function GastosOperativos() {
  const [gastos, setGastos] = useState([]);
  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const data = localStorage.getItem(OPERATIVOS_KEY);
    if (data) {
      setGastos(JSON.parse(data));
    }
  }, []);

  const guardarGasto = (e) => {
    e.preventDefault();

    if (!concepto || !monto) return;

    const nuevoGasto = {
      id: Date.now(),
      concepto,
      descripcion,
      monto: Number(monto),
      fecha: new Date().toISOString()
    };

    const nuevosGastos = [...gastos, nuevoGasto];
    setGastos(nuevosGastos);
    localStorage.setItem(OPERATIVOS_KEY, JSON.stringify(nuevosGastos));

    setConcepto("");
    setDescripcion("");
    setMonto("");

    alert("✅ Gasto operativo registrado");
  };

  const eliminarGasto = (id) => {
    if (!window.confirm("¿Está seguro de eliminar este registro de gasto operativo?")) return;

    const nuevos = gastos.filter(g => g.id !== id);
    setGastos(nuevos);
    localStorage.setItem(OPERATIVOS_KEY, JSON.stringify(nuevos));
  };

  const gastosFiltrados = gastos.filter((g) => {
    const termino = busqueda.toLowerCase();
    const cumpleConcepto = g.concepto.toLowerCase().includes(termino);
    const cumpleDescripcion = g.descripcion ? g.descripcion.toLowerCase().includes(termino) : false;
    
    return cumpleConcepto || cumpleDescripcion;
  });

  return (
    <div className="ops-bg">
      <div className="ops-container">
        
        <div className="ops-header">
          <h2>Gastos Operativos del Negocio</h2>
          <span className="ops-badge-total">Administración y Logística</span>
        </div>

        {/* FORMULARIO DE REGISTRO */}
        <div className="ops-card">
          <form className="ops-form" onSubmit={guardarGasto}>
            <div className="form-input-wrapper">
              <input
                type="text"
                className="ops-input"
                placeholder="Concepto (ej. Alquiler, Luz, Empaques)"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
              />
            </div>

            <div className="form-input-wrapper grid-ancho">
              <input
                type="text"
                className="ops-input"
                placeholder="Descripción detallada del gasto"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="form-input-wrapper">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="ops-input"
                placeholder="Monto del gasto (L.)"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-ops-submit">
              ➕ Registrar Gasto Operativo
            </button>
          </form>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="ops-card" style={{ marginBottom: "15px", padding: "15px" }}>
          <div className="form-input-wrapper" style={{ width: "100%" }}>
            <input
              type="text"
              className="ops-input"
              placeholder="🔍 Buscar por concepto o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* HISTORIAL / TABLA DE DATOS */}
        <div className="ops-card no-padding">
          <div className="ops-table-wrapper">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Fecha de Registro</th>
                  <th className="txt-centro">Acción</th>
                </tr>
              </thead>
              <tbody>
                {gastosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="ops-vacio-txt">
                      {gastos.length === 0 
                        ? "No se han registrado gastos operativos en este período."
                        : "No se encontraron resultados para esta búsqueda."}
                    </td>
                  </tr>
                ) : (
                  gastosFiltrados.map((g) => (
                    <tr key={g.id} className="ops-table-row">
                      <td className="font-resaltado-ops">{g.concepto}</td>
                      <td className="txt-descripcion-ops">{g.descripcion || "—"}</td>
                      <td className="color-monto-ops">L. {Number(g.monto).toFixed(2)}</td>
                      <td className="txt-fecha-ops">
                        {new Date(g.fecha).toLocaleString([], {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="txt-centro">
                        <button
                          type="button"
                          className="btn-ops-delete"
                          onClick={() => eliminarGasto(g.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GastosOperativos;
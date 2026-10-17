import { useEffect, useState } from "react";
import "./Publicidad.css";

const ADS_KEY = "gastos_publicidad";

function Publicidad() {
  const [gastos, setGastos] = useState([]);
  const [plataforma, setPlataforma] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  
  // 1. Estado para controlar el texto del buscador
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const data = localStorage.getItem(ADS_KEY);
    if (data) {
      setGastos(JSON.parse(data));
    }
  }, []);

  const guardarGasto = (e) => {
    e.preventDefault();

    if (!plataforma || !monto) return;

    const nuevoGasto = {
      id: Date.now(),
      plataforma,
      descripcion,
      monto: Number(monto),
      fecha: new Date().toISOString()
    };

    const nuevosGastos = [...gastos, nuevoGasto];
    setGastos(nuevosGastos);
    localStorage.setItem(ADS_KEY, JSON.stringify(nuevosGastos));

    setPlataforma("");
    setDescripcion("");
    setMonto("");

    alert("✅ Gasto publicitario registrado");
  };

  const eliminarGasto = (id) => {
    if (!window.confirm("¿Está seguro de eliminar este registro de gasto?")) return;

    const nuevos = gastos.filter(g => g.id !== id);
    setGastos(nuevos);
    localStorage.setItem(ADS_KEY, JSON.stringify(nuevos));
  };

  // 2. Lógica de filtrado en tiempo real (busca por plataforma o descripción)
  const gastosFiltrados = gastos.filter((g) => {
    const termino = busqueda.toLowerCase();
    const cumplePlataforma = g.plataforma.toLowerCase().includes(termino);
    const cumpleDescripcion = g.descripcion ? g.descripcion.toLowerCase().includes(termino) : false;
    
    return cumplePlataforma || cumpleDescripcion;
  });

  return (
    <div className="ads-bg">
      <div className="ads-container">
        
        <div className="ads-header">
          <h2>Costos de Adquisición y Publicidad</h2>
          <span className="ads-badge-total">Historial Operativo</span>
        </div>

        {/* FORMULARIO DE REGISTRO */}
        <div className="ads-card">
          <form className="ads-form" onSubmit={guardarGasto}>
            <div className="form-input-wrapper">
              <input
                type="text"
                className="ads-input"
                placeholder="Plataforma (ej. Facebook Ads)"
                value={plataforma}
                onChange={(e) => setPlataforma(e.target.value)}
                required
              />
            </div>

            <div className="form-input-wrapper grid-ancho">
              <input
                type="text"
                className="ads-input"
                placeholder="Descripción de la campaña o campaña ID"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="form-input-wrapper">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="ads-input"
                placeholder="Monto invertido (L.)"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-ads-submit">
              ➕ Registrar Inversión
            </button>
          </form>
        </div>

        {/* 3. BARRA DE BÚSQUEDA */}
        <div className="ads-card" style={{ marginBottom: "15px", padding: "15px" }}>
          <div className="form-input-wrapper" style={{ width: "100%" }}>
            <input
              type="text"
              className="ads-input"
              placeholder="🔍 Buscar por plataforma o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* HISTORIAL / TABLA DE DATOS */}
        <div className="ads-card no-padding">
          <div className="ads-table-wrapper">
            <table className="ads-table">
              <thead>
                <tr>
                  <th>Plataforma</th>
                  <th>Campaña / Descripción</th>
                  <th>Monto Invertido</th>
                  <th>Fecha de Registro</th>
                  <th className="txt-centro">Acción</th>
                </tr>
              </thead>
              <tbody>
                {/* 4. Cambiamos 'gastos' por 'gastosFiltrados' */}
                {gastosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="ads-vacio-txt">
                      {gastos.length === 0 
                        ? "No se han registrado inversiones publicitarias en este período."
                        : "No se encontraron resultados para esta búsqueda."}
                    </td>
                  </tr>
                ) : (
                  gastosFiltrados.map((g) => (
                    <tr key={g.id} className="ads-table-row">
                      <td className="font-resaltado-ads">{g.plataforma}</td>
                      <td className="txt-descripcion-ads">{g.descripcion || "—"}</td>
                      <td className="color-monto-ads">L. {Number(g.monto).toFixed(2)}</td>
                      <td className="txt-fecha-ads">
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
                          className="btn-ads-delete"
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

export default Publicidad;
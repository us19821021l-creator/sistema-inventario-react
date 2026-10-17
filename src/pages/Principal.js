import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import "./Principal.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const INVENTARIO_KEY = "inventario_productos";
const SALES_KEY = "registro_ventas";
const ENVIO_KEY = "costo_envio";
const ADS_KEY = "gastos_publicidad";
const OPERATIVOS_KEY = "gastos_operativos"; 

const chartOptionsBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#94a3b8",
        font: { family: "system-ui", size: 12 }
      }
    },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      borderColor: "#334155",
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: { color: "rgba(51, 65, 85, 0.2)" },
      ticks: { color: "#64748b", font: { size: 11 } }
    },
    y: {
      grid: { color: "rgba(51, 65, 85, 0.2)" },
      ticks: { color: "#64748b", font: { size: 11 } }
    }
  }
};

function Principal() {
  const [inventario, setInventario] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [gastosPublicidad, setGastosPublicidad] = useState([]);
  const [gastosOperativos, setGastosOperativos] = useState([]); 

  const hoy = new Date();

  const normalizarFecha = (fecha) => {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const esHoy = (f) =>
    normalizarFecha(f).getTime() === normalizarFecha(hoy).getTime();

  const obtenerInicioSemana = () => {
    const d = new Date(hoy);
    const diaActual = d.getDay();
    const diffLunes = diaActual === 0 ? -6 : 1 - diaActual;
    d.setDate(d.getDate() + diffLunes);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const inicioSemana = obtenerInicioSemana();

  const esSemanaActual = (f) => {
    const fecha = normalizarFecha(f);
    const diff = Math.floor((fecha.getTime() - inicioSemana.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < 7;
  };

  const mesActual = (f) => {
    const d = new Date(f);
    return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
  };

  useEffect(() => {
    const cargarDatos = () => {
      const inv = localStorage.getItem(INVENTARIO_KEY);
      const sales = localStorage.getItem(SALES_KEY);
      const ads = localStorage.getItem(ADS_KEY);
      const ops = localStorage.getItem(OPERATIVOS_KEY); 
      const envio = Number(localStorage.getItem(ENVIO_KEY)) || 0;

      setCostoEnvio(envio);
      setInventario(inv ? JSON.parse(inv) : []);
      setVentas(sales ? JSON.parse(sales) : []);
      setGastosPublicidad(ads ? JSON.parse(ads) : []);
      setGastosOperativos(ops ? JSON.parse(ops) : []); 
    };

    cargarDatos();
    window.addEventListener("storage", cargarDatos);
    const interval = setInterval(cargarDatos, 1000);

    return () => {
      window.removeEventListener("storage", cargarDatos);
      clearInterval(interval);
    };
  }, []);

  const calcularGananciaVenta = (venta) => {
    if (!venta.productos) return 0;
    const gananciaBruta = venta.productos.reduce((acc, p) => {
      return acc + (p.precio - (p.costoReal || 0)) * p.cantidad;
    }, 0);
    return gananciaBruta - (Number(venta.descuento) || 0);
  };

  const ventasHoy = ventas.reduce((acc, v) => (esHoy(v.fecha) ? acc + v.total : acc), 0);
  const ventasSemana = ventas.reduce((acc, v) => (esSemanaActual(v.fecha) ? acc + v.total : acc), 0);
  const ventasMes = ventas.reduce((acc, v) => (mesActual(v.fecha) ? acc + v.total : acc), 0);

  const publicidadHoy = gastosPublicidad.reduce((acc, g) => (esHoy(g.fecha) ? acc + Number(g.monto) : acc), 0);
  const publicidadSemana = gastosPublicidad.reduce((acc, g) => (esSemanaActual(g.fecha) ? acc + Number(g.monto) : acc), 0);
  const publicidadMes = gastosPublicidad.reduce((acc, g) => (mesActual(g.fecha) ? acc + Number(g.monto) : acc), 0);

  const operativosHoy = gastosOperativos.reduce((acc, g) => (esHoy(g.fecha) ? acc + Number(g.monto) : acc), 0);
  const operativosSemana = gastosOperativos.reduce((acc, g) => (esSemanaActual(g.fecha) ? acc + Number(g.monto) : acc), 0);
  const operativosMes = gastosOperativos.reduce((acc, g) => (mesActual(g.fecha) ? acc + Number(g.monto) : acc), 0);

  const gananciasHoy = ventas.reduce((acc, v) => (esHoy(v.fecha) ? acc + calcularGananciaVenta(v) : acc), 0) - publicidadHoy - operativosHoy;
  const gananciasSemana = ventas.reduce((acc, v) => (esSemanaActual(v.fecha) ? acc + calcularGananciaVenta(v) : acc), 0) - publicidadSemana - operativosSemana;
  const gananciasMes = ventas.reduce((acc, v) => (mesActual(v.fecha) ? acc + calcularGananciaVenta(v) : acc), 0) - publicidadMes - operativosMes;

  const productosBajosStock = inventario.filter((p) => p.stock <= 3).length;
  const totalProductos = inventario.length;

  const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const ventasPorDia = new Array(7).fill(0);
  const gananciasPorDia = new Array(7).fill(0);

  ventas.forEach((v) => {
    const fecha = normalizarFecha(v.fecha);
    const diff = Math.floor((fecha - inicioSemana) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      ventasPorDia[diff] += v.total;
      gananciasPorDia[diff] += calcularGananciaVenta(v);
    }
  });

  gastosPublicidad.forEach((g) => {
    const fecha = normalizarFecha(g.fecha);
    const diff = Math.floor((fecha - inicioSemana) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      gananciasPorDia[diff] -= Number(g.monto);
    }
  });

  gastosOperativos.forEach((g) => {
    const fecha = normalizarFecha(g.fecha);
    const diff = Math.floor((fecha - inicioSemana) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      gananciasPorDia[diff] -= Number(g.monto);
    }
  });

  const ventasSemanaData = {
    labels: nombresDias,
    datasets: [
      {
        label: "Ventas (L.)",
        data: ventasPorDia,
        backgroundColor: "#10b981",
        borderRadius: 4
      },
    ],
  };

  const gananciasSemanaData = {
    labels: nombresDias,
    datasets: [
      {
        label: "Ganancias Netas (L.)",
        data: gananciasPorDia,
        backgroundColor: "#38bdf8",
        borderRadius: 4
      },
    ],
  };

  const semanasMes = [0, 0, 0, 0];
  const gananciasPorSemana = [0, 0, 0, 0];

  ventas.forEach((v) => {
    if (mesActual(v.fecha)) {
      const dia = new Date(v.fecha).getDate();
      const semana = Math.min(Math.floor((dia - 1) / 7), 3);
      semanasMes[semana] += v.total;
      gananciasPorSemana[semana] += calcularGananciaVenta(v);
    }
  });

  gastosPublicidad.forEach((g) => {
    if (mesActual(g.fecha)) {
      const dia = new Date(g.fecha).getDate();
      const semana = Math.min(Math.floor((dia - 1) / 7), 3);
      gananciasPorSemana[semana] -= Number(g.monto);
    }
  });

  gastosOperativos.forEach((g) => {
    if (mesActual(g.fecha)) {
      const dia = new Date(g.fecha).getDate();
      const semana = Math.min(Math.floor((dia - 1) / 7), 3);
      gananciasPorSemana[semana] -= Number(g.monto);
    }
  });

  const ventasMesData = {
    labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
    datasets: [
      {
        label: "Flujo Ventas",
        data: semanasMes,
        borderColor: "#a855f7",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const gananciasData = {
    labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
    datasets: [
      {
        label: "Rendimiento Neto",
        data: gananciasPorSemana,
        borderColor: "#facc15",
        backgroundColor: "rgba(250, 204, 21, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        
        <div className="dashboard-header">
          <h2>Panel de Control e Inteligencia de Negocios</h2>
          <span className="dashboard-tag-live">Datos en Tiempo Real</span>
        </div>

        {/* CONTENEDOR GENERAL DE KPIs METRICAS */}
        <div className="kpi-grid">
          
          {/* Bloque Ventas */}
          <div className="kpi-card">
            <span className="kpi-label">Ventas Hoy</span>
            <h3 className="kpi-monto">L. {ventasHoy.toFixed(2)}</h3>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Ventas Semanales</span>
            <h3 className="kpi-monto">L. {ventasSemana.toFixed(2)}</h3>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Ventas del Mes</span>
            <h3 className="kpi-monto">L. {ventasMes.toFixed(2)}</h3>
          </div>

          {/* Bloque Marketing / Publicidad */}
          <div className="kpi-card">
            <span className="kpi-label font-pfc">Inversión Ads Hoy</span>
            <h3 className="kpi-monto">L. {publicidadHoy.toFixed(2)}</h3>
          </div>
          <div className="kpi-card">
            <span className="kpi-label font-pfc">Inversión Ads Sem.</span>
            <h3 className="kpi-monto">L. {publicidadSemana.toFixed(2)}</h3>
          </div>
          <div className="kpi-card">
            <span className="kpi-label font-pfc">Inversión Ads Mes</span>
            <h3 className="kpi-monto">L. {publicidadMes.toFixed(2)}</h3>
          </div>

          {/* Bloque Gastos Operativos */}
          <div className="kpi-card" style={{ borderColor: "rgba(248, 113, 113, 0.4)" }}>
            <span className="kpi-label" style={{ color: "#f87171" }}>Gasto Operativo Hoy</span>
            <h3 className="kpi-monto" style={{ color: "#f87171" }}>L. {operativosHoy.toFixed(2)}</h3>
          </div>
          <div className="kpi-card" style={{ borderColor: "rgba(248, 113, 113, 0.4)" }}>
            <span className="kpi-label" style={{ color: "#f87171" }}>Gasto Operativo Sem.</span>
            <h3 className="kpi-monto" style={{ color: "#f87171" }}>L. {operativosSemana.toFixed(2)}</h3>
          </div>
          <div className="kpi-card" style={{ borderColor: "rgba(248, 113, 113, 0.4)" }}>
            <span className="kpi-label" style={{ color: "#f87171" }}>Gasto Operativo Mes</span>
            <h3 className="kpi-monto" style={{ color: "#f87171" }}>L. {operativosMes.toFixed(2)}</h3>
          </div>

          {/* Bloque Utilidades Netas */}
          <div className="kpi-card success">
            <span className="kpi-label-alt">Ganancia Neta Hoy</span>
            <h3 className="kpi-monto text-esmeralda">L. {gananciasHoy.toFixed(2)}</h3>
          </div>
          <div className="kpi-card success">
            <span className="kpi-label-alt">Ganancia Neta Sem.</span>
            <h3 className="kpi-monto text-esmeralda">L. {gananciasSemana.toFixed(2)}</h3>
          </div>
          <div className="kpi-card success">
            <span className="kpi-label-alt">Ganancia Neta Mes</span>
            <h3 className="kpi-monto text-esmeralda">L. {gananciasMes.toFixed(2)}</h3>
          </div>

          {/* Estado del Inventario */}
          <div className="kpi-card warning">
            <span className="kpi-label-warning">Alerta de Stock Crítico</span>
            <h3 className="kpi-monto text-coral">{productosBajosStock} <small className="kpi-unidad-txt">prods</small></h3>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Catálogo Registrado</span>
            <h3 className="kpi-monto text-slate">{totalProductos} <small className="kpi-unidad-txt">ítems</small></h3>
          </div>

          {/* Bloque de Liquidación a Propietarios */}
          <div className="kpi-card destacado-socio">
            <span className="kpi-label-socio">A Liquidar Propietarios Hoy (90%)</span>
            <h3 className="kpi-monto-socio">L. {(Math.max(0, gananciasHoy) * 0.9).toFixed(2)}</h3>
            <span className="kpi-retenido-nota">
              Reserva (10%): L. {(Math.max(0, gananciasHoy) * 0.1).toFixed(2)}
            </span>
          </div>

          <div className="kpi-card destacado-socio">
            <span className="kpi-label-socio">A Liquidar Propietarios Sem. (90%)</span>
            <h3 className="kpi-monto-socio">L. {(Math.max(0, gananciasSemana) * 0.9).toFixed(2)}</h3>
            <span className="kpi-retenido-nota">
              Reserva (10%): L. {(Math.max(0, gananciasSemana) * 0.1).toFixed(2)}
            </span>
          </div>

          <div className="kpi-card destacado-socio">
            <span className="kpi-label-socio">A Liquidar Propietarios Mes (90%)</span>
            <h3 className="kpi-monto-socio">L. {(Math.max(0, gananciasMes) * 0.9).toFixed(2)}</h3>
            <span className="kpi-retenido-nota">
              Reserva (10%): L. {(Math.max(0, gananciasMes) * 0.1).toFixed(2)}
            </span>
          </div>

        </div>

        {/* REJILLA DE GRÁFICAS DE CHART.JS */}
        <div className="charts-grid">
          
          <div className="chart-card">
            <h4 className="chart-title">Desempeño Diario de Ventas (7 Días)</h4>
            <div className="chart-canvas-container">
              <Bar data={ventasSemanaData} options={chartOptionsBase} />
            </div>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Comportamiento Comercial del Mes</h4>
            <div className="chart-canvas-container">
              <Line data={ventasMesData} options={chartOptionsBase} />
            </div>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Evolución del Margen Neto Mensual</h4>
            <div className="chart-canvas-container">
              <Line data={gananciasData} options={chartOptionsBase} />
            </div>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Margen Neto Operativo Diario</h4>
            <div className="chart-canvas-container">
              <Bar data={gananciasSemanaData} options={chartOptionsBase} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Principal;
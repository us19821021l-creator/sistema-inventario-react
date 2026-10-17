import { useState } from 'react';
import Inventario from './Inventario';
import Ventas from './Ventas';
import Principal from './Principal';
import RegistroVentas from './RegristroVentas';
import ReporteFaltantes from './ReporteFaltantes';
import Publicidad from './Publicidad';
import HistorialRecepciones from './HistorialRecepciones';
import DashboardLotes from './DashboardLotes';
import './Dashboard.css';
import GastosOperativos from './GastosOperativos';

// 🔑 Constante estática movida fuera del componente para optimizar memoria
const BACKUP_KEYS = [
  "inventario_productos",
  "registro_ventas",
  "costo_envio",
  "inventario_last_update",
  "gastos_publicidad",
  "historial_recepciones",
  "gastos_operativos"
];

function Dashboard() {
  const [vista, setVista] = useState('principal');

  const exportarBackup = () => {
    const backup = {};

    BACKUP_KEYS.forEach((key) => {
      backup[key] = localStorage.getItem(key);
    });

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_sistema_${new Date().toISOString().slice(0,10)}.json`;

    a.click();
    URL.revokeObjectURL(url);
  };

 const importarBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);

        BACKUP_KEYS.forEach((key) => {
          if (backup[key] !== undefined) {
            localStorage.setItem(key, backup[key]);
          }
        });

        alert("🎯 Respaldo restaurado correctamente con éxito.");
        window.location.reload();
      } catch (error) { // <-- Capturamos el objeto error
        console.error("Detalle del error de importación:", error); // <-- Lo mostramos en F12
        alert(`❌ El archivo de copia de seguridad no es válido. Error: ${error.message}`);
      }
    };

    reader.readAsText(file);
  };

  const renderVista = () => {
    switch (vista) {
      case 'ventas':
        return <Ventas />;
      case 'publicidad':
        return <Publicidad />;
      case 'gastosoperativos':
        return <GastosOperativos />;
      case 'inventario':
        return <Inventario />;
      case 'registroventas':
        return <RegistroVentas />;
      case 'faltantes':
        return <ReporteFaltantes />;
      case 'historial':
        return <HistorialRecepciones />;
      case 'lotes':
        return <DashboardLotes />;
      default:
        return <Principal />;
    }
  };

  return (
    <div className="main-dashboard-bg">
      <div className="layout-grid-master">
        
        {/* PANEL DE NAVEGACIÓN LATERAL (SIDEBAR) */}
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <h3>Control Almacén</h3>
            <span className="brand-version">v2.1</span>
          </div>

          <nav className="sidebar-nav-group">
            <span className="nav-section-title">Análisis</span>
            <button 
              className={`nav-btn ${vista === 'principal' ? 'active' : ''}`}
              onClick={() => setVista('principal')}
            >
              📊 Tablero Principal
            </button>
            <button 
              className={`nav-btn ${vista === 'publicidad' ? 'active' : ''}`}
              onClick={() => setVista('publicidad')}
            >
              📢 Publicidad y Ads
            </button>

            <button 
              className={`nav-btn ${vista === 'gastosoperativos' ? 'active' : ''}`}
              onClick={() => setVista('gastosoperativos')}
            >
              🎰 Gastos Operativos
            </button>

            <div className="nav-divider" />

            <span className="nav-section-title">Operaciones</span>
            <button 
              className={`nav-btn ${vista === 'inventario' ? 'active' : ''}`}
              onClick={() => setVista('inventario')}
            >
              📦 Almacén / Inventario
            </button>
            <button 
              className={`nav-btn ${vista === 'ventas' ? 'active' : ''}`}
              onClick={() => setVista('ventas')}
            >
              ⚡ Registrar Venta
            </button>
            <button 
              className={`nav-btn ${vista === 'faltantes' ? 'active' : ''}`}
              onClick={() => setVista('faltantes')}
            >
              📝 Ordenar Pedido
            </button>

            <div className="nav-divider" />

            <span className="nav-section-title">Auditoría</span>
            <button 
              className={`nav-btn ${vista === 'registroventas' ? 'active' : ''}`}
              onClick={() => setVista('registroventas')}
            >
              📋 Historial Ventas
            </button>
            <button 
              className={`nav-btn ${vista === 'historial' ? 'active' : ''}`}
              onClick={() => setVista('historial')}
            >
              🕒 Recepciones Lotes
            </button>
            <button 
              className={`nav-btn ${vista === 'lotes' ? 'active' : ''}`}
              onClick={() => setVista('lotes')}
            >
              🔢 Lotes Activos FIFO
            </button>
          </nav>

          {/* ACCIONES DE COPIA DE SEGURIDAD */}
          <div className="sidebar-footer-actions">
            <button type="button" className="btn-backup export" onClick={exportarBackup}>
              💾 Descargar Respaldo
            </button>

            <label className="btn-backup import">
              📂 Cargar Respaldo
              <input
                type="file"
                accept=".json"
                hidden
                onChange={importarBackup}
              />
            </label>
          </div>
        </aside>

        {/* CONTENEDOR DE VISTAS DINÁMICAS */}
        <main className="layout-content-viewer">
          {renderVista()}
        </main>

      </div>
    </div>
  );
}

export default Dashboard;
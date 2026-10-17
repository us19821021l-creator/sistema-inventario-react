const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false, // Por seguridad con React
      contextIsolation: true
    }
  });

  // Si está empaquetado, la raíz suele ser la carpeta del asar.
  // Si estás en desarrollo, sube un nivel para buscar la carpeta build.
  const indexPath = app.isPackaged
    ? path.join(__dirname, '..', 'build', 'index.html') 
    : path.join(__dirname, '..', 'build', 'index.html');

  // Nota: Si al probar el paso 2 te sigue fallando el .exe, 
  // cambia la línea de arriba por: path.join(__dirname, 'build', 'index.html')
  // ya que electron-builder a veces aplana las carpetas en la raíz del .asar

  win.loadFile(indexPath);
}
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
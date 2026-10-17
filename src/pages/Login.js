import React, { useState } from "react";
import "./Login.css";

function Login({ onLoginSuccess, goToRegister }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const cuentas = JSON.parse(localStorage.getItem("cuentas")) || [];
    const existe = cuentas.find(
      (u) => u.usuario === usuario && u.password === password
    );

    if (existe) {
      onLoginSuccess();
      localStorage.setItem("usuarioActual", usuario.trim());
    } else {
      setError("Credenciales incorrectas o cuenta inexistente");
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>
        
        <div className="login-form-group">
          <input
            className="login-input"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Usuario"
            type="text"
          />
          
          <input
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            type="password"
          />
          
          {error && <p className="login-error-msg">⚠️ {error}</p>}
          
          <button onClick={handleLogin} className="login-submit-button">
            Ingresar al Sistema
          </button>
        </div>

        <p className="login-switch-register">
          ¿No tienes cuenta?{" "}
          <button className="login-link-button" onClick={goToRegister}>
            Registrarse gratis
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
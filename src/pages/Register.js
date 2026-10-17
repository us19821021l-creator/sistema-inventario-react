import React, { useState } from 'react';
import "./Register.css";

function Register({ goToLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [mensajeerror, setMensajeerror] = useState('');
  const [mensajeexito, setMensajeexito] = useState('');

  const handleRegister = () => {
    const nombreLimpio = usuario.trim();
    const passwordLimpio = password.trim();

    if (nombreLimpio === '' || passwordLimpio === '') {
      setMensajeerror("No se permiten campos vacíos o espacios en blanco");
      setTimeout(() => setMensajeerror(''), 2000); 
      return;
    }

    const cuentas = JSON.parse(localStorage.getItem("cuentas")) || [];
    if (cuentas.some(c => c.usuario === nombreLimpio)) {
      setMensajeerror("El usuario ya existe");
      setTimeout(() => setMensajeerror(''), 2000); 
      return;
    }

    cuentas.push({ usuario: nombreLimpio, password: passwordLimpio });
    localStorage.setItem("cuentas", JSON.stringify(cuentas));

    setMensajeexito("¡Registro exitoso!");

    setTimeout(() => {
      setMensajeexito('');
      goToLogin(); 
    }, 2000);

    localStorage.setItem("usuarioActual", nombreLimpio);
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        <h2>Crear Cuenta</h2>
        
        <div className="register-form-group">
          <input 
            placeholder="Ingresa un nombre de usuario" 
            onChange={(e) => setUsuario(e.target.value)}  
            className='register-input'
            type="text"
          />
          
          <input 
            placeholder="Crea una contraseña segura" 
            type="password" 
            onChange={(e) => setPassword(e.target.value)}  
            className='register-input'
          />
          
          {/* Bloque condicional de estados */}
          {mensajeerror && <p className='register-status-msg error'>⚠️ {mensajeerror}</p>}
          {mensajeexito && <p className='register-status-msg exito'>✅ {mensajeexito}</p>}
          
          <button className='register-submit-button' onClick={handleRegister}>
            Registrarme
          </button>
        </div>

        <p className="register-switch-login">
          ¿Ya tienes una cuenta?{" "}
          <button className="register-link-button" onClick={goToLogin}>
            Iniciar Sesión
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
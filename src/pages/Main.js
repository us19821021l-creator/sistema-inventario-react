import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Inventario from './Inventario';
import Ventas from './Ventas';
import Dashboard from './Dashboard';
import Principal from './Principal';

function Main({volver}) {
  const [vista, setvista] = useState('login');

const handleLoginSuccess = () => {
  setvista('dashboard');
};

  return (
    <>

  {vista === 'login' && <Login onLoginSuccess={handleLoginSuccess} goToRegister={() => setvista('register')} />}
  {vista === 'register' && <Register goToLogin={() => setvista('login')} />}
    {vista === 'principal' && <Principal volver={() => setvista('principal')} />}
  {vista === 'inventario' && <Inventario volver={() => setvista('principal')} />}
  {vista === 'ventas' && <Ventas volver={() => setvista('principal')} />}
    {vista === 'dashboard' && <Dashboard cambiarVista={setvista} />}
        
</>
  );
}

export default Main;
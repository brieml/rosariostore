// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddProduct from './components/products/addProduct';
import ViewProducts from './components/products/viewProduct';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Barra de navegación simple */}
        <nav className="bg-indigo-800 text-white p-4 shadow-md">
          <ul className="flex space-x-6 justify-center">
            <li>
              <Link to="/add-product" className="hover:underline">Agregar Producto</Link>
            </li>
            <li>
              <Link to="/view-products" className="hover:underline">Ver Productos</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<AddProduct />} /> {/* Ruta raíz también puede ser agregar */}
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/view-products" element={<ViewProducts />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AddProduct from "./components/products/addProduct";
import ViewProducts from "./components/products/viewProduct";
import Logo from "../src/assets/logo.png";
import UsersList from "./components/users/usersList";

function App() {
  return (
    <Router>
      <div className="App">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Barra de navegación simple */}
          <nav className="bg-indigo-800 text-white px-4 py-2 shadow-md">
            <ul className="flex space-x-6 items-center">
              <li>
                <img
                  src={Logo}
                  alt="Rosario Store Logo"
                  style={{ width: "2.5rem", height: "auto" }}
                />
              </li>
              <li>
                <Link to="/add-product" className="hover:underline">
                  Agregar Producto
                </Link>
              </li>
              <li>
                <Link to="/view-products" className="hover:underline">
                  Ver Productos
                </Link>
              </li>
              <li>
              <Link to="/users" className="hover:underline">Créditos</Link>
            </li>
            </ul>
          </nav>
        </div>
        <Routes>
          <Route path="/" element={<AddProduct />} />{" "}
          {/* Ruta raíz también puede ser agregar */}
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/view-products" element={<ViewProducts />} />
          <Route path="/users" element={<UsersList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

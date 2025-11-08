// src/components/AddProduct.tsx
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Product {
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  precioUnitario: number;
  iva: string;
  precioConIva: number;
  precioVenta: number;
  proveedor: string;
}

const AddProduct: React.FC = () => {
  const [newProduct, setNewProduct] = useState<Product>({
    codigo: '',
    descripcion: '',
    unidadMedida: '1',
    precioUnitario: 0,
    iva: '0%',
    precioConIva: 0,
    precioVenta: 0,
    proveedor: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === 'precioUnitario' || name === 'precioConIva' || name === 'precioVenta' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.descripcion.trim()) return;

    try {
      await addDoc(collection(db, "products"), newProduct);
      alert('Producto agregado con éxito');
      setNewProduct({
        codigo: '',
        descripcion: '',
        unidadMedida: '1',
        precioUnitario: 0,
        iva: '0%',
        precioConIva: 0,
        precioVenta: 0,
        proveedor: '',
      });
    } catch (error) {
      console.error("Error al agregar producto: ", error);
      alert('Error al agregar el producto');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">Rosario Store - Agregar Producto</h1>

        <form onSubmit={handleCreateProduct} className="space-y-5">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text"
              name="codigo"
              value={newProduct.codigo}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: 1"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción del Producto</label>
            <input
              type="text"
              name="descripcion"
              value={newProduct.descripcion}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: DET 3D *250 PC*24"
            />
          </div>

          {/* Unidad de Medida */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
            <input
              type="text"
              name="unidadMedida"
              value={newProduct.unidadMedida}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: 1"
            />
          </div>

          {/* Precio Unitario */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Unitario</label>
            <input
              type="number"
              name="precioUnitario"
              value={newProduct.precioUnitario || ''}
              onChange={handleChange}
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: 2003"
            />
          </div>

          {/* IVA */}
          <div>
            <label className="block text-sm font-medium text-gray-700">IVA</label>
            <select
              name="iva"
              value={newProduct.iva}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="0%">0%</option>
              <option value="5%">5%</option>
              <option value="19%">19%</option>
            </select>
          </div>

          {/* Precio con IVA */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio con IVA</label>
            <input
              type="number"
              name="precioConIva"
              value={newProduct.precioConIva || ''}
              onChange={handleChange}
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: 2383.57"
            />
          </div>

          {/* Precio de Venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio de Venta</label>
            <input
              type="number"
              name="precioVenta"
              value={newProduct.precioVenta || ''}
              onChange={handleChange}
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: 3000"
            />
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Proveedor</label>
            <input
              type="text"
              name="proveedor"
              value={newProduct.proveedor}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: NARE"
            />
          </div>

          {/* Botón */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
            >
              + Agregar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
// src/components/AddProduct.tsx
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import * as XLSX from 'xlsx'; // <--- Importamos xlsx

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

  const [isUploading, setIsUploading] = useState(false); // Estado para manejar la carga

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

  // --- NUEVA FUNCIÓN: Manejar la carga del archivo Excel ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true); // Activar estado de carga
    try {
      const data = await file.arrayBuffer(); // Leer el archivo como ArrayBuffer
      const workbook = XLSX.read(data, { type: 'array' }); // Parsear el archivo
      const firstSheetName = workbook.SheetNames[0]; // Obtener la primera hoja
      const worksheet = workbook.Sheets[firstSheetName]; // Obtener los datos de la hoja
      const jsonData = XLSX.utils.sheet_to_json(worksheet); // Convertir a JSON

      // Mapear los datos del Excel a la estructura de Product
      // Ajusta estos nombres de clave según como se llamen exactamente en tu Excel
      const productsToUpload: Product[] = jsonData.map((row: any) => ({
        codigo: String(row['CODIGO'] || row['codigo'] || row['Código'] || row['Id'] || ''),
        descripcion: String(row['DESCRIPCION DEL PRODUCTO'] || row['descripcion'] || row['Descripción'] || row['Nombre'] || ''),
        unidadMedida: String(row['UNIDAD DE MEDIDA'] || row['unidadMedida'] || row['Unidad'] || '1'),
        precioUnitario: parseFloat(row['PRECIO UNITARIO'] || row['precioUnitario'] || 0) || 0,
        iva: String(row['IVA'] || row['iva'] || '0%'),
        precioConIva: parseFloat(row['PRECIO UNITARIO + IVA'] || row['precioConIva'] || 0) || 0,
        precioVenta: parseFloat(row['PRECIO DE VENTA'] || row['precioVenta'] || 0) || 0,
        proveedor: String(row['PROVEEDOR'] || row['proveedor'] || row['Proveedor'] || ''),
      }));

      // Subir cada producto a Firestore
      let successCount = 0;
      let errorCount = 0;
      for (const product of productsToUpload) {
        try {
          await addDoc(collection(db, "products"), product);
          successCount++;
        } catch (uploadError) {
          console.error("Error al subir un producto:", product, uploadError);
          errorCount++;
        }
      }

      alert(`Carga completada: ${successCount} productos agregados, ${errorCount} errores.`);

    } catch (error) {
      console.error("Error al leer el archivo Excel o subir a Firebase: ", error);
      alert('Ocurrió un error al procesar el archivo Excel o al subir los datos.');
    } finally {
      setIsUploading(false); // Desactivar estado de carga
      e.target.value = ''; // Limpiar el input de archivo
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">Rosario Store - Agregar Producto</h1>

        {/* Nuevo: Botón para subir archivo Excel */}
        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cargar productos desde Excel</label>
          <input
            type="file"
            accept=".xlsx, .xls" // Aceptar solo archivos Excel
            onChange={handleFileUpload}
            disabled={isUploading} // Deshabilitar mientras se carga
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
          />
          {isUploading && <p className="text-xs text-indigo-600 mt-1">Cargando y subiendo productos...</p>}
        </div>

        <hr className="my-6" />

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
// src/components/ViewProducts.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Product {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  precioUnitario: number;
  iva: string;
  precioConIva: number;
  precioVenta: number;
  proveedor: string;
}

const ViewProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) });
        });
        setProducts(productsData);
      } catch (error) {
        console.error("Error al obtener productos: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-gray-500">No hay productos agregados aún.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">Productos</h1>

        <div className="space-y-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white shadow rounded-lg p-5 border border-gray-200 transition-transform duration-200 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{product.descripcion}</h2>
                <span className="text-sm text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
                  #{product.codigo}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Proveedor</dt>
                  <dd className="text-gray-800">{product.proveedor || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Unidad</dt>
                  <dd className="text-gray-800">{product.unidadMedida}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Precio Unitario</dt>
                  <dd className="text-gray-800">${product.precioUnitario?.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">IVA</dt>
                  <dd className="text-gray-800">{product.iva}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Precio + IVA</dt>
                  <dd className="text-gray-800">${product.precioConIva?.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Precio de Venta</dt>
                  <dd className="text-xl font-bold text-green-600">${product.precioVenta?.toFixed(0)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewProducts;
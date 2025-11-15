// src/components/ViewProducts.tsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";

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
  imagenUrl?: string;
}

const ViewProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          productsData.push({
            id: doc.id,
            ...(doc.data() as Omit<Product, "id">),
          });
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

  const filteredProducts = products.filter(
    (product) =>
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (id: string) => {
    setFlippedCardId(flippedCardId === id ? null : id);
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setTempProduct({ ...product });
    setFlippedCardId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTempProduct({});
  };

  const saveChanges = async (id: string) => {
    if (!tempProduct.descripcion || !tempProduct.codigo) return;

    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, {
        ...tempProduct,
        precioUnitario: parseFloat(tempProduct.precioUnitario as any) || 0,
        precioConIva: parseFloat(tempProduct.precioConIva as any) || 0,
        precioVenta: parseFloat(tempProduct.precioVenta as any) || 0,
      });

      setProducts(
        products.map((p) =>
          p.id === id ? ({ ...p, ...tempProduct } as Product) : p
        )
      );
      setEditingId(null);
      setTempProduct({});
    } catch (error) {
      console.error("Error al actualizar producto: ", error);
      alert("Error al guardar los cambios.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTempProduct((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Productos
        </h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, código o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500">
            No se encontraron productos.
          </p>
        ) : (
          <div className="space-y-5">
            {filteredProducts.map((product) => {
              const isEditing = editingId === product.id;
              const isFlipped = flippedCardId === product.id;

              return (
                <div
                  key={product.id}
                  onClick={() => !isEditing && handleCardClick(product.id)}
                  className={`relative ${isEditing ? "cursor-default" : "cursor-pointer h-64"}`}
                  style={!isEditing ? { perspective: "1000px" } : {}}
                >
                  {isEditing ? (
                    // Modo Edición - Sin flip
                    <div className="bg-white shadow rounded-lg p-5 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <input
                          type="text"
                          name="descripcion"
                          value={tempProduct.descripcion ?? product.descripcion}
                          onChange={handleInputChange}
                          className="text-lg font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded px-2 py-1 flex-1"
                        />
                        <input
                          type="text"
                          name="codigo"
                          value={tempProduct.codigo ?? product.codigo}
                          onChange={handleInputChange}
                          className="text-sm text-indigo-600 font-medium bg-indigo-50 border border-gray-300 rounded px-2 py-1 ml-2 w-24"
                        />
                      </div>

                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
                        <div>
                          <dt className="font-medium text-gray-500">
                            Proveedor
                          </dt>
                          <input
                            type="text"
                            name="proveedor"
                            value={tempProduct.proveedor ?? product.proveedor}
                            onChange={handleInputChange}
                            className="text-gray-800 bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                          />
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Unidad</dt>
                          <input
                            type="text"
                            name="unidadMedida"
                            value={tempProduct.unidadMedida ?? product.unidadMedida}
                            onChange={handleInputChange}
                            className="text-gray-800 bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                          />
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">
                            Precio Unitario
                          </dt>
                          <input
                            type="number"
                            name="precioUnitario"
                            value={tempProduct.precioUnitario ?? product.precioUnitario}
                            onChange={handleInputChange}
                            className="text-gray-800 bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                          />
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">IVA</dt>
                          <select
                            name="iva"
                            value={tempProduct.iva ?? product.iva}
                            onChange={handleInputChange}
                            className="text-gray-800 bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                          >
                            <option value="0%">0%</option>
                            <option value="5%">5%</option>
                            <option value="19%">19%</option>
                          </select>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">
                            Precio + IVA
                          </dt>
                          <input
                            type="number"
                            name="precioConIva"
                            value={tempProduct.precioConIva ?? product.precioConIva}
                            onChange={handleInputChange}
                            className="text-gray-800 bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                          />
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">
                            Precio de Venta
                          </dt>
                          <input
                            type="number"
                            name="precioVenta"
                            value={tempProduct.precioVenta ?? product.precioVenta}
                            onChange={handleInputChange}
                            className="text-xl font-bold text-green-600 bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                          />
                        </div>
                      </dl>

                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEditing();
                          }}
                          className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveChanges(product.id);
                          }}
                          className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo Normal - Con flip
                    <div
                      className="relative w-full h-full transition-transform duration-500"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      {/* Tarjeta Frontal */}
                      <div
                        className="absolute inset-0 bg-white shadow rounded-lg p-5 border border-gray-200 flex flex-col h-full"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h2 className="text-lg font-semibold text-gray-800">
                            {product.descripcion}
                          </h2>
                          <span className="text-sm text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded ml-2 whitespace-nowrap">
                            #{product.codigo}
                          </span>
                        </div>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm flex-grow overflow-y-auto">
                          <div>
                            <dt className="font-medium text-gray-500">
                              Proveedor
                            </dt>
                            <dd className="text-gray-800">
                              {product.proveedor || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Unidad</dt>
                            <dd className="text-gray-800">
                              {product.unidadMedida}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">
                              Precio Unitario
                            </dt>
                            <dd className="text-gray-800">
                              ${product.precioUnitario?.toFixed(2)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">IVA</dt>
                            <dd className="text-gray-800">{product.iva}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">
                              Precio + IVA
                            </dt>
                            <dd className="text-gray-800">
                              ${product.precioConIva?.toFixed(2)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">
                              Precio de Venta
                            </dt>
                            <dd className="text-2xl font-bold text-green-600">
                              ${product.precioVenta?.toFixed(0)}
                            </dd>
                          </div>
                        </dl>

                        <div className="flex justify-end mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(product);
                            }}
                            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                          >
                            Editar
                          </button>
                        </div>
                      </div>

                      {/* Tarjeta Trasera */}
                      <div
                        className="absolute inset-0 bg-white shadow rounded-lg p-5 border border-gray-200 flex items-center justify-center"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <div className="text-center">
                          {product.imagenUrl ? (
                            <img
                              src={product.imagenUrl}
                              alt={`Imagen de ${product.descripcion}`}
                              className="max-h-48 w-auto mx-auto object-contain rounded-md"
                            />
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-md w-32 h-32 mx-auto flex items-center justify-center text-gray-500">
                              Sin Imagen
                            </div>
                          )}
                          <p className="mt-2 text-gray-500 text-sm">
                            Imagen del Producto
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProducts;
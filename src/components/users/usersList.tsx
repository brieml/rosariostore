// src/components/Users/UsersList.tsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface User {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  creditLimit: number;
  currentDebt: number;
}

interface NewCredit {
  amount: number;
  description: string;
}

interface Credit {
  id: string;
  userId: string;
  amount: number;
  description: string;
  date: any; // Firestore Timestamp
  month: string;
  status: 'pending' | 'paid' | 'partially_paid';
  paidAmount: number;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<Omit<User, 'id' | 'currentDebt'>>({ name: '', email: '', phone: '', creditLimit: 0 });
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newCredit, setNewCredit] = useState<NewCredit>({ amount: 0, description: '' });
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<Credit[]>([]);
  const [viewCreditsModalOpen, setViewCreditsModalOpen] = useState(false);
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() } as User);
        });
        setUsers(usersData);
      } catch (error) {
        console.error("Error al obtener usuarios: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const fetchUserCredits = async (userId: string) => {
    try {
      const q = query(collection(db, "credits"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const creditsData: Credit[] = [];
      querySnapshot.forEach((doc) => {
        creditsData.push({ id: doc.id, ...doc.data() } as Credit);
      });
      setUserCredits(creditsData);
    } catch (error) {
      console.error("Error al obtener créditos del usuario: ", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || newUser.creditLimit <= 0) return;

    try {
        await addDoc(collection(db, "users"), {
            ...newUser,
            currentDebt: 0
        });
        setNewUser({ name: '', email: '', phone: '', creditLimit: 0 });
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() } as User);
        });
        setUsers(usersData);
    } catch (error) {
        console.error("Error al agregar usuario: ", error);
        alert('Error al agregar el usuario.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: name === 'creditLimit' ? parseFloat(value) || 0 : value }));
  };

  const handleOpenCreditModal = (userId: string) => {
    setSelectedUserId(userId);
    setNewCredit({ amount: 0, description: '' });
    setError(null);
    setCreditModalOpen(true);
  };

  const handleCloseCreditModal = () => {
    setCreditModalOpen(false);
    setSelectedUserId(null);
    setNewCredit({ amount: 0, description: '' });
    setError(null);
  };

  const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCredit(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleAssignCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || newCredit.amount <= 0) return;

    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
        alert('Usuario no encontrado.');
        return;
    }

    const totalDebtAfterCredit = user.currentDebt + newCredit.amount;

    if (totalDebtAfterCredit > user.creditLimit) {
        setError(`El crédito excede el límite. Límite: $${user.creditLimit.toFixed(2)}, Deuda actual: $${user.currentDebt.toFixed(2)}, Crédito a agregar: $${newCredit.amount.toFixed(2)}`);
        return;
    }

    try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        await addDoc(collection(db, "credits"), {
            userId: selectedUserId,
            amount: newCredit.amount,
            description: newCredit.description, // <-- Se guarda la descripción
            date: now,
            month: month,
            status: 'pending',
            paidAmount: 0
        });

        const userRef = doc(db, "users", selectedUserId);
        await updateDoc(userRef, {
            currentDebt: totalDebtAfterCredit
        });

        setUsers(users.map(u => u.id === selectedUserId ? { ...u, currentDebt: totalDebtAfterCredit } : u));
        alert('Crédito asignado con éxito.');
        handleCloseCreditModal();
    } catch (error) {
        console.error("Error al asignar crédito: ", error);
        setError('Error al asignar el crédito. Inténtalo de nuevo.');
    }
  };

  const handleOpenViewCreditsModal = async (userId: string) => {
    await fetchUserCredits(userId);
    setViewCreditsModalOpen(true);
  };

  const handleCloseViewCreditsModal = () => {
    setViewCreditsModalOpen(false);
    setUserCredits([]);
    setEditingCreditId(null);
    setEditingDescription('');
    setPaymentModalOpen(false);
    setPaymentAmount(0);
  };

  const handleStartEditDescription = (creditId: string, currentDescription: string) => {
    setEditingCreditId(creditId);
    setEditingDescription(currentDescription);
  };

  const handleSaveDescription = async () => {
    if (!editingCreditId) return;

    try {
      const creditRef = doc(db, "credits", editingCreditId);
      await updateDoc(creditRef, {
        description: editingDescription
      });

      // Actualizar localmente
      setUserCredits(userCredits.map(c => c.id === editingCreditId ? { ...c, description: editingDescription } : c));
      setEditingCreditId(null);
      setEditingDescription('');
      alert('Descripción actualizada.');
    } catch (error) {
      console.error("Error al actualizar descripción: ", error);
      alert('Error al actualizar la descripción.');
    }
  };

  const handleOpenPaymentModal = (creditId: string) => {
    setEditingCreditId(creditId);
    setPaymentAmount(0);
    setPaymentModalOpen(true);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(parseFloat(e.target.value) || 0);
  };

  const handleApplyPayment = async () => {
    if (!editingCreditId || paymentAmount <= 0) return;

    const credit = userCredits.find(c => c.id === editingCreditId);
    if (!credit) return;

    const newPaidAmount = credit.paidAmount + paymentAmount;
    let newStatus: 'pending' | 'paid' | 'partially_paid' = 'pending';
    if (newPaidAmount >= credit.amount) {
        newStatus = 'paid';
    } else if (newPaidAmount > 0) {
        newStatus = 'partially_paid';
    }

    try {
      const creditRef = doc(db, "credits", editingCreditId);
      await updateDoc(creditRef, {
        paidAmount: newPaidAmount,
        status: newStatus
      });

      // Recalcular la deuda actual del usuario
      const userRef = doc(db, "users", credit.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        // Suponiendo que solo este crédito cambió, restamos el pago anterior y sumamos el nuevo
        // En un sistema real, se debería recalcular desde cero o usar Cloud Functions
        const previousPaidAmount = credit.paidAmount;
        const difference = paymentAmount - previousPaidAmount;
        const newCurrentDebt = userData.currentDebt - difference;
        await updateDoc(userRef, { currentDebt: newCurrentDebt });

        // Actualizar localmente
        setUsers(users.map(u => u.id === credit.userId ? { ...u, currentDebt: newCurrentDebt } : u));
      }

      // Actualizar localmente la lista de créditos
      setUserCredits(userCredits.map(c => 
        c.id === editingCreditId ? { ...c, paidAmount: newPaidAmount, status: newStatus } : c
      ));

      alert('Pago aplicado.');
      setPaymentModalOpen(false);
      setEditingCreditId(null);
      setPaymentAmount(0);
    } catch (error) {
      console.error("Error al aplicar pago: ", error);
      alert('Error al aplicar el pago.');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Cargando usuarios...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">Gestión de Usuarios y Créditos</h1>

        {/* Formulario para agregar usuario */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Nuevo Cliente</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                name="phone"
                value={newUser.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Límite de Crédito *</label>
              <input
                type="number"
                name="creditLimit"
                value={newUser.creditLimit}
                onChange={handleInputChange}
                required
                min="0"
                step="any"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
            >
              Agregar Cliente
            </button>
          </form>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Clientes Registrados</h2>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center">No hay clientes registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límite de Crédito</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.creditLimit.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.currentDebt.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenViewCreditsModal(user.id!)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          Ver Créditos
                        </button>
                        <button
                          onClick={() => handleOpenCreditModal(user.id!)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Asignar Crédito
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Asignar Crédito */}
      {creditModalOpen && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Asignar Crédito</h3>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <form onSubmit={handleAssignCredit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Crédito *</label>
                <input
                  type="number"
                  name="amount"
                  value={newCredit.amount}
                  onChange={handleCreditChange}
                  required
                  min="0.01"
                  step="any"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Lista de Productos)</label>
                <textarea
                  name="description"
                  value={newCredit.description}
                  onChange={handleCreditChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseCreditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Asignar Crédito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Ver Créditos */}
      {viewCreditsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Créditos del Cliente</h3>
            {userCredits.length === 0 ? (
              <p className="text-gray-500 text-center">No hay créditos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userCredits.map((credit) => (
                      <tr key={credit.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {credit.date?.toDate ? credit.date.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${credit.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editingCreditId === credit.id ? (
                            <textarea
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              rows={3}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          ) : (
                            credit.description
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            credit.status === 'paid' ? 'bg-green-100 text-green-800' :
                            credit.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {credit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${credit.paidAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingCreditId === credit.id ? (
                            <button
                              onClick={handleSaveDescription}
                              className="text-green-600 hover:text-green-900 mr-2"
                            >
                              Guardar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEditDescription(credit.id, credit.description)}
                              className="text-blue-600 hover:text-blue-900 mr-2"
                            >
                              Editar
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenPaymentModal(credit.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Abonar/Pagar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCloseViewCreditsModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Abonar/Pagar Crédito */}
      {paymentModalOpen && editingCreditId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aplicar Pago</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Pagar *</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={handlePaymentChange}
                min="0.01"
                step="any"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Aplicar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
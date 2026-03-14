import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Plus,
  Trash2,
  Search,
  PlusCircle,
  MinusCircle,
  CreditCard,
  Wallet,
  UserPlus,
  CheckCircle,
  X,
} from 'lucide-react';

// FIREBASE BULUT BAĞLANTISI
const firebaseConfig = {
  apiKey: 'AIzaSyAqPHwW06rOK_kPDoyHQ-ZOqGWZtCJSLzU',
  authDomain: 'beyoglubuklet.firebaseapp.com',
  projectId: 'beyoglubuklet',
  storageBucket: 'beyoglubuklet.firebasestorage.app',
  messagingSenderId: '258370785541',
  appId: '1:258370785541:web:e517fab5f35ecfc8f5276c',
  measurementId: 'G-BXMTQYB4MZ',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');

  // Veritabanı State'leri
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Ürün Ekleme State'leri
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('Adet');
  const [netPrice, setNetPrice] = useState('');
  const [taxRate, setTaxRate] = useState('20');

  // Cari/Müşteri Ekleme State'leri
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Kasa / Sepet State'leri
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Veresiye Satış Modal State'i
  const [isVeresiyeModalOpen, setIsVeresiyeModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Buluttan Canlı Verileri Çekme (Ürünler ve Müşteriler)
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        setCustomers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );
    return () => {
      unsubProducts();
      unsubCustomers();
    };
  }, []);

  // --- ÜRÜN YÖNETİMİ ---
  const calculateGross = (net, tax) =>
    !net ? '0.00' : (parseFloat(net) * (1 + parseFloat(tax) / 100)).toFixed(2);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        name,
        barcode,
        unit,
        netPrice: parseFloat(netPrice),
        taxRate: parseInt(taxRate),
        grossPrice: parseFloat(calculateGross(netPrice, taxRate)),
      });
      setName('');
      setBarcode('');
      setNetPrice('');
      setShowAddForm(false);
    } catch (error) {
      alert('Hata oluştu.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Ürünü silmek istediğine emin misin?'))
      await deleteDoc(doc(db, 'products', id));
  };

  // --- MÜŞTERİ / CARİ YÖNETİMİ ---
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), {
        name: customerName,
        phone: customerPhone,
        balance: 0,
      });
      setCustomerName('');
      setCustomerPhone('');
      setShowCustomerForm(false);
    } catch (error) {
      alert('Hata oluştu.');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (
      window.confirm(
        'Bu müşteriyi silmek istediğine emin misin? Borç kayıtları da silinir!'
      )
    ) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  const handleReceivePayment = async (customer) => {
    const amount = window.prompt(
      `${customer.name} adlı müşteriden alınan nakit/havale tahsilat tutarını girin (₺):`
    );
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      const newBalance = customer.balance - parseFloat(amount);
      await updateDoc(doc(db, 'customers', customer.id), {
        balance: newBalance,
      });
      alert('Tahsilat başarıyla hesaptan düşüldü!');
    }
  };

  // --- KASA & SEPET ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing)
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchQuery('');
  };

  const updateCartQty = (id, amount) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + amount) } : item
      )
    );
  };

  const cartTotal = cart
    .reduce((total, item) => total + item.grossPrice * item.qty, 0)
    .toFixed(2);

  const handleCheckout = (method) => {
    if (cart.length === 0) return alert('Sepet boş!');

    if (method === 'Veresiye') {
      setIsVeresiyeModalOpen(true);
    } else {
      alert(`Nakit/Kart Satış Başarılı!\nToplam Tutar: ₺${cartTotal}`);
      setCart([]);
    }
  };

  // Veresiye Satışı Tamamlama
  const completeVeresiyeCheckout = async () => {
    if (!selectedCustomerId) return alert('Lütfen bir müşteri seçin!');

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const newBalance = (customer.balance || 0) + parseFloat(cartTotal);

    try {
      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        balance: newBalance,
      });
      alert(
        `${customer.name} hesabına ₺${cartTotal} borç yazıldı. Satış tamamlandı!`
      );
      setIsVeresiyeModalOpen(false);
      setSelectedCustomerId('');
      setCart([]);
    } catch (error) {
      alert('Borç kaydedilirken hata oluştu.');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery))
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* SOL MENÜ */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl text-zinc-950">
              M
            </div>
            <div>
              <h1 className="font-bold text-md">Merkez Şube</h1>
              <p className="text-xs text-zinc-400">Toptan POS Sistemi</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'pos'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <ShoppingCart size={20} /> Hızlı Satış (Kasa)
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'products'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Package size={20} /> Ürünler (Stok)
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'customers'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Users size={20} /> Cari Hesaplar
          </button>
        </nav>
      </aside>

      {/* ANA EKRAN */}
      <main className="flex-1 flex overflow-hidden bg-zinc-950 relative">
        {/* --- HIZLI SATIŞ KASA EKRANI --- */}
        {activeTab === 'pos' && (
          <div className="flex w-full h-full">
            <div className="flex-1 flex flex-col border-r border-zinc-800 p-6 overflow-hidden">
              <div className="mb-6 relative">
                <Search
                  className="absolute left-3 top-3 text-zinc-500"
                  size={20}
                />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Barkod okutun veya ürün adı yazın..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-lg transition-all"
                />
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-all hover:bg-zinc-800/50 group"
                    >
                      <h3 className="font-bold text-emerald-400 group-hover:text-emerald-300 line-clamp-2 h-12">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                          {product.unit}
                        </span>
                        <span className="font-bold text-lg text-white">
                          ₺{product.grossPrice}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sepet Alanı */}
            <div className="w-[400px] bg-zinc-900 flex flex-col">
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/30">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="text-emerald-500" /> Satış Fişi
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 flex-col gap-2">
                    <ShoppingCart size={48} className="opacity-20" />
                    <p>Sepet boş</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm text-zinc-200">
                          {item.name}
                        </span>
                        <button
                          onClick={() =>
                            setCart(cart.filter((i) => i.id !== item.id))
                          }
                          className="text-red-500/70 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-zinc-900 rounded-md p-1 border border-zinc-800">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="text-zinc-400 hover:text-emerald-500 p-1"
                          >
                            <MinusCircle size={18} />
                          </button>
                          <span className="w-8 text-center font-bold">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="text-zinc-400 hover:text-emerald-500 p-1"
                          >
                            <PlusCircle size={18} />
                          </button>
                        </div>
                        <span className="font-bold text-emerald-400">
                          ₺{(item.grossPrice * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 border-t border-zinc-800 bg-zinc-950">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-zinc-400 text-lg">Genel Toplam:</span>
                  <span className="text-3xl font-bold text-white">
                    ₺{cartTotal}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={() => handleCheckout('Nakit')}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium border border-zinc-700"
                  >
                    <span className="text-emerald-500 font-bold">₺</span> Nakit
                  </button>
                  <button
                    onClick={() => handleCheckout('Kart')}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium border border-zinc-700"
                  >
                    <CreditCard size={18} className="text-blue-400" /> Kart
                  </button>
                </div>
                <button
                  onClick={() => handleCheckout('Veresiye')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 p-4 rounded-lg flex items-center justify-center gap-2 font-bold text-lg transition-colors"
                >
                  <Users size={22} /> Veresiye (Açık Hesap)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CARİ HESAPLAR EKRANI --- */}
        {activeTab === 'customers' && (
          <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="text-emerald-500" /> Cari Hesaplar (Veresiye
                Müşterileri)
              </h2>
              <button
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                {showCustomerForm ? (
                  'Vazgeç'
                ) : (
                  <>
                    <UserPlus size={20} /> Yeni Cari Ekle
                  </>
                )}
              </button>
            </div>

            {/* Müşteri Ekleme Formu */}
            {showCustomerForm && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                <form
                  onSubmit={handleAddCustomer}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Firma / Müşteri Adı
                    </label>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                      placeholder="Örn: Ahmet Toptan Ticaret"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Telefon Numarası
                    </label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end mt-2">
                    <button
                      type="submit"
                      className="bg-emerald-500 text-zinc-950 font-bold py-2 px-8 rounded-lg"
                    >
                      Müşteriyi Kaydet
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Müşteri Listesi Tablosu */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 text-sm">
                    <th className="p-4 font-medium">Müşteri / Firma Adı</th>
                    <th className="p-4 font-medium">Telefon</th>
                    <th className="p-4 font-medium text-right">
                      Güncel Bakiye (Borç Durumu)
                    </th>
                    <th className="p-4 font-medium text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-zinc-500">
                        Henüz kayıtlı müşteri yok.
                      </td>
                    </tr>
                  )}
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                    >
                      <td className="p-4 font-bold text-white">
                        {customer.name}
                      </td>
                      <td className="p-4 text-zinc-400">
                        {customer.phone || '-'}
                      </td>

                      {/* GÜNCELLENEN BORÇ/ALACAK KISMI */}
                      <td
                        className={`p-4 text-right font-bold text-lg ${
                          customer.balance > 0
                            ? 'text-red-400'
                            : customer.balance < 0
                            ? 'text-emerald-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {customer.balance > 0
                          ? `₺${customer.balance.toFixed(2)}`
                          : customer.balance < 0
                          ? `₺${Math.abs(customer.balance).toFixed(
                              2
                            )} (Alacaklı)`
                          : 'Borcu Yok'}
                      </td>

                      <td className="p-4 flex justify-end gap-2">
                        <button
                          onClick={() => handleReceivePayment(customer)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-3 py-1.5 rounded flex items-center gap-1 text-sm border border-zinc-700"
                        >
                          <Wallet size={16} /> Tahsilat Al
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ÜRÜNLER EKRANI (Aynı Kaldı) --- */}
        {activeTab === 'products' && (
          <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Ürünler Listesi</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <Plus size={20} /> {showAddForm ? 'Vazgeç' : 'Yeni Ürün Ekle'}
              </button>
            </div>
            {showAddForm && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                <form
                  onSubmit={handleAddProduct}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Ürün Adı
                    </label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Barkod
                    </label>
                    <input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Net Alış/Satış (₺)
                    </label>
                    <input
                      required
                      value={netPrice}
                      onChange={(e) => setNetPrice(e.target.value)}
                      type="number"
                      step="0.01"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      KDV Oranı
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                    >
                      <option value="0">%0</option>
                      <option value="1">%1</option>
                      <option value="10">%10</option>
                      <option value="20">%20</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex justify-end mt-4">
                    <button
                      type="submit"
                      className="bg-emerald-500 text-zinc-950 font-bold py-2 px-8 rounded-lg"
                    >
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 text-sm">
                    <th className="p-4 font-medium">Ürün Adı</th>
                    <th className="p-4 font-medium">Barkod</th>
                    <th className="p-4 font-medium">Net Fiyat</th>
                    <th className="p-4 font-medium">Brüt Satış</th>
                    <th className="p-4 font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                    >
                      <td className="p-4 text-emerald-400">{p.name}</td>
                      <td className="p-4 text-zinc-400">{p.barcode}</td>
                      <td className="p-4">₺{p.netPrice}</td>
                      <td className="p-4 font-bold">₺{p.grossPrice}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VERESİYE ONAY PENCERESİ (MODAL) --- */}
        {isVeresiyeModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-[500px] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-500">
                  <Users size={24} /> Cari Hesaba Yaz
                </h3>
                <button
                  onClick={() => setIsVeresiyeModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-zinc-400 mb-4">
                  Toplam{' '}
                  <strong className="text-white text-xl">₺{cartTotal}</strong>{' '}
                  tutarındaki borcu hangi müşterinin hesabına yazmak
                  istiyorsunuz?
                </p>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-white outline-none mb-6 focus:border-emerald-500 text-lg"
                >
                  <option value="">-- Müşteri Seçin --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Bakiye: ₺{c.balance})
                    </option>
                  ))}
                </select>

                {customers.length === 0 && (
                  <p className="text-red-400 text-sm mb-4">
                    Önce "Cari Hesaplar" sekmesinden müşteri eklemelisiniz!
                  </p>
                )}

                <button
                  onClick={completeVeresiyeCheckout}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
                >
                  <CheckCircle size={24} /> Satışı Onayla ve Borç Yaz
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

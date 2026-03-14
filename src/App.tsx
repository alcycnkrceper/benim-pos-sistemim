import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Home, ShoppingCart, Package, Users, Plus, Trash2, Search, PlusCircle, MinusCircle, CreditCard, Wallet, UserPlus, CheckCircle, X, BarChart3, Printer, FileText, TrendingDown, TrendingUp } from 'lucide-react';

// FIREBASE BULUT BAĞLANTISI
const firebaseConfig = {
  apiKey: "AIzaSyAqPHwW06rOK_kPDoyHQ-ZOqGWZtCJSLzU",
  authDomain: "beyoglubuklet.firebaseapp.com",
  projectId: "beyoglubuklet",
  storageBucket: "beyoglubuklet.firebasestorage.app",
  messagingSenderId: "258370785541",
  appId: "1:258370785541:web:e517fab5f35ecfc8f5276c",
  measurementId: "G-BXMTQYB4MZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  
  // Veritabanı State'leri
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  // Ürün Ekleme State'leri
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('Adet');
  const [netPrice, setNetPrice] = useState('');
  const [taxRate, setTaxRate] = useState('20');

  // Müşteri & Gider State'leri
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Kasa State'leri
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVeresiyeModalOpen, setIsVeresiyeModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Fatura Yazdırma State'i
  const [lastSale, setLastSale] = useState(null);

  // Buluttan Canlı Verileri Çekme
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    
    return () => { unsubProducts(); unsubCustomers(); unsubSales(); unsubExpenses(); };
  }, []);

  // --- HESAPLAMALAR ---
  const calculateGross = (net, tax) => (!net ? "0.00" : (parseFloat(net) * (1 + parseFloat(tax) / 100)).toFixed(2));
  const cartTotal = cart.reduce((total, item) => total + (item.grossPrice * item.qty), 0).toFixed(2);
  
  const totalIncome = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // --- VERİTABANI İŞLEMLERİ ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'products'), { name, barcode, unit, netPrice: parseFloat(netPrice), taxRate: parseInt(taxRate), grossPrice: parseFloat(calculateGross(netPrice, taxRate)) });
    setName(''); setBarcode(''); setNetPrice(''); setShowAddForm(false);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'customers'), { name: customerName, phone: customerPhone, balance: 0 });
    setCustomerName(''); setCustomerPhone(''); setShowCustomerForm(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'expenses'), { name: expenseName, amount: parseFloat(expenseAmount), date: new Date().toISOString() });
    setExpenseName(''); setExpenseAmount('');
    alert("Gider kaydedildi!");
  };

  const handleReceivePayment = async (customer) => {
    const amount = window.prompt(`${customer.name} adlı müşteriden alınan tahsilat (₺):`);
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      await updateDoc(doc(db, 'customers', customer.id), { balance: customer.balance - parseFloat(amount) });
      // Tahsilatı da gelir olarak kaydet
      await addDoc(collection(db, 'sales'), { items: [{name: 'Cari Tahsilat', qty: 1, grossPrice: parseFloat(amount)}], total: parseFloat(amount), method: 'Tahsilat', customerName: customer.name, date: new Date().toISOString() });
      alert("Tahsilat başarıyla düştü ve gelirlere eklendi!");
    }
  };

  // --- KASA & SATIŞ İŞLEMLERİ ---
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchQuery(''); 
  };

  const updateCartQty = (id, amount) => setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + amount) } : item));

  const saveSaleToDB = async (method, customer = null) => {
    const saleData = {
      items: cart,
      total: parseFloat(cartTotal),
      method,
      customerName: customer ? customer.name : 'Perakende Müşteri',
      date: new Date().toLocaleString('tr-TR')
    };
    const docRef = await addDoc(collection(db, 'sales'), saleData);
    setLastSale({ id: docRef.id, ...saleData }); // Fatura için son satışı hafızaya al
    setCart([]);
  };

  const handleCheckout = (method) => {
    if(cart.length === 0) return alert("Sepet boş!");
    if (method === 'Veresiye') {
      setIsVeresiyeModalOpen(true); 
    } else {
      saveSaleToDB(method);
    }
  };

  const completeVeresiyeCheckout = async () => {
    if (!selectedCustomerId) return alert("Lütfen bir müşteri seçin!");
    const customer = customers.find(c => c.id === selectedCustomerId);
    await updateDoc(doc(db, 'customers', selectedCustomerId), { balance: (customer.balance || 0) + parseFloat(cartTotal) });
    saveSaleToDB('Veresiye', customer);
    setIsVeresiyeModalOpen(false);
    setSelectedCustomerId('');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery)));

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden print:hidden">
      
      {/* SOL MENÜ */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl text-zinc-950">M</div>
          <div><h1 className="font-bold text-md">Merkez Şube</h1><p className="text-xs text-zinc-400">Toptan POS</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('pos')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'pos' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-800 text-zinc-400'}`}><ShoppingCart size={20} /> Hızlı Satış</button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-800 text-zinc-400'}`}><Package size={20} /> Ürünler</button>
          <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-800 text-zinc-400'}`}><Users size={20} /> Cari Hesaplar</button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-800 text-zinc-400'}`}><BarChart3 size={20} /> Raporlar</button>
        </nav>
      </aside>

      {/* ANA EKRAN */}
      <main className="flex-1 flex overflow-hidden bg-zinc-950 relative">
        
        {/* --- KASA EKRANI --- */}
        {activeTab === 'pos' && (
          <div className="flex w-full h-full">
            <div className="flex-1 flex flex-col border-r border-zinc-800 p-6 overflow-hidden">
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
                <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Barkod okutun veya ürün adı yazın..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 outline-none text-lg" />
              </div>
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                  {filteredProducts.map(product => (
                    <button key={product.id} onClick={() => addToCart(product)} className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-all hover:bg-zinc-800/50 group h-32 flex flex-col justify-between">
                      <h3 className="font-bold text-emerald-400 group-hover:text-emerald-300 line-clamp-2">{product.name}</h3>
                      <div className="flex justify-between items-end w-full"><span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded">{product.unit}</span><span className="font-bold text-lg text-white">₺{product.grossPrice}</span></div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Sepet Alanı */}
            <div className="w-[400px] bg-zinc-900 flex flex-col">
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="text-emerald-500"/> Satış Fişi</h2>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-red-400 text-sm hover:text-red-300">Temizle</button>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 flex-col gap-2"><ShoppingCart size={48} className="opacity-20" /><p>Sepet boş</p></div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-start"><span className="font-medium text-sm text-zinc-200">{item.name}</span><button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-red-500/70 hover:text-red-500"><Trash2 size={16}/></button></div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-zinc-900 rounded-md p-1 border border-zinc-800">
                          <button onClick={() => updateCartQty(item.id, -1)} className="text-zinc-400 p-1"><MinusCircle size={18}/></button>
                          <span className="w-8 text-center font-bold">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="text-zinc-400 p-1"><PlusCircle size={18}/></button>
                        </div>
                        <span className="font-bold text-emerald-400">₺{(item.grossPrice * item.qty).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 border-t border-zinc-800 bg-zinc-950">
                <div className="flex justify-between items-center mb-6"><span className="text-zinc-400 text-lg">Toplam:</span><span className="text-3xl font-bold text-white">₺{cartTotal}</span></div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button onClick={() => handleCheckout('Nakit')} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700"><span className="text-emerald-500 font-bold">₺</span> Nakit</button>
                  <button onClick={() => handleCheckout('Kart')} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700"><CreditCard size={18} className="text-blue-400"/> Kart</button>
                </div>
                <button onClick={() => handleCheckout('Veresiye')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 p-4 rounded-lg flex items-center justify-center gap-2 font-bold text-lg"><Users size={22}/> Veresiye (Açık Hesap)</button>
              </div>
            </div>
          </div>
        )}

        {/* --- RAPORLAR VE GİDERLER EKRANI --- */}
        {activeTab === 'reports' && (
          <div className="p-8 w-full overflow-y-auto">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-8"><BarChart3 className="text-emerald-500"/> Mali Durum Özeti</h2>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-emerald-400 mb-2"><TrendingUp size={24}/> <span className="font-medium">Toplam Gelir (Satış/Tahsilat)</span></div>
                <div className="text-4xl font-bold text-white">₺{totalIncome.toFixed(2)}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-red-400 mb-2"><TrendingDown size={24}/> <span className="font-medium">Toplam Gider (Masraflar)</span></div>
                <div className="text-4xl font-bold text-white">₺{totalExpense.toFixed(2)}</div>
              </div>
              <div className={`border p-6 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className={`flex items-center gap-3 mb-2 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}><Wallet size={24}/> <span className="font-medium">Net Kar/Zarar Durumu</span></div>
                <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>₺{netProfit.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Gider Ekleme Formu */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2">Dükkan Masrafı / Gider Ekle</h3>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div><label className="block text-sm text-zinc-400 mb-1">Gider Açıklaması (Fatura, Çay, Kargo vb.)</label><input required value={expenseName} onChange={(e) => setExpenseName(e.target.value)} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none" /></div>
                  <div><label className="block text-sm text-zinc-400 mb-1">Tutar (₺)</label><input required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} type="number" step="0.01" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none" /></div>
                  <button type="submit" className="w-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-bold py-3 rounded-lg transition-colors">Gideri Kaydet</button>
                </form>
              </div>

              {/* Son Satışlar Listesi */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center justify-between">
                  Son Satış Geçmişi <span className="text-sm font-normal text-zinc-500">{sales.length} İşlem</span>
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {sales.slice().reverse().map((sale, i) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-bold text-emerald-400">₺{sale.total.toFixed(2)}</div>
                        <div className="text-xs text-zinc-500">{sale.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white">{sale.customerName}</div>
                        <div className="text-xs text-zinc-400">{sale.method}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DİĞER EKRANLAR (Ürünler ve Cari Hesaplar Eski Kodla Aynıdır, yer kaplamaması için sıkıştırıldı) */}
        {activeTab === 'customers' && (
          <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold flex items-center gap-2"><Users className="text-emerald-500"/> Cari Hesaplar</h2><button onClick={() => setShowCustomerForm(!showCustomerForm)} className="bg-emerald-500 text-zinc-950 font-bold py-2 px-4 rounded-lg flex items-center gap-2">{showCustomerForm ? 'Vazgeç' : <><UserPlus size={20} /> Yeni Cari Ekle</>}</button></div>
            {showCustomerForm && (<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8"><form onSubmit={handleAddCustomer} className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-zinc-400 mb-1">Firma Adı</label><input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none" /></div><div><label className="block text-sm text-zinc-400 mb-1">Telefon</label><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none" /></div><div className="col-span-2 flex justify-end mt-2"><button type="submit" className="bg-emerald-500 text-zinc-950 font-bold py-2 px-8 rounded-lg">Kaydet</button></div></form></div>)}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"><table className="w-full text-left border-collapse"><thead><tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 text-sm"><th className="p-4">Firma Adı</th><th className="p-4">Telefon</th><th className="p-4 text-right">Bakiye</th><th className="p-4 text-right">İşlemler</th></tr></thead><tbody>{customers.map(c => (<tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20"><td className="p-4 font-bold">{c.name}</td><td className="p-4 text-zinc-400">{c.phone || '-'}</td><td className={`p-4 text-right font-bold ${c.balance > 0 ? 'text-red-400' : c.balance < 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>{c.balance > 0 ? `₺${c.balance.toFixed(2)}` : c.balance < 0 ? `₺${Math.abs(c.balance).toFixed(2)} (Alacaklı)` : 'Borcu Yok'}</td><td className="p-4 flex justify-end gap-2"><button onClick={() => handleReceivePayment(c)} className="bg-zinc-800 text-emerald-400 px-3 py-1.5 rounded flex items-center gap-1 text-sm border border-zinc-700"><Wallet size={16}/> Tahsilat Al</button><button onClick={() => deleteDoc(doc(db, 'customers', c.id))} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
          </div>
        )}
        {activeTab === 'products' && (
           <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold">Ürünler Listesi</h2><button onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-500 text-zinc-950 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Plus size={20} /> Yeni Ürün Ekle</button></div>
            {showAddForm && (<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8"><form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-4"><div><label className="text-sm text-zinc-400 mb-1">Ürün Adı</label><input required value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none" /></div><div><label className="text-sm text-zinc-400 mb-1">Barkod</label><input value={barcode} onChange={(e) => setBarcode(e.target.value)} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none" /></div><div><label className="text-sm text-zinc-400 mb-1">Net Fiyat (₺)</label><input required value={netPrice} onChange={(e) => setNetPrice(e.target.value)} type="number" step="0.01" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none" /></div><div><label className="text-sm text-zinc-400 mb-1">KDV Oranı</label><select value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"><option value="0">%0</option><option value="1">%1</option><option value="10">%10</option><option value="20">%20</option></select></div><div className="col-span-2 flex justify-end mt-4"><button type="submit" className="bg-emerald-500 text-zinc-950 font-bold py-2 px-8 rounded-lg">Kaydet</button></div></form></div>)}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"><table className="w-full text-left border-collapse"><thead><tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 text-sm"><th className="p-4">Ürün Adı</th><th className="p-4">Birim</th><th className="p-4">Brüt Satış</th><th className="p-4">İşlem</th></tr></thead><tbody>{products.map(p => (<tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20"><td className="p-4 text-emerald-400 font-medium">{p.name}</td><td className="p-4"><span className="bg-zinc-800 px-2 py-1 rounded text-xs">{p.unit}</span></td><td className="p-4 font-bold">₺{p.grossPrice}</td><td className="p-4"><button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="text-red-400"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* --- MODALLAR --- */}
        {isVeresiyeModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-[500px] shadow-2xl overflow-hidden"><div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950"><h3 className="text-xl font-bold flex items-center gap-2 text-emerald-500"><Users size={24}/> Cari Hesaba Yaz</h3><button onClick={() => setIsVeresiyeModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button></div><div className="p-6"><p className="text-zinc-400 mb-4">Toplam <strong className="text-white text-xl">₺{cartTotal}</strong> tutarındaki borcu seçin:</p><select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-white outline-none mb-6 focus:border-emerald-500 text-lg"><option value="">-- Müşteri Seçin --</option>{customers.map(c => (<option key={c.id} value={c.id}>{c.name} (Bakiye: ₺{c.balance})</option>))}</select><button onClick={completeVeresiyeCheckout} className="w-full bg-emerald-500 text-zinc-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"><CheckCircle size={24}/> Satışı Onayla</button></div></div></div>
        )}

        {/* --- FATURA/FİŞ YAZDIRMA PENCERESİ (MODAL) --- */}
        {lastSale && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-[450px] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 text-center bg-emerald-500/10 border-b border-emerald-500/20">
                <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Satış Başarılı!</h2>
                <p className="text-emerald-400">Tutar: ₺{lastSale.total.toFixed(2)}</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <button onClick={() => { window.print(); }} className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-colors">
                  <Printer size={24}/> Toptan Fişi / Fatura Yazdır
                </button>
                <button onClick={() => setLastSale(null)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-colors">
                  Yeni Satışa Geç
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>

    {/* --- GİZLİ FATURA/FİŞ TASARIMI (SADECE YAZDIRIRKEN GÖRÜNÜR) --- */}
    <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-2xl mx-auto">
      {lastSale && (
        <>
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">MERKEZ ŞUBE</h1>
              <p className="text-sm text-gray-600 font-medium">TOPTAN TİCARET & SATIŞ İRSALİYESİ</p>
            </div>
            <div className="text-right text-sm">
              <p><strong>Tarih:</strong> {lastSale.date.split(' ')[0]}</p>
              <p><strong>Saat:</strong> {lastSale.date.split(' ')[1]}</p>
              <p><strong>Fiş No:</strong> {lastSale.id.slice(0,6).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="mb-6 bg-gray-100 p-4 rounded-lg">
            <p className="text-lg"><strong>Sayın:</strong> {lastSale.customerName}</p>
            <p className="text-sm text-gray-700 mt-1">Ödeme Tipi: {lastSale.method}</p>
          </div>

          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 font-bold">Ürün Açıklaması</th>
                <th className="py-2 font-bold text-center">Miktar</th>
                <th className="py-2 font-bold text-right">Birim Fiyat</th>
                <th className="py-2 font-bold text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {lastSale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 text-center">{item.qty} {item.unit}</td>
                  <td className="py-3 text-right">₺{item.grossPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-bold">₺{(item.grossPrice * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 border-t-2 border-black pt-2">
              <div className="flex justify-between text-xl font-black">
                <span>GENEL TOPLAM:</span>
                <span>₺{lastSale.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-12 border-t border-gray-300 pt-4">
            Bizi tercih ettiğiniz için teşekkür ederiz. <br/> Bu belge irsaliyeli fatura yerine geçmez, bilgi amaçlı tahsilat fişidir.
          </div>
        </>
      )}
    </div>
    </>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ShoppingCart, Package, Users, Plus, Trash2, Search, PlusCircle, MinusCircle, CreditCard, Wallet, UserPlus, CheckCircle, X, BarChart3, Printer, TrendingDown, TrendingUp, Zap } from 'lucide-react';

// FIREBASE BAĞLANTISI
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
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [isVeresiyeModalOpen, setIsVeresiyeModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  
  // Barkod okuma için "Hızlı Tepki" efekti
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'customers'), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'sales'), (s) => setSales(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'expenses'), (s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // --- BARKOD TABANCASI HIZLI MODU ---
  useEffect(() => {
    let barcodeBuffer = '';
    const handleKeyDown = (e) => {
      // Eğer bir form inputunda yazmıyorsak barkod modunu dinle
      if (e.target.tagName === 'INPUT' && !e.target.dataset.barcode) return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 2) {
          handleBarcodeScan(barcodeBuffer);
          barcodeBuffer = '';
        }
      } else {
        if (e.key.length === 1) barcodeBuffer += e.key;
      }
      
      // Buffer temizleme (çok yavaş basılıyorsa barkod değildir)
      setTimeout(() => { barcodeBuffer = ''; }, 200);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleBarcodeScan = (code) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      setActiveTab('pos');
      addToCart(product);
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }
  };

  // --- KASA İŞLEMLERİ ---
  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(item => item.id === product.id);
      if (ex) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchQuery('');
  };

  const saveSale = async (method, customer = null) => {
    const saleData = {
      items: cart,
      total: cart.reduce((t, i) => t + (i.grossPrice * i.qty), 0),
      method,
      customerName: customer ? customer.name : 'Perakende Müşteri',
      date: new Date().toLocaleString('tr-TR')
    };
    const ref = await addDoc(collection(db, 'sales'), saleData);
    setLastSale({ id: ref.id, ...saleData });
    setCart([]);
  };

  // --- HESAPLAMALAR ---
  const totalIncome = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <>
    <div className={`flex h-screen text-zinc-100 font-sans overflow-hidden transition-colors duration-300 print:hidden ${flash ? 'bg-emerald-900' : 'bg-zinc-950'}`}>
      
      {/* SOL MENÜ */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl text-zinc-950">M</div>
          <div><h1 className="font-bold text-md">Merkez Şube</h1><p className="text-xs text-zinc-400 font-mono flex items-center gap-1"><Zap size={10} className="text-yellow-400"/> HIZLI MOD AKTİF</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['pos', 'products', 'customers', 'reports'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 p-3 rounded-lg capitalize ${activeTab === tab ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-800 text-zinc-400'}`}>
              {tab === 'pos' && <ShoppingCart size={20}/>}
              {tab === 'products' && <Package size={20}/>}
              {tab === 'customers' && <Users size={20}/>}
              {tab === 'reports' && <BarChart3 size={20}/>}
              {tab === 'pos' ? 'Hızlı Satış' : tab === 'products' ? 'Ürünler' : tab === 'customers' ? 'Cari Hesaplar' : 'Raporlar'}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex overflow-hidden bg-transparent">
        {activeTab === 'pos' && (
          <div className="flex w-full">
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
                <input data-barcode="true" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Okutun veya yazın..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 outline-none text-lg focus:border-emerald-500" />
              </div>
              <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-4 gap-4 content-start">
                {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery)).map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-left hover:border-emerald-500 transition-all flex flex-col justify-between h-32">
                    <span className="font-bold text-emerald-400 line-clamp-2">{p.name}</span>
                    <span className="text-xl font-black">₺{p.grossPrice}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* SEPET */}
            <div className="w-[380px] bg-zinc-900 border-l border-zinc-800 flex flex-col">
              <div className="p-6 border-b border-zinc-800 font-bold text-xl flex items-center gap-2"><ShoppingCart className="text-emerald-500"/> SEPET</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                    <div className="flex-1"><div className="text-sm font-medium line-clamp-1">{item.name}</div><div className="text-emerald-500 font-bold">₺{item.grossPrice}</div></div>
                    <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded">
                      <button onClick={() => updateCartQty(item.id, -1)} className="p-1"><MinusCircle size={18}/></button>
                      <span className="w-6 text-center font-bold">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="p-1"><PlusCircle size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                <div className="flex justify-between text-2xl font-black mb-4"><span>TOPLAM:</span><span>₺{cart.reduce((t, i) => t + (i.grossPrice * i.qty), 0).toFixed(2)}</span></div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button onClick={() => saveSale('Nakit')} className="bg-zinc-800 p-3 rounded-lg font-bold border border-zinc-700">NAKİT</button>
                  <button onClick={() => saveSale('Kart')} className="bg-zinc-800 p-3 rounded-lg font-bold border border-zinc-700">KART</button>
                </div>
                <button onClick={() => setIsVeresiyeModalOpen(true)} className="w-full bg-emerald-600 p-4 rounded-lg font-black text-zinc-950 hover:bg-emerald-500">VERESİYE YAZ</button>
              </div>
            </div>
          </div>
        )}

        {/* DİĞER EKRANLAR SIKIŞTIRILMIŞ HALDE */}
        {activeTab === 'products' && (
          <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between mb-8"><h2 className="text-2xl font-bold">Ürün Deposu</h2><button onClick={() => setShowAddForm(true)} className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-lg font-bold">+ Yeni Ürün</button></div>
            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-400 text-sm"><tr><th className="p-4">Ürün</th><th className="p-4">Barkod</th><th className="p-4">Fiyat</th><th className="p-4">İşlem</th></tr></thead>
                <tbody>{products.map(p => (<tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20"><td className="p-4 font-bold text-emerald-400">{p.name}</td><td className="p-4 text-zinc-500 font-mono">{p.barcode || '-'}</td><td className="p-4 font-bold">₺{p.grossPrice}</td><td className="p-4"><button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="text-red-500"><Trash2 size={18}/></button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* RAPORLAR BASİT HALİ */}
        {activeTab === 'reports' && (
          <div className="p-8 w-full overflow-y-auto">
             <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-zinc-900 p-6 rounded-2xl border border-emerald-500/20"><div className="text-emerald-500 mb-2 flex items-center gap-2"><TrendingUp/> TOPLAM SATIŞ</div><div className="text-4xl font-black">₺{totalIncome.toFixed(2)}</div></div>
                <div className="bg-zinc-900 p-6 rounded-2xl border border-red-500/20"><div className="text-red-500 mb-2 flex items-center gap-2"><TrendingDown/> TOPLAM GİDER</div><div className="text-4xl font-black">₺{totalExpense.toFixed(2)}</div></div>
             </div>
             <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="font-bold mb-4">Dükkan Masrafı Gir</h3>
                <div className="flex gap-4">
                  <input id="expN" placeholder="Gider Adı" className="bg-zinc-950 border border-zinc-800 p-2 rounded flex-1 outline-none focus:border-red-500"/>
                  <input id="expA" placeholder="Tutar" type="number" className="bg-zinc-950 border border-zinc-800 p-2 rounded w-32 outline-none focus:border-red-500"/>
                  <button onClick={async () => {
                    const n = document.getElementById('expN').value;
                    const a = document.getElementById('expA').value;
                    if(n && a) { await addDoc(collection(db, 'expenses'), {name: n, amount: parseFloat(a), date: new Date().toISOString()}); document.getElementById('expN').value=''; document.getElementById('expA').value=''; }
                  }} className="bg-red-500 text-white px-6 rounded font-bold">Kaydet</button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* MODAL VE FATURA (ESKİ TASARIMLAR KORUNDU) */}
      {isVeresiyeModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-[450px] p-6">
            <h3 className="text-xl font-bold mb-4 text-emerald-500">Müşteri Seçin</h3>
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-lg text-white outline-none mb-6">
              <option value="">-- Müşteri Seç --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Borç: ₺{c.balance})</option>)}
            </select>
            <button onClick={completeVeresiyeCheckout} className="w-full bg-emerald-500 text-zinc-950 font-bold py-4 rounded-xl">SATIŞI TAMAMLA</button>
            <button onClick={() => setIsVeresiyeModalOpen(false)} className="w-full mt-2 text-zinc-500 py-2">Vazgeç</button>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-8 rounded-2xl text-center border border-emerald-500">
            <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4"/>
            <h2 className="text-2xl font-bold mb-6">İŞLEM BAŞARILI!</h2>
            <button onClick={() => window.print()} className="bg-white text-zinc-950 px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto mb-4"><Printer size={20}/> FATURA YAZDIR</button>
            <button onClick={() => setLastSale(null)} className="text-zinc-500 hover:text-white">Kapat</button>
          </div>
        </div>
      )}
    </div>

    {/* YAZDIRMA ALANI */}
    <div className="hidden print:block p-8 text-black bg-white w-full">
      {lastSale && (
        <div className="border-2 border-black p-4">
          <h1 className="text-2xl font-black mb-4">MERKEZ ŞUBE TOPTAN</h1>
          <div className="flex justify-between border-b border-black pb-2 mb-4">
            <span>Müşteri: {lastSale.customerName}</span>
            <span>Tarih: {lastSale.date}</span>
          </div>
          <table className="w-full text-left mb-4">
            <thead><tr className="border-b border-black"><th>Ürün</th><th>Adet</th><th>Fiyat</th></tr></thead>
            <tbody>{lastSale.items.map((i,idx) => <tr key={idx}><td>{i.name}</td><td>{i.qty}</td><td>₺{i.grossPrice}</td></tr>)}</tbody>
          </table>
          <div className="text-right text-xl font-bold">TOPLAM: ₺{lastSale.total.toFixed(2)}</div>
        </div>
      )}
    </div>
    </>
  );
}
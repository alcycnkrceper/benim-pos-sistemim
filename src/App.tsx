import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ShoppingCart, Package, Users, Plus, Trash2, Search, PlusCircle, MinusCircle, Wallet, UserPlus, CheckCircle, X, BarChart3, Printer, TrendingDown, TrendingUp, Zap, Phone, Tag, Percent, Download, Upload, FileSpreadsheet } from 'lucide-react';

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
  
  // İskonto ve Kasa Müşterisi
  const [cartCustomer, setCartCustomer] = useState('');
  const [discountPct, setDiscountPct] = useState('');

  // Form ve Modal State'leri
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [flash, setFlash] = useState(false);

  // Ürün Formu State'leri (Alış Fiyatı Eklendi)
  const [pName, setPName] = useState('');
  const [pBarcode, setPBarcode] = useState('');
  const [pUnit, setPUnit] = useState('Adet');
  const [pCost, setPCost] = useState(''); // Alış Fiyatı (Maliyet)
  const [pNet, setPNet] = useState('');
  const [pTax, setPTax] = useState('20');

  // Müşteri ve Gider Formu
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cTaxNum, setCTaxNum] = useState('');
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');

  const fileInputRefProd = useRef(null);
  const fileInputRefCust = useRef(null);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    const unsubP = onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubC = onSnapshot(collection(db, 'customers'), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubS = onSnapshot(collection(db, 'sales'), (s) => setSales(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubE = onSnapshot(collection(db, 'expenses'), (s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubP(); unsubC(); unsubS(); unsubE(); };
  }, []);

  // --- BARKOD DİNLEYİCİ ---
  useEffect(() => {
    let buffer = '';
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          const found = products.find(p => p.barcode === buffer);
          if (found) { setActiveTab('pos'); addToCart(found); setFlash(true); setTimeout(() => setFlash(false), 300); }
          buffer = '';
        }
      } else if (e.key.length === 1) { buffer += e.key; }
      setTimeout(() => { buffer = ''; }, 200);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [products]);

  // --- ÜRÜN İŞLEMLERİ ---
  const calcGross = (net, tax) => net ? (parseFloat(net) * (1 + parseFloat(tax) / 100)).toFixed(2) : "0.00";
  
  const handleAddProduct = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'products'), { 
      name: pName, barcode: pBarcode, unit: pUnit, 
      costPrice: parseFloat(pCost) || 0, // Maliyet Eklendi
      netPrice: parseFloat(pNet), taxRate: parseInt(pTax), grossPrice: parseFloat(calcGross(pNet, pTax)) 
    });
    setPName(''); setPBarcode(''); setPCost(''); setPNet(''); setShowAddForm(false);
  };

  // --- MÜŞTERİ İŞLEMLERİ ---
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'customers'), { name: cName, phone: cPhone, taxNum: cTaxNum || '-', balance: 0 });
    setCName(''); setCPhone(''); setCTaxNum(''); setShowCustomerForm(false);
  };

  const handleTahsilat = async (customer) => {
    const tutar = window.prompt(`${customer.name} Tahsilat Tutarı (₺):`);
    if (tutar && !isNaN(tutar)) {
      await updateDoc(doc(db, 'customers', customer.id), { balance: customer.balance - parseFloat(tutar) });
      await addDoc(collection(db, 'sales'), { total: parseFloat(tutar), method: 'Tahsilat', customerName: customer.name, items: [{name: 'Cari Tahsilat', qty: 1, grossPrice: parseFloat(tutar)}], date: new Date().toLocaleString('tr-TR') });
    }
  };

  // --- KASA & SEPET ---
  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    setSearchQuery('');
  };

  // Hesaplamalar
  const rawTotal = cart.reduce((t, i) => t + (i.grossPrice * i.qty), 0);
  const totalCost = cart.reduce((t, i) => t + ((i.costPrice || 0) * i.qty), 0); // Satılan malın maliyeti
  const discountVal = parseFloat(discountPct) || 0;
  const discountAmount = rawTotal * (discountVal / 100);
  const finalTotal = rawTotal - discountAmount;

  const finishSale = async (method) => {
    if (cart.length === 0) return;
    if (method === 'Veresiye' && !cartCustomer) return alert("Veresiye satış için Müşteri seçmelisiniz!");

    const activeCustomer = customers.find(c => c.id === cartCustomer);
    const saleData = { 
      items: cart, subTotal: rawTotal, discountPct: discountVal, discountAmount,
      totalCost: totalCost, // Maliyeti veri tabanına yazıyoruz (Kar analizi için)
      total: finalTotal, method, customerName: activeCustomer ? activeCustomer.name : 'Perakende Müşteri', 
      customerTax: activeCustomer ? activeCustomer.taxNum : '-', date: new Date().toLocaleString('tr-TR') 
    };
    
    const ref = await addDoc(collection(db, 'sales'), saleData);
    if (method === 'Veresiye' && activeCustomer) await updateDoc(doc(db, 'customers', activeCustomer.id), { balance: activeCustomer.balance + finalTotal });
    
    setLastSale({ id: ref.id, ...saleData });
    setCart([]); setCartCustomer(''); setDiscountPct('');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'expenses'), { name: expName, amount: parseFloat(expAmount), date: new Date().toISOString() });
    setExpName(''); setExpAmount('');
  };

  // --- İÇERİ / DIŞARI AKTAR (CSV) & PARAŞÜT ---
  const downloadCSV = (dataList, headers, filename) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...dataList.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = filename;
    link.click();
  };

  const exportProducts = () => {
    const data = products.map(p => [p.name.replace(/,/g, ''), p.barcode, p.unit, p.costPrice || 0, p.grossPrice]);
    downloadCSV(data, ["Urun Adi", "Barkod", "Birim", "Alis Fiyati", "Satis Fiyati"], "urunler_listesi.csv");
  };

  const exportCustomers = () => {
    const data = customers.map(c => [c.name.replace(/,/g, ''), c.taxNum, c.phone, c.balance]);
    downloadCSV(data, ["Musteri Adi", "Vergi No", "Telefon", "Bakiye"], "musteriler_listesi.csv");
  };

  // İçeri Aktar İşlemleri
  const importProducts = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const rows = evt.target.result.split('\n').slice(1); // Başlığı atla
      for(let row of rows) {
        const cols = row.split(',');
        if(cols.length >= 4 && cols[0].trim() !== '') {
          await addDoc(collection(db, 'products'), { name: cols[0], barcode: cols[1], unit: cols[2], costPrice: parseFloat(cols[3])||0, grossPrice: parseFloat(cols[4])||0 });
        }
      }
      alert("Ürünler başarıyla içeri aktarıldı!");
    };
    reader.readAsText(file);
  };

  // --- GELİŞMİŞ KAR / ZARAR ANALİZİ ---
  const totalIncome = sales.reduce((a, b) => a + b.total, 0);
  const totalExpense = expenses.reduce((a, b) => a + b.amount, 0);
  // Sadece mal satışlarından kaynaklanan maliyetleri topla (Tahsilatlar hariç)
  const totalCogs = sales.filter(s => s.method !== 'Tahsilat').reduce((a, b) => a + (b.totalCost || 0), 0);
  const netCommercialProfit = totalIncome - totalCogs - totalExpense; // Satış - Maliyet - Giderler

  return (
    <>
    <div className={`flex h-screen text-zinc-100 transition-colors duration-300 print:hidden ${flash ? 'bg-emerald-900' : 'bg-zinc-950'}`}>
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-zinc-950 text-xl">M</div>
          <div><h1 className="font-bold">Merkez Şube</h1><p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono"><Zap size={10} className="text-yellow-400"/> HIZLI MOD AKTİF</p></div>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {[ 
            { id: 'pos', icon: <ShoppingCart size={20}/>, label: 'Hızlı Satış' },
            { id: 'products', icon: <Package size={20}/>, label: 'Ürün Deposu' },
            { id: 'customers', icon: <Users size={20}/>, label: 'Cari Hesaplar' },
            { id: 'reports', icon: <BarChart3 size={20}/>, label: 'Strateji & Rapor' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === t.id ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 flex overflow-hidden bg-transparent">
        
        {/* KASA EKRANI */}
        {activeTab === 'pos' && (
          <div className="flex w-full">
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-zinc-500" size={20}/>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ürün adı veya barkod..." className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-emerald-500 text-lg shadow-inner"/>
              </div>
              <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-4 gap-4 content-start">
                {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery)).map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-left hover:border-emerald-500 hover:bg-zinc-800/50 transition-all flex flex-col justify-between h-36 group">
                    <span className="font-bold text-zinc-200 group-hover:text-emerald-400 line-clamp-2">{p.name}</span>
                    <div className="flex justify-between items-end"><span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-500">{p.unit}</span><span className="text-2xl font-black text-white">₺{p.grossPrice}</span></div>
                  </button>
                ))}
              </div>
            </div>

            {/* SEPET PANELİ */}
            <div className="w-[420px] bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl">
              <div className="p-5 border-b border-zinc-800 bg-zinc-950/20">
                <div className="flex items-center gap-2 mb-4 font-black text-xl"><ShoppingCart className="text-emerald-500"/> SATIŞ FİŞİ</div>
                <select value={cartCustomer} onChange={e => setCartCustomer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 text-sm font-bold">
                  <option value="">-- Perakende (Cari Seçilmedi) --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Bakiye: ₺{c.balance})</option>)}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center group animate-in fade-in zoom-in duration-200">
                    <div className="flex-1"><div className="text-sm font-bold text-zinc-300 line-clamp-1">{item.name}</div><div className="text-emerald-500 font-black">₺{(item.grossPrice * item.qty).toFixed(2)}</div></div>
                    <div className="flex items-center gap-3 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
                      <button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: Math.max(1, i.qty-1)} : i))} className="text-zinc-500 hover:text-emerald-500"><MinusCircle size={22}/></button>
                      <span className="w-6 text-center font-black text-lg">{item.qty}</span>
                      <button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: i.qty+1} : i))} className="text-zinc-500 hover:text-emerald-500"><PlusCircle size={22}/></button>
                    </div>
                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="ml-3 text-red-900 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>

              {/* İSKONTO VE TOPLAM */}
              <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm"><Percent size={16}/> İskonto (Pazarlık)</div>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">%</span>
                    <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="0" className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-center text-white outline-none focus:border-emerald-500 font-bold"/>
                  </div>
                </div>

                <div className="flex justify-between text-zinc-500 text-sm font-bold mb-1"><span>Ara Toplam:</span><span>₺{rawTotal.toFixed(2)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-emerald-500 text-sm font-bold mb-2 border-b border-zinc-800 pb-2"><span>İndirim:</span><span>- ₺{discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-3xl font-black mb-6 text-white tracking-tighter mt-2"><span>TOPLAM:</span><span>₺{finalTotal.toFixed(2)}</span></div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button onClick={() => finishSale('Nakit')} className="bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-bold border border-zinc-700 active:scale-95 transition-all">NAKİT</button>
                  <button onClick={() => finishSale('Kart')} className="bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-bold border border-zinc-700 active:scale-95 transition-all">KART</button>
                </div>
                <button onClick={() => finishSale('Veresiye')} className="w-full bg-emerald-500 py-5 rounded-2xl font-black text-zinc-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">VERESİYE YAZ</button>
              </div>
            </div>
          </div>
        )}

        {/* ÜRÜNLER SEKMESİ (İÇERİ / DIŞARI AKTAR) */}
        {activeTab === 'products' && (
          <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tight">Ürün Deposu</h2>
              <div className="flex gap-3">
                <input type="file" accept=".csv" ref={fileInputRefProd} style={{display:'none'}} onChange={importProducts} />
                <button onClick={() => fileInputRefProd.current.click()} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700"><Upload size={18}/> İçeri Aktar</button>
                <button onClick={exportProducts} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700"><Download size={18}/> Dışarı Aktar</button>
                <button onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 ml-2"><Plus size={20}/> Yeni Ürün Ekle</button>
              </div>
            </div>
            
            {showAddForm && (
              <form onSubmit={handleAddProduct} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl mb-8 grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-300">
                <div className="space-y-2 col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Ürün İsmi</label><input required value={pName} onChange={e => setPName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none focus:border-emerald-500" placeholder="Örn: Dove Sabun 100gr"/></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Barkod Numarası</label><input value={pBarcode} onChange={e => setPBarcode(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none focus:border-emerald-500" placeholder="Barkodu okutun..."/></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Birim</label><select value={pUnit} onChange={e => setPUnit(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none"><option>Adet</option><option>Koli</option><option>Paket</option></select></div>
                <div className="space-y-2"><label className="text-xs font-bold text-blue-400 uppercase ml-1">ALIŞ Fiyatı (Maliyet)</label><input type="number" step="0.01" value={pCost} onChange={e => setPCost(e.target.value)} className="w-full bg-blue-950/20 border border-blue-900 p-4 rounded-xl outline-none focus:border-blue-500 text-blue-300" placeholder="0.00"/></div>
                <div className="space-y-2"><label className="text-xs font-bold text-emerald-500 uppercase ml-1">NET Satış Fiyatı (₺)</label><input required type="number" step="0.01" value={pNet} onChange={e => setPNet(e.target.value)} className="w-full bg-zinc-950 border border-emerald-900 p-4 rounded-xl outline-none focus:border-emerald-500" placeholder="0.00"/></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">KDV %</label><select value={pTax} onChange={e => setPTax(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none"><option value="0">0</option><option value="1">1</option><option value="10">10</option><option value="20">20</option></select></div>
                <div className="flex items-end"><button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-4 rounded-xl">ÜRÜNÜ KAYDET</button></div>
              </form>
            )}
            <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest"><tr><th className="p-5">Ürün Bilgisi</th><th className="p-5">Barkod</th><th className="p-5">Birim</th><th className="p-5 text-right">Alış (Maliyet)</th><th className="p-5 text-right">Brüt Satış Fiyatı</th><th className="p-5 text-right">İşlem</th></tr></thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-5 font-bold text-emerald-400">{p.name}</td><td className="p-5 font-mono text-zinc-500">{p.barcode || '-'}</td><td className="p-5 text-sm text-zinc-400">{p.unit}</td>
                      <td className="p-5 text-right font-medium text-blue-400 text-sm">₺{p.costPrice || '0.00'}</td>
                      <td className="p-5 text-right font-black text-white text-lg font-mono">₺{p.grossPrice}</td>
                      <td className="p-5 text-right"><button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="text-zinc-700 hover:text-red-500 p-2 transition-colors"><Trash2 size={20}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MÜŞTERİLER SEKMESİ (İÇERİ / DIŞARI AKTAR) */}
        {activeTab === 'customers' && (
          <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black">Cari Hesaplar</h2>
              <div className="flex gap-3">
                <button onClick={exportCustomers} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700"><Download size={18}/> Dışarı Aktar</button>
                <button onClick={() => setShowCustomerForm(!showCustomerForm)} className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-2xl font-bold flex items-center gap-2"><UserPlus size={20}/> Yeni Cari Ekle</button>
              </div>
            </div>
            {showCustomerForm && (
              <form onSubmit={handleAddCustomer} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl mb-8 flex flex-wrap gap-6 animate-in slide-in-from-top">
                <div className="flex-1 min-w-[200px] space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Firma / Müşteri Adı</label><input required value={cName} onChange={e => setCName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none" placeholder="Örn: Beyoğlu Buklet"/></div>
                <div className="flex-1 min-w-[200px] space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Vergi No / TC No</label><input required value={cTaxNum} onChange={e => setCTaxNum(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none" placeholder="Vergi No girin..."/></div>
                <div className="flex-1 min-w-[200px] space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Telefon</label><input value={cPhone} onChange={e => setCPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none" placeholder="05xx..."/></div>
                <div className="flex items-end"><button type="submit" className="bg-emerald-500 text-zinc-950 font-black px-10 py-4 rounded-xl uppercase">Ekle</button></div>
              </form>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customers.map(c => (
                <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center hover:border-emerald-500/30 transition-all">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">{c.name}</h3>
                    <div className="flex gap-4"><span className="flex items-center gap-1 text-zinc-500 text-xs font-bold bg-zinc-950 px-2 py-1 rounded"><Phone size={12}/> {c.phone || '-'}</span><span className="flex items-center gap-1 text-zinc-500 text-xs font-bold bg-zinc-950 px-2 py-1 rounded">V.No: {c.taxNum || '-'}</span></div>
                  </div>
                  <div className="text-right space-y-3">
                    <div className={`text-2xl font-black font-mono ${c.balance > 0 ? 'text-red-500' : c.balance < 0 ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      {c.balance > 0 ? `+ ₺${c.balance.toFixed(2)}` : c.balance < 0 ? `- ₺${Math.abs(c.balance).toFixed(2)}` : 'BORCU YOK'}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleTahsilat(c)} className="bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-500 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-700 transition-all flex items-center gap-1"><Wallet size={14}/> TAHSİLAT</button>
                      <button onClick={() => deleteDoc(doc(db, 'customers', c.id))} className="bg-zinc-800 hover:bg-red-500 text-zinc-500 px-3 py-2 rounded-xl border border-zinc-700 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RAPORLAR & STRATEJİ SEKMESİ (KAR / ZARAR + PARAŞÜT ENTEGRASYON) */}
        {activeTab === 'reports' && (
          <div className="p-8 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black">Strateji ve Rapor Paneli</h2>
              <button onClick={() => {
                const data = customers.map(c => [c.name.replace(/,/g, ''), c.taxNum, c.phone, '', '', '', '', '', c.balance]);
                downloadCSV(data, ["Unvan", "Vergi No", "Telefon", "E-posta", "Il", "Ilce", "Adres", "Musteri Tipi", "Acilis Bakiyesi"], "parasut_musteriler_sablonu.csv");
                alert("Paraşüt uyumlu Müşteri şablonu indirildi! Bunu Paraşüt'e yükleyebilirsiniz.");
              }} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"><FileSpreadsheet size={20}/> Paraşüt'e Aktar (Müşteriler)</button>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-12">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={80}/></div>
                <div className="text-zinc-400 font-bold text-xs mb-2 uppercase tracking-tighter">Brüt Ciro (Satışlar)</div>
                <div className="text-3xl font-black text-white">₺{totalIncome.toFixed(2)}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Package size={80}/></div>
                <div className="text-blue-400 font-bold text-xs mb-2 uppercase tracking-tighter">Satılan Malın Maliyeti</div>
                <div className="text-3xl font-black text-white">₺{totalCogs.toFixed(2)}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingDown size={80}/></div>
                <div className="text-red-500 font-bold text-xs mb-2 uppercase tracking-tighter">Dükkan Giderleri</div>
                <div className="text-3xl font-black text-white">₺{totalExpense.toFixed(2)}</div>
              </div>
              <div className={`p-6 rounded-3xl relative overflow-hidden group border-2 ${netCommercialProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={80}/></div>
                <div className={`font-bold text-xs mb-2 uppercase tracking-tighter ${netCommercialProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>Net Ticari Kar</div>
                <div className={`text-3xl font-black ${netCommercialProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>₺{netCommercialProfit.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-zinc-900 p-8 rounded-[35px] border border-zinc-800">
                <h3 className="text-xl font-black mb-6 border-b border-zinc-800 pb-4">Yeni Gider / Masraf Kaydı</h3>
                <form onSubmit={handleAddExpense} className="space-y-6">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Masraf Açıklaması</label><input required value={expName} onChange={e => setExpName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-red-500" placeholder="Örn: Elektrik Faturası"/></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Tutar (₺)</label><input required type="number" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-red-500" placeholder="0.00"/></div>
                  <button type="submit" className="w-full bg-red-500/20 text-red-500 border border-red-500/30 font-black py-5 rounded-2xl hover:bg-red-500 hover:text-white transition-all">GİDERİ KAYDET</button>
                </form>
              </div>
              <div className="bg-zinc-900 p-8 rounded-[35px] border border-zinc-800 flex flex-col">
                <h3 className="text-xl font-black mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">Son Satış Geçmişi <Tag className="text-zinc-600" size={20}/></h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {sales.slice().reverse().map((s, idx) => (
                    <div key={idx} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center group">
                      <div><div className="text-xl font-black text-emerald-400">₺{s.total.toFixed(2)}</div><div className="text-[10px] text-zinc-600 font-mono mt-1 uppercase">{s.date}</div></div>
                      <div className="text-right"><div className="font-bold text-zinc-300">{s.customerName}</div><div className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 inline-block mt-1 text-zinc-500">{s.method} {s.discountPct > 0 ? `(%${s.discountPct} İndirim)` : ''}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALLAR --- */}
      {isVeresiyeModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[40px] w-full max-w-[500px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50"><h3 className="text-2xl font-black text-emerald-500 flex items-center gap-2"><Users size={28}/> Cari Seçimi</h3><button onClick={() => setIsVeresiyeModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={30}/></button></div>
            <div className="p-8">
              <p className="text-zinc-400 mb-6 text-lg font-medium">Toplam <span className="text-white font-black text-2xl">₺{finalTotal.toFixed(2)}</span> tutarındaki satış hangi cariye yazılsın?</p>
              <select value={cartCustomer} onChange={e => setCartCustomer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-5 rounded-2xl text-white outline-none mb-8 text-xl focus:border-emerald-500"><option value="">-- Müşteri / Firma Seçin --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} (Bakiye: ₺{c.balance})</option>)}</select>
              <button onClick={() => finishSale('Veresiye')} className="w-full bg-emerald-500 text-zinc-950 font-black py-6 rounded-2xl text-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">SATIŞI ONAYLA VE BORÇ YAZ</button>
            </div>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200]">
          <div className="bg-zinc-900 p-12 rounded-[50px] text-center border-2 border-emerald-500/50 shadow-2xl animate-in zoom-in duration-500">
            <div className="bg-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/40"><CheckCircle size={60} className="text-zinc-950"/></div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">Satış Tamamlandı!</h2>
            <p className="text-zinc-500 text-xl mb-10">İşlem başarıyla bulut veritabanına kaydedildi.</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => window.print()} className="bg-white text-zinc-950 px-12 py-5 rounded-2xl font-black text-xl flex items-center gap-3 mx-auto hover:bg-zinc-200 transition-all"><Printer size={24}/> FATURA / FİŞ YAZDIR</button>
              <button onClick={() => setLastSale(null)} className="text-zinc-500 hover:text-white font-bold text-lg mt-4">Pencereyi Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* --- GİZLİ YAZDIRMA (FATURA) TASARIMI --- */}
    <div className="hidden print:block p-10 text-black bg-white font-sans">
      {lastSale && (
        <div className="max-w-2xl mx-auto border-4 border-black p-8">
          <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
            <div><h1 className="text-5xl font-black uppercase tracking-tighter">MERKEZ ŞUBE</h1><p className="text-sm font-bold text-gray-600">TOPTAN TİCARET VE SATIŞ FİŞİ</p></div>
            <div className="text-right"><p><strong>TARİH:</strong> {lastSale.date.split(' ')[0]}</p><p><strong>SAAT:</strong> {lastSale.date.split(' ')[1]}</p><p><strong>FİŞ NO:</strong> #{lastSale.id.slice(-6).toUpperCase()}</p></div>
          </div>
          <div className="bg-gray-100 p-6 rounded-xl mb-8 border-2 border-black">
            <p className="text-2xl font-black uppercase">SAYIN: {lastSale.customerName}</p>
            <p className="font-bold text-gray-700 mt-2">VERGİ / TC NO: {lastSale.customerTax || '-'}</p>
            <p className="font-bold text-gray-700 mt-1">ÖDEME TÜRÜ: {lastSale.method}</p>
          </div>
          <table className="w-full text-left mb-10">
            <thead className="border-b-4 border-black"><tr><th className="py-4 text-xl">ÜRÜN AÇIKLAMASI</th><th className="py-4 text-center text-xl">ADET</th><th className="py-4 text-right text-xl">BİRİM</th><th className="py-4 text-right text-xl">TOPLAM</th></tr></thead>
            <tbody className="divide-y-2 divide-gray-300">
              {lastSale.items.map((i,idx) => (
                <tr key={idx}><td className="py-4 font-bold">{i.name}</td><td className="py-4 text-center font-black">{i.qty}</td><td className="py-4 text-right font-medium">₺{i.grossPrice.toFixed(2)}</td><td className="py-4 text-right font-black">₺{(i.grossPrice * i.qty).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-80 border-t-4 border-black pt-4">
              <div className="flex justify-between text-xl font-bold text-gray-600 mb-2"><span>Ara Toplam:</span><span>₺{lastSale.subTotal.toFixed(2)}</span></div>
              {lastSale.discountAmount > 0 && <div className="flex justify-between text-xl font-bold text-gray-600 mb-4 border-b-2 border-gray-300 pb-2"><span>İskonto (%{lastSale.discountPct}):</span><span>- ₺{lastSale.discountAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-4xl font-black mt-2"><span>TOPLAM:</span><span>₺{lastSale.total.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="mt-20 text-center border-t-2 border-dashed border-gray-400 pt-6 font-bold text-gray-500">BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜR EDERİZ. <br/> YİNE BEKLERİZ!</div>
        </div>
      )}
    </div>
    </>
  );
}
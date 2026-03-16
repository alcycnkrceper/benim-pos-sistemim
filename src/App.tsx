import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import {
  ShoppingCart, Package, Users, Plus, Trash2, Search, PlusCircle, MinusCircle,
  Wallet, UserPlus, CheckCircle, X, BarChart3, Printer, TrendingDown, TrendingUp,
  Zap, Phone, Percent, Download, Upload, FileSpreadsheet, CalendarDays,
  Square, SquareCheck, Save, RotateCcw, Building2, MapPin, Hash, AlignLeft,
  Palette, Eye, Boxes, ClipboardList, AlertTriangle, ArrowDownToLine,
  ChevronDown, ChevronUp, ClipboardCheck, FolderOpen, Pencil, ArrowUpDown,
  SendHorizonal, Ban, ShoppingBag, FileText, Receipt, MessageSquare, Filter,
  LogIn, LogOut, UserCog, Shield, History, RefreshCw, ArrowLeftRight, Tag,
  Clock, UserCheck, Lock, Key, Activity
} from 'lucide-react';

// ── XLSX CDN ───────────────────────────────────────────────────────────────
function loadXLSX(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).XLSX) return resolve((window as any).XLSX);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => resolve((window as any).XLSX); s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── FIREBASE ──────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAqPHwW06rOK_kPDoyHQ-ZOqGWZtCJSLzU",
  authDomain: "beyoglubuklet.firebaseapp.com", projectId: "beyoglubuklet",
  storageBucket: "beyoglubuklet.firebasestorage.app",
  messagingSenderId: "258370785541",
  appId: "1:258370785541:web:e517fab5f35ecfc8f5276c",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── TYPES ─────────────────────────────────────────────────────────────────
type PaperSize = '58mm' | '80mm' | 'a5' | 'a4';
type BorderStyle = 'thick' | 'thin' | 'none';
type FontSize = 'small' | 'normal' | 'large';
type StaffRole = 'admin' | 'kasiyer' | 'depo';

interface ReceiptSettings {
  companyName: string; companySubtitle: string; address: string;
  phone: string; taxNo: string; website: string;
  footerLine1: string; footerLine2: string;
  showTaxNo: boolean; showAddress: boolean; showPhone: boolean;
  showWebsite: boolean; showItemTax: boolean;
  borderStyle: BorderStyle; fontSize: FontSize; paperSize: PaperSize;
}
const DEFAULT_SETTINGS: ReceiptSettings = {
  companyName:'MERKEZ ŞUBE', companySubtitle:'TOPTAN TİCARET VE SATIŞ FİŞİ',
  address:'', phone:'', taxNo:'', website:'',
  footerLine1:'BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜR EDERİZ.', footerLine2:'YİNE BEKLERİZ!',
  showTaxNo:true, showAddress:false, showPhone:false, showWebsite:false, showItemTax:false,
  borderStyle:'thick', fontSize:'normal', paperSize:'a4',
};
const PAPER_WIDTHS: Record<PaperSize,number> = {'58mm':220,'80mm':310,'a5':520,'a4':680};
const PAPER_LABELS: Record<PaperSize,string> = {'58mm':'Termal 58mm','80mm':'Termal 80mm','a5':'A5','a4':'A4'};
function loadSettings(): ReceiptSettings { try { const s=localStorage.getItem('rcptS'); return s?{...DEFAULT_SETTINGS,...JSON.parse(s)}:DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; } }
function saveSettingsLS(s: ReceiptSettings) { localStorage.setItem('rcptS',JSON.stringify(s)); }

// ── PARAŞÜT ───────────────────────────────────────────────────────────────
const PARASUT_HELP='Satış Faturaları\n\n- Yıldız ile belirlenen alanları doldurmanız yeterlidir.\n- Faturalar ile beraber Paraşüt\'te kayıtlı olmayan Müşteriler ve Hizmet/Ürünler de oluşturulur.\n- Paraşütte kayıtlı olan müşteriler içeri alınan faturalar ile ilişkilendirilir.\n- Fatura Türü, \u201cFatura\u201d, "Taslak" (ya da \u201cProforma\u201d) veya "Konaklama" olabilir. Boş bırakmanız halinde \u201cFatura\u201d olarak kaydedilir.\n- Fatura döviz cinsi TRL, USD, EUR veya GBP olabilir. Döviz cinsi belirtilmediği takdirde TRL olarak kabul edilir.\n- Proforma faturalarda fatura döviz kuru boş bırakılmalıdır. Eğer bir kur belirtilmişse göz ardı edilir. Faturalarda ise döviz kuru zorunludur.\n- Vade tarihi olmayan veya ileri bir tarihe denk gelen faturalar açık fatura olarak içeri alınır. Geçmiş tarihli tahsilatlar gerçekleşti olarak varsayılır ve kasa hesabınıza eklenir.\n- Yabancı döviz cinsinden kesilen faturalar için yapılan tahsilatların Türk Lirası karşılıklarınin girilmesi zorunludur. TL faturalarda ve diğer açık faturalarda bu alan boş bırakılmalıdır.\n- Bir faturaya birden fazla hizmet/ürün eklemek için faturayı takip eden satırlarda sadece hizmet/ürün detaylarını doldurun.\n- KDV Oranı 10 Temmuz 2023 itibariyle 0, 1, 10 veya 20 olmalıdır.\n- Fatura Sıra Numarasının başına sıfır eklemenize gerek yoktur.\n- Deponun belirtilmemesi durumunda ürünler varsayılan deponuzan çıkmış olarak kabul edilir.\n- Konaklama Vergisi Oranı belirtilmemiş ise Konaklama Vergisi yok, oran 0 ise Konaklama Vergisi istisna kabul edilir.\n- Tablonun sütun yapısını bozmayın.\n- Bu yardım metnini silmeyin.\n\n- Destek için destek@parasut.com veya 0212 292 04 94';
const PARASUT_HEADERS=['MÜŞTERİ ÜNVANI *','FATURA İSMİ','FATURA TARİHİ','DÖVİZ CİNSİ','DÖVİZ KURU','VADE TARİHİ','TAHSİLAT TL KARŞILIĞI','FATURA TÜRÜ','FATURA SERİ','FATURA SIRA NO','KATEGORİ','HİZMET/ÜRÜN *','HİZMET/ÜRÜN AÇIKLAMASI','ÇIKIŞ DEPOSU *','MİKTAR *','BİRİM FİYATI *','İNDİRİM TUTARI','KDV ORANI *','ÖİV ORANI','KONAKLAMA VERGİSİ ORANI'];
const nKdv=(r?:number)=>{const v=r??20;if(v===0)return 0;if(v===1)return 1;if(v<=9)return 1;if(v<=15)return 10;return 20;};
function parseDT(ds:string):Date{const[dp]=(ds??'').split(' ');const p=dp.split('.');if(p.length!==3)return new Date();return new Date(+p[2],+p[1]-1,+p[0]);}
const xn=(v:number,z='General')=>({t:'n' as const,v,z});
const xd=(v:Date)=>({t:'d' as const,v,z:'yyyy-mm-dd'});
const xs=(v:string)=>({t:'s' as const,v});
const xe=()=>({t:'z' as const,v:null});

async function exportParasut(arr:any[],fname?:string){
  const XLSX=await loadXLSX();
  const inv=arr.filter(s=>s.method!=='Tahsilat');
  const rows:any[][]=[];
  rows.push([xs(PARASUT_HELP),...Array.from({length:19},xe)]);
  rows.push(Array.from({length:20},xe));
  rows.push(PARASUT_HEADERS.map(xs));
  inv.forEach((sale,idx)=>{
    (sale.items??[]).forEach((item:any,ii:number)=>{
      const k=nKdv(item.taxRate),q=item.qty??1,up=item.grossPrice??0;
      if(ii===0)rows.push([xs(sale.customerName||''),xs(`FTR-${String(idx+1).padStart(4,'0')}`),xd(parseDT(sale.date)),xs('TRL'),xe(),xe(),xe(),xs('Fatura'),xs('FTR'),xn(idx+1,'0'),xe(),xs(item.name||''),xe(),xe(),xn(q),xn(up),xn(sale.discountAmount??0),xn(k,'#,##0.00'),xe(),xe()]);
      else rows.push([xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xs(item.name||''),xe(),xe(),xn(q),xn(up),xn(0),xn(k,'#,##0.00'),xe(),xe()]);
    });
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);
  if(ws['A1'])ws['A1'].s={alignment:{wrapText:true,vertical:'top'}};
  ws['!cols']=[30,22,14,12,12,14,22,14,12,14,14,28,28,16,10,16,16,12,10,22].map(wch=>({wch}));
  ws['!rows']=[{hpt:300}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Satış Faturaları');
  XLSX.writeFile(wb,fname||`parasut_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ── FİŞ ŞABLONU ───────────────────────────────────────────────────────────
function ReceiptTemplate({sale,settings,preview=false}:{sale:any;settings:ReceiptSettings;preview?:boolean}){
  if(!sale)return null;
  const pw=PAPER_WIDTHS[settings.paperSize];
  const fsMap={small:0.82,normal:1,large:1.18};
  const fs=fsMap[settings.fontSize];
  const bdr=settings.borderStyle==='thick'?'4px solid black':settings.borderStyle==='thin'?'1px solid #555':'0px solid transparent';
  const hBdr=settings.borderStyle==='none'?'2px solid #e5e7eb':bdr;
  const small=settings.paperSize==='58mm';
  return(
    <div style={{maxWidth:preview?'100%':`${pw}px`,margin:'0 auto',padding:preview?'16px':'28px',background:'white',color:'black',fontFamily:'Arial,sans-serif',fontSize:`${fs}rem`,border:preview?'none':bdr,boxSizing:'border-box'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',paddingBottom:'14px',marginBottom:'14px',borderBottom:hBdr}}>
        <div>
          <div style={{fontSize:`${fs*(small?1.4:2.2)}rem`,fontWeight:900,textTransform:'uppercase',letterSpacing:'-0.02em',lineHeight:1}}>{settings.companyName}</div>
          <div style={{fontSize:`${fs*0.72}rem`,fontWeight:700,color:'#666',marginTop:3}}>{settings.companySubtitle}</div>
          {settings.showAddress&&settings.address&&<div style={{fontSize:`${fs*0.68}rem`,color:'#555',marginTop:2}}>📍 {settings.address}</div>}
          {settings.showPhone&&settings.phone&&<div style={{fontSize:`${fs*0.68}rem`,color:'#555'}}>📞 {settings.phone}</div>}
          {sale.isMerged&&<div style={{fontSize:`${fs*0.62}rem`,fontWeight:700,color:'#666',marginTop:5,background:'#f3f4f6',padding:'2px 6px',borderRadius:4,display:'inline-block'}}>BİRLEŞİK — {sale.mergedCount} satış</div>}
        </div>
        <div style={{textAlign:'right',fontSize:`${fs*0.72}rem`}}>
          <div><strong>TARİH:</strong> {sale.isMerged?new Date().toLocaleDateString('tr-TR'):sale.date?.split(' ')[0]}</div>
          {sale.isMerged&&sale.dateRange&&<div style={{color:'#666'}}><strong>DÖNEM:</strong> {sale.dateRange}</div>}
          {!sale.isMerged&&<div><strong>SAAT:</strong> {sale.date?.split(' ')[1]}</div>}
          <div><strong>FİŞ NO:</strong> #{sale.id?.slice(-6).toUpperCase()}</div>
          {sale.staffName&&<div style={{color:'#888'}}><strong>KASİYER:</strong> {sale.staffName}</div>}
        </div>
      </div>
      <div style={{background:'#f9fafb',border:`2px solid ${settings.borderStyle==='none'?'#e5e7eb':'#000'}`,borderRadius:6,padding:`${small?8:14}px`,marginBottom:14}}>
        <div style={{fontSize:`${fs*(small?0.9:1.1)}rem`,fontWeight:900,textTransform:'uppercase'}}>SAYIN: {sale.customerName}</div>
        {settings.showTaxNo&&<div style={{fontWeight:700,color:'#555',marginTop:3,fontSize:`${fs*0.78}rem`}}>VERGİ/TC: {sale.customerTax||'-'}</div>}
        <div style={{fontWeight:700,color:'#555',marginTop:2,fontSize:`${fs*0.78}rem`}}>ÖDEME: {sale.isMerged?'Cari (Birleşik Dönem)':sale.method}</div>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',marginBottom:20}}>
        <thead><tr style={{borderBottom:hBdr}}>
          <th style={{textAlign:'left',padding:`${fs*7}px 0`,fontSize:`${fs*0.88}rem`}}>ÜRÜN</th>
          <th style={{textAlign:'center',padding:`${fs*7}px 0`,fontSize:`${fs*0.88}rem`}}>ADET</th>
          {settings.showItemTax&&<th style={{textAlign:'center',fontSize:`${fs*0.88}rem`}}>KDV</th>}
          {!small&&<th style={{textAlign:'right',padding:`${fs*7}px 0`,fontSize:`${fs*0.88}rem`}}>BİRİM</th>}
          <th style={{textAlign:'right',padding:`${fs*7}px 0`,fontSize:`${fs*0.88}rem`}}>TOPLAM</th>
        </tr></thead>
        <tbody>{(sale.items||[]).map((item:any,i:number)=>(
          <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
            <td style={{padding:`${fs*5}px 0`,fontWeight:700,fontSize:`${fs*0.85}rem`}}>{item.name}</td>
            <td style={{padding:`${fs*5}px 0`,textAlign:'center',fontWeight:900}}>{item.qty}</td>
            {settings.showItemTax&&<td style={{textAlign:'center',color:'#666',fontSize:`${fs*0.8}rem`}}>%{nKdv(item.taxRate)}</td>}
            {!small&&<td style={{padding:`${fs*5}px 0`,textAlign:'right',color:'#555',fontSize:`${fs*0.85}rem`}}>₺{(item.grossPrice||0).toFixed(2)}</td>}
            <td style={{padding:`${fs*5}px 0`,textAlign:'right',fontWeight:900,fontSize:`${fs*0.9}rem`}}>₺{((item.grossPrice||0)*(item.qty||1)).toFixed(2)}</td>
          </tr>
        ))}</tbody>
      </table>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <div style={{width:small?'100%':'260px',borderTop:hBdr,paddingTop:10}}>
          <div style={{display:'flex',justifyContent:'space-between',color:'#555',marginBottom:4,fontSize:`${fs*0.85}rem`,fontWeight:700}}><span>Ara Toplam:</span><span>₺{(sale.subTotal||sale.total||0).toFixed(2)}</span></div>
          {(sale.discountAmount||0)>0&&<div style={{display:'flex',justifyContent:'space-between',color:'#555',marginBottom:6,paddingBottom:6,borderBottom:'1px solid #e5e7eb',fontSize:`${fs*0.85}rem`,fontWeight:700}}><span>İskonto:</span><span>- ₺{(sale.discountAmount||0).toFixed(2)}</span></div>}
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:`${fs*(small?1.3:1.8)}rem`,marginTop:6}}><span>TOPLAM:</span><span>₺{(sale.total||0).toFixed(2)}</span></div>
        </div>
      </div>
      {(settings.footerLine1||settings.footerLine2)&&(
        <div style={{marginTop:28,textAlign:'center',borderTop:'2px dashed #d1d5db',paddingTop:12,color:'#9ca3af',fontWeight:700,fontSize:`${fs*0.72}rem`}}>
          {settings.footerLine1&&<div>{settings.footerLine1}</div>}
          {settings.footerLine2&&<div style={{marginTop:2}}>{settings.footerLine2}</div>}
        </div>
      )}
    </div>
  );
}

// ── GİRİŞ EKRANI ──────────────────────────────────────────────────────────
function LoginScreen({onLogin}:{onLogin:(staff:any)=>void}){
  const [pin,setPin]=useState('');
  const [staffList,setStaffList]=useState<any[]>([]);
  const [error,setError]=useState('');
  const [selectedStaff,setSelectedStaff]=useState('');

  useEffect(()=>{
    const u=onSnapshot(collection(db,'staff'),s=>setStaffList(s.docs.map(d=>({id:d.id,...d.data()}))));
    return()=>u();
  },[]);

  const handleLogin=()=>{
    const found=staffList.find(s=>s.id===selectedStaff&&s.pin===pin);
    if(found){setError('');onLogin(found);}
    else{setError('PIN hatalı veya personel seçilmedi.');}
  };

  // İlk kurulum — hiç personel yoksa admin oluştur
  const handleCreateAdmin=async()=>{
    if(staffList.length>0)return;
    await addDoc(collection(db,'staff'),{name:'Yönetici',role:'admin',pin:'1234',createdAt:new Date().toLocaleString('tr-TR')});
    alert('Admin oluşturuldu. PIN: 1234');
  };

  return(
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-zinc-950 text-3xl mx-auto mb-4">M</div>
          <h1 className="text-2xl font-black text-white">Merkez Şube</h1>
          <p className="text-zinc-500 text-sm mt-1">Personel Girişi</p>
        </div>

        {staffList.length===0?(
          <div className="text-center">
            <p className="text-zinc-500 mb-4 text-sm">İlk kurulum — yönetici hesabı oluştur</p>
            <button onClick={handleCreateAdmin} className="bg-emerald-500 text-zinc-950 font-black px-8 py-4 rounded-2xl hover:bg-emerald-400 flex items-center gap-2 mx-auto">
              <Key size={20}/> Admin Hesabı Oluştur
            </button>
          </div>
        ):(
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Personel Seç</label>
              <select value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-4 rounded-2xl outline-none focus:border-emerald-500 text-base">
                <option value="">— Personel Seçin —</option>
                {staffList.map(s=><option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">PIN Kodu</label>
              <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} maxLength={6} className="w-full bg-zinc-950 border border-zinc-700 text-white p-4 rounded-2xl outline-none focus:border-emerald-500 text-2xl text-center tracking-widest font-black" placeholder="• • • •"/>
            </div>
            {error&&<p className="text-red-400 text-sm text-center font-bold">{error}</p>}
            <button onClick={handleLogin} className="w-full bg-emerald-500 text-zinc-950 font-black py-4 rounded-2xl text-lg hover:bg-emerald-400 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
              <LogIn size={22}/> Giriş Yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App(){
  // ── Auth ──────────────────────────────────────────────────────────────
  const [currentStaff,setCurrentStaff]=useState<any>(null);

  // ── Data ──────────────────────────────────────────────────────────────
  const [products,setProducts]=useState<any[]>([]);
  const [customers,setCustomers]=useState<any[]>([]);
  const [sales,setSales]=useState<any[]>([]);
  const [expenses,setExpenses]=useState<any[]>([]);
  const [purchases,setPurchases]=useState<any[]>([]);
  const [categories,setCategories]=useState<any[]>([]);
  const [custCategories,setCustCategories]=useState<any[]>([]);
  const [orders,setOrders]=useState<any[]>([]);
  const [returns,setReturns]=useState<any[]>([]);
  const [staffList,setStaffList]=useState<any[]>([]);
  const [staffLogs,setStaffLogs]=useState<any[]>([]);

  // ── Nav ───────────────────────────────────────────────────────────────
  const [activePage,setActivePage]=useState('pos');
  const [stockOpen,setStockOpen]=useState(true);
  const [custDetailTab,setCustDetailTab]=useState<'sales'|'history'|'orders'>('sales');

  // ── POS ───────────────────────────────────────────────────────────────
  const [cart,setCart]=useState<any[]>([]);
  const [searchQuery,setSearchQuery]=useState('');
  const [cartCustomer,setCartCustomer]=useState('');
  const [discountPct,setDiscountPct]=useState('');
  const [flash,setFlash]=useState(false);
  const [lastSale,setLastSale]=useState<any>(null);
  const [isVeresiyeOpen,setIsVeresiyeOpen]=useState(false);
  const [printSale,setPrintSale]=useState<any>(null);
  const [mergedPrint,setMergedPrint]=useState<any>(null);

  // ── Siparişli Satışlar ────────────────────────────────────────────────
  const [orderMode,setOrderMode]=useState(false);
  const [orderCustomer,setOrderCustomer]=useState('');
  const [orderNote,setOrderNote]=useState('');
  const [orderDeliveryDate,setOrderDeliveryDate]=useState('');
  const [editingOrder,setEditingOrder]=useState<any>(null);
  const [editOrderCart,setEditOrderCart]=useState<any[]>([]);
  const [editOrderDiscount,setEditOrderDiscount]=useState('');
  const [orderFilter,setOrderFilter]=useState<'all'|'bekliyor'|'hazirlaniyor'|'gönderildi'|'iptal'>('all');

  // ── İade/Değişim ──────────────────────────────────────────────────────
  const [returnSaleId,setReturnSaleId]=useState('');
  const [returnSale,setReturnSale]=useState<any>(null);
  const [returnLines,setReturnLines]=useState<{itemIdx:number;qty:number;reason:string}[]>([]);
  const [returnType,setReturnType]=useState<'iade'|'degisim'>('iade');
  const [exchangeCart,setExchangeCart]=useState<any[]>([]);
  const [returnNote,setReturnNote]=useState('');

  // ── Ürün ─────────────────────────────────────────────────────────────
  const [showAddForm,setShowAddForm]=useState(false);
  const [pName,setPName]=useState('');const[pBarcode,setPBarcode]=useState('');
  const[pUnit,setPUnit]=useState('Adet');const[pCost,setPCost]=useState('');
  const[pNet,setPNet]=useState('');const[pTax,setPTax]=useState('20');
  const[pStock,setPStock]=useState('0');const[pCat,setPCat]=useState('');
  const[editingProduct,setEditingProduct]=useState<any>(null);
  const[editForm,setEditForm]=useState<any>({});

  // ── Müşteri ───────────────────────────────────────────────────────────
  const [showCustomerForm,setShowCustomerForm]=useState(false);
  const[cName,setCName]=useState('');const[cPhone,setCPhone]=useState('');
  const[cTaxNum,setCTaxNum]=useState('');const[cCat,setCCat]=useState('');
  const[cNote,setCNote]=useState('');
  const[editingCustomer,setEditingCustomer]=useState<any>(null);
  const[editCustForm,setEditCustForm]=useState<any>({});
  const[selectedCustomer,setSelectedCustomer]=useState<any>(null);
  const[filterStart,setFilterStart]=useState('');
  const[filterEnd,setFilterEnd]=useState('');
  const[selectedSaleIds,setSelectedSaleIds]=useState<Set<string>>(new Set());

  // ── Stok ──────────────────────────────────────────────────────────────
  const[stockSearch,setStockSearch]=useState('');
  const[stockCatFilter,setStockCatFilter]=useState('all');
  const[stockFilter,setStockFilter]=useState<'all'|'low'|'out'>('all');
  const[lowStockLimit,setLowStockLimit]=useState(5);
  const[countDraft,setCountDraft]=useState<Record<string,string>>({});
  const[countSaved,setCountSaved]=useState(false);
  const[newCatName,setNewCatName]=useState('');const[newCatColor,setNewCatColor]=useState('#10b981');
  const[newCustCatName,setNewCustCatName]=useState('');const[newCustCatColor,setNewCustCatColor]=useState('#3b82f6');

  // ── Stok Hareketleri filtre ───────────────────────────────────────────
  const[mvStart,setMvStart]=useState('');const[mvEnd,setMvEnd]=useState('');
  const[mvType,setMvType]=useState<'all'|'in'|'out'>('all');

  // ── Alış ──────────────────────────────────────────────────────────────
  const[showPurchaseForm,setShowPurchaseForm]=useState(false);
  const[purchaseSupplier,setPurchaseSupplier]=useState('');
  const[purchaseDate,setPurchaseDate]=useState('');
  const[purchaseNote,setPurchaseNote]=useState('');
  const[purchaseLines,setPurchaseLines]=useState<{productId:string;qty:string;cost:string}[]>([{productId:'',qty:'',cost:''}]);
  const[expandedPurchase,setExpandedPurchase]=useState<string|null>(null);

  // ── Rapor ─────────────────────────────────────────────────────────────
  const[expName,setExpName]=useState('');const[expAmount,setExpAmount]=useState('');
  const[reportDate,setReportDate]=useState(new Date().toISOString().slice(0,10));
  const[reportTab,setReportTab]=useState<'genel'|'gunSonu'|'kdv'|'personel'>('genel');

  // ── Personel ──────────────────────────────────────────────────────────
  const[newStaffName,setNewStaffName]=useState('');
  const[newStaffPin,setNewStaffPin]=useState('');
  const[newStaffRole,setNewStaffRole]=useState<StaffRole>('kasiyer');
  const[staffLogFilter,setStaffLogFilter]=useState('all');
  const[staffLogDateFilter,setStaffLogDateFilter]=useState('');

  // ── Fiş ──────────────────────────────────────────────────────────────
  const[receiptSettings,setReceiptSettings]=useState<ReceiptSettings>(loadSettings);
  const[draftSettings,setDraftSettings]=useState<ReceiptSettings>(loadSettings);
  const[settingsSaved,setSettingsSaved]=useState(false);

  const fileInputRefProd=useRef<HTMLInputElement>(null);
  const CAT_COLORS=['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

  // ── Firebase listeners ────────────────────────────────────────────────
  useEffect(()=>{
    const u1=onSnapshot(collection(db,'products'),s=>setProducts(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2=onSnapshot(collection(db,'customers'),s=>setCustomers(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u3=onSnapshot(collection(db,'sales'),s=>setSales(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u4=onSnapshot(collection(db,'expenses'),s=>setExpenses(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u5=onSnapshot(collection(db,'purchases'),s=>setPurchases(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u6=onSnapshot(collection(db,'categories'),s=>setCategories(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u7=onSnapshot(collection(db,'custCategories'),s=>setCustCategories(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u8=onSnapshot(collection(db,'orders'),s=>setOrders(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u9=onSnapshot(collection(db,'returns'),s=>setReturns(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u10=onSnapshot(collection(db,'staff'),s=>setStaffList(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u11=onSnapshot(collection(db,'staffLogs'),s=>setStaffLogs(s.docs.map(d=>({id:d.id,...d.data()}))));
    return()=>{u1();u2();u3();u4();u5();u6();u7();u8();u9();u10();u11();};
  },[]);

  useEffect(()=>{
    let buf='';
    const hk=(e:KeyboardEvent)=>{
      if((e.target as HTMLElement).tagName==='INPUT'||(e.target as HTMLElement).tagName==='SELECT')return;
      if(e.key==='Enter'){if(buf.length>2){const f=products.find(p=>p.barcode===buf);if(f){setActivePage('pos');addToCart(f);setFlash(true);setTimeout(()=>setFlash(false),300);}buf='';}
      }else if(e.key.length===1){buf+=e.key;}
      setTimeout(()=>{buf='';},200);
    };
    window.addEventListener('keydown',hk);return()=>window.removeEventListener('keydown',hk);
  },[products]);

  useEffect(()=>{if(activePage==='stock.count'){const d:Record<string,string>={};products.forEach(p=>{d[p.id]=String(p.stock||0);});setCountDraft(d);}},[activePage]);
  useEffect(()=>{if(!selectedCustomer){setFilterStart('');setFilterEnd('');setSelectedSaleIds(new Set());setCustDetailTab('sales');}},[selectedCustomer]);

  // ── Log helper ────────────────────────────────────────────────────────
  const logAction=async(action:string,detail:string,amount?:number)=>{
    if(!currentStaff)return;
    await addDoc(collection(db,'staffLogs'),{
      staffId:currentStaff.id,staffName:currentStaff.name,role:currentStaff.role,
      action,detail,amount:amount||0,date:new Date().toLocaleString('tr-TR'),ts:Date.now()
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const calcGross=(net:string,tax:string)=>net?(parseFloat(net)*(1+parseFloat(tax)/100)).toFixed(2):'0.00';
  const catColor=(name:string)=>categories.find(c=>c.name===name)?.color||'#6b7280';
  const custCatColor=(name:string)=>custCategories.find(c=>c.name===name)?.color||'#6b7280';
  const stockColor=(stock:number)=>{
    if(stock===0)return{text:'text-red-500',badge:'bg-red-500',bar:'bg-red-500',ring:'border-red-500/30 bg-red-500/5'};
    if(stock<=lowStockLimit)return{text:'text-orange-400',badge:'bg-orange-400',bar:'bg-orange-400',ring:'border-orange-500/30 bg-orange-500/5'};
    return{text:'text-emerald-400',badge:'bg-emerald-500',bar:'bg-emerald-500',ring:'border-zinc-800 bg-zinc-900/50'};
  };
  const statusConfig:Record<string,{label:string;color:string;bg:string}>={
    'bekliyor':{label:'Bekliyor',color:'text-orange-400',bg:'bg-orange-500/20'},
    'hazirlaniyor':{label:'Hazırlanıyor',color:'text-blue-400',bg:'bg-blue-500/20'},
    'gönderildi':{label:'Gönderildi',color:'text-emerald-400',bg:'bg-emerald-500/20'},
    'iptal':{label:'İptal',color:'text-red-400',bg:'bg-red-500/20'},
  };
  const roleLabel:Record<string,string>={admin:'🔑 Admin',kasiyer:'🛒 Kasiyer',depo:'📦 Depo'};
  const canDo=(action:string)=>{
    if(!currentStaff)return false;
    if(currentStaff.role==='admin')return true;
    const restricted=['personel','rapor.kdv','rapor.personel'];
    if(currentStaff.role==='kasiyer')return!restricted.includes(action);
    if(currentStaff.role==='depo')return['stok','urun'].some(a=>action.startsWith(a));
    return false;
  };

  // ── Product CRUD ──────────────────────────────────────────────────────
  const handleAddProduct=async(e:React.FormEvent)=>{
    e.preventDefault();
    await addDoc(collection(db,'products'),{name:pName,barcode:pBarcode,unit:pUnit,costPrice:parseFloat(pCost)||0,netPrice:parseFloat(pNet),taxRate:parseInt(pTax),grossPrice:parseFloat(calcGross(pNet,pTax)),stock:parseInt(pStock)||0,category:pCat||''});
    await logAction('ÜRÜN_EKLE',`${pName} eklendi`);
    setPName('');setPBarcode('');setPCost('');setPNet('');setPStock('0');setPCat('');setShowAddForm(false);
  };
  const openEditProduct=(p:any)=>{setEditingProduct(p);setEditForm({name:p.name||'',barcode:p.barcode||'',unit:p.unit||'Adet',category:p.category||'',costPrice:String(p.costPrice||''),netPrice:String(p.netPrice||''),taxRate:String(p.taxRate??20),grossPrice:String(p.grossPrice||''),stock:String(p.stock||0)});};
  const handleSaveEdit=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editingProduct)return;
    const net=parseFloat(editForm.netPrice)||0,tax=parseInt(editForm.taxRate)||0;
    const gross=editForm.grossPrice?parseFloat(editForm.grossPrice):parseFloat((net*(1+tax/100)).toFixed(2));
    await updateDoc(doc(db,'products',editingProduct.id),{name:editForm.name,barcode:editForm.barcode,unit:editForm.unit,category:editForm.category,costPrice:parseFloat(editForm.costPrice)||0,netPrice:net,taxRate:tax,grossPrice:gross,stock:parseInt(editForm.stock)||0});
    await logAction('ÜRÜN_DÜZENLE',`${editForm.name} güncellendi`);
    setEditingProduct(null);
  };

  // ── Customer CRUD ─────────────────────────────────────────────────────
  const handleAddCustomer=async(e:React.FormEvent)=>{
    e.preventDefault();
    await addDoc(collection(db,'customers'),{name:cName,phone:cPhone,taxNum:cTaxNum||'-',category:cCat||'',note:cNote||'',balance:0});
    await logAction('MÜŞTERİ_EKLE',`${cName} eklendi`);
    setCName('');setCPhone('');setCTaxNum('');setCCat('');setCNote('');setShowCustomerForm(false);
  };
  const openEditCustomer=(c:any)=>{setEditingCustomer(c);setEditCustForm({name:c.name||'',phone:c.phone||'',taxNum:c.taxNum||'',category:c.category||'',note:c.note||''});};
  const handleSaveCust=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editingCustomer)return;
    await updateDoc(doc(db,'customers',editingCustomer.id),{name:editCustForm.name,phone:editCustForm.phone,taxNum:editCustForm.taxNum,category:editCustForm.category,note:editCustForm.note});
    await logAction('MÜŞTERİ_DÜZENLE',`${editCustForm.name} güncellendi`);
    if(selectedCustomer?.id===editingCustomer.id)setSelectedCustomer((prev:any)=>({...prev,...editCustForm}));
    setEditingCustomer(null);
  };
  const handleTahsilat=async(customer:any)=>{
    const t=window.prompt(`${customer.name} Tahsilat Tutarı (₺):`);
    if(t&&!isNaN(Number(t))){
      await updateDoc(doc(db,'customers',customer.id),{balance:(customer.balance||0)-parseFloat(t)});
      await addDoc(collection(db,'sales'),{total:parseFloat(t),method:'Tahsilat',customerName:customer.name,items:[{name:'Cari Tahsilat',qty:1,grossPrice:parseFloat(t)}],date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
      await logAction('TAHSİLAT',`${customer.name} — ₺${t}`,parseFloat(t));
    }
  };

  // ── Cart ──────────────────────────────────────────────────────────────
  const addToCart=(p:any)=>{setCart(prev=>{const ex=prev.find((i:any)=>i.id===p.id);if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:i.qty+1}:i);return[...prev,{...p,qty:1}];});setSearchQuery('');};
  const rawTotal=cart.reduce((t:number,i:any)=>t+((i.grossPrice||0)*i.qty),0);
  const totalCostCart=cart.reduce((t:number,i:any)=>t+((i.costPrice||0)*i.qty),0);
  const discountVal=parseFloat(discountPct)||0;
  const discountAmount=rawTotal*(discountVal/100);
  const finalTotal=rawTotal-discountAmount;

  // ── Finish Sale ───────────────────────────────────────────────────────
  const finishSale=async(method:string)=>{
    if(cart.length===0)return;
    if(method==='Veresiye'&&!cartCustomer)return alert('Veresiye satış için Müşteri seçmelisiniz!');
    const ac=customers.find((c:any)=>c.id===cartCustomer);
    const sd={items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,totalCost:totalCostCart,total:finalTotal,method,customerName:ac?ac.name:'Perakende Müşteri',customerTax:ac?ac.taxNum:'-',date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name};
    const ref=await addDoc(collection(db,'sales'),sd);
    if(method==='Veresiye'&&ac)await updateDoc(doc(db,'customers',ac.id),{balance:(ac.balance||0)+finalTotal});
    for(const item of cart){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-item.qty)});}
    await logAction('SATIŞ',`${ac?ac.name:'Perakende'} — ${method} — ₺${finalTotal.toFixed(2)}`,finalTotal);
    setLastSale({id:ref.id,...sd});setCart([]);setCartCustomer('');setDiscountPct('');setIsVeresiyeOpen(false);
  };

  // ── Siparişli Satış ───────────────────────────────────────────────────
  const handleCreateOrder=async()=>{
    if(cart.length===0)return alert('Sepet boş!');
    const ac=customers.find((c:any)=>c.id===orderCustomer);
    await addDoc(collection(db,'orders'),{
      items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,total:finalTotal,
      customerName:ac?ac.name:'Müşteri belirtilmemiş',customerTax:ac?ac.taxNum:'-',
      customerId:orderCustomer||'',note:orderNote,deliveryDate:orderDeliveryDate||'',
      status:'bekliyor',createdAt:new Date().toLocaleString('tr-TR'),updatedAt:new Date().toLocaleString('tr-TR'),
      staffId:currentStaff?.id,staffName:currentStaff?.name,
    });
    await logAction('SİPARİŞ_OLUŞTUR',`${ac?ac.name:'Müşteri yok'} — ₺${finalTotal.toFixed(2)}`,finalTotal);
    setCart([]);setCartCustomer('');setDiscountPct('');setOrderCustomer('');setOrderNote('');setOrderDeliveryDate('');setOrderMode(false);
    alert('Sipariş oluşturuldu!');
  };
  const handleOrderStatus=async(orderId:string,newStatus:string)=>{
    const order=orders.find(o=>o.id===orderId);
    await updateDoc(doc(db,'orders',orderId),{status:newStatus,updatedAt:new Date().toLocaleString('tr-TR')});
    await logAction('SİPARİŞ_DURUM',`#${orderId.slice(-5)} → ${newStatus}`);
    if(newStatus==='gönderildi'&&order){
      const ac=customers.find((c:any)=>c.id===order.customerId);
      const sd={items:order.items,subTotal:order.subTotal,discountPct:order.discountPct,discountAmount:order.discountAmount,totalCost:0,total:order.total,method:order.customerId?'Veresiye':'Nakit',customerName:order.customerName,customerTax:order.customerTax,date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name,fromOrderId:orderId};
      await addDoc(collection(db,'sales'),sd);
      if(ac)await updateDoc(doc(db,'customers',ac.id),{balance:(ac.balance||0)+order.total});
      for(const item of(order.items||[])){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-item.qty)});}
    }
  };
  const handleUpdateOrder=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editingOrder)return;
    const rawT=editOrderCart.reduce((t:number,i:any)=>t+((i.grossPrice||0)*i.qty),0);
    const dv=parseFloat(editOrderDiscount)||0;const dAmt=rawT*(dv/100);
    await updateDoc(doc(db,'orders',editingOrder.id),{items:editOrderCart,subTotal:rawT,discountPct:dv,discountAmount:dAmt,total:rawT-dAmt,updatedAt:new Date().toLocaleString('tr-TR')});
    await logAction('SİPARİŞ_DÜZENLE',`#${editingOrder.id.slice(-5)} güncellendi`);
    setEditingOrder(null);setEditOrderCart([]);setEditOrderDiscount('');
  };

  // ── İade / Değişim ────────────────────────────────────────────────────
  const lookupSale=()=>{
    const found=sales.find(s=>s.id===returnSaleId||s.id.slice(-6).toUpperCase()===returnSaleId.toUpperCase());
    if(found){setReturnSale(found);setReturnLines((found.items||[]).map((_:any,i:number)=>({itemIdx:i,qty:0,reason:''})));}
    else alert('Satış bulunamadı. Fiş numarasını kontrol edin.');
  };
  const handleSubmitReturn=async()=>{
    if(!returnSale)return;
    const lines=returnLines.filter(l=>l.qty>0);
    if(lines.length===0)return alert('En az bir ürün seçin.');
    const returnItems=lines.map(l=>({...returnSale.items[l.itemIdx],qty:l.qty,reason:l.reason}));
    const returnTotal=returnItems.reduce((a:number,b:any)=>a+(b.grossPrice||0)*b.qty,0);
    await addDoc(collection(db,'returns'),{
      type:returnType,originalSaleId:returnSale.id,customerName:returnSale.customerName,
      items:returnItems,total:returnTotal,exchangeItems:returnType==='degisim'?exchangeCart:[],
      exchangeTotal:exchangeCart.reduce((a:number,b:any)=>a+(b.grossPrice||0)*b.qty,0),
      note:returnNote,date:new Date().toLocaleString('tr-TR'),
      staffId:currentStaff?.id,staffName:currentStaff?.name,status:'tamamlandı'
    });
    // Stok geri yükle
    for(const item of returnItems){const p=products.find(p=>p.name===item.name||p.id===item.id);if(p)await updateDoc(doc(db,'products',p.id),{stock:(p.stock||0)+item.qty});}
    // Cari iade — müşteri bakiyesini düşür (iade = ödeme geri)
    if(returnSale.customerName&&returnSale.customerName!=='Perakende Müşteri'&&returnType==='iade'){
      const cust=customers.find(c=>c.name===returnSale.customerName);
      if(cust)await updateDoc(doc(db,'customers',cust.id),{balance:(cust.balance||0)-returnTotal});
    }
    await logAction('İADE',`#${returnSale.id.slice(-5)} — ₺${returnTotal.toFixed(2)}`,returnTotal);
    alert(`${returnType==='iade'?'İade':'Değişim'} tamamlandı!`);
    setReturnSale(null);setReturnSaleId('');setReturnLines([]);setExchangeCart([]);setReturnNote('');
  };

  // ── Purchases ─────────────────────────────────────────────────────────
  const handleSavePurchase=async(e:React.FormEvent)=>{
    e.preventDefault();
    const lines=purchaseLines.filter(l=>l.productId&&l.qty);
    if(lines.length===0)return alert('En az bir ürün satırı doldurun.');
    const items=lines.map(l=>{const p=products.find(p=>p.id===l.productId);return{productId:l.productId,productName:p?.name||'',qty:parseInt(l.qty)||1,cost:parseFloat(l.cost)||0};});
    const totalCostVal=items.reduce((a,b)=>a+b.qty*b.cost,0);
    await addDoc(collection(db,'purchases'),{supplier:purchaseSupplier,date:purchaseDate||new Date().toISOString().slice(0,10),note:purchaseNote,items,totalCost:totalCostVal,createdAt:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
    for(const item of items){const p=products.find(p=>p.id===item.productId);if(p){const upd:any={stock:(p.stock||0)+item.qty};if(item.cost>0)upd.costPrice=item.cost;await updateDoc(doc(db,'products',item.productId),upd);}}
    await logAction('ALIŞ',`${purchaseSupplier||'Tedarikçi'} — ₺${totalCostVal.toFixed(2)}`,totalCostVal);
    setPurchaseSupplier('');setPurchaseDate('');setPurchaseNote('');setPurchaseLines([{productId:'',qty:'',cost:''}]);setShowPurchaseForm(false);
  };

  const handleSaveCount=async()=>{for(const[id,val]of Object.entries(countDraft)){const n=parseInt(val);if(!isNaN(n))await updateDoc(doc(db,'products',id),{stock:n});}await logAction('STOK_SAYIM','Fiziksel sayım tamamlandı');setCountSaved(true);setTimeout(()=>setCountSaved(false),2500);};
  const handleAddCategory=async(e:React.FormEvent)=>{e.preventDefault();if(!newCatName.trim())return;await addDoc(collection(db,'categories'),{name:newCatName.trim(),color:newCatColor});setNewCatName('');};
  const handleAddCustCategory=async(e:React.FormEvent)=>{e.preventDefault();if(!newCustCatName.trim())return;await addDoc(collection(db,'custCategories'),{name:newCustCatName.trim(),color:newCustCatColor});setNewCustCatName('');};
  const handleAddExpense=async(e:React.FormEvent)=>{e.preventDefault();await addDoc(collection(db,'expenses'),{name:expName,amount:parseFloat(expAmount)||0,date:new Date().toISOString()});await logAction('GİDER',`${expName} — ₺${expAmount}`,parseFloat(expAmount)||0);setExpName('');setExpAmount('');};
  const handleAddStaff=async(e:React.FormEvent)=>{e.preventDefault();if(!newStaffName||!newStaffPin)return;await addDoc(collection(db,'staff'),{name:newStaffName,role:newStaffRole,pin:newStaffPin,createdAt:new Date().toLocaleString('tr-TR')});await logAction('PERSONEL_EKLE',`${newStaffName} (${newStaffRole}) eklendi`);setNewStaffName('');setNewStaffPin('');};

  const dlCSV=(d:any[][],h:string[],f:string)=>{const c='data:text/csv;charset=utf-8,\uFEFF'+[h.join(','),...d.map(r=>r.join(','))].join('\n');const a=document.createElement('a');a.href=encodeURI(c);a.download=f;a.click();};
  const exportProducts=()=>dlCSV(products.map(p=>[(p.name||'').replace(/,/g,''),p.barcode||'',p.unit||'',p.category||'',p.costPrice||0,p.grossPrice||0,p.stock||0]),['Urun','Barkod','Birim','Kategori','Alis','Satis','Stok'],'urunler.csv');
  const exportCustomers=()=>dlCSV(customers.map(c=>[(c.name||'').replace(/,/g,''),c.taxNum||'',c.phone||'',c.category||'',c.balance||0]),['Musteri','Vergi','Tel','Kategori','Bakiye'],'musteriler.csv');
  const importProducts=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=async(ev)=>{const rows=(ev.target?.result as string).split('\n').slice(1);for(const row of rows){const c=row.split(',');if(c.length>=4&&c[0].trim()!=='')await addDoc(collection(db,'products'),{name:c[0],barcode:c[1],unit:c[2],category:c[3]||'',costPrice:parseFloat(c[4])||0,grossPrice:parseFloat(c[5])||0,stock:parseInt(c[6])||0});}alert('İçeri aktarıldı!');};r.readAsText(file);};

  // ── Totals ────────────────────────────────────────────────────────────
  const totalIncome=sales.reduce((a,b)=>a+(b.total||0),0);
  const totalExpenseSum=expenses.reduce((a,b)=>a+(b.amount||0),0);
  const totalCogs=sales.filter(s=>s.method!=='Tahsilat').reduce((a,b)=>a+(b.totalCost||0),0);
  const netProfit=totalIncome-totalCogs-totalExpenseSum;
  const outOfStock=products.filter(p=>(p.stock||0)===0).length;
  const lowStock=products.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit).length;
  const totalStockValue=products.reduce((a,b)=>a+((b.stock||0)*(b.costPrice||0)),0);

  // ── Report calcs ──────────────────────────────────────────────────────
  const reportSales=useMemo(()=>{const d=new Date(reportDate);return sales.filter(s=>{const sd=parseDT(s.date);return sd.getFullYear()===d.getFullYear()&&sd.getMonth()===d.getMonth()&&sd.getDate()===d.getDate();});},[sales,reportDate]);
  const reportExpenses=useMemo(()=>{const d=new Date(reportDate);return expenses.filter(e=>{try{const ed=new Date(e.date);return ed.getFullYear()===d.getFullYear()&&ed.getMonth()===d.getMonth()&&ed.getDate()===d.getDate();}catch{return false;}});},[expenses,reportDate]);
  const daySalesTotal=reportSales.filter(s=>s.method!=='Tahsilat').reduce((a,b)=>a+(b.total||0),0);
  const dayNakit=reportSales.filter(s=>s.method==='Nakit').reduce((a,b)=>a+(b.total||0),0);
  const dayKart=reportSales.filter(s=>s.method==='Kart').reduce((a,b)=>a+(b.total||0),0);
  const dayVeresiye=reportSales.filter(s=>s.method==='Veresiye').reduce((a,b)=>a+(b.total||0),0);
  const dayTahsilat=reportSales.filter(s=>s.method==='Tahsilat').reduce((a,b)=>a+(b.total||0),0);
  const dayExpense=reportExpenses.reduce((a,b)=>a+(b.amount||0),0);
  const dayCashNet=dayNakit+dayTahsilat-dayExpense;
  const kdvBreakdown=useMemo(()=>{const map:Record<number,{base:number;kdv:number;gross:number}>={};sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const r=nKdv(item.taxRate);if(!map[r])map[r]={base:0,kdv:0,gross:0};const g=(item.grossPrice||0)*(item.qty||1);const b=g/(1+r/100);map[r].gross+=g;map[r].base+=b;map[r].kdv+=g-b;});});return Object.entries(map).sort((a,b)=>Number(a[0])-Number(b[0]));},[sales]);
  const dayKdvBreakdown=useMemo(()=>{const map:Record<number,{base:number;kdv:number;gross:number}>={};reportSales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const r=nKdv(item.taxRate);if(!map[r])map[r]={base:0,kdv:0,gross:0};const g=(item.grossPrice||0)*(item.qty||1);const b=g/(1+r/100);map[r].gross+=g;map[r].base+=b;map[r].kdv+=g-b;});});return Object.entries(map).sort((a,b)=>Number(a[0])-Number(b[0]));},[reportSales]);

  // ── Stock filter ──────────────────────────────────────────────────────
  const filteredStockProducts=useMemo(()=>{let list=[...products];if(stockSearch)list=list.filter(p=>(p.name||'').toLowerCase().includes(stockSearch.toLowerCase())||(p.barcode||'').includes(stockSearch));if(stockCatFilter!=='all')list=list.filter(p=>p.category===stockCatFilter);if(stockFilter==='out')list=list.filter(p=>(p.stock||0)===0);if(stockFilter==='low')list=list.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit);return list.sort((a,b)=>(a.stock||0)-(b.stock||0));},[products,stockSearch,stockCatFilter,stockFilter,lowStockLimit]);

  // ── Customer detail ───────────────────────────────────────────────────
  const customerSales=useMemo(()=>{if(!selectedCustomer)return[];return sales.filter(s=>s.customerName===selectedCustomer.name&&s.method!=='Tahsilat').sort((a,b)=>parseDT(b.date).getTime()-parseDT(a.date).getTime());},[sales,selectedCustomer]);
  const filteredSales=useMemo(()=>customerSales.filter(s=>{const d=parseDT(s.date);if(filterStart&&d<new Date(filterStart))return false;if(filterEnd){const t=new Date(filterEnd);t.setHours(23,59,59);if(d>t)return false;}return true;}),[customerSales,filterStart,filterEnd]);
  // Müşteri ürün geçmişi — hangi ürünü ne zaman aldı
  const customerProductHistory=useMemo(()=>{
    if(!selectedCustomer)return[];
    const map:Record<string,{name:string;totalQty:number;totalSpent:number;dates:string[];lastDate:string}> = {};
    customerSales.forEach(s=>{
      (s.items||[]).forEach((item:any)=>{
        const key=item.name||'?';
        if(!map[key])map[key]={name:key,totalQty:0,totalSpent:0,dates:[],lastDate:''};
        map[key].totalQty+=(item.qty||1);
        map[key].totalSpent+=(item.grossPrice||0)*(item.qty||1);
        map[key].dates.push(s.date?.split(' ')[0]||s.date);
      });
    });
    return Object.values(map).sort((a,b)=>b.totalQty-a.totalQty);
  },[customerSales,selectedCustomer]);

  const allFiltSel=filteredSales.length>0&&filteredSales.every(s=>selectedSaleIds.has(s.id));
  const toggleSale=(id:string)=>setSelectedSaleIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>{if(allFiltSel){setSelectedSaleIds(prev=>{const n=new Set(prev);filteredSales.forEach(s=>n.delete(s.id));return n;});}else{setSelectedSaleIds(prev=>{const n=new Set(prev);filteredSales.forEach(s=>n.add(s.id));return n;});}};
  const selSales=customerSales.filter(s=>selectedSaleIds.has(s.id));
  const selTotal=selSales.reduce((a,b)=>a+(b.total||0),0);
  const buildMerged=()=>{const sorted=[...selSales].sort((a,b)=>parseDT(a.date).getTime()-parseDT(b.date).getTime());const allItems:any[]=[];sorted.forEach(s=>(s.items||[]).forEach((i:any)=>allItems.push(i)));const dr=sorted.length>0?`${parseDT(sorted[0].date).toLocaleDateString('tr-TR')} – ${parseDT(sorted[sorted.length-1].date).toLocaleDateString('tr-TR')}`:'';return{id:`MRG-${Date.now()}`,customerName:selectedCustomer?.name||'',customerTax:selectedCustomer?.taxNum||'-',method:'Veresiye',date:new Date().toLocaleString('tr-TR'),dateRange:dr,items:allItems,subTotal:sorted.reduce((a,b)=>a+(b.subTotal||b.total||0),0),discountAmount:sorted.reduce((a,b)=>a+(b.discountAmount||0),0),discountPct:0,total:selTotal,isMerged:true,mergedCount:sorted.length};};
  const handleMergedPrint=()=>{setMergedPrint(buildMerged());setTimeout(()=>window.print(),150);};
  const handleMergedXlsx=async()=>{const cn=(selectedCustomer?.name||'musteri').replace(/[^a-zA-Z0-9_]/g,'_');await exportParasut(selSales,`parasut_${cn}_${new Date().toISOString().slice(0,10)}.xlsx`);};

  // ── Receipt ───────────────────────────────────────────────────────────
  const saveRSettings=()=>{setReceiptSettings({...draftSettings});saveSettingsLS(draftSettings);setSettingsSaved(true);setTimeout(()=>setSettingsSaved(false),2000);};
  const upDraft=(k:keyof ReceiptSettings,v:any)=>setDraftSettings(prev=>({...prev,[k]:v}));

  const activePrintData=mergedPrint||printSale||lastSale;
  const demoSale={id:'DEMO123456',customerName:'Örnek Müşteri A.Ş.',customerTax:'1234567890',method:'Veresiye',date:'16.03.2026 14:30:00',staffName:'Kasiyer',items:[{name:'Dove Sabun 100gr',qty:5,grossPrice:60,taxRate:20},{name:'Ariel Deterjan 3kg',qty:2,grossPrice:185,taxRate:20}],subTotal:780,discountAmount:30,discountPct:4,total:750};

  const Field=({label,icon,value,onChange,placeholder='',type='text'}:{label:string;icon?:React.ReactNode;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string})=>(
    <div className="space-y-1.5"><label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wide">{icon}{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none focus:border-emerald-500 text-sm"/></div>
  );
  const Toggle=({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void})=>(
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/40"><span className="text-zinc-300 text-sm font-medium">{label}</span><button onClick={()=>onChange(!value)} className={`w-11 h-6 rounded-full relative transition-all ${value?'bg-emerald-500':'bg-zinc-700'}`}><span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value?'left-5':'left-0.5'}`}/></button></div>
  );

  // ── Login gate ────────────────────────────────────────────────────────
  if(!currentStaff) return <LoginScreen onLogin={staff=>{setCurrentStaff(staff);logAction('GİRİŞ','Sisteme giriş yapıldı');}}/>;

  return(
    <>
    <div className={`flex h-screen text-zinc-100 transition-colors duration-300 print:hidden ${flash?'bg-emerald-900':'bg-zinc-950'}`}>

      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-zinc-950 text-base">M</div>
            <div><h1 className="font-bold text-sm text-white">Merkez Şube</h1><p className="text-[10px] text-zinc-500">Perakende Şubesi</p></div>
          </div>
          <ChevronDown size={14} className="text-zinc-500"/>
        </div>
        {/* Aktif personel */}
        <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center"><UserCheck size={14} className="text-emerald-400"/></div>
            <div><p className="text-white text-xs font-black">{currentStaff.name}</p><p className="text-zinc-600 text-[10px]">{roleLabel[currentStaff.role]||currentStaff.role}</p></div>
          </div>
          <button onClick={()=>{logAction('ÇIKIŞ','Sistemden çıkış yapıldı');setCurrentStaff(null);}} className="text-zinc-600 hover:text-red-400 transition-colors" title="Çıkış"><LogOut size={15}/></button>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
          {[{p:'pos',icon:<ShoppingCart size={16}/>,label:'Hızlı Satış'},{p:'orders',icon:<ShoppingBag size={16}/>,label:'Siparişli Satışlar',badge:orders.filter(o=>o.status==='bekliyor'||o.status==='hazirlaniyor').length||null},{p:'returns',icon:<RefreshCw size={16}/>,label:'İade / Değişim'},{p:'purchases',icon:<ArrowDownToLine size={16}/>,label:'Alış Faturaları'}].map(t=>(
            <button key={t.p} onClick={()=>setActivePage(t.p)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${activePage===t.p?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
              {t.icon}<span className="flex-1 text-left">{t.label}</span>
              {(t as any).badge&&<span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{(t as any).badge}</span>}
            </button>
          ))}

          <div className="mt-1">
            <button onClick={()=>setStockOpen(!stockOpen)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${activePage.startsWith('stock')?'text-white':'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
              <Boxes size={16} className={activePage.startsWith('stock')?'text-emerald-400':''}/><span className="flex-1 text-left">Stok</span>
              {outOfStock>0&&<span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full mr-1">{outOfStock}</span>}
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${stockOpen?'':'rotate-[-90deg]'}`}/>
            </button>
            {stockOpen&&<div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-3">
              {[{p:'stock.products',icon:<Package size={14}/>,label:'Ürünler'},{p:'stock.category',icon:<FolderOpen size={14}/>,label:'Kategoriler'},{p:'stock.movements',icon:<ArrowUpDown size={14}/>,label:'Stok Hareketleri'},{p:'stock.count',icon:<ClipboardCheck size={14}/>,label:'Stok Sayım'},{p:'stock.tracking',icon:<Boxes size={14}/>,label:'Stok Takibi'}].map(item=>(
                <button key={item.p} onClick={()=>setActivePage(item.p)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${activePage===item.p?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-500 hover:bg-zinc-800 hover:text-white'}`}>{item.icon}<span>{item.label}</span></button>
              ))}</div>}
          </div>

          <button onClick={()=>setActivePage('customers')} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 ${activePage==='customers'||activePage==='customers.categories'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><Users size={16}/><span className="flex-1 text-left">Müşteri & Tedarikçi</span></button>
          <div className="border-t border-zinc-800/60 my-2"/>
          <button onClick={()=>setActivePage('reports')} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${activePage==='reports'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><BarChart3 size={16}/><span>Rapor & Analiz</span></button>
          {currentStaff.role==='admin'&&<button onClick={()=>setActivePage('personel')} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${activePage==='personel'||activePage==='personel.logs'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><UserCog size={16}/><span>Personel</span></button>}
          <button onClick={()=>setActivePage('receipt')} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${activePage==='receipt'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><Palette size={16}/><span>Fiş Tasarımı</span></button>
        </nav>
      </aside>

      <main className="flex-1 flex overflow-hidden">

        {/* ═══ POS ══════════════════════════════════════════════════════ */}
        {activePage==='pos'&&(
          <div className="flex w-full">
            <div className="flex-1 p-5 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1"><Search className="absolute left-3.5 top-3 text-zinc-500" size={16}/><input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Ürün adı veya barkod..." className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-emerald-500 text-sm"/></div>
                <button onClick={()=>setOrderMode(!orderMode)} className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${orderMode?'bg-orange-500 text-zinc-950 border-orange-500':'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-orange-400 hover:text-orange-400'}`}><ShoppingBag size={15}/>{orderMode?'Sipariş Modu':'Sipariş Oluştur'}</button>
              </div>
              {orderMode&&<div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
                <span className="text-orange-400 font-bold text-xs">🛍 Sipariş Modu</span>
                <select value={orderCustomer} onChange={e=>setOrderCustomer(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm outline-none"><option value="">— Müşteri Seç —</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <input value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="Not..." className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm outline-none flex-1 min-w-[120px]"/>
                <div className="flex items-center gap-2"><label className="text-zinc-500 text-xs font-bold">Teslim:</label><input type="date" value={orderDeliveryDate} onChange={e=>setOrderDeliveryDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm outline-none"/></div>
              </div>}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-4 gap-3 content-start">
                {products.filter(p=>(p.name||'').toLowerCase().includes(searchQuery.toLowerCase())||(p.barcode||'').includes(searchQuery)).map(p=>(
                  <button key={p.id} onClick={()=>addToCart(p)} className={`border p-4 rounded-2xl text-left hover:border-emerald-500 transition-all flex flex-col justify-between h-32 group ${(p.stock||0)===0?'bg-zinc-900/50 border-red-900/30 opacity-60':'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50'}`}>
                    <span className="font-bold text-zinc-200 group-hover:text-emerald-400 line-clamp-2 text-sm">{p.name||'İsimsiz'}</span>
                    <div>
                      {p.category&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block" style={{background:catColor(p.category)+'33',color:catColor(p.category)}}>{p.category}</span>}
                      <div className="flex justify-between items-center"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(p.stock||0)===0?'bg-red-900/40 text-red-400':(p.stock||0)<=lowStockLimit?'bg-orange-900/30 text-orange-400':'bg-zinc-800 text-zinc-500'}`}>S:{p.stock||0}</span><span className="text-xl font-black text-white">₺{p.grossPrice||0}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl">
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2 mb-3 font-black text-base"><ShoppingCart className="text-emerald-500" size={17}/>{orderMode?'📦 YENİ SİPARİŞ':'SATIŞ FİŞİ'}</div>
                {!orderMode&&<select value={cartCustomer} onChange={e=>setCartCustomer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm font-bold"><option value="">-- Perakende --</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.map((item:any)=>(
                  <div key={item.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <div className="flex-1 min-w-0"><div className="text-sm font-bold text-zinc-300 truncate">{item.name}</div><div className="text-emerald-500 font-black text-sm">₺{((item.grossPrice||0)*item.qty).toFixed(2)}</div></div>
                    <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 mx-2">
                      <button onClick={()=>setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:Math.max(1,i.qty-1)}:i))} className="text-zinc-500 hover:text-emerald-500"><MinusCircle size={19}/></button>
                      <span className="w-5 text-center font-black text-sm">{item.qty}</span>
                      <button onClick={()=>setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:i.qty+1}:i))} className="text-zinc-500 hover:text-emerald-500"><PlusCircle size={19}/></button>
                    </div>
                    <button onClick={()=>setCart(cart.filter((i:any)=>i.id!==item.id))} className="text-red-900 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm"><Percent size={13}/> İskonto</div>
                  <div className="flex items-center gap-1"><span className="text-zinc-500 text-sm">%</span><input type="number" min="0" max="100" value={discountPct} onChange={e=>setDiscountPct(e.target.value)} placeholder="0" className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-center text-white outline-none text-sm font-bold"/></div>
                </div>
                <div className="flex justify-between text-zinc-500 text-sm font-bold mb-1"><span>Ara Toplam:</span><span>₺{rawTotal.toFixed(2)}</span></div>
                {discountAmount>0&&<div className="flex justify-between text-emerald-500 text-sm font-bold mb-1 border-b border-zinc-800 pb-1"><span>İndirim:</span><span>-₺{discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-2xl font-black mb-4 text-white tracking-tighter mt-2"><span>TOPLAM:</span><span>₺{finalTotal.toFixed(2)}</span></div>
                {orderMode?(
                  <button onClick={handleCreateOrder} className="w-full bg-orange-500 py-4 rounded-2xl font-black text-zinc-950 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2"><ShoppingBag size={17}/> SİPARİŞ OLUŞTUR & BEKLET</button>
                ):(
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button onClick={()=>finishSale('Nakit')} className="bg-zinc-800 hover:bg-zinc-700 py-3.5 rounded-2xl font-bold border border-zinc-700 active:scale-95 text-sm">NAKİT</button>
                      <button onClick={()=>finishSale('Kart')} className="bg-zinc-800 hover:bg-zinc-700 py-3.5 rounded-2xl font-bold border border-zinc-700 active:scale-95 text-sm">KART</button>
                    </div>
                    <button onClick={()=>setIsVeresiyeOpen(true)} className="w-full bg-emerald-500 py-4 rounded-2xl font-black text-zinc-950 hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20 text-sm">VERESİYE YAZ</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SİPARİŞLİ SATIŞLAR ═══════════════════════════════════════ */}
        {activePage==='orders'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-3xl font-black flex items-center gap-3"><ShoppingBag className="text-orange-400"/> Siparişli Satışlar</h2><p className="text-zinc-500 text-sm mt-0.5">Bekleyen ve işlemdeki siparişleri yönet</p></div>
              <button onClick={()=>{setOrderMode(true);setActivePage('pos');}} className="bg-orange-500 hover:bg-orange-400 text-zinc-950 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm"><Plus size={17}/> Yeni Sipariş (POS)</button>
            </div>

            {/* Filtre çubuğu */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {(['all','bekliyor','hazirlaniyor','gönderildi','iptal'] as const).map(s=>{
                const cnt=s==='all'?orders.length:orders.filter(o=>o.status===s).length;
                const sc=statusConfig[s];
                return(
                  <button key={s} onClick={()=>setOrderFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-1.5 ${orderFilter===s?(s==='all'?'bg-zinc-600 text-white border-zinc-500':'bg-zinc-700 text-white border-zinc-600'):' bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                    {s==='all'?'Tümü':sc?.label} <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${sc?.bg} ${sc?.color}`}>{cnt}</span>
                  </button>
                );
              })}
            </div>

            {/* Özet */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {(['bekliyor','hazirlaniyor','gönderildi','iptal'] as const).map(s=>{const cnt=orders.filter(o=>o.status===s).length;const sc=statusConfig[s];return(<div key={s} className={`p-4 rounded-2xl border ${sc.bg.replace('bg-','border-').replace('/20','/30')} ${sc.bg}`}><p className={`text-xs font-bold uppercase mb-1 ${sc.color}`}>{sc.label}</p><p className={`text-3xl font-black ${sc.color}`}>{cnt}</p></div>);})}
            </div>

            <div className="space-y-4">
              {orders.filter(o=>orderFilter==='all'||o.status===orderFilter).slice().reverse().map((order:any)=>{
                const sc=statusConfig[order.status]||statusConfig['bekliyor'];
                return(
                  <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-4 p-5">
                      <div className="bg-zinc-800 px-3 py-2 rounded-xl text-center min-w-[72px] shrink-0">
                        <p className="text-zinc-500 text-[9px] font-bold uppercase">Sipariş</p>
                        <p className="text-white font-black text-sm">#{order.id?.slice(-5).toUpperCase()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white">{order.customerName||'Müşteri yok'}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          {order.deliveryDate&&<span className="text-xs text-zinc-500 flex items-center gap-1"><CalendarDays size={11}/> Teslim: {order.deliveryDate}</span>}
                        </div>
                        <div className="text-zinc-500 text-xs mt-0.5">{order.createdAt}{order.note&&<span className="text-zinc-600"> · {order.note}</span>}</div>
                        {order.staffName&&<div className="text-zinc-600 text-[10px]">Oluşturan: {order.staffName}</div>}
                      </div>
                      <div className="text-right mr-2 shrink-0">
                        <div className="text-2xl font-black text-white">₺{(order.total||0).toFixed(2)}</div>
                        <div className="text-zinc-600 text-xs">{(order.items||[]).length} kalem · {(order.items||[]).reduce((a:number,i:any)=>a+(i.qty||0),0)} adet</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {order.status==='bekliyor'&&<>
                          <button onClick={()=>handleOrderStatus(order.id,'hazirlaniyor')} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Clock size={12}/> Hazırla</button>
                          <button onClick={()=>{setEditingOrder(order);setEditOrderCart([...(order.items||[])]);setEditOrderDiscount(String(order.discountPct||0));}} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Pencil size={12}/> Düzenle</button>
                        </>}
                        {order.status==='hazirlaniyor'&&<>
                          <button onClick={()=>handleOrderStatus(order.id,'gönderildi')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><SendHorizonal size={12}/> Gönderildi</button>
                        </>}
                        {(order.status==='bekliyor'||order.status==='hazirlaniyor')&&<button onClick={()=>handleOrderStatus(order.id,'iptal')} className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Ban size={12}/> İptal</button>}
                        {order.status==='gönderildi'&&<span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={13}/> Satışa Dönüştürüldü</span>}
                      </div>
                    </div>
                    <div className="border-t border-zinc-800/50 px-5 pb-3">
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {(order.items||[]).map((item:any,i:number)=>(
                          <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl font-medium">{item.name} <span className="font-black text-white">×{item.qty}</span> <span className="text-zinc-500">₺{((item.grossPrice||0)*item.qty).toFixed(2)}</span></span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              {orders.filter(o=>orderFilter==='all'||o.status===orderFilter).length===0&&<div className="text-center text-zinc-600 py-16 font-bold text-lg">Bu filtrede sipariş yok.</div>}
            </div>
          </div>
        )}

        {/* ═══ İADE / DEĞİŞİM ══════════════════════════════════════════ */}
        {activePage==='returns'&&(
          <div className="p-7 w-full overflow-y-auto">
            <h2 className="text-3xl font-black flex items-center gap-3 mb-6"><RefreshCw className="text-red-400"/> İade & Değişim</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sol — Yeni İade/Değişim */}
              <div className="space-y-5">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                  <h3 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2"><ArrowLeftRight size={18} className="text-red-400"/> Yeni İade / Değişim</h3>
                  <div className="flex gap-2 mb-5">
                    {([['iade','🔄 İade'],['degisim','🔁 Değişim']] as const).map(([t,l])=>(
                      <button key={t} onClick={()=>setReturnType(t)} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${returnType===t?t==='iade'?'bg-red-500 text-white border-red-500':'bg-blue-500 text-white border-blue-500':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{l}</button>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-4">
                    <input value={returnSaleId} onChange={e=>setReturnSaleId(e.target.value)} placeholder="Fiş no (son 6 karakter veya tam ID)..." className="flex-1 bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none focus:border-red-500 text-sm"/>
                    <button onClick={lookupSale} className="bg-red-600 hover:bg-red-500 text-white px-5 rounded-xl font-bold text-sm flex items-center gap-2"><Search size={15}/> Bul</button>
                  </div>
                  {returnSale&&(
                    <div className="space-y-4">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div><p className="font-black text-white">{returnSale.customerName}</p><p className="text-zinc-500 text-xs">{returnSale.date} · {returnSale.method}</p></div>
                          <span className="font-black text-emerald-400">₺{(returnSale.total||0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">İade Edilecek Ürünler</label>
                        {(returnSale.items||[]).map((item:any,i:number)=>(
                          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0"><p className="font-bold text-white text-sm truncate">{item.name}</p><p className="text-zinc-500 text-xs">₺{(item.grossPrice||0).toFixed(2)} × {item.qty}</p></div>
                            <input type="number" min="0" max={item.qty} value={returnLines[i]?.qty||0} onChange={e=>{const nl=[...returnLines];nl[i]={...nl[i],qty:parseInt(e.target.value)||0};setReturnLines(nl);}} className="w-16 bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-center font-black text-sm outline-none focus:border-red-500"/>
                            <input value={returnLines[i]?.reason||''} onChange={e=>{const nl=[...returnLines];nl[i]={...nl[i],reason:e.target.value};setReturnLines(nl);}} placeholder="Neden?" className="w-28 bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs outline-none focus:border-red-500"/>
                          </div>
                        ))}
                      </div>
                      {returnType==='degisim'&&(
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Değişim Ürünleri (verilecek)</label>
                          <select onChange={e=>{const p=products.find(p=>p.id===e.target.value);if(p){setExchangeCart(prev=>{const ex=prev.find((i:any)=>i.id===p.id);if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:i.qty+1}:i);return[...prev,{...p,qty:1}];});}e.target.value='';}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none text-sm"><option value="">— Değişim Ürünü Ekle —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} — ₺{p.grossPrice}</option>)}</select>
                          {exchangeCart.map((item:any,i:number)=>(
                            <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
                              <span className="font-bold text-white text-sm">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400 font-black">×{item.qty}</span>
                                <button onClick={()=>setExchangeCart(exchangeCart.filter((_:any,ii:number)=>ii!==i))} className="text-zinc-600 hover:text-red-500"><X size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea value={returnNote} onChange={e=>setReturnNote(e.target.value)} placeholder="Açıklama / Not..." rows={2} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none text-sm resize-none"/>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                        <span className="text-zinc-400 font-bold text-sm">İade Tutarı:</span>
                        <span className="text-red-400 font-black text-xl">₺{returnLines.filter(l=>l.qty>0).reduce((a,l)=>a+(returnSale.items[l.itemIdx]?.grossPrice||0)*l.qty,0).toFixed(2)}</span>
                      </div>
                      <button onClick={handleSubmitReturn} className={`w-full py-4 rounded-2xl font-black text-zinc-950 flex items-center justify-center gap-2 ${returnType==='iade'?'bg-red-500 hover:bg-red-400':'bg-blue-500 hover:bg-blue-400'}`}>
                        {returnType==='iade'?<><RefreshCw size={17}/> İADEYİ TAMAMLA</>:<><ArrowLeftRight size={17}/> DEĞİŞİMİ TAMAMLA</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sağ — İade geçmişi */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col">
                <h3 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">İade Geçmişi</h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {returns.slice().reverse().map((ret:any)=>(
                    <div key={ret.id} className={`border rounded-2xl p-4 ${ret.type==='degisim'?'border-blue-800/40 bg-blue-500/5':'border-red-800/30 bg-red-500/5'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${ret.type==='iade'?'bg-red-500/20 text-red-400':'bg-blue-500/20 text-blue-400'}`}>{ret.type==='iade'?'İADE':'DEĞİŞİM'}</span>
                          <span className="font-black text-white text-sm">{ret.customerName}</span>
                        </div>
                        <span className="text-red-400 font-black">-₺{(ret.total||0).toFixed(2)}</span>
                      </div>
                      <div className="text-zinc-500 text-xs">{ret.date} · {ret.staffName&&`Kasiyer: ${ret.staffName}`}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">{(ret.items||[]).map((item:any,i:number)=><span key={i} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">{item.name} ×{item.qty}{item.reason&&<span className="text-zinc-600"> ({item.reason})</span>}</span>)}</div>
                    </div>
                  ))}
                  {returns.length===0&&<p className="text-zinc-600 text-center py-8 font-bold">Henüz iade/değişim yok.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STOK ══════════════════════════════════════════════════════ */}
        {activePage.startsWith('stock.')&&(
          <div className="flex flex-col w-full overflow-hidden">

            {activePage==='stock.products'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-black flex items-center gap-3"><Package className="text-emerald-500"/> Ürünler</h2>
                  <div className="flex gap-3">
                    <input type="file" accept=".csv" ref={fileInputRefProd} style={{display:'none'}} onChange={importProducts}/>
                    <button onClick={()=>fileInputRefProd.current?.click()} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 text-sm"><Upload size={15}/> İçeri</button>
                    <button onClick={exportProducts} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 text-sm"><Download size={15}/> Dışarı</button>
                    <button onClick={()=>setShowAddForm(!showAddForm)} className="bg-emerald-500 text-zinc-950 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"><Plus size={17}/> Yeni Ürün</button>
                  </div>
                </div>
                {showAddForm&&(
                  <form onSubmit={handleAddProduct} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
                    <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase">Ürün İsmi</label><input required value={pName} onChange={e=>setPName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm" placeholder="Dove Sabun 100gr"/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Barkod</label><input value={pBarcode} onChange={e=>setPBarcode(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm" placeholder="Okutun..."/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={pCat} onChange={e=>setPCat(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm"><option value="">— Seç —</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Birim</label><select value={pUnit} onChange={e=>setPUnit(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm"><option>Adet</option><option>Koli</option><option>Paket</option></select></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-blue-400 uppercase">Alış Fiyatı</label><input type="number" step="0.01" value={pCost} onChange={e=>setPCost(e.target.value)} className="w-full bg-blue-950/20 border border-blue-900 p-3 rounded-xl outline-none text-blue-300 text-sm" placeholder="0.00"/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-emerald-500 uppercase">NET Satış</label><input required type="number" step="0.01" value={pNet} onChange={e=>setPNet(e.target.value)} className="w-full bg-zinc-950 border border-emerald-900 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm" placeholder="0.00"/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">KDV %</label><select value={pTax} onChange={e=>setPTax(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm"><option value="0">0</option><option value="1">1</option><option value="10">10</option><option value="20">20</option></select></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-violet-400 uppercase">Başlangıç Stok</label><input type="number" value={pStock} onChange={e=>setPStock(e.target.value)} className="w-full bg-violet-950/20 border border-violet-900 p-3 rounded-xl outline-none text-violet-300 text-sm" placeholder="0"/></div>
                    <div className="flex items-end"><button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-sm">KAYDET</button></div>
                  </form>
                )}
                <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest"><tr><th className="p-4">Ürün</th><th className="p-4">Barkod</th><th className="p-4">Kategori</th><th className="p-4">Birim</th><th className="p-4 text-right">Alış</th><th className="p-4 text-right">Satış</th><th className="p-4 text-center">Stok</th><th className="p-4 text-center">İşlem</th></tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {products.map(p=>{const sc=stockColor(p.stock||0);return(
                      <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 font-bold text-emerald-400 text-sm">{p.name||'-'}</td>
                        <td className="p-4 font-mono text-zinc-500 text-xs">{p.barcode||'-'}</td>
                        <td className="p-4">{p.category?<span className="text-xs font-bold px-2 py-1 rounded-full" style={{background:catColor(p.category)+'33',color:catColor(p.category)}}>{p.category}</span>:<span className="text-zinc-700 text-xs">—</span>}</td>
                        <td className="p-4 text-sm text-zinc-400">{p.unit||'-'}</td>
                        <td className="p-4 text-right text-blue-400 text-sm">₺{(p.costPrice||0).toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-white font-mono text-sm">₺{(p.grossPrice||0).toFixed(2)}</td>
                        <td className="p-4 text-center"><span className={`${sc.badge} text-white text-xs font-black px-2.5 py-1 rounded-full`}>{p.stock||0}</span></td>
                        <td className="p-4 text-center"><div className="flex items-center justify-center gap-1"><button onClick={()=>openEditProduct(p)} className="text-zinc-600 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-zinc-800"><Pencil size={13}/></button><button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-zinc-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-800"><Trash2 size={13}/></button></div></td>
                      </tr>
                    );})}
                  </tbody></table>
                </div>
              </div>
            )}

            {activePage==='stock.movements'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-5"><ArrowUpDown className="text-emerald-500"/> Stok Hareketleri</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3">
                  <Filter size={14} className="text-zinc-500"/>
                  <input type="date" value={mvStart} onChange={e=>setMvStart(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500"/>
                  <span className="text-zinc-600">—</span>
                  <input type="date" value={mvEnd} onChange={e=>setMvEnd(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500"/>
                  {(mvStart||mvEnd)&&<button onClick={()=>{setMvStart('');setMvEnd('');}} className="text-zinc-500 hover:text-red-400 text-xs font-bold bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700 flex items-center gap-1"><X size={11}/> Temizle</button>}
                  <div className="flex gap-2 ml-2">{(['all','in','out'] as const).map(t=><button key={t} onClick={()=>setMvType(t)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${mvType===t?t==='in'?'bg-blue-500 text-white border-blue-500':t==='out'?'bg-red-500 text-white border-red-500':'bg-zinc-600 text-white border-zinc-600':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{t==='all'?'Tümü':t==='in'?'↓ Giriş':'↑ Çıkış'}</button>)}</div>
                </div>
                {(()=>{
                  type Mv={date:string;type:'in'|'out';desc:string;items:{name:string;qty:number}[];total:number;ts:number};
                  const movements:Mv[]=[];
                  sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{movements.push({date:s.date,type:'out',desc:`Satış → ${s.customerName}`,items:(s.items||[]).map((i:any)=>({name:i.name,qty:i.qty})),total:s.total||0,ts:parseDT(s.date).getTime()});});
                  purchases.forEach(p=>{movements.push({date:p.createdAt||p.date,type:'in',desc:`Alış ← ${p.supplier||'Tedarikçi'}`,items:(p.items||[]).map((i:any)=>({name:i.productName||i.name,qty:i.qty})),total:p.totalCost||0,ts:new Date(p.date).getTime()});});
                  movements.sort((a,b)=>b.ts-a.ts);
                  const filtered=movements.filter(mv=>{
                    if(mvType!=='all'&&mv.type!==mvType)return false;
                    if(mvStart&&mv.ts<new Date(mvStart).getTime())return false;
                    if(mvEnd){const t=new Date(mvEnd);t.setHours(23,59,59);if(mv.ts>t.getTime())return false;}
                    return true;
                  });
                  const tIn=filtered.filter(m=>m.type==='in').reduce((a,b)=>a+b.total,0);
                  const tOut=filtered.filter(m=>m.type==='out').reduce((a,b)=>a+b.total,0);
                  return(<>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam</p><p className="text-2xl font-black text-white">{filtered.length}</p></div>
                      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl"><p className="text-blue-400 text-xs font-bold uppercase mb-1">↓ Giriş</p><p className="text-2xl font-black text-blue-400">₺{tIn.toFixed(2)}</p></div>
                      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl"><p className="text-red-400 text-xs font-bold uppercase mb-1">↑ Çıkış</p><p className="text-2xl font-black text-red-400">₺{tOut.toFixed(2)}</p></div>
                    </div>
                    <div className="space-y-2">
                      {filtered.map((mv,idx)=>(
                        <div key={idx} className={`border rounded-2xl p-4 flex items-center gap-4 ${mv.type==='in'?'border-blue-800/40 bg-blue-500/5':'border-zinc-800 bg-zinc-900/50'}`}>
                          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${mv.type==='in'?'bg-blue-500/20 text-blue-400':'bg-red-500/10 text-red-400'}`}>{mv.type==='in'?'↓':'↑'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-white text-sm">{mv.desc}</div>
                            <div className="flex flex-wrap gap-1.5 mt-1">{mv.items.slice(0,5).map((item,i)=><span key={i} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">{item.name} ×{item.qty}</span>)}{mv.items.length>5&&<span className="text-[11px] text-zinc-600">+{mv.items.length-5}</span>}</div>
                          </div>
                          <div className="text-right shrink-0"><div className={`text-lg font-black ${mv.type==='in'?'text-blue-400':'text-red-400'}`}>{mv.type==='in'?'+':'-'}₺{mv.total.toFixed(2)}</div><div className="text-zinc-600 text-xs">{mv.date}</div></div>
                        </div>
                      ))}
                      {filtered.length===0&&<div className="text-center text-zinc-600 py-12 font-bold">Seçilen filtreye uygun hareket yok.</div>}
                    </div>
                  </>);
                })()}
              </div>
            )}

            {activePage==='stock.tracking'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Boxes className="text-emerald-500"/> Stok Takibi</h2>
                <div className="grid grid-cols-4 gap-5 mb-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam Ürün</p><p className="text-3xl font-black text-white">{products.length}</p></div>
                  <div className={`p-5 rounded-2xl border ${outOfStock>0?'bg-red-500/10 border-red-500/30':'bg-zinc-900 border-zinc-800'}`}><p className={`text-xs font-bold uppercase mb-1 flex items-center gap-1 ${outOfStock>0?'text-red-400':'text-zinc-500'}`}>{outOfStock>0&&<AlertTriangle size={11}/>} Tükenen</p><p className={`text-3xl font-black ${outOfStock>0?'text-red-500':'text-zinc-600'}`}>{outOfStock}</p></div>
                  <div className={`p-5 rounded-2xl border ${lowStock>0?'bg-orange-500/10 border-orange-500/30':'bg-zinc-900 border-zinc-800'}`}><p className={`text-xs font-bold uppercase mb-1 ${lowStock>0?'text-orange-400':'text-zinc-500'}`}>Kritik (≤{lowStockLimit})</p><p className={`text-3xl font-black ${lowStock>0?'text-orange-400':'text-zinc-600'}`}>{lowStock}</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Stok Değeri</p><p className="text-2xl font-black text-white">₺{totalStockValue.toFixed(0)}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <div className="relative"><Search className="absolute left-3 top-2.5 text-zinc-500" size={14}/><input value={stockSearch} onChange={e=>setStockSearch(e.target.value)} placeholder="Ürün ara..." className="bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm w-48"/></div>
                  <select value={stockCatFilter} onChange={e=>setStockCatFilter(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-2.5 rounded-xl outline-none text-sm"><option value="all">Tüm Kategoriler</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select>
                  {(['all','low','out'] as const).map(f=><button key={f} onClick={()=>setStockFilter(f)} className={`px-3 py-2.5 rounded-xl text-sm font-bold border ${stockFilter===f?f==='out'?'bg-red-500 text-white border-red-500':f==='low'?'bg-orange-400 text-zinc-950 border-orange-400':'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{f==='all'?'Tümü':f==='low'?`Kritik (${lowStock})`:`Tükenen (${outOfStock})`}</button>)}
                  <div className="ml-auto flex items-center gap-2"><span className="text-zinc-600 text-xs">Eşik:</span><input type="number" value={lowStockLimit} onChange={e=>setLowStockLimit(parseInt(e.target.value)||5)} className="w-14 bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-center text-sm outline-none font-bold"/></div>
                </div>
                <div className="space-y-2">{filteredStockProducts.map(p=>{const sc=stockColor(p.stock||0);const maxS=Math.max(...products.map(pp=>pp.stock||0),1);const pct=Math.min(100,((p.stock||0)/maxS)*100);return(
                  <div key={p.id} className={`border rounded-2xl p-4 flex items-center gap-5 ${sc.ring}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><span className="font-black text-white">{p.name}</span>{p.category&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:catColor(p.category)+'33',color:catColor(p.category)}}>{p.category}</span>}{(p.stock||0)===0&&<span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={9}/>TÜKENDI</span>}{(p.stock||0)>0&&(p.stock||0)<=lowStockLimit&&<span className="text-[10px] bg-orange-400 text-zinc-950 font-bold px-2 py-0.5 rounded-full">KRİTİK</span>}</div>
                      <div className="flex items-center gap-3 mt-2"><div className="flex-1 bg-zinc-800 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${sc.bar}`} style={{width:`${pct}%`}}/></div><span className="text-zinc-600 text-xs font-bold">{p.unit||'Adet'}</span></div>
                    </div>
                    <div className="text-right shrink-0"><div className={`text-3xl font-black ${sc.text}`}>{p.stock||0}</div><div className="text-zinc-600 text-xs">adet</div></div>
                    <div className="text-right shrink-0"><div className="text-white font-bold text-sm">₺{(p.grossPrice||0).toFixed(2)}</div><div className="text-zinc-600 text-xs">satış</div></div>
                    <div className="text-right shrink-0"><div className="text-blue-400 font-bold text-sm">₺{((p.stock||0)*(p.costPrice||0)).toFixed(2)}</div><div className="text-zinc-600 text-xs">stok değeri</div></div>
                  </div>
                );})}
                </div>
              </div>
            )}

            {activePage==='stock.count'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <div className="flex items-center justify-between mb-6"><div><h2 className="text-2xl font-black flex items-center gap-2"><ClipboardCheck className="text-emerald-500"/> Stok Sayımı</h2><p className="text-zinc-500 text-sm mt-0.5">Fiziksel sayım sonuçlarını girin.</p></div><button onClick={handleSaveCount} className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 ${countSaved?'bg-emerald-400 text-zinc-950':'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}>{countSaved?<><CheckCircle size={17}/> Kaydedildi!</>:<><Save size={17}/> Kaydet</>}</button></div>
                <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                  <div className="grid grid-cols-12 gap-0 bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest"><div className="col-span-5 p-4">Ürün</div><div className="col-span-2 p-4">Kategori</div><div className="col-span-2 p-4 text-center">Sistemdeki</div><div className="col-span-2 p-4 text-center">Sayılan</div><div className="col-span-1 p-4 text-center">Fark</div></div>
                  <div className="divide-y divide-zinc-800/50">{products.map(p=>{const counted=parseInt(countDraft[p.id]??String(p.stock||0));const diff=isNaN(counted)?0:counted-(p.stock||0);return(
                    <div key={p.id} className="grid grid-cols-12 gap-0 items-center hover:bg-zinc-800/30">
                      <div className="col-span-5 p-4"><div className="font-bold text-white text-sm">{p.name}</div>{p.barcode&&<div className="text-zinc-600 text-xs font-mono">{p.barcode}</div>}</div>
                      <div className="col-span-2 p-4">{p.category?<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:catColor(p.category)+'33',color:catColor(p.category)}}>{p.category}</span>:<span className="text-zinc-700 text-xs">—</span>}</div>
                      <div className="col-span-2 p-4 text-center"><span className="font-black text-zinc-400 text-lg">{p.stock||0}</span></div>
                      <div className="col-span-2 p-4 text-center"><input type="number" min="0" value={countDraft[p.id]??String(p.stock||0)} onChange={e=>setCountDraft(prev=>({...prev,[p.id]:e.target.value}))} className="w-20 bg-zinc-950 border border-zinc-700 text-white rounded-xl p-2 text-center font-black text-lg outline-none focus:border-emerald-500"/></div>
                      <div className="col-span-1 p-4 text-center"><span className={`font-black text-sm ${diff>0?'text-emerald-400':diff<0?'text-red-400':'text-zinc-600'}`}>{isNaN(diff)?'—':diff>0?`+${diff}`:diff===0?'=':diff}</span></div>
                    </div>
                  );})}
                  </div>
                </div>
              </div>
            )}

            {activePage==='stock.category'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><FolderOpen className="text-emerald-500"/> Ürün Kategorileri</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                    <h4 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">Yeni Kategori</h4>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori Adı</label><input required value={newCatName} onChange={e=>setNewCatName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none text-sm" placeholder="Temizlik Ürünleri"/></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Renk</label><div className="flex flex-wrap gap-2">{CAT_COLORS.map(c=><button key={c} type="button" onClick={()=>setNewCatColor(c)} className={`w-8 h-8 rounded-full transition-all ${newCatColor===c?'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110':''}`} style={{background:c}}/>)}<input type="color" value={newCatColor} onChange={e=>setNewCatColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0"/></div></div>
                      <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={15}/> Ekle</button>
                    </form>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                    <h4 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">Kategoriler</h4>
                    <div className="space-y-2">{categories.map(cat=>{const cnt=products.filter(p=>p.category===cat.name).length;return(
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{background:cat.color}}/><div><span className="font-bold text-white text-sm">{cat.name}</span><div className="text-zinc-600 text-xs">{cnt} ürün</div></div></div>
                        <div className="flex items-center gap-2"><span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:cat.color+'33',color:cat.color}}>{cat.name}</span><button onClick={()=>deleteDoc(doc(db,'categories',cat.id))} className="text-zinc-700 hover:text-red-500 p-1"><Trash2 size={13}/></button></div>
                      </div>
                    );})}
                    {categories.length===0&&<p className="text-zinc-600 text-sm text-center py-4">Henüz kategori yok.</p>}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ALIŞ FATURALARI ══════════════════════════════════════════ */}
        {activePage==='purchases'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-3xl font-black flex items-center gap-2"><ArrowDownToLine className="text-blue-400"/> Alış Faturaları</h2><p className="text-zinc-500 text-sm mt-0.5">Tedarikçiden alınan mallar — stok otomatik güncellenir.</p></div>
              <button onClick={()=>setShowPurchaseForm(!showPurchaseForm)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20"><Plus size={17}/> Yeni Alış Faturası</button>
            </div>
            {showPurchaseForm&&(
              <form onSubmit={handleSavePurchase} className="bg-zinc-900 border border-blue-900/40 p-6 rounded-3xl mb-6 space-y-5 animate-in slide-in-from-top duration-300">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-300">💡 Ürünleri <strong>ürün deposundan seç</strong> — tedarikçi adı ile stok adı farklı olabilir.</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Tedarikçi</label><input value={purchaseSupplier} onChange={e=>setPurchaseSupplier(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl outline-none focus:border-blue-500 text-white text-sm" placeholder="Tedarikçi adı..."/></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Tarih</label><input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl outline-none focus:border-blue-500 text-white text-sm"/></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Fatura No</label><input value={purchaseNote} onChange={e=>setPurchaseNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl outline-none focus:border-blue-500 text-white text-sm" placeholder="INV-2026-001..."/></div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-3 text-xs font-bold text-zinc-500 uppercase px-1"><div className="col-span-5">Ürün</div><div className="col-span-2 text-center">Miktar</div><div className="col-span-3">Alış Fiyatı</div><div className="col-span-2 text-right text-zinc-700">Toplam</div></div>
                  {purchaseLines.map((line,idx)=>{const lt=(parseInt(line.qty)||0)*(parseFloat(line.cost)||0);return(
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5"><select value={line.productId} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],productId:e.target.value,cost:products.find(p=>p.id===e.target.value)?.costPrice?.toString()||''};setPurchaseLines(nl);}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"><option value="">— Ürün Seç —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · Stok:{p.stock||0}</option>)}</select></div>
                      <div className="col-span-2"><input type="number" min="1" value={line.qty} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],qty:e.target.value};setPurchaseLines(nl);}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-center font-bold text-sm"/></div>
                      <div className="col-span-3"><input type="number" step="0.01" value={line.cost} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],cost:e.target.value};setPurchaseLines(nl);}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                      <div className="col-span-1 text-right text-zinc-500 text-sm font-bold">₺{lt.toFixed(0)}</div>
                      <div className="col-span-1 flex justify-center">{purchaseLines.length>1&&<button type="button" onClick={()=>setPurchaseLines(purchaseLines.filter((_,i)=>i!==idx))} className="text-zinc-600 hover:text-red-500"><X size={15}/></button>}</div>
                    </div>
                  );})}
                  <button type="button" onClick={()=>setPurchaseLines([...purchaseLines,{productId:'',qty:'',cost:''}])} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold mt-1"><Plus size={14}/> Satır Ekle</button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="text-zinc-400 text-sm">Toplam: <span className="text-white font-black text-xl">₺{purchaseLines.reduce((a,l)=>a+((parseInt(l.qty)||0)*(parseFloat(l.cost)||0)),0).toFixed(2)}</span></div>
                  <div className="flex gap-3"><button type="button" onClick={()=>setShowPurchaseForm(false)} className="bg-zinc-800 text-zinc-400 px-5 py-2.5 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 text-sm"><Save size={16}/> Kaydet & Stoğa İşle</button></div>
                </div>
              </form>
            )}
            <div className="space-y-3">{purchases.slice().reverse().map((pur:any)=>(
              <div key={pur.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={()=>setExpandedPurchase(expandedPurchase===pur.id?null:pur.id)}>
                  <div className="bg-blue-600/20 border border-blue-600/30 px-3 py-2 rounded-xl text-center min-w-[64px]"><p className="text-blue-400 text-[9px] font-bold uppercase">Alış</p><p className="text-white font-black text-sm">#{pur.id?.slice(-5).toUpperCase()}</p></div>
                  <div className="flex-1"><p className="font-black text-white text-sm">{pur.supplier||'Tedarikçi yok'}</p><p className="text-zinc-500 text-xs">{pur.date}{pur.note&&<span className="text-zinc-600"> · {pur.note}</span>}{pur.staffName&&<span className="text-zinc-700"> · {pur.staffName}</span>}</p></div>
                  <div className="text-right mr-2"><p className="text-xl font-black text-blue-400">₺{(pur.totalCost||0).toFixed(2)}</p><p className="text-zinc-600 text-xs">{(pur.items||[]).length} kalem</p></div>
                  {expandedPurchase===pur.id?<ChevronUp size={15} className="text-zinc-500"/>:<ChevronDown size={15} className="text-zinc-500"/>}
                  <button onClick={e=>{e.stopPropagation();deleteDoc(doc(db,'purchases',pur.id));}} className="text-zinc-700 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                </div>
                {expandedPurchase===pur.id&&<div className="border-t border-zinc-800 px-5 pb-4"><table className="w-full text-sm mt-3"><thead><tr className="text-zinc-600 text-xs font-bold uppercase"><th className="text-left pb-2">Ürün</th><th className="text-center pb-2">Miktar</th><th className="text-right pb-2">Alış</th><th className="text-right pb-2">Toplam</th></tr></thead><tbody className="divide-y divide-zinc-800/50">{(pur.items||[]).map((item:any,i:number)=><tr key={i} className="text-zinc-300"><td className="py-2 font-medium">{item.productName||'-'}</td><td className="py-2 text-center text-zinc-500">{item.qty}</td><td className="py-2 text-right text-zinc-400">₺{(item.cost||0).toFixed(2)}</td><td className="py-2 text-right font-bold text-blue-400">₺{((item.cost||0)*(item.qty||1)).toFixed(2)}</td></tr>)}</tbody></table></div>}
              </div>
            ))}
            {purchases.length===0&&<div className="text-center text-zinc-600 py-12 font-bold">Henüz alış faturası yok.</div>}
            </div>
          </div>
        )}

        {/* ═══ CARİ HESAPLAR ════════════════════════════════════════════ */}
        {activePage==='customers'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black">Cari Hesaplar</h2>
              <div className="flex gap-3">
                <button onClick={exportCustomers} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 text-sm"><Download size={15}/> Dışarı</button>
                <button onClick={()=>setActivePage('customers.categories')} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 text-sm"><FolderOpen size={15}/> Kategoriler</button>
                <button onClick={()=>setShowCustomerForm(!showCustomerForm)} className="bg-emerald-500 text-zinc-950 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-sm"><UserPlus size={16}/> Yeni Cari</button>
              </div>
            </div>
            {showCustomerForm&&(
              <form onSubmit={handleAddCustomer} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-6 grid grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top">
                <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Firma / Müşteri Adı</label><input required value={cName} onChange={e=>setCName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm" placeholder="Beyoğlu Buklet"/></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Vergi No / TC</label><input required value={cTaxNum} onChange={e=>setCTaxNum(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm" placeholder="Vergi No..."/></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Telefon</label><input value={cPhone} onChange={e=>setCPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm" placeholder="05xx..."/></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={cCat} onChange={e=>setCCat(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm"><option value="">— Seç —</option>{custCategories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><MessageSquare size={11}/> Not</label><input value={cNote} onChange={e=>setCNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm" placeholder="Müşteri hakkında not..."/></div>
                <div className="flex items-end"><button type="submit" className="bg-emerald-500 text-zinc-950 font-black px-8 py-3 rounded-xl text-sm">Ekle</button></div>
              </form>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {customers.map(c=>(
                <div key={c.id} onClick={()=>setSelectedCustomer(c)} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl hover:border-emerald-500 hover:bg-zinc-800/40 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-emerald-400">{c.name||'-'}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-500 text-xs font-bold bg-zinc-950 px-2 py-0.5 rounded"><Phone size={10}/> {c.phone||'-'}</span>
                        <span className="text-zinc-500 text-xs font-bold bg-zinc-950 px-2 py-0.5 rounded">V.No: {c.taxNum||'-'}</span>
                        {c.category&&<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:custCatColor(c.category)+'33',color:custCatColor(c.category)}}>{c.category}</span>}
                      </div>
                      {c.note&&<p className="text-zinc-600 text-xs mt-1 italic">"{c.note}"</p>}
                    </div>
                    <div className={`text-xl font-black font-mono ${(c.balance||0)>0?'text-red-500':(c.balance||0)<0?'text-emerald-500':'text-zinc-600'}`}>
                      {(c.balance||0)>0?`+₺${(c.balance||0).toFixed(2)}`:(c.balance||0)<0?`-₺${Math.abs(c.balance||0).toFixed(2)}`:'₺0'}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={ev=>{ev.stopPropagation();openEditCustomer(c);}} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Pencil size={11}/> Düzenle</button>
                    <button onClick={ev=>{ev.stopPropagation();handleTahsilat(c);}} className="bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-500 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Wallet size={11}/> Tahsilat</button>
                    <button onClick={ev=>{ev.stopPropagation();deleteDoc(doc(db,'customers',c.id));}} className="bg-zinc-800 hover:bg-red-500 text-zinc-500 px-2.5 py-1.5 rounded-lg border border-zinc-700"><Trash2 size={11}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage==='customers.categories'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-6"><button onClick={()=>setActivePage('customers')} className="text-zinc-500 hover:text-white"><ChevronDown size={18} className="-rotate-90"/></button><h2 className="text-2xl font-black flex items-center gap-2"><FolderOpen className="text-emerald-500"/> Müşteri Kategorileri</h2></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h4 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">Yeni Müşteri Kategorisi</h4>
                <form onSubmit={handleAddCustCategory} className="space-y-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori Adı</label><input required value={newCustCatName} onChange={e=>setNewCustCatName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none text-sm" placeholder="Toptan, VIP, Perakende..."/></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Renk</label><div className="flex flex-wrap gap-2">{CAT_COLORS.map(c=><button key={c} type="button" onClick={()=>setNewCustCatColor(c)} className={`w-8 h-8 rounded-full transition-all ${newCustCatColor===c?'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110':''}`} style={{background:c}}/>)}<input type="color" value={newCustCatColor} onChange={e=>setNewCustCatColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0"/></div></div>
                  <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={15}/> Ekle</button>
                </form>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h4 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">Mevcut Kategoriler</h4>
                <div className="space-y-2">{custCategories.map(cat=>{const cnt=customers.filter(c=>c.category===cat.name).length;return(<div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800"><div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{background:cat.color}}/><div><span className="font-bold text-white text-sm">{cat.name}</span><div className="text-zinc-600 text-xs">{cnt} müşteri</div></div></div><div className="flex items-center gap-2"><span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:cat.color+'33',color:cat.color}}>{cat.name}</span><button onClick={()=>deleteDoc(doc(db,'custCategories',cat.id))} className="text-zinc-700 hover:text-red-500 p-1"><Trash2 size={13}/></button></div></div>);})}
                {custCategories.length===0&&<p className="text-zinc-600 text-sm text-center py-4">Henüz müşteri kategorisi yok.</p>}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RAPOR ════════════════════════════════════════════════════ */}
        {activePage==='reports'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black">Rapor & Analiz</h2>
              <button onClick={()=>exportParasut(sales)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20"><FileSpreadsheet size={17}/> Paraşüt'e Aktar</button>
            </div>
            <div className="flex gap-2 mb-6 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 w-fit">
              {([['genel','Genel'],['gunSonu','Gün Sonu'],['kdv','KDV'],['personel','Personel']] as const).map(([tab,label])=>(
                (!canDo(`rapor.${tab}`)&&(tab==='personel'))?null:
                <button key={tab} onClick={()=>setReportTab(tab)} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${reportTab===tab?'bg-emerald-500 text-zinc-950':'text-zinc-500 hover:text-white'}`}>{label}</button>
              ))}
            </div>

            {reportTab==='genel'&&(<>
              <div className="grid grid-cols-4 gap-5 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-3 opacity-5"><TrendingUp size={70}/></div><div className="text-zinc-400 font-bold text-xs mb-1 uppercase tracking-tighter">Brüt Ciro</div><div className="text-3xl font-black text-white">₺{totalIncome.toFixed(2)}</div></div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-3 opacity-5"><Package size={70}/></div><div className="text-blue-400 font-bold text-xs mb-1 uppercase tracking-tighter">SMM</div><div className="text-3xl font-black text-white">₺{totalCogs.toFixed(2)}</div></div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-3 opacity-5"><TrendingDown size={70}/></div><div className="text-red-500 font-bold text-xs mb-1 uppercase tracking-tighter">Giderler</div><div className="text-3xl font-black text-white">₺{totalExpenseSum.toFixed(2)}</div></div>
                <div className={`p-5 rounded-2xl relative overflow-hidden group border-2 ${netProfit>=0?'bg-emerald-500/10 border-emerald-500/30':'bg-red-500/10 border-red-500/30'}`}><div className={`font-bold text-xs mb-1 uppercase tracking-tighter ${netProfit>=0?'text-emerald-500':'text-red-500'}`}>Net Kar</div><div className={`text-3xl font-black ${netProfit>=0?'text-emerald-500':'text-red-500'}`}>₺{netProfit.toFixed(2)}</div></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 p-7 rounded-[30px] border border-zinc-800">
                  <h3 className="text-lg font-black mb-5 border-b border-zinc-800 pb-3">Yeni Gider Kaydı</h3>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Açıklama</label><input required value={expName} onChange={e=>setExpName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none focus:border-red-500 text-sm" placeholder="Elektrik Faturası"/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Tutar (₺)</label><input required type="number" step="0.01" value={expAmount} onChange={e=>setExpAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none focus:border-red-500 text-sm" placeholder="0.00"/></div>
                    <button type="submit" className="w-full bg-red-500/20 text-red-500 border border-red-500/30 font-black py-4 rounded-2xl hover:bg-red-500 hover:text-white text-sm">GİDERİ KAYDET</button>
                  </form>
                </div>
                <div className="bg-zinc-900 p-7 rounded-[30px] border border-zinc-800 flex flex-col">
                  <h3 className="text-lg font-black mb-5 border-b border-zinc-800 pb-3 flex justify-between items-center">Son Satışlar <Tag className="text-zinc-600" size={16}/></h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">{sales.slice().reverse().slice(0,15).map((s,idx)=>(
                    <div key={idx} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                      <div><div className="text-lg font-black text-emerald-400">₺{(s.total||0).toFixed(2)}</div><div className="text-[10px] text-zinc-600 font-mono">{s.date}</div></div>
                      <div className="text-right"><div className="font-bold text-zinc-300 text-sm">{s.customerName}</div><div className="flex gap-1 justify-end mt-0.5"><div className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-500">{s.method}</div>{s.staffName&&<div className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-600">{s.staffName}</div>}</div></div>
                    </div>
                  ))}</div>
                </div>
              </div>
            </>)}

            {reportTab==='gunSonu'&&(
              <div>
                <div className="flex items-center gap-4 mb-6"><label className="text-zinc-400 font-bold text-sm">Tarih:</label><input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm"/></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Günlük Ciro</p><p className="text-3xl font-black text-white">₺{daySalesTotal.toFixed(2)}</p><p className="text-zinc-600 text-xs mt-1">{reportSales.filter(s=>s.method!=='Tahsilat').length} fatura</p></div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl"><p className="text-emerald-400 text-xs font-bold uppercase mb-1">💵 Nakit</p><p className="text-3xl font-black text-emerald-400">₺{(dayNakit+dayTahsilat).toFixed(2)}</p><p className="text-zinc-600 text-xs mt-1">Satış:{dayNakit.toFixed(0)} + Tahsilat:{dayTahsilat.toFixed(0)}</p></div>
                  <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-2xl"><p className="text-blue-400 text-xs font-bold uppercase mb-1">💳 Kart</p><p className="text-3xl font-black text-blue-400">₺{dayKart.toFixed(2)}</p></div>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl"><p className="text-orange-400 text-xs font-bold uppercase mb-1">📋 Veresiye</p><p className="text-3xl font-black text-orange-400">₺{dayVeresiye.toFixed(2)}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-5 mb-8">
                  <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl"><p className="text-red-400 text-xs font-bold uppercase mb-1">Günlük Gider</p><p className="text-3xl font-black text-red-400">₺{dayExpense.toFixed(2)}</p></div>
                  <div className={`p-5 rounded-2xl border-2 ${dayCashNet>=0?'bg-emerald-500/10 border-emerald-500/40':'bg-red-500/10 border-red-500/40'}`}><p className={`text-xs font-bold uppercase mb-1 ${dayCashNet>=0?'text-emerald-400':'text-red-400'}`}>💰 Net Kasa</p><p className={`text-3xl font-black ${dayCashNet>=0?'text-emerald-400':'text-red-400'}`}>₺{dayCashNet.toFixed(2)}</p><p className="text-zinc-600 text-xs mt-1">Nakit+Tahsilat−Gider</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-400 text-xs font-bold uppercase mb-1">Satış Adedi</p><p className="text-3xl font-black text-white">{reportSales.filter(s=>s.method!=='Tahsilat').length}</p></div>
                </div>
                {reportSales.filter(s=>s.method!=='Tahsilat').length>0&&(
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="p-5 border-b border-zinc-800"><h3 className="font-black flex items-center gap-2"><Receipt size={15} className="text-emerald-500"/> {new Date(reportDate).toLocaleDateString('tr-TR')} Satışları</h3></div>
                    <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-4 text-left">Müşteri</th><th className="p-4 text-left">Saat</th><th className="p-4 text-left">Kasiyer</th><th className="p-4 text-left">Yöntem</th><th className="p-4 text-right">Toplam</th></tr></thead>
                    <tbody className="divide-y divide-zinc-800/50">{reportSales.filter(s=>s.method!=='Tahsilat').map((s,i)=><tr key={i} className="hover:bg-zinc-800/30"><td className="p-4 font-bold text-zinc-300 text-sm">{s.customerName}</td><td className="p-4 text-zinc-500 font-mono text-xs">{s.date?.split(' ')[1]}</td><td className="p-4 text-zinc-500 text-xs">{s.staffName||'-'}</td><td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-lg ${s.method==='Nakit'?'bg-emerald-500/20 text-emerald-400':s.method==='Kart'?'bg-blue-500/20 text-blue-400':'bg-orange-500/20 text-orange-400'}`}>{s.method}</span></td><td className="p-4 text-right font-black text-white">₺{(s.total||0).toFixed(2)}</td></tr>)}</tbody></table>
                  </div>
                )}
              </div>
            )}

            {reportTab==='kdv'&&(
              <div>
                <div className="flex items-center gap-4 mb-6"><label className="text-zinc-400 font-bold text-sm">Günlük KDV Tarihi:</label><input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm"/></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="p-5 border-b border-zinc-800 bg-zinc-950/30"><h3 className="font-black flex items-center gap-2"><TrendingUp size={15} className="text-orange-400"/> {new Date(reportDate).toLocaleDateString('tr-TR')} KDV</h3></div>
                    {dayKdvBreakdown.length===0?<p className="text-zinc-600 text-center py-8 text-sm">Bu tarihte satış yok.</p>:(
                      <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-4 text-left">KDV Oranı</th><th className="p-4 text-right">Matrah</th><th className="p-4 text-right">KDV</th><th className="p-4 text-right">Brüt</th></tr></thead>
                      <tbody className="divide-y divide-zinc-800/50">{dayKdvBreakdown.map(([rate,data])=><tr key={rate} className="hover:bg-zinc-800/30"><td className="p-4 font-black text-white">%{rate}</td><td className="p-4 text-right text-zinc-400">₺{data.base.toFixed(2)}</td><td className="p-4 text-right font-bold text-orange-400">₺{data.kdv.toFixed(2)}</td><td className="p-4 text-right font-black text-white">₺{data.gross.toFixed(2)}</td></tr>)}
                      <tr className="bg-zinc-800/50 font-black"><td className="p-4 text-white">TOPLAM</td><td className="p-4 text-right text-zinc-300">₺{dayKdvBreakdown.reduce((a,[,d])=>a+d.base,0).toFixed(2)}</td><td className="p-4 text-right text-orange-400">₺{dayKdvBreakdown.reduce((a,[,d])=>a+d.kdv,0).toFixed(2)}</td><td className="p-4 text-right text-white">₺{dayKdvBreakdown.reduce((a,[,d])=>a+d.gross,0).toFixed(2)}</td></tr></tbody></table>
                    )}
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="p-5 border-b border-zinc-800 bg-zinc-950/30"><h3 className="font-black flex items-center gap-2"><TrendingUp size={15} className="text-blue-400"/> Tüm Zamanlar KDV</h3></div>
                    {kdvBreakdown.length===0?<p className="text-zinc-600 text-center py-8 text-sm">Satış verisi yok.</p>:(
                      <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-4 text-left">KDV Oranı</th><th className="p-4 text-right">Matrah</th><th className="p-4 text-right">KDV</th><th className="p-4 text-right">Brüt</th></tr></thead>
                      <tbody className="divide-y divide-zinc-800/50">{kdvBreakdown.map(([rate,data])=><tr key={rate} className="hover:bg-zinc-800/30"><td className="p-4 font-black text-white">%{rate}</td><td className="p-4 text-right text-zinc-400">₺{data.base.toFixed(2)}</td><td className="p-4 text-right font-bold text-blue-400">₺{data.kdv.toFixed(2)}</td><td className="p-4 text-right font-black text-white">₺{data.gross.toFixed(2)}</td></tr>)}
                      <tr className="bg-zinc-800/50 font-black"><td className="p-4 text-white">TOPLAM</td><td className="p-4 text-right text-zinc-300">₺{kdvBreakdown.reduce((a,[,d])=>a+d.base,0).toFixed(2)}</td><td className="p-4 text-right text-blue-400">₺{kdvBreakdown.reduce((a,[,d])=>a+d.kdv,0).toFixed(2)}</td><td className="p-4 text-right text-white">₺{kdvBreakdown.reduce((a,[,d])=>a+d.gross,0).toFixed(2)}</td></tr></tbody></table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {reportTab==='personel'&&currentStaff.role==='admin'&&(
              <div>
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <label className="text-zinc-400 font-bold text-sm">Personel:</label>
                  <select value={staffLogFilter} onChange={e=>setStaffLogFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none">
                    <option value="all">Tüm Personel</option>{staffList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input type="date" value={staffLogDateFilter} onChange={e=>setStaffLogDateFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none"/>
                  {staffLogDateFilter&&<button onClick={()=>setStaffLogDateFilter('')} className="text-zinc-500 hover:text-red-400 text-xs font-bold bg-zinc-800 px-3 py-2.5 rounded-lg border border-zinc-700 flex items-center gap-1"><X size={11}/> Temizle</button>}
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                  <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest"><tr><th className="p-4 text-left">Personel</th><th className="p-4 text-left">Rol</th><th className="p-4 text-left">İşlem</th><th className="p-4 text-left">Detay</th><th className="p-4 text-right">Tutar</th><th className="p-4 text-left">Tarih</th></tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {staffLogs
                      .filter(l=>staffLogFilter==='all'||l.staffId===staffLogFilter)
                      .filter(l=>{if(!staffLogDateFilter)return true;const d=new Date(staffLogDateFilter);const ld=parseDT(l.date);return ld.getFullYear()===d.getFullYear()&&ld.getMonth()===d.getMonth()&&ld.getDate()===d.getDate();})
                      .slice().reverse().slice(0,100)
                      .map((log,i)=>(
                      <tr key={i} className="hover:bg-zinc-800/30">
                        <td className="p-4 font-bold text-white text-sm">{log.staffName}</td>
                        <td className="p-4"><span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg">{roleLabel[log.role]||log.role}</span></td>
                        <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-lg ${log.action.includes('SATIŞ')?'bg-emerald-500/20 text-emerald-400':log.action.includes('GİRİŞ')||log.action.includes('ÇIKIŞ')?'bg-blue-500/20 text-blue-400':log.action.includes('İADE')?'bg-red-500/20 text-red-400':'bg-zinc-700 text-zinc-400'}`}>{log.action}</span></td>
                        <td className="p-4 text-zinc-400 text-xs max-w-xs truncate">{log.detail}</td>
                        <td className="p-4 text-right font-bold text-zinc-300">{log.amount>0?`₺${log.amount.toFixed(2)}`:'-'}</td>
                        <td className="p-4 text-zinc-500 text-xs font-mono">{log.date}</td>
                      </tr>
                    ))}
                  </tbody></table>
                  {staffLogs.length===0&&<div className="text-center text-zinc-600 py-8 font-bold">İşlem geçmişi yok.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PERSONEL YÖNETİMİ ════════════════════════════════════════ */}
        {activePage==='personel'&&currentStaff.role==='admin'&&(
          <div className="p-7 w-full overflow-y-auto">
            <h2 className="text-3xl font-black flex items-center gap-3 mb-6"><UserCog className="text-emerald-500"/> Personel Yönetimi</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h3 className="font-black text-lg mb-5 border-b border-zinc-800 pb-3 flex items-center gap-2"><Plus size={17} className="text-emerald-500"/> Yeni Personel</h3>
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Personel Adı</label><input required value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none focus:border-emerald-500 text-sm" placeholder="Ad Soyad"/></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">PIN Kodu (4-6 hane)</label><input required type="password" maxLength={6} value={newStaffPin} onChange={e=>setNewStaffPin(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none focus:border-emerald-500 text-sm text-center tracking-widest font-black text-lg" placeholder="••••"/></div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Rol & Yetki</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([['admin','🔑 Admin','Tüm yetkiler'],['kasiyer','🛒 Kasiyer','Satış + Cari'],['depo','📦 Depo','Stok işlemleri']] as const).map(([r,label,desc])=>(
                        <button key={r} type="button" onClick={()=>setNewStaffRole(r)} className={`p-3 rounded-xl text-left border transition-all ${newStaffRole===r?'bg-emerald-500/20 border-emerald-500/50':'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}>
                          <div className="font-black text-sm text-white">{label}</div>
                          <div className="text-zinc-500 text-[10px] mt-0.5">{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"><UserPlus size={16}/> Personel Ekle</button>
                </form>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h3 className="font-black text-lg mb-5 border-b border-zinc-800 pb-3 flex items-center gap-2"><Users size={17} className="text-emerald-500"/> Mevcut Personel</h3>
                <div className="space-y-3">
                  {staffList.map(staff=>(
                    <div key={staff.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${staff.role==='admin'?'bg-yellow-500/20 text-yellow-400':staff.role==='kasiyer'?'bg-emerald-500/20 text-emerald-400':'bg-blue-500/20 text-blue-400'}`}>
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">{staff.name}</p>
                          <p className="text-zinc-500 text-xs">{roleLabel[staff.role]||staff.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-600 text-xs font-mono">PIN: {'•'.repeat((staff.pin||'').length)}</span>
                        {staff.id!==currentStaff.id&&<button onClick={()=>deleteDoc(doc(db,'staff',staff.id))} className="text-zinc-700 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-800"><Trash2 size={14}/></button>}
                        {staff.id===currentStaff.id&&<span className="text-emerald-400 text-xs font-bold bg-emerald-500/20 px-2 py-1 rounded-lg">Sen</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FİŞ TASARIMI ══════════════════════════════════════════════ */}
        {activePage==='receipt'&&(
          <div className="flex w-full overflow-hidden">
            <div className="w-[355px] shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0"><div><h2 className="text-base font-black flex items-center gap-2"><Palette size={16} className="text-emerald-500"/> Fiş Tasarımı</h2><p className="text-zinc-500 text-xs">Canlı önizleme sağda</p></div><button onClick={()=>setDraftSettings({...DEFAULT_SETTINGS})} className="text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-xl border border-zinc-700"><RotateCcw size={13}/></button></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2"><h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">📏 Kağıt Boyutu</h3><div className="grid grid-cols-2 gap-2">{(Object.keys(PAPER_LABELS) as PaperSize[]).map(ps=><button key={ps} onClick={()=>upDraft('paperSize',ps)} className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${draftSettings.paperSize===ps?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}><div className="font-black">{PAPER_LABELS[ps]}</div><div className={`text-[10px] mt-0.5 ${draftSettings.paperSize===ps?'text-zinc-800':'text-zinc-600'}`}>{ps==='58mm'?'Küçük termal':ps==='80mm'?'Standart termal':ps==='a5'?'148×210mm':'210×297mm'}</div></button>)}</div></div>
                <div className="space-y-2.5"><h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={11}/> Firma</h3><Field label="Şube Adı" value={draftSettings.companyName} onChange={v=>upDraft('companyName',v)}/><Field label="Alt Başlık" value={draftSettings.companySubtitle} onChange={v=>upDraft('companySubtitle',v)}/><Field label="Adres" icon={<MapPin size={10}/>} value={draftSettings.address} onChange={v=>upDraft('address',v)} placeholder="Cad. No..."/><Field label="Telefon" icon={<Phone size={10}/>} value={draftSettings.phone} onChange={v=>upDraft('phone',v)}/><Field label="Vergi No" icon={<Hash size={10}/>} value={draftSettings.taxNo} onChange={v=>upDraft('taxNo',v)}/></div>
                <div className="space-y-2.5"><h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><AlignLeft size={11}/> Alt Yazı</h3><Field label="1. Satır" value={draftSettings.footerLine1} onChange={v=>upDraft('footerLine1',v)}/><Field label="2. Satır" value={draftSettings.footerLine2} onChange={v=>upDraft('footerLine2',v)}/></div>
                <div><h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Eye size={11}/> Göster/Gizle</h3><Toggle label="Müşteri Vergi No" value={draftSettings.showTaxNo} onChange={v=>upDraft('showTaxNo',v)}/><Toggle label="Firma Adresi" value={draftSettings.showAddress} onChange={v=>upDraft('showAddress',v)}/><Toggle label="Firma Telefonu" value={draftSettings.showPhone} onChange={v=>upDraft('showPhone',v)}/><Toggle label="Web Sitesi" value={draftSettings.showWebsite} onChange={v=>upDraft('showWebsite',v)}/><Toggle label="Ürün KDV" value={draftSettings.showItemTax} onChange={v=>upDraft('showItemTax',v)}/></div>
                <div className="space-y-3"><h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Palette size={11}/> Görünüm</h3><div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Kenarlık</label><div className="grid grid-cols-3 gap-2">{(['thick','thin','none'] as const).map(b=><button key={b} onClick={()=>upDraft('borderStyle',b)} className={`py-2 rounded-xl text-xs font-bold border transition-all ${draftSettings.borderStyle===b?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{b==='thick'?'Kalın':b==='thin'?'İnce':'Yok'}</button>)}</div></div><div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Yazı</label><div className="grid grid-cols-3 gap-2">{(['small','normal','large'] as const).map(f=><button key={f} onClick={()=>upDraft('fontSize',f)} className={`py-2 rounded-xl text-xs font-bold border transition-all ${draftSettings.fontSize===f?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{f==='small'?'Küçük':f==='normal'?'Normal':'Büyük'}</button>)}</div></div></div>
              </div>
              <div className="p-3 border-t border-zinc-800 shrink-0 space-y-2">
                <button onClick={saveRSettings} className={`w-full py-3 rounded-2xl font-black flex items-center justify-center gap-2 text-sm ${settingsSaved?'bg-emerald-400 text-zinc-950':'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}>{settingsSaved?<><CheckCircle size={16}/> Kaydedildi!</>:<><Save size={16}/> Ayarları Kaydet</>}</button>
                <button onClick={()=>{setMergedPrint(null);setPrintSale(demoSale);setTimeout(()=>window.print(),100);}} className="w-full py-2.5 rounded-2xl font-bold flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-sm"><Printer size={13}/> Test Fişi</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-zinc-950 p-7">
              <div className="flex items-center gap-2 mb-4"><Eye size={13} className="text-emerald-500"/><span className="text-zinc-400 font-bold text-sm uppercase">Önizleme</span><span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-zinc-700 ml-2">{PAPER_LABELS[draftSettings.paperSize]}</span></div>
              <div className="bg-zinc-800/30 rounded-2xl p-5 flex justify-center"><div className="bg-white rounded-xl shadow-2xl shadow-black/60 overflow-hidden" style={{width:`${Math.min(PAPER_WIDTHS[draftSettings.paperSize],580)}px`}}><ReceiptTemplate sale={demoSale} settings={draftSettings} preview={true}/></div></div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODALLER ───────────────────────────────────────────────────── */}

      {isVeresiyeOpen&&<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4"><div className="bg-zinc-900 border border-zinc-700 rounded-[36px] w-full max-w-[480px] shadow-2xl overflow-hidden animate-in zoom-in duration-300"><div className="p-7 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50"><h3 className="text-xl font-black text-emerald-500 flex items-center gap-2"><Users size={22}/> Cari Seçimi</h3><button onClick={()=>setIsVeresiyeOpen(false)} className="text-zinc-500 hover:text-white"><X size={26}/></button></div><div className="p-7"><p className="text-zinc-400 mb-5 font-medium">Toplam <span className="text-white font-black text-2xl">₺{finalTotal.toFixed(2)}</span> hangi cariye?</p><select value={cartCustomer} onChange={e=>setCartCustomer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-2xl text-white outline-none mb-6 text-lg focus:border-emerald-500"><option value="">-- Müşteri Seçin --</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} (₺{(c.balance||0).toFixed(2)})</option>)}</select><button onClick={()=>finishSale('Veresiye')} className="w-full bg-emerald-500 text-zinc-950 font-black py-5 rounded-2xl text-lg shadow-lg shadow-emerald-500/20 active:scale-95">SATIŞI ONAYLA VE BORÇ YAZ</button></div></div></div>}

      {lastSale&&<div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200]"><div className="bg-zinc-900 p-10 rounded-[45px] text-center border-2 border-emerald-500/50 shadow-2xl animate-in zoom-in duration-500"><div className="bg-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40"><CheckCircle size={50} className="text-zinc-950"/></div><h2 className="text-3xl font-black mb-3 tracking-tighter uppercase">Satış Tamamlandı!</h2><p className="text-zinc-500 text-lg mb-8">Kasiyer: <strong className="text-white">{lastSale.staffName}</strong></p><div className="flex flex-col gap-3"><button onClick={()=>{setMergedPrint(null);setPrintSale(lastSale);setTimeout(()=>window.print(),100);}} className="bg-white text-zinc-950 px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-3 mx-auto hover:bg-zinc-200"><Printer size={20}/> FİŞ YAZDIR</button><button onClick={()=>setLastSale(null)} className="text-zinc-500 hover:text-white font-bold mt-3">Pencereyi Kapat</button></div></div></div>}

      {editingProduct&&<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[300] p-4"><div className="bg-zinc-900 border border-zinc-700 rounded-[28px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300"><div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center"><h3 className="text-lg font-black text-white flex items-center gap-2"><Pencil size={16} className="text-emerald-500"/> Ürün Düzenle</h3><button onClick={()=>setEditingProduct(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={20}/></button></div><form onSubmit={handleSaveEdit} className="p-6 grid grid-cols-2 gap-4"><div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase">Ürün Adı</label><input required value={editForm.name} onChange={e=>setEditForm((p:any)=>({...p,name:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 text-sm"/></div><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Barkod</label><input value={editForm.barcode} onChange={e=>setEditForm((p:any)=>({...p,barcode:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm"/></div><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={editForm.category} onChange={e=>setEditForm((p:any)=>({...p,category:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm"><option value="">— Seç —</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Birim</label><select value={editForm.unit} onChange={e=>setEditForm((p:any)=>({...p,unit:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm"><option>Adet</option><option>Koli</option><option>Paket</option></select></div><div className="space-y-1.5"><label className="text-xs font-bold text-blue-400 uppercase">Alış Fiyatı</label><input type="number" step="0.01" value={editForm.costPrice} onChange={e=>setEditForm((p:any)=>({...p,costPrice:e.target.value}))} className="w-full bg-blue-950/20 border border-blue-900 p-3 rounded-xl text-blue-300 outline-none text-sm"/></div><div className="space-y-1.5"><label className="text-xs font-bold text-emerald-400 uppercase">NET Satış</label><input type="number" step="0.01" value={editForm.netPrice} onChange={e=>setEditForm((p:any)=>({...p,netPrice:e.target.value}))} className="w-full bg-zinc-950 border border-emerald-900 p-3 rounded-xl text-white outline-none focus:border-emerald-500 text-sm"/></div><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">KDV %</label><select value={editForm.taxRate} onChange={e=>setEditForm((p:any)=>({...p,taxRate:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm"><option value="0">0</option><option value="1">1</option><option value="10">10</option><option value="20">20</option></select></div><div className="space-y-1.5"><label className="text-xs font-bold text-white uppercase">Brüt Fiyat</label><input type="number" step="0.01" value={editForm.grossPrice} onChange={e=>setEditForm((p:any)=>({...p,grossPrice:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm" placeholder="Boş = NET×KDV"/></div><div className="space-y-1.5"><label className="text-xs font-bold text-violet-400 uppercase">Stok</label><input type="number" value={editForm.stock} onChange={e=>setEditForm((p:any)=>({...p,stock:e.target.value}))} className="w-full bg-violet-950/20 border border-violet-900 p-3 rounded-xl text-violet-300 outline-none text-sm"/></div><div className="col-span-2 flex gap-3 pt-2 border-t border-zinc-800"><button type="button" onClick={()=>setEditingProduct(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="flex-1 bg-emerald-500 text-zinc-950 py-3 rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"><Save size={16}/> Kaydet</button></div></form></div></div>}

      {editingCustomer&&<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[300] p-4"><div className="bg-zinc-900 border border-zinc-700 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300"><div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center"><h3 className="text-lg font-black text-white flex items-center gap-2"><Pencil size={16} className="text-emerald-500"/> Müşteri Düzenle</h3><button onClick={()=>setEditingCustomer(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={20}/></button></div><form onSubmit={handleSaveCust} className="p-6 space-y-4"><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Ad</label><input required value={editCustForm.name} onChange={e=>setEditCustForm((p:any)=>({...p,name:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 text-sm"/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Vergi No</label><input value={editCustForm.taxNum} onChange={e=>setEditCustForm((p:any)=>({...p,taxNum:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm"/></div><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Telefon</label><input value={editCustForm.phone} onChange={e=>setEditCustForm((p:any)=>({...p,phone:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm"/></div></div><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={editCustForm.category} onChange={e=>setEditCustForm((p:any)=>({...p,category:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm"><option value="">— Seç —</option>{custCategories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><MessageSquare size={11}/> Not</label><textarea value={editCustForm.note} onChange={e=>setEditCustForm((p:any)=>({...p,note:e.target.value}))} rows={3} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-white outline-none text-sm resize-none" placeholder="Müşteri notu..."/></div><div className="flex gap-3 pt-2 border-t border-zinc-800"><button type="button" onClick={()=>setEditingCustomer(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="flex-1 bg-emerald-500 text-zinc-950 py-3 rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"><Save size={16}/> Kaydet</button></div></form></div></div>}

      {editingOrder&&<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[300] p-4"><div className="bg-zinc-900 border border-zinc-700 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300"><div className="p-6 border-b border-zinc-800 flex justify-between items-center"><h3 className="text-lg font-black text-white flex items-center gap-2"><Pencil size={16} className="text-orange-400"/> Sipariş Düzenle</h3><button onClick={()=>setEditingOrder(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={20}/></button></div><form onSubmit={handleUpdateOrder} className="p-6 space-y-4"><div className="space-y-3 max-h-60 overflow-y-auto">{editOrderCart.map((item:any,idx:number)=><div key={idx} className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800"><span className="font-bold text-zinc-300 flex-1 text-sm">{item.name}</span><div className="flex items-center gap-2"><button type="button" onClick={()=>setEditOrderCart(editOrderCart.map((i:any,ii:number)=>ii===idx?{...i,qty:Math.max(1,i.qty-1)}:i))} className="text-zinc-500 hover:text-emerald-500"><MinusCircle size={18}/></button><span className="w-6 text-center font-black text-sm">{item.qty}</span><button type="button" onClick={()=>setEditOrderCart(editOrderCart.map((i:any,ii:number)=>ii===idx?{...i,qty:i.qty+1}:i))} className="text-zinc-500 hover:text-emerald-500"><PlusCircle size={18}/></button></div><span className="text-emerald-400 font-black text-sm w-20 text-right">₺{((item.grossPrice||0)*item.qty).toFixed(2)}</span><button type="button" onClick={()=>setEditOrderCart(editOrderCart.filter((_:any,ii:number)=>ii!==idx))} className="text-zinc-700 hover:text-red-500"><Trash2 size={13}/></button></div>)}</div><div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-zinc-400 font-bold text-sm flex items-center gap-1"><Percent size={12}/> İskonto %</span><input type="number" min="0" max="100" value={editOrderDiscount} onChange={e=>setEditOrderDiscount(e.target.value)} className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-center text-white outline-none font-bold text-sm"/><span className="ml-auto font-black text-white text-sm">{(()=>{const r=editOrderCart.reduce((t:number,i:any)=>t+((i.grossPrice||0)*i.qty),0);const d=r*(parseFloat(editOrderDiscount)||0)/100;return `₺${(r-d).toFixed(2)}`;})()}</span></div><div className="flex gap-3 pt-2 border-t border-zinc-800"><button type="button" onClick={()=>setEditingOrder(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="flex-1 bg-orange-500 text-zinc-950 py-3 rounded-xl font-black flex items-center justify-center gap-2 text-sm"><Save size={16}/> Güncelle</button></div></form></div></div>}

      {/* Müşteri Detay Modal */}
      {selectedCustomer&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[36px] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3"><h2 className="text-2xl font-black text-white">{selectedCustomer.name}</h2>{selectedCustomer.category&&<span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:custCatColor(selectedCustomer.category)+'33',color:custCatColor(selectedCustomer.category)}}>{selectedCustomer.category}</span>}</div>
                <div className="flex gap-3 mt-1.5"><span className="flex items-center gap-1 text-zinc-400 text-sm bg-zinc-800 px-2.5 py-1 rounded-lg"><Phone size={12}/> {selectedCustomer.phone||'-'}</span><span className="text-zinc-400 text-sm bg-zinc-800 px-2.5 py-1 rounded-lg">V.No: {selectedCustomer.taxNum||'-'}</span></div>
                {selectedCustomer.note&&<p className="text-zinc-500 text-sm mt-1.5 italic">"{selectedCustomer.note}"</p>}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Güncel Bakiye</p><div className={`text-3xl font-black font-mono ${(selectedCustomer.balance||0)>0?'text-red-500':(selectedCustomer.balance||0)<0?'text-emerald-500':'text-zinc-600'}`}>{(selectedCustomer.balance||0)>0?`+₺${(selectedCustomer.balance||0).toFixed(2)}`:(selectedCustomer.balance||0)<0?`-₺${Math.abs(selectedCustomer.balance||0).toFixed(2)}`:'₺0.00'}</div></div>
                <button onClick={()=>setSelectedCustomer(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={22}/></button>
              </div>
            </div>

            {/* İstatistik */}
            {(()=>{const ct=customerSales.reduce((a:number,b:any)=>a+(b.total||0),0);const cth=sales.filter(s=>s.customerName===selectedCustomer.name&&s.method==='Tahsilat').reduce((a:number,b:any)=>a+(b.total||0),0);return(<div className="grid grid-cols-3 gap-px bg-zinc-800 border-b border-zinc-800 shrink-0"><div className="bg-zinc-900 p-4 text-center"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam Alışveriş</p><p className="text-2xl font-black text-white">₺{ct.toFixed(2)}</p></div><div className="bg-zinc-900 p-4 text-center"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Fatura Adedi</p><p className="text-2xl font-black text-white">{customerSales.length}</p></div><div className="bg-zinc-900 p-4 text-center"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam Tahsilat</p><p className="text-2xl font-black text-emerald-400">₺{cth.toFixed(2)}</p></div></div>);})()} 

            {/* Alt sekme geçişi */}
            <div className="flex border-b border-zinc-800 shrink-0 bg-zinc-950/20">
              {([['sales','Fatura Geçmişi'],['history','Ürün Geçmişi'],['orders','Siparişler']] as const).map(([tab,label])=>(
                <button key={tab} onClick={()=>setCustDetailTab(tab)} className={`px-6 py-3.5 font-bold text-sm border-b-2 transition-all ${custDetailTab===tab?'border-emerald-500 text-emerald-400':'border-transparent text-zinc-500 hover:text-zinc-300'}`}>{label}</button>
              ))}
              <div className="ml-auto flex items-center gap-3 px-4">
                {custDetailTab==='sales'&&<>
                  <input type="date" value={filterStart} onChange={e=>setFilterStart(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-500"/>
                  <span className="text-zinc-600">—</span>
                  <input type="date" value={filterEnd} onChange={e=>setFilterEnd(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-500"/>
                  {(filterStart||filterEnd)&&<button onClick={()=>{setFilterStart('');setFilterEnd('');}} className="text-zinc-500 hover:text-red-400 text-xs font-bold bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1"><X size={10}/> Temizle</button>}
                  {filteredSales.length>0&&<button onClick={toggleAll} className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl border ${allFiltSel?'bg-emerald-500/20 border-emerald-500/50 text-emerald-400':'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>{allFiltSel?<SquareCheck size={13}/>:<Square size={13}/>}{allFiltSel?'Kaldır':`Seç (${filteredSales.length})`}</button>}
                </>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">

              {/* Fatura Geçmişi */}
              {custDetailTab==='sales'&&<div className="space-y-3">
                {filteredSales.length===0&&<div className="text-center text-zinc-600 py-12 font-bold">{customerSales.length===0?'Fatura bulunamadı.':'Tarih aralığında fatura yok.'}</div>}
                {filteredSales.map((sale:any)=>{const isSel=selectedSaleIds.has(sale.id);return(
                  <div key={sale.id} className={`border rounded-2xl overflow-hidden transition-all ${isSel?'border-emerald-500 bg-emerald-500/5':'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
                    <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={()=>toggleSale(sale.id)}>
                      <div className={`shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center ${isSel?'bg-emerald-500 border-emerald-500':'border-zinc-600'}`}>{isSel&&<CheckCircle size={11} className="text-zinc-950"/>}</div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`shrink-0 px-3 py-1.5 rounded-xl text-center min-w-[56px] ${isSel?'bg-emerald-500/20':'bg-zinc-800'}`}><p className="text-zinc-500 text-[9px] font-bold uppercase">Fatura</p><p className="text-white font-black text-xs">#{sale.id?.slice(-5).toUpperCase()}</p></div>
                        <div className="min-w-0"><p className="text-white font-bold text-sm truncate">{sale.date}</p><div className="flex gap-1 mt-0.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block ${sale.method==='Veresiye'?'bg-orange-500/20 text-orange-400':sale.method==='Nakit'?'bg-emerald-500/20 text-emerald-400':'bg-blue-500/20 text-blue-400'}`}>{sale.method}</span>{sale.staffName&&<span className="text-[10px] text-zinc-600 px-1.5 py-0.5 bg-zinc-800 rounded">{sale.staffName}</span>}</div></div>
                      </div>
                      <p className={`text-xl font-black ${isSel?'text-emerald-400':'text-white'}`}>₺{(sale.total||0).toFixed(2)}</p>
                      <button onClick={ev=>{ev.stopPropagation();setMergedPrint(null);setPrintSale(sale);setTimeout(()=>window.print(),100);}} className="shrink-0 bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-300 px-3 py-2 rounded-xl font-bold flex items-center gap-1 border border-zinc-700 text-xs"><Printer size={12}/> Yazdır</button>
                    </div>
                    <div className="border-t border-zinc-800/50 px-4 pb-3"><div className="flex flex-wrap gap-1.5 mt-2">{(sale.items||[]).map((item:any,i:number)=><span key={i} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">{item.name} <span className="font-black text-zinc-300">×{item.qty}</span></span>)}</div></div>
                  </div>
                );})}
              </div>}

              {/* Ürün Geçmişi */}
              {custDetailTab==='history'&&(
                <div>
                  <p className="text-zinc-500 text-sm mb-4 font-medium">{selectedCustomer.name} müşterisinin tüm zamanlardaki ürün satın alma geçmişi</p>
                  {customerProductHistory.length===0?<div className="text-center text-zinc-600 py-12 font-bold">Henüz ürün satın alımı yok.</div>:(
                    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                      <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest"><tr><th className="p-4 text-left">Ürün Adı</th><th className="p-4 text-center">Toplam Adet</th><th className="p-4 text-right">Toplam Harcama</th><th className="p-4 text-center">Alım Sayısı</th><th className="p-4 text-left">Satın Alma Tarihleri</th></tr></thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {customerProductHistory.map((item,i)=>(
                          <tr key={i} className="hover:bg-zinc-800/30">
                            <td className="p-4 font-bold text-emerald-400">{item.name}</td>
                            <td className="p-4 text-center"><span className="bg-emerald-500 text-zinc-950 font-black text-sm px-3 py-1 rounded-full">{item.totalQty}</span></td>
                            <td className="p-4 text-right font-black text-white">₺{item.totalSpent.toFixed(2)}</td>
                            <td className="p-4 text-center text-zinc-400">{item.dates.length} fatura</td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {[...new Set(item.dates)].slice(0,6).map((d:string,di:number)=>(
                                  <span key={di} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg font-medium">{d}</span>
                                ))}
                                {[...new Set(item.dates)].length>6&&<span className="text-[10px] text-zinc-600">+{[...new Set(item.dates)].length-6} daha</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody></table>
                    </div>
                  )}
                </div>
              )}

              {/* Müşteriye Ait Siparişler */}
              {custDetailTab==='orders'&&(
                <div className="space-y-3">
                  {orders.filter(o=>o.customerName===selectedCustomer.name).length===0?<div className="text-center text-zinc-600 py-12 font-bold">Bu müşteriye ait sipariş yok.</div>:
                  orders.filter(o=>o.customerName===selectedCustomer.name).slice().reverse().map((order:any)=>{
                    const sc=statusConfig[order.status]||statusConfig['bekliyor'];
                    return(
                      <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-white text-sm">#{order.id?.slice(-5).toUpperCase()}</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            {order.deliveryDate&&<span className="text-xs text-zinc-500 flex items-center gap-1"><CalendarDays size={10}/> {order.deliveryDate}</span>}
                          </div>
                          <span className="font-black text-white">₺{(order.total||0).toFixed(2)}</span>
                        </div>
                        <div className="text-zinc-600 text-xs mt-1">{order.createdAt}{order.note&&` · ${order.note}`}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">{(order.items||[]).map((item:any,i:number)=><span key={i} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">{item.name} ×{item.qty}</span>)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedSaleIds.size>0&&custDetailTab==='sales'?(
              <div className="p-4 border-t-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-transparent shrink-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3"><div className="bg-emerald-500 text-zinc-950 font-black text-lg w-9 h-9 rounded-xl flex items-center justify-center">{selectedSaleIds.size}</div><div><p className="text-emerald-400 font-black text-sm">{selectedSaleIds.size} Fatura</p><p className="text-zinc-400 text-xs">₺{selTotal.toFixed(2)}</p></div></div>
                  <div className="flex gap-2"><button onClick={()=>setSelectedSaleIds(new Set())} className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-xl font-bold border border-zinc-700 text-xs flex items-center gap-1"><X size={12}/> Temizle</button><button onClick={handleMergedXlsx} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black flex items-center gap-1.5 text-xs"><FileSpreadsheet size={13}/> Paraşüt</button><button onClick={handleMergedPrint} className="bg-white hover:bg-zinc-100 text-zinc-950 px-4 py-2 rounded-xl font-black flex items-center gap-1.5 text-xs"><Printer size={13}/> Birleşik Yazdır</button></div>
                </div>
              </div>
            ):(
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex gap-3 shrink-0">
                <button onClick={()=>handleTahsilat(selectedCustomer)} className="flex-1 bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 text-sm"><Wallet size={16}/> TAHSİLAT AL</button>
                <button onClick={()=>{openEditCustomer(selectedCustomer);setSelectedCustomer(null);}} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-3.5 rounded-2xl font-bold border border-zinc-700 flex items-center gap-2 text-sm"><Pencil size={14}/> Düzenle</button>
                <button onClick={()=>{setSelectedCustomer(null);deleteDoc(doc(db,'customers',selectedCustomer.id));}} className="bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white px-5 py-3.5 rounded-2xl font-bold border border-zinc-700 flex items-center gap-2 text-sm"><Trash2 size={14}/> Sil</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    <div className="hidden print:block">
      {activePrintData&&<ReceiptTemplate sale={activePrintData} settings={receiptSettings}/>}
    </div>
    </>
  );
}

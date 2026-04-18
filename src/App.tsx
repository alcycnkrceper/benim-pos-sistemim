import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import {
  ShoppingCart, Package, Users, Plus, Trash2, Search, PlusCircle, MinusCircle,
  Wallet, UserPlus, CheckCircle, X, BarChart3, Printer, TrendingDown, TrendingUp,
  Zap, Phone, Percent, Download, Upload, FileSpreadsheet, CalendarDays,
  Square, SquareCheck, Save, RotateCcw, Building2, MapPin, Hash, AlignLeft,
  Palette, Eye, Boxes, AlertTriangle, ArrowDownToLine, ChevronDown,
  Pencil, ArrowUpDown, Ban, ShoppingBag,
  FileText, Receipt, MessageSquare, Filter, LogIn, LogOut, UserCog,
  Shield, RefreshCw, Tag
} from 'lucide-react';

// ─── Guaranteed-safe icon aliases ──────────────────────────────────────────
const FileEdit = FileText;
const FolderOpen = Boxes;
const ClipboardCheck = CheckCircle;
const UserCheck = Users;
const SendHorizonal = ArrowUpDown;
const ArrowLeftRight = ArrowUpDown;
const Clock = Eye;
const Key = Shield;
const Activity = BarChart3;
const Columns = ArrowUpDown;
const Settings = UserCog;
const SplitSquareHorizontal = Columns;
const CheckCircle2 = CheckCircle;
const Handshake = Users;
const BadgePercent = Tag;

// ─── XLSX CDN ──────────────────────────────────────────────────────────────
function loadXLSX(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).XLSX) return resolve((window as any).XLSX);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => resolve((window as any).XLSX);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─── FIREBASE ──────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAqPHwW06rOK_kPDoyHQ-ZOqGWZtCJSLzU",
  authDomain: "beyoglubuklet.firebaseapp.com", projectId: "beyoglubuklet",
  storageBucket: "beyoglubuklet.firebasestorage.app",
  messagingSenderId: "258370785541", appId: "1:258370785541:web:e517fab5f35ecfc8f5276c"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── TYPES ─────────────────────────────────────────────────────────────────
type PaperSize = '58mm'|'80mm'|'a5'|'a4';
type BorderStyle = 'thick'|'thin'|'none';
type FontSize = 'small'|'normal'|'large';
type StaffRole = 'admin'|'ozel';

interface ReceiptSettings {
  companyName:string; companySubtitle:string; address:string; phone:string;
  taxNo:string; website:string; footerLine1:string; footerLine2:string;
  showTaxNo:boolean; showAddress:boolean; showPhone:boolean; showWebsite:boolean; showItemTax:boolean;
  borderStyle:BorderStyle; fontSize:FontSize; paperSize:PaperSize;
  companyNameFontSize:number;
  companyNameSingleLine:boolean;
  companyNameAlign:'left'|'center'|'right';
  subtitleFontSize:number;
  subtitleAlign:'left'|'center'|'right';
  logoBase64:string|null;
  logoSize:number;
  logoAlign:'left'|'center'|'right';
  pagePadding:number;
  itemPadding:number;
  lineHeight:number;
}
const DEFAULT_SETTINGS: ReceiptSettings = {
  companyName:'MERKEZ ŞUBE', companySubtitle:'TOPTAN TİCARET VE SATIŞ FİŞİ',
  address:'', phone:'', taxNo:'', website:'',
  footerLine1:'BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜR EDERİZ.', footerLine2:'YİNE BEKLERİZ!',
  showTaxNo:true, showAddress:false, showPhone:false, showWebsite:false, showItemTax:false,
  borderStyle:'thick', fontSize:'normal', paperSize:'a4',
  companyNameFontSize:36,
  companyNameSingleLine:false,
  companyNameAlign:'left',
  subtitleFontSize:11,
  subtitleAlign:'left',
  logoBase64:null,
  logoSize:80,
  logoAlign:'center',
  pagePadding: 0,
  itemPadding: 2,
  lineHeight: 1.1
};

const PAPER_WIDTHS:Record<PaperSize,number> = {'58mm':220,'80mm':310,'a5':520,'a4':680};
const PAPER_LABELS:Record<PaperSize,string> = {'58mm':'Termal 58mm','80mm':'Termal 80mm','a5':'A5','a4':'A4'};

const ALL_PERMISSIONS = [
  {key:'pos',group:'Satış',label:'Hızlı Satış (POS)',icon:'🛒'},
  {key:'orders',group:'Satış',label:'Siparişli Satışlar',icon:'📦'},
  {key:'quotes',group:'Satış',label:'Teklifler',icon:'📝'},
  {key:'returns',group:'Satış',label:'İade & Değişim',icon:'🔄'},
  {key:'purchases',group:'Stok',label:'Alış Faturaları',icon:'⬇️'},
  {key:'stock.products',group:'Stok',label:'Ürünler',icon:'📋'},
  {key:'stock.movements',group:'Stok',label:'Stok Hareketleri',icon:'↕️'},
  {key:'stock.count',group:'Stok',label:'Stok Sayımı',icon:'🔢'},
  {key:'stock.tracking',group:'Stok',label:'Stok Takibi',icon:'📊'},
  {key:'stock.category',group:'Stok',label:'Kategoriler',icon:'🏷️'},
  {key:'customers',group:'Cari',label:'Cari Hesaplar',icon:'👥'},
  {key:'customers.tahsilat',group:'Cari',label:'Tahsilat Alma',icon:'💵'},
  {key:'reports.genel',group:'Rapor',label:'Genel Rapor',icon:'📈'},
  {key:'reports.gunSonu',group:'Rapor',label:'Gün Sonu Raporu',icon:'🌙'},
  {key:'reports.kdv',group:'Rapor',label:'KDV Raporu',icon:'🧾'},
  {key:'reports.personel',group:'Rapor',label:'Personel Geçmişi',icon:'🔍'},
  {key:'receipt',group:'Ayarlar',label:'Fiş Tasarımı',icon:'🖨️'},
  {key:'personel',group:'Ayarlar',label:'Personel Yönetimi',icon:'🔑'},
] as const;

// ─── PARAŞÜT ──────────────────────────────────────────────────────────────
const PARASUT_HELP = 'Satış Faturaları\n\n- Yıldız ile belirlenen alanları doldurmanız yeterlidir.\n- Bir faturaya birden fazla hizmet/ürün eklemek için faturayı takip eden satırlarda sadece hizmet/ürün detaylarını doldurun.\n- KDV Oranı 10 Temmuz 2023 itibariyle 0, 1, 10 veya 20 olmalıdır.\n- Tablonun sütun yapısını bozmayın.\n- Bu yardım metnini silmeyin.\n\n- Destek için destek@parasut.com veya 0212 292 04 94';
const PARASUT_HEADERS=['MÜŞTERİ ÜNVANI *','FATURA İSMİ','FATURA TARİHİ','DÖVİZ CİNSİ','DÖVİZ KURU','VADE TARİHİ','TAHSİLAT TL KARŞILIĞI','FATURA TÜRÜ','FATURA SERİ','FATURA SIRA NO','KATEGORİ','HİZMET/ÜRÜN *','HİZMET/ÜRÜN AÇIKLAMASI','ÇIKIŞ DEPOSU','MİKTAR *','BİRİM FİYATI *','İNDİRİM TUTARI','KDV ORANI *','ÖİV ORANI','KONAKLAMA VERGİSİ ORANI'];
const nKdv=(r?:number)=>{const v=r??20;if(v===0)return 0;if(v<=1)return 1;if(v<=15)return 10;return 20;};
const parseDT=(ds:string):Date=>{const[dp]=(ds??'').split(' ');const p=dp.split('.');if(p.length!==3)return new Date();return new Date(+p[2],+p[1]-1,+p[0]);};
const xn=(v:number,z='General')=>({t:'n' as const,v,z});
const xd=(v:Date)=>({t:'d' as const,v,z:'yyyy-mm-dd'});
const xs=(v:string)=>({t:'s' as const,v});
const xe=()=>({t:'z' as const,v:null});

async function exportParasut(arr:any[],fname?:string,opts:{firmName?:string;depotName?:string;invoicePrefix?:string}={}){
  const XLSX=await loadXLSX();
  const inv=arr.filter(s=>s.method!=='Tahsilat'&&(s.items||[]).length>0);
  const depot=String(opts.depotName||'').trim();
  const invPrefix=String(opts.invoicePrefix||'FTR').trim()||'FTR';
  const rows:any[][]=[];
  let lineCount=0;
  rows.push([xs(PARASUT_HELP),...Array.from({length:19},xe)]);
  rows.push(Array.from({length:20},xe));
  rows.push(PARASUT_HEADERS.map(xs));
  inv.forEach((sale,idx)=>{
    const saleItems=(sale.items??[]).filter((it:any)=>String(it?.name||'').trim()!=='');
    saleItems.forEach((item:any,ii:number)=>{
      const k=nKdv(item.taxRate),q=Math.max(0.001,Number(item.qty)||1),up=Math.max(0,Number(item.grossPrice)||0);
      const customer=String(sale.customerName||opts.firmName||'Perakende Müşteri').trim();
      const invName=invPrefix+'-'+(String(idx+1).padStart(4,'0'));
      lineCount++;
      if(ii===0) rows.push([xs(customer),xs(invName),xd(parseDT(sale.date)),xs('TRL'),xe(),xe(),xe(),xs('Fatura'),xs(invPrefix),xn(idx+1,'0'),xe(),xs(String(item.name||'Ürün')),xe(),(depot?xs(depot):xe()),xn(q),xn(up),xn(Number(sale.discountAmount)||0),xn(k,'#,##0.00'),xe(),xe()]);
      else rows.push([xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xe(),xs(String(item.name||'Ürün')),xe(),xe(),xn(q),xn(up),xn(0),xn(k,'#,##0.00'),xe(),xe()]);
    });
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[30,22,14,12,12,14,22,14,12,14,14,28,28,16,10,16,16,12,10,22].map(wch=>({wch}));
  ws['!rows']=[{hpt:300}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Satış Faturaları');
  XLSX.writeFile(wb,fname||'parasut_'+(new Date().toISOString().slice(0,10))+'.xlsx');
  return{invoiceCount:inv.length,lineCount};
}

function ReceiptTemplate({sale,settings,preview=false}:{sale:any;settings:ReceiptSettings;preview?:boolean}){
  if(!sale)return null;
  const pw=PAPER_WIDTHS[settings.paperSize];
  const fsMap={small:0.82,normal:1,large:1.18};
  const fs=fsMap[settings.fontSize];
  const bdr=settings.borderStyle==='thick'?'4px solid black':settings.borderStyle==='thin'?'1px solid #555':'0px solid transparent';
  const hBdr=settings.borderStyle==='none'?'2px solid #e5e7eb':bdr;
  const small=settings.paperSize==='58mm';
  const cnSize=settings.companyNameFontSize??36;
  const stSize=settings.subtitleFontSize??11;
  const itemPad=(settings.itemPadding??2);
  return (
    <div style={{maxWidth:preview?'100%':pw+'px',margin:'0 auto',padding:preview?'16px':String(settings.pagePadding??0)+'px',background:'white',color:'black',fontFamily:'Arial,sans-serif',fontSize:(fs)+'rem',border:preview?'none':bdr,boxSizing:'border-box',lineHeight:settings.lineHeight??1.1}}>
      {settings.logoBase64&&(
        <div style={{textAlign:settings.logoAlign??'center',marginBottom:10}}>
          <img src={settings.logoBase64} alt="logo" style={{width:(settings.logoSize??80)+'px',height:'auto',display:'inline-block'}}/>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',paddingBottom:'10px',marginBottom:'10px',borderBottom:hBdr}}>
        <div style={{flex:1}}>
          <div style={{fontSize:cnSize+'px',fontWeight:900,textTransform:'uppercase',letterSpacing:'-0.02em',lineHeight:1.1,textAlign:settings.companyNameAlign??'left',whiteSpace:settings.companyNameSingleLine?'nowrap':'normal',overflow:settings.companyNameSingleLine?'hidden':'visible',textOverflow:settings.companyNameSingleLine?'ellipsis':'clip'}}>{settings.companyName}</div>
          <div style={{fontSize:stSize+'px',fontWeight:700,color:'#666',marginTop:3,textAlign:settings.subtitleAlign??'left'}}>{settings.companySubtitle}</div>
          {settings.showAddress&&settings.address&&<div style={{fontSize:(fs*0.68).toFixed(2)+'rem',color:'#555',marginTop:2}}>📍 {settings.address}</div>}
          {settings.showPhone&&settings.phone&&<div style={{fontSize:(fs*0.68).toFixed(2)+'rem',color:'#555'}}>📞 {settings.phone}</div>}
          {sale.isMerged&&<div style={{fontSize:(fs*0.62).toFixed(2)+'rem',fontWeight:700,color:'#666',marginTop:5,background:'#f3f4f6',padding:'2px 6px',borderRadius:4,display:'inline-block'}}>BİRLEŞİK — {sale.mergedCount} satış</div>}
        </div>
        <div style={{textAlign:'right',fontSize:(fs*0.72).toFixed(2)+'rem'}}>
          <div><strong>TARİH:</strong> {sale.isMerged?new Date().toLocaleDateString('tr-TR'):sale.date?.split(' ')[0]}</div>
          {sale.isMerged&&sale.dateRange&&<div style={{color:'#666'}}><strong>DÖNEM:</strong> {sale.dateRange}</div>}
          {!sale.isMerged&&<div><strong>SAAT:</strong> {sale.date?.split(' ')[1]}</div>}
          <div><strong>FİŞ NO:</strong> #{sale.id?.slice(-6).toUpperCase()}</div>
          {sale.staffName&&<div style={{color:'#888'}}><strong>KASİYER:</strong> {sale.staffName}</div>}
        </div>
      </div>
      <div style={{background:'#f9fafb',border:'2px solid '+(settings.borderStyle==='none'?'#e5e7eb':'#000'),borderRadius:6,padding:(small?4:10)+'px',marginBottom:10}}>
        <div style={{fontSize:(fs*(small?0.9:1.1)).toFixed(2)+'rem',fontWeight:900,textTransform:'uppercase'}}>SAYIN: {sale.customerName}</div>
        {settings.showTaxNo&&<div style={{fontWeight:700,color:'#555',marginTop:2,fontSize:(fs*0.78).toFixed(2)+'rem'}}>VERGİ/TC: {sale.customerTax||'-'}</div>}
        <div style={{fontWeight:700,color:'#555',marginTop:2,fontSize:(fs*0.78).toFixed(2)+'rem'}}>ÖDEME: {sale.method}</div>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
        <thead>
          <tr style={{borderBottom:hBdr}}>
            <th style={{textAlign:'left',padding:itemPad+'px 0',fontSize:(fs*0.88).toFixed(2)+'rem'}}>ÜRÜN</th>
            <th style={{textAlign:'center',padding:itemPad+'px 0',fontSize:(fs*0.88).toFixed(2)+'rem'}}>MİKTAR</th>
            {settings.showItemTax&&<th style={{textAlign:'center',fontSize:(fs*0.88).toFixed(2)+'rem'}}>KDV</th>}
            {!small&&<th style={{textAlign:'right',padding:itemPad+'px 0',fontSize:(fs*0.88).toFixed(2)+'rem'}}>BİRİM</th>}
            <th style={{textAlign:'right',padding:itemPad+'px 0',fontSize:(fs*0.88).toFixed(2)+'rem'}}>TOPLAM</th>
          </tr>
        </thead>
        <tbody>
          {(sale.items||[]).map((item:any,i:number)=>(
            <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
              <td style={{padding:itemPad+'px 0',fontWeight:700,fontSize:(fs*0.85).toFixed(2)+'rem'}}>{item.name}</td>
              <td style={{padding:itemPad+'px 0',textAlign:'center',fontWeight:900}}>{Number(item.qty)||0}</td>
              {settings.showItemTax&&<td style={{textAlign:'center',color:'#666',fontSize:(fs*0.8).toFixed(2)+'rem'}}>%{nKdv(item.taxRate)}</td>}
              {!small&&<td style={{padding:itemPad+'px 0',textAlign:'right',color:'#555',fontSize:(fs*0.85).toFixed(2)+'rem'}}>₺{(item.grossPrice||0).toFixed(2)}</td>}
              <td style={{padding:itemPad+'px 0',textAlign:'right',fontWeight:900,fontSize:(fs*0.9).toFixed(2)+'rem'}}>₺{((item.grossPrice||0)*(Number(item.qty)||0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <div style={{width:small?'100%':'260px',borderTop:hBdr,paddingTop:6}}>
          <div style={{display:'flex',justifyContent:'space-between',color:'#555',marginBottom:2,fontSize:(fs*0.85).toFixed(2)+'rem',fontWeight:700}}>
            <span>Ara Toplam:</span><span>₺{(sale.subTotal||sale.total||0).toFixed(2)}</span>
          </div>
          {(sale.discountAmount||0)>0&&(
            <div style={{display:'flex',justifyContent:'space-between',color:'#555',marginBottom:4,paddingBottom:4,borderBottom:'1px solid #e5e7eb',fontSize:(fs*0.85).toFixed(2)+'rem',fontWeight:700}}>
              <span>İskonto:</span><span>- ₺{(sale.discountAmount||0).toFixed(2)}</span>
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:(fs*(small?1.3:1.8)).toFixed(2)+'rem',marginTop:4}}>
            <span>TOPLAM:</span><span>₺{(sale.total||0).toFixed(2)}</span>
          </div>
        </div>
      </div>
      {(settings.footerLine1||settings.footerLine2)&&(
        <div style={{marginTop:16,textAlign:'center',borderTop:'2px dashed #d1d5db',paddingTop:8,color:'#9ca3af',fontWeight:700,fontSize:(fs*0.72).toFixed(2)+'rem'}}>
          {settings.footerLine1&&<div>{settings.footerLine1}</div>}
          {settings.footerLine2&&<div style={{marginTop:2}}>{settings.footerLine2}</div>}
        </div>
      )}
    </div>
  );
}

// ─── GİRİŞ EKRANI ──────────────────────────────────────────────────────────
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
    else setError('PIN hatalı veya personel seçilmedi.');
  };
  const handleCreateAdmin=async()=>{
    if(staffList.length>0)return;
    await addDoc(collection(db,'staff'),{name:'Yönetici',role:'admin',pin:'1234',permissions:[],createdAt:new Date().toLocaleString('tr-TR')});
    alert('Admin oluşturuldu. PIN: 1234');
  };
  return (
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
                {staffList.map(s=><option key={s.id} value={s.id}>{s.name} ({s.role==='admin'?'Admin':'Özel'})</option>)}
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
  const [quotes,setQuotes]=useState<any[]>([]);
  // ── Nav ───────────────────────────────────────────────────────────────
  const [activePage,setActivePage]=useState('pos');
  const [stockOpen,setStockOpen]=useState(true);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  // ── POS ───────────────────────────────────────────────────────────────
  const [cart,setCart]=useState<any[]>([]);
  const [searchQuery,setSearchQuery]=useState('');
  const [cartCustomer,setCartCustomer]=useState('');
  const [cartCustomerSearch,setCartCustomerSearch]=useState('');
  const [showCartCustDropdown,setShowCartCustDropdown]=useState(false);
  const [discountPct,setDiscountPct]=useState('');
  const [flash,setFlash]=useState(false);
  const [lastSale,setLastSale]=useState<any>(null);
  const [isVeresiyeOpen,setIsVeresiyeOpen]=useState(false);
  const [printSale,setPrintSale]=useState<any>(null);
  const [mergedPrint,setMergedPrint]=useState<any>(null);
  // ── Order mode ────────────────────────────────────────────────────────
  const [orderMode,setOrderMode]=useState(false);
  const [orderCustomer,setOrderCustomer]=useState('');
  const [orderNote,setOrderNote]=useState('');
  const [orderDeliveryDate,setOrderDeliveryDate]=useState('');
  const [orderFilter,setOrderFilter]=useState('all');
  const [editingOrder,setEditingOrder]=useState<any>(null);
  const [editOrderCart,setEditOrderCart]=useState<any[]>([]);
  const [editOrderDiscount,setEditOrderDiscount]=useState('');
  // ── Quotes ────────────────────────────────────────────────────────────
  const [quoteDraft,setQuoteDraft]=useState<any[]>([]);
  const [quoteCustomer,setQuoteCustomer]=useState('');
  const [quoteDiscount,setQuoteDiscount]=useState('');
  const [quoteNote,setQuoteNote]=useState('');
  const [quoteSearch,setQuoteSearch]=useState('');
  const [quoteFilter,setQuoteFilter]=useState('all');
  const [printQuote,setPrintQuote]=useState<any>(null);
  // ── Split pay ─────────────────────────────────────────────────────────
  const [splitModal,setSplitModal]=useState(false);
  const [splitNakit,setSplitNakit]=useState('');
  const [splitKart,setSplitKart]=useState('');
  // ── Returns ───────────────────────────────────────────────────────────
  const [returnSaleId,setReturnSaleId]=useState('');
  const [returnSale,setReturnSale]=useState<any>(null);
  const [returnLines,setReturnLines]=useState<{itemIdx:number;qty:number|string;reason:string}[]>([]);
  const [returnType,setReturnType]=useState<'iade'|'degisim'>('iade');
  const [exchangeCart,setExchangeCart]=useState<any[]>([]);
  const [returnNote,setReturnNote]=useState('');
  // ── Products ──────────────────────────────────────────────────────────
  const [showAddForm,setShowAddForm]=useState(false);
  const [pName,setPName]=useState('');const [pBarcode,setPBarcode]=useState('');
  const [pUnit,setPUnit]=useState('Adet');const [pCost,setPCost]=useState('');
  const [pNet,setPNet]=useState('');const [pTax,setPTax]=useState('20');
  const [pStock,setPStock]=useState('0');const [pCat,setPCat]=useState('');
  const [editingProduct,setEditingProduct]=useState<any>(null);
  const [editForm,setEditForm]=useState<any>({});
  const [productSearch,setProductSearch]=useState('');
  const [productCategoryFilter,setProductCategoryFilter]=useState('all');
  const [productVariantFilter,setProductVariantFilter]=useState<'all'|'variant'|'single'>('all');
  const [productStockFilter,setProductStockFilter]=useState<'all'|'in'|'low'|'out'>('all');
  const [productSort,setProductSort]=useState<'name-asc'|'name-desc'|'price-asc'|'price-desc'|'stock-asc'|'stock-desc'>('name-asc');
  // ── Customers ─────────────────────────────────────────────────────────
  const [showCustomerForm,setShowCustomerForm]=useState(false);
  const [customerSearchQuery,setCustomerSearchQuery]=useState('');
  const [cName,setCName]=useState('');const [cPhone,setCPhone]=useState('');
  const [cTaxNum,setCTaxNum]=useState('');const [cCat,setCCat]=useState('');const [cNote,setCNote]=useState('');
  const [editingCustomer,setEditingCustomer]=useState<any>(null);
  const [editCustForm,setEditCustForm]=useState<any>({});
  const [selectedCustomer,setSelectedCustomer]=useState<any>(null);
  const [custDetailTab,setCustDetailTab]=useState<'sales'|'history'|'orders'>('sales');
  const [filterStart,setFilterStart]=useState('');const [filterEnd,setFilterEnd]=useState('');
  const [selectedSaleIds,setSelectedSaleIds]=useState<Set<string>>(new Set());
  // ── Stock ─────────────────────────────────────────────────────────────
  const [stockSearch,setStockSearch]=useState('');
  const [stockCatFilter,setStockCatFilter]=useState('all');
  const [stockFilter,setStockFilter]=useState<'all'|'low'|'out'>('all');
  const [lowStockLimit,setLowStockLimit]=useState(5);
  const [countDraft,setCountDraft]=useState<Record<string,string>>({});
  const [countSaved,setCountSaved]=useState(false);
  const [mvStart,setMvStart]=useState('');const [mvEnd,setMvEnd]=useState('');
  const [mvType,setMvType]=useState<'all'|'in'|'out'>('all');
  const [newCatName,setNewCatName]=useState('');const [newCatColor,setNewCatColor]=useState('#10b981');
  const [categoryEditor,setCategoryEditor]=useState<any>(null);
  const [categoryEditorSearch,setCategoryEditorSearch]=useState('');
  const [categoryEditorSelected,setCategoryEditorSelected]=useState<Set<string>>(new Set());
  const [categoryEditorSaving,setCategoryEditorSaving]=useState(false);
  const [newCustCatName,setNewCustCatName]=useState('');const [newCustCatColor,setNewCustCatColor]=useState('#3b82f6');
  // ── Purchases ─────────────────────────────────────────────────────────
  const [showPurchaseForm,setShowPurchaseForm]=useState(false);
  const [purchaseSupplier,setPurchaseSupplier]=useState('');const [purchaseDate,setPurchaseDate]=useState('');
  const [purchaseNote,setPurchaseNote]=useState('');
  const [purchaseLines,setPurchaseLines]=useState<{productId:string;qty:string;cost:string}[]>([{productId:'',qty:'',cost:''}]);
  const [expandedPurchase,setExpandedPurchase]=useState<string|null>(null);
  // ── Reports ───────────────────────────────────────────────────────────
  const [expName,setExpName]=useState('');const [expAmount,setExpAmount]=useState('');
  const [reportDate,setReportDate]=useState(new Date().toISOString().slice(0,10));
  const [reportTab,setReportTab]=useState<'genel'|'gunSonu'|'kdv'|'personel'|'aylik'|'parasut'>('genel');
  const [reportMonth,setReportMonth]=useState(new Date().toISOString().slice(0,7)); // YYYY-MM
  const [settingsTab,setSettingsTab]=useState<'fis'|'parasut'>('fis');
  const [parasutFirm,setParasutFirm]=useState(()=>localStorage.getItem('parasutFirm')||'');
  const [parasutDepot,setParasutDepot]=useState(()=>localStorage.getItem('parasutDepot')||'');
  const parasutFirmTrim=parasutFirm.trim();
  const parasutDepotTrim=parasutDepot.trim();
  const parasutReady=parasutFirmTrim.length>0;
  const parasutOpts=useMemo(()=>({firmName:parasutFirmTrim,depotName:parasutDepotTrim,invoicePrefix:'FTR'}),[parasutFirmTrim,parasutDepotTrim]);
  const [staffLogFilter,setStaffLogFilter]=useState('all');
  const [staffLogDateFilter,setStaffLogDateFilter]=useState('');
  // ── Staff ─────────────────────────────────────────────────────────────
  const [newStaffName,setNewStaffName]=useState('');
  const [newStaffPin,setNewStaffPin]=useState('');
  const [newStaffRole,setNewStaffRole]=useState<StaffRole>('ozel');
  const [newStaffPerms,setNewStaffPerms]=useState<string[]>(['pos','orders','returns','customers','customers.tahsilat']);
  const [editingStaff,setEditingStaff]=useState<any>(null);
  const [editStaffPerms,setEditStaffPerms]=useState<string[]>([]);
  const [editStaffPin,setEditStaffPin]=useState('');
  // ── Dashboard ────────────────────────────────────────────────────────
  const [dashPeriod,setDashPeriod]=useState<'7'|'30'|'90'>('30');
  // ── Toplu Fiyat ──────────────────────────────────────────────────────
  const [bulkSelected,setBulkSelected]=useState<Set<string>>(new Set());
  const [bulkPct,setBulkPct]=useState('');
  const [bulkType,setBulkType]=useState<'zam'|'indirim'>('zam');
  const [bulkField,setBulkField]=useState<'grossPrice'|'costPrice'>('grossPrice');
  const [bulkDone,setBulkDone]=useState(false);
  // ── Ürün Varyantları ──────────────────────────────────────────────────
  const [variantProduct,setVariantProduct]=useState<any>(null);
  const [variantGroupName,setVariantGroupName]=useState('');
  const [variantSearch,setVariantSearch]=useState('');
  const [variantSelectedIds,setVariantSelectedIds]=useState<Set<string>>(new Set());
  // ── Fiyat Geçmişi ─────────────────────────────────────────────────────
  const [priceHistoryProduct,setPriceHistoryProduct]=useState<any>(null);
  const [priceHistory,setPriceHistory]=useState<any[]>([]);
  const [priceHistoryLoading,setPriceHistoryLoading]=useState(false);
  // ── Receipt ───────────────────────────────────────────────────────────
  const [receiptSettings,setReceiptSettings]=useState<ReceiptSettings>(DEFAULT_SETTINGS);
  const [draftSettings,setDraftSettings]=useState<ReceiptSettings>(DEFAULT_SETTINGS);
  const [settingsSaved,setSettingsSaved]=useState(false);

  const fileInputRefProd=useRef<HTMLInputElement>(null);
  const fileInputRefCust=useRef<HTMLInputElement>(null);
  const CAT_COLORS=['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

  // ── Firebase listeners ────────────────────────────────────────────────
  useEffect(()=>{
    const uns=[
      onSnapshot(collection(db,'products'),s=>setProducts(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'customers'),s=>setCustomers(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'sales'),s=>setSales(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'expenses'),s=>setExpenses(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'purchases'),s=>setPurchases(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'categories'),s=>setCategories(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'custCategories'),s=>setCustCategories(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'orders'),s=>setOrders(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'returns'),s=>setReturns(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'staff'),s=>setStaffList(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'staffLogs'),s=>setStaffLogs(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,'quotes'),s=>setQuotes(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(doc(db,'settings','receipt'), d => {
        if(d.exists()) {
          const data = d.data() as ReceiptSettings;
          setReceiptSettings({...DEFAULT_SETTINGS, ...data});
          setDraftSettings({...DEFAULT_SETTINGS, ...data});
        }
      })
    ];
    return()=>uns.forEach(u=>u());
  },[]);

  // ── Barkod okuyucu ────────────────────────────────────────────────────
  useEffect(()=>{
    let buf=''; let lastKeyTime=0; let bufTimer:any=null;
    const SPEED=80;
    const hk=(e:KeyboardEvent)=>{
      const now=Date.now();
      const inInput=(e.target as HTMLElement).tagName==='INPUT'||(e.target as HTMLElement).tagName==='SELECT'||(e.target as HTMLElement).tagName==='TEXTAREA';
      const timeSince=now-lastKeyTime; lastKeyTime=now;
      if(e.key==='Enter'){
        if(buf.length>2){
          const f=products.find(p=>p.barcode===buf);
          if(f){setActivePage('pos');addToCart(f);setFlash(true);setTimeout(()=>setFlash(false),300);setSearchQuery('');}
        }
        buf=''; return;
      }
      if(inInput&&timeSince>SPEED)return;
      if(e.key.length===1)buf+=e.key;
      if(bufTimer)clearTimeout(bufTimer);
      bufTimer=setTimeout(()=>{buf='';},300);
    };
    window.addEventListener('keydown',hk);
    return()=>{window.removeEventListener('keydown',hk);if(bufTimer)clearTimeout(bufTimer);};
  },[products]);

  useEffect(()=>{
    if(activePage==='stock.count'){
      const d:Record<string,string>={};
      products.forEach(p=>{d[p.id]=String(p.stock||0);});
      setCountDraft(d);
    }
  },[activePage]);

  useEffect(()=>{
    if(!selectedCustomer){setFilterStart('');setFilterEnd('');setSelectedSaleIds(new Set());setCustDetailTab('sales');}
  },[selectedCustomer]);

  useEffect(()=>{
    if(!categoryEditor){
      setCategoryEditorSearch('');
      setCategoryEditorSelected(new Set());
      return;
    }
    const ids=products.filter(p=>(p.category||'')===categoryEditor.name).map(p=>p.id);
    setCategoryEditorSearch('');
    setCategoryEditorSelected(new Set(ids));
  },[categoryEditor,products]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const catColor=(name:string)=>categories.find(c=>c.name===name)?.color||'#6b7280';
  const custCatColor=(name:string)=>custCategories.find(c=>c.name===name)?.color||'#6b7280';
  const calcGross=(net:string,tax:string)=>net?(parseFloat(net)*(1+parseFloat(tax)/100)).toFixed(2):'0.00';
  const roleLabel=(staff:any)=>staff?.role==='admin'?'🔑 Admin (Tam Yetki)':'⚙️ Özel ('+((staff?.permissions||[]).length)+' yetki)';
  const getVariantGroupKey=(product:any)=>{
    const groupId=String(product?.variantGroupId||'').trim();
    if(groupId)return 'gid:'+groupId;
    const groupName=String(product?.variantGroup||'').trim().toLowerCase();
    return groupName?'name:'+groupName:'';
  };
  const getVariantGroupMembers=(product:any)=>{
    const key=getVariantGroupKey(product);
    if(!key)return [];
    return products.filter(p=>getVariantGroupKey(p)===key);
  };
  const getVariantPricingTargets=(product:any)=>{
    const members=getVariantGroupMembers(product);
    return members.length>0?members:[product];
  };
  const getVariantPricePatch=(product:any)=>{
    const costPrice=Number(product?.costPrice);
    const netPrice=Number(product?.netPrice);
    const grossPrice=Number(product?.grossPrice);
    const parsedTax=Number.parseInt(String(product?.taxRate??20),10);
    return {
      costPrice:Number.isFinite(costPrice)?costPrice:0,
      netPrice:Number.isFinite(netPrice)?netPrice:0,
      taxRate:Number.isNaN(parsedTax)?20:parsedTax,
      grossPrice:Number.isFinite(grossPrice)?grossPrice:0,
    };
  };
  const toggleBulkSelection=(product:any)=>{
    const targetIds=getVariantPricingTargets(product).map((item:any)=>item.id);
    setBulkSelected(prev=>{
      const next=new Set(prev);
      const shouldSelect=targetIds.some((id:string)=>!next.has(id));
      targetIds.forEach((id:string)=>{
        if(shouldSelect)next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };
  const canDo=(action:string)=>{
    if(!currentStaff)return false;
    if(currentStaff.role==='admin')return true;
    const perms:string[]=currentStaff.permissions||[];
    if(action.startsWith('rapor.'))return perms.includes(action.replace('rapor.','reports.'));
    if(action.startsWith('stock'))return perms.includes(action)||perms.includes('stock');
    return perms.includes(action);
  };
  const stockColor=(stock:number)=>{
    if(stock===0)return{text:'text-red-500',badge:'bg-red-500',bar:'bg-red-500',ring:'border-red-500/30 bg-red-500/5'};
    if(stock<=lowStockLimit)return{text:'text-orange-400',badge:'bg-orange-400',bar:'bg-orange-400',ring:'border-orange-500/30 bg-orange-500/5'};
    return{text:'text-emerald-400',badge:'bg-emerald-500',bar:'bg-emerald-500',ring:'border-zinc-800 bg-zinc-900/50'};
  };
  const calcPct=(stock:number,maxStock:number)=>maxStock>0?Math.min(100,Math.floor(stock*100/maxStock)):0;
  const pieColor=(i:number)=>PIE_COLORS[i<PIE_COLORS.length?i:i-PIE_COLORS.length*(i/PIE_COLORS.length|0)];
  const catStyle=(color:string)=>({background:color+'33',color:color});
  const catStyleOf=(cat:string)=>{const c=catColor(cat);return{background:c+'33',color:c};};
  const statusConfig:Record<string,{label:string;color:string;bg:string}>={
    'bekliyor':{label:'Bekliyor',color:'text-orange-400',bg:'bg-orange-500/20'},
    'hazirlaniyor':{label:'Hazırlanıyor',color:'text-blue-400',bg:'bg-blue-500/20'},
    'gönderildi':{label:'Gönderildi',color:'text-emerald-400',bg:'bg-emerald-500/20'},
    'iptal':{label:'İptal',color:'text-red-400',bg:'bg-red-500/20'},
  };
  const logAction=async(action:string,detail:string,amount?:number)=>{
    if(!currentStaff)return;
    await addDoc(collection(db,'staffLogs'),{staffId:currentStaff.id,staffName:currentStaff.name,role:currentStaff.role,action,detail,amount:amount||0,date:new Date().toLocaleString('tr-TR'),ts:Date.now()});
  };

  const handleParasutExport=async(arr:any[],fileName?:string)=>{
    if(!parasutReady){
      alert('Paraşüt aktarımı için önce Firma Ünvanı alanını doldurun.');
      return null;
    }
    const stats=await exportParasut(arr,fileName,parasutOpts);
    if(stats)alert('Paraşüt dosyası oluşturuldu: '+stats.invoiceCount+' fatura, '+stats.lineCount+' satır.');
    return stats;
  };

  useEffect(()=>{
    if(!variantProduct){
      setVariantGroupName('');
      setVariantSearch('');
      setVariantSelectedIds(new Set());
      return;
    }
    const members=getVariantGroupMembers(variantProduct);
    setVariantGroupName(String(variantProduct.variantGroup||'').trim());
    setVariantSearch('');
    setVariantSelectedIds(new Set((members.length>0?members:[variantProduct]).map((p:any)=>p.id)));
  },[variantProduct]);

  const variantSelectedProducts=useMemo(()=>{
    if(!variantProduct)return [];
    const ids=new Set<string>([variantProduct.id,...Array.from(variantSelectedIds)]);
    return products
      .filter(p=>ids.has(p.id))
      .sort((a,b)=>{
        if(a.id===variantProduct.id)return -1;
        if(b.id===variantProduct.id)return 1;
        return String(a.name||'').localeCompare(String(b.name||''),'tr');
      });
  },[products,variantProduct,variantSelectedIds]);

  const variantCandidates=useMemo(()=>{
    if(!variantProduct)return [];
    const q=variantSearch.trim().toLowerCase();
    return products
      .filter(p=>p.id!==variantProduct.id)
      .filter(p=>!q||(p.name||'').toLowerCase().includes(q)||(p.barcode||'').includes(q)||String(p.variantGroup||'').toLowerCase().includes(q))
      .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'tr'));
  },[products,variantProduct,variantSearch]);

  const categoryEditorProducts=useMemo(()=>{
    if(!categoryEditor)return [];
    const q=categoryEditorSearch.trim().toLowerCase();
    return products
      .filter(p=>!q||(p.name||'').toLowerCase().includes(q)||(p.barcode||'').includes(q)||String(p.category||'').toLowerCase().includes(q))
      .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'tr'));
  },[products,categoryEditor,categoryEditorSearch]);

  const toggleVariantSelection=(productId:string)=>{
    if(!variantProduct||productId===variantProduct.id)return;
    setVariantSelectedIds(prev=>{
      const next=new Set(prev);
      if(next.has(productId))next.delete(productId);
      else next.add(productId);
      next.add(variantProduct.id);
      return next;
    });
  };

  // ── Cart ──────────────────────────────────────────────────────────────
  const addToCart=(p:any)=>{setCart(prev=>{const ex=prev.find((i:any)=>i.id===p.id);if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:(Number(i.qty)||0)+1}:i);return[...prev,{...p,qty:1}];});setSearchQuery('');};
  const rawTotal=cart.reduce((t:number,i:any)=>t+((i.grossPrice||0)*(Number(i.qty)||0)),0);
  const totalCostCart=cart.reduce((t:number,i:any)=>t+((i.costPrice||0)*(Number(i.qty)||0)),0);
  const discountVal=parseFloat(discountPct)||0;
  const discountAmount=rawTotal*(discountVal/100);
  const finalTotal=rawTotal-discountAmount;

  // ── Sale ──────────────────────────────────────────────────────────────
  const finishSale=async(method:string)=>{
    if(cart.length===0)return;
    if(method==='Veresiye'&&!cartCustomer)return alert('Veresiye satış için Müşteri seçmelisiniz!');
    const ac=customers.find((c:any)=>c.id===cartCustomer);
    const sd={items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,totalCost:totalCostCart,total:finalTotal,method,customerName:ac?ac.name:'Perakende Müşteri',customerTax:ac?ac.taxNum:'-',date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name};
    const ref=await addDoc(collection(db,'sales'),sd);
    if(method==='Veresiye'&&ac)await updateDoc(doc(db,'customers',ac.id),{balance:(ac.balance||0)+finalTotal});
    for(const item of cart){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-(Number(item.qty)||0))});}
    await logAction('SATIŞ',(ac?ac.name:'Perakende')+' - '+(method)+' - ₺'+(finalTotal.toFixed(2)),finalTotal);
    setLastSale({id:ref.id,...sd});setCart([]);setCartCustomer('');setCartCustomerSearch('');setDiscountPct('');setIsVeresiyeOpen(false);
  };
  const handleSplitSale=async()=>{
    const nakit=parseFloat(splitNakit)||0,kart=parseFloat(splitKart)||0;
    if(Math.abs(nakit+kart-finalTotal)>0.01)return alert('Nakit+Kart=₺'+((nakit+kart).toFixed(2))+' ≠ ₺'+(finalTotal.toFixed(2)));
    if(cart.length===0)return;
    const ac=customers.find((c:any)=>c.id===cartCustomer);
    const base={items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,totalCost:totalCostCart,customerName:ac?ac.name:'Perakende Müşteri',customerTax:ac?ac.taxNum:'-',date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name,isSplit:true};
    if(nakit>0)await addDoc(collection(db,'sales'),{...base,total:nakit,method:'Nakit'});
    if(kart>0)await addDoc(collection(db,'sales'),{...base,total:kart,method:'Kart'});
    for(const item of cart){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-(Number(item.qty)||0))});}
    await logAction('BÖLÜNMÜŞ_SATIŞ','Nakit:₺'+(nakit)+'+Kart:₺'+(kart),finalTotal);
    setLastSale({id:'SPLIT-'+(Date.now()),items:cart,total:finalTotal,method:'Nakit ₺'+(nakit)+' + Kart ₺'+(kart),customerName:ac?ac.name:'Perakende Müşteri',date:new Date().toLocaleString('tr-TR'),staffName:currentStaff?.name});
    setCart([]);setCartCustomer('');setCartCustomerSearch('');setDiscountPct('');setSplitModal(false);setSplitNakit('');setSplitKart('');
  };

  // ── Orders ────────────────────────────────────────────────────────────
  const handleCreateOrder=async()=>{
    if(cart.length===0)return alert('Sepet boş!');
    const ac=customers.find((c:any)=>c.id===orderCustomer);
    await addDoc(collection(db,'orders'),{items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,total:finalTotal,customerName:ac?ac.name:'Müşteri belirtilmemiş',customerTax:ac?ac.taxNum:'-',customerId:orderCustomer||'',note:orderNote,deliveryDate:orderDeliveryDate||'',status:'bekliyor',createdAt:new Date().toLocaleString('tr-TR'),updatedAt:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
    await logAction('SİPARİŞ_OLUŞTUR',(ac?ac.name:'Müşterisiz')+' - ₺'+(finalTotal.toFixed(2)),finalTotal);
    setCart([]);setCartCustomer('');setCartCustomerSearch('');setDiscountPct('');setOrderCustomer('');setOrderNote('');setOrderDeliveryDate('');setOrderMode(false);
    alert('Sipariş oluşturuldu!');
  };
  const handleOrderStatus=async(orderId:string,newStatus:string)=>{
    const order=orders.find(o=>o.id===orderId);
    await updateDoc(doc(db,'orders',orderId),{status:newStatus,updatedAt:new Date().toLocaleString('tr-TR')});
    await logAction('SİPARİŞ_DURUM','#'+(orderId.slice(-5))+' → '+(newStatus));
    if(newStatus==='gönderildi'&&order){
      const ac=customers.find((c:any)=>c.id===order.customerId);
      const sd={items:order.items,subTotal:order.subTotal,discountPct:order.discountPct,discountAmount:order.discountAmount,totalCost:0,total:order.total,method:order.customerId?'Veresiye':'Nakit',customerName:order.customerName,customerTax:order.customerTax,date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name};
      await addDoc(collection(db,'sales'),sd);
      if(ac)await updateDoc(doc(db,'customers',ac.id),{balance:(ac.balance||0)+order.total});
      for(const item of(order.items||[])){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-(Number(item.qty)||0))});}
    }
  };
  const handleUpdateOrder=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editingOrder)return;
    const rawT=editOrderCart.reduce((t:number,i:any)=>t+((i.grossPrice||0)*(Number(i.qty)||0)),0);
    const dv=parseFloat(editOrderDiscount)||0,dAmt=rawT*(dv/100);
    await updateDoc(doc(db,'orders',editingOrder.id),{items:editOrderCart,subTotal:rawT,discountPct:dv,discountAmount:dAmt,total:rawT-dAmt,updatedAt:new Date().toLocaleString('tr-TR')});
    setEditingOrder(null);setEditOrderCart([]);setEditOrderDiscount('');
  };

  // ── Quotes ────────────────────────────────────────────────────────────
  const qRaw=useMemo(()=>quoteDraft.reduce((t:number,i:any)=>t+((i.grossPrice||0)*(Number(i.qty)||0)),0),[quoteDraft]);
  const qDiscountVal=parseFloat(quoteDiscount)||0;
  const qDiscountAmt=qRaw*(qDiscountVal/100);
  const qTotal=qRaw-qDiscountAmt;
  const addToQuote=(p:any)=>setQuoteDraft(prev=>{const ex=prev.find((i:any)=>i.id===p.id);if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:(Number(i.qty)||0)+1}:i);return[...prev,{...p,qty:1}];});
  const handleSaveQuote=async()=>{
    if(quoteDraft.length===0)return alert('Sepet boş!');
    const ac=customers.find((c:any)=>c.id===quoteCustomer);
    await addDoc(collection(db,'quotes'),{items:quoteDraft,subTotal:qRaw,discountPct:qDiscountVal,discountAmount:qDiscountAmt,total:qTotal,customerName:ac?ac.name:'',customerTax:ac?ac.taxNum:'-',customerId:quoteCustomer||'',note:quoteNote,status:'beklemede',createdAt:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
    await logAction('TEKLİF_OLUŞTUR',(ac?ac.name:'Müşterisiz')+' - ₺'+(qTotal.toFixed(2)),qTotal);
    setQuoteDraft([]);setQuoteCustomer('');setQuoteDiscount('');setQuoteNote('');
    alert('Teklif kaydedildi!');
  };
  const handleQuoteToSale=async(q:any)=>{
    if(!window.confirm('Bu teklifi satışa dönüştür?'))return;
    const ac=customers.find((c:any)=>c.id===q.customerId);
    const sd={items:q.items,subTotal:q.subTotal,discountPct:q.discountPct,discountAmount:q.discountAmount,totalCost:0,total:q.total,method:q.customerId?'Veresiye':'Nakit',customerName:q.customerName||'Perakende Müşteri',customerTax:q.customerTax||'-',date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name};
    await addDoc(collection(db,'sales'),sd);
    if(ac&&q.customerId)await updateDoc(doc(db,'customers',q.customerId),{balance:(ac.balance||0)+q.total});
    for(const item of(q.items||[])){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-(Number(item.qty)||0))});}
    await updateDoc(doc(db,'quotes',q.id),{status:'onaylandi',convertedToSale:true});
    await logAction('TEKLİF_SATIŞA_ÇEVİR',(q.customerName)+' - ₺'+(q.total.toFixed(2)),q.total);
  };

  // ── Returns ───────────────────────────────────────────────────────────
  const lookupSale=()=>{
    const found=sales.find(s=>s.id===returnSaleId||s.id.slice(-6).toUpperCase()===returnSaleId.toUpperCase());
    if(found){setReturnSale(found);setReturnLines((found.items||[]).map((_:any,i:number)=>({itemIdx:i,qty:0,reason:''})));}
    else alert('Satış bulunamadı.');
  };
  const handleSubmitReturn=async()=>{
    if(!returnSale)return;
    const lines=returnLines.filter(l=>Number(l.qty)>0);
    if(lines.length===0)return alert('En az bir ürün seçin.');
    const returnItems=lines.map(l=>({...returnSale.items[l.itemIdx],qty:Number(l.qty),reason:l.reason}));
    const returnTotal=returnItems.reduce((a:number,b:any)=>a+(b.grossPrice||0)*(Number(b.qty)||0),0);
    await addDoc(collection(db,'returns'),{type:returnType,originalSaleId:returnSale.id,customerName:returnSale.customerName,items:returnItems,total:returnTotal,exchangeItems:returnType==='degisim'?exchangeCart:[],note:returnNote,date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
    for(const item of returnItems){const p=products.find(p=>p.name===item.name);if(p)await updateDoc(doc(db,'products',p.id),{stock:(p.stock||0)+(Number(item.qty)||0)});}
    if(returnSale.customerName&&returnSale.customerName!=='Perakende Müşteri'&&returnType==='iade'){
      const cust=customers.find(c=>c.name===returnSale.customerName);
      if(cust)await updateDoc(doc(db,'customers',cust.id),{balance:(cust.balance||0)-returnTotal});
    }
    await logAction('İADE','#'+(returnSale.id.slice(-5))+' - ₺'+(returnTotal.toFixed(2)),returnTotal);
    alert((returnType==='iade'?'İade':'Değişim')+' tamamlandı!');
    setReturnSale(null);setReturnSaleId('');setReturnLines([]);setExchangeCart([]);setReturnNote('');
  };

  // ── Products CRUD ─────────────────────────────────────────────────────
  const handleAddProduct=async(e:React.FormEvent)=>{
    e.preventDefault();
    await addDoc(collection(db,'products'),{name:pName,barcode:pBarcode,unit:pUnit,costPrice:parseFloat(pCost)||0,netPrice:parseFloat(pNet),taxRate:parseInt(pTax),grossPrice:parseFloat(calcGross(pNet,pTax)),stock:parseInt(pStock)||0,category:pCat||''});
    await logAction('ÜRÜN_EKLE',(pName)+' eklendi');
    setPName('');setPBarcode('');setPCost('');setPNet('');setPStock('0');setPCat('');setShowAddForm(false);
  };
  const openEditProduct=(p:any)=>{setEditingProduct(p);setEditForm({name:p.name||'',barcode:p.barcode||'',unit:p.unit||'Adet',category:p.category||'',costPrice:String(p.costPrice||''),netPrice:String(p.netPrice||''),taxRate:String(p.taxRate??20),grossPrice:String(p.grossPrice||''),stock:String(p.stock||0)});};
  const handleSaveEdit=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editingProduct)return;
    const net=parseFloat(editForm.netPrice)||0,tax=parseInt(editForm.taxRate)||0;
    const gross=editForm.grossPrice?parseFloat(editForm.grossPrice):parseFloat((net*(1+tax/100)).toFixed(2));
    const ownPatch={name:editForm.name,barcode:editForm.barcode,unit:editForm.unit,category:editForm.category,stock:parseInt(editForm.stock)||0};
    const pricePatch={costPrice:parseFloat(editForm.costPrice)||0,netPrice:net,taxRate:tax,grossPrice:gross};
    const members=getVariantPricingTargets(editingProduct);
    if(members.length>1){
      for(const member of members){
        await updateDoc(doc(db,'products',member.id),member.id===editingProduct.id?{...ownPatch,...pricePatch}:pricePatch);
      }
    }else{
      await updateDoc(doc(db,'products',editingProduct.id),{...ownPatch,...pricePatch});
    }
    await logAction('ÜRÜN_DÜZENLE',(editForm.name)+' güncellendi'+(members.length>1?' - '+members.length+' varyantta fiyat eşitlendi':''));
    setEditingProduct(null);
  };

  // ── Customers CRUD ────────────────────────────────────────────────────
  const handleAddCustomer=async(e:React.FormEvent)=>{
    e.preventDefault();
    await addDoc(collection(db,'customers'),{name:cName,phone:cPhone,taxNum:cTaxNum||'-',category:cCat||'',note:cNote||'',balance:0});
    await logAction('MÜŞTERİ_EKLE',(cName)+' eklendi');
    setCName('');setCPhone('');setCTaxNum('');setCCat('');setCNote('');setShowCustomerForm(false);
  };
  const openEditCustomer=(c:any)=>{setEditingCustomer(c);setEditCustForm({name:c.name||'',phone:c.phone||'',taxNum:c.taxNum||'',category:c.category||'',note:c.note||''});};
  const handleSaveCust=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editingCustomer)return;
    await updateDoc(doc(db,'customers',editingCustomer.id),{name:editCustForm.name,phone:editCustForm.phone,taxNum:editCustForm.taxNum,category:editCustForm.category,note:editCustForm.note});
    if(selectedCustomer?.id===editingCustomer.id)setSelectedCustomer((prev:any)=>({...prev,...editCustForm}));
    setEditingCustomer(null);
  };
  const handleDeleteCustomer=async(customer:any)=>{
    if(!customer?.id)return;
    const name=String(customer.name||'Bu musteri');
    const bal=Number(customer.balance||0);
    const balText=bal!==0?('\n\nGuncel bakiye: '+(bal>0?'+':'-')+'TL'+Math.abs(bal).toFixed(2)):'';
    const ok=window.confirm(name+' kaydini silmek istediginize emin misiniz? Bu islem geri alinamaz.'+balText);
    if(!ok)return;
    if(selectedCustomer?.id===customer.id)setSelectedCustomer(null);
    await deleteDoc(doc(db,'customers',customer.id));
    await logAction('MUSTERI_SIL',name+' silindi');
  };
  const handleTahsilat=async(customer:any)=>{
    const t=window.prompt((customer.name)+' Tahsilat Tutarı (₺):');
    if(t&&!isNaN(Number(t))){
      await updateDoc(doc(db,'customers',customer.id),{balance:(customer.balance||0)-parseFloat(t)});
      await addDoc(collection(db,'sales'),{total:parseFloat(t),method:'Tahsilat',customerName:customer.name,items:[{name:'Cari Tahsilat',qty:1,grossPrice:parseFloat(t)}],date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
      await logAction('TAHSİLAT',(customer.name)+' - ₺'+(t),parseFloat(t));
    }
  };

  // ── Stock ─────────────────────────────────────────────────────────────
  const handleSaveCount=async()=>{
    for(const[id,val]of Object.entries(countDraft) as [string,string][]){const n=parseInt(val,10);if(!isNaN(n))await updateDoc(doc(db,'products',id),{stock:n});}
    await logAction('STOK_SAYIM','Fiziksel sayım tamamlandı');
    setCountSaved(true);setTimeout(()=>setCountSaved(false),2500);
  };
  const handleAddCategory=async(e:React.FormEvent)=>{e.preventDefault();if(!newCatName.trim())return;await addDoc(collection(db,'categories'),{name:newCatName.trim(),color:newCatColor});setNewCatName('');};
  const handleAddCustCategory=async(e:React.FormEvent)=>{e.preventDefault();if(!newCustCatName.trim())return;await addDoc(collection(db,'custCategories'),{name:newCustCatName.trim(),color:newCustCatColor});setNewCustCatName('');};
  const toggleCategoryEditorProduct=(productId:string)=>{
    setCategoryEditorSelected(prev=>{
      const next=new Set(prev);
      if(next.has(productId))next.delete(productId);
      else next.add(productId);
      return next;
    });
  };
  const selectAllCategoryEditorFiltered=()=>{
    setCategoryEditorSelected(prev=>{
      const next=new Set(prev);
      categoryEditorProducts.forEach((p:any)=>next.add(p.id));
      return next;
    });
  };
  const clearAllCategoryEditorFiltered=()=>{
    setCategoryEditorSelected(prev=>{
      const next=new Set(prev);
      categoryEditorProducts.forEach((p:any)=>next.delete(p.id));
      return next;
    });
  };
  const handleSaveCategoryEditor=async()=>{
    if(!categoryEditor||categoryEditorSaving)return;
    setCategoryEditorSaving(true);
    let addCount=0;
    let removeCount=0;
    try{
      for(const p of products){
        const shouldBelong=categoryEditorSelected.has(p.id);
        const isCurrent=(p.category||'')===categoryEditor.name;
        if(shouldBelong&&!isCurrent){
          await updateDoc(doc(db,'products',p.id),{category:categoryEditor.name});
          addCount++;
        }else if(!shouldBelong&&isCurrent){
          await updateDoc(doc(db,'products',p.id),{category:''});
          removeCount++;
        }
      }
      await logAction('KATEGORI_TOPLU',String(categoryEditor.name||'Kategori')+' +'+addCount+' -'+removeCount);
      setCategoryEditor(null);
    }finally{
      setCategoryEditorSaving(false);
    }
  };

  // ── Purchases ─────────────────────────────────────────────────────────
  const handleSavePurchase=async(e:React.FormEvent)=>{
    e.preventDefault();
    const lines=purchaseLines.filter(l=>l.productId&&l.qty);
    if(lines.length===0)return alert('En az bir ürün satırı doldurun.');
    const items=lines.map(l=>{const p=products.find(p=>p.id===l.productId);return{productId:l.productId,productName:p?.name||'',qty:parseFloat(l.qty)||1,cost:parseFloat(l.cost)||0};});
    const totalCostVal=items.reduce((a,b)=>a+b.qty*b.cost,0);
    await addDoc(collection(db,'purchases'),{supplier:purchaseSupplier,date:purchaseDate||new Date().toISOString().slice(0,10),note:purchaseNote,items,totalCost:totalCostVal,createdAt:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
    for(const item of items){const p=products.find(p=>p.id===item.productId);if(p){const upd:any={stock:(p.stock||0)+item.qty};if(item.cost>0)upd.costPrice=item.cost;await updateDoc(doc(db,'products',item.productId),upd);}}
    await logAction('ALIŞ',(purchaseSupplier||'Tedarikçi')+' - ₺'+(totalCostVal.toFixed(2)),totalCostVal);
    setPurchaseSupplier('');setPurchaseDate('');setPurchaseNote('');setPurchaseLines([{productId:'',qty:'',cost:''}]);setShowPurchaseForm(false);
  };

  // ── Expenses ──────────────────────────────────────────────────────────
  const handleAddExpense=async(e:React.FormEvent)=>{
    e.preventDefault();
    await addDoc(collection(db,'expenses'),{name:expName,amount:parseFloat(expAmount)||0,date:new Date().toISOString()});
    await logAction('GİDER',(expName)+' - ₺'+(expAmount),parseFloat(expAmount)||0);
    setExpName('');setExpAmount('');
  };

  // ── Staff ─────────────────────────────────────────────────────────────
  const handleAddStaff=async(e:React.FormEvent)=>{
    e.preventDefault();if(!newStaffName||!newStaffPin)return;
    await addDoc(collection(db,'staff'),{name:newStaffName,role:newStaffRole,pin:newStaffPin,permissions:newStaffRole==='admin'?[]:newStaffPerms,createdAt:new Date().toLocaleString('tr-TR')});
    await logAction('PERSONEL_EKLE',(newStaffName)+' eklendi');
    setNewStaffName('');setNewStaffPin('');setNewStaffPerms(['pos','orders','returns','customers','customers.tahsilat']);
  };
  const handleUpdateStaff=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editingStaff)return;
    const upd:any={permissions:editingStaff.role==='admin'?[]:editStaffPerms};
    if(editStaffPin)upd.pin=editStaffPin;
    await updateDoc(doc(db,'staff',editingStaff.id),upd);
    await logAction('PERSONEL_GÜNCELLE',(editingStaff.name)+' güncellendi');
    if(editingStaff.id===currentStaff?.id)setCurrentStaff((prev:any)=>({...prev,...upd}));
    setEditingStaff(null);setEditStaffPin('');
  };
  const togglePerm=(perms:string[],key:string,setter:(p:string[])=>void)=>setter(perms.includes(key)?perms.filter(p=>p!==key):[...perms,key]);

  // ── CSV ───────────────────────────────────────────────────────────────
  const dlCSV=(d:any[][],h:string[],f:string)=>{const c='data:text/csv;charset=utf-8,\uFEFF'+[h.join(','),...d.map(r=>r.join(','))].join('\n');const a=document.createElement('a');a.href=encodeURI(c);a.download=f;a.click();};
  const exportProducts=()=>dlCSV(products.map(p=>[(p.name||'').replace(/,/g,''),p.barcode||'',p.unit||'',p.category||'',p.costPrice||0,p.grossPrice||0,p.stock||0]),['Urun','Barkod','Birim','Kategori','Alis','Satis','Stok'],'urunler.csv');
  const exportCustomers=()=>dlCSV(customers.map(c=>[(c.name||'').replace(/,/g,''),c.taxNum||'',c.phone||'',c.category||'',c.balance||0]),['Musteri','Vergi','Tel','Kategori','Bakiye'],'musteriler.csv');
  const normalizeImportKey=(v:any)=>String(v??'').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\u0131/g,'i').replace(/\u0130/g,'i').replace(/[^a-z0-9]/g,'');
  const parseImportNumber=(v:any)=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const raw=String(v??'').trim();if(!raw)return 0;const n=Number.parseFloat(raw.replace(/\s+/g,'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:0;};
  const importCustomers=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const done=()=>{e.target.value='';};
    const parseRows=async(rows:any[][])=>{
      if(!rows.length){alert('Dosyada veri bulunamadı.');return;}
      const headers=(rows[0]||[]).map((h:any)=>normalizeImportKey(h));
      const findCol=(aliases:string[])=>{
        for(const alias of aliases){
          const idx=headers.indexOf(normalizeImportKey(alias));
          if(idx>=0)return idx;
        }
        return -1;
      };
      let nameIdx=findCol(['musteri','musteriadi','musteriunvani','firma','firmaadi','unvan','adsoyad','isim']);
      const taxIdx=findCol(['vergino','vergi','vergitckn','tc','tckn','vkn']);
      const phoneIdx=findCol(['telefon','tel','gsm','cep','mobile','phone']);
      const catIdx=findCol(['kategori','grup','sinif','segment']);
      const noteIdx=findCol(['not','aciklama','notes','description']);
      const balIdx=findCol(['bakiye','balance','borc','alacak']);
      let startRow=1;
      if(nameIdx<0){nameIdx=0;startRow=0;}
      const taxCol=taxIdx>=0?taxIdx:(startRow===0?1:-1);
      const phoneCol=phoneIdx>=0?phoneIdx:(startRow===0?2:-1);
      const catCol=catIdx>=0?catIdx:(startRow===0?3:-1);
      const balCol=balIdx>=0?balIdx:(startRow===0?4:-1);
      const noteCol=noteIdx>=0?noteIdx:(startRow===0?5:-1);
      let added=0,skipped=0;
      for(let i=startRow;i<rows.length;i++){
        const row=rows[i]||[];
        const name=String(row[nameIdx]??'').trim();
        if(!name){skipped++;continue;}
        const taxNum=String(taxCol>=0?(row[taxCol]??''):'').trim()||'-';
        const phone=String(phoneCol>=0?(row[phoneCol]??''):'').trim();
        const category=String(catCol>=0?(row[catCol]??''):'').trim();
        const note=String(noteCol>=0?(row[noteCol]??''):'').trim();
        const balance=parseImportNumber(balCol>=0?(row[balCol]??''):0);
        await addDoc(collection(db,'customers'),{name,phone,taxNum,category,note,balance});
        added++;
      }
      await logAction('MUSTERI_ICE_AKTAR','Toplu müşteri içe aktarma: '+added+' eklendi');
      alert('İçe aktarma tamamlandı! Eklenen: '+added+' | Atlanan: '+skipped);
    };
    const ext=file.name.toLowerCase();
    if(ext.endsWith('.xlsx')||ext.endsWith('.xls')){
      const reader=new FileReader();
      reader.onload=async(ev)=>{
        try{
          const XLSX=await loadXLSX();
          const data=ev.target?.result as ArrayBuffer;
          const wb=XLSX.read(data,{type:'array'});
          const ws=wb.Sheets[wb.SheetNames[0]];
          const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''}) as any[][];
          await parseRows(rows);
        }catch{
          alert('Excel dosyası okunamadı.');
        }finally{done();}
      };
      reader.onerror=()=>{alert('Dosya okunamadı.');done();};
      reader.readAsArrayBuffer(file);
      return;
    }
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      try{
        const text=String(ev.target?.result||'');
        const lines=text.split(/\r?\n/).filter(Boolean);
        const rows=lines.map(line=>{
          const delim=(line.split(';').length>line.split(',').length)?';':',';
          return line.split(delim).map(c=>c.trim().replace(/^"(.*)"$/,'$1'));
        });
        await parseRows(rows);
      }catch{
        alert('CSV dosyası okunamadı.');
      }finally{done();}
    };
    reader.onerror=()=>{alert('Dosya okunamadı.');done();};
    reader.readAsText(file);
  };
  const importProducts=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=async(ev)=>{const rows=(ev.target?.result as string).split('\n').slice(1);for(const row of rows){const c=row.split(',');if(c.length>=4&&c[0].trim())await addDoc(collection(db,'products'),{name:c[0],barcode:c[1],unit:c[2],category:c[3]||'',costPrice:parseFloat(c[4])||0,grossPrice:parseFloat(c[5])||0,stock:parseInt(c[6])||0});}alert('İçeri aktarıldı!');};r.readAsText(file);};

  // ── Computed totals ───────────────────────────────────────────────────
  const totalIncome=sales.reduce((a,b)=>a+(b.total||0),0);
  const totalExpenseSum=expenses.reduce((a,b)=>a+(b.amount||0),0);
  const totalCogs=sales.filter(s=>s.method!=='Tahsilat').reduce((a,b)=>a+(b.totalCost||0),0);
  const netProfit=totalIncome-totalCogs-totalExpenseSum;
  const outOfStock=products.filter(p=>(p.stock||0)===0).length;
  const lowStock=products.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit).length;
  const totalStockValue=products.reduce((a,b)=>a+((b.stock||0)*(b.costPrice||0)),0);

  const filteredProducts=useMemo(()=>{
    let list=[...products];
    const q=productSearch.trim().toLowerCase();
    if(q){
      list=list.filter(p=>{
        const haystack=[
          String(p.name||''),
          String(p.barcode||''),
          String(p.category||''),
          String(p.unit||''),
          String(p.variantGroup||''),
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }
    if(productCategoryFilter!=='all')list=list.filter(p=>(p.category||'')===productCategoryFilter);
    if(productVariantFilter==='variant')list=list.filter(p=>String(p.variantGroup||'').trim()!=='');
    if(productVariantFilter==='single')list=list.filter(p=>String(p.variantGroup||'').trim()==='');
    if(productStockFilter==='in')list=list.filter(p=>(p.stock||0)>0);
    if(productStockFilter==='out')list=list.filter(p=>(p.stock||0)===0);
    if(productStockFilter==='low')list=list.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit);
    const byName=(a:any,b:any)=>String(a.name||'').localeCompare(String(b.name||''),'tr');
    switch(productSort){
      case 'name-desc':
        return list.sort((a,b)=>byName(b,a));
      case 'price-asc':
        return list.sort((a,b)=>(a.grossPrice||0)-(b.grossPrice||0)||byName(a,b));
      case 'price-desc':
        return list.sort((a,b)=>(b.grossPrice||0)-(a.grossPrice||0)||byName(a,b));
      case 'stock-asc':
        return list.sort((a,b)=>(a.stock||0)-(b.stock||0)||byName(a,b));
      case 'stock-desc':
        return list.sort((a,b)=>(b.stock||0)-(a.stock||0)||byName(a,b));
      default:
        return list.sort((a,b)=>byName(a,b));
    }
  },[products,productSearch,productCategoryFilter,productVariantFilter,productStockFilter,productSort,lowStockLimit]);

  const filteredStockProducts=useMemo(()=>{
    let list=[...products];
    if(stockSearch)list=list.filter(p=>(p.name||'').toLowerCase().includes(stockSearch.toLowerCase())||(p.barcode||'').includes(stockSearch));
    if(stockCatFilter!=='all')list=list.filter(p=>p.category===stockCatFilter);
    if(stockFilter==='out')list=list.filter(p=>(p.stock||0)===0);
    if(stockFilter==='low')list=list.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit);
    return list.sort((a,b)=>(a.stock||0)-(b.stock||0));
  },[products,stockSearch,stockCatFilter,stockFilter,lowStockLimit]);
  const stockMovements=useMemo(()=>{
    const movements:any[]=[];
    sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{movements.push({date:s.date,type:'out',desc:'Satiş -> '+(s.customerName||''),items:(s.items||[]).map((i:any)=>({name:i.name,qty:i.qty})),total:s.total||0,ts:parseDT(s.date).getTime()});});
    purchases.forEach((p:any)=>{movements.push({date:p.createdAt||p.date,type:'in',desc:'Alis <- '+(p.supplier||'Tedarikci'),items:(p.items||[]).map((i:any)=>({name:i.productName||i.name,qty:i.qty})),total:p.totalCost||0,ts:new Date(p.date).getTime()});});
    return movements.sort((a,b)=>b.ts-a.ts);
  },[sales,purchases]);
  const filteredMovements=useMemo(()=>{
    const mvs=stockMovements||[];
    const filtered=mvs.filter((mv:any)=>{
      if(mvType!=='all'&&mv.type!==mvType)return false;
      if(mvStart&&mv.ts<new Date(mvStart).getTime())return false;
      if(mvEnd){const t=new Date(mvEnd);t.setHours(23,59,59);if(mv.ts>t.getTime())return false;}
      return true;
    });
    const tIn=filtered.filter((m:any)=>m.type==='in').reduce((a:number,b:any)=>a+b.total,0);
    const tOut=filtered.filter((m:any)=>m.type==='out').reduce((a:number,b:any)=>a+b.total,0);
    return{filtered,tIn,tOut};
  },[stockMovements,mvType,mvStart,mvEnd]);
  const _maxStockQty=useMemo(()=>Math.max(1,...filteredStockProducts.map(p=>p.stock||0)),[filteredStockProducts]);
  const monthlyStats=useMemo(()=>{
    const[yr,mo]=reportMonth.split('-').map(Number);
    const ms=sales.filter(s=>{const d=parseDT(s.date);return d.getFullYear()===yr&&d.getMonth()===mo-1&&s.method!=='Tahsilat';});
    const me=expenses.filter(e=>{try{const d=new Date(e.date);return d.getFullYear()===yr&&d.getMonth()===mo-1;}catch{return false;}});
    const ciro=ms.reduce((a:number,b:any)=>a+(b.total||0),0);
    const cogs=ms.reduce((a:number,b:any)=>a+(b.totalCost||0),0);
    const exp=me.reduce((a:number,b:any)=>a+(b.amount||0),0);
    const kar=ciro-cogs-exp;
    const nakit=ms.filter(s=>s.method==='Nakit').reduce((a:number,b:any)=>a+(b.total||0),0);
    const kart=ms.filter(s=>s.method==='Kart').reduce((a:number,b:any)=>a+(b.total||0),0);
    const veresiye=ms.filter(s=>s.method==='Veresiye').reduce((a:number,b:any)=>a+(b.total||0),0);
    const urunMap:Record<string,{name:string;adet:number;ciro:number}>={};
    ms.forEach((s:any)=>(s.items||[]).forEach((item:any)=>{const k=item.name||'?';if(!urunMap[k])urunMap[k]={name:k,adet:0,ciro:0};urunMap[k].adet+=(Number(item.qty)||0);urunMap[k].ciro+=(item.grossPrice||0)*(Number(item.qty)||0);}));
    const topUrunler=Object.values(urunMap).sort((a,b)=>b.ciro-a.ciro).slice(0,10);
    const daysInMonth=new Date(yr,mo,0).getDate();
    const dailyRows:any[]=[];
    for(let d=1;d<=daysInMonth;d++){
      const ds_str=String(d).padStart(2,'0')+'.'+String(mo).padStart(2,'0')+'.'+String(yr);
      const ds=ms.filter((s:any)=>s.date?.startsWith(ds_str));
      if(!ds.length)continue;
      dailyRows.push({ds_str,cnt:ds.length,ciro:ds.reduce((a:number,b:any)=>a+(b.total||0),0),nakit:ds.filter((s:any)=>s.method==='Nakit').reduce((a:number,b:any)=>a+(b.total||0),0),kart:ds.filter((s:any)=>s.method==='Kart').reduce((a:number,b:any)=>a+(b.total||0),0),veresiye:ds.filter((s:any)=>s.method==='Veresiye').reduce((a:number,b:any)=>a+(b.total||0),0)});
    }
    const count=ms.length;
    const avgInvoice=count>0?ciro/count:0;
    const grossProfit=ciro-cogs;
    const grossMargin=ciro>0?(grossProfit/ciro)*100:0;
    const netMargin=ciro>0?(kar/ciro)*100:0;
    const expenseRatio=ciro>0?(exp/ciro)*100:0;
    return{yr,mo,ciro,cogs,exp,kar,nakit,kart,veresiye,topUrunler,dailyRows,ms,count,avgInvoice,grossProfit,grossMargin,netMargin,expenseRatio};
  },[sales,expenses,reportMonth]);
  const prevMonthlyStats=useMemo(()=>{
    const[yr,mo]=reportMonth.split('-').map(Number);
    const prev=new Date(yr,mo-2,1);
    const pYr=prev.getFullYear();
    const pMo=prev.getMonth()+1;
    const ms=sales.filter(s=>{const d=parseDT(s.date);return d.getFullYear()===pYr&&d.getMonth()===pMo-1&&s.method!=='Tahsilat';});
    const me=expenses.filter(e=>{try{const d=new Date(e.date);return d.getFullYear()===pYr&&d.getMonth()===pMo-1;}catch{return false;}});
    const ciro=ms.reduce((a:number,b:any)=>a+(b.total||0),0);
    const cogs=ms.reduce((a:number,b:any)=>a+(b.totalCost||0),0);
    const exp=me.reduce((a:number,b:any)=>a+(b.amount||0),0);
    const kar=ciro-cogs-exp;
    const count=ms.length;
    const avgInvoice=count>0?ciro/count:0;
    return{yr:pYr,mo:pMo,ciro,cogs,exp,kar,count,avgInvoice};
  },[sales,expenses,reportMonth]);
  const monthlyDelta=useMemo(()=>{
    const d=(cur:number,prev:number)=>prev===0?(cur===0?0:100):((cur-prev)/Math.abs(prev))*100;
    const prevNetMargin=prevMonthlyStats.ciro>0?(prevMonthlyStats.kar/prevMonthlyStats.ciro)*100:0;
    return{
      ciro:d(monthlyStats.ciro,prevMonthlyStats.ciro),
      kar:d(monthlyStats.kar,prevMonthlyStats.kar),
      avgInvoice:d(monthlyStats.avgInvoice,prevMonthlyStats.avgInvoice),
      count:d(monthlyStats.count,prevMonthlyStats.count),
      netMargin:d(monthlyStats.netMargin,prevNetMargin),
    };
  },[monthlyStats,prevMonthlyStats]);
  const monthLabel=useMemo(()=>new Date(monthlyStats.yr,monthlyStats.mo-1,1).toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),[monthlyStats.yr,monthlyStats.mo]);
  const prevMonthLabel=useMemo(()=>new Date(prevMonthlyStats.yr,prevMonthlyStats.mo-1,1).toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),[prevMonthlyStats.yr,prevMonthlyStats.mo]);
  const splitN=useMemo(()=>parseFloat(splitNakit)||0,[splitNakit]);
  const splitK=useMemo(()=>parseFloat(splitKart)||0,[splitKart]);
  const splitDiff=useMemo(()=>(parseFloat(splitNakit)||0)+(parseFloat(splitKart)||0)-finalTotal,[splitNakit,splitKart,finalTotal]);
  const splitOk=useMemo(()=>Math.abs((parseFloat(splitNakit)||0)+(parseFloat(splitKart)||0)-finalTotal)<0.01,[splitNakit,splitKart,finalTotal]);

  const reportSales=useMemo(()=>{const d=new Date(reportDate);return sales.filter(s=>{const sd=parseDT(s.date);return sd.getFullYear()===d.getFullYear()&&sd.getMonth()===d.getMonth()&&sd.getDate()===d.getDate();});},[sales,reportDate]);
  const reportExpenses=useMemo(()=>{const d=new Date(reportDate);return expenses.filter(e=>{try{const ed=new Date(e.date);return ed.getFullYear()===d.getFullYear()&&ed.getMonth()===d.getMonth()&&ed.getDate()===d.getDate();}catch{return false;}});},[expenses,reportDate]);
  const dayNakit=reportSales.filter(s=>s.method==='Nakit').reduce((a,b)=>a+(b.total||0),0);
  const dayKart=reportSales.filter(s=>s.method==='Kart').reduce((a,b)=>a+(b.total||0),0);
  const dayVeresiye=reportSales.filter(s=>s.method==='Veresiye').reduce((a,b)=>a+(b.total||0),0);
  const dayTahsilat=reportSales.filter(s=>s.method==='Tahsilat').reduce((a,b)=>a+(b.total||0),0);
  const dayExpense=reportExpenses.reduce((a,b)=>a+(b.amount||0),0);
  const dayCashNet=dayNakit+dayTahsilat-dayExpense;
  const daySalesTotal=reportSales.filter(s=>s.method!=='Tahsilat').reduce((a,b)=>a+(b.total||0),0);

  const kdvBreakdown=useMemo(()=>{
    const map:Record<number,{base:number;kdv:number;gross:number}>={};
    sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const r=nKdv(item.taxRate);if(!map[r])map[r]={base:0,kdv:0,gross:0};const g=(item.grossPrice||0)*(Number(item.qty)||0);const b=g/(1+r/100);map[r].gross+=g;map[r].base+=b;map[r].kdv+=g-b;});});
    return Object.entries(map).sort((a,b)=>Number(a[0])-Number(b[0]));
  },[sales]);
  const dayKdvBreakdown=useMemo(()=>{
    const map:Record<number,{base:number;kdv:number;gross:number}>={};
    reportSales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const r=nKdv(item.taxRate);if(!map[r])map[r]={base:0,kdv:0,gross:0};const g=(item.grossPrice||0)*(Number(item.qty)||0);const b=g/(1+r/100);map[r].gross+=g;map[r].base+=b;map[r].kdv+=g-b;});});
    return Object.entries(map).sort((a,b)=>Number(a[0])-Number(b[0]));
  },[reportSales]);

  // ── Customer modal data ───────────────────────────────────────────────
  const customerSales=useMemo(()=>{if(!selectedCustomer)return[];return sales.filter(s=>s.customerName===selectedCustomer.name&&s.method!=='Tahsilat').sort((a,b)=>parseDT(b.date).getTime()-parseDT(a.date).getTime());},[sales,selectedCustomer]);
  const filteredSales=useMemo(()=>customerSales.filter(s=>{const d=parseDT(s.date);if(filterStart&&d<new Date(filterStart))return false;if(filterEnd){const t=new Date(filterEnd);t.setHours(23,59,59);if(d>t)return false;}return true;}),[customerSales,filterStart,filterEnd]);
  const custTotalSpend=useMemo(()=>customerSales.reduce((a:number,b:any)=>a+(b.total||0),0),[customerSales]);
  const custTotalCollected=useMemo(()=>sales.filter(s=>s.customerName===selectedCustomer?.name&&s.method==='Tahsilat').reduce((a:number,b:any)=>a+(b.total||0),0),[sales,selectedCustomer]);
  const allFiltSel=filteredSales.length>0&&filteredSales.every(s=>selectedSaleIds.has(s.id));
  const toggleSale=(id:string)=>setSelectedSaleIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>{if(allFiltSel){setSelectedSaleIds(prev=>{const n=new Set(prev);filteredSales.forEach(s=>n.delete(s.id));return n;});}else{setSelectedSaleIds(prev=>{const n=new Set(prev);filteredSales.forEach(s=>n.add(s.id));return n;});}};
  const selSales=customerSales.filter(s=>selectedSaleIds.has(s.id));
  const selTotal=selSales.reduce((a,b)=>a+(b.total||0),0);
  const buildMerged=()=>{
    const sorted=[...selSales].sort((a,b)=>parseDT(a.date).getTime()-parseDT(b.date).getTime());
    const allItems:any[]=[];sorted.forEach(s=>(s.items||[]).forEach((i:any)=>allItems.push(i)));
    const dr=sorted.length>0?(parseDT(sorted[0].date).toLocaleDateString('tr-TR'))+' - '+(parseDT(sorted[sorted.length-1].date).toLocaleDateString('tr-TR')):'';
    return{id:'MRG-'+(Date.now()),customerName:selectedCustomer?.name||'',customerTax:selectedCustomer?.taxNum||'-',method:'Veresiye',date:new Date().toLocaleString('tr-TR'),dateRange:dr,items:allItems,subTotal:sorted.reduce((a,b)=>a+(b.subTotal||b.total||0),0),discountAmount:sorted.reduce((a,b)=>a+(b.discountAmount||0),0),discountPct:0,total:selTotal,isMerged:true,mergedCount:sorted.length};
  };
  const handleMergedPrint=()=>{setMergedPrint(buildMerged());setTimeout(()=>window.print(),150);};
  const handleMergedXlsx=async()=>{const cn=(selectedCustomer?.name||'musteri').replace(/[^a-zA-Z0-9_]/g,'_');await handleParasutExport(selSales,'parasut_'+(cn)+'_'+(new Date().toISOString().slice(0,10))+'.xlsx');};
  const customerProductHistory=useMemo(()=>{
    if(!selectedCustomer)return[];
    const map:Record<string,{name:string;totalQty:number;totalSpent:number;dates:string[]}>={};
    customerSales.forEach(s=>{(s.items||[]).forEach((item:any)=>{const key=item.name||'?';if(!map[key])map[key]={name:key,totalQty:0,totalSpent:0,dates:[]};map[key].totalQty+=(Number(item.qty)||0);map[key].totalSpent+=(item.grossPrice||0)*(Number(item.qty)||0);map[key].dates.push(s.date?.split(' ')[0]||s.date);});});
    return Object.values(map).sort((a,b)=>b.totalQty-a.totalQty);
  },[customerSales,selectedCustomer]);

  // ── Dashboard helpers ────────────────────────────────────────────────
  const dashSalesData=()=>{
    const days=parseInt(dashPeriod);
    const now=Date.now();
    const map:Record<string,{date:string;ciro:number;adet:number}>={};
    for(let i=days-1;i>=0;i--){const d=new Date(now-i*86400000);const key=d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'});map[key]={date:key,ciro:0,adet:0};}
    sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{
      const d=parseDT(s.date);if(now-d.getTime()>days*86400000)return;
      const key=d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'});
      if(map[key]){map[key].ciro+=(s.total||0);map[key].adet++;}
    });
    return Object.values(map);
  };
  const topProducts=()=>{
    const map:Record<string,{name:string;adet:number;ciro:number}>={};
    sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const k=item.name||'?';if(!map[k])map[k]={name:k,adet:0,ciro:0};map[k].adet+=(Number(item.qty)||0);map[k].ciro+=(item.grossPrice||0)*(Number(item.qty)||0);});});
    return Object.values(map).sort((a,b)=>b.ciro-a.ciro).slice(0,8);
  };
  const payMethodData=()=>{
    const methods:Record<string,number>={};
    sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{const m=s.method||'Diğer';methods[m]=(methods[m]||0)+(s.total||0);});
    return Object.entries(methods).map(([name,value])=>({name,value:parseFloat(value.toFixed(2))}));
  };
  const PIE_COLORS=['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'];
  const dashStats=useMemo(()=>{
    const days=parseInt(dashPeriod);const now=Date.now();
    const filtSales=sales.filter(s=>s.method!=='Tahsilat'&&now-parseDT(s.date).getTime()<=days*86400000);
    const ciro=filtSales.reduce((a,b)=>a+(b.total||0),0);
    const adet=filtSales.length;
    const avgSale=adet>0?parseFloat((ciro/adet).toFixed(2)):0;
    const veresiye=filtSales.filter(s=>s.method==='Veresiye').reduce((a,b)=>a+(b.total||0),0);
    return {ciro,adet,avgSale,veresiye};
  },[sales,dashPeriod]);

  // ── Toplu fiyat güncelleme ────────────────────────────────────────────
  const handleBulkPrice=async()=>{
    if(bulkSelected.size===0||!bulkPct)return alert('Ürün seçin ve oran girin.');
    const pct=parseFloat(bulkPct)/100;
    const processedGroups=new Set<string>();
    let touchedCount=0;
    for(const id of bulkSelected){
      const p=products.find(p=>p.id===id);if(!p)continue;
      const groupKey=getVariantGroupKey(p)||('self:'+p.id);
      if(processedGroups.has(groupKey))continue;
      processedGroups.add(groupKey);
      const cur=p[bulkField]||0;
      const newVal=bulkType==='zam'?parseFloat((cur*(1+pct)).toFixed(2)):parseFloat((cur*(1-pct)).toFixed(2));
      const syncTargets=getVariantPricingTargets(p);
      touchedCount+=syncTargets.length;
      for(const target of syncTargets){
        const upd:any={[bulkField]:newVal};
        if(bulkField==='grossPrice'){
          upd.netPrice=parseFloat((newVal/(1+((target.taxRate||p.taxRate||20)/100))).toFixed(2));
        }
        await addDoc(collection(db,'priceHistory'),{productId:target.id,productName:target.name,field:bulkField,oldVal:target[bulkField]||0,newVal,pct:parseFloat(bulkPct),type:bulkType,date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
        await updateDoc(doc(db,'products',target.id),upd);
      }
    }
    await logAction('TOPLU_FİYAT',(touchedCount||bulkSelected.size)+' ürüne %'+(bulkPct)+' '+(bulkType),0);
    setBulkDone(true);setTimeout(()=>setBulkDone(false),2500);setBulkSelected(new Set());setBulkPct('');
  };

  // ── Fiyat geçmişi yükle ───────────────────────────────────────────────
  const loadPriceHistory=async(productId:string)=>{
    setPriceHistoryLoading(true);
    const unsub=onSnapshot(collection(db,'priceHistory'),snap=>{
      const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter((r:any)=>r.productId===productId).sort((a:any,b:any)=>parseDT(b.date).getTime()-parseDT(a.date).getTime());
      setPriceHistory(rows);setPriceHistoryLoading(false);
    });
    return unsub;
  };

  // ── Varyant kaydet ────────────────────────────────────────────────────
  const handleSaveVariants=async()=>{
    if(!variantProduct)return;
    const selectedIds=Array.from(new Set<string>([variantProduct.id,...Array.from(variantSelectedIds)]));
    const currentMembers=getVariantGroupMembers(variantProduct);
    if(selectedIds.length<2){
      const cleanupTargets=currentMembers.length>0?currentMembers:[variantProduct];
      for(const member of cleanupTargets){
        await updateDoc(doc(db,'products',member.id),{variantGroup:'',variantGroupId:''});
      }
      await logAction('VARYANT_KAYDET',(variantProduct.name)+' varyant grubu dagitildi');
      setVariantProduct(null);setVariantGroupName('');setVariantSearch('');setVariantSelectedIds(new Set());
      return;
    }
    const groupName=variantGroupName.trim();
    if(!groupName)return alert('Varyant grubu için bir ad girin.');
    const groupId=String(variantProduct.variantGroupId||('vg-'+Date.now()));
    const basePricePatch=getVariantPricePatch(variantProduct);
    for(const member of currentMembers){
      if(!selectedIds.includes(member.id)){
        await updateDoc(doc(db,'products',member.id),{variantGroup:'',variantGroupId:''});
      }
    }
    for(const productId of selectedIds){
      await updateDoc(doc(db,'products',productId),{variantGroup:groupName,variantGroupId:groupId,...basePricePatch});
    }
    await logAction('VARYANT_KAYDET',groupName+' - '+selectedIds.length+' urun baglandi ve fiyatlar ortaklandi');
    setVariantProduct(null);setVariantGroupName('');setVariantSearch('');setVariantSelectedIds(new Set());
  };

  // ── Receipt settings ──────────────────────────────────────────────────
  const saveRSettings=async()=>{
    await setDoc(doc(db,'settings','receipt'), draftSettings);
    setSettingsSaved(true);
    setTimeout(()=>setSettingsSaved(false),2000);
  };
  const upDraft=(k:keyof ReceiptSettings,v:any)=>setDraftSettings(prev=>({...prev,[k]:v}));
  const activePrintData=mergedPrint||printSale||lastSale;
  const demoSale={id:'DEMO123456',customerName:'Örnek Müşteri A.Ş.',customerTax:'1234567890',method:'Veresiye',date:'16.03.2026 14:30:00',staffName:'Kasiyer',items:[{name:'Dove Sabun 100gr',qty:5,grossPrice:60,taxRate:20},{name:'Ariel Deterjan 3kg',qty:2,grossPrice:185,taxRate:20},{name:'Sıvı Deterjan',qty:1.5,grossPrice:50,taxRate:20}],subTotal:745,discountAmount:45,discountPct:6,total:700};

  // ── UI helpers ────────────────────────────────────────────────────────
  const Field=({label,icon,value,onChange,placeholder='',type='text'}:{label:string;icon?:React.ReactNode;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string})=>(
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wide">{icon}{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none focus:border-emerald-500 text-sm"/>
    </div>
  );
  const Toggle=({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void})=>(
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/40">
      <span className="text-zinc-300 text-sm font-medium">{label}</span>
      <button onClick={()=>onChange(!value)} className={'w-11 h-6 rounded-full relative transition-all '+(value?'bg-emerald-500':'bg-zinc-700')}>
        <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all '+(value?'left-5':'left-0.5')}/>
      </button>
    </div>
  );

  const filteredCariList = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearchQuery)) ||
    (c.taxNum && c.taxNum.includes(customerSearchQuery))
  );

  if(!currentStaff) return <LoginScreen onLogin={staff=>{setCurrentStaff(staff);logAction('GİRİŞ','Sisteme giriş yapıldı');}}/>;

  return (
    <>
    <div className={'flex h-screen text-zinc-100 transition-colors duration-300 print:hidden relative '+(flash?'bg-emerald-900':'bg-zinc-950')}>

      {/* ══════════════ SIDEBAR ═══════════════════════════════════════════ */}
      <aside style={{transform:mobileMenuOpen?'none':'translateX(-100%)'}} className="fixed lg:!transform-none lg:relative z-[400] w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <button onClick={()=>setMobileMenuOpen(false)} className="lg:hidden text-zinc-500 hover:text-white mr-2 p-1"><X size={18}/></button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-zinc-950 text-base">M</div>
            <div><h1 className="font-bold text-sm text-white">Merkez Şube</h1><p className="text-[10px] text-zinc-500">Perakende Şubesi</p></div>
          </div>
          <ChevronDown size={14} className="text-zinc-500"/>
        </div>
        {/* Aktif personel */}
        <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center"><UserCheck size={13} className="text-emerald-400"/></div>
            <div><p className="text-white text-xs font-black">{currentStaff.name}</p><p className="text-zinc-600 text-[10px]">{roleLabel(currentStaff)}</p></div>
          </div>
          <button onClick={()=>{logAction('ÇIKIŞ','Sistemden çıkış');setCurrentStaff(null);}} className="text-zinc-600 hover:text-red-400 transition-colors" title="Çıkış"><LogOut size={14}/></button>
        </div>
        <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
          {[
            {p:'pos',icon:<ShoppingCart size={15}/>,label:'Hızlı Satış',perm:'pos'},
            {p:'orders',icon:<ShoppingBag size={15}/>,label:'Siparişli Satışlar',perm:'orders',badge:orders.filter(o=>o.status==='bekliyor'||o.status==='hazirlaniyor').length||null},
            {p:'quotes',icon:<FileEdit size={15}/>,label:'Teklifler',perm:'quotes',badge2:quotes.filter(q=>q.status==='beklemede').length||null},
            {p:'returns',icon:<RefreshCw size={15}/>,label:'İade / Değişim',perm:'returns'},
            {p:'purchases',icon:<ArrowDownToLine size={15}/>,label:'Alış Faturaları',perm:'purchases'},
          ].filter(t=>canDo(t.perm)).map(t=>(
            <button key={t.p} onClick={()=>setActivePage(t.p)} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm font-medium '+(activePage===t.p?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
              {t.icon}<span className="flex-1 text-left">{t.label}</span>
              {(t as any).badge&&<span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{(t as any).badge}</span>}
              {(t as any).badge2&&<span className="bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{(t as any).badge2}</span>}
            </button>
          ))}

          {/* Stok grubu */}
          <div className="mt-1">
            <button onClick={()=>setStockOpen(!stockOpen)} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage.startsWith('stock')?'text-white':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
              <Boxes size={15} className={activePage.startsWith('stock')?'text-emerald-400':''}/><span className="flex-1 text-left">Stok</span>
              {outOfStock>0&&<span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full mr-1">{outOfStock}</span>}
              <ChevronDown size={12} className={'text-zinc-500 transition-transform '+(stockOpen?'':'rotate-[-90deg]')}/>
            </button>
            {stockOpen&&(
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-3">
                {[
                  {p:'stock.products',icon:<Package size={13}/>,label:'Ürünler'},
                  {p:'stock.category',icon:<FolderOpen size={13}/>,label:'Kategoriler'},
                  {p:'stock.movements',icon:<ArrowUpDown size={13}/>,label:'Stok Hareketleri'},
                  {p:'stock.count',icon:<ClipboardCheck size={13}/>,label:'Stok Sayım'},
                  {p:'stock.tracking',icon:<Boxes size={13}/>,label:'Stok Takibi'},
                  {p:'stock.bulk',icon:<Zap size={13}/>,label:'Toplu Fiyat Güncelle'},
                ].map(item=>(
                  <button key={item.p} onClick={()=>setActivePage(item.p)} className={'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm '+(activePage===item.p?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-500 hover:bg-zinc-800 hover:text-white')}>
                    {item.icon}<span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {canDo('customers')&&<button onClick={()=>setActivePage('customers')} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 '+(activePage==='customers'||activePage==='customers.categories'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><Users size={15}/><span className="flex-1 text-left">Cari Hesaplar</span></button>}
          <div className="border-t border-zinc-800/60 my-2"/>
          <button onClick={()=>setActivePage('dashboard')} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='dashboard'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><BarChart3 size={15}/><span>Dashboard</span></button>
          {(canDo('reports.genel')||canDo('reports.gunSonu')||canDo('reports.kdv')||currentStaff?.role==='admin')&&<button onClick={()=>setActivePage('reports')} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='reports'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><BarChart3 size={15}/><span>Rapor & Analiz</span></button>}
          {currentStaff.role==='admin'&&<button onClick={()=>setActivePage('personel')} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='personel'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><UserCog size={15}/><span>Personel</span></button>}
          {(canDo('receipt')||currentStaff?.role==='admin')&&<button onClick={()=>setActivePage('settings')} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='settings'||activePage==='receipt'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><Settings size={15}/><span>Ayarlar</span></button>}
        </nav>
      </aside>

      {mobileMenuOpen&&<div className="fixed inset-0 bg-black/60 z-[390] lg:hidden" onClick={()=>setMobileMenuOpen(false)}/>}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <button onClick={()=>setMobileMenuOpen(true)} className="text-zinc-400 hover:text-white p-1.5 rounded-xl bg-zinc-800"><div className="space-y-1.5"><div className="w-5 h-0.5 bg-current"/><div className="w-5 h-0.5 bg-current"/><div className="w-5 h-0.5 bg-current"/></div></button>
          <div className="flex items-center gap-2 flex-1"><div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-zinc-950 text-sm">M</div><span className="font-black text-white text-sm">Merkez Şube</span></div>
          <span className="text-zinc-500 text-xs">{currentStaff.name}</span>
        </div>
        <div className="flex-1 flex overflow-hidden">

        {/* ═══ DASHBOARD ════════════════════════════════════════════════════ */}
        {activePage==='dashboard'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black flex items-center gap-3"><BarChart3 className="text-emerald-500"/> Dashboard</h2>
                <p className="text-zinc-500 text-sm mt-0.5">Satış performansı ve özet analiz</p>
              </div>
              <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                {(['7','30','90'] as const).map(d=><button key={d} onClick={()=>setDashPeriod(d)} className={'px-4 py-2 rounded-xl text-sm font-bold transition-all '+(dashPeriod===d?'bg-emerald-500 text-zinc-950':'text-zinc-500 hover:text-white')}>Son {d} Gün</button>)}
              </div>
            </div>

            {/* Özet kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam Ciro</p><p className="text-3xl font-black text-emerald-400">₺{dashStats.ciro.toFixed(2)}</p><p className="text-zinc-600 text-xs mt-1">Son {dashPeriod} gün</p></div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Satış Adedi</p><p className="text-3xl font-black text-white">{dashStats.adet}</p><p className="text-zinc-600 text-xs mt-1">fatura</p></div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Ortalama Sepet</p><p className="text-3xl font-black text-blue-400">₺{dashStats.avgSale.toFixed(2)}</p></div>
              <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl"><p className="text-orange-400 text-xs font-bold uppercase mb-1">Açık Veresiye</p><p className="text-3xl font-black text-orange-400">₺{dashStats.veresiye.toFixed(2)}</p></div>
            </div>

            {/* Satış trendi grafiği */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h3 className="font-black text-lg mb-5 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400"/> Günlük Satış Trendi</h3>
                <div className="h-64 flex items-end gap-1 px-2">
                  {dashSalesData().map((d:any,i:number)=>{
                    const maxVal=Math.max(...dashSalesData().map((x:any)=>x.ciro),1);
                    const h=Math.round((d.ciro/maxVal)*100);
                    return(
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="text-emerald-400 text-[9px] opacity-0 group-hover:opacity-100 font-bold">₺{Math.round(d.ciro)}</div>
                        <div className="w-full bg-emerald-500 rounded-t-sm transition-all" style={{height:h+'%',minHeight:d.ciro>0?'4px':'0'}}></div>
                        {i%(Math.ceil(dashSalesData().length*0.167)|0)===0&&<div className="text-zinc-600 text-[9px] font-mono rotate-45 mt-1">{d.date}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h3 className="font-black text-lg mb-5 flex items-center gap-2"><Receipt size={16} className="text-blue-400"/> Ödeme Yöntemleri</h3>
                {payMethodData().length===0?<p className="text-zinc-600 text-center py-8 text-sm">Veri yok</p>:(
                  <div className="space-y-3 py-2">
                    {payMethodData().map((item:any,i:number)=>{
                      const total=payMethodData().reduce((a:number,b:any)=>a+b.value,0)||1;
                      const pct=Math.round((item.value/total)*100);
                      return(
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs"><span className="text-zinc-400 font-bold">{item.name}</span><span className="font-black" style={{color:pieColor(i)}}>₺{item.value.toFixed(2)} <span className="text-zinc-500">%{pct}</span></span></div>
                          <div className="h-2 bg-zinc-800 rounded-full"><div className="h-2 rounded-full transition-all" style={{width:pct+'%',background:pieColor(i)}}></div></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* En çok satan ürünler */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <h3 className="font-black text-lg mb-5 flex items-center gap-2"><Package size={16} className="text-purple-400"/> En Çok Satan Ürünler (Tüm Zamanlar)</h3>
              <div className="space-y-2 py-2">
                {topProducts().map((u:any,i:number)=>{
                  const maxCiro=Math.max(...topProducts().map((x:any)=>x.ciro),1);
                  const w=Math.round((u.ciro/maxCiro)*100);
                  return(
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-32 text-zinc-400 text-xs font-bold truncate">{u.name}</div>
                      <div className="flex-1 h-6 bg-zinc-800 rounded-lg overflow-hidden relative">
                        <div className="h-6 bg-emerald-500 rounded-lg transition-all flex items-center px-2" style={{width:w+'%'}}>
                          <span className="text-zinc-950 text-[10px] font-black whitespace-nowrap">₺{u.ciro.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="text-blue-400 text-xs font-black w-8 text-right">{u.adet}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ POS ═══════════════════════════════════════════════════════ */}
        {activePage==='pos'&&(
          <div className="flex flex-col lg:flex-row w-full">
            <div className="flex-1 p-5 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1"><Search className="absolute left-3.5 top-3 text-zinc-500" size={16}/><input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Ürün adı veya barkod..." className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-emerald-500 text-sm"/></div>
                <button onClick={()=>setOrderMode(!orderMode)} className={'px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all '+(orderMode?'bg-orange-500 text-zinc-950 border-orange-500':'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-orange-400 hover:text-orange-400')}><ShoppingBag size={15}/>{orderMode?'Sipariş Modu':'Sipariş Oluştur'}</button>
              </div>
              {orderMode&&(
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
                  <span className="text-orange-400 font-bold text-xs">🛍 Sipariş Modu</span>
                  <select value={orderCustomer} onChange={e=>setOrderCustomer(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm outline-none"><option value="">— Müşteri Seç —</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <input value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="Not..." className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm outline-none flex-1 min-w-[120px]"/>
                  <div className="flex items-center gap-2"><label className="text-zinc-500 text-xs font-bold">Teslim:</label><input type="date" value={orderDeliveryDate} onChange={e=>setOrderDeliveryDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm outline-none"/></div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3 content-start">
                {products.filter(p=>(p.name||'').toLowerCase().includes(searchQuery.toLowerCase())||(p.barcode||'').includes(searchQuery)).map(p=>(
                  <button key={p.id} onClick={()=>addToCart(p)} className={'border p-4 rounded-2xl text-left hover:border-emerald-500 transition-all flex flex-col justify-between h-32 group '+((p.stock||0)===0?'bg-zinc-900/50 border-red-900/30 opacity-60':'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50')}>
                    <span className="font-bold text-zinc-200 group-hover:text-emerald-400 line-clamp-2 text-sm">{p.name||'İsimsiz'}</span>
                    <div>
                      {p.category&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block" style={catStyleOf(p.category||'')}>{p.category}</span>}
                      <div className="flex justify-between items-center">
                        <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded '+((p.stock||0)===0?'bg-red-900/40 text-red-400':(p.stock||0)<=lowStockLimit?'bg-orange-900/30 text-orange-400':'bg-zinc-800 text-zinc-500')}>S:{p.stock||0}</span>
                        <span className="text-xl font-black text-white">₺{p.grossPrice||0}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Sepet */}
            <div className="w-full lg:w-[420px] max-h-[50vh] lg:max-h-full bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col shadow-2xl">
              <div className="p-4 border-b border-zinc-800 relative">
                <div className="flex items-center gap-2 mb-3 font-black text-base"><ShoppingCart className="text-emerald-500" size={17}/>{orderMode?'📦 YENİ SİPARİŞ':'SATIŞ FİŞİ'}</div>
                
                {/* ─── ANLIK MÜŞTERİ ARAMA (POS İÇİN) ─── */}
                {!orderMode&&(
                  <div className="relative z-50">
                    <Search size={14} className="absolute left-3 top-3.5 text-zinc-500"/>
                    <input
                      type="text"
                      value={showCartCustDropdown ? cartCustomerSearch : (customers.find(c=>c.id===cartCustomer)?.name || '')}
                      onChange={e => { setCartCustomerSearch(e.target.value); setShowCartCustDropdown(true); }}
                      onFocus={() => { setShowCartCustDropdown(true); setCartCustomerSearch(''); }}
                      placeholder="-- Perakende Müşteri (Ara) --"
                      className="w-full bg-zinc-950 border border-zinc-700 pl-9 pr-8 py-2.5 rounded-xl text-white outline-none text-sm font-bold focus:border-emerald-500"
                    />
                    {cartCustomer && !showCartCustDropdown && (
                      <button onClick={() => {setCartCustomer(''); setCartCustomerSearch('');}} className="absolute right-3 top-3.5 text-zinc-500 hover:text-red-400"><X size={14}/></button>
                    )}
                    {showCartCustDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={()=>setShowCartCustDropdown(false)}></div>
                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50">
                          <button onClick={()=>{setCartCustomer('');setShowCartCustDropdown(false);}} className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-400 hover:bg-zinc-700 border-b border-zinc-700">-- Perakende Müşteri --</button>
                          {customers.filter(c=>c.name.toLowerCase().includes(cartCustomerSearch.toLowerCase()) || (c.phone&&c.phone.includes(cartCustomerSearch))).map(c=>(
                            <button key={c.id} onClick={()=>{setCartCustomer(c.id);setShowCartCustDropdown(false);}} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-zinc-700 border-b border-zinc-700/50 last:border-0">
                              <div className="font-bold">{c.name}</div>
                              {c.phone && <div className="text-xs text-zinc-400">{c.phone}</div>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.map((item:any)=>(
                  <div key={item.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <div className="flex-1 min-w-0"><div className="text-sm font-bold text-zinc-300 truncate">{item.name}</div><div className="text-emerald-500 font-black text-sm">₺{((item.grossPrice||0)*(Number(item.qty)||0)).toFixed(2)}</div></div>
                    
                    {/* ─── KİLO/KÜSÜRAT GİRME ALANI ─── */}
                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 mx-2">
                      <button onClick={()=>setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:Math.max(0.01,(Number(i.qty)||0)-1)}:i))} className="text-zinc-500 hover:text-emerald-500 p-1"><MinusCircle size={18}/></button>
                      <input 
                        type="number" 
                        step="any" 
                        value={item.qty} 
                        onChange={e => setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:e.target.value}:i))}
                        onBlur={e => { const v = parseFloat(e.target.value); setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:isNaN(v)||v<=0?1:v}:i)); }}
                        className="w-12 bg-zinc-950 border border-zinc-700 rounded-lg text-center font-black text-sm text-white py-1 outline-none focus:border-emerald-500"
                      />
                      <button onClick={()=>setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:(Number(i.qty)||0)+1}:i))} className="text-zinc-500 hover:text-emerald-500 p-1"><PlusCircle size={18}/></button>
                    </div>
                    
                    <button onClick={()=>setCart(cart.filter((i:any)=>i.id!==item.id))} className="text-red-900 hover:text-red-500 p-1"><Trash2 size={15}/></button>
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
                  <button onClick={handleCreateOrder} className="w-full bg-orange-500 py-4 rounded-2xl font-black text-zinc-950 hover:bg-orange-400 active:scale-95 flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-500/20"><ShoppingBag size={17}/> SİPARİŞ OLUŞTUR & BEKLET</button>
                ):(
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button onClick={()=>finishSale('Nakit')} className="bg-zinc-800 hover:bg-zinc-700 py-3.5 rounded-2xl font-bold border border-zinc-700 active:scale-95 text-sm">NAKİT</button>
                      <button onClick={()=>finishSale('Kart')} className="bg-zinc-800 hover:bg-zinc-700 py-3.5 rounded-2xl font-bold border border-zinc-700 active:scale-95 text-sm">KART</button>
                    </div>
                    <button onClick={()=>setIsVeresiyeOpen(true)} className="w-full bg-emerald-500 py-4 rounded-2xl font-black text-zinc-950 hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20 text-sm mb-2">VERESİYE YAZ</button>
                    <div className="flex gap-2">
                      <button onClick={()=>{setSplitNakit('');setSplitKart('');setSplitModal(true);}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-2xl font-bold border border-zinc-700 text-xs flex items-center justify-center gap-1.5 text-zinc-300 active:scale-95"><SplitSquareHorizontal size={14}/> Fiyat Böl</button>
                      <button onClick={()=>{setQuoteDraft(cart.length>0?[...cart]:[]);setActivePage('quotes');}} className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 py-3 rounded-2xl font-bold border border-purple-600/40 text-xs flex items-center justify-center gap-1.5 text-purple-400 active:scale-95"><FileEdit size={14}/> Teklif Yap</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SİPARİŞLİ SATIŞLAR ════════════════════════════════════════ */}
        {activePage==='orders'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-3xl font-black flex items-center gap-3"><ShoppingBag className="text-orange-400"/> Siparişli Satışlar</h2><p className="text-zinc-500 text-sm mt-0.5">Bekleyen ve işlemdeki siparişleri yönet</p></div>
              <button onClick={()=>{setOrderMode(true);setActivePage('pos');}} className="bg-orange-500 hover:bg-orange-400 text-zinc-950 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm"><Plus size={16}/> Yeni Sipariş (POS)</button>
            </div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {(['all','bekliyor','hazirlaniyor','gönderildi','iptal'] as const).map(s=>{
                const cnt=s==='all'?orders.length:orders.filter(o=>o.status===s).length;
                const sc=statusConfig[s]||{label:s,color:'text-zinc-400',bg:'bg-zinc-800'};
                return(
                  <button key={s} onClick={()=>setOrderFilter(s)} className={'px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-1.5 '+(orderFilter===s?'bg-zinc-700 text-white border-zinc-600':'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600')}>
                    {s==='all'?'Tümü':sc.label} <span className={'text-[10px] font-black px-1.5 py-0.5 rounded-full '+(sc.bg)+' '+(sc.color)}>{cnt}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {(['bekliyor','hazirlaniyor','gönderildi','iptal'] as const).map(s=>{const cnt=orders.filter(o=>o.status===s).length;const sc=statusConfig[s];return(<div key={s} className={'p-4 rounded-2xl border '+(sc.bg.replace('/20','/30'))+' '+(sc.bg)}><p className={'text-xs font-bold uppercase mb-1 '+(sc.color)}>{sc.label}</p><p className={'text-3xl font-black '+(sc.color)}>{cnt}</p></div>);})}
            </div>
            <div className="space-y-4">
              {orders.filter(o=>orderFilter==='all'||o.status===orderFilter).slice().reverse().map((order:any)=>{
                const sc=statusConfig[order.status]||statusConfig['bekliyor'];
                return(
                  <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-4 p-5">
                      <div className="bg-zinc-800 px-3 py-2 rounded-xl text-center min-w-[72px] shrink-0"><p className="text-zinc-500 text-[9px] font-bold uppercase">Sipariş</p><p className="text-white font-black text-sm">#{order.id?.slice(-5).toUpperCase()}</p></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white">{order.customerName||'Müşteri yok'}</span>
                          <span className={'text-xs font-bold px-2.5 py-1 rounded-full '+(sc.bg)+' '+(sc.color)}>{sc.label}</span>
                          {order.deliveryDate&&<span className="text-xs text-zinc-500 flex items-center gap-1"><CalendarDays size={11}/> {order.deliveryDate}</span>}
                        </div>
                        <div className="text-zinc-500 text-xs mt-0.5">{order.createdAt}{order.note&&<span className="text-zinc-600"> · {order.note}</span>}</div>
                        {order.staffName&&<div className="text-zinc-700 text-[10px]">Oluşturan: {order.staffName}</div>}
                      </div>
                      <div className="text-right mr-2 shrink-0">
                        <div className="text-2xl font-black text-white">₺{(order.total||0).toFixed(2)}</div>
                        <div className="text-zinc-600 text-xs">{(order.items||[]).length} kalem</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {order.status==='bekliyor'&&<>
                          <button onClick={()=>handleOrderStatus(order.id,'hazirlaniyor')} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Clock size={11}/> Hazırla</button>
                          <button onClick={()=>{setEditingOrder(order);setEditOrderCart([...(order.items||[])]);setEditOrderDiscount(String(order.discountPct||0));}} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Pencil size={11}/> Düzenle</button>
                        </>}
                        {order.status==='hazirlaniyor'&&<button onClick={()=>handleOrderStatus(order.id,'gönderildi')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><SendHorizonal size={11}/> Gönderildi</button>}
                        {(order.status==='bekliyor'||order.status==='hazirlaniyor')&&<button onClick={()=>handleOrderStatus(order.id,'iptal')} className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Ban size={11}/> İptal</button>}
                        <button onClick={()=>{const msg=order.status==='gönderildi'?'Sipariş silinsin mi? (Satış kaydı ayrı kalır)':'Sipariş kalıcı olarak silinsin mi?';if(window.confirm(msg))deleteDoc(doc(db,'orders',order.id));}} className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Trash2 size={11}/> Sil</button>
                        {order.status==='gönderildi'&&<span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Satışa Dönüştürüldü</span>}
                      </div>
                    </div>
                    <div className="border-t border-zinc-800/50 px-5 pb-3">
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {(order.items||[]).map((item:any,i:number)=><span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl font-medium">{item.name} <span className="font-black text-white">×{item.qty}</span></span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {orders.filter(o=>orderFilter==='all'||o.status===orderFilter).length===0&&<div className="text-center text-zinc-600 py-16 font-bold text-lg">Bu filtrede sipariş yok.</div>}
            </div>
          </div>
        )}

        {/* ═══ TEKLİFLER ══════════════════════════════════════════════════ */}
        {activePage==='quotes'&&(
          <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden">
            <div className="w-full lg:w-[420px] max-h-[60vh] lg:max-h-none bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-black flex items-center gap-2"><FileEdit className="text-purple-400" size={18}/> Teklif Oluştur</h2>
                <span className="text-zinc-600 text-xs">{quoteDraft.length} ürün</span>
              </div>
              <div className="p-3 border-b border-zinc-800 shrink-0 relative">
                <div className="relative"><Search className="absolute left-3 top-2.5 text-zinc-500" size={14}/><input value={quoteSearch} onChange={e=>setQuoteSearch(e.target.value)} placeholder="Ürün ekle..." className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-purple-500 text-sm"/></div>
                {quoteSearch&&(
                  <div className="absolute left-3 right-3 top-full z-50 bg-zinc-800 border border-zinc-700 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-xl">
                    {products.filter(p=>(p.name||'').toLowerCase().includes(quoteSearch.toLowerCase())).slice(0,8).map(p=>(
                      <button key={p.id} onClick={()=>{addToQuote(p);setQuoteSearch('');}} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-700 text-left transition-all">
                        <span className="text-white font-medium text-sm">{p.name}</span>
                        <span className="text-purple-400 font-black ml-2">₺{p.grossPrice}</span>
                      </button>
                    ))}
                    {products.filter(p=>(p.name||'').toLowerCase().includes(quoteSearch.toLowerCase())).length===0&&<p className="text-zinc-600 text-sm text-center py-3">Ürün bulunamadı</p>}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {quoteDraft.length===0&&<p className="text-zinc-600 text-center py-8 text-sm font-bold">Ürün eklemek için yukarıdan arama yapın.</p>}
                {quoteDraft.map((item:any)=>(
                  <div key={item.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <div className="flex-1 min-w-0"><div className="text-sm font-bold text-zinc-300 truncate">{item.name}</div><div className="text-purple-400 font-black text-sm">₺{((item.grossPrice||0)*(Number(item.qty)||0)).toFixed(2)}</div></div>
                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 mx-2">
                      <button onClick={()=>setQuoteDraft(quoteDraft.map((i:any)=>i.id===item.id?{...i,qty:Math.max(0.01,(Number(i.qty)||0)-1)}:i))} className="text-zinc-500 hover:text-purple-400 p-1"><MinusCircle size={17}/></button>
                      <input 
                        type="number" step="any" value={item.qty} 
                        onChange={e => setQuoteDraft(quoteDraft.map((i:any)=>i.id===item.id?{...i,qty:e.target.value}:i))}
                        onBlur={e => { const v = parseFloat(e.target.value); setQuoteDraft(quoteDraft.map((i:any)=>i.id===item.id?{...i,qty:isNaN(v)||v<=0?1:v}:i)); }}
                        className="w-10 bg-zinc-950 border border-zinc-700 rounded-lg text-center font-black text-sm text-white py-1 outline-none"
                      />
                      <button onClick={()=>setQuoteDraft(quoteDraft.map((i:any)=>i.id===item.id?{...i,qty:(Number(i.qty)||0)+1}:i))} className="text-zinc-500 hover:text-purple-400 p-1"><PlusCircle size={17}/></button>
                    </div>
                    <button onClick={()=>setQuoteDraft(quoteDraft.filter((i:any)=>i.id!==item.id))} className="text-red-900 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
                <select value={quoteCustomer} onChange={e=>setQuoteCustomer(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"><option value="">-- Müşteri Seç (isteğe bağlı) --</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 flex-1"><Percent size={12} className="text-zinc-500"/><span className="text-zinc-500 text-xs">%</span><input type="number" min="0" max="100" value={quoteDiscount} onChange={e=>setQuoteDiscount(e.target.value)} placeholder="0" className="w-10 bg-transparent text-white outline-none font-bold text-sm"/></div>
                  <input value={quoteNote} onChange={e=>setQuoteNote(e.target.value)} placeholder="Not..." className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none"/>
                </div>
                <div className="flex justify-between items-center">
                  {qDiscountAmt>0&&<span className="text-zinc-500 text-xs">-₺{qDiscountAmt.toFixed(2)}</span>}
                  <span className="text-2xl font-black text-white ml-auto">₺{qTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{if(quoteDraft.length===0)return;setPrintQuote({id:'QT-'+(Date.now()),items:quoteDraft,subTotal:qRaw,discountAmount:qDiscountAmt,discountPct:qDiscountVal,total:qTotal,customerName:customers.find(c=>c.id===quoteCustomer)?.name||'',date:new Date().toLocaleString('tr-TR'),note:quoteNote,staffName:currentStaff?.name});setTimeout(()=>window.print(),100);}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold border border-zinc-700 text-sm flex items-center justify-center gap-1.5 text-zinc-300"><Printer size={14}/> Yazdır</button>
                  <button onClick={handleSaveQuote} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-1.5"><Save size={14}/> Kaydet</button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-black flex items-center gap-2"><Handshake className="text-purple-400"/> Teklifler</h2>
                <div className="flex gap-2">
                  {(['all','beklemede','onaylandi','reddedildi'] as const).map(s=>{
                    const cnt=s==='all'?quotes.length:quotes.filter(q=>q.status===s).length;
                    const cls=s==='beklemede'?'text-orange-400 bg-orange-500/10 border-orange-500/30':s==='onaylandi'?'text-emerald-400 bg-emerald-500/10 border-emerald-500/30':s==='reddedildi'?'text-red-400 bg-red-500/10 border-red-500/30':'text-zinc-400 bg-zinc-800 border-zinc-700';
                    return <button key={s} onClick={()=>setQuoteFilter(s)} className={'px-3 py-2 rounded-xl text-xs font-bold border transition-all '+(quoteFilter===s?cls:'bg-zinc-900 border-zinc-800 text-zinc-600')}>{s==='all'?'Tümü':s==='beklemede'?'Beklemede('+(cnt)+')':s==='onaylandi'?'Onaylı('+(cnt)+')':'Red('+(cnt)+')'}</button>;
                  })}
                </div>
              </div>
              <div className="space-y-4">
                {quotes.filter(q=>quoteFilter==='all'||q.status===quoteFilter).slice().reverse().map((q:any)=>(
                  <div key={q.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-4 p-5">
                      <div className="bg-purple-600/20 border border-purple-600/30 px-3 py-2 rounded-xl text-center min-w-[72px] shrink-0"><p className="text-purple-400 text-[9px] font-bold uppercase">Teklif</p><p className="text-white font-black text-sm">#{q.id?.slice(-5).toUpperCase()}</p></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white">{q.customerName||'Müşteri belirtilmemiş'}</span>
                          <span className={'text-xs font-bold px-2.5 py-1 rounded-full '+(q.status==='beklemede'?'bg-orange-500/20 text-orange-400':q.status==='onaylandi'?'bg-emerald-500/20 text-emerald-400':'bg-red-500/20 text-red-400')}>{q.status==='beklemede'?'⏳ Beklemede':q.status==='onaylandi'?'✅ Onaylandı':'❌ Reddedildi'}</span>
                          {q.convertedToSale&&<span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">Satışa Dönüştürüldü</span>}
                        </div>
                        <div className="text-zinc-500 text-xs mt-0.5">{q.createdAt}{q.note&&<span className="text-zinc-600"> · {q.note}</span>}</div>
                      </div>
                      <div className="text-right mr-2 shrink-0">
                        <div className="text-2xl font-black text-white">₺{(q.total||0).toFixed(2)}</div>
                        {q.discountAmount>0&&<div className="text-zinc-500 text-xs">-₺{q.discountAmount.toFixed(2)}</div>}
                        <div className="text-zinc-600 text-xs">{(q.items||[]).length} kalem</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {q.status==='beklemede'&&!q.convertedToSale&&<>
                          <button onClick={()=>handleQuoteToSale(q)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={12}/> Satışa Çevir</button>
                          <button onClick={()=>updateDoc(doc(db,'quotes',q.id),{status:'reddedildi'})} className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-1.5"><X size={11}/> Reddet</button>
                        </>}
                        <button onClick={()=>{setPrintQuote({...q});setTimeout(()=>window.print(),100);}} className="bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-400 px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-1.5"><Printer size={11}/> Yazdır</button>
                      </div>
                    </div>
                    <div className="border-t border-zinc-800/50 px-5 pb-3">
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {(q.items||[]).map((item:any,i:number)=><span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl font-medium">{item.name} <span className="font-black text-white">×{item.qty}</span> <span className="text-purple-400 font-black">₺{((item.grossPrice||0)*(Number(item.qty)||0)).toFixed(2)}</span></span>)}
                      </div>
                    </div>
                  </div>
                ))}
                {quotes.filter(q=>quoteFilter==='all'||q.status===quoteFilter).length===0&&<div className="text-center text-zinc-600 py-16 font-bold text-lg">Teklif bulunamadı.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ İADE / DEĞİŞİM ════════════════════════════════════════════ */}
        {activePage==='returns'&&(
          <div className="p-7 w-full overflow-y-auto">
            <h2 className="text-3xl font-black flex items-center gap-3 mb-6"><RefreshCw className="text-red-400"/> İade & Değişim</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                  <h3 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2"><ArrowLeftRight size={17} className="text-red-400"/> Yeni İade / Değişim</h3>
                  <div className="flex gap-2 mb-5">
                    {([['iade','🔄 İade'],['degisim','🔁 Değişim']] as const).map(([t,l])=><button key={t} onClick={()=>setReturnType(t)} className={'flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all '+(returnType===t?t==='iade'?'bg-red-500 text-white border-red-500':'bg-blue-500 text-white border-blue-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{l}</button>)}
                  </div>
                  <div className="flex gap-2 mb-4">
                    <input value={returnSaleId} onChange={e=>setReturnSaleId(e.target.value)} placeholder="Fiş no (son 6 karakter)..." className="flex-1 bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none focus:border-red-500 text-sm"/>
                    <button onClick={lookupSale} className="bg-red-600 hover:bg-red-500 text-white px-5 rounded-xl font-bold text-sm flex items-center gap-2"><Search size={14}/> Bul</button>
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
                            <input 
                               type="number" step="any" min="0" max={item.qty} value={returnLines[i]?.qty||0} 
                               onChange={e=>{const nl=[...returnLines];nl[i]={...nl[i],qty:e.target.value};setReturnLines(nl);}} 
                               onBlur={e=>{const v=parseFloat(e.target.value)||0; const nl=[...returnLines];nl[i]={...nl[i],qty:v>item.qty?item.qty:v<0?0:v};setReturnLines(nl);}}
                               className="w-16 bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-center font-black text-sm outline-none focus:border-red-500"
                            />
                            <input value={returnLines[i]?.reason||''} onChange={e=>{const nl=[...returnLines];nl[i]={...nl[i],reason:e.target.value};setReturnLines(nl);}} placeholder="Neden?" className="w-28 bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs outline-none"/>
                          </div>
                        ))}
                      </div>
                      {returnType==='degisim'&&(
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Değişim Ürünleri</label>
                          <select onChange={e=>{const p=products.find(p=>p.id===e.target.value);if(p){setExchangeCart(prev=>{const ex=prev.find((i:any)=>i.id===p.id);if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:i.qty+1}:i);return[...prev,{...p,qty:1}];});}e.target.value='';}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none text-sm"><option value="">— Değişim Ürünü Ekle —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} — ₺{p.grossPrice}</option>)}</select>
                          {exchangeCart.map((item:any,i:number)=>(
                            <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
                              <span className="font-bold text-white text-sm">{item.name}</span>
                              <div className="flex items-center gap-2"><span className="text-blue-400 font-black">×{item.qty}</span><button onClick={()=>setExchangeCart(exchangeCart.filter((_:any,ii:number)=>ii!==i))} className="text-zinc-600 hover:text-red-500"><X size={13}/></button></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea value={returnNote} onChange={e=>setReturnNote(e.target.value)} placeholder="Not..." rows={2} className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded-xl outline-none text-sm resize-none"/>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                        <span className="text-zinc-400 font-bold text-sm">İade Tutarı:</span>
                        <span className="text-red-400 font-black text-xl">₺{returnLines.filter(l=>Number(l.qty)>0).reduce((a,l)=>a+(returnSale.items[l.itemIdx]?.grossPrice||0)*(Number(l.qty)||0),0).toFixed(2)}</span>
                      </div>
                      <button onClick={handleSubmitReturn} className={'w-full py-4 rounded-2xl font-black text-zinc-950 flex items-center justify-center gap-2 text-sm '+(returnType==='iade'?'bg-red-500 hover:bg-red-400':'bg-blue-500 hover:bg-blue-400')}>
                        {returnType==='iade'?<><RefreshCw size={16}/> İADEYİ TAMAMLA</>:<><ArrowLeftRight size={16}/> DEĞİŞİMİ TAMAMLA</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col">
                <h3 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">İade Geçmişi</h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {returns.slice().reverse().map((ret:any)=>(
                    <div key={ret.id} className={'border rounded-2xl p-4 '+(ret.type==='degisim'?'border-blue-800/40 bg-blue-500/5':'border-red-800/30 bg-red-500/5')}>
                      <div className="flex justify-between items-start mb-2">
                        <div><span className={'text-xs font-bold px-2 py-0.5 rounded-full mr-2 '+(ret.type==='iade'?'bg-red-500/20 text-red-400':'bg-blue-500/20 text-blue-400')}>{ret.type==='iade'?'İADE':'DEĞİŞİM'}</span><span className="font-black text-white text-sm">{ret.customerName}</span></div>
                        <span className="text-red-400 font-black">-₺{(ret.total||0).toFixed(2)}</span>
                      </div>
                      <div className="text-zinc-500 text-xs">{ret.date}{ret.staffName&&(' · '+ret.staffName)}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">{(ret.items||[]).map((item:any,i:number)=><span key={i} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">{item.name} ×{item.qty}{item.reason&&<span className="text-zinc-600"> ({item.reason})</span>}</span>)}</div>
                    </div>
                  ))}
                  {returns.length===0&&<p className="text-zinc-600 text-center py-8 font-bold">Henüz iade/değişim yok.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STOK SAYFALARI ════════════════════════════════════════════ */}
        {activePage.startsWith('stock.')&&(
          <div className="flex flex-col w-full overflow-hidden">

            {activePage==='stock.products'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-black flex items-center gap-3"><Package className="text-emerald-500"/> Ürünler</h2>
                  <div className="flex gap-3">
                    <input type="file" accept=".csv" ref={fileInputRefProd} style={{display:'none'}} onChange={importProducts}/>
                    <button onClick={()=>fileInputRefProd.current?.click()} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 text-sm"><Upload size={14}/> İçeri</button>
                    <button onClick={exportProducts} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 text-sm"><Download size={14}/> Dışarı</button>
                    <button onClick={()=>setShowAddForm(!showAddForm)} className="bg-emerald-500 text-zinc-950 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"><Plus size={16}/> Yeni Ürün</button>
                  </div>
                </div>
                {showAddForm&&(
                  <form onSubmit={handleAddProduct} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
                    <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase">Ürün İsmi</label><input required value={pName} onChange={e=>setPName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm" placeholder="Dove Sabun 100gr"/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Barkod</label><input value={pBarcode} onChange={e=>setPBarcode(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm" placeholder="Okutun..."/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={pCat} onChange={e=>setPCat(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm"><option value="">— Seç —</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Birim</label><select value={pUnit} onChange={e=>setPUnit(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm"><option>Adet</option><option>Koli</option><option>Paket</option><option>Kg</option><option>Gram</option></select></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-blue-400 uppercase">Alış Fiyatı</label><input type="number" step="any" value={pCost} onChange={e=>setPCost(e.target.value)} className="w-full bg-blue-950/20 border border-blue-900 p-3 rounded-xl outline-none text-blue-300 text-sm" placeholder="0.00"/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-emerald-500 uppercase">NET Satış</label><input required type="number" step="any" value={pNet} onChange={e=>setPNet(e.target.value)} className="w-full bg-zinc-950 border border-emerald-900 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm" placeholder="0.00"/></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">KDV %</label><select value={pTax} onChange={e=>setPTax(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none text-sm"><option value="0">0</option><option value="1">1</option><option value="10">10</option><option value="20">20</option></select></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-violet-400 uppercase">Başlangıç Stok</label><input type="number" step="any" value={pStock} onChange={e=>setPStock(e.target.value)} className="w-full bg-violet-950/20 border border-violet-900 p-3 rounded-xl outline-none text-violet-300 text-sm" placeholder="0"/></div>
                    <div className="flex items-end"><button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-sm">KAYDET</button></div>
                  </form>
                )}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 mb-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="absolute left-3 top-3 text-zinc-500" size={15}/>
                      <input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Urun adi, barkod, kategori veya varyant ara..." className="w-full bg-zinc-950 border border-zinc-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-emerald-500 text-sm"/>
                    </div>
                    <select value={productCategoryFilter} onChange={e=>setProductCategoryFilter(e.target.value)} className="bg-zinc-950 border border-zinc-700 text-zinc-300 px-3 py-3 rounded-xl outline-none text-sm min-w-[180px]">
                      <option value="all">Tum kategoriler</option>
                      {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={productVariantFilter} onChange={e=>setProductVariantFilter(e.target.value as 'all'|'variant'|'single')} className="bg-zinc-950 border border-zinc-700 text-zinc-300 px-3 py-3 rounded-xl outline-none text-sm min-w-[160px]">
                      <option value="all">Tum urunler</option>
                      <option value="variant">Varyantli</option>
                      <option value="single">Tekil</option>
                    </select>
                    <select value={productStockFilter} onChange={e=>setProductStockFilter(e.target.value as 'all'|'in'|'low'|'out')} className="bg-zinc-950 border border-zinc-700 text-zinc-300 px-3 py-3 rounded-xl outline-none text-sm min-w-[170px]">
                      <option value="all">Tum stoklar</option>
                      <option value="in">Stokta olan</option>
                      <option value="low">Kritik stok</option>
                      <option value="out">Tukenen</option>
                    </select>
                    <select value={productSort} onChange={e=>setProductSort(e.target.value as 'name-asc'|'name-desc'|'price-asc'|'price-desc'|'stock-asc'|'stock-desc')} className="bg-zinc-950 border border-zinc-700 text-zinc-300 px-3 py-3 rounded-xl outline-none text-sm min-w-[180px]">
                      <option value="name-asc">Ada gore A-Z</option>
                      <option value="name-desc">Ada gore Z-A</option>
                      <option value="price-asc">Fiyat artan</option>
                      <option value="price-desc">Fiyat azalan</option>
                      <option value="stock-asc">Stok artan</option>
                      <option value="stock-desc">Stok azalan</option>
                    </select>
                    <button onClick={()=>{setProductSearch('');setProductCategoryFilter('all');setProductVariantFilter('all');setProductStockFilter('all');setProductSort('name-asc');}} className="bg-zinc-800 text-zinc-300 px-4 py-3 rounded-xl font-bold border border-zinc-700 hover:bg-zinc-700 text-sm flex items-center gap-2"><X size={14}/> Temizle</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                    <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1.5 rounded-full">{filteredProducts.length} / {products.length} urun</span>
                    <span className="bg-zinc-950 text-zinc-400 px-3 py-1.5 rounded-full">Kritik stok: {filteredProducts.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit).length}</span>
                    <span className="bg-zinc-950 text-zinc-400 px-3 py-1.5 rounded-full">Varyantli: {filteredProducts.filter(p=>String(p.variantGroup||'').trim()!=='').length}</span>
                  </div>
                </div>
                <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                      <tr><th className="p-4">Ürün</th><th className="p-4">Barkod</th><th className="p-4">Kategori</th><th className="p-4">Birim</th><th className="p-4 text-right">Alış</th><th className="p-4 text-right">Satış</th><th className="p-4 text-center">Stok</th><th className="p-4 text-center">İşlem</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredProducts.map(p=>{
                        const sc=stockColor(p.stock||0);
                        return(
                          <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-emerald-400 text-sm">{p.name||'-'}</div>
                              {p.variantGroup&&<div className="text-[10px] font-bold text-purple-400 mt-1">{p.variantGroup}</div>}
                            </td>
                            <td className="p-4 font-mono text-zinc-500 text-xs">{p.barcode||'-'}</td>
                            <td className="p-4">{p.category?<span className="text-xs font-bold px-2 py-1 rounded-full" style={catStyleOf(p.category||'')}>{p.category}</span>:<span className="text-zinc-700 text-xs">—</span>}</td>
                            <td className="p-4 text-sm text-zinc-400">{p.unit||'-'}</td>
                            <td className="p-4 text-right text-blue-400 text-sm">₺{(p.costPrice||0).toFixed(2)}</td>
                            <td className="p-4 text-right font-black text-white font-mono text-sm">₺{(p.grossPrice||0).toFixed(2)}</td>
                            <td className="p-4 text-center"><span className={(sc.badge)+' text-white text-xs font-black px-2.5 py-1 rounded-full'}>{p.stock||0}</span></td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={()=>openEditProduct(p)} className="text-zinc-600 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-zinc-800" title="Düzenle"><Pencil size={13}/></button>
                                <button onClick={()=>setVariantProduct(p)} className="text-zinc-600 hover:text-purple-400 p-1.5 rounded-lg hover:bg-zinc-800" title="Varyantlar"><Boxes size={13}/></button>
                                <button onClick={async()=>{setPriceHistoryProduct(p);await loadPriceHistory(p.id);}} className="text-zinc-600 hover:text-yellow-400 p-1.5 rounded-lg hover:bg-zinc-800" title="Fiyat Geçmişi"><TrendingUp size={13}/></button>
                                <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-zinc-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-800" title="Sil"><Trash2 size={13}/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length===0&&(
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-zinc-600 font-bold">Aradiginiz kosullara uygun urun bulunamadi.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                  <div className="flex gap-2 ml-2">
                    {(['all','in','out'] as const).map(t=><button key={t} onClick={()=>setMvType(t)} className={'px-3 py-2 rounded-xl text-xs font-bold border transition-all '+(mvType===t?t==='in'?'bg-blue-500 text-white border-blue-500':t==='out'?'bg-red-500 text-white border-red-500':'bg-zinc-600 text-white border-zinc-600':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{t==='all'?'Tümü':t==='in'?'↓ Giriş':'↑ Çıkış'}</button>)}
                  </div>
                </div>
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam</p><p className="text-2xl font-black text-white">{filteredMovements.filtered.length}</p></div>
                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl"><p className="text-blue-400 text-xs font-bold uppercase mb-1">↓ Giriş</p><p className="text-2xl font-black text-blue-400">₺{filteredMovements.tIn.toFixed(2)}</p></div>
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl"><p className="text-red-400 text-xs font-bold uppercase mb-1">↑ Çıkış</p><p className="text-2xl font-black text-red-400">₺{filteredMovements.tOut.toFixed(2)}</p></div>
                      </div>
                      <div className="space-y-2">
                        {filteredMovements.filtered.map((mv,idx)=>(
                          <div key={idx} className={'border rounded-2xl p-4 flex items-center gap-4 '+(mv.type==='in'?'border-blue-800/40 bg-blue-500/5':'border-zinc-800 bg-zinc-900/50')}>
                            <div className={'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg '+(mv.type==='in'?'bg-blue-500/20 text-blue-400':'bg-red-500/10 text-red-400')}>{mv.type==='in'?'↓':'↑'}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-white text-sm">{mv.desc}</div>
                              <div className="flex flex-wrap gap-1.5 mt-1">{mv.items.slice(0,5).map((item:any,i:number)=><span key={i} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">{item.name} ×{item.qty}</span>)}{mv.items.length>5&&<span className="text-[11px] text-zinc-600">+{mv.items.length-5}</span>}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={'text-lg font-black '+(mv.type==='in'?'text-blue-400':'text-red-400')}>{mv.type==='in'?'+':'-'}₺{mv.total.toFixed(2)}</div>
                              <div className="text-zinc-600 text-xs">{mv.date}</div>
                            </div>
                          </div>
                        ))}
                        {filteredMovements.filtered.length===0&&<div className="text-center text-zinc-600 py-12 font-bold">Seçilen filtreye uygun hareket yok.</div>}
                      </div>
                    </>
              </div>
            )}

            {activePage==='stock.tracking'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Boxes className="text-emerald-500"/> Stok Takibi</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam Ürün</p><p className="text-3xl font-black text-white">{products.length}</p></div>
                  <div className={outOfStock>0?"bg-red-500/10 border border-red-500/30 p-5 rounded-2xl":"bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"}><p className={outOfStock>0?"text-xs font-bold uppercase mb-1 text-red-400":"text-xs font-bold uppercase mb-1 text-zinc-500"}>Tükenen</p><p className={outOfStock>0?"text-3xl font-black text-red-500":"text-3xl font-black text-zinc-600"}>{outOfStock}</p></div>
                  <div className={lowStock>0?"bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl":"bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"}><p className={lowStock>0?"text-xs font-bold uppercase mb-1 text-orange-400":"text-xs font-bold uppercase mb-1 text-zinc-500"}>Kritik (≤{lowStockLimit})</p><p className={lowStock>0?"text-3xl font-black text-orange-400":"text-3xl font-black text-zinc-600"}>{lowStock}</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Stok Değeri</p><p className="text-2xl font-black text-white">₺{totalStockValue.toFixed(0)}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <div className="relative"><Search className="absolute left-3 top-2.5 text-zinc-500" size={14}/><input value={stockSearch} onChange={e=>setStockSearch(e.target.value)} placeholder="Ürün ara..." className="bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm w-48"/></div>
                  <select value={stockCatFilter} onChange={e=>setStockCatFilter(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-2.5 rounded-xl outline-none text-sm"><option value="all">Tüm Kategoriler</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select>
                  <button onClick={()=>setStockFilter('all')} className={stockFilter==='all'?"px-3 py-2.5 rounded-xl text-sm font-bold border bg-emerald-500 text-zinc-950 border-emerald-500":"px-3 py-2.5 rounded-xl text-sm font-bold border bg-zinc-800 text-zinc-400 border-zinc-700"}>Tümü</button>
                  <button onClick={()=>setStockFilter('low')} className={stockFilter==='low'?"px-3 py-2.5 rounded-xl text-sm font-bold border bg-orange-400 text-zinc-950 border-orange-400":"px-3 py-2.5 rounded-xl text-sm font-bold border bg-zinc-800 text-zinc-400 border-zinc-700"}>Kritik({lowStock})</button>
                  <button onClick={()=>setStockFilter('out')} className={stockFilter==='out'?"px-3 py-2.5 rounded-xl text-sm font-bold border bg-red-500 text-white border-red-500":"px-3 py-2.5 rounded-xl text-sm font-bold border bg-zinc-800 text-zinc-400 border-zinc-700"}>Tükenen({outOfStock})</button>
                  <div className="ml-auto flex items-center gap-2"><span className="text-zinc-600 text-xs">Eşik:</span><input type="number" value={lowStockLimit} onChange={e=>setLowStockLimit(parseInt(e.target.value)||5)} className="w-14 bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-center text-sm outline-none font-bold"/></div>
                </div>
                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                      <tr><th className="p-4 text-left">Ürün</th><th className="p-4 text-left">Kategori</th><th className="p-4 text-right">Stok</th><th className="p-4 text-right">Satış</th><th className="p-4 text-right">Stok Değeri</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredStockProducts.map(p=>(
                        <tr key={p.id} className="hover:bg-zinc-800/30">
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            {(p.stock||0)===0&&<span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">TÜKENDI</span>}
                            {(p.stock||0)>0&&(p.stock||0)<=lowStockLimit&&<span className="text-[10px] bg-orange-400 text-zinc-950 font-bold px-2 py-0.5 rounded-full">KRİTİK</span>}
                          </td>
                          <td className="p-4">{p.category?<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={catStyleOf(p.category||'')}>{p.category}</span>:<span className="text-zinc-700">—</span>}</td>
                          <td className="p-4 text-right"><span className="font-black text-xl text-white">{p.stock||0}</span><span className="text-zinc-600 text-xs ml-1">{p.unit||'adet'}</span></td>
                          <td className="p-4 text-right font-bold text-white text-sm">₺{(p.grossPrice||0).toFixed(2)}</td>
                          <td className="p-4 text-right font-bold text-blue-400 text-sm">₺{((p.stock||0)*(p.costPrice||0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePage==='stock.count'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <div className="flex items-center justify-between mb-6">
                  <div><h2 className="text-2xl font-black flex items-center gap-2"><ClipboardCheck className="text-emerald-500"/> Stok Sayımı</h2><p className="text-zinc-500 text-sm mt-0.5">Fiziksel sayım sonuçlarını girin.</p></div>
                  <button onClick={handleSaveCount} className={'px-6 py-3 rounded-2xl font-black flex items-center gap-2 '+(countSaved?'bg-emerald-400 text-zinc-950':'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20')}>{countSaved?<><CheckCircle size={17}/> Kaydedildi!</>:<><Save size={17}/> Kaydet</>}</button>
                </div>
                <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                  <div className="grid grid-cols-12 gap-0 bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    <div className="col-span-5 p-4">Ürün</div><div className="col-span-2 p-4">Kategori</div><div className="col-span-2 p-4 text-center">Sistemdeki</div><div className="col-span-2 p-4 text-center">Sayılan</div><div className="col-span-1 p-4 text-center">Fark</div>
                  </div>
                  <div className="divide-y divide-zinc-800/50">
                    {products.map(p=>{
                      const counted=parseFloat(countDraft[p.id]??String(p.stock||0));
                      const diff=isNaN(counted)?0:counted-(p.stock||0);
                      return(
                        <div key={p.id} className="grid grid-cols-12 gap-0 items-center hover:bg-zinc-800/30">
                          <div className="col-span-5 p-4"><div className="font-bold text-white text-sm">{p.name}</div>{p.barcode&&<div className="text-zinc-600 text-xs font-mono">{p.barcode}</div>}</div>
                          <div className="col-span-2 p-4">{p.category?<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={catStyleOf(p.category||'')}>{p.category}</span>:<span className="text-zinc-700 text-xs">—</span>}</div>
                          <div className="col-span-2 p-4 text-center"><span className="font-black text-zinc-400 text-lg">{p.stock||0}</span></div>
                          <div className="col-span-2 p-4 text-center"><input type="number" step="any" min="0" value={countDraft[p.id]??String(p.stock||0)} onChange={e=>setCountDraft(prev=>({...prev,[p.id]:e.target.value}))} className="w-20 bg-zinc-950 border border-zinc-700 text-white rounded-xl p-2 text-center font-black text-lg outline-none focus:border-emerald-500"/></div>
                          <div className="col-span-1 p-4 text-center"><span className={'font-black text-sm '+(diff>0?'text-emerald-400':diff<0?'text-red-400':'text-zinc-600')}>{isNaN(diff)?'—':diff>0?'+'+(diff):diff===0?'=':diff}</span></div>
                        </div>
                      );
                    })}
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
                      <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Renk</label><div className="flex flex-wrap gap-2">{CAT_COLORS.map(c=><button key={c} type="button" onClick={()=>setNewCatColor(c)} className={'w-8 h-8 rounded-full transition-all '+(newCatColor===c?'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110':'')} style={{background:c}}></button>)}<input type="color" value={newCatColor} onChange={e=>setNewCatColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0"/></div></div>
                      <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full" style={{background:newCatColor}}></div><span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:newCatColor+'33',color:newCatColor}}>{newCatName||'Önizleme'}</span></div>
                      <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={15}/> Ekle</button>
                    </form>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                    <h4 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">Kategoriler</h4>
                    <div className="space-y-2">
                      {categories.map(cat=>{
                        const cnt=products.filter(p=>p.category===cat.name).length;
                        const catBg=cat.color;
                        const catBadgeBg=cat.color+'33';
                        return(
                          <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{background:catBg}}></div><div><span className="font-bold text-white text-sm">{cat.name}</span><div className="text-zinc-600 text-xs">{cnt} ürün</div></div></div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:catBadgeBg,color:catBg}}>{cat.name}</span>
                              <button type="button" onClick={()=>setCategoryEditor(cat)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-700 font-bold">Toplu Yonet</button>
                              <button onClick={()=>deleteDoc(doc(db,'categories',cat.id))} className="text-zinc-700 hover:text-red-500 p-1"><Trash2 size={13}/></button>
                            </div>
                          </div>
                        );
                      })}
                      {categories.length===0&&<p className="text-zinc-600 text-sm text-center py-4">Henüz kategori yok.</p>}
                    </div>
                    {categoryEditor&&(
                      <div className="mt-5 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-white font-black text-sm">Kategoriye Toplu Urun Bagla</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{categoryEditor.name} · {categoryEditorSelected.size} secili urun</p>
                          </div>
                          <button type="button" onClick={()=>setCategoryEditor(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-lg"><X size={14}/></button>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 text-zinc-500" size={14}/>
                            <input value={categoryEditorSearch} onChange={e=>setCategoryEditorSearch(e.target.value)} placeholder="Urun ara (ad, barkod, kategori)..." className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none text-sm"/>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={selectAllCategoryEditorFiltered} className="text-xs bg-emerald-500/15 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 font-bold">Filtreyi Sec</button>
                            <button type="button" onClick={clearAllCategoryEditorFiltered} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 font-bold">Filtreyi Kaldir</button>
                            <span className="text-xs text-zinc-500 ml-auto">{categoryEditorProducts.length} urun</span>
                          </div>
                          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50 border border-zinc-800 rounded-xl">
                            {categoryEditorProducts.map((p:any)=>{
                              const selected=categoryEditorSelected.has(p.id);
                              return(
                                <button key={p.id} type="button" onClick={()=>toggleCategoryEditorProduct(p.id)} className={'w-full p-3 text-left flex items-center gap-3 transition-colors '+(selected?'bg-emerald-500/10':'hover:bg-zinc-900')}>
                                  <div className={'w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 '+(selected?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>
                                    {selected&&<CheckCircle size={12} className="text-zinc-950"/>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{p.name}</div>
                                    <div className="text-xs text-zinc-500">{p.barcode||'Barkod yok'} · {(p.category||'Kategorisiz')}</div>
                                  </div>
                                </button>
                              );
                            })}
                            {categoryEditorProducts.length===0&&<div className="p-6 text-center text-zinc-600 text-sm font-bold">Aramaya uygun urun yok.</div>}
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                            <button type="button" onClick={()=>setCategoryEditor(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-2.5 rounded-xl font-bold border border-zinc-700 text-sm">Kapat</button>
                            <button type="button" disabled={categoryEditorSaving} onClick={handleSaveCategoryEditor} className="flex-1 bg-emerald-500 text-zinc-950 py-2.5 rounded-xl font-black text-sm disabled:opacity-50">{categoryEditorSaving?'Kaydediliyor...':'Degisiklikleri Kaydet'}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {activePage==='stock.bulk'&&(
              <div className="flex-1 overflow-y-auto p-7">
                <div className="flex items-center justify-between mb-6">
                 <div>
                    <h2 className="text-2xl font-black flex items-center gap-2"><Zap className="text-yellow-400"/> Toplu Fiyat Güncelleme</h2>
                    <p className="text-zinc-500 text-sm mt-0.5">Secili urunlere toplu zam veya indirim uygula. Varyant grubundan bir urun secildiginde ayni fiyat grubu birlikte islenir.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <button onClick={()=>setBulkType('zam')} className={'px-4 py-2.5 rounded-xl font-bold text-sm border transition-all '+(bulkType==='zam'?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>📈 Zam</button>
                      <button onClick={()=>setBulkType('indirim')} className={'px-4 py-2.5 rounded-xl font-bold text-sm border transition-all '+(bulkType==='indirim'?'bg-red-500 text-white border-red-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>📉 İndirim</button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>setBulkField('grossPrice')} className={'px-4 py-2.5 rounded-xl font-bold text-sm border transition-all '+(bulkField==='grossPrice'?'bg-blue-500 text-white border-blue-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>Satış Fiyatı</button>
                      <button onClick={()=>setBulkField('costPrice')} className={'px-4 py-2.5 rounded-xl font-bold text-sm border transition-all '+(bulkField==='costPrice'?'bg-blue-500 text-white border-blue-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>Alış Fiyatı</button>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5">
                      <span className="text-zinc-500 font-bold text-sm">%</span>
                      <input type="number" min="0" max="100" step="0.1" value={bulkPct} onChange={e=>setBulkPct(e.target.value)} placeholder="0" className="w-16 bg-transparent text-white outline-none font-black text-lg text-center"/>
                    </div>
                    <button onClick={()=>setBulkSelected(new Set(products.map(p=>p.id)))} className="bg-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl font-bold text-sm border border-zinc-700 hover:border-zinc-600">Tümü</button>
                    <button onClick={()=>setBulkSelected(new Set())} className="bg-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl font-bold text-sm border border-zinc-700 hover:border-zinc-600"><X size={14}/></button>
                    <button onClick={handleBulkPrice} className={'px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg '+(bulkDone?'bg-emerald-400 text-zinc-950':'bg-yellow-400 text-zinc-950 hover:bg-yellow-300 shadow-yellow-400/20')}>
                      {bulkDone?<><CheckCircle size={16}/> Uygulandı!</>:<><Zap size={16}/> Uygula ({bulkSelected.size})</>}
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                      <tr>
                        <th className="p-4 w-10"><button onClick={()=>{if(bulkSelected.size===products.length)setBulkSelected(new Set());else setBulkSelected(new Set(products.map(p=>p.id)));}} className={'w-5 h-5 rounded-lg border-2 flex items-center justify-center '+(bulkSelected.size===products.length?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>{bulkSelected.size===products.length&&<CheckCircle size={12} className="text-zinc-950"/>}</button></th>
                        <th className="p-4">Ürün</th>
                        <th className="p-4">Kategori</th>
                        <th className="p-4 text-right">Alış Fiyatı</th>
                        <th className="p-4 text-right">Satış Fiyatı</th>
                        <th className="p-4 text-right text-yellow-400">Yeni Fiyat</th>
                        <th className="p-4 text-center">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {products.map(p=>{
                        const variantTargets=getVariantPricingTargets(p);
                        const isSel=variantTargets.every((target:any)=>bulkSelected.has(target.id));
                        const cur=p[bulkField]||0;
                        const pct=parseFloat(bulkPct)||0;
                        const zamMult=(100+pct)*0.01;const indirimMult=(100-pct)*0.01;const newVal=pct>0?parseFloat((cur*(bulkType==='zam'?zamMult:indirimMult)).toFixed(2)):null;
                        return(
                          <tr key={p.id} onClick={()=>toggleBulkSelection(p)} className={'cursor-pointer transition-colors '+(isSel?'bg-yellow-500/5 hover:bg-yellow-500/10':'hover:bg-zinc-800/30')}>
                            <td className="p-4"><div className={'w-5 h-5 rounded-lg border-2 flex items-center justify-center '+(isSel?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>{isSel&&<CheckCircle size={12} className="text-zinc-950"/>}</div></td>
                            <td className="p-4">
                              <div className="font-bold text-white text-sm">{p.name}</div>
                              {p.variantGroup&&<div className="text-[10px] font-bold text-purple-400 mt-1">{p.variantGroup} · ortak fiyat</div>}
                            </td>
                            <td className="p-4">{p.category?<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={catStyleOf(p.category||'')}>{p.category}</span>:<span className="text-zinc-700 text-xs">—</span>}</td>
                            <td className={'p-4 text-right text-sm font-bold '+(bulkField==='costPrice'&&isSel?'text-blue-400':'text-blue-400/60')}>₺{(p.costPrice||0).toFixed(2)}</td>
                            <td className={'p-4 text-right text-sm font-bold '+(bulkField==='grossPrice'&&isSel?'text-white':'text-zinc-500')}>₺{(p.grossPrice||0).toFixed(2)}</td>
                            <td className="p-4 text-right">
                              {newVal&&isSel?(
                                <div>
                                  <span className={'font-black text-sm '+(bulkType==='zam'?'text-emerald-400':'text-red-400')}>₺{newVal.toFixed(2)}</span>
                                  <span className={'text-xs ml-1 '+(bulkType==='zam'?'text-emerald-600':'text-red-600')}>{bulkType==='zam'?'+':'-'}{pct}%</span>
                                </div>
                              ):<span className="text-zinc-700 text-sm">—</span>}
                            </td>
                            <td className="p-4 text-center"><span className={(stockColor(p.stock||0).badge)+' text-white text-xs font-black px-2.5 py-1 rounded-full'}>{p.stock||0}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══ ALIŞ FATURALARI ════════════════════════════════════════════ */}
        {activePage==='purchases'&&(
          <div className="p-7 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-3xl font-black flex items-center gap-2"><ArrowDownToLine className="text-blue-400"/> Alış Faturaları</h2><p className="text-zinc-500 text-sm mt-0.5">Stok otomatik güncellenir.</p></div>
              <button onClick={()=>setShowPurchaseForm(!showPurchaseForm)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20"><Plus size={16}/> Yeni Alış Faturası</button>
            </div>
            {showPurchaseForm&&(
              <form onSubmit={handleSavePurchase} className="bg-zinc-900 border border-blue-900/40 p-6 rounded-3xl mb-6 space-y-5 animate-in slide-in-from-top duration-300">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-300">💡 Ürünleri ürün deposundan seç — tedarikçi adı ile stok adı farklı olabilir.</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Tedarikçi</label><input value={purchaseSupplier} onChange={e=>setPurchaseSupplier(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl outline-none focus:border-blue-500 text-white text-sm" placeholder="Tedarikçi adı..."/></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Tarih</label><input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl outline-none focus:border-blue-500 text-white text-sm"/></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Fatura No</label><input value={purchaseNote} onChange={e=>setPurchaseNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-xl outline-none focus:border-blue-500 text-white text-sm" placeholder="INV-2026-001..."/></div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-3 text-xs font-bold text-zinc-500 uppercase px-1"><div className="col-span-5">Ürün</div><div className="col-span-2 text-center">Miktar</div><div className="col-span-3">Alış Fiyatı</div><div className="col-span-2 text-right text-zinc-700">Toplam</div></div>
                  {purchaseLines.map((line,idx)=>{
                    const lt=(parseFloat(line.qty)||0)*(parseFloat(line.cost)||0);
                    return(
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5"><select value={line.productId} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],productId:e.target.value,cost:products.find(p=>p.id===e.target.value)?.costPrice?.toString()||''};setPurchaseLines(nl);}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"><option value="">— Ürün Seç —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · Stok:{p.stock||0}</option>)}</select></div>
                        <div className="col-span-2"><input type="number" step="any" min="0.01" value={line.qty} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],qty:e.target.value};setPurchaseLines(nl);}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-center font-bold text-sm"/></div>
                        <div className="col-span-3"><input type="number" step="0.01" value={line.cost} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],cost:e.target.value};setPurchaseLines(nl);}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                        <div className="col-span-1 text-right text-zinc-500 text-sm font-bold">₺{lt.toFixed(2)}</div>
                        <div className="col-span-1 flex justify-center">{purchaseLines.length>1&&<button type="button" onClick={()=>setPurchaseLines(purchaseLines.filter((_,i)=>i!==idx))} className="text-zinc-600 hover:text-red-500"><X size={14}/></button>}</div>
                      </div>
                    );
                  })}
                  <button type="button" onClick={()=>setPurchaseLines([...purchaseLines,{productId:'',qty:'',cost:''}])} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold mt-1"><Plus size={13}/> Satır Ekle</button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="text-zinc-400 text-sm">Toplam: <span className="text-white font-black text-xl">₺{purchaseLines.reduce((a,l)=>a+((parseFloat(l.qty)||0)*(parseFloat(l.cost)||0)),0).toFixed(2)}</span></div>
                  <div className="flex gap-3"><button type="button" onClick={()=>setShowPurchaseForm(false)} className="bg-zinc-800 text-zinc-400 px-5 py-2.5 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 text-sm"><Save size={15}/> Kaydet & Stoğa İşle</button></div>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {purchases.slice().reverse().map((pur:any)=>(
                <div key={pur.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={()=>setExpandedPurchase(expandedPurchase===pur.id?null:pur.id)}>
                    <div className="bg-blue-600/20 border border-blue-600/30 px-3 py-2 rounded-xl text-center min-w-[64px]"><p className="text-blue-400 text-[9px] font-bold uppercase">Alış</p><p className="text-white font-black text-sm">#{pur.id?.slice(-5).toUpperCase()}</p></div>
                    <div className="flex-1"><p className="font-black text-white text-sm">{pur.supplier||'Tedarikçi yok'}</p><p className="text-zinc-500 text-xs">{pur.date}{pur.note&&<span className="text-zinc-600"> · {pur.note}</span>}</p></div>
                    <div className="text-right mr-2"><p className="text-xl font-black text-blue-400">₺{(pur.totalCost||0).toFixed(2)}</p><p className="text-zinc-600 text-xs">{(pur.items||[]).length} kalem</p></div>
                    {expandedPurchase===pur.id?<ChevronDown size={15} className="text-zinc-500 rotate-180"/>:<ChevronDown

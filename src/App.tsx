// App.tsx — BÖLÜM 1/3
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import {
ShoppingCart, Package, Users, Plus, Trash2, Search, PlusCircle, MinusCircle,
Wallet, UserPlus, CheckCircle, X, BarChart3, Printer, TrendingUp,
Zap, Phone, Percent, Download, Upload, FileSpreadsheet, CalendarDays,
Square, SquareCheck, Save, RotateCcw, Building2, MapPin, Hash, AlignLeft,
Palette, Eye, Boxes, ArrowDownToLine, ChevronDown,
Pencil, ArrowUpDown, Ban, ShoppingBag,
FileText, Receipt, MessageSquare, Filter, LogIn, LogOut, UserCog,
Shield, RefreshCw, Tag, Scale, Cloud
} from 'lucide-react';

const FileEdit = FileText;
const FolderOpen = Boxes;
const ClipboardCheck = CheckCircle;
const UserCheck = Users;
const SendHorizonal = ArrowUpDown;
const ArrowLeftRight = ArrowUpDown;
const Clock = Eye;
const Key = Shield;
const Settings = UserCog;
const SplitSquareHorizontal = ArrowUpDown;
const CheckCircle2 = CheckCircle;
const Handshake = Users;

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

const firebaseConfig = {
apiKey: "AIzaSyAqPHwW06rOK_kPDoyHQ-ZOqGWZtCJSLzU",
authDomain: "beyoglubuklet.firebaseapp.com",
projectId: "beyoglubuklet",
storageBucket: "beyoglubuklet.firebasestorage.app",
messagingSenderId: "258370785541",
appId: "1:258370785541:web:e517fab5f35ecfc8f5276c"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── TYPES ────────────────────────────────────────────────────────────────
type PaperSize = '58mm'|'80mm'|'a5'|'a4';
type BorderStyle = 'thick'|'thin'|'none';
type FontSize = 'small'|'normal'|'large';
type StaffRole = 'admin'|'ozel';
type DividerStyle = 'solid'|'dashed'|'double'|'none';

interface ReceiptSettings {
companyName:string; companySubtitle:string; address:string; phone:string;
taxNo:string; footerLine1:string; footerLine2:string;
showTaxNo:boolean; showAddress:boolean; showPhone:boolean;
showItemTax:boolean; showCustomerBox:boolean;
showReceiptNo:boolean; showCashier:boolean; showTime:boolean;
borderStyle:BorderStyle; fontSize:FontSize; paperSize:PaperSize;
companyNameFontSize:number; companyNameSingleLine:boolean;
companyNameAlign:'left'|'center'|'right';
subtitleFontSize:number; subtitleAlign:'left'|'center'|'right';
logoBase64:string|null; logoSize:number; logoAlign:'left'|'center'|'right';
// YENİ: tam kontrol
paddingH:number; paddingV:number;
rowPaddingY:number; sectionGap:number;
headerDivider:DividerStyle; footerDivider:DividerStyle;
itemDivider:DividerStyle; totalsDivider:DividerStyle;
}

const DEFAULT_SETTINGS: ReceiptSettings = {
companyName:'MERKEZ ŞUBE',
companySubtitle:'TOPTAN TİCARET VE SATIŞ FİŞİ',
address:'', phone:'', taxNo:'',
footerLine1:'BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜR EDERİZ.',
footerLine2:'YİNE BEKLERİZ!',
showTaxNo:true, showAddress:false, showPhone:false,
showItemTax:false, showCustomerBox:true,
showReceiptNo:true, showCashier:true, showTime:true,
borderStyle:'thin', fontSize:'small', paperSize:'a4',
companyNameFontSize:22, companyNameSingleLine:false,
companyNameAlign:'left',
subtitleFontSize:9, subtitleAlign:'left',
logoBase64:null, logoSize:60, logoAlign:'center',
paddingH:8, paddingV:8,
rowPaddingY:2, sectionGap:5,
headerDivider:'solid', footerDivider:'dashed',
itemDivider:'none', totalsDivider:'solid',
};

const PAPER_WIDTHS:Record<PaperSize,number> = {'58mm':220,'80mm':310,'a5':520,'a4':680};
const PAPER_LABELS:Record<PaperSize,string> = {'58mm':'Termal 58mm','80mm':'Termal 80mm','a5':'A5','a4':'A4'};

const loadSettings = ():ReceiptSettings => {
try { const s=localStorage.getItem('rcptS'); return s?{...DEFAULT_SETTINGS,...JSON.parse(s)}:DEFAULT_SETTINGS; }
catch { return DEFAULT_SETTINGS; }
};
const saveSettingsLS = (s:ReceiptSettings) => localStorage.setItem('rcptS',JSON.stringify(s));

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

const nKdv=(r?:number)=>{const v=r??20;if(v===0)return 0;if(v<=1)return 1;if(v<=15)return 10;return 20;};
const parseDT=(ds:string):Date=>{const[dp]=(ds??'').split(' ');const p=dp.split('.');if(p.length!==3)return new Date();return new Date(+p[2],+p[1]-1,+p[0]);};
const xn=(v:number,z='General')=>({t:'n' as const,v,z});
const xd=(v:Date)=>({t:'d' as const,v,z:'yyyy-mm-dd'});
const xs=(v:string)=>({t:'s' as const,v});
const xe=()=>({t:'z' as const,v:null});

async function exportParasut(arr:any[],fname?:string,opts:{firmName?:string;depotName?:string;invoicePrefix?:string}={}) {
const XLSX=await loadXLSX();
const PARASUT*HEADERS=['MÜŞTERİ ÜNVANI *','FATURA İSMİ','FATURA TARİHİ','DÖVİZ CİNSİ','DÖVİZ KURU','VADE TARİHİ','TAHSİLAT TL KARŞILIĞI','FATURA TÜRÜ','FATURA SERİ','FATURA SIRA NO','KATEGORİ','HİZMET/ÜRÜN _','HİZMET/ÜRÜN AÇIKLAMASI','ÇIKIŞ DEPOSU','MİKTAR _','BİRİM FİYATI _','İNDİRİM TUTARI','KDV ORANI _','ÖİV ORANI','KONAKLAMA VERGİSİ ORANI'];
const inv=arr.filter(s=>s.method!=='Tahsilat'&&(s.items||[]).length>0);
const depot=String(opts.depotName||'').trim();
const invPrefix=String(opts.invoicePrefix||'FTR').trim()||'FTR';
const rows:any[][]=[];
let lineCount=0;
rows.push([xs('Satış Faturaları - Paraşüt Import'),...Array.from({length:19},xe)]);
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
const wb=XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb,ws,'Satış Faturaları');
XLSX.writeFile(wb,fname||'parasut\*'+(new Date().toISOString().slice(0,10))+'.xlsx');
return{invoiceCount:inv.length,lineCount};
}

// ─── YENİ GELİŞMİŞ FİŞ ŞABLONU ──────────────────────────────────────────
function ReceiptTemplate({sale,settings,preview=false}:{sale:any;settings:ReceiptSettings;preview?:boolean}) {
if(!sale)return null;
const pw=PAPER_WIDTHS[settings.paperSize];
const fsMap={small:0.75,normal:0.88,large:1.05};
const fs=fsMap[settings.fontSize];
const pH=settings.paddingH??8;
const pV=settings.paddingV??8;
const rP=settings.rowPaddingY??2;
const sG=settings.sectionGap??5;
const small=settings.paperSize==='58mm'||settings.paperSize==='80mm';

const outerBorder=settings.borderStyle==='thick'?'3px solid black':settings.borderStyle==='thin'?'1px solid #000':'none';
const divStr=(style:DividerStyle,w='1px',color='#000')=>{
if(style==='none')return 'none';
if(style==='double')return `3px double ${color}`;
return `${w} ${style} ${color}`;
};
const hDiv=divStr(settings.headerDivider??'solid','1px');
const fDiv=divStr(settings.footerDivider??'dashed','1px','#aaa');
const iDiv=settings.itemDivider!=='none'?divStr(settings.itemDivider??'none','1px','#eee'):'none';
const tDiv=divStr(settings.totalsDivider??'solid','1px');
const cnSize=settings.companyNameFontSize??22;
const stSize=settings.subtitleFontSize??9;

return (

<div style={{
      maxWidth:preview?'100%':pw+'px',
      margin:'0 auto',
      padding:`${pV}px ${pH}px`,
      background:'white',color:'black',
      fontFamily:"'Courier New',Courier,monospace",
      fontSize:(fs*13)+'px',
      border:preview?'none':outerBorder,
      boxSizing:'border-box',
    }}>
{/_ Logo _/}
{settings.logoBase64&&(
<div style={{textAlign:settings.logoAlign??'center',marginBottom:sG+'px'}}>
<img src={settings.logoBase64} alt="logo" style={{width:(settings.logoSize??60)+'px',height:'auto',display:'inline-block'}}/>
</div>
)}
{/_ Başlık _/}
<div style={{paddingBottom:sG+'px',marginBottom:sG+'px',borderBottom:hDiv}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:4}}>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:cnSize+'px',fontWeight:900,textTransform:'uppercase',lineHeight:1.05,textAlign:settings.companyNameAlign??'left',whiteSpace:settings.companyNameSingleLine?'nowrap':'normal',overflow:'hidden',textOverflow:'ellipsis'}}>{settings.companyName}</div>
{settings.companySubtitle&&<div style={{fontSize:stSize+'px',fontWeight:700,color:'#444',marginTop:1,textAlign:settings.subtitleAlign??'left'}}>{settings.companySubtitle}</div>}
{settings.showAddress&&settings.address&&<div style={{fontSize:(fs*10)+'px',color:'#555',marginTop:1}}>📍 {settings.address}</div>}
{settings.showPhone&&settings.phone&&<div style={{fontSize:(fs*10)+'px',color:'#555'}}>📞 {settings.phone}</div>}
</div>
<div style={{textAlign:'right',fontSize:(fs*10)+'px',flexShrink:0}}>
<div>{sale.isMerged?new Date().toLocaleDateString('tr-TR'):sale.date?.split(' ')[0]}</div>
{(settings.showTime??true)&&!sale.isMerged&&<div>{sale.date?.split(' ')[1]}</div>}
{(settings.showReceiptNo??true)&&<div>#{sale.id?.slice(-6).toUpperCase()}</div>}
{(settings.showCashier??true)&&sale.staffName&&<div style={{color:'#777'}}>{sale.staffName}</div>}
</div>
</div>
</div>
{/_ Müşteri _/}
{(settings.showCustomerBox??true)?(
<div style={{border:'1px solid #ccc',borderRadius:2,padding:`${Math.max(2,rP*2)}px`,marginBottom:sG+'px',background:'#fafafa'}}>
<div style={{fontWeight:900,fontSize:(fs*12)+'px',textTransform:'uppercase'}}>{sale.customerName}</div>
{settings.showTaxNo&&<div style={{color:'#666',fontSize:(fs*10)+'px'}}>VKN: {sale.customerTax||'-'}</div>}
<div style={{color:'#555',fontSize:(fs*10)+'px'}}>ÖDEME: {sale.method}</div>
</div>
):(
<div style={{marginBottom:sG+'px',fontSize:(fs*11)+'px',fontWeight:700}}>
{sale.customerName} · {sale.method}
{settings.showTaxNo&&<span style={{color:'#777'}}> · {sale.customerTax||'-'}</span>}
</div>
)}
{/_ Ürünler _/}
<table style={{width:'100%',borderCollapse:'collapse',marginBottom:sG+'px'}}>
<thead>
<tr style={{borderBottom:hDiv}}>
<th style={{textAlign:'left',padding:`${rP}px 0`,fontSize:(fs*10)+'px',fontWeight:900}}>ÜRÜN</th>
<th style={{textAlign:'center',padding:`${rP}px 0`,fontSize:(fs*10)+'px',fontWeight:900,width:36}}>ADT</th>
{settings.showItemTax&&<th style={{textAlign:'center',fontSize:(fs*10)+'px',fontWeight:900,width:30}}>KDV</th>}
{!small&&<th style={{textAlign:'right',padding:`${rP}px 0`,fontSize:(fs*10)+'px',fontWeight:900,width:50}}>FİYAT</th>}
<th style={{textAlign:'right',padding:`${rP}px 0`,fontSize:(fs*10)+'px',fontWeight:900,width:55}}>TUTAR</th>
</tr>
</thead>
<tbody>
{(sale.items||[]).map((item:any,i:number)=>(
<tr key={i} style={{borderBottom:iDiv!=='none'?iDiv:''}}>
<td style={{padding:`${rP}px 0`,fontWeight:600,fontSize:(fs*11)+'px'}}>{item.name}</td>
<td style={{padding:`${rP}px 0`,textAlign:'center',fontWeight:900,fontSize:(fs*11)+'px'}}>
{item.byWeight?`${Number(item.qty).toFixed(2)}k`:item.qty}
</td>
{settings.showItemTax&&<td style={{textAlign:'center',color:'#666',fontSize:(fs*9)+'px'}}>%{nKdv(item.taxRate)}</td>}
{!small&&<td style={{padding:`${rP}px 0`,textAlign:'right',color:'#555',fontSize:(fs*10)+'px'}}>₺{(item.grossPrice||0).toFixed(2)}</td>}
<td style={{padding:`${rP}px 0`,textAlign:'right',fontWeight:900,fontSize:(fs*11)+'px'}}>₺{((item.grossPrice||0)_(item.qty||1)).toFixed(2)}</td>
</tr>
))}
</tbody>
</table>
{/_ Toplamlar */}
<div style={{display:'flex',justifyContent:'flex-end'}}>
<div style={{width:small?'100%':'180px',borderTop:tDiv,paddingTop:rP+'px'}}>
<div style={{display:'flex',justifyContent:'space-between',color:'#666',marginBottom:1,fontSize:(fs*10)+'px',fontWeight:700}}>
<span>Ara:</span><span>₺{(sale.subTotal||sale.total||0).toFixed(2)}</span>
</div>
{(sale.discountAmount||0)>0&&(
<div style={{display:'flex',justifyContent:'space-between',color:'#666',marginBottom:1,fontSize:(fs*10)+'px',fontWeight:700}}>
<span>İsk:</span><span>-₺{(sale.discountAmount||0).toFixed(2)}</span>
</div>
)}
<div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:(fs*(small?14:18))+'px',marginTop:2}}>
<span>TOPLAM:</span><span>₺{(sale.total||0).toFixed(2)}</span>
</div>
</div>
</div>
{/_ Alt Yazı _/}
{(settings.footerLine1||settings.footerLine2)&&(
<div style={{marginTop:sG+'px',textAlign:'center',borderTop:fDiv!=='none'?fDiv:'none',paddingTop:rP+'px',color:'#aaa',fontWeight:700,fontSize:(fs*9)+'px'}}>
{settings.footerLine1&&<div>{settings.footerLine1}</div>}
{settings.footerLine2&&<div style={{marginTop:1}}>{settings.footerLine2}</div>}
</div>
)}
</div>
);
}

// ─── GİRİŞ EKRANI ─────────────────────────────────────────────────────────
function LoginScreen({onLogin}:{onLogin:(staff:any)=>void}) {
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
<p className="text-zinc-500 mb-4 text-sm">İlk kurulum</p>
<button onClick={handleCreateAdmin} className="bg-emerald-500 text-zinc-950 font-black px-8 py-4 rounded-2xl hover:bg-emerald-400 flex items-center gap-2 mx-auto"><Key size={20}/> Admin Hesabı Oluştur</button>
</div>
):(
<div className="space-y-4">
<select value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-4 rounded-2xl outline-none focus:border-emerald-500">
<option value="">— Personel Seçin —</option>
{staffList.map(s=><option key={s.id} value={s.id}>{s.name} ({s.role==='admin'?'Admin':'Özel'})</option>)}
</select>
<input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} maxLength={6} className="w-full bg-zinc-950 border border-zinc-700 text-white p-4 rounded-2xl outline-none focus:border-emerald-500 text-2xl text-center tracking-widest font-black" placeholder="• • • •"/>
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
// App.tsx — BÖLÜM 2/3
export default function App() {
// ── AUTH ─────────────────────────────────────────────────────────────
const [currentStaff,setCurrentStaff]=useState<any>(null);

// ── DATA ─────────────────────────────────────────────────────────────
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

// ── NAV ───────────────────────────────────────────────────────────────
const [activePage,setActivePage]=useState('pos');
const [stockOpen,setStockOpen]=useState(true);
const [mobileMenuOpen,setMobileMenuOpen]=useState(false);

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

// ── KİLO MODAL ────────────────────────────────────────────────────────
const [weightModal,setWeightModal]=useState<any>(null);
const [weightInput,setWeightInput]=useState('');

// ── ORDER ─────────────────────────────────────────────────────────────
const [orderMode,setOrderMode]=useState(false);
const [orderCustomer,setOrderCustomer]=useState('');
const [orderNote,setOrderNote]=useState('');
const [orderDeliveryDate,setOrderDeliveryDate]=useState('');
const [orderFilter,setOrderFilter]=useState('all');
const [editingOrder,setEditingOrder]=useState<any>(null);
const [editOrderCart,setEditOrderCart]=useState<any[]>([]);
const [editOrderDiscount,setEditOrderDiscount]=useState('');

// ── QUOTES ────────────────────────────────────────────────────────────
const [quoteDraft,setQuoteDraft]=useState<any[]>([]);
const [quoteCustomer,setQuoteCustomer]=useState('');
const [quoteDiscount,setQuoteDiscount]=useState('');
const [quoteNote,setQuoteNote]=useState('');
const [quoteSearch,setQuoteSearch]=useState('');
const [quoteFilter,setQuoteFilter]=useState('all');
const [printQuote,setPrintQuote]=useState<any>(null);

// ── SPLIT ─────────────────────────────────────────────────────────────
const [splitModal,setSplitModal]=useState(false);
const [splitNakit,setSplitNakit]=useState('');
const [splitKart,setSplitKart]=useState('');

// ── RETURNS ───────────────────────────────────────────────────────────
const [returnSaleId,setReturnSaleId]=useState('');
const [returnSale,setReturnSale]=useState<any>(null);
const [returnLines,setReturnLines]=useState<{itemIdx:number;qty:number;reason:string}[]>([]);
const [returnType,setReturnType]=useState<'iade'|'degisim'>('iade');
const [exchangeCart,setExchangeCart]=useState<any[]>([]);
const [returnNote,setReturnNote]=useState('');

// ── PRODUCTS ──────────────────────────────────────────────────────────
const [showAddForm,setShowAddForm]=useState(false);
const [pName,setPName]=useState('');
const [pBarcode,setPBarcode]=useState('');
const [pUnit,setPUnit]=useState('Adet');
const [pCost,setPCost]=useState('');
const [pNet,setPNet]=useState('');
const [pTax,setPTax]=useState('20');
const [pStock,setPStock]=useState('0');
const [pCat,setPCat]=useState('');
const [pByWeight,setPByWeight]=useState(false);
const [editingProduct,setEditingProduct]=useState<any>(null);
const [editForm,setEditForm]=useState<any>({});
const [productSearch,setProductSearch]=useState('');
const [productCategoryFilter,setProductCategoryFilter]=useState('all');
const [productStockFilter,setProductStockFilter]=useState<'all'|'in'|'low'|'out'>('all');
const [productSort,setProductSort]=useState<'name-asc'|'name-desc'|'price-asc'|'price-desc'|'stock-asc'|'stock-desc'>('name-asc');

// ── CUSTOMERS ─────────────────────────────────────────────────────────
const [showCustomerForm,setShowCustomerForm]=useState(false);
const [cName,setCName]=useState('');
const [cPhone,setCPhone]=useState('');
const [cTaxNum,setCTaxNum]=useState('');
const [cCat,setCCat]=useState('');
const [cNote,setCNote]=useState('');
const [editingCustomer,setEditingCustomer]=useState<any>(null);
const [editCustForm,setEditCustForm]=useState<any>({});
const [selectedCustomer,setSelectedCustomer]=useState<any>(null);
const [custDetailTab,setCustDetailTab]=useState<'sales'|'history'|'orders'>('sales');
const [filterStart,setFilterStart]=useState('');
const [filterEnd,setFilterEnd]=useState('');
const [selectedSaleIds,setSelectedSaleIds]=useState<Set<string>>(new Set());
const [customerSearch,setCustomerSearch]=useState(''); // YENİ: müşteri arama

// ── STOCK ─────────────────────────────────────────────────────────────
const [stockSearch,setStockSearch]=useState('');
const [stockCatFilter,setStockCatFilter]=useState('all');
const [stockFilter,setStockFilter]=useState<'all'|'low'|'out'>('all');
const [lowStockLimit,setLowStockLimit]=useState(5);
const [countDraft,setCountDraft]=useState<Record<string,string>>({});
const [countSaved,setCountSaved]=useState(false);
const [mvStart,setMvStart]=useState('');
const [mvEnd,setMvEnd]=useState('');
const [mvType,setMvType]=useState<'all'|'in'|'out'>('all');
const [newCatName,setNewCatName]=useState('');
const [newCatColor,setNewCatColor]=useState('#10b981');
const [categoryEditor,setCategoryEditor]=useState<any>(null);
const [categoryEditorSearch,setCategoryEditorSearch]=useState('');
const [categoryEditorSelected,setCategoryEditorSelected]=useState<Set<string>>(new Set());
const [categoryEditorSaving,setCategoryEditorSaving]=useState(false);
const [newCustCatName,setNewCustCatName]=useState('');
const [newCustCatColor,setNewCustCatColor]=useState('#3b82f6');

// ── PURCHASES ─────────────────────────────────────────────────────────
const [showPurchaseForm,setShowPurchaseForm]=useState(false);
const [purchaseSupplier,setPurchaseSupplier]=useState('');
const [purchaseDate,setPurchaseDate]=useState('');
const [purchaseNote,setPurchaseNote]=useState('');
const [purchaseLines,setPurchaseLines]=useState<{productId:string;qty:string;cost:string}[]>([{productId:'',qty:'',cost:''}]);
const [expandedPurchase,setExpandedPurchase]=useState<string|null>(null);

// ── REPORTS ───────────────────────────────────────────────────────────
const [expName,setExpName]=useState('');
const [expAmount,setExpAmount]=useState('');
const [reportDate,setReportDate]=useState(new Date().toISOString().slice(0,10));
const [reportTab,setReportTab]=useState<'genel'|'gunSonu'|'kdv'|'personel'|'aylik'|'parasut'>('genel');
const [reportMonth,setReportMonth]=useState(new Date().toISOString().slice(0,7));
const [settingsTab,setSettingsTab]=useState<'fis'|'parasut'>('fis');
const [parasutFirm,setParasutFirm]=useState(()=>localStorage.getItem('parasutFirm')||'');
const [parasutDepot,setParasutDepot]=useState(()=>localStorage.getItem('parasutDepot')||'');
const parasutFirmTrim=parasutFirm.trim();
const parasutDepotTrim=parasutDepot.trim();
const parasutReady=parasutFirmTrim.length>0;
const parasutOpts=useMemo(()=>({firmName:parasutFirmTrim,depotName:parasutDepotTrim,invoicePrefix:'FTR'}),[parasutFirmTrim,parasutDepotTrim]);
const [staffLogFilter,setStaffLogFilter]=useState('all');
const [staffLogDateFilter,setStaffLogDateFilter]=useState('');
const [dashPeriod,setDashPeriod]=useState<'7'|'30'|'90'>('30');

// ── STAFF ─────────────────────────────────────────────────────────────
const [newStaffName,setNewStaffName]=useState('');
const [newStaffPin,setNewStaffPin]=useState('');
const [newStaffRole,setNewStaffRole]=useState<StaffRole>('ozel');
const [newStaffPerms,setNewStaffPerms]=useState<string[]>(['pos','orders','returns','customers','customers.tahsilat']);
const [editingStaff,setEditingStaff]=useState<any>(null);
const [editStaffPerms,setEditStaffPerms]=useState<string[]>([]);
const [editStaffPin,setEditStaffPin]=useState('');

// ── BULK PRICE ────────────────────────────────────────────────────────
const [bulkSelected,setBulkSelected]=useState<Set<string>>(new Set());
const [bulkPct,setBulkPct]=useState('');
const [bulkType,setBulkType]=useState<'zam'|'indirim'>('zam');
const [bulkField,setBulkField]=useState<'grossPrice'|'costPrice'>('grossPrice');
const [bulkDone,setBulkDone]=useState(false);

// ── VARIANTS ──────────────────────────────────────────────────────────
const [variantProduct,setVariantProduct]=useState<any>(null);
const [variantGroupName,setVariantGroupName]=useState('');
const [variantSearch,setVariantSearch]=useState('');
const [variantSelectedIds,setVariantSelectedIds]=useState<Set<string>>(new Set());

// ── PRICE HISTORY ─────────────────────────────────────────────────────
const [priceHistoryProduct,setPriceHistoryProduct]=useState<any>(null);
const [priceHistory,setPriceHistory]=useState<any[]>([]);
const [priceHistoryLoading,setPriceHistoryLoading]=useState(false);

// ── RECEIPT SETTINGS (LOCAL + CLOUD) ─────────────────────────────────
const [receiptSettings,setReceiptSettings]=useState<ReceiptSettings>(loadSettings);
const [draftSettings,setDraftSettings]=useState<ReceiptSettings>(loadSettings);
const [settingsSaved,setSettingsSaved]=useState(false);

const fileInputRefProd=useRef<HTMLInputElement>(null);
const fileInputRefCust=useRef<HTMLInputElement>(null);
const CAT_COLORS=['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

// ── FIREBASE LİSTENERS ────────────────────────────────────────────────
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
// ── FİŞ AYARLARI BULUTTAN ─────────────────────────────────────────
onSnapshot(doc(db,'receiptSettings','main'),(snap)=>{
if(snap.exists()){
const data=snap.data() as ReceiptSettings;
const merged={...DEFAULT_SETTINGS,...data};
setReceiptSettings(merged);
setDraftSettings(merged);
saveSettingsLS(merged);
}
}),
];
return()=>uns.forEach(u=>u());
},[]);

// ── BARKOD OKUYUCU ────────────────────────────────────────────────────
useEffect(()=>{
let buf='';let lastKeyTime=0;let bufTimer:any=null;
const SPEED=80;
const hk=(e:KeyboardEvent)=>{
const now=Date.now();
const inInput=(e.target as HTMLElement).tagName==='INPUT'||(e.target as HTMLElement).tagName==='SELECT';
const timeSince=now-lastKeyTime;lastKeyTime=now;
if(e.key==='Enter'){
if(buf.length>2){const f=products.find(p=>p.barcode===buf);if(f){setActivePage('pos');addToCart(f);setFlash(true);setTimeout(()=>setFlash(false),300);setSearchQuery('');}}
buf='';return;
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
if(!categoryEditor){setCategoryEditorSearch('');setCategoryEditorSelected(new Set());return;}
const ids=products.filter(p=>(p.category||'')===categoryEditor.name).map(p=>p.id);
setCategoryEditorSearch('');setCategoryEditorSelected(new Set(ids));
},[categoryEditor,products]);

// ── HELPERS ───────────────────────────────────────────────────────────
const catColor=(name:string)=>categories.find(c=>c.name===name)?.color||'#6b7280';
const custCatColor=(name:string)=>custCategories.find(c=>c.name===name)?.color||'#6b7280';
const calcGross=(net:string,tax:string)=>net?(parseFloat(net)\*(1+parseFloat(tax)/100)).toFixed(2):'0.00';
const roleLabel=(staff:any)=>staff?.role==='admin'?'🔑 Admin (Tam Yetki)':'⚙️ Özel ('+((staff?.permissions||[]).length)+' yetki)';
const PIE_COLORS=['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'];
const pieColor=(i:number)=>PIE_COLORS[i%PIE_COLORS.length];
const catStyle=(color:string)=>({background:color+'33',color:color});
const catStyleOf=(cat:string)=>{const c=catColor(cat);return{background:c+'33',color:c};};
const statusConfig:Record<string,{label:string;color:string;bg:string}>={
'bekliyor':{label:'Bekliyor',color:'text-orange-400',bg:'bg-orange-500/20'},
'hazirlaniyor':{label:'Hazırlanıyor',color:'text-blue-400',bg:'bg-blue-500/20'},
'gönderildi':{label:'Gönderildi',color:'text-emerald-400',bg:'bg-emerald-500/20'},
'iptal':{label:'İptal',color:'text-red-400',bg:'bg-red-500/20'},
};
const canDo=(action:string)=>{
if(!currentStaff)return false;
if(currentStaff.role==='admin')return true;
const perms:string[]=currentStaff.permissions||[];
return perms.includes(action);
};
const stockColor=(stock:number)=>{
if(stock===0)return{badge:'bg-red-500'};
if(stock<=lowStockLimit)return{badge:'bg-orange-400'};
return{badge:'bg-emerald-500'};
};
const logAction=async(action:string,detail:string,amount?:number)=>{
if(!currentStaff)return;
await addDoc(collection(db,'staffLogs'),{staffId:currentStaff.id,staffName:currentStaff.name,role:currentStaff.role,action,detail,amount:amount||0,date:new Date().toLocaleString('tr-TR'),ts:Date.now()});
};
const handleParasutExport=async(arr:any[],fileName?:string)=>{
if(!parasutReady){alert('Paraşüt aktarımı için önce Firma Ünvanı alanını doldurun.');return null;}
const stats=await exportParasut(arr,fileName,parasutOpts);
if(stats)alert('Paraşüt dosyası oluşturuldu: '+stats.invoiceCount+' fatura, '+stats.lineCount+' satır.');
return stats;
};

// ── VARIANT HELPERS ───────────────────────────────────────────────────
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
const getVariantPricePatch=(product:any)=>({
costPrice:Number(product?.costPrice)||0,
netPrice:Number(product?.netPrice)||0,
taxRate:parseInt(String(product?.taxRate??20))||20,
grossPrice:Number(product?.grossPrice)||0,
});
const toggleBulkSelection=(product:any)=>{
const targetIds=getVariantPricingTargets(product).map((item:any)=>item.id);
setBulkSelected(prev=>{
const next=new Set(prev);
const shouldSelect=targetIds.some((id:string)=>!next.has(id));
targetIds.forEach((id:string)=>{if(shouldSelect)next.add(id);else next.delete(id);});
return next;
});
};

// ── VARIANT MODAL EFFECTS ─────────────────────────────────────────────
useEffect(()=>{
if(!variantProduct){setVariantGroupName('');setVariantSearch('');setVariantSelectedIds(new Set());return;}
const members=getVariantGroupMembers(variantProduct);
setVariantGroupName(String(variantProduct.variantGroup||'').trim());
setVariantSearch('');
setVariantSelectedIds(new Set((members.length>0?members:[variantProduct]).map((p:any)=>p.id)));
},[variantProduct]);

const variantSelectedProducts=useMemo(()=>{
if(!variantProduct)return [];
const ids=new Set<string>([variantProduct.id,...Array.from(variantSelectedIds)]);
return products.filter(p=>ids.has(p.id)).sort((a,b)=>{if(a.id===variantProduct.id)return -1;if(b.id===variantProduct.id)return 1;return String(a.name||'').localeCompare(String(b.name||''),'tr');});
},[products,variantProduct,variantSelectedIds]);

const variantCandidates=useMemo(()=>{
if(!variantProduct)return [];
const q=variantSearch.trim().toLowerCase();
return products.filter(p=>p.id!==variantProduct.id).filter(p=>!q||(p.name||'').toLowerCase().includes(q)||(p.barcode||'').includes(q)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'tr'));
},[products,variantProduct,variantSearch]);

const categoryEditorProducts=useMemo(()=>{
if(!categoryEditor)return [];
const q=categoryEditorSearch.trim().toLowerCase();
return products.filter(p=>!q||(p.name||'').toLowerCase().includes(q)||(p.barcode||'').includes(q)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'tr'));
},[products,categoryEditor,categoryEditorSearch]);

const toggleVariantSelection=(productId:string)=>{
if(!variantProduct||productId===variantProduct.id)return;
setVariantSelectedIds(prev=>{const next=new Set(prev);if(next.has(productId))next.delete(productId);else next.add(productId);next.add(variantProduct.id);return next;});
};

// ── MÜŞTERİ ARAMA FİLTRESİ ───────────────────────────────────────────
const filteredCustomers=useMemo(()=>{
if(!customerSearch.trim())return customers;
const q=customerSearch.toLowerCase().trim();
return customers.filter(c=>
(c.name||'').toLowerCase().includes(q)||
(c.phone||'').includes(q)||
(c.taxNum||'').toLowerCase().includes(q)||
(c.category||'').toLowerCase().includes(q)
);
},[customers,customerSearch]);

// ── CART ──────────────────────────────────────────────────────────────
const addToCart=(p:any)=>{
if(p.byWeight){ // KİLO TARTIMLI
setWeightModal(p);
setWeightInput('');
return;
}
setCart(prev=>{
const ex=prev.find((i:any)=>i.id===p.id);
if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:i.qty+1}:i);
return[...prev,{...p,qty:1}];
});
setSearchQuery('');
};

const confirmWeight=()=>{
const w=parseFloat(weightInput.replace(',','.'));
if(!w||w<=0){alert('Geçerli bir ağırlık girin (örn: 1.5)');return;}
const p=weightModal;
setCart(prev=>{
const ex=prev.find((i:any)=>i.id===p.id);
if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:parseFloat((i.qty+w).toFixed(3))}:i);
return[...prev,{...p,qty:w,byWeight:true}];
});
setWeightModal(null);
setWeightInput('');
setSearchQuery('');
};

// ── TOTALS ────────────────────────────────────────────────────────────
const rawTotal=cart.reduce((t:number,i:any)=>t+((i.grossPrice||0)*i.qty),0);
const totalCostCart=cart.reduce((t:number,i:any)=>t+((i.costPrice||0)*i.qty),0);
const discountVal=parseFloat(discountPct)||0;
const discountAmount=rawTotal\*(discountVal/100);
const finalTotal=rawTotal-discountAmount;

// ── SALE ──────────────────────────────────────────────────────────────
const finishSale=async(method:string)=>{
if(cart.length===0)return;
if(method==='Veresiye'&&!cartCustomer)return alert('Veresiye satış için müşteri seçin!');
const ac=customers.find((c:any)=>c.id===cartCustomer);
const sd={items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,totalCost:totalCostCart,total:finalTotal,method,customerName:ac?ac.name:'Perakende Müşteri',customerTax:ac?ac.taxNum:'-',date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name};
const ref=await addDoc(collection(db,'sales'),sd);
if(method==='Veresiye'&&ac)await updateDoc(doc(db,'customers',ac.id),{balance:(ac.balance||0)+finalTotal});
for(const item of cart){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-item.qty)});}
await logAction('SATIŞ',(ac?ac.name:'Perakende')+' - '+method+' - ₺'+finalTotal.toFixed(2),finalTotal);
setLastSale({id:ref.id,...sd});setCart([]);setCartCustomer('');setDiscountPct('');setIsVeresiyeOpen(false);
};

const handleSplitSale=async()=>{
const nakit=parseFloat(splitNakit)||0,kart=parseFloat(splitKart)||0;
if(Math.abs(nakit+kart-finalTotal)>0.01)return alert('Nakit+Kart toplamı eşleşmiyor!');
if(cart.length===0)return;
const ac=customers.find((c:any)=>c.id===cartCustomer);
const base={items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,totalCost:totalCostCart,customerName:ac?ac.name:'Perakende Müşteri',customerTax:ac?ac.taxNum:'-',date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name,isSplit:true};
if(nakit>0)await addDoc(collection(db,'sales'),{...base,total:nakit,method:'Nakit'});
if(kart>0)await addDoc(collection(db,'sales'),{...base,total:kart,method:'Kart'});
for(const item of cart){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-item.qty)});}
await logAction('BÖLÜNMÜŞ_SATIŞ','Nakit:₺'+nakit+'+Kart:₺'+kart,finalTotal);
setLastSale({id:'SPLIT-'+Date.now(),items:cart,total:finalTotal,method:'Nakit ₺'+nakit+' + Kart ₺'+kart,customerName:ac?ac.name:'Perakende Müşteri',date:new Date().toLocaleString('tr-TR'),staffName:currentStaff?.name});
setCart([]);setCartCustomer('');setDiscountPct('');setSplitModal(false);setSplitNakit('');setSplitKart('');
};

// ── ORDERS ────────────────────────────────────────────────────────────
const handleCreateOrder=async()=>{
if(cart.length===0)return alert('Sepet boş!');
const ac=customers.find((c:any)=>c.id===orderCustomer);
await addDoc(collection(db,'orders'),{items:cart,subTotal:rawTotal,discountPct:discountVal,discountAmount,total:finalTotal,customerName:ac?ac.name:'Müşteri belirtilmemiş',customerTax:ac?ac.taxNum:'-',customerId:orderCustomer||'',note:orderNote,deliveryDate:orderDeliveryDate||'',status:'bekliyor',createdAt:new Date().toLocaleString('tr-TR'),updatedAt:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
await logAction('SİPARİŞ_OLUŞTUR',(ac?ac.name:'Müşterisiz')+' - ₺'+finalTotal.toFixed(2),finalTotal);
setCart([]);setCartCustomer('');setDiscountPct('');setOrderCustomer('');setOrderNote('');setOrderDeliveryDate('');setOrderMode(false);
alert('Sipariş oluşturuldu!');
};

const handleOrderStatus=async(orderId:string,newStatus:string)=>{
const order=orders.find(o=>o.id===orderId);
await updateDoc(doc(db,'orders',orderId),{status:newStatus,updatedAt:new Date().toLocaleString('tr-TR')});
if(newStatus==='gönderildi'&&order){
const ac=customers.find((c:any)=>c.id===order.customerId);
const sd={items:order.items,subTotal:order.subTotal,discountPct:order.discountPct,discountAmount:order.discountAmount,totalCost:0,total:order.total,method:order.customerId?'Veresiye':'Nakit',customerName:order.customerName,customerTax:order.customerTax,date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name};
await addDoc(collection(db,'sales'),sd);
if(ac)await updateDoc(doc(db,'customers',ac.id),{balance:(ac.balance||0)+order.total});
for(const item of(order.items||[])){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-item.qty)});}
}
};

const handleUpdateOrder=async(e:React.FormEvent)=>{
e.preventDefault();if(!editingOrder)return;
const rawT=editOrderCart.reduce((t:number,i:any)=>t+((i.grossPrice||0)_i.qty),0);
const dv=parseFloat(editOrderDiscount)||0,dAmt=rawT_(dv/100);
await updateDoc(doc(db,'orders',editingOrder.id),{items:editOrderCart,subTotal:rawT,discountPct:dv,discountAmount:dAmt,total:rawT-dAmt,updatedAt:new Date().toLocaleString('tr-TR')});
setEditingOrder(null);setEditOrderCart([]);setEditOrderDiscount('');
};

// ── QUOTES ────────────────────────────────────────────────────────────
const qRaw=useMemo(()=>quoteDraft.reduce((t:number,i:any)=>t+((i.grossPrice||0)_i.qty),0),[quoteDraft]);
const qDiscountVal=parseFloat(quoteDiscount)||0;
const qDiscountAmt=qRaw_(qDiscountVal/100);
const qTotal=qRaw-qDiscountAmt;
const addToQuote=(p:any)=>setQuoteDraft(prev=>{const ex=prev.find((i:any)=>i.id===p.id);if(ex)return prev.map((i:any)=>i.id===p.id?{...i,qty:i.qty+1}:i);return[...prev,{...p,qty:1}];});
const handleSaveQuote=async()=>{
if(quoteDraft.length===0)return alert('Sepet boş!');
const ac=customers.find((c:any)=>c.id===quoteCustomer);
await addDoc(collection(db,'quotes'),{items:quoteDraft,subTotal:qRaw,discountPct:qDiscountVal,discountAmount:qDiscountAmt,total:qTotal,customerName:ac?ac.name:'',customerTax:ac?ac.taxNum:'-',customerId:quoteCustomer||'',note:quoteNote,status:'beklemede',createdAt:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
setQuoteDraft([]);setQuoteCustomer('');setQuoteDiscount('');setQuoteNote('');
alert('Teklif kaydedildi!');
};
const handleQuoteToSale=async(q:any)=>{
if(!window.confirm('Bu teklifi satışa dönüştür?'))return;
const ac=customers.find((c:any)=>c.id===q.customerId);
const sd={items:q.items,subTotal:q.subTotal,discountPct:q.discountPct,discountAmount:q.discountAmount,totalCost:0,total:q.total,method:q.customerId?'Veresiye':'Nakit',customerName:q.customerName||'Perakende Müşteri',customerTax:q.customerTax||'-',date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name};
await addDoc(collection(db,'sales'),sd);
if(ac&&q.customerId)await updateDoc(doc(db,'customers',q.customerId),{balance:(ac.balance||0)+q.total});
for(const item of(q.items||[])){const p=products.find(p=>p.id===item.id);if(p&&typeof p.stock==='number')await updateDoc(doc(db,'products',p.id),{stock:Math.max(0,(p.stock||0)-item.qty)});}
await updateDoc(doc(db,'quotes',q.id),{status:'onaylandi',convertedToSale:true});
};

// ── RETURNS ───────────────────────────────────────────────────────────
const lookupSale=()=>{
const found=sales.find(s=>s.id===returnSaleId||s.id.slice(-6).toUpperCase()===returnSaleId.toUpperCase());
if(found){setReturnSale(found);setReturnLines((found.items||[]).map((\_:any,i:number)=>({itemIdx:i,qty:0,reason:''})));}
else alert('Satış bulunamadı.');
};
const handleSubmitReturn=async()=>{
if(!returnSale)return;
const lines=returnLines.filter(l=>l.qty>0);
if(lines.length===0)return alert('En az bir ürün seçin.');
const returnItems=lines.map(l=>({...returnSale.items[l.itemIdx],qty:l.qty,reason:l.reason}));
const returnTotal=returnItems.reduce((a:number,b:any)=>a+(b.grossPrice||0)\*b.qty,0);
await addDoc(collection(db,'returns'),{type:returnType,originalSaleId:returnSale.id,customerName:returnSale.customerName,items:returnItems,total:returnTotal,note:returnNote,date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
for(const item of returnItems){const p=products.find(p=>p.name===item.name);if(p)await updateDoc(doc(db,'products',p.id),{stock:(p.stock||0)+item.qty});}
if(returnSale.customerName&&returnSale.customerName!=='Perakende Müşteri'&&returnType==='iade'){
const cust=customers.find(c=>c.name===returnSale.customerName);
if(cust)await updateDoc(doc(db,'customers',cust.id),{balance:(cust.balance||0)-returnTotal});
}
alert((returnType==='iade'?'İade':'Değişim')+' tamamlandı!');
setReturnSale(null);setReturnSaleId('');setReturnLines([]);setReturnNote('');
};

// ── PRODUCTS CRUD ─────────────────────────────────────────────────────
const handleAddProduct=async(e:React.FormEvent)=>{
e.preventDefault();
await addDoc(collection(db,'products'),{name:pName,barcode:pBarcode,unit:pByWeight?'kg':pUnit,costPrice:parseFloat(pCost)||0,netPrice:parseFloat(pNet),taxRate:parseInt(pTax),grossPrice:parseFloat(calcGross(pNet,pTax)),stock:parseFloat(pStock)||0,category:pCat||'',byWeight:pByWeight});
await logAction('ÜRÜN_EKLE',pName+' eklendi');
setPName('');setPBarcode('');setPCost('');setPNet('');setPStock('0');setPCat('');setPByWeight(false);setShowAddForm(false);
};
const openEditProduct=(p:any)=>{ setEditingProduct(p); setEditForm({name:p.name||'',barcode:p.barcode||'',unit:p.unit||'Adet',category:p.category||'',costPrice:String(p.costPrice||''),netPrice:String(p.netPrice||''),taxRate:String(p.taxRate??20),grossPrice:String(p.grossPrice||''),stock:String(p.stock||0),byWeight:!!p.byWeight}); };
const handleSaveEdit=async(e:React.FormEvent)=>{
e.preventDefault();if(!editingProduct)return;
const net=parseFloat(editForm.netPrice)||0,tax=parseInt(editForm.taxRate)||0;
const gross=editForm.grossPrice?parseFloat(editForm.grossPrice):parseFloat((net\*(1+tax/100)).toFixed(2));
const patch={name:editForm.name,barcode:editForm.barcode,unit:editForm.byWeight?'kg':editForm.unit,category:editForm.category,stock:parseFloat(editForm.stock)||0,byWeight:!!editForm.byWeight,costPrice:parseFloat(editForm.costPrice)||0,netPrice:net,taxRate:tax,grossPrice:gross};
const members=getVariantPricingTargets(editingProduct);
if(members.length>1){for(const m of members)await updateDoc(doc(db,'products',m.id),m.id===editingProduct.id?patch:{costPrice:patch.costPrice,netPrice:patch.netPrice,taxRate:patch.taxRate,grossPrice:patch.grossPrice});}
else await updateDoc(doc(db,'products',editingProduct.id),patch);
setEditingProduct(null);
};

// ── CUSTOMERS CRUD ────────────────────────────────────────────────────
const handleAddCustomer=async(e:React.FormEvent)=>{
e.preventDefault();
await addDoc(collection(db,'customers'),{name:cName,phone:cPhone,taxNum:cTaxNum||'-',category:cCat||'',note:cNote||'',balance:0});
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
if(!window.confirm(customer.name+' silinsin mi?'))return;
if(selectedCustomer?.id===customer.id)setSelectedCustomer(null);
await deleteDoc(doc(db,'customers',customer.id));
};
const handleTahsilat=async(customer:any)=>{
const t=window.prompt(customer.name+' Tahsilat Tutarı (₺):');
if(t&&!isNaN(Number(t))){
await updateDoc(doc(db,'customers',customer.id),{balance:(customer.balance||0)-parseFloat(t)});
await addDoc(collection(db,'sales'),{total:parseFloat(t),method:'Tahsilat',customerName:customer.name,items:[{name:'Cari Tahsilat',qty:1,grossPrice:parseFloat(t)}],date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
}
};

// ── STOCK ─────────────────────────────────────────────────────────────
const handleSaveCount=async()=>{
for(const[id,val]of Object.entries(countDraft) as [string,string][]){const n=parseFloat(val);if(!isNaN(n))await updateDoc(doc(db,'products',id),{stock:n});}
setCountSaved(true);setTimeout(()=>setCountSaved(false),2500);
};
const handleAddCategory=async(e:React.FormEvent)=>{e.preventDefault();if(!newCatName.trim())return;await addDoc(collection(db,'categories'),{name:newCatName.trim(),color:newCatColor});setNewCatName('');};
const handleAddCustCategory=async(e:React.FormEvent)=>{e.preventDefault();if(!newCustCatName.trim())return;await addDoc(collection(db,'custCategories'),{name:newCustCatName.trim(),color:newCustCatColor});setNewCustCatName('');};
const toggleCategoryEditorProduct=(id:string)=>setCategoryEditorSelected(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});
const handleSaveCategoryEditor=async()=>{
if(!categoryEditor||categoryEditorSaving)return;
setCategoryEditorSaving(true);
try{
for(const p of products){
const should=categoryEditorSelected.has(p.id);
const isCur=(p.category||'')===categoryEditor.name;
if(should&&!isCur)await updateDoc(doc(db,'products',p.id),{category:categoryEditor.name});
else if(!should&&isCur)await updateDoc(doc(db,'products',p.id),{category:''});
}
setCategoryEditor(null);
}finally{setCategoryEditorSaving(false);}
};

// ── PURCHASES ─────────────────────────────────────────────────────────
const handleSavePurchase=async(e:React.FormEvent)=>{
e.preventDefault();
const lines=purchaseLines.filter(l=>l.productId&&l.qty);
if(lines.length===0)return alert('En az bir ürün satırı doldurun.');
const items=lines.map(l=>{const p=products.find(p=>p.id===l.productId);return{productId:l.productId,productName:p?.name||'',qty:parseFloat(l.qty)||1,cost:parseFloat(l.cost)||0};});
const totalCostVal=items.reduce((a,b)=>a+b.qty\*b.cost,0);
await addDoc(collection(db,'purchases'),{supplier:purchaseSupplier,date:purchaseDate||new Date().toISOString().slice(0,10),note:purchaseNote,items,totalCost:totalCostVal,createdAt:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
for(const item of items){const p=products.find(p=>p.id===item.productId);if(p){const upd:any={stock:(p.stock||0)+item.qty};if(item.cost>0)upd.costPrice=item.cost;await updateDoc(doc(db,'products',item.productId),upd);}}
await logAction('ALIŞ',(purchaseSupplier||'Tedarikçi')+' - ₺'+totalCostVal.toFixed(2),totalCostVal);
setPurchaseSupplier('');setPurchaseDate('');setPurchaseNote('');setPurchaseLines([{productId:'',qty:'',cost:''}]);setShowPurchaseForm(false);
};

const handleAddExpense=async(e:React.FormEvent)=>{
e.preventDefault();
await addDoc(collection(db,'expenses'),{name:expName,amount:parseFloat(expAmount)||0,date:new Date().toISOString()});
setExpName('');setExpAmount('');
};

// ── STAFF ─────────────────────────────────────────────────────────────
const handleAddStaff=async(e:React.FormEvent)=>{
e.preventDefault();if(!newStaffName||!newStaffPin)return;
await addDoc(collection(db,'staff'),{name:newStaffName,role:newStaffRole,pin:newStaffPin,permissions:newStaffRole==='admin'?[]:newStaffPerms,createdAt:new Date().toLocaleString('tr-TR')});
setNewStaffName('');setNewStaffPin('');setNewStaffPerms(['pos','orders','returns','customers','customers.tahsilat']);
};
const handleUpdateStaff=async(e:React.FormEvent)=>{
e.preventDefault();if(!editingStaff)return;
const upd:any={permissions:editingStaff.role==='admin'?[]:editStaffPerms};
if(editStaffPin)upd.pin=editStaffPin;
await updateDoc(doc(db,'staff',editingStaff.id),upd);
if(editingStaff.id===currentStaff?.id)setCurrentStaff((prev:any)=>({...prev,...upd}));
setEditingStaff(null);setEditStaffPin('');
};
const togglePerm=(perms:string[],key:string,setter:(p:string[])=>void)=>setter(perms.includes(key)?perms.filter(p=>p!==key):[...perms,key]);

// ── CSV ───────────────────────────────────────────────────────────────
const dlCSV=(d:any[][],h:string[],f:string)=>{const c='data:text/csv;charset=utf-8,\uFEFF'+[h.join(','),...d.map(r=>r.join(','))].join('\n');const a=document.createElement('a');a.href=encodeURI(c);a.download=f;a.click();};
const exportProducts=()=>dlCSV(products.map(p=>[(p.name||'').replace(/,/g,''),p.barcode||'',p.unit||'',p.category||'',p.costPrice||0,p.grossPrice||0,p.stock||0]),['Urun','Barkod','Birim','Kategori','Alis','Satis','Stok'],'urunler.csv');
const exportCustomers=()=>dlCSV(customers.map(c=>[(c.name||'').replace(/,/g,''),c.taxNum||'',c.phone||'',c.category||'',c.balance||0]),['Musteri','Vergi','Tel','Kategori','Bakiye'],'musteriler.csv');
const importProducts=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=async(ev)=>{const rows=(ev.target?.result as string).split('\n').slice(1);for(const row of rows){const c=row.split(',');if(c.length>=4&&c[0].trim())await addDoc(collection(db,'products'),{name:c[0],barcode:c[1],unit:c[2],category:c[3]||'',costPrice:parseFloat(c[4])||0,grossPrice:parseFloat(c[5])||0,stock:parseFloat(c[6])||0});}alert('İçeri aktarıldı!');};r.readAsText(file);};
const importCustomers=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=async(ev)=>{const rows=(ev.target?.result as string).split('\n').slice(1);for(const row of rows){const c=row.split(',');if(c[0]?.trim())await addDoc(collection(db,'customers'),{name:c[0].trim(),phone:c[2]||'',taxNum:c[1]||'-',category:c[3]||'',note:'',balance:parseFloat(c[4])||0});}alert('İçeri aktarıldı!');};r.readAsText(file);};

// ── BULK PRICE ────────────────────────────────────────────────────────
const handleBulkPrice=async()=>{
if(bulkSelected.size===0||!bulkPct)return alert('Ürün seçin ve oran girin.');
const pct=parseFloat(bulkPct)/100;
const processedGroups=new Set<string>();
for(const id of bulkSelected){
const p=products.find(p=>p.id===id);if(!p)continue;
const groupKey=getVariantGroupKey(p)||('self:'+p.id);
if(processedGroups.has(groupKey))continue;
processedGroups.add(groupKey);
const cur=p[bulkField]||0;
const newVal=parseFloat((cur\*(bulkType==='zam'?1+pct:1-pct)).toFixed(2));
for(const target of getVariantPricingTargets(p)){
const upd:any={[bulkField]:newVal};
if(bulkField==='grossPrice')upd.netPrice=parseFloat((newVal/(1+((target.taxRate||20)/100))).toFixed(2));
await addDoc(collection(db,'priceHistory'),{productId:target.id,productName:target.name,field:bulkField,oldVal:target[bulkField]||0,newVal,pct:parseFloat(bulkPct),type:bulkType,date:new Date().toLocaleString('tr-TR'),staffId:currentStaff?.id,staffName:currentStaff?.name});
await updateDoc(doc(db,'products',target.id),upd);
}
}
setBulkDone(true);setTimeout(()=>setBulkDone(false),2500);setBulkSelected(new Set());setBulkPct('');
};

const loadPriceHistory=async(productId:string)=>{
setPriceHistoryLoading(true);
const unsub=onSnapshot(collection(db,'priceHistory'),snap=>{
const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter((r:any)=>r.productId===productId).sort((a:any,b:any)=>b.ts-a.ts||(parseDT(b.date).getTime()-parseDT(a.date).getTime()));
setPriceHistory(rows);setPriceHistoryLoading(false);
});
return unsub;
};

const handleSaveVariants=async()=>{
if(!variantProduct)return;
const selectedIds=Array.from(new Set<string>([variantProduct.id,...Array.from(variantSelectedIds)]));
const currentMembers=getVariantGroupMembers(variantProduct);
if(selectedIds.length<2){
for(const m of(currentMembers.length>0?currentMembers:[variantProduct]))await updateDoc(doc(db,'products',m.id),{variantGroup:'',variantGroupId:''});
setVariantProduct(null);return;
}
const groupName=variantGroupName.trim();
if(!groupName)return alert('Varyant grubu için bir ad girin.');
const groupId=String(variantProduct.variantGroupId||('vg-'+Date.now()));
const basePricePatch=getVariantPricePatch(variantProduct);
for(const m of currentMembers){if(!selectedIds.includes(m.id))await updateDoc(doc(db,'products',m.id),{variantGroup:'',variantGroupId:''});}
for(const pid of selectedIds)await updateDoc(doc(db,'products',pid),{variantGroup:groupName,variantGroupId:groupId,...basePricePatch});
setVariantProduct(null);setVariantGroupName('');setVariantSelectedIds(new Set());
};

// ── FİŞ AYARLARI BULUT KAYDET ─────────────────────────────────────────
const saveRSettings=async()=>{
setReceiptSettings({...draftSettings});
saveSettingsLS(draftSettings);
try{
const toCloud={...draftSettings};
if(JSON.stringify(toCloud).length>800000){toCloud.logoBase64=null;alert('⚠️ Logo çok büyük, logo buluta kaydedilmedi. Diğer ayarlar kaydedildi.');}
await setDoc(doc(db,'receiptSettings','main'),toCloud);
}catch(err){console.error('Bulut kayıt hatası:',err);}
setSettingsSaved(true);setTimeout(()=>setSettingsSaved(false),2500);
};
const upDraft=(k:keyof ReceiptSettings,v:any)=>setDraftSettings(prev=>({...prev,[k]:v}));

// ── COMPUTED ──────────────────────────────────────────────────────────
const totalIncome=sales.reduce((a,b)=>a+(b.total||0),0);
const totalExpenseSum=expenses.reduce((a,b)=>a+(b.amount||0),0);
const totalCogs=sales.filter(s=>s.method!=='Tahsilat').reduce((a,b)=>a+(b.totalCost||0),0);
const netProfit=totalIncome-totalCogs-totalExpenseSum;
const outOfStock=products.filter(p=>(p.stock||0)===0).length;
const lowStock=products.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit).length;
const totalStockValue=products.reduce((a,b)=>a+((b.stock||0)\*(b.costPrice||0)),0);

const filteredProducts=useMemo(()=>{
let list=[...products];
const q=productSearch.trim().toLowerCase();
if(q)list=list.filter(p=>[p.name,p.barcode,p.category,p.variantGroup].join(' ').toLowerCase().includes(q));
if(productCategoryFilter!=='all')list=list.filter(p=>(p.category||'')===productCategoryFilter);
if(productStockFilter==='in')list=list.filter(p=>(p.stock||0)>0);
if(productStockFilter==='out')list=list.filter(p=>(p.stock||0)===0);
if(productStockFilter==='low')list=list.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit);
const byName=(a:any,b:any)=>String(a.name||'').localeCompare(String(b.name||''),'tr');
switch(productSort){
case 'name-desc':return list.sort((a,b)=>byName(b,a));
case 'price-asc':return list.sort((a,b)=>(a.grossPrice||0)-(b.grossPrice||0));
case 'price-desc':return list.sort((a,b)=>(b.grossPrice||0)-(a.grossPrice||0));
case 'stock-asc':return list.sort((a,b)=>(a.stock||0)-(b.stock||0));
case 'stock-desc':return list.sort((a,b)=>(b.stock||0)-(a.stock||0));
default:return list.sort((a,b)=>byName(a,b));
}
},[products,productSearch,productCategoryFilter,productStockFilter,productSort,lowStockLimit]);

const filteredStockProducts=useMemo(()=>{
let list=[...products];
if(stockSearch)list=list.filter(p=>(p.name||'').toLowerCase().includes(stockSearch.toLowerCase())||(p.barcode||'').includes(stockSearch));
if(stockCatFilter!=='all')list=list.filter(p=>p.category===stockCatFilter);
if(stockFilter==='out')list=list.filter(p=>(p.stock||0)===0);
if(stockFilter==='low')list=list.filter(p=>(p.stock||0)>0&&(p.stock||0)<=lowStockLimit);
return list.sort((a,b)=>(a.stock||0)-(b.stock||0));
},[products,stockSearch,stockCatFilter,stockFilter,lowStockLimit]);

const stockMovements=useMemo(()=>{
const mvs:any[]=[];
sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{mvs.push({date:s.date,type:'out',desc:'Satış → '+(s.customerName||''),items:(s.items||[]).map((i:any)=>({name:i.name,qty:i.qty})),total:s.total||0,ts:parseDT(s.date).getTime()});});
purchases.forEach((p:any)=>{mvs.push({date:p.createdAt||p.date,type:'in',desc:'Alış ← '+(p.supplier||'Tedarikçi'),items:(p.items||[]).map((i:any)=>({name:i.productName||i.name,qty:i.qty})),total:p.totalCost||0,ts:new Date(p.date).getTime()});});
return mvs.sort((a,b)=>b.ts-a.ts);
},[sales,purchases]);

const filteredMovements=useMemo(()=>{
const filtered=stockMovements.filter((mv:any)=>{
if(mvType!=='all'&&mv.type!==mvType)return false;
if(mvStart&&mv.ts<new Date(mvStart).getTime())return false;
if(mvEnd){const t=new Date(mvEnd);t.setHours(23,59,59);if(mv.ts>t.getTime())return false;}
return true;
});
return{filtered,tIn:filtered.filter(m=>m.type==='in').reduce((a:number,b:any)=>a+b.total,0),tOut:filtered.filter(m=>m.type==='out').reduce((a:number,b:any)=>a+b.total,0)};
},[stockMovements,mvType,mvStart,mvEnd]);

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
sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const r=nKdv(item.taxRate);if(!map[r])map[r]={base:0,kdv:0,gross:0};const g=(item.grossPrice||0)\*(item.qty||1);const b=g/(1+r/100);map[r].gross+=g;map[r].base+=b;map[r].kdv+=g-b;});});
return Object.entries(map).sort((a,b)=>Number(a[0])-Number(b[0]));
},[sales]);

const dayKdvBreakdown=useMemo(()=>{
const map:Record<number,{base:number;kdv:number;gross:number}>={};
reportSales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const r=nKdv(item.taxRate);if(!map[r])map[r]={base:0,kdv:0,gross:0};const g=(item.grossPrice||0)\*(item.qty||1);const b=g/(1+r/100);map[r].gross+=g;map[r].base+=b;map[r].kdv+=g-b;});});
return Object.entries(map).sort((a,b)=>Number(a[0])-Number(b[0]));
},[reportSales]);

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
ms.forEach((s:any)=>(s.items||[]).forEach((item:any)=>{const k=item.name||'?';if(!urunMap[k])urunMap[k]={name:k,adet:0,ciro:0};urunMap[k].adet+=(item.qty||1);urunMap[k].ciro+=(item.grossPrice||0)*(item.qty||1);}));
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

const monthLabel=useMemo(()=>new Date(monthlyStats.yr,monthlyStats.mo-1,1).toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),[monthlyStats.yr,monthlyStats.mo]);

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
const dr=sorted.length>0?parseDT(sorted[0].date).toLocaleDateString('tr-TR')+' - '+parseDT(sorted[sorted.length-1].date).toLocaleDateString('tr-TR'):'';
return{id:'MRG-'+Date.now(),customerName:selectedCustomer?.name||'',customerTax:selectedCustomer?.taxNum||'-',method:'Veresiye',date:new Date().toLocaleString('tr-TR'),dateRange:dr,items:allItems,subTotal:sorted.reduce((a,b)=>a+(b.subTotal||b.total||0),0),discountAmount:sorted.reduce((a,b)=>a+(b.discountAmount||0),0),discountPct:0,total:selTotal,isMerged:true,mergedCount:sorted.length};
};
const handleMergedPrint=()=>{setMergedPrint(buildMerged());setTimeout(()=>window.print(),150);};
const handleMergedXlsx=async()=>{const cn=(selectedCustomer?.name||'musteri').replace(/[^a-zA-Z0-9_]/g,'_');await handleParasutExport(selSales,'parasut_'+cn+'\_'+new Date().toISOString().slice(0,10)+'.xlsx');};
const customerProductHistory=useMemo(()=>{
if(!selectedCustomer)return[];
const map:Record<string,{name:string;totalQty:number;totalSpent:number;dates:string[]}>={};
customerSales.forEach(s=>{(s.items||[]).forEach((item:any)=>{const key=item.name||'?';if(!map[key])map[key]={name:key,totalQty:0,totalSpent:0,dates:[]};map[key].totalQty+=(item.qty||1);map[key].totalSpent+=(item.grossPrice||0)\*(item.qty||1);map[key].dates.push(s.date?.split(' ')[0]||s.date);});});
return Object.values(map).sort((a,b)=>b.totalQty-a.totalQty);
},[customerSales,selectedCustomer]);

const dashSalesData=()=>{
const days=parseInt(dashPeriod);const now=Date.now();
const map:Record<string,{date:string;ciro:number;adet:number}>={};
for(let i=days-1;i>=0;i--){const d=new Date(now-i*86400000);const key=d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'});map[key]={date:key,ciro:0,adet:0};}
sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{const d=parseDT(s.date);if(now-d.getTime()>days*86400000)return;const key=d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'});if(map[key]){map[key].ciro+=(s.total||0);map[key].adet++;}});
return Object.values(map);
};
const topProducts=()=>{
const map:Record<string,{name:string;adet:number;ciro:number}>={};
sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{(s.items||[]).forEach((item:any)=>{const k=item.name||'?';if(!map[k])map[k]={name:k,adet:0,ciro:0};map[k].adet+=(item.qty||1);map[k].ciro+=(item.grossPrice||0)*(item.qty||1);});});
return Object.values(map).sort((a,b)=>b.ciro-a.ciro).slice(0,8);
};
const payMethodData=()=>{
const methods:Record<string,number>={};
sales.filter(s=>s.method!=='Tahsilat').forEach(s=>{const m=s.method||'Diğer';methods[m]=(methods[m]||0)+(s.total||0);});
return Object.entries(methods).map(([name,value])=>({name,value:parseFloat(value.toFixed(2))}));
};
const dashStats=useMemo(()=>{
const days=parseInt(dashPeriod);const now=Date.now();
const filtSales=sales.filter(s=>s.method!=='Tahsilat'&&now-parseDT(s.date).getTime()<=days*86400000);
const ciro=filtSales.reduce((a,b)=>a+(b.total||0),0);const adet=filtSales.length;
return{ciro,adet,avgSale:adet>0?parseFloat((ciro/adet).toFixed(2)):0,veresiye:filtSales.filter(s=>s.method==='Veresiye').reduce((a,b)=>a+(b.total||0),0)};
},[sales,dashPeriod]);

const splitOk=useMemo(()=>Math.abs((parseFloat(splitNakit)||0)+(parseFloat(splitKart)||0)-finalTotal)<0.01,[splitNakit,splitKart,finalTotal]);
const activePrintData=mergedPrint||printSale||lastSale;
const demoSale={id:'DEMO123456',customerName:'Örnek Müşteri A.Ş.',customerTax:'1234567890',method:'Nakit',date:'16.03.2026 14:30:00',staffName:'Kasiyer',items:[{name:'Dove Sabun 100gr',qty:5,grossPrice:60,taxRate:20},{name:'Ariel Deterjan 3kg',qty:2,grossPrice:185,taxRate:20},{name:'Peynir',qty:0.75,grossPrice:120,taxRate:10,byWeight:true}],subTotal:780,discountAmount:30,discountPct:4,total:750};

// ── UI HELPERS ────────────────────────────────────────────────────────
const SliderField=({label,value,onChange,min,max,step=1,unit='px'}:{label:string;value:number;onChange:(v:number)=>void;min:number;max:number;step?:number;unit?:string})=>(

<div className="space-y-1">
<div className="flex justify-between"><label className="text-xs font-bold text-zinc-500 uppercase">{label}</label><span className="text-xs font-black text-white">{value}{unit}</span></div>
<div className="flex items-center gap-2">
<button onClick={()=>onChange(Math.max(min,value-step))} className="w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white text-xs font-black flex items-center justify-center">−</button>
<input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} className="flex-1 accent-emerald-500 h-1.5"/>
<button onClick={()=>onChange(Math.min(max,value+step))} className="w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white text-xs font-black flex items-center justify-center">+</button>
</div>
</div>
);

const Toggle=({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void})=>(

<div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
<span className="text-zinc-300 text-sm font-medium">{label}</span>
<button onClick={()=>onChange(!value)} className={'w-11 h-6 rounded-full relative transition-all '+(value?'bg-emerald-500':'bg-zinc-700')}><span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all '+(value?'left-5':'left-0.5')}/></button>
</div>
);

const DivSelect=({label,value,onChange}:{label:string;value:string;onChange:(v:any)=>void})=>(

<div className="space-y-1">
<label className="text-xs font-bold text-zinc-500 uppercase">{label}</label>
<div className="grid grid-cols-4 gap-1">
{(['solid','dashed','double','none']).map(s=>(
<button key={s} onClick={()=>onChange(s)} className={'py-1.5 rounded-lg text-xs font-bold border transition-all '+(value===s?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>
{s==='solid'?'Düz':s==='dashed'?'Kesik':s==='double'?'Çift':'Yok'}
</button>
))}
</div>
</div>
);

if(!currentStaff) return <LoginScreen onLogin={staff=>{setCurrentStaff(staff);logAction('GİRİŞ','Sisteme giriş yapıldı');}}/>;
// App.tsx — BÖLÜM 3/3
return (
<>

<div className={'flex h-screen text-zinc-100 print:hidden relative '+(flash?'bg-emerald-900':'bg-zinc-950')}>

      {/* ═══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside style={{transform:mobileMenuOpen?'none':'translateX(-100%)'}} className="fixed lg:!transform-none lg:relative z-[400] w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <button onClick={()=>setMobileMenuOpen(false)} className="lg:hidden text-zinc-500 hover:text-white mr-2 p-1"><X size={18}/></button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-zinc-950 text-base">M</div>
            <div><h1 className="font-bold text-sm text-white">Merkez Şube</h1><p className="text-[10px] text-zinc-500">Perakende Şubesi</p></div>
          </div>
          <ChevronDown size={14} className="text-zinc-500"/>
        </div>
        <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center"><UserCheck size={13} className="text-emerald-400"/></div>
            <div><p className="text-white text-xs font-black">{currentStaff.name}</p><p className="text-zinc-600 text-[10px]">{roleLabel(currentStaff)}</p></div>
          </div>
          <button onClick={()=>{logAction('ÇIKIŞ','Sistemden çıkış');setCurrentStaff(null);}} className="text-zinc-600 hover:text-red-400" title="Çıkış"><LogOut size={14}/></button>
        </div>
        <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
          {[
            {p:'pos',icon:<ShoppingCart size={15}/>,label:'Hızlı Satış',perm:'pos'},
            {p:'orders',icon:<ShoppingBag size={15}/>,label:'Siparişli Satışlar',perm:'orders',badge:orders.filter(o=>o.status==='bekliyor'||o.status==='hazirlaniyor').length||null},
            {p:'quotes',icon:<FileEdit size={15}/>,label:'Teklifler',perm:'quotes'},
            {p:'returns',icon:<RefreshCw size={15}/>,label:'İade / Değişim',perm:'returns'},
            {p:'purchases',icon:<ArrowDownToLine size={15}/>,label:'Alış Faturaları',perm:'purchases'},
          ].filter(t=>canDo(t.perm)).map(t=>(
            <button key={t.p} onClick={()=>{setActivePage(t.p);setMobileMenuOpen(false);}} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm font-medium '+(activePage===t.p?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
              {t.icon}<span className="flex-1 text-left">{t.label}</span>
              {(t as any).badge&&<span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{(t as any).badge}</span>}
            </button>
          ))}
          <div className="mt-1">
            <button onClick={()=>setStockOpen(!stockOpen)} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage.startsWith('stock')?'text-white':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}>
              <Boxes size={15} className={activePage.startsWith('stock')?'text-emerald-400':''}/><span className="flex-1 text-left">Stok</span>
              {outOfStock>0&&<span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full mr-1">{outOfStock}</span>}
              <ChevronDown size={12} className={'text-zinc-500 transition-transform '+(stockOpen?'':'rotate-[-90deg]')}/>
            </button>
            {stockOpen&&(
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-3">
                {[{p:'stock.products',icon:<Package size={13}/>,label:'Ürünler'},{p:'stock.category',icon:<FolderOpen size={13}/>,label:'Kategoriler'},{p:'stock.movements',icon:<ArrowUpDown size={13}/>,label:'Stok Hareketleri'},{p:'stock.count',icon:<ClipboardCheck size={13}/>,label:'Stok Sayım'},{p:'stock.tracking',icon:<Boxes size={13}/>,label:'Stok Takibi'},{p:'stock.bulk',icon:<Zap size={13}/>,label:'Toplu Fiyat'}].map(item=>(
                  <button key={item.p} onClick={()=>{setActivePage(item.p);setMobileMenuOpen(false);}} className={'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm '+(activePage===item.p?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-500 hover:bg-zinc-800 hover:text-white')}>
                    {item.icon}<span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {canDo('customers')&&<button onClick={()=>{setActivePage('customers');setMobileMenuOpen(false);}} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 '+(activePage==='customers'||activePage==='customers.categories'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><Users size={15}/><span className="flex-1 text-left">Müşteri & Cari</span></button>}
          <div className="border-t border-zinc-800/60 my-2"/>
          <button onClick={()=>{setActivePage('dashboard');setMobileMenuOpen(false);}} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='dashboard'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><BarChart3 size={15}/><span>Dashboard</span></button>
          {(canDo('reports.genel')||canDo('reports.gunSonu')||currentStaff?.role==='admin')&&<button onClick={()=>{setActivePage('reports');setMobileMenuOpen(false);}} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='reports'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><BarChart3 size={15}/><span>Rapor & Analiz</span></button>}
          {currentStaff.role==='admin'&&<button onClick={()=>{setActivePage('personel');setMobileMenuOpen(false);}} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='personel'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><UserCog size={15}/><span>Personel</span></button>}
          {(canDo('receipt')||currentStaff?.role==='admin')&&<button onClick={()=>{setActivePage('settings');setMobileMenuOpen(false);}} className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium '+(activePage==='settings'?'bg-emerald-500 text-zinc-950 font-bold':'text-zinc-400 hover:bg-zinc-800 hover:text-white')}><Settings size={15}/><span>Ayarlar</span></button>}
        </nav>
      </aside>

      {mobileMenuOpen&&<div className="fixed inset-0 bg-black/60 z-[390] lg:hidden" onClick={()=>setMobileMenuOpen(false)}/>}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <button onClick={()=>setMobileMenuOpen(true)} className="text-zinc-400 p-1.5 rounded-xl bg-zinc-800"><div className="space-y-1.5"><div className="w-5 h-0.5 bg-current"/><div className="w-5 h-0.5 bg-current"/><div className="w-5 h-0.5 bg-current"/></div></button>
          <div className="flex items-center gap-2 flex-1"><div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-zinc-950 text-sm">M</div><span className="font-black text-white text-sm">Merkez Şube</span></div>
          <span className="text-zinc-500 text-xs">{currentStaff.name}</span>
        </div>

        <div className="flex-1 flex overflow-hidden">

        {/* ═══ DASHBOARD ════════════════════════════════════════════════ */}
        {activePage==='dashboard'&&(
          <div className="p-6 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-3"><BarChart3 className="text-emerald-500"/> Dashboard</h2>
              <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                {(['7','30','90'] as const).map(d=><button key={d} onClick={()=>setDashPeriod(d)} className={'px-4 py-2 rounded-xl text-sm font-bold transition-all '+(dashPeriod===d?'bg-emerald-500 text-zinc-950':'text-zinc-500 hover:text-white')}>Son {d} Gün</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam Ciro</p><p className="text-2xl font-black text-emerald-400">₺{dashStats.ciro.toFixed(2)}</p></div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Satış Adedi</p><p className="text-2xl font-black text-white">{dashStats.adet}</p></div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Ort. Sepet</p><p className="text-2xl font-black text-blue-400">₺{dashStats.avgSale.toFixed(2)}</p></div>
              <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl"><p className="text-orange-400 text-xs font-bold uppercase mb-1">Açık Veresiye</p><p className="text-2xl font-black text-orange-400">₺{dashStats.veresiye.toFixed(2)}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h3 className="font-black mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-emerald-400"/> Günlük Satış Trendi</h3>
                <div className="h-48 flex items-end gap-1">
                  {dashSalesData().map((d:any,i:number)=>{const maxVal=Math.max(...dashSalesData().map((x:any)=>x.ciro),1);const h=Math.round((d.ciro/maxVal)*100);return(<div key={i} className="flex-1 flex flex-col items-center gap-1 group"><div className="text-emerald-400 text-[9px] opacity-0 group-hover:opacity-100 font-bold">₺{Math.round(d.ciro)}</div><div className="w-full bg-emerald-500 rounded-t-sm" style={{height:h+'%',minHeight:d.ciro>0?'4px':'0'}}></div>{i%(Math.ceil(dashSalesData().length*0.2)|0)===0&&<div className="text-zinc-600 text-[9px] font-mono rotate-45">{d.date}</div>}</div>);})}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h3 className="font-black mb-4 flex items-center gap-2"><Receipt size={15} className="text-blue-400"/> Ödeme Yöntemleri</h3>
                <div className="space-y-3">
                  {payMethodData().map((item:any,i:number)=>{const total=payMethodData().reduce((a:number,b:any)=>a+b.value,0)||1;const pct=Math.round((item.value/total)*100);return(<div key={i} className="space-y-1"><div className="flex justify-between text-xs"><span className="text-zinc-400 font-bold">{item.name}</span><span className="font-black" style={{color:pieColor(i)}}>₺{item.value.toFixed(2)} <span className="text-zinc-500">%{pct}</span></span></div><div className="h-2 bg-zinc-800 rounded-full"><div className="h-2 rounded-full" style={{width:pct+'%',background:pieColor(i)}}></div></div></div>);})}
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <h3 className="font-black mb-4 flex items-center gap-2"><Package size={15} className="text-purple-400"/> En Çok Satan Ürünler</h3>
              <div className="space-y-2">
                {topProducts().map((u:any,i:number)=>{const maxCiro=Math.max(...topProducts().map((x:any)=>x.ciro),1);const w=Math.round((u.ciro/maxCiro)*100);return(<div key={i} className="flex items-center gap-3"><div className="w-28 text-zinc-400 text-xs font-bold truncate">{u.name}</div><div className="flex-1 h-5 bg-zinc-800 rounded-lg overflow-hidden"><div className="h-5 bg-emerald-500 rounded-lg flex items-center px-2" style={{width:w+'%'}}><span className="text-zinc-950 text-[10px] font-black whitespace-nowrap">₺{u.ciro.toFixed(0)}</span></div></div><div className="text-blue-400 text-xs font-black w-8 text-right">{u.adet}</div></div>);})}
              </div>
            </div>
          </div>
        )}

        {/* ═══ POS ══════════════════════════════════════════════════════ */}
        {activePage==='pos'&&(
          <div className="flex flex-col lg:flex-row w-full">
            {/* Ürünler */}
            <div className="flex-1 p-4 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-zinc-500" size={15}/><input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Ürün adı veya barkod..." className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 outline-none focus:border-emerald-500 text-sm"/></div>
                <button onClick={()=>setOrderMode(!orderMode)} className={'px-3 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 border transition-all '+(orderMode?'bg-orange-500 text-zinc-950 border-orange-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}><ShoppingBag size={14}/>{orderMode?'Sipariş':'Sipariş'}</button>
              </div>
              {orderMode&&(
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3 mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-orange-400 font-bold text-xs">🛍 Sipariş Modu</span>
                  <select value={orderCustomer} onChange={e=>setOrderCustomer(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-2.5 py-1.5 rounded-xl text-sm outline-none"><option value="">— Müşteri —</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <input value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="Not..." className="bg-zinc-900 border border-zinc-700 text-white px-2.5 py-1.5 rounded-xl text-sm outline-none flex-1"/>
                  <input type="date" value={orderDeliveryDate} onChange={e=>setOrderDeliveryDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-2.5 py-1.5 rounded-xl text-sm outline-none"/>
                </div>
              )}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
                {products.filter(p=>(p.name||'').toLowerCase().includes(searchQuery.toLowerCase())||(p.barcode||'').includes(searchQuery)).map(p=>(
                  <button key={p.id} onClick={()=>addToCart(p)} className={'border p-3 rounded-2xl text-left hover:border-emerald-500 transition-all flex flex-col justify-between h-28 group '+((p.stock||0)===0?'bg-zinc-900/50 border-red-900/30 opacity-60':'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50')}>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-zinc-200 group-hover:text-emerald-400 line-clamp-2 text-sm flex-1">{p.name}</span>
                      {p.byWeight&&<Scale size={11} className="text-blue-400 shrink-0 mt-0.5"/>}
                    </div>
                    <div>
                      {p.category&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1 inline-block" style={catStyleOf(p.category||'')}>{p.category}</span>}
                      <div className="flex justify-between items-center">
                        <span className={'text-[9px] font-bold px-1.5 py-0.5 rounded '+((p.stock||0)===0?'bg-red-900/40 text-red-400':(p.stock||0)<=lowStockLimit?'bg-orange-900/30 text-orange-400':'bg-zinc-800 text-zinc-500')}>
                          {p.byWeight?`~${(p.stock||0).toFixed(1)}kg`:`${p.stock||0}`}
                        </span>
                        <span className="text-lg font-black text-white">₺{p.grossPrice||0}{p.byWeight&&<span className="text-[9px] text-zinc-400">/kg</span>}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SEPET */}
            <div className="w-full lg:w-[390px] max-h-[50vh] lg:max-h-full bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col">
              <div className="p-4 border-b border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-sm"><ShoppingCart className="text-emerald-500" size={16}/>{orderMode?'📦 SİPARİŞ':'SATIŞ FİŞİ'}</div>
                {/* MÜŞTERİ SEÇİMİ — HER ZAMAN GÖRÜNÜR */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Users size={10}/> Müşteri</label>
                  <select value={cartCustomer} onChange={e=>setCartCustomer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm font-bold focus:border-emerald-500">
                    <option value="">— Perakende Müşteri —</option>
                    {customers.map(c=><option key={c.id} value={c.id}>{c.name}{(c.balance||0)>0?` ⚠️₺${(c.balance||0).toFixed(0)}`:''}</option>)}
                  </select>
                  {cartCustomer&&(()=>{const c=customers.find(x=>x.id===cartCustomer);return c?<div className={'text-xs font-bold px-2 py-1 rounded-lg inline-block mt-1 '+((c.balance||0)>0?'bg-red-500/20 text-red-400':'bg-emerald-500/20 text-emerald-400')}>Bakiye: {(c.balance||0)>0?'+':''}{(c.balance||0).toFixed(2)}₺</div>:null;})()}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length===0&&<div className="text-center text-zinc-600 py-8 text-sm">Sepet boş</div>}
                {cart.map((item:any)=>(
                  <div key={item.id} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1"><div className="text-sm font-bold text-zinc-300 truncate">{item.name}</div>{item.byWeight&&<Scale size={9} className="text-blue-400 shrink-0"/>}</div>
                      <div className="text-emerald-500 font-black text-sm">₺{((item.grossPrice||0)*item.qty).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      <button onClick={()=>setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:item.byWeight?Math.max(0.1,parseFloat((i.qty-0.1).toFixed(2))):Math.max(1,i.qty-1)}:i))} className="text-zinc-500 hover:text-emerald-500"><MinusCircle size={17}/></button>
                      <span className="w-12 text-center font-black text-xs">{item.byWeight?`${item.qty.toFixed(2)}kg`:item.qty}</span>
                      <button onClick={()=>setCart(cart.map((i:any)=>i.id===item.id?{...i,qty:item.byWeight?parseFloat((i.qty+0.1).toFixed(2)):i.qty+1}:i))} className="text-zinc-500 hover:text-emerald-500"><PlusCircle size={17}/></button>
                    </div>
                    <button onClick={()=>setCart(cart.filter((i:any)=>i.id!==item.id))} className="text-zinc-700 hover:text-red-500"><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-zinc-950 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-sm"><Percent size={12}/> İskonto %</div>
                  <input type="number" min="0" max="100" value={discountPct} onChange={e=>setDiscountPct(e.target.value)} placeholder="0" className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-center text-white outline-none text-sm font-bold"/>
                </div>
                <div className="flex justify-between text-zinc-500 text-xs font-bold mb-1"><span>Ara:</span><span>₺{rawTotal.toFixed(2)}</span></div>
                {discountAmount>0&&<div className="flex justify-between text-emerald-500 text-xs font-bold mb-1"><span>İndirim:</span><span>-₺{discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xl font-black mb-3 text-white mt-1"><span>TOPLAM:</span><span>₺{finalTotal.toFixed(2)}</span></div>
                {orderMode?(
                  <button onClick={handleCreateOrder} className="w-full bg-orange-500 py-3.5 rounded-2xl font-black text-zinc-950 hover:bg-orange-400 flex items-center justify-center gap-2 text-sm"><ShoppingBag size={16}/> SİPARİŞ OLUŞTUR</button>
                ):(
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button onClick={()=>finishSale('Nakit')} className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-2xl font-bold border border-zinc-700 text-sm">NAKİT</button>
                      <button onClick={()=>finishSale('Kart')} className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-2xl font-bold border border-zinc-700 text-sm">KART</button>
                    </div>
                    <button onClick={()=>setIsVeresiyeOpen(true)} className="w-full bg-emerald-500 py-3.5 rounded-2xl font-black text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 text-sm mb-2">VERESİYE YAZ</button>
                    <div className="flex gap-2">
                      <button onClick={()=>{setSplitNakit('');setSplitKart('');setSplitModal(true);}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2.5 rounded-xl font-bold border border-zinc-700 text-xs flex items-center justify-center gap-1 text-zinc-300"><SplitSquareHorizontal size={13}/> Böl</button>
                      <button onClick={()=>{setQuoteDraft(cart.length>0?[...cart]:[]);setActivePage('quotes');}} className="flex-1 bg-purple-600/20 py-2.5 rounded-xl font-bold border border-purple-600/40 text-xs flex items-center justify-center gap-1 text-purple-400"><FileEdit size={13}/> Teklif</button>
                      {lastSale&&<button onClick={()=>{setPrintSale(lastSale);setTimeout(()=>window.print(),100);}} className="flex-1 bg-zinc-800 py-2.5 rounded-xl font-bold border border-zinc-700 text-xs flex items-center justify-center gap-1 text-zinc-300"><Printer size={13}/> Fiş</button>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SİPARİŞLER ═══════════════════════════════════════════════ */}
        {activePage==='orders'&&(
          <div className="p-6 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black flex items-center gap-3"><ShoppingBag className="text-orange-400"/> Siparişli Satışlar</h2>
              <button onClick={()=>{setOrderMode(true);setActivePage('pos');}} className="bg-orange-500 text-zinc-950 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-orange-400"><Plus size={15}/> Yeni Sipariş</button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['all','bekliyor','hazirlaniyor','gönderildi','iptal'] as const).map(s=>{const cnt=s==='all'?orders.length:orders.filter(o=>o.status===s).length;const sc=statusConfig[s]||{label:s,color:'text-zinc-400',bg:'bg-zinc-800'};return(<button key={s} onClick={()=>setOrderFilter(s)} className={'px-3 py-2 rounded-xl text-sm font-bold border transition-all '+(orderFilter===s?'bg-zinc-700 text-white border-zinc-600':'bg-zinc-900 border-zinc-800 text-zinc-500')}>{s==='all'?'Tümü':sc.label} <span className={'text-[10px] font-black px-1.5 py-0.5 rounded-full '+(sc.bg)+' '+(sc.color)}>{cnt}</span></button>);})}
            </div>
            <div className="space-y-3">
              {orders.filter(o=>orderFilter==='all'||o.status===orderFilter).slice().reverse().map((order:any)=>{
                const sc=statusConfig[order.status]||statusConfig['bekliyor'];
                return(
                  <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <div className="bg-zinc-800 px-3 py-2 rounded-xl text-center shrink-0"><p className="text-zinc-500 text-[9px] font-bold">SİP</p><p className="text-white font-black text-sm">#{order.id?.slice(-5).toUpperCase()}</p></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap"><span className="font-black text-white text-sm">{order.customerName||'Müşteri yok'}</span><span className={'text-xs font-bold px-2 py-0.5 rounded-full '+(sc.bg)+' '+(sc.color)}>{sc.label}</span>{order.deliveryDate&&<span className="text-xs text-zinc-500">{order.deliveryDate}</span>}</div>
                        <div className="text-zinc-500 text-xs">{order.createdAt}</div>
                      </div>
                      <div className="text-xl font-black text-white mr-2">₺{(order.total||0).toFixed(2)}</div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {order.status==='bekliyor'&&<button onClick={()=>handleOrderStatus(order.id,'hazirlaniyor')} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Hazırla</button>}
                        {order.status==='hazirlaniyor'&&<button onClick={()=>handleOrderStatus(order.id,'gönderildi')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Gönderildi</button>}
                        {(order.status==='bekliyor'||order.status==='hazirlaniyor')&&<button onClick={()=>handleOrderStatus(order.id,'iptal')} className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700">İptal</button>}
                        <button onClick={()=>{if(window.confirm('Silinsin mi?'))deleteDoc(doc(db,'orders',order.id));}} className="bg-zinc-800 text-zinc-500 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700">Sil</button>
                      </div>
                    </div>
                    <div className="border-t border-zinc-800/50 px-4 pb-3"><div className="flex flex-wrap gap-1.5 mt-2">{(order.items||[]).map((item:any,i:number)=><span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg">{item.name} <span className="font-black">×{item.qty}</span></span>)}</div></div>
                  </div>
                );
              })}
              {orders.filter(o=>orderFilter==='all'||o.status===orderFilter).length===0&&<div className="text-center text-zinc-600 py-12 font-bold">Bu filtrede sipariş yok.</div>}
            </div>
          </div>
        )}

        {/* ═══ STOK SAYFALAR ════════════════════════════════════════════ */}
        {activePage.startsWith('stock.')&&(
          <div className="flex flex-col w-full overflow-hidden">
            {activePage==='stock.products'&&(
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-black flex items-center gap-3"><Package className="text-emerald-500"/> Ürünler</h2>
                  <div className="flex gap-2">
                    <input type="file" accept=".csv" ref={fileInputRefProd} style={{display:'none'}} onChange={importProducts}/>
                    <button onClick={()=>fileInputRefProd.current?.click()} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-zinc-700 text-sm"><Upload size={13}/> İçeri</button>
                    <button onClick={exportProducts} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-zinc-700 text-sm"><Download size={13}/> Dışarı</button>
                    <button onClick={()=>setShowAddForm(!showAddForm)} className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 text-sm"><Plus size={15}/> Yeni Ürün</button>
                  </div>
                </div>
                {showAddForm&&(
                  <form onSubmit={handleAddProduct} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Ürün İsmi *</label><input required value={pName} onChange={e=>setPName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none focus:border-emerald-500 text-sm"/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Barkod</label><input value={pBarcode} onChange={e=>setPBarcode(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm"/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={pCat} onChange={e=>setPCat(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm"><option value="">— Seç —</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    {!pByWeight&&<div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Birim</label><select value={pUnit} onChange={e=>setPUnit(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm"><option>Adet</option><option>Koli</option><option>Paket</option></select></div>}
                    <div className="space-y-1"><label className="text-xs font-bold text-blue-400 uppercase">Alış</label><input type="number" step="0.01" value={pCost} onChange={e=>setPCost(e.target.value)} className="w-full bg-blue-950/20 border border-blue-900 p-2.5 rounded-xl outline-none text-blue-300 text-sm" placeholder="0.00"/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-emerald-400 uppercase">NET Satış{pByWeight?' (₺/kg)':''} *</label><input required type="number" step="0.01" value={pNet} onChange={e=>setPNet(e.target.value)} className="w-full bg-zinc-950 border border-emerald-900 p-2.5 rounded-xl outline-none text-sm" placeholder="0.00"/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">KDV %</label><select value={pTax} onChange={e=>setPTax(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm"><option value="0">0</option><option value="1">1</option><option value="10">10</option><option value="20">20</option></select></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-violet-400 uppercase">Başl. Stok</label><input type="number" step={pByWeight?"0.001":"1"} value={pStock} onChange={e=>setPStock(e.target.value)} className="w-full bg-violet-950/20 border border-violet-900 p-2.5 rounded-xl outline-none text-violet-300 text-sm" placeholder="0"/></div>
                    {/* KİLO TARTIMLI TOGGLE */}
                    <div className="col-span-2 lg:col-span-4">
                      <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                        <div className="flex items-center gap-2"><Scale size={15} className="text-blue-400"/><div><p className="text-blue-300 font-bold text-sm">Tartı ile Satış (kg)</p><p className="text-zinc-500 text-xs">Kasada kilo girilerek satılır, fiyat kg başına</p></div></div>
                        <button type="button" onClick={()=>setPByWeight(!pByWeight)} className={'w-11 h-6 rounded-full relative transition-all '+(pByWeight?'bg-blue-500':'bg-zinc-700')}><span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all '+(pByWeight?'left-5':'left-0.5')}/></button>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <button type="submit" className="bg-emerald-500 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-sm">KAYDET</button>
                      <button type="button" onClick={()=>setShowAddForm(false)} className="bg-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-sm border border-zinc-700">İptal</button>
                    </div>
                  </form>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-2.5 text-zinc-500" size={14}/><input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Ürün ara..." className="w-full bg-zinc-900 border border-zinc-700 pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"/></div>
                  <select value={productCategoryFilter} onChange={e=>setProductCategoryFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-2.5 rounded-xl outline-none text-sm"><option value="all">Tüm Kategoriler</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select>
                  <select value={productStockFilter} onChange={e=>setProductStockFilter(e.target.value as any)} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-2.5 rounded-xl outline-none text-sm"><option value="all">Tüm Stok</option><option value="in">Stokta</option><option value="low">Kritik</option><option value="out">Tükenen</option></select>
                  <select value={productSort} onChange={e=>setProductSort(e.target.value as any)} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-2.5 rounded-xl outline-none text-sm"><option value="name-asc">A-Z</option><option value="name-desc">Z-A</option><option value="price-asc">Fiyat ↑</option><option value="price-desc">Fiyat ↓</option><option value="stock-asc">Stok ↑</option><option value="stock-desc">Stok ↓</option></select>
                </div>
                <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase">
                      <tr><th className="p-3">Ürün</th><th className="p-3">Kategori</th><th className="p-3 text-right">Alış</th><th className="p-3 text-right">Satış</th><th className="p-3 text-center">Stok</th><th className="p-3 text-center">İşlem</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredProducts.map(p=>{
                        const sc=stockColor(p.stock||0);
                        return(
                          <tr key={p.id} className="hover:bg-zinc-800/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-400 text-sm">{p.name}</span>
                                {p.byWeight&&<span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Scale size={8}/> kg</span>}
                              </div>
                              {p.barcode&&<div className="text-zinc-600 text-xs font-mono">{p.barcode}</div>}
                            </td>
                            <td className="p-3">{p.category?<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={catStyleOf(p.category||'')}>{p.category}</span>:<span className="text-zinc-700">—</span>}</td>
                            <td className="p-3 text-right text-blue-400 text-sm">₺{(p.costPrice||0).toFixed(2)}</td>
                            <td className="p-3 text-right font-black text-white text-sm">₺{(p.grossPrice||0).toFixed(2)}{p.byWeight&&<span className="text-zinc-500 text-xs">/kg</span>}</td>
                            <td className="p-3 text-center"><span className={(sc.badge)+' text-white text-xs font-black px-2 py-0.5 rounded-full'}>{p.byWeight?(p.stock||0).toFixed(2)+'kg':(p.stock||0)}</span></td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={()=>openEditProduct(p)} className="text-zinc-600 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-zinc-800"><Pencil size={12}/></button>
                                <button onClick={()=>setVariantProduct(p)} className="text-zinc-600 hover:text-purple-400 p-1.5 rounded-lg hover:bg-zinc-800"><Boxes size={12}/></button>
                                <button onClick={async()=>{setPriceHistoryProduct(p);await loadPriceHistory(p.id);}} className="text-zinc-600 hover:text-yellow-400 p-1.5 rounded-lg hover:bg-zinc-800"><TrendingUp size={12}/></button>
                                <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-zinc-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-800"><Trash2 size={12}/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length===0&&<tr><td colSpan={6} className="p-8 text-center text-zinc-600">Ürün bulunamadı.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activePage==='stock.tracking'&&(
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-5"><Boxes className="text-emerald-500"/> Stok Takibi</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam Ürün</p><p className="text-2xl font-black text-white">{products.length}</p></div>
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl"><p className="text-red-400 text-xs font-bold uppercase mb-1">Tükenen</p><p className="text-2xl font-black text-red-500">{outOfStock}</p></div>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl"><p className="text-orange-400 text-xs font-bold uppercase mb-1">Kritik (≤{lowStockLimit})</p><p className="text-2xl font-black text-orange-400">{lowStock}</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Stok Değeri</p><p className="text-xl font-black text-white">₺{totalStockValue.toFixed(0)}</p></div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative"><Search className="absolute left-3 top-2.5 text-zinc-500" size={13}/><input value={stockSearch} onChange={e=>setStockSearch(e.target.value)} placeholder="Ürün ara..." className="bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm w-48"/></div>
                  <select value={stockCatFilter} onChange={e=>setStockCatFilter(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-2.5 rounded-xl outline-none text-sm"><option value="all">Tüm Kategoriler</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select>
                  <button onClick={()=>setStockFilter('all')} className={stockFilter==='all'?"px-3 py-2.5 rounded-xl text-sm font-bold border bg-emerald-500 text-zinc-950 border-emerald-500":"px-3 py-2.5 rounded-xl text-sm font-bold border bg-zinc-800 text-zinc-400 border-zinc-700"}>Tümü</button>
                  <button onClick={()=>setStockFilter('low')} className={stockFilter==='low'?"px-3 py-2.5 rounded-xl text-sm font-bold border bg-orange-400 text-zinc-950 border-orange-400":"px-3 py-2.5 rounded-xl text-sm font-bold border bg-zinc-800 text-zinc-400 border-zinc-700"}>Kritik</button>
                  <button onClick={()=>setStockFilter('out')} className={stockFilter==='out'?"px-3 py-2.5 rounded-xl text-sm font-bold border bg-red-500 text-white border-red-500":"px-3 py-2.5 rounded-xl text-sm font-bold border bg-zinc-800 text-zinc-400 border-zinc-700"}>Tükenen</button>
                  <div className="ml-auto flex items-center gap-2"><span className="text-zinc-600 text-xs">Eşik:</span><input type="number" value={lowStockLimit} onChange={e=>setLowStockLimit(parseInt(e.target.value)||5)} className="w-14 bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-center text-sm outline-none font-bold"/></div>
                </div>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <table className="w-full"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 text-left">Ürün</th><th className="p-3 text-left">Kategori</th><th className="p-3 text-right">Stok</th><th className="p-3 text-right">Satış Fiyatı</th><th className="p-3 text-right">Stok Değeri</th></tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredStockProducts.map(p=>(
                      <tr key={p.id} className="hover:bg-zinc-800/30">
                        <td className="p-3"><div className="font-bold text-white text-sm">{p.name}</div>{(p.stock||0)===0&&<span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">TÜKENDI</span>}{(p.stock||0)>0&&(p.stock||0)<=lowStockLimit&&<span className="text-[9px] bg-orange-400 text-zinc-950 font-bold px-1.5 py-0.5 rounded-full">KRİTİK</span>}</td>
                        <td className="p-3">{p.category?<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={catStyleOf(p.category||'')}>{p.category}</span>:<span className="text-zinc-700">—</span>}</td>
                        <td className="p-3 text-right"><span className="font-black text-lg text-white">{p.byWeight?(p.stock||0).toFixed(2):(p.stock||0)}</span><span className="text-zinc-600 text-xs ml-1">{p.byWeight?'kg':p.unit||'adet'}</span></td>
                        <td className="p-3 text-right font-bold text-white text-sm">₺{(p.grossPrice||0).toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-blue-400 text-sm">₺{((p.stock||0)*(p.costPrice||0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              </div>
            )}
            {activePage==='stock.count'&&(
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-black flex items-center gap-2"><ClipboardCheck className="text-emerald-500"/> Stok Sayımı</h2>
                  <button onClick={handleSaveCount} className={'px-5 py-2.5 rounded-2xl font-black flex items-center gap-2 '+(countSaved?'bg-emerald-400 text-zinc-950':'bg-emerald-500 text-zinc-950 hover:bg-emerald-400')}>{countSaved?<><CheckCircle size={15}/> Kaydedildi!</>:<><Save size={15}/> Kaydet</>}</button>
                </div>
                <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                  <div className="grid grid-cols-12 bg-zinc-950 text-zinc-500 text-xs font-bold uppercase">
                    <div className="col-span-5 p-3">Ürün</div><div className="col-span-2 p-3">Kategori</div><div className="col-span-2 p-3 text-center">Sistemdeki</div><div className="col-span-2 p-3 text-center">Sayılan</div><div className="col-span-1 p-3 text-center">Fark</div>
                  </div>
                  <div className="divide-y divide-zinc-800/50">
                    {products.map(p=>{
                      const counted=parseFloat(countDraft[p.id]??String(p.stock||0));
                      const diff=isNaN(counted)?0:counted-(p.stock||0);
                      return(
                        <div key={p.id} className="grid grid-cols-12 items-center hover:bg-zinc-800/30">
                          <div className="col-span-5 p-3"><div className="font-bold text-white text-sm">{p.name}</div>{p.barcode&&<div className="text-zinc-600 text-xs font-mono">{p.barcode}</div>}</div>
                          <div className="col-span-2 p-3">{p.category?<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={catStyleOf(p.category||'')}>{p.category}</span>:<span className="text-zinc-700 text-xs">—</span>}</div>
                          <div className="col-span-2 p-3 text-center"><span className="font-black text-zinc-400">{p.byWeight?(p.stock||0).toFixed(2):(p.stock||0)}</span></div>
                          <div className="col-span-2 p-3 text-center"><input type="number" step={p.byWeight?"0.001":"1"} value={countDraft[p.id]??String(p.stock||0)} onChange={e=>setCountDraft(prev=>({...prev,[p.id]:e.target.value}))} className="w-20 bg-zinc-950 border border-zinc-700 text-white rounded-xl p-1.5 text-center font-black text-sm outline-none focus:border-emerald-500"/></div>
                          <div className="col-span-1 p-3 text-center"><span className={'font-black text-sm '+(diff>0?'text-emerald-400':diff<0?'text-red-400':'text-zinc-600')}>{isNaN(diff)?'—':diff>0?'+'+diff.toFixed(p.byWeight?2:0):diff===0?'=':diff.toFixed(p.byWeight?2:0)}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {activePage==='stock.movements'&&(
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-4"><ArrowUpDown className="text-emerald-500"/> Stok Hareketleri</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-2">
                  <input type="date" value={mvStart} onChange={e=>setMvStart(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none"/>
                  <span className="text-zinc-600">—</span>
                  <input type="date" value={mvEnd} onChange={e=>setMvEnd(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none"/>
                  {(mvStart||mvEnd)&&<button onClick={()=>{setMvStart('');setMvEnd('');}} className="text-zinc-500 hover:text-red-400 text-xs font-bold bg-zinc-800 px-2.5 py-2 rounded-lg border border-zinc-700 flex items-center gap-1"><X size={11}/> Temizle</button>}
                  <div className="flex gap-1">{(['all','in','out'] as const).map(t=><button key={t} onClick={()=>setMvType(t)} className={'px-3 py-2 rounded-xl text-xs font-bold border '+(mvType===t?t==='in'?'bg-blue-500 text-white border-blue-500':t==='out'?'bg-red-500 text-white border-red-500':'bg-zinc-600 text-white border-zinc-600':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{t==='all'?'Tümü':t==='in'?'↓ Giriş':'↑ Çıkış'}</button>)}</div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Toplam</p><p className="text-xl font-black text-white">{filteredMovements.filtered.length}</p></div>
                  <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl"><p className="text-blue-400 text-xs font-bold uppercase mb-1">↓ Giriş</p><p className="text-xl font-black text-blue-400">₺{filteredMovements.tIn.toFixed(2)}</p></div>
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl"><p className="text-red-400 text-xs font-bold uppercase mb-1">↑ Çıkış</p><p className="text-xl font-black text-red-400">₺{filteredMovements.tOut.toFixed(2)}</p></div>
                </div>
                <div className="space-y-2">
                  {filteredMovements.filtered.map((mv,idx)=>(
                    <div key={idx} className={'border rounded-xl p-3 flex items-center gap-3 '+(mv.type==='in'?'border-blue-800/40 bg-blue-500/5':'border-zinc-800 bg-zinc-900/50')}>
                      <div className={'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black '+(mv.type==='in'?'bg-blue-500/20 text-blue-400':'bg-red-500/10 text-red-400')}>{mv.type==='in'?'↓':'↑'}</div>
                      <div className="flex-1 min-w-0"><div className="font-black text-white text-sm">{mv.desc}</div><div className="flex flex-wrap gap-1 mt-1">{mv.items.slice(0,4).map((item:any,i:number)=><span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{item.name} ×{typeof item.qty==='number'&&item.qty%1!==0?item.qty.toFixed(2):item.qty}</span>)}{mv.items.length>4&&<span className="text-[10px] text-zinc-600">+{mv.items.length-4}</span>}</div></div>
                      <div className="text-right shrink-0"><div className={'text-lg font-black '+(mv.type==='in'?'text-blue-400':'text-red-400')}>{mv.type==='in'?'+':'-'}₺{mv.total.toFixed(2)}</div><div className="text-zinc-600 text-xs">{mv.date}</div></div>
                    </div>
                  ))}
                  {filteredMovements.filtered.length===0&&<div className="text-center text-zinc-600 py-10 font-bold">Hareket bulunamadı.</div>}
                </div>
              </div>
            )}
            {activePage==='stock.category'&&(
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-2xl font-black flex items-center gap-2 mb-5"><FolderOpen className="text-emerald-500"/> Ürün Kategorileri</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                    <h4 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">Yeni Kategori</h4>
                    <form onSubmit={handleAddCategory} className="space-y-3">
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori Adı</label><input required value={newCatName} onChange={e=>setNewCatName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm" placeholder="Temizlik Ürünleri"/></div>
                      <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Renk</label><div className="flex flex-wrap gap-2">{CAT_COLORS.map(c=><button key={c} type="button" onClick={()=>setNewCatColor(c)} className={'w-8 h-8 rounded-full transition-all '+(newCatColor===c?'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110':'')} style={{background:c}}></button>)<input type="color" value={newCatColor} onChange={e=>setNewCatColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0"/></div></div>
                      <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={14}/> Ekle</button>
                    </form>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                    <h4 className="font-black text-lg mb-4 border-b border-zinc-800 pb-3">Kategoriler</h4>
                    <div className="space-y-2">
                      {categories.map(cat=>{const cnt=products.filter(p=>p.category===cat.name).length;return(
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full shrink-0" style={{background:cat.color}}></div><div><span className="font-bold text-white text-sm">{cat.name}</span><div className="text-zinc-600 text-xs">{cnt} ürün</div></div></div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={()=>setCategoryEditor(cat)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-700 font-bold">Toplu Yönet</button>
                            <button onClick={()=>deleteDoc(doc(db,'categories',cat.id))} className="text-zinc-700 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      );})}
                      {categories.length===0&&<p className="text-zinc-600 text-sm text-center py-4">Henüz kategori yok.</p>}
                    </div>
                    {categoryEditor&&(
                      <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                          <div><p className="text-white font-black text-sm">Toplu Ürün Bağla — {categoryEditor.name}</p><p className="text-zinc-500 text-xs">{categoryEditorSelected.size} seçili</p></div>
                          <button onClick={()=>setCategoryEditor(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-lg"><X size={13}/></button>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="relative"><Search className="absolute left-3 top-2.5 text-zinc-500" size={13}/><input value={categoryEditorSearch} onChange={e=>setCategoryEditorSearch(e.target.value)} placeholder="Ürün ara..." className="w-full bg-zinc-900 border border-zinc-700 pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"/></div>
                          <div className="flex gap-2"><button type="button" onClick={()=>setCategoryEditorSelected(prev=>{const n=new Set(prev);categoryEditorProducts.forEach((p:any)=>n.add(p.id));return n;})} className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 font-bold">Hepsini Seç</button><button type="button" onClick={()=>setCategoryEditorSelected(prev=>{const n=new Set(prev);categoryEditorProducts.forEach((p:any)=>n.delete(p.id));return n;})} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-700 font-bold">Kaldır</button></div>
                          <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/50 border border-zinc-800 rounded-xl">
                            {categoryEditorProducts.map((p:any)=>{const sel=categoryEditorSelected.has(p.id);return(
                              <button key={p.id} type="button" onClick={()=>toggleCategoryEditorProduct(p.id)} className={'w-full p-2.5 text-left flex items-center gap-2.5 '+(sel?'bg-emerald-500/10':'hover:bg-zinc-900')}>
                                <div className={'w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 '+(sel?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>{sel&&<CheckCircle size={11} className="text-zinc-950"/>}</div>
                                <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate">{p.name}</div><div className="text-xs text-zinc-500">{p.category||'Kategorisiz'}</div></div>
                              </button>
                            );})}
                            {categoryEditorProducts.length===0&&<div className="p-4 text-center text-zinc-600 text-sm">Ürün bulunamadı.</div>}
                          </div>
                          <div className="flex gap-2"><button type="button" onClick={()=>setCategoryEditor(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-2 rounded-xl font-bold border border-zinc-700 text-sm">Kapat</button><button type="button" disabled={categoryEditorSaving} onClick={handleSaveCategoryEditor} className="flex-1 bg-emerald-500 text-zinc-950 py-2 rounded-xl font-black text-sm disabled:opacity-50">{categoryEditorSaving?'Kaydediliyor...':'Kaydet'}</button></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activePage==='stock.bulk'&&(
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-5">
                  <div><h2 className="text-2xl font-black flex items-center gap-2"><Zap className="text-yellow-400"/> Toplu Fiyat Güncelleme</h2><p className="text-zinc-500 text-sm mt-0.5">Seçili ürünlere toplu zam veya indirim uygula.</p></div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex gap-1"><button onClick={()=>setBulkType('zam')} className={'px-3 py-2 rounded-xl font-bold text-sm border '+(bulkType==='zam'?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>📈 Zam</button><button onClick={()=>setBulkType('indirim')} className={'px-3 py-2 rounded-xl font-bold text-sm border '+(bulkType==='indirim'?'bg-red-500 text-white border-red-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>📉 İndirim</button></div>
                    <div className="flex gap-1"><button onClick={()=>setBulkField('grossPrice')} className={'px-3 py-2 rounded-xl font-bold text-sm border '+(bulkField==='grossPrice'?'bg-blue-500 text-white border-blue-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>Satış</button><button onClick={()=>setBulkField('costPrice')} className={'px-3 py-2 rounded-xl font-bold text-sm border '+(bulkField==='costPrice'?'bg-blue-500 text-white border-blue-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>Alış</button></div>
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2"><span className="text-zinc-500 font-bold text-sm">%</span><input type="number" min="0" max="100" step="0.1" value={bulkPct} onChange={e=>setBulkPct(e.target.value)} placeholder="0" className="w-14 bg-transparent text-white outline-none font-black text-lg text-center"/></div>
                    <button onClick={()=>setBulkSelected(new Set(products.map(p=>p.id)))} className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-xl font-bold text-sm border border-zinc-700">Tümü</button>
                    <button onClick={()=>setBulkSelected(new Set())} className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-xl font-bold text-sm border border-zinc-700"><X size={14}/></button>
                    <button onClick={handleBulkPrice} className={'px-5 py-2 rounded-xl font-black text-sm flex items-center gap-2 '+(bulkDone?'bg-emerald-400 text-zinc-950':'bg-yellow-400 text-zinc-950 hover:bg-yellow-300')}>
                      {bulkDone?<><CheckCircle size={15}/> Uygulandı!</>:<><Zap size={15}/> Uygula ({bulkSelected.size})</>}
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 w-10"><button onClick={()=>{if(bulkSelected.size===products.length)setBulkSelected(new Set());else setBulkSelected(new Set(products.map(p=>p.id)));}} className={'w-5 h-5 rounded-lg border-2 flex items-center justify-center '+(bulkSelected.size===products.length?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>{bulkSelected.size===products.length&&<CheckCircle size={11} className="text-zinc-950"/>}</button></th><th className="p-3">Ürün</th><th className="p-3 text-right">Alış</th><th className="p-3 text-right">Satış</th><th className="p-3 text-right text-yellow-400">Yeni</th></tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {products.map(p=>{const isSel=bulkSelected.has(p.id);const cur=p[bulkField]||0;const pct=parseFloat(bulkPct)||0;const newVal=pct>0?parseFloat((cur*(bulkType==='zam'?1+pct/100:1-pct/100)).toFixed(2)):null;return(
                      <tr key={p.id} onClick={()=>toggleBulkSelection(p)} className={'cursor-pointer '+(isSel?'bg-yellow-500/5':'hover:bg-zinc-800/30')}>
                        <td className="p-3"><div className={'w-5 h-5 rounded-lg border-2 flex items-center justify-center '+(isSel?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>{isSel&&<CheckCircle size={11} className="text-zinc-950"/>}</div></td>
                        <td className="p-3"><div className="font-bold text-white text-sm">{p.name}</div>{p.variantGroup&&<div className="text-[10px] text-purple-400">{p.variantGroup}</div>}</td>
                        <td className="p-3 text-right text-blue-400 text-sm">₺{(p.costPrice||0).toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-white text-sm">₺{(p.grossPrice||0).toFixed(2)}</td>
                        <td className="p-3 text-right">{newVal&&isSel?<span className={'font-black text-sm '+(bulkType==='zam'?'text-emerald-400':'text-red-400')}>₺{newVal.toFixed(2)}</span>:<span className="text-zinc-700">—</span>}</td>
                      </tr>
                    );})}
                  </tbody></table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ALIŞ FATURALARI ══════════════════════════════════════════ */}
        {activePage==='purchases'&&(
          <div className="p-6 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-5"><div><h2 className="text-2xl font-black flex items-center gap-2"><ArrowDownToLine className="text-blue-400"/> Alış Faturaları</h2></div><button onClick={()=>setShowPurchaseForm(!showPurchaseForm)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-blue-500"><Plus size={15}/> Yeni Alış</button></div>
            {showPurchaseForm&&(
              <form onSubmit={handleSavePurchase} className="bg-zinc-900 border border-blue-900/40 p-5 rounded-2xl mb-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Tedarikçi</label><input value={purchaseSupplier} onChange={e=>setPurchaseSupplier(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Tarih</label><input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Fatura No</label><input value={purchaseNote} onChange={e=>setPurchaseNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm" placeholder="INV-001..."/></div>
                </div>
                {purchaseLines.map((line,idx)=>(
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5"><select value={line.productId} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],productId:e.target.value,cost:products.find(p=>p.id===e.target.value)?.costPrice?.toString()||''};setPurchaseLines(nl);}} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"><option value="">— Ürün —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div className="col-span-2"><input type="number" step={products.find(p=>p.id===line.productId)?.byWeight?"0.001":"1"} min="0" value={line.qty} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],qty:e.target.value};setPurchaseLines(nl);}} placeholder="Miktar" className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm text-center"/></div>
                    <div className="col-span-3"><input type="number" step="0.01" value={line.cost} onChange={e=>{const nl=[...purchaseLines];nl[idx]={...nl[idx],cost:e.target.value};setPurchaseLines(nl);}} placeholder="Alış fiyatı" className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                    <div className="col-span-1 text-right text-zinc-500 text-sm font-bold">₺{((parseFloat(line.qty)||0)*(parseFloat(line.cost)||0)).toFixed(0)}</div>
                    <div className="col-span-1 flex justify-center">{purchaseLines.length>1&&<button type="button" onClick={()=>setPurchaseLines(purchaseLines.filter((_,i)=>i!==idx))} className="text-zinc-600 hover:text-red-500"><X size={14}/></button>}</div>
                  </div>
                ))}
                <button type="button" onClick={()=>setPurchaseLines([...purchaseLines,{productId:'',qty:'',cost:''}])} className="flex items-center gap-1.5 text-blue-400 text-sm font-bold"><Plus size={13}/> Satır Ekle</button>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div className="text-zinc-400 text-sm">Toplam: <span className="text-white font-black text-xl">₺{purchaseLines.reduce((a,l)=>a+((parseFloat(l.qty)||0)*(parseFloat(l.cost)||0)),0).toFixed(2)}</span></div>
                  <div className="flex gap-2"><button type="button" onClick={()=>setShowPurchaseForm(false)} className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl font-black flex items-center gap-1.5 text-sm"><Save size={14}/> Kaydet</button></div>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {purchases.slice().reverse().map((pur:any)=>(
                <div key={pur.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={()=>setExpandedPurchase(expandedPurchase===pur.id?null:pur.id)}>
                    <div className="bg-blue-600/20 border border-blue-600/30 px-3 py-2 rounded-xl text-center shrink-0"><p className="text-blue-400 text-[9px] font-bold">ALIŞ</p><p className="text-white font-black text-sm">#{pur.id?.slice(-5).toUpperCase()}</p></div>
                    <div className="flex-1"><p className="font-black text-white text-sm">{pur.supplier||'Tedarikçi yok'}</p><p className="text-zinc-500 text-xs">{pur.date}{pur.note&&` · ${pur.note}`}</p></div>
                    <div className="text-right mr-2"><p className="text-xl font-black text-blue-400">₺{(pur.totalCost||0).toFixed(2)}</p><p className="text-zinc-600 text-xs">{(pur.items||[]).length} kalem</p></div>
                    <button onClick={e=>{e.stopPropagation();deleteDoc(doc(db,'purchases',pur.id));}} className="text-zinc-700 hover:text-red-500 p-1"><Trash2 size={13}/></button>
                  </div>
                  {expandedPurchase===pur.id&&(
                    <div className="border-t border-zinc-800 px-4 pb-3">
                      <table className="w-full text-sm mt-2"><thead><tr className="text-zinc-600 text-xs font-bold uppercase"><th className="text-left pb-1">Ürün</th><th className="text-center pb-1">Miktar</th><th className="text-right pb-1">Alış</th><th className="text-right pb-1">Toplam</th></tr></thead>
                      <tbody>{(pur.items||[]).map((item:any,i:number)=><tr key={i} className="text-zinc-300"><td className="py-1 font-medium">{item.productName}</td><td className="py-1 text-center text-zinc-500">{item.qty}</td><td className="py-1 text-right text-zinc-400">₺{(item.cost||0).toFixed(2)}</td><td className="py-1 text-right font-bold text-blue-400">₺{((item.cost||0)*(item.qty||1)).toFixed(2)}</td></tr>)}</tbody></table>
                    </div>
                  )}
                </div>
              ))}
              {purchases.length===0&&<div className="text-center text-zinc-600 py-10 font-bold">Henüz alış faturası yok.</div>}
            </div>
          </div>
        )}

        {/* ═══ CARİ / MÜŞTERİLER ═══════════════════════════════════════ */}
        {activePage==='customers'&&(
          <div className="p-6 w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black">Cari Hesaplar</h2>
              <div className="flex gap-2">
                <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRefCust} style={{display:'none'}} onChange={importCustomers}/>
                <button onClick={()=>fileInputRefCust.current?.click()} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-zinc-700 text-sm"><Upload size={13}/> İçeri</button>
                <button onClick={exportCustomers} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-zinc-700 text-sm"><Download size={13}/> Dışarı</button>
                <button onClick={()=>setActivePage('customers.categories')} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-zinc-700 text-sm"><FolderOpen size={13}/> Kategoriler</button>
                <button onClick={()=>setShowCustomerForm(!showCustomerForm)} className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 text-sm"><UserPlus size={14}/> Yeni Cari</button>
              </div>
            </div>
            {/* MÜŞTERİ ARAMA */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={15}/>
              <input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Müşteri adı, telefon, vergi no, kategori ara..." className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:border-emerald-500 text-sm"/>
              {customerSearch&&(<button onClick={()=>setCustomerSearch('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"><X size={15}/></button>)}
            </div>
            {customerSearch&&<div className="text-zinc-500 text-xs font-bold mb-3">{filteredCustomers.length} / {customers.length} müşteri</div>}
            {showCustomerForm&&(
              <form onSubmit={handleAddCustomer} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2 lg:col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase">Ad / Firma *</label><input required value={cName} onChange={e=>setCName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm" placeholder="Beyoğlu Buklet"/></div>
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Vergi No / TC *</label><input required value={cTaxNum} onChange={e=>setCTaxNum(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm"/></div>
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Telefon</label><input value={cPhone} onChange={e=>setCPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm" placeholder="05xx..."/></div>
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={cCat} onChange={e=>setCCat(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm"><option value="">— Seç —</option>{custCategories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase">Not</label><input value={cNote} onChange={e=>setCNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm" placeholder="Müşteri hakkında not..."/></div>
                <div className="flex items-end gap-2"><button type="submit" className="bg-emerald-500 text-zinc-950 font-black px-5 py-2.5 rounded-xl text-sm">Ekle</button><button type="button" onClick={()=>setShowCustomerForm(false)} className="bg-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button></div>
              </form>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredCustomers.map(c=>(
                <div key={c.id} onClick={()=>setSelectedCustomer(c)} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-emerald-500 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-emerald-400">{c.name}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-500 text-xs font-bold bg-zinc-950 px-2 py-0.5 rounded"><Phone size={9}/> {c.phone||'-'}</span>
                        <span className="text-zinc-500 text-xs font-bold bg-zinc-950 px-2 py-0.5 rounded">V: {c.taxNum||'-'}</span>
                        {c.category&&<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={catStyle(custCatColor(c.category||''))}>{c.category}</span>}
                      </div>
                      {c.note&&<p className="text-zinc-600 text-xs mt-1 italic">"{c.note}"</p>}
                    </div>
                    <div className={'text-xl font-black font-mono '+((c.balance||0)>0?'text-red-500':(c.balance||0)<0?'text-emerald-500':'text-zinc-600')}>
                      {(c.balance||0)>0?'+₺'+(c.balance||0).toFixed(2):(c.balance||0)<0?'-₺'+Math.abs(c.balance||0).toFixed(2):'₺0'}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={ev=>{ev.stopPropagation();openEditCustomer(c);}} className="bg-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Pencil size={10}/> Düzenle</button>
                    <button onClick={ev=>{ev.stopPropagation();handleTahsilat(c);}} className="bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-500 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Wallet size={10}/> Tahsilat</button>
                    <button onClick={ev=>{ev.stopPropagation();handleDeleteCustomer(c);}} className="bg-zinc-800 text-zinc-500 px-2 py-1.5 rounded-lg border border-zinc-700"><Trash2 size={10}/></button>
                  </div>
                </div>
              ))}
              {filteredCustomers.length===0&&<div className="col-span-2 text-center text-zinc-600 py-10 font-bold">"{customerSearch}" aramasına uygun müşteri bulunamadı.</div>}
            </div>
          </div>
        )}

        {activePage==='customers.categories'&&(
          <div className="p-6 w-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-5"><button onClick={()=>setActivePage('customers')} className="text-zinc-500 hover:text-white"><ChevronDown size={18} className="-rotate-90"/></button><h2 className="text-2xl font-black flex items-center gap-2"><FolderOpen className="text-emerald-500"/> Müşteri Kategorileri</h2></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h4 className="font-black mb-4 border-b border-zinc-800 pb-3">Yeni Kategori</h4>
                <form onSubmit={handleAddCustCategory} className="space-y-3">
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori Adı</label><input required value={newCustCatName} onChange={e=>setNewCustCatName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm" placeholder="Toptan, VIP..."/></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Renk</label><div className="flex flex-wrap gap-2">{CAT_COLORS.map(c=><button key={c} type="button" onClick={()=>setNewCustCatColor(c)} className={'w-8 h-8 rounded-full transition-all '+(newCustCatColor===c?'ring-2 ring-white ring-offset-2 ring-offset-zinc-900':'')} style={{background:c}}/>)<input type="color" value={newCustCatColor} onChange={e=>setNewCustCatColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0"/></div></div>
                  <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={14}/> Ekle</button>
                </form>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h4 className="font-black mb-4 border-b border-zinc-800 pb-3">Mevcut Kategoriler</h4>
                <div className="space-y-2">
                  {custCategories.map(cat=>{const cnt=customers.filter(c=>c.category===cat.name).length;return(<div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800"><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full" style={{background:cat.color}}></div><div><span className="font-bold text-white text-sm">{cat.name}</span><div className="text-zinc-600 text-xs">{cnt} müşteri</div></div></div><button onClick={()=>deleteDoc(doc(db,'custCategories',cat.id))} className="text-zinc-700 hover:text-red-500 p-1"><Trash2 size={12}/></button></div>);})}
                  {custCategories.length===0&&<p className="text-zinc-600 text-sm text-center py-4">Henüz müşteri kategorisi yok.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RAPORLAR ═════════════════════════════════════════════════ */}
        {activePage==='reports'&&(
          <div className="p-6 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-2xl font-black">Rapor & Analiz</h2></div>
            <div className="flex flex-wrap gap-1.5 mb-5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 w-fit">
              {([['genel','Genel'],['aylik','Aylık'],['gunSonu','Gün Sonu'],['kdv','KDV'],['parasut','Paraşüt'],['personel','Personel']] as const).map(([tab,label])=>(
                (tab==='personel'&&currentStaff?.role!=='admin')?null:
                <button key={tab} onClick={()=>setReportTab(tab)} className={'px-4 py-2 rounded-xl font-bold text-sm transition-all '+(reportTab===tab?'bg-emerald-500 text-zinc-950':'text-zinc-500 hover:text-white')}>{label}</button>
              ))}
            </div>
            {reportTab==='genel'&&(
              <>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="text-zinc-400 font-bold text-xs mb-1 uppercase">Brüt Ciro</div><div className="text-2xl font-black text-white">₺{totalIncome.toFixed(2)}</div></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="text-blue-400 font-bold text-xs mb-1 uppercase">SMM</div><div className="text-2xl font-black text-white">₺{totalCogs.toFixed(2)}</div></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="text-red-500 font-bold text-xs mb-1 uppercase">Giderler</div><div className="text-2xl font-black text-white">₺{totalExpenseSum.toFixed(2)}</div></div>
                  <div className={'p-4 rounded-2xl border-2 '+(netProfit>=0?'bg-emerald-500/10 border-emerald-500/30':'bg-red-500/10 border-red-500/30')}><div className={'font-bold text-xs mb-1 uppercase '+(netProfit>=0?'text-emerald-500':'text-red-500')}>Net Kar</div><div className={'text-2xl font-black '+(netProfit>=0?'text-emerald-500':'text-red-500')}>₺{netProfit.toFixed(2)}</div></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                    <h3 className="font-black mb-4 border-b border-zinc-800 pb-3">Yeni Gider Kaydı</h3>
                    <form onSubmit={handleAddExpense} className="space-y-3">
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Açıklama</label><input required value={expName} onChange={e=>setExpName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm" placeholder="Elektrik Faturası"/></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Tutar (₺)</label><input required type="number" step="0.01" value={expAmount} onChange={e=>setExpAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl outline-none text-sm" placeholder="0.00"/></div>
                      <button type="submit" className="w-full bg-red-500/20 text-red-500 border border-red-500/30 font-black py-3 rounded-xl hover:bg-red-500 hover:text-white text-sm">GİDERİ KAYDET</button>
                    </form>
                  </div>
                  <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex flex-col">
                    <h3 className="font-black mb-4 border-b border-zinc-800 pb-3">Son Satışlar</h3>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {sales.slice().reverse().slice(0,12).map((s,idx)=>(
                        <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                          <div><div className="text-base font-black text-emerald-400">₺{(s.total||0).toFixed(2)}</div><div className="text-[10px] text-zinc-600 font-mono">{s.date}</div></div>
                          <div className="text-right"><div className="font-bold text-zinc-300 text-sm">{s.customerName}</div><span className={'text-[10px] font-bold px-2 py-0.5 rounded '+(s.method==='Nakit'?'bg-emerald-500/20 text-emerald-400':s.method==='Kart'?'bg-blue-500/20 text-blue-400':'bg-orange-500/20 text-orange-400')}>{s.method}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            {reportTab==='aylik'&&(
              <div className="space-y-5">
                <div className="flex items-center gap-4"><label className="text-zinc-400 font-bold text-sm">Ay Seç:</label><input type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-sm"/></div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Aylık Ciro</p><p className="text-2xl font-black text-emerald-400">₺{monthlyStats.ciro.toLocaleString('tr-TR',{minimumFractionDigits:2})}</p></div>
                  <div className={'p-4 rounded-2xl border '+(monthlyStats.kar>=0?'border-emerald-500/30 bg-emerald-500/10':'border-red-500/30 bg-red-500/10')}><p className="text-xs font-bold uppercase mb-1 text-zinc-300">Net Kar</p><p className={'text-2xl font-black '+(monthlyStats.kar>=0?'text-emerald-400':'text-red-400')}>₺{monthlyStats.kar.toLocaleString('tr-TR',{minimumFractionDigits:2})}</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Brüt Kar</p><p className="text-2xl font-black text-white">₺{monthlyStats.grossProfit.toLocaleString('tr-TR',{minimumFractionDigits:2})}</p><p className="text-zinc-400 text-xs mt-1">%{monthlyStats.grossMargin.toFixed(1)} marj</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Satış</p><p className="text-2xl font-black text-white">{monthlyStats.count}</p><p className="text-zinc-400 text-xs">Ort: ₺{monthlyStats.avgInvoice.toFixed(2)}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl"><p className="text-emerald-400 text-xs font-bold uppercase mb-1">Nakit</p><p className="text-xl font-black text-emerald-400">₺{monthlyStats.nakit.toLocaleString('tr-TR',{minimumFractionDigits:2})}</p></div>
                  <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl"><p className="text-blue-400 text-xs font-bold uppercase mb-1">Kart</p><p className="text-xl font-black text-blue-400">₺{monthlyStats.kart.toLocaleString('tr-TR',{minimumFractionDigits:2})}</p></div>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl"><p className="text-orange-400 text-xs font-bold uppercase mb-1">Veresiye</p><p className="text-xl font-black text-orange-400">₺{monthlyStats.veresiye.toLocaleString('tr-TR',{minimumFractionDigits:2})}</p></div>
                </div>
                {monthlyStats.topUrunler.length>0&&(
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800"><h3 className="font-black flex items-center gap-2"><Package size={14} className="text-purple-400"/> En Çok Satan ({monthLabel})</h3></div>
                    <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 text-left">Ürün</th><th className="p-3 text-center">Adet</th><th className="p-3 text-right">Ciro</th><th className="p-3 text-right">Pay</th></tr></thead>
                    <tbody className="divide-y divide-zinc-800/50">{monthlyStats.topUrunler.map((u,i)=><tr key={i} className="hover:bg-zinc-800/30"><td className="p-3 font-bold text-zinc-300 text-sm">{u.name}</td><td className="p-3 text-center"><span className="bg-purple-500 text-white font-black text-xs px-2 py-0.5 rounded-full">{u.adet}</span></td><td className="p-3 text-right font-black text-white">₺{u.ciro.toLocaleString('tr-TR',{minimumFractionDigits:2})}</td><td className="p-3 text-right text-zinc-500 text-xs">%{(monthlyStats.ciro>0?((u.ciro*100)/monthlyStats.ciro):0).toFixed(1)}</td></tr>)}</tbody></table>
                  </div>
                )}
                {monthlyStats.dailyRows.length>0&&(
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800"><h3 className="font-black flex items-center gap-2"><CalendarDays size={14} className="text-blue-400"/> Günlük Döküm</h3></div>
                    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 text-left">Tarih</th><th className="p-3 text-right">Adet</th><th className="p-3 text-right">Ciro</th><th className="p-3 text-right">Nakit</th><th className="p-3 text-right">Kart</th><th className="p-3 text-right">Veresiye</th></tr></thead>
                    <tbody className="divide-y divide-zinc-800/50">{monthlyStats.dailyRows.map((row:any,i:number)=><tr key={i} className="hover:bg-zinc-800/30"><td className="p-3 text-zinc-400 font-mono text-xs">{row.ds_str}</td><td className="p-3 text-right text-zinc-400">{row.cnt}</td><td className="p-3 text-right font-black text-white">₺{row.ciro.toLocaleString('tr-TR',{minimumFractionDigits:2})}</td><td className="p-3 text-right text-emerald-400">₺{row.nakit.toLocaleString('tr-TR',{minimumFractionDigits:2})}</td><td className="p-3 text-right text-blue-400">₺{row.kart.toLocaleString('tr-TR',{minimumFractionDigits:2})}</td><td className="p-3 text-right text-orange-400">₺{row.veresiye.toLocaleString('tr-TR',{minimumFractionDigits:2})}</td></tr>)}</tbody></table></div>
                  </div>
                )}
              </div>
            )}
            {reportTab==='gunSonu'&&(
              <div>
                <div className="flex items-center gap-4 mb-5"><label className="text-zinc-400 font-bold text-sm">Tarih:</label><input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2 outline-none text-sm"/></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Günlük Ciro</p><p className="text-2xl font-black text-white">₺{daySalesTotal.toFixed(2)}</p></div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl"><p className="text-emerald-400 text-xs font-bold uppercase mb-1">Nakit</p><p className="text-2xl font-black text-emerald-400">₺{dayNakit.toFixed(2)}</p></div>
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl"><p className="text-blue-400 text-xs font-bold uppercase mb-1">Kart</p><p className="text-2xl font-black text-blue-400">₺{dayKart.toFixed(2)}</p></div>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl"><p className="text-orange-400 text-xs font-bold uppercase mb-1">Veresiye</p><p className="text-2xl font-black text-orange-400">₺{dayVeresiye.toFixed(2)}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl"><p className="text-red-400 text-xs font-bold uppercase mb-1">Gider</p><p className="text-2xl font-black text-red-400">₺{dayExpense.toFixed(2)}</p></div>
                  <div className={'p-4 rounded-2xl border-2 '+(dayCashNet>=0?'bg-emerald-500/10 border-emerald-500/40':'bg-red-500/10 border-red-500/40')}><p className={'text-xs font-bold uppercase mb-1 '+(dayCashNet>=0?'text-emerald-400':'text-red-400')}>Net Kasa</p><p className={'text-2xl font-black '+(dayCashNet>=0?'text-emerald-400':'text-red-400')}>₺{dayCashNet.toFixed(2)}</p><p className="text-zinc-600 text-xs">Nakit+Tahsilat-Gider</p></div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><p className="text-zinc-400 text-xs font-bold uppercase mb-1">Satış Adedi</p><p className="text-2xl font-black text-white">{reportSales.filter(s=>s.method!=='Tahsilat').length}</p></div>
                </div>
                {reportSales.filter(s=>s.method!=='Tahsilat').length>0&&(
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800"><h3 className="font-black">{new Date(reportDate).toLocaleDateString('tr-TR')} Satışları</h3></div>
                    <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 text-left">Müşteri</th><th className="p-3 text-left">Saat</th><th className="p-3 text-left">Kasiyer</th><th className="p-3 text-left">Yöntem</th><th className="p-3 text-right">Toplam</th></tr></thead>
                    <tbody className="divide-y divide-zinc-800/50">{reportSales.filter(s=>s.method!=='Tahsilat').map((s,i)=><tr key={i} className="hover:bg-zinc-800/30"><td className="p-3 font-bold text-zinc-300 text-sm">{s.customerName}</td><td className="p-3 text-zinc-500 font-mono text-xs">{s.date?.split(' ')[1]}</td><td className="p-3 text-zinc-500 text-xs">{s.staffName||'-'}</td><td className="p-3"><span className={'text-xs font-bold px-2 py-0.5 rounded '+(s.method==='Nakit'?'bg-emerald-500/20 text-emerald-400':s.method==='Kart'?'bg-blue-500/20 text-blue-400':'bg-orange-500/20 text-orange-400')}>{s.method}</span></td><td className="p-3 text-right font-black text-white">₺{(s.total||0).toFixed(2)}</td></tr>)}</tbody></table>
                  </div>
                )}
              </div>
            )}
            {reportTab==='kdv'&&(
              <div>
                <div className="flex items-center gap-4 mb-5"><label className="text-zinc-400 font-bold text-sm">Tarih:</label><input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2 outline-none text-sm"/></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800"><h3 className="font-black">{new Date(reportDate).toLocaleDateString('tr-TR')} KDV</h3></div>
                    {dayKdvBreakdown.length===0?<p className="text-zinc-600 text-center py-6 text-sm">Bu tarihte satış yok.</p>:(
                      <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 text-left">Oran</th><th className="p-3 text-right">Matrah</th><th className="p-3 text-right">KDV</th><th className="p-3 text-right">Brüt</th></tr></thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {dayKdvBreakdown.map(([rate,data])=><tr key={rate}><td className="p-3 font-black text-white">%{rate}</td><td className="p-3 text-right text-zinc-400">₺{data.base.toFixed(2)}</td><td className="p-3 text-right font-bold text-orange-400">₺{data.kdv.toFixed(2)}</td><td className="p-3 text-right font-black text-white">₺{data.gross.toFixed(2)}</td></tr>)}
                        <tr className="bg-zinc-800/50 font-black"><td className="p-3 text-white">TOPLAM</td><td className="p-3 text-right text-zinc-300">₺{dayKdvBreakdown.reduce((a,[,d])=>a+d.base,0).toFixed(2)}</td><td className="p-3 text-right text-orange-400">₺{dayKdvBreakdown.reduce((a,[,d])=>a+d.kdv,0).toFixed(2)}</td><td className="p-3 text-right text-white">₺{dayKdvBreakdown.reduce((a,[,d])=>a+d.gross,0).toFixed(2)}</td></tr>
                      </tbody></table>
                    )}
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800"><h3 className="font-black">Tüm Zamanlar KDV</h3></div>
                    {kdvBreakdown.length===0?<p className="text-zinc-600 text-center py-6 text-sm">Veri yok.</p>:(
                      <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 text-left">Oran</th><th className="p-3 text-right">Matrah</th><th className="p-3 text-right">KDV</th><th className="p-3 text-right">Brüt</th></tr></thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {kdvBreakdown.map(([rate,data])=><tr key={rate}><td className="p-3 font-black text-white">%{rate}</td><td className="p-3 text-right text-zinc-400">₺{data.base.toFixed(2)}</td><td className="p-3 text-right font-bold text-blue-400">₺{data.kdv.toFixed(2)}</td><td className="p-3 text-right font-black text-white">₺{data.gross.toFixed(2)}</td></tr>)}
                        <tr className="bg-zinc-800/50 font-black"><td className="p-3 text-white">TOPLAM</td><td className="p-3 text-right text-zinc-300">₺{kdvBreakdown.reduce((a,[,d])=>a+d.base,0).toFixed(2)}</td><td className="p-3 text-right text-blue-400">₺{kdvBreakdown.reduce((a,[,d])=>a+d.kdv,0).toFixed(2)}</td><td className="p-3 text-right text-white">₺{kdvBreakdown.reduce((a,[,d])=>a+d.gross,0).toFixed(2)}</td></tr>
                      </tbody></table>
                    )}
                  </div>
                </div>
              </div>
            )}
            {reportTab==='parasut'&&(
              <div className="space-y-5">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5"><h3 className="font-black text-white text-lg mb-1 flex items-center gap-2"><FileSpreadsheet size={17} className="text-blue-400"/> Paraşüt Entegrasyon</h3><p className="text-zinc-400 text-sm">Satışlarınızı Paraşüt uyumlu Excel formatında dışa aktarın.</p><p className={'text-xs font-bold mt-2 '+(parasutReady?'text-emerald-400':'text-orange-400')}>{parasutReady?'✅ Hazır: Aktarım yapabilirsiniz.':'⚠️ Eksik: Firma Ünvanı gerekli.'}</p></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                    <h4 className="font-black mb-4 border-b border-zinc-800 pb-3">Paraşüt Ayarları</h4>
                    <div className="space-y-3">
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Firma Ünvanı *</label><input value={parasutFirm} onChange={e=>{setParasutFirm(e.target.value);localStorage.setItem('parasutFirm',e.target.value);}} placeholder="MERKEZ ŞUBE TİC. LTD. ŞTİ." className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Çıkış Deposu</label><input value={parasutDepot} onChange={e=>{setParasutDepot(e.target.value);localStorage.setItem('parasutDepot',e.target.value);}} placeholder="Merkez Depo" className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                      <button onClick={()=>handleParasutExport(sales.filter(s=>s.method!=='Tahsilat'),'parasut_tum_'+new Date().toISOString().slice(0,10)+'.xlsx')} disabled={!parasutReady} className={'w-full bg-blue-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 text-sm '+(parasutReady?'hover:bg-blue-500':'opacity-40 cursor-not-allowed')}><FileSpreadsheet size={15}/> Tüm Satışları Aktar</button>
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                    <h4 className="font-black mb-4 border-b border-zinc-800 pb-3">Hızlı Dışa Aktarma</h4>
                    <div className="space-y-2">
                      {[
                        {label:'Bu Ay',color:'bg-emerald-600',action:()=>{const now=new Date();handleParasutExport(sales.filter(s=>{const d=parseDT(s.date);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&s.method!=='Tahsilat';}),'parasut_'+now.getFullYear()+'_'+String(now.getMonth()+1).padStart(2,'0')+'.xlsx');}},
                        {label:'Seçili Ay ('+reportMonth+')',color:'bg-purple-600',action:()=>{const[yr,mo]=reportMonth.split('-').map(Number);handleParasutExport(sales.filter(s=>{const d=parseDT(s.date);return d.getFullYear()===yr&&d.getMonth()===mo-1&&s.method!=='Tahsilat';}),'parasut_'+reportMonth+'.xlsx');}},
                      ].map((opt,i)=><button key={i} onClick={opt.action} disabled={!parasutReady} className={'w-full '+opt.color+' text-white p-3.5 rounded-xl font-black flex items-center justify-between text-sm '+(!parasutReady?'opacity-40 cursor-not-allowed':'')}><span>{opt.label}</span><Download size={14}/></button>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {reportTab==='personel'&&currentStaff?.role==='admin'&&(
              <div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <select value={staffLogFilter} onChange={e=>setStaffLogFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm outline-none"><option value="all">Tüm Personel</option>{staffList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                  <input type="date" value={staffLogDateFilter} onChange={e=>setStaffLogDateFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none"/>
                  {staffLogDateFilter&&<button onClick={()=>setStaffLogDateFilter('')} className="text-zinc-500 hover:text-red-400 text-xs font-bold bg-zinc-800 px-2.5 py-2 rounded-lg border border-zinc-700 flex items-center gap-1"><X size={11}/> Temizle</button>}
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-widest"><tr><th className="p-3 text-left">Personel</th><th className="p-3 text-left">İşlem</th><th className="p-3 text-left">Detay</th><th className="p-3 text-right">Tutar</th><th className="p-3 text-left">Tarih</th></tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {staffLogs.filter(l=>staffLogFilter==='all'||l.staffId===staffLogFilter).filter(l=>{if(!staffLogDateFilter)return true;const d=new Date(staffLogDateFilter);const ld=parseDT(l.date);return ld.getFullYear()===d.getFullYear()&&ld.getMonth()===d.getMonth()&&ld.getDate()===d.getDate();}).slice().reverse().slice(0,100).map((log,i)=>(
                      <tr key={i} className="hover:bg-zinc-800/30">
                        <td className="p-3 font-bold text-white text-sm">{log.staffName}</td>
                        <td className="p-3"><span className={'text-xs font-bold px-2 py-0.5 rounded '+(log.action.includes('SATIŞ')?'bg-emerald-500/20 text-emerald-400':log.action.includes('GİRİŞ')||log.action.includes('ÇIKIŞ')?'bg-blue-500/20 text-blue-400':log.action.includes('İADE')?'bg-red-500/20 text-red-400':'bg-zinc-700 text-zinc-400')}>{log.action}</span></td>
                        <td className="p-3 text-zinc-400 text-xs max-w-xs truncate">{log.detail}</td>
                        <td className="p-3 text-right font-bold text-zinc-300">{log.amount>0?'₺'+log.amount.toFixed(2):'-'}</td>
                        <td className="p-3 text-zinc-500 text-xs font-mono">{log.date}</td>
                      </tr>
                    ))}
                  </tbody></table>
                  {staffLogs.length===0&&<div className="text-center text-zinc-600 py-6 font-bold">İşlem geçmişi yok.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PERSONEL ═════════════════════════════════════════════════ */}
        {activePage==='personel'&&currentStaff?.role==='admin'&&(
          <div className="p-6 w-full overflow-y-auto">
            <h2 className="text-2xl font-black flex items-center gap-3 mb-5"><UserCog className="text-emerald-500"/> Personel Yönetimi</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h3 className="font-black mb-4 border-b border-zinc-800 pb-3">Yeni Personel</h3>
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Ad</label><input required value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">PIN</label><input required type="password" maxLength={6} value={newStaffPin} onChange={e=>setNewStaffPin(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm text-center tracking-widest font-black text-xl" placeholder="••••"/></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={()=>setNewStaffRole('admin')} className={'flex-1 py-2.5 rounded-xl font-bold text-sm border '+(newStaffRole==='admin'?'bg-yellow-500/20 border-yellow-500/50 text-yellow-400':'bg-zinc-800 border-zinc-700 text-zinc-500')}>🔑 Admin</button>
                    <button type="button" onClick={()=>setNewStaffRole('ozel')} className={'flex-1 py-2.5 rounded-xl font-bold text-sm border '+(newStaffRole==='ozel'?'bg-emerald-500/20 border-emerald-500/50 text-emerald-400':'bg-zinc-800 border-zinc-700 text-zinc-500')}>⚙️ Özel</button>
                  </div>
                  {newStaffRole==='ozel'&&(
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-3">
                      <div className="flex items-center justify-between"><span className="text-zinc-400 text-xs font-bold">{newStaffPerms.length} yetki</span><div className="flex gap-2"><button type="button" onClick={()=>setNewStaffPerms(ALL_PERMISSIONS.map(p=>p.key))} className="text-xs text-emerald-400 font-bold">Tümü</button><button type="button" onClick={()=>setNewStaffPerms([])} className="text-xs text-red-400 font-bold">Temizle</button></div></div>
                      <div className="space-y-1">
                        {ALL_PERMISSIONS.map(perm=>(
                          <label key={perm.key} onClick={()=>togglePerm(newStaffPerms,perm.key,setNewStaffPerms)} className={'flex items-center gap-2 p-2 rounded-xl cursor-pointer border '+(newStaffPerms.includes(perm.key)?'bg-emerald-500/10 border-emerald-500/30':'bg-zinc-900 border-zinc-800')}>
                            <div className={'w-4 h-4 rounded-lg border-2 flex items-center justify-center shrink-0 '+(newStaffPerms.includes(perm.key)?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>{newStaffPerms.includes(perm.key)&&<CheckCircle size={10} className="text-zinc-950"/>}</div>
                            <span className="text-sm">{perm.icon}</span>
                            <span className={'text-sm '+(newStaffPerms.includes(perm.key)?'text-white':'text-zinc-400')}>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2"><UserPlus size={14}/> Ekle</button>
                </form>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <h3 className="font-black mb-4 border-b border-zinc-800 pb-3">Mevcut Personel</h3>
                <div className="space-y-3">
                  {staffList.map(staff=>(
                    <div key={staff.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={'w-10 h-10 rounded-xl flex items-center justify-center font-black text-base '+(staff.role==='admin'?'bg-yellow-500/20 text-yellow-400':'bg-emerald-500/20 text-emerald-400')}>{staff.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="flex items-center gap-2"><p className="font-black text-white text-sm">{staff.name}</p>{staff.id===currentStaff.id&&<span className="text-emerald-400 text-[9px] font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">SEN</span>}</div>
                            <p className="text-zinc-500 text-xs">{roleLabel(staff)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>{setEditingStaff(staff);setEditStaffPerms(staff.permissions||[]);setEditStaffPin('');}} className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1"><Pencil size={11}/> Düzenle</button>
                          {staff.id!==currentStaff.id&&<button onClick={()=>deleteDoc(doc(db,'staff',staff.id))} className="text-zinc-700 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-800"><Trash2 size={12}/></button>}
                        </div>
                      </div>
                      {staff.role==='admin'&&<div className="mt-2 pt-2 border-t border-zinc-800/60"><span className="text-[10px] text-yellow-500/70 font-bold">🔑 Tam erişim</span></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FİŞ TASARIMI ════════════════════════════════════════════ */}
        {activePage==='settings'&&(
          <div className="flex flex-col w-full overflow-hidden">
            <div className="border-b border-zinc-800 bg-zinc-900 px-5 pt-3 flex items-center justify-between shrink-0">
              <div className="flex gap-1">
                {([['fis','🖨️ Fiş Tasarımı'],['parasut','📊 Paraşüt']] as const).map(([tab,label])=>(
                  <button key={tab} onClick={()=>setSettingsTab(tab)} className={'px-4 py-3 font-bold text-sm border-b-2 transition-all mr-1 '+(settingsTab===tab?'border-emerald-500 text-emerald-400':'border-transparent text-zinc-500 hover:text-zinc-300')}>{label}</button>
                ))}
              </div>
              <h1 className="text-sm font-black text-zinc-500 mb-2 flex items-center gap-2"><Settings size={14}/> Ayarlar</h1>
            </div>
            {settingsTab==='parasut'&&(
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-xl space-y-4">
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Firma Ünvanı *</label><input value={parasutFirm} onChange={e=>{setParasutFirm(e.target.value);localStorage.setItem('parasutFirm',e.target.value);}} placeholder="MERKEZ ŞUBE TİC. LTD. ŞTİ." className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Çıkış Deposu</label><input value={parasutDepot} onChange={e=>{setParasutDepot(e.target.value);localStorage.setItem('parasutDepot',e.target.value);}} placeholder="Merkez Depo" className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none text-sm"/></div>
                  <button onClick={()=>handleParasutExport(sales.filter(s=>s.method!=='Tahsilat'),'parasut_tum.xlsx')} disabled={!parasutReady} className={'w-full bg-blue-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 text-sm '+(parasutReady?'hover:bg-blue-500':'opacity-40 cursor-not-allowed')}><FileSpreadsheet size={15}/> Tüm Satışları Aktar</button>
                </div>
              </div>
            )}
            {settingsTab==='fis'&&(
              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* SOL PANEL */}
                <div className="w-full lg:w-[340px] max-h-[55vh] lg:max-h-none shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="text-sm font-black flex items-center gap-2"><Palette size={14} className="text-emerald-500"/> Fiş Tasarımı</h2>
                      <p className="text-zinc-600 text-xs flex items-center gap-1 mt-0.5"><Cloud size={10}/> Buluta kaydedilir · tüm cihazlarda senkron</p>
                    </div>
                    <button onClick={()=>setDraftSettings({...DEFAULT_SETTINGS})} className="text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-lg border border-zinc-700" title="Sıfırla"><RotateCcw size={11}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">

                    {/* KAĞIT */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-zinc-400 uppercase">📏 Kağıt</h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(PAPER_LABELS) as PaperSize[]).map(ps=><button key={ps} onClick={()=>upDraft('paperSize',ps)} className={'py-2 px-2 rounded-xl text-xs font-bold border transition-all text-left '+(draftSettings.paperSize===ps?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{PAPER_LABELS[ps]}</button>)}
                      </div>
                    </div>

                    {/* LOGO */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-zinc-400 uppercase">🖼 Logo</h3>
                      <input type="file" id="logoInput" accept="image/*" style={{display:'none'}} onChange={(e)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=(ev)=>upDraft('logoBase64',ev.target?.result as string);reader.readAsDataURL(file);e.target.value='';}}/>
                      <button type="button" onClick={()=>document.getElementById('logoInput')?.click()} className="w-full bg-zinc-800 hover:bg-zinc-700 border border-dashed border-zinc-600 text-zinc-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">{draftSettings.logoBase64?'Logoyu Değiştir':'Logo Yükle (PNG/JPG)'}</button>
                      {draftSettings.logoBase64&&(
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2"><img src={draftSettings.logoBase64} alt="logo" style={{width:36,height:'auto',maxHeight:36,objectFit:'contain'}}/><button type="button" onClick={()=>upDraft('logoBase64',null)} className="ml-auto text-red-400 text-xs font-bold">Kaldır</button></div>
                          <SliderField label="Logo Boyutu" value={draftSettings.logoSize??60} onChange={v=>upDraft('logoSize',v)} min={20} max={200} step={5}/>
                          <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Logo Hizalama</label><div className="grid grid-cols-3 gap-1">{(['left','center','right'] as const).map(a=><button key={a} onClick={()=>upDraft('logoAlign',a)} className={'py-1.5 rounded-lg text-xs font-bold border '+(draftSettings.logoAlign===a?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{a==='left'?'Sol':a==='center'?'Orta':'Sağ'}</button>)}</div></div>
                        </div>
                      )}
                    </div>

                    {/* FİRMA BİLGİLERİ */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-zinc-400 uppercase">🏢 Firma</h3>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Şube Adı</label><input value={draftSettings.companyName} onChange={e=>upDraft('companyName',e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded-xl outline-none text-sm"/></div>
                      <SliderField label="Firma Adı Boyutu" value={draftSettings.companyNameFontSize??22} onChange={v=>upDraft('companyNameFontSize',v)} min={10} max={60} step={1}/>
                      <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Firma Adı Hizalama</label><div className="grid grid-cols-3 gap-1">{(['left','center','right'] as const).map(a=><button key={a} onClick={()=>upDraft('companyNameAlign',a)} className={'py-1.5 rounded-lg text-xs font-bold border '+(draftSettings.companyNameAlign===a?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{a==='left'?'Sol':a==='center'?'Orta':'Sağ'}</button>)}</div></div>
                      <div className="flex items-center justify-between py-2 border-b border-zinc-800/40"><span className="text-zinc-300 text-xs">Tek satıra sığdır</span><button onClick={()=>upDraft('companyNameSingleLine',!draftSettings.companyNameSingleLine)} className={'w-10 h-5 rounded-full relative transition-all '+(draftSettings.companyNameSingleLine?'bg-emerald-500':'bg-zinc-700')}><span className={'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all '+(draftSettings.companyNameSingleLine?'left-5':'left-0.5')}/></button></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Alt Başlık</label><input value={draftSettings.companySubtitle} onChange={e=>upDraft('companySubtitle',e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded-xl outline-none text-sm"/></div>
                      <SliderField label="Alt Başlık Boyutu" value={draftSettings.subtitleFontSize??9} onChange={v=>upDraft('subtitleFontSize',v)} min={6} max={18} step={1}/>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Adres</label><input value={draftSettings.address} onChange={e=>upDraft('address',e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded-xl outline-none text-sm" placeholder="Cad. No..."/></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Telefon</label><input value={draftSettings.phone} onChange={e=>upDraft('phone',e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded-xl outline-none text-sm"/></div>
                    </div>

                    {/* BOŞLUKLAR */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-zinc-400 uppercase">📐 Boşluklar & Kompaktlık</h3>
                      <SliderField label="Yatay Kenar Boşluğu" value={draftSettings.paddingH??8} onChange={v=>upDraft('paddingH',v)} min={0} max={30} step={1}/>
                      <SliderField label="Dikey Kenar Boşluğu" value={draftSettings.paddingV??8} onChange={v=>upDraft('paddingV',v)} min={0} max={30} step={1}/>
                      <SliderField label="Satır Aralığı" value={draftSettings.rowPaddingY??2} onChange={v=>upDraft('rowPaddingY',v)} min={0} max={12} step={1}/>
                      <SliderField label="Bölüm Arası Boşluk" value={draftSettings.sectionGap??5} onChange={v=>upDraft('sectionGap',v)} min={0} max={20} step={1}/>
                    </div>

                    {/* ÇİZGİLER */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-zinc-400 uppercase">─ Çizgiler</h3>
                      <DivSelect label="Başlık Çizgisi" value={draftSettings.headerDivider??'solid'} onChange={v=>upDraft('headerDivider',v)}/>
                      <DivSelect label="Ürün Arası Çizgi" value={draftSettings.itemDivider??'none'} onChange={v=>upDraft('itemDivider',v)}/>
                      <DivSelect label="Toplamlar Çizgisi" value={draftSettings.totalsDivider??'solid'} onChange={v=>upDraft('totalsDivider',v)}/>
                      <DivSelect label="Alt Yazı Çizgisi" value={draftSettings.footerDivider??'dashed'} onChange={v=>upDraft('footerDivider',v)}/>
                    </div>

                    {/* KENARLIK & YAZI */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-zinc-400 uppercase">Görünüm</h3>
                      <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Dış Kenarlık</label><div className="grid grid-cols-3 gap-1">{(['thick','thin','none'] as const).map(b=><button key={b} onClick={()=>upDraft('borderStyle',b)} className={'py-1.5 rounded-lg text-xs font-bold border '+(draftSettings.borderStyle===b?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{b==='thick'?'Kalın':b==='thin'?'İnce':'Yok'}</button>)}</div></div>
                      <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Yazı Boyutu</label><div className="grid grid-cols-3 gap-1">{(['small','normal','large'] as const).map(f=><button key={f} onClick={()=>upDraft('fontSize',f)} className={'py-1.5 rounded-lg text-xs font-bold border '+(draftSettings.fontSize===f?'bg-emerald-500 text-zinc-950 border-emerald-500':'bg-zinc-800 text-zinc-400 border-zinc-700')}>{f==='small'?'Küçük':f==='normal'?'Normal':'Büyük'}</button>)}</div></div>
                    </div>

                    {/* ALT YAZI */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-zinc-400 uppercase">Alt Yazı</h3>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">1. Satır</label><input value={draftSettings.footerLine1} onChange={e=>upDraft('footerLine1',e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded-xl outline-none text-sm"/></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">2. Satır</label><input value={draftSettings.footerLine2} onChange={e=>upDraft('footerLine2',e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded-xl outline-none text-sm"/></div>
                    </div>

                    {/* GÖSTER/GİZLE */}
                    <div>
                      <h3 className="text-xs font-black text-zinc-400 uppercase mb-2">👁 Göster / Gizle</h3>
                      <Toggle label="Müşteri Kutusu" value={draftSettings.showCustomerBox??true} onChange={v=>upDraft('showCustomerBox',v)}/>
                      <Toggle label="Müşteri Vergi No" value={draftSettings.showTaxNo} onChange={v=>upDraft('showTaxNo',v)}/>
                      <Toggle label="Fiş No" value={draftSettings.showReceiptNo??true} onChange={v=>upDraft('showReceiptNo',v)}/>
                      <Toggle label="Kasiyer" value={draftSettings.showCashier??true} onChange={v=>upDraft('showCashier',v)}/>
                      <Toggle label="Saat" value={draftSettings.showTime??true} onChange={v=>upDraft('showTime',v)}/>
                      <Toggle label="Firma Adresi" value={draftSettings.showAddress} onChange={v=>upDraft('showAddress',v)}/>
                      <Toggle label="Firma Telefonu" value={draftSettings.showPhone} onChange={v=>upDraft('showPhone',v)}/>
                      <Toggle label="Ürün KDV" value={draftSettings.showItemTax} onChange={v=>upDraft('showItemTax',v)}/>
                    </div>

                  </div>
                  <div className="p-3 border-t border-zinc-800 shrink-0 space-y-2">
                    <button onClick={saveRSettings} className={'w-full py-3 rounded-2xl font-black flex items-center justify-center gap-2 text-sm '+(settingsSaved?'bg-emerald-400 text-zinc-950':'bg-emerald-500 text-zinc-950 hover:bg-emerald-400')}>
                      {settingsSaved?<><CheckCircle size={14}/> Kaydedildi!</>:<><Cloud size={14}/> Buluta Kaydet</>}
                    </button>
                    <button onClick={()=>{setPrintSale(demoSale);setTimeout(()=>window.print(),100);}} className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-sm"><Printer size={12}/> Test Fişi Yazdır</button>
                  </div>
                </div>

                {/* SAĞ PANEL: ÖNİZLEME */}
                <div className="flex-1 overflow-y-auto bg-zinc-950 p-6">
                  <div className="flex items-center gap-2 mb-4"><Eye size={12} className="text-emerald-500"/><span className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Önizleme</span><span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-lg border border-zinc-700 ml-2">{PAPER_LABELS[draftSettings.paperSize]}</span></div>
                  <div className="bg-zinc-800/30 rounded-2xl p-4 flex justify-center">
                    <div className="bg-white rounded-lg shadow-2xl shadow-black/60 overflow-hidden" style={{width:Math.min(PAPER_WIDTHS[draftSettings.paperSize],560)+'px'}}>
                      <ReceiptTemplate sale={demoSale} settings={draftSettings} preview={true}/>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        </div>
      </main>

      {/* ═══ MODALLER ═════════════════════════════════════════════════════ */}

      {/* KİLO GİRME MODALI */}
      {weightModal&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[500] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
              <div><h3 className="text-xl font-black text-white flex items-center gap-2"><Scale className="text-blue-400" size={20}/> Tartı Ölçüsü</h3><p className="text-blue-400 font-bold text-sm mt-0.5">{weightModal.name}</p><p className="text-zinc-500 text-xs">₺{weightModal.grossPrice}/kg</p></div>
              <button onClick={()=>setWeightModal(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Ağırlık (kg)</label>
                <input type="number" step="0.001" min="0.001" autoFocus value={weightInput} onChange={e=>setWeightInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmWeight()} className="w-full bg-zinc-950 border-2 border-blue-500 text-white p-4 rounded-2xl outline-none text-4xl font-black text-center tracking-tight" placeholder="0.000"/>
                {weightInput&&parseFloat(weightInput.replace(',','.'))*weightModal.grossPrice>0&&(
                  <div className="text-center">
                    <span className="text-blue-400 font-bold text-sm">≈ </span>
                    <span className="text-white font-black text-2xl">₺{(parseFloat(weightInput.replace(',','.'))*weightModal.grossPrice).toFixed(2)}</span>
                  </div>
                )}
              </div>
              {/* Hızlı butonlar */}
              <div className="grid grid-cols-4 gap-2">
                {[0.25,0.5,1,1.5,2,3,5,10].map(w=>(
                  <button key={w} onClick={()=>setWeightInput(String(w))} className={'py-2.5 rounded-xl font-black text-sm border transition-all '+(parseFloat(weightInput)===w?'bg-blue-500 text-white border-blue-500':'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-blue-500 hover:text-blue-400')}>{w}kg</button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setWeightModal(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-3.5 rounded-2xl font-bold border border-zinc-700">İptal</button>
                <button onClick={confirmWeight} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"><Scale size={17}/> Sepete Ekle</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERESİYE MODAL */}
      {isVeresiyeOpen&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[32px] w-full max-w-[460px] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50"><h3 className="text-xl font-black text-emerald-500 flex items-center gap-2"><Users size={20}/> Cari Seçimi</h3><button onClick={()=>setIsVeresiyeOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button></div>
            <div className="p-6"><p className="text-zinc-400 mb-4">Toplam <span className="text-white font-black text-2xl">₺{finalTotal.toFixed(2)}</span> hangi cariye?</p><select value={cartCustomer} onChange={e=>setCartCustomer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-3.5 rounded-2xl text-white outline-none mb-5 text-base focus:border-emerald-500"><option value="">-- Müşteri Seçin --</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} (₺{(c.balance||0).toFixed(2)})</option>)}</select><button onClick={()=>finishSale('Veresiye')} className="w-full bg-emerald-500 text-zinc-950 font-black py-4 rounded-2xl text-lg shadow-lg shadow-emerald-500/20">SATIŞI ONAYLA & BORÇ YAZ</button></div>
          </div>
        </div>
      )}

      {/* SATIŞ TAMAMLANDI */}
      {lastSale&&(
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200]">
          <div className="bg-zinc-900 p-10 rounded-[40px] text-center border-2 border-emerald-500/50 shadow-2xl">
            <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/40"><CheckCircle size={40} className="text-zinc-950"/></div>
            <h2 className="text-2xl font-black mb-2">Satış Tamamlandı!</h2>
            <p className="text-zinc-500 mb-6">Kasiyer: <strong className="text-white">{lastSale.staffName}</strong></p>
            <div className="flex flex-col gap-3">
              <button onClick={()=>{setPrintSale(lastSale);setTimeout(()=>window.print(),100);}} className="bg-white text-zinc-950 px-10 py-3.5 rounded-2xl font-black text-lg flex items-center gap-3 mx-auto hover:bg-zinc-200"><Printer size={18}/> FİŞ YAZDIR</button>
              <button onClick={()=>setLastSale(null)} className="text-zinc-500 hover:text-white font-bold mt-2">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ÜRÜN DÜZENLE */}
      {editingProduct&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[24px] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center"><h3 className="text-lg font-black text-white flex items-center gap-2"><Pencil size={14} className="text-emerald-500"/> Ürün Düzenle</h3><button onClick={()=>setEditingProduct(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-xl"><X size={16}/></button></div>
            <form onSubmit={handleSaveEdit} className="p-5 grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase">Ürün Adı</label><input required value={editForm.name} onChange={e=>setEditForm((p:any)=>({...p,name:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
              <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Barkod</label><input value={editForm.barcode} onChange={e=>setEditForm((p:any)=>({...p,barcode:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
              <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={editForm.category} onChange={e=>setEditForm((p:any)=>({...p,category:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"><option value="">— Seç —</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-bold text-blue-400 uppercase">Alış Fiyatı</label><input type="number" step="0.01" value={editForm.costPrice} onChange={e=>setEditForm((p:any)=>({...p,costPrice:e.target.value}))} className="w-full bg-blue-950/20 border border-blue-900 p-2.5 rounded-xl text-blue-300 outline-none text-sm"/></div>
              <div className="space-y-1"><label className="text-xs font-bold text-emerald-400 uppercase">NET Satış</label><input type="number" step="0.01" value={editForm.netPrice} onChange={e=>setEditForm((p:any)=>({...p,netPrice:e.target.value}))} className="w-full bg-zinc-950 border border-emerald-900 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
              <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">KDV %</label><select value={editForm.taxRate} onChange={e=>setEditForm((p:any)=>({...p,taxRate:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"><option value="0">0</option><option value="1">1</option><option value="10">10</option><option value="20">20</option></select></div>
              <div className="space-y-1"><label className="text-xs font-bold text-white uppercase">Brüt Fiyat</label><input type="number" step="0.01" value={editForm.grossPrice} onChange={e=>setEditForm((p:any)=>({...p,grossPrice:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm" placeholder="Boş = NET×KDV"/></div>
              <div className="space-y-1"><label className="text-xs font-bold text-violet-400 uppercase">Stok</label><input type="number" step={editForm.byWeight?"0.001":"1"} value={editForm.stock} onChange={e=>setEditForm((p:any)=>({...p,stock:e.target.value}))} className="w-full bg-violet-950/20 border border-violet-900 p-2.5 rounded-xl text-violet-300 outline-none text-sm"/></div>
              <div className="col-span-2"><div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-xl p-3"><div className="flex items-center gap-2"><Scale size={14} className="text-blue-400"/><span className="text-blue-300 font-bold text-sm">Tartı ile Satış (kg)</span></div><button type="button" onClick={()=>setEditForm((p:any)=>({...p,byWeight:!p.byWeight}))} className={'w-10 h-5 rounded-full relative transition-all '+(editForm.byWeight?'bg-blue-500':'bg-zinc-700')}><span className={'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all '+(editForm.byWeight?'left-5':'left-0.5')}/></button></div></div>
              <div className="col-span-2 flex gap-3 pt-2 border-t border-zinc-800"><button type="button" onClick={()=>setEditingProduct(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-2.5 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="flex-1 bg-emerald-500 text-zinc-950 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 text-sm"><Save size={13}/> Kaydet</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MÜŞTERİ DÜZENLE */}
      {editingCustomer&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center"><h3 className="text-lg font-black text-white flex items-center gap-2"><Pencil size={14} className="text-emerald-500"/> Müşteri Düzenle</h3><button onClick={()=>setEditingCustomer(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-xl"><X size={16}/></button></div>
            <form onSubmit={handleSaveCust} className="p-5 space-y-3">
              <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Ad</label><input required value={editCustForm.name} onChange={e=>setEditCustForm((p:any)=>({...p,name:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Vergi No</label><input value={editCustForm.taxNum} onChange={e=>setEditCustForm((p:any)=>({...p,taxNum:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Telefon</label><input value={editCustForm.phone} onChange={e=>setEditCustForm((p:any)=>({...p,phone:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"/></div>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Kategori</label><select value={editCustForm.category} onChange={e=>setEditCustForm((p:any)=>({...p,category:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm"><option value="">— Seç —</option>{custCategories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Not</label><textarea value={editCustForm.note} onChange={e=>setEditCustForm((p:any)=>({...p,note:e.target.value}))} rows={2} className="w-full bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-white outline-none text-sm resize-none" placeholder="Müşteri notu..."/></div>
              <div className="flex gap-3 pt-2 border-t border-zinc-800"><button type="button" onClick={()=>setEditingCustomer(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-2.5 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="flex-1 bg-emerald-500 text-zinc-950 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 text-sm"><Save size={13}/> Kaydet</button></div>
            </form>
          </div>
        </div>
      )}

      {/* PERSONEL DÜZENLE */}
      {editingStaff&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[28px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center shrink-0"><div><h3 className="text-xl font-black text-white flex items-center gap-2"><Shield size={16} className="text-emerald-500"/> {editingStaff.name}</h3><p className="text-zinc-500 text-sm">Yetki Düzenle</p></div><button onClick={()=>setEditingStaff(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={16}/></button></div>
            <form onSubmit={handleUpdateStaff} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Yeni PIN (boş = değişmez)</label><input type="password" maxLength={6} value={editStaffPin} onChange={e=>setEditStaffPin(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl outline-none focus:border-emerald-500 text-center tracking-widest font-black text-xl" placeholder="Yeni PIN"/></div>
                {editingStaff.role==='admin'?(
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center"><p className="text-yellow-400 font-black">🔑 Admin — Tam Erişim</p></div>
                ):(
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><span className="text-zinc-300 font-bold text-sm">{editStaffPerms.length} / {ALL_PERMISSIONS.length} yetki</span><div className="flex gap-2"><button type="button" onClick={()=>setEditStaffPerms(ALL_PERMISSIONS.map(p=>p.key))} className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1.5 rounded-lg">Tümü</button><button type="button" onClick={()=>setEditStaffPerms([])} className="text-xs text-red-400 font-bold bg-red-500/10 px-2.5 py-1.5 rounded-lg">Temizle</button></div></div>
                    <div className="space-y-1.5">
                      {ALL_PERMISSIONS.map(perm=>{const isOn=editStaffPerms.includes(perm.key);return(
                        <div key={perm.key} onClick={()=>togglePerm(editStaffPerms,perm.key,setEditStaffPerms)} className={'flex items-center justify-between p-2.5 rounded-xl cursor-pointer border '+(isOn?'bg-emerald-500/10 border-emerald-500/30':'bg-zinc-900 border-zinc-800')}>
                          <div className="flex items-center gap-2.5"><span>{perm.icon}</span><span className={'text-sm '+(isOn?'text-white':'text-zinc-500')}>{perm.label}</span></div>
                          <div className={'w-10 h-5 rounded-full relative transition-all shrink-0 '+(isOn?'bg-emerald-500':'bg-zinc-700')}><span className={'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all '+(isOn?'left-5':'left-0.5')}/></div>
                        </div>
                      );})}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-zinc-800 shrink-0 flex gap-3"><button type="button" onClick={()=>setEditingStaff(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold border border-zinc-700 text-sm">İptal</button><button type="submit" className="flex-1 bg-emerald-500 text-zinc-950 py-3 rounded-xl font-black flex items-center justify-center gap-2 text-sm"><Save size={14}/> Kaydet</button></div>
            </form>
          </div>
        </div>
      )}

      {/* BÖLÜNMÜŞ ÖDEME */}
      {splitModal&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center"><div><h3 className="text-xl font-black text-white flex items-center gap-2"><SplitSquareHorizontal size={18} className="text-blue-400"/> Fiyatı Böl</h3><p className="text-zinc-500 text-sm">Toplam: <span className="text-white font-black">₺{finalTotal.toFixed(2)}</span></p></div><button onClick={()=>setSplitModal(false)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={16}/></button></div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-black text-emerald-400 uppercase">💵 Nakit</label><input type="number" step="0.01" value={splitNakit} onChange={e=>{setSplitNakit(e.target.value);setSplitKart((finalTotal-(parseFloat(e.target.value)||0)).toFixed(2));}} placeholder="0.00" className="w-full bg-zinc-950 border border-emerald-800 text-white p-3 rounded-2xl outline-none focus:border-emerald-500 text-2xl font-black text-center"/></div>
                <div className="space-y-1"><label className="text-xs font-black text-blue-400 uppercase">💳 Kart</label><input type="number" step="0.01" value={splitKart} onChange={e=>{setSplitKart(e.target.value);setSplitNakit((finalTotal-(parseFloat(e.target.value)||0)).toFixed(2));}} placeholder="0.00" className="w-full bg-zinc-950 border border-blue-800 text-white p-3 rounded-2xl outline-none focus:border-blue-500 text-2xl font-black text-center"/></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[25,50,75].map(pct=>{const amt=parseFloat((finalTotal*pct*0.01).toFixed(2));return(<button key={pct} onClick={()=>{setSplitNakit(amt.toFixed(2));setSplitKart((finalTotal-amt).toFixed(2));}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-2 rounded-xl text-xs font-bold border border-zinc-700">%{pct} Nakit</button>);})}
                <button onClick={()=>{setSplitNakit(finalTotal.toFixed(2));setSplitKart('0');}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-2 rounded-xl text-xs font-bold border border-zinc-700">Tamamı</button>
              </div>
              <div className={'rounded-xl p-3 flex items-center justify-between border '+(splitOk?'bg-emerald-500/10 border-emerald-500/30':'bg-red-500/10 border-red-500/30')}>
                <span className={'font-bold text-sm '+(splitOk?'text-emerald-400':'text-red-400')}>{splitOk?'✅ Tutar doğru':'❌ Eşleşmiyor'}</span>
                <span className="font-black text-white">₺{((parseFloat(splitNakit)||0)+(parseFloat(splitKart)||0)).toFixed(2)} / ₺{finalTotal.toFixed(2)}</span>
              </div>
              <button onClick={handleSplitSale} disabled={!splitOk} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm"><SplitSquareHorizontal size={16}/> ÖDEMEYI TAMAMLA</button>
            </div>
          </div>
        </div>
      )}

      {/* MÜŞTERİ DETAY MODAL */}
      {selectedCustomer&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[32px] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3"><h2 className="text-2xl font-black text-white">{selectedCustomer.name}</h2>{selectedCustomer.category&&<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:custCatColor(selectedCustomer.category)+'33',color:custCatColor(selectedCustomer.category)}}>{selectedCustomer.category}</span>}</div>
                <div className="flex gap-2 mt-1"><span className="flex items-center gap-1 text-zinc-400 text-xs bg-zinc-800 px-2 py-0.5 rounded"><Phone size={10}/> {selectedCustomer.phone||'-'}</span><span className="text-zinc-400 text-xs bg-zinc-800 px-2 py-0.5 rounded">V: {selectedCustomer.taxNum||'-'}</span></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right"><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Bakiye</p><div className={'text-2xl font-black font-mono '+((selectedCustomer.balance||0)>0?'text-red-500':(selectedCustomer.balance||0)<0?'text-emerald-500':'text-zinc-600')}>{(selectedCustomer.balance||0)>0?'+₺'+((selectedCustomer.balance||0).toFixed(2)):(selectedCustomer.balance||0)<0?'-₺'+(Math.abs(selectedCustomer.balance||0).toFixed(2)):'₺0.00'}</div></div>
                <button onClick={()=>setSelectedCustomer(null)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-xl"><X size={18}/></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px bg-zinc-800 border-b border-zinc-800 shrink-0"><div className="bg-zinc-900 p-3 text-center"><p className="text-zinc-500 text-xs font-bold uppercase mb-0.5">Toplam Alış</p><p className="text-xl font-black text-white">₺{custTotalSpend.toFixed(2)}</p></div><div className="bg-zinc-900 p-3 text-center"><p className="text-zinc-500 text-xs font-bold uppercase mb-0.5">Fatura</p><p className="text-xl font-black text-white">{customerSales.length}</p></div><div className="bg-zinc-900 p-3 text-center"><p className="text-zinc-500 text-xs font-bold uppercase mb-0.5">Tahsilat</p><p className="text-xl font-black text-emerald-400">₺{custTotalCollected.toFixed(2)}</p></div></div>
            <div className="border-b border-zinc-800 flex items-center shrink-0">
              {(['sales','history','orders'] as const).map(tab=><button key={tab} onClick={()=>setCustDetailTab(tab)} className={'px-5 py-3 font-bold text-sm border-b-2 transition-all '+(custDetailTab===tab?'border-emerald-500 text-emerald-400':'border-transparent text-zinc-500 hover:text-zinc-300')}>{tab==='sales'?'Faturalar':tab==='history'?'Ürün Geçmişi':'Siparişler'}</button>)}
              {custDetailTab==='sales'&&<div className="ml-auto flex items-center gap-2 px-4">
                <input type="date" value={filterStart} onChange={e=>setFilterStart(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none"/>
                <span className="text-zinc-600">—</span>
                <input type="date" value={filterEnd} onChange={e=>setFilterEnd(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none"/>
                {filteredSales.length>0&&<button onClick={toggleAll} className={'flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border '+(allFiltSel?'bg-emerald-500/20 border-emerald-500/50 text-emerald-400':'bg-zinc-800 border-zinc-700 text-zinc-400')}>{allFiltSel?<SquareCheck size={12}/>:<Square size={12}/>}{allFiltSel?'Kaldır':'Seç('+(filteredSales.length)+')'}</button>}
              </div>}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {custDetailTab==='sales'&&(
                <div className="space-y-2">
                  {filteredSales.length===0&&<div className="text-center text-zinc-600 py-10 font-bold">Fatura bulunamadı.</div>}
                  {filteredSales.map((sale:any)=>{const isSel=selectedSaleIds.has(sale.id);return(
                    <div key={sale.id} className={'border rounded-xl overflow-hidden transition-all '+(isSel?'border-emerald-500 bg-emerald-500/5':'border-zinc-800 bg-zinc-950')}>
                      <div className="flex items-center gap-2.5 p-3 cursor-pointer" onClick={()=>toggleSale(sale.id)}>
                        <div className={'w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 '+(isSel?'bg-emerald-500 border-emerald-500':'border-zinc-600')}>{isSel&&<CheckCircle size={11} className="text-zinc-950"/>}</div>
                        <div className="bg-zinc-800 px-2.5 py-1.5 rounded-lg text-center shrink-0"><p className="text-white font-black text-xs">#{sale.id?.slice(-5).toUpperCase()}</p></div>
                        <div className="flex-1 min-w-0"><p className="text-white font-bold text-sm">{sale.date}</p><span className={'text-[10px] font-bold px-1.5 py-0.5 rounded '+(sale.method==='Veresiye'?'bg-orange-500/20 text-orange-400':sale.method==='Nakit'?'bg-emerald-500/20 text-emerald-400':'bg-blue-500/20 text-blue-400')}>{sale.method}</span></div>
                        <p className={'text-lg font-black '+(isSel?'text-emerald-400':'text-white')}>₺{(sale.total||0).toFixed(2)}</p>
                        <button onClick={ev=>{ev.stopPropagation();setPrintSale(sale);setTimeout(()=>window.print(),100);}} className="bg-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1 shrink-0"><Printer size={10}/> Yazdır</button>
                      </div>
                      <div className="border-t border-zinc-800/50 px-3 pb-2"><div className="flex flex-wrap gap-1 mt-1.5">{(sale.items||[]).map((item:any,i:number)=><span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{item.name} ×{typeof item.qty==='number'&&item.qty%1!==0?item.qty.toFixed(2):item.qty}</span>)}</div></div>
                    </div>
                  );})}
                </div>
              )}
              {custDetailTab==='history'&&(
                <div>
                  {customerProductHistory.length===0?<div className="text-center text-zinc-600 py-10 font-bold">Ürün geçmişi yok.</div>:(
                    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                      <table className="w-full text-sm"><thead className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase"><tr><th className="p-3 text-left">Ürün</th><th className="p-3 text-center">Adet</th><th className="p-3 text-right">Harcama</th><th className="p-3 text-center">Alım</th></tr></thead>
                      <tbody className="divide-y divide-zinc-800/50">{customerProductHistory.map((item,i)=><tr key={i} className="hover:bg-zinc-800/30"><td className="p-3 font-bold text-emerald-400 text-sm">{item.name}</td><td className="p-3 text-center"><span className="bg-emerald-500 text-zinc-950 font-black text-xs px-2 py-0.5 rounded-full">{typeof item.totalQty==='number'&&item.totalQty%1!==0?item.totalQty.toFixed(2):item.totalQty}</span></td><td className="p-3 text-right font-black text-white">₺{item.totalSpent.toFixed(2)}</td><td className="p-3 text-center text-zinc-400">{item.dates.length}</td></tr>)}</tbody></table>
                    </div>
                  )}
                </div>
              )}
              {custDetailTab==='orders'&&(
                <div className="space-y-2">
                  {orders.filter(o=>o.customerName===selectedCustomer.name).length===0?<div className="text-center text-zinc-600 py-10 font-bold">Sipariş yok.</div>:
                  orders.filter(o=>o.customerName===selectedCustomer.name).slice().reverse().map((order:any)=>{const sc=statusConfig[order.status]||statusConfig['bekliyor'];return(
                    <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="font-black text-white text-sm">#{order.id?.slice(-5).toUpperCase()}</span><span className={'text-xs font-bold px-2 py-0.5 rounded-full '+(sc.bg)+' '+(sc.color)}>{sc.label}</span></div><span className="font-black text-white">₺{(order.total||0).toFixed(2)}</span></div>
                      <div className="text-zinc-600 text-xs mt-1">{order.createdAt}</div>
                    </div>
                  );})}
                </div>
              )}
            </div>
            {selectedSaleIds.size>0&&custDetailTab==='sales'?(
              <div className="p-4 border-t-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-transparent shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><div className="bg-emerald-500 text-zinc-950 font-black text-sm w-8 h-8 rounded-xl flex items-center justify-center">{selectedSaleIds.size}</div><div><p className="text-emerald-400 font-black text-sm">{selectedSaleIds.size} Fatura</p><p className="text-zinc-400 text-xs">₺{selTotal.toFixed(2)}</p></div></div>
                  <div className="flex gap-2"><button onClick={()=>setSelectedSaleIds(new Set())} className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-xl font-bold border border-zinc-700 text-xs flex items-center gap-1"><X size={10}/> Temizle</button><button onClick={handleMergedXlsx} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl font-black flex items-center gap-1.5 text-xs"><FileSpreadsheet size={11}/> Paraşüt</button><button onClick={handleMergedPrint} className="bg-white text-zinc-950 px-3 py-2 rounded-xl font-black flex items-center gap-1.5 text-xs"><Printer size={11}/> Yazdır</button></div>
                </div>
              </div>
            ):(
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex gap-2 shrink-0">
                <button onClick={()=>handleTahsilat(selectedCustomer)} className="flex-1 bg-emerald-500 text-zinc-950 font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 text-sm"><Wallet size={14}/> TAHSİLAT AL</button>
                <button onClick={()=>{openEditCustomer(selectedCustomer);setSelectedCustomer(null);}} className="bg-zinc-800 text-zinc-300 px-4 py-3 rounded-2xl font-bold border border-zinc-700 flex items-center gap-1.5 text-sm"><Pencil size={12}/> Düzenle</button>
                <button onClick={()=>handleDeleteCustomer(selectedCustomer)} className="bg-zinc-800 text-zinc-400 px-4 py-3 rounded-2xl font-bold border border-zinc-700 flex items-center gap-1.5 text-sm"><Trash2 size={12}/> Sil</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>

    {/* ═══ YAZDIR ═══════════════════════════════════════════════════════════ */}
    <div className="hidden print:block">
      {printQuote&&!activePrintData?(
        <div style={{maxWidth:'680px',margin:'0 auto',padding:'20px',background:'white',color:'black',fontFamily:"'Courier New',Courier,monospace",fontSize:'12px',border:'2px solid black',boxSizing:'border-box'}}>
          <div style={{paddingBottom:'10px',marginBottom:'10px',borderBottom:'2px solid black'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div><div style={{fontSize:'20px',fontWeight:900,textTransform:'uppercase'}}>{receiptSettings.companyName}</div><div style={{fontSize:'9px',fontWeight:700,color:'#666',marginTop:2}}>SATIŞ TEKLİFİ</div></div>
              <div style={{textAlign:'right',fontSize:'9px'}}><div>{printQuote.date?.split(' ')[0]}</div><div>#{printQuote.id?.slice(-6).toUpperCase()}</div>{printQuote.staffName&&<div style={{color:'#888'}}>{printQuote.staffName}</div>}</div>
            </div>
          </div>
          {printQuote.customerName&&<div style={{border:'1px solid #ccc',borderRadius:2,padding:'6px',marginBottom:'8px',background:'#fafafa'}}><div style={{fontWeight:900,fontSize:'11px',textTransform:'uppercase'}}>{printQuote.customerName}</div></div>}
          <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'8px'}}>
            <thead><tr style={{borderBottom:'1px solid black'}}><th style={{textAlign:'left',padding:'2px 0',fontSize:'9px',fontWeight:900}}>ÜRÜN</th><th style={{textAlign:'center',fontSize:'9px',fontWeight:900,width:30}}>ADT</th><th style={{textAlign:'right',fontSize:'9px',fontWeight:900,width:50}}>BİRİM</th><th style={{textAlign:'right',fontSize:'9px',fontWeight:900,width:55}}>TUTAR</th></tr></thead>
            <tbody>{(printQuote.items||[]).map((item:any,i:number)=><tr key={i}><td style={{padding:'2px 0',fontWeight:600,fontSize:'10px'}}>{item.name}</td><td style={{padding:'2px 0',textAlign:'center',fontWeight:900,fontSize:'10px'}}>{item.qty}</td><td style={{padding:'2px 0',textAlign:'right',color:'#555',fontSize:'9px'}}>₺{(item.grossPrice||0).toFixed(2)}</td><td style={{padding:'2px 0',textAlign:'right',fontWeight:900,fontSize:'10px'}}>₺{((item.grossPrice||0)*(item.qty||1)).toFixed(2)}</td></tr>)}</tbody>
          </table>
          <div style={{display:'flex',justifyContent:'flex-end'}}><div style={{width:'160px',borderTop:'1px solid black',paddingTop:'3px'}}><div style={{display:'flex',justifyContent:'space-between',color:'#666',marginBottom:1,fontSize:'9px',fontWeight:700}}><span>Ara:</span><span>₺{(printQuote.subTotal||0).toFixed(2)}</span></div>{(printQuote.discountAmount||0)>0&&<div style={{display:'flex',justifyContent:'space-between',color:'#666',marginBottom:1,fontSize:'9px',fontWeight:700}}><span>İsk:</span><span>-₺{(printQuote.discountAmount||0).toFixed(2)}</span></div>}<div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:'16px',marginTop:2}}><span>TOPLAM:</span><span>₺{(printQuote.total||0).toFixed(2)}</span></div></div></div>
          {printQuote.note&&<div style={{marginTop:'8px',padding:'6px',background:'#f3f4f6',borderRadius:2,fontSize:'9px',color:'#555'}}>Not: {printQuote.note}</div>}
          <div style={{marginTop:'8px',textAlign:'center',borderTop:'1px dashed #ccc',paddingTop:'5px',color:'#aaa',fontSize:'8px',fontWeight:700}}><div>Bu bir ön tekliftir.</div><div>{receiptSettings.companyName}</div></div>
        </div>
      ):(
        activePrintData&&<ReceiptTemplate sale={activePrintData} settings={receiptSettings}/>
      )}
    </div>
    </>

);
}

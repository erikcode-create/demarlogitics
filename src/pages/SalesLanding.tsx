import { useState, useEffect } from 'react';
import demarLogo from '@/assets/demar-logo.png';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Truck, Snowflake, Package, Zap, Route, Layers,
  AlertTriangle, MapPin, MessageSquareOff, ShieldAlert,
  CheckCircle2, Shield, Clock, Phone, Mail, ArrowRight,
  FileText, BarChart3, Handshake, Eye, Award,
  Download, MessageCircle, X, Send, Calculator, TrendingUp, Building2, Target
} from 'lucide-react';

// ── Form Schema ──
const formSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(100),
  contactName: z.string().trim().min(1, 'Contact name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().min(1, 'Phone is required').regex(/^[\d\s()+-]{7,20}$/, 'Invalid phone number'),
  origin: z.string().trim().min(1, 'Origin is required').max(100),
  destination: z.string().trim().min(1, 'Destination is required').max(100),
  equipmentType: z.string().min(1, 'Equipment type is required'),
  estimatedWeeklyVolume: z.string().trim().max(50).optional(),
  message: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Lane Heatmap Data ──
const heatmapCities = ['Reno', 'Las Vegas', 'Los Angeles', 'Sacramento', 'Portland', 'Seattle', 'San Francisco', 'Phoenix'];
const heatmapData: Record<string, Record<string, number>> = {
  'Reno': { 'Las Vegas': 8, 'Los Angeles': 9, 'Sacramento': 7, 'Portland': 5, 'Seattle': 4, 'San Francisco': 6, 'Phoenix': 3 },
  'Las Vegas': { 'Reno': 8, 'Los Angeles': 10, 'Sacramento': 5, 'Portland': 3, 'Seattle': 2, 'San Francisco': 4, 'Phoenix': 7 },
  'Los Angeles': { 'Reno': 9, 'Las Vegas': 10, 'Sacramento': 7, 'Portland': 6, 'Seattle': 5, 'San Francisco': 8, 'Phoenix': 9 },
  'Sacramento': { 'Reno': 7, 'Las Vegas': 5, 'Los Angeles': 7, 'Portland': 6, 'Seattle': 5, 'San Francisco': 8, 'Phoenix': 3 },
  'Portland': { 'Reno': 5, 'Las Vegas': 3, 'Los Angeles': 6, 'Sacramento': 6, 'Seattle': 9, 'San Francisco': 5, 'Phoenix': 2 },
  'Seattle': { 'Reno': 4, 'Las Vegas': 2, 'Los Angeles': 5, 'Sacramento': 5, 'Portland': 9, 'San Francisco': 4, 'Phoenix': 2 },
  'San Francisco': { 'Reno': 6, 'Las Vegas': 4, 'Los Angeles': 8, 'Sacramento': 8, 'Portland': 5, 'Seattle': 4, 'Phoenix': 3 },
  'Phoenix': { 'Reno': 3, 'Las Vegas': 7, 'Los Angeles': 9, 'Sacramento': 3, 'Portland': 2, 'Seattle': 2, 'San Francisco': 3 },
};

const getHeatColor = (val: number) => {
  if (val >= 9) return 'bg-destructive/80 text-destructive-foreground';
  if (val >= 7) return 'bg-destructive/50 text-foreground';
  if (val >= 5) return 'bg-primary/40 text-foreground';
  if (val >= 3) return 'bg-primary/20 text-foreground';
  return 'bg-muted text-muted-foreground';
};

// ── Case Studies ──
const caseStudies = [
  {
    industry: 'Food & Beverage',
    icon: Snowflake,
    challenge: 'Major produce distributor faced 22% carrier fallout rate on CA-to-WA reefer lanes during peak harvest season.',
    solution: 'Deployed dedicated carrier pool with backup capacity and real-time temp monitoring across 3 lanes.',
    results: [
      { metric: '99.2%', label: 'On-Time Delivery' },
      { metric: '18%', label: 'Transit Time Reduction' },
      { metric: '$0', label: 'Spoilage Claims' },
    ],
  },
  {
    industry: 'Building Materials',
    icon: Package,
    challenge: 'Regional construction supplier needed consistent flatbed capacity for NV-to-CA deliveries with same-week turnaround.',
    solution: 'Established 5-truck dedicated fleet with priority dispatch and flexible scheduling around jobsite needs.',
    results: [
      { metric: '35%', label: 'Cost Savings vs. Spot' },
      { metric: '4hr', label: 'Avg Response Time' },
      { metric: '100%', label: 'Claim-Free Record' },
    ],
  },
  {
    industry: 'E-Commerce Fulfillment',
    icon: Layers,
    challenge: 'Fast-growing DTC brand needed scalable dry van capacity from Sacramento fulfillment center to 6 Western states.',
    solution: 'Built overflow carrier network with automated dispatch triggers, scaling from 8 to 40+ loads/week seamlessly.',
    results: [
      { metric: '5x', label: 'Volume Scale-Up' },
      { metric: '97%', label: 'Same-Day Pickup' },
      { metric: '12%', label: 'Under Budget' },
    ],
  },
];

// ── Rate Calculator Data ──
const regions = ['Nevada', 'California - South', 'California - North', 'Oregon', 'Washington', 'Arizona'];
const equipmentRates: Record<string, { base: number; perMile: number }> = {
  dry_van: { base: 350, perMile: 2.45 },
  reefer: { base: 500, perMile: 3.10 },
  flatbed: { base: 450, perMile: 2.85 },
  power_only: { base: 250, perMile: 2.15 },
  step_deck: { base: 475, perMile: 3.00 },
};
const regionDistances: Record<string, Record<string, number>> = {
  'Nevada': { 'California - South': 450, 'California - North': 220, 'Oregon': 520, 'Washington': 680, 'Arizona': 480 },
  'California - South': { 'Nevada': 450, 'California - North': 380, 'Oregon': 840, 'Washington': 1100, 'Arizona': 370 },
  'California - North': { 'Nevada': 220, 'California - South': 380, 'Oregon': 460, 'Washington': 620, 'Arizona': 650 },
  'Oregon': { 'Nevada': 520, 'California - South': 840, 'California - North': 460, 'Washington': 175, 'Arizona': 1200 },
  'Washington': { 'Nevada': 680, 'California - South': 1100, 'California - North': 620, 'Oregon': 175, 'Arizona': 1400 },
  'Arizona': { 'Nevada': 480, 'California - South': 370, 'California - North': 650, 'Oregon': 1200, 'Washington': 1400 },
};

// ── Capability Statement Download ──
function downloadCapabilityStatement() {
  const html = `<!DOCTYPE html><html><head><title>Demar Logistics - Capability Statement</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;padding:40px 60px;max-width:900px;margin:0 auto}
h1{font-size:28px;margin-bottom:4px}h2{font-size:18px;color:#D97706;margin:28px 0 12px;border-bottom:2px solid #D97706;padding-bottom:4px}
h3{font-size:14px;margin:12px 0 4px}p,li{font-size:13px;line-height:1.6;color:#333}ul{padding-left:20px;margin:6px 0}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #D97706;padding-bottom:16px;margin-bottom:24px}
.badge{background:#D97706;color:#fff;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:bold}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:12px 0}
.card{border:1px solid #e2e8f0;border-radius:8px;padding:16px}
.card h3{color:#D97706;margin:0 0 6px}
.stats{display:flex;gap:24px;margin:12px 0}.stat{text-align:center}.stat strong{font-size:24px;color:#D97706;display:block}.stat span{font-size:11px;color:#666}
.footer{margin-top:32px;border-top:2px solid #e2e8f0;padding-top:16px;font-size:12px;color:#666;text-align:center}
@media print{body{padding:20px 40px}}</style></head>
<body>
<div class="header"><div><h1>DEMAR LOGISTICS</h1><p>West Coast Freight Brokerage & Capacity Solutions</p></div><span class="badge">CAPABILITY STATEMENT</span></div>
<h2>Company Overview</h2>
<p>Demar Logistics is a specialized freight brokerage focused on West Coast truckload capacity across Nevada, California, Oregon, and Washington. We provide reliable, compliant carrier solutions for shippers requiring consistent coverage on high-demand lanes.</p>
<div class="stats"><div class="stat"><strong>4</strong><span>States Covered</span></div><div class="stat"><strong>500+</strong><span>Vetted Carriers</span></div><div class="stat"><strong>98%</strong><span>On-Time Rate</span></div><div class="stat"><strong>24/7</strong><span>Support Available</span></div></div>
<h2>Core Services</h2>
<div class="grid">
<div class="card"><h3>Dry Van Freight</h3><p>Full truckload capacity across all West Coast lanes. 48' and 53' trailers for standard freight.</p></div>
<div class="card"><h3>Reefer Freight</h3><p>Temperature-controlled transport for perishables, pharmaceuticals, and specialty goods.</p></div>
<div class="card"><h3>Flatbed Freight</h3><p>Open-deck solutions for oversized, construction, and industrial loads.</p></div>
<div class="card"><h3>Power-Only</h3><p>Driver and tractor services for your trailers. Maximize asset utilization.</p></div>
<div class="card"><h3>Dedicated Lanes</h3><p>Committed capacity with consistent drivers for high-volume lanes.</p></div>
<div class="card"><h3>Overflow Capacity</h3><p>Surge capacity with vetted backup carriers when primaries are maxed.</p></div>
</div>
<h2>Coverage Area</h2>
<p>Primary lanes across NV, CA, OR, WA with secondary coverage into AZ and UT. Key corridors include Reno–LA, Las Vegas–Sacramento, Portland–Seattle, and SF–Phoenix.</p>
<h2>Compliance & Safety</h2>
<ul><li>FMCSA-registered broker (MC# on file)</li><li>$75,000 surety bond maintained</li><li>Carrier vetting: authority, insurance, CSA scores, operating history</li><li>Contingent cargo insurance available</li><li>All carriers must meet minimum safety rating requirements</li></ul>
<h2>Differentiators</h2>
<ul><li>West Coast lane specialization with deep market knowledge</li><li>Real-time shipment tracking and proactive communication</li><li>2-hour quote response guarantee</li><li>Dedicated account representatives</li><li>Asset-backed operational expertise</li></ul>
<h2>Contact</h2>
<p><strong>Phone:</strong> (775) 555-0100 &nbsp;|&nbsp; <strong>Email:</strong> capacity@demartransportation.com</p>
<p><strong>Web:</strong> demartransportation.com</p>
<div class="footer"><p>© ${new Date().getFullYear()} Demar Logistics. All rights reserved. This capability statement is confidential.</p></div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => {
      setTimeout(() => win.print(), 500);
    });
  }
}

const scrollToForm = () => {
  document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
};

// ── Chat Widget ──
function ChatWidget() {
  const { setActivities } = useAppContext();
  const [open, setOpen] = useState(false);
  const [chatStep, setChatStep] = useState<'form' | 'sent'>('form');
  const [chatName, setChatName] = useState('');
  const [chatCompany, setChatCompany] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const quickReplies = ['Get a rate quote', 'Check capacity', 'Speak to someone'];

  const handleSend = (msg?: string) => {
    const finalMsg = msg || chatMessage;
    if (!finalMsg.trim()) return;
    setActivities(prev => [...prev, {
      id: crypto.randomUUID(),
      entityId: 'website_chat',
      entityType: 'shipper',
      type: 'note',
      description: `Chat widget: ${chatName || 'Anonymous'} (${chatCompany || 'Unknown'}) - "${finalMsg}"`,
      timestamp: new Date().toISOString(),
      user: 'Website Chat',
    }]);
    setChatStep('sent');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <Card className="w-80 shadow-lg border-border">
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Demar Capacity Team</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80">
              <X className="h-4 w-4" />
            </button>
          </div>
          <CardContent className="p-4">
            {chatStep === 'sent' ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="font-semibold text-sm mb-1">Message Received!</p>
                <p className="text-xs text-muted-foreground">A specialist will respond within 15 minutes.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setChatStep('form'); setChatMessage(''); }}>
                  Send Another
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Hi! How can we help with your freight needs?</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map(q => (
                    <button key={q} onClick={() => handleSend(q)} className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
                <Input placeholder="Your name" value={chatName} onChange={e => setChatName(e.target.value)} className="h-8 text-xs" />
                <Input placeholder="Company" value={chatCompany} onChange={e => setChatCompany(e.target.value)} className="h-8 text-xs" />
                <div className="flex gap-2">
                  <Input placeholder="Type a message..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} className="h-8 text-xs" onKeyDown={e => e.key === 'Enter' && handleSend()} />
                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleSend()}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <button onClick={() => setOpen(true)} className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

// ── Rate Calculator Component ──
function RateCalculator() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [equipment, setEquipment] = useState('');
  const [result, setResult] = useState<{ low: number; high: number } | null>(null);

  const calculate = () => {
    if (!origin || !destination || !equipment || origin === destination) return;
    const dist = regionDistances[origin]?.[destination];
    const rates = equipmentRates[equipment];
    if (!dist || !rates) return;
    const base = rates.base + dist * rates.perMile;
    setResult({ low: Math.round(base * 0.9), high: Math.round(base * 1.15) });
  };

  return (
    <section id="rate-calculator" className="py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Calculator className="h-3.5 w-3.5" /> Instant Estimate
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Rate Calculator</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Get an instant estimated rate range for your lane. For exact pricing, submit a quote request.</p>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Origin Region</label>
                <Select onValueChange={v => { setOrigin(v); setResult(null); }}>
                  <SelectTrigger><SelectValue placeholder="Select origin" /></SelectTrigger>
                  <SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Destination Region</label>
                <Select onValueChange={v => { setDestination(v); setResult(null); }}>
                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent>{regions.filter(r => r !== origin).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Equipment Type</label>
                <Select onValueChange={v => { setEquipment(v); setResult(null); }}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry_van">Dry Van</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="power_only">Power Only</SelectItem>
                    <SelectItem value="step_deck">Step Deck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={calculate} disabled={!origin || !destination || !equipment || origin === destination} className="w-full md:w-auto">
              <Calculator className="mr-2 h-4 w-4" /> Calculate Estimate
            </Button>
            {result && (
              <div className="mt-6 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-2">Estimated Rate Range</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">${result.low.toLocaleString()} – ${result.high.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-3">*Estimates based on current market averages. Actual rates may vary.</p>
                <Button onClick={scrollToForm} variant="outline" size="sm" className="mt-4">
                  Get an Exact Quote <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ── Main Page ──
export default function SalesLanding() {
  const { shippers, setShippers, setActivities, triggerCadence, logStageChange } = useAppContext();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '', contactName: '', email: '', phone: '',
      origin: '', destination: '', equipmentType: '', estimatedWeeklyVolume: '', message: '',
    },
  });

  // Retargeting Pixels (placeholder IDs)
  useEffect(() => {
    // ── Meta/Facebook Pixel ──
    // Replace YOUR_META_PIXEL_ID with your actual pixel ID
    const metaScript = document.createElement('script');
    metaScript.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      // fbq('init', 'YOUR_META_PIXEL_ID');
      // fbq('track', 'PageView');
    `;
    metaScript.id = 'meta-pixel';

    // ── Google Ads / gtag ──
    // Replace YOUR_GOOGLE_ADS_ID with your actual Google Ads conversion ID
    const gtagScript = document.createElement('script');
    gtagScript.innerHTML = `
      // window.dataLayer = window.dataLayer || [];
      // function gtag(){dataLayer.push(arguments);}
      // gtag('js', new Date());
      // gtag('config', 'YOUR_GOOGLE_ADS_ID');
    `;
    gtagScript.id = 'gtag-pixel';

    document.head.appendChild(metaScript);
    document.head.appendChild(gtagScript);

    return () => {
      document.getElementById('meta-pixel')?.remove();
      document.getElementById('gtag-pixel')?.remove();
    };
  }, []);

  const onSubmit = (data: FormValues) => {
    const existing = shippers.find(s => s.companyName.toLowerCase() === data.companyName.toLowerCase());
    let shipperId: string;

    if (existing) {
      shipperId = existing.id;
      if (existing.salesStage !== 'prospect') {
        logStageChange(shipperId, existing.salesStage, 'prospect');
        setShippers(prev => prev.map(s => s.id === shipperId ? { ...s, salesStage: 'prospect' as const } : s));
      }
    } else {
      shipperId = crypto.randomUUID();
      const newShipper = {
        id: shipperId,
        companyName: data.companyName,
        address: '', city: '', state: '', zip: '',
        phone: data.phone, email: data.email,
        salesStage: 'prospect' as const,
        creditLimit: 0, paymentTerms: 'Net 30',
        notes: `Lead from website. Contact: ${data.contactName}. Origin: ${data.origin}, Dest: ${data.destination}. Equipment: ${data.equipmentType}. Volume: ${data.estimatedWeeklyVolume || 'N/A'}. Message: ${data.message || 'N/A'}`,
        createdAt: new Date().toISOString(),
        shippingManagerName: data.contactName,
        directPhone: data.phone,
      };
      setShippers(prev => [...prev, newShipper]);
    }

    setActivities(prev => [...prev, {
      id: crypto.randomUUID(),
      entityId: shipperId, entityType: 'shipper', type: 'note',
      description: `Website lead form submitted. ${data.origin} → ${data.destination}, ${data.equipmentType}`,
      timestamp: new Date().toISOString(), user: 'Website',
    }]);

    triggerCadence(shipperId);
    toast({ title: 'Quote Request Received', description: 'A capacity specialist will contact you within 2 hours.' });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img src={demarLogo} alt="Demar Logistics" className="h-10 w-auto" />
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#case-studies" className="hover:text-foreground transition-colors">Results</a>
            <a href="#rate-calculator" className="hover:text-foreground transition-colors">Rate Calculator</a>
            <a href="#why-demar" className="hover:text-foreground transition-colors">Why Demar</a>
            <Button onClick={scrollToForm} size="sm">Request a Quote</Button>
          </div>
          <Button onClick={scrollToForm} size="sm" className="md:hidden">Get Quote</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <Truck className="h-3.5 w-3.5" /> West Coast Freight Solutions
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Reliable West Coast Truckload Capacity –{' '}
              <span className="text-primary">NV, CA, OR & WA</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
              Regional dry van, reefer, and power-only solutions backed by carrier compliance screening and real-time communication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={scrollToForm} className="text-base px-8 py-6">
                Request a Quote <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={downloadCapabilityStatement} className="text-base px-8 py-6">
                <Download className="mr-2 h-5 w-5" /> Capability Statement
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Freight Delays Cost More Than Just Money</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">Unreliable carriers and fragmented coverage create costly disruptions across your supply chain.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: AlertTriangle, title: 'Last-Minute Cancellations', desc: 'Carriers drop loads at the worst possible time, leaving you scrambling for coverage.' },
              { icon: MapPin, title: 'Inconsistent Regional Coverage', desc: 'Gaps in lane coverage across NV, CA, OR, and WA create bottlenecks.' },
              { icon: MessageSquareOff, title: 'Poor Communication', desc: 'No updates, no tracking, no answers when you need them most.' },
              { icon: ShieldAlert, title: 'No Backup Capacity', desc: 'When your primary carrier falls through, there\'s no Plan B.' },
            ].map((item, i) => (
              <Card key={i} className="bg-secondary/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Built for <span className="text-primary">West Coast Freight</span></h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">We specialize in the lanes, equipment, and service standards that West Coast shippers demand.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: MapPin, title: 'NV, CA, OR & WA Lane Focus', desc: 'Deep carrier relationships across all major West Coast corridors. We know every lane, every market shift, and every seasonal pattern.' },
              { icon: FileText, title: 'Contract & Overflow Freight', desc: 'Whether you need committed capacity on dedicated lanes or surge support during peak season, we scale with your business.' },
              { icon: Zap, title: 'Power-Only Capability', desc: 'Leverage your own trailers with our driver network. Reduce costs and maintain flexibility across your fleet.' },
              { icon: Route, title: 'Dedicated Lane Support', desc: 'Consistent drivers, consistent service. Our dedicated programs deliver predictable capacity at competitive rates.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lane Heatmap */}
      <section className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
              <TrendingUp className="h-3.5 w-3.5" /> Live Lane Activity
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">West Coast Lane Demand</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Real-time capacity demand across our core lanes. Darker = higher volume.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-xs font-semibold text-muted-foreground text-left border-b border-border">Origin ↓ / Dest →</th>
                  {heatmapCities.map(c => (
                    <th key={c} className="p-2 text-xs font-semibold text-muted-foreground text-center border-b border-border">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapCities.map(origin => (
                  <tr key={origin}>
                    <td className="p-2 text-xs font-semibold border-b border-border/50">{origin}</td>
                    {heatmapCities.map(dest => (
                      <td key={dest} className="p-1 border-b border-border/50">
                        {origin === dest ? (
                          <div className="h-8 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">—</div>
                        ) : (
                          <div className={`h-8 rounded flex items-center justify-center text-xs font-semibold ${getHeatColor(heatmapData[origin]?.[dest] || 0)}`}>
                            {heatmapData[origin]?.[dest] || 0}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-muted" /> Low</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/20" /> Moderate</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/40" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/50" /> High</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/80" /> Very High</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Our Services</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">Comprehensive truckload solutions tailored for West Coast shippers.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: 'Dry Van Freight', desc: 'Full truckload dry van capacity across all West Coast lanes. 48\' and 53\' trailers available for standard freight.' },
              { icon: Snowflake, title: 'Reefer Freight', desc: 'Temperature-controlled transportation for perishables, pharmaceuticals, and specialty goods with continuous monitoring.' },
              { icon: Package, title: 'Flatbed Freight', desc: 'Open-deck solutions for oversized, construction, and industrial loads with experienced flatbed carriers.' },
              { icon: Zap, title: 'Power-Only', desc: 'Driver and tractor services for your trailers. Maximize asset utilization while we handle the driving.' },
              { icon: Route, title: 'Dedicated Lanes', desc: 'Committed capacity with consistent drivers for your highest-volume lanes. Predictable pricing and service.' },
              { icon: Layers, title: 'Overflow Capacity', desc: 'Surge capacity when your primary carriers are maxed out. Same-day coverage with vetted backup carriers.' },
            ].map((item, i) => (
              <Card key={i} className="bg-secondary/50 border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Demar */}
      <section id="why-demar" className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Shippers Choose <span className="text-primary">Demar Logistics</span></h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">We're not just another broker. We're your West Coast capacity partner.</p>
          <div className="max-w-3xl mx-auto space-y-5">
            {[
              { title: 'West Coast Lane Specialization', desc: 'Deep market knowledge across NV, CA, OR, and WA corridors.' },
              { title: 'Carrier Compliance Screening', desc: 'Every carrier is vetted for authority, insurance, safety scores, and performance history.' },
              { title: 'Real-Time Communication', desc: 'Proactive updates from pickup to delivery. No chasing, no surprises.' },
              { title: 'Relationship-Driven Service', desc: 'Dedicated reps who know your business, your freight, and your expectations.' },
              { title: 'Asset-Backed Knowledge', desc: 'Our operational experience means we understand the carrier side — and use it to your advantage.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-5 rounded-xl border border-border/50 bg-secondary/30">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="case-studies" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
              <Target className="h-3.5 w-3.5" /> Proven Results
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Client Success Stories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Real results from real partnerships. See how we've helped West Coast shippers solve their toughest freight challenges.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {caseStudies.map((cs, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/30 transition-colors overflow-hidden">
                <div className="p-4 bg-primary/5 border-b border-border/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <cs.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-primary">{cs.industry}</span>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Challenge</h4>
                    <p className="text-sm">{cs.challenge}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Solution</h4>
                    <p className="text-sm">{cs.solution}</p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Results</h4>
                    <div className="flex justify-between">
                      {cs.results.map((r, j) => (
                        <div key={j} className="text-center">
                          <p className="text-xl font-bold text-primary">{r.metric}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">From first contact to on-time delivery in four simple steps.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', icon: FileText, title: 'Request a Quote', desc: 'Submit your lane details and we\'ll respond within 2 hours with competitive rates.' },
              { step: '02', icon: Handshake, title: 'Capacity Secured', desc: 'We match your freight with a vetted, compliant carrier on your lane.' },
              { step: '03', icon: Eye, title: 'Live Tracking', desc: 'Real-time visibility from pickup to delivery with proactive status updates.' },
              { step: '04', icon: Award, title: 'On-Time Delivery', desc: 'Your freight arrives on time. POD delivered same day. Invoice follows.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative mx-auto mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rate Calculator */}
      <RateCalculator />

      {/* Trust */}
      <section className="py-16 md:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            {[
              { icon: Shield, label: 'Fully Licensed & Insured' },
              { icon: CheckCircle2, label: 'Carrier Compliance Verified' },
              { icon: BarChart3, label: 'Experienced Transportation Team' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <item.icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section id="lead-form" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Get Your Rate Quote</h2>
          <p className="text-muted-foreground text-center mb-10">Fill out the form below and a capacity specialist will respond within 2 hours.</p>

          {submitted ? (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-10 text-center">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-3">Quote Request Received!</h3>
                <p className="text-muted-foreground mb-6">A Demar Logistics capacity specialist will contact you within 2 hours with competitive rates for your lane.</p>
                <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); }}>Submit Another Request</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input placeholder="ABC Logistics" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="contactName" render={({ field }) => (
                        <FormItem><FormLabel>Contact Name *</FormLabel><FormControl><Input placeholder="John Smith" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="john@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="origin" render={({ field }) => (
                        <FormItem><FormLabel>Origin *</FormLabel><FormControl><Input placeholder="Reno, NV" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="destination" render={({ field }) => (
                        <FormItem><FormLabel>Destination *</FormLabel><FormControl><Input placeholder="Los Angeles, CA" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="equipmentType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="dry_van">Dry Van</SelectItem>
                              <SelectItem value="reefer">Reefer</SelectItem>
                              <SelectItem value="flatbed">Flatbed</SelectItem>
                              <SelectItem value="power_only">Power Only</SelectItem>
                              <SelectItem value="step_deck">Step Deck</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="estimatedWeeklyVolume" render={({ field }) => (
                        <FormItem><FormLabel>Est. Weekly Volume</FormLabel><FormControl><Input placeholder="5-10 loads" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea placeholder="Any additional details about your freight needs..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" size="lg" className="w-full text-base py-6">
                      <Mail className="mr-2 h-5 w-5" /> Submit Quote Request
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Secure Reliable West Coast Capacity Today.</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">Stop losing loads to unreliable carriers. Partner with Demar Logistics for consistent, compliant West Coast coverage.</p>
          <Button size="lg" onClick={scrollToForm} className="text-base px-10 py-6">
            Get a Rate Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold"><span className="text-primary">DEMAR</span> LOGISTICS</span>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Demar Logistics. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="/sales/dashboard" className="hover:text-foreground transition-colors">CRM Login</a>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

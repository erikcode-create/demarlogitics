import { useState } from 'react';
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
  FileText, BarChart3, Handshake, Eye, Award
} from 'lucide-react';

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

const scrollToForm = () => {
  document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
};

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
      shipperId = `ship_${Date.now()}`;
      const newShipper = {
        id: shipperId,
        companyName: data.companyName,
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: data.phone,
        email: data.email,
        salesStage: 'prospect' as const,
        creditLimit: 0,
        paymentTerms: 'Net 30',
        notes: `Lead from website. Contact: ${data.contactName}. Origin: ${data.origin}, Dest: ${data.destination}. Equipment: ${data.equipmentType}. Volume: ${data.estimatedWeeklyVolume || 'N/A'}. Message: ${data.message || 'N/A'}`,
        createdAt: new Date().toISOString(),
        shippingManagerName: data.contactName,
        directPhone: data.phone,
      };
      setShippers(prev => [...prev, newShipper]);
    }

    setActivities(prev => [...prev, {
      id: `act_${Date.now()}`,
      entityId: shipperId,
      entityType: 'shipper',
      type: 'note',
      description: `Website lead form submitted. ${data.origin} → ${data.destination}, ${data.equipmentType}`,
      timestamp: new Date().toISOString(),
      user: 'Website',
    }]);

    triggerCadence(shipperId);

    toast({
      title: 'Quote Request Received',
      description: 'A capacity specialist will contact you within 2 hours.',
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-primary">DEMAR</span> TRANSPORTATION
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#process" className="hover:text-foreground transition-colors">Process</a>
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
              <Button size="lg" variant="outline" onClick={scrollToForm} className="text-base px-8 py-6">
                <Phone className="mr-2 h-5 w-5" /> Speak With a Capacity Specialist
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Freight Delays Cost More Than Just Money
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
            Unreliable carriers and fragmented coverage create costly disruptions across your supply chain.
          </p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Built for <span className="text-primary">West Coast Freight</span>
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
            We specialize in the lanes, equipment, and service standards that West Coast shippers demand.
          </p>
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

      {/* Services */}
      <section id="services" className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Our Services</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
            Comprehensive truckload solutions tailored for West Coast shippers.
          </p>
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
      <section id="why-demar" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Shippers Choose <span className="text-primary">Demar Transportation</span>
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
            We're not just another broker. We're your West Coast capacity partner.
          </p>
          <div className="max-w-3xl mx-auto space-y-5">
            {[
              { title: 'West Coast Lane Specialization', desc: 'Deep market knowledge across NV, CA, OR, and WA corridors.' },
              { title: 'Carrier Compliance Screening', desc: 'Every carrier is vetted for authority, insurance, safety scores, and performance history.' },
              { title: 'Real-Time Communication', desc: 'Proactive updates from pickup to delivery. No chasing, no surprises.' },
              { title: 'Relationship-Driven Service', desc: 'Dedicated reps who know your business, your freight, and your expectations.' },
              { title: 'Asset-Backed Knowledge', desc: 'Our operational experience means we understand the carrier side — and use it to your advantage.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-5 rounded-xl border border-border/50 bg-card/50">
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

      {/* Process */}
      <section id="process" className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
            From first contact to on-time delivery in four simple steps.
          </p>
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

      {/* Trust */}
      <section className="py-16 md:py-20">
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
      <section id="lead-form" className="py-20 md:py-28 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Get Your Rate Quote</h2>
          <p className="text-muted-foreground text-center mb-10">
            Fill out the form below and a capacity specialist will respond within 2 hours.
          </p>

          {submitted ? (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-10 text-center">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-3">Quote Request Received!</h3>
                <p className="text-muted-foreground mb-6">
                  A Demar Transportation capacity specialist will contact you within 2 hours with competitive rates for your lane.
                </p>
                <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); }}>
                  Submit Another Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl><Input placeholder="ABC Logistics" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contactName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name *</FormLabel>
                          <FormControl><Input placeholder="John Smith" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl><Input type="email" placeholder="john@company.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="origin" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origin *</FormLabel>
                          <FormControl><Input placeholder="Reno, NV" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="destination" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination *</FormLabel>
                          <FormControl><Input placeholder="Los Angeles, CA" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="equipmentType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select equipment" />
                              </SelectTrigger>
                            </FormControl>
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
                        <FormItem>
                          <FormLabel>Est. Weekly Volume</FormLabel>
                          <FormControl><Input placeholder="5-10 loads" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl><Textarea placeholder="Any additional details about your freight needs..." rows={4} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Secure Reliable West Coast Capacity Today.
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Stop losing loads to unreliable carriers. Partner with Demar Transportation for consistent, compliant West Coast coverage.
          </p>
          <Button size="lg" onClick={scrollToForm} className="text-base px-10 py-6">
            Get a Rate Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            <span className="text-primary">DEMAR</span> TRANSPORTATION
          </span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Demar Transportation. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="/sales/dashboard" className="hover:text-foreground transition-colors">CRM Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

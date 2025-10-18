import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
// IMPORTANT: import icons directly from the package so they bundle locally
// (avoids sandbox/CDN fetch like jsdelivr failing for per-icon paths)
import {
  Calendar,
  Coins,
  CreditCard,
  QrCode,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Database,
  Wallet,
  Copy,
  ArrowLeft,
  Settings2,
  Info,
  Eye,
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ------------------------------------------------------------
// Styling helpers — pearlescent / glass aesthetic
// ------------------------------------------------------------
const shellGradient =
  "bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgba(255,255,255,0.45),transparent_60%),radial-gradient(900px_600px_at_110%_0%,rgba(200,220,255,0.35),transparent_60%),radial-gradient(800px_600px_at_50%_120%,rgba(255,210,240,0.35),transparent_60%)]";

const glass =
  "backdrop-blur-xl bg-white/30 border border-white/20 shadow-[0_10px_50px_rgba(80,80,120,0.15)]";

// ------------------------------------------------------------
// Types & constants
// ------------------------------------------------------------

const CURRENCIES = [
  { id: "ALGO", name: "ALGO" },
  { id: "USDC", name: "USDC (ASA)" },
];

const STEPS = [
  { id: 0, label: "Basics", icon: Calendar },
  { id: 1, label: "Tickets", icon: Ticket },
  { id: 2, label: "On‑chain", icon: Wallet },
  { id: 3, label: "Check‑in & VC", icon: ShieldCheck },
  { id: 4, label: "Review & Deploy", icon: Settings2 },
];

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
interface EventCreatorProps {
  network: string
}

export default function EventCreator({ network }: EventCreatorProps) {
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    // Basics
    title: "Algorand Hacker House – London",
    subtitle: "Builders • Talks • Live minting",
    description:
      "A community‑driven builder day focused on Algorand. Learn, hack, and collect your proof‑of‑participation.",
    coverUrl: "",
    website: "https://example.com",
    startDate: "",
    endDate: "",
    timezone: "UTC",
    locationType: "in-person",
    venue: "",
    city: "",
    country: "",

    // Tickets
    ticketName: "General Admission",
    ticketSupply: 200,
    price: 2.5,
    currency: "ALGO",
    perWalletLimit: 2,
    resaleAllowed: false,

    // On-chain
    treasuryAddress: "",
    issuerAddress: "",
    royaltyBps: 0,
    asaUnitName: "POPTIX",
    asaAssetName: "POP Ticket",

    // Check-in & VC
    enableQR: true,
    vcIssuerDid: "did:web:yourevent.example",
    vcSchemaUrl: "https://schema.org/Attendance",
    dataMinimised: true,
  });

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  function update(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canDeploy = useMemo(() => {
    return (
      form.title.trim().length > 2 &&
      !!form.startDate &&
      !!form.endDate &&
      (form.locationType === "virtual" || form.venue.trim().length > 0) &&
      form.treasuryAddress.trim().length > 0 &&
      form.issuerAddress.trim().length > 0 &&
      form.ticketSupply > 0 &&
      form.price >= 0
    );
  }, [form]);

  const reviewJson = useMemo(() => JSON.stringify(form, null, 2), [form]);

  function simulateDeploy() {
    // Here you would:
    // 1) Create ASA for ticket using Algorand SDK
    // 2) Deploy smart contract (ARC-4/teal) for sales + check-in
    // 3) Store VC issuer config for check-in station
    // For the demo, just log and fake an ASA id
    const fakeAsaId = Math.floor(Math.random() * 10_000_000);
    alert(`Simulated deploy to ${network} — ASA #${fakeAsaId}`);
  }

  return (
    <div className={`min-h-screen ${shellGradient} relative overflow-x-hidden`}>
      {/* Pearlescent film */}
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen" />

      {/* Header */}
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="flex gap-2 mt-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 text-xs ${i === step ? "font-semibold" : "text-muted-foreground"}`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 opacity-50" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-6xl px-6 py-6 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          {step === 0 && <Basics form={form} update={update} />}
          {step === 1 && <Tickets form={form} update={update} />}
          {step === 2 && <OnChain form={form} update={update} />}
          {step === 3 && <CheckIn form={form} update={update} />}
          {step === 4 && (
            <Review
              form={form}
              reviewJson={reviewJson}
              onCopy={() => {
                navigator.clipboard.writeText(reviewJson);
                // quick visual confirmation via alert for sandbox environments
                alert("Deployment JSON copied to clipboard");
              }}
            />
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" onClick={prev} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            {step < 4 ? (
              <Button onClick={next} className="ml-auto">
                Continue
              </Button>
            ) : (
              <Button onClick={simulateDeploy} className="ml-auto" disabled={!canDeploy}>
                <ShieldCheck className="h-4 w-4 mr-2" /> Deploy (simulate)
              </Button>
            )}
          </div>
        </section>

        {/* Live preview */}
        <aside className="space-y-4">
          <Card className={`${glass}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Event Preview
              </CardTitle>
              <CardDescription>How your event will appear to buyers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-video w-full rounded-2xl border border-white/40 bg-gradient-to-br from-white/70 to-white/40 grid place-items-center text-muted-foreground">
                {form.coverUrl ? (
                  <img src={form.coverUrl} alt="cover" className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <div className="text-xs">Upload a cover image</div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold leading-tight">{form.title || "Untitled Event"}</h2>
                <p className="text-sm text-muted-foreground">{form.subtitle}</p>
              </div>

              <Separator className="bg-white/40" />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={`${glass} rounded-xl p-3`}>
                  <div className="text-xs uppercase opacity-80">Starts</div>
                  <div>{form.startDate || "TBA"}</div>
                </div>
                <div className={`${glass} rounded-xl p-3`}>
                  <div className="text-xs uppercase opacity-80">Ends</div>
                  <div>{form.endDate || "TBA"}</div>
                </div>
                <div className={`${glass} rounded-xl p-3 col-span-2`}>
                  <div className="text-xs uppercase opacity-80">Location</div>
                  <div>{form.locationType === "virtual" ? "Virtual / Online" : form.venue || "Venue TBA"}</div>
                </div>
              </div>

              <div className={`${glass} rounded-xl p-3 text-sm`}>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" /> {form.ticketName}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {form.ticketSupply} supply • {form.price} {form.currency}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${glass}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" /> What happens on deploy?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <StepItem icon={<Database className="h-4 w-4" />}>Create ASA for ticket class (unit {form.asaUnitName}).</StepItem>
              <StepItem icon={<CreditCard className="h-4 w-4" />}>Publish sales contract with pricing in {form.currency}.</StepItem>
              <StepItem icon={<ShieldCheck className="h-4 w-4" />}>Register VC issuer ({form.vcIssuerDid}).</StepItem>
              <StepItem icon={<QrCode className="h-4 w-4" />}>Enable QR check‑in for on‑site scanning.</StepItem>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-muted-foreground">
        Built for Algorand hackathon • This is a demo UI.
      </footer>
    </div>
  );
}

// ------------------------------------------------------------
// Subcomponents
// ------------------------------------------------------------
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide opacity-80">{label}</Label>
      {children}
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Basics({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  return (
    <Card className={`${glass}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Basics
        </CardTitle>
        <CardDescription>Title, timing, and where your event happens.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2 grid grid-cols-1 gap-5">
          <Field label="Event title">
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} className={glass} />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} className={glass} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={glass} />
          </Field>
        </div>

        <Field label="Start date & time">
          <Input type="datetime-local" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className={glass} />
        </Field>
        <Field label="End date & time">
          <Input type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={glass} />
        </Field>

        <Field label="Timezone">
          <Input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} className={glass} />
        </Field>

        <Field label="Event type">
          {/* Use a controlled Tabs to reflect state instead of defaultValue */}
          <Tabs value={form.locationType} onValueChange={(v) => update("locationType", v)}>
            <TabsList className={`${glass}`}>
              <TabsTrigger value="in-person">In‑person</TabsTrigger>
              <TabsTrigger value="virtual">Virtual</TabsTrigger>
              <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
            </TabsList>
          </Tabs>
        </Field>

        {form.locationType !== "virtual" && (
          <>
            <Field label="Venue">
              <Input value={form.venue} onChange={(e) => update("venue", e.target.value)} className={glass} />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} className={glass} />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} className={glass} />
            </Field>
          </>
        )}

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Cover image URL" hint="Use a hosted image for now. Add file uploads later.">
            <Input value={form.coverUrl} onChange={(e) => update("coverUrl", e.target.value)} className={glass} />
          </Field>
          <Field label="Website" hint="Optional landing page for more info">
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} className={glass} />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function Tickets({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  return (
    <Card className={`${glass}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" /> Tickets
        </CardTitle>
        <CardDescription>Supply, pricing, and buyer limits.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-5">
        <Field label="Ticket name">
          <Input value={form.ticketName} onChange={(e) => update("ticketName", e.target.value)} className={glass} />
        </Field>
        <Field label="Total supply">
          <Input type="number" value={form.ticketSupply} onChange={(e) => update("ticketSupply", Number(e.target.value))} className={glass} />
        </Field>
        <Field label="Price">
          <Input type="number" step="0.000001" value={form.price} onChange={(e) => update("price", Number(e.target.value))} className={glass} />
        </Field>
        <Field label="Currency">
          <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
            <SelectTrigger className={glass}>
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Per-wallet limit">
          <Input type="number" value={form.perWalletLimit} onChange={(e) => update("perWalletLimit", Number(e.target.value))} className={glass} />
        </Field>
        <Field label="Allow secondary transfers?">
          <div className="flex items-center gap-3">
            <Switch checked={form.resaleAllowed} onCheckedChange={(v) => update("resaleAllowed", v)} />
            <span className="text-sm">{form.resaleAllowed ? "Resale allowed" : "Soulbound until check‑in"}</span>
          </div>
        </Field>
      </CardContent>
    </Card>
  );
}

function OnChain({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  return (
    <Card className={`${glass}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" /> On‑chain
        </CardTitle>
        <CardDescription>Where funds go and how the ASA is configured.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-5">
        <Field label="Treasury wallet address" hint="Receives ticket revenue (ALGO/USDC).">
          <Input value={form.treasuryAddress} onChange={(e) => update("treasuryAddress", e.target.value)} className={glass} />
        </Field>
        <Field label="Issuer/Manager address" hint="Manages ASA + app calls for check‑ins.">
          <Input value={form.issuerAddress} onChange={(e) => update("issuerAddress", e.target.value)} className={glass} />
        </Field>
        <Field label="ASA Unit Name">
          <Input value={form.asaUnitName} onChange={(e) => update("asaUnitName", e.target.value)} className={glass} />
        </Field>
        <Field label="ASA Asset Name">
          <Input value={form.asaAssetName} onChange={(e) => update("asaAssetName", e.target.value)} className={glass} />
        </Field>
        <Field label="Royalty (bps)" hint="0 for none; example 250 = 2.5%">
          <Input type="number" value={form.royaltyBps} onChange={(e) => update("royaltyBps", Number(e.target.value))} className={glass} />
        </Field>
      </CardContent>
    </Card>
  );
}

function CheckIn({ form, update }: { form: any; update: (key: string, value: any) => void }) {
  return (
    <Card className={`${glass}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Check‑in & Verifiable Credential
        </CardTitle>
        <CardDescription>Enable QR scanning and configure your VC issuer.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-5">
        <Field label="QR check‑in enabled?">
          <div className="flex items-center gap-3">
            <Switch checked={form.enableQR} onCheckedChange={(v) => update("enableQR", v)} />
            <span className="text-sm">{form.enableQR ? "Enabled" : "Disabled"}</span>
          </div>
        </Field>
        <Field label="VC Issuer DID" hint="The DID that signs Proof‑of‑Participation.">
          <Input value={form.vcIssuerDid} onChange={(e) => update("vcIssuerDid", e.target.value)} className={glass} />
        </Field>
        <Field label="VC Schema URL" hint="JSON schema describing the credential claims.">
          <Input value={form.vcSchemaUrl} onChange={(e) => update("vcSchemaUrl", e.target.value)} className={glass} />
        </Field>
        <Field label="Data minimisation">
          <div className="flex items-center gap-3">
            <Switch checked={form.dataMinimised} onCheckedChange={(v) => update("dataMinimised", v)} />
            <span className="text-sm">Only non‑PII claims in credential</span>
          </div>
        </Field>
        <div className="md:col-span-2 text-xs text-muted-foreground">
          Tip: VCs are signed attestations. At check‑in, your app mints a one‑time proof (e.g., attendance=true) to the attendee's wallet without storing personal data.
        </div>
      </CardContent>
    </Card>
  );
}

function Review({ form, reviewJson, onCopy }: { form: any; reviewJson: string; onCopy: () => void }) {
  return (
    <Card className={`${glass}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" /> Review & Deploy
        </CardTitle>
        <CardDescription>Double‑check details, then deploy the contract + ASA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <InfoTile title="Network" value={network} />
          <InfoTile title="Currency" value={`${form.price} ${form.currency}`} />
          <InfoTile title="Supply" value={String(form.ticketSupply)} />
          <InfoTile title="Treasury" value={shorten(form.treasuryAddress)} />
          <InfoTile title="Issuer" value={shorten(form.issuerAddress)} />
          <InfoTile title="VC DID" value={form.vcIssuerDid} />
        </div>
        <div className={`${glass} rounded-2xl p-3 border border-white/30`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase opacity-70">Deployment JSON (preview)</div>
            <Button variant="ghost" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
          <pre className="text-xs overflow-auto max-h-72">{reviewJson}</pre>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoTile({ title, value }: { title: string; value: string }) {
  return (
    <div className={`${glass} rounded-xl p-3`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{title}</div>
      <div className="font-medium text-sm break-words">{value || "—"}</div>
    </div>
  );
}

function StepItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 grid place-items-center rounded-xl ${glass}`}>{icon}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function shorten(addr: string, n = 6) {
  if (!addr) return "—";
  if (addr.length <= n * 2) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

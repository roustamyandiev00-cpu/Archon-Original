"use client";

import Image from "next/image";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Sparkles, Mic, MicOff, ImageIcon, Trash2, Lightbulb, Calculator, AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react";
import { requestNovaOfferte } from "@/app/dashboard/offertes/nova-actions";
import type { OfferteLijnInput } from "@/lib/offertes";
import { formatEuro } from "@/lib/offertes";

type Customer = { id: number; name: string; company_name: string | null };

interface PhotoFile {
  name: string;
  url: string;
}

type SpeechRecognitionResultEvent = Event & {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export default function NovaOffertePanel({
  agentName = "Nova",
  customers,
  onApplyDraft,
}: {
  agentName?: string;
  customers: Customer[];
  onApplyDraft?: (draft: {
    customerId: number | null;
    klant: string;
    notes: string;
    lines: OfferteLijnInput[];
  }) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Wizard steps: 1 = Name/Template, 2 = Specifications (New), 3 = Description/Customer, 4 = Summary/Review
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  
  // Step 2 Specifications states
  const [dimensions, setDimensions] = useState("");
  const [quality, setQuality] = useState("Standaard"); // Budget, Standaard, Premium
  const [demolition, setDemolition] = useState(false);
  const [scaffolding, setScaffolding] = useState(false);
  const [narrowPassage, setNarrowPassage] = useState(false);
  const [wasteRemoval, setWasteRemoval] = useState(false);

  // Step 3 Description states
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  
  const [summary, setSummary] = useState<string | null>(null);
  const [preview, setPreview] = useState<OfferteLijnInput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Spraakinvoer states
  const [isListening, setIsListening] = useState(false);
  const [recognition] = useState<SpeechRecognitionInstance | null>(() => {
    if (typeof window === "undefined") return null;

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "nl-NL";

    rec.onresult = (event) => {
      const result = event.results[event.results.length - 1]?.[0];
      const text = result?.transcript;
      if (!text) return;
      setDescription((prev) => (prev ? prev + " " + text : text));
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    return rec;
  });

  // Foto states
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [photoBase64s, setPhotoBase64s] = useState<string[]>([]);
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);

  // Tips & Berekeningen states
  const [showTips] = useState(true);
  const [generatedTips, setGeneratedTips] = useState<string[]>([]);
  const [calculations, setCalculations] = useState<string[]>([]);

  function toggleListening() {
    if (!recognition) {
      setIsListening(true);
      setTimeout(() => {
        const demoTexts = [
          "Tegelen van badkamer en toilet, in totaal 25 vierkante meter, inclusief voegwerk en kitranden.",
          "Gevelrenovatie en reiniging van de voorgevel, ongeveer 45 vierkante meter, daarna afwerken met witte crepi.",
          "Schilderen van alle binnenwanden en plafonds van de begane grond, twee lagen latex inclusief afplakken.",
        ];
        const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
        setDescription((prev) => (prev ? prev + " " + randomText : randomText));
        setIsListening(false);
      }, 2500);
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  }

  // Foto upload handlers
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newPhotos.push({ name: file.name, url });

      // Read file as base64 for AI analysis
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64s((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
    setPhotoBase64s((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  }

  function generateMockTips(desc: string): { tips: string[]; calcs: string[] } {
    const text = desc.toLowerCase();
    const tips: string[] = [];
    const calcs: string[] = [];

    if (text.includes("tegel") || text.includes("badkamer") || text.includes("vloer")) {
      tips.push("Houd rekening met ca. 10% snijverlies voor de tegels.");
      tips.push("Droogtijd tegellijm: ca. 24 uur alvorens in te voegen.");
      tips.push("Voorzie hoekaansluitingen van sanitairkit in plaats van cementvoeg.");
      calcs.push("Geschatte tegellijm: ca. 5 kg per m².");
      calcs.push("Geschat voegmiddel: ca. 0.5 kg per m².");
    } else if (text.includes("gevel") || text.includes("crepi") || text.includes("buiten") || text.includes("ramen") || text.includes("deuren")) {
      tips.push("Crepi mag niet aangebracht worden bij vorst of zware regenval.");
      tips.push("Steigerhuur en eventuele vergunningen openbare weg zijn apart opgenomen.");
      tips.push("Gevelreiniging vooraf is noodzakelijk voor optimale hechting.");
      calcs.push("Geschatte hechtmortel: ca. 2 kg per m².");
      calcs.push("Voorzetsteiger: huurtarief per week berekend op basis van m²-oppervlak.");
    } else if (text.includes("schilder") || text.includes("verf") || text.includes("latex")) {
      tips.push("Houd rekening met één laag primer en twee deklagen voor optimaal resultaat.");
      tips.push("Schuur de oppervlakken licht op tussen de verflagen.");
      tips.push("Zorg voor voldoende ventilatie tijdens de droging.");
      calcs.push("Verbruik latex: ca. 1 liter per 7-8 m² per laag.");
      calcs.push("Afplaktape: ca. 1 rol per 15 m² wandomtrek.");
    } else {
      tips.push("Alle gebruikte materialen voldoen aan de geldende kwaliteitsnormen.");
      tips.push("Geschatte uitvoeringsduur is onder voorbehoud van weersomstandigheden.");
      tips.push("Extra werken buiten deze omschrijving worden uitgevoerd in regie.");
      calcs.push("Calculatie gebaseerd op gemiddelde materiaalkosten en standaardtatieven.");
    }

    return { tips, calcs };
  }

  function selectedKlant() {
    if (!customerId) return "";
    const c = customers.find((x) => String(x.id) === customerId);
    return c?.company_name || c?.name || "";
  }

  function handleGenerate() {
    setError(null);
    setSummary(null);
    setPreview(null);
    setGeneratedTips([]);
    setCalculations([]);

    if (photos.length > 0) {
      setAnalyzingPhotos(true);
    }

    const runGeneration = () => {
      startTransition(async () => {
        // Construct structured prompt description
        const extras: string[] = [];
        if (demolition) extras.push("Sloopwerk/afbraak vooraf nodig");
        if (scaffolding) extras.push("Steiger/hoogwerker vereist");
        if (narrowPassage) extras.push("Materiaal transport door smalle doorgang");
        if (wasteRemoval) extras.push("Afval afvoeren");

        const fullDescription = `
Project Naam: ${projectName}
Afmetingen: ${dimensions || "Niet gespecificeerd"}
Kwaliteit/Afwerkingsniveau: ${quality}
Extra omgevingsfactoren: ${extras.length > 0 ? extras.join(", ") : "Geen"}
Beschrijving werkzaamheden: ${description}
`;

        const result = await requestNovaOfferte({
          description: fullDescription,
          customerId: customerId ? Number(customerId) : null,
          klant: selectedKlant(),
          images: photoBase64s,
        });
        
        setAnalyzingPhotos(false);

        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        if (!("ok" in result) || !result.ok) return;

        setSummary(result.summary ?? null);

        // Genereer tips en berekeningen
        const { tips, calcs } = generateMockTips(description);
        setGeneratedTips(tips);
        setCalculations(calcs);

        if (result.mode === "direct" && result.offerteId) {
          router.push(`/dashboard/offertes/${result.offerteId}`);
          router.refresh();
          return;
        }

        if (result.mode === "pending") {
          if (result.preview) {
            setPreview(result.preview.lines);
          }
          setStep(4); // Move to Step 4 for review
          router.refresh();
        }
      });
    };

    if (photos.length > 0) {
      setTimeout(runGeneration, 1500); // 1.5s photo-analyse simulatie
    } else {
      runGeneration();
    }
  }

  function handleApplyDraft() {
    if (preview) {
      onApplyDraft?.({
        customerId: customerId ? Number(customerId) : null,
        klant: selectedKlant() || "Klant",
        notes: `Project: ${projectName}\nAfmetingen: ${dimensions}\nKwaliteit: ${quality}\nBeschrijving: ${description}`,
        lines: preview,
      });
    }
  }

  const quickTemplates = [
    "Complete keuken",
    "Inrichting van zolders",
    "Houten terras",
    "Ramen en deuren plaatsen",
    "Gevelrenovatie met crepi"
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-6">
      
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
        <div className="flex items-center gap-2.5 text-zinc-100">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
            <Bot size={16} />
          </span>
          <div>
            <h2 className="text-sm font-bold">{agentName} — Assistent</h2>
            <p className="text-[10px] text-zinc-500">Stap {step === 4 ? "Afronding" : `${step}/3`}</p>
          </div>
        </div>
        {step > 1 && step < 4 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft size={14} /> Terug
          </button>
        )}
      </div>

      {/* STEP 1: Project Name & Template */}
      {step === 1 && (
        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-100">
              Geef je project een naam om te beginnen
            </h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Bijvoorbeeld: Renovatie Keuken, Schilderen Begane Grond..."
              className="w-full bg-transparent border-b border-zinc-700 focus:border-sky-500 py-3 text-lg font-medium text-zinc-100 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Snelle voorbeelden
            </span>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setProjectName(name);
                    setTimeout(() => setStep(2), 200);
                  }}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 transition-colors text-left"
                >
                  {name}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">
              Klik om te selecteren · Gaat automatisch door naar stap 2
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Project Specifications (New) */}
      {step === 2 && (
        <div className="space-y-5 py-1">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-100">
              Projectdetails voor: <span className="text-sky-400">{projectName}</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Vul details in om {agentName} te helpen de juiste materialen en tarieven te berekenen.
            </p>
          </div>

          <div className="space-y-4">
            {/* Dimensions Input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Afmetingen / Omvang (grootte in m², meters, stuks, etc.)
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="bv. 45 m², 12 strekkende meter, 3 ramen..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Quality Selection */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Gewenst afwerkingsniveau / Materiaalkwaliteit
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Budget", "Standaard", "Premium"].map((q) => {
                  const active = quality === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-sky-500 bg-sky-500/10 text-sky-300"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Extra Conditions Checkboxes */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Extra omstandigheden (vink aan wat van toepassing is)
              </label>
              <div className="grid gap-2 grid-cols-2">
                <label
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-medium transition-colors ${
                    demolition
                      ? "border-sky-500 bg-sky-500/10 text-sky-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={demolition}
                    onChange={(e) => setDemolition(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  Sloop- / afbraakwerk vooraf
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    scaffolding
                      ? "border-sky-500 bg-sky-500/10 text-sky-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={scaffolding}
                    onChange={(e) => setScaffolding(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  Steiger / hoogwerker vereist
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    narrowPassage
                      ? "border-sky-500 bg-sky-500/10 text-sky-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={narrowPassage}
                    onChange={(e) => setNarrowPassage(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  Smalle werf / doorgang
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    wasteRemoval
                      ? "border-sky-500 bg-sky-500/10 text-sky-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={wasteRemoval}
                    onChange={(e) => setWasteRemoval(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  Afval afvoeren & opkuis
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Description & Customer */}
      {step === 3 && (
        <div className="space-y-4 py-1">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-100">
              Gedetailleerde omschrijving
            </h3>
            <p className="text-xs text-zinc-400">
              Beschrijf eventuele aanvullende wensen en kies een klant.
            </p>
          </div>

          <div className="space-y-3">
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-sky-500/50"
            >
              <option value="">Klant selecteren (optioneel)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name || c.name}
                </option>
              ))}
            </select>

            <div className="relative rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden focus-within:border-sky-500/50">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Beschrijf hier de specifieke taken, bv. deuren schuren en gronden, 2 lagen zijdeglans verf aanbrengen..."
                className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 leading-relaxed"
              />
              
              <div className="flex items-center justify-between border-t border-white/5 bg-zinc-900/20 px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isListening 
                        ? "bg-rose-500/90 text-white" 
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    }`}
                    title={isListening ? "Opname stoppen" : "Inspreken"}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition-colors"
                    title="Foto's uploaden"
                  >
                    <ImageIcon size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                
                {isListening && (
                  <span className="text-[10px] text-rose-400 font-medium mr-2">
                    Aan het luisteren...
                  </span>
                )}
              </div>
            </div>

            {/* Photo Preview */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2.5 rounded-xl border border-white/5 bg-zinc-900/20 p-2.5">
                {photos.map((p, idx) => (
                  <div key={idx} className="group relative h-16 w-16 rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={p.url}
                      alt="Werk"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400"
                      title="Afbeelding verwijderen"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Generated Summary & Review */}
      {step === 4 && (
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles size={16} className="text-sky-400" />
              Voorstel gegenereerd door {agentName}
            </h3>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
            >
              Aanpassen
            </button>
          </div>

          {summary && (
            <p className="text-sm text-zinc-300 bg-zinc-900/40 rounded-xl p-3.5 border border-white/5 leading-relaxed">
              {summary}
            </p>
          )}

          {/* AI Berekeningen & Tips Panel */}
          {showTips && (generatedTips.length > 0 || calculations.length > 0) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3.5">
              <h3 className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <Lightbulb size={13} />
                Calculatie Berekeningen &amp; Tips
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2 text-xs leading-relaxed">
                {calculations.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1">
                      <Calculator size={12} className="text-sky-400" /> AI-Berekening:
                    </span>
                    <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                      {calculations.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {generatedTips.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-400" /> Aandachtspunten:
                    </span>
                    <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                      {generatedTips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {preview && preview.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Gegenereerde offertelijnen:
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                {preview.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <span className="truncate">{l.omschrijving}</span>
                    <span className="shrink-0 font-mono text-zinc-400 font-bold">
                      {formatEuro(l.aantal * l.prijs_per_eenheid)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-xl px-3.5 py-2">
          {error}
        </p>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
        
        {/* Progress Bar */}
        {step < 4 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <span>
                {step === 1 && "Stap 1: Projectnaam"}
                {step === 2 && "Stap 2: Details & Kwaliteit"}
                {step === 3 && "Stap 3: Omschrijving"}
              </span>
              <span>
                {step === 1 && "33%"}
                {step === 2 && "66%"}
                {step === 3 && "100%"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={() => router.push("/dashboard/offertes")}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Annuleren
              </button>
              <button
                type="button"
                disabled={!projectName.trim()}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Volgende stap
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Vorige
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400 transition-colors"
              >
                Volgende stap
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Vorige
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={pending || analyzingPhotos || !description.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {pending || analyzingPhotos ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Opstellen...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Projectvoorstel aanmaken
                  </>
                )}
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Terug naar stap 3
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyDraft();
                  setTimeout(() => {
                    document.getElementById("offerte-form-root")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400 transition-colors"
              >
                <ChevronRight size={14} />
                Offerte handmatig aanpassen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, MapPin, CheckCircle2, Mic, MicOff, Globe, ChevronDown, Play, Star } from "lucide-react";
import site from "@/content/site.json";

// ── Program data ──────────────────────────────────────────
const PROGRAMS = [
  { id:"infant",     label:"Infant Care",         minMonths:9,   maxMonths:24,  color:"#EC4899", bg:"rgba(236,72,153,0.1)", icon:"🍼", ratio:"1:3", time:"9AM–3:30PM", desc:"Gentle, responsive care in a sensory-rich environment. Dedicated caregiver for each infant." },
  { id:"playgroup",  label:"Playgroup",            minMonths:24,  maxMonths:36,  color:"#E8694A", bg:"rgba(232,105,74,0.1)", icon:"🎈", ratio:"1:4", time:"9AM–3:30PM", desc:"First steps into structured learning. Social skills, language and motor development through guided play." },
  { id:"nursery",    label:"Nursery",              minMonths:36,  maxMonths:48,  color:"#F5B829", bg:"rgba(245,184,41,0.12)", icon:"🌸", ratio:"1:6", time:"9AM–3:30PM", desc:"Pre-literacy and pre-numeracy skills with creative arts and cooperative play activities." },
  { id:"jrkg",       label:"Junior KG",            minMonths:48,  maxMonths:60,  color:"#6366F1", bg:"rgba(99,102,241,0.1)", icon:"📚", ratio:"1:8", time:"9AM–3:30PM", desc:"Phonics, basic maths, science awareness and school-readiness in a structured environment." },
  { id:"srkg",       label:"Senior KG",            minMonths:60,  maxMonths:84,  color:"#178F78", bg:"rgba(23,143,120,0.1)", icon:"🎓", ratio:"1:10", time:"9AM–3:30PM", desc:"Advanced literacy, numeracy and critical thinking — preparing children for primary school." },
  { id:"daycare",    label:"Full-Day Daycare",     minMonths:24,  maxMonths:72,  color:"#0F766E", bg:"rgba(15,118,110,0.1)", icon:"🏡", ratio:"1:6", time:"7AM–7PM", desc:"Extended care with educational activities, meals and rest — perfect for working parents." },
  { id:"afterschool",label:"After-School Program", minMonths:60,  maxMonths:144, color:"#7C3AED", bg:"rgba(124,58,237,0.1)", icon:"🚌", ratio:"1:10", time:"3PM–7PM", desc:"Supervised homework, snacks, enrichment activities and sports for school-going children." },
];

// ── Language options ──────────────────────────────────────
const LANGUAGES = [
  { code:"en-IN", label:"English",  native:"English",  flag:"🇮🇳" },
  { code:"kn-IN", label:"Kannada",  native:"ಕನ್ನಡ",    flag:"🇮🇳" },
  { code:"hi-IN", label:"Hindi",    native:"हिन्दी",     flag:"🇮🇳" },
  { code:"ta-IN", label:"Tamil",    native:"தமிழ்",    flag:"🇮🇳" },
  { code:"te-IN", label:"Telugu",   native:"తెలుగు",   flag:"🇮🇳" },
];

const UI_TEXT: Record<string, Record<string, string>> = {
  "en-IN": { title:"Enquiry Form", childName:"Child's Name", dob:"Date of Birth", phone:"Phone Number (WhatsApp)", parentName:"Parent/Guardian Name", address:"Address", program:"Interested Programme", submit:"Submit Enquiry", required:"mandatory", optional:"optional", suggest:"Suggested for your child", submitSuccess:"Thank you!", successMsg:"Your enquiry has been received. We will contact you shortly on WhatsApp.", speaking:"Listening...", tapMic:"Tap microphone to fill form by voice", greeting:"Hello! Welcome to Evergreen Preschool. Please tell me your child's name." },
  "kn-IN": { title:"ವಿಚಾರಣೆ ಫಾರ್ಮ್", childName:"ಮಗುವಿನ ಹೆಸರು", dob:"ಹುಟ್ಟಿದ ದಿನ", phone:"ಫೋನ್ ಸಂಖ್ಯೆ (WhatsApp)", parentName:"ಪೋಷಕರ ಹೆಸರು", address:"ವಿಳಾಸ", program:"ಆಸಕ್ತಿಯ ಕಾರ್ಯಕ್ರಮ", submit:"ವಿಚಾರಣೆ ಸಲ್ಲಿಸಿ", required:"ಕಡ್ಡಾಯ", optional:"ಐಚ್ಛಿಕ", suggest:"ನಿಮ್ಮ ಮಗುವಿಗೆ ಸೂಚಿಸಲಾಗಿದೆ", submitSuccess:"ಧನ್ಯವಾದಗಳು!", successMsg:"ನಿಮ್ಮ ವಿಚಾರಣೆಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ನಾವು ಶೀಘ್ರದಲ್ಲೇ WhatsApp ನಲ್ಲಿ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ.", speaking:"ಆಲಿಸುತ್ತಿದ್ದೇನೆ...", tapMic:"ಧ್ವನಿಯ ಮೂಲಕ ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಲು ಮೈಕ್ ಒತ್ತಿ", greeting:"ನಮಸ್ಕಾರ! ಎವರ್‌ಗ್ರೀನ್ ಪ್ರಿಸ್ಕೂಲ್‌ಗೆ ಸ್ವಾಗತ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮಗುವಿನ ಹೆಸರು ಹೇಳಿ." },
  "hi-IN": { title:"पूछताछ फॉर्म", childName:"बच्चे का नाम", dob:"जन्म तिथि", phone:"फोन नंबर (WhatsApp)", parentName:"माता/पिता का नाम", address:"पता", program:"रुचि का कार्यक्रम", submit:"पूछताछ जमा करें", required:"अनिवार्य", optional:"वैकल्पिक", suggest:"आपके बच्चे के लिए सुझाव", submitSuccess:"धन्यवाद!", successMsg:"आपकी पूछताछ प्राप्त हो गई है। हम जल्द ही WhatsApp पर संपर्क करेंगे।", speaking:"सुन रहा हूँ...", tapMic:"आवाज़ से फॉर्म भरने के लिए माइक दबाएं", greeting:"नमस्ते! एवरग्रीन प्रीस्कूल में आपका स्वागत है। कृपया अपने बच्चे का नाम बताएं।" },
  "ta-IN": { title:"விசாரணை படிவம்", childName:"குழந்தையின் பெயர்", dob:"பிறந்த தேதி", phone:"தொலைபேசி எண் (WhatsApp)", parentName:"பெற்றோர் பெயர்", address:"முகவரி", program:"விரும்பிய திட்டம்", submit:"விசாரணை சமர்ப்பிக்கவும்", required:"கட்டாயம்", optional:"விருப்பத்தேர்வு", suggest:"உங்கள் குழந்தைக்கு பரிந்துரை", submitSuccess:"நன்றி!", successMsg:"உங்கள் விசாரணை பெறப்பட்டது. விரைவில் WhatsApp-ல் தொடர்பு கொள்கிறோம்.", speaking:"கேட்கிறேன்...", tapMic:"குரலால் படிவம் நிரப்ப மைக்கை அழுத்தவும்", greeting:"வணக்கம்! எவர்கிரீன் பூர்வ பள்ளிக்கு வரவேற்கிறோம். உங்கள் குழந்தையின் பெயரைச் சொல்லுங்கள்." },
  "te-IN": { title:"విచారణ ఫారం", childName:"పిల్లల పేరు", dob:"పుట్టిన తేదీ", phone:"ఫోన్ నంబర్ (WhatsApp)", parentName:"తల్లిదండ్రుల పేరు", address:"చిరునామా", program:"ఆసక్తి కార్యక్రమం", submit:"విచారణ సమర్పించండి", required:"తప్పనిసరి", optional:"ఐచ్ఛికం", suggest:"మీ పిల్లలకు సూచించబడింది", submitSuccess:"ధన్యవాదాలు!", successMsg:"మీ విచారణ స్వీకరించబడింది. త్వరలో WhatsApp లో సంప్రదిస్తాము.", speaking:"వింటున్నాను...", tapMic:"వాయిస్ ద్వారా ఫారం నింపడానికి మైక్ నొక్కండి", greeting:"నమస్తే! ఎవర్‌గ్రీన్ ప్రీస్కూల్‌కు స్వాగతం. దయచేసి మీ పిల్లల పేరు చెప్పండి." },
};

function getAgeInMonths(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  return months;
}

function suggestPrograms(ageMonths: number | null): typeof PROGRAMS {
  if (ageMonths === null) return [];
  return PROGRAMS.filter(p => ageMonths >= p.minMonths && ageMonths < p.maxMonths);
}

function formatAge(months: number): string {
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y} yr ${m} mo` : `${y} years`;
}

type Status = "idle" | "sending" | "success";

export default function EnquiryPage() {
  const [lang, setLang]               = useState("en-IN");
  const [showLang, setShowLang]       = useState(false);
  const [form, setForm]               = useState({ childName:"", dob:"", phone:"", parentName:"", address:"", program:"" });
  const [status, setStatus]           = useState<Status>("idle");
  const [listening, setListening]     = useState(false);
  const [voiceField, setVoiceField]   = useState<string | null>(null);
  const [transcript, setTranscript]   = useState("");
  const [showCampus, setShowCampus]   = useState(false);
  const recognitionRef                = useRef<any>(null);
  const t = UI_TEXT[lang] || UI_TEXT["en-IN"];
  const ageMonths   = getAgeInMonths(form.dob);
  const suggested   = suggestPrograms(ageMonths);
  const selectedProg = PROGRAMS.find(p => p.id === form.program);

  // Voice input
  const startVoice = useCallback((field: string) => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser. Please use Chrome.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => { setListening(true); setVoiceField(field); setTranscript(""); };
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setForm(prev => ({ ...prev, [field]: t }));
        setListening(false); setVoiceField(null); setTranscript("");
      }
    };
    rec.onerror = () => { setListening(false); setVoiceField(null); };
    rec.onend   = () => { setListening(false); setVoiceField(null); };
    recognitionRef.current = rec;
    rec.start();
  }, [lang]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false); setVoiceField(null);
  }, []);

  // Auto-suggest program from DOB
  useEffect(() => {
    if (suggested.length === 1 && !form.program) {
      setForm(p => ({ ...p, program: suggested[0].id }));
    }
  }, [form.dob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise(r => setTimeout(r, 1200));
    setStatus("success");
    // Open WhatsApp with confirmation
    const prog = PROGRAMS.find(p => p.id === form.program);
    const msg = `🌿 *Evergreen Preschool — Enquiry Confirmation*\n\nDear ${form.parentName || "Parent"},\n\nThank you for your enquiry for *${form.childName}*!\n\n📋 *Programme Suggested:* ${prog?.label || "To be confirmed"}\n👶 *Age:* ${ageMonths ? formatAge(ageMonths) : "-"}\n🕐 *Timing:* ${prog?.time || "-"}\n👩‍🏫 *Ratio:* ${prog?.ratio || "-"}\n\n*Next Steps:*\n1. Our team will call you within 1 business day\n2. Schedule a free campus visit\n3. Meet the teachers\n\n📍 1427, 13th Cross, Ananthnagar Phase 2, Electronic City, Bengaluru\n📞 ${site.phone}\n\n_We look forward to welcoming ${form.childName} to the Evergreen family!_ 🌿`;
    const waUrl = `https://wa.me/91${site.phone}?text=${encodeURIComponent(msg)}`;
    setTimeout(() => window.open(waUrl, "_blank"), 800);
  };

  const inp = "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all";
  const inpStyle = { borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" };
  const inpFocusStyle = { "--tw-ring-color":"#178F78" } as any;

  if (status === "success") {
    return (
      <div style={{ minHeight:"100vh", background:"#FEFCF8", fontFamily:"'Quicksand',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
        <div style={{ maxWidth:"520px", width:"100%", textAlign:"center" }}>
          <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:"rgba(23,143,120,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"40px" }}>✅</div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"2rem", fontWeight:700, color:"#178F78", marginBottom:"8px" }}>{t.submitSuccess}</div>
          <p style={{ color:"#6B7A99", marginBottom:"20px", lineHeight:1.6 }}>{t.successMsg}</p>

          {selectedProg && (
            <div style={{ background:"white", borderRadius:"20px", border:`2px solid ${selectedProg.color}33`, padding:"20px", marginBottom:"20px", textAlign:"left" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
                <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:selectedProg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 }}>{selectedProg.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.3rem", fontWeight:700, color:selectedProg.color }}>{selectedProg.label}</div>
                  <div style={{ fontSize:"12px", color:"#6B7A99" }}>Age: {selectedProg.minMonths < 12 ? `${selectedProg.minMonths} months` : `${Math.floor(selectedProg.minMonths/12)}–${Math.floor(selectedProg.maxMonths/12)} years`}</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px" }}>
                {[["⏰","Timing",selectedProg.time],["👩‍🏫","Ratio",selectedProg.ratio],["📍","Location","Electronic City"]].map(([icon,label,val])=>(
                  <div key={label} style={{ background:"#FAF0E8", borderRadius:"10px", padding:"8px", textAlign:"center" }}>
                    <div style={{ fontSize:"16px", marginBottom:"2px" }}>{icon}</div>
                    <div style={{ fontSize:"10px", color:"#6B7A99" }}>{label}</div>
                    <div style={{ fontSize:"11px", fontWeight:700, color:"#1A2F4A" }}>{val}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:"12px", color:"#6B7A99", lineHeight:1.6 }}>{selectedProg.desc}</p>
            </div>
          )}

          {/* 360 Campus View */}
          <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", overflow:"hidden", marginBottom:"16px" }}>
            <div style={{ background:"#178F78", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"14px", fontWeight:700, color:"white" }}>🏫 Take a Virtual Campus Tour</div>
              <button onClick={() => setShowCampus(!showCampus)}
                style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"20px", padding:"4px 12px", color:"white", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                {showCampus ? "Hide" : "View 360°"}
              </button>
            </div>
            {showCampus && (
              <div>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!4v1700000000000!6m8!1m7!1sCAoSLEFGMVFpcE5FczdxQ3VsRnFlS3RUWG9mT0w4bEVVVzVlR0JOT3VQZ3IwWjhj!2m2!1d12.8406!2d77.6784!3f0!4f0!5f0.7820865974627469"
                  width="100%" height="240" style={{ border:0, display:"block" }} allowFullScreen loading="lazy"
                  title="Evergreen Preschool Campus View" />
                <div style={{ padding:"10px 14px", background:"#FAF0E8" }}>
                  <p style={{ fontSize:"11px", color:"#6B7A99", textAlign:"center" }}>
                    📍 1427, 13th Cross, Ananthnagar Phase 2, Electronic City, Bengaluru
                  </p>
                  <div style={{ display:"flex", gap:"8px", justifyContent:"center", marginTop:"8px" }}>
                    <a href="https://maps.google.com/?q=Evergreen+Preschool+Anantha+Nagar+Bengaluru" target="_blank" rel="noopener noreferrer"
                      style={{ background:"#4285F4", color:"white", borderRadius:"20px", padding:"5px 14px", fontSize:"11px", fontWeight:700, textDecoration:"none" }}>
                      Open in Google Maps
                    </a>
                    <a href={`https://wa.me/91${site.phone}?text=Hi! I would like to schedule a campus visit.`} target="_blank" rel="noopener noreferrer"
                      style={{ background:"#25D366", color:"white", borderRadius:"20px", padding:"5px 14px", fontSize:"11px", fontWeight:700, textDecoration:"none" }}>
                      Book a Visit
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <a href="/" style={{ display:"inline-block", background:"#178F78", color:"white", borderRadius:"20px", padding:"10px 24px", fontWeight:700, fontSize:"13px", textDecoration:"none" }}>
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#FEFCF8", fontFamily:"'Quicksand',sans-serif", paddingBottom:"40px" }}>

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#178F78,#0f6b5a)", padding:"28px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize:"24px 24px" }} />
        <div style={{ maxWidth:"680px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
            <div>
              <div style={{ display:"flex", gap:"5px", marginBottom:"6px" }}>
                {[1,2,3,4,5].map(i => <Star key={i} style={{ width:"14px", height:"14px", fill:"#F5B829", color:"#F5B829" }} />)}
                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.8)", marginLeft:"4px" }}>4.9 · 160 Google reviews</span>
              </div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.8rem", fontWeight:700, color:"white", lineHeight:1.2, marginBottom:"4px" }}>
                {t.title}
              </div>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.75)" }}>Evergreen Preschool & Daycare · Electronic City, Bengaluru</p>
            </div>

            {/* Language selector */}
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowLang(!showLang)}
                style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.2)", border:"1.5px solid rgba(255,255,255,0.4)", borderRadius:"20px", padding:"6px 14px", color:"white", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                <Globe style={{ width:"14px", height:"14px" }} />
                {LANGUAGES.find(l=>l.code===lang)?.native}
                <ChevronDown style={{ width:"12px", height:"12px" }} />
              </button>
              {showLang && (
                <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", overflow:"hidden", zIndex:50, minWidth:"160px" }}>
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false); }}
                      style={{ display:"flex", alignItems:"center", gap:"10px", width:"100%", padding:"9px 14px", background:lang===l.code?"rgba(23,143,120,0.08)":"transparent", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:lang===l.code?700:400, color:"#1A2F4A", textAlign:"left" }}>
                      <span>{l.flag}</span>
                      <span>{l.native}</span>
                      {lang===l.code && <span style={{ marginLeft:"auto", color:"#178F78" }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Voice hint */}
          <div style={{ marginTop:"14px", display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.15)", borderRadius:"12px", padding:"8px 14px" }}>
            <Mic style={{ width:"14px", height:"14px", color:"white", flexShrink:0 }} />
            <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.9)" }}>{t.tapMic}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"20px" }}>

        {/* Voice listening indicator */}
        {listening && (
          <div style={{ background:"rgba(232,105,74,0.1)", border:"2px solid #E8694A", borderRadius:"16px", padding:"12px 16px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:"#E8694A", animation:"pulse 1s infinite" }} />
            <div>
              <div style={{ fontSize:"12px", fontWeight:700, color:"#E8694A" }}>{t.speaking}</div>
              {transcript && <div style={{ fontSize:"11px", color:"#6B7A99", marginTop:"2px" }}>&ldquo;{transcript}&rdquo;</div>}
            </div>
            <button onClick={stopVoice} style={{ marginLeft:"auto", background:"#E8694A", border:"none", borderRadius:"20px", padding:"4px 12px", color:"white", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>Stop</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ background:"white", borderRadius:"24px", border:"1px solid #EDE8DF", padding:"24px", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>

            {/* Child Name */}
            <div style={{ marginBottom:"16px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                <label style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {t.childName} <span style={{ color:"#E8694A" }}>*</span>
                </label>
                <button type="button" onClick={() => listening && voiceField==="childName" ? stopVoice() : startVoice("childName")}
                  style={{ display:"flex", alignItems:"center", gap:"4px", background:voiceField==="childName"?"#E8694A":"rgba(23,143,120,0.1)", border:"none", borderRadius:"20px", padding:"3px 10px", color:voiceField==="childName"?"white":"#178F78", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                  {voiceField==="childName" ? <MicOff style={{width:"11px",height:"11px"}}/> : <Mic style={{width:"11px",height:"11px"}}/>}
                  {voiceField==="childName" ? "Stop" : "Voice"}
                </button>
              </div>
              <input required className={inp} style={inpStyle} placeholder="e.g. Aarav Kumar"
                value={form.childName} onChange={e => setForm(p=>({...p,childName:e.target.value}))} />
            </div>

            {/* DOB */}
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"6px" }}>
                {t.dob} <span style={{ color:"#E8694A" }}>*</span>
              </label>
              <input required type="date" className={inp} style={inpStyle}
                max={new Date().toISOString().split("T")[0]}
                value={form.dob} onChange={e => setForm(p=>({...p,dob:e.target.value}))} />
              {ageMonths !== null && (
                <div style={{ marginTop:"6px", display:"flex", alignItems:"center", gap:"6px" }}>
                  <span style={{ fontSize:"11px", background:"rgba(23,143,120,0.1)", color:"#178F78", borderRadius:"20px", padding:"2px 10px", fontWeight:600 }}>
                    Age: {formatAge(ageMonths)}
                  </span>
                  {suggested.length > 0 && (
                    <span style={{ fontSize:"11px", color:"#6B7A99" }}>→ {t.suggest}</span>
                  )}
                </div>
              )}
            </div>

            {/* Program suggestions */}
            {suggested.length > 0 && (
              <div style={{ marginBottom:"16px" }}>
                <label style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"8px" }}>
                  {t.program}
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  {suggested.map(prog => (
                    <button key={prog.id} type="button" onClick={() => setForm(p=>({...p,program:prog.id}))}
                      style={{ border:`2px solid ${form.program===prog.id ? prog.color : "#EDE8DF"}`, borderRadius:"14px", padding:"12px", textAlign:"left", background:form.program===prog.id ? prog.bg : "white", cursor:"pointer", transition:"all 0.2s" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                        <span style={{ fontSize:"20px" }}>{prog.icon}</span>
                        <span style={{ fontSize:"13px", fontWeight:700, color:form.program===prog.id ? prog.color : "#1A2F4A" }}>{prog.label}</span>
                        {form.program===prog.id && <span style={{ marginLeft:"auto", color:prog.color, fontSize:"14px" }}>✓</span>}
                      </div>
                      <div style={{ fontSize:"10px", color:"#6B7A99" }}>{prog.time} · Ratio {prog.ratio}</div>
                    </button>
                  ))}
                </div>
                {/* Show all programs option */}
                {PROGRAMS.filter(p => !suggested.find(s=>s.id===p.id)).length > 0 && (
                  <details style={{ marginTop:"8px" }}>
                    <summary style={{ fontSize:"11px", color:"#178F78", fontWeight:600, cursor:"pointer", padding:"4px 0" }}>View all programmes</summary>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginTop:"6px" }}>
                      {PROGRAMS.filter(p => !suggested.find(s=>s.id===p.id)).map(prog => (
                        <button key={prog.id} type="button" onClick={() => setForm(p=>({...p,program:prog.id}))}
                          style={{ border:`2px solid ${form.program===prog.id ? prog.color : "#EDE8DF"}`, borderRadius:"12px", padding:"10px", textAlign:"left", background:form.program===prog.id ? prog.bg : "white", cursor:"pointer", opacity:0.7 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                            <span style={{ fontSize:"16px" }}>{prog.icon}</span>
                            <span style={{ fontSize:"11px", fontWeight:700, color:form.program===prog.id ? prog.color : "#1A2F4A" }}>{prog.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Phone */}
            <div style={{ marginBottom:"16px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                <label style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {t.phone} <span style={{ color:"#E8694A" }}>*</span>
                </label>
                <button type="button" onClick={() => listening && voiceField==="phone" ? stopVoice() : startVoice("phone")}
                  style={{ display:"flex", alignItems:"center", gap:"4px", background:voiceField==="phone"?"#E8694A":"rgba(23,143,120,0.1)", border:"none", borderRadius:"20px", padding:"3px 10px", color:voiceField==="phone"?"white":"#178F78", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                  {voiceField==="phone" ? <MicOff style={{width:"11px",height:"11px"}}/> : <Mic style={{width:"11px",height:"11px"}}/>}
                  Voice
                </button>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <div style={{ background:"#FAF0E8", border:"1px solid #EDE8DF", borderRadius:"12px", padding:"0 12px", display:"flex", alignItems:"center", flexShrink:0 }}>
                  <span style={{ fontSize:"13px", color:"#6B7A99" }}>🇮🇳 +91</span>
                </div>
                <input required type="tel" pattern="[0-9]{10}" className={inp} style={{ ...inpStyle, flex:1 }}
                  placeholder="10-digit WhatsApp number"
                  value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value.replace(/\D/g,"").slice(0,10)}))} />
              </div>
              <p style={{ fontSize:"10px", color:"#6B7A99", marginTop:"4px" }}>📱 Confirmation will be sent to this WhatsApp number</p>
            </div>

            {/* Optional fields */}
            <div style={{ borderTop:"1px solid #EDE8DF", paddingTop:"16px", marginBottom:"16px" }}>
              <div style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"12px" }}>
                Optional — helps us personalise your visit
              </div>

              <div style={{ marginBottom:"12px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                  <label style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    {t.parentName}
                  </label>
                  <button type="button" onClick={() => listening && voiceField==="parentName" ? stopVoice() : startVoice("parentName")}
                    style={{ display:"flex", alignItems:"center", gap:"4px", background:voiceField==="parentName"?"#E8694A":"rgba(23,143,120,0.1)", border:"none", borderRadius:"20px", padding:"3px 10px", color:voiceField==="parentName"?"white":"#178F78", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                    {voiceField==="parentName" ? <MicOff style={{width:"11px",height:"11px"}}/> : <Mic style={{width:"11px",height:"11px"}}/>}
                    Voice
                  </button>
                </div>
                <input className={inp} style={inpStyle} placeholder="e.g. Priya Sharma"
                  value={form.parentName} onChange={e => setForm(p=>({...p,parentName:e.target.value}))} />
              </div>

              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                  <label style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A", textTransform:"uppercase", letterSpacing:"0.06em" }}>{t.address}</label>
                  <button type="button" onClick={() => listening && voiceField==="address" ? stopVoice() : startVoice("address")}
                    style={{ display:"flex", alignItems:"center", gap:"4px", background:voiceField==="address"?"#E8694A":"rgba(23,143,120,0.1)", border:"none", borderRadius:"20px", padding:"3px 10px", color:voiceField==="address"?"white":"#178F78", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                    {voiceField==="address" ? <MicOff style={{width:"11px",height:"11px"}}/> : <Mic style={{width:"11px",height:"11px"}}/>}
                    Voice
                  </button>
                </div>
                <input className={inp} style={inpStyle} placeholder="Area / Locality"
                  value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={status==="sending"}
              style={{ width:"100%", padding:"14px", borderRadius:"20px", background:"#E8694A", color:"white", border:"none", fontFamily:"'Quicksand',sans-serif", fontSize:"15px", fontWeight:700, cursor:"pointer", boxShadow:"0 6px 20px rgba(232,105,74,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:status==="sending"?0.7:1 }}>
              {status==="sending"
                ? <><span style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }}/> Submitting…</>
                : <>{t.submit} →</>}
            </button>
            <p style={{ textAlign:"center", fontSize:"11px", color:"#6B7A99", marginTop:"8px" }}>
              💬 WhatsApp confirmation sent instantly · No spam
            </p>
          </div>
        </form>

        {/* Campus View Section */}
        <div style={{ marginTop:"20px", background:"white", borderRadius:"24px", border:"1px solid #EDE8DF", overflow:"hidden" }}>
          <button onClick={() => setShowCampus(!showCampus)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", background:"white", border:"none", cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"rgba(23,143,120,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>🏫</div>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78" }}>Virtual Campus Tour</div>
                <div style={{ fontSize:"11px", color:"#6B7A99" }}>See our facilities before you visit</div>
              </div>
            </div>
            <div style={{ background:"#178F78", color:"white", borderRadius:"20px", padding:"5px 14px", fontSize:"11px", fontWeight:700 }}>
              {showCampus ? "Hide" : "View 360°"} {showCampus ? "▲" : "▼"}
            </div>
          </button>

          {showCampus && (
            <div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.2!2d77.6784!3d12.8406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae6c534088b4b7%3A0x221c70ea5d54f0c2!2sEvergreen+Preschool+and+Daycare+Anantha+Nagar!5e0!3m2!1sen!2sin!4v1700000000000"
                width="100%" height="280" style={{ border:0, display:"block" }} allowFullScreen loading="lazy"
                title="Evergreen Preschool Location" />
              <div style={{ padding:"14px 18px", background:"#FAF0E8" }}>
                <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
                  <a href="https://maps.google.com/?q=place_id:ChIJt4CogFNtrjsRwvBT5V3qcCI" target="_blank" rel="noopener noreferrer"
                    style={{ flex:1, background:"#4285F4", color:"white", borderRadius:"12px", padding:"8px", fontSize:"11px", fontWeight:700, textDecoration:"none", textAlign:"center" }}>
                    📍 Open in Google Maps
                  </a>
                  <a href={`https://wa.me/91${site.phone}?text=Hi! I would like to schedule a campus visit to Evergreen Preschool.`} target="_blank" rel="noopener noreferrer"
                    style={{ flex:1, background:"#25D366", color:"white", borderRadius:"12px", padding:"8px", fontSize:"11px", fontWeight:700, textDecoration:"none", textAlign:"center" }}>
                    💬 Book a Visit
                  </a>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  {[["🏫","Modern Classrooms","Spacious, bright & safe"],["🛝","Outdoor Play Area","Designed for all ages"],["🍱","Nutrition Kitchen","Healthy meals daily"],["🔒","CCTV & Security","24/7 monitored premises"]].map(([icon,title,desc])=>(
                    <div key={title} style={{ background:"white", borderRadius:"10px", padding:"10px", display:"flex", alignItems:"flex-start", gap:"8px" }}>
                      <span style={{ fontSize:"18px", flexShrink:0 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize:"11px", fontWeight:700, color:"#1A2F4A" }}>{title}</div>
                        <div style={{ fontSize:"10px", color:"#6B7A99" }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact strip */}
        <div style={{ marginTop:"16px", background:"#178F78", borderRadius:"20px", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
          <div style={{ color:"rgba(255,255,255,0.85)", fontSize:"11px" }}>Have questions? Call us directly</div>
          <a href={`tel:${site.phone}`} style={{ background:"white", color:"#178F78", borderRadius:"20px", padding:"6px 18px", fontWeight:700, fontSize:"13px", textDecoration:"none", display:"flex", alignItems:"center", gap:"6px" }}>
            <Phone style={{ width:"14px", height:"14px" }} /> {site.phone}
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>
    </div>
  );
}

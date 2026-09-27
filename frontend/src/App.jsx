import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Leaf,
  History,
  Sun,
  Moon,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Languages,
  Activity,
  Droplet,
  Zap,
  Trash2,
  Sparkles,
  FileText
} from 'lucide-react';
import "./App.css";

// --- Constants & Config ---
const APP_ID = "phytomonitor-v1";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// --- Helper Functions ---

// Generate compressed canvas thumbnail (max 200x200px) to prevent LocalStorage QuotaExceededError
const createThumbnail = (dataUrl, maxDim = 200) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
      } else {
        if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// --- Helper Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "", icon: Icon }) => {
  const variants = {
    primary: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700/70",
    outline: "border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

// --- Main Application Component ---

export default function App() {
  const [view, setView] = useState('home'); // home, processing, result, history
  const [image, setImage] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lang, setLang] = useState('en'); // en, ta
  const [backendHealth, setBackendHealth] = useState({ online: false, checking: true });
  const [activeTab, setActiveTab] = useState('treatment'); // treatment, prevention

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Dictionary for translations
  const t = {
    en: {
      title: "PhytoMonitor",
      tagline: "AI-Powered Plant Pathology & Disease Detection",
      upload: "Upload Leaf Image",
      camera: "Take Photo",
      dragDrop: "Drag & drop plant leaf image here, or click to browse",
      history: "Scan History",
      processing: "Analyzing Plant Health...",
      processingSub: "Executing Deep Convolutional Neural Network...",
      confidence: "Confidence Score",
      treatment: "Treatment & Care",
      prevention: "Prevention Rules",
      irrigation: "Irrigation Guidelines",
      fertilization: "Soil Nutrition",
      pestControl: "Pest Management",
      expert: "Note: Always consult a local agricultural extension specialist for critical crop management decisions.",
      back: "Start New Scan",
      clearHistory: "Clear History",
      savePdf: "Save PDF Report",
      share: "Share Result",
      healthy: "Healthy Plant",
      bacterial: "Bacterial Infection",
      fungal: "Fungal Disease",
      viral: "Viral Pathogen",
      unknown: "Unknown Diagnosis",
      engineOnline: "ML Engine Ready",
      engineOffline: "Backend Offline",
      lowConfTitle: "Low Confidence Detection",
      lowConfDesc: "The AI was uncertain about this image. Please upload a clear, well-lit close-up photo of a single leaf.",
      noHistory: "No saved scans found.",
      clearConfirm: "Are you sure you want to clear your scan history?"
    },
    ta: {
      title: "பைட்டோமானிட்டர்",
      tagline: "செயற்கை நுண்ணறிவு வழி தாவர நோய் கண்டறிதல்",
      upload: "படத்தைப் பதிவேற்றவும்",
      camera: "புகைப்படம் எடுக்கவும்",
      dragDrop: "இலை படத்தை இங்கே இழுக்கவும் அல்லது கிளிக் செய்யவும்",
      history: "ஆராய்ச்சி வரலாறு",
      processing: "தாவர ஆரோக்கியத்தை ஆராய்கிறது...",
      processingSub: "நரம்பியல் பிணைய மாதிரியை இயக்குகிறது...",
      confidence: "நம்பிக்கை சதவீதம்",
      treatment: "சிகிச்சை மற்றும் பராமரிப்பு",
      prevention: "தடுப்பு முறைகள்",
      irrigation: "நீர்ப்பாசன வழிகாட்டுதல்",
      fertilization: "மண் உர மேலாண்மை",
      pestControl: "பூச்சி கட்டுப்பாடு",
      expert: "குறிப்பு: முக்கியமான முடிவுகளுக்கு எப்போதும் வேளாண் நிபுணரை அணுகவும்.",
      back: "புதிய ஸ்கேன்",
      clearHistory: "வரலாற்றை நீக்கு",
      savePdf: "PDF அறிக்கை பெறுக",
      share: "பகிரவும்",
      healthy: "ஆரோக்கியமான தாவரம்",
      bacterial: "பாக்டீரியா நோய்",
      fungal: "பூஞ்சை நோய்",
      viral: "வைரஸ் நோய்",
      unknown: "தெரியாத நிலை",
      engineOnline: "ML இயங்குகிறது",
      engineOffline: "இணைப்பு இல்லை",
      lowConfTitle: "குறைந்த நம்பிக்கை அளவு",
      lowConfDesc: "படம் தெளிவாக இல்லை. தெளிவான இலை படத்தை பதிவேற்றவும்.",
      noHistory: "வரலாறு எதுவும் இல்லை.",
      clearConfirm: "வரலாற்றை நிச்சயமாக நீக்க விரும்புகிறீர்களா?"
    }
  };

  const labels = t[lang];

  // Check Backend Health Status on Mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setBackendHealth({ online: data.status === 'success', checking: false });
        } else {
          setBackendHealth({ online: false, checking: false });
        }
      } catch (e) {
        setBackendHealth({ online: false, checking: false });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Theme Logic
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Load History
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}_history`);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load history from localStorage:", e);
    }
  }, []);

  // Save History with Compressed Canvas Thumbnail
  const saveToHistory = async (item) => {
    try {
      const thumbnail = await createThumbnail(item.image, 160);
      const historyItem = { ...item, image: thumbnail };
      const newHistory = [historyItem, ...history.filter(h => h.id !== item.id)].slice(0, 15);
      setHistory(newHistory);
      localStorage.setItem(`${APP_ID}_history`, JSON.stringify(newHistory));
    } catch (e) {
      console.warn("LocalStorage quota reached. Pruning history.", e);
      try {
        const pruned = [history[0]].filter(Boolean);
        localStorage.setItem(`${APP_ID}_history`, JSON.stringify(pruned));
      } catch (err) {}
    }
  };

  // --- Image Handling ---

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size too large. Maximum allowed size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      processImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Camera access denied or unavailable.");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const maxDim = 1000;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;
      if (width > maxDim || height > maxDim) {
        const ratio = width / height;
        if (width > height) { width = maxDim; height = Math.round(maxDim / ratio); }
        else { height = maxDim; width = Math.round(maxDim * ratio); }
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach(track => track.stop());

      setImage(dataUrl);
      setIsCameraActive(false);
      processImage(dataUrl);
    }
  };

  // --- AI API Processing ---

  const processImage = async (base64Image) => {
    setView('processing');
    setError(null);

    try {
      // Base64 to Blob/File conversion
      const parts = base64Image.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], "plant_leaf.jpg", { type: mimeString });

      const formData = new FormData();
      formData.append("image", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for ML execution

      const response = await fetch(`/api/plants/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server Error (${response.status})`);
      }

      const result = await response.json();
      if (result.status !== 'success' || !result.data) {
        throw new Error("Invalid response received from server.");
      }

      const aiData = result.data;
      const predictionResult = {
        ...aiData,
        id: Date.now(),
        date: new Date().toLocaleString(),
        image: base64Image
      };

      setPrediction(predictionResult);
      await saveToHistory(predictionResult);
      setView('result');
    } catch (err) {
      console.error("ANALYSIS ERROR:", err);
      const msg = err.name === 'AbortError' 
        ? "Request timed out. The server took too long to analyze the image."
        : (err.message || "Failed to analyze image. Please verify backend server is running.");
      
      setError(msg);
      setView('home');
    }
  };

  // Category Color Map
  const getCategoryTheme = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'healthy') return {
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/50",
      bar: "from-emerald-500 to-teal-500",
      label: labels.healthy
    };
    if (c.includes('viral')) return {
      badge: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300/50",
      bar: "from-purple-500 to-indigo-500",
      label: labels.viral
    };
    if (c.includes('bacterial')) return {
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/50",
      bar: "from-amber-500 to-orange-500",
      label: labels.bacterial
    };
    return {
      badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/50",
      bar: "from-rose-500 to-red-500",
      label: labels.fungal
    };
  };

  // --- Render Views ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-3xl text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-500/30 shadow-inner">
          <Leaf size={48} className="animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
          Phyto<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Monitor</span>
        </h1>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
          {labels.tagline}
        </p>
      </div>

      <Card className="w-full max-w-2xl p-6 md:p-8 border-dashed border-2 border-emerald-300/70 dark:border-emerald-700/50 bg-emerald-50/20 dark:bg-slate-900/40">
        <div className="flex flex-col items-center space-y-6">
          <div
            className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 bg-white/40 dark:bg-slate-800/40 hover:scale-[1.01]"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-4 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full mb-3">
              <Upload size={32} />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold text-center px-4">
              {labels.dragDrop}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Supports JPG, PNG, WebP (Max 10MB)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              className="flex-1 py-3.5"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              {labels.upload}
            </Button>
            <Button
              className="flex-1 py-3.5"
              variant="secondary"
              icon={Camera}
              onClick={startCamera}
            >
              {labels.camera}
            </Button>
          </div>
        </div>
      </Card>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-8">
        {[
          { icon: ShieldCheck, title: "Deep Neural Net", desc: "15 Plant disease classes" },
          { icon: Zap, title: "Instant Diagnosis", desc: "Fast agronomic remedies" },
          { icon: History, title: "Scan History", desc: "Lightweight local tracking" }
        ].map((feat, i) => (
          <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <feat.icon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{feat.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-[55vh] space-y-6 text-center">
      <div className="relative">
        <div className="w-28 h-28 border-4 border-emerald-200 dark:border-emerald-900 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 w-28 h-28 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
        <Leaf className="absolute inset-0 m-auto text-emerald-600 animate-bounce" size={36} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{labels.processing}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{labels.processingSub}</p>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!prediction) return null;
    const catTheme = getCategoryTheme(prediction.category);

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Warning Banner for Low Confidence */}
        {prediction.low_confidence && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-sm">{labels.lowConfTitle}</h4>
              <p className="text-xs mt-1 leading-relaxed">{labels.lowConfDesc}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Image & Confidence Meter */}
          <div className="w-full lg:w-5/12 space-y-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <img
                src={prediction.image}
                className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-500"
                alt="Analyzed leaf scan"
              />
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold text-white shadow-sm">
                ID: #{prediction.id.toString().slice(-6)}
              </div>
            </div>

            <Card className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600 dark:text-slate-400">{labels.confidence}</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{prediction.confidence}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className={`bg-gradient-to-r ${catTheme.bar} h-full rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.max(prediction.confidence, 5)}%` }}
                ></div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 py-2.5" icon={Download} onClick={() => window.print()}>
                {labels.savePdf}
              </Button>
              <Button variant="secondary" className="px-4" icon={Share2} onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'PhytoMonitor Diagnosis',
                      text: `Plant diagnosis: ${prediction.disease} (${prediction.confidence}% confidence)`,
                      url: window.location.href
                    });
                  } catch (e) {}
                } else {
                  alert("Link copied to clipboard!");
                }
              }} />
            </div>
          </div>

          {/* Right Column: Disease Diagnosis & Remedies */}
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <div className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border ${catTheme.badge}`}>
                {catTheme.label}
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {prediction.disease}
              </h2>
            </div>

            {/* Advice Sections */}
            <div className="space-y-4">
              {/* Treatment */}
              <div className="p-6 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold mb-3">
                  <CheckCircle2 size={20} />
                  {labels.treatment}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {prediction.advice?.treatment || "No specific treatment required."}
                </p>
              </div>

              {/* Prevention */}
              <div className="p-6 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-bold mb-3">
                  <ShieldCheck size={20} />
                  {labels.prevention}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {prediction.advice?.prevention || "Maintain good soil drainage and tool hygiene."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-slate-600 dark:text-slate-400 text-xs leading-relaxed border border-slate-200 dark:border-slate-700">
              <AlertTriangle className="flex-shrink-0 text-amber-500" size={16} />
              <p>{labels.expert}</p>
            </div>

            <Button variant="outline" className="w-full sm:w-auto" icon={RefreshCw} onClick={() => setView('home')}>
              {labels.back}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History size={24} /> {labels.history}
        </h2>
        {history.length > 0 && (
          <Button variant="ghost" className="text-rose-500 hover:text-rose-600" icon={Trash2} onClick={() => {
            if (window.confirm(labels.clearConfirm)) {
              localStorage.removeItem(`${APP_ID}_history`);
              setHistory([]);
            }
          }}>
            {labels.clearHistory}
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <p className="text-slate-400 font-medium">{labels.noHistory}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 cursor-pointer hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 group"
              onClick={() => {
                setPrediction(item);
                setView('result');
              }}
            >
              <img src={item.image} className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{item.disease}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{item.date}</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.confidence}% Confidence</span>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" size={20} />
            </div>
          ))}
        </div>
      )}
      <Button variant="secondary" className="w-full" onClick={() => setView('home')}>
        {labels.back}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-md">
              <Leaf size={20} />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Phyto<span className="text-emerald-600 dark:text-emerald-400">Monitor</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Health Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className={`w-2 h-2 rounded-full ${backendHealth.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-slate-600 dark:text-slate-300">
                {backendHealth.checking ? "Checking..." : backendHealth.online ? labels.engineOnline : labels.engineOffline}
              </span>
            </div>

            <Button
              variant="ghost"
              className="px-2.5"
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            >
              <Languages size={18} />
              <span className="text-xs uppercase font-bold">{lang}</span>
            </Button>

            <Button variant="ghost" className="px-2.5" onClick={() => setView('history')}>
              <History size={18} />
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-500 text-white font-bold rounded-full">
                  {history.length}
                </span>
              )}
            </Button>

            <Button variant="ghost" className="px-2.5" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 max-w-3xl mx-auto p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-300 animate-in slide-in-from-top-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <p className="flex-1 text-sm font-semibold">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-rose-200/50 rounded-lg cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}

        {view === 'home' && renderHome()}
        {view === 'processing' && renderProcessing()}
        {view === 'result' && renderResult()}
        {view === 'history' && renderHistory()}
      </main>

      {/* Camera Capture Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/50">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-3xl pointer-events-none">
              <div className="absolute inset-[15%] border border-white/40 border-dashed rounded-2xl"></div>
            </div>
          </div>

          <div className="mt-6 flex gap-6 items-center">
            <button
              className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              onClick={() => {
                const stream = videoRef.current?.srcObject;
                if (stream) stream.getTracks().forEach(t => t.stop());
                setIsCameraActive(false);
              }}
            >
              <X size={26} />
            </button>
            <button
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-8 border-white/20 active:scale-90 transition-transform cursor-pointer shadow-lg"
              onClick={capturePhoto}
            >
              <div className="w-14 h-14 bg-emerald-600 rounded-full"></div>
            </button>
            <div className="w-14"></div>
          </div>
          <p className="mt-3 text-white/70 text-xs">Position the leaf within the frame</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-slate-400 text-xs font-medium">
          PhytoMonitor System • Precision Agronomic AI © 2026
        </p>
      </footer>

      {/* Print stylesheet */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          nav, button, footer, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .max-w-5xl { max-width: 100% !important; margin: 0 !important; }
        }
      `}} />
    </div>
  );
}
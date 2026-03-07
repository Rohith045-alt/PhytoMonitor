
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
  Languages
} from 'lucide-react';
import "./App.css";

// --- Constants & Config ---
const APP_ID = "phytomonitor-v1";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// --- Helper Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "", icon: Icon }) => {
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
    secondary: "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-slate-50",
    outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50",
    ghost: "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} />}
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Translations
  const t = {
    en: {
      title: "Phytomonitor",
      tagline: "Smart AI for Early Plant Disease Detection",
      upload: "Upload Image",
      camera: "Capture Photo",
      dragDrop: "Drag & drop leaf image here",
      history: "History",
      processing: "Analyzing Plant Health...",
      confidence: "Confidence Score",
      treatment: "Treatment",
      prevention: "Prevention",
      expert: "Note: Always consult an agricultural expert for critical decisions.",
      back: "Start New Scan",
      clearHistory: "Clear History"
    },
    ta: {
      title: "பைட்டோமானிட்டர்",
      tagline: "தாவர நோய்களைக் கண்டறியும் செயற்கை நுண்ணறிவு",
      upload: "பதிவேற்றவும்",
      camera: "புகைப்படம் எடுக்க",
      dragDrop: "இங்கே படத்தை இழுக்கவும்",
      history: "வரலாறு",
      processing: "ஆராய்ச்சி செய்கிறது...",
      confidence: "நம்பிக்கை நிலை",
      treatment: "சிகிச்சை",
      prevention: "தடுப்பு முறைகள்",
      expert: "குறிப்பு: முக்கியமான முடிவுகளுக்கு எப்போதும் வேளாண் நிபுணரை அணுகவும்.",
      back: "புதிய ஸ்கேன்",
      clearHistory: "வரலாற்றை நீக்கு"
    }
  };

  const labels = t[lang];

  // Theme Logic
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem(`${APP_ID}_history`);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save History
  const saveToHistory = (item) => {
    const newHistory = [item, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem(`${APP_ID}_history`, JSON.stringify(newHistory));
  };

  // --- Image Handling ---

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG).");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size too large. Max 5MB.");
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');

      // Stop camera
      const stream = video.srcObject;
      stream.getTracks().forEach(track => track.stop());

      setImage(dataUrl);
      setIsCameraActive(false);
      processImage(dataUrl);
    }
  };

  // --- AI Logic (Integrated Gemini for "Production" feel) ---

  const processImage = async (base64Image) => {
    setView('processing');
    setError(null);

    try {
      // Simulate real-world delay for UI/UX
      await new Promise(r => setTimeout(r, 1500));

      // Convert base64 to File object
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch('http://localhost:5000/api/plants/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Backend Analysis failed");
      }

      const result = await response.json();
      const aiData = result.data;

      const predictionResult = {
        ...aiData,
        id: Date.now(),
        date: new Date().toLocaleString(),
        image: base64Image
      };

      setPrediction(predictionResult);
      saveToHistory(predictionResult);
      setView('result');
    } catch (err) {
      setError("Analysis failed. Please try a clearer photo.");
      setView('home');
    }
  };

  // --- Render Helpers ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 mb-2">
          <Leaf size={48} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">{labels.title}</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">{labels.tagline}</p>
      </div>

      <Card className="w-full max-w-xl p-8 border-dashed border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-slate-800/50">
        <div className="flex flex-col items-center space-y-6">
          <div
            className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="text-slate-400 mb-2" size={32} />
            <p className="text-slate-500 font-medium">{labels.dragDrop}</p>
            <p className="text-xs text-slate-400 mt-1">Supports: JPG, PNG (Max 5MB)</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              className="flex-1"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              {labels.upload}
            </Button>
            <Button
              className="flex-1"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
        {[
          { icon: ShieldCheck, title: "Durable AI", desc: "Edge-case optimized detection" },
          { icon: RefreshCw, title: "Instant", desc: "Real-time diagnosis results" },
          { icon: History, title: "Traceable", desc: "Local history tracking" }
        ].map((feat, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/20">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <feat.icon size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{feat.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-emerald-100 dark:border-emerald-900 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 w-24 h-24 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
        <Leaf className="absolute inset-0 m-auto text-emerald-600 animate-bounce" size={32} />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{labels.processing}</h2>
        <p className="text-slate-500 dark:text-slate-400">Comparing sample with our global agricultural database...</p>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!prediction) return null;

    const getCategoryStyles = (cat) => {
      const c = cat?.toLowerCase();
      if (c === 'healthy') return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200";
      if (c?.includes('viral')) return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200";
      if (c?.includes('fungal')) return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200";
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200";
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 duration-700">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side: Image & Meta */}
          <div className="w-full md:w-1/3 space-y-4">
            <div className="relative group">
              <img
                src={prediction.image}
                className="w-full aspect-square object-cover rounded-3xl shadow-2xl border-4 border-white dark:border-slate-700"
                alt="Analyzed leaf"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                ID: {prediction.id.toString().slice(-6)}
              </div>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{labels.confidence}</span>
                <span className="font-bold text-emerald-600">{prediction.confidence}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${prediction.confidence}%` }}
                ></div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 py-2" icon={Download} onClick={() => window.print()}>Save PDF</Button>
              <Button variant="secondary" className="px-4" icon={Share2}></Button>
            </div>
          </div>

          {/* Right Side: Diagnosis */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className={`inline-block px-4 py-1 rounded-full text-xs font-bold border ${getCategoryStyles(prediction.category)}`}>
                {prediction.category}
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {prediction.disease}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-3">
                  <CheckCircle2 size={20} />
                  {labels.treatment}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {prediction.advice.treatment}
                </p>
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold mb-3">
                  <ShieldCheck size={20} />
                  {labels.prevention}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {prediction.advice.prevention}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle className="flex-shrink-0" size={18} />
              <p>{labels.expert}</p>
            </div>

            <Button variant="outline" className="w-full md:w-auto" icon={RefreshCw} onClick={() => setView('home')}>
              {labels.back}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History /> {labels.history}
        </h2>
        <Button variant="ghost" onClick={() => {
          localStorage.removeItem(`${APP_ID}_history`);
          setHistory([]);
        }}>
          {labels.clearHistory}
        </Button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-400">No previous scans found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group"
              onClick={() => {
                setPrediction(item);
                setView('result');
              }}
            >
              <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.disease}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{item.date}</span>
                  <span>•</span>
                  <span className="text-emerald-500 font-bold">{item.confidence}% Confidence</span>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={20} />
            </div>
          ))}
        </div>
      )}
      <Button variant="secondary" className="w-full" onClick={() => setView('home')}>Back to Home</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <Leaf size={20} />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Phyto<span className="text-emerald-600">monitor</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="px-2 hidden sm:flex"
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            >
              <Languages size={20} />
              <span className="text-xs uppercase">{lang}</span>
            </Button>
            <Button variant="ghost" className="px-2" onClick={() => setView('history')}>
              <History size={20} />
            </Button>
            <Button variant="ghost" className="px-2" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2">
            <AlertTriangle size={20} />
            <p className="flex-1 text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {view === 'home' && renderHome()}
        {view === 'processing' && renderProcessing()}
        {view === 'result' && renderResult()}
        {view === 'history' && renderHistory()}
      </main>

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-3xl pointer-events-none">
              <div className="absolute inset-[15%] border border-white/30 border-dashed rounded-xl"></div>
            </div>
          </div>

          <div className="mt-8 flex gap-6 items-center">
            <button
              className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20"
              onClick={() => {
                const stream = videoRef.current?.srcObject;
                stream?.getTracks().forEach(t => t.stop());
                setIsCameraActive(false);
              }}
            >
              <X size={28} />
            </button>
            <button
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-8 border-white/20 active:scale-90 transition-transform"
              onClick={capturePhoto}
            >
              <div className="w-14 h-14 bg-emerald-600 rounded-full"></div>
            </button>
            <div className="w-14"></div> {/* Spacer for symmetry */}
          </div>
          <p className="mt-4 text-white/60 text-sm">Position the leaf in the center frame</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-slate-400 text-xs">
          Powered by AgriTech AI • © 2025 Phytomonitor
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          nav, button, footer, .no-print { display: none !important; }
          body { background: white !important; }
          .max-w-4xl { max-width: 100% !important; margin: 0 !important; }
        }
      `}} />
    </div>
  );
}
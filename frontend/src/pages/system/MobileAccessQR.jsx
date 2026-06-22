import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import logo from "../../assets/logo.png";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";

export default function MobileAccessQR() {
  const frontendUrl = "https://patient-monitoring-147slvc8x-wellcare.vercel.app";
  const backendUrl = "https://wellcare-ai-backend.onrender.com";
  
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(frontendUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("wellcare-qr-canvas");
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "wellcare-patient-monitoring-qr.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handleOpenApp = () => {
    window.open(frontendUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="text-blue-500 text-3xl">📱</span> Mobile Access QR
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Scan the QR code to access the Patient Monitoring System from smartphones and tablet devices.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-blue-400 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Clinical Portal QR Service Active
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: QR Code Display Card */}
        <div className="lg:col-span-7">
          <Card className="border border-slate-800 bg-slate-900/60 overflow-hidden h-full">
            <CardHeader className="border-b border-slate-800/80 bg-slate-900/40 p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
                  <img src={logo} alt="Well Care Logo" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <CardTitle className="text-white text-base font-bold">Well Care AI Monitoring Portal</CardTitle>
                  <p className="text-xs text-slate-500 font-medium">Scan to connect to ward analytics</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center">
              
              {/* QR Code Container */}
              <div className="relative group p-6 bg-white rounded-3xl shadow-xl shadow-blue-500/5 transition-all duration-300 border border-blue-100 flex items-center justify-center">
                <QRCodeCanvas
                  id="wellcare-qr-canvas"
                  value={frontendUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#1e3a8a" // Deep Hospital Blue
                />
                
                {/* Micro-decorative hospital plus badge overlaying QR code */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                    <span className="text-white text-md font-black select-none">+</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="mt-8 w-full max-w-md space-y-3">
                <button
                  onClick={handleDownloadQR}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                >
                  📥 Download QR Code Image
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      copied
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800"
                    }`}
                  >
                    {copied ? "✅ Copied!" : "🔗 Copy Link"}
                  </button>
                  <button
                    onClick={handleOpenApp}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                  >
                    🌐 Open App
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Network Info & Instructions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Access Info Card */}
          <Card className="border border-slate-800 bg-slate-900/60 flex-1">
            <CardHeader className="p-5 border-b border-slate-800/80 bg-slate-900/40">
              <CardTitle className="text-white text-sm font-extrabold flex items-center gap-2">
                📡 System Node Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Production Frontend Client</span>
                <div className="bg-slate-950 border border-slate-800/60 p-3 rounded-xl font-mono text-xs text-blue-400 break-all select-all flex items-center justify-between">
                  <span>{frontendUrl}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Production FastAPI Backend</span>
                <div className="bg-slate-950 border border-slate-800/60 p-3 rounded-xl font-mono text-xs text-cyan-400 break-all select-all flex items-center justify-between">
                  <span>{backendUrl}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-300">Device Access Instructions:</h4>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 leading-relaxed">
                  <li>Open the default camera app on your iOS or Android device.</li>
                  <li>Point your camera at the high-contrast QR code on the left.</li>
                  <li>Tap the banner link that appears to launch the secure portal.</li>
                  <li>Log in using your clinician, nurse, or admin credentials.</li>
                  <li>
                    <span className="text-blue-400 font-bold">Tip:</span> Save the page to your home screen (PWA format) for rapid clinical bedside observation.
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

const fs = require('fs');
let code = fs.readFileSync('src/app/verify-id/page.tsx', 'utf8');

// Replace imports and state
code = code.replace(
  'const [error, setError] = useState("");',
  `const [error, setError] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);`
);

// Remove fileInputRef and handleImageCapture
code = code.replace(/const fileInputRef = useRef<HTMLInputElement>\(null\);/, '');

const handleCaptureRegex = /const handleImageCapture = [\s\S]*?reader\.readAsDataURL\(file\);\s*setError\(""\);\s*};/;
code = code.replace(handleCaptureRegex, `
  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      }, 100);
      setError("");
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or not available. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "id_capture.jpg", { type: "image/jpeg" });
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
          }
        }, "image/jpeg", 0.8);
      }
      closeCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
`);

// Replace HTML input and capture UI
const uiRegex = /<input\s*type="file"[\s\S]*?onChange=\{handleImageCapture\}[\s\S]*?className="hidden"\s*\/>[\s\S]*?<div\s*onClick=\{[^}]*\}\s*className=\{`w-full aspect-\[1\.6\][^>]*>\s*\{imagePreview \? \([\s\S]*?<img[^>]*>[\s\S]*?\) : \([\s\S]*?<\/span>[\s\S]*?<\/>\s*\)\}\s*<\/div>\s*\{imagePreview && \([\s\S]*?Retake Photo\s*<\/button>\s*\)\}/;

code = code.replace(uiRegex, `
            {isCameraOpen ? (
              <div className="w-full aspect-[1.6] rounded-[16px] bg-black overflow-hidden relative flex flex-col items-center justify-center border-2 border-brand-rose/50">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="absolute bottom-4 w-12 h-12 bg-white rounded-full border-4 border-brand-rose shadow-lg active:scale-95 transition-transform"
                />
                <button
                  type="button"
                  onClick={closeCamera}
                  className="absolute top-2 right-2 text-white/70 hover:text-white bg-black/30 p-2 rounded-full"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <div 
                onClick={openCamera}
                className={\`w-full aspect-[1.6] rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
                  \${imagePreview ? 'border-brand-rose/50 bg-black' : 'border-brand-burgundy bg-brand-wine/30 hover:bg-brand-wine/50 hover:border-brand-rose/30'}\`}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="ID Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-rose/70 mb-2">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                    <span className="text-xs text-brand-taupe text-center px-4">Tap to open Camera<br/>and take a photo of your ID</span>
                  </>
                )}
              </div>
            )}
            
            {imagePreview && !isCameraOpen && (
              <button type="button" onClick={openCamera} className="text-brand-taupe text-xs mt-1 underline text-center hover:text-brand-blush">
                Retake Photo
              </button>
            )}
            <canvas ref={canvasRef} className="hidden" />
`);

fs.writeFileSync('src/app/verify-id/page.tsx', code);

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import LoadingScreen from "@/components/LoadingScreen";

export default function VerifyIdPage() {
  const { session, isLoading, logout, refreshSession } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push("/");
      } else if (session.idVerificationStatus === "APPROVED") {
        router.push(session.profileComplete ? "/dashboard" : "/profile");
      }
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (session?.idVerificationStatus === "PENDING") {
      const interval = setInterval(() => {
        refreshSession();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [session?.idVerificationStatus, refreshSession]);

  
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


  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compress strictly to base64 jpeg
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !phone) {
      setError("Please capture your ID and enter your phone number.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const base64Image = await compressImage(imageFile);
      
      const res = await fetch("/api/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image, phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      await refreshSession();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading || !session) return <LoadingScreen />;

  const status = session.idVerificationStatus;

  if (status === "PENDING") {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 sm:p-8 text-center text-brand-blush overflow-hidden relative">
        <div className="absolute inset-0 bg-brand-wine/5" />
        
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-8 sm:mb-10 relative flex items-center justify-center">
            <div className="absolute inset-0 border-[3px] border-brand-rose/20 rounded-full animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-2 border-[3px] border-brand-rose border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-4 border-[3px] border-brand-burgundy border-b-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]" />
          </div>

          <h1 className="font-playfair text-4xl sm:text-5xl font-normal mb-4 italic tracking-wide text-brand-rose text-shadow-sm shadow-brand-rose/20">Under Review</h1>
          
          <p className="text-brand-taupe/90 max-w-[280px] sm:max-w-sm font-light leading-relaxed mb-12 sm:mb-16 text-lg sm:text-xl">
            The Oracle is manually verifying your College ID. 
            <br/><span className="text-brand-taupe/50 text-sm sm:text-base italic mt-2 block">Check back in a little while.</span>
          </p>

          <div className="flex flex-col gap-5 sm:gap-6 w-full px-2 sm:px-6">
            <button onClick={logout} className="w-full py-5 sm:py-6 bg-transparent border-2 border-brand-burgundy rounded-[24px] text-brand-taupe hover:text-brand-rose hover:bg-brand-burgundy/10 hover:border-brand-rose/50 transition-all font-bold tracking-widest uppercase text-sm sm:text-base shadow-lg hover:shadow-brand-rose/10 active:scale-95">
              Log out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center text-red-500">
        <h1 className="font-playfair text-3xl font-bold mb-2">Account Suspended</h1>
        <p className="text-red-400/80 max-w-sm font-light leading-relaxed mb-8">
          Your account has been permanently suspended for violating the community guidelines.
        </p>
        <button onClick={logout} className="text-red-400/50 hover:text-red-300 text-xs underline">Log out</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-wine flex flex-col items-center justify-center p-6 text-brand-blush">
      <div className="w-full max-w-sm bg-brand-charcoal/80 p-8 rounded-3xl border border-brand-burgundy/50 shadow-2xl relative">
        <h1 className="font-playfair text-3xl font-normal text-center mb-2 italic">Verify Identity</h1>
        
        {status === "REJECTED" ? (
          <p className="text-red-400 text-center text-sm mb-6 font-bold bg-red-500/10 p-3 rounded-lg">
            Your previous ID was rejected. Please upload a clear, legible photo of your physical College ID card.
          </p>
        ) : (
          <p className="text-brand-taupe/80 text-center text-xs mb-8 font-light leading-relaxed">
            To keep Perhaps safe and exclusive, we manually verify every student.
          </p>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs text-brand-taupe uppercase tracking-widest font-bold ml-2">Phone Number</label>
            <div className="flex items-center bg-brand-wine/50 border border-brand-burgundy rounded-[16px] px-5 py-4 focus-within:border-brand-rose/50 transition-colors">
              <span className="text-brand-taupe/70 font-mono tracking-wider mr-3 text-lg">+91</span>
              <input
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent text-brand-blush outline-none font-mono tracking-wider text-lg"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-brand-taupe uppercase tracking-widest font-bold ml-2">College ID Card</label>
            
            
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
                className={`w-full aspect-[1.6] rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
                  ${imagePreview ? 'border-brand-rose/50 bg-black' : 'border-brand-burgundy bg-brand-wine/30 hover:bg-brand-wine/50 hover:border-brand-rose/30'}`}
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

          </div>

          <button
            type="submit"
            disabled={isSubmitting || !imageFile}
            className="w-full py-4 mt-2 bg-brand-blush text-brand-wine font-bold rounded-[16px] uppercase tracking-widest text-xs shadow-[0_4px_14px_rgba(232,180,165,0.25)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? "Uploading..." : "Submit for Verification"}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-4 w-full">
          <button onClick={logout} className="w-full py-4 bg-[#111] border border-brand-taupe/10 rounded-xl text-brand-taupe hover:text-brand-blush hover:border-brand-taupe/30 transition-colors font-medium">
            Log out / Switch Account
          </button>
          <button
            onClick={async () => {
              if (prompt("Type 'delete' to permanently delete your account:") === 'delete') {
                try {
                  await fetch("/api/profile", { method: "DELETE" });
                  await logout();
                } catch (e) {
                  alert("Failed to delete account");
                }
              }
            }}
            className="w-full py-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-500 hover:bg-red-900/50 hover:text-red-300 transition-colors font-medium"
          >
            Permanently Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center text-brand-blush">
        <div className="w-16 h-16 mb-6 border-4 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="font-playfair text-3xl font-normal mb-2 italic">Under Review</h1>
        <p className="text-brand-taupe/80 max-w-sm font-light leading-relaxed mb-8">
          The Oracle is manually reviewing your College ID. Check back in a little while!
        </p>
        <div className="flex flex-col gap-4 w-full mt-4">
          <button onClick={logout} className="w-full py-4 bg-brand-charcoal border border-brand-taupe/20 rounded-xl text-brand-taupe hover:text-brand-blush transition-colors font-medium">
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
            <input
              type="tel"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-brand-wine/50 border border-brand-burgundy text-brand-blush px-5 py-4 rounded-[16px] outline-none focus:border-brand-rose/50 transition-colors font-mono tracking-wider text-center"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-brand-taupe uppercase tracking-widest font-bold ml-2">College ID Card</label>
            
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageCapture}
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
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
                  <span className="text-xs text-brand-taupe text-center px-4">Tap to take a live photo<br/>of your physical ID card</span>
                </>
              )}
            </div>
            {imagePreview && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-brand-taupe text-xs mt-1 underline text-center hover:text-brand-blush">
                Retake Photo
              </button>
            )}
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

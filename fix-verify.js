const fs = require('fs');
let c = fs.readFileSync('src/app/verify-id/page.tsx', 'utf8');

c = c.replace(/<div className="flex flex-col gap-2">[\s\S]*?<label className="text-xs text-brand-taupe uppercase tracking-widest font-bold ml-2">Phone Number<\/label>[\s\S]*?<input[\s\S]*?type="tel"[\s\S]*?placeholder="\+919876543210"[\s\S]*?value=\{phone\}[\s\S]*?onChange=\{\(e\) => setPhone\(e\.target\.value\)\}[\s\S]*?className="[^"]*"[\s\S]*?required[\s\S]*?\/>[\s\S]*?<\/div>/,
`<div className="flex flex-col gap-2">
            <label className="text-xs text-brand-taupe uppercase tracking-widest font-bold ml-2">Phone Number</label>
            <div className="flex items-center bg-brand-wine/50 border border-brand-burgundy rounded-[16px] px-5 py-4 focus-within:border-brand-rose/50 transition-colors">
              <span className="text-brand-taupe/70 font-mono tracking-wider mr-3 text-lg">+91</span>
              <input
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\\D/g, ''))}
                className="w-full bg-transparent text-brand-blush outline-none font-mono tracking-wider text-lg"
                required
              />
            </div>
          </div>`);

c = c.replace(/<input\s+type="file"\s+accept="image\/\*"\s+ref=\{fileInputRef\}/,
`<input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}`);


c = c.replace(/if \(status === "PENDING"\) \{[\s\S]*?return \([\s\S]*?<div className="min-h-screen bg-\[#050505\] flex flex-col items-center justify-center p-8 text-center[\s\S]*?text-brand-blush">[\s\S]*?<div className="w-16 h-16 mb-6 border-4 border-brand-rose border-t-transparent rounded-full animate-spin[\s\S]*?mx-auto" \/>[\s\S]*?<h1 className="font-playfair text-3xl font-normal mb-2 italic">Under Review<\/h1>[\s\S]*?<p className="text-brand-taupe\/80 max-w-sm font-light leading-relaxed mb-8">[\s\S]*?The Oracle is manually reviewing your College ID\. Check back in a little while![\s\S]*?<\/p>[\s\S]*?<div className="flex flex-col gap-4 w-full mt-4">[\s\S]*?<button onClick=\{logout\} className="w-full py-4 bg-brand-charcoal border border-brand-taupe\/20 rounded-xl[\s\S]*?text-brand-taupe hover:text-brand-blush transition-colors font-medium">[\s\S]*?Log out \/ Switch Account[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}/,
`if (status === "PENDING") {
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
  }`);

fs.writeFileSync('src/app/verify-id/page.tsx', c);

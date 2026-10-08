
const fs = require("fs");
let c = fs.readFileSync("src/app/results/page.tsx", "utf8");

c = c.replace(/<form onSubmit=\{handleReveal\} className="w-full">[\s\S]*?<\/form>/, `<form onSubmit={handleReveal} className="w-full">
                  <div className="relative">
                    <button 
                      type="submit" 
                      disabled={revealing} 
                      className="w-full bg-brand-rose text-brand-wine rounded-[20px] py-5 flex items-center justify-center font-bold tracking-widest uppercase transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {revealing ? (
                        <span className="flex items-center gap-3">
                          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                          Decrypting...
                        </span>
                      ) : (
                        "Reveal Identity"
                      )}
                    </button>
                  </div>
                  {revealError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400/80 text-xs mt-3">{revealError}</motion.p>}
                </form>`);

fs.writeFileSync("src/app/results/page.tsx", c);


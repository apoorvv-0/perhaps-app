
const fs = require("fs");
let c = fs.readFileSync("src/app/results/page.tsx", "utf8");

const newErrorUI = `          {/* State: Error */}
          {matchStatus.state === "error" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-center flex flex-col items-center">
              <div className="w-20 h-20 mb-8 opacity-40 text-red-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h2 className="font-mono text-2xl font-normal tracking-[0.2em] mb-4 text-red-400">CONNECTION FAILED</h2>
              <p className="text-brand-taupe/60 text-xs uppercase tracking-widest max-w-[280px] mx-auto leading-loose mb-12">We couldn"t reach the oracle. Please check your internet connection.</p>
              <button onClick={fetchResult} className="text-brand-rose text-xs font-mono uppercase tracking-[0.2em] border-b border-brand-rose/30 pb-1 hover:text-brand-blush hover:border-brand-blush transition-colors">
                Retry Connection
              </button>
            </motion.div>
          )}

          {/* State: Not Open */}`;

c = c.replace(/\{\/\* State: Not Open \*\/\}/, newErrorUI);
fs.writeFileSync("src/app/results/page.tsx", c);


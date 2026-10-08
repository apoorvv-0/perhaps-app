const fs = require('fs');
let content = fs.readFileSync('src/app/directory/page.tsx', 'utf8');

const oldBlock = \                {isChoosing && (
                  <div className="bg-brand-wine/40 rounded-[24px] p-5 border border-brand-burgundy/30 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-brand-blush">Need more slots?</span>
                      <span className="text-xs font-bold text-brand-taupe">{picks.length}/{maxAllowed} Used</span>
                    </div>
                    <button onClick={() => setShowCouponModal(true)} className="w-full py-4 bg-transparent border border-brand-rose/20 text-brand-rose rounded-full font-medium text-sm hover:bg-brand-rose/5 transition-colors">
                      Unlock extra choices
                    </button>
                  </div>
                )}\;

const newBlock = \                {isChoosing && (
                  <div className="bg-brand-wine/40 rounded-[24px] p-5 border border-brand-burgundy/30 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-brand-blush">Choices Made</span>
                      <span className="text-sm font-bold text-brand-rose">{picks.length} / {maxAllowed}</span>
                    </div>
                  </div>
                )}\;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync('src/app/directory/page.tsx', content);

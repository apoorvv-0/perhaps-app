const fs = require('fs');
let c = fs.readFileSync('src/app/directory/page.tsx', 'utf8');

c = c.replace('const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");', 
'const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");\n  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);');

c = c.replace(/useEffect\(\(\) => \{\n    if \(!initialLoadDone\.current[\s\S]*?\}, 1000\);\n  \}, \[picks\]\);/, '');

c = c.replace('const saveChoices = async (currentPicks: string[]) => {', 
'const saveChoices = async () => {\n    const currentPicks = picks;');

c = c.replace('setSyncStatus("saved");', 
'setSyncStatus("saved");\n      setHasUnsavedChanges(false);');

c = c.replace('setPicks(picks.filter(p => p !== id));', 
'setPicks(picks.filter(p => p !== id));\n      setHasUnsavedChanges(true);');

c = c.replace('setPicks([...picks, id]);', 
'setPicks([...picks, id]);\n      setHasUnsavedChanges(true);');

c = c.replace('<button \n          onClick={() => setShowPicks(true)}', 
`{hasUnsavedChanges && (
          <button 
            onClick={() => saveChoices()}
            disabled={saving}
            className="pointer-events-auto bg-green-600 text-white px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform font-bold flex items-center gap-2"
          >
            {saving ? "Saving..." : "Save Picks"}
          </button>
        )}
        <button 
          onClick={() => setShowPicks(true)}`);

c = c.replace('</AnimatePresence>\n\n      {/* Coupon Modal */}', 
`              {isChoosing && hasUnsavedChanges && (
                <button onClick={() => saveChoices()} disabled={saving} className="w-full py-4 mt-2 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-500 transition-colors">
                  {saving ? "Saving..." : "Save Picks"}
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Coupon Modal */}`);

fs.writeFileSync('src/app/directory/page.tsx', c);

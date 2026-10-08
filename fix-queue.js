const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const oldComponent = \unction VerificationQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);\;

const newComponent = \unction VerificationQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPhotos, setOpenPhotos] = useState<Record<string, boolean>>({});\;

content = content.replace(oldComponent, newComponent);

const oldImg = \              {user.idCardUrl ? (
                <img src={user.idCardUrl} alt="ID Card" className="w-full sm:w-40 h-28 object-cover rounded-xl bg-black border border-brand-burgundy/50" />
              ) : (\;

const newImg = \              {user.idCardUrl ? (
                openPhotos[user.id] ? (
                  <img src={user.idCardUrl} alt="ID Card" className="w-full sm:w-40 h-28 object-cover rounded-xl bg-black border border-brand-burgundy/50" />
                ) : (
                  <button onClick={() => setOpenPhotos(prev => ({...prev, [user.id]: true}))} className="w-full sm:w-40 h-28 bg-brand-charcoal text-brand-taupe rounded-xl border border-brand-burgundy/50 flex flex-col items-center justify-center hover:bg-brand-burgundy/20 transition-colors">
                    <span className="text-xs font-bold mb-1">VIEW ID</span>
                    <span className="text-[10px] opacity-70">Click to load</span>
                  </button>
                )
              ) : (\;

content = content.replace(oldImg, newImg);

fs.writeFileSync('src/app/admin/page.tsx', content);

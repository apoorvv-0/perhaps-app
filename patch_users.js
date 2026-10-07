const fs = require('fs');
let c = fs.readFileSync('src/app/admin/users/page.tsx', 'utf8');

if (!c.includes('const [editingUser')) {
  c = c.replace('const [saving, setSaving] = useState<string | null>(null);',
    'const [saving, setSaving] = useState<string | null>(null);\n  const [editingUser, setEditingUser] = useState<any | null>(null);\n  const [editForm, setEditForm] = useState<any>({});');
}

if (!c.includes('const saveProfile')) {
  c = c.replace('const fetchUsers = async () => {',
    `const saveProfile = async () => {
    if (!editingUser) return;
    setSaving(editingUser.id);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editingUser.id, profile: editForm })
    });
    await fetchUsers();
    setEditingUser(null);
    setSaving(null);
  };

  const fetchUsers = async () => {`);
}

c = c.replace('<td className="p-4 font-medium text-brand-blush whitespace-nowrap">{u.firstName} {u.lastName}</td>',
  `<td className="p-4 font-medium text-brand-blush whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span>{u.firstName} {u.lastName}</span>
                          <button onClick={() => { setEditingUser(u); setEditForm(u); }} className="text-[10px] uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-brand-taupe transition">Edit</button>
                        </div>
                      </td>`);

const modalHTML = `
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-charcoal border border-brand-burgundy/50 p-6 rounded-[24px] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-playfair font-bold mb-4 text-brand-blush">Edit Profile</h2>
            <div className="flex flex-col gap-3 mb-6">
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="First Name" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="Last Name" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="College" value={editForm.college || ''} onChange={e => setEditForm({...editForm, college: e.target.value})} />
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="Batch" value={editForm.batch || ''} onChange={e => setEditForm({...editForm, batch: e.target.value})} />
              <select className="bg-brand-wine border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="Instagram (optional)" value={editForm.instagramHandle || ''} onChange={e => setEditForm({...editForm, instagramHandle: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-full text-sm font-medium border border-brand-burgundy/50 hover:bg-white/5 transition">Cancel</button>
              <button onClick={saveProfile} className="px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-brand-blush to-brand-rose text-brand-charcoal hover:scale-105 transition active:scale-95">{saving === editingUser.id ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar />
`;

c = c.replace('<BottomTabBar />', modalHTML);

fs.writeFileSync('src/app/admin/users/page.tsx', c);

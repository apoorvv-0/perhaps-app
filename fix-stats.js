const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const oldStats = \        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Users</p>
              <p className="text-2xl font-mono font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Choices</p>
              <p className="text-2xl font-mono font-bold">{stats.totalChoices}</p>
            </div>
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Coupons</p>
              <p className="text-2xl font-mono font-bold">{stats.totalCoupons}</p>
            </div>
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Revenue</p>
              <p className="text-2xl font-mono font-bold text-green-400">?{stats.totalRevenueRupees}</p>
            </div>
          </div>
        )}\;

const newStats = \        {/* Analytics Dashboard */}
        {stats && (
          <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-3xl p-6 mb-6 flex flex-col gap-8">
            <h2 className="text-xl font-playfair font-bold text-brand-blush">Event Analytics</h2>
            
            {/* Top Level KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-brand-wine/50 border border-brand-burgundy/30 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-brand-taupe text-xs font-bold uppercase tracking-widest mb-2">Total Users</span>
                <span className="text-3xl font-mono font-bold text-brand-blush">{stats.totalUsers}</span>
              </div>
              <div className="bg-brand-wine/50 border border-brand-burgundy/30 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-brand-taupe text-xs font-bold uppercase tracking-widest mb-2">Event RSVPs</span>
                <span className="text-3xl font-mono font-bold text-brand-rose">{stats.eventRegistrations || 0}</span>
              </div>
              <div className="bg-brand-wine/50 border border-brand-burgundy/30 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-brand-taupe text-xs font-bold uppercase tracking-widest mb-2">Choices Made</span>
                <span className="text-3xl font-mono font-bold text-brand-blush">{stats.totalChoices}</span>
              </div>
              <div className="bg-brand-wine/50 border border-brand-burgundy/30 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-brand-taupe text-xs font-bold uppercase tracking-widest mb-2">Matches</span>
                <span className="text-3xl font-mono font-bold text-brand-rose">{stats.matchesCount || 0}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Gender Split */}
              <div>
                <h3 className="text-sm font-bold text-brand-taupe uppercase tracking-widest mb-4">Gender Demographics</h3>
                <div className="flex justify-between text-xs mb-2 font-mono">
                  <span className="text-blue-400">Boys ({stats.genderStats?.MALE || 0})</span>
                  <span className="text-pink-400">Girls ({stats.genderStats?.FEMALE || 0})</span>
                </div>
                <div className="w-full h-3 bg-brand-wine/50 rounded-full overflow-hidden flex">
                  <div style={{ width: \\%\ }} className="h-full bg-blue-500 transition-all duration-1000" />
                  <div style={{ width: \\%\ }} className="h-full bg-pink-500 transition-all duration-1000" />
                </div>
              </div>

              {/* Verification Pipeline */}
              <div>
                <h3 className="text-sm font-bold text-brand-taupe uppercase tracking-widest mb-4">ID Verifications</h3>
                <div className="flex justify-between text-xs mb-2 font-mono">
                  <span className="text-green-400">Approved ({stats.verificationStats?.APPROVED || 0})</span>
                  <span className="text-yellow-400">Pending ({stats.verificationStats?.PENDING || 0})</span>
                  <span className="text-brand-taupe">Unverified ({stats.verificationStats?.UNVERIFIED || 0})</span>
                </div>
                <div className="w-full h-3 bg-brand-wine/50 rounded-full overflow-hidden flex">
                  <div style={{ width: \\%\ }} className="h-full bg-green-500 transition-all duration-1000" />
                  <div style={{ width: \\%\ }} className="h-full bg-yellow-500 transition-all duration-1000" />
                  <div style={{ width: \\%\ }} className="h-full bg-brand-taupe/50 transition-all duration-1000" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Financials */}
              <div className="bg-brand-wine/30 border border-green-500/20 rounded-2xl p-5 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-4">Revenue & Sales</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-brand-taupe text-sm">Active Coupons</span>
                  <span className="font-mono font-bold text-brand-blush">{stats.totalCoupons}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-taupe text-sm">Total Revenue</span>
                  <span className="font-mono font-bold text-green-400 text-xl">?{stats.totalRevenueRupees}</span>
                </div>
              </div>

              {/* Top Colleges */}
              <div>
                <h3 className="text-sm font-bold text-brand-taupe uppercase tracking-widest mb-4">Top 5 Colleges</h3>
                <div className="flex flex-col gap-2">
                  {stats.collegeStats?.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-brand-blush/80 truncate pr-4">{c.college}</span>
                      <span className="font-mono text-brand-taupe bg-brand-wine/50 px-2 py-0.5 rounded">{c.count}</span>
                    </div>
                  )) || <div className="text-xs text-brand-taupe">No data available</div>}
                </div>
              </div>
            </div>
          </div>
        )}\;

content = content.replace(oldStats, newStats);

fs.writeFileSync('src/app/admin/page.tsx', content);

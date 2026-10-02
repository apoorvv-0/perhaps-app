"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

/* ─── Scroll-reveal hook ──────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── SVG Wave (underline) ───────────────────────────────────── */
function WaveUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 8 C40 2, 80 12, 120 6 C150 2, 175 10, 198 5"
        stroke="url(#wave-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="wave-grad" x1="0" y1="0" x2="200" y2="0">
          <stop offset="0%" stopColor="#EBB4A5" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#F6D7CF" />
          <stop offset="100%" stopColor="#EBB4A5" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Heart icon ─────────────────────────────────────────────── */
function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

/* ─── Location icon ──────────────────────────────────────────── */
function LocationIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.619 3.5-7.327A8.5 8.5 0 003.5 12c0 2.707 1.556 5.313 3.5 7.327a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 9a3 3 0 100 6 3 3 0 000-6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ─── Mock profile cards data ────────────────────────────────── */
const profiles = [
  {
    name: "Aanya",
    age: 19,
    location: "PIMS, Loni",
    tags: ["Music", "Travel", "Chess"],
    gradient: "from-rose-900/80 via-burgundy/60 to-wine",
    accent: "#EBB4A5",
  },
  {
    name: "Riya",
    age: 20,
    location: "Pune",
    tags: ["Art", "Coffee", "Hiking"],
    gradient: "from-stone-900/80 via-wine/80 to-charcoal",
    accent: "#F6D7CF",
  },
  {
    name: "Arjun",
    age: 21,
    location: "PIMS, Loni",
    tags: ["Football", "Guitar", "Anime"],
    gradient: "from-zinc-900/80 via-burgundy/40 to-wine",
    accent: "#d99e8f",
  },
];

/* ─── Mock Profile Card ──────────────────────────────────────── */
function ProfileCard({
  profile,
  style,
}: {
  profile: (typeof profiles)[0];
  style?: React.CSSProperties;
}) {
  const initials = profile.name.slice(0, 1);
  return (
    <div
      className="relative w-44 rounded-3xl overflow-hidden shadow-card-hover border border-rose-gold/10"
      style={{ aspectRatio: "3/4", ...style }}
    >
      {/* Simulated photo background */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${profile.gradient}`}
      />
      {/* Avatar placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-playfair font-bold"
          style={{
            background: `radial-gradient(circle, ${profile.accent}22, ${profile.accent}08)`,
            border: `1px solid ${profile.accent}40`,
            color: profile.accent,
          }}
        >
          {initials}
        </div>
      </div>
      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-3 bg-card-gradient">
        <p className="font-playfair text-blush font-semibold text-sm">
          {profile.name}, {profile.age}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <LocationIcon className="w-2.5 h-2.5 text-rose-gold/70" />
          <span className="text-xs text-taupe">{profile.location}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {profile.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-wine/60 border border-rose-gold/20 text-blush/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {/* Heart button */}
      <div className="absolute top-2 right-2">
        <div className="w-7 h-7 rounded-full bg-charcoal/60 backdrop-blur-sm border border-rose-gold/20 flex items-center justify-center">
          <HeartIcon className="w-3.5 h-3.5 text-rose-gold/80" />
        </div>
      </div>
    </div>
  );
}

/* ─── Floating profiles visual ───────────────────────────────── */
function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center h-[340px] w-full max-w-xs mx-auto">
      {/* Back cards */}
      <div className="absolute animate-float" style={{ left: "0%", top: "10%", animationDelay: "0.4s", transform: "rotate(-8deg)", opacity: 0.7 }}>
        <ProfileCard profile={profiles[2]} />
      </div>
      <div className="absolute animate-float" style={{ right: "0%", top: "10%", animationDelay: "0.8s", transform: "rotate(6deg)", opacity: 0.75 }}>
        <ProfileCard profile={profiles[1]} />
      </div>
      {/* Front card */}
      <div className="relative z-10 animate-float" style={{ animationDelay: "0s" }}>
        <ProfileCard profile={profiles[0]} />
      </div>
    </div>
  );
}

/* ─── Feature card ───────────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  body,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <div
      className="reveal glass rounded-3xl p-6 flex flex-col gap-3 border border-rose-gold/8 hover:border-rose-gold/20 transition-all duration-300 hover:shadow-rose-glow"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-2xl bg-burgundy/30 border border-burgundy/40 flex items-center justify-center text-rose-gold">
        {icon}
      </div>
      <h3 className="font-playfair text-blush text-lg font-semibold">{title}</h3>
      <p className="text-sm text-taupe leading-relaxed">{body}</p>
    </div>
  );
}

/* ─── Testimonial ────────────────────────────────────────────── */
function Testimonial({ quote, author, sub }: { quote: string; author: string; sub: string }) {
  return (
    <div className="glass rounded-3xl p-6 border border-rose-gold/10 hover:border-rose-gold/25 transition-all duration-300">
      <svg className="w-6 h-6 text-rose-gold/40 mb-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
      <p className="text-blush/90 text-sm leading-relaxed italic mb-4">{quote}</p>
      <div>
        <p className="text-rose-gold text-sm font-semibold">{author}</p>
        <p className="text-taupe text-xs">{sub}</p>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ──────────────────────────────────────── */
export default function PerhapsLanding() {
  useScrollReveal();
  const [menuOpen, setMenuOpen] = useState(false);

  const { session, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && session) {
      if (session.globalRole === 'SUPER_ADMIN') router.push('/roviara');
      else router.push('/dashboard');
    }
  }, [session, isLoading, router]);
  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#260609' }} />;

  return (
    <div className="min-h-screen bg-wine text-blush font-inter overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-burgundy/25 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-burgundy/15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-burgundy/10 blur-3xl" />
      </div>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-rose-gold/8">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-0">
            <span className="font-playfair text-xl italic text-shimmer select-none">
              Perhaps
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-taupe">
            <a href="#how" className="hover:text-blush transition">How it works</a>
            <a href="#features" className="hover:text-blush transition">Features</a>
            <a href="#love" className="hover:text-blush transition">Stories</a>
          </div>

          {/* CTA + mobile menu */}
          <div className="flex items-center gap-3">
            <a
              href="/signup"
              className="hidden md:block text-xs text-taupe hover:text-blush transition"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="px-4 py-2 rounded-2xl bg-burgundy text-blush text-xs font-semibold hover:bg-burgundy-light active:scale-95 transition-all duration-200 shadow-perhaps-soft"
            >
              Get Started
            </a>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl text-taupe hover:text-blush transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <div className="space-y-1">
                <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block w-3.5 h-0.5 bg-current transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-1.5 w-5" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden glass border-t border-rose-gold/8 px-5 py-4 flex flex-col gap-4 text-sm">
            <a href="#how" className="text-taupe hover:text-blush transition" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#features" className="text-taupe hover:text-blush transition" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#love" className="text-taupe hover:text-blush transition" onClick={() => setMenuOpen(false)}>Stories</a>
            <a href="/signup" className="text-taupe hover:text-blush transition" onClick={() => setMenuOpen(false)}>Sign in</a>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-16 text-center">
        {/* Eyebrow badge */}
        <div className="animate-fade-in mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-gold/25 bg-burgundy/20 text-xs text-rose-gold font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-gold animate-pulse-soft" />
            Now in limited beta
          </span>
        </div>

        {/* Main heading */}
        <h1 className="font-playfair text-5xl sm:text-6xl md:text-7xl font-bold italic leading-tight mb-4 animate-fade-up">
          <span className="text-shimmer">Perhaps</span>
        </h1>
        <WaveUnderline className="w-48 mx-auto mb-6 animate-fade-in" />

        <p className="text-xl sm:text-2xl text-blush/90 font-playfair italic mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Meet someone worth the maybe.
        </p>
        <p className="max-w-sm text-sm text-taupe leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Perhaps is a premium dating experience built for college students who believe real connection takes more than a swipe.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-16 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <a
            href="/signup"
            className="px-7 py-3.5 rounded-2xl font-semibold text-sm text-charcoal bg-rose-shimmer hover:opacity-90 active:scale-95 transition-all duration-200 shadow-perhaps-soft"
          >
            Get Started Free
          </a>
          <a
            href="#how"
            className="px-7 py-3.5 rounded-2xl font-medium text-sm text-blush border border-rose-gold/25 hover:border-rose-gold/50 hover:bg-wine/40 active:scale-95 transition-all duration-200"
          >
            See How It Works
          </a>
        </div>

        {/* Hero visual */}
        <div className="animate-fade-up w-full" style={{ animationDelay: "0.4s" }}>
          <HeroVisual />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" className="px-5 py-20">
        <div className="max-w-md mx-auto">
          <div className="reveal text-center mb-12">
            <p className="text-xs text-taupe uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-playfair text-3xl sm:text-4xl text-blush leading-tight">
              Simple by design.<br />
              <span className="italic text-rose-gold">Meaningful by nature.</span>
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-4 bottom-4 w-px bg-gradient-to-b from-burgundy/60 via-rose-gold/30 to-transparent" />

            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Create your Roviara ID",
                  body: "Sign in with Google in seconds. One identity for all Perhaps events — private, verified, yours.",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  step: "02",
                  title: "Build your profile",
                  body: "Show who you actually are — your college, interests, the music you listen to at 2am.",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  ),
                },
                {
                  step: "03",
                  title: "Discover & connect",
                  body: "Browse profiles from your campus and nearby colleges. Like, match, and start a conversation that matters.",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                },
                {
                  step: "04",
                  title: "Meet. Maybe.",
                  body: "When it feels right, take it offline. Perhaps gives you the nudge — the rest is up to you.",
                  icon: <HeartIcon className="w-5 h-5" />,
                },
              ].map(({ step, title, body, icon }, i) => (
                <div
                  key={step}
                  className="reveal flex gap-4 pl-0"
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  {/* Step indicator */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-burgundy/30 border border-burgundy/50 flex items-center justify-center text-rose-gold relative z-10">
                    {icon}
                  </div>
                  {/* Content */}
                  <div className="pt-1.5">
                    <p className="text-xs text-taupe font-mono mb-0.5">{step}</p>
                    <h3 className="font-playfair text-blush text-lg font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-taupe leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="px-5 py-20">
        <div className="max-w-md mx-auto">
          <div className="reveal text-center mb-12">
            <p className="text-xs text-taupe uppercase tracking-widest mb-3">Why Perhaps</p>
            <h2 className="font-playfair text-3xl sm:text-4xl text-blush leading-tight">
              Built different.<br />
              <span className="italic text-rose-gold">For different.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FeatureCard
              delay={0}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title="Verified identities"
              body="Everyone on Perhaps is verified through Roviara ID. No fake profiles, no bots — just real people from real campuses."
            />
            <FeatureCard
              delay={100}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="Campus-focused discovery"
              body="See people from your college first, then expand outward. Because proximity matters when you want to actually meet."
            />
            <FeatureCard
              delay={200}
              icon={<HeartIcon className="w-5 h-5" />}
              title="No infinite scrolling"
              body="Perhaps limits your daily discovers to keep things intentional. Quality over quantity — always."
            />
            <FeatureCard
              delay={300}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="Thoughtful conversations"
              body="Match prompts that actually spark something. Not 'Hey' — conversation starters worth responding to."
            />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / STORIES ───────────────────────────── */}
      <section id="love" className="px-5 py-20">
        <div className="max-w-md mx-auto">
          <div className="reveal text-center mb-12">
            <p className="text-xs text-taupe uppercase tracking-widest mb-3">Stories</p>
            <h2 className="font-playfair text-3xl sm:text-4xl text-blush leading-tight">
              The maybes that<br />
              <span className="italic text-rose-gold">became something.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="reveal" style={{ transitionDelay: "0ms" }}>
              <Testimonial
                quote="I matched with someone from the same college festival committee. We spent three hours talking about music before we even realised we'd met before."
                author="Priya, 20"
                sub="PIMS, Loni"
              />
            </div>
            <div className="reveal" style={{ transitionDelay: "150ms" }}>
              <Testimonial
                quote="Perhaps feels like it was made for people who are a little shy about dating apps. It's premium without being pretentious."
                author="Karan, 22"
                sub="MIT-WPU, Pune"
              />
            </div>
            <div className="reveal" style={{ transitionDelay: "300ms" }}>
              <Testimonial
                quote="The verification thing was huge for me. Knowing everyone is who they say they are makes all the difference."
                author="Shreya, 21"
                sub="Symbiosis, Pune"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────── */}
      <section className="px-5 py-20">
        <div className="max-w-md mx-auto">
          <div className="reveal glass rounded-3xl p-8 sm:p-10 text-center border border-rose-gold/15 hover:border-rose-gold/25 transition-all duration-500">
            <div className="w-16 h-16 rounded-3xl bg-burgundy/30 border border-burgundy/50 flex items-center justify-center text-rose-gold mx-auto mb-6">
              <HeartIcon className="w-8 h-8" />
            </div>
            <h2 className="font-playfair text-3xl sm:text-4xl italic text-blush mb-2">
              Maybe starts here.
            </h2>
            <WaveUnderline className="w-36 mx-auto mb-5" />
            <p className="text-sm text-taupe leading-relaxed mb-8 max-w-xs mx-auto">
              Join the waitlist or create your Roviara ID now and be the first to experience Perhaps at your campus.
            </p>
            <a
              href="/signup"
              className="inline-block w-full sm:w-auto px-10 py-4 rounded-2xl font-semibold text-sm text-charcoal bg-rose-shimmer hover:opacity-90 active:scale-95 transition-all duration-200 shadow-perhaps-soft"
            >
              Create Roviara ID
            </a>
            <p className="mt-4 text-xs text-taupe">
              Free to join · No credit card required · College verified
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="px-5 py-10 border-t border-rose-gold/8">
        <div className="max-w-md mx-auto flex flex-col items-center gap-4 text-center">
          <span className="font-playfair text-2xl italic text-shimmer">Perhaps</span>
          <WaveUnderline className="w-24" />
          <p className="text-xs text-taupe max-w-xs leading-relaxed">
            A product by Roviara · Built for college India · Premium by design
          </p>
          <div className="flex items-center gap-6 text-xs text-taupe/60">
            <a href="#" className="hover:text-taupe transition">Privacy</a>
            <a href="#" className="hover:text-taupe transition">Terms</a>
            <a href="/signup" className="hover:text-taupe transition">Sign in</a>
          </div>
          <p className="text-xs text-taupe/40 mt-2">© 2026 Roviara. All rights reserved.</p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div style={{ padding: '20px', borderTop: '1px solid rgba(235,180,165,0.08)', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#4d3f3d', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dev Access</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 240, margin: '0 auto' }}>
              {[['Male Student', 'student-male-1'], ['Female Student', 'student-female-2'], ['Admin', 'admin1']].map(([label, testId]) => (
                <button key={testId} onClick={async () => {
                  const res = await fetch('/api/auth/dev-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testId }) });
                  if (res.ok) window.location.href = '/dashboard';
                }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(90,13,20,0.4)', color: '#4d3f3d', borderRadius: 12, cursor: 'pointer', fontSize: 11 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

import Link from 'next/link';
import { ArrowRight, Activity, Zap, BarChart3, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#E6E5EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Activity className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold font-heading text-[#0F172A]">SitePulse</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg gradient-brand text-white text-[13px] font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-blue-700">Enterprise Monitoring Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight text-[#0F172A]">
            The pulse of your <br />
            <span className="gradient-brand-text">digital presence.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade website monitoring: broken links, real-time uptime, 
            and deep crawl analytics to keep your site performing flawlessly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl gradient-brand text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all flex items-center justify-center"
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          
          {/* Decorative element */}
          <div className="mt-20 relative lg:max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
            <div className="relative bg-white rounded-2xl border border-[#E6E5EC] shadow-2xl p-2 overflow-hidden">
              <div className="bg-[#F8FAFC] rounded-xl border border-[#E6E5EC] aspect-video flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4 opacity-50">
                    <Activity className="h-12 w-12 text-[#3353FE]" />
                    <span className="font-heading font-medium">Dashboard Preview</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-[#0F172A] mb-4">Complete Monitoring Suite</h2>
            <p className="text-[#64748B] text-lg">Everything you need to maintain a healthy website.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-[#E6E5EC] hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                <Search className="text-[#3353FE] h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0F172A] font-heading">Broken Link Detection</h3>
              <p className="text-[#64748B] leading-relaxed">Automated crawlers find 404s and broken resources before your users do.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-[#E6E5EC] hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                <Zap className="text-emerald-600 h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0F172A] font-heading">Real-time Uptime</h3>
              <p className="text-[#64748B] leading-relaxed">Instant alerts when your site goes down, with multi-regional verification.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-[#E6E5EC] hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
                <BarChart3 className="text-purple-600 h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0F172A] font-heading">Crawl Analytics</h3>
              <p className="text-[#64748B] leading-relaxed">Deep insights into your site's structure, performance, and SEO health.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#E6E5EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
                <Activity className="text-white h-4 w-4" />
              </div>
              <span className="text-lg font-bold font-heading text-[#0F172A]">SitePulse</span>
            </div>
            <p className="text-[#64748B] text-sm">© 2026 SitePulse Enterprise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

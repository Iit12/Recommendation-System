import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  LineChart, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Bot, 
  Zap, 
  Database, 
  Cpu, 
  Scale, 
  CheckCircle2 
} from 'lucide-react';

export const HowItWorksPage = () => {
  const steps = [
    {
      num: '01',
      title: 'Search & Match',
      short: 'Enter any product query or title.',
      description: 'Our NLP parser identifies the exact model, SKU, variant, and color across differing title naming conventions used by merchants.',
      icon: <Search className="w-6 h-6 text-brand-600" />,
      color: 'bg-brand-50 border-brand-200 text-brand-700',
    },
    {
      num: '02',
      title: 'Multi-Store Compare',
      short: 'Querying e-commerce & quick commerce.',
      description: 'We calculate true effective pricing by factoring in seller discounts, bank coupon codes, and shipping charges from 6 top platforms.',
      icon: <Layers className="w-6 h-6 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    },
    {
      num: '03',
      title: 'Historical Analysis',
      short: 'Examine 180-day price curves.',
      description: 'We contextualize the current quote against 7-day, 30-day, and 6-month historical averages, identifying synthetic pre-sale price inflations.',
      icon: <LineChart className="w-6 h-6 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      num: '04',
      title: 'Intelligent Decision',
      short: 'Clear Buy Now or Wait verdict.',
      description: 'Get an actionable recommendation with confidence scoring and price drop probabilities, helping you time purchases with confidence.',
      icon: <Bot className="w-6 h-6 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
  ];

  const differentiators = [
    {
      icon: <Scale className="w-6 h-6 text-brand-600" />,
      title: 'Multi-Platform Normalization',
      desc: 'Unlike traditional comparison sites that only track Amazon & Flipkart, Smart Shopping bridges high-speed 10-minute Quick Commerce (Blinkit, Zepto, Instamart) with traditional national e-commerce.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-indigo-600" />,
      title: 'NLP Product Entity Matching',
      desc: 'Sellers deliberately title products differently ("iPhone 16 128GB Black" vs "Apple IP16 (128 GB, Midnight)"). Our tokenization layer maps diverse listings to a single canonical entity.',
    },
    {
      icon: <Database className="w-6 h-6 text-emerald-600" />,
      title: 'True Effective Cost Calculation',
      desc: 'A listing might advertise ₹999 but charge ₹150 for delivery. We evaluate total landed cost (Base + Delivery - Instant Discounts) so the lowest price is genuine.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-600" />,
      title: 'Data-Driven Purchase Timing',
      desc: 'We replace guesswork with price velocity analysis and historical volatility models, giving users a clear Buy Now / Wait recommendation.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-20 pb-24">
      
      {/* Page Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
          <Bot className="w-3.5 h-3.5 text-brand-600" />
          <span>System Architecture & Workflow</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          How Smart Shopping Works
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          From search to algorithmic decision: see how our price intelligence engine parses cross-channel marketplace data to find genuine deals.
        </p>
      </div>

      {/* 4-Step Interactive Timeline */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
            The 4-Step Intelligence Pipeline
          </h2>
        </div>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden lg:grid grid-cols-4 gap-6 relative">
          
          {/* Connector Line behind steps */}
          <div className="absolute top-12 left-12 right-12 h-0.5 bg-slate-200 -z-0"></div>

          {steps.map((step) => (
            <div
              key={step.num}
              className="relative z-10 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black ${step.color} shadow-sm`}>
                    {step.num}
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    {step.icon}
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-xs font-bold text-brand-800 mb-2">
                  {step.short}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Automated step</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="lg:hidden space-y-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card flex gap-4 items-start"
            >
              <div className={`w-12 h-12 rounded-2xl border flex-shrink-0 flex items-center justify-center font-black ${step.color} shadow-sm`}>
                {step.num}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">{step.title}</h3>
                  <span className="text-[11px] text-brand-800 font-bold">• {step.short}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* What Makes Smart Shopping Different */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-elevated relative overflow-hidden">
        <div className="max-w-3xl mb-10 space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
            Core Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            What makes Smart Shopping different?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Designed to solve the real challenges of Indian retail e-commerce fragmentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {differentiators.map((diff, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                {diff.icon}
              </div>
              <h3 className="text-base font-bold text-white">
                {diff.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {diff.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Try It CTA */}
      <div className="text-center bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-card max-w-3xl mx-auto space-y-4">
        <h3 className="text-2xl font-black text-slate-900">
          Ready to test Smart Shopping?
        </h3>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Search for flagship smartphones, premium headphones, or laptops to see real price comparisons across 6 stores.
        </p>
        <div className="pt-2">
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all active:scale-98"
          >
            <span>Start Comparing Deals</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
};

'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const features = [
  { text: 'Meals at below-retail prices' },
  { text: 'Launching near your campus' },
  { text: 'Early access & priority spots' },
];

const initialForm = {
  full_name: '',
  email: '',
  university: '',
  phone: '',
};

export default function WaitlistSection() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const fetchCount = async () => {
      const { count, error: countError } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true });

      if (!active) return;

      if (!countError) {
        setCount(count ?? 0);
      }
    };

    fetchCount();

    const channel = supabase
      .channel('waitlist-live-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist' }, () => {
        setCount((current) => current + 1);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        university: form.university.trim() || 'Not specified',
        phone: form.phone.trim() || null,
        source: 'landing_page',
      };

      const { error: insertError } = await supabase.from('waitlist').insert([payload]);

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
      setForm(initialForm);
      setCount((current) => current + 1);
    } catch (insertError: unknown) {
      const message =
        typeof insertError === 'object' &&
        insertError !== null &&
        'code' in insertError &&
        (insertError as { code?: string }).code === 'PGRST205'
          ? 'The waitlist table is not set up in Supabase yet. Apply the waitlist migration before collecting signups.'
          : insertError instanceof Error
            ? insertError.message
            : 'Something went wrong while joining the waitlist.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full py-20 px-5 md:px-8" style={{ background: '#1A1A1A' }} id="waitlist">
      <div className="max-w-5xl mx-auto text-center">
        <p
          className="font-sans font-600 text-xs tracking-widest uppercase mb-5"
          style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
        >
          For Students
        </p>

        <h2
          className="font-sans font-700 leading-tight mb-5"
          style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.75rem)', fontWeight: 700, color: '#FFFFFF' }}
        >
          Coming to your uni. <span style={{ color: '#3ECBA0' }}>Be the first to know.</span>
        </h2>

        <p
          className="font-sans text-sm leading-relaxed max-w-md mx-auto mb-8"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          We&apos;re expanding campus by campus. Join the student waitlist and we&apos;ll reach your
          university faster — and lock you in at our lowest prices.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {features?.map((feature) => (
            <div
              key={feature?.text}
              className="inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-sans font-500"
              style={{
                background: 'rgba(62,203,160,0.12)',
                border: '1px solid rgba(62,203,160,0.3)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: '#3ECBA0' }}
              />
              {feature?.text}
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] items-start max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-[#3ECBA0] mb-3">
              Early access
            </p>
            <div className="flex items-end gap-3 mb-6">
              <span className="font-sans text-5xl font-700 text-white" style={{ fontWeight: 700 }}>
                {count}
              </span>
              <span className="font-sans text-sm text-white/70 mb-1">students joined</span>
            </div>
            <div className="space-y-3 text-white/80 text-sm text-left">
              <p>• Priority notice when your campus opens</p>
              <p>• Locked-in launch pricing for early signups</p>
              <p>• Direct updates from the Makanan team</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 shadow-xl text-left"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.14)' }}
          >
            <p
              className="font-sans font-600 text-xs tracking-widest uppercase mb-4"
              style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
            >
              Student Waitlist
            </p>

            <h3
              className="font-sans font-700 text-near-black text-xl mb-1"
              style={{ fontWeight: 700 }}
            >
              Join the waitlist
            </h3>

            <p className="font-sans text-muted-text text-sm leading-relaxed mb-5">
              Tell us where you study and we&apos;ll keep you posted when Makanan reaches your
              campus.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.12em] text-muted-text mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(event) => handleChange('full_name', event.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-border-light bg-white px-4 py-3 font-sans text-sm text-near-black outline-none transition focus:border-[#3ECBA0]"
                />
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.12em] text-muted-text mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border-light bg-white px-4 py-3 font-sans text-sm text-near-black outline-none transition focus:border-[#3ECBA0]"
                />
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.12em] text-muted-text mb-2">
                  University
                </label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(event) => handleChange('university', event.target.value)}
                  required
                  placeholder="Your university"
                  className="w-full rounded-xl border border-border-light bg-white px-4 py-3 font-sans text-sm text-near-black outline-none transition focus:border-[#3ECBA0]"
                />
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.12em] text-muted-text mb-2">
                  Phone number (optional)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  placeholder="+60 12 345 6789"
                  className="w-full rounded-xl border border-border-light bg-white px-4 py-3 font-sans text-sm text-near-black outline-none transition focus:border-[#3ECBA0]"
                />
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-sans text-xs text-red-700">
                {error}
              </p>
            ) : null}

            {submitted ? (
              <p className="mt-4 rounded-lg border border-[#3ECBA0]/30 bg-[#3ECBA0]/10 px-3 py-2 font-sans text-xs text-[#0E5E42]">
                You&apos;re on the list. We&apos;ll keep you posted when we reach your campus.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="cta-primary mt-5 inline-flex items-center justify-center gap-2 font-sans font-600 text-sm px-7 py-3.5 rounded-pill transition-all duration-200 w-full disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: '#3ECBA0', color: '#1A1A1A', fontWeight: 600 }}
            >
              {loading ? 'Joining...' : 'Join the waitlist'}
            </button>

            <p className="font-sans text-muted-text text-xs mt-4">
              No spam. Quick survey to help us reach your campus. 🎓
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

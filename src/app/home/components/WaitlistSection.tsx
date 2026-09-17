'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
    <section className="w-full py-16 px-5 md:px-8" style={{ background: '#1A1A1A' }} id="waitlist">
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="font-sans font-600 text-xs tracking-widest uppercase mb-4"
          style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
        >
          For Students
        </p>

        <h2
          className="font-sans font-700 leading-tight mb-4"
          style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.75rem)', fontWeight: 700, color: '#FFFFFF' }}
        >
          Coming to your uni. <span style={{ color: '#3ECBA0' }}>Be the first to know.</span>
        </h2>

        <p
          className="font-sans text-sm leading-relaxed max-w-lg mx-auto mb-6"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Join the waitlist to get first access when Makanan opens near your campus.
        </p>

        <div className="max-w-2xl mx-auto mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/75">
          <span className="font-semibold text-white">Quick note:</span> early access, launch
          updates, and campus rollout info will be sent to your email.
        </div>

        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 shadow-xl text-left"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.14)' }}
          >
            <p
              className="font-sans font-600 text-xs tracking-widest uppercase mb-3"
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

            <p className="font-sans text-muted-text text-sm leading-relaxed mb-4">
              Fill this in and we&apos;ll email you when your campus is next.
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

            <p className="font-sans text-muted-text text-xs mt-4">No spam. Only launch updates.</p>
          </form>
        </div>
        <div className="max-w-2xl mx-auto mt-6 text-center text-xs text-white/50">
          Joined by {count} students so far.
        </div>
      </div>
    </section>
  );
}

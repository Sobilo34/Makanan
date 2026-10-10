'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  description: string;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  meals: { name: string };
  partners: { name: string };
}

const categoryLabels: Record<string, string> = {
  wrong_charge: 'Wrong Charge',
  meal_quality: 'Meal Quality',
  missing_credit: 'Missing Credit',
  partner_issue: 'Partner Issue',
  other: 'Other',
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: '#FFF8E6', text: '#D97706' },
  in_progress: { label: 'In Progress', bg: '#EFF6FF', text: '#2563EB' },
  resolved: { label: 'Resolved', bg: '#EBF9F4', text: '#2DAF87' },
  closed: { label: 'Closed', bg: '#F5F6FA', text: '#6B7280' },
};

export default function SupportPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feedback' | 'tickets'>('feedback');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRedemption, setSelectedRedemption] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const [ticketCategory, setTicketCategory] = useState('other');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [ticketsData, redemptionsData] = await Promise.all([
          api.getTickets().catch(() => []),
          api.getRedemptionHistory().catch(() => []),
        ]);
        setTickets(ticketsData || []);
        const formattedRedemptions = (redemptionsData || []).map((r: any) => ({
          id: r.id,
          redeemed_at: r.redeemed_at,
          meals: r.meals || r.meal || { name: 'Meal' },
          partners: r.partners || r.partner || { name: 'Cafeteria' },
        }));
        setRecentRedemptions(formattedRedemptions);
      } catch (err) {
        console.log('Support fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSubmitFeedback = async () => {
    if (!user || rating === 0) return;
    setSubmittingFeedback(true);
    setFormError('');
    try {
      await api.submitFeedback({
        rating,
        comment: feedbackComment || '',
        redemption_id: selectedRedemption || undefined,
      });
      setFeedbackSuccess(true);
      setRating(0);
      setFeedbackComment('');
      setSelectedRedemption('');
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!user || !ticketSubject.trim() || !ticketDescription.trim()) {
      setFormError('Please fill in all required fields');
      return;
    }
    setSubmittingTicket(true);
    setFormError('');
    try {
      const newTicket = await api.createTicket({
        category: ticketCategory,
        subject: ticketSubject,
        description: ticketDescription,
      });
      if (newTicket) setTickets([newTicket, ...tickets]);
      setTicketSuccess(true);
      setTicketSubject('');
      setTicketDescription('');
      setTicketCategory('other');
      setTimeout(() => {
        setTicketSuccess(false);
        setActiveTab('tickets');
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F5F6FA] p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#1A1A1A] font-bold text-2xl">Support</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">Get help or share your feedback</p>
        </div>
        <div className="flex gap-2">
          {(['feedback', 'tickets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === activeTab
                  ? 'bg-[#3ECBA0] text-white'
                  : 'bg-white text-[#6B7280] border border-gray-200 hover:border-[#3ECBA0]/50'
              }`}
            >
              {tab === 'feedback' ? '⭐ Rate a Meal' : '🎫 My Tickets'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main form area */}
        <div className="xl:col-span-2">
          {activeTab === 'feedback' ? (
            <div className="space-y-4">
              {feedbackSuccess && (
                <div className="bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl px-4 py-3 text-[#2DAF87] text-sm font-semibold flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Thank you for your feedback!
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-[#1A1A1A] font-bold text-sm">Rate Your Meal Experience</h3>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">
                    Help us improve by sharing your experience
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2 block">
                      Your Rating *
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-3xl transition-transform hover:scale-110"
                        >
                          <span
                            className={
                              star <= (hoverRating || rating) ? 'text-[#F59E0B]' : 'text-gray-200'
                            }
                          >
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-[#9CA3AF] text-xs mt-1">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                      </p>
                    )}
                  </div>

                  {recentRedemptions.length > 0 && (
                    <div>
                      <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2 block">
                        Related Meal (Optional)
                      </label>
                      <select
                        value={selectedRedemption}
                        onChange={(e) => setSelectedRedemption(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3ECBA0] transition-colors"
                      >
                        <option value="">Select a recent meal...</option>
                        {recentRedemptions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.meals?.name} — {r.partners?.name} (
                            {new Date(r.redeemed_at).toLocaleDateString('en-MY', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2 block">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Tell us about your experience..."
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3ECBA0] transition-colors resize-none"
                    />
                  </div>

                  {formError && <p className="text-red-500 text-xs">{formError}</p>}

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={rating === 0 || submittingFeedback}
                    className="w-full bg-[#3ECBA0] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-[#2DAF87] transition-colors"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {ticketSuccess && (
                <div className="bg-[#EBF9F4] border border-[#C8F0E4] rounded-2xl px-4 py-3 text-[#2DAF87] text-sm font-semibold flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Ticket submitted! We will get back to you soon.
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-[#1A1A1A] font-bold text-sm">Submit a Support Ticket</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2 block">
                      Category *
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3ECBA0] transition-colors"
                    >
                      {Object.entries(categoryLabels).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2 block">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description of the issue"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3ECBA0] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2 block">
                      Description *
                    </label>
                    <textarea
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3ECBA0] transition-colors resize-none"
                    />
                  </div>
                  {formError && <p className="text-red-500 text-xs">{formError}</p>}
                  <button
                    onClick={handleSubmitTicket}
                    disabled={submittingTicket}
                    className="w-full bg-[#3ECBA0] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-[#2DAF87] transition-colors"
                  >
                    {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </div>

              {/* Ticket history */}
              {!loading && tickets.length > 0 && (
                <div>
                  <h3 className="text-[#1A1A1A] font-bold text-sm mb-3">Your Tickets</h3>
                  <div className="space-y-2">
                    {tickets.map((ticket) => {
                      const st = statusConfig[ticket.status] || statusConfig.open;
                      return (
                        <div
                          key={ticket.id}
                          className="bg-white rounded-2xl p-4 border border-gray-100"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className="text-[#1A1A1A] font-semibold text-sm flex-1 min-w-0 truncate">
                              {ticket.subject}
                            </p>
                            <span
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: st.bg, color: st.text }}
                            >
                              {st.label}
                            </span>
                          </div>
                          <p className="text-[#9CA3AF] text-xs">
                            {categoryLabels[ticket.category]} ·{' '}
                            {new Date(ticket.created_at).toLocaleDateString('en-MY', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right info panel */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[#1A1A1A] font-bold text-sm mb-4">Contact Options</h3>
            <div className="space-y-3">
              {[
                { icon: '💬', label: 'Live Chat', desc: 'Mon–Fri, 9am–6pm' },
                { icon: '📧', label: 'Email Support', desc: 'support@makanan.app' },
                { icon: '📞', label: 'Phone', desc: '+60 3-1234 5678' },
              ].map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className="text-[#374151] font-semibold text-sm">{c.label}</p>
                    <p className="text-[#9CA3AF] text-xs">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[#1A1A1A] font-bold text-sm mb-4">FAQ</h3>
            <div className="space-y-3">
              {[
                'How do I redeem a meal?',
                'What happens to unused credits?',
                'Can I change my plan?',
                'How do I report a wrong charge?',
              ].map((q) => (
                <button
                  key={q}
                  className="w-full text-left flex items-center gap-2 text-[#6B7280] text-xs hover:text-[#374151] transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 text-[#3ECBA0] flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React from 'react';

interface Founder {
  name: string;
  role: string;
  title: string;
  bio: string;
  img: string | null;
  initials: string;
  isCEO?: boolean;
}

const founders: Founder[] = [
  {
    name: 'Bilal Oyeleke Soliu',
    role: 'CEO',
    title: 'Chief Executive Officer',
    bio: 'Driving the vision of making nutritious meals accessible to every student at AIU.',
    img: '/assets/images/Bilal_Oyeleke_Soliu-1787797062214.PNG',
    initials: 'BO',
    isCEO: true,
  },
  {
    name: 'Duaa Muhomed Yahya Eltayeb',
    role: 'COO',
    title: 'Chief Operating Officer',
    bio: 'Orchestrating daily operations and ensuring every meal reaches every student on time.',
    img: null,
    initials: 'DM',
  },
  {
    name: 'AbdulKarim Bangura',
    role: 'CFO',
    title: 'Chief Financial Officer',
    bio: 'Building the financial foundation that keeps Makanan affordable and sustainable.',
    img: null,
    initials: 'AB',
  },
  {
    name: 'Zohal Karimi',
    role: 'CTO',
    title: 'Chief Technology Officer',
    bio: 'Engineering the platform that makes ordering, collecting, and managing meals seamless.',
    img: null,
    initials: 'ZK',
  },
  {
    name: 'Ali Jamla Ali',
    role: 'CMO',
    title: 'Chief Marketing Officer',
    bio: 'Growing the Makanan community and making sure every AIU student knows about us.',
    img: null,
    initials: 'AJ',
  },
];

function FounderCard({ founder, size = 'md' }: { founder: Founder; size?: 'lg' | 'md' }) {
  const isLarge = size === 'lg';
  return (
    <div className="flex flex-col items-center text-center" style={{ width: isLarge ? 260 : 200 }}>
      {/* Avatar */}
      <div
        className="rounded-full overflow-hidden mb-4 flex-shrink-0"
        style={{
          width: isLarge ? 160 : 120,
          height: isLarge ? 160 : 120,
          border: isLarge ? '3px solid #3ECBA0' : '2px solid rgba(62,203,160,0.5)',
          boxShadow: isLarge
            ? '0 0 0 8px rgba(62,203,160,0.12)'
            : '0 0 0 4px rgba(62,203,160,0.08)',
        }}
      >
        {founder.img ? (
          <img
            src={founder.img}
            alt={`${founder.name}, ${founder.title}`}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2BB88A 0%, #1A9E74 100%)' }}
          >
            <span
              className="font-sans font-700 text-white"
              style={{ fontSize: isLarge ? '2.2rem' : '1.6rem', fontWeight: 700 }}
            >
              {founder.initials}
            </span>
          </div>
        )}
      </div>

      {/* Role badge */}
      <span
        className="font-sans text-[10px] font-700 px-3 py-1 rounded-full mb-2"
        style={{
          background: isLarge ? '#3ECBA0' : 'rgba(62,203,160,0.12)',
          color: isLarge ? '#0A0A0A' : '#2BB88A',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}
      >
        {founder.role}
      </span>

      <h3
        className="font-sans font-700 text-near-black leading-tight mb-1"
        style={{ fontSize: isLarge ? '1.1rem' : '0.95rem', fontWeight: 700 }}
      >
        {founder.name}
      </h3>
      <p className="font-sans text-muted-text" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
        {founder.bio}
      </p>
    </div>
  );
}

export default function FoundersSection() {
  const ceo = founders.find((f) => f.isCEO)!;
  const others = founders.filter((f) => !f.isCEO);

  return (
    <section
      className="w-full py-20 md:py-28 px-5 md:px-8 overflow-hidden"
      style={{ background: '#F5F0EB' }}
      id="founders"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="font-sans font-600 text-xs tracking-widest uppercase mb-4"
            style={{ color: '#3ECBA0', letterSpacing: '0.15em' }}
          >
            The Founders
          </p>
          <h2
            className="font-sans font-700 text-near-black leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 700 }}
          >
            Built by students, for students.
          </h2>
          <p className="font-sans text-muted-text text-base leading-relaxed max-w-md mx-auto">
            Five students. One shared frustration — skipping meals because campus food was
            expensive, inconvenient, or simply unavailable. So they built the solution themselves.
          </p>
        </div>

        {/* DESKTOP: Star pattern — CEO center, 4 others around */}
        <div className="hidden md:block relative" style={{ height: 620 }}>
          {/* CEO — center */}
          <div
            className="absolute"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <FounderCard founder={ceo} size="lg" />
          </div>

          {/* COO — top left */}
          <div className="absolute" style={{ top: '5%', left: '10%' }}>
            <FounderCard founder={others[0]} size="md" />
          </div>

          {/* CFO — top right */}
          <div className="absolute" style={{ top: '5%', right: '10%' }}>
            <FounderCard founder={others[1]} size="md" />
          </div>

          {/* CTO — bottom left */}
          <div className="absolute" style={{ bottom: '5%', left: '5%' }}>
            <FounderCard founder={others[2]} size="md" />
          </div>

          {/* CMO — bottom right */}
          <div className="absolute" style={{ bottom: '5%', right: '5%' }}>
            <FounderCard founder={others[3]} size="md" />
          </div>
        </div>

        {/* MOBILE: Vertical list — CEO first, then others */}
        <div className="md:hidden flex flex-col items-center gap-10">
          {/* CEO — larger */}
          <div className="flex flex-col items-center text-center">
            <div
              className="rounded-full overflow-hidden mb-3"
              style={{
                width: 130,
                height: 130,
                border: '3px solid #3ECBA0',
                boxShadow: '0 0 0 8px rgba(62,203,160,0.12)',
              }}
            >
              {ceo.img ? (
                <img
                  src={ceo.img}
                  alt={`${ceo.name}, ${ceo.title}`}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2BB88A 0%, #1A9E74 100%)' }}
                >
                  <span
                    className="font-sans font-700 text-white text-3xl"
                    style={{ fontWeight: 700 }}
                  >
                    {ceo.initials}
                  </span>
                </div>
              )}
            </div>
            <span
              className="font-sans text-[10px] font-700 px-2.5 py-0.5 rounded-full mb-2"
              style={{ background: '#3ECBA0', color: '#0A0A0A', fontWeight: 700 }}
            >
              {ceo.role}
            </span>
            <h3
              className="font-sans font-700 text-near-black text-base mb-1"
              style={{ fontWeight: 700 }}
            >
              {ceo.name}
            </h3>
            <p className="font-sans text-muted-text text-sm max-w-xs">{ceo.bio}</p>
          </div>

          {/* Divider */}
          <div className="w-px h-8" style={{ background: 'rgba(62,203,160,0.3)' }} />

          {/* Other founders */}
          <div className="w-full flex flex-col gap-6">
            {others.map((founder) => (
              <div
                key={founder.name}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div
                  className="rounded-full overflow-hidden flex-shrink-0"
                  style={{ width: 64, height: 64, border: '2px solid rgba(62,203,160,0.4)' }}
                >
                  {founder.img ? (
                    <img
                      src={founder.img}
                      alt={founder.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #2BB88A 0%, #1A9E74 100%)' }}
                    >
                      <span
                        className="font-sans font-700 text-white text-lg"
                        style={{ fontWeight: 700 }}
                      >
                        {founder.initials}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3
                      className="font-sans font-700 text-near-black text-sm truncate"
                      style={{ fontWeight: 700 }}
                    >
                      {founder.name}
                    </h3>
                    <span
                      className="font-sans text-[9px] font-700 px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: 'rgba(62,203,160,0.12)',
                        color: '#2BB88A',
                        fontWeight: 700,
                      }}
                    >
                      {founder.role}
                    </span>
                  </div>
                  <p className="font-sans text-muted-text text-xs leading-snug">{founder.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

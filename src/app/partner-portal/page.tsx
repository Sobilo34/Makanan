'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnerPortalIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router?.replace('/partner-portal/login');
  }, []);
  return null;
}

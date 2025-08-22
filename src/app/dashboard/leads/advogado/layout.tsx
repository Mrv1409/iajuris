'use client';
import React from 'react';
import { ProfessionalProvider } from '@/contexts/ProfessionalContext';
import { ProfessionalGuard } from '@/guards/ProfessionalGuard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProfessionalProvider>
      <ProfessionalGuard>
            {children}
      </ProfessionalGuard>
    </ProfessionalProvider>
  );
}
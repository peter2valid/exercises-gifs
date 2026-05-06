'use client';

import { useEntitlementStore } from '@/store/entitlementStore';
import type { Feature } from '@/lib/billing/types';
import { BlurOverlay } from './BlurOverlay';

type GateMode =
  | 'blur'    // Show blurred content with upgrade overlay (default)
  | 'hide'    // Render nothing when locked
  | 'replace'; // Render fallback when locked

interface PremiumGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: GateMode;
  title?: string;
  description?: string;
}

/**
 * Central feature gate for the entire application.
 * Refined to support custom teaser messaging.
 */
export function PremiumGate({ 
  feature, 
  children, 
  fallback, 
  mode = 'blur',
  title,
  description
}: PremiumGateProps) {
  const hasFeature = useEntitlementStore(s => s.hasFeature);
  const triggerUpgrade = useEntitlementStore(s => s.triggerUpgrade);

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return null;
  }

  if (mode === 'replace') {
    return <>{fallback ?? null}</>;
  }

  return (
    <BlurOverlay 
      feature={feature} 
      onUpgrade={() => triggerUpgrade(feature)}
      title={title}
      description={description}
    >
      {children}
    </BlurOverlay>
  );
}

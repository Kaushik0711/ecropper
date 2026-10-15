import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { CropperWorkspace } from '@/features/cropper/CropperWorkspace';
import { MARKETPLACES, getMarketplaceById } from '@/config/marketplaces';

interface PageProps {
  params: Promise<{
    marketplace: string;
  }>;
}

export async function generateStaticParams() {
  return MARKETPLACES.map((m) => ({
    marketplace: m.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { marketplace: marketplaceId } = await params;
  const marketplace = getMarketplaceById(marketplaceId);

  if (!marketplace) {
    return {
      title: 'Marketplace Not Found | ShipCrop',
    };
  }

  return {
    title: `${marketplace.name} Shipping Label Cropper (4x6" Thermal & A4) | ShipCrop`,
    description: marketplace.description,
  };
}

async function MarketplaceCropperContent({ params }: PageProps) {
  const { marketplace: marketplaceId } = await params;
  const marketplace = getMarketplaceById(marketplaceId);

  if (!marketplace) {
    notFound();
  }

  return <CropperWorkspace marketplace={marketplace} />;
}

export default function MarketplaceCropperPage({ params }: PageProps) {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <Suspense
          fallback={
            <div className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse flex items-center justify-center text-slate-400 text-sm">
              Loading workspace...
            </div>
          }
        >
          <MarketplaceCropperContent params={params} />
        </Suspense>
      </div>
    </AppShell>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { MarketplaceConfig, MARKETPLACES } from '@/config/marketplaces';
import { MarketplaceCard } from './MarketplaceCard';
import { MarketplaceSearch } from './MarketplaceSearch';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface MarketplaceGridProps {
  initialMarketplaces?: MarketplaceConfig[];
  showSearch?: boolean;
  limit?: number;
}

export function MarketplaceGrid({
  initialMarketplaces = MARKETPLACES,
  showSearch = true,
  limit,
}: MarketplaceGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const counts = {
      all: initialMarketplaces.length,
      general: initialMarketplaces.filter((m) => m.category === 'general').length,
      fashion: initialMarketplaces.filter((m) => m.category === 'fashion').length,
      marketplace: initialMarketplaces.filter((m) => m.category === 'marketplace').length,
    };

    return [
      { id: 'all', label: 'All Marketplaces', count: counts.all },
      { id: 'general', label: 'General / Multi-vendor', count: counts.general },
      { id: 'fashion', label: 'Fashion Portals', count: counts.fashion },
      { id: 'marketplace', label: 'Logistics / Hubs', count: counts.marketplace },
    ];
  }, [initialMarketplaces]);

  const filteredMarketplaces = useMemo(() => {
    let result = initialMarketplaces;

    if (selectedCategory !== 'all') {
      result = result.filter((m) => m.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.tagLine.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [initialMarketplaces, selectedCategory, searchQuery, limit]);

  return (
    <div className="space-y-6">
      {showSearch && (
        <MarketplaceSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
        />
      )}

      {filteredMarketplaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarketplaces.map((marketplace) => (
            <MarketplaceCard key={marketplace.id} marketplace={marketplace} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <SearchX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              No matching marketplaces found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any tool matching &quot;{searchQuery}&quot;. Try clearing your filters or check our supported tools.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Search
          </Button>
        </div>
      )}
    </div>
  );
}

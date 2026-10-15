export interface MarketplaceConfig {
  id: string;
  name: string;
  shortName: string;
  category: 'general' | 'fashion' | 'marketplace';
  tagLine: string;
  description: string;
  badge?: string;
  popular?: boolean;
  color: {
    bg: string;
    border: string;
    text: string;
    accent: string;
  };
  supportedFeatures: {
    id: string;
    label: string;
    description: string;
    implementedInPrototype: boolean;
  }[];
  defaultSettings: {
    outputFormat: 'thermal-4x6' | 'a4-4in1' | 'a4-2in1';
    cropLabelsOnly: boolean;
    separateInvoices: boolean;
    sortSku: boolean;
    sharpenBarcodes: boolean;
    marginMm: number;
    targetDpi: 203 | 300;
  };
  simulatedStats: {
    mockLabelsPerPage: number;
    mockPageCountDefault: number;
    labelWidthInch: number;
    labelHeightInch: number;
    orientation: 'portrait' | 'landscape';
  };
  sampleDocumentName: string;
  guidanceNote: string;
}

export const MARKETPLACES: MarketplaceConfig[] = [
  {
    id: 'meesho',
    name: 'Meesho',
    shortName: 'Meesho',
    category: 'general',
    tagLine: 'Crop shipping labels and separate customer tax invoices instantly',
    description: 'Automatic boundary detection for Meesho PDF manifests. Extracts 4x6" thermal labels while stripping or isolating customer invoices.',
    badge: 'Most Popular',
    popular: true,
    color: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      accent: '#db2777',
    },
    supportedFeatures: [
      { id: 'thermal-4x6', label: '4x6" Thermal Roll Output', description: 'Direct thermal print layout with sharp barcodes', implementedInPrototype: true },
      { id: 'invoice-sep', label: 'Tax Invoice Separation', description: 'Split packing slips into a separate PDF download', implementedInPrototype: true },
      { id: 'a4-4in1', label: 'A4 4-in-1 Sheet Layout', description: 'Format 4 labels per A4 paper for regular desktop printers', implementedInPrototype: true },
      { id: 'sku-sort', label: 'SKU Sorting & Summary Header', description: 'Group orders by SKU for fast warehouse picking', implementedInPrototype: true },
    ],
    defaultSettings: {
      outputFormat: 'thermal-4x6',
      cropLabelsOnly: true,
      separateInvoices: false,
      sortSku: true,
      sharpenBarcodes: true,
      marginMm: 2,
      targetDpi: 203,
    },
    simulatedStats: {
      mockLabelsPerPage: 1,
      mockPageCountDefault: 6,
      labelWidthInch: 4,
      labelHeightInch: 6,
      orientation: 'portrait',
    },
    sampleDocumentName: 'Meesho_Orders_Batch_2026_04.pdf',
    guidanceNote: 'Illustrative mock specifications. Production engine will detect Meesho multi-page slips and separate customer invoice copies automatically.',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    shortName: 'Flipkart',
    category: 'general',
    tagLine: 'Split Flipkart Smart & Regular dispatch labels with thermal alignment',
    description: 'Precision cropping for Flipkart invoice cum shipping labels. Rotates barcodes for optimal thermal printer feeder tracking.',
    badge: 'Popular',
    popular: true,
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      accent: '#2563eb',
    },
    supportedFeatures: [
      { id: 'thermal-4x6', label: 'Thermal 4x6" Roll', description: 'Standard shipping label dimensions with zero paper waste', implementedInPrototype: true },
      { id: 'invoice-sep', label: 'Invoice Strip & Split', description: 'Detaches customer tax summary into secondary file', implementedInPrototype: true },
      { id: 'barcode-rot', label: 'Auto Barcode Rotation', description: 'Rotates long 1D/2D barcodes for smooth thermal printing', implementedInPrototype: true },
      { id: 'order-sort', label: 'FSN / Order ID Grouping', description: 'Sequence packages in order of SKU picker list', implementedInPrototype: true },
    ],
    defaultSettings: {
      outputFormat: 'thermal-4x6',
      cropLabelsOnly: true,
      separateInvoices: true,
      sortSku: true,
      sharpenBarcodes: true,
      marginMm: 0,
      targetDpi: 203,
    },
    simulatedStats: {
      mockLabelsPerPage: 1,
      mockPageCountDefault: 8,
      labelWidthInch: 4,
      labelHeightInch: 6,
      orientation: 'portrait',
    },
    sampleDocumentName: 'Flipkart_Dispatch_Manifest_8Labels.pdf',
    guidanceNote: 'Illustrative mock specifications. Verified compatibility testing is scheduled for subsequent phases.',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    shortName: 'Amazon',
    category: 'general',
    tagLine: 'Easy Ship & FBA multi-label cropping and packing slip extractor',
    description: 'Processes Amazon Seller Central Easy Ship PDFs, splitting shipping labels from tax invoices and formatting for thermal rolls.',
    popular: true,
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      accent: '#d97706',
    },
    supportedFeatures: [
      { id: 'thermal-4x6', label: '4x6" Thermal EasyShip', description: 'Extracts 4x6 label without Amazon header whitespace', implementedInPrototype: true },
      { id: 'a4-2in1', label: 'A4 2-in-1 Compact Sheet', description: 'Prints 2 shipping labels per A4 page', implementedInPrototype: true },
      { id: 'invoice-sep', label: 'EasyShip Invoice Isolation', description: 'Removes packing slip copy or outputs to separate PDF', implementedInPrototype: true },
      { id: 'sku-sort', label: 'ASIN & SKU Header Placement', description: 'Includes SKU code on label top margin for picking', implementedInPrototype: true },
    ],
    defaultSettings: {
      outputFormat: 'thermal-4x6',
      cropLabelsOnly: true,
      separateInvoices: false,
      sortSku: true,
      sharpenBarcodes: true,
      marginMm: 2,
      targetDpi: 300,
    },
    simulatedStats: {
      mockLabelsPerPage: 1,
      mockPageCountDefault: 10,
      labelWidthInch: 4,
      labelHeightInch: 6,
      orientation: 'portrait',
    },
    sampleDocumentName: 'Amazon_EasyShip_Batch_10Pages.pdf',
    guidanceNote: 'Illustrative mock specifications. PDF layouts may vary by Amazon seller account type.',
  },
  {
    id: 'ajio',
    name: 'Ajio',
    shortName: 'Ajio',
    category: 'fashion',
    tagLine: 'Ajio B2C and omnichannel label formatter with high-density barcodes',
    description: 'Crops Ajio drop-ship labels, enhancing contrast on dense Code128 barcodes to prevent carrier scan rejections.',
    color: {
      bg: 'bg-slate-100',
      border: 'border-slate-300',
      text: 'text-slate-800',
      accent: '#334155',
    },
    supportedFeatures: [
      { id: 'thermal-4x6', label: '4x6" Standard Thermal', description: 'Standard thermal roll formatting with clear courier routing', implementedInPrototype: true },
      { id: 'contrast-boost', label: 'Barcode Sharpening', description: 'High contrast processing for dense carrier barcodes', implementedInPrototype: true },
      { id: 'manifest-summary', label: 'Picklist Sheet Summary', description: 'Generates picking summary with product SKUs and quantities', implementedInPrototype: true },
    ],
    defaultSettings: {
      outputFormat: 'thermal-4x6',
      cropLabelsOnly: true,
      separateInvoices: false,
      sortSku: false,
      sharpenBarcodes: true,
      marginMm: 0,
      targetDpi: 203,
    },
    simulatedStats: {
      mockLabelsPerPage: 1,
      mockPageCountDefault: 4,
      labelWidthInch: 4,
      labelHeightInch: 6,
      orientation: 'portrait',
    },
    sampleDocumentName: 'Ajio_Dropship_Batch_Sample.pdf',
    guidanceNote: 'Illustrative mock specifications. Support information is illustrative until individual marketplace PDF formats are tested.',
  },
  {
    id: 'myntra',
    name: 'Myntra',
    shortName: 'Myntra',
    category: 'fashion',
    tagLine: 'Fashion marketplace shipping label cutter and return slip organizer',
    description: 'Formats Myntra logistics slips for thermal printers while preserving courier routing codes and customer invoice barcodes.',
    color: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      accent: '#e11d48',
    },
    supportedFeatures: [
      { id: 'thermal-4x6', label: '4x6" Thermal Cutter', description: 'Extracts primary shipping sticker for standard thermal paper', implementedInPrototype: true },
      { id: 'return-slip', label: 'Return Slip Handling', description: 'Option to exclude or separate customer return instructions', implementedInPrototype: true },
      { id: 'sku-sort', label: 'Style & Size Sorting', description: 'Orders labels by product style code for streamlined packing', implementedInPrototype: true },
    ],
    defaultSettings: {
      outputFormat: 'thermal-4x6',
      cropLabelsOnly: true,
      separateInvoices: true,
      sortSku: true,
      sharpenBarcodes: true,
      marginMm: 2,
      targetDpi: 203,
    },
    simulatedStats: {
      mockLabelsPerPage: 1,
      mockPageCountDefault: 5,
      labelWidthInch: 4,
      labelHeightInch: 6,
      orientation: 'portrait',
    },
    sampleDocumentName: 'Myntra_Logistics_Orders_Sample.pdf',
    guidanceNote: 'Illustrative mock specifications. Support information is illustrative until individual marketplace PDF formats are tested.',
  },
  {
    id: 'snapdeal',
    name: 'Snapdeal',
    shortName: 'Snapdeal',
    category: 'marketplace',
    tagLine: 'Snapdeal seller shipping label crop & dual-copy separator',
    description: 'Splits Snapdeal 2-copy and 4-copy PDF invoices into individual 4x6" thermal labels with clear seller and courier portions.',
    color: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      accent: '#dc2626',
    },
    supportedFeatures: [
      { id: 'thermal-4x6', label: '4x6" Thermal Print', description: 'Thermal roll layout with clean courier copy isolation', implementedInPrototype: true },
      { id: 'a4-4in1', label: 'A4 4-in-1 Sheet', description: 'Combine 4 labels on a single sheet of A4 sticky paper', implementedInPrototype: true },
      { id: 'invoice-sep', label: 'Customer Copy Splitter', description: 'Saves customer invoice into a separate organized PDF', implementedInPrototype: true },
    ],
    defaultSettings: {
      outputFormat: 'thermal-4x6',
      cropLabelsOnly: true,
      separateInvoices: false,
      sortSku: false,
      sharpenBarcodes: true,
      marginMm: 0,
      targetDpi: 203,
    },
    simulatedStats: {
      mockLabelsPerPage: 1,
      mockPageCountDefault: 6,
      labelWidthInch: 4,
      labelHeightInch: 6,
      orientation: 'portrait',
    },
    sampleDocumentName: 'Snapdeal_Manifest_Batch_Sample.pdf',
    guidanceNote: 'Illustrative mock specifications. Support information is illustrative until individual marketplace PDF formats are tested.',
  },
];

export function getMarketplaceById(id: string): MarketplaceConfig | undefined {
  return MARKETPLACES.find((m) => m.id.toLowerCase() === id.toLowerCase());
}

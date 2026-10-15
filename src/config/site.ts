export const SITE_CONFIG = {
  name: 'ShipCrop Studio',
  shortName: 'ShipCrop',
  tagline: 'Smart Shipping-Label PDF Cropper for E-commerce Sellers',
  description: 'Easily crop, format, and organize shipping label PDFs for Meesho, Flipkart, Amazon, Ajio, and more. Optimized for 4x6" thermal printers and A4 sheets.',
  url: 'https://shipcrop.local',
  navLinks: [
    { label: 'Marketplaces', href: '/tools' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Privacy', href: '/privacy' },
  ],
  footerLinks: {
    tools: [
      { label: 'Meesho Cropper', href: '/tools/meesho' },
      { label: 'Flipkart Cropper', href: '/tools/flipkart' },
      { label: 'Amazon Cropper', href: '/tools/amazon' },
      { label: 'Ajio Cropper', href: '/tools/ajio' },
      { label: 'All Marketplace Tools', href: '/tools' },
    ],
    resources: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Thermal Printer Setup', href: '/how-it-works#thermal' },
      { label: 'Frequently Asked Questions', href: '/faq' },
      { label: 'Browser-Only Architecture', href: '/privacy' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/privacy#terms' },
      { label: 'Data Security Guarantee', href: '/privacy#security' },
    ],
  },
  prototypeNotice: 'Phase 0 Interactive UI Prototype — Document processing, cropping, and PDF downloads are simulated for design evaluation. Files are not sent to any server.',
};

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'printing' | 'privacy' | 'marketplaces';
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'supported-marketplaces',
    category: 'marketplaces',
    question: 'Which e-commerce marketplaces are supported?',
    answer: 'ShipCrop is designed for leading Indian e-commerce seller portals including Meesho, Flipkart, Amazon Easy Ship, Ajio Dropship, Snapdeal, and Myntra. Supported format specifications are illustrative in this prototype phase and will be rigorously tested against live marketplace PDF structures in upcoming phases.',
  },
  {
    id: 'browser-privacy',
    category: 'privacy',
    question: 'Are my shipping labels or customer addresses uploaded to any server?',
    answer: 'No. ShipCrop is architected as a 100% client-side tool. In this prototype, your selected files are held only in local browser memory and never uploaded to any remote server or third-party database. Customer PII and order data never leave your computer.',
  },
  {
    id: 'thermal-vs-a4',
    category: 'printing',
    question: 'What is the difference between 4x6" thermal output and A4 output?',
    answer: '4x6" (100x150mm) is the global standard for direct thermal sticker rolls (TVS, Zebra, TSC, Rollo, etc.), requiring zero ribbon or ink. A4 output arranges multiple cropped labels (2-in-1 or 4-in-1) onto standard sheets for regular laser or inkjet printers.',
  },
  {
    id: 'invoice-separation',
    category: 'general',
    question: 'How does tax invoice separation work?',
    answer: 'Many marketplace manifests combine the shipping courier sticker and customer tax invoice on the same page. ShipCrop isolates the shipping label for your thermal box sticker, and can optionally compile all matching tax invoices into a separate downloadable PDF for your accounts binder.',
  },
  {
    id: 'sku-sorting',
    category: 'general',
    question: 'What is SKU sorting and why is it useful?',
    answer: 'When packing dozens of parcels, hunting through mixed items is inefficient. SKU sorting arranges all labels with the same product SKU consecutively and prints a picklist summary on the first page, speeding up warehouse order fulfillment by up to 60%.',
  },
  {
    id: 'file-size-limits',
    category: 'general',
    question: 'What are the file size and page count limits?',
    answer: 'Because processing executes inside the local browser engine using WebAssembly and Web Workers, files up to 50MB and batches up to 200 labels per file are targeted for smooth client-side performance without system slowdown.',
  },
  {
    id: 'printer-troubleshooting',
    category: 'printing',
    question: 'My thermal barcodes look blurry. How does ShipCrop help?',
    answer: 'ShipCrop includes a built-in Barcode Sharpening toggle that renders 1D/2D barcodes at native thermal printer DPI (203 DPI or 300 DPI) with crisp black/white boundaries, preventing courier scanner read errors at pickup.',
  },
  {
    id: 'commercial-use',
    category: 'general',
    question: 'Is ShipCrop free for commercial seller use?',
    answer: 'The core shipping label cropping tool is planned as a friction-free utility for active e-commerce sellers, with zero account sign-up required for standard batch operations.',
  },
];

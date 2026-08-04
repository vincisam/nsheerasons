import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { normalizeDesignConcept } from './designConcept';
import { normalizeAstroSuggestion } from './astroConcept';
import headerLogo from './assets/new-header-logo.png';
import { buildInAppModelShotPrompt, generateModelPreviewImages } from './modelPreview';
import { buildProviderAuthUrl, parseSocialAuthResponse } from './socialAuth';
import { authorizeStaffLogin, hasStaffAccess, STAFF_PERMISSION_OPTIONS } from './staffAuth';
import { DEFAULT_HERO_SLIDES, normalizeHeroSlides } from './homepageSettings';
import { DEFAULT_GST_NUMBER, resolveGstNumber } from './gstUtils';
import { parseIndiaSpotPrice, parseRapidApiRate } from './rateSources';
import {
  Gem, Menu, X, Lock, Plus, Trash2, Edit2, Search, RefreshCw, Phone, Mail,
  MapPin, Building2, User, Save, ChevronRight, LogOut, ShieldCheck, Award,
  Loader2, AlertCircle, CheckCircle2, ChevronLeft, ShoppingBag, Minus,
  CreditCard, Smartphone, Landmark, ChevronDown, ChevronUp, PackageCheck,
  Facebook, Instagram, Youtube, MessageCircle, Upload, Image as ImageIcon,
  Heart, Calendar, Eye, UserCircle, Cake, Key, Sparkles, Wand2, Palette, FileText, Paperclip, PencilRuler, Apple, Stars,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const PURITY_OPTIONS = [
  { key: 'gold999', label: '24ct Gold (999)', metal: 'gold', factor: 0.999, stamp: '999' },
  { key: 'gold916', label: '22ct Gold (916)', metal: 'gold', factor: 0.916, stamp: '916' },
  { key: 'gold750', label: '18ct Gold (750)', metal: 'gold', factor: 0.750, stamp: '750' },
  { key: 'gold585', label: '14ct Gold (585)', metal: 'gold', factor: 0.585, stamp: '585' },
  { key: 'silver925', label: 'Silver (925 Sterling)', metal: 'silver', factor: 0.925, stamp: '925' },
  { key: 'silver999', label: 'Silver (999 Fine)', metal: 'silver', factor: 0.999, stamp: '999' },
  { key: 'na', label: 'Not Applicable / Other Material', metal: 'none', factor: 0, stamp: '—' },
];

const purityByKey = (k) => PURITY_OPTIONS.find((p) => p.key === k) || PURITY_OPTIONS[1];

const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const uid = () => Math.random().toString(36).slice(2, 10);

// Fire-and-forget storage write used inside React state updaters, where an uncaught
// synchronous throw (e.g. window.storage being unavailable) would crash the whole
// render — not just fail silently. Optional chaining alone isn't enough here because
// this runs inside setState callbacks; wrapping in try/catch guarantees it never throws.
function safeStorageSet(key, value, shared = false) {
  try {
    window.storage?.set(key, value, shared)?.catch(() => {});
  } catch (e) {
    // window.storage missing or misbehaving — nothing persists this write, but the
    // app keeps working in-memory rather than crashing.
  }
}

const SHOP = {
  name: 'N.S. Heera & Sons Jewellers',
  address: 'D-2/6, Krishan Nagar, Delhi-110051',
  phone: '+91 9899099383 / +91 9810332043',
  whatsappNumber: '9899099383',
  email: 'contact@heerasons.com',
  hours: 'Mon – Sat: 10:30 AM – 8:00 PM · Sunday: 11:00 AM – 6:00 PM',
};

const POLICY_CONTENT = {
  terms: {
    title: 'Terms & Conditions',
    intro: 'By browsing and purchasing from N.S. Heera & Sons Jewellers, you agree to the following terms.',
    points: [
      'All prices shown are indicative and subject to final billing at the time of purchase.',
      'Product availability, making charges, and stone/diamond pricing may vary based on the final selection and current market conditions.',
      'Orders are accepted subject to stock availability and confirmation by the store team.',
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    intro: 'Refunds and cancellations are handled on a case-by-case basis to protect both the customer and the business.',
    points: [
      'Custom-made or personalised jewellery is generally non-refundable once work has begun.',
      'Ready stock orders may be cancelled before dispatch, subject to store approval.',
      'Any refund, if approved, will be processed to the original payment method within the timelines set by the payment gateway.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'We respect your privacy and use your information only to support your purchase and service experience.',
    points: [
      'Contact details, addresses, and order information are used only for order processing, communication, and service support.',
      'We do not sell your personal information to third parties.',
      'If you wish to update or remove your account information, please contact the store directly.',
    ],
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    intro: 'We aim to deliver orders safely and promptly across India.',
    points: [
      'Free shipping is available on orders above ₹10,000.00.',
      'Delivery timelines depend on the shipping method, destination, and product type.',
      'Please inspect the item upon delivery and report any issue immediately to the store.',
    ],
  },
};

// Replace these placeholder URLs with the shop's real profile links before going live.
// WhatsApp is built from SHOP.whatsappNumber via the standard wa.me deep link.
const SOCIAL_LINKS = [
  { id: 'facebook', label: 'Facebook', icon: (size) => <div style={{width:size,height:size,borderRadius:'50%',background:'#1877F2',display:'flex',alignItems:'center',justifyContent:'center'}}><Facebook size={size*0.55} color="#fff" /></div>, url: 'https://www.facebook.com/NSHeeraSons/' },
  { id: 'instagram', label: 'Instagram', icon: (size) => <div style={{width:size,height:size,borderRadius:'50%',background:'linear-gradient(135deg,#F9CE34,#EE2A7B,#6228D7)',display:'flex',alignItems:'center',justifyContent:'center'}}><Instagram size={size*0.55} color="#fff" /></div>, url: 'https://www.instagram.com/nsheerasons' },
  { id: 'whatsapp', label: 'WhatsApp', icon: (size) => <div style={{width:size,height:size,borderRadius:'50%',background:'#25D366',display:'flex',alignItems:'center',justifyContent:'center'}}><MessageCircle size={size*0.55} color="#fff" /></div>, url: `https://wa.me/${SHOP.whatsappNumber}` },
  { id: 'youtube', label: 'YouTube', icon: (size) => <div style={{width:size,height:size,borderRadius:'50%',background:'#FF0000',display:'flex',alignItems:'center',justifyContent:'center'}}><Youtube size={size*0.55} color="#fff" /></div>, url: 'https://youtube.com/@nsheerasons' },
];

const SEO_KEYWORDS =
  'gold jewellery Delhi, silver jewellery Delhi, diamond jewellery Delhi, cash for gold Delhi, ' +
  'gold loan settlement Delhi, sell old gold Delhi, gold buyer Krishan Nagar, jewellery shop Krishan Nagar, ' +
  'jewellery shop Delhi 110051, BIS hallmark jewellery, today gold rate, today silver rate, gold rate per gram, ' +
  'silver rate per gram, gold coin, silver coin, N S Heera and Sons Jewellers, gold jewellery online Delhi';

const SEO_BY_VIEW = {
  store: {
    title: 'N.S. Heera & Sons Jewellers | Gold, Silver & Diamond Jewellery in Krishan Nagar, Delhi',
    description: 'Shop BIS hallmarked gold, silver & diamond jewellery, gold & silver coins at N.S. Heera & Sons Jewellers, Krishan Nagar, Delhi-110051. Live gold & silver rates updated daily.',
  },
  about: {
    title: 'About Us | N.S. Heera & Sons Jewellers, Krishan Nagar, Delhi',
    description: 'Three generations of trust — the story of N.S. Heera & Sons Jewellers, Krishan Nagar, Delhi, jewellers since 1968.',
  },
  contact: {
    title: 'Contact Us | N.S. Heera & Sons Jewellers',
    description: 'Visit or contact N.S. Heera & Sons Jewellers at D-2/6, Krishan Nagar, Delhi-110051.',
  },
  cashforgold: {
    title: 'Cash for Gold & Gold Loan Settlement in Delhi | N.S. Heera & Sons Jewellers',
    description: 'Get instant cash for your old gold or settle your gold loan at today\'s live gold rate. Visit N.S. Heera & Sons Jewellers, Krishan Nagar, Delhi.',
  },
  checkout: { title: 'Checkout | N.S. Heera & Sons Jewellers', description: 'Complete your jewellery purchase securely.' },
  account: { title: 'My Account | N.S. Heera & Sons Jewellers', description: 'Sign in to manage your profile, shortlist and order preferences with N.S. Heera & Sons Jewellers.' },
  admin: { title: 'Admin Panel | N.S. Heera & Sons Jewellers', description: '' },
};

const DEFAULT_CATEGORIES = [
  { id: 'gold-jewellery', name: 'Gold Jewellery', code: 'GJ', imageDataUrl: '' },
  { id: 'diamond-jewellery', name: 'Diamonds Jewellery', code: 'DJ', imageDataUrl: '' },
  { id: 'silver-jewellery', name: 'Silver Jewellery', code: 'SJ', imageDataUrl: '' },
  { id: 'coins', name: 'Gold & Silver Coins', code: 'CN', imageDataUrl: '' },
  { id: 'utensils-gifts', name: 'Utensils and Gift Items', code: 'UG', imageDataUrl: '' },
  { id: 'gems-stones', name: 'Gems & Stones', code: 'GS', imageDataUrl: '' },
];

const CATEGORY_SUBCATEGORY_OPTIONS = {
  'gold-jewellery': ['Necklace', 'Chain', 'Ring', 'Earrings', 'Bangle', 'Bracelet', 'Pendant', 'Mangalsutra'],
  'diamond-jewellery': ['Ring', 'Earrings', 'Necklace', 'Pendant', 'Bracelet'],
  'silver-jewellery': ['Payal', 'Chain', 'Bangle', 'Pooja Items', 'Utensils'],
  'coins': ['Gold Coin', 'Silver Coin'],
  'utensils-gifts': ['Utensils', 'Gift Items', 'Idols'],
  'gems-stones': ['Ruby', 'Emerald', 'Sapphire', 'Diamond', 'Pearl', 'Semi-Precious'],
};

// Cap on photos per product — keeps the whole catalog (categories + products, saved
// as one storage entry) comfortably under the artifact storage size limit even for a
// shop with many products, each carrying a small gallery of compressed JPEGs.
const MAX_PHOTOS_PER_PRODUCT = 5;

// Standard inventory fields per row, matching the shop's stock-register format:
// Category (department) · Item Type · Item Code · Item Description · Purity ·
// Gross Wt. · Net Wt. · Diamonds (₹) · Stones (₹) · Others (₹)
const DEFAULT_PRODUCTS = [
  { id: uid(), categoryId: 'gold-jewellery', itemType: 'Chain', itemCode: 'CH001', description: 'Italian Chain', purity: 'gold916', grossWeight: 13.81, netWeight: 13.81, diamondsValue: 0, stonesValue: 0, othersValue: 0, making: 8, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'gold-jewellery', itemType: 'Necklace', itemCode: 'NK101', description: 'Antique Temple Necklace', purity: 'gold916', grossWeight: 46, netWeight: 45, diamondsValue: 0, stonesValue: 0, othersValue: 1500, making: 12, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'diamond-jewellery', itemType: 'Ring', itemCode: 'DR201', description: 'Solitaire Halo Ring', purity: 'gold750', grossWeight: 4.5, netWeight: 4.2, diamondsValue: 25000, stonesValue: 0, othersValue: 0, making: 15, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'diamond-jewellery', itemType: 'Earrings', itemCode: 'DE301', description: 'Diamond Stud Earrings', purity: 'gold750', grossWeight: 3.2, netWeight: 3.0, diamondsValue: 18000, stonesValue: 0, othersValue: 0, making: 14, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'silver-jewellery', itemType: 'Bangle', itemCode: 'SB401', description: 'Silver Payal (Pair)', purity: 'silver925', grossWeight: 62, netWeight: 60, diamondsValue: 0, stonesValue: 0, othersValue: 0, making: 18, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'silver-jewellery', itemType: 'Chain', itemCode: 'SC402', description: 'Silver Rope Chain', purity: 'silver925', grossWeight: 22, netWeight: 20, diamondsValue: 0, stonesValue: 0, othersValue: 0, making: 10, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'coins', itemType: 'Coin', itemCode: 'GC501', description: '24ct Gold Coin 10g', purity: 'gold999', grossWeight: 10, netWeight: 10, diamondsValue: 0, stonesValue: 0, othersValue: 0, making: 5, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'coins', itemType: 'Coin', itemCode: 'SC502', description: 'Silver Coin 999 (20g)', purity: 'silver999', grossWeight: 20, netWeight: 20, diamondsValue: 0, stonesValue: 0, othersValue: 0, making: 5, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'utensils-gifts', itemType: 'Utensil', itemCode: 'SU601', description: 'Silver Glass Set (Pair)', purity: 'silver925', grossWeight: 240, netWeight: 235, diamondsValue: 0, stonesValue: 0, othersValue: 500, making: 8, makingType: 'percentage', imageDataUrls: [] },
  { id: uid(), categoryId: 'utensils-gifts', itemType: 'Gift Item', itemCode: 'GF701', description: 'Silver Plated Photo Frame', purity: 'na', grossWeight: 0, netWeight: 0, diamondsValue: 0, stonesValue: 0, othersValue: 1200, making: 250, makingType: 'fixed', imageDataUrls: [] },
];

const DEFAULT_RATES = {
  spotGold24k: 7500,   // INR per gram, fallback until live fetch succeeds
  spotSilver: 95,      // INR per gram, fallback
  markupPercent: 10,
  manual: false,
  manualGold24k: 7500,
  manualSilver: 95,
  source: 'fallback',
  sourceName: '',
  lastUpdated: null,
};

function calcSellingRates(rates) {
  const gold24 = rates.manual ? rates.manualGold24k : rates.spotGold24k * (1 + rates.markupPercent / 100);
  const silver = rates.manual ? rates.manualSilver : rates.spotSilver * (1 + rates.markupPercent / 100);
  return { gold24, silver };
}

// Net Wt. (not Gross Wt.) is what carries the metal rate — Gross Wt. is kept purely
// as an inventory/reference figure, same convention used on the shop's stock sheet.
// Diamonds / Stones / Others are entered as flat ₹ value-adds (their pricing doesn't
// follow the per-gram metal rate). Making (labour) charges can be entered either as a
// percentage of metal value, or as a fixed flat ₹ amount per piece — set via
// product.makingType ('percentage' | 'fixed'). GST applies on top of everything.
function calcProductPrice(product, rates) {
  const p = purityByKey(product.purity);
  const { gold24, silver } = calcSellingRates(rates);
  const baseRate = p.metal === 'gold' ? gold24 : p.metal === 'silver' ? silver : 0;
  const metalValue = p.metal === 'none' ? 0 : (product.netWeight || 0) * baseRate * p.factor;
  const makingValue = Number(product.making || 0);
  const making = product.makingType === 'fixed' ? makingValue : metalValue * (makingValue / 100);
  const addOns = (product.diamondsValue || 0) + (product.stonesValue || 0) + (product.othersValue || 0);
  const subtotal = metalValue + making + addOns;
  const gst = subtotal * 0.03;
  return { metalValue, making, addOns, gst, total: subtotal + gst };
}

// Reads a selected image file, downsizes it to a reasonable max dimension, and
// re-encodes as JPEG so stored product photos stay small (typically 30-100KB each)
// — keeps the whole catalog comfortably under the artifact storage size limit even
// with photos on every product, instead of storing the original (often multi-MB) file.
function compressImageFile(file, maxDimension = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = () => {
        // Guarded: if canvas rendering is unavailable for any reason, reject cleanly
        // instead of leaving the caller's promise pending forever (a stuck "processing"
        // spinner is worse than a clear, retryable error).
        try {
          let { width, height } = img;
          if (width > height && width > maxDimension) { height = Math.round((height * maxDimension) / width); width = maxDimension; }
          else if (height > maxDimension) { width = Math.round((width * maxDimension) / height); height = maxDimension; }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context unavailable');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Plain base64 read, no compression — used for PDF reference documents (compression
// via canvas only applies to images the browser can decode/draw).
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* AI Design Studio — uses the in-artifact Anthropic API access to      */
/* turn a text prompt (or an uploaded reference photo/document) into a  */
/* structured jewellery design concept. IMPORTANT: this generates a     */
/* written design brief, not a photorealistic rendered image — Claude   */
/* doesn't generate images. The concept then feeds a human-reviewed     */
/* quotation request, since real custom jewellery pricing needs a       */
/* goldsmith's judgment, not an automated number.                       */
/* ------------------------------------------------------------------ */

const DESIGN_AI_SYSTEM_PROMPT = `You are a senior jewellery design consultant for N.S. Heera & Sons Jewellers, an Indian gold, diamond and silver jewellery retailer established in 1968. A customer will either describe a design they want in words, or share a photo/document of an existing piece they'd like redesigned.

Propose ONE thoughtful, realistic jewellery design concept suited to Indian jewellery craftsmanship (gold purities like 22K/916, 18K/750, silver 925, diamonds, traditional and contemporary styles). Keep suggestions realistic for a working jeweller to actually produce — avoid impossible, wildly extravagant, or unsafe claims, and do not invent a precise final price (a human will quote that).

If the request is unrelated to jewellery design (or the uploaded file isn't jewellery), politely decline within the JSON's "description" field and leave other fields empty, rather than making something up.

You MUST include at least 2-3 designVariations entries showing alternative options (e.g. different metal, purity, weight, price point) for the concept. Each variation should have its own specs.

Respond with ONLY a JSON object in exactly this shape — no markdown fences, no preamble, no text outside the JSON:
{
  "title": "short concept name",
  "description": "2-4 sentence description of the design",
  "suggestedMetal": "e.g. 22K Gold / Sterling Silver / Gold with Diamonds",
  "suggestedPurity": "e.g. 22K (916)",
  "estimatedWeightRange": "e.g. 8-12 grams",
  "approximatePrice": "e.g. ₹45,000 - ₹55,000",
  "detailing": "Detailed design description — pattern, finish, gemstone settings, special features",
  "gemstoneSuggestions": "e.g. Small round diamonds, ruby accent, or none",
  "stoneDetails": "Detailed stone specifications — type, carat weight, color, clarity, cut, number of stones",
  "styleNotes": "1-2 sentences on style, occasion fit, or how this reinterprets the uploaded reference",
  "craftsmanshipTime": "Estimated making time, e.g. 2-3 weeks",
  "suitableFor": "e.g. Wedding, Engagement, Festive wear, Daily wear, Gift",
  "techniqueNotes": "Craftsmanship techniques — e.g. hand engraving, filigree, kundan setting, milgrain detailing",
  "designVariations": [
    {
      "name": "e.g. Premium Version (Diamond-set)",
      "description": "What makes this variation different",
      "metal": "e.g. 18K Gold",
      "purity": "e.g. 18K (750)",
      "weight": "e.g. 10-12 grams",
      "price": "e.g. ₹65,000 - ₹75,000",
      "gemstones": "e.g. VS clarity diamonds, 0.5ct total",
      "makingTime": "e.g. 3-4 weeks"
    },
    {
      "name": "e.g. Essential Version (Without Diamonds)",
      "description": "A more affordable option",
      "metal": "e.g. 22K Gold",
      "purity": "e.g. 22K (916)",
      "weight": "e.g. 8-10 grams",
      "price": "e.g. ₹35,000 - ₹42,000",
      "gemstones": "None",
      "makingTime": "e.g. 2-3 weeks"
    }
  ]
}`;

// Primary source: your own backend proxy for AI design, exposed at the same origin
// via /api/ai/jewellery-design during deployment. Local dev: Vite proxies /api/* →
// http://localhost:3000 (vite.config.js). Left blank, this tier is simply skipped.
const DESIGN_BACKEND_URL = import.meta.env.VITE_DESIGN_BACKEND_URL || '/api/design/generate';

async function callDesignAI({ promptText, fileBlock }) {
  // Try the backend proxy first — it works on the deployed, standalone site.
  if (DESIGN_BACKEND_URL) {
    try {
      const res = await fetch(DESIGN_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText, fileBlock }),
      });
      if (res.ok) {
        const concept = await res.json();
        return normalizeDesignConcept(concept);
      }
      // Backend reachable but not configured (no ANTHROPIC_API_KEY set) or the AI
      // call itself failed server-side — fall through to the in-artifact path below.
    } catch (networkErr) {
      // Backend not deployed/running (e.g. local dev without the Spring Boot service
      // started) — fall through to the in-artifact path below.
    }
  }

  const userContent = [];
  if (fileBlock) userContent.push(fileBlock);
  userContent.push({ type: 'text', text: promptText });

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: DESIGN_AI_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
  } catch (networkErr) {
    // A rejected fetch (offline, blocked, etc.) throws a raw, often cryptic browser
    // error ("Failed to fetch") — normalize it to something a customer can act on.
    throw new Error('Could not reach the AI design service — check your connection and try again.');
  }
  if (!response.ok) throw new Error('AI design request failed (HTTP ' + response.status + ') — please try again.');
  const data = await response.json();
  const text = (data.content || []).map((b) => b.text || '').filter(Boolean).join('\n');
  const cleaned = text.replace(/```json|```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Could not understand the AI response — please try again.');
  }
  return normalizeDesignConcept(parsed);
}

/* ------------------------------------------------------------------ */
/* Astro Stone Advisor — traditional Vedic-astrology-inspired gemstone  */
/* (Ratna) suggestions based on birth details. Always presented as      */
/* traditional/cultural guidance, never as medical, legal, or financial */
/* advice — see the disclaimer rendered with every result.              */
/* ------------------------------------------------------------------ */

const ASTRO_BACKEND_URL = import.meta.env.VITE_ASTRO_BACKEND_URL || '/api/astro/suggest-stone';

async function callAstroAI({ dateOfBirth, timeOfBirth, placeOfBirth, concern }) {
  let response;
  try {
    response = await fetch(ASTRO_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateOfBirth, timeOfBirth, placeOfBirth, concern }),
    });
  } catch (networkErr) {
    throw new Error('Could not reach the astrology suggestion service — check your connection and try again.');
  }
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Astro Stone Advisor isn\u2019t available right now — please try again later or visit us in-store.');
    }
    throw new Error('Astro suggestion request failed (HTTP ' + response.status + ') — please try again.');
  }
  const data = await response.json();
  return normalizeAstroSuggestion(data);
}

// blocking cross-origin browser requests), retries once through a public CORS relay
// so the call still succeeds inside a sandboxed browser context. `log`, if passed,
// records exactly what was tried and why it failed — surfaced in the admin Rates tab
// so a failure can actually be diagnosed instead of just showing a generic message.
// Fetches JSON directly; if that fails (network error, or the target blocking
// cross-origin browser requests), retries through several independent public CORS
// relays in turn, so a single relay being down/blocked doesn't take out the whole
// site. `log`, if passed, records exactly what was tried and why each attempt failed
// — surfaced in the admin Rates tab so a failure can actually be diagnosed.
const CORS_RELAYS = [
  (u) => u, // direct — no relay
  (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
];

async function fetchTextResilient(url, log) {
  let lastErr;
  for (const relay of CORS_RELAYS) {
    const target = relay(url);
    const mode = target === url ? 'direct' : new URL(target).hostname;
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      log?.push({ url, mode, ok: true });
      return text;
    } catch (err) {
      lastErr = err;
      log?.push({ url, mode, ok: false, error: String(err?.message || err) });
    }
  }
  throw lastErr;
}

async function fetchJsonResilient(url, log) {
  const text = await fetchTextResilient(url, log);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Response was not valid JSON');
  }
}

// Primary source: your own backend proxy (see /rates-proxy — a small Spring Boot
// service that calls metals.dev with the API key kept server-side). Set this to your
// deployed proxy's URL once it's live, e.g. 'https://your-rates-proxy.example.com/api/rates'.
// Left blank, this tier is simply skipped.
//
// Local development: Vite proxies /api/* → http://localhost:8080 (set in vite.config.js)
// Production: update this to your deployed backend URL (e.g. Railway)
const RATES_BACKEND_URL = import.meta.env.VITE_RATES_BACKEND_URL || '/api/rates';

// metals.dev, called directly from the browser with this API key. NOTE: this means
// the key is visible to anyone who views the page source — fine for getting live
// rates working now, but for a public production site the RATES_BACKEND_URL proxy
// above is the safer long-term home for this key.
const METALS_DEV_API_KEY = 'UWY1VV6WCDIKUEG1YNEP476G1YNEP';

// metalpriceapi.com — same client-side-key caveat as above.
const METALPRICEAPI_KEY = 'c006c08cb3c7f38e3b466cb3a996aca8';

// RapidAPI Indian Gold & Silver Live/Historical Price API
const RAPIDAPI_KEY = 'd8e114de90msh9ba12e7d8f15c80p1a06d0jsnf80b27f8a954';
const RAPIDAPI_HOST = 'gold-silver-live-price-india.p.rapidapi.com';

async function fetchLiveRates() {
  const OZ_TO_G = 31.1035;
  const log = [];
  const tiers = [];

  if (RATES_BACKEND_URL) {
    tiers.push(async () => {
      const data = await fetchJsonResilient(RATES_BACKEND_URL, log);
      const goldPerGram = Number(data?.goldPerGram);
      const silverPerGram = Number(data?.silverPerGram);
      if (!goldPerGram || !silverPerGram) throw new Error('Malformed backend proxy response');
      return { spotGold24k: goldPerGram, spotSilver: silverPerGram, sourceName: data.source ? `backend (${data.source})` : 'backend proxy' };
    });
  }

  // metalpriceapi.com, base=INR. Their docs confirm the "{BASE}{SYMBOL}" convenience
  // key (e.g. INRXAU) is the price of 1 unit of SYMBOL expressed directly in BASE
  // currency — no reciprocal math needed. Falls back to inverting the raw per-1-INR
  // rate if that convenience key isn't present for some reason.
  tiers.push(async () => {
    const data = await fetchJsonResilient(
      `https://api.metalpriceapi.com/v1/latest?api_key=${METALPRICEAPI_KEY}&base=INR&currencies=EUR,XAU,XAG`,
      log
    );
    if (data?.success !== true) throw new Error(data?.error?.info || 'metalpriceapi.com request failed');
    const rates = data?.rates || {};
    const goldInrOz = Number(rates.INRXAU) || (rates.XAU ? 1 / Number(rates.XAU) : NaN);
    const silverInrOz = Number(rates.INRXAG) || (rates.XAG ? 1 / Number(rates.XAG) : NaN);
    if (!goldInrOz || !silverInrOz) throw new Error('Malformed metalpriceapi.com response');
    return { spotGold24k: goldInrOz / OZ_TO_G, spotSilver: silverInrOz / OZ_TO_G, sourceName: 'metalpriceapi.com' };
  });

  tiers.push(async () => {
    const data = await fetchJsonResilient(
      `https://api.metals.dev/v1/latest?api_key=${METALS_DEV_API_KEY}&currency=INR&unit=toz`,
      log
    );
    if (data?.status !== 'success') throw new Error(data?.error_message || 'metals.dev request failed');
    const goldInrOz = Number(data?.metals?.gold);
    const silverInrOz = Number(data?.metals?.silver);
    if (!goldInrOz || !silverInrOz) throw new Error('Malformed metals.dev response');
    return { spotGold24k: goldInrOz / OZ_TO_G, spotSilver: silverInrOz / OZ_TO_G, sourceName: 'metals.dev' };
  });

  // gold-api.com supports a currency directly in the path (confirmed via their own
  // llms.txt spec), so INR comes back pre-converted — no separate FX lookup needed.
  tiers.push(async () => {
    const [goldData, silverData] = await Promise.all([
      fetchJsonResilient('https://api.gold-api.com/price/XAU/INR', log),
      fetchJsonResilient('https://api.gold-api.com/price/XAG/INR', log),
    ]);
    const goldInrOz = Number(goldData?.price);
    const silverInrOz = Number(silverData?.price);
    if (!goldInrOz || !silverInrOz) throw new Error('Malformed gold-api.com response');
    return { spotGold24k: goldInrOz / OZ_TO_G, spotSilver: silverInrOz / OZ_TO_G, sourceName: 'gold-api.com' };
  });

  tiers.push(async () => {
    const data = await fetchJsonResilient('https://data-asg.goldprice.org/dbXRates/INR', log);
    const item = data?.items?.[0];
    const xauPrice = Number(item?.xauPrice);
    const xagPrice = Number(item?.xagPrice);
    if (!xauPrice || !xagPrice) throw new Error('Malformed goldprice.org response');
    return { spotGold24k: xauPrice / OZ_TO_G, spotSilver: xagPrice / OZ_TO_G, sourceName: 'goldprice.org' };
  });

  tiers.push(async () => {
    const html = await fetchTextResilient('https://www.goldpriceindia.com/price.php?currency=INR', log);
    const matches = [...html.matchAll(/(\d{2,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g)]
      .map((m) => Number(m[1].replace(/,/g, '')))
      .filter((n) => Number.isFinite(n) && n > 0);
    const amount = matches[0];
    if (!amount) throw new Error('Malformed goldpriceindia.com response');
    return { spotGold24k: amount / OZ_TO_G, spotSilver: amount / OZ_TO_G, sourceName: 'goldpriceindia.com' };
  });

  tiers.push(async () => {
    const text = await fetchTextResilient('https://api.livegoldprice.org/api/price?currency=INR', log);
    const data = JSON.parse(text);
    const gold = parseIndiaSpotPrice(data?.gold ?? data?.goldPrice ?? data?.data?.gold ?? data?.data?.goldPrice);
    const silver = parseIndiaSpotPrice(data?.silver ?? data?.silverPrice ?? data?.data?.silver ?? data?.data?.silverPrice);
    if (!gold || !silver) throw new Error('Malformed livegoldprice.org response');
    return { spotGold24k: gold / OZ_TO_G, spotSilver: silver / OZ_TO_G, sourceName: 'livegoldprice.org' };
  });

  tiers.push(async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const buildHeaders = (dateStr) => ({
      'Content-Type': 'application/json',
      'city': 'Delhi',
      'required-date-yyyy-mm-dd': dateStr,
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': RAPIDAPI_KEY,
    });

    const fetchEndpoint = async (path) => {
      const url = `https://${RAPIDAPI_HOST}/${path}/`;
      try {
        const res = await fetch(url, { headers: buildHeaders(todayStr) });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.Status_code === 200 || data.Delhi_24k || data.Delhi_1g)) return data;
        }
      } catch (e) {
        // Retry with fallback date if today fails
      }
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const resFallback = await fetch(url, { headers: buildHeaders(yesterdayStr) });
      if (!resFallback.ok) throw new Error('RapidAPI HTTP ' + resFallback.status);
      return resFallback.json();
    };

    const [goldData, silverData] = await Promise.all([
      fetchEndpoint('gold_historical_price_india_city_value'),
      fetchEndpoint('silver_historical_price_india_city_value'),
    ]);

    const gold = parseRapidApiRate(goldData, '24k', 'Delhi');
    const silver = parseRapidApiRate(silverData, '1g', 'Delhi');

    if (!gold || !silver) throw new Error('Malformed RapidAPI response');
    log?.push({ url: `https://${RAPIDAPI_HOST}`, mode: 'rapidapi', ok: true });
    return { spotGold24k: gold, spotSilver: silver, sourceName: 'RapidAPI (Gold & Silver India)' };
  });

  for (const tier of tiers) {
    try {
      const result = await tier();
      return { ...result, log };
    } catch (err) {
      // this tier failed — the attempt is already recorded in `log` via
      // fetchJsonResilient; fall through and try the next one
    }
  }

  const err = new Error('All live rate sources failed.');
  err.log = log;
  throw err;
}

/* ------------------------------------------------------------------ */
/* Hallmark badge — signature visual element                          */
/* ------------------------------------------------------------------ */

// Google's standard multi-colour "G" mark — the icon Google's own brand guidelines
// document for third-party "Sign in with Google" buttons.
function GoogleGIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71V4.96H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.04l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function FacebookFIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#1877F2" />
      <path d="M13.5 20v-7h2.35l.35-2.7H13.5V3.8c0-.78.22-1.31 1.34-1.31h1.42V.14A19.2 19.2 0 0 0 14.2 0c-2.05 0-3.45 1.25-3.45 3.55v1.75H8.4V10h2.35v10h2.75Z" fill="#FFFFFF" />
    </svg>
  );
}

function AppleLogoIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.8 12.2c0-2.08 1.7-3.08 1.78-3.12-1-1.47-2.58-1.68-3.14-1.7-1.33-.14-2.6.79-3.28.79-.68 0-1.72-.77-2.83-.75-1.46.02-2.8.85-3.54 2.16-1.52 2.63-.39 6.5 1.08 8.62.72 1.04 1.58 2.2 2.7 2.16 1.08-.04 1.49-.7 2.8-.7 1.32 0 1.7.7 2.86.68 1.18-.02 1.93-1.04 2.65-2.08.83-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.3-3.53Z" fill="#000000" />
      <path d="M14.9 3.2c.57-.68 1.02-1.63.9-2.57-.88.03-1.94.58-2.57 1.3-.56.65-1.05 1.69-.92 2.68.98.08 1.95-.5 2.59-1.41Z" fill="#000000" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Real "Sign in with Google" (Google Identity Services)                */
/* ------------------------------------------------------------------ */

// Set this to your OWN Google OAuth Client ID to enable real Google sign-in:
// Google Cloud Console -> APIs & Services -> Credentials -> Create Credentials ->
// OAuth client ID -> Application type: "Web application".
//
// IMPORTANT — two things a Client ID alone doesn't solve:
// 1. Under that credential, add "Authorized JavaScript origins" for wherever this
//    site is actually deployed (e.g. https://www.nsheera.example) — Google checks
//    the real browser origin against this list.
// 2. Google's Identity Services refuses to authenticate inside sandboxed preview
//    iframes (like this Claude artifact preview) regardless of whether the Client ID
//    is valid — this is a deliberate Google security restriction, not a bug here.
//    So even with a real ID pasted in, the button below will only actually complete
//    a sign-in once this site is deployed to its own real, stable domain.
//
// Left blank (default), the site uses the clearly-labeled demo flow instead, so
// nothing breaks while you're setting this up.
const GOOGLE_CLIENT_ID = '373230949933-q4fm0867q9smutb8jk0b04k7fhof6mdb.apps.googleusercontent.com';

// Decodes (does NOT cryptographically verify) a Google ID token's payload to read
// name/email. Fine for a client-only demo; a real production backend should verify
// the token's signature against Google's public keys before trusting it.
function decodeGoogleIdToken(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(json);
}

let googleScriptLoadPromise = null;
function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptLoadPromise) return googleScriptLoadPromise;
  googleScriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-identity-script');
    if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return; }
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load Google Identity Services script'));
    document.head.appendChild(script);
  });
  return googleScriptLoadPromise;
}

// Renders Google's own real sign-in button once GOOGLE_CLIENT_ID is set. Falls back
// to nothing (parent shows the demo button instead) if the script can't load — e.g.
// blocked by network restrictions, or (as noted above) refused inside this preview's
// sandboxed iframe.
function GoogleSignInButton({ onCredential, onUnavailable }) {
  const buttonRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Some restricted network contexts (a sandboxed preview iframe, an overly strict
    // CSP, etc.) neither fire the script's load nor error event — they just hang.
    // Without a timeout that leaves this button area permanently blank instead of
    // falling back to the demo flow. 4s is generous for a real page load.
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Google sign-in script did not load in time')), 4000);
    });

    Promise.race([loadGoogleIdentityScript(), timeout])
      .then(() => {
        if (cancelled) return;
        // The script tag can fire "load" successfully while window.google.accounts.id
        // still isn't actually usable (blocked/altered script content, race on an
        // unmounted ref, etc.) — every one of those cases must still signal the
        // parent to fall back, or the UI gets stuck showing neither button.
        if (!buttonRef.current || !window.google?.accounts?.id) {
          setFailed(true);
          onUnavailable?.();
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            try {
              const payload = decodeGoogleIdToken(response.credential);
              onCredential({ name: payload.name || payload.email, email: payload.email });
            } catch (e) {
              setFailed(true);
              onUnavailable?.();
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
      })
      .catch(() => {
        if (!cancelled) { setFailed(true); onUnavailable?.(); }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, []);

  if (failed) return null;
  return <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center' }} />;
}

function HallmarkBadge({ code, stamp, size = 64, active = false }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        border: `1.5px solid ${active ? 'var(--gold)' : 'var(--line-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', background: active ? 'var(--white)' : 'var(--cream)',
        boxShadow: active ? '0 0 0 4px rgba(156,122,60,0.12)' : 'none',
        transition: 'all .2s ease', flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.30, color: 'var(--ink)', letterSpacing: '0.02em', lineHeight: 1 }}>
        {code}
      </span>
      {stamp && (
        <span style={{ fontSize: size * 0.13, color: 'var(--gold-deep)', letterSpacing: '0.08em', marginTop: 2 }}>
          {stamp}
        </span>
      )}
    </div>
  );
}

// Category tile for the homepage strip — shows the admin-uploaded homepage image when
// set, with the same active-state gold ring as HallmarkBadge; falls back to the badge
// for categories that don't have a photo yet.
function CategoryTile({ category, code, size = 64, active = false }) {
  if (!category?.imageDataUrl) return <HallmarkBadge code={code} active={active} size={size} />;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        border: `1.5px solid ${active ? 'var(--gold)' : 'var(--line-strong)'}`,
        boxShadow: active ? '0 0 0 4px rgba(156,122,60,0.12)' : 'none',
        transition: 'all .2s ease', flexShrink: 0,
      }}
    >
      <img src={category.imageDataUrl} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                  */
/* ------------------------------------------------------------------ */

export default function App() {
  const [view, setView] = useState('store'); // 'store' | 'admin'
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [clients, setClients] = useState([]);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES);

  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminTab, setAdminTab] = useState('rates');
  const [adminAccount, setAdminAccount] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [rateBusy, setRateBusy] = useState(false);
  const [rateError, setRateError] = useState('');
  const [rateLog, setRateLog] = useState([]);

  const [cart, setCart] = useState([]); // [{ productId, qty }]
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]); // Contact Us + Cash for Gold / Loan Settlement submissions

  // Customer accounts reuse the same `clients` array the admin CRM already uses —
  // registering just adds a `password` (+ dob/anniversary) to a client record, matched
  // by phone the same way checkout already upserts guest orders into client records.
  const [currentClientId, setCurrentClientId] = useState(null);
  const [shortlists, setShortlists] = useState({}); // { [clientId]: productId[] }
  const [recentlyViewed, setRecentlyViewed] = useState({}); // { [clientId]: productId[] }
  const [viewingProductId, setViewingProductId] = useState(null); // product detail modal
  const [activePolicy, setActivePolicy] = useState(null);

  /* ---------------- load persisted data ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const catalog = await window.storage.get('catalog', false);
        if (catalog?.value) {
          const parsed = JSON.parse(catalog.value);
          if (parsed.categories?.length) {
            // Migration: older saved catalogs may not have a category image field yet.
            setCategories(parsed.categories.map((c) => ({ imageDataUrl: '', ...c })));
          }
          if (parsed.products?.length) {
            // Migration: older saved catalogs stored one photo per product as a single
            // `imageDataUrl` string — upgrade those to the new `imageDataUrls` array
            // shape so nobody's already-uploaded photos disappear after this update.
            setProducts(parsed.products.map((p) => ({
              ...p,
              imageDataUrls: p.imageDataUrls || (p.imageDataUrl ? [p.imageDataUrl] : []),
            })));
          }
        }
      } catch (e) { /* no saved catalog yet — keep defaults */ }

      try {
        const savedClients = await window.storage.get('clients', false);
        if (savedClients?.value) setClients(JSON.parse(savedClients.value));
      } catch (e) { /* none yet */ }

      try {
        const savedRates = await window.storage.get('rates', false);
        if (savedRates?.value) setRates((r) => ({ ...r, ...JSON.parse(savedRates.value) }));
      } catch (e) { /* none yet */ }

      try {
        const savedHero = await window.storage.get('heroSlides', false);
        if (savedHero?.value) setHeroSlides(normalizeHeroSlides(JSON.parse(savedHero.value)));
      } catch (e) { /* none yet */ }

      try {
        const savedOrders = await window.storage.get('orders', false);
        if (savedOrders?.value) setOrders(JSON.parse(savedOrders.value));
      } catch (e) { /* none yet */ }

      try {
        const savedInquiries = await window.storage.get('inquiries', false);
        if (savedInquiries?.value) setInquiries(JSON.parse(savedInquiries.value));
      } catch (e) { /* none yet */ }

      try {
        const savedSession = await window.storage.get('session', false);
        if (savedSession?.value) {
          const parsedSession = JSON.parse(savedSession.value);
          if (parsedSession?.clientId) setCurrentClientId(parsedSession.clientId);
        }
      } catch (e) { /* not signed in */ }

      try {
        const savedShortlists = await window.storage.get('shortlists', false);
        if (savedShortlists?.value) setShortlists(JSON.parse(savedShortlists.value));
      } catch (e) { /* none yet */ }

      try {
        const savedViews = await window.storage.get('recentlyViewed', false);
        if (savedViews?.value) setRecentlyViewed(JSON.parse(savedViews.value));
      } catch (e) { /* none yet */ }

      setLoaded(true);
      refreshRates();
    })();
    // eslint-disable-next-line
  }, []);

  const saveCatalog = useCallback(async (cats, prods) => {
    setCategories(cats);
    setProducts(prods);
    try { await window.storage.set('catalog', JSON.stringify({ categories: cats, products: prods }), false); }
    catch (e) { console.error('Save catalog failed', e); }
  }, []);

  const saveClients = useCallback(async (list) => {
    setClients(list);
    try { await window.storage.set('clients', JSON.stringify(list), false); }
    catch (e) { console.error('Save clients failed', e); }
  }, []);

  const saveRates = useCallback(async (r) => {
    setRates(r);
    try { await window.storage.set('rates', JSON.stringify(r), false); }
    catch (e) { console.error('Save rates failed', e); }
  }, []);

  const saveHeroSlides = useCallback(async (slides) => {
    const normalized = normalizeHeroSlides(slides);
    setHeroSlides(normalized);
    try { await window.storage.set('heroSlides', JSON.stringify(normalized), false); }
    catch (e) { console.error('Save homepage hero slides failed', e); }
  }, []);

  const saveOrders = useCallback(async (list) => {
    setOrders(list);
    try { await window.storage.set('orders', JSON.stringify(list), false); }
    catch (e) { console.error('Save orders failed', e); }
  }, []);

  const saveInquiries = useCallback(async (list) => {
    setInquiries(list);
    try { await window.storage.set('inquiries', JSON.stringify(list), false); }
    catch (e) { console.error('Save inquiries failed', e); }
  }, []);

  const addInquiry = useCallback((kind, fields) => {
    const record = { id: uid(), kind, status: 'New', createdAt: new Date().toISOString(), ...fields };
    setInquiries((prev) => {
      const next = [record, ...prev];
      safeStorageSet('inquiries', JSON.stringify(next), false);
      return next;
    });
    return record;
  }, []);

  const refreshRates = useCallback(async () => {
    setRateBusy(true);
    setRateError('');
    try {
      const live = await fetchLiveRates();
      setRateLog(live.log || []);
      setRates((prev) => {
        const next = { ...prev, ...live, source: 'live', lastUpdated: new Date().toISOString() };
        safeStorageSet('rates', JSON.stringify(next), false);
        return next;
      });
    } catch (e) {
      setRateLog(e.log || []);
      setRateError(e.message || 'Live rate feed unavailable — showing last known / manual rate.');
      setRates((prev) => {
        const next = { ...prev, source: prev.source === 'live' ? 'live' : 'fallback', lastUpdated: prev.lastUpdated || new Date().toISOString() };
        return next;
      });
    } finally {
      setRateBusy(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refreshRates, 15 * 60 * 1000); // auto-refresh every 15 min
    return () => clearInterval(id);
  }, [refreshRates]);

  // SEO: update document title + meta description/keywords per page for search ranking.
  useEffect(() => {
    const meta = SEO_BY_VIEW[view] || SEO_BY_VIEW.store;
    document.title = meta.title;
    const upsertMeta = (name, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', name); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    };
    upsertMeta('description', meta.description);
    upsertMeta('keywords', SEO_KEYWORDS);
  }, [view]);

  const selling = useMemo(() => calcSellingRates(rates), [rates]);

  const subCategoryOptions = useMemo(() => {
    if (activeCategory === 'all') return [];
    return CATEGORY_SUBCATEGORY_OPTIONS[activeCategory] || [];
  }, [activeCategory]);

  const filteredProducts = useMemo(
    () => {
      const byCategory = activeCategory === 'all'
        ? products
        : products.filter((p) => p.categoryId === activeCategory);
      if (activeSubCategory === 'all') return byCategory;
      return byCategory.filter((p) => (p.subCategory || '').toLowerCase() === activeSubCategory.toLowerCase());
    },
    [products, activeCategory, activeSubCategory]
  );

  const cartItemsDetailed = useMemo(() => cart.map((ci) => {
    const product = products.find((p) => p.id === ci.productId);
    if (!product) return null;
    const price = calcProductPrice(product, rates);
    return { ...ci, product, unitPrice: price.total };
  }).filter(Boolean), [cart, products, rates]);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cartItemsDetailed.reduce((s, c) => s + c.unitPrice * c.qty, 0);

  const addToCart = useCallback((productId) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) return prev.map((c) => (c.productId === productId ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { productId, qty: 1 }];
    });
    setCartOpen(true);
  }, []);

  const updateQty = useCallback((productId, qty) => {
    setCart((prev) => (qty <= 0
      ? prev.filter((c) => c.productId !== productId)
      : prev.map((c) => (c.productId === productId ? { ...c, qty } : c))));
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  // Prefers updating the CURRENTLY LOGGED IN client's own record (by id) over
  // matching by phone — important now that simplified signup doesn't collect phone,
  // so a logged-in customer entering a phone at checkout for the first time would
  // otherwise never match their existing (phone-less) account and get a duplicate.
  // Guest checkouts (not logged in) still match/create by phone as before.
  const upsertClientFromOrder = useCallback((customer, loggedInClientId) => {
    setClients((prevClients) => {
      const idx = loggedInClientId
        ? prevClients.findIndex((c) => c.id === loggedInClientId)
        : prevClients.findIndex((c) => c.phone === customer.phone);
      const next = idx >= 0
        ? prevClients.map((c, i) => (i === idx ? { ...c, ...customer, id: c.id, createdAt: c.createdAt, password: c.password, authProvider: c.authProvider } : c))
        : [...prevClients, { ...customer, id: uid(), createdAt: new Date().toISOString() }];
      safeStorageSet('clients', JSON.stringify(next), false);
      return next;
    });
  }, []);

  const placeOrder = useCallback((customer, paymentMethod) => {
    const orderId = 'NSH' + Date.now().toString().slice(-8);
    // Persisted order items stay lean (no embedded photos) so the 'orders' storage key
    // doesn't balloon over time as more orders come in — each order is stored forever.
    const order = {
      id: orderId,
      items: cartItemsDetailed.map((c) => ({ productId: c.productId, name: c.product.description, qty: c.qty, unitPrice: c.unitPrice })),
      total: cartTotal,
      customer,
      paymentMethod,
      status: 'Paid (Demo)',
      createdAt: new Date().toISOString(),
    };
    const gstNumber = resolveGstNumber(customer.buyerType, customer.gstNumber);
    setOrders((prev) => {
      const next = [order, ...prev];
      safeStorageSet('orders', JSON.stringify(next), false);
      return next;
    });
    upsertClientFromOrder({
      name: customer.name, phone: customer.phone, email: customer.email, address: customer.address,
      type: customer.buyerType, businessName: customer.businessName || '', gstNumber,
      notes: 'Auto-added from online order ' + orderId,
    }, currentClientId);
    setCart([]);
    // Return a richer, transient (not persisted) version with photos attached, purely
    // for the one-time order-confirmation screen right after checkout.
    return {
      ...order,
      items: cartItemsDetailed.map((c) => ({ productId: c.productId, name: c.product.description, qty: c.qty, unitPrice: c.unitPrice, imageDataUrl: c.product.imageDataUrls?.[0] || '' })),
    };
  }, [cartItemsDetailed, cartTotal, upsertClientFromOrder, currentClientId]);

  /* ---------------- customer accounts (register / login / profile) ---------------- */
  // NOTE ON SECURITY: this is a client-side demo. Passwords are matched in the
  // browser against data held in the artifact's storage — there is no real backend,
  // hashing, or session security here, the same as the admin panel's demo password.
  // A production deployment needs a real backend to handle authentication safely.

  const findClientByIdentifier = useCallback((identifier) => {
    const norm = identifier.trim().toLowerCase();
    return clients.find((c) => c.phone === identifier.trim() || (c.email || '').toLowerCase() === norm);
  }, [clients]);

  // Signup only collects name/email/password now — everything else (phone, address,
  // account type, GST, DOB, anniversary) defaults empty/Retail and is filled in later
  // via Profile. Matches by email rather than phone, since phone is no longer
  // collected at signup; preserves any existing record's data under that email (e.g.
  // one already created via social login, or by staff in the CRM).
  const registerClient = useCallback((fields) => {
    const norm = fields.email.trim().toLowerCase();
    const existing = clients.find((c) => (c.email || '').toLowerCase() === norm);
    if (existing?.password) {
      return { ok: false, error: 'An account with this email already exists. Try signing in instead.' };
    }
    const record = {
      id: existing?.id || uid(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      name: fields.name.trim(),
      phone: existing?.phone || '',
      email: fields.email.trim(),
      address: existing?.address || '',
      type: existing?.type || 'Retail',
      businessName: existing?.businessName || '',
      gstNumber: existing?.gstNumber || '',
      dob: existing?.dob || '',
      anniversary: existing?.anniversary || '',
      password: fields.password,
      notes: existing?.notes || 'Self-registered customer account',
    };
    setClients((prev) => {
      const next = existing ? prev.map((c) => (c.id === existing.id ? record : c)) : [...prev, record];
      safeStorageSet('clients', JSON.stringify(next), false);
      return next;
    });
    setCurrentClientId(record.id);
    safeStorageSet('session', JSON.stringify({ clientId: record.id }), false);
    return { ok: true, client: record };
  }, [clients]);

  const loginClient = useCallback((identifier, password) => {
    const match = findClientByIdentifier(identifier);
    if (!match || !match.password) return { ok: false, error: 'No account found with that phone or email.' };
    if (match.password !== password) return { ok: false, error: 'Incorrect password.' };
    setCurrentClientId(match.id);
    safeStorageSet('session', JSON.stringify({ clientId: match.id }), false);
    return { ok: true, client: match };
  }, [findClientByIdentifier]);

  // Social sign-in matches/creates by email (no password) — the same "frictionless
  // return visit" behaviour a real Google/Facebook/Apple login gives you. See the
  // demo-mode note on SOCIAL_PROVIDERS: this simulates the UX without a real OAuth
  // exchange, since that needs the shop's own registered app + a live domain.
  const socialLogin = useCallback((provider, { name, email }) => {
    const norm = (email || '').trim().toLowerCase();
    const existing = clients.find((c) => (c.email || '').toLowerCase() === norm);
    const record = existing
      ? { ...existing, authProvider: provider }
      : {
          id: uid(), createdAt: new Date().toISOString(), name: (name || 'Social User').trim(), phone: '', email: (email || '').trim(),
          address: '', type: 'Retail', businessName: '', gstNumber: '', dob: '', anniversary: '',
          password: '', authProvider: provider, notes: `Signed up via ${provider} (demo)`,
        };
    setClients((prev) => {
      const next = existing ? prev.map((c) => (c.id === existing.id ? record : c)) : [...prev, record];
      safeStorageSet('clients', JSON.stringify(next), false);
      return next;
    });
    setCurrentClientId(record.id);
    safeStorageSet('session', JSON.stringify({ clientId: record.id }), false);
    return { ok: true, client: record };
  }, [clients]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('provider') || params.get('state')?.split(':')[0] || '';
    const code = params.get('code');
    const error = params.get('error');
    const idToken = params.get('id_token');

    if (!provider || (!code && !idToken && !error)) return;

    if (error) {
      setView('account');
      return;
    }

    const payload = parseSocialAuthResponse(provider, { id_token: idToken, code });
    const result = socialLogin(provider, payload);
    if (result.ok) {
      const nextUrl = new URL(window.location.href);
      nextUrl.search = '';
      window.history.replaceState({}, '', nextUrl);
      setView('account');
    }
  }, [socialLogin]);

  const logoutClient = useCallback(() => {
    setCurrentClientId(null);
    safeStorageSet('session', JSON.stringify({ clientId: null }), false);
  }, []);

  const updateClientProfile = useCallback((clientId, patch) => {
    setClients((prev) => {
      const next = prev.map((c) => (c.id === clientId ? { ...c, ...patch } : c));
      safeStorageSet('clients', JSON.stringify(next), false);
      return next;
    });
  }, []);

  const changeClientPassword = useCallback((clientId, currentPassword, newPassword) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { ok: false, error: 'Account not found.' };
    if (client.password !== currentPassword) return { ok: false, error: 'Current password is incorrect.' };
    updateClientProfile(clientId, { password: newPassword });
    return { ok: true };
  }, [clients, updateClientProfile]);

  // Password reset tokens (stored in memory — survives navigation but not a full page reload;
  // a real backend would persist the token server-side with an expiry)
  const [resetTokens, setResetTokens] = useState({}); // { [email]: { token, expires } }

  const sendPasswordResetToken = useCallback((email) => {
    const norm = email.trim().toLowerCase();
    const client = clients.find((c) => (c.email || '').toLowerCase() === norm);
    if (!client) return { ok: false, error: 'No account found with that email address.' };
    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    const expires = Date.now() + 30 * 60 * 1000; // 30 min expiry
    setResetTokens((prev) => {
      const next = { ...prev, [norm]: { token, expires } };
      safeStorageSet('resetTokens', JSON.stringify(next), false);
      return next;
    });
    return { ok: true, token };
  }, [clients]);

  const resetPasswordWithToken = useCallback((email, token, newPassword) => {
    const norm = email.trim().toLowerCase();
    const stored = resetTokens[norm];
    if (!stored) return { ok: false, error: 'No reset token was requested for this email.' };
    if (Date.now() > stored.expires) return { ok: false, error: 'Reset token has expired. Request a new one.' };
    if (stored.token !== token.trim().toUpperCase()) return { ok: false, error: 'Invalid reset token.' };
    const client = clients.find((c) => (c.email || '').toLowerCase() === norm);
    if (!client) return { ok: false, error: 'Account not found.' };
    updateClientProfile(client.id, { password: newPassword });
    // Clear the used token
    setResetTokens((prev) => {
      const next = { ...prev };
      delete next[norm];
      safeStorageSet('resetTokens', JSON.stringify(next), false);
      return next;
    });
    return { ok: true };
  }, [clients, updateClientProfile, resetTokens]);

  const toggleShortlist = useCallback((clientId, productId) => {
    setShortlists((prev) => {
      const current = prev[clientId] || [];
      const next = {
        ...prev,
        [clientId]: current.includes(productId) ? current.filter((id) => id !== productId) : [productId, ...current],
      };
      safeStorageSet('shortlists', JSON.stringify(next), false);
      return next;
    });
  }, []);

  const recordView = useCallback((clientId, productId) => {
    if (!clientId) return;
    setRecentlyViewed((prev) => {
      const current = prev[clientId] || [];
      const next = { ...prev, [clientId]: [productId, ...current.filter((id) => id !== productId)].slice(0, 8) };
      safeStorageSet('recentlyViewed', JSON.stringify(next), false);
      return next;
    });
  }, []);

  const currentClient = useMemo(() => clients.find((c) => c.id === currentClientId) || null, [clients, currentClientId]);
  const myShortlistIds = shortlists[currentClientId] || [];
  const myRecentlyViewedIds = recentlyViewed[currentClientId] || [];

  const openProductDetail = useCallback((productId) => {
    setViewingProductId(productId);
    if (currentClientId) recordView(currentClientId, productId);
  }, [currentClientId, recordView]);


  return (
    <div style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)', background: 'var(--cream)', minHeight: '100%' }}>
      <GlobalStyle />

      <RateTicker rates={rates} selling={selling} busy={rateBusy} onRefresh={refreshRates} />

      <TopNav
        view={view}
        setView={setView}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        activeCategory={activeCategory}
        setActiveCategory={(value) => {
          setActiveCategory(value);
          setActiveSubCategory('all');
        }}
        activeSubCategory={activeSubCategory}
        setActiveSubCategory={setActiveSubCategory}
        subCategoryOptions={subCategoryOptions}
        categories={categories}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        currentClient={currentClient}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItemsDetailed}
        total={cartTotal}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={() => { setCartOpen(false); setView('checkout'); }}
      />

      <ProductDetailModal
        product={products.find((p) => p.id === viewingProductId) || null}
        categories={categories}
        rates={rates}
        onClose={() => setViewingProductId(null)}
        onAddToCart={addToCart}
        isShortlisted={!!viewingProductId && myShortlistIds.includes(viewingProductId)}
        onToggleShortlist={() => {
          if (!currentClient) { setViewingProductId(null); setView('account'); return; }
          toggleShortlist(currentClientId, viewingProductId);
        }}
        loggedIn={!!currentClient}
      />

      {view === 'store' ? (
        <StoreView
          categories={categories}
          products={filteredProducts}
          allProducts={products}
          heroSlides={heroSlides}
          rates={rates}
          activeCategory={activeCategory}
          setActiveCategory={(value) => {
            setActiveCategory(value);
            setActiveSubCategory('all');
          }}
          activeSubCategory={activeSubCategory}
          setActiveSubCategory={setActiveSubCategory}
          subCategoryOptions={subCategoryOptions}
          onAddToCart={addToCart}
          onOpenProduct={openProductDetail}
          shortlistIds={myShortlistIds}
          onToggleShortlist={(productId) => {
            if (!currentClient) { setView('account'); return; }
            toggleShortlist(currentClientId, productId);
          }}
          onSubmitInquiry={addInquiry}
        />
      ) : view === 'checkout' ? (
        <CheckoutFlow
          items={cartItemsDetailed}
          total={cartTotal}
          onBackToStore={() => setView('store')}
          onPlaceOrder={placeOrder}
        />
      ) : view === 'about' ? (
        <AboutView setView={setView} />
      ) : view === 'contact' ? (
        <ContactView onSubmitInquiry={addInquiry} />
      ) : view === 'cashforgold' ? (
        <CashForGoldView onSubmitInquiry={addInquiry} rates={rates} />
      ) : view === 'account' ? (
        <AccountView
          currentClient={currentClient}
          onRegister={registerClient}
          onLogin={loginClient}
          onSocialLogin={socialLogin}
          onLogout={logoutClient}
          onUpdateProfile={updateClientProfile}
          onChangePassword={changeClientPassword}
          onSendResetToken={sendPasswordResetToken}
          onResetPassword={resetPasswordWithToken}
          products={products}
          categories={categories}
          rates={rates}
          shortlistIds={myShortlistIds}
          recentlyViewedIds={myRecentlyViewedIds}
          onToggleShortlist={(productId) => toggleShortlist(currentClientId, productId)}
          onOpenProduct={openProductDetail}
          onAddToCart={addToCart}
          inquiries={inquiries}
          onSubmitDesignRequest={(fields) => addInquiry('design-request', fields)}
          onSubmitAstroRequest={(fields) => addInquiry('astro-request', fields)}
        />
      ) : (
        <AdminView
          authed={adminAuthed}
          setAuthed={setAdminAuthed}
          account={adminAccount}
          setAccount={setAdminAccount}
          tab={adminTab}
          setTab={setAdminTab}
          categories={categories}
          products={products}
          onSaveCatalog={saveCatalog}
          heroSlides={heroSlides}
          onSaveHeroSlides={saveHeroSlides}
          clients={clients}
          onSaveClients={saveClients}
          rates={rates}
          onSaveRates={saveRates}
          onRefreshRates={refreshRates}
          rateBusy={rateBusy}
          rateError={rateError}
          rateLog={rateLog}
          selling={selling}
          orders={orders}
          onSaveOrders={saveOrders}
          inquiries={inquiries}
          onSaveInquiries={saveInquiries}
          onExitAdmin={() => { setAdminAuthed(false); setAdminAccount(null); setView('store'); }}
        />
      )}

      <PolicyModal policy={activePolicy} onClose={() => setActivePolicy(null)} />
      <Footer setView={setView} onOpenPolicy={setActivePolicy} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Global style block — design tokens                                  */
/* ------------------------------------------------------------------ */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@400;500;600&display=swap');
      :root {
        --cream: #FAF7F1;
        --white: #FFFFFF;
        --beige: #EFE6D3;
        --beige-deep: #D9C6A0;
        --ink: #2A2420;
        --ink-soft: #766B5D;
        --gold: #9C7A3C;
        --gold-deep: #7A5C28;
        --maroon: #7A2E3A;
        --line: rgba(42,36,32,0.10);
        --line-strong: rgba(42,36,32,0.22);
        --font-display: 'Cormorant Garamond', Georgia, serif;
        --font-body: 'Jost', 'Helvetica Neue', Arial, sans-serif;
      }
      * { box-sizing: border-box; }
      h1,h2,h3,h4 { font-family: var(--font-display); font-weight: 600; margin: 0; color: var(--ink); }
      p { margin: 0; }
      button { font-family: var(--font-body); cursor: pointer; }
      input, select, textarea { font-family: var(--font-body); }
      ::selection { background: var(--beige-deep); }
      .container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
      .btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 11px 22px; border-radius: 999px; border: 1px solid var(--ink);
        background: linear-gradient(135deg, var(--ink) 0%, var(--gold-deep) 100%); color: var(--cream); font-size: 13px;
        letter-spacing: 0.08em; text-transform: uppercase; transition: all .2s ease; box-shadow: 0 10px 24px rgba(42,36,32,0.12);
      }
      .btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(42,36,32,0.16); }
      .btn.outline { background: transparent; color: var(--ink); box-shadow: none; }
      .btn.outline:hover { background: var(--ink); color: var(--cream); }
      .btn.sm { padding: 7px 14px; font-size: 11px; }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .field label { display: block; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 6px; }
      .field input, .field select, .field textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--line-strong);
        border-radius: 10px; background: var(--white); font-size: 14px; color: var(--ink);
      }
      .btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(42,36,32,0.16); }
      .btn.outline { background: transparent; color: var(--ink); box-shadow: none; }
      .btn.outline:hover { background: var(--ink); color: var(--cream); }
      .btn.sm { padding: 7px 14px; font-size: 11px; }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .field label { display: block; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 6px; }
      .field input, .field select, .field textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--line-strong);
        border-radius: 10px; background: var(--white); font-size: 14px; color: var(--ink);
      }
      .field input:focus, .field select:focus, .field textarea:focus { outline: 2px solid var(--gold); outline-offset: 1px; }
      table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
      th { text-align: left; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-soft); padding: 10px 12px; border-bottom: 1px solid var(--line-strong); }
      td { padding: 12px; border-bottom: 1px solid var(--line); vertical-align: middle; }
      img { max-width: 100%; }

      /* ---- Responsive layout classes (used instead of raw inline grid-template-columns
         so fixed multi-column layouts can collapse to one column on small screens) ---- */
      .admin-layout { display: grid; grid-template-columns: 200px 1fr; gap: 28px; }
      .admin-sidebar-nav { display: flex; flex-direction: column; gap: 4px; }
      .checkout-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 30px; }
      .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 36px; }
      .card-fields-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }

      html, body { overflow-x: hidden; max-width: 100%; }

      /* 900px covers phones AND tablets in portrait (e.g. a 768px iPad) — at those
         widths a cramped 2-column form/sidebar layout is worse than a clean single
         column, so both get the same stacked treatment. Only tablet-landscape and
         desktop keep the side-by-side layouts. */
      @media (max-width: 900px) {
        .container { padding: 0 16px; }
        .admin-layout { grid-template-columns: 1fr; gap: 18px; }
        .admin-sidebar-nav { flex-direction: row; overflow-x: auto; gap: 6px; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
        .admin-sidebar-nav button { white-space: nowrap; flex-shrink: 0; }
        .checkout-layout { grid-template-columns: 1fr; gap: 20px; }
        .contact-layout { grid-template-columns: 1fr; gap: 24px; }
        .card-fields-grid { grid-template-columns: 1fr 1fr; }
        .card-fields-grid > div:first-child { grid-column: 1 / -1; }
      }

      /* Touch devices (phones AND tablets, including tablet-landscape widths that
         skip the breakpoint above) get slightly larger tap targets on small icon-only
         buttons — scoped to pointer:coarse so mouse/desktop density is unaffected. */
      @media (pointer: coarse) {
        .btn.sm { min-height: 38px; padding: 9px 14px; }
      }

      /* ---- Phone-specific overrides (640px and below — covers most phones) ---- */
      @media (max-width: 640px) {
        .container { padding: 0 12px !important; }
        .rate-ticker { flex-wrap: wrap; gap: 6px 16px !important; padding: 6px 12px !important; font-size: 11.5px !important; }
        .rate-ticker > span:first-child { width: 100%; }
        .hide-mobile { display: none !important; }
        .product-grid-2col { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
        .mobile-full { grid-column: 1 / -1 !important; }
        .modal-content { padding: 18px !important; }
        .checkout-steps { flex-wrap: wrap; gap: 8px; }
        .payment-methods-grid { flex-wrap: wrap; }
        .payment-methods-grid button { min-width: 80px; flex: 1 1 auto; }
        .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .admin-table-wrap table { min-width: 560px; }
        .footer-content { flex-direction: column; gap: 24px !important; }
        .footer-links { flex-wrap: wrap; gap: 8px; }
        .brand-title { font-size: 17px !important; }
        .brand-subtitle { font-size: 9px !important; }
        .subnav-scroll { gap: 12px !important; padding: 6px 12px !important; font-size: 11px !important; }
        .subnav-scroll button { flex-shrink: 0; }
        .hero-rate-card { padding: 16px 14px !important; width: 100% !important; }
        .category-strip { gap: 12px !important; }
        .category-strip button { gap: 6px !important; }
        .category-strip button > div:first-child { width: 50px !important; height: 50px !important; }
        .category-strip button > span { font-size: 11px !important; }
        .store-section { padding: 24px 0 48px !important; }
        .store-hero { padding: 40px 0 32px !important; }
        .store-hero h1 { font-size: clamp(28px, 7vw, 36px) !important; }
        .trust-strip { padding: 32px 0 !important; }
        .trust-strip > div { gap: 16px !important; }
        .product-card-padding { padding: 12px !important; }
        .product-card-padding h3 { font-size: 15px !important; }
        .cart-drawer-item { gap: 8px !important; padding: 10px 0 !important; }
        .cart-drawer-item > div:last-child { font-size: 12px !important; }
        .form-grid-2col { grid-template-columns: 1fr !important; }
        .auth-form-card { padding: 22px !important; }
        .profile-grid { grid-template-columns: 1fr !important; }
        .dashboard-tabs { gap: 6px !important; }
        .dashboard-tabs button { padding: 6px 12px !important; font-size: 12px !important; }
        .about-grid { grid-template-columns: 1fr !important; }
        .cashforgold-steps { grid-template-columns: 1fr !important; }
        .footer-social { gap: 8px !important; }
        .footer-social a { width: 32px !important; height: 32px !important; }
        td, th { padding: 8px 6px !important; font-size: 12px !important; }
        .design-studio-tabs button { flex-direction: column; gap: 4px; padding: 8px; font-size: 12px; }
        .design-variations-grid { grid-template-columns: 1fr !important; }
        .cart-drawer-header h3 { font-size: 16px !important; }
        .cart-drawer-footer { padding: 14px 16px !important; }
        .cart-drawer-footer .btn { font-size: 12px !important; }
      }

      /* ---- Very small phones (480px and below) ---- */
      @media (max-width: 480px) {
        .container { padding: 0 10px !important; }
        .btn { padding: 10px 16px; font-size: 12px; }
        .btn.sm { padding: 6px 12px; font-size: 10px; }
        h1 { font-size: clamp(24px, 8vw, 32px) !important; }
        h2 { font-size: clamp(20px, 6vw, 24px) !important; }
        .product-grid-2col { gap: 8px !important; }
        .product-card-padding { padding: 10px !important; }
        .product-card-padding h3 { font-size: 14px !important; }
        .product-card-padding .btn { font-size: 10px; padding: 6px 10px; }
        .rate-ticker { font-size: 10.5px !important; gap: 4px 12px !important; }
        .rate-ticker b { font-size: 11px !important; }
        .hero-rate-card { padding: 12px 10px !important; }
        .hero-rate-card > div:first-child { font-size: 10px !important; }
        .hero-rate-card > div:nth-child(2) { gap: 14px !important; }
        .hero-rate-card > div:nth-child(2) b { font-size: 18px !important; }
        .category-strip button > div:first-child { width: 42px !important; height: 42px !important; }
        .subnav-scroll { font-size: 10.5px !important; gap: 8px !important; }
        .brand-title { font-size: 15px !important; }
        .checkout-form-card { padding: 16px !important; }
        .payment-methods-grid button { font-size: 11px !important; padding: 8px 6px !important; }
        .cart-drawer-item { gap: 6px !important; }
        .cart-drawer-item > div:first-child { width: 36px !important; height: 36px !important; }
        .profile-form-padding { padding: 16px !important; }
        .auth-form-card { padding: 18px !important; }
        .auth-form-card h2 { font-size: 20px !important; }
        .footer-content > div:first-child { max-width: 100% !important; }
      }

      /* ---- Very small screens (360px and below) ---- */
      @media (max-width: 360px) {
        .container { padding: 0 8px !important; }
        .product-grid-2col { grid-template-columns: 1fr !important; }
        .brand-title { font-size: 14px !important; }
        .brand-subtitle { font-size: 8px !important; }
        .rate-ticker { font-size: 10px !important; }
        .rate-ticker b { font-size: 10px !important; }
        .btn { padding: 8px 14px; font-size: 11px; }
        .category-strip button > div:first-child { width: 36px !important; height: 36px !important; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Rate ticker                                                         */
/* ------------------------------------------------------------------ */

function RateTicker({ rates, selling, busy }) {
  return (
    <div style={{ background: 'var(--maroon)', color: '#F4E9D8' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '8px 24px', fontSize: 12.5, flexWrap: 'wrap', letterSpacing: '0.02em' }}>
        <span style={{ opacity: 0.85 }}>Today's Rate:</span>
        <span>24K Gold <b>{inr(selling.gold24)}</b>/g</span>
        <span>22K Gold <b>{inr(selling.gold24 * 0.916)}</b>/g</span>
        <span>Silver <b>{inr(selling.silver)}</b>/g</span>
        <span style={{ opacity: 0.7 }}>Live rates update automatically every 15 minutes</span>
        {busy && <RefreshCw size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top nav                                                              */
/* ------------------------------------------------------------------ */

function TopNav({ view, setView, menuOpen, setMenuOpen, categories, activeCategory, setActiveCategory, activeSubCategory, setActiveSubCategory, subCategoryOptions, cartCount, onOpenCart, currentClient }) {
  const closeMenu = () => setMenuOpen(false);

  const handleNav = (viewName, categoryId) => {
    setView(viewName);
    if (categoryId) setActiveCategory(categoryId);
    closeMenu();
  };

  return (
    <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 20 }}>
      <div className="container topnav-main-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '12px 24px', gap: 12 }}>
        <div className="hide-mobile" />

        <button onClick={() => { setView('store'); closeMenu(); }} className="header-logo-btn" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <img src={headerLogo} alt="N.S. Heera & Sons Jewellers" className="header-logo-img" style={{ height: 72, width: 'auto', objectFit: 'contain', maxWidth: 'min(76vw, 760px)' }} />
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end' }} className="desktop-nav">
          <button onClick={() => { setView('account'); closeMenu(); }} aria-label="My Account" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: 4, color: view === 'account' ? 'var(--gold-deep)' : 'var(--ink)' }}>
            <UserCircle size={19} />
            <span className="hide-mobile" style={{ fontSize: 13 }}>{currentClient ? currentClient.name.split(' ')[0] : 'Account'}</span>
          </button>
          <button onClick={onOpenCart} style={{ background: 'none', border: 'none', position: 'relative', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ShoppingBag size={19} color="var(--ink)" />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, background: 'var(--maroon)', color: '#fff',
                fontSize: 10, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>)}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="mobile-menu-btn"
            style={{ background: 'none', border: 'none', display: 'none', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            {menuOpen ? <X size={20} color="var(--ink)" /> : <Menu size={20} color="var(--ink)" />}
          </button>
        </nav>
      </div>
      <div style={{ borderTop: '1px solid var(--line)', background: 'var(--cream)' }}>
        <div className="container subnav-combined-row" style={{ display: 'flex', gap: 12, padding: '7px 24px', fontSize: 11.5, overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
          <button
            onClick={() => {
              setView('store');
              setActiveCategory('all');
              setActiveSubCategory('all');
            }}
            style={{ background: 'none', border: 'none', color: activeCategory === 'all' && view === 'store' ? 'var(--gold-deep)' : 'var(--ink)', flexShrink: 0 }}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setView('store');
                setActiveCategory(c.id);
                setActiveSubCategory('all');
              }}
              style={{ background: 'none', border: 'none', color: activeCategory === c.id && view === 'store' ? 'var(--gold-deep)' : 'var(--ink)', flexShrink: 0 }}
            >
              {c.name}
            </button>
          ))}

          <span style={{ width: 1, height: 16, background: 'var(--line-strong)', margin: '0 2px', flexShrink: 0 }} />
          <button onClick={() => handleNav('about')} style={{ background: 'none', border: 'none', color: view === 'about' ? 'var(--gold-deep)' : 'var(--ink-soft)', flexShrink: 0 }}>
            About Us
          </button>
          <button onClick={() => handleNav('contact')} style={{ background: 'none', border: 'none', color: view === 'contact' ? 'var(--gold-deep)' : 'var(--ink-soft)', flexShrink: 0 }}>
            Contact Us
          </button>
        </div>
      </div>

      {/* Mobile slide-down/overlay menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 25,
          pointerEvents: 'auto',
        }}>
          {/* Backdrop */}
          <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.5)', zIndex: 25 }} />
          {/* Menu panel — positioned below the sticky header */}
          <div style={{
            position: 'relative', zIndex: 26, background: 'var(--white)',
            maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
            borderBottom: '1px solid var(--line-strong)',
            boxShadow: '0 12px 36px rgba(42,36,32,0.15)',
          }}>
            <div className="container" style={{ padding: '12px 24px 20px' }}>
              {/* Account summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0', borderBottom: '1px solid var(--line)', marginBottom: 12 }}>
                <UserCircle size={32} color="var(--gold-deep)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{currentClient ? currentClient.name : 'My Account'}</div>
                  <button onClick={() => handleNav('account')} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--gold-deep)', padding: 0 }}>
                    {currentClient ? 'View Profile' : 'Sign In / Register'}
                  </button>
                </div>
              </div>

              {/* Category links */}
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>Shop by Category</div>
              <div style={{ display: 'grid', gap: 4, marginBottom: 14 }}>
                <button onClick={() => handleNav('store', 'all')}
                  style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 8px', fontSize: 14, borderRadius: 3, color: activeCategory === 'all' && view === 'store' ? 'var(--gold-deep)' : 'var(--ink)' }}>
                  All Products
                </button>
                {categories.map((c) => (
                  <button key={c.id} onClick={() => handleNav('store', c.id)}
                    style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 8px', fontSize: 14, borderRadius: 3, color: activeCategory === c.id && view === 'store' ? 'var(--gold-deep)' : 'var(--ink)' }}>
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Quick links */}
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>Quick Links</div>
              <div style={{ display: 'grid', gap: 4, marginBottom: 14 }}>
                <button onClick={() => handleNav('cashforgold')}
                  style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 8px', fontSize: 14, borderRadius: 3, color: view === 'cashforgold' ? 'var(--gold-deep)' : 'var(--ink)' }}>
                  Cash for Gold / Gold Loan Settlement
                </button>
                <button onClick={() => handleNav('about')}
                  style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 8px', fontSize: 14, borderRadius: 3, color: view === 'about' ? 'var(--gold-deep)' : 'var(--ink)' }}>
                  About Us
                </button>
                <button onClick={() => handleNav('contact')}
                  style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 8px', fontSize: 14, borderRadius: 3, color: view === 'contact' ? 'var(--gold-deep)' : 'var(--ink)' }}>
                  Contact Us
                </button>
              </div>

              {/* Contact info */}
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
                <div><Phone size={12} style={{ verticalAlign: -1, marginRight: 6 }} />{SHOP.phone}</div>
                <div><Mail size={12} style={{ verticalAlign: -1, marginRight: 6 }} />{SHOP.email}</div>
                <div><MapPin size={12} style={{ verticalAlign: -1, marginRight: 6 }} />{SHOP.address}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-mobile { display: flex; }
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .topnav-main-row { grid-template-columns: 1fr auto 1fr !important; padding: 8px 10px !important; }
          .header-logo-img { height: 56px !important; max-width: 72vw !important; }
        }
        @media (max-width: 640px) {
          .topnav-main-row { padding: 7px 8px !important; }
          .header-logo-img { height: 46px !important; max-width: 78vw !important; }
        }
      `}</style>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Store (customer-facing) view                                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Homepage hero carousel — 3 auto-rotating slides. Uses real product     */
/* photos (once uploaded in admin) first, filling any remaining slots     */
/* with elegant on-brand graphic panels instead of stock photography —    */
/* so the homepage always looks intentional, with or without real photos. */
/* ------------------------------------------------------------------ */

const CAROUSEL_FALLBACKS = [
  { title: 'Certified Gold & Diamond Jewellery', subtitle: 'BIS Hallmarked · Three Generations of Trust', from: 'var(--ink)', to: 'var(--maroon)' },
  { title: "Today's Live Gold & Silver Rate", subtitle: 'Transparent pricing, updated daily against the market', from: 'var(--gold-deep)', to: 'var(--gold)' },
  { title: 'Cash for Gold & Gold Loan Settlement', subtitle: "Fair valuation at today's live rate — no surprises", from: 'var(--maroon)', to: 'var(--ink)' },
];

function HeroCarousel({ products, heroSlides = [] }) {
  const SLIDE_COUNT = 3;
  const featured = useMemo(() => (products || []).filter((p) => p.imageDataUrls?.length > 0).slice(0, SLIDE_COUNT), [products]);

  const slides = useMemo(() => {
    const arr = [];
    for (let i = 0; i < SLIDE_COUNT; i++) {
      const configured = heroSlides[i];
      if (configured?.imageDataUrl) {
        arr.push({ type: 'custom', slide: configured });
      } else if (featured[i]) {
        arr.push({ type: 'photo', product: featured[i] });
      } else {
        arr.push({ type: 'fallback', ...(heroSlides[i] || CAROUSEL_FALLBACKS[i % CAROUSEL_FALLBACKS.length]) });
      }
    }
    return arr;
  }, [featured, heroSlides]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDE_COUNT), 4500);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: 'relative', width: '100%', height: 'clamp(220px, 38vw, 420px)', overflow: 'hidden', background: 'var(--ink)' }}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          data-active={i === index}
          style={{
            position: 'absolute', inset: 0, opacity: i === index ? 1 : 0,
            transition: 'opacity 0.8s ease', pointerEvents: i === index ? 'auto' : 'none',
          }}
        >
          {slide.type === 'photo' ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img src={slide.product.imageDataUrls[0]} alt={slide.product.description} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 45%, transparent 70%)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 28px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F4E9D8', opacity: 0.85, marginBottom: 4 }}>Featured Piece</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)', color: '#fff', fontWeight: 600 }}>{slide.product.description}</div>
              </div>
            </div>
          ) : slide.type === 'custom' ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img src={slide.slide.imageDataUrl} alt={slide.slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.16) 45%, transparent 70%)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 28px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F4E9D8', opacity: 0.8, marginBottom: 4 }}>Homepage Banner</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)', color: '#fff', fontWeight: 600 }}>{slide.slide.title}</div>
                {slide.slide.subtitle && <div style={{ fontSize: 14, color: '#F4E9D8', marginTop: 6 }}>{slide.slide.subtitle}</div>}
              </div>
            </div>
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '24px', background: `linear-gradient(135deg, ${slide.from} 0%, ${slide.to} 100%)`, position: 'relative',
            }}>
              <div style={{ position: 'absolute', opacity: 0.10 }}>
                <Gem size={220} color="#fff" strokeWidth={0.6} />
              </div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#F4E9D8', opacity: 0.85, marginBottom: 12, position: 'relative' }}>
                N.S. Heera &amp; Sons Jewellers
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 38px)', color: '#fff', fontWeight: 700, marginBottom: 10, position: 'relative', maxWidth: 560 }}>
                {slide.title}
              </div>
              <div style={{ fontSize: 14, color: '#F4E9D8', opacity: 0.9, position: 'relative' }}>{slide.subtitle}</div>
            </div>
          )}
        </div>
      ))}

      <button aria-label="Previous slide" onClick={() => setIndex((i) => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT)}
        style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          background: 'rgba(0,0,0,0.28)', border: 'none', borderRadius: '50%', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
        <ChevronLeft size={16} />
      </button>
      <button aria-label="Next slide" onClick={() => setIndex((i) => (i + 1) % SLIDE_COUNT)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          background: 'rgba(0,0,0,0.28)', border: 'none', borderRadius: '50%', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
        <ChevronRight size={16} />
      </button>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 2 }}>
        {slides.map((_, i) => (
          <button key={i} aria-label={`Go to slide ${i + 1}`} onClick={() => setIndex(i)}
            style={{
              width: i === index ? 20 : 7, height: 7, borderRadius: 4, border: 'none',
              background: i === index ? 'var(--gold)' : 'rgba(255,255,255,0.55)', transition: 'all .25s ease', padding: 0,
            }} />
        ))}
      </div>
    </div>
  );
}

function StoreView({ categories, products, allProducts, heroSlides, activeCategory, setActiveCategory, activeSubCategory, setActiveSubCategory, subCategoryOptions, rates, onAddToCart, onOpenProduct, shortlistIds, onToggleShortlist, onSubmitInquiry }) {
  const selling = calcSellingRates(rates);
  const todayLabel = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main>
      <HeroCarousel products={allProducts} heroSlides={heroSlides} />

      <section style={{ background: 'var(--white)', borderBottom: '1px solid rgba(42,36,32,0.08)' }}>
        <div className="container" style={{ padding: '34px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(239,230,211,0.55), rgba(255,255,255,0.95))', border: '1px solid rgba(42,36,32,0.12)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--gold-deep)' }}>
                <Sparkles size={16} />
                <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>AI Design Your Jewellery</span>
              </div>
              <h3 style={{ fontSize: 24, marginBottom: 8 }}>From your idea to a custom design brief</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.75, marginBottom: 12 }}>
                Share your concept, occasion, budget or a reference photo. Our AI Design Studio builds a detailed jewellery concept including style,
                metal purity, gemstone suggestions, craftsmanship notes, and variation options for different budgets.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 12.5, lineHeight: 1.75 }}>
                <li>Get multiple design variations before finalizing.</li>
                <li>Receive practical specs that our artisans can actually craft.</li>
                <li>Request a quotation directly from your account dashboard.</li>
              </ul>
              <button className="btn sm" onClick={() => setView('account')} style={{ marginTop: 14 }}>
                Open AI Design Studio <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(250,247,241,0.95), rgba(239,230,211,0.45))', border: '1px solid rgba(42,36,32,0.12)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--gold-deep)' }}>
                <Stars size={16} />
                <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Find Your Birth Stone with Astrology</span>
              </div>
              <h3 style={{ fontSize: 24, marginBottom: 8 }}>Gem recommendations aligned to your birth month</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.75, marginBottom: 12 }}>
                Explore gemstones traditionally associated with your birth month and personal energy. We help you choose elegant rings, pendants,
                bracelets or custom pieces that pair astrological significance with wearable design.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                <div><b>Jan–Mar:</b> Garnet, Amethyst, Aquamarine</div>
                <div><b>Apr–Jun:</b> Diamond, Emerald, Pearl</div>
                <div><b>Jul–Sep:</b> Ruby, Peridot, Sapphire</div>
                <div><b>Oct–Dec:</b> Opal, Topaz, Turquoise</div>
              </div>
              <button className="btn sm outline" onClick={() => setView('account')} style={{ marginTop: 14 }}>
                Get Birth Stone Guidance <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, rgba(239,230,211,0.95) 0%, rgba(250,247,241,0.96) 55%, rgba(255,255,255,1) 100%)', padding: '72px 0 56px', borderBottom: '1px solid rgba(42,36,32,0.08)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 760 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 14 }}>
            Since 1968 · BIS Hallmarked
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.08, marginBottom: 18, letterSpacing: '-0.02em' }}>
            Heirloom jewellery,<br />crafted with certainty
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.7, marginBottom: 28, maxWidth: 660, marginLeft: 'auto', marginRight: 'auto' }}>
            Three generations of goldsmiths. Every piece hallmark-stamped, every price transparent —
            calculated live against today's gold and silver rates.
          </p>
          <button className="btn" onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}>
            View Collection <ChevronRight size={14} />
          </button>

          <div style={{
            marginTop: 40, background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,247,241,0.92))', border: '1px solid rgba(42,36,32,0.08)', borderRadius: 16,
            padding: '22px 26px', display: 'inline-block', textAlign: 'left', boxShadow: '0 18px 36px rgba(42,36,32,0.08)',
          }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 12, textAlign: 'center' }}>
              Today's Rate · {todayLabel}
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4 }}>24ct Gold / g</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--maroon)' }}>{inr(selling.gold24)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4 }}>22ct Gold / g</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--maroon)' }}>{inr(selling.gold24 * 0.916)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4 }}>Silver / g</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--maroon)' }}>{inr(selling.silver)}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 12 }}>
              {rates.manual ? 'Manually set rate' : rates.source === 'live' ? `Live via ${rates.sourceName || 'API'}` : 'Rate updating…'}
              {rates.lastUpdated && ` · updated ${new Date(rates.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section id="collection" className="container" style={{ padding: '48px 24px 8px' }}>
        <h2 style={{ fontSize: 26, marginBottom: 22 }}>Our Collection</h2>
        <div style={{ display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 8 }}>
          <button onClick={() => setActiveCategory('all')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <HallmarkBadge code="All" active={activeCategory === 'all'} />
            <span style={{ fontSize: 12.5 }}>All</span>
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CategoryTile category={c} code={c.code} active={activeCategory === c.id} />
              <span style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Product grid */}
      <section className="container" style={{ padding: '20px 24px 16px' }}>
        {activeCategory !== 'all' && (
          <div style={{ maxWidth: 360 }}>
            <div className="field">
              <label>Sub Category</label>
              <select value={activeSubCategory} onChange={(e) => setActiveSubCategory(e.target.value)}>
                <option value="all">All Sub Categories</option>
                {subCategoryOptions.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      <section className="container" style={{ padding: '12px 24px 72px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)' }}>
            No pieces in this category yet — the admin panel is where new arrivals get added.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 22 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} categories={categories} rates={rates} onAddToCart={onAddToCart}
                onOpenProduct={onOpenProduct} isShortlisted={shortlistIds?.includes(p.id)} onToggleShortlist={() => onToggleShortlist(p.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Trust strip */}
      <section style={{ background: 'linear-gradient(135deg, rgba(239,230,211,0.9) 0%, rgba(250,247,241,1) 100%)', padding: '44px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 24, textAlign: 'center' }}>
          {[
            { icon: <ShieldCheck size={20} />, t: 'BIS Hallmarked', d: 'Every piece certified for purity' },
            { icon: <Award size={20} />, t: '3 Generations', d: 'Family-run since 1968' },
            { icon: <Gem size={20} />, t: 'Live Pricing', d: 'Rates updated against the market' },
          ].map((f, i) => (
            <div key={i}>
              <div style={{ color: 'var(--gold-deep)', marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{f.t}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      <HomeCashForGoldSection onSubmitInquiry={onSubmitInquiry} rates={rates} />
    </main>
  );
}

function HomeCashForGoldSection({ onSubmitInquiry, rates }) {
  const selling = calcSellingRates(rates);
  const [form, setForm] = useState({ name: '', phone: '', email: '', purpose: 'Cash for Gold', itemDescription: '', approxWeight: '', preferredDate: '', message: '' });
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.itemDescription.trim()) { setErr('Name, phone and item description are required.'); return; }
    setErr('');
    onSubmitInquiry?.('cash-for-gold', form);
    setSent(true);
    setForm({ name: '', phone: '', email: '', purpose: form.purpose, itemDescription: '', approxWeight: '', preferredDate: '', message: '' });
  };

  return (
    <section style={{ background: 'var(--cream)', padding: '0 0 72px' }}>
      <div className="container" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,247,241,0.95) 100%)', border: '1px solid rgba(42,36,32,0.08)', borderRadius: 18, padding: '28px 24px', boxShadow: '0 18px 40px rgba(42,36,32,0.06)' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 10 }}>Cash for Gold / Gold Loan Settlement</div>
        <h2 style={{ fontSize: 26, marginBottom: 10 }}>Turn old gold into quick cash at today's rate</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.7, marginBottom: 18, maxWidth: 720 }}>
          Tell us what you have, and our team will connect you for a transparent valuation or gold loan settlement.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
          <RateStat label="24ct Gold / g" value={inr(selling.gold24)} highlight />
          <RateStat label="22ct Gold / g" value={inr(selling.gold24 * 0.916)} highlight />
          <RateStat label="Silver / g" value={inr(selling.silver)} highlight />
        </div>
        {sent && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--beige)', padding: '12px 16px', borderRadius: 3, fontSize: 13.5, marginBottom: 16 }}>
            <CheckCircle2 size={16} color="var(--gold-deep)" /> Thanks — our team will contact you shortly to schedule your evaluation.
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field">
              <label>I'm Looking For</label>
              <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                <option>Cash for Gold</option>
                <option>Gold Loan Settlement</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Item Description</label><input value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} placeholder="e.g. 22K gold necklace, approx 25g" /></div>
            <div className="field"><label>Approx. Weight (g)</label><input type="number" step="0.01" value={form.approxWeight} onChange={(e) => setForm({ ...form, approxWeight: e.target.value })} /></div>
            <div className="field"><label>Preferred Visit Date</label><input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Additional Notes</label><textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          </div>
          {err && <div style={{ color: '#B3261E', fontSize: 12.5 }}>{err}</div>}
          <button className="btn" type="submit">Submit Inquiry</button>
        </form>
      </div>
    </section>
  );
}

function ProductCard({ product, categories, rates, onAddToCart, onOpenProduct, isShortlisted, onToggleShortlist }) {
  const purity = purityByKey(product.purity);
  const cat = categories.find((c) => c.id === product.categoryId);
  const price = calcProductPrice(product, rates);
  const photos = product.imageDataUrls || [];
  const [photoIndex, setPhotoIndex] = useState(0);

  return (
    <div
      onClick={() => onOpenProduct?.(product.id)}
      style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', cursor: onOpenProduct ? 'pointer' : 'default' }}
    >
      {photos.length > 0 ? (
        <div style={{ position: 'relative', background: 'var(--beige)', aspectRatio: '1 / 1', overflow: 'hidden' }}>
          <img src={photos[photoIndex] || photos[0]} alt={product.description} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {photos.length > 1 && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Photo ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }}
                  style={{
                    width: i === photoIndex ? 14 : 6, height: 6, borderRadius: 4, border: 'none', padding: 0,
                    background: i === photoIndex ? 'var(--gold)' : 'rgba(255,255,255,0.75)',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.15)', transition: 'all .2s ease',
                  }}
                />
              ))}
            </div>
          )}
          {onToggleShortlist && (
            <button aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
              style={{
                position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Heart size={15} color={isShortlisted ? 'var(--maroon)' : 'var(--ink-soft)'} fill={isShortlisted ? 'var(--maroon)' : 'none'} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', background: 'var(--beige)', padding: '30px 0', display: 'flex', justifyContent: 'center' }}>
          <HallmarkBadge code={cat?.code || '—'} stamp={purity.stamp} size={78} />
          {onToggleShortlist && (
            <button aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
              style={{
                position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Heart size={15} color={isShortlisted ? 'var(--maroon)' : 'var(--ink-soft)'} fill={isShortlisted ? 'var(--maroon)' : 'none'} />
            </button>
          )}
        </div>
      )}
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          {cat?.name || 'Jewellery'}{product.itemType ? ` · ${product.itemType}` : ''}
        </div>
        <h3 style={{ fontSize: 18, marginBottom: 4 }}>{product.description}</h3>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 6 }}>Item Code: {product.itemCode}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
          {purity.label}{purity.metal !== 'none' && <> · Gross {product.grossWeight}g / Net {product.netWeight}g</>}
        </div>
        <div style={{ borderTop: '1px dashed var(--line-strong)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Est. price incl. GST</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--maroon)' }}>{inr(price.total)}</span>
        </div>
        <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); onAddToCart(product.id); }}>
          <ShoppingBag size={13} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cart line-item thumbnail helper                                      */
/* ------------------------------------------------------------------ */

// Small square photo thumbnail for cart/checkout line items — falls back to a
// simple Gem icon on a beige tile when the product has no uploaded photo yet.
function LineItemThumb({ imageDataUrl, alt, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 4, overflow: 'hidden', background: 'var(--beige)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--line)',
    }}>
      {imageDataUrl ? (
        <img src={imageDataUrl} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Gem size={size * 0.4} color="var(--ink-soft)" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product detail modal — opens on card click; bigger gallery, full     */
/* price breakdown, shortlist toggle. Also where a "view" gets recorded */
/* for the logged-in customer's Recently Viewed list.                   */
/* ------------------------------------------------------------------ */

function ProductDetailModal({ product, categories, rates, onClose, onAddToCart, isShortlisted, onToggleShortlist, loggedIn }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => { setPhotoIndex(0); }, [product?.id]);

  if (!product) return null;
  const purity = purityByKey(product.purity);
  const cat = categories.find((c) => c.id === product.categoryId);
  const price = calcProductPrice(product, rates);
  const photos = product.imageDataUrls || [];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.5)', zIndex: 45 }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div style={{
          background: 'var(--white)', borderRadius: 6, maxWidth: 780, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          display: 'grid', gridTemplateColumns: photos.length ? '1fr 1fr' : '1fr', position: 'relative',
        }} className="product-modal-grid">
          <button onClick={onClose} aria-label="Close" style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2, width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>

          {photos.length > 0 ? (
            <div style={{ position: 'relative', background: 'var(--beige)', aspectRatio: '1 / 1' }}>
              <img src={photos[photoIndex]} alt={product.description} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {photos.length > 1 && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {photos.map((_, i) => (
                    <button key={i} aria-label={`Photo ${i + 1}`} onClick={() => setPhotoIndex(i)}
                      style={{
                        width: i === photoIndex ? 18 : 7, height: 7, borderRadius: 4, border: 'none', padding: 0,
                        background: i === photoIndex ? 'var(--gold)' : 'rgba(255,255,255,0.8)', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                      }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--beige)', padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
              <HallmarkBadge code={cat?.code || '—'} stamp={purity.stamp} size={110} />
            </div>
          )}

          <div style={{ padding: 28 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              {cat?.name || 'Jewellery'}{product.itemType ? ` · ${product.itemType}` : ''}
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>{product.description}</h2>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 18 }}>
              Item Code: {product.itemCode} · {purity.label}
              {purity.metal !== 'none' && <> · Gross {product.grossWeight}g / Net {product.netWeight}g</>}
            </div>

            <div style={{ background: 'var(--beige)', borderRadius: 4, padding: 14, marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Metal Value</span><span>{inr(price.metalValue)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Making Charges{product.makingType === 'fixed' ? ' (flat)' : ` (${product.making}%)`}</span><span>{inr(price.making)}</span>
              </div>
              {price.addOns > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Diamonds / Stones / Others</span><span>{inr(price.addOns)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>GST (3%)</span><span>{inr(price.gst)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTop: '1px dashed var(--line-strong)', fontWeight: 700, fontSize: 15 }}>
                <span>Total</span><span style={{ color: 'var(--maroon)' }}>{inr(price.total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onAddToCart(product.id)}>
                <ShoppingBag size={14} /> Add to Cart
              </button>
              <button aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'} onClick={onToggleShortlist}
                className="btn outline" style={{ width: 46, justifyContent: 'center', padding: 0 }}>
                <Heart size={16} color={isShortlisted ? 'var(--maroon)' : 'var(--ink)'} fill={isShortlisted ? 'var(--maroon)' : 'none'} />
              </button>
            </div>
            {!loggedIn && <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 10 }}>Sign in to save this to your shortlist and see it in Recently Viewed.</p>}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 720px) { .product-modal-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cart drawer                                                          */
/* ------------------------------------------------------------------ */

function CartDrawer({ open, onClose, items, total, onUpdateQty, onRemove, onCheckout }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.35)', zIndex: 40,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .2s ease',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 360, maxWidth: '90vw',
        background: 'var(--cream)', zIndex: 41, boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .25s ease',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 18 }}>Your Cart</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          {items.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 30, textAlign: 'center' }}>Your cart is empty.</p>
          ) : items.map((it) => (
            <div key={it.productId} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
              <LineItemThumb imageDataUrl={it.product.imageDataUrls?.[0]} alt={it.product.description} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{it.product.description}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>{inr(it.unitPrice)} each</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn sm outline" onClick={() => onUpdateQty(it.productId, it.qty - 1)}><Minus size={11} /></button>
                  <span style={{ fontSize: 13, width: 18, textAlign: 'center' }}>{it.qty}</span>
                  <button className="btn sm outline" onClick={() => onUpdateQty(it.productId, it.qty + 1)}><Plus size={11} /></button>
                  <button onClick={() => onRemove(it.productId)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink-soft)' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{inr(it.unitPrice * it.qty)}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '18px 20px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 15 }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 700 }}>{inr(total)}</span>
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={items.length === 0} onClick={onCheckout}>
            Proceed to Checkout <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Checkout flow — details -> payment -> confirmation                  */
/* ------------------------------------------------------------------ */

function CheckoutFlow({ items, total, onBackToStore, onPlaceOrder }) {
  const [step, setStep] = useState(items.length ? 'details' : 'empty');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', buyerType: 'Retail', businessName: '', gstNumber: '' });
  const [err, setErr] = useState('');
  const [method, setMethod] = useState('upi');
  const [payFields, setPayFields] = useState({ upiId: '', cardNumber: '', cardExpiry: '', cardCvv: '', bank: 'HDFC Bank' });
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState(null);

  if (step === 'empty') {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <ShoppingBag size={34} color="var(--ink-soft)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>Your cart is empty</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>Add a few pieces from the collection before checking out.</p>
        <button className="btn" onClick={onBackToStore}>Browse Collection</button>
      </div>
    );
  }

  const submitDetails = (e) => {
    e.preventDefault();
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) { setErr('Name, phone and address are required.'); return; }
    const gstNumber = resolveGstNumber(customer.buyerType, customer.gstNumber);
    if (customer.buyerType === 'Shopkeeper' && !gstNumber) { setErr('GST number is required for business / shopkeeper purchases.'); return; }
    setCustomer((prev) => ({ ...prev, gstNumber }));
    setErr('');
    setStep('payment');
  };

  const pay = async (e) => {
    e.preventDefault();
    if (method === 'upi' && !payFields.upiId.trim()) { setErr('Enter a UPI ID.'); return; }
    if (method === 'card' && (!payFields.cardNumber.trim() || !payFields.cardExpiry.trim() || !payFields.cardCvv.trim())) { setErr('Fill in all card details.'); return; }
    setErr('');
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1300));
    const placed = onPlaceOrder(customer, method);
    setOrder(placed);
    setProcessing(false);
    setStep('success');
  };

  if (step === 'success' && order) {
    return (
      <div className="container" style={{ padding: '72px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 40, maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <PackageCheck size={38} color="var(--gold-deep)" style={{ marginBottom: 14 }} />
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Order Confirmed</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>
            Thank you, {order.customer.name.split(' ')[0]}. Your order <b>{order.id}</b> has been placed.
          </p>
          <div style={{ background: 'var(--beige)', borderRadius: 4, padding: 16, textAlign: 'left', marginBottom: 20 }}>
            {order.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '6px 0' }}>
                <LineItemThumb imageDataUrl={it.imageDataUrl} alt={it.name} size={36} />
                <span style={{ flex: 1 }}>{it.qty} × {it.name}</span><span>{inr(it.unitPrice * it.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px dashed var(--line-strong)', marginTop: 8, paddingTop: 8 }}>
              <span>Total Paid</span><span>{inr(order.total)}</span>
            </div>
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onBackToStore}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-layout" style={{ padding: '32px 24px 72px' }}>
      <div>
        <button onClick={onBackToStore} style={{ background: 'none', border: 'none', fontSize: 12.5, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          <ChevronLeft size={13} /> Back to store
        </button>

        <div style={{ display: 'flex', gap: 18, marginBottom: 26, fontSize: 12.5 }}>
          <span style={{ color: step === 'details' ? 'var(--maroon)' : 'var(--ink-soft)', fontWeight: step === 'details' ? 600 : 400 }}>1. Details</span>
          <span style={{ color: step === 'payment' ? 'var(--maroon)' : 'var(--ink-soft)', fontWeight: step === 'payment' ? 600 : 400 }}>2. Payment</span>
          <span style={{ color: 'var(--ink-soft)' }}>3. Confirmation</span>
        </div>

        {step === 'details' && (
          <form onSubmit={submitDetails} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Delivery &amp; Billing Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 14 }}>
              <div className="field"><label>Full Name</label><input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></div>
              <div className="field"><label>Email</label><input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></div>
              <div className="field">
                <label>Purchasing As</label>
                <select value={customer.buyerType} onChange={(e) => setCustomer({ ...customer, buyerType: e.target.value })}>
                  <option value="Retail">Retail Customer</option>
                  <option value="Shopkeeper">Shopkeeper / Business (GST)</option>
                </select>
              </div>
              {customer.buyerType === 'Shopkeeper' && (
                <div className="field"><label>Business Name</label><input value={customer.businessName} onChange={(e) => setCustomer({ ...customer, businessName: e.target.value })} /></div>
              )}
              <div className="field">
                <label>GST Number {customer.buyerType === 'Shopkeeper' ? '(required)' : '(optional)'}</label>
                <input value={customer.gstNumber} onChange={(e) => setCustomer({ ...customer, gstNumber: e.target.value.toUpperCase() })} placeholder={DEFAULT_GST_NUMBER} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Delivery Address</label><input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></div>
            </div>
            {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
            <button className="btn" type="submit">Continue to Payment <ChevronRight size={13} /></button>
          </form>
        )}

        {step === 'payment' && (
          <form onSubmit={pay} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22 }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Payment</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16 }}>Demo payment gateway — no real transaction is processed.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[
                { id: 'upi', label: 'UPI', icon: <Smartphone size={14} /> },
                { id: 'card', label: 'Card', icon: <CreditCard size={14} /> },
                { id: 'netbanking', label: 'Net Banking', icon: <Landmark size={14} /> },
              ].map((m) => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 8px', borderRadius: 3, fontSize: 12.5,
                    border: `1px solid ${method === m.id ? 'var(--gold)' : 'var(--line-strong)'}`,
                    background: method === m.id ? 'var(--beige)' : 'transparent',
                  }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {method === 'upi' && (
              <div className="field" style={{ marginBottom: 16 }}><label>UPI ID</label><input placeholder="yourname@upi" value={payFields.upiId} onChange={(e) => setPayFields({ ...payFields, upiId: e.target.value })} /></div>
            )}
            {method === 'card' && (
              <div className="card-fields-grid" style={{ marginBottom: 16 }}>
                <div className="field"><label>Card Number</label><input placeholder="4111 1111 1111 1111" value={payFields.cardNumber} onChange={(e) => setPayFields({ ...payFields, cardNumber: e.target.value })} /></div>
                <div className="field"><label>Expiry</label><input placeholder="MM/YY" value={payFields.cardExpiry} onChange={(e) => setPayFields({ ...payFields, cardExpiry: e.target.value })} /></div>
                <div className="field"><label>CVV</label><input placeholder="123" value={payFields.cardCvv} onChange={(e) => setPayFields({ ...payFields, cardCvv: e.target.value })} /></div>
              </div>
            )}
            {method === 'netbanking' && (
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Select Bank</label>
                <select value={payFields.bank} onChange={(e) => setPayFields({ ...payFields, bank: e.target.value })}>
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'].map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            )}

            {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn outline" onClick={() => setStep('details')} disabled={processing}>Back</button>
              <button className="btn" type="submit" disabled={processing} style={{ flex: 1, justifyContent: 'center' }}>
                {processing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <>Pay {inr(total)}</>}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.6 }}>
              To accept real payments, connect a certified gateway (e.g. Razorpay or Stripe) through a secure backend that creates
              the order and verifies the signature — payment keys should never live in front-end code.
            </p>
          </form>
        )}
      </div>

      <div>
        <div style={{ background: 'var(--beige)', borderRadius: 4, padding: 20, position: 'sticky', top: 90 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Order Summary</h3>
          {items.map((it) => (
            <div key={it.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '6px 0' }}>
              <LineItemThumb imageDataUrl={it.product.imageDataUrls?.[0]} alt={it.product.description} size={36} />
              <span style={{ flex: 1 }}>{it.qty} × {it.product.description}</span><span>{inr(it.unitPrice * it.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, borderTop: '1px dashed var(--line-strong)', marginTop: 10, paddingTop: 10 }}>
            <span>Total</span><span>{inr(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* About Us                                                             */
/* ------------------------------------------------------------------ */

function AboutView({ setView }) {
  return (
    <main className="container" style={{ padding: '56px 24px 72px', maxWidth: 860 }}>
      <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 10 }}>About Us</div>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Three generations, one promise</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15.5, lineHeight: 1.8, marginBottom: 18 }}>
        {SHOP.name} has been a trusted name in fine jewellery since 1968. What began as a small
        family goldsmith's counter has grown into a full-service jeweller — without ever losing the values
        it started with: honest weighing, certified purity, and fair, transparent pricing.
      </p>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15.5, lineHeight: 1.8, marginBottom: 34 }}>
        Every piece that leaves our counter is BIS hallmark certified. Every price we quote is calculated
        live against the day's gold and silver rates, so what you see is exactly what you pay — no guesswork,
        no hidden margins.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 20, marginBottom: 40 }}>
        {[
          { t: 'Trust', d: 'Three generations of the same family, serving the same community.' },
          { t: 'Certainty', d: 'BIS hallmarked purity on every single piece we sell.' },
          { t: 'Transparency', d: 'Live gold & silver rates, so pricing is never a mystery.' },
        ].map((v, i) => (
          <div key={i} style={{ background: 'var(--beige)', borderRadius: 4, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, marginBottom: 6 }}>{v.t}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{v.d}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 24, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4 }}>Visit our showroom</div>
          <div style={{ fontSize: 15 }}>{SHOP.address}</div>
        </div>
        <button className="btn" onClick={() => setView('contact')}>Get Directions &amp; Contact <ChevronRight size={14} /></button>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Contact Us                                                           */
/* ------------------------------------------------------------------ */

function ContactView({ onSubmitInquiry }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) { setErr('Name, phone and message are required.'); return; }
    setErr('');
    onSubmitInquiry('contact', form);
    setSent(true);
    setForm({ name: '', phone: '', email: '', subject: '', message: '' });
  };

  return (
    <main className="container contact-layout" style={{ padding: '56px 24px 72px' }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 10 }}>Contact Us</div>
        <h1 style={{ fontSize: 30, marginBottom: 18 }}>We'd love to hear from you</h1>
        <div style={{ fontSize: 14, lineHeight: 2.1, color: 'var(--ink-soft)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><MapPin size={15} style={{ marginTop: 3, flexShrink: 0 }} /> {SHOP.address}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Phone size={15} /> {SHOP.phone}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Mail size={15} /> {SHOP.email}</div>
          <div style={{ marginTop: 10, fontSize: 13 }}>{SHOP.hours}</div>
        </div>
      </div>

      <div>
        {sent && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--beige)', padding: '12px 16px', borderRadius: 3, fontSize: 13.5, marginBottom: 16 }}>
            <CheckCircle2 size={16} color="var(--gold-deep)" /> Thanks — we've received your message and will get back to you shortly.
          </div>
        )}
        <form onSubmit={submit} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
            <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Subject</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Message</label><textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          </div>
          {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
          <button className="btn" type="submit">Send Message</button>
        </form>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Cash for Gold / Gold Loan Settlement                                 */
/* ------------------------------------------------------------------ */

function CashForGoldView({ onSubmitInquiry, rates }) {
  const selling = calcSellingRates(rates);
  const [form, setForm] = useState({ name: '', phone: '', email: '', purpose: 'Cash for Gold', itemDescription: '', approxWeight: '', preferredDate: '', message: '' });
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.itemDescription.trim()) { setErr('Name, phone and item description are required.'); return; }
    setErr('');
    onSubmitInquiry('cash-for-gold', form);
    setSent(true);
    setForm({ name: '', phone: '', email: '', purpose: form.purpose, itemDescription: '', approxWeight: '', preferredDate: '', message: '' });
  };

  return (
    <main className="container" style={{ padding: '56px 24px 72px' }}>
      <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 10, textAlign: 'center' }}>Cash for Gold / Gold Loan Settlement</div>
      <h1 style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>Turn your old gold into cash — today's rate, no surprises</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.8, maxWidth: 640, margin: '0 auto 36px', textAlign: 'center' }}>
        Bring in your old or unused gold jewellery for an on-the-spot valuation at the live gold rate, or settle
        an existing gold loan with us. Submit your details below and our team will get back to you.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, maxWidth: 640, margin: '0 auto 40px' }}>
        <RateStat label="Today's 24ct Gold / g" value={inr(selling.gold24)} highlight />
        <RateStat label="Today's 22ct Gold / g" value={inr(selling.gold24 * 0.916)} highlight />
        <RateStat label="Today's Silver / g" value={inr(selling.silver)} highlight />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 18, maxWidth: 760, margin: '0 auto 44px', textAlign: 'center' }}>
        {[
          { t: '1. Submit Details', d: 'Tell us what you have and how we can reach you.' },
          { t: '2. Free Evaluation', d: 'Visit our showroom for a transparent, on-the-spot valuation.' },
          { t: '3. Get Paid / Settle Loan', d: 'Receive cash at today\'s rate, or close out your existing gold loan.' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 6 }}>{s.t}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{s.d}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {sent && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--beige)', padding: '12px 16px', borderRadius: 3, fontSize: 13.5, marginBottom: 16 }}>
            <CheckCircle2 size={16} color="var(--gold-deep)" /> Thanks — our team will contact you shortly to schedule your evaluation.
          </div>
        )}
        <form onSubmit={submit} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
            <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field">
              <label>I'm Looking For</label>
              <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                <option>Cash for Gold</option>
                <option>Gold Loan Settlement</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Item Description</label>
              <input value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} placeholder="e.g. 22K gold necklace, approx 25g" />
            </div>
            <div className="field"><label>Approx. Weight (g)</label><input type="number" step="0.01" value={form.approxWeight} onChange={(e) => setForm({ ...form, approxWeight: e.target.value })} /></div>
            <div className="field"><label>Preferred Visit Date</label><input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Additional Notes</label><textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          </div>
          {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
          <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Submit Inquiry</button>
        </form>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Account — sign in / register gate, then Profile / Shortlist /        */
/* Recently Viewed dashboard. Reuses the same client record shape the   */
/* admin CRM uses — registering just adds a password to a client row.   */
/* ------------------------------------------------------------------ */

function AccountView(props) {
  const { currentClient } = props;
  if (!currentClient) return <AccountAuth {...props} />;
  return <AccountDashboard {...props} />;
}

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google', buttonLabel: 'Sign in with Google', icon: (size) => <GoogleGIcon size={size} /> },
  { id: 'facebook', label: 'Facebook', buttonLabel: 'Continue with Facebook', icon: (size) => <FacebookFIcon size={size} /> },
  { id: 'apple', label: 'Apple', buttonLabel: 'Continue with Apple', icon: (size) => <AppleLogoIcon size={size} /> },
];

function AccountAuth({ onRegister, onLogin, onSocialLogin, onSendResetToken, onResetPassword, clients }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [err, setErr] = useState('');
  const [socialProvider, setSocialProvider] = useState(null); // opens the modal
  const [realGoogleFailed, setRealGoogleFailed] = useState(false);
  const [providerHint, setProviderHint] = useState('');
  const useRealGoogle = Boolean(GOOGLE_CLIENT_ID) && !realGoogleFailed;
  const demoProviders = SOCIAL_PROVIDERS.filter((p) => p.id !== 'google' || !useRealGoogle);

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [reg, setReg] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'token' | 'done'
  const [resetSentMsg, setResetSentMsg] = useState('');

  const submitLogin = (e) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPw) { setErr('Enter your email and password.'); return; }
    const res = onLogin(loginId, loginPw);
    if (!res.ok) setErr(res.error); else setErr('');
  };

  const submitRegister = (e) => {
    e.preventDefault();
    if (!reg.name.trim() || !reg.email.trim() || !reg.password) { setErr('Name, email and password are required.'); return; }
    if (reg.password.length < 4) { setErr('Password should be at least 4 characters.'); return; }
    if (reg.password !== reg.confirmPassword) { setErr('Passwords do not match.'); return; }
    const res = onRegister(reg);
    if (!res.ok) setErr(res.error); else setErr('');
  };

  const beginSocialLogin = (providerId) => {
    const provider = SOCIAL_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    if (providerId === 'google' && useRealGoogle) {
      setProviderHint('');
      setSocialProvider(null);
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}auth/callback`;
    const authUrl = buildProviderAuthUrl(providerId, {
      clientId: providerId === 'google' ? GOOGLE_CLIENT_ID : 'demo-client-id',
      redirectUri,
      state: `${providerId}:${Date.now()}`,
    });
    setProviderHint(`Use your ${provider.label} app credentials in production to complete this redirect. The current build uses the provider URL flow and callback handling for a real OAuth-style login experience.`);
    window.location.assign(authUrl);
  };

  const submitResetRequest = (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) { setErr('Enter your email address.'); return; }
    setErr('');
    const res = onSendResetToken(resetEmail);
    if (!res.ok) { setErr(res.error); return; }
    setResetSentMsg(`A reset token has been sent to ${resetEmail}. In this demo, your token is: ${res.token}`);
    setResetStep('token');
  };

  const submitResetPassword = (e) => {
    e.preventDefault();
    if (!resetToken.trim()) { setErr('Enter the reset token.'); return; }
    if (!newPassword || newPassword.length < 4) { setErr('New password should be at least 4 characters.'); return; }
    if (newPassword !== confirmNewPassword) { setErr('Passwords do not match.'); return; }
    setErr('');
    const res = onResetPassword(resetEmail, resetToken, newPassword);
    if (!res.ok) { setErr(res.error); return; }
    setResetStep('done');
  };

  return (
    <div className="container" style={{ padding: '56px 24px 80px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', padding: 32, maxWidth: 420, width: '100%', borderRadius: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCircle size={20} color="var(--gold-deep)" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {useRealGoogle && (
            <GoogleSignInButton
              onCredential={(fields) => onSocialLogin('google', fields)}
              onUnavailable={() => setRealGoogleFailed(true)}
            />
          )}
          {demoProviders.map((p) => {
            const isFacebook = p.id === 'facebook';
            const isApple = p.id === 'apple';
            return (
              <button key={p.id} type="button" onClick={() => beginSocialLogin(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 14px',
                  borderRadius: 999, border: isFacebook || isApple ? 'none' : '1px solid var(--line-strong)',
                  background: isFacebook ? '#1877F2' : isApple ? '#000000' : 'var(--white)',
                  color: isFacebook || isApple ? '#ffffff' : 'var(--ink)', fontSize: 13.5, fontWeight: 600,
                  boxShadow: isFacebook || isApple ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                }}>
                {p.icon(16)} {p.buttonLabel}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 18px', fontSize: 11, color: 'var(--ink-soft)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line-strong)' }} />
          OR
          <div style={{ flex: 1, height: 1, background: 'var(--line-strong)' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          <button onClick={() => { setMode('login'); setErr(''); }}
            style={{ flex: 1, padding: '9px 10px', borderRadius: 3, fontSize: 13, border: `1px solid ${mode === 'login' ? 'var(--gold)' : 'var(--line-strong)'}`, background: mode === 'login' ? 'var(--beige)' : 'transparent' }}>
            Sign In
          </button>
          <button onClick={() => { setMode('register'); setErr(''); }}
            style={{ flex: 1, padding: '9px 10px', borderRadius: 3, fontSize: 13, border: `1px solid ${mode === 'register' ? 'var(--gold)' : 'var(--line-strong)'}`, background: mode === 'register' ? 'var(--beige)' : 'transparent' }}>
            Create Account
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={submitLogin}>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Email</label>
              <input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoFocus />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Password</label>
              <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitLogin(e); } }} />
            </div>
            <button type="button" onClick={() => { setMode('forgot'); setErr(''); }}
              style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--gold-deep)', textDecoration: 'underline', padding: 0, marginBottom: 12, display: 'block', marginLeft: 'auto' }}>
              Forgot Password?
            </button>
            {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
            <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Sign In</button>
          </form>
        ) : mode === 'register' ? (
          <form onSubmit={submitRegister}>
            <div className="field" style={{ marginBottom: 12 }}><label>Full Name</label><input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} autoFocus /></div>
            <div className="field" style={{ marginBottom: 12 }}><label>Email</label><input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} /></div>
            <div className="field" style={{ marginBottom: 12 }}><label>Password</label><input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} /></div>
            <div className="field" style={{ marginBottom: 14 }}><label>Confirm Password</label><input type="password" value={reg.confirmPassword} onChange={(e) => setReg({ ...reg, confirmPassword: e.target.value })} /></div>
            {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
            <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Create Account</button>
          </form>
        ) : (
          /* Forgot Password flow */
          <div>
            {resetStep === 'request' ? (
              <form onSubmit={submitResetRequest}>
                <div className="field" style={{ marginBottom: 14 }}>
                  <label>Email Address</label>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email" autoFocus />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 14, lineHeight: 1.6 }}>
                  Enter the email address linked to your account. We'll send a password reset token to that email (in this demo, the token is shown on screen instead).
                </div>
                {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
                {resetSentMsg && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--beige)', padding: '10px 14px', borderRadius: 3, fontSize: 12.5, marginBottom: 14, lineHeight: 1.5 }}>
                    <CheckCircle2 size={14} color="var(--gold-deep)" style={{ flexShrink: 0 }} />
                    <span>{resetSentMsg}</span>
                  </div>
                )}
                <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Send Reset Token</button>
                <button type="button" onClick={() => { setMode('login'); setErr(''); setResetStep('request'); setResetSentMsg(''); }}
                  style={{ background: 'none', border: 'none', fontSize: 12.5, color: 'var(--gold-deep)', textDecoration: 'underline', display: 'block', margin: '14px auto 0', padding: 0 }}>
                  Back to Sign In
                </button>
              </form>
            ) : resetStep === 'token' ? (
              <form onSubmit={submitResetPassword}>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 14, lineHeight: 1.5 }}>
                  A reset token has been generated. For this demo, enter the token shown in the message above to proceed.
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Reset Token</label>
                  <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Enter the token from the message" autoFocus />
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 4 characters" />
                </div>
                <div className="field" style={{ marginBottom: 14 }}>
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                </div>
                {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
                <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Reset Password</button>
                <button type="button" onClick={() => { setMode('forgot'); setErr(''); setResetStep('request'); setResetSentMsg(''); }}
                  style={{ background: 'none', border: 'none', fontSize: 12.5, color: 'var(--gold-deep)', textDecoration: 'underline', display: 'block', margin: '14px auto 0', padding: 0 }}>
                  Back
                </button>
              </form>
            ) : (
              /* Done — password was reset successfully */
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={36} color="var(--gold-deep)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>Password Reset Successfully</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18, lineHeight: 1.6 }}>
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <button className="btn" onClick={() => { setMode('login'); setResetStep('request'); setResetSentMsg(''); }}
                  style={{ width: '100%', justifyContent: 'center' }}>
                  Sign In with New Password
                </button>
              </div>
            )}
          </div>
        )}
        {providerHint && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 3, background: 'var(--beige)', fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            {providerHint}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          Save your details for faster checkout, build a shortlist, and see items you've recently viewed.
        </p>
      </div>

      {socialProvider && (
        <SocialLoginDemoModal
          provider={SOCIAL_PROVIDERS.find((p) => p.id === socialProvider)}
          onClose={() => setSocialProvider(null)}
          onContinue={(fields) => {
            const res = onSocialLogin(socialProvider, fields);
            if (res.ok) setSocialProvider(null);
          }}
        />
      )}
    </div>
  );
}

// Clearly-labeled DEMO of the social sign-in consent step. Real "Sign in with
// Google/Facebook/Apple" requires the shop to register its own app with each
// provider (tied to their live domain) plus, ideally, server-side token
// verification — none of which can be faked from inside this artifact. This
// simulates the UX (and creates a working demo account) without pretending a
// real identity exchange happened.
function SocialLoginDemoModal({ provider, onClose, onContinue }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setErr('Enter a name and email to continue.'); return; }
    onContinue({ name, email });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.5)', zIndex: 50 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'var(--white)', borderRadius: 6, maxWidth: 380, width: '100%', padding: 26, position: 'relative' }}>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none' }}>
            <X size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {provider.icon(22)}
            <h3 style={{ fontSize: 17 }}>Continue with {provider.label}</h3>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', background: 'var(--beige)', borderRadius: 3, padding: '10px 12px', marginBottom: 18, fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
            <span><b>Demo mode.</b> A real {provider.label} sign-in needs the shop's own registered app with {provider.label} and a live domain — not possible from inside this preview. Enter what {provider.label} would normally share, to try the flow.</span>
          </div>
          <form onSubmit={submit}>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
            <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Continue</button>
          </form>
        </div>
      </div>
    </>
  );
}

function AccountDashboard({
  currentClient, onLogout, onUpdateProfile, onChangePassword,
  products, categories, rates, shortlistIds, recentlyViewedIds, onToggleShortlist, onOpenProduct, onAddToCart,
  inquiries, onSubmitDesignRequest, onSubmitAstroRequest,
}) {
  const [tab, setTab] = useState('design');

  const shortlistProducts = useMemo(() => shortlistIds.map((id) => products.find((p) => p.id === id)).filter(Boolean), [shortlistIds, products]);
  const recentProducts = useMemo(() => recentlyViewedIds.map((id) => products.find((p) => p.id === id)).filter(Boolean), [recentlyViewedIds, products]);
  const myDesignRequests = useMemo(
    () => inquiries.filter((i) => i.kind === 'design-request' && (i.email === currentClient.email || i.phone === currentClient.phone)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [inquiries, currentClient.email, currentClient.phone]
  );
  const myAstroRequests = useMemo(
    () => inquiries.filter((i) => i.kind === 'astro-request' && (i.email === currentClient.email || i.phone === currentClient.phone)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [inquiries, currentClient.email, currentClient.phone]
  );

  const tabs = [
    { id: 'design', label: 'AI Design Studio' },
    { id: 'astro', label: 'Astro Stone Advisor' },
    { id: 'shortlist', label: `Shortlist${shortlistProducts.length ? ` (${shortlistProducts.length})` : ''}` },
    { id: 'recent', label: 'Recently Viewed' },
  ];

  return (
    <div className="container" style={{ padding: '32px 24px 72px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Welcome back,</div>
          <h1 style={{ fontSize: 24 }}>{currentClient.name.split(' ')[0]}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={tab === 'profile' ? 'btn sm' : 'btn outline sm'}
            onClick={() => setTab('profile')}
          >
            <User size={13} /> Profile
          </button>
          <button className="btn outline sm" onClick={onLogout}><LogOut size={13} /> Log Out</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: 20, fontSize: 13, whiteSpace: 'nowrap',
            border: `1px solid ${tab === t.id ? 'var(--gold)' : 'var(--line-strong)'}`,
            background: tab === t.id ? 'var(--beige)' : 'transparent',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab client={currentClient} onUpdateProfile={onUpdateProfile} onChangePassword={onChangePassword} />}

      {tab === 'design' && (
        <DesignStudioTab client={currentClient} myRequests={myDesignRequests} onSubmitDesignRequest={onSubmitDesignRequest} />
      )}

      {tab === 'astro' && (
        <AstroStoneTab client={currentClient} myRequests={myAstroRequests} onSubmitAstroRequest={onSubmitAstroRequest} />
      )}

      {tab === 'shortlist' && (
        shortlistProducts.length === 0 ? (
          <EmptyAccountState icon={<Heart size={28} />} text="No shortlisted items yet — tap the heart on any product to save it here." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {shortlistProducts.map((p) => (
              <ProductCard key={p.id} product={p} categories={categories} rates={rates} onAddToCart={onAddToCart}
                onOpenProduct={onOpenProduct} isShortlisted onToggleShortlist={() => onToggleShortlist(p.id)} />
            ))}
          </div>
        )
      )}

      {tab === 'recent' && (
        recentProducts.length === 0 ? (
          <EmptyAccountState icon={<Eye size={28} />} text="Products you view will show up here." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} categories={categories} rates={rates} onAddToCart={onAddToCart}
                onOpenProduct={onOpenProduct} isShortlisted={shortlistIds.includes(p.id)} onToggleShortlist={() => onToggleShortlist(p.id)} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyAccountState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-soft)' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', opacity: 0.5 }}>{icon}</div>
      <p style={{ fontSize: 13.5, maxWidth: 320, margin: '0 auto' }}>{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI Design Studio tab — prompt-based concept generation, or upload a  */
/* reference photo/document for a redesign concept. Generates a written */
/* design brief (Claude doesn't generate images), then lets the client  */
/* request a human-reviewed quotation based on it.                      */
/* ------------------------------------------------------------------ */

function DesignStudioTab({ client, myRequests, onSubmitDesignRequest }) {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'redesign'
  const [promptText, setPromptText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(''); // image preview only; blank for PDFs
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [concept, setConcept] = useState(null);

  const [quoteForm, setQuoteForm] = useState({ budget: '', preferredMetal: '', occasion: '', notes: '' });
  const [quoteSent, setQuoteSent] = useState(false);

  const resetGeneration = () => { setConcept(null); setError(''); setQuoteSent(false); };

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    resetGeneration();
    setFile(f);
    setFilePreview('');
    if (f.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(f);
        setFilePreview(compressed);
      } catch (err) {
        setFilePreview('');
      }
    }
  };

  const generate = async () => {
    setError('');
    setConcept(null);
    setQuoteSent(false);

    if (mode === 'prompt' && !promptText.trim()) { setError('Describe the design you have in mind first.'); return; }
    if (mode === 'redesign' && !file) { setError('Upload a photo or document of the piece first.'); return; }

    setBusy(true);
    try {
      let fileBlock = null;
      if (mode === 'redesign' && file) {
        if (file.type === 'application/pdf') {
          const dataUrl = await readFileAsDataURL(file);
          fileBlock = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: dataUrl.split(',')[1] } };
        } else {
          const dataUrl = filePreview || await compressImageFile(file);
          fileBlock = { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: dataUrl.split(',')[1] } };
        }
      }
      const instruction = mode === 'prompt'
        ? `The customer describes the design they want: "${promptText.trim()}"`
        : `The customer has attached a photo/document of an existing piece and wants redesign ideas.${notes.trim() ? ' Their notes: "' + notes.trim() + '"' : ''}`;

      const result = await callDesignAI({ promptText: instruction, fileBlock });
      const normalized = normalizeDesignConcept(result);
      setConcept(normalized);
      setQuoteForm((q) => ({ ...q, preferredMetal: normalized.suggestedMetal || '' }));
    } catch (err) {
      setError(err.message || 'Something went wrong generating a concept — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitQuoteRequest = (e) => {
    e.preventDefault();
    onSubmitDesignRequest({
      name: client.name, phone: client.phone, email: client.email,
      mode, promptText: mode === 'prompt' ? promptText.trim() : notes.trim(),
      referenceImagePreview: mode === 'redesign' ? filePreview : '',
      concept,
      budget: quoteForm.budget, preferredMetal: quoteForm.preferredMetal, occasion: quoteForm.occasion, notes: quoteForm.notes,
    });
    setQuoteSent(true);
  };

  return (
    <div>
      <div style={{ background: 'var(--beige)', borderRadius: 4, padding: 16, marginBottom: 22, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        <Sparkles size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--gold-deep)' }} />
        Our AI design consultant writes up a design concept and specs based on your idea or reference photo — it's a written brief to guide our goldsmiths,
        not a rendered picture. Once you have a concept you like, request a quotation and our team will follow up with real pricing.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button onClick={() => { setMode('prompt'); resetGeneration(); }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 3, fontSize: 13, border: `1px solid ${mode === 'prompt' ? 'var(--gold)' : 'var(--line-strong)'}`, background: mode === 'prompt' ? 'var(--white)' : 'transparent' }}>
          <PencilRuler size={14} /> Describe a New Design
        </button>
        <button onClick={() => { setMode('redesign'); resetGeneration(); }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 3, fontSize: 13, border: `1px solid ${mode === 'redesign' ? 'var(--gold)' : 'var(--line-strong)'}`, background: mode === 'redesign' ? 'var(--white)' : 'transparent' }}>
          <Paperclip size={14} /> Redesign an Existing Piece
        </button>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 20, marginBottom: 22 }}>
        {mode === 'prompt' ? (
          <div className="field">
            <label>Describe the jewellery you'd like</label>
            <textarea rows={4} value={promptText} onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. A delicate rose gold necklace with a small lotus pendant and tiny diamonds, suitable for everyday wear" />
          </div>
        ) : (
          <>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Upload a Photo or Document of the Piece</label>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 64, height: 64, borderRadius: 4, overflow: 'hidden', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--line)' }}>
                  {filePreview ? <img src={filePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : file ? <FileText size={22} color="var(--ink-soft)" /> : <Paperclip size={20} color="var(--ink-soft)" />}
                </div>
                <label className="btn sm outline" style={{ cursor: 'pointer' }}>
                  <Upload size={12} /> {file ? 'Replace File' : 'Choose File'}
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
                {file && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{file.name}</span>}
              </div>
            </div>
            <div className="field">
              <label>Anything specific you'd like changed? (optional)</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Convert to rose gold, add a diamond halo, more modern band" />
            </div>
          </>
        )}

        {error && <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#B3261E', fontSize: 12.5, marginTop: 12 }}><AlertCircle size={14} /> {error}</div>}

        <button className="btn" style={{ marginTop: 14 }} onClick={generate} disabled={busy}>
          {busy ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Wand2 size={14} /> Generate Design Concept</>}
        </button>
      </div>

      {concept && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gold)', borderRadius: 4, padding: 22, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles size={15} color="var(--gold-deep)" />
            <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold-deep)' }}>AI Design Concept</span>
          </div>

          {concept.imageBase64 && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`data:${concept.imageMediaType};base64,${concept.imageBase64}`}
                alt={concept.title || 'AI-generated design concept'}
                style={{ width: '100%', maxWidth: 420, display: 'block', borderRadius: 4, border: '1px solid var(--line)' }}
              />
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>
                AI-generated illustration of the concept — an artistic reference, not an exact manufacturing preview.
              </div>
            </div>
          )}

          <h3 style={{ fontSize: 19, marginBottom: 10 }}>{concept.title}</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.7, marginBottom: 14 }}>{concept.description}</p>

          {/* Main specs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, fontSize: 12.5, background: 'var(--beige)', borderRadius: 4, padding: 14, marginBottom: 18 }}>
            {concept.suggestedMetal && <div><b>Suggested Metal:</b> {concept.suggestedMetal}</div>}
            {concept.suggestedPurity && <div><b>Purity:</b> {concept.suggestedPurity}</div>}
            {concept.estimatedWeightRange && <div><b>Est. Weight:</b> {concept.estimatedWeightRange}</div>}
            {concept.approximatePrice && <div><b>Approx. Price:</b> {concept.approximatePrice}</div>}
            {concept.detailing && <div style={{ gridColumn: '1 / -1' }}><b>Detailing:</b> {concept.detailing}</div>}
            {concept.stoneDetails && <div style={{ gridColumn: '1 / -1' }}><b>Stone Details:</b> {concept.stoneDetails}</div>}
            {!concept.stoneDetails && concept.gemstoneSuggestions && <div style={{ gridColumn: '1 / -1' }}><b>Gemstones:</b> {concept.gemstoneSuggestions}</div>}
            {concept.techniqueNotes && <div style={{ gridColumn: '1 / -1' }}><b>Craftsmanship:</b> {concept.techniqueNotes}</div>}
            {concept.craftsmanshipTime && <div><b>Est. Making Time:</b> {concept.craftsmanshipTime}</div>}
            {concept.suitableFor && <div><b>Suitable For:</b> {concept.suitableFor}</div>}
            {concept.styleNotes && <div style={{ gridColumn: '1 / -1' }}><b>Style Notes:</b> {concept.styleNotes}</div>}
          </div>

          {/* Design Variations — only rendered when the AI provides alternative options */}
          {concept.designVariations && concept.designVariations.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={14} color="var(--gold-deep)" /> Design Variations
              </h4>
              <div style={{ display: 'grid', gap: 12 }}>
                {concept.designVariations.map((v, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 14, background: 'var(--cream)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{v.name}</div>
                    {v.description && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>{v.description}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 6, fontSize: 12 }}>
                      {v.metal && <div><b>Metal:</b> {v.metal}</div>}
                      {v.purity && <div><b>Purity:</b> {v.purity}</div>}
                      {v.weight && <div><b>Weight:</b> {v.weight}</div>}
                      {v.price && <div><b>Price:</b> {v.price}</div>}
                      {v.gemstones && <div><b>Gemstones:</b> {v.gemstones}</div>}
                      {v.makingTime && <div><b>Making Time:</b> {v.makingTime}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quoteSent ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--beige)', padding: '12px 16px', borderRadius: 3, fontSize: 13.5 }}>
              <CheckCircle2 size={16} color="var(--gold-deep)" /> Quotation request sent — our team will get back to you with pricing.
            </div>
          ) : (
            <form onSubmit={submitQuoteRequest}>
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>Request a Quotation for This Design</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 14 }}>
                <div className="field"><label>Budget Range (₹, optional)</label><input value={quoteForm.budget} onChange={(e) => setQuoteForm({ ...quoteForm, budget: e.target.value })} placeholder="e.g. 40,000 - 60,000" /></div>
                <div className="field"><label>Preferred Metal</label><input value={quoteForm.preferredMetal} onChange={(e) => setQuoteForm({ ...quoteForm, preferredMetal: e.target.value })} /></div>
                <div className="field"><label>Occasion (optional)</label><input value={quoteForm.occasion} onChange={(e) => setQuoteForm({ ...quoteForm, occasion: e.target.value })} placeholder="e.g. Wedding, Anniversary gift" /></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Additional Notes</label><input value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })} /></div>
              </div>
              <button className="btn sm" type="submit"><FileText size={12} /> Request Quotation</button>
            </form>
          )}
        </div>
      )}

      {myRequests.length > 0 && (
        <div>
          <h4 style={{ fontSize: 15, marginBottom: 12 }}>Your Design Requests</h4>
          {myRequests.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, marginBottom: 8, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.concept?.title || (r.mode === 'redesign' ? 'Redesign Request' : 'Custom Design Request')}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--beige)', whiteSpace: 'nowrap' }}>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Direct Quotation Request — skip AI generation, go straight to requesting a quote */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <FileText size={15} color="var(--gold-deep)" />
          <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold-deep)' }}>Quick Quotation Request</span>
        </div>
        <h4 style={{ fontSize: 16, marginBottom: 6 }}>Request a custom jewellery quote directly</h4>
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 14 }}>
          Describe the jewellery piece you need — our team will review and get back to you with a quotation.
        </p>
        <QuickQuoteForm client={client} onSubmitDesignRequest={onSubmitDesignRequest} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Astro Stone Advisor tab — birth-details form that returns a          */
/* traditional Vedic-astrology-inspired gemstone suggestion. Always     */
/* shown with a visible disclaimer; never claims medical/financial      */
/* outcomes.                                                             */
/* ------------------------------------------------------------------ */

function AstroStoneTab({ client, myRequests, onSubmitAstroRequest }) {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [concern, setConcern] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState(null);

  const [quoteForm, setQuoteForm] = useState({ budget: '', occasion: '', notes: '' });
  const [quoteSent, setQuoteSent] = useState(false);

  const generate = async () => {
    setError('');
    setSuggestion(null);
    setQuoteSent(false);
    if (!dateOfBirth) { setError('Enter your date of birth to get a suggestion.'); return; }

    setBusy(true);
    try {
      const result = await callAstroAI({ dateOfBirth, timeOfBirth, placeOfBirth, concern: concern.trim() });
      setSuggestion(result);
    } catch (err) {
      setError(err.message || 'Something went wrong getting a suggestion — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitQuoteRequest = (e) => {
    e.preventDefault();
    onSubmitAstroRequest({
      name: client.name, phone: client.phone, email: client.email,
      dateOfBirth, timeOfBirth, placeOfBirth, concern,
      suggestion,
      budget: quoteForm.budget, occasion: quoteForm.occasion, notes: quoteForm.notes,
    });
    setQuoteSent(true);
  };

  return (
    <div>
      <div style={{ background: 'var(--beige)', borderRadius: 4, padding: 16, marginBottom: 22, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        <Stars size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--gold-deep)' }} />
        A traditional, Vedic-astrology-inspired gemstone suggestion based on your birth details — for informational and
        cultural interest, not medical, legal, or financial advice. Sharing your time and place of birth (optional) gives
        a more accurate starting point; an exact reading needs a full birth chart from a qualified astrologer. Once you have
        a suggestion, request a quotation and our team will follow up with real pricing and stone options.
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 14 }}>
          <div className="field">
            <label>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={(e) => { setDateOfBirth(e.target.value); setQuoteSent(false); }} />
          </div>
          <div className="field">
            <label>Time of Birth (optional)</label>
            <input type="time" value={timeOfBirth} onChange={(e) => setTimeOfBirth(e.target.value)} />
          </div>
          <div className="field">
            <label>Place of Birth (optional)</label>
            <input value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} placeholder="e.g. Delhi, India" />
          </div>
        </div>
        <div className="field">
          <label>Anything specific on your mind? (optional)</label>
          <textarea rows={3} value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="e.g. Career growth, general wellbeing" />
        </div>

        {error && <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#B3261E', fontSize: 12.5, marginTop: 12 }}><AlertCircle size={14} /> {error}</div>}

        <button className="btn" style={{ marginTop: 14 }} onClick={generate} disabled={busy}>
          {busy ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Consulting…</> : <><Stars size={14} /> Get Stone Suggestion</>}
        </button>
      </div>

      {suggestion && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gold)', borderRadius: 4, padding: 22, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Gem size={15} color="var(--gold-deep)" />
            <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold-deep)' }}>Astro Stone Suggestion</span>
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 12, fontStyle: 'italic' }}>{suggestion.moonSignEstimate}</div>

          <h3 style={{ fontSize: 19, marginBottom: 10 }}>{suggestion.primaryStone}</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.7, marginBottom: 14 }}>{suggestion.rationale}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, fontSize: 12.5, background: 'var(--beige)', borderRadius: 4, padding: 14, marginBottom: 18 }}>
            <div><b>Associated Planet:</b> {suggestion.associatedPlanet}</div>
            <div><b>Recommended Metal:</b> {suggestion.recommendedMetal}</div>
            <div><b>Finger:</b> {suggestion.wearingGuidance.finger}</div>
            <div><b>Day to Wear:</b> {suggestion.wearingGuidance.day}</div>
            <div style={{ gridColumn: '1 / -1' }}><b>Weight:</b> {suggestion.wearingGuidance.weightNote}</div>
            {suggestion.stonesToAvoidNote && <div style={{ gridColumn: '1 / -1' }}><b>Traditionally Avoided With:</b> {suggestion.stonesToAvoidNote}</div>}
          </div>

          {suggestion.alternativeStones.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={14} color="var(--gold-deep)" /> Alternative Stones
              </h4>
              <div style={{ display: 'grid', gap: 12 }}>
                {suggestion.alternativeStones.map((a, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 14, background: 'var(--cream)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{a.name}</div>
                    {a.reason && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{a.reason}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: 14, marginBottom: 18 }}>
            {suggestion.disclaimer}
          </div>

          {quoteSent ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--beige)', padding: '12px 16px', borderRadius: 3, fontSize: 13.5 }}>
              <CheckCircle2 size={16} color="var(--gold-deep)" /> Quotation request sent — our team will get back to you with pricing and stone options.
            </div>
          ) : (
            <form onSubmit={submitQuoteRequest}>
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>Request a Quotation for This Stone</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 14 }}>
                <div className="field"><label>Budget Range (₹, optional)</label><input value={quoteForm.budget} onChange={(e) => setQuoteForm({ ...quoteForm, budget: e.target.value })} placeholder="e.g. 15,000 - 25,000" /></div>
                <div className="field"><label>Occasion (optional)</label><input value={quoteForm.occasion} onChange={(e) => setQuoteForm({ ...quoteForm, occasion: e.target.value })} placeholder="e.g. Wearing ceremony" /></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Additional Notes</label><input value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })} placeholder="e.g. Prefer a ring, size 7" /></div>
              </div>
              <button className="btn sm" type="submit"><FileText size={12} /> Request Quotation</button>
            </form>
          )}
        </div>
      )}

      {myRequests.length > 0 && (
        <div>
          <h4 style={{ fontSize: 15, marginBottom: 12 }}>Your Astro Stone Requests</h4>
          {myRequests.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, marginBottom: 8, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.suggestion?.primaryStone || 'Astro stone request'}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--beige)', whiteSpace: 'nowrap' }}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ client, onUpdateProfile, onChangePassword }) {
  const [form, setForm] = useState({
    name: client.name || '', phone: client.phone || '', email: client.email || '', address: client.address || '',
    type: client.type || 'Retail', businessName: client.businessName || '', gstNumber: client.gstNumber || '',
    dob: client.dob || '', anniversary: client.anniversary || '',
  });
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setErr('Name and phone are required.'); return; }
    if (form.type === 'Shopkeeper' && !form.gstNumber.trim()) { setErr('GST number is required for Shopkeeper / business accounts.'); return; }
    setErr('');
    onUpdateProfile(client.id, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (!pwForm.next || pwForm.next.length < 4) { setPwMsg({ text: 'New password should be at least 4 characters.', ok: false }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ text: 'New passwords do not match.', ok: false }); return; }
    const res = onChangePassword(client.id, pwForm.current, pwForm.next);
    if (!res.ok) { setPwMsg({ text: res.error, ok: false }); return; }
    setPwMsg({ text: 'Password updated.', ok: true });
    setPwForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
      <form onSubmit={save} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22 }}>
        <h3 style={{ fontSize: 17, marginBottom: 16 }}>Profile &amp; Address</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 14 }}>
          <div className="field"><label><User size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Full Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label><Phone size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label><Mail size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field">
            <label>Account Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="Retail">Retail Customer</option>
              <option value="Shopkeeper">Shopkeeper / Business (GST)</option>
            </select>
          </div>
          {form.type === 'Shopkeeper' && (
            <div className="field"><label><Building2 size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Business Name</label><input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
          )}
          <div className="field">
            <label>GST Number {form.type === 'Shopkeeper' ? '(required)' : '(optional)'}</label>
            <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} />
          </div>
          <div className="field"><label><Cake size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Date of Birth</label><input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></div>
          <div className="field"><label><Calendar size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Anniversary</label><input type="date" value={form.anniversary} onChange={(e) => setForm({ ...form, anniversary: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label><MapPin size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn sm" type="submit"><Save size={12} /> Save Changes</button>
          {saved && <span style={{ fontSize: 12.5, color: 'var(--gold-deep)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={13} /> Saved</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 12, lineHeight: 1.6 }}>
          We'll remember your birthday and anniversary — handy if the shop ever wants to send a special offer your way around those dates.
        </p>
      </form>

      <form onSubmit={savePassword} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22, alignSelf: 'flex-start' }}>
        <h3 style={{ fontSize: 17, marginBottom: 16 }}><Key size={15} style={{ marginRight: 6, verticalAlign: -2 }} />Change Password</h3>
        <div className="field" style={{ marginBottom: 12 }}><label>Current Password</label><input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} /></div>
        <div className="field" style={{ marginBottom: 12 }}><label>New Password</label><input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} /></div>
        <div className="field" style={{ marginBottom: 14 }}><label>Confirm New Password</label><input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
        {pwMsg.text && <div style={{ color: pwMsg.ok ? 'var(--gold-deep)' : '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{pwMsg.text}</div>}
        <button className="btn sm outline" type="submit">Update Password</button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick Quote Form — direct quotation request without AI generation    */
/* ------------------------------------------------------------------ */

function QuickQuoteForm({ client, onSubmitDesignRequest }) {
  const [form, setForm] = useState({ itemType: '', metal: '', purity: '', weight: '', occasion: '', notes: '' });
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.itemType.trim()) { setErr('Please describe the type of jewellery you need.'); return; }
    setErr('');
    onSubmitDesignRequest({
      name: client.name,
      phone: client.phone,
      email: client.email,
      mode: 'quick-quote',
      concept: null,
      budget: '',
      preferredMetal: form.metal,
      occasion: form.occasion,
      notes: `Item Type: ${form.itemType} | Metal: ${form.metal} | Purity: ${form.purity} | Weight: ${form.weight} | Occasion: ${form.occasion} | Additional: ${form.notes}`,
    });
    setSent(true);
    setForm({ itemType: '', metal: '', purity: '', weight: '', occasion: '', notes: '' });
  };

  return (
    <div>
      {sent ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--beige)', padding: '12px 16px', borderRadius: 3, fontSize: 13.5 }}>
          <CheckCircle2 size={16} color="var(--gold-deep)" /> Quotation request submitted — our team will get back to you with pricing.
        </div>
      ) : (
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
            <div className="field">
              <label>Jewellery Type *</label>
              <input value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })} placeholder="e.g. Ring, Necklace, Bracelet" />
            </div>
            <div className="field">
              <label>Metal Preference</label>
              <select value={form.metal} onChange={(e) => setForm({ ...form, metal: e.target.value })}>
                <option value="">Select...</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Diamond">Diamond</option>
                <option value="Platinum">Platinum</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="field">
              <label>Purity</label>
              <select value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })}>
                <option value="">Select...</option>
                {PURITY_OPTIONS.filter((p) => p.key !== 'na').map((p) => (
                  <option key={p.key} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Approx. Weight (g)</label>
              <input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 10" />
            </div>
            <div className="field">
              <label>Occasion (optional)</label>
              <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })}>
                <option value="">Select...</option>
                <option value="Wedding">Wedding</option>
                <option value="Engagement">Engagement</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Birthday">Birthday</option>
                <option value="Festival">Festival</option>
                <option value="Everyday">Everyday Wear</option>
                <option value="Gift">Gift</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Additional Details (optional)</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any specific design preferences, stone requirements, budget range..." />
            </div>
          </div>
          {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
          <button className="btn sm" type="submit"><FileText size={12} /> Submit Quotation Request</button>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Policy modal                                                        */
/* ------------------------------------------------------------------ */

function PolicyModal({ policy, onClose }) {
  if (!policy) return null;
  const content = POLICY_CONTENT[policy];
  if (!content) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.68)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--white)', borderRadius: 8, maxWidth: 680, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <h3 style={{ fontSize: 20 }}>{content.title}</h3>
          <button className="btn sm outline" onClick={onClose}>Close</button>
        </div>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, fontSize: 14, marginBottom: 12 }}>{content.intro}</p>
        <ul style={{ paddingLeft: 18, color: 'var(--ink-soft)', lineHeight: 1.8, fontSize: 14, display: 'grid', gap: 8 }}>
          {content.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                               */
/* ------------------------------------------------------------------ */

function Footer({ setView, onOpenPolicy }) {
  return (
    <footer style={{ background: 'var(--ink)', color: 'var(--cream)', padding: '40px 0 24px' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between' }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8, color: 'var(--cream)' }}>{SHOP.name}</div>
          <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>Fine gold &amp; silver jewellery, hallmark certified. Prices shown are indicative and update with live market rates.</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12.5, flexWrap: 'wrap' }}>
            <button onClick={() => setView('about')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75 }}>About Us</button>
            <button onClick={() => setView('contact')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75 }}>Contact Us</button>
            <button onClick={() => setView('cashforgold')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75 }}>Cash for Gold</button>
            <button onClick={() => setView('account')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75 }}>My Account</button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button onClick={() => onOpenPolicy?.('terms')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75, padding: 0 }}>Terms & Conditions</button>
            <button onClick={() => onOpenPolicy?.('refund')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75, padding: 0 }}>Refund Policy</button>
            <button onClick={() => onOpenPolicy?.('privacy')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75, padding: 0 }}>Privacy Policy</button>
            <button onClick={() => onOpenPolicy?.('shipping')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.75, padding: 0 }}>Shipping Policy</button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            {SOCIAL_LINKS.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(250,247,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)',
                  background: 'rgba(250,247,241,0.08)', opacity: 0.9, transition: 'opacity .15s ease, border-color .15s ease, transform .15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.borderColor = 'rgba(250,247,241,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <s.icon size={16} />
              </a>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><MapPin size={13} style={{ marginTop: 3 }} /> {SHOP.address}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={13} /> {SHOP.phone}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={13} /> {SHOP.email}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start' }}>
          <button onClick={() => setView('admin')} style={{ background: 'none', border: '1px solid rgba(250,247,241,0.25)', color: 'var(--cream)', padding: '9px 16px', fontSize: 12, borderRadius: 2, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={12} /> Admin
          </button>
        </div>
      </div>
      <div className="container" style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(250,247,241,0.12)', fontSize: 11.5, opacity: 0.55 }}>
        © {new Date().getFullYear()} {SHOP.name}. All prices indicative, subject to final billing.
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — login gate                                                   */
/* ------------------------------------------------------------------ */

const DEFAULT_STAFF_ACCOUNTS = [
  { id: 'owner', name: 'Owner', email: 'owner@nsheera.com', password: 'owner2026', role: 'Owner', authorizedFor: ['rates', 'catalog', 'orders', 'inquiries', 'clients'] },
  { id: 'manager', name: 'Store Manager', email: 'manager@nsheera.com', password: 'manager2026', role: 'Manager', authorizedFor: ['rates', 'orders', 'inquiries'] },
  { id: 'catalog', name: 'Catalog Team', email: 'catalog@nsheera.com', password: 'catalog2026', role: 'Staff', authorizedFor: ['catalog'] },
];

function AdminView(props) {
  const { authed, setAuthed, account, setAccount } = props;
  if (!authed) return <AdminLogin onSuccess={(staffAccount) => { setAccount(staffAccount); setAuthed(true); }} />;
  return <AdminPanel {...props} />;
}

function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [staffAccounts] = useState(DEFAULT_STAFF_ACCOUNTS);

  const attemptLogin = () => {
    const account = authorizeStaffLogin(staffAccounts, { email, password: pw });
    if (account) {
      setErr('');
      onSuccess(account);
    } else {
      setErr('Incorrect email or password.');
    }
  };

  return (
    <div className="container" style={{ padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', padding: 36, maxWidth: 380, width: '100%', borderRadius: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="var(--gold-deep)" />
          </div>
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 22, marginBottom: 6 }}>Admin Access</h2>
        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 22 }}>Staff members sign in with their registered email and password to access authorised sections.</p>
        <form onSubmit={(e) => { e.preventDefault(); attemptLogin(); }}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Staff Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (err) setErr(''); }}
              placeholder="name@nsheera.com"
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); if (err) setErr(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); attemptLogin(); } }}
              placeholder="Enter staff password"
            />
          </div>
          <div style={{ background: 'var(--beige)', border: '1px solid var(--line)', borderRadius: 3, padding: '10px 12px', marginBottom: 12, fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Authorised for</div>
            <div>{STAFF_PERMISSION_OPTIONS.map((p) => p.label).join(' • ')}</div>
          </div>
          {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} type="button" onClick={attemptLogin}>Sign In</button>
        </form>
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 16 }}>Demo staff accounts: owner@nsheera.com / owner2026, manager@nsheera.com / manager2026, catalog@nsheera.com / catalog2026.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — panel shell                                                  */
/* ------------------------------------------------------------------ */

function AdminPanel({
  tab, setTab, categories, products, onSaveCatalog,
  clients, onSaveClients, rates, onSaveRates, onRefreshRates, rateBusy, rateError, rateLog,
  selling, orders, onSaveOrders, inquiries, onSaveInquiries, onExitAdmin, account,
  heroSlides, onSaveHeroSlides,
}) {
  const newInquiryCount = inquiries.filter((i) => i.status === 'New').length;
  const tabs = [
    { id: 'rates', label: 'Gold & Silver Rates', permission: 'rates' },
    { id: 'homepage', label: 'Homepage', permission: 'catalog' },
    { id: 'categories', label: 'Categories', permission: 'catalog' },
    { id: 'products', label: 'Products', permission: 'catalog' },
    { id: 'orders', label: 'Orders', permission: 'orders' },
    { id: 'inquiries', label: `Inquiries${newInquiryCount ? ` (${newInquiryCount})` : ''}`, permission: 'inquiries' },
    { id: 'clients', label: 'Client Records', permission: 'clients' },
  ].filter((tabItem) => hasStaffAccess(account, tabItem.permission));
  return (
    <div className="container admin-layout" style={{ padding: '32px 24px 72px' }}>
      <aside>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 12 }}>Admin Panel</div>
        <nav className="admin-sidebar-nav">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                textAlign: 'left', padding: '10px 12px', borderRadius: 3, border: 'none',
                background: tab === t.id ? 'var(--beige)' : 'transparent',
                color: tab === t.id ? 'var(--ink)' : 'var(--ink-soft)', fontSize: 13.5,
              }}>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 18, padding: '10px 12px', borderRadius: 3, background: 'var(--beige)', fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{account?.name || 'Admin'}</div>
          <div>{account?.role || 'Staff'} • {account?.authorizedFor?.join(', ') || 'All sections'}</div>
        </div>
        <button onClick={onExitAdmin} className="btn outline sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
          <LogOut size={13} /> Log Out
        </button>
      </aside>

      <section>
        {tab === 'rates' && (
          <RatesTab rates={rates} onSaveRates={onSaveRates} onRefreshRates={onRefreshRates} rateBusy={rateBusy} rateError={rateError} rateLog={rateLog} selling={selling} />
        )}
        {tab === 'homepage' && (
          <HomepageTab heroSlides={heroSlides} onSaveHeroSlides={onSaveHeroSlides} />
        )}
        {tab === 'categories' && (
          <CategoriesTab categories={categories} products={products} onSaveCatalog={onSaveCatalog} />
        )}
        {tab === 'products' && (
          <ProductsTab categories={categories} products={products} onSaveCatalog={onSaveCatalog} rates={rates} />
        )}
        {tab === 'orders' && (
          <OrdersTab orders={orders} onSaveOrders={onSaveOrders} />
        )}
        {tab === 'inquiries' && (
          <InquiriesTab inquiries={inquiries} onSaveInquiries={onSaveInquiries} />
        )}
        {tab === 'clients' && (
          <ClientsTab clients={clients} onSaveClients={onSaveClients} />
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — Homepage tab                                               */
/* ------------------------------------------------------------------ */

function HomepageTab({ heroSlides, onSaveHeroSlides }) {
  const [slides, setSlides] = useState(heroSlides || DEFAULT_HERO_SLIDES);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { setSlides(heroSlides || DEFAULT_HERO_SLIDES); }, [heroSlides]);

  const updateSlide = (index, patch) => {
    const next = slides.map((slide, idx) => (idx === index ? { ...slide, ...patch } : slide));
    setSlides(next);
    onSaveHeroSlides?.(next);
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    setError('');
    setBusyId(index);
    try {
      const dataUrl = await compressImageFile(file);
      updateSlide(index, { imageDataUrl: dataUrl });
    } catch (e) {
      setError('Could not process that photo. Please try another image.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Homepage Hero Banners</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 20 }}>
        Choose the three hero banners shown on the storefront. You can swap in your own image and edit the title and subtitle for each one.
      </p>
      {error && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gap: 16 }}>
        {slides.map((slide, index) => (
          <div key={slide.id || index} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Banner {index + 1}</div>
              <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>Recommended image size: 1600 × 800</span>
            </div>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="field">
                <label>Title</label>
                <input value={slide.title || ''} onChange={(e) => updateSlide(index, { title: e.target.value })} />
              </div>
              <div className="field">
                <label>Subtitle</label>
                <input value={slide.subtitle || ''} onChange={(e) => updateSlide(index, { subtitle: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'center' }}>
              <label style={{ border: '1px dashed var(--line)', borderRadius: 4, padding: '12px 14px', textAlign: 'center', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 13 }}>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, e.target.files?.[0])} style={{ display: 'none' }} />
                {busyId === index ? 'Processing…' : slide.imageDataUrl ? 'Replace Image' : 'Upload Banner Image'}
              </label>
              <div style={{ minHeight: 140, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {slide.imageDataUrl ? (
                  <img src={slide.imageDataUrl} alt={slide.title || `Banner ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ color: 'var(--ink-soft)', fontSize: 13, textAlign: 'center', padding: 16 }}>No custom image yet<br />A fallback banner will be shown instead.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — Rates tab                                                    */
/* ------------------------------------------------------------------ */

function RatesTab({ rates, onSaveRates, onRefreshRates, rateBusy, rateError, rateLog, selling }) {
  const [markup, setMarkup] = useState(rates.markupPercent);
  const [manual, setManual] = useState(rates.manual);
  const [manualGold, setManualGold] = useState(rates.manualGold24k);
  const [manualSilver, setManualSilver] = useState(rates.manualSilver);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => { setMarkup(rates.markupPercent); setManual(rates.manual); setManualGold(rates.manualGold24k); setManualSilver(rates.manualSilver); }, [rates]);

  const save = () => onSaveRates({ ...rates, markupPercent: Number(markup), manual, manualGold24k: Number(manualGold), manualSilver: Number(manualSilver) });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22 }}>Gold &amp; Silver Rates</h2>
        <button className="btn sm outline" onClick={onRefreshRates} disabled={rateBusy}>
          <RefreshCw size={13} className={rateBusy ? 'spin' : ''} /> {rateBusy ? 'Fetching…' : 'Refresh Live Rate'}
        </button>
      </div>

      {rateError && (
        <div style={{ background: '#FBEFEE', color: '#B3261E', padding: '10px 14px', borderRadius: 3, fontSize: 13, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AlertCircle size={15} /> {rateError}</div>
        </div>
      )}

      {rateLog?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <button onClick={() => setShowDiagnostics((s) => !s)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--ink-soft)', textDecoration: 'underline' }}>
            {showDiagnostics ? 'Hide' : 'Show'} last fetch diagnostics ({rateLog.length} attempt{rateLog.length === 1 ? '' : 's'})
          </button>
          {showDiagnostics && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 12, marginTop: 8, fontSize: 12, fontFamily: 'monospace' }}>
              {rateLog.map((entry, i) => (
                <div key={i} style={{ padding: '4px 0', borderBottom: i < rateLog.length - 1 ? '1px solid var(--line)' : 'none', color: entry.ok ? '#2A2420' : '#B3261E' }}>
                  {entry.ok ? '✓' : '✗'} [{entry.mode}] {entry.url}{entry.error ? ` — ${entry.error}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 18 }}>
        Source: <b>{rates.manual ? 'Manual override' : rates.source === 'live' ? (rates.sourceName || 'Live API') : 'Fallback (no live data yet)'}</b>
        {rates.lastUpdated && <> · Last updated {new Date(rates.lastUpdated).toLocaleString('en-IN')}</>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <RateStat label="Spot Gold (24K) / g" value={inr(rates.spotGold24k)} />
        <RateStat label="Spot Silver / g" value={inr(rates.spotSilver)} />
        <RateStat label="Selling Gold (24K) / g" value={inr(selling.gold24)} highlight />
        <RateStat label="Selling Silver / g" value={inr(selling.silver)} highlight />
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 22, maxWidth: 480 }}>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Local Market Markup over Spot (%)</label>
          <input type="number" value={markup} onChange={(e) => setMarkup(e.target.value)} disabled={manual} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
          <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} />
          Override with manual rates instead of live feed
        </label>

        {manual && (
          <>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Manual 24K Gold Rate (₹/g)</label>
              <input type="number" value={manualGold} onChange={(e) => setManualGold(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Manual Silver Rate (₹/g)</label>
              <input type="number" value={manualSilver} onChange={(e) => setManualSilver(e.target.value)} />
            </div>
          </>
        )}

        <button className="btn" onClick={save}><Save size={13} /> Save Rate Settings</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 14, maxWidth: 480, lineHeight: 1.6 }}>
        Live rates come from <b>metalpriceapi.com</b> (your account's API key), called directly from the browser.
        If it's ever unreachable, it automatically falls back to metals.dev, then gold-api.com, then goldprice.org.
        Add your local market markup to reflect import duty, GST and dealer premium — or switch to manual entry to
        set your own counter rate.
      </p>
      <p style={{ fontSize: 11.5, color: '#B3261E', marginTop: 8, maxWidth: 480, lineHeight: 1.6 }}>
        Note: calling these APIs directly from the browser means their keys are visible to anyone who views the
        page source. That's fine to get live rates working now — for a public production launch, route them through
        the backend proxy (<code>/rates-proxy</code>, built earlier) instead, which keeps keys server-side.
      </p>
    </div>
  );
}

function RateStat({ label, value, highlight }) {
  return (
    <div style={{ background: highlight ? 'var(--beige)' : 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — Categories tab                                               */
/* ------------------------------------------------------------------ */

function CategoriesTab({ categories, products, onSaveCatalog }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [imageBusyId, setImageBusyId] = useState(null);
  const [imageError, setImageError] = useState('');

  const add = () => {
    if (!name.trim() || !code.trim()) return;
    const newCat = { id: uid(), name: name.trim(), code: code.trim().toUpperCase().slice(0, 3), imageDataUrl: '' };
    onSaveCatalog([...categories, newCat], products);
    setName(''); setCode('');
  };

  const remove = (id) => {
    if (products.some((p) => p.categoryId === id)) {
      if (!window.confirm('This category has products in it. Delete anyway? Products will remain but show as uncategorized.')) return;
    }
    onSaveCatalog(categories.filter((c) => c.id !== id), products);
  };

  const update = (id, patch) => onSaveCatalog(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)), products);

  const handleCategoryImage = async (id, file) => {
    if (!file) return;
    setImageError('');
    setImageBusyId(id);
    try {
      const dataUrl = await compressImageFile(file);
      update(id, { imageDataUrl: dataUrl });
    } catch (err) {
      setImageError('Could not process that photo — try a different file.');
    } finally {
      setImageBusyId(null);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Jewellery Categories</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 20 }}>
        Add a homepage image per category — shown on the storefront's category strip. Categories without one show the hallmark badge instead.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Category Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anklets" />
        </div>
        <div className="field" style={{ maxWidth: 100 }}>
          <label>Badge Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AK" maxLength={3} />
        </div>
        <button className="btn sm" onClick={add}><Plus size={13} /> Add Category</button>
      </div>
      {imageError && <div style={{ fontSize: 12, color: '#B3261E', marginBottom: 12 }}>{imageError}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Badge</th><th>Homepage Image</th><th>Name</th><th>Products</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td><HallmarkBadge code={c.code} size={40} /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 4, overflow: 'hidden', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.imageDataUrl ? <img src={c.imageDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={16} color="var(--ink-soft)" />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label className="btn sm outline" style={{ cursor: 'pointer' }}>
                        <Upload size={11} /> {imageBusyId === c.id ? 'Processing…' : c.imageDataUrl ? 'Replace' : 'Upload'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={(e) => { handleCategoryImage(c.id, e.target.files?.[0]); e.target.value = ''; }} />
                      </label>
                      {c.imageDataUrl && (
                        <button className="btn sm outline" onClick={() => update(c.id, { imageDataUrl: '' })}>Remove</button>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {editingId === c.id ? (
                    <input defaultValue={c.name} onBlur={(e) => { update(c.id, { name: e.target.value }); setEditingId(null); }} autoFocus />
                  ) : c.name}
                </td>
                <td>{products.filter((p) => p.categoryId === c.id).length}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn sm outline" onClick={() => setEditingId(c.id)}><Edit2 size={12} /></button>
                    <button className="btn sm outline" onClick={() => remove(c.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — Products tab                                                 */
/* ------------------------------------------------------------------ */

function emptyProduct(categories) {
  return {
    id: null, categoryId: categories[0]?.id || '', itemType: '', itemCode: '', description: '',
    purity: 'gold916', grossWeight: '', netWeight: '', diamondsValue: '0', stonesValue: '0', othersValue: '0',
    making: '10', makingType: 'percentage', imageDataUrls: [],
  };
}

function ProductsTab({ categories, products, onSaveCatalog, rates }) {
  const [form, setForm] = useState(emptyProduct(categories));
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const [socialPostMessage, setSocialPostMessage] = useState('');
  const [modelPreviewBusy, setModelPreviewBusy] = useState(false);

  const resetForm = () => { setForm(emptyProduct(categories)); setEditingId(null); setImageError(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.categoryId || !form.itemCode.trim()) return;
    const payload = {
      ...form,
      grossWeight: Number(form.grossWeight || 0),
      netWeight: Number(form.netWeight || 0),
      diamondsValue: Number(form.diamondsValue || 0),
      stonesValue: Number(form.stonesValue || 0),
      othersValue: Number(form.othersValue || 0),
      making: Number(form.making || 0),
      makingType: form.makingType === 'fixed' ? 'fixed' : 'percentage',
    };
    if (editingId) {
      onSaveCatalog(categories, products.map((p) => (p.id === editingId ? { ...payload, id: editingId } : p)));
    } else {
      onSaveCatalog(categories, [...products, { ...payload, id: uid() }]);
    }
    resetForm();
  };

  const edit = (p) => {
    setForm({
      ...p,
      grossWeight: String(p.grossWeight ?? ''),
      netWeight: String(p.netWeight ?? ''),
      diamondsValue: String(p.diamondsValue ?? 0),
      stonesValue: String(p.stonesValue ?? 0),
      othersValue: String(p.othersValue ?? 0),
      making: String(p.making ?? 0),
      makingType: p.makingType === 'fixed' ? 'fixed' : 'percentage',
      imageDataUrls: p.imageDataUrls || [],
    });
    setEditingId(p.id);
    setImageError('');
  };
  const remove = (id) => onSaveCatalog(categories, products.filter((p) => p.id !== id));

  // Handles selecting multiple photos at once (or adding more across several selections).
  // Each file is compressed independently; one bad file doesn't block the rest, and the
  // total is capped so a product's photo set can't blow past the storage budget.
  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageError('');

    const room = MAX_PHOTOS_PER_PRODUCT - form.imageDataUrls.length;
    if (room <= 0) {
      setImageError(`You've reached the ${MAX_PHOTOS_PER_PRODUCT}-photo limit per product. Remove one to add another.`);
      e.target.value = '';
      return;
    }
    const toProcess = files.slice(0, room);
    const skipped = files.length - toProcess.length;

    setImageBusy(true);
    const results = await Promise.allSettled(toProcess.map((f) => compressImageFile(f)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    setForm((f) => ({ ...f, imageDataUrls: [...f.imageDataUrls, ...succeeded] }));
    setImageBusy(false);
    e.target.value = '';

    if (failedCount > 0 || skipped > 0) {
      const parts = [];
      if (failedCount > 0) parts.push(`${failedCount} photo${failedCount > 1 ? 's' : ''} couldn't be processed`);
      if (skipped > 0) parts.push(`${skipped} skipped (${MAX_PHOTOS_PER_PRODUCT}-photo limit)`);
      setImageError(parts.join(' · '));
    }
  };

  const removePhoto = (idx) => setForm((f) => ({ ...f, imageDataUrls: f.imageDataUrls.filter((_, i) => i !== idx) }));
  const makeCover = (idx) => setForm((f) => {
    const next = [...f.imageDataUrls];
    const [chosen] = next.splice(idx, 1);
    next.unshift(chosen);
    return { ...f, imageDataUrls: next };
  });

  const generatePreviewImages = () => {
    const room = MAX_PHOTOS_PER_PRODUCT - form.imageDataUrls.length;
    if (room <= 0) {
      setImageError(`You've reached the ${MAX_PHOTOS_PER_PRODUCT}-photo limit per product.`);
      return;
    }
    setModelPreviewBusy(true);
    setImageError('');
    try {
      const productMeta = {
        description: form.description || form.itemType || 'Jewellery',
        itemType: form.itemType || 'Jewellery',
        categoryId: form.categoryId,
        purity: form.purity,
      };
      const prompt = buildInAppModelShotPrompt(productMeta);
      const generated = generateModelPreviewImages(productMeta, Math.min(5, room));
      setForm((f) => ({
        ...f,
        imageDataUrls: [...(f.imageDataUrls || []), ...generated].slice(0, MAX_PHOTOS_PER_PRODUCT),
      }));
      setImageError('');
      setSocialPostMessage(`Five AI-style model shots prepared for ${prompt.title}.`);
    } catch (err) {
      setImageError('Could not generate preview images right now.');
    } finally {
      setModelPreviewBusy(false);
    }
  };

  const shareProduct = async (productDraft) => {
    const title = (productDraft.description || '').trim() || 'New arrival';
    const category = categories.find((c) => c.id === productDraft.categoryId)?.name || 'Jewellery';
    const preview = calcProductPrice({
      ...productDraft,
      grossWeight: Number(productDraft.grossWeight || 0),
      netWeight: Number(productDraft.netWeight || 0),
      diamondsValue: Number(productDraft.diamondsValue || 0),
      stonesValue: Number(productDraft.stonesValue || 0),
      othersValue: Number(productDraft.othersValue || 0),
      making: Number(productDraft.making || 0),
      makingType: productDraft.makingType === 'fixed' ? 'fixed' : 'percentage',
    }, rates);
    const caption = `New arrival at ${SHOP.name}: ${title} (${category}). Item code: ${productDraft.itemCode || '—'}. Estimated price: ${inr(preview.total)}. Visit us today!`;
    try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(caption); } catch {}
    const shareLink = `https://wa.me/${SHOP.whatsappNumber}?text=${encodeURIComponent(caption)}`;
    window.open(shareLink, '_blank', 'noopener,noreferrer');
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    setSocialPostMessage('Share text prepared — opening WhatsApp and Instagram for your post.');
  };

  const filtered = products.filter((p) =>
    p.description.toLowerCase().includes(q.toLowerCase()) ||
    p.itemCode.toLowerCase().includes(q.toLowerCase()) ||
    (p.itemType || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 20 }}>Products — Stock Register</h2>

      <form onSubmit={submit} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 20, marginBottom: 26 }}>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Product Photos ({form.imageDataUrls.length}/{MAX_PHOTOS_PER_PRODUCT})</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {form.imageDataUrls.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 72, flexShrink: 0 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 4, overflow: 'hidden', background: 'var(--beige)',
                  border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--line)',
                }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button type="button" onClick={() => removePhoto(i)} aria-label="Remove photo"
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--ink)', color: '#fff', border: '2px solid var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}>
                  <X size={11} />
                </button>
                {i === 0 ? (
                  <div style={{ fontSize: 9.5, color: 'var(--gold-deep)', textAlign: 'center', marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cover</div>
                ) : (
                  <button type="button" onClick={() => makeCover(i)} style={{ fontSize: 9.5, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 3, width: '100%', background: 'none', border: 'none', textDecoration: 'underline' }}>
                    Set as cover
                  </button>
                )}
              </div>
            ))}

            {form.imageDataUrls.length < MAX_PHOTOS_PER_PRODUCT && (
              <label style={{
                width: 72, height: 72, borderRadius: 4, border: '1px dashed var(--line-strong)', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--ink-soft)', gap: 4,
              }}>
                <Upload size={16} />
                <span style={{ fontSize: 9.5 }}>Add Photo</span>
                <input type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            {imageBusy && <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Processing photo(s)…</div>}
            {modelPreviewBusy && <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Generating model preview images…</div>}
            {imageError && <div style={{ fontSize: 11, color: '#B3261E' }}>{imageError}</div>}
            {!imageBusy && !imageError && <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>JPG or PNG, up to {MAX_PHOTOS_PER_PRODUCT} photos — select multiple at once, or add more over time. Works with phone camera uploads.</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 14 }}>
          <div className="field">
            <label>Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Item Type</label>
            <input value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })} placeholder="Chain" />
          </div>
          <div className="field">
            <label>Item Code</label>
            <input value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value.toUpperCase() })} placeholder="CH001" />
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Item Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Italian Chain" />
          </div>
          <div className="field">
            <label>Purity</label>
            <select value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })}>
              {PURITY_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Gross Wt. (g)</label>
            <input type="number" step="0.01" value={form.grossWeight} onChange={(e) => setForm({ ...form, grossWeight: e.target.value })} />
          </div>
          <div className="field">
            <label>Net Wt. (g)</label>
            <input type="number" step="0.01" value={form.netWeight} onChange={(e) => setForm({ ...form, netWeight: e.target.value })} />
          </div>
          <div className="field">
            <label>Diamonds (₹)</label>
            <input type="number" value={form.diamondsValue} onChange={(e) => setForm({ ...form, diamondsValue: e.target.value })} />
          </div>
          <div className="field">
            <label>Stones (₹)</label>
            <input type="number" value={form.stonesValue} onChange={(e) => setForm({ ...form, stonesValue: e.target.value })} />
          </div>
          <div className="field">
            <label>Others (₹)</label>
            <input type="number" value={form.othersValue} onChange={(e) => setForm({ ...form, othersValue: e.target.value })} />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16, maxWidth: 420 }}>
          <label>Making (Labour) Charge</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => setForm({ ...form, makingType: 'percentage' })}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 3, fontSize: 12.5,
                border: `1px solid ${form.makingType !== 'fixed' ? 'var(--gold)' : 'var(--line-strong)'}`,
                background: form.makingType !== 'fixed' ? 'var(--beige)' : 'transparent',
              }}>
              % of Metal Value
            </button>
            <button type="button" onClick={() => setForm({ ...form, makingType: 'fixed' })}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 3, fontSize: 12.5,
                border: `1px solid ${form.makingType === 'fixed' ? 'var(--gold)' : 'var(--line-strong)'}`,
                background: form.makingType === 'fixed' ? 'var(--beige)' : 'transparent',
              }}>
              Fixed Amount (₹)
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={form.making}
              onChange={(e) => setForm({ ...form, making: e.target.value })}
              placeholder={form.makingType === 'fixed' ? 'e.g. 500' : 'e.g. 12'}
              style={{ paddingRight: 34 }}
            />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, color: 'var(--ink-soft)' }}>
              {form.makingType === 'fixed' ? '₹' : '%'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn sm" type="submit">{editingId ? <><Save size={12} /> Update Product</> : <><Plus size={12} /> Add Product</>}</button>
          <button type="button" className="btn sm outline" onClick={generatePreviewImages} disabled={modelPreviewBusy}><Sparkles size={12} /> Generate 5 Model Shots</button>
          <button type="button" className="btn sm outline" onClick={() => shareProduct(form)}><Sparkles size={12} /> Share Product</button>
          {editingId && <button type="button" className="btn sm outline" onClick={resetForm}>Cancel</button>}
        </div>
        {socialPostMessage && <p style={{ fontSize: 12, color: 'var(--gold-deep)', marginTop: 10 }}>{socialPostMessage}</p>}
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 12 }}>
          Net Wt. carries the live metal rate. Diamonds / Stones / Others are entered as flat ₹ value-adds — enter the priced value for the stone/diamond content directly.
        </p>
      </form>

      <div className="field" style={{ maxWidth: 280, marginBottom: 14 }}>
        <input placeholder="Search description, item code or type…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th></th><th>Item Code</th><th>Description</th><th>Category / Type</th><th>Purity</th><th>Gross / Net Wt.</th><th>Diamonds</th><th>Stones</th><th>Others</th><th>Making</th><th>Est. Price</th><th></th></tr></thead>
          <tbody>
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.categoryId);
              const price = calcProductPrice(p, rates);
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 3, overflow: 'hidden', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.imageDataUrls?.[0] ? <img src={p.imageDataUrls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={14} color="var(--ink-soft)" />}
                      {p.imageDataUrls?.length > 1 && (
                        <span style={{
                          position: 'absolute', bottom: 0, right: 0, background: 'rgba(42,36,32,0.75)', color: '#fff',
                          fontSize: 8.5, padding: '1px 3px', borderRadius: '3px 0 0 0', lineHeight: 1.3,
                        }}>+{p.imageDataUrls.length - 1}</span>
                      )}
                    </div>
                  </td>
                  <td>{p.itemCode}</td>
                  <td>{p.description}</td>
                  <td>{cat?.name || '—'}<div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{p.itemType}</div></td>
                  <td>{purityByKey(p.purity).label}</td>
                  <td>{p.grossWeight}g / {p.netWeight}g</td>
                  <td>{p.diamondsValue ? inr(p.diamondsValue) : '—'}</td>
                  <td>{p.stonesValue ? inr(p.stonesValue) : '—'}</td>
                  <td>{p.othersValue ? inr(p.othersValue) : '—'}</td>
                  <td>{p.makingType === 'fixed' ? `${inr(p.making)} flat` : `${p.making}%`}</td>
                  <td>{inr(price.total)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn sm outline" onClick={() => edit(p)}><Edit2 size={12} /></button>
                      <button className="btn sm outline" onClick={() => remove(p.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — Orders tab                                                   */
/* ------------------------------------------------------------------ */

function OrdersTab({ orders, onSaveOrders }) {
  const [expanded, setExpanded] = useState(null);
  const updateStatus = (id, status) => onSaveOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 20 }}>Online Orders</h2>
      {orders.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No orders placed yet. Orders from the storefront checkout will appear here.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td>{o.id}<div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(o.createdAt).toLocaleString('en-IN')}</div></td>
                    <td>{o.customer.name}<div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{o.customer.phone} · {o.customer.buyerType}</div></td>
                    <td>{o.items.length} item(s)</td>
                    <td>{inr(o.total)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{o.paymentMethod}</td>
                    <td>
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                        style={{ fontSize: 12, padding: '5px 8px', border: '1px solid var(--line-strong)', borderRadius: 3 }}>
                        <option>Paid (Demo)</option>
                        <option>Fulfilled</option>
                        <option>Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn sm outline" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                        {expanded === o.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr><td colSpan={7} style={{ background: 'var(--beige)' }}>
                      <div style={{ padding: '10px 4px' }}>
                        {o.items.map((it, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                            <span>{it.qty} × {it.name}</span><span>{inr(it.unitPrice * it.qty)}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
                          {o.customer.address}{o.customer.gstNumber ? ' · GSTIN: ' + o.customer.gstNumber : ''}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — Inquiries tab (Contact Us + Cash for Gold / Loan Settlement) */
/* ------------------------------------------------------------------ */

function InquiriesTab({ inquiries, onSaveInquiries }) {
  const [expanded, setExpanded] = useState(null);
  const [filterKind, setFilterKind] = useState('all');
  const updateStatus = (id, status) => onSaveInquiries(inquiries.map((i) => (i.id === id ? { ...i, status } : i)));
  const remove = (id) => { if (window.confirm('Delete this inquiry?')) onSaveInquiries(inquiries.filter((i) => i.id !== id)); };

  const filtered = filterKind === 'all' ? inquiries : inquiries.filter((i) => i.kind === filterKind);

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 20 }}>Inquiries</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'design-request', label: 'AI Design Requests' },
          { id: 'astro-request', label: 'Astro Stone Requests' },
          { id: 'cash-for-gold', label: 'Cash for Gold / Loan' },
          { id: 'contact', label: 'Contact Us' },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilterKind(f.id)} className={filterKind === f.id ? 'btn sm' : 'btn sm outline'}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No inquiries yet. Submissions from Contact Us, Cash for Gold / Loan Settlement, the AI Design Studio, and the Astro Stone Advisor will appear here.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Type</th><th>Name</th><th>Contact</th><th>Details</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((i) => (
                <React.Fragment key={i.id}>
                  <tr>
                    <td>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 20,
                        background: i.kind === 'cash-for-gold' ? 'var(--beige-deep)' : (i.kind === 'design-request' || i.kind === 'astro-request') ? 'var(--gold)' : 'var(--beige)',
                        color: (i.kind === 'design-request' || i.kind === 'astro-request') ? '#fff' : 'var(--ink)',
                      }}>
                        {i.kind === 'cash-for-gold' ? (i.purpose || 'Cash for Gold') : i.kind === 'design-request' ? (i.mode === 'redesign' ? 'AI Redesign' : 'AI Design') : i.kind === 'astro-request' ? 'Astro Stone' : 'Contact'}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>{new Date(i.createdAt).toLocaleString('en-IN')}</div>
                    </td>
                    <td>{i.name}</td>
                    <td>{i.phone}<div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{i.email}</div></td>
                    <td>{i.kind === 'cash-for-gold' ? i.itemDescription : i.kind === 'design-request' ? (i.concept?.title || 'Design request') : i.kind === 'astro-request' ? (i.suggestion?.primaryStone || 'Astro stone request') : i.subject}</td>
                    <td>
                      <select value={i.status} onChange={(e) => updateStatus(i.id, e.target.value)}
                        style={{ fontSize: 12, padding: '5px 8px', border: '1px solid var(--line-strong)', borderRadius: 3 }}>
                        <option>New</option>
                        <option>Contacted</option>
                        <option>Resolved</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn sm outline" onClick={() => setExpanded(expanded === i.id ? null : i.id)}>
                          {expanded === i.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <button className="btn sm outline" onClick={() => remove(i.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                  {expanded === i.id && (
                    <tr><td colSpan={6} style={{ background: 'var(--beige)' }}>
                      <div style={{ padding: '10px 4px', fontSize: 13 }}>
                        {i.kind === 'cash-for-gold' && (
                          <>
                            {i.approxWeight && <div>Approx. Weight: {i.approxWeight} g</div>}
                            {i.preferredDate && <div>Preferred Visit Date: {i.preferredDate}</div>}
                          </>
                        )}
                        {i.kind === 'design-request' && (
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {i.referenceImagePreview && (
                              <img src={i.referenceImagePreview} alt="Reference upload" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 220 }}>
                              {i.promptText && <div style={{ marginBottom: 6 }}><b>Customer's brief:</b> {i.promptText}</div>}
                              {i.concept?.description && <div style={{ marginBottom: 6 }}><b>AI concept:</b> {i.concept.description}</div>}
                              {i.concept?.suggestedMetal && <div>Suggested Metal: {i.concept.suggestedMetal}</div>}
                              {i.concept?.estimatedWeightRange && <div>Est. Weight: {i.concept.estimatedWeightRange}</div>}
                              {i.concept?.gemstoneSuggestions && <div>Gemstones: {i.concept.gemstoneSuggestions}</div>}
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--line-strong)' }}>
                                {i.budget && <div>Budget: ₹{i.budget}</div>}
                                {i.preferredMetal && <div>Preferred Metal: {i.preferredMetal}</div>}
                                {i.occasion && <div>Occasion: {i.occasion}</div>}
                                {i.notes && <div>Notes: {i.notes}</div>}
                              </div>
                            </div>
                          </div>
                        )}
                        {i.kind === 'astro-request' && (
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <div style={{ marginBottom: 6 }}>
                              <b>Birth details:</b> {i.dateOfBirth || 'Not provided'}
                              {i.timeOfBirth ? `, ${i.timeOfBirth}` : ''}
                              {i.placeOfBirth ? `, ${i.placeOfBirth}` : ''}
                            </div>
                            {i.concern && <div style={{ marginBottom: 6 }}><b>Customer's concern:</b> {i.concern}</div>}
                            {i.suggestion?.rationale && <div style={{ marginBottom: 6 }}><b>AI rationale:</b> {i.suggestion.rationale}</div>}
                            {i.suggestion?.associatedPlanet && <div>Associated Planet: {i.suggestion.associatedPlanet}</div>}
                            {i.suggestion?.recommendedMetal && <div>Recommended Metal: {i.suggestion.recommendedMetal}</div>}
                            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--line-strong)' }}>
                              {i.budget && <div>Budget: ₹{i.budget}</div>}
                              {i.occasion && <div>Occasion: {i.occasion}</div>}
                              {i.notes && <div>Notes: {i.notes}</div>}
                            </div>
                          </div>
                        )}
                        {i.message && <div style={{ marginTop: 6 }}>Message: {i.message}</div>}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin — Clients tab                                                  */
/* ------------------------------------------------------------------ */

function emptyClient() {
  return { id: null, name: '', phone: '', email: '', address: '', type: 'Retail', businessName: '', gstNumber: '', notes: '' };
}

function ClientsTab({ clients, onSaveClients }) {
  const [form, setForm] = useState(emptyClient());
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  const resetForm = () => { setForm(emptyClient()); setEditingId(null); setErr(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setErr('Name and phone number are required.'); return; }
    if (form.type === 'Shopkeeper' && !form.gstNumber.trim()) { setErr('GST number is required for Shopkeeper / retail-trade accounts.'); return; }
    setErr('');
    const record = { ...form, createdAt: form.createdAt || new Date().toISOString() };
    if (editingId) onSaveClients(clients.map((c) => (c.id === editingId ? { ...record, id: editingId } : c)));
    else onSaveClients([...clients, { ...record, id: uid() }]);
    resetForm();
  };

  const edit = (c) => { setForm(c); setEditingId(c.id); setErr(''); };
  const remove = (id) => { if (window.confirm('Delete this client record?')) onSaveClients(clients.filter((c) => c.id !== id)); };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.phone.includes(q) ||
    (c.gstNumber || '').toLowerCase().includes(q.toLowerCase())
  );

  const gstValid = form.gstNumber ? GST_RE.test(form.gstNumber.toUpperCase()) : true;

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 20 }}>Client Records</h2>

      <form onSubmit={submit} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: 20, marginBottom: 26 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 14 }}>
          <div className="field">
            <label><User size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label><Phone size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label><Mail size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Client Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="Retail">Retail Customer</option>
              <option value="Shopkeeper">Shopkeeper / Wholesale</option>
            </select>
          </div>
          {form.type === 'Shopkeeper' && (
            <div className="field">
              <label><Building2 size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Business Name</label>
              <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>
          )}
          <div className="field">
            <label>GST Number {form.type === 'Shopkeeper' ? '(required)' : '(optional)'}</label>
            <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} placeholder={DEFAULT_GST_NUMBER} />
            {form.gstNumber && !gstValid && (
              <div style={{ fontSize: 11, color: '#B3261E', marginTop: 4 }}>Format looks off — expected 15-character GSTIN.</div>
            )}
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label><MapPin size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        {err && <div style={{ color: '#B3261E', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn sm" type="submit">{editingId ? <><Save size={12} /> Update Client</> : <><Plus size={12} /> Add Client</>}</button>
          {editingId && <button type="button" className="btn sm outline" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="field" style={{ maxWidth: 280, marginBottom: 14 }}>
        <input placeholder="Search name, phone or GSTIN…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Client</th><th>Contact</th><th>Type</th><th>GSTIN</th><th>DOB / Anniversary</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: 24 }}>No client records yet.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.name}
                  {c.businessName ? <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{c.businessName}</div> : null}
                  {c.authProvider ? (
                    <div style={{ fontSize: 9.5, color: 'var(--gold-deep)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>● Via {c.authProvider}</div>
                  ) : c.password && (
                    <div style={{ fontSize: 9.5, color: 'var(--gold-deep)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>● Registered</div>
                  )}
                </td>
                <td>{c.phone}<div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{c.email}</div></td>
                <td>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 20,
                    background: c.type === 'Shopkeeper' ? 'var(--beige-deep)' : 'var(--beige)', color: 'var(--ink)'
                  }}>{c.type}</span>
                </td>
                <td>{c.gstNumber || '—'}</td>
                <td style={{ fontSize: 12.5 }}>
                  {c.dob && <div>DOB: {c.dob}</div>}
                  {c.anniversary && <div>Anniv: {c.anniversary}</div>}
                  {!c.dob && !c.anniversary && '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn sm outline" onClick={() => edit(c)}><Edit2 size={12} /></button>
                    <button className="btn sm outline" onClick={() => remove(c.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

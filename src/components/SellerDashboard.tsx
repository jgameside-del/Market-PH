/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Store, Plus, Coins, Play, Sparkles, Check, Truck, Clock, ShieldX, Image, 
  ArrowRight, ArrowLeft, Heart, RefreshCw, AlertCircle, ShoppingBag, Eye, HelpCircle, CheckCircle2,
  Upload, X, Trash2, ShieldAlert, Search
} from 'lucide-react';
import { Product, User, Order, GCashReceipt } from '../types';
import { PHILIPPINE_LOCATIONS, CATEGORIES } from '../data';

interface SellerDashboardProps {
  products: Product[];
  orders: Order[];
  receipts: GCashReceipt[];
  currentUser: User;
  onPostProduct: (productData: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'createdAt' | 'views'>) => Product;
  onSubmitGCashReceipt: (productId: string, referenceNo: string, receiptBase64: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onDeleteProduct?: (productId: string) => void;
  gcashQrPayment?: string;
  listingFee?: number;
}

// Preset assets for easy mock listing visual selection
const SAMPLE_IMAGE_PRESETS = [
  { name: "Smartphone", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80" },
  { name: "Laptop", url: "https://images.unsplash.com/photo-1496181130204-7552cc15b1e3?w=600&auto=format&fit=crop&q=80" },
  { name: "Sneakers", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80" },
  { name: "Sofa/Furniture", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80" },
  { name: "Headphones", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80" },
  { name: "Delicious Meal", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80" }
];

export default function SellerDashboard({
  products,
  orders,
  receipts,
  currentUser,
  onPostProduct,
  onSubmitGCashReceipt,
  onUpdateOrderStatus,
  onDeleteProduct,
  gcashQrPayment = '/src/assets/images/gcash_qr_new_1781249283220.jpg',
  listingFee = 20
}: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'post' | 'orders' | 'transactions'>('listings');
  const [searchTxQuery, setSearchTxQuery] = useState('');
  const [filterTxStatus, setFilterTxStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [showFullQRModal, setShowFullQRModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // States for Post Product Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('electronics');
  const [condition, setCondition] = useState<'new' | 'like_new' | 'good' | 'used'>('good');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState(PHILIPPINE_LOCATIONS[0]);
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const imageUrl = uploadedImages[0] || '';
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);
  const [availableColors, setAvailableColors] = useState<string[]>(['Charcoal Black', 'Pearl White', 'Classic Silver']);
  const [newColorInput, setNewColorInput] = useState('');

  const handleAddColor = () => {
    if (!newColorInput.trim()) return;
    const cleaned = newColorInput.trim();
    if (!availableColors.includes(cleaned)) {
      setAvailableColors(prev => [...prev, cleaned]);
    }
    setNewColorInput('');
  };

  const handleRemoveColor = (color: string) => {
    setAvailableColors(prev => prev.filter(c => c !== color));
  };

  // States & handlers for custom image drag-and-drop / upload
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUploadedFiles = (files: File[]) => {
    const spaceLeft = 5 - uploadedImages.length;
    if (spaceLeft <= 0) return;

    const filesToProcess = files.slice(0, spaceLeft);
    filesToProcess.forEach((file) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setUploadedImages(prev => {
              if (prev.length >= 5) return prev;
              return [...prev, event.target!.result as string];
            });
            setSelectedPresetIndex(-1);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // AI Generation triggers
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchError, setPitchError] = useState('');

  // GCash checkout sub-flow status
  const [stage, setStage] = useState<'details' | 'payment'>('details');
  const [justPostedProduct, setJustPostedProduct] = useState<Product | null>(null);
  const [receiptRefNo, setReceiptRefNo] = useState('');
  const [customReceiptBase64, setCustomReceiptBase64] = useState('');
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const sellerProducts = products.filter(p => p.sellerId === currentUser.id);
  const sellerOrders = orders.filter(o => o.sellerId === currentUser.id);

  const pendingConfirmationReceipts = receipts.filter(r => r.sellerId === currentUser.id && r.status === 'pending');

  const totalEarnings = orders
    .filter(o => o.sellerId === currentUser.id && o.status === 'completed')
    .reduce((sum, o) => sum + o.productPrice, 0);

  // Auto pitch creator leveraging our Node /api/generate-description endpoint
  const handleAIGeneratePitch = async () => {
    if (!title) {
      setPitchError("Please specify an item title first so the AI can craft a matching pitch.");
      return;
    }
    setPitchError('');
    setIsGeneratingPitch(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, condition, price: price || 'TBD', location })
      });
      const data = await res.json();
      if (data.result) {
        setDescription(data.result);
      } else {
        throw new Error(data.error || "Generation returned blank result");
      }
    } catch (err: any) {
      console.error(err);
      setPitchError("Could not invoke Gemini Assistant. Local P2P outline substituted.");
      // Fallback
      setDescription(`🔥 legit online seller checkout! original ${title} in condition ${condition}. location meetup at ${location}. perfect function, negotiate with me inside PMs.`);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleCreateProductInit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !imageUrl) return;

    const baseProduct = onPostProduct({
      title,
      description: description || `Selling ${title}. In ${condition} condition. Drop a chat.`,
      price: parseFloat(price),
      category,
      imageUrl,
      imageUrls: uploadedImages,
      location,
      condition,
      colors: availableColors,
      listingFeePaid: false,
      status: 'pending_payment'
    });

    setJustPostedProduct(baseProduct);
    
    // Generate a default 13 digit gcash transaction code
    const generatedRef = `9023${Math.floor(100000000 + Math.random() * 900000000)}`;
    setReceiptRefNo(generatedRef);
    setStage('payment');
  };

  /**
   * Outstanding Sandbox Quality Asset:
   * Programmatic, live visual construction of a real looking GCash e-Receipt image rendered 
   * in raw Base64 using canvas! This allows the user to upload a REAL pixelated GCash receipt 
   * to our Gemini OCR endpoint, completing the multi-role testing workflow in high fidelity.
   */
  const handleAutoGenerateGCashReceiptMock = () => {
    setIsGeneratingReceipt(true);
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 680;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Deep blue GCash themed brand layout
        ctx.fillStyle = '#0a2342';
        ctx.fillRect(0, 0, 400, 680);

        // Header GCash Badge
        ctx.fillStyle = '#007CF0';
        ctx.beginPath();
        ctx.roundRect(40, 30, 320, 50, 10);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('GCash Send Money', 60, 62);

        // White receipt container
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(25, 100, 350, 530, 15);
        ctx.fill();

        // Check icon
        ctx.fillStyle = '#007CF0';
        ctx.beginPath();
        ctx.arc(200, 160, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('✓', 190, 168);

        // Success Status
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Sent Successfully to', 120, 210);
        
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('MARKET PH ADM', 125, 235);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Merchant 09090001122', 135, 255);

        // Amount Box
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(40, 275, 320, 75);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(40, 275, 320, 75);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`₱${listingFee.toFixed(2)}`, 145, 322);

        // Transaction Details
        ctx.fillStyle = '#64748b';
        ctx.font = '13px Arial';
        ctx.fillText('Reference No.', 40, 390);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(receiptRefNo, 180, 390);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px Arial';
        ctx.fillText('Fee Amount:', 40, 425);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`₱${listingFee.toFixed(2)}`, 180, 425);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px Arial';
        ctx.fillText('Transaction Date:', 40, 460);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(new Date().toLocaleDateString('en-PH') + ' ' + new Date().toLocaleTimeString('en-PH'), 160, 460);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px Arial';
        ctx.fillText('Account Name:', 40, 495);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(currentUser.fullName, 180, 495);

        // Bottom Footer Watermark
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(25, 580, 350, 50);
        ctx.fillStyle = '#007CF0';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Applet Authenticated GCash Proof', 105, 608);

        // Convert canvas back to full inline data
        const dataUrl = canvas.toDataURL('image/png');
        setCustomReceiptBase64(dataUrl);
      }
      setIsGeneratingReceipt(false);
    }, 1200);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justPostedProduct || !receiptRefNo) return;

    // Use simulated or uploaded base64 data
    const finalReceiptBase64 = customReceiptBase64 || "MOCK_BASE64_PLACEHOLDER";
    
    onSubmitGCashReceipt(justPostedProduct.id, receiptRefNo, finalReceiptBase64);
    setSubmissionComplete(true);
  };

  const resetPostForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setUploadedImages([]);
    setSelectedPresetIndex(-1);
    setAvailableColors(['Charcoal Black', 'Pearl White', 'Classic Silver']);
    setNewColorInput('');
    setJustPostedProduct(null);
    setReceiptRefNo('');
    setCustomReceiptBase64('');
    setSubmissionComplete(false);
    setStage('details');
    setActiveTab('listings');
  };

  const handlePresetSelect = (presetIndex: number, url: string) => {
    if (uploadedImages.length >= 5) return;
    setUploadedImages(prev => [...prev, url]);
    setSelectedPresetIndex(presetIndex);
    if (!title) {
      setTitle(`Pinas ${SAMPLE_IMAGE_PRESETS[presetIndex].name} - Clean Solid Deal`);
    }
  };

  return (
    <div className="bg-transparent min-h-screen">
      {/* Seller Header */}
      <div className="bg-white/30 backdrop-blur-md rounded-3xl border border-white/40 mt-6 mx-4 md:mx-0 py-8 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
              <Store className="w-6 h-6 text-amber-600" />
              Seller Hub - Market PH
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              List items, manage active product feeds, process client CODs, and track Pinas revenue.
            </p>
          </div>
          
          <button
            onClick={() => {
              setActiveTab('post');
              setStage('details');
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post Item
          </button>
        </div>
      </div>

      {/* Internal Navigation & Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-white/30 pb-4">
          {/* Sub Navigation */}
          <div className="flex bg-white/40 backdrop-blur-md p-1 rounded-xl border border-white/40">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === 'listings' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Listings ({sellerProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('post')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === 'post' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Post New Item
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition relative cursor-pointer ${
                activeTab === 'orders' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incoming Orders ({sellerOrders.length})
              {sellerOrders.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full ring-2 ring-white"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition relative cursor-pointer ${
                activeTab === 'transactions' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transaction History
            </button>
          </div>

          {/* Quick Ledger */}
          <div className="flex items-center gap-4 flex-wrap bg-white/40 backdrop-blur-md p-3 rounded-xl border border-white/45 shadow-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-bold leading-none uppercase">Total Executed Earnings (COD)</span>
              <span className="text-md font-extrabold text-emerald-700 font-mono">₱{totalEarnings.toLocaleString()}</span>
            </div>
            <div className="w-px bg-white/40 h-6"></div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold leading-none uppercase">Listing Credits Spent</span>
              <span className="text-md font-mono font-extrabold text-[#007DFE] flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                ₱{receipts.filter(r => r.sellerId === currentUser.id && r.status === 'approved').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* View Switch */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              My Posted Listings
            </h2>
            
            {sellerProducts.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 p-12 rounded-2xl text-center space-y-3">
                <div className="bg-slate-100 p-3 rounded-full w-fit mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-slate-700 font-semibold text-sm">No items listed yet</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">Build an active catalog to showcase and dispose of your items safely across the state.</p>
                <button
                  onClick={() => setActiveTab('post')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
                >
                  Create My First Listing (Fee: ₱{listingFee.toLocaleString()})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellerProducts.map((p) => {
                  const matchingReceipt = receipts.find(r => r.productId === p.id);
                  return (
                    <div key={p.id} className="bg-white/50 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-white/55 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                      <div>
                        {/* Status bar */}
                        <div className="px-4 py-2 border-b border-white/30 flex justify-between items-center bg-white/20">
                          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide">Ref: {p.id.substring(5,13).toUpperCase()}</span>
                          {p.status === 'active' && (
                            <span className="bg-emerald-100/60 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/10">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Active Ad
                            </span>
                          )}
                          {p.status === 'pending_payment' && (
                            <span className="bg-rose-100/60 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-500/10">
                              ⚠️ Unpaid
                            </span>
                          )}
                          {p.status === 'pending_approval' && (
                            <span className="bg-amber-100/60 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/10">
                              ⏳ Auditing
                            </span>
                          )}
                          {p.status === 'rejected' && (
                            <span className="bg-red-100/60 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-500/10">
                              ❌ Refused
                            </span>
                          )}
                          {p.status === 'sold' && (
                            <span className="bg-slate-200/60 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-550/10">
                              🎉 Handed Over (Sold)
                            </span>
                          )}
                        </div>

                        {/* Image + Title info */}
                        <div className="p-4 flex gap-3">
                          <img 
                            src={p.imageUrl} 
                            alt={p.title} 
                            className="w-16 h-16 object-cover rounded-2xl border border-white/45 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 text-xs truncate leading-tight">{p.title}</h3>
                            <span className="text-[10px] text-slate-550 block tracking-wide uppercase font-semibold mt-0.5">{p.category}</span>
                            <span className="text-amber-700 text-sm font-extrabold font-mono mt-1 block">₱{p.price.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Description snippet */}
                        <p className="px-4 text-slate-600 text-[11px] leading-relaxed line-clamp-2 italic mb-3">
                          "{p.description}"
                        </p>
                      </div>

                      {/* Bottom action panel */}
                      <div className="p-3 bg-white/20 border-t border-white/30 flex flex-col gap-2">
                        {p.status === 'pending_payment' && (
                          <button
                            onClick={() => {
                              setJustPostedProduct(p);
                              setReceiptRefNo(`9023${Math.floor(100000000 + Math.random() * 900000000)}`);
                              setStage('payment');
                              setActiveTab('post');
                            }}
                            className="w-full bg-[#007CF0] hover:bg-blue-600 text-white text-xs font-bold py-1.5 rounded-lg text-center"
                          >
                            Pay ₱{listingFee.toLocaleString()} GCash Listing Fee
                          </button>
                        )}

                        {p.status === 'pending_approval' && matchingReceipt && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-1.5 leading-relaxed">
                            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span>Paid Ref: <b>{matchingReceipt.referenceNo}</b></span>
                              <span className="block text-[10px] text-amber-700 font-medium">Head Office review pending. Approved shortly.</span>
                            </div>
                          </div>
                        )}

                        {p.status === 'rejected' && matchingReceipt && (
                          <div className="text-[11px] text-red-950 bg-red-50 border border-red-200 rounded-lg p-2">
                            <span className="font-semibold block text-[10px] text-red-700">Listing Rejection Details:</span>
                            <p className="text-[10px] italic mt-0.5">"{matchingReceipt.rejectionReason || 'No details provided'}"</p>
                          </div>
                        )}

                        {p.status === 'active' && (
                          <div className="flex justify-between items-center text-xs text-slate-500 bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg">
                            <span className="text-slate-400 font-medium flex items-center gap-1 text-[10px]">
                              <Eye className="w-3 h-3 text-slate-400" />
                              {p.views} views
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded uppercase">Public Viewable</span>
                          </div>
                        )}
                        
                        {p.status === 'sold' && (
                          <div className="text-center text-[11px] text-slate-500 font-medium bg-slate-100 p-2 rounded-lg border border-slate-200">
                            Transaction complete. Cash on Delivery finalized.
                          </div>
                        )}

                        {/* Seller Item Delete Action button */}
                        {confirmDeleteId === p.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mt-1 space-y-2 select-none">
                            <p className="text-[11px] text-red-950 font-black text-center">Permanently delete this listing?</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold py-1.5 rounded-lg border border-slate-200 transition active:scale-95 cursor-pointer text-center"
                              >
                                Keep Ad
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onDeleteProduct) {
                                    onDeleteProduct(p.id);
                                  }
                                  setConfirmDeleteId(null);
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-1.5 rounded-lg transition shadow shadow-red-500/10 active:scale-95 cursor-pointer text-center"
                              >
                                Delete Ad
                              </button>
                            </div>
                          </div>
                        ) : (
                          onDeleteProduct && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="w-full mt-1 bg-red-50/70 hover:bg-red-100 border border-red-100 hover:border-red-200 text-red-600 text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-bold transition duration-200 active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Delete Listing
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'post' && (
          <div className="bg-white/50 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl overflow-hidden max-w-3xl mx-auto">
            <div className="border-b border-white/30 px-6 py-4 bg-slate-900/80 backdrop-blur-xs text-white flex justify-between items-center">
              <div>
                <h2 className="text-md font-extrabold tracking-tight">Create Listing Pipeline</h2>
                <p className="text-slate-300 text-xs">A listing charge of <b>₱{listingFee.toLocaleString()}</b> via GCash is required to prevent bot spam.</p>
              </div>
              <div className="flex bg-slate-850/65 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold text-slate-300 gap-1.5 uppercase font-mono border border-slate-805/30">
                <span className={stage === 'details' ? 'text-amber-400 font-black' : ''}>1. Information</span>
                <span>/</span>
                <span className={stage === 'payment' ? 'text-amber-400 font-black' : ''}>2. GCash Fee</span>
              </div>
            </div>

            {currentUser.kycStatus !== 'verified' ? (
              <div className="p-12 text-center bg-white/70 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center border border-rose-105">
                  <ShieldAlert className="w-9 h-9 text-rose-600 animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-slate-900 font-extrabold text-sm tracking-tight text-center">KYC Identity Check Active</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold text-center">
                    To maintain Market PH as a secure, scam-free community, any posting actions are restricted until your physical Philippine ID and camera selfie are verified and approved by an admin.
                  </p>
                </div>
                <div className="pt-2.5 bg-rose-50/50 rounded-2xl p-3.5 max-w-xs border border-rose-100/50 text-[10px] text-rose-700 font-semibold leading-normal">
                  Active Status: <span className="font-extrabold capitalize">{currentUser.kycStatus || 'unverified'}</span>
                  {currentUser.kycStatus === 'rejected' && (
                    <p className="text-rose-650 mt-1 font-bold">Reason: "{currentUser.kycRejectionReason || 'Submitted image was blurred or unreadable'}"</p>
                  )}
                  {currentUser.kycStatus === 'pending' && (
                    <p className="text-amber-800 mt-1 font-semibold">Admins are currently auditing your files. Access will align shortly.</p>
                  )}
                </div>
              </div>
            ) : stage === 'details' ? (
              <form onSubmit={handleCreateProductInit} className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-700 text-xs font-bold uppercase mb-1">Item Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vintage Leather Jacket, iPhone 12 Pro"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/60 border border-white/50 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium placeholder:text-slate-400"
                        id="form-title"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-xs font-bold uppercase mb-1">Price (₱)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 1500"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-white/60 border border-white/50 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-slate-800 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 text-xs font-bold uppercase mb-1">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white/60 border border-white/50 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-slate-700 capitalize cursor-pointer"
                        >
                          {CATEGORIES.filter(c => c.id !== 'all').map((c) => (
                            <option key={c.id} value={c.id} className="bg-white text-slate-800">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-xs font-bold uppercase mb-1">Condition</label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value as any)}
                          className="w-full bg-white/60 border border-white/50 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="new" className="bg-white text-slate-800">Brand New (Sealed)</option>
                          <option value="like_new" className="bg-white text-slate-800">Like New (Mint)</option>
                          <option value="good" className="bg-white text-slate-800">Good (Lightly Used)</option>
                          <option value="used" className="bg-white text-slate-800">Used (Pristine/Functional)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 text-xs font-bold uppercase mb-1">Preferred Location</label>
                        <select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-white/60 border border-white/50 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-slate-700 cursor-pointer"
                        >
                          {PHILIPPINE_LOCATIONS.map((loc) => (
                            <option key={loc} value={loc} className="bg-white text-slate-800">
                              {loc}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Color Customizer Option Tag Builder */}
                    <div className="bg-amber-50/50 border border-amber-500/10 rounded-2xl p-4.5 space-y-3">
                      <div>
                        <span className="block text-slate-800 text-xs font-black uppercase tracking-wide">Available Colors & Variants</span>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Define customization choices for buyers on checkout. Click "x" to remove a preset or add yours.</p>
                      </div>

                      {/* Badges Container */}
                      {availableColors.length === 0 ? (
                        <div className="text-[10px] text-slate-400 font-semibold italic py-1">No colors set (Default Charcoal Black is assumed)</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 font-sans">
                          {availableColors.map((col) => (
                            <div key={col} className="bg-white border border-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-750 uppercase tracking-wide shadow-xs shrink-0 select-none">
                              <span>{col}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(col)}
                                className="text-slate-400 hover:text-red-650 transition cursor-pointer text-[12px] font-black leading-none"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Custom Color Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Midnight Black, Pearl White"
                          value={newColorInput}
                          onChange={(e) => setNewColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddColor();
                            }
                          }}
                          className="bg-white border border-slate-205 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none w-full font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleAddColor}
                          className="bg-[#007DFE] hover:bg-blue-600 text-white text-[11px] font-black px-4 py-1.5 rounded-xl transition cursor-pointer flex items-center shrink-0"
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Selector presets with Local Manual Click and Drag-and-Drop Upload */}
                  <div className="space-y-4">
                    <label className="block text-slate-700 text-xs font-bold uppercase">Item Visuals & Photos (Up to 5)</label>
                    
                    {/* Drag and Drop Zone */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-3xl p-5 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[145px] ${
                        dragActive 
                          ? 'border-amber-600 bg-amber-50/20 shadow-md scale-[1.01]' 
                          : uploadedImages.length > 0
                            ? 'border-emerald-500 bg-emerald-50/10'
                            : 'border-white/50 bg-white/10 hover:border-white/80'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="product-file-upload" 
                        accept="image/*" 
                        multiple
                        className="hidden" 
                        onChange={handleFileChange}
                        disabled={uploadedImages.length >= 5}
                      />
                      
                      <label 
                        htmlFor="product-file-upload" 
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer group py-2"
                      >
                        <div className="p-3 rounded-2xl bg-amber-100/50 text-amber-800 mb-2 group-hover:scale-110 transition duration-300 border border-amber-500/10">
                          <Upload className="w-5 h-5 text-amber-700 animate-pulse" />
                        </div>
                        <p className="text-xs font-extrabold text-slate-800">
                          {uploadedImages.length >= 5 
                            ? 'Maximum 5 images reached' 
                            : 'Drag & drop images here, or browse files'
                          }
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 select-none font-semibold">
                          Allows uploading up to 5 photos (PNG, JPG, WebP)
                        </p>
                      </label>
                    </div>

                    {/* Slot Strip */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold block text-slate-500 uppercase tracking-wide">
                        Uploaded Photos ({uploadedImages.length} of 5)
                      </span>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, slotIndex) => {
                          const img = uploadedImages[slotIndex];
                          if (img) {
                            return (
                              <div key={slotIndex} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xs group animate-scale-up">
                                <img src={img} alt={`Slot ${slotIndex + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute top-1 left-1 bg-slate-900/70 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                                  {slotIndex === 0 ? "Cover" : `#${slotIndex + 1}`}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(slotIndex)}
                                  className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow cursor-pointer transition"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <label
                                key={slotIndex}
                                htmlFor={slotIndex === uploadedImages.length ? "product-file-upload" : undefined}
                                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 text-center cursor-pointer transition duration-300 ${
                                  slotIndex === uploadedImages.length
                                    ? 'border-amber-400/70 bg-amber-50/5 hover:border-amber-500'
                                    : 'border-white/20 bg-white/5 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <Plus className="w-4 h-4 text-slate-400" />
                                <span className="text-[8px] font-bold mt-1">Empty</span>
                              </label>
                            );
                          }
                        })}
                      </div>
                    </div>

                    {/* Removed instant image presets selector */}
                  </div>
                </div>

                {/* Listing description + Gemini Pitch Creator */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-700 text-xs font-bold uppercase">Listing Description</label>
                    <button
                      type="button"
                      onClick={handleAIGeneratePitch}
                      disabled={isGeneratingPitch}
                      className="bg-amber-100/60 border border-amber-200/10 hover:bg-amber-200 text-amber-900 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
                      {isGeneratingPitch ? "Consulting Gemini..." : "Smart Taglish Copywriter"}
                    </button>
                  </div>

                  {pitchError && (
                    <p className="text-red-600 text-xs bg-red-50 border border-red-200 p-2.5 rounded-lg font-medium">{pitchError}</p>
                  )}

                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter item details, condition description, meet up instructions, and warranty terms. Or check out our Smart Taglish Copywriter to write a professional high-converting marketplace pitch in 1 click!"
                    className="w-full bg-white/60 border border-white/50 p-3 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans font-medium text-slate-850 placeholder:text-slate-450"
                  />
                </div>

                {/* Final step buttons */}
                <div className="pt-4 border-t border-white/30 flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#007DFE] hover:bg-blue-600 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                  >
                    Post & Proceed to GCash Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* Stage 2: GCash portal checkout */
              <div className="p-6 md:p-8 space-y-6">
                {!submissionComplete ? (
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="bg-blue-50/60 backdrop-blur-md border border-blue-200/40 rounded-2xl p-4 flex gap-3 text-xs text-blue-900">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold block">₱{listingFee.toLocaleString()} GCash listing fee invoice generated</span>
                        <span>Item: <b>{justPostedProduct?.title}</b> is currently locked in queue. Head Office will instantly check, review, and approve the listing to live feed once payment reference is processed below.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Interactive sandbox pay simulation */}
                      <div className="border border-white/50 backdrop-blur-md rounded-2xl p-5 space-y-4 bg-white/40 relative overflow-hidden">
                        <div className="bg-blue-700/80 backdrop-blur-md text-white -mx-5 -mt-5 px-5 py-3 flex justify-between items-center border-b border-white/20">
                          <span className="text-xs font-bold uppercase tracking-wider">Simulated GCash Wallet</span>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase font-bold">Interactive Gateway</span>
                        </div>

                        <div className="text-center space-y-3">
                          <span className="text-xs text-slate-655 block font-extrabold uppercase tracking-widest">Market PH Official Merchant Wallet QR</span>
                          
                          {/* Beautiful direct representation of the uploaded GCash QR code - Enlarged */}
                          <div 
                            onClick={() => setShowFullQRModal(true)}
                            className="relative group max-w-[340px] mx-auto rounded-[32px] overflow-hidden border-4 border-[#007DFE] shadow-2xl shadow-[#007DFE]/30 cursor-pointer transition transform hover:scale-[1.03] active:scale-98 bg-white p-3"
                          >
                            <img 
                              src={gcashQrPayment} 
                              alt="GCash QR Payment BA***I J* E." 
                              className="w-full object-cover rounded-2xl" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-1000/0 group-hover:bg-slate-900/15 transition flex flex-col items-center justify-center p-4">
                              <span className="bg-slate-950/95 backdrop-blur-sm text-white text-xs font-black px-4.5 py-2.5 rounded-2xl opacity-100 transition shadow-xl border border-white/15 flex items-center gap-1.5 scale-105">
                                <Eye className="w-4 h-4 text-blue-400" /> Tap to Super-Size Scan
                              </span>
                            </div>
                            {/* Scanning corner marks visually indicating it is ready to be scanned */}
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-[#007DFE] rounded-tl-md"></div>
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-[#007DFE] rounded-tr-md"></div>
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-[#007DFE] rounded-bl-md"></div>
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-[#007DFE] rounded-br-md"></div>
                          </div>
                          
                          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 max-w-[340px] mx-auto space-y-1">
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Recipient GCash Account</p>
                            <p className="font-black text-slate-900 text-sm">BA***I J* E.</p>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mt-1">Mobile Number</p>
                            <p className="font-extrabold text-blue-600 text-base tracking-wider select-all bg-blue-50 border border-blue-200/50 rounded-xl px-3 py-1 inline-block">09472063325</p>
                          </div>
                          
                          <span className="inline-flex items-center gap-1.5 text-[11px] bg-amber-50 text-amber-850 px-3 py-1.5 rounded-xl font-extrabold border border-amber-200/50 animate-pulse">
                            💡 Tip: Tap the QR code to view it in full screen!
                          </span>
                        </div>

                        <div className="border-t border-dashed border-white/40 pt-3 space-y-3">
                          <span className="text-[10px] text-slate-550 block font-bold uppercase leading-none text-center">Simulator Tools</span>
                          <button
                            type="button"
                            onClick={handleAutoGenerateGCashReceiptMock}
                            disabled={isGeneratingReceipt}
                            className="w-full bg-[#007DFE]/10 hover:bg-[#007DFE]/20 text-[#007DFE] border border-[#007DFE]/25 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-sky-500 animate-spin-slow" />
                            {isGeneratingReceipt ? "Engraving e-receipt..." : "Mock Auto-Generate GCash Receipt Screenshot"}
                          </button>
                          
                          <p className="text-[10px] text-slate-500 text-center text-balance font-medium">Creates an instant high-fidelity checkout image with the reference code for our Admin and Gemini API to verify!</p>
                        </div>
                      </div>

                      {/* Reference code and attachment upload */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 text-xs font-bold uppercase mb-1">GCash Reference Trace Number (13 digits)</label>
                          <input
                            type="text"
                            required
                            maxLength={13}
                            placeholder="e.g. 5018319234812"
                            value={receiptRefNo}
                            onChange={(e) => setReceiptRefNo(e.target.value)}
                            className="w-full bg-white/60 border border-white/50 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <span className="text-slate-700 text-xs font-bold uppercase block mb-1">Payment Receipt Proof Screenshot</span>
                          {customReceiptBase64 ? (
                            <div className="border border-white/55 rounded-2xl overflow-hidden shadow-sm relative group bg-white/40 max-h-52 flex justify-center backdrop-blur-sm">
                              <img src={customReceiptBase64} alt="E-Receipt Proof" className="object-contain max-h-52" referrerPolicy="no-referrer" />
                              <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                                Mock Receipt Loaded ✓
                              </div>
                              <button
                                type="button"
                                onClick={() => setCustomReceiptBase64('')}
                                className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-xl shadow cursor-pointer"
                              >
                                Re-upload / Clear
                              </button>
                            </div>
                          ) : (
                            <div className="h-40 border-2 border-dashed border-white/40 bg-white/20 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-slate-500 p-4 text-center shadow-xs">
                              <Image className="w-8 h-8 text-slate-400 mb-1" />
                              <span className="text-xs font-bold text-slate-700">No screenshot loaded</span>
                              <span className="text-[10px] text-slate-500 mt-1 font-medium select-none">Tap 'Mock Auto-Generate GCash Receipt Screenshot' near the QR side to fill instantly!</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              // Reset state, but don't delete unpaid product yet. Just return to dashboard
                              resetPostForm();
                            }}
                            className="flex-1 bg-white/40 hover:bg-white/50 border border-white/40 text-slate-700 text-sm font-semibold py-2.5 rounded-xl cursor-pointer transition active:scale-95"
                          >
                            Cancel Payment
                          </button>
                          
                          <button
                            type="submit"
                            disabled={!receiptRefNo || !customReceiptBase64}
                            className="flex-1 bg-[#007DFE] hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-extrabold py-2.5 rounded-xl shadow-lg shadow-blue-500/15 transition active:scale-95 cursor-pointer"
                          >
                            Submit Proof to Admin
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Success submission pane */
                  <div className="p-8 text-center space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                    <div>
                      <h3 className="text-slate-800 text-lg font-bold">Proof of Fee Payment Submitted!</h3>
                      <p className="text-slate-550 text-xs mt-1">
                        Submitted Reference Trace: <span className="font-mono font-bold text-slate-800 bg-white/50 px-2 py-0.5 rounded border border-white/40">{receiptRefNo}</span>
                      </p>
                    </div>
                    <p className="text-slate-650 text-xs leading-relaxed max-w-sm mx-auto font-medium">
                      Your item has been placed in the <b>Pending Approval</b> catalog. To fast-track verification, switch the active profile role to <b>Admin Panel</b> at the top bar to inspect, audit with Gemini OCR, and authorize payment!
                    </p>
                    <button
                      onClick={resetPostForm}
                      className="bg-[#007DFE] hover:bg-blue-600 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl transition shadow shadow-blue-500/15 cursor-pointer"
                    >
                      Return to Listings Feed
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 animate-fade-in">
              Incoming Buyer Purchases (Cash on Delivery / GCash)
            </h2>

            {sellerOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 rounded-2xl text-center space-y-2">
                <p className="text-slate-400 text-xs">No orders have been received yet for your items.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((order) => {
                  return (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                      {/* Top identity row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#007CF0]">ORDER_ID: {order.id.toUpperCase()}</span>
                          <p className="text-xs text-slate-500">
                            Buyer: <span className="font-semibold text-slate-700">{order.buyerName}</span> &middot; Ph: {order.contactPhone}
                          </p>
                        </div>
                        {/* Status tracker details */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(order.createdAt).toLocaleString('en-PH')}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Product deal line */}
                      <div className="flex gap-4">
                        <img 
                          src={order.productImageUrl} 
                          alt={order.productTitle} 
                          className="w-16 h-16 object-cover rounded-xl border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs leading-snug">{order.productTitle}</h4>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold font-mono">
                              ₱{order.productPrice.toLocaleString()}
                            </span>
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold uppercase">
                              Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
                            </span>
                            {order.selectedColor && (
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold uppercase">
                                Color: {order.selectedColor}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
                            📍 Delivery Address: <span className="font-medium text-slate-700">{order.deliveryAddress}</span>
                          </p>
                        </div>
                      </div>

                      {/* Seller execution statuses */}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 active:scale-95 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel Order
                              </button>
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                Ship via Grab/Lalamove COD
                              </button>
                            </div>
                          )}

                          {order.status === 'shipped' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Confirm Delivery & Collect COD Cash
                            </button>
                          )}

                          {order.status === 'delivered' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Complete Transaction (Close Order)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header and Summary stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Seller Orders & Transaction History
                </h2>
                <p className="text-slate-500 text-xs font-semibold">
                  Comprehensive history of completed, pending, and cancelled buyer orders.
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">STATUS:</span>
                <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/40">
                  <button
                    onClick={() => setFilterTxStatus('all')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'all' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-white/40'
                    }`}
                  >
                    All ({sellerOrders.length})
                  </button>
                  <button
                    onClick={() => setFilterTxStatus('completed')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'completed' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-white/40'
                    }`}
                  >
                    Completed ({sellerOrders.filter(o => o.status === 'completed').length})
                  </button>
                  <button
                    onClick={() => setFilterTxStatus('pending')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'pending' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-white/40'
                    }`}
                  >
                    Pending ({sellerOrders.filter(o => o.status === 'pending' || o.status === 'shipped' || o.status === 'delivered').length})
                  </button>
                  <button
                    onClick={() => setFilterTxStatus('cancelled')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'cancelled' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-white/40'
                    }`}
                  >
                    Cancelled ({sellerOrders.filter(o => o.status === 'cancelled').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Micro Dashboard stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider block">Completed Transactions</span>
                  <span className="text-xl font-black text-emerald-950 font-mono">₱{
                    sellerOrders
                      .filter(o => o.status === 'completed')
                      .reduce((sum, o) => sum + o.productPrice, 0)
                      .toLocaleString()
                  }</span>
                  <span className="text-[9px] text-emerald-600 block font-semibold mt-1">
                    {sellerOrders.filter(o => o.status === 'completed').length} closed orders
                  </span>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500/70 shrink-0" />
              </div>

              <div className="bg-amber-50/70 border border-amber-150 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 font-black uppercase tracking-wider block">Pending Collections</span>
                  <span className="text-xl font-black text-amber-950 font-mono">₱{
                    sellerOrders
                      .filter(o => o.status === 'pending' || o.status === 'shipped' || o.status === 'delivered')
                      .reduce((sum, o) => sum + o.productPrice, 0)
                      .toLocaleString()
                  }</span>
                  <span className="text-[9px] text-amber-600 block font-semibold mt-1">
                    {sellerOrders.filter(o => o.status === 'pending' || o.status === 'shipped' || o.status === 'delivered').length} in progress
                  </span>
                </div>
                <Clock className="w-8 h-8 text-amber-500/70 shrink-0" />
              </div>

              <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-rose-800 font-black uppercase tracking-wider block">Cancelled Orders Value</span>
                  <span className="text-xl font-black text-rose-950 font-mono">₱{
                    sellerOrders
                      .filter(o => o.status === 'cancelled')
                      .reduce((sum, o) => sum + o.productPrice, 0)
                      .toLocaleString()
                  }</span>
                  <span className="text-[9px] text-rose-600 block font-semibold mt-1">
                    {sellerOrders.filter(o => o.status === 'cancelled').length} system cancelled
                  </span>
                </div>
                <X className="w-8 h-8 text-rose-400 shrink-0" />
              </div>
            </div>

            {/* Filter Search Input */}
            <div className="bg-white/45 backdrop-blur-md p-3 rounded-2xl border border-white/40 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search history by Order ID, Buyer, product title, landmarks, GCash reference..."
                value={searchTxQuery}
                onChange={(e) => setSearchTxQuery(e.target.value)}
                className="bg-transparent border-0 outline-none focus:outline-none w-full text-xs text-slate-800 font-semibold placeholder:text-slate-400 leading-none"
              />
              {searchTxQuery && (
                <button 
                  onClick={() => setSearchTxQuery('')} 
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* List Table of Transactions */}
            {(() => {
              const matchingTx = sellerOrders.filter(o => {
                // Status filtering matching complete/pending/cancelled criteria
                if (filterTxStatus === 'completed' && o.status !== 'completed') return false;
                if (filterTxStatus === 'pending' && !['pending', 'shipped', 'delivered'].includes(o.status)) return false;
                if (filterTxStatus === 'cancelled' && o.status !== 'cancelled') return false;

                // Search query matching
                if (!searchTxQuery.trim()) return true;
                const q = searchTxQuery.toLowerCase();
                return (
                  o.id.toLowerCase().includes(q) ||
                  o.buyerName.toLowerCase().includes(q) ||
                  o.productTitle.toLowerCase().includes(q) ||
                  (o.referenceNo && o.referenceNo.toLowerCase().includes(q)) ||
                  o.deliveryAddress.toLowerCase().includes(q)
                );
              });

              if (matchingTx.length === 0) {
                return (
                  <div className="bg-white/60 border border-slate-200 rounded-2xl text-center p-12 space-y-2">
                    <p className="text-slate-400 text-xs font-semibold">No records match your criteria.</p>
                  </div>
                );
              }

              return (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ledger</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Information</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing & Logistics</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">GCash Reference No.</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clearance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {matchingTx.map((o) => {
                          const formattedDate = new Date(o.createdAt).toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <tr key={o.id} className="hover:bg-slate-50/50 transition">
                              {/* Order ID & date */}
                              <td className="px-5 py-4 text-slate-750">
                                <span className="font-extrabold text-[#007CF0] block text-[10px]">#{o.id.toUpperCase()}</span>
                                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{formattedDate}</span>
                                <div className="mt-1 text-[10px] text-slate-500 font-medium">
                                  Buyer: <b className="text-slate-700">{o.buyerName}</b>
                                </div>
                              </td>

                              {/* Product description */}
                              <td className="px-5 py-4 text-slate-755">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={o.productImageUrl} 
                                    alt={o.productTitle} 
                                    className="w-10 h-10 rounded-lg object-cover border shrink-0 font-medium" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-slate-800 text-xs truncate max-w-[170px]">{o.productTitle}</h4>
                                    <span className="text-[10px] text-slate-450 block mt-0.5 truncate max-w-[170px] font-medium">📍 {o.deliveryAddress}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Pricing details */}
                              <td className="px-5 py-4">
                                <span className="font-black text-slate-900 font-mono block">₱{o.productPrice.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500 block capitalize mt-0.5 font-semibold">
                                  {o.paymentMethod.toUpperCase()} &middot; {o.paymentStatus}
                                </span>
                                {o.selectedColor && (
                                  <span className="text-[9px] text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block uppercase">
                                    Color: {o.selectedColor}
                                  </span>
                                )}
                              </td>

                              {/* GCash Reference Code */}
                              <td className="px-5 py-4 font-mono">
                                {o.referenceNo ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-xl text-[11px] uppercase tracking-wider select-all">
                                      {o.referenceNo}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px] font-semibold">
                                    {o.paymentMethod === 'cod' ? '— (Cash on Delivery)' : 'Unspecified'}
                                  </span>
                                )}
                              </td>

                              {/* Order execution status */}
                              <td className="px-5 py-4">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block ${
                                  o.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  o.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                  o.status === 'delivered' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                  o.status === 'shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                  'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Full resolution GCash QR code reader lightbox - Super-sized for scanner compatibility */}
      {showFullQRModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in cursor-zoom-out select-none" 
          id="gcash-qr-modal"
          onDoubleClick={() => setShowFullQRModal(false)}
          title="Double-click to return to normal size"
        >
          <div 
            className="relative bg-[#007DFE] rounded-[36px] max-w-xl w-full p-4 md:p-6 shadow-2xl border border-white/30 animate-scale-up cursor-default"
            onDoubleClick={(e) => {
              // Ensure double-click gesture on content area triggers close but prevents text disruptions
              e.stopPropagation();
              setShowFullQRModal(false);
            }}
          >
            
            {/* Top-left visual go back navigation badge */}
            <button
              type="button"
              onClick={() => setShowFullQRModal(false)}
              className="absolute top-5 left-5 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full px-3.5 py-2 cursor-pointer transition shadow-md active:scale-95 z-20 flex items-center justify-center gap-1.5 text-xs font-black"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFullQRModal(false)}
              className="absolute top-5 right-5 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full p-2.5 cursor-pointer transition shadow-md active:scale-95 z-20"
              title="Close QR display"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-4 pt-8">
              <div className="text-center text-white pt-2">
                <span className="bg-white text-[#007DFE] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md inline-block mb-2">
                  Official Merchant Gateway • ₱{listingFee.toLocaleString()} Listing Fee
                </span>
                <p className="text-xs text-white/90 font-semibold mb-1">Please scan this direct QR code or take a screenshot to upload on GCash.</p>
                <p className="text-[10px] text-blue-200 font-bold tracking-wide select-none animate-pulse">
                  💡 Double-click anywhere to return to normal size
                </p>
              </div>
              
              {/* Massive White Card specifically designed for perfect barcode/QR-Code scanning contrast */}
              <div 
                className="bg-white rounded-[28px] overflow-hidden p-6 md:p-8 shadow-2xl relative group border-4 border-white/10 cursor-zoom-out"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setShowFullQRModal(false);
                }}
                title="Double click to go back"
              >
                <div className="absolute top-3 left-3 bg-[#007DFE] text-white text-[10px] px-3 py-1 rounded-xl font-black tracking-wider shadow-xs">
                  GCash Payments
                </div>
                
                {/* Visual scanner guides to aid the user's focus */}
                <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-xl pointer-events-none"></div>
                <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-xl pointer-events-none"></div>
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-xl pointer-events-none"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-xl pointer-events-none"></div>
                
                <img 
                  src={gcashQrPayment} 
                  alt="GCash Official Merchant QR" 
                  className="w-full max-w-[420px] h-auto rounded-lg mx-auto transform transition duration-300 hover:scale-[1.01]"
                />
                
                <div className="text-center mt-4 border-t border-slate-100 pt-3">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest animate-pulse">
                    READY FOR IMMEDIATE SCANNING
                  </span>
                </div>
              </div>
              
              {/* Detailed Payment Recipient metadata card with user's specific number */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center text-white border border-white/10 grid grid-cols-3 gap-3">
                <div className="space-y-1 border-r border-white/15 pr-2 flex flex-col justify-center">
                  <span className="text-[10px] text-white/80 uppercase tracking-widest font-black">Recipient Name</span>
                  <p className="text-sm font-black tracking-wide text-white">BA***I J* E.</p>
                </div>
                <div className="space-y-1 border-r border-white/15 px-2 flex flex-col justify-center">
                  <span className="text-[10px] text-white/80 uppercase tracking-widest font-black">GCash Number</span>
                  <p className="text-sm font-mono font-black select-all text-yellow-300 bg-black/20 py-0.5 px-1 rounded">09472063325</p>
                </div>
                <div className="space-y-1 pl-2 flex flex-col justify-center">
                  <span className="text-[10px] text-white/80 uppercase tracking-widest font-black">Exact Amount</span>
                  <p className="text-lg font-black text-emerald-300 bg-emerald-950/25 py-0.5 rounded">₱ {listingFee.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFullQRModal(false)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white font-extrabold text-sm py-4 rounded-2xl border border-white/10 shadow-md transition active:scale-98 cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                  Go Back to Panel
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullQRModal(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-[#007DFE] font-extrabold text-sm py-4 rounded-2xl shadow-xl shadow-black/15 transition active:scale-98 cursor-pointer text-center block"
                >
                  Dismiss Fullscreen Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

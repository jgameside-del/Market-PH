/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Filter, Star, MessageSquare, ShoppingBag, Send, ChevronRight, X, Sparkles, CheckCircle, Smartphone,
  Clock, Calendar, CheckCircle2, Truck
} from 'lucide-react';
import { Product, User, Message, Order, Review, AppNotification } from '../types';
import { CATEGORIES, PHILIPPINE_LOCATIONS } from '../data';

interface BuyerDashboardProps {
  products: Product[];
  currentUser: User;
  allMessages: Message[];
  orders: Order[];
  reviews: Review[];
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  onPlaceOrder: (orderData: Omit<Order, 'id' | 'buyerId' | 'buyerName' | 'status' | 'createdAt'>) => Order;
  onPostReview: (productId: string, rating: number, comment: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: Order['status']) => void;
  listingFee?: number;
}

export default function BuyerDashboard({
  products,
  currentUser,
  allMessages,
  orders,
  reviews,
  onSendMessage,
  onPlaceOrder,
  onPostReview,
  onUpdateOrderStatus,
  listingFee = 20
}: BuyerDashboardProps) {
  // Navigation states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Transaction history filter & view states
  const [viewMode, setViewMode] = useState<'listings' | 'transactions'>('listings');
  const [searchTxQuery, setSearchTxQuery] = useState('');
  const [filterTxStatus, setFilterTxStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedProduct]);

  // Active Interactive Overlays
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Chat window states
  const [typedMessage, setTypedMessage] = useState('');
  const [isSmartAgentReplying, setIsSmartAgentReplying] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Review states
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');

  // Checkout inputs
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser.gcashNumber || '09170000000');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'gcash'>('cod');
  const [checkoutRefCode, setCheckoutRefCode] = useState('');
  const [selectedColor, setSelectedColor] = useState('Charcoal Black');
  const [checkoutCompleteOrder, setCheckoutCompleteOrder] = useState<Order | null>(null);

  // Auto-align selected color when product changes
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.colors && selectedProduct.colors.length > 0) {
        setSelectedColor(selectedProduct.colors[0]);
      } else {
        setSelectedColor('Charcoal Black');
      }
    }
  }, [selectedProduct]);

  // Filter approved listings
  const activeProducts = products.filter(p => p.status === 'active');

  const filteredProducts = activeProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !selectedLocation || p.location === selectedLocation;
    return matchesCategory && matchesSearch && matchesLocation;
  });

  // Filter messages for active discussion
  const activeChatMessages = selectedProduct 
    ? allMessages.filter(m => 
        m.productId === selectedProduct.id &&
        ((m.senderId === currentUser.id && m.receiverId === selectedProduct.sellerId) || 
         (m.senderId === selectedProduct.sellerId && m.receiverId === currentUser.id))
      )
    : [];

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, showChatModal]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || typedMessage;
    if (!textToSend.trim() || !selectedProduct) return;

    // Send original user message
    onSendMessage({
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      receiverId: selectedProduct.sellerId,
      text: textToSend,
      productId: selectedProduct.id,
      productInfo: {
        title: selectedProduct.title,
        price: selectedProduct.price,
        imageUrl: selectedProduct.imageUrl
      }
    });

    setTypedMessage('');
    setIsSmartAgentReplying(true);

    // Call the server Gemini Taglish chatbot reply!
    try {
      const response = await fetch('/api/chat-smart-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct,
          history: [...activeChatMessages, { senderId: currentUser.id, senderName: currentUser.fullName, text: textToSend }],
          latestMessage: textToSend,
          responderRole: 'seller'
        })
      });

      const data = await response.json();
      if (data.reply) {
        onSendMessage({
          senderId: selectedProduct.sellerId,
          senderName: selectedProduct.sellerName,
          receiverId: currentUser.id,
          text: data.reply,
          productId: selectedProduct.id,
          isSmartReply: true
        });
      }
    } catch (err) {
      console.error("Failed to generate smart reply:", err);
    } finally {
      setIsSmartAgentReplying(false);
    }
  };

  const handlePlaceCODOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const ordered = onPlaceOrder({
      productId: selectedProduct.id,
      productTitle: selectedProduct.title,
      productPrice: selectedProduct.price,
      productImageUrl: selectedProduct.imageUrl,
      sellerId: selectedProduct.sellerId,
      sellerName: selectedProduct.sellerName,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      deliveryAddress: shippingAddress,
      contactPhone,
      referenceNo: paymentMethod === 'gcash' ? checkoutRefCode || `REF-${Math.floor(10000000000 + Math.random() * 90000000000)}` : undefined,
      selectedColor
    });

    setCheckoutCompleteOrder(ordered);
  };

  const handleCloseCheckout = () => {
    setCheckoutCompleteOrder(null);
    setShippingAddress('');
    setCheckoutRefCode('');
    setSelectedColor('Charcoal Black');
    setShowCheckoutModal(false);
    setSelectedProduct(null);
  };

  const handlePostReviewSubmit = () => {
    if (!selectedProduct || !userComment.trim()) return;
    onPostReview(selectedProduct.id, userRating, userComment);
    setUserComment('');
  };

  return (
    <div className="bg-transparent min-h-screen">
      {/* Search Header Banner */}
      <div className="bg-white/30 backdrop-blur-md rounded-3xl border border-white/40 mt-6 mx-4 md:mx-8 py-12 px-4 shadow-sm relative overflow-hidden text-slate-800">
        <div className="max-w-3xl mx-auto space-y-2 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none text-slate-900 text-balance">
            Hanapin ang Pinakamurang Deals sa Pinas
          </h1>
          <p className="text-slate-600 text-sm max-w-lg mx-auto font-medium">
            Market PH is the local trust portal for P2P trading. All sellers pay a ₱{listingFee.toLocaleString()} security listing fee to guarantee identity authenticity.
          </p>
        </div>

        {/* Input cluster */}
        <div className="max-w-4xl mx-auto bg-white/50 backdrop-blur-lg p-2.5 rounded-3xl border border-white/50 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-2 text-slate-800 mt-6 md:mt-8">
          <div className="md:col-span-5 flex items-center gap-2 px-3 border-b md:border-b-0 md:border-r border-white/40 pb-2 md:pb-0">
            <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search for items, brands, gadgets..."
              className="w-full text-sm outline-none focus:ring-0 placeholder:text-slate-500 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2 px-3 pb-2 md:pb-0">
            <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-sm w-full outline-none text-slate-700 font-bold cursor-pointer"
            >
              <option value="" className="bg-white text-slate-800 font-semibold">Buong Pilipinas (All Locations)</option>
              {PHILIPPINE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-white text-slate-800 font-semibold">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <button className="bg-[#007DFE] hover:bg-blue-600 text-white font-extrabold text-sm w-full py-2.5 md:py-3.5 px-6 rounded-2xl transition shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer">
              Search Area
            </button>
          </div>
        </div>
      </div>      {/* Main categories navigation and item layout */}
      <div className="max-w-7xl mx-auto px-4 mt-8 pb-16 space-y-8">
        {/* Main Section Navigation Switch */}
        <div className="flex border-b border-slate-200 pb-4 justify-between items-center flex-wrap gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setViewMode('listings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition duration-150 cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'listings' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Marketplace
            </button>
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition duration-150 cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'transactions' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <Clock className="w-4 h-4" />
              My Purchases & Transactions
            </button>
          </div>

          {viewMode === 'transactions' && (
            <div className="text-right text-xs text-slate-550 font-bold bg-white/70 border border-slate-200 px-4 py-2 rounded-2xl">
              Total Spend: <b className="text-blue-700 font-mono font-black">₱{
                orders
                  .filter(o => o.buyerId === currentUser.id && o.status !== 'cancelled')
                  .reduce((sum, o) => sum + o.productPrice, 0)
                  .toLocaleString()
              }</b>
            </div>
          )}
        </div>

        {viewMode === 'listings' && (
          <div className="space-y-8 animate-fade-in">
            {/* Category Row Cards */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-2.5 px-5 rounded-2xl flex-shrink-0 font-bold text-xs tracking-wide shadow-xs flex items-center gap-1.5 transition cursor-pointer md:hover:scale-102 ${
                      isActive 
                        ? 'bg-[#007DFE] text-white shadow-md shadow-blue-500/15' 
                        : 'bg-white/40 backdrop-blur-md text-slate-700 hover:bg-white/70 border border-white/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Product listing container */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Listings cleared by Admin</h2>
                <span className="text-slate-400 text-xs font-semibold">{filteredProducts.length} items available</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center space-y-2 border border-slate-200">
                  <h3 className="font-semibold text-slate-700 text-sm">No items match your criteria</h3>
                  <p className="text-slate-400 text-xs">Try selecting a different category, adjusting location, or clearing searches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => {
                    const productReviews = reviews.filter(r => r.productId === p.id);
                    const averageRating = productReviews.length > 0 
                      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
                      : "N/A";

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowChatModal(false);
                          setShowCheckoutModal(false);
                        }}
                        className="bg-white/50 backdrop-blur-md border border-white/45 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:bg-white/75 hover:border-white/60 hover:-translate-y-0.5 hover:shadow-indigo-500/5 transition-all duration-350 flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          {/* Frame image */}
                          <div className="relative aspect-video overflow-hidden bg-white/20 border-b border-white/30">
                            <img 
                              src={p.imageUrl} 
                              alt={p.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-lg capitalize">
                              {p.condition.replace("_", " ")}
                            </span>
                            
                            <div className="absolute bottom-2 right-2 bg-white/70 backdrop-blur-xs text-slate-900 text-[9px] font-bold py-0.5 px-1.5 rounded-lg flex items-center gap-0.5 shadow-sm border border-white/40">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              {averageRating}
                            </div>
                          </div>

                          {/* Info details */}
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 min-h-8">
                                {p.title}
                              </h3>
                            </div>

                            <div className="flex gap-2 items-center text-[10px] text-slate-500">
                              <span className="flex items-center gap-0.5 shrink-0 font-medium">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {p.location.replace("Metro Manila - ", "")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer price */}
                        <div className="px-4 py-3 bg-white/30 border-t border-white/35 flex items-center justify-between">
                          <span className="text-blue-700 text-sm font-extrabold font-mono">
                            ₱{p.price.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-[#007DFE] font-bold bg-blue-100/50 border border-blue-200/20 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                            Secure Seller
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'transactions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header and Summary stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Your Purchased Orders & Transaction Ledger</h3>
                <p className="text-slate-500 text-xs font-semibold">Track, examine, and check verification reference numbers of your active and past marketplace orders.</p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">STATUS:</span>
                <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/40">
                  <button
                    onClick={() => setFilterTxStatus('all')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-650 hover:bg-slate-205'
                    }`}
                  >
                    All ({orders.filter(o => o.buyerId === currentUser.id).length})
                  </button>
                  <button
                    onClick={() => setFilterTxStatus('completed')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-205'
                    }`}
                  >
                    Completed ({orders.filter(o => o.buyerId === currentUser.id && o.status === 'completed').length})
                  </button>
                  <button
                    onClick={() => setFilterTxStatus('pending')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-205'
                    }`}
                  >
                    Pending ({orders.filter(o => o.buyerId === currentUser.id && ['pending', 'shipped', 'delivered'].includes(o.status)).length})
                  </button>
                  <button
                    onClick={() => setFilterTxStatus('cancelled')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                      filterTxStatus === 'cancelled' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-655 hover:bg-slate-205'
                    }`}
                  >
                    Cancelled ({orders.filter(o => o.buyerId === currentUser.id && o.status === 'cancelled').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Micro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-3xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Total Successful Buy</span>
                  <span className="text-xl font-black text-emerald-950 font-mono">₱{
                    orders
                      .filter(o => o.buyerId === currentUser.id && o.status === 'completed')
                      .reduce((sum, o) => sum + o.productPrice, 0)
                      .toLocaleString()
                  }</span>
                  <span className="text-[9px] text-emerald-600 block font-semibold mt-1">
                    {orders.filter(o => o.buyerId === currentUser.id && o.status === 'completed').length} completed deals
                  </span>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500/80 shrink-0" />
              </div>

              <div className="bg-amber-50/70 border border-amber-150 p-4 rounded-3xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Est. In-transit Value</span>
                  <span className="text-xl font-black text-amber-955 font-mono">₱{
                    orders
                      .filter(o => o.buyerId === currentUser.id && ['pending', 'shipped', 'delivered'].includes(o.status))
                      .reduce((sum, o) => sum + o.productPrice, 0)
                      .toLocaleString()
                  }</span>
                  <span className="text-[9px] text-amber-600 block font-semibold mt-1">
                    {orders.filter(o => o.buyerId === currentUser.id && ['pending', 'shipped', 'delivered'].includes(o.status)).length} active trackings
                  </span>
                </div>
                <Truck className="w-8 h-8 text-amber-500/80 shrink-0" />
              </div>

              <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-3xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">Cancelled Purchases</span>
                  <span className="text-xl font-black text-rose-955 font-mono">₱{
                    orders
                      .filter(o => o.buyerId === currentUser.id && o.status === 'cancelled')
                      .reduce((sum, o) => sum + o.productPrice, 0)
                      .toLocaleString()
                  }</span>
                  <span className="text-[9px] text-rose-600 block font-semibold mt-1">
                    {orders.filter(o => o.buyerId === currentUser.id && o.status === 'cancelled').length} stopped orders
                  </span>
                </div>
                <X className="w-8 h-8 text-rose-450 shrink-0" />
              </div>
            </div>

            {/* Filter Search Input */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2.5 shadow-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search purchases by Order ID, Seller, product name, shipping destination address, GCash reference..."
                value={searchTxQuery}
                onChange={(e) => setSearchTxQuery(e.target.value)}
                className="bg-transparent border-0 outline-none w-full text-xs text-slate-800 font-semibold placeholder:text-slate-450 leading-none"
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

            {/* Orders Feed */}
            {(() => {
              const buyerOrders = orders.filter(o => o.buyerId === currentUser.id);
              const filteredTx = buyerOrders.filter(o => {
                // Filter by Status
                if (filterTxStatus === 'completed' && o.status !== 'completed') return false;
                if (filterTxStatus === 'pending' && !['pending', 'shipped', 'delivered'].includes(o.status)) return false;
                if (filterTxStatus === 'cancelled' && o.status !== 'cancelled') return false;

                // Search Query
                if (!searchTxQuery.trim()) return true;
                const q = searchTxQuery.toLowerCase();
                return (
                  o.id.toLowerCase().includes(q) ||
                  o.sellerName.toLowerCase().includes(q) ||
                  o.productTitle.toLowerCase().includes(q) ||
                  (o.referenceNo && o.referenceNo.toLowerCase().includes(q)) ||
                  o.deliveryAddress.toLowerCase().includes(q)
                );
              });

              if (filteredTx.length === 0) {
                return (
                  <div className="bg-white/60 border border-slate-200 rounded-3xl text-center p-14 space-y-2 font-medium">
                    <p className="text-slate-450 text-xs">You have no matching purchase logs matching these criteria.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredTx.map(o => {
                    const formattedDate = new Date(o.createdAt).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={o.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition duration-200">
                        {/* Upper Section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase">ORDER</span>
                            <span className="text-sm font-black text-blue-750 font-mono">#{o.id.toUpperCase()}</span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-350" />
                              {formattedDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                              o.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              o.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                              o.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
                              o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </div>

                        {/* Mid Section (Product & logistics info) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-6 flex gap-4 min-w-0">
                            <img src={o.productImageUrl} alt={o.productTitle} className="w-14 h-14 rounded-2xl object-cover border shrink-0" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-800 text-sm truncate">{o.productTitle}</h4>
                              <p className="text-slate-400 text-[11px] font-bold mt-1">
                                Seller: <span className="text-slate-650">{o.sellerName}</span>
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="bg-slate-100 text-slate-700 font-mono text-[9px] px-1.5 py-0.5 rounded font-black">₱{o.productPrice.toLocaleString()}</span>
                                <span className="bg-blue-50 text-blue-800 font-sans text-[9px] px-1.5 py-0.5 border border-blue-100 rounded uppercase font-extrabold">Payment &middot; {o.paymentMethod.toUpperCase()}</span>
                                {o.selectedColor && (
                                  <span className="bg-amber-50 text-amber-800 font-sans text-[9px] px-1.5 py-0.5 border border-amber-100 rounded uppercase font-black">Color &middot; {o.selectedColor}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Address & reference info */}
                          <div className="md:col-span-6 space-y-1.5 text-[11px] leading-relaxed text-slate-500 font-medium">
                            <p className="truncate">📍 <b className="text-slate-700">Delivery Address:</b> {o.deliveryAddress}</p>
                            <p>📞 <b className="text-slate-700">Contact:</b> <span className="font-mono">{o.contactPhone}</span></p>
                            
                            {/* GCash Reference Code */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-450 font-bold uppercase">GCash Reference No:</span>
                              {o.referenceNo ? (
                                <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-0.5 rounded text-[10px] uppercase select-all">
                                  {o.referenceNo}
                                </span>
                              ) : (
                                <span className="text-slate-405 italic text-[10px] font-bold">
                                  {o.paymentMethod === 'cod' ? '— (Cash on Delivery)' : 'Unspecified'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive buyer cancellation */}
                        {o.status === 'pending' && onUpdateOrderStatus && (
                          <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => {
                                if (window.confirm("Sigurado ka ba na gusto mong i-cancel ang order na ito?")) {
                                  onUpdateOrderStatus(o.id, 'cancelled');
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition cursor-pointer"
                            >
                              Cancel Pending order
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Dynamic Product Detail Overlay Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative animate-scale-up">
            
            {/* Top close button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full z-10 hover:rotate-90 transition inline-block cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Split viewport details */}
            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                
                {/* Visual side */}
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-white/45 aspect-video bg-white/40 shadow-xs relative">
                    <img 
                      src={(selectedProduct.imageUrls && selectedProduct.imageUrls[activeImageIndex]) || selectedProduct.imageUrl} 
                      alt={selectedProduct.title} 
                      className="w-full h-full object-cover transition duration-300 transform hover:scale-101" 
                      referrerPolicy="no-referrer"
                    />
                    {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-slate-900/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Image {activeImageIndex + 1} of {selectedProduct.imageUrls.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-start">
                      {selectedProduct.imageUrls.map((imgUrl, thumbIdx) => (
                        <button
                          key={thumbIdx}
                          onClick={() => setActiveImageIndex(thumbIdx)}
                          className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition active:scale-95 cursor-pointer flex-shrink-0 ${
                            activeImageIndex === thumbIdx ? 'border-[#007DFE]' : 'border-slate-200 hover:border-slate-350'
                          }`}
                        >
                          <img src={imgUrl} alt={`Thumbnail ${thumbIdx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="bg-white/50 border border-white/50 backdrop-blur-md rounded-2xl p-4 space-y-2 shadow-xs">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold leading-none">Security Clearance Trace</span>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                      <span>GCash Trace Reference:</span>
                      <span className="font-extrabold text-slate-800">{selectedProduct.gcashReceiptRef || 'Cleared by Head Admin Override'}</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 flex items-center gap-1 font-mono">
                      <span>Verification Status:</span>
                      <span className="font-bold uppercase bg-emerald-100/60 pinas-badge px-2 py-0.5 rounded-lg border border-emerald-500/10">PASSED & AUTHENTIC</span>
                    </div>
                  </div>
                </div>

                {/* Text meta side */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="bg-blue-100/60 border border-blue-200/10 text-blue-800 text-[10px] font-extrabold px-2 py-1 rounded-xl uppercase tracking-wider">
                        {selectedProduct.category}
                      </span>
                      <span className="bg-amber-100/60 border border-amber-200/10 text-amber-800 text-[10px] font-extrabold px-2 py-1 rounded-xl capitalize tracking-wider">
                        {selectedProduct.condition.replace("_", " ")}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                      {selectedProduct.title}
                    </h2>
                    <h3 className="text-xl font-black text-blue-700 font-mono leading-none">₱{selectedProduct.price.toLocaleString()}</h3>
                    
                    <div className="pt-2 flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>Prefered Location: <b>{selectedProduct.location}</b></span>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-white/30">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Seller Remarks</span>
                      <p className="text-slate-700 text-xs leading-relaxed font-sans mt-1 bg-white/40 p-2.5 rounded-xl border border-white/40 shadow-xs">
                        "{selectedProduct.description}"
                      </p>
                    </div>
                  </div>

                  {/* Button bar */}
                  <div className="pt-4 border-t border-white/30 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowChatModal(true)}
                      className="bg-slate-900/95 hover:bg-slate-900 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      Chat with Seller (AI Smart Node)
                    </button>
                    <button
                      onClick={() => {
                        setShippingAddress(`12A, Tower 3, Avida Towers, ${selectedProduct.location.substring(selectedProduct.location.indexOf('-') + 1)}`);
                        setShowCheckoutModal(true);
                      }}
                      className="bg-[#007DFE] hover:bg-blue-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-blue-500/15 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Buy (Cash On Delivery)
                    </button>
                  </div>
                </div>

              </div>

              {/* Collapsible details for Reviews / Ratings */}
              <div className="bg-white/40 px-6 py-5 border-t border-white/30 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Product Ratings & Reviews</h4>
                  {reviews.filter(r => r.productId === selectedProduct.id).length === 0 ? (
                    <div className="text-slate-500 text-xs p-4 bg-white/50 rounded-xl border border-white/40 text-center">
                      No customer reviews submitted yet. Be the first to trade and review this items!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-52 overflow-y-auto">
                      {reviews.filter(r => r.productId === selectedProduct.id).map(r => (
                        <div key={r.id} className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40 space-y-1 shadow-xs">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{r.reviewerName}</span>
                            <div className="flex gap-0.5 text-amber-500">
                              {Array.from({ length: r.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed italic">"{r.comment}"</p>
                          <span className="text-[10px] text-slate-400 block font-mono text-right">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post review input */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Write a quick review</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-xs">Rating score:</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            type="button"
                            key={stars}
                            onClick={() => setUserRating(stars)}
                            className="bg-transparent"
                          >
                            <Star className={`w-4 h-4 cursor-pointer hover:scale-110 transition ${userRating >= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Share your meetup experiences, item status, and logistics comments..."
                      className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={handlePostReviewSubmit}
                      disabled={!userComment.trim()}
                      className="bg-[#007CF0] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm float-right active:scale-95 transition"
                    >
                      Post Review
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Real-time Smart Chat Box Modal */}
      {showChatModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full h-[80vh] sm:h-[70vh] flex flex-col justify-between overflow-hidden animate-slide-up">
            
            {/* Header info */}
            <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.title} 
                  className="w-10 h-10 object-cover rounded-lg border border-slate-800 bg-white"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-white truncate leading-tight">{selectedProduct.title}</h4>
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold leading-none mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Smart Vendor Active
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowChatModal(false)}
                className="bg-slate-800 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable messages and Taglish auto responder */}
            <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
              <div className="text-center text-[10px] text-slate-400 bg-slate-200/40 p-2 rounded-lg max-w-xs mx-auto border border-slate-150 italic">
                🔒 Pinas safe trade active. Discussion is localized and encrypted.
              </div>

              {activeChatMessages.length === 0 ? (
                <div className="text-center p-10 space-y-2 text-slate-400">
                  <p className="text-xs">No active conversation messages yet.</p>
                  <p className="text-[10px]">Send a quick Taglish reply pill or type below to instantly negotiate with the Seller!</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeChatMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-sm ${
                          isMe ? 'bg-[#007CF0] text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-400 mt-0.5 px-1 font-mono font-bold uppercase tracking-wider">
                          {msg.isSmartReply ? '🤖 Gemini Agent' : msg.senderName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {isSmartAgentReplying && (
                <div className="flex items-center gap-1 text-xs text-slate-400 italic bg-white border border-slate-150 p-2.5 rounded-2xl w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin-slow" />
                  <span>Seller is typing in Taglish...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick replies */}
            <div className="px-4 py-2 border-t border-slate-200 bg-white flex gap-1.5 overflow-x-auto scrollbar-none">
              <button 
                onClick={() => handleSendMessage(undefined, "Hi po! available pa po ba ito? No issues po?")}
                className="bg-slate-100 hover:bg-[#007CF0] hover:text-white text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition"
              >
                Is it available?
              </button>
              <button 
                onClick={() => handleSendMessage(undefined, "Kaya po ba ng discount? Baka pwedeng bawas konti po, meet up Megamall ngayon.")}
                className="bg-slate-100 hover:bg-[#007CF0] hover:text-white text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition"
              >
                Negotiations / Tawad
              </button>
              <button 
                onClick={() => handleSendMessage(undefined, "Pwede po ba shipping? Or Lalamove COD transaction po?")}
                className="bg-slate-100 hover:bg-[#007CF0] hover:text-white text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition"
              >
                Shipping COD?
              </button>
            </div>

            {/* Message input panel */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-200 p-3 flex gap-2">
              <input
                type="text"
                placeholder="Type your reply here..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl px-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none leading-none"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim()}
                className="bg-[#007CF0] hover:bg-blue-600 disabled:opacity-50 text-white p-2.5 rounded-xl flex items-center justify-center transition shrink-0 shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Checkout Processing Overlay Model */}
      {showCheckoutModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl p-6 space-y-6 animate-scale-up">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 tracking-tight text-md">Review Checkout Ledger</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="bg-slate-150 p-1.5 rounded-full text-slate-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!checkoutCompleteOrder ? (
              <form onSubmit={handlePlaceCODOrder} className="space-y-5">
                {/* Item Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex gap-3">
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-12 h-12 rounded-lg object-cover border" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase tracking-wider block text-slate-400 font-bold leading-none">{selectedProduct.category}</span>
                    <h4 className="font-semibold text-slate-800 text-xs truncate mt-0.5">{selectedProduct.title}</h4>
                    <span className="text-amber-800 text-xs font-bold font-mono">₱{selectedProduct.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 text-xs font-bold uppercase mb-1">Active Contact Mobile Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09171234567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-xs font-bold uppercase mb-1">Meetup shipping/delivery address</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Specify building unit, street name, subdivision and local landmarks..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                    />
                  </div>

                  {/* High Quality Color Selector */}
                  <div>
                    <label className="block text-slate-700 text-[10px] font-black uppercase tracking-widest mb-1.5">Choose Item Color Variant</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(() => {
                        const availableProductColors = selectedProduct?.colors && selectedProduct.colors.length > 0
                          ? selectedProduct.colors.map(c => {
                              const nameLc = c.toLowerCase();
                              let bgClass = "bg-slate-400";
                              if (nameLc.includes("black")) bgClass = "bg-zinc-800";
                              else if (nameLc.includes("white")) bgClass = "bg-slate-100 border border-slate-300";
                              else if (nameLc.includes("silver") || nameLc.includes("gray") || nameLc.includes("grey")) bgClass = "bg-slate-300";
                              else if (nameLc.includes("red")) bgClass = "bg-rose-600";
                              else if (nameLc.includes("blue")) bgClass = "bg-sky-500";
                              else if (nameLc.includes("green")) bgClass = "bg-emerald-600";
                              else if (nameLc.includes("yellow")) bgClass = "bg-amber-400";
                              else if (nameLc.includes("orange")) bgClass = "bg-orange-500";
                              else if (nameLc.includes("pink")) bgClass = "bg-pink-400";
                              else if (nameLc.includes("gold")) bgClass = "bg-yellow-600";
                              else bgClass = "bg-gradient-to-tr from-blue-600 to-indigo-500";
                              return { name: c, bg: bgClass };
                            })
                          : [
                              { name: 'Charcoal Black', bg: 'bg-zinc-800' },
                              { name: 'Pearl White', bg: 'bg-slate-100 border border-slate-300' },
                              { name: 'Classic Silver', bg: 'bg-slate-300' },
                              { name: 'Cherry Red', bg: 'bg-rose-600' },
                              { name: 'Sky Blue', bg: 'bg-sky-500' },
                              { name: 'Emerald Green', bg: 'bg-emerald-600' }
                            ];

                        return availableProductColors.map((col) => {
                          const isSelected = selectedColor === col.name;
                          return (
                            <button
                              key={col.name}
                              type="button"
                              onClick={() => setSelectedColor(col.name)}
                              className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer relative hover:border-slate-300 ${
                                isSelected ? 'border-blue-600 bg-blue-50/60 shadow-xs' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full ${col.bg} flex items-center justify-center shrink-0`}>
                                {isSelected && <span className="text-[8px] font-black text-white mix-blend-difference">✓</span>}
                              </span>
                              <span className={`text-[9px] font-extrabold truncate w-full ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                                {col.name}
                              </span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div>
                    <span className="block text-slate-700 text-xs font-bold uppercase mb-1.5">Local Payment Delivery Logistics</span>
                    <div className="border border-blue-155 bg-blue-50/50 p-3.5 rounded-xl text-center">
                      <span className="text-[11px] font-extrabold text-blue-700 block">Cash on Delivery (COD)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Handled by premium partners (Grab / Lalamove / J&T logistics)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  {currentUser.kycStatus === 'verified' ? (
                    <button
                      type="submit"
                      className="w-full bg-[#007CF0] hover:bg-blue-600 text-white font-bold text-sm py-2.5 rounded-xl shadow transition cursor-pointer"
                    >
                      Authorize Order purchase (COD)
                    </button>
                  ) : (
                    <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl space-y-2">
                      <p className="text-rose-800 text-[11px] font-bold leading-normal text-center">
                        ⚠️ Security Block: You must be a KYC Verified member to place orders.
                      </p>
                      <p className="text-slate-500 text-[9px] text-center font-semibold leading-relaxed">
                        Please submit your physical photo ID card and facial verification in the safety banner above to clear status. This protects sellers from fraud and bogus orders.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              /* Checkout success visual confirmation */
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <div>
                  <h4 className="text-slate-800 font-extrabold text-sm">Purchase Order authorized successfully!</h4>
                  <p className="text-slate-400 text-[11px] mt-1">Our carrier (Grab / Lalamove / J&T) will contact you shortly.</p>
                </div>

                <div className="bg-slate-50 text-slate-600 p-3 rounded-xl border border-slate-200 text-left font-mono text-[10px] space-y-1 leading-none shadow-inner">
                  <div>Order Reference Number: <span className="font-bold text-slate-800">{checkoutCompleteOrder.id.toUpperCase()}</span></div>
                  <div>Selected Color Variant: <span className="font-bold text-indigo-750">{checkoutCompleteOrder.selectedColor || 'Standard'}</span></div>
                  <div>Carrier Logistics Method: <span className="font-bold text-slate-800">{checkoutCompleteOrder.paymentMethod.toUpperCase()}</span></div>
                  <div>Final cost payable: <span className="font-bold text-slate-800">₱{checkoutCompleteOrder.productPrice.toLocaleString()}</span></div>
                  <div>Destination Address: <span className="font-bold text-slate-800 truncate block mt-1">{checkoutCompleteOrder.deliveryAddress}</span></div>
                </div>

                <p className="text-slate-400 text-[10px] italic">
                  Tip: Switch active profile to the seller's account (<b>Juan dela Cruz</b>) and toggle the <b>Incoming Orders</b> view to ship, deliver, and close this order!
                </p>

                <button
                  onClick={handleCloseCheckout}
                  className="w-full bg-[#007CF0] hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl transition shadow"
                >
                  Return to Store Feed
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, Smartphone, ShieldCheck, Mail, Sparkles, CheckCircle, Store, ShoppingBag, 
  Trash2, HelpCircle, X, Upload, Camera, AlertTriangle, UserCheck, Smile, FileText, Check
} from 'lucide-react';
import { Product, User, Message, Order, Review, GCashReceipt, AppNotification } from './types';
import { INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_REVIEWS } from './data';

import RoleSwitcher from './components/RoleSwitcher';
import BuyerDashboard from './components/BuyerDashboard';
import SellerDashboard from './components/SellerDashboard';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // States
  const [currentRole, setCurrentRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]); // Default to Maria Clara Santos (Buyer)
  const [users, setUsers] = useState<User[]>([]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipts, setReceipts] = useState<GCashReceipt[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [gcashQrPayment, setGcashQrPayment] = useState<string>('/src/assets/images/gcash_qr_new_1781249283220.jpg');
  const [listingFee, setListingFee] = useState<number>(() => {
    const saved = localStorage.getItem('mph_listing_fee');
    return saved ? parseFloat(saved) : 20;
  });
  
  // Interactive UI triggers
  const [showNotificationTray, setShowNotificationTray] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  const [showKycWizModal, setShowKycWizModal] = useState(false);

  // Google simulated registration form fields
  const [regRole, setRegRole] = useState<'buyer' | 'seller'>('buyer');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGcash, setRegGcash] = useState('');
  const [regLocation, setRegLocation] = useState('Metro Manila - Quezon City');
  const [oauthStep, setOauthStep] = useState<'form' | 'loading' | 'consent' | 'success'>('form');
  
  // KYC Upload Wizard form fields
  const [kycIdType, setKycIdType] = useState<'passport' | 'drivers_license' | 'sss_umid' | 'philsys_national_id' | 'prc_id' | 'voter_postal_id'>('philsys_national_id');
  const [kycDocImage, setKycDocImage] = useState<string>('');
  const [kycSelfieImage, setKycSelfieImage] = useState<string>('');

  // Load and seed localStorage data on launch
  useEffect(() => {
    // 0. Load users first
    const storedUsers = localStorage.getItem('mph_users');
    let loadedUsers = INITIAL_USERS;
    if (storedUsers) {
      try {
        loadedUsers = JSON.parse(storedUsers);
      } catch (err) {
        loadedUsers = INITIAL_USERS;
      }
    } else {
      localStorage.setItem('mph_users', JSON.stringify(INITIAL_USERS));
    }
    setUsers(loadedUsers);

    // Load active current user
    const savedUserId = localStorage.getItem('mph_current_user_id');
    const matchedUser = loadedUsers.find(u => u.id === savedUserId) || loadedUsers[1];
    setCurrentUser(matchedUser);
    setCurrentRole(matchedUser.role);

    // 1. Load products
    const storedProducts = localStorage.getItem('mph_products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('mph_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    // 2. Load orders
    const storedOrders = localStorage.getItem('mph_orders');
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      setOrders([]);
    }

    // 3. Load receipts
    const storedReceipts = localStorage.getItem('mph_receipts');
    if (storedReceipts) {
      setReceipts(JSON.parse(storedReceipts));
    } else {
      setReceipts([]);
    }

    // 4. Load messages
    const storedMessages = localStorage.getItem('mph_messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }

    // 5. Load reviews
    const storedReviews = localStorage.getItem('mph_reviews');
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews));
    } else {
      setReviews(INITIAL_REVIEWS);
      localStorage.setItem('mph_reviews', JSON.stringify(INITIAL_REVIEWS));
    }

    // 6. Initiate with native Welcome Notification
    const savedFee = localStorage.getItem('mph_listing_fee') ? parseFloat(localStorage.getItem('mph_listing_fee')!) : 20;
    const welcomeNotes: AppNotification[] = [
      {
        id: 'note_welcome',
        title: '🏆 Welcome to Market PH Sandbox',
        message: `A high-fidelity peer-to-peer Philippine marketplace app! Create posts, pay simulated GCash fees (₱${savedFee.toLocaleString()}), and review with Gemini OCR.`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    setNotifications(welcomeNotes);

    // 7. Load custom gcash branding qr code
    const storedGcashQr = localStorage.getItem('mph_gcash_qr_payment');
    if (storedGcashQr) {
      setGcashQrPayment(storedGcashQr);
    }
  }, []);

  const handleUpdateGcashQr = (newImage: string) => {
    setGcashQrPayment(newImage);
    localStorage.setItem('mph_gcash_qr_payment', newImage);
    triggerToast('GCash QR Code / design updated successfully', 'success');
  };

  const handleUpdateListingFee = (newFee: number) => {
    setListingFee(newFee);
    localStorage.setItem('mph_listing_fee', newFee.toString());
    triggerToast(`Pay-to-List listing fee adjusted to ₱${newFee.toLocaleString()}`, 'success');
  };

  // Update localStorage when state alters
  const saveProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('mph_products', JSON.stringify(updated));
  };

  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    localStorage.setItem('mph_orders', JSON.stringify(updated));
  };

  const saveReceipts = (updated: GCashReceipt[]) => {
    setReceipts(updated);
    localStorage.setItem('mph_receipts', JSON.stringify(updated));
  };

  const saveMessages = (updated: Message[]) => {
    setMessages(updated);
    localStorage.setItem('mph_messages', JSON.stringify(updated));
  };

  const saveReviews = (updated: Review[]) => {
    setReviews(updated);
    localStorage.setItem('mph_reviews', JSON.stringify(updated));
  };

  const saveUsers = (updated: User[]) => {
    setUsers(updated);
    localStorage.setItem('mph_users', JSON.stringify(updated));
  };

  const handleApproveKyc = (userId: string, isApproved: boolean, reason?: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        if (isApproved) {
          return {
            ...u,
            kycStatus: 'verified' as const,
            verification: {
              ...u.verification,
              sellerVerified: true,
              buyerVerified: true
            }
          };
        } else {
          return {
            ...u,
            kycStatus: 'rejected' as const,
            kycRejectionReason: reason || 'Documents failed biometric matching checks'
          };
        }
      }
      return u;
    });

    saveUsers(updatedUsers);

    // Update active current user if they are the one audited
    const matchedUser = updatedUsers.find(u => u.id === currentUser.id);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }

    // Push notification to requester
    const affectedUser = updatedUsers.find(u => u.id === userId);
    if (affectedUser) {
      if (isApproved) {
        pushNotification(
          "🛡️ KYC Document Verified!",
          `Congratulations ${affectedUser.fullName}! Your physical ID and biometric selfie portrait have been verified. Access granted.`,
          "success"
        );
      } else {
        pushNotification(
          "⚠️ KYC Verification Rejected",
          `Refused: "${reason || 'Biometric files failed clarity or matching tests.'}"`,
          "warning"
        );
      }
    }
  };

  /**
   * Universal Trigger Toast system
   */
  const triggerToast = (text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Switch sandbox user profile
  const handleUserSelect = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
      setCurrentRole(selected.role);
      localStorage.setItem('mph_current_user_id', selected.id);
      triggerToast(`Loaded Profile: ${selected.fullName} (${selected.role.toUpperCase()})`, 'info');
    }
  };

  // Push new customized notification
  const pushNotification = (title: string, message: string, type: AppNotification['type']) => {
    const newNote: AppNotification = {
      id: `note_${Date.now()}`,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNote, ...prev]);
    triggerToast(title, type === 'warning' ? 'warning' : 'success');
  };

  // Reset sandbox databases
  const handleResetSandbox = () => {
    localStorage.removeItem('mph_products');
    localStorage.removeItem('mph_orders');
    localStorage.removeItem('mph_receipts');
    localStorage.removeItem('mph_messages');
    localStorage.removeItem('mph_reviews');
    localStorage.removeItem('mph_users');
    localStorage.removeItem('mph_current_user_id');
    
    setProducts(INITIAL_PRODUCTS);
    setOrders([]);
    setReceipts([]);
    setMessages([]);
    setReviews(INITIAL_REVIEWS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[1]);
    setCurrentRole('buyer');
    
    triggerToast("Sandbox databases restored to factory seed state!", 'info');
  };

  // ==================== P2P TRANSACTIONS OPERATIONS ====================

  // Write new Seller product
  const handlePostProduct = (productData: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'createdAt' | 'views'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.fullName,
      createdAt: new Date().toISOString(),
      views: 1
    };

    const nextProducts = [...products, newProduct];
    saveProducts(nextProducts);

    pushNotification(
      '📦 Listing Registered (Unpaid)',
      `"${newProduct.title}" has been registered. Please complete the ₱${listingFee.toLocaleString()} GCash listing fee to submit for approval.`,
      'warning'
    );

    return newProduct;
  };

  // Submit GCash listing payment receipt proof
  const handleSubmitGCashReceipt = (productId: string, referenceNo: string, receiptBase64: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Create receipt entry
    const newReceipt: GCashReceipt = {
      id: `rcpt_${Date.now()}`,
      productId,
      productTitle: product.title,
      sellerId: currentUser.id,
      sellerName: currentUser.fullName,
      amount: listingFee,
      referenceNo,
      receiptUrl: receiptBase64,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    saveReceipts([...receipts, newReceipt]);

    // Transition product status to pending_approval
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return { 
          ...p, 
          status: 'pending_approval' as const,
          gcashReceiptRef: referenceNo
        };
      }
      return p;
    });
    saveProducts(updatedProducts);

    pushNotification(
      '💸 GCash Receipt Ticket Created',
      `GCash Trace reference ${referenceNo} has been forwarded to Head Office for verification.`,
      'info'
    );
  };

  // Admin approves gcash payment
  const handleApproveReceipt = (receiptId: string, isApproved: boolean, notes?: string) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;

    // Update receipt status
    const updatedReceipts = receipts.map(r => {
      if (r.id === receiptId) {
        return { 
          ...r, 
          status: (isApproved ? 'approved' : 'rejected') as any,
          rejectionReason: notes 
        };
      }
      return r;
    });
    saveReceipts(updatedReceipts);

    // Update product status if approved or rejected
    const updatedProducts = products.map(p => {
      if (p.id === receipt.productId) {
        return {
          ...p,
          listingFeePaid: isApproved,
          status: (isApproved ? 'active' : 'rejected') as any
        };
      }
      return p;
    });
    saveProducts(updatedProducts);

    const matchProduct = products.find(p => p.id === receipt.productId);
    const sellerWord = matchProduct ? matchProduct.sellerName : "Seller";

    pushNotification(
      isApproved ? `✅ GCash Proof Verified (₱${receipt.amount.toLocaleString()})` : '❌ GCash Proof Refused',
      isApproved 
        ? `Payment verified for "${receipt.productTitle}". Listing is now live public.`
        : `Trace code ${receipt.referenceNo} was rejected: ${notes}`,
      isApproved ? 'success' : 'warning'
    );
  };

  // Admin approves/declines product manually
  const handleApproveProduct = (productId: string, isApproved: boolean) => {
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return { 
          ...p, 
          status: (isApproved ? 'active' : 'rejected') as any
        };
      }
      return p;
    });
    saveProducts(updatedProducts);

    const product = products.find(p => p.id === productId);
    pushNotification(
      isApproved ? '🌟 Public Listing Clear' : '⛔ Listing Refused',
      isApproved 
        ? `"${product?.title}" has been authorized for public shopping.`
        : `Listing clearances closed/declined for "${product?.title}".`,
      isApproved ? 'success' : 'warning'
    );
  };

  // Seller deletes product listing
  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const title = product ? product.title : 'Listing';
    
    const updatedProducts = products.filter(p => p.id !== productId);
    saveProducts(updatedProducts);

    const updatedReceipts = receipts.filter(r => r.productId !== productId);
    saveReceipts(updatedReceipts);

    triggerToast(`"${title}" deleted successfully`, 'warning');

    pushNotification(
      '🗑️ Listing Removed',
      `"${title}" was deleted and permanently cleared from the catalog.`,
      'warning'
    );
  };

  // Buyer orders product
  const handlePlaceOrder = (orderData: Omit<Order, 'id' | 'buyerId' | 'buyerName' | 'status' | 'createdAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}`,
      buyerId: currentUser.id,
      buyerName: currentUser.fullName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    saveOrders([...orders, newOrder]);

    // Mark product as sold
    const updatedProducts = products.map(p => {
      if (p.id === orderData.productId) {
        return { ...p, status: 'sold' as const };
      }
      return p;
    });
    saveProducts(updatedProducts);

    pushNotification(
      '🛍️ Cash on Delivery Order Authorized',
      `COD Purchase submitted for "${newOrder.productTitle}". Seller notified via courier.`,
      'success'
    );

    return newOrder;
  };

  // Seller ships/completes orders
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status,
          paymentStatus: (status === 'delivered' || status === 'completed') ? ('paid' as const) : o.paymentStatus
        };
      }
      return o;
    });
    saveOrders(updatedOrders);

    pushNotification(
      `📦 Courier Tracker: ${status.toUpperCase()}`,
      `Order for "${order.productTitle}" is now ${status}. (COD Cash status: ${status === 'delivered' ? 'Transferred' : 'Processing'})`,
      'info'
    );
  };

  // Buyer posts star review comments
  const handlePostReview = (productId: string, rating: number, comment: string) => {
    const newReview: Review = {
      id: `rev_${Date.now()}`,
      productId,
      rating,
      comment,
      reviewerName: currentUser.fullName,
      createdAt: new Date().toISOString()
    };

    saveReviews([...reviews, newReview]);
    triggerToast("Review comment posted successfully!", "success");
  };

  // Chat messaging
  const handleSendMessage = (msgData: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...msgData,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    saveMessages([...messages, newMessage]);
  };

  const handleGoogleAuthComplete = () => {
    if (!regFullName || !regEmail) {
      triggerToast('Please provide your full name and Google email address.', 'warning');
      return;
    }
    
    // Create new registered user configuration
    const newUser: User = {
      id: `usr_${Date.now()}`,
      fullName: regFullName,
      email: regEmail,
      role: regRole,
      avatarUrl: `https://images.unsplash.com/photo-${regRole === 'seller' ? '1472099645785-5658abf4ff4e' : '1534528741775-53994a69daeb'}?w=200&h=200&fit=crop`,
      gcashNumber: regGcash || undefined,
      location: regLocation,
      kycStatus: 'unverified',
      verification: {
        emailVerified: true,
        phoneVerified: !!regGcash,
        sellerVerified: false,
        buyerVerified: false
      }
    };
    
    // Append to live registered user list & set active profile
    const nextUsers = [...users, newUser];
    saveUsers(nextUsers);
    
    setCurrentUser(newUser);
    setCurrentRole(newUser.role);
    localStorage.setItem('mph_current_user_id', newUser.id);

    // Track status
    setOauthStep('form');
    setShowGoogleAuthModal(false);
    
    triggerToast(`Welcome to Market PH, ${regFullName}! Google account linked.`, 'success');
    
    pushNotification(
      `🛡️ Identity Security Protocol`,
      `Hi ${regFullName}! Google Auth succeeded. To list products or checkout, please complete the Philippine ID and selfie KYC steps immediately.`,
      `warning`
    );

    // Auto open the KYC modal to encourage quick onboarding!
    setShowKycWizModal(true);
  };

  const handleKycSubmit = () => {
    if (!kycDocImage || !kycSelfieImage) {
      triggerToast('Please upload both your Philippine ID scan and selfie portrait.', 'warning');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          kycStatus: 'pending' as const,
          kycIdType,
          kycDocImage,
          kycSelfieImage,
          kycSubmissionTime: new Date().toISOString()
        };
      }
      return u;
    });

    saveUsers(updatedUsers);
    
    // Update active user state
    const nextUser = updatedUsers.find(u => u.id === currentUser.id);
    if (nextUser) {
      setCurrentUser(nextUser);
    }

    setShowKycWizModal(false);
    triggerToast('Identity materials uploaded successfully! Sent to admin audit queue.', 'success');

    pushNotification(
      "📁 Identity Package Submitted",
      "Our system audits identities side-by-side. Your status is now 'pending' clearance.",
      "info"
    );
  };

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-gradient-to-tr from-[#e2e8f0] via-[#f8fafc] to-[#cbd5e1] flex flex-col font-sans select-none">
      {/* Floating Design Blur Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-indigo-300/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-300/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Dynamic Floating Sandbox Swapper Header */}
      <RoleSwitcher
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={currentUser}
        onUserSelect={handleUserSelect}
        allUsers={users}
        pendingReceiptsCount={receipts.filter(r => r.status === 'pending').length}
        pendingProductsCount={products.filter(p => p.status === 'pending_approval').length}
      />

      {/* Main Core Platform Interface Bar */}
      <header className="bg-white/40 backdrop-blur-md border-b border-white/30 sticky top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center bg-transparent gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="bg-[#007DFE] text-white p-2.5 rounded-2xl flex items-center justify-center font-black text-md shadow-lg shadow-blue-500/15">
              ₱H
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm tracking-tight leading-none animate-fade-in">Market PH</h2>
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mt-1.5 block">Ang Pambansang Marketplace</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 ml-auto flex-wrap sm:flex-nowrap">
            {/* Quick Sandbox Database Reset */}
            <button
              onClick={handleResetSandbox}
              className="text-[10px] bg-white/60 hover:bg-white/80 text-slate-600 font-bold px-3 py-1.5 rounded-xl border border-white/40 shadow-xs transition cursor-pointer"
              title="Clear item adjustments and restore default seed marketplace listings"
            >
              Reset Data
            </button>

            {/* Google Sign Up action button */}
            <button
              onClick={() => setShowGoogleAuthModal(true)}
              className="text-[10px] bg-sky-600 hover:bg-sky-700 hover:scale-[1.02] text-white font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-500/10 transition active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.95-3.18 3.51v2.88h5.13c3.00-2.76 4.73-6.81 4.73-11.62 0-.54-.05-1.12-.13-1.5z" fill="currentColor" />
                <path d="M12.18 21c3.24 0 5.97-1.08 7.96-2.91l-5.13-2.88c-.99.58-2.25.99-3.8.99-3.00 0-5.54-2.03-6.45-4.76H1.54v3.1c1.98 3.93 6.03 6.66 10.64 6.66z" fill="currentColor" />
                <path d="M5.73 11.44C5.51 10.8 5.37 10.12 5.37 9.42c0-.7.14-1.38.36-2.02V4.3H1.54C.81 5.75.4 7.5.4 9.42s.41 3.67 1.14 5.12l4.19-3.1z" fill="currentColor" />
                <path d="M12.18 3.73c1.76 0 3.35.61 4.6 1.8l3.42-3.4C18.15.82 15.42 0 12.18 0 7.57 0 3.52 2.73 1.54 6.66l4.19 3.1c.91-2.73 3.45-4.76 6.45-4.76z" fill="currentColor" />
              </svg>
              Google Account Sign-Up
            </button>

            {/* Notification bell trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationTray(!showNotificationTray)}
                className="p-2 text-slate-600 hover:text-blue-600 rounded-xl hover:bg-white/40 border border-transparent hover:border-white/20 relative transition cursor-pointer text-xs"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white font-bold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce ring-2 ring-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notification Inbox Dropdown popover */}
              {showNotificationTray && (
                <div className="absolute right-0 mt-2 bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-xl w-80 py-2 z-50 animate-scale-up">
                  <div className="px-4 py-2 border-b border-white/30 flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-800">Activity Ledger ({notifications.length})</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-red-600 font-bold hover:underline bg-transparent cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/20">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-slate-400 font-medium">Activity ledger cleared.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-white/40 transition text-left text-xs space-y-0.5">
                          <h4 className="font-bold text-slate-800 leading-tight">{n.title}</h4>
                          <p className="text-slate-500 text-[11px] leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-400 block pt-1 font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile display */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.fullName} 
                  className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white text-[8px] font-black leading-none text-white shadow ${
                  currentUser.kycStatus === 'verified' ? 'bg-emerald-500' :
                  currentUser.kycStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                }`} title={`KYC status: ${currentUser.kycStatus || 'unverified'}`}>
                  {currentUser.kycStatus === 'verified' ? '✓' :
                   currentUser.kycStatus === 'pending' ? '⌛' : '!'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-800 block leading-tight">{currentUser.fullName}</span>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    currentUser.kycStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-600' :
                    currentUser.kycStatus === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {currentUser.kycStatus || 'UNVERIFIED'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block font-medium capitalize mt-1 leading-none">{currentUser.role} Account</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Safety KYC Restriction Alert Banner */}
      {currentUser.kycStatus !== 'verified' && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-semibold py-3 px-4 text-xs shadow-md border-b border-red-700/25 flex flex-wrap items-center justify-center gap-3 animate-fade-in relative z-20">
          <span className="bg-white/20 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded">Identity Security Access Gate</span>
          <p className="text-center font-bold">
            {currentUser.kycStatus === 'unverified' && "⚠️ Unverified account profile! Buyers & sellers must pass Philippine KYC identity verification to list items or place orders to reduce scams."}
            {currentUser.kycStatus === 'pending' && "⌛ Your KYC details are being audited! Admins are currently verifying your physical ID and selfie. Access will grant momentarily."}
            {currentUser.kycStatus === 'rejected' && `❌ KYC Refused: "${currentUser.kycRejectionReason || 'Submitted ID image was unclear.'}" Please retry with correct documents.`}
          </p>
          {(currentUser.kycStatus === 'unverified' || currentUser.kycStatus === 'rejected') && (
            <button
              onClick={() => setShowKycWizModal(true)}
              className="bg-white text-slate-900 hover:bg-slate-100 px-3.5 py-1.5 rounded-xl font-bold tracking-tight text-[10px] shadow-lg shadow-black/15 transition pr-4 flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              Verify KYC Instantly
            </button>
          )}
        </div>
      )}

      {/* Floating Application Toast Alerts */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/80 backdrop-blur-lg text-slate-800 px-5 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3 animate-slide-up max-w-sm">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold leading-tight">Platform Alert</p>
            <p className="text-slate-600 leading-normal mt-0.5">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Primary Role view coordinators */}
      <main className="flex-1">
        {currentRole === 'buyer' && (
          <BuyerDashboard
            products={products}
            currentUser={currentUser}
            allMessages={messages}
            orders={orders}
            reviews={reviews}
            onSendMessage={handleSendMessage}
            onPlaceOrder={handlePlaceOrder}
            onPostReview={handlePostReview}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            listingFee={listingFee}
          />
        )}

        {currentRole === 'seller' && (
          <SellerDashboard
            products={products}
            orders={orders}
            receipts={receipts}
            currentUser={currentUser}
            onPostProduct={handlePostProduct}
            onSubmitGCashReceipt={handleSubmitGCashReceipt}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteProduct={handleDeleteProduct}
            gcashQrPayment={gcashQrPayment}
            listingFee={listingFee}
          />
        )}

        {currentRole === 'admin' && (
          <AdminPanel
            products={products}
            receipts={receipts}
            onApproveReceipt={handleApproveReceipt}
            onApproveProduct={handleApproveProduct}
            gcashQrPayment={gcashQrPayment}
            onUpdateGcashQr={handleUpdateGcashQr}
            allUsers={users}
            onApproveKyc={handleApproveKyc}
            listingFee={listingFee}
            onUpdateListingFee={handleUpdateListingFee}
          />
        )}
      </main>

      {/* Beautiful localized footer banner */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 md:px-8 border-t border-slate-800 text-center text-xs space-y-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-slate-200 font-bold tracking-wide flex items-center justify-center gap-1">
            <span>MARKET PH</span>
            <span className="text-slate-600">|</span>
            <span className="text-[#007CF0] text-[10px] uppercase tracking-widest font-extrabold bg-[#007CF0]/10 px-1.5 py-0.5 rounded">Ang Pambansang Marketplace</span>
          </p>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Pinas secure P2P commerce portal matching regulatory systems. Integrated with Gemini 3.5 AI for merchant behavior and GCash receipt audit operations.
          </p>
        </div>
        <div className="bg-slate-950/80 max-w-lg mx-auto py-2.5 px-4 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-mono">
          © 2026 Market PH Inc. &middot; NTC compliance verification key active.
        </div>
      </footer>

      {/* ==================== SIMULATED GOOGLE SIGN-UP MODAL ==================== */}
      {showGoogleAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.95-3.18 3.51v2.88h5.13c3.00-2.76 4.73-6.81 4.73-11.62 0-.54-.05-1.12-.13-1.5z" fill="#4285F4" />
                  <path d="M12.18 21c3.24 0 5.97-1.08 7.96-2.91l-5.13-2.88c-.99.58-2.25.99-3.8.99-3.00 0-5.54-2.03-6.45-4.76H1.54v3.1c1.98 3.93 6.03 6.66 10.64 6.66z" fill="#34A853" />
                  <path d="M5.73 11.44C5.51 10.8 5.37 10.12 5.37 9.42c0-.7.14-1.38.36-2.02V4.3H1.54C.81 5.75.4 7.5.4 9.42s.41 3.67 1.14 5.12l4.19-3.1z" fill="#FBBC05" />
                  <path d="M12.18 3.73c1.76 0 3.35.61 4.6 1.8l3.42-3.4C18.15.82 15.42 0 12.18 0 7.57 0 3.52 2.73 1.54 6.66l4.19 3.1c.91-2.73 3.45-4.76 6.45-4.76z" fill="#EA4335" />
                </svg>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">Simulated Google Accounts</span>
              </div>
              <button 
                onClick={() => {
                  setShowGoogleAuthModal(false);
                  setOauthStep('form');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Input Account Mappings */}
            {oauthStep === 'form' && (
              <div className="p-6 space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Join Market PH Securely</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Verify single sign-on parameters to establish digital Philippine seller/buyer certificates.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Account Type Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                      Account Operations Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRegRole('buyer')}
                        type="button"
                        className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          regRole === 'buyer' 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Buyer Access
                      </button>
                      <button
                        onClick={() => setRegRole('seller')}
                        type="button"
                        className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          regRole === 'seller' 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        Seller Access
                      </button>
                    </div>
                  </div>

                  {/* Full Name & email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                      Google profile full name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Juan dela Cruz"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                      Google account Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. juan.delacruz@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* GCash Phone number & location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                        Registered GCash Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 09171234567"
                        value={regGcash}
                        onChange={(e) => setRegGcash(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-2 text-xs text-slate-800 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                        Philippine Base City
                      </label>
                      <select
                        value={regLocation}
                        onChange={(e) => setRegLocation(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Metro Manila - Quezon City">Quezon City</option>
                        <option value="Metro Manila - Manila">Manila City</option>
                        <option value="Metro Manila - Taguig">Taguig City</option>
                        <option value="Metro Manila - Makati">Makati City</option>
                        <option value="Metro Manila - Pasig">Pasig City</option>
                        <option value="Cebu - Cebu City">Cebu City</option>
                        <option value="Davao - Davao City">Davao City</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!regFullName || !regEmail) {
                        triggerToast('Please provide your full name and Google email address.', 'warning');
                        return;
                      }
                      setOauthStep('loading');
                      setTimeout(() => {
                        setOauthStep('consent');
                      }, 1200);
                    }}
                    type="button"
                    className="w-full bg-[#007DFE] hover:bg-blue-700 text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 active:scale-95 transition cursor-pointer text-xs"
                  >
                    Authenticate with Google Auth
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Redirection Loader */}
            {oauthStep === 'loading' && (
              <div className="p-10 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800">Redirecting to account services...</p>
                  <p className="text-[10px] text-slate-400 font-mono">accounts.google.com/o/oauth2/v2/auth</p>
                </div>
              </div>
            )}

            {/* Step 3: OAuth Consent Screen */}
            {oauthStep === 'consent' && (
              <div className="p-6 space-y-5 animate-scale-up">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <img src="/favicon.ico" alt="Market PH logo" className="w-8 h-8 rounded-lg shrink-0 mt-0.5" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100' }} />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">Market PH Requests Access</h4>
                    <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5 font-medium">
                      Market PH wants to view your Google profile metadata parameters (Full name, Google Email, and system profile avatar parameters).
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <p className="font-black text-slate-400 text-[10px] uppercase block tracking-wider">Mapping Identifiers</p>
                  <div className="flex justify-between py-1 border-b border-white">
                    <span className="text-slate-500 font-medium">Linked Name:</span>
                    <span className="font-bold text-slate-800">{regFullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white">
                    <span className="text-slate-500 font-medium">Linked Email:</span>
                    <span className="font-bold text-slate-800 font-mono truncate max-w-[180px] text-right">{regEmail}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Requested Scope:</span>
                    <span className="font-bold text-slate-800 tracking-tight text-[11px] text-right">profile, email, read:identities</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => {
                      setOauthStep('form');
                    }}
                    type="button"
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs active:scale-95 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGoogleAuthComplete}
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-4 rounded-xl text-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                  >
                    <Check className="w-4 h-4" />
                    Allow & Sync Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== PEER-TO-PEER PHILIPPINES KYC VERIFICATION WIZARD ==================== */}
      {showKycWizModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden my-8 animate-scale-up">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white px-6 py-4.5 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">NTC System Gateway</span>
                  <span className="text-slate-450 font-mono text-[9px]">AUTHENTICITY GATE</span>
                </div>
                <h3 className="font-black text-slate-50 text-base tracking-tight mt-1">Philippine KYC Security Clearance</h3>
              </div>
              <button 
                onClick={() => setShowKycWizModal(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description Warning Bar to satisfy "avoid scam transaction" */}
            <div className="bg-amber-50 border-b border-amber-100 p-4 shrink-0">
              <div className="flex gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-amber-800 text-xs font-semibold leading-relaxed">
                  <strong>Philippines Anti-Scam Policy:</strong> In compliance with secure peer-to-peer trading standards, all listing posts and order authorization workflows are restricted until a physical ID cards scan and face-matching selfie are certified.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* ID Document Selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                  Select Valid Philippine ID Type
                </span>
                <select
                  value={kycIdType}
                  onChange={(e) => setKycIdType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize cursor-pointer"
                >
                  <option value="philsys_national_id">PhilSys Philippine National ID</option>
                  <option value="drivers_license">LTO Driver's License</option>
                  <option value="sss_umid">SSS Unified Multi-Purpose ID (UMID)</option>
                  <option value="passport">DFA Philippine Passport</option>
                  <option value="prc_id">PRC Professional ID</option>
                  <option value="voter_postal_id">COMELEC Voter's ID / Postal ID</option>
                </select>
              </div>

              {/* ID upload column */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Part 1: Valid ID scan */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">
                      ID CARD FRONT SCAN
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setKycDocImage("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600");
                        triggerToast("PhilSys ID template mockup loaded for test", "success");
                      }}
                      className="text-[9px] text-[#007DFE] font-extrabold bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Use Sandbox Mock ID
                    </button>
                  </div>
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50 overflow-hidden aspect-video flex flex-col items-center justify-center p-3 text-center transition">
                    {kycDocImage ? (
                      <div className="w-full h-full relative group">
                        <img src={kycDocImage} alt="ID Document Scan Previewed" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition p-2">
                          <button
                            onClick={() => setKycDocImage('')}
                            className="bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-650 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-700">Drop ID scan or Click to upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setKycDocImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Part 2: Holding ID selfie */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">
                      SELFIE PORTRAIT WITH ID
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setKycSelfieImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600");
                        triggerToast("Sandboxed face portrait selfie loaded for test", "success");
                      }}
                      className="text-[9px] text-[#007DFE] font-extrabold bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Use Sandbox Selfie
                    </button>
                  </div>
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50 overflow-hidden aspect-video flex flex-col items-center justify-center p-3 text-center transition">
                    {kycSelfieImage ? (
                      <div className="w-full h-full relative group">
                        <img src={kycSelfieImage} alt="Selfie Image Previewed" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition p-2">
                          <button
                            onClick={() => setKycSelfieImage('')}
                            className="bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-650 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-700">Upload portrait holding physical ID</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setKycSelfieImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submission limits */}
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-normal text-[11px] text-slate-500">
                <p className="font-extrabold text-slate-700 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Security Guidelines for Biometric Validation:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 mt-1 font-semibold leading-relaxed">
                  <li>ID portrait and physical card elements must be legible.</li>
                  <li>Email name mappings should correlate with original documentation parameters.</li>
                  <li>Images are locally certified securely. Secure sandbox protection active.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowKycWizModal(false)}
                  type="button"
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold py-2.5 px-4 rounded-xl text-xs active:scale-95 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKycSubmit}
                  type="button"
                  className="flex-1 bg-slate-950 hover:bg-slate-900 text-white font-black py-2.5 px-4 rounded-xl text-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-black/10"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Submit Verification Packet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

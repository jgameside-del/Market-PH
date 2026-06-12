/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'admin';
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    sellerVerified: boolean;
    buyerVerified: boolean;
  };
  gcashNumber?: string;
  avatarUrl?: string;
  rating?: number;
  location?: string;
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycIdType?: string;
  kycDocImage?: string; // base64 payload
  kycSelfieImage?: string; // base64 payload
  kycSubmittedAt?: string;
  kycRejectionReason?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageUrls?: string[];
  location: string;
  condition: 'new' | 'like_new' | 'good' | 'used';
  sellerId: string;
  sellerName: string;
  listingFeePaid: boolean;
  gcashReceiptRef?: string;
  status: 'pending_payment' | 'pending_approval' | 'active' | 'rejected' | 'sold';
  createdAt: string;
  views: number;
  colors?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: string;
  productId?: string;
  productInfo?: {
    title: string;
    price: number;
    imageUrl: string;
  };
  isSmartReply?: boolean;
}

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  paymentMethod: 'cod' | 'gcash';
  paymentStatus: 'pending' | 'verified' | 'paid';
  status: 'pending' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  deliveryAddress: string;
  contactPhone: string;
  referenceNo?: string; // GCash ref number if GCash paid
  selectedColor?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

export interface GCashReceipt {
  id: string;
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  referenceNo: string;
  receiptUrl: string; // Base64 or mock URL
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'chat' | 'order';
  createdAt: string;
  read: boolean;
}

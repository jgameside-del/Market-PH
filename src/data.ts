/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, User, Review } from './types';

export const PHILIPPINE_LOCATIONS = [
  "Metro Manila - Quezon City",
  "Metro Manila - Taguig (BGC)",
  "Metro Manila - Makati",
  "Metro Manila - Mandaluyong",
  "Metro Manila - Pasay (MOA)",
  "Metro Manila - Pasig (Ortigas)",
  "Metro Manila - Manila",
  "Cebu City - Lahug",
  "Davao City - Buhangin",
  "Pampanga - San Fernando",
  "Laguna - Santa Rosa",
  "Cavite - Imus"
];

export const CATEGORIES = [
  { id: "all", name: "All items", icon: "LayoutGrid" },
  { id: "electronics", name: "Electronics & PC", icon: "Cpu" },
  { id: "gadgets", name: "Phones & Gadgets", icon: "Smartphone" },
  { id: "fashion", name: "Fashion & Shoes", icon: "Shirt" },
  { id: "home", name: "Home & Apparel", icon: "Home" },
  { id: "motors", name: "Motors & Tires", icon: "Bike" },
  { id: "food", name: "Food & Delicacies", icon: "Utensils" }
];

export const INITIAL_USERS: User[] = [
  {
    id: "user_seller_juan",
    email: "juan.delacruz@gmail.com",
    fullName: "Juan dela Cruz",
    role: "seller",
    verification: {
      emailVerified: true,
      phoneVerified: true,
      sellerVerified: true,
      buyerVerified: true
    },
    gcashNumber: "09171234567",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=60",
    rating: 4.8,
    location: "Metro Manila - Quezon City",
    kycStatus: "verified"
  },
  {
    id: "user_buyer_maria",
    email: "maria.santos@gmail.com",
    fullName: "Maria Clara Santos",
    role: "buyer",
    verification: {
      emailVerified: true,
      phoneVerified: true,
      sellerVerified: false,
      buyerVerified: true
    },
    gcashNumber: "09187654321",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60",
    rating: 4.9,
    location: "Metro Manila - Pasig (Ortigas)",
    kycStatus: "verified"
  },
  {
    id: "user_admin_kevin",
    email: "kevin.admin@market.ph",
    fullName: "Kevin Roy (Market PH Admin)",
    role: "admin",
    verification: {
      emailVerified: true,
      phoneVerified: true,
      sellerVerified: true,
      buyerVerified: true
    },
    gcashNumber: "09090001122",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60",
    location: "Metro Manila - Taguig (BGC)",
    kycStatus: "verified"
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    title: "MacBook Air M2 Space Gray (8GB/256GB)",
    description: "Selling my crisp MacBook Air M2. No scratches of any kind, 100% smooth performance. 94% battery health, original USB-C charger and boxes included. Meetup SM Megamall or Taguig. Selling because I upgraded.",
    price: 48000,
    category: "electronics",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    location: "Metro Manila - Pasig (Ortigas)",
    condition: "like_new",
    sellerId: "user_seller_juan",
    sellerName: "Juan dela Cruz",
    listingFeePaid: true,
    gcashReceiptRef: "REF-9128381928371",
    status: "active",
    createdAt: "2026-06-08T10:30:00Z",
    views: 142
  },
  {
    id: "prod_2",
    title: "iPhone 14 Pro 128GB Deep Purple Gold",
    description: "NTC Registered. Smart Locked, openline candidate after contract end. Battery health 91%. Complete package, with dynamic island screen cover. Small invisible bumper scratch at base, otherwise in very solid condition.",
    price: 36500,
    category: "gadgets",
    imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
    location: "Metro Manila - Makati",
    condition: "good",
    sellerId: "user_seller_juan",
    sellerName: "Juan dela Cruz",
    listingFeePaid: true,
    gcashReceiptRef: "REF-5012384918237",
    status: "active",
    createdAt: "2026-06-09T14:22:00Z",
    views: 298
  },
  {
    id: "prod_3",
    title: "Nike Air Jordan 1 Retro High 'Chicago'",
    description: "Size 10 US Mens. 100% original, authenticated. Used for visual shoots once, soles are pristine, heel guards installed. Receipt from Nike Fort BGC. Shipping or meetup Cubao.",
    price: 11500,
    category: "fashion",
    imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80",
    location: "Metro Manila - Quezon City",
    condition: "like_new",
    sellerId: "user_seller_juan",
    sellerName: "Juan dela Cruz",
    listingFeePaid: true,
    gcashReceiptRef: "REF-3918231019283",
    status: "active",
    createdAt: "2026-06-10T16:05:00Z",
    views: 89
  },
  {
    id: "prod_4",
    title: "Minimalist Modern Solid Wood Coffee Table",
    description: "Imported Scandinavian white wood format. Fits minimal room layouts. Size is 80x40cm. Stable and neat structure. Disassembled with simple assembly keys.",
    price: 2450,
    category: "home",
    imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80",
    location: "Metro Manila - Taguig (BGC)",
    condition: "new",
    sellerId: "user_seller_juan",
    sellerName: "Juan dela Cruz",
    listingFeePaid: true,
    gcashReceiptRef: "REF-3092182039121",
    status: "active",
    createdAt: "2026-06-11T09:12:00Z",
    views: 45
  },
  {
    id: "prod_5",
    title: "Gourmet Homemade Bicol Express Hot & Creamy",
    description: "Authentic pork belly cooked with native siling haba and absolute rich coconut cream. Freshly prepared daily on-demand in Quezon City. Perfect pair with cold white rice. Order 2 hours before meetup of delivery. (Spicy levels: 🌶️🌶️🌶️)",
    price: 380,
    category: "food",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    location: "Metro Manila - Quezon City",
    condition: "new",
    sellerId: "user_seller_juan",
    sellerName: "Juan dela Cruz",
    listingFeePaid: true,
    gcashReceiptRef: "REF-9092301928131",
    status: "active",
    createdAt: "2026-06-11T11:00:00Z",
    views: 120
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev_1",
    productId: "prod_1",
    rating: 5,
    comment: "Excellent deal! Meetup was very smooth. Honest seller and item is as described.",
    reviewerName: "Regina Co",
    createdAt: "2026-06-09T11:40:00Z"
  },
  {
    id: "rev_2",
    productId: "prod_2",
    rating: 4,
    comment: "Item has slightly low battery health but seller gave me a solid discount. Happy with the custom deal.",
    reviewerName: "Mark Anthony",
    createdAt: "2026-06-10T15:00:00Z"
  },
  {
    id: "rev_3",
    productId: "prod_5",
    rating: 5,
    comment: "Napakasarap at anghang! Solid, uulit-ulitin ko ito orderin next week.",
    reviewerName: "Aldrin De Leon",
    createdAt: "2026-06-11T12:30:00Z"
  }
];

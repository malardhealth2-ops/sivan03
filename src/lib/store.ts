import { create } from 'zustand';

interface BookingFormData {
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  date: string;
  time: string;
  tripType: 'economy' | 'vip' | 'luxury' | 'van' | 'electric';
  passengerCount: number;
  roundTrip: boolean;
  fullName: string;
  phone: string;
  notes: string;
  paymentMethod: 'cash' | 'online' | 'wallet';
  couponCode: string;
}

interface BookingState {
  currentStep: number;
  formData: BookingFormData;
  estimatedPrice: number | null;
  estimatedDuration: string | null;
  bookingCode: string | null;
  isSubmitting: boolean;
}

interface AuthState {
  isOpen: boolean;
  mode: 'login' | 'register' | 'otp';
  phone: string;
  otpCode: string;
  fullName: string;
  isVerified: boolean;
}

interface AppState {
  // Booking
  booking: BookingState;
  setBookingStep: (step: number) => void;
  updateBookingForm: (data: Partial<BookingFormData>) => void;
  setEstimatedPrice: (price: number | null, duration: string | null) => void;
  setBookingCode: (code: string | null) => void;
  setBookingSubmitting: (val: boolean) => void;
  resetBooking: () => void;

  // Auth modal
  auth: AuthState;
  openAuth: (mode: AuthState['mode']) => void;
  closeAuth: () => void;
  setAuthPhone: (phone: string) => void;
  setAuthOtp: (otp: string) => void;
  setAuthFullName: (name: string) => void;
  setAuthVerified: (val: boolean) => void;

  // Active section for navigation
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Contact modal
  contactOpen: boolean;
  setContactOpen: (open: boolean) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const initialBookingForm: BookingFormData = {
  origin: '',
  destination: '',
  date: '',
  time: '',
  tripType: 'vip',
  passengerCount: 1,
  roundTrip: false,
  fullName: '',
  phone: '',
  notes: '',
  paymentMethod: 'cash',
  couponCode: '',
};

export const useAppStore = create<AppState>((set) => ({
  // Booking
  booking: {
    currentStep: -1,
    formData: initialBookingForm,
    estimatedPrice: null,
    estimatedDuration: null,
    bookingCode: null,
    isSubmitting: false,
  },
  setBookingStep: (step) => set((s) => ({ booking: { ...s.booking, currentStep: step } })),
  updateBookingForm: (data) => set((s) => ({ booking: { ...s.booking, formData: { ...s.booking.formData, ...data } } })),
  setEstimatedPrice: (price, duration) => set((s) => ({ booking: { ...s.booking, estimatedPrice: price, estimatedDuration: duration } })),
  setBookingCode: (code) => set((s) => ({ booking: { ...s.booking, bookingCode: code } })),
  setBookingSubmitting: (val) => set((s) => ({ booking: { ...s.booking, isSubmitting: val } })),
  resetBooking: () => set({ booking: { currentStep: -1, formData: initialBookingForm, estimatedPrice: null, estimatedDuration: null, bookingCode: null, isSubmitting: false } }),

  // Auth
  auth: { isOpen: false, mode: 'login', phone: '', otpCode: '', fullName: '', isVerified: false },
  openAuth: (mode) => set((s) => ({ auth: { ...s.auth, isOpen: true, mode } })),
  closeAuth: () => set((s) => ({ auth: { ...s.auth, isOpen: false } })),
  setAuthPhone: (phone) => set((s) => ({ auth: { ...s.auth, phone } })),
  setAuthOtp: (otp) => set((s) => ({ auth: { ...s.auth, otpCode: otp } })),
  setAuthFullName: (name) => set((s) => ({ auth: { ...s.auth, fullName: name } })),
  setAuthVerified: (val) => set((s) => ({ auth: { ...s.auth, isVerified: val } })),

  // Active section
  activeSection: 'hero',
  setActiveSection: (section) => set({ activeSection: section }),

  // Contact
  contactOpen: false,
  setContactOpen: (open) => set({ contactOpen: open }),

  // Mobile menu
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));

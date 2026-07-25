import { create } from 'zustand';

interface CitySelection {
  province: string;
  city: string;
  district?: string;
  neighborhood?: string;
}

interface BookingFormData {
  origin: string;
  destination: string;
  originCity: CitySelection;
  destCity: CitySelection;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  distanceKm?: number | null;
  durationMin?: number | null;
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

interface AdminState {
  isAdminOpen: boolean;
  isLoggedIn: boolean;
  adminUsername: string;
  loginError: string;
  activeTab: 'dashboard' | 'trips' | 'users' | 'settings' | 'drivers';
  setAdminOpen: (open: boolean) => void;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;
  setLoginError: (error: string) => void;
  setActiveTab: (tab: AdminState['activeTab']) => void;
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

  // Admin panel
  admin: AdminState;
  setAdminOpen: (open: boolean) => void;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;
  setLoginError: (error: string) => void;
  setAdminActiveTab: (tab: AdminState['activeTab']) => void;

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
  originCity: { province: '', city: '' },
  destCity: { province: '', city: '' },
  distanceKm: null,
  durationMin: null,
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

  // Admin
  admin: {
    isAdminOpen: false,
    isLoggedIn: false,
    adminUsername: '',
    loginError: '',
    activeTab: 'dashboard',
  },
  setAdminOpen: (open) => set((s) => ({ admin: { ...s.admin, isAdminOpen: open } })),
  adminLogin: (username, password) => {
    // Demo admin credentials
    if (username === 'admin' && password === 'sivan2024') {
      set((s) => ({ admin: { ...s.admin, isLoggedIn: true, adminUsername: username, loginError: '' } }));
      return true;
    }
    set((s) => ({ admin: { ...s.admin, loginError: 'نام کاربری یا رمز عبور اشتباه است' } }));
    return false;
  },
  adminLogout: () => set((s) => ({ admin: { ...s.admin, isLoggedIn: false, isAdminOpen: false, adminUsername: '', activeTab: 'dashboard' } })),
  setLoginError: (error) => set((s) => ({ admin: { ...s.admin, loginError: error } })),
  setAdminActiveTab: (tab) => set((s) => ({ admin: { ...s.admin, activeTab: tab } })),

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

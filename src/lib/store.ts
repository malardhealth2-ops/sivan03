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

interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface AuthState {
  isOpen: boolean;
  mode: 'login' | 'register';
  username: string;
  password: string;
  fullName: string;
  phone: string;
  error: string;
  user: AuthUser | null;
  isVerified: boolean;
}

interface DriverRegisterState {
  isOpen: boolean;
}

interface AdminState {
  isAdminOpen: boolean;
  isLoggedIn: boolean;
  adminUsername: string;
  loginError: string;
  activeTab: 'dashboard' | 'trips' | 'passengers' | 'drivers' | 'content' | 'blog' | 'pricing' | 'emails' | 'notifications' | 'settings';
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

  // Auth modal (phone OTP flow)
  auth: AuthState;
  openAuth: (mode: AuthState['mode']) => void;
  closeAuth: () => void;
  setAuthUsername: (username: string) => void;
  setAuthPassword: (password: string) => void;
  setAuthFullName: (fullName: string) => void;
  setAuthPhone: (phone: string) => void;
  setAuthError: (error: string) => void;
  setAuthUser: (user: AuthUser | null) => void;
  setAuthVerified: (val: boolean) => void;
  restoreAuth: () => void;
  authLogout: () => void;

  // Driver register modal
  driverRegister: DriverRegisterState;
  openDriverRegister: () => void;
  closeDriverRegister: () => void;

  // User panel (passenger dashboard overlay)
  userPanelOpen: boolean;
  setUserPanelOpen: (open: boolean) => void;

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
  setBookingStep: (step) => set((s) => ({ booking: { ...s.booking, currentStep: Math.min(Math.max(step, -1), 3) } })),
  updateBookingForm: (data) => set((s) => ({ booking: { ...s.booking, formData: { ...s.booking.formData, ...data } } })),
  setEstimatedPrice: (price, duration) => set((s) => ({ booking: { ...s.booking, estimatedPrice: price, estimatedDuration: duration } })),
  setBookingCode: (code) => set((s) => ({ booking: { ...s.booking, bookingCode: code } })),
  setBookingSubmitting: (val) => set((s) => ({ booking: { ...s.booking, isSubmitting: val } })),
  resetBooking: () => set({ booking: { currentStep: -1, formData: { ...initialBookingForm, originCity: { province: '', city: '' }, destCity: { province: '', city: '' } }, estimatedPrice: null, estimatedDuration: null, bookingCode: null, isSubmitting: false } }),

  // Auth
  auth: { isOpen: false, mode: 'login', username: '', password: '', fullName: '', phone: '', error: '', user: null, isVerified: false },
  openAuth: (mode) => set((s) => ({ auth: { ...s.auth, isOpen: true, mode, error: '' } })),
  closeAuth: () => set((s) => ({ auth: { ...s.auth, isOpen: false, username: '', password: '', fullName: '', phone: '', error: '', isVerified: false } })),
  setAuthUsername: (username) => set((s) => ({ auth: { ...s.auth, username } })),
  setAuthPassword: (password) => set((s) => ({ auth: { ...s.auth, password } })),
  setAuthFullName: (fullName) => set((s) => ({ auth: { ...s.auth, fullName } })),
  setAuthPhone: (phone) => set((s) => ({ auth: { ...s.auth, phone } })),
  setAuthError: (error) => set((s) => ({ auth: { ...s.auth, error } })),
  setAuthUser: (user) => {
    set((s) => ({ auth: { ...s.auth, user } }));
    // Persist to localStorage so the session survives page refreshes
    if (user) {
      try { localStorage.setItem('sivan_auth_user', JSON.stringify(user)); } catch { /* ignore */ }
    }
  },
  setAuthVerified: (val) => set((s) => ({ auth: { ...s.auth, isVerified: val } })),
  /** Restore auth user from localStorage (call on app mount). */
  restoreAuth: () => {
    try {
      const saved = localStorage.getItem('sivan_auth_user');
      if (saved) {
        const user: AuthUser = JSON.parse(saved);
        set((s) => ({ auth: { ...s.auth, user, isVerified: true } }));
      }
    } catch { /* ignore */ }
  },
  authLogout: () => {
    try { localStorage.removeItem('sivan_auth_user'); } catch { /* ignore */ }
    set((s) => ({ auth: { ...s.auth, isOpen: false, username: '', password: '', fullName: '', phone: '', error: '', user: null, isVerified: false }, userPanelOpen: false }));
  },

  // Driver register
  driverRegister: { isOpen: false },
  openDriverRegister: () => set({ driverRegister: { isOpen: true } }),
  closeDriverRegister: () => set({ driverRegister: { isOpen: false } }),

  // User panel
  userPanelOpen: false,
  setUserPanelOpen: (open) => set({ userPanelOpen: open }),

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
    if (username && password) {
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

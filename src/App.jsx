import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Phone, MapPin, Calendar, Wrench, AlertCircle, Clock, Home, Users, CalendarDays, Bell, Filter, ChevronLeft, ChevronRight, X, Settings, Shield, Trash2, Download, Upload, Key, LogOut, MessageCircle, Eye, EyeOff, Mail, Lock, FlaskConical } from 'lucide-react';

// Storage wrapper pentru localStorage (înlocuiește storage)
const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix = '') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return { keys };
  }
};

// Environment detection
const isDemo = window.location.hostname.includes('demo');
const ENV_CONFIG = {
  demo: {
    name: 'DEMO',
    primaryColor: 'purple',
    gradientFrom: 'from-purple-800',
    gradientVia: 'via-purple-900',
    gradientTo: 'to-slate-950',
    accentColor: 'purple-600',
    badgeColor: 'bg-purple-600',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    loginMethod: 'key', // License key login
    trialDays: 30
  },
  production: {
    name: 'PRODUCȚIE',
    primaryColor: 'blue',
    gradientFrom: 'from-slate-800',
    gradientVia: 'via-slate-900', 
    gradientTo: 'to-slate-950',
    accentColor: 'blue-600',
    badgeColor: 'bg-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    loginMethod: 'email', // Email only login
    trialDays: null
  }
};
const ENV = isDemo ? ENV_CONFIG.demo : ENV_CONFIG.production;

export default function BoilerCRM() {
  // License state
  const [licenseStatus, setLicenseStatus] = useState('checking'); // checking, inactive, active, expired, suspended
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginForm, setLoginForm] = useState({ licenseKey: '', password: '', email: '' });
  const [loginError, setLoginError] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [loginTab, setLoginTab] = useState(isDemo ? 'key' : 'email'); // Default based on environment
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [passwordChangeForm, setPasswordChangeForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Cookie consent
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always true, can't be disabled
    functional: false,
    analytics: false
  });
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  // Check cookie consent on mount
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieConsent(true);
    } else {
      setCookiePreferences(JSON.parse(consent));
    }
  }, []);

  const acceptAllCookies = () => {
    const prefs = { necessary: true, functional: true, analytics: true };
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    setCookiePreferences(prefs);
    setShowCookieConsent(false);
  };

  const rejectOptionalCookies = () => {
    const prefs = { necessary: true, functional: false, analytics: false };
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    setCookiePreferences(prefs);
    setShowCookieConsent(false);
  };

  const saveCookiePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(cookiePreferences));
    setShowCookieConsent(false);
    setShowCookieSettings(false);
  };

  const [activeTab, setActiveTab] = useState('today');
  const [appointmentsSubTab, setAppointmentsSubTab] = useState('active');
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('');
  const [filterPeriodicitate, setFilterPeriodicitate] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [revisionDates, setRevisionDates] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, type: 'delete' });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [expandedCustomerHistory, setExpandedCustomerHistory] = useState({});
  
  // Appointment filters
  const [appointmentFilterServiceType, setAppointmentFilterServiceType] = useState('');
  const [appointmentFilterDateFrom, setAppointmentFilterDateFrom] = useState('');
  const [appointmentFilterDateTo, setAppointmentFilterDateTo] = useState('');
  
  // Alerts sub-tab
  const [alertsSubTab, setAlertsSubTab] = useState('upcoming30');
  
  // GDPR settings
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [gdprInactivityMonths, setGdprInactivityMonths] = useState(24); // Default 2 years
  const [gdprAction, setGdprAction] = useState('anonymize'); // 'anonymize' or 'delete'
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  
  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState('customers'); // 'customers' or 'appointments'
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  
  // Ref for customer form
  const customerFormRef = useRef(null);
  // Ref for appointment form
  const appointmentFormRef = useRef(null);
  
  // Calendar picker state
  const [calendarPicker, setCalendarPicker] = useState({
    show: false,
    field: null, // 'appointmentDateTime', 'filterDateFrom', 'filterDateTo', etc.
    selectedDate: null,
    selectedHour: '09',
    selectedMinute: '00',
    currentMonth: new Date(),
    includeTime: false,
    validateFuture: false
  });
  const [overbookingWarning, setOverbookingWarning] = useState(null);
  
  // Customer search for appointment form
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);

  // Check license on load
  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      const activationData = await storage.get('app:activation');
      
      if (!activationData || !activationData.value) {
        setLicenseStatus('inactive');
        setShowLoginForm(true);
        return;
      }

      const activation = JSON.parse(activationData.value);
      const now = new Date();
      const expiresAt = new Date(activation.expiresAt);
      const days = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

      setLicenseInfo(activation);
      
      // For unlimited licenses, don't show days remaining warning
      if (activation.isUnlimited) {
        setDaysRemaining(null);
      } else {
        setDaysRemaining(days);
      }

      if (activation.status === 'suspended') {
        setLicenseStatus('suspended');
      } else if (days < 0 && !activation.isUnlimited) {
        setLicenseStatus('expired');
      } else {
        setLicenseStatus('active');
        // Update last login
        const updatedActivation = {
          ...activation,
          lastLoginAt: now.toISOString(),
          loginCount: (activation.loginCount || 0) + 1
        };
        await storage.set('app:activation', JSON.stringify(updatedActivation));
      }
    } catch (error) {
      console.error('Error checking license:', error);
      setLicenseStatus('inactive');
      setShowLoginForm(true);
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    
    const password = loginForm.password.trim();

    // DEMO environment: License Key login
    if (isDemo) {
      const key = loginForm.licenseKey.trim().toUpperCase();
      const emailInput = loginForm.email.trim().toLowerCase();
      
      if (!key || !password) {
        setLoginError('Introduceți cheia de licență și parola');
        return;
      }

      // Validate key format (XXXX-XXXX-XXXX-XXXX)
      const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (!keyPattern.test(key)) {
        setLoginError('Format cheie invalid. Formatul corect: XXXX-XXXX-XXXX-XXXX');
        return;
      }

      // Check if we have this activation stored locally (returning user)
      const existingActivation = await storage.get('app:activation');
      if (existingActivation) {
        const activation = JSON.parse(existingActivation.value);
        
        // If same key, check password
        if (activation.licenseKey === key) {
          if (activation.password && activation.password !== password) {
            setLoginError('Parolă incorectă');
            return;
          }
          
          // Check if expired
          if (activation.expiresAt) {
            const expiresAt = new Date(activation.expiresAt);
            const now = new Date();
            if (expiresAt < now) {
              setLoginError('Perioada de trial a expirat. Pentru acces complet, vizitați revizioapp.ro și deveniți client activ.');
              return;
            }
            const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            setDaysRemaining(daysLeft);
          }
          
          // Update login count (email can be updated if provided)
          const updatedActivation = {
            ...activation,
            email: emailInput || activation.email,
            lastLoginAt: new Date().toISOString(),
            loginCount: (activation.loginCount || 0) + 1
          };
          await storage.set('app:activation', JSON.stringify(updatedActivation));
          
          setLicenseInfo(updatedActivation);
          setLicenseStatus('active');
          setShowLoginForm(false);
          setLoginForm({ licenseKey: '', password: '', email: '' });
          return;
        }
      }

      // New activation - email is REQUIRED
      if (!emailInput || !emailInput.includes('@')) {
        setLoginError('Adresa de email este obligatorie pentru activare');
        return;
      }

      // New activation - create trial (DEMO only)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ENV.trialDays * 24 * 60 * 60 * 1000);
      
      const activation = {
        licenseKey: key,
        password: password,
        email: emailInput,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'trial',
        isUnlimited: false,
        environment: 'demo',
        lastLoginAt: now.toISOString(),
        loginCount: 1,
        loginType: 'key'
      };

      await storage.set('app:activation', JSON.stringify(activation));
      setLicenseInfo(activation);
      setDaysRemaining(ENV.trialDays);
      setLicenseStatus('active');
      setShowLoginForm(false);
      setLoginForm({ licenseKey: '', password: '', email: '' });
      
    } else {
      // PRODUCTION environment: Email login only
      const email = loginForm.email.trim().toLowerCase();
      
      if (!email || !password) {
        setLoginError('Introduceți emailul și parola');
        return;
      }

      // Check if we have stored activation
      const existingActivation = await storage.get('app:activation');
      
      if (existingActivation) {
        const activation = JSON.parse(existingActivation.value);
        
        // Check if email matches existing activation
        if (activation.email && activation.email.toLowerCase() === email) {
          if (activation.password !== password) {
            setLoginError('Parolă incorectă');
            return;
          }
          
          // Update login count
          const now = new Date();
          const updatedActivation = {
            ...activation,
            lastLoginAt: now.toISOString(),
            loginCount: (activation.loginCount || 0) + 1,
            loginType: 'email'
          };
          await storage.set('app:activation', JSON.stringify(updatedActivation));
          
          setLicenseInfo(updatedActivation);
          setDaysRemaining(null);
          
          // Check if must change password
          if (activation.mustChangePassword) {
            setMustChangePassword(true);
            setShowPasswordChange(true);
          } else {
            setLicenseStatus('active');
            setShowLoginForm(false);
          }
          
          setLoginForm({ licenseKey: '', password: '', email: '' });
          return;
        } else {
          // Different email than stored - this is a new account trying to activate
          // But we already have an activation, so reject or allow override?
          // For now, allow new activation (different user on same device)
        }
      }

      // NEW PAID ACCOUNT ACTIVATION (Production only)
      // Only reaches here if:
      // 1. No existing activation, OR
      // 2. Existing activation has different email (new user on same device)
      
      const now = new Date();
      const newActivation = {
        email: email,
        password: password,
        activatedAt: now.toISOString(),
        status: 'active',
        isUnlimited: true,
        environment: 'production',
        lastLoginAt: now.toISOString(),
        loginCount: 1,
        loginType: 'email',
        mustChangePassword: true // First login must change password
      };
      
      await storage.set('app:activation', JSON.stringify(newActivation));
      setLicenseInfo(newActivation);
      setDaysRemaining(null);
      
      // Force password change on first email login
      setMustChangePassword(true);
      setShowPasswordChange(true);
      setLoginForm({ licenseKey: '', password: '', email: '' });
    }
  };

  const handlePasswordChange = async () => {
    setPasswordChangeError('');
    
    const { newPassword, confirmPassword } = passwordChangeForm;
    
    if (!newPassword || !confirmPassword) {
      setPasswordChangeError('Completați ambele câmpuri');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordChangeError('Parola trebuie să aibă minim 6 caractere');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('Parolele nu coincid');
      return;
    }

    try {
      // Get current activation
      const activationData = await storage.get('app:activation');
      if (!activationData) {
        setPasswordChangeError('Eroare: sesiune invalidă');
        return;
      }
      
      const activation = JSON.parse(activationData.value);
      
      // Update activation with new password
      const updatedActivation = {
        ...activation,
        password: newPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString()
      };
      
      await storage.set('app:activation', JSON.stringify(updatedActivation));
      
      // Update licenseInfo state
      setLicenseInfo(updatedActivation);
      
      // Complete login
      setMustChangePassword(false);
      setShowPasswordChange(false);
      setPasswordChangeForm({ newPassword: '', confirmPassword: '' });
      setLicenseStatus('active');
      setShowLoginForm(false);
      
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordChangeError('Eroare la schimbarea parolei. Încercați din nou.');
    }
  };

  const handleChangePasswordFromSettings = async () => {
    setPasswordChangeError('');
    
    const { newPassword, confirmPassword } = passwordChangeForm;
    
    if (!newPassword || !confirmPassword) {
      setPasswordChangeError('Completați ambele câmpuri');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordChangeError('Parola trebuie să aibă minim 6 caractere');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('Parolele nu coincid');
      return;
    }

    try {
      const activationData = await storage.get('app:activation');
      if (!activationData) {
        setPasswordChangeError('Eroare: sesiune invalidă');
        return;
      }
      
      const activation = JSON.parse(activationData.value);
      const licenseData = await storage.get(activation.licenseId);
      
      if (!licenseData) {
        setPasswordChangeError('Eroare: licență negăsită');
        return;
      }
      
      const license = JSON.parse(licenseData.value);
      
      // Update password
      const updatedLicense = {
        ...license,
        password: newPassword,
        passwordChangedAt: new Date().toISOString()
      };
      
      await storage.set(license.id, JSON.stringify(updatedLicense));
      
      setShowPasswordChange(false);
      setPasswordChangeForm({ newPassword: '', confirmPassword: '' });
      alert('Parola a fost schimbată cu succes!');
      
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordChangeError('Eroare la schimbarea parolei. Încercați din nou.');
    }
  };

  const handleLogout = async () => {
    await storage.delete('app:activation');
    setLicenseStatus('inactive');
    setLicenseInfo(null);
    setShowLoginForm(true);
    setMustChangePassword(false);
    setShowPasswordChange(false);
  };
  
  const [customerForm, setCustomerForm] = useState({
    nume: '',
    telefon: '',
    adresa: '',
    tipCentrala: '',
    model: '',
    ultimaRevizie: '',
    proximaRevizie: '',
    tipServiciu: '',
    periodicitate: '',
    observatii: ''
  });

  const [appointmentForm, setAppointmentForm] = useState({
    customerId: '',
    data: '',
    ora: '',
    observatii: '',
    // Fields for new customer
    isNewCustomer: false,
    nume: '',
    telefon: '',
    adresa: '',
    tipServiciu: '',
    periodicitate: '',
    tipCentrala: '',
    model: '',
    ultimaRevizie: ''
  });

  useEffect(() => {
    loadCustomers();
    loadAppointments();
  }, []);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCustomers = async () => {
    try {
      const result = await storage.list('customer:');
      if (result && result.keys) {
        const customerData = await Promise.all(
          result.keys.map(async (key) => {
            const data = await storage.get(key);
            return data ? JSON.parse(data.value) : null;
          })
        );
        setCustomers(customerData.filter(Boolean));
      }
    } catch (error) {
      console.log('No existing customers');
    }
  };

  const loadAppointments = async () => {
    try {
      const result = await storage.list('appointment:');
      if (result && result.keys) {
        const appointmentData = await Promise.all(
          result.keys.map(async (key) => {
            const data = await storage.get(key);
            if (data) {
              const apt = JSON.parse(data.value);
              // Ensure all required fields exist
              return {
                ...apt,
                completed: apt.completed || false,
                cancelled: apt.cancelled || false
              };
            }
            return null;
          })
        );
        setAppointments(appointmentData.filter(Boolean));
      }
    } catch (error) {
      console.log('No existing appointments');
    }
  };

  const saveCustomer = async () => {
    const customer = {
      ...customerForm,
      id: editingCustomerId || `customer:${Date.now()}`,
      createdAt: editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.createdAt : new Date().toISOString()
    };

    await storage.set(customer.id, JSON.stringify(customer));
    await loadCustomers();
    resetCustomerForm();
  };

  const saveAppointment = async () => {
    let customerId = appointmentForm.customerId;
    let newCustomer = null;
    
    // If creating a new customer, save it first
    if (appointmentForm.isNewCustomer) {
      newCustomer = {
        id: `customer:${Date.now()}`,
        nume: appointmentForm.nume,
        telefon: appointmentForm.telefon,
        adresa: appointmentForm.adresa,
        tipServiciu: appointmentForm.tipServiciu,
        periodicitate: appointmentForm.periodicitate,
        tipCentrala: appointmentForm.tipCentrala,
        model: appointmentForm.model,
        ultimaRevizie: appointmentForm.ultimaRevizie,
        observatii: '',
        createdAt: new Date().toISOString()
      };
      
      customerId = newCustomer.id;
      // Update local state immediately
      setCustomers(prev => [...prev, newCustomer]);
      // Save to storage in background
      storage.set(newCustomer.id, JSON.stringify(newCustomer));
    }
    
    const existingAppointment = editingAppointmentId ? appointments.find(a => a.id === editingAppointmentId) : null;
    
    const appointment = {
      customerId: customerId,
      data: appointmentForm.data,
      ora: appointmentForm.ora,
      observatii: appointmentForm.observatii,
      tipServiciu: appointmentForm.tipServiciu,
      periodicitate: appointmentForm.periodicitate,
      tipCentrala: appointmentForm.tipCentrala || '',
      model: appointmentForm.model || '',
      completed: existingAppointment?.completed || false,
      cancelled: existingAppointment?.cancelled || false,
      id: editingAppointmentId || `appointment:${Date.now()}`,
      createdAt: existingAppointment?.createdAt || new Date().toISOString()
    };

    // Update local state immediately
    if (editingAppointmentId) {
      setAppointments(prev => prev.map(a => a.id === editingAppointmentId ? appointment : a));
    } else {
      setAppointments(prev => [...prev, appointment]);
    }
    
    // Save to storage in background
    storage.set(appointment.id, JSON.stringify(appointment));
    resetAppointmentForm();
  };

  const deleteCustomer = async (id) => {
    // Find all appointments for this customer
    const customerAppointments = appointments.filter(apt => apt.customerId === id);
    const appointmentCount = customerAppointments.length;
    
    setConfirmDialog({
      show: true,
      message: appointmentCount > 0 
        ? `Sigur doriți să ștergeți acest client și cele ${appointmentCount} programări asociate? Această acțiune nu poate fi anulată.`
        : 'Sigur doriți să ștergeți acest client? Această acțiune nu poate fi anulată.',
      type: 'delete',
      onConfirm: async () => {
        // Delete all appointments for this customer
        for (const apt of customerAppointments) {
          storage.delete(apt.id);
        }
        
        // Delete the customer
        await storage.delete(id);
        
        // Update local state immediately
        setAppointments(prev => prev.filter(apt => apt.customerId !== id));
        setCustomers(prev => prev.filter(c => c.id !== id));
        
        setConfirmDialog({ show: false, message: '', onConfirm: null, type: 'delete' });
      }
    });
  };

  const deleteAppointment = async (id) => {
    setConfirmDialog({
      show: true,
      message: 'Sigur doriți să ștergeți această programare?',
      type: 'delete',
      onConfirm: async () => {
        await storage.delete(id);
        await loadAppointments();
        setConfirmDialog({ show: false, message: '', onConfirm: null, type: 'delete' });
      }
    });
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  // Export functions
  const exportCustomersCSV = () => {
    // Export selected customers if any, otherwise export all
    const customersToExport = selectedCustomers.length > 0 
      ? customers.filter(c => selectedCustomers.includes(c.id))
      : customers;
    
    if (customersToExport.length === 0) {
      alert('Nu există clienți de exportat.');
      return;
    }
    
    const headers = ['Nume', 'Telefon', 'Adresa', 'Tip Serviciu', 'Periodicitate', 'Tip Centrala', 'Model', 'Ultima Revizie', 'Data Creare'];
    
    const rows = customersToExport.map(c => [
      c.nume || '',
      c.telefon || '',
      c.adresa || '',
      c.tipServiciu || '',
      c.periodicitate || '',
      c.tipCentrala || '',
      c.model || '',
      c.ultimaRevizie || '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('ro-RO') : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    try {
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `clienti_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      // Fallback: open in new window
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + csvContent);
      window.open(dataUri, '_blank');
    }
  };

  const exportAppointmentsCSV = () => {
    if (appointments.length === 0) {
      alert('Nu există programări de exportat.');
      return;
    }
    
    const headers = ['Client', 'Telefon', 'Adresa', 'Data Programare', 'Ora', 'Tip Serviciu', 'Periodicitate', 'Tip Centrala', 'Model', 'Status', 'Observatii Programare', 'Observatii Finalizare', 'Data Finalizare'];
    
    const rows = appointments.map(apt => {
      const customer = getCustomerById(apt.customerId);
      const status = apt.completed ? 'Finalizat' : apt.cancelled ? 'Anulat' : 'Activ';
      
      return [
        customer?.nume || 'Client șters',
        customer?.telefon || '',
        customer?.adresa || '',
        apt.data || '',
        apt.ora || '',
        apt.tipServiciu || '',
        apt.periodicitate || '',
        apt.tipCentrala || customer?.tipCentrala || '',
        apt.model || customer?.model || '',
        status,
        apt.observatii || '',
        apt.observatiiFinalizare || '',
        apt.completedAt ? new Date(apt.completedAt).toLocaleDateString('ro-RO') : ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    try {
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `programari_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      // Fallback: open in new window
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + csvContent);
      window.open(dataUri, '_blank');
    }
  };

  // Import CSV functions
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    
    const parseRow = (row) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(line => parseRow(line));
    
    return { headers, rows };
  };

  const importCustomersCSV = async (file) => {
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      
      // Expected headers: Nume, Telefon, Adresa, Tip Serviciu, Periodicitate, Tip Centrala, Model, Ultima Revizie
      const headerMap = {};
      headers.forEach((h, i) => {
        const normalized = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes('nume')) headerMap.nume = i;
        else if (normalized.includes('telefon')) headerMap.telefon = i;
        else if (normalized.includes('adresa')) headerMap.adresa = i;
        else if (normalized.includes('tip') && normalized.includes('serviciu')) headerMap.tipServiciu = i;
        else if (normalized.includes('periodicitate')) headerMap.periodicitate = i;
        else if (normalized.includes('tip') && normalized.includes('centrala')) headerMap.tipCentrala = i;
        else if (normalized.includes('model')) headerMap.model = i;
        else if (normalized.includes('ultima') && normalized.includes('revizie')) headerMap.ultimaRevizie = i;
      });
      
      let imported = 0;
      let skipped = 0;
      let duplicates = 0;
      
      for (const row of rows) {
        const nume = row[headerMap.nume] || '';
        const telefon = row[headerMap.telefon] || '';
        
        if (!nume && !telefon) {
          skipped++;
          continue;
        }
        
        // Check for duplicates by phone number
        const existingCustomer = customers.find(c => 
          c.telefon && telefon && c.telefon.replace(/\s/g, '') === telefon.replace(/\s/g, '')
        );
        
        if (existingCustomer) {
          duplicates++;
          continue;
        }
        
        const newCustomer = {
          id: `customer:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nume,
          telefon,
          adresa: row[headerMap.adresa] || '',
          tipServiciu: row[headerMap.tipServiciu] || 'Revizie',
          periodicitate: row[headerMap.periodicitate] || 'Anual',
          tipCentrala: row[headerMap.tipCentrala] || '',
          model: row[headerMap.model] || '',
          ultimaRevizie: row[headerMap.ultimaRevizie] || '',
          createdAt: new Date().toISOString(),
          serviceHistory: []
        };
        
        await storage.set(newCustomer.id, JSON.stringify(newCustomer));
        imported++;
      }
      
      await loadData();
      setImportResult({
        success: true,
        imported,
        skipped,
        duplicates,
        total: rows.length
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: 'Eroare la citirea fișierului. Verificați formatul CSV.'
      });
    }
  };

  const importAppointmentsCSV = async (file) => {
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      
      // Expected headers: Client/Nume, Telefon, Data Programare, Ora, Tip Serviciu, etc.
      const headerMap = {};
      headers.forEach((h, i) => {
        const normalized = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes('client') || normalized === 'nume') headerMap.nume = i;
        else if (normalized.includes('telefon')) headerMap.telefon = i;
        else if (normalized.includes('adresa')) headerMap.adresa = i;
        else if (normalized.includes('data')) headerMap.data = i;
        else if (normalized.includes('ora')) headerMap.ora = i;
        else if (normalized.includes('tip') && normalized.includes('serviciu')) headerMap.tipServiciu = i;
        else if (normalized.includes('periodicitate')) headerMap.periodicitate = i;
        else if (normalized.includes('tip') && normalized.includes('centrala')) headerMap.tipCentrala = i;
        else if (normalized.includes('model')) headerMap.model = i;
        else if (normalized.includes('observatii') && !normalized.includes('finalizare')) headerMap.observatii = i;
        else if (normalized.includes('status')) headerMap.status = i;
      });
      
      let imported = 0;
      let skipped = 0;
      let customersCreated = 0;
      
      for (const row of rows) {
        const nume = row[headerMap.nume] || '';
        const telefon = row[headerMap.telefon] || '';
        let dataStr = row[headerMap.data] || '';
        
        // Try to parse date in various formats
        let data = '';
        if (dataStr) {
          // Try DD.MM.YYYY or DD/MM/YYYY format
          const parts = dataStr.split(/[.\/]/);
          if (parts.length === 3) {
            const [day, month, year] = parts;
            if (year.length === 4) {
              data = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } else if (dataStr.includes('-')) {
            // Already YYYY-MM-DD format
            data = dataStr;
          }
        }
        
        if (!data) {
          skipped++;
          continue;
        }
        
        // Find or create customer
        let customer = customers.find(c => 
          c.telefon && telefon && c.telefon.replace(/\s/g, '') === telefon.replace(/\s/g, '')
        );
        
        if (!customer && nume) {
          // Create new customer
          customer = {
            id: `customer:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nume,
            telefon,
            adresa: row[headerMap.adresa] || '',
            tipServiciu: row[headerMap.tipServiciu] || 'Revizie',
            periodicitate: row[headerMap.periodicitate] || 'Anual',
            tipCentrala: row[headerMap.tipCentrala] || '',
            model: row[headerMap.model] || '',
            ultimaRevizie: '',
            createdAt: new Date().toISOString(),
            serviceHistory: []
          };
          await storage.set(customer.id, JSON.stringify(customer));
          customersCreated++;
          // Add to local array for subsequent lookups
          customers.push(customer);
        }
        
        if (!customer) {
          skipped++;
          continue;
        }
        
        const status = (row[headerMap.status] || '').toLowerCase();
        const completed = status.includes('finalizat');
        const cancelled = status.includes('anulat');
        
        const newAppointment = {
          id: `appointment:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          customerId: customer.id,
          data,
          ora: row[headerMap.ora] || '10:00',
          tipServiciu: row[headerMap.tipServiciu] || customer.tipServiciu || 'Revizie',
          periodicitate: row[headerMap.periodicitate] || customer.periodicitate || 'Anual',
          tipCentrala: row[headerMap.tipCentrala] || customer.tipCentrala || '',
          model: row[headerMap.model] || customer.model || '',
          observatii: row[headerMap.observatii] || '',
          completed,
          cancelled,
          createdAt: new Date().toISOString()
        };
        
        await storage.set(newAppointment.id, JSON.stringify(newAppointment));
        imported++;
      }
      
      await loadData();
      setImportResult({
        success: true,
        imported,
        skipped,
        customersCreated,
        total: rows.length
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: 'Eroare la citirea fișierului. Verificați formatul CSV.'
      });
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (importType === 'customers') {
      importCustomersCSV(file);
    } else {
      importAppointmentsCSV(file);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const deleteBulkCustomers = async () => {
    // Find all appointments for selected customers
    const customerAppointments = appointments.filter(apt => selectedCustomers.includes(apt.customerId));
    const appointmentCount = customerAppointments.length;
    
    setConfirmDialog({
      show: true,
      message: appointmentCount > 0 
        ? `Sigur doriți să ștergeți ${selectedCustomers.length} clienți și cele ${appointmentCount} programări asociate? Această acțiune nu poate fi anulată.`
        : `Sigur doriți să ștergeți ${selectedCustomers.length} clienți? Această acțiune nu poate fi anulată.`,
      type: 'delete',
      onConfirm: async () => {
        // Delete all appointments for selected customers
        for (const apt of customerAppointments) {
          storage.delete(apt.id);
        }
        
        // Delete all selected customers
        for (const id of selectedCustomers) {
          storage.delete(id);
        }
        
        // Update local state immediately
        setAppointments(prev => prev.filter(apt => !selectedCustomers.includes(apt.customerId)));
        setCustomers(prev => prev.filter(c => !selectedCustomers.includes(c.id)));
        setSelectedCustomers([]);
        
        setConfirmDialog({ show: false, message: '', onConfirm: null, type: 'delete' });
      }
    });
  };

  // GDPR Functions
  const getInactiveCustomers = (months) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    return customers.filter(customer => {
      // Check if customer has any active (non-completed, non-cancelled) appointments
      const hasActiveAppointment = appointments.some(apt => 
        apt.customerId === customer.id && !apt.completed && !apt.cancelled
      );
      
      if (hasActiveAppointment) return false;
      
      // Find the most recent activity (appointment completion or cancellation)
      const customerAppointments = appointments.filter(apt => apt.customerId === customer.id);
      
      if (customerAppointments.length === 0) {
        // No appointments - check customer creation date
        const createdAt = customer.createdAt ? new Date(customer.createdAt) : new Date(0);
        return createdAt < cutoffDate;
      }
      
      // Find most recent activity date
      let lastActivityDate = new Date(0);
      customerAppointments.forEach(apt => {
        if (apt.completedAt) {
          const date = new Date(apt.completedAt);
          if (date > lastActivityDate) lastActivityDate = date;
        }
        if (apt.cancelledAt) {
          const date = new Date(apt.cancelledAt);
          if (date > lastActivityDate) lastActivityDate = date;
        }
        // Also check appointment date itself
        const aptDate = new Date(apt.data);
        if (aptDate > lastActivityDate) lastActivityDate = aptDate;
      });
      
      return lastActivityDate < cutoffDate;
    });
  };

  const openGdprModal = () => {
    const inactive = getInactiveCustomers(gdprInactivityMonths);
    setInactiveCustomers(inactive);
    setShowGdprModal(true);
  };

  const anonymizeCustomer = (customer) => {
    return {
      ...customer,
      nume: 'Client Anonim',
      telefon: '0000000000',
      adresa: 'Adresă anonimizată',
      observatii: '',
      anonymizedAt: new Date().toISOString()
    };
  };

  const executeGdprAction = async () => {
    if (inactiveCustomers.length === 0) {
      setShowGdprModal(false);
      return;
    }

    const actionText = gdprAction === 'delete' ? 'șterge' : 'anonimiza';
    
    setConfirmDialog({
      show: true,
      message: `Sigur doriți să ${actionText} ${inactiveCustomers.length} clienți inactivi${gdprAction === 'delete' ? ' și programările lor' : ''}? Această acțiune nu poate fi anulată.`,
      type: 'delete',
      onConfirm: async () => {
        if (gdprAction === 'delete') {
          // Delete customers and their appointments
          for (const customer of inactiveCustomers) {
            const customerAppointments = appointments.filter(apt => apt.customerId === customer.id);
            for (const apt of customerAppointments) {
              storage.delete(apt.id);
            }
            storage.delete(customer.id);
          }
          
          const inactiveIds = inactiveCustomers.map(c => c.id);
          setAppointments(prev => prev.filter(apt => !inactiveIds.includes(apt.customerId)));
          setCustomers(prev => prev.filter(c => !inactiveIds.includes(c.id)));
        } else {
          // Anonymize customers
          for (const customer of inactiveCustomers) {
            const anonymized = anonymizeCustomer(customer);
            storage.set(customer.id, JSON.stringify(anonymized));
          }
          
          setCustomers(prev => prev.map(c => {
            const inactive = inactiveCustomers.find(ic => ic.id === c.id);
            return inactive ? anonymizeCustomer(c) : c;
          }));
        }
        
        setInactiveCustomers([]);
        setShowGdprModal(false);
        setConfirmDialog({ show: false, message: '', onConfirm: null, type: 'delete' });
      }
    });
  };

  const cancelAppointment = async (appointment) => {
    setConfirmDialog({
      show: true,
      message: 'Sigur doriți să anulați această programare?',
      type: 'cancel',
      onConfirm: async () => {
        const cancelDate = new Date().toISOString();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const cancelDateOnly = `${year}-${month}-${day}`;
        
        // Update appointment as cancelled
        const updatedAppointment = {
          ...appointment,
          cancelled: true,
          cancelledAt: cancelDate
        };
        
        // For non-revision services, update customer's ultimaProgramare
        const revisionServices = [
          "Verificare/Revizie Instalație Gaze",
          "Pachet Verificare/Revizie cu Centrală"
        ];
        
        // Update local state IMMEDIATELY
        setAppointments(prev => prev.map(a => a.id === appointment.id ? updatedAppointment : a));
        
        if (!revisionServices.includes(appointment.tipServiciu)) {
          const customer = getCustomerById(appointment.customerId);
          if (customer) {
            const updatedCustomer = {
              ...customer,
              ultimaProgramare: cancelDateOnly
            };
            setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
            // Save to storage in background
            storage.set(customer.id, JSON.stringify(updatedCustomer));
          }
        }
        
        // Save to storage in background
        storage.set(appointment.id, JSON.stringify(updatedAppointment));
        setConfirmDialog({ show: false, message: '', onConfirm: null, type: 'delete' });
      }
    });
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      nume: '',
      telefon: '',
      adresa: '',
      tipCentrala: '',
      model: '',
      ultimaRevizie: '',
      proximaRevizie: '',
      tipServiciu: '',
      periodicitate: '',
      observatii: ''
    });
    setShowCustomerForm(false);
    setEditingCustomerId(null);
  };

  const resetAppointmentForm = () => {
    setAppointmentForm({
      customerId: '',
      data: '',
      ora: '',
      observatii: '',
      isNewCustomer: false,
      nume: '',
      telefon: '',
      adresa: '',
      tipServiciu: '',
      periodicitate: '',
      tipCentrala: '',
      model: '',
      ultimaRevizie: ''
    });
    setCustomerSearchTerm('');
    setShowCustomerDropdown(false);
    setShowAppointmentForm(false);
    setEditingAppointmentId(null);
  };

  const editCustomer = (customer) => {
    setCustomerForm(customer);
    setEditingCustomerId(customer.id);
    setShowCustomerForm(true);
    // Scroll to form after state updates
    setTimeout(() => {
      customerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const editAppointment = (appointment) => {
    const customer = getCustomerById(appointment.customerId);
    setAppointmentForm({
      customerId: appointment.customerId || '',
      data: appointment.data || '',
      ora: appointment.ora || '',
      observatii: appointment.observatii || '',
      isNewCustomer: false,
      nume: customer?.nume || '',
      telefon: customer?.telefon || '',
      adresa: customer?.adresa || '',
      tipServiciu: appointment.tipServiciu || '',
      periodicitate: appointment.periodicitate || '',
      tipCentrala: appointment.tipCentrala || '',
      model: appointment.model || '',
      ultimaRevizie: customer?.ultimaRevizie || ''
    });
    setEditingAppointmentId(appointment.id);
    setShowAppointmentForm(true);
    // Switch to today tab where the form is displayed
    setActiveTab('today');
    // Scroll to form after a short delay
    setTimeout(() => {
      appointmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const filteredCustomers = customers.filter(c => {
    // Search by name, phone, or address
    const matchesSearch = c.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefon.includes(searchTerm) ||
      c.adresa.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Get customer's appointments for filtering
    const customerAppointments = appointments.filter(apt => apt.customerId === c.id);
    
    // Filter by service type - check both customer data and appointments
    let matchesService = true;
    if (filterServiceType) {
      const hasServiceInCustomer = c.tipServiciu === filterServiceType;
      const hasServiceInAppointments = customerAppointments.some(apt => apt.tipServiciu === filterServiceType);
      matchesService = hasServiceInCustomer || hasServiceInAppointments;
    }
    
    // Filter by periodicitate - check both customer data and appointments
    let matchesPeriodicitate = true;
    if (filterPeriodicitate) {
      const hasPeriodicInCustomer = c.periodicitate === filterPeriodicitate;
      const hasPeriodicInAppointments = customerAppointments.some(apt => apt.periodicitate === filterPeriodicitate);
      matchesPeriodicitate = hasPeriodicInCustomer || hasPeriodicInAppointments;
    }
    
    return matchesSearch && matchesService && matchesPeriodicitate;
  });

  const getTodayAppointments = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    return appointments
      .filter(a => a.data === today && !a.completed && !a.cancelled)
      .sort((a, b) => a.ora.localeCompare(b.ora)); // Earliest time first
  };

  const getTomorrowAppointments = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${year}-${month}-${day}`;
    
    return appointments
      .filter(a => a.data === tomorrowStr && !a.completed && !a.cancelled)
      .sort((a, b) => a.ora.localeCompare(b.ora));
  };

  const sendWhatsAppReminder = (appointment, customer) => {
    if (!customer || !customer.telefon) return;
    
    // Format phone number for WhatsApp
    let phone = customer.telefon.replace(/\s/g, '').replace(/^0/, '40');
    if (!phone.startsWith('+') && !phone.startsWith('40')) {
      phone = '40' + phone;
    }
    
    // Format date nicely
    const aptDate = new Date(appointment.data);
    const dateStr = aptDate.toLocaleDateString('ro-RO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    // Create reminder message
    const message = `Bună ziua ${customer.nume}! 👋

Vă reamintim că aveți programare *mâine, ${dateStr}* la ora *${appointment.ora}*.

📍 Adresa: ${customer.adresa}
🔧 Serviciu: ${appointment.tipServiciu || customer.tipServiciu || 'Revizie'}

Vă rugăm să confirmați prezența răspunzând la acest mesaj.

Mulțumim! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  // Get revision alerts based on completed appointments with specific service types
  const getRevisionAlerts = () => {
    const validServiceTypes = [
      "Verificare/Revizie Instalație Gaze",
      "Pachet Verificare/Revizie cu Centrală"
    ];
    
    // Find completed appointments with valid service types
    const completedRevisions = appointments.filter(apt => 
      apt.completed && 
      validServiceTypes.includes(apt.tipServiciu) &&
      apt.completedAt &&
      apt.periodicitate
    );
    
    // Calculate next revision date for each
    const alertsData = completedRevisions.map(apt => {
      const customer = customers.find(c => c.id === apt.customerId);
      if (!customer) return null;
      
      const completedDate = new Date(apt.completedAt);
      let nextRevisionDate = new Date(completedDate);
      
      // Add years based on periodicity
      if (apt.periodicitate === "Verificare periodică la 2 ani instalație gaze") {
        nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 2);
      } else if (apt.periodicitate === "Verificare periodică la 10 ani instalație gaze") {
        nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 10);
      }
      
      return {
        customer,
        appointment: apt,
        nextRevisionDate,
        completedDate
      };
    }).filter(Boolean);
    
    // Sort by next revision date
    return alertsData.sort((a, b) => a.nextRevisionDate - b.nextRevisionDate);
  };

  const getUpcomingAlerts = () => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days from today
    
    return getRevisionAlerts().filter(alert => {
      return alert.nextRevisionDate >= today && alert.nextRevisionDate <= endDate;
    });
  };

  const getAllFutureAlerts = () => {
    const today = new Date();
    
    return getRevisionAlerts().filter(alert => {
      return alert.nextRevisionDate >= today;
    });
  };

  const getAllAppointments = () => {
    return appointments.sort((a, b) => {
      const dateCompare = b.data.localeCompare(a.data); // Most recent first
      if (dateCompare !== 0) return dateCompare;
      return b.ora.localeCompare(a.ora); // Most recent first
    });
  };

  // Filter function for appointments
  const filterAppointments = (appointmentsList) => {
    return appointmentsList.filter(a => {
      // Filter by service type
      const matchesService = appointmentFilterServiceType === '' || a.tipServiciu === appointmentFilterServiceType;
      
      // Filter by date range
      let matchesDateFrom = true;
      let matchesDateTo = true;
      
      if (appointmentFilterDateFrom) {
        matchesDateFrom = a.data >= appointmentFilterDateFrom;
      }
      if (appointmentFilterDateTo) {
        matchesDateTo = a.data <= appointmentFilterDateTo;
      }
      
      return matchesService && matchesDateFrom && matchesDateTo;
    });
  };

  const getActiveAppointments = (applyFilters = false) => {
    let result = appointments
      .filter(a => !a.completed && !a.cancelled)
      .sort((a, b) => {
        const dateCompare = a.data.localeCompare(b.data); // Earliest date first
        if (dateCompare !== 0) return dateCompare;
        return a.ora.localeCompare(b.ora); // Earliest time first
      });
    
    return applyFilters ? filterAppointments(result) : result;
  };

  const getCancelledAppointments = (applyFilters = false) => {
    let result = appointments
      .filter(a => a.cancelled)
      .sort((a, b) => {
        const dateCompare = b.data.localeCompare(a.data);
        if (dateCompare !== 0) return dateCompare;
        return b.ora.localeCompare(a.ora);
      });
    
    return applyFilters ? filterAppointments(result) : result;
  };

  const getCompletedAppointments = (applyFilters = false) => {
    let result = appointments
      .filter(a => a.completed)
      .sort((a, b) => {
        const dateCompare = b.data.localeCompare(a.data);
        if (dateCompare !== 0) return dateCompare;
        return b.ora.localeCompare(a.ora);
      });
    
    return applyFilters ? filterAppointments(result) : result;
  };

  const resetAppointmentFilters = () => {
    setAppointmentFilterServiceType('');
    setAppointmentFilterDateFrom('');
    setAppointmentFilterDateTo('');
  };

  const hasActiveFilters = appointmentFilterServiceType || appointmentFilterDateFrom || appointmentFilterDateTo;

  const getCustomerById = (id) => {
    return customers.find(c => c.id === id);
  };

  // Get last revision date from completed appointments for a customer
  const getLastRevisionDate = (customerId) => {
    const revisionServices = [
      "Verificare/Revizie Instalație Gaze",
      "Pachet Verificare/Revizie cu Centrală"
    ];
    
    const completedRevisions = appointments
      .filter(apt => 
        apt.customerId === customerId &&
        apt.completed &&
        apt.completedAt &&
        revisionServices.includes(apt.tipServiciu)
      )
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Most recent first
    
    if (completedRevisions.length > 0) {
      return completedRevisions[0].completedAt.split('T')[0];
    }
    return null;
  };

  // Get last programare date from completed or cancelled appointments for non-revision services
  const getLastProgramareDate = (customerId) => {
    const revisionServices = [
      "Verificare/Revizie Instalație Gaze",
      "Pachet Verificare/Revizie cu Centrală"
    ];
    
    const completedOrCancelledProgramari = appointments
      .filter(apt => 
        apt.customerId === customerId &&
        (apt.completed || apt.cancelled) &&
        (apt.completedAt || apt.cancelledAt) &&
        !revisionServices.includes(apt.tipServiciu)
      )
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.cancelledAt);
        const dateB = new Date(b.completedAt || b.cancelledAt);
        return dateB - dateA; // Most recent first
      });
    
    if (completedOrCancelledProgramari.length > 0) {
      const lastApt = completedOrCancelledProgramari[0];
      const lastDate = lastApt.completedAt || lastApt.cancelledAt;
      return lastDate.split('T')[0];
    }
    return null;
  };

  // Get last observations from completed appointment
  const getLastObservatii = (customerId) => {
    const completedApts = appointments
      .filter(apt => 
        apt.customerId === customerId &&
        apt.completed &&
        apt.completedAt &&
        apt.observatiiFinalizare &&
        apt.observatiiFinalizare.trim()
      )
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Most recent first
    
    if (completedApts.length > 0) {
      return completedApts[0].observatiiFinalizare;
    }
    return null;
  };

  // Get all appointments (completed or cancelled) for a customer, sorted by date descending
  const getCustomerAppointmentHistory = (customerId) => {
    return appointments
      .filter(apt => 
        apt.customerId === customerId && 
        (apt.completed || apt.cancelled)
      )
      .sort((a, b) => {
        // Sort by appointment date and time (data + ora), most recent first
        const dateTimeA = new Date(`${a.data}T${a.ora}`);
        const dateTimeB = new Date(`${b.data}T${b.ora}`);
        return dateTimeB - dateTimeA;
      });
  };

  // Get the most recent appointment (completed or cancelled) for a customer
  const getMostRecentAppointment = (customerId) => {
    const history = getCustomerAppointmentHistory(customerId);
    return history.length > 0 ? history[0] : null;
  };

  // Toggle customer history expansion
  const toggleCustomerHistory = (customerId) => {
    setExpandedCustomerHistory(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  // Format date with Romanian month names
  const formatDateRomanian = (dateStr) => {
    const date = new Date(dateStr);
    const months = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sep.', 'oct.', 'nov.', 'dec.'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  // Customer search functions for appointment form
  const getFilteredCustomersForSearch = () => {
    if (!customerSearchTerm.trim()) return customers;
    const term = customerSearchTerm.toLowerCase();
    return customers.filter(c => 
      c.nume.toLowerCase().includes(term) ||
      c.telefon.includes(term) ||
      c.adresa.toLowerCase().includes(term)
    );
  };

  const selectCustomerFromSearch = (customer) => {
    setAppointmentForm(prev => ({ ...prev, customerId: customer.id }));
    setCustomerSearchTerm(`${customer.nume} - ${customer.telefon}`);
    setShowCustomerDropdown(false);
  };

  const clearCustomerSelection = () => {
    setAppointmentForm(prev => ({ ...prev, customerId: '' }));
    setCustomerSearchTerm('');
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    return { daysInMonth, startingDay };
  };

  const monthNames = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
                      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
  const dayNames = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

  const openCalendarPicker = (field, includeTime = false, validateFuture = false, currentValue = '') => {
    let initialDate = new Date();
    let initialHour = '09';
    let initialMinute = '00';
    
    if (currentValue) {
      if (includeTime && appointmentForm.ora) {
        const [h, m] = appointmentForm.ora.split(':');
        initialHour = h || '09';
        initialMinute = m || '00';
      }
      const parsed = new Date(currentValue);
      if (!isNaN(parsed)) {
        initialDate = parsed;
      }
    }
    
    setCalendarPicker({
      show: true,
      field,
      selectedDate: currentValue ? new Date(currentValue) : null,
      selectedHour: initialHour,
      selectedMinute: initialMinute,
      currentMonth: initialDate,
      includeTime,
      validateFuture
    });
    setOverbookingWarning(null);
  };

  const closeCalendarPicker = () => {
    setCalendarPicker(prev => ({ ...prev, show: false }));
    setOverbookingWarning(null);
  };

  const isDateInPast = (date, hour, minute) => {
    const now = new Date();
    const selected = new Date(date);
    selected.setHours(parseInt(hour), parseInt(minute), 0, 0);
    return selected < now;
  };

  const isDayInPast = (year, month, day) => {
    const now = new Date();
    const checkDate = new Date(year, month, day);
    
    // Set check date to start of day for comparison
    const checkDateStart = new Date(year, month, day, 0, 0, 0, 0);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    
    // If the date is before today, it's in the past
    if (checkDateStart < todayStart) {
      return true;
    }
    
    // If it's today, check if all working hours (07-20) have passed
    if (checkDateStart.getTime() === todayStart.getTime()) {
      const lastWorkingHour = 20;
      // If current hour is past the last working hour, consider today as "past"
      if (now.getHours() >= lastWorkingHour) {
        return true;
      }
    }
    
    return false;
  };

  const checkOverbooking = (date, hour, minute) => {
    // Format date as YYYY-MM-DD using local date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hour}:${minute}`;
    
    const conflicting = appointments.filter(apt => 
      apt.data === dateStr && 
      apt.ora === timeStr && 
      !apt.completed && 
      !apt.cancelled &&
      apt.id !== editingAppointmentId
    );
    
    return conflicting.length > 0;
  };

  const getAvailableSlots = (startDate, count = 5) => {
    const slots = [];
    const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
    const minutes = ['00', '30'];
    const now = new Date();
    
    let currentDate = new Date(startDate);
    let daysChecked = 0;
    
    while (slots.length < count && daysChecked < 30) {
      // Format date as YYYY-MM-DD using local date
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      for (const hour of hours) {
        for (const minute of minutes) {
          const slotTime = new Date(currentDate);
          slotTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
          
          if (slotTime > now) {
            const isBooked = appointments.some(apt => 
              apt.data === dateStr && 
              apt.ora === `${hour}:${minute}` && 
              !apt.completed && 
              !apt.cancelled
            );
            
            if (!isBooked) {
              slots.push({ date: new Date(currentDate), hour, minute });
              if (slots.length >= count) break;
            }
          }
        }
        if (slots.length >= count) break;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
    
    return slots;
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(calendarPicker.currentMonth.getFullYear(), calendarPicker.currentMonth.getMonth(), day);
    
    if (calendarPicker.validateFuture && isDayInPast(newDate.getFullYear(), newDate.getMonth(), day)) {
      return; // Don't allow past dates
    }
    
    // If selecting today and validateFuture is on, auto-select next valid time
    let newHour = calendarPicker.selectedHour;
    let newMinute = calendarPicker.selectedMinute;
    
    if (calendarPicker.validateFuture && calendarPicker.includeTime) {
      const now = new Date();
      const isToday = newDate.getDate() === now.getDate() &&
        newDate.getMonth() === now.getMonth() &&
        newDate.getFullYear() === now.getFullYear();
      
      if (isToday) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // If selected hour is in the past, move to current hour or next
        if (parseInt(newHour) < currentHour) {
          newHour = String(currentHour).padStart(2, '0');
        }
        
        // If we're in the current hour, check minutes
        if (parseInt(newHour) === currentHour) {
          const validMinutes = ['00', '15', '30', '45'].filter(m => parseInt(m) > currentMinute);
          if (validMinutes.length > 0) {
            newMinute = validMinutes[0];
          } else {
            // Move to next hour
            newHour = String(currentHour + 1).padStart(2, '0');
            newMinute = '00';
          }
        }
        
        // If hour is beyond working hours, set to first slot
        if (parseInt(newHour) > 20) {
          newHour = '07';
          newMinute = '00';
        }
      }
    }
    
    setCalendarPicker(prev => ({ 
      ...prev, 
      selectedDate: newDate,
      selectedHour: newHour,
      selectedMinute: newMinute
    }));
    
    if (calendarPicker.includeTime) {
      // Check for overbooking
      if (checkOverbooking(newDate, newHour, newMinute)) {
        const suggestions = getAvailableSlots(newDate);
        setOverbookingWarning({ suggestions });
      } else {
        setOverbookingWarning(null);
      }
    }
  };

  const handleTimeChange = (hour, minute) => {
    setCalendarPicker(prev => ({ 
      ...prev, 
      selectedHour: hour !== undefined ? hour : prev.selectedHour,
      selectedMinute: minute !== undefined ? minute : prev.selectedMinute
    }));
    
    if (calendarPicker.selectedDate) {
      const h = hour !== undefined ? hour : calendarPicker.selectedHour;
      const m = minute !== undefined ? minute : calendarPicker.selectedMinute;
      
      if (checkOverbooking(calendarPicker.selectedDate, h, m)) {
        const suggestions = getAvailableSlots(calendarPicker.selectedDate);
        setOverbookingWarning({ suggestions });
      } else {
        setOverbookingWarning(null);
      }
    }
  };

  const confirmCalendarSelection = () => {
    if (!calendarPicker.selectedDate) return;
    
    // Format date as YYYY-MM-DD using local date (not UTC)
    const d = calendarPicker.selectedDate;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${calendarPicker.selectedHour}:${calendarPicker.selectedMinute}`;
    
    // Validate not in past for appointment
    if (calendarPicker.validateFuture && calendarPicker.includeTime) {
      if (isDateInPast(calendarPicker.selectedDate, calendarPicker.selectedHour, calendarPicker.selectedMinute)) {
        alert('Nu puteți programa în trecut. Selectați o dată și oră viitoare.');
        return;
      }
    }
    
    // Apply to the correct field
    switch (calendarPicker.field) {
      case 'appointmentDateTime':
        setAppointmentForm(prev => ({ ...prev, data: dateStr, ora: timeStr }));
        break;
      case 'filterDateFrom':
        setAppointmentFilterDateFrom(dateStr);
        break;
      case 'filterDateTo':
        setAppointmentFilterDateTo(dateStr);
        break;
      case 'customerUltimaRevizie':
        setCustomerForm(prev => ({ ...prev, ultimaRevizie: dateStr }));
        break;
      case 'customerProximaRevizie':
        setCustomerForm(prev => ({ ...prev, proximaRevizie: dateStr }));
        break;
      case 'appointmentUltimaRevizie':
        setAppointmentForm(prev => ({ ...prev, ultimaRevizie: dateStr }));
        break;
      default:
        break;
    }
    
    closeCalendarPicker();
  };

  // Helper to format date as YYYY-MM-DD using local date
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectSuggestedSlot = (slot) => {
    const dateStr = formatDateLocal(slot.date);
    const timeStr = `${slot.hour}:${slot.minute}`;
    setAppointmentForm(prev => ({ ...prev, data: dateStr, ora: timeStr }));
    closeCalendarPicker();
  };

  const completeAppointment = async (appointment, newRevisionDate = null, completionObservatii = '') => {
    try {
      const customer = getCustomerById(appointment.customerId);
      if (!customer) {
        console.error('Customer not found for appointment:', appointment);
        alert('Eroare: Clientul nu a fost găsit.');
        return;
      }

      // Services that require revision tracking
      const revisionServices = [
        "Verificare/Revizie Instalație Gaze",
        "Pachet Verificare/Revizie cu Centrală"
      ];
      
      const isRevisionService = revisionServices.includes(appointment.tipServiciu);
      const now = new Date();
      const completionDate = now.toISOString();
      // Use local date for completionDateOnly
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const completionDateOnly = `${year}-${month}-${day}`;

      // Build updated customer
      const updatedCustomer = {
        ...customer,
        tipServiciu: appointment.tipServiciu
      };

      if (completionObservatii && completionObservatii.trim()) {
        updatedCustomer.observatiiUltimaProgramare = completionObservatii;
      }

      if (isRevisionService) {
        updatedCustomer.periodicitate = appointment.periodicitate;
        updatedCustomer.ultimaRevizie = completionDateOnly;
      } else {
        updatedCustomer.ultimaProgramare = completionDateOnly;
        if (appointment.tipCentrala) {
          updatedCustomer.tipCentrala = appointment.tipCentrala;
        }
        if (appointment.model) {
          updatedCustomer.model = appointment.model;
        }
      }

      // Mark appointment as completed
      const updatedAppointment = {
        ...appointment,
        completed: true,
        completedAt: completionDate,
        observatiiFinalizare: completionObservatii
      };

      // Update local state IMMEDIATELY for instant UI feedback
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
      setAppointments(prev => prev.map(a => a.id === appointment.id ? updatedAppointment : a));
      
      // Clear inputs for this appointment
      setRevisionDates(prev => {
        const newDates = {...prev};
        delete newDates[appointment.id];
        delete newDates[`obs_${appointment.id}`];
        return newDates;
      });

      // Save to storage in background (non-blocking)
      storage.set(customer.id, JSON.stringify(updatedCustomer));
      storage.set(appointment.id, JSON.stringify(updatedAppointment));
      
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('Eroare la finalizarea programării. Verificați consola pentru detalii.');
    }
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const getDaysUntil = (date) => {
    if (!date) return null;
    const revDate = new Date(date);
    const today = new Date();
    return Math.floor((revDate - today) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* License Check - Loading */}
      {licenseStatus === 'checking' && (
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${ENV.gradientFrom} ${ENV.gradientVia} ${ENV.gradientTo}`}>
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg">Se verifică licența...</p>
          </div>
        </div>
      )}

      {/* License Check - Login Required */}
      {(licenseStatus === 'inactive' || showLoginForm) && licenseStatus !== 'checking' && !mustChangePassword && (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          {/* Professional Background with Gas/Heating Theme */}
          <div className={`absolute inset-0 bg-gradient-to-br ${ENV.gradientFrom} ${ENV.gradientVia} ${ENV.gradientTo}`}>
            {/* Decorative pipes pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pipes" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0 50 H40 M60 50 H100" stroke={isDemo ? "#a855f7" : "#60a5fa"} strokeWidth="4" fill="none"/>
                  <path d="M50 0 V40 M50 60 V100" stroke={isDemo ? "#a855f7" : "#60a5fa"} strokeWidth="4" fill="none"/>
                  <circle cx="50" cy="50" r="8" fill="none" stroke="#f97316" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="3" fill="#f97316"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pipes)"/>
            </svg>
            
            {/* Floating elements */}
            <div className="absolute top-20 left-10 w-20 h-20 opacity-20">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="30" width="60" height="50" rx="5" stroke={isDemo ? "#a855f7" : "#60a5fa"} strokeWidth="3"/>
                <path d="M30 50 H70" stroke="#f97316" strokeWidth="2"/>
                <circle cx="50" cy="50" r="8" fill="#f97316" opacity="0.5"/>
                <path d="M40 20 V30 M60 20 V30" stroke={isDemo ? "#a855f7" : "#60a5fa"} strokeWidth="3"/>
              </svg>
            </div>
            <div className="absolute bottom-32 right-20 w-24 h-24 opacity-15">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="30" stroke="#22c55e" strokeWidth="3"/>
                <path d="M50 30 V50 L65 60" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute top-1/3 right-10 w-16 h-16 opacity-20">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 80 Q50 20 80 80" stroke="#f97316" strokeWidth="4" fill="none"/>
                <circle cx="50" cy="40" r="15" stroke="#fbbf24" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div className="absolute bottom-20 left-1/4 w-32 h-8 opacity-10">
              <svg viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 20 H60 M80 20 H120 M140 20 H200" stroke={isDemo ? "#a855f7" : "#60a5fa"} strokeWidth="6"/>
                <circle cx="70" cy="20" r="10" stroke={isDemo ? "#a855f7" : "#60a5fa"} strokeWidth="3" fill="none"/>
                <circle cx="130" cy="20" r="10" stroke={isDemo ? "#a855f7" : "#60a5fa"} strokeWidth="3" fill="none"/>
              </svg>
            </div>
            
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40"></div>
            <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${isDemo ? 'from-purple-500/10' : 'from-orange-500/10'} to-transparent`}></div>
          </div>
          
          {/* Login Card */}
          <div className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative z-10 border ${isDemo ? 'border-purple-200' : 'border-slate-200'}`}>
            {/* Demo Banner */}
            {isDemo && (
              <div className="bg-purple-600 text-white text-center py-2 px-4 rounded-lg mb-4 flex items-center justify-center gap-2">
                <FlaskConical size={18} />
                <span className="font-medium">VERSIUNE DEMO - 30 zile gratuit</span>
              </div>
            )}
            
            <div className="text-center mb-6">
              {/* Logo */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" className="h-20 mx-auto mb-4">
                <path d="M56 25 L56 8 Q56 0, 64 0 L340 0 Q350 0, 350 10 L350 85" stroke="#64748b" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <path d="M86 25 L86 15 Q86 8, 78 8 L64 8" stroke="#64748b" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <path d="M116 25 L116 -8 Q116 -16, 124 -16 L340 -16 Q358 -16, 358 0 L358 10 Q358 18, 350 18 L350 10" stroke="#64748b" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <path d="M350 85 Q350 95, 358 95 L358 180 Q358 195, 345 195 L141 195 Q133 195, 133 187 L133 185" stroke="#64748b" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <path d="M350 115 Q365 115, 365 130 L365 188 Q365 205, 350 205 L75 205 Q61 205, 61 191 L61 185" stroke="#64748b" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <rect x="40" y="25" width="120" height="160" rx="10" ry="10" fill={isDemo ? "#9333ea" : "#2563eb"}/>
                <rect x="55" y="40" width="90" height="35" rx="5" ry="5" fill={isDemo ? "#7c3aed" : "#1e40af"}/>
                <rect x="62" y="47" width="45" height="21" rx="3" ry="3" fill={isDemo ? "#6b21a8" : "#1e3a8a"}/>
                <circle cx="120" cy="52" r="5" fill={isDemo ? "#a855f7" : "#3b82f6"}/>
                <circle cx="120" cy="65" r="5" fill={isDemo ? "#a855f7" : "#3b82f6"}/>
                <circle cx="135" cy="58" r="7" fill="#ef4444"/>
                <rect x="65" y="90" width="70" height="60" rx="5" ry="5" fill={isDemo ? "#6b21a8" : "#1e3a8a"}/>
                <path d="M100 143 C100 143, 75 120, 75 105 C75 95, 83 88, 100 97 C117 88, 125 95, 125 105 C125 120, 100 143, 100 143Z" fill="#f97316"/>
                <path d="M100 136 C100 136, 85 120, 85 110 C85 103, 91 98, 100 104 C109 98, 115 103, 115 110 C115 120, 100 136, 100 136Z" fill="#fbbf24"/>
                <circle cx="148" cy="168" r="22" fill="#22c55e"/>
                <path d="M137 168 L145 177 L161 159" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <text x="175" y="85" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="bold" fill={isDemo ? "#9333ea" : "#2563eb"}>Revizio</text>
                <text x="175" y="123" fontFamily="Arial, sans-serif" fontSize="28" fill="#f97316">App</text>
                <text x="175" y="155" fontFamily="Arial, sans-serif" fontSize="14" fill="#64748b">{isDemo ? "Versiune Demo" : "Revizii organizate simplu"}</text>
              </svg>
            </div>

            {/* Login Method - Based on Environment */}
            {isDemo ? (
              /* DEMO: Show only License Key login */
              <div className="mb-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-purple-700 text-center">
                    <Key size={16} className="inline mr-1" />
                    Introduceți cheia de licență primită pentru a activa perioada de test
                  </p>
                </div>
              </div>
            ) : (
              /* PRODUCTION: Show only Email login */
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700 text-center">
                    <Mail size={16} className="inline mr-1" />
                    Autentificați-vă cu credențialele primite de la administrator
                  </p>
                </div>
              </div>
            )}

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              {isDemo ? (
                /* DEMO: License Key Login */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cheie Licență</label>
                    <input
                      type="text"
                      value={loginForm.licenseKey}
                      onChange={(e) => setLoginForm({...loginForm, licenseKey: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center font-mono text-lg tracking-wider"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parolă</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="email@exemplu.ro"
                    />
                    <p className="text-xs text-gray-500 mt-1">Obligatoriu pentru activarea perioadei de test</p>
                  </div>
                </>
              ) : (
                /* PRODUCTION: Email Login Only */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parolă</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••••••"
                    />
                  </div>
                </>
              )}
              
              <button
                onClick={handleLogin}
                className={`w-full py-3 text-white rounded-lg font-medium text-lg transition min-h-[48px] ${isDemo ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isDemo ? 'Activează Trial' : 'Autentificare'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className={`text-sm underline ${isDemo ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Am uitat parola
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              {isDemo ? (
                <>
                  Doriți acces complet? <a href="https://revizioapp.ro" className="text-purple-600 hover:underline font-medium">Deveniți client activ</a>
                </>
              ) : (
                'Nu aveți cont? Contactați administratorul.'
              )}
            </p>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-center text-xs text-gray-400">
                Copyright © {new Date().getFullYear()} RevizioApp. Toate drepturile rezervate.
                {isDemo && <span className="block mt-1 text-purple-500">Versiune Demo</span>}
              </p>
            </div>
          </div>
          
          {/* Cookie Consent Banner */}
          {showCookieConsent && !showCookieSettings && (
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm">
                      🍪 Acest site folosește cookie-uri pentru a vă oferi o experiență mai bună. 
                      Cookie-urile necesare sunt esențiale pentru funcționarea site-ului.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowCookieSettings(true)}
                      className="px-4 py-2 text-sm border border-gray-500 rounded-lg hover:bg-gray-800 transition"
                    >
                      Setări
                    </button>
                    <button
                      onClick={rejectOptionalCookies}
                      className="px-4 py-2 text-sm border border-gray-500 rounded-lg hover:bg-gray-800 transition"
                    >
                      Respinge opționale
                    </button>
                    <button
                      onClick={acceptAllCookies}
                      className="px-4 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                      Acceptă toate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Cookie Settings Modal */}
          {showCookieSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">🍪 Setări Cookie-uri</h3>
                  <button 
                    onClick={() => setShowCookieSettings(false)} 
                    className="text-gray-500 hover:text-gray-700 p-2"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  Alegeți ce tipuri de cookie-uri acceptați. Cookie-urile necesare nu pot fi dezactivate 
                  deoarece sunt esențiale pentru funcționarea aplicației.
                </p>
                
                <div className="space-y-4">
                  {/* Necessary Cookies */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Cookie-uri necesare</h4>
                      <p className="text-sm text-gray-500">Esențiale pentru funcționarea aplicației (autentificare, sesiune)</p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-5 h-5 rounded text-blue-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  {/* Functional Cookies */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Cookie-uri funcționale</h4>
                      <p className="text-sm text-gray-500">Memorează preferințele dvs. (setări, limba)</p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.functional}
                        onChange={(e) => setCookiePreferences({...cookiePreferences, functional: e.target.checked})}
                        className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Cookie-uri analitice</h4>
                      <p className="text-sm text-gray-500">Ne ajută să înțelegem cum folosiți aplicația</p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.analytics}
                        onChange={(e) => setCookiePreferences({...cookiePreferences, analytics: e.target.checked})}
                        className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={rejectOptionalCookies}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    Doar necesare
                  </button>
                  <button
                    onClick={saveCookiePreferences}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                  >
                    Salvează preferințe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Am uitat parola</h3>
              <button 
                onClick={() => setShowForgotPassword(false)} 
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Pentru resetarea parolei, vă rugăm să contactați administratorul aplicației.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Trimiteți un mesaj WhatsApp pentru asistență rapidă:
                </p>
                <button
                  onClick={() => {
                    const message = encodeURIComponent('Bună ziua! Am uitat parola pentru RevizioApp și am nevoie de resetare. Emailul/Cheia mea este: ');
                    window.open(`https://wa.me/40723533462?text=${message}`, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                >
                  <MessageCircle size={20} />
                  Contactează pe WhatsApp
                </button>
              </div>
              
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Must Change Password Screen */}
      {mustChangePassword && showPasswordChange && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-orange-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Schimbare Parolă Obligatorie</h2>
              <p className="text-gray-500 mt-2">Vă rugăm să setați o parolă nouă pentru contul dvs.</p>
            </div>

            {passwordChangeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {passwordChangeError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parolă Nouă</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordChangeForm.newPassword}
                    onChange={(e) => setPasswordChangeForm({...passwordChangeForm, newPassword: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-12"
                    placeholder="Minim 6 caractere"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmă Parola</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordChangeForm.confirmPassword}
                    onChange={(e) => setPasswordChangeForm({...passwordChangeForm, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-12"
                    placeholder="Repetă parola nouă"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button
                onClick={handlePasswordChange}
                className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-lg transition min-h-[48px]"
              >
                Salvează Parola Nouă
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Check - Expired */}
      {licenseStatus === 'expired' && !showLoginForm && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Licență Expirată</h1>
            <p className="text-gray-600 mb-6">
              Perioada de utilizare a expirat. Contactați administratorul pentru reînnoire.
            </p>
            {licenseInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-left">
                <p><span className="text-gray-500">Cheie:</span> <span className="font-mono">{licenseInfo.licenseKey}</span></p>
                <p><span className="text-gray-500">Expirat la:</span> {new Date(licenseInfo.expiresAt).toLocaleDateString('ro-RO')}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
            >
              Folosește altă licență
            </button>
          </div>
        </div>
      )}

      {/* License Check - Suspended */}
      {licenseStatus === 'suspended' && !showLoginForm && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="text-gray-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Licență Suspendată</h1>
            <p className="text-gray-600 mb-6">
              Accesul a fost suspendat. Contactați administratorul pentru detalii.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
            >
              Folosește altă licență
            </button>
          </div>
        </div>
      )}

      {/* Main App - Only show when license is active */}
      {licenseStatus === 'active' && (
        <>
      {/* Demo Environment Banner */}
      {isDemo && (
        <div className="bg-purple-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <FlaskConical size={16} />
          <span>VERSIUNE DEMO - {daysRemaining !== null ? `Mai aveți ${daysRemaining} ${daysRemaining === 1 ? 'zi' : 'zile'} de test` : 'Perioadă de test'}</span>
          <a href="https://revizioapp.ro" className="ml-2 underline font-medium hover:text-purple-200">
            Deveniți client activ →
          </a>
        </div>
      )}

      {/* License Warning Banner (Production) */}
      {!isDemo && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
          <AlertCircle className="inline-block mr-2" size={16} />
          Licența expiră în {daysRemaining} {daysRemaining === 1 ? 'zi' : 'zile'}. Contactați administratorul pentru reînnoire.
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">
              {confirmDialog.type === 'delete' ? 'Confirmare Ștergere' : confirmDialog.type === 'cancel' ? 'Confirmare Anulare' : 'Confirmare'}
            </h3>
            <p className="text-gray-700 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog({ show: false, message: '', onConfirm: null, type: 'delete' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Înapoi
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.onConfirm) {
                    confirmDialog.onConfirm();
                  }
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  confirmDialog.type === 'delete' || confirmDialog.type === 'cancel'
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {confirmDialog.type === 'delete' ? 'Șterge' : confirmDialog.type === 'cancel' ? 'Anulează' : 'Confirmă'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Picker Modal */}
      {calendarPicker.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-md sm:mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                {calendarPicker.includeTime ? 'Selectează Data și Ora' : 'Selectează Data'}
              </h3>
              <button onClick={closeCalendarPicker} className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={24} />
              </button>
            </div>
            
            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCalendarPicker(prev => ({
                  ...prev,
                  currentMonth: new Date(prev.currentMonth.getFullYear(), prev.currentMonth.getMonth() - 1, 1)
                }))}
                className="p-3 hover:bg-gray-100 rounded-lg min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="font-medium text-base">
                {monthNames[calendarPicker.currentMonth.getMonth()]} {calendarPicker.currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCalendarPicker(prev => ({
                  ...prev,
                  currentMonth: new Date(prev.currentMonth.getFullYear(), prev.currentMonth.getMonth() + 1, 1)
                }))}
                className="p-3 hover:bg-gray-100 rounded-lg min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {(() => {
                const { daysInMonth, startingDay } = getDaysInMonth(calendarPicker.currentMonth);
                const days = [];
                
                // Empty cells for days before the first of the month
                for (let i = 0; i < startingDay; i++) {
                  days.push(<div key={`empty-${i}`} className="h-12"></div>);
                }
                
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const isSelected = calendarPicker.selectedDate && 
                    calendarPicker.selectedDate.getDate() === day &&
                    calendarPicker.selectedDate.getMonth() === calendarPicker.currentMonth.getMonth() &&
                    calendarPicker.selectedDate.getFullYear() === calendarPicker.currentMonth.getFullYear();
                  
                  const isPast = calendarPicker.validateFuture && 
                    isDayInPast(calendarPicker.currentMonth.getFullYear(), calendarPicker.currentMonth.getMonth(), day);
                  
                  const isToday = new Date().getDate() === day &&
                    new Date().getMonth() === calendarPicker.currentMonth.getMonth() &&
                    new Date().getFullYear() === calendarPicker.currentMonth.getFullYear();
                  
                  days.push(
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      disabled={isPast}
                      className={`h-12 w-full rounded-lg text-base font-medium transition ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : isPast 
                            ? 'text-gray-300 cursor-not-allowed'
                            : isToday
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                }
                
                return days;
              })()}
            </div>
            
            {/* Time Selector */}
            {calendarPicker.includeTime && (
              <div className="border-t pt-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ora programării</label>
                <div className="flex gap-3 items-center">
                  <select
                    value={calendarPicker.selectedHour}
                    onChange={(e) => handleTimeChange(e.target.value, undefined)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px] flex-1"
                  >
                    {['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].filter(h => {
                      const now = new Date();
                      const isToday = calendarPicker.selectedDate && 
                        calendarPicker.selectedDate.getDate() === now.getDate() &&
                        calendarPicker.selectedDate.getMonth() === now.getMonth() &&
                        calendarPicker.selectedDate.getFullYear() === now.getFullYear();
                      // If it's today and validateFuture is on, filter out past hours
                      if (isToday && calendarPicker.validateFuture) {
                        return parseInt(h) > now.getHours();
                      }
                      return true;
                    }).map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-2xl font-bold">:</span>
                  <select
                    value={calendarPicker.selectedMinute}
                    onChange={(e) => handleTimeChange(undefined, e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px] flex-1"
                  >
                    {['00', '15', '30', '45'].filter(m => {
                      const now = new Date();
                      const isToday = calendarPicker.selectedDate && 
                        calendarPicker.selectedDate.getDate() === now.getDate() &&
                        calendarPicker.selectedDate.getMonth() === now.getMonth() &&
                        calendarPicker.selectedDate.getFullYear() === now.getFullYear();
                      const isCurrentHour = parseInt(calendarPicker.selectedHour) === now.getHours();
                      // If it's today, current hour, and validateFuture is on, filter out past minutes
                      if (isToday && calendarPicker.validateFuture && isCurrentHour) {
                        return parseInt(m) > now.getMinutes();
                      }
                      return true;
                    }).map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const now = new Date();
                  const isToday = calendarPicker.selectedDate && 
                    calendarPicker.selectedDate.getDate() === now.getDate() &&
                    calendarPicker.selectedDate.getMonth() === now.getMonth() &&
                    calendarPicker.selectedDate.getFullYear() === now.getFullYear();
                  
                  if (isToday && calendarPicker.validateFuture) {
                    return (
                      <p className="text-xs text-gray-500 mt-2">
                        Ora curentă: {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')} - sunt afișate doar orele disponibile
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            
            {/* Overbooking Warning */}
            {overbookingWarning && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                  <AlertCircle size={18} />
                  <span>Atenție: Overbooking!</span>
                </div>
                <p className="text-sm text-orange-600 mb-3">
                  Există deja o programare la această dată și oră. Puteți continua sau alege un slot disponibil:
                </p>
                <div className="space-y-2">
                  {overbookingWarning.suggestions.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestedSlot(slot)}
                      className="w-full text-left px-3 py-2 bg-white border border-orange-200 rounded hover:bg-orange-100 text-sm"
                    >
                      📅 {slot.date.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })} la {slot.hour}:{slot.minute}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Selected Date/Time Display */}
            {calendarPicker.selectedDate && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Selectat:</strong> {calendarPicker.selectedDate.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {calendarPicker.includeTime && ` la ${calendarPicker.selectedHour}:${calendarPicker.selectedMinute}`}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeCalendarPicker}
                className="px-5 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-base font-medium min-h-[48px]"
              >
                Anulare
              </button>
              <button
                onClick={confirmCalendarSelection}
                disabled={!calendarPicker.selectedDate}
                className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition text-base font-medium min-h-[48px]"
              >
                Confirmă
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal (from settings, not mandatory) */}
      {showPasswordChange && !mustChangePassword && licenseStatus === 'active' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Lock className="text-blue-600" size={24} />
                <h3 className="text-xl font-semibold text-gray-900">Schimbă Parola</h3>
              </div>
              <button 
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordChangeForm({ newPassword: '', confirmPassword: '' });
                  setPasswordChangeError('');
                }} 
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <X size={24} />
              </button>
            </div>

            {passwordChangeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {passwordChangeError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parolă Nouă</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordChangeForm.newPassword}
                    onChange={(e) => setPasswordChangeForm({...passwordChangeForm, newPassword: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Minim 6 caractere"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmă Parola</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordChangeForm.confirmPassword}
                    onChange={(e) => setPasswordChangeForm({...passwordChangeForm, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Repetă parola nouă"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordChangeForm({ newPassword: '', confirmPassword: '' });
                    setPasswordChangeError('');
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Anulare
                </button>
                <button
                  onClick={handleChangePasswordFromSettings}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Salvează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GDPR Modal */}
      {showGdprModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-lg sm:mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Shield className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold">Setări GDPR</h3>
              </div>
              <button 
                onClick={() => setShowGdprModal(false)} 
                className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  Conform GDPR, datele personale ale clienților inactivi pot fi șterse sau anonimizate după o perioadă de timp.
                </p>
                <button
                  onClick={() => {
                    setShowGdprModal(false);
                    setShowPrivacyPolicy(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  📄 Vezi Politica de Confidențialitate
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Perioada de inactivitate (luni)
                </label>
                <select
                  value={gdprInactivityMonths}
                  onChange={(e) => {
                    const months = parseInt(e.target.value);
                    setGdprInactivityMonths(months);
                    setInactiveCustomers(getInactiveCustomers(months));
                  }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                >
                  <option value={6}>6 luni</option>
                  <option value={12}>12 luni (1 an)</option>
                  <option value={24}>24 luni (2 ani)</option>
                  <option value={36}>36 luni (3 ani)</option>
                  <option value={60}>60 luni (5 ani)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acțiune pentru clienții inactivi
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="gdprAction"
                      value="anonymize"
                      checked={gdprAction === 'anonymize'}
                      onChange={() => setGdprAction('anonymize')}
                      className="w-5 h-5 mt-0.5"
                    />
                    <div>
                      <span className="font-medium">Anonimizare</span>
                      <p className="text-sm text-gray-500">Păstrează istoricul programărilor, dar înlocuiește datele personale</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="gdprAction"
                      value="delete"
                      checked={gdprAction === 'delete'}
                      onChange={() => setGdprAction('delete')}
                      className="w-5 h-5 mt-0.5"
                    />
                    <div>
                      <span className="font-medium">Ștergere completă</span>
                      <p className="text-sm text-gray-500">Șterge clientul și toate programările asociate</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Results */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Clienți inactivi găsiți:</span>
                  <span className={`text-lg font-bold ${inactiveCustomers.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {inactiveCustomers.length}
                  </span>
                </div>
                
                {inactiveCustomers.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto mb-4">
                    <p className="text-sm text-gray-600 mb-2">Clienți care vor fi afectați:</p>
                    <ul className="space-y-1">
                      {inactiveCustomers.slice(0, 10).map(customer => (
                        <li key={customer.id} className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                          {customer.nume} - {customer.telefon}
                        </li>
                      ))}
                      {inactiveCustomers.length > 10 && (
                        <li className="text-sm text-gray-500 italic">
                          ... și încă {inactiveCustomers.length - 10} clienți
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShowGdprModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-base font-medium min-h-[48px]"
                >
                  Închide
                </button>
                <button
                  onClick={executeGdprAction}
                  disabled={inactiveCustomers.length === 0}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium min-h-[48px] ${
                    inactiveCustomers.length === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : gdprAction === 'delete'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {gdprAction === 'delete' ? <Trash2 size={18} /> : <Shield size={18} />}
                  {gdprAction === 'delete' ? 'Șterge' : 'Anonimizează'} ({inactiveCustomers.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPrivacyPolicy(false);
              setShowGdprModal(true);
            }
          }}
        >
          <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl my-4">
              {/* Header - Fixed look */}
              <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-white rounded-t-lg sticky top-4 z-10">
                <h3 className="text-lg font-semibold">Politica de Confidențialitate</h3>
                <button 
                  onClick={() => {
                    setShowPrivacyPolicy(false);
                    setShowGdprModal(true);
                  }} 
                  className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 sm:p-6">
                <p className="text-sm text-gray-500 mb-4">Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}</p>
                
                <h4 className="text-base font-semibold mt-4 mb-2">1. Introducere</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Această Politică de Confidențialitate descrie modul în care colectăm, utilizăm și protejăm datele personale ale clienților noștri în conformitate cu Regulamentul General privind Protecția Datelor (GDPR - Regulamentul UE 2016/679).
                </p>

                <h4 className="text-base font-semibold mt-4 mb-2">2. Operatorul de Date</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Operatorul de date personale este compania care utilizează această aplicație CRM pentru gestionarea serviciilor de instalații termice și verificări gaze.
                </p>

                <h4 className="text-base font-semibold mt-4 mb-2">3. Datele Personale Colectate</h4>
                <p className="text-sm text-gray-700 mb-2">Colectăm următoarele categorii de date personale:</p>
                <ul className="text-sm text-gray-700 mb-3 list-disc list-inside space-y-1">
                  <li><strong>Date de identificare:</strong> nume, prenume</li>
                  <li><strong>Date de contact:</strong> număr de telefon, adresă</li>
                  <li><strong>Date tehnice:</strong> tipul centralei termice, model/marcă, istoric revizii</li>
                  <li><strong>Date despre servicii:</strong> programări, observații, istoric intervenții</li>
                </ul>

                <h4 className="text-base font-semibold mt-4 mb-2">4. Scopul Prelucrării</h4>
                <p className="text-sm text-gray-700 mb-2">Datele personale sunt prelucrate în următoarele scopuri:</p>
                <ul className="text-sm text-gray-700 mb-3 list-disc list-inside space-y-1">
                  <li>Furnizarea serviciilor de verificare și revizie instalații gaze</li>
                  <li>Programarea și gestionarea intervențiilor tehnice</li>
                  <li>Notificarea clienților despre reviziile periodice obligatorii</li>
                  <li>Respectarea obligațiilor legale privind verificările periodice</li>
                  <li>Emiterea documentelor tehnice și a facturilor</li>
                </ul>

                <h4 className="text-base font-semibold mt-4 mb-2">5. Temeiul Legal</h4>
                <p className="text-sm text-gray-700 mb-2">Prelucrarea datelor se bazează pe:</p>
                <ul className="text-sm text-gray-700 mb-3 list-disc list-inside space-y-1">
                  <li><strong>Executarea contractului:</strong> pentru furnizarea serviciilor solicitate</li>
                  <li><strong>Obligații legale:</strong> conformarea cu legislația privind instalațiile de gaze</li>
                  <li><strong>Interese legitime:</strong> notificarea despre reviziile periodice obligatorii</li>
                </ul>

                <h4 className="text-base font-semibold mt-4 mb-2">6. Durata Stocării</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Datele personale sunt păstrate pe perioada necesară îndeplinirii scopurilor pentru care au fost colectate, inclusiv pentru respectarea obligațiilor legale. Conform legislației privind instalațiile de gaze, documentele tehnice trebuie păstrate minimum 10 ani. După expirarea perioadei de retenție, datele vor fi șterse sau anonimizate.
                </p>

                <h4 className="text-base font-semibold mt-4 mb-2">7. Drepturile Persoanelor Vizate</h4>
                <p className="text-sm text-gray-700 mb-2">Conform GDPR, aveți următoarele drepturi:</p>
                <ul className="text-sm text-gray-700 mb-3 list-disc list-inside space-y-1">
                  <li><strong>Dreptul de acces:</strong> să solicitați informații despre datele prelucrate</li>
                  <li><strong>Dreptul la rectificare:</strong> să solicitați corectarea datelor inexacte</li>
                  <li><strong>Dreptul la ștergere:</strong> să solicitați ștergerea datelor ("dreptul de a fi uitat")</li>
                  <li><strong>Dreptul la restricționare:</strong> să solicitați limitarea prelucrării</li>
                  <li><strong>Dreptul la portabilitate:</strong> să primiți datele într-un format structurat</li>
                  <li><strong>Dreptul la opoziție:</strong> să vă opuneți prelucrării în anumite situații</li>
                </ul>

                <h4 className="text-base font-semibold mt-4 mb-2">8. Securitatea Datelor</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Implementăm măsuri tehnice și organizatorice adecvate pentru protejarea datelor personale împotriva accesului neautorizat, pierderii sau distrugerii accidentale.
                </p>

                <h4 className="text-base font-semibold mt-4 mb-2">9. Transferul Datelor</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Datele personale nu sunt transferate către terți, cu excepția cazurilor prevăzute de lege (autorități competente) sau cu consimțământul explicit al persoanei vizate.
                </p>

                <h4 className="text-base font-semibold mt-4 mb-2">10. Politica de Retenție Automată</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Această aplicație include funcționalități de conformare GDPR care permit ștergerea sau anonimizarea automată a datelor clienților inactivi după o perioadă configurabilă (implicit 24 de luni fără programări active).
                </p>

                <h4 className="text-base font-semibold mt-4 mb-2">11. Contact</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Pentru exercitarea drepturilor sau pentru orice întrebări legate de prelucrarea datelor personale, ne puteți contacta folosind datele de contact ale companiei.
                </p>

                <h4 className="text-base font-semibold mt-4 mb-2">12. Plângeri</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) dacă considerați că prelucrarea datelor dumneavoastră încalcă GDPR.
                </p>

                <div className="bg-gray-100 rounded-lg p-4 mt-6">
                  <p className="text-xs text-gray-600">
                    <strong>ANSPDCP:</strong> B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București<br />
                    Website: <span className="text-blue-600">www.dataprotection.ro</span>
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 sm:p-6 border-t bg-gray-50 rounded-b-lg">
                <button
                  onClick={() => {
                    setShowPrivacyPolicy(false);
                    setShowGdprModal(true);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium min-h-[48px]"
                >
                  Am înțeles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Upload className="text-orange-600" size={24} />
                <h3 className="text-lg font-semibold">Import CSV</h3>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }} 
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <X size={24} />
              </button>
            </div>
            
            {!importResult ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Importați date dintr-un fișier CSV exportat anterior sau creat manual. 
                    Clienții duplicați (același telefon) vor fi ignorați.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ce doriți să importați?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="importType"
                        value="customers"
                        checked={importType === 'customers'}
                        onChange={() => setImportType('customers')}
                        className="w-4 h-4"
                      />
                      <div>
                        <span className="font-medium">Clienți</span>
                        <p className="text-sm text-gray-500">Import lista de clienți</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="importType"
                        value="appointments"
                        checked={importType === 'appointments'}
                        onChange={() => setImportType('appointments')}
                        className="w-4 h-4"
                      />
                      <div>
                        <span className="font-medium">Programări</span>
                        <p className="text-sm text-gray-500">Import programări (creează clienți noi dacă nu există)</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Coloane necesare:</p>
                  {importType === 'customers' ? (
                    <p className="text-xs text-gray-600">
                      Nume, Telefon, Adresa, Tip Serviciu, Periodicitate, Tip Centrala, Model, Ultima Revizie
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600">
                      Client/Nume, Telefon, Data Programare (DD.MM.YYYY), Ora, Tip Serviciu, Status
                    </p>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileImport}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium min-h-[48px]"
                >
                  <Upload size={20} />
                  Selectează fișier CSV
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {importResult.success ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium mb-2">✓ Import finalizat cu succes!</p>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>Total rânduri procesate: {importResult.total}</p>
                        <p>Importate: {importResult.imported}</p>
                        {importResult.duplicates > 0 && (
                          <p>Duplicate ignorate: {importResult.duplicates}</p>
                        )}
                        {importResult.customersCreated > 0 && (
                          <p>Clienți noi creați: {importResult.customersCreated}</p>
                        )}
                        {importResult.skipped > 0 && (
                          <p>Rânduri sărite (date lipsă): {importResult.skipped}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportResult(null);
                      }}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium min-h-[48px]"
                    >
                      Închide
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 font-medium mb-2">✗ Eroare la import</p>
                      <p className="text-sm text-red-700">{importResult.error}</p>
                    </div>
                    <button
                      onClick={() => setImportResult(null)}
                      className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium min-h-[48px]"
                    >
                      Încearcă din nou
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* Logo */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" className="h-10 w-10 sm:h-12 sm:w-12">
                <rect x="40" y="25" width="120" height="160" rx="10" ry="10" fill="#2563eb"/>
                <rect x="55" y="40" width="90" height="35" rx="5" ry="5" fill="#1e40af"/>
                <rect x="62" y="47" width="45" height="21" rx="3" ry="3" fill="#1e3a8a"/>
                <circle cx="120" cy="52" r="5" fill="#3b82f6"/>
                <circle cx="120" cy="65" r="5" fill="#3b82f6"/>
                <circle cx="135" cy="58" r="7" fill="#ef4444"/>
                <rect x="65" y="90" width="70" height="60" rx="5" ry="5" fill="#1e3a8a"/>
                <path d="M100 143 C100 143, 75 120, 75 105 C75 95, 83 88, 100 97 C117 88, 125 95, 125 105 C125 120, 100 143, 100 143Z" fill="#f97316"/>
                <path d="M100 136 C100 136, 85 120, 85 110 C85 103, 91 98, 100 104 C109 98, 115 103, 115 110 C115 120, 100 136, 100 136Z" fill="#fbbf24"/>
                <circle cx="148" cy="168" r="22" fill="#22c55e"/>
                <path d="M137 168 L145 177 L161 159" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-600">RevizioApp</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Revizii organizate simplu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPasswordChangeForm({ newPassword: '', confirmPassword: '' });
                  setPasswordChangeError('');
                  setShowPasswordChange(true);
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition min-h-[44px]"
                title="Schimbă parola"
              >
                <Lock size={20} />
                <span className="hidden sm:inline text-sm">Parolă</span>
              </button>
              <button
                onClick={openGdprModal}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition min-h-[44px]"
                title="Setări GDPR"
              >
                <Shield size={20} />
                <span className="hidden sm:inline text-sm">GDPR</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition min-h-[44px]"
                title="Deconectare"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline text-sm">Ieșire</span>
              </button>
            </div>
          </div>
          {/* Mobile-optimized tabs - grid on mobile, flex on desktop */}
          <div className="grid grid-cols-4 sm:flex gap-1 sm:gap-2 mt-3 sm:mt-4">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2 rounded-lg transition min-h-[60px] sm:min-h-0 ${
                activeTab === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home size={20} />
              <span className="text-xs sm:text-base">Astăzi</span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2 rounded-lg transition min-h-[60px] sm:min-h-0 ${
                activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CalendarDays size={20} />
              <span className="text-xs sm:text-base">Programări</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2 rounded-lg transition min-h-[60px] sm:min-h-0 ${
                activeTab === 'customers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              <span className="text-xs sm:text-base">Clienți</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2 rounded-lg transition min-h-[60px] sm:min-h-0 ${
                activeTab === 'alerts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bell size={20} />
              <span className="text-xs sm:text-base">Alerte</span>
              {getUpcomingAlerts().length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0">{getUpcomingAlerts().length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        {/* TAB ASTAZI */}
        {activeTab === 'today' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Programări Astăzi</h2>
              <p className="text-gray-600 text-sm sm:text-base">{new Date().toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <button
                onClick={() => {
                  if (!showAppointmentForm) {
                    // Opening form for new appointment - reset it first
                    setAppointmentForm({
                      customerId: '',
                      data: '',
                      ora: '',
                      observatii: '',
                      isNewCustomer: false,
                      nume: '',
                      telefon: '',
                      adresa: '',
                      tipServiciu: '',
                      periodicitate: '',
                      tipCentrala: '',
                      model: '',
                      ultimaRevizie: ''
                    });
                    setCustomerSearchTerm('');
                    setShowCustomerDropdown(false);
                    setEditingAppointmentId(null);
                    setShowAppointmentForm(true);
                    setTimeout(() => {
                      appointmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  } else {
                    // Closing form
                    setShowAppointmentForm(false);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-4 text-base font-medium min-h-[48px]"
              >
                <Plus size={20} />
                Programare Nouă
              </button>
            </div>

            {showAppointmentForm && (
              <div ref={appointmentFormRef} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4">{editingAppointmentId ? 'Editare Programare' : 'Programare Nouă'}</h3>
                
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      checked={!appointmentForm.isNewCustomer}
                      onChange={() => setAppointmentForm({...appointmentForm, isNewCustomer: false})}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Client existent</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      checked={appointmentForm.isNewCustomer}
                      onChange={() => {
                        setAppointmentForm({...appointmentForm, isNewCustomer: true, customerId: ''});
                        setCustomerSearchTerm('');
                        setShowCustomerDropdown(false);
                      }}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Client nou</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {!appointmentForm.isNewCustomer ? (
                    <>
                      <div className="relative" ref={customerSearchRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={customerSearchTerm}
                            onChange={(e) => {
                              setCustomerSearchTerm(e.target.value);
                              setShowCustomerDropdown(true);
                              if (!e.target.value) {
                                setAppointmentForm(prev => ({ ...prev, customerId: '' }));
                              }
                            }}
                            onFocus={() => setShowCustomerDropdown(true)}
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                            placeholder="Caută după nume, telefon sau adresă..."
                          />
                          {appointmentForm.customerId && (
                            <button
                              type="button"
                              onClick={clearCustomerSelection}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                        
                        {/* Customer search dropdown */}
                        {showCustomerDropdown && !appointmentForm.customerId && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredCustomersForSearch().length === 0 ? (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                {customerSearchTerm ? 'Niciun client găsit' : 'Începe să scrii pentru a căuta'}
                              </div>
                            ) : (
                              getFilteredCustomersForSearch().slice(0, 10).map(customer => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => selectCustomerFromSearch(customer)}
                                  className="w-full px-4 py-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 min-h-[60px]"
                                >
                                  <div className="font-medium text-gray-900">{customer.nume}</div>
                                  <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Phone size={14} />
                                      {customer.telefon}
                                    </span>
                                    <span className="flex items-center gap-1 truncate">
                                      <MapPin size={14} />
                                      {customer.adresa}
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                        
                        {/* Selected customer info */}
                        {appointmentForm.customerId && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700">
                              <span className="text-sm">✓ Client selectat</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tip Serviciu *</label>
                        <select
                          value={appointmentForm.tipServiciu}
                          onChange={(e) => setAppointmentForm({...appointmentForm, tipServiciu: e.target.value, periodicitate: ''})}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                        >
                          <option value="">Selectează</option>
                          <option value="Verificare/Revizie Instalație Gaze">Verificare/Revizie Instalație Gaze</option>
                          <option value="Pachet Verificare/Revizie cu Centrală">Pachet Verificare/Revizie cu Centrală</option>
                          <option value="Reluare Furnizare Gaze (gaz oprit)">Reluare Furnizare Gaze (gaz oprit)</option>
                          <option value="Montaj detector gaze/senzor">Montaj detector gaze/senzor</option>
                          <option value="Execuții instalații termice cupru">Execuții instalații termice cupru</option>
                          <option value="Execuții instalații termice PPR">Execuții instalații termice PPR</option>
                          <option value="Montare centrală termică">Montare centrală termică</option>
                          <option value="Revizie sistem încălzire">Revizie sistem încălzire</option>
                        </select>
                      </div>
                      {(appointmentForm.tipServiciu === "Verificare/Revizie Instalație Gaze" || 
                        appointmentForm.tipServiciu === "Pachet Verificare/Revizie cu Centrală") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Periodicitate *</label>
                          <select
                            value={appointmentForm.periodicitate}
                            onChange={(e) => setAppointmentForm({...appointmentForm, periodicitate: e.target.value})}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                          >
                            <option value="">Selectează</option>
                            <option value="Verificare periodică la 2 ani instalație gaze">Verificare periodică la 2 ani instalație gaze</option>
                            <option value="Verificare periodică la 10 ani instalație gaze">Verificare periodică la 10 ani instalație gaze</option>
                          </select>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nume Client *</label>
                        <input
                          type="text"
                          value={appointmentForm.nume}
                          onChange={(e) => setAppointmentForm({...appointmentForm, nume: e.target.value})}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                          placeholder="Ion Popescu"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                        <input
                          type="tel"
                          value={appointmentForm.telefon}
                          onChange={(e) => setAppointmentForm({...appointmentForm, telefon: e.target.value})}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                          placeholder="0721234567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Adresă *</label>
                        <input
                          type="text"
                          value={appointmentForm.adresa}
                          onChange={(e) => setAppointmentForm({...appointmentForm, adresa: e.target.value})}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                          placeholder="Str. Mihai Viteazu nr. 15, bl. A3, sc. 2, ap. 45, Constanța"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tip Serviciu *</label>
                        <select
                          value={appointmentForm.tipServiciu}
                          onChange={(e) => setAppointmentForm({...appointmentForm, tipServiciu: e.target.value, periodicitate: ''})}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                        >
                          <option value="">Selectează</option>
                          <option value="Verificare/Revizie Instalație Gaze">Verificare/Revizie Instalație Gaze</option>
                          <option value="Pachet Verificare/Revizie cu Centrală">Pachet Verificare/Revizie cu Centrală</option>
                          <option value="Reluare Furnizare Gaze (gaz oprit)">Reluare Furnizare Gaze (gaz oprit)</option>
                          <option value="Montaj detector gaze/senzor">Montaj detector gaze/senzor</option>
                          <option value="Execuții instalații termice cupru">Execuții instalații termice cupru</option>
                          <option value="Execuții instalații termice PPR">Execuții instalații termice PPR</option>
                          <option value="Montare centrală termică">Montare centrală termică</option>
                          <option value="Revizie sistem încălzire">Revizie sistem încălzire</option>
                        </select>
                      </div>
                      {(appointmentForm.tipServiciu === "Verificare/Revizie Instalație Gaze" || 
                        appointmentForm.tipServiciu === "Pachet Verificare/Revizie cu Centrală") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Periodicitate *</label>
                          <select
                            value={appointmentForm.periodicitate}
                            onChange={(e) => setAppointmentForm({...appointmentForm, periodicitate: e.target.value})}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                          >
                            <option value="">Selectează</option>
                            <option value="Verificare periodică la 2 ani instalație gaze">Verificare periodică la 2 ani instalație gaze</option>
                            <option value="Verificare periodică la 10 ani instalație gaze">Verificare periodică la 10 ani instalație gaze</option>
                          </select>
                        </div>
                      )}
                      {appointmentForm.tipServiciu !== "Verificare/Revizie Instalație Gaze" &&
                       appointmentForm.tipServiciu !== "Reluare Furnizare Gaze (gaz oprit)" &&
                       appointmentForm.tipServiciu !== "Execuții instalații termice cupru" &&
                       appointmentForm.tipServiciu !== "Execuții instalații termice PPR" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tip Centrală</label>
                            <select
                              value={appointmentForm.tipCentrala}
                              onChange={(e) => setAppointmentForm({...appointmentForm, tipCentrala: e.target.value})}
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                            >
                              <option value="">Selectează</option>
                              <option value="Gaz">Gaz</option>
                              <option value="Condensație">Condensație</option>
                              <option value="Electrică">Electrică</option>
                              <option value="Lemne">Lemne</option>
                              <option value="Peleți">Peleți</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Model/Marcă</label>
                            <input
                              type="text"
                              value={appointmentForm.model}
                              onChange={(e) => setAppointmentForm({...appointmentForm, model: e.target.value})}
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                              placeholder="Ariston, Viessmann, etc."
                            />
                          </div>
                        </>
                      )}
                      {appointmentForm.tipServiciu !== "Verificare/Revizie Instalație Gaze" &&
                       appointmentForm.tipServiciu !== "Reluare Furnizare Gaze (gaz oprit)" &&
                       appointmentForm.tipServiciu !== "Execuții instalații termice cupru" &&
                       appointmentForm.tipServiciu !== "Execuții instalații termice PPR" &&
                       appointmentForm.tipServiciu !== "Montare centrală termică" && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ultima Revizie</label>
                          <button
                            type="button"
                            onClick={() => openCalendarPicker('appointmentUltimaRevizie', false, false, appointmentForm.ultimaRevizie)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:bg-gray-50"
                          >
                            <span className={appointmentForm.ultimaRevizie ? 'text-gray-900' : 'text-gray-400'}>
                              {appointmentForm.ultimaRevizie 
                                ? new Date(appointmentForm.ultimaRevizie).toLocaleDateString('ro-RO')
                                : 'Click pentru a selecta data'}
                            </span>
                            <Calendar size={20} className="text-gray-400" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data și Ora Programării *</label>
                    <button
                      type="button"
                      onClick={() => openCalendarPicker('appointmentDateTime', true, true, appointmentForm.data)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className={appointmentForm.data && appointmentForm.ora ? 'text-gray-900' : 'text-gray-400'}>
                        {appointmentForm.data && appointmentForm.ora 
                          ? `${new Date(appointmentForm.data).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} la ${appointmentForm.ora}`
                          : 'Click pentru a selecta data și ora'}
                      </span>
                      <Calendar size={20} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observații Programare</label>
                    <textarea
                      value={appointmentForm.observatii}
                      onChange={(e) => setAppointmentForm({...appointmentForm, observatii: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Detalii programare..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={saveAppointment}
                    disabled={
                      !appointmentForm.data || 
                      !appointmentForm.ora ||
                      !appointmentForm.tipServiciu ||
                      ((appointmentForm.tipServiciu === "Verificare/Revizie Instalație Gaze" || 
                        appointmentForm.tipServiciu === "Pachet Verificare/Revizie cu Centrală") && 
                       !appointmentForm.periodicitate) ||
                      (!appointmentForm.isNewCustomer && !appointmentForm.customerId) ||
                      (appointmentForm.isNewCustomer && (
                        !appointmentForm.nume || 
                        !appointmentForm.telefon || 
                        !appointmentForm.adresa
                      ))
                    }
                    className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-base font-medium min-h-[48px]"
                  >
                    {editingAppointmentId ? 'Actualizare' : 'Salvare'}
                  </button>
                  <button
                    onClick={resetAppointmentForm}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-base font-medium min-h-[48px]"
                  >
                    Anulare
                  </button>
                </div>
              </div>
            )}
            
            {/* Tomorrow Reminders on Today Tab */}
            {getTomorrowAppointments().length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-4 sm:p-6 mb-4 border border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MessageCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-green-800">📲 Remindere pentru Mâine ({getTomorrowAppointments().length})</h2>
                      <p className="text-sm text-green-600">Trimite reminder WhatsApp clienților programați mâine</p>
                    </div>
                  </div>
                  {getTomorrowAppointments().length > 1 && (
                    <button
                      onClick={() => {
                        const appointmentsWithPhone = getTomorrowAppointments().filter(apt => {
                          const customer = getCustomerById(apt.customerId);
                          return customer?.telefon;
                        });
                        if (appointmentsWithPhone.length === 0) {
                          alert('Niciun client nu are număr de telefon valid.');
                          return;
                        }
                        if (confirm(`Se vor deschide ${appointmentsWithPhone.length} ferestre WhatsApp.\n\nTrimite fiecare mesaj manual apăsând Send în WhatsApp.\n\nContinui?`)) {
                          appointmentsWithPhone.forEach((apt, index) => {
                            const customer = getCustomerById(apt.customerId);
                            setTimeout(() => {
                              sendWhatsAppReminder(apt, customer);
                            }, index * 1500); // 1.5 secunde între fiecare pentru a nu supraîncărca
                          });
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition min-h-[44px]"
                    >
                      <MessageCircle size={18} />
                      Trimite Toate ({getTomorrowAppointments().filter(apt => getCustomerById(apt.customerId)?.telefon).length})
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {getTomorrowAppointments().map((apt) => {
                    const customer = getCustomerById(apt.customerId);
                    
                    return (
                      <div key={apt.id} className="bg-white rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-green-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">{customer?.nume || 'Client șters'}</span>
                            <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">{apt.ora}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {customer?.telefon || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Wrench size={14} />
                              {apt.tipServiciu || 'Revizie'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => sendWhatsAppReminder(apt, customer)}
                          disabled={!customer?.telefon}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition min-h-[44px] ${
                            customer?.telefon 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <MessageCircle size={18} />
                          Trimite Reminder
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {getTodayAppointments().length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
                <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-500">Nu aveți programări astăzi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTodayAppointments().map((apt) => {
                  const customer = getCustomerById(apt.customerId);
                  
                  return (
                    <div key={apt.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-5 border-l-4 border-blue-500">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded text-lg min-w-[70px] text-center">
                              {apt.ora}
                            </div>
                            <h3 className="text-lg font-semibold">{customer?.nume || 'Client șters'}</h3>
                          </div>
                          {customer && (
                            <>
                              <a href={`tel:${customer.telefon}`} className="flex items-center gap-2 text-gray-600 mb-2 py-1 hover:text-blue-600">
                                <Phone size={18} />
                                <span className="text-base">{customer.telefon}</span>
                              </a>
                              <div className="flex items-start gap-2 text-gray-600 mb-3">
                                <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                                <span className="text-base">{customer.adresa}</span>
                              </div>
                              <div className="bg-blue-50 px-3 py-2 rounded mb-3">
                                <span className="text-sm font-medium text-blue-700">{apt.tipServiciu || customer.tipServiciu}</span>
                                {apt.periodicitate && (
                                  <span className="text-sm text-blue-600 block sm:inline sm:ml-2">• {apt.periodicitate}</span>
                                )}
                              </div>
                              
                              <div className="mt-4 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Observații</label>
                                  <textarea
                                    value={revisionDates[`obs_${apt.id}`] || ''}
                                    onChange={(e) => setRevisionDates({...revisionDates, [`obs_${apt.id}`]: e.target.value})}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base min-h-[80px]"
                                    rows="2"
                                    placeholder="Observații după efectuarea serviciului..."
                                  />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => completeAppointment(apt, null, revisionDates[`obs_${apt.id}`] || '')}
                                    className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium min-h-[48px]"
                                  >
                                    ✓ Finalizare programare
                                  </button>
                                  <button
                                    onClick={() => cancelAppointment(apt)}
                                    className="w-full sm:w-auto px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-base font-medium min-h-[48px]"
                                  >
                                    ✕ Anulare programare
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                          {apt.observatii && (
                            <p className="text-sm text-gray-600 mt-3 italic">"{apt.observatii}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB PROGRAMARI */}
        {activeTab === 'appointments' && (
          <div>
            {/* Tomorrow Reminders Section */}
            {getTomorrowAppointments().length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-4 sm:p-6 mb-4 border border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MessageCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-green-800">Remindere pentru Mâine ({getTomorrowAppointments().length})</h2>
                      <p className="text-sm text-green-600">Trimite reminder WhatsApp clienților programați mâine</p>
                    </div>
                  </div>
                  {getTomorrowAppointments().length > 1 && (
                    <button
                      onClick={() => {
                        const appointmentsWithPhone = getTomorrowAppointments().filter(apt => {
                          const customer = getCustomerById(apt.customerId);
                          return customer?.telefon;
                        });
                        if (appointmentsWithPhone.length === 0) {
                          alert('Niciun client nu are număr de telefon valid.');
                          return;
                        }
                        if (confirm(`Se vor deschide ${appointmentsWithPhone.length} ferestre WhatsApp.\n\nTrimite fiecare mesaj manual apăsând Send în WhatsApp.\n\nContinui?`)) {
                          appointmentsWithPhone.forEach((apt, index) => {
                            const customer = getCustomerById(apt.customerId);
                            setTimeout(() => {
                              sendWhatsAppReminder(apt, customer);
                            }, index * 1500);
                          });
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition min-h-[44px]"
                    >
                      <MessageCircle size={18} />
                      Trimite Toate ({getTomorrowAppointments().filter(apt => getCustomerById(apt.customerId)?.telefon).length})
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {getTomorrowAppointments().map((apt) => {
                    const customer = getCustomerById(apt.customerId);
                    
                    return (
                      <div key={apt.id} className="bg-white rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-green-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">{customer?.nume || 'Client șters'}</span>
                            <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">{apt.ora}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {customer?.telefon || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => sendWhatsAppReminder(apt, customer)}
                          disabled={!customer?.telefon}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition min-h-[44px] ${
                            customer?.telefon 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <MessageCircle size={18} />
                          Trimite Reminder
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h2 className="text-xl font-semibold mb-4">Programări</h2>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAppointmentsSubTab('active')}
                  className={`px-4 py-2 rounded-lg transition ${
                    appointmentsSubTab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Programări active ({getActiveAppointments(true).length})
                </button>
                <button
                  onClick={() => setAppointmentsSubTab('completed')}
                  className={`px-4 py-2 rounded-lg transition ${
                    appointmentsSubTab === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Finalizate ({getCompletedAppointments(true).length})
                </button>
                <button
                  onClick={() => setAppointmentsSubTab('cancelled')}
                  className={`px-4 py-2 rounded-lg transition ${
                    appointmentsSubTab === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Anulate ({getCancelledAppointments(true).length})
                </button>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={18} className="text-gray-600" />
                  <span className="font-medium text-gray-700">Filtre</span>
                  {hasActiveFilters && (
                    <button
                      onClick={resetAppointmentFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 underline ml-2"
                    >
                      Resetează filtre
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip Serviciu</label>
                    <select
                      value={appointmentFilterServiceType}
                      onChange={(e) => setAppointmentFilterServiceType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Toate serviciile</option>
                      <option value="Verificare/Revizie Instalație Gaze">Verificare/Revizie Instalație Gaze</option>
                      <option value="Pachet Verificare/Revizie cu Centrală">Pachet Verificare/Revizie cu Centrală</option>
                      <option value="Reluare Furnizare Gaze (gaz oprit)">Reluare Furnizare Gaze (gaz oprit)</option>
                      <option value="Montaj detector gaze/senzor">Montaj detector gaze/senzor</option>
                      <option value="Execuții instalații termice cupru">Execuții instalații termice cupru</option>
                      <option value="Execuții instalații termice PPR">Execuții instalații termice PPR</option>
                      <option value="Montare centrală termică">Montare centrală termică</option>
                      <option value="Revizie sistem încălzire">Revizie sistem încălzire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">De la data</label>
                    <button
                      type="button"
                      onClick={() => openCalendarPicker('filterDateFrom', false, false, appointmentFilterDateFrom)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className={appointmentFilterDateFrom ? 'text-gray-900' : 'text-gray-400'}>
                        {appointmentFilterDateFrom 
                          ? new Date(appointmentFilterDateFrom).toLocaleDateString('ro-RO')
                          : 'Selectează'}
                      </span>
                      <Calendar size={18} className="text-gray-400" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Până la data</label>
                    <button
                      type="button"
                      onClick={() => openCalendarPicker('filterDateTo', false, false, appointmentFilterDateTo)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className={appointmentFilterDateTo ? 'text-gray-900' : 'text-gray-400'}>
                        {appointmentFilterDateTo 
                          ? new Date(appointmentFilterDateTo).toLocaleDateString('ro-RO')
                          : 'Selectează'}
                      </span>
                      <Calendar size={18} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {appointmentsSubTab === 'active' && (
                getActiveAppointments(true).length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">{hasActiveFilters ? 'Nu există programări active care să corespundă filtrelor' : 'Nu există programări active'}</p>
                  </div>
                ) : (
                  getActiveAppointments(true).map((apt) => {
                    const customer = getCustomerById(apt.customerId);
                    const isToday = apt.data === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div key={apt.id} className={`bg-white rounded-lg shadow-sm p-5 ${isToday ? 'border-l-4 border-green-500' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`font-bold px-3 py-1 rounded ${isToday ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {new Date(apt.data).toLocaleDateString('ro-RO')} • {apt.ora}
                              </div>
                              <h3 className="text-lg font-semibold">{customer?.nume || 'Client șters'}</h3>
                            </div>
                            {customer && (
                              <>
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                  <Phone size={16} />
                                  <span>{customer.telefon}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin size={16} />
                                  <span>{customer.adresa}</span>
                                </div>
                                <div className="bg-blue-50 px-3 py-2 rounded inline-block mt-2">
                                  <span className="text-sm font-medium text-blue-700">{apt.tipServiciu || customer.tipServiciu}</span>
                                  {apt.periodicitate && (
                                    <span className="text-sm text-blue-600 ml-2">• {apt.periodicitate}</span>
                                  )}
                                </div>
                              </>
                            )}
                            {apt.observatii && (
                              <p className="text-sm text-gray-600 mt-2 italic">"{apt.observatii}"</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editAppointment(apt)}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                            >
                              Editare
                            </button>
                            <button
                              onClick={() => cancelAppointment(apt)}
                              className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                            >
                              Anulare
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {appointmentsSubTab === 'completed' && (
                getCompletedAppointments(true).length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">{hasActiveFilters ? 'Nu există programări finalizate care să corespundă filtrelor' : 'Nu există programări finalizate'}</p>
                  </div>
                ) : (
                  getCompletedAppointments(true).map((apt) => {
                    const customer = getCustomerById(apt.customerId);
                    
                    return (
                      <div key={apt.id} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded">
                                {new Date(apt.data).toLocaleDateString('ro-RO')} • {apt.ora}
                              </div>
                              <h3 className="text-lg font-semibold">{customer?.nume || 'Client șters'}</h3>
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">FINALIZATĂ</span>
                            </div>
                            {customer && (
                              <>
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                  <Phone size={16} />
                                  <span>{customer.telefon}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin size={16} />
                                  <span>{customer.adresa}</span>
                                </div>
                                <div className="bg-blue-50 px-3 py-2 rounded inline-block mt-2">
                                  <span className="text-sm font-medium text-blue-700">{apt.tipServiciu || customer.tipServiciu}</span>
                                  {apt.periodicitate && (
                                    <span className="text-sm text-blue-600 ml-2">• {apt.periodicitate}</span>
                                  )}
                                </div>
                              </>
                            )}
                            {apt.observatii && (
                              <p className="text-sm text-gray-600 mt-2 italic">"{apt.observatii}"</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteAppointment(apt.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                          >
                            Șterge
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {appointmentsSubTab === 'cancelled' && (
                getCancelledAppointments(true).length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">{hasActiveFilters ? 'Nu există programări anulate care să corespundă filtrelor' : 'Nu există programări anulate'}</p>
                  </div>
                ) : (
                  getCancelledAppointments(true).map((apt) => {
                    const customer = getCustomerById(apt.customerId);
                    
                    return (
                      <div key={apt.id} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-red-500 opacity-75">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded">
                                {new Date(apt.data).toLocaleDateString('ro-RO')} • {apt.ora}
                              </div>
                              <h3 className="text-lg font-semibold">{customer?.nume || 'Client șters'}</h3>
                              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">ANULATĂ</span>
                            </div>
                            {customer && (
                              <>
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                  <Phone size={16} />
                                  <span>{customer.telefon}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin size={16} />
                                  <span>{customer.adresa}</span>
                                </div>
                                <div className="bg-blue-50 px-3 py-2 rounded inline-block mt-2">
                                  <span className="text-sm font-medium text-blue-700">{apt.tipServiciu || customer.tipServiciu}</span>
                                  {apt.periodicitate && (
                                    <span className="text-sm text-blue-600 ml-2">• {apt.periodicitate}</span>
                                  )}
                                </div>
                              </>
                            )}
                            {apt.observatii && (
                              <p className="text-sm text-gray-600 mt-2 italic">"{apt.observatii}"</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteAppointment(apt.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                          >
                            Șterge definitiv
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        )}

        {/* TAB CLIENTI */}
        {activeTab === 'customers' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-3">Bază de Date Clienți</h2>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <button
                  onClick={() => setShowCustomerForm(!showCustomerForm)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm min-h-[44px]"
                >
                  <Plus size={18} />
                  Client Nou
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setImportType('customers');
                      setImportResult(null);
                      setShowImportModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm min-h-[44px]"
                    title="Importă date din fișier CSV"
                  >
                    <Upload size={18} />
                    <span className="hidden sm:inline">Import CSV</span>
                    <span className="sm:hidden">Import</span>
                  </button>
                  <button
                    onClick={exportCustomersCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm min-h-[44px]"
                    title="Exportă clienții în format CSV"
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export Clienți</span>
                    <span className="sm:hidden">Clienți</span>
                  </button>
                  <button
                    onClick={exportAppointmentsCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm min-h-[44px]"
                    title="Exportă programările în format CSV"
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export Programări</span>
                    <span className="sm:hidden">Programări</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Caută după nume, telefon sau adresă..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrează după tip serviciu</label>
                    <select
                      value={filterServiceType}
                      onChange={(e) => {
                        setFilterServiceType(e.target.value);
                        // Reset periodicitate when changing service type
                        if (e.target.value !== 'Verificare/Revizie Instalație Gaze' && e.target.value !== 'Pachet Verificare/Revizie cu Centrală') {
                          setFilterPeriodicitate('');
                        }
                      }}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                    >
                      <option value="">Toate serviciile</option>
                      <option value="Verificare/Revizie Instalație Gaze">Verificare/Revizie Instalație Gaze</option>
                      <option value="Pachet Verificare/Revizie cu Centrală">Pachet Verificare/Revizie cu Centrală</option>
                      <option value="Reluare Furnizare Gaze (gaz oprit)">Reluare Furnizare Gaze (gaz oprit)</option>
                      <option value="Montaj detector gaze/senzor">Montaj detector gaze/senzor</option>
                      <option value="Execuții instalații termice cupru">Execuții instalații termice cupru</option>
                      <option value="Execuții instalații termice PPR">Execuții instalații termice PPR</option>
                      <option value="Montare centrală termică">Montare centrală termică</option>
                      <option value="Revizie sistem încălzire">Revizie sistem încălzire</option>
                    </select>
                  </div>

                  {(filterServiceType === 'Verificare/Revizie Instalație Gaze' || filterServiceType === 'Pachet Verificare/Revizie cu Centrală') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Periodicitate</label>
                      <select
                        value={filterPeriodicitate}
                        onChange={(e) => setFilterPeriodicitate(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                      >
                        <option value="">Toate periodicitățile</option>
                        <option value="Verificare periodică la 2 ani instalație gaze">Verificare instalație la 2 ani</option>
                        <option value="Verificare periodică la 10 ani instalație gaze">Verificare instalație la 10 ani</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Selection and filter info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Afișare {filteredCustomers.length} din {customers.length} clienți</span>
                    {(searchTerm || filterServiceType || filterPeriodicitate) && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterServiceType('');
                          setFilterPeriodicitate('');
                        }}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Resetează filtre
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredCustomers.length > 0 && filteredCustomers.length < customers.length && (
                      <button
                        onClick={toggleSelectAll}
                        className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg min-h-[36px]"
                      >
                        {selectedCustomers.length === filteredCustomers.length && selectedCustomers.length > 0 
                          ? 'Deselectează filtrați' 
                          : `Selectează filtrați (${filteredCustomers.length})`}
                      </button>
                    )}
                    {customers.length > 0 && (
                      <button
                        onClick={selectAllCustomers}
                        className="text-sm px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg min-h-[36px]"
                      >
                        {selectedCustomers.length === customers.length 
                          ? 'Deselectează tot' 
                          : `Selectează tot (${customers.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk actions */}
                {selectedCustomers.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-sm text-red-700 font-medium">
                      {selectedCustomers.length} clienți selectați
                    </span>
                    <button
                      onClick={deleteBulkCustomers}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm min-h-[36px]"
                    >
                      <Trash2 size={16} />
                      Șterge selectați
                    </button>
                    <button
                      onClick={() => setSelectedCustomers([])}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Anulează selecția
                    </button>
                  </div>
                )}
              </div>

              {showCustomerForm && (
                <div ref={customerFormRef} className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">{editingCustomerId ? 'Editare Client' : 'Client Nou'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nume Client *</label>
                      <input
                        type="text"
                        value={customerForm.nume}
                        onChange={(e) => setCustomerForm({...customerForm, nume: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ion Popescu"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                      <input
                        type="tel"
                        value={customerForm.telefon}
                        onChange={(e) => setCustomerForm({...customerForm, telefon: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0721234567"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresă *</label>
                      <input
                        type="text"
                        value={customerForm.adresa}
                        onChange={(e) => setCustomerForm({...customerForm, adresa: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Str. Mihai Viteazu nr. 15, bl. A3, sc. 2, ap. 45, Constanța"
                      />
                    </div>
                    
                    {/* Show additional fields only when editing */}
                    {editingCustomerId && (
                      <>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tip Serviciu</label>
                          <select
                            value={customerForm.tipServiciu}
                            onChange={(e) => setCustomerForm({...customerForm, tipServiciu: e.target.value, periodicitate: ''})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          >
                            <option value="">— completat din programări —</option>
                            <option value="Verificare/Revizie Instalație Gaze">Verificare/Revizie Instalație Gaze</option>
                            <option value="Pachet Verificare/Revizie cu Centrală">Pachet Verificare/Revizie cu Centrală</option>
                            <option value="Reluare Furnizare Gaze (gaz oprit)">Reluare Furnizare Gaze (gaz oprit)</option>
                            <option value="Montaj detector gaze/senzor">Montaj detector gaze/senzor</option>
                            <option value="Execuții instalații termice cupru">Execuții instalații termice cupru</option>
                            <option value="Execuții instalații termice PPR">Execuții instalații termice PPR</option>
                            <option value="Montare centrală termică">Montare centrală termică</option>
                            <option value="Revizie sistem încălzire">Revizie sistem încălzire</option>
                          </select>
                        </div>
                        {(customerForm.tipServiciu === "Verificare/Revizie Instalație Gaze" || 
                          customerForm.tipServiciu === "Pachet Verificare/Revizie cu Centrală") && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Periodicitate</label>
                            <select
                              value={customerForm.periodicitate}
                              onChange={(e) => setCustomerForm({...customerForm, periodicitate: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            >
                              <option value="">— completat din programări —</option>
                              <option value="Verificare periodică la 2 ani instalație gaze">Verificare periodică la 2 ani instalație gaze</option>
                              <option value="Verificare periodică la 10 ani instalație gaze">Verificare periodică la 10 ani instalație gaze</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tip Centrală</label>
                          <select
                            value={customerForm.tipCentrala}
                            onChange={(e) => setCustomerForm({...customerForm, tipCentrala: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          >
                            <option value="">— completat din programări —</option>
                            <option value="Gaz">Gaz</option>
                            <option value="Condensație">Condensație</option>
                            <option value="Electrică">Electrică</option>
                            <option value="Lemne">Lemne</option>
                            <option value="Peleți">Peleți</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model/Marcă</label>
                          <input
                            type="text"
                            value={customerForm.model}
                            onChange={(e) => setCustomerForm({...customerForm, model: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            placeholder="— completat din programări —"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ultima Revizie</label>
                          <button
                            type="button"
                            onClick={() => openCalendarPicker('customerUltimaRevizie', false, false, customerForm.ultimaRevizie)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100"
                          >
                            <span className={customerForm.ultimaRevizie ? 'text-gray-900' : 'text-gray-400'}>
                              {customerForm.ultimaRevizie 
                                ? new Date(customerForm.ultimaRevizie).toLocaleDateString('ro-RO')
                                : '— completat din programări —'}
                            </span>
                            <Calendar size={18} className="text-gray-400" />
                          </button>
                        </div>
                        {customerForm.proximaRevizie && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data următoarei verificări</label>
                            <button
                              type="button"
                              onClick={() => openCalendarPicker('customerProximaRevizie', false, false, customerForm.proximaRevizie)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100"
                            >
                              <span className={customerForm.proximaRevizie ? 'text-gray-900' : 'text-gray-400'}>
                                {customerForm.proximaRevizie 
                                  ? new Date(customerForm.proximaRevizie).toLocaleDateString('ro-RO')
                                  : 'Selectează'}
                              </span>
                              <Calendar size={18} className="text-gray-400" />
                            </button>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Observații</label>
                          <textarea
                            value={customerForm.observatii}
                            onChange={(e) => setCustomerForm({...customerForm, observatii: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Probleme anterioare, piese schimbate, preferințe client..."
                          />
                        </div>
                      </>
                    )}
                    
                    {/* Info message for new customer */}
                    {!editingCustomerId && (
                      <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                          <strong>Notă:</strong> Restul datelor (tip serviciu, centrală, etc.) se vor completa automat din programările adăugate pentru acest client.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={saveCustomer}
                      disabled={!customerForm.nume || !customerForm.telefon || !customerForm.adresa}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                    >
                      {editingCustomerId ? 'Actualizare' : 'Salvare'}
                    </button>
                    <button
                      onClick={resetCustomerForm}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Anulare
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {filteredCustomers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-500">Nu există clienți înregistrați.</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="w-5 h-5 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{customer.nume}</h3>
                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                              <Phone size={16} />
                              <span>{customer.telefon}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                              <MapPin size={16} />
                              <span>{customer.adresa}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editCustomer(customer)}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                            >
                              Editare
                            </button>
                            <button
                              onClick={() => deleteCustomer(customer.id)}
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            >
                              Ștergere
                            </button>
                          </div>
                        </div>
                    
                    {/* Istoric Client */}
                    {(() => {
                      const history = getCustomerAppointmentHistory(customer.id);
                      const revisionServices = [
                        "Verificare/Revizie Instalație Gaze",
                        "Pachet Verificare/Revizie cu Centrală"
                      ];
                      
                      if (history.length === 0) {
                        return (
                          <div className="pt-4 border-t">
                            <p className="text-sm text-gray-400 italic">Nicio programare finalizată sau anulată pentru acest client</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="pt-4 border-t">
                          {/* Istoric Client Button */}
                          <button
                            onClick={() => toggleCustomerHistory(customer.id)}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Clock size={16} />
                            Istoric Client ({history.length} {history.length === 1 ? 'programare' : 'programări'})
                            <ChevronRight 
                              size={16} 
                              className={`transition-transform ${expandedCustomerHistory[customer.id] ? 'rotate-90' : ''}`}
                            />
                          </button>
                          
                          {/* Expanded History */}
                          {expandedCustomerHistory[customer.id] && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-4">
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {history.map((apt) => {
                                  const isRevision = revisionServices.includes(apt.tipServiciu);
                                  // Fallback to customer data for old appointments without these fields
                                  const tipCentrala = apt.tipCentrala || customer.tipCentrala;
                                  const model = apt.model || customer.model;
                                  
                                  return (
                                    <div 
                                      key={apt.id} 
                                      className={`p-3 rounded-lg border-l-4 bg-white shadow-sm ${apt.completed ? 'border-green-500' : 'border-red-500'}`}
                                    >
                                      {/* Header: Date, Time, Status */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-800">
                                            {formatDateRomanian(apt.data)}
                                          </span>
                                          <span className="text-sm text-gray-600">• {apt.ora}</span>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${apt.completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {apt.completed ? 'FINALIZAT' : 'ANULAT'}
                                        </span>
                                      </div>
                                      
                                      {/* Service Type */}
                                      <div className="text-sm mb-2">
                                        <p className="font-medium text-blue-600">{apt.tipServiciu}</p>
                                      </div>
                                      
                                      {/* Additional fields based on service type */}
                                      <div className="space-y-1 text-xs">
                                        {/* Periodicitate - for revision services */}
                                        {apt.periodicitate && (
                                          <div>
                                            <span className="text-gray-500">Periodicitate:</span>
                                            <span className="ml-1 text-gray-700">{apt.periodicitate}</span>
                                          </div>
                                        )}
                                        
                                        {/* Data ultimei revizii - for revision services */}
                                        {isRevision && apt.completedAt && apt.completed && (
                                          <div>
                                            <span className="text-gray-500">Data revizie:</span>
                                            <span className="ml-1 text-gray-700">{new Date(apt.completedAt).toLocaleDateString('ro-RO')}</span>
                                          </div>
                                        )}
                                        
                                        {/* Tip Centrala */}
                                        {tipCentrala && (
                                          <div>
                                            <span className="text-gray-500">Tip Centrală:</span>
                                            <span className="ml-1 text-gray-700">{tipCentrala}</span>
                                          </div>
                                        )}
                                        
                                        {/* Model */}
                                        {model && (
                                          <div>
                                            <span className="text-gray-500">Model:</span>
                                            <span className="ml-1 text-gray-700">{model}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Observatii */}
                                      {(apt.observatii || apt.observatiiFinalizare) && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                          {apt.observatii && (
                                            <p className="text-xs text-gray-500">
                                              <span className="font-medium">Observații programare:</span> {apt.observatii}
                                            </p>
                                          )}
                                          {apt.observatiiFinalizare && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              <span className="font-medium">Observații finalizare:</span> {apt.observatiiFinalizare}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Fixed bottom bar for bulk delete - mobile friendly */}
            {selectedCustomers.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 sm:p-4 z-40">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-gray-700 font-medium text-sm sm:text-base">
                    {selectedCustomers.length} {selectedCustomers.length === 1 ? 'client selectat' : 'clienți selectați'}
                  </span>
                  <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedCustomers([])}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm min-h-[44px]"
                    >
                      Anulează
                    </button>
                    <button
                      onClick={deleteBulkCustomers}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm min-h-[44px]"
                    >
                      <Trash2 size={16} />
                      Șterge ({selectedCustomers.length})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB ALERTE */}
        {activeTab === 'alerts' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h2 className="text-xl font-semibold mb-2">Alerte Revizie</h2>
              <p className="text-gray-600 mb-4">Revizii pentru servicii de tip Verificare/Revizie Instalație Gaze și Pachet Verificare/Revizie cu Centrală</p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setAlertsSubTab('upcoming30')}
                  className={`px-4 py-2 rounded-lg transition ${
                    alertsSubTab === 'upcoming30' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Expiră în 30 zile ({getUpcomingAlerts().length})
                </button>
                <button
                  onClick={() => setAlertsSubTab('allFuture')}
                  className={`px-4 py-2 rounded-lg transition ${
                    alertsSubTab === 'allFuture' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toate reviziile viitoare ({getAllFutureAlerts().length})
                </button>
              </div>
            </div>

            {alertsSubTab === 'upcoming30' && (
              getUpcomingAlerts().length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Bell className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-500">Nu există revizii care expiră în următoarele 30 de zile</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getUpcomingAlerts().map((alert) => {
                    const daysUntil = Math.floor((alert.nextRevisionDate - new Date()) / (1000 * 60 * 60 * 24));
                    const urgency = daysUntil <= 10 ? 'red' : daysUntil <= 20 ? 'orange' : 'yellow';
                    
                    return (
                      <div key={`${alert.customer.id}-${alert.appointment.id}`} className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${
                        urgency === 'red' ? 'border-red-500' : urgency === 'orange' ? 'border-orange-500' : 'border-yellow-500'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`font-bold px-3 py-2 rounded ${
                                urgency === 'red' ? 'bg-red-100 text-red-700' : 
                                urgency === 'orange' ? 'bg-orange-100 text-orange-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {daysUntil === 0 ? 'ASTĂZI' : daysUntil === 1 ? 'MÂINE' : `${daysUntil} zile`}
                              </div>
                              <h3 className="text-lg font-semibold">{alert.customer.nume}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                              <Phone size={16} />
                              <span>{alert.customer.telefon}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <MapPin size={16} />
                              <span>{alert.customer.adresa}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <Calendar size={16} />
                              <span>Următoarea revizie: {alert.nextRevisionDate.toLocaleDateString('ro-RO')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                              <Clock size={14} />
                              <span>Ultima revizie finalizată: {new Date(alert.completedDate).toLocaleDateString('ro-RO')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="bg-blue-50 px-3 py-2 rounded">
                                <span className="text-sm font-medium text-blue-700">{alert.appointment.tipServiciu}</span>
                              </div>
                              <div className="bg-purple-50 px-3 py-2 rounded">
                                <span className="text-sm font-medium text-purple-700">{alert.appointment.periodicitate}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab('customers');
                              editCustomer(alert.customer);
                            }}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            Vezi Detalii
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {alertsSubTab === 'allFuture' && (
              getAllFutureAlerts().length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Bell className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-500">Nu există revizii viitoare programate</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getAllFutureAlerts().map((alert) => {
                    const daysUntil = Math.floor((alert.nextRevisionDate - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysUntil <= 30;
                    
                    return (
                      <div key={`${alert.customer.id}-${alert.appointment.id}`} className={`bg-white rounded-lg shadow-sm p-5 ${
                        isUrgent ? 'border-l-4 border-orange-500' : ''
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`font-bold px-3 py-2 rounded ${
                                isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {daysUntil <= 30 ? `${daysUntil} zile` : 
                                 daysUntil <= 365 ? `${Math.floor(daysUntil / 30)} luni` : 
                                 `${Math.floor(daysUntil / 365)} ani ${Math.floor((daysUntil % 365) / 30)} luni`}
                              </div>
                              <h3 className="text-lg font-semibold">{alert.customer.nume}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                              <Phone size={16} />
                              <span>{alert.customer.telefon}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <MapPin size={16} />
                              <span>{alert.customer.adresa}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <Calendar size={16} />
                              <span>Următoarea revizie: {alert.nextRevisionDate.toLocaleDateString('ro-RO')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                              <Clock size={14} />
                              <span>Ultima revizie finalizată: {new Date(alert.completedDate).toLocaleDateString('ro-RO')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="bg-blue-50 px-3 py-2 rounded">
                                <span className="text-sm font-medium text-blue-700">{alert.appointment.tipServiciu}</span>
                              </div>
                              <div className="bg-purple-50 px-3 py-2 rounded">
                                <span className="text-sm font-medium text-purple-700">{alert.appointment.periodicitate}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab('customers');
                              editCustomer(alert.customer);
                            }}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            Vezi Detalii
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

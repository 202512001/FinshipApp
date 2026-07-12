'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginUser } from "../../../lib/services/profile";
import { Eye, EyeOff, Phone, User, Lock, Shield, Copy, Check, Users, ChevronRight } from 'lucide-react';
import AppLogo from '../../../components/ui/AppLogo';
import Modal from '../../../components/ui/Modal';
import { verifyAdminPassword } from '../../../lib/services/adminAuth';
/*import {
  demoCredentials,
  type Gender
} from "../../../lib/mockData";*/

   import { getUserFriendlyError } from '../../../lib/errors';
import {
  registerUser,
  getAreas
} from "../../../lib/services/profile";
type Tab = 'login' | 'register';

interface LoginForm {
  mobile: string;
  pin: string;
}

interface RegisterForm {
  name: string;
  mobile: string;
  gender: Gender;
  area_id: string;
  society: string;
  house_no: string;
  pin: string;
}

interface AdminPasswordForm {
  password: string;
}

export default function SignUpLoginClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [showPin, setShowPin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);

  const loginForm = useForm<LoginForm>({ defaultValues: { mobile: '', pin: '' } });
  const registerForm = useForm<RegisterForm>({
  defaultValues: {
    name: "",
    mobile: "",
    gender: "Male",
    area_id: "",
    society: "",
    house_no: "",
    pin: "",
  },
});
  const adminForm = useForm<AdminPasswordForm>({ defaultValues: { password: '' } });

  useEffect(() => {
  async function load() {
    const data = await getAreas();
    setAreas(data);
  }

  load();
}, []);

  // BACKEND INTEGRATION POINT: Replace with real authentication API call
  const handleLogin = loginForm.handleSubmit(async (data) => {
  try {
    setLoginLoading(true);

    await new Promise((r) => setTimeout(r, 900));

   const result = await loginUser(data.mobile, data.pin);
   

if (result.status === 'not_found') {
  loginForm.setError('pin', { message: 'Invalid mobile number or PIN.' });
  return;
}

if (result.status === 'pending') {
  toast.error('Your registration is pending. Please contact your area admin for approval.');
  return;
}

if (result.status === 'blocked') {
  toast.error('Your account has been blocked. Please contact your admin.');
  return;
}

if (!result.user) {
  toast.error('Something went wrong. Please try again.');
  return;
}

// approved
const safeUser = {
  id: result.user.id,
  name: result.user.name,
  gender: result.user.gender,
  area_id: result.user.area_id,
  area: (result.user as any).areas?.name ?? '',
  society: result.user.society,
  house_no: result.user.house_no,
  role: result.user.role,
  admin_type: result.user.admin_type ?? null,
};
localStorage.setItem('cv_user', JSON.stringify(safeUser));
toast.success(`Welcome, ${result.user.name}!`);
router.push('/member-home');

    // One session for everyone
   // localStorage.setItem("cv_user", JSON.stringify(user));

   // toast.success(`Welcome back, ${user.name}!`);

    setLoginLoading(false);

    router.push("/member-home");
  } catch (err: any) {
    setLoginLoading(false);
    toast.error(err.message || "Login failed");
  }
});

  // BACKEND INTEGRATION POINT: Replace with real registration API call
  const handleRegister = registerForm.handleSubmit(async (data) => {
  try {
    setRegisterLoading(true);

    await registerUser(data);

    setRegisterLoading(false);

    setRegistrationSuccess(true);

    registerForm.reset();

    toast.success("Registration submitted successfully.");

  } catch (err: any) {

    setRegisterLoading(false);

toast.error(getUserFriendlyError(err)); // ✅ safe generic message

  }
});

  // BACKEND INTEGRATION POINT: Replace with real admin auth
  const handleAdminAccess = adminForm.handleSubmit(async (data) => {
  setAdminLoading(true);
  try {
    const isValid = await verifyAdminPassword(data.password);
    if (!isValid) {
      adminForm.setError('password', { message: 'Incorrect password. Please try again.' });
      return;
    }
    toast.success('Admin access granted');
    localStorage.setItem('cv_admin', 'true');
    // cv_user is already set from member login — admin panel will use it for area+gender filtering
    setShowAdminModal(false);
    router.push('/admin-panel');
  } catch (err) {
    console.error('Admin auth error:', err);
    toast.error('Unable to verify password. Try again.');
  } finally {
    setAdminLoading(false);
  }
});

  const handleCopy = (value: string, key: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(value).then(() => {
        setCopiedField(key);
        setTimeout(() => setCopiedField(null), 1500);
      });
    }
  };

  const autofillDemo = (mobile: string, pin: string) => {
  if (mobile === 'N/A') return; // skip admin password entry
  loginForm.setValue('mobile', mobile);
  loginForm.setValue('pin', pin);
  setActiveTab('login');
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <AppLogo size={48} />
          <span className="text-2xl font-bold text-foreground tracking-tight">CommunityVisit</span>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Organized visits. Connected community.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['login', 'register'] as Tab[]).map((tab) => (
            <button
              key={`tab-${tab}`}
              onClick={() => {
                setActiveTab(tab);
                setRegistrationSuccess(false);
              }}
              suppressHydrationWarning
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors duration-150 ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary bg-secondary/50' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 fade-in">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 tracking-wide uppercase">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    {...loginForm.register('mobile', {
                      required: 'Mobile number is required',
                      pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
                    })}
                    className="w-full pl-9 pr-3 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
                {loginForm.formState.errors.mobile && (
                  <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.mobile.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 tracking-wide uppercase">
                  4-Digit PIN
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    placeholder="Enter your PIN"
                    {...loginForm.register('pin', {
                      required: 'PIN is required',
                      minLength: { value: 4, message: 'PIN must be 4 digits' },
                    })}
                    className="w-full pl-9 pr-10 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginForm.formState.errors.pin && (
                  <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.pin.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ChevronRight size={16} /></>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && !registrationSuccess && (
            <form onSubmit={handleRegister} className="space-y-4 fade-in">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 tracking-wide uppercase">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    {...registerForm.register('name', { required: 'Name is required', minLength: { value: 3, message: 'Name must be at least 3 characters' } })}
                    className="w-full pl-9 pr-3 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 tracking-wide uppercase">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    {...registerForm.register('mobile', {
                      required: 'Mobile number is required',
                      pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
                    })}
                    className="w-full pl-9 pr-3 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
                {registerForm.formState.errors.mobile && (
                  <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.mobile.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 tracking-wide uppercase">
                  Gender
                </label>
                <p className="text-xs text-muted-foreground mb-2">Gender cannot be changed after registration.</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Male', 'Female'] as Gender[]).map((g) => (
                    <label
                      key={`gender-${g}`}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-150 text-sm font-semibold ${
                        registerForm.watch('gender') === g
                          ? 'border-primary bg-primary/10 text-primary' :'border-border bg-input text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        value={g}
                        {...registerForm.register('gender', { required: true })}
                        className="sr-only"
                      />
                      <Users size={16} />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div>
  <label className="block text-xs font-semibold mb-1.5">
    Area
  </label>

  <select
    {...registerForm.register("area_id", {
      required: "Please select an area",
    })}
    className="w-full px-3 py-2.5 bg-input border border-border rounded-xl"
  >
    <option value="">Select Area</option>

    {areas.map((area) => (
      <option key={area.id} value={area.id}>
        {area.name}
      </option>
    ))}
  </select>

  {registerForm.formState.errors.area_id && (
    <p className="text-xs text-destructive mt-1">
      {registerForm.formState.errors.area_id.message}
    </p>
  )}
</div>

<div>
  <label className="block text-xs font-semibold mb-1.5">
    Society
  </label>

  <input
    type="text"
    placeholder="Society"
    
    {...registerForm.register("society", {
      required: "Society is required",
    })}
    className="w-full pl-3 pr-3 py-2.5 bg-input border border-border rounded-xl"
  />
</div>

<div>
  <label className="block text-xs font-semibold mb-1.5">
    House Number
  </label>

  <input
    type="text"
    placeholder="House Number"
    {...registerForm.register("house_no", {
      required: "House Number is required",
    })}
    className="w-full pl-3 pr-3 py-2.5 bg-input border border-border rounded-xl"
  />
</div>

<div>
  <label className="block text-xs font-semibold mb-1.5">
    4 Digit PIN
  </label>

  <input
    type="password"
    placeholder="Enter 4 digits"
    maxLength={4}
    {...registerForm.register("pin", {
  required: "PIN is required",
  pattern: {
    value: /^\d{4}$/,
    message: "PIN must be exactly 4 digits",
  },
})}
    className="w-full pl-3 pr-3 py-2.5 bg-input border border-border rounded-xl"
    
 />
 
 <p className="mt-1 text-xs text-muted-foreground">
  Create a 4-digit PIN that you'll use every time you log in.
</p>
</div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {registerLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Send Registration Request'
                )}
              </button>
            </form>
          )}

          {/* REGISTRATION SUCCESS */}
          {activeTab === 'register' && registrationSuccess && (
            <div className="text-center py-4 fade-in space-y-3">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Check size={28} className="text-success" />
              </div>
              <h3 className="font-semibold text-foreground">Request Submitted!</h3>
              <p className="text-sm text-muted-foreground">
                Your registration request has been sent to the Admin for approval. You will be notified once approved.
              </p>
              <button
                onClick={() => { setRegistrationSuccess(false); setActiveTab('login'); }}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Demo Credentials Box */}
      <div className="w-full max-w-sm mt-4 bg-card border border-border rounded-2xl overflow-hidden">
        
        
      </div>

      {/* Admin Panel Access Button */}
      <button
        onClick={() => setShowAdminModal(true)}
        className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-card border border-transparent hover:border-border"
      >
        <Shield size={16} />
        Admin Panel Access
      </button>

      {/* Admin Password Modal */}
      <Modal open={showAdminModal} onClose={() => { setShowAdminModal(false); adminForm.reset(); }} title="Admin Panel Access">
        <form onSubmit={handleAdminAccess} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">
              Admin Password
            </label>
            <p className="text-xs text-muted-foreground mb-2">Enter the password provided by the Main Admin.</p>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showAdminPass ? 'text' : 'password'}
                placeholder="Enter admin password"
                {...adminForm.register('password', { required: 'Password is required' })}
                className="w-full pl-9 pr-10 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showAdminPass ? 'Hide password' : 'Show password'}
              >
                {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {adminForm.formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">{adminForm.formState.errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={adminLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {adminLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield size={16} />
                Access Admin Panel
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
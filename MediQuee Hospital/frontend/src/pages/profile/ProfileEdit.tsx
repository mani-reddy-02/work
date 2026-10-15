import { useState, useEffect, useCallback } from "react"
import { 
  ArrowLeft, User, Camera, Save, Briefcase, Stethoscope, 
  FileCheck, IndianRupee, Clock, RefreshCw, AlertCircle, 
  MapPin, Phone, Mail, Calendar, FileText, Building2, CheckCircle2
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { userApi, type UserProfile } from "@/services/userApi"
import { useToast } from "@/context/ToastContext"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

export function ProfileEdit() {
  const navigate = useNavigate();
  const { role, updateUser } = useAuth();
  const { toast } = useToast();

  const isDoctor = role === 'doctor';
  const isNurse = role === 'nurse';
  const isReceptionist = role === 'receptionist';
  const primaryColor = "bg-[#1769E0] hover:bg-blue-700";
  const primaryText = "text-[#1769E0]";
  const primaryBgSoft = "bg-blue-50";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

interface ParsedAddress {
  type: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  id?: string;
}

function parseRawAddress(raw: any): ParsedAddress {
  const defaultAddress: ParsedAddress = {
    type: 'Home',
    street: '',
    city: '',
    state: '',
    pincode: '',
  };

  if (!raw) return defaultAddress;

  if (typeof raw === 'object' && raw !== null) {
    if (Array.isArray(raw)) {
      const first = raw[0] || {};
      return {
        type: first.type || 'Home',
        street: first.street || '',
        city: first.city || '',
        state: first.state || '',
        pincode: first.pincode || '',
        id: first.id,
      };
    }
    return {
      type: raw.type || 'Home',
      street: raw.street || '',
      city: raw.city || '',
      state: raw.state || '',
      pincode: raw.pincode || '',
      id: raw.id,
    };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseRawAddress(parsed);
      } catch {
        // Fallback to plain string if parse fails
      }
    }
    return {
      ...defaultAddress,
      street: trimmed,
    };
  }

  return defaultAddress;
}

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dob, setDob] = useState<string>('');

  // Structured Address States
  const [addressStreet, setAddressStreet] = useState<string>('');
  const [addressCity, setAddressCity] = useState<string>('');
  const [addressState, setAddressState] = useState<string>('');
  const [addressPincode, setAddressPincode] = useState<string>('');
  const [addressType, setAddressType] = useState<string>('Home');
  const [addressId, setAddressId] = useState<string | undefined>(undefined);

  // Address memory for seamless Home <-> Clinic switching
  const [homeAddress, setHomeAddress] = useState<ParsedAddress>({
    type: 'Home',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [clinicAddress, setClinicAddress] = useState<ParsedAddress>({
    type: 'Clinic',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [designation, setDesignation] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  // Doctor professional fields
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [qualification, setQualification] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [consultationFee, setConsultationFee] = useState<string>('');

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.getMe();
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setGender(data.gender || '');

      // Format Date of Birth (YYYY-MM-DD for input[type="date"])
      let formattedDob = data.dob || '';
      if (formattedDob.includes('T')) {
        formattedDob = formattedDob.split('T')[0];
      }
      setDob(formattedDob);

      // Hospital facility clinic address
      const hospitalStreet = [
        data.hospital?.addressLine1,
        data.hospital?.area,
      ].filter(Boolean).join(', ');

      const defaultClinic: ParsedAddress = {
        type: 'Clinic',
        street: data.hospitalFacilityAddress?.street || hospitalStreet || '',
        city: data.hospitalFacilityAddress?.city || data.hospital?.city || '',
        state: data.hospitalFacilityAddress?.state || data.hospital?.state || '',
        pincode: data.hospitalFacilityAddress?.pincode || data.hospital?.pincode || '',
      };
      setClinicAddress(defaultClinic);

      // Parse user address
      const addr = parseRawAddress(data.address);
      if (addr.type?.toLowerCase().includes('clinic') || addr.type?.toLowerCase().includes('work')) {
        const effectiveClinic: ParsedAddress = {
          type: 'Clinic',
          street: addr.street || defaultClinic.street,
          city: addr.city || defaultClinic.city,
          state: addr.state || defaultClinic.state,
          pincode: addr.pincode || defaultClinic.pincode,
          id: addr.id,
        };
        setClinicAddress(effectiveClinic);
        setAddressStreet(effectiveClinic.street);
        setAddressCity(effectiveClinic.city);
        setAddressState(effectiveClinic.state);
        setAddressPincode(effectiveClinic.pincode);
        setAddressType('Clinic');
        setAddressId(effectiveClinic.id);
      } else {
        setHomeAddress(addr);
        const hasHomeAddress = Boolean(addr.street || addr.city || addr.state || addr.pincode);
        if (hasHomeAddress) {
          setAddressStreet(addr.street);
          setAddressCity(addr.city);
          setAddressState(addr.state);
          setAddressPincode(addr.pincode);
          setAddressType('Home');
          setAddressId(addr.id);
        } else if (defaultClinic.street || defaultClinic.city) {
          // Pre-fill with clinic/work address by default if home address is empty
          setAddressStreet(defaultClinic.street);
          setAddressCity(defaultClinic.city);
          setAddressState(defaultClinic.state);
          setAddressPincode(defaultClinic.pincode);
          setAddressType('Clinic');
        }
      }

      setDesignation(data.designation || (isDoctor && data.department?.name ? `Consultant - ${data.department.name}` : ''));
      setBio(data.bio || '');
      setLicenseNumber(data.licenseNumber || '');
      setSpecialization(data.specialization || data.department?.name || '');
      setQualification(data.qualification || (isDoctor ? 'MBBS, MD' : ''));
      setExperience(data.experienceYears !== null && data.experienceYears !== undefined ? String(data.experienceYears) : '');
      setConsultationFee(data.consultationFee !== null && data.consultationFee !== undefined ? String(data.consultationFee) : '');
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      setError(err?.message || "Failed to load account details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isDoctor]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSwitchToHome = () => {
    if (addressType === 'Clinic') {
      setClinicAddress({
        type: 'Clinic',
        street: addressStreet,
        city: addressCity,
        state: addressState,
        pincode: addressPincode,
        id: addressId,
      });
    }
    setAddressType('Home');
    setAddressStreet(homeAddress.street);
    setAddressCity(homeAddress.city);
    setAddressState(homeAddress.state);
    setAddressPincode(homeAddress.pincode);
    setAddressId(homeAddress.id);
  };

  const handleSwitchToClinic = () => {
    if (addressType === 'Home') {
      setHomeAddress({
        type: 'Home',
        street: addressStreet,
        city: addressCity,
        state: addressState,
        pincode: addressPincode,
        id: addressId,
      });
    }
    setAddressType('Clinic');
    const targetClinic = (clinicAddress.street || clinicAddress.city)
      ? clinicAddress
      : {
          type: 'Clinic',
          street: [profile?.hospital?.addressLine1, profile?.hospital?.area].filter(Boolean).join(', '),
          city: profile?.hospital?.city || '',
          state: profile?.hospital?.state || '',
          pincode: profile?.hospital?.pincode || '',
        };
    setAddressStreet(targetClinic.street);
    setAddressCity(targetClinic.city);
    setAddressState(targetClinic.state);
    setAddressPincode(targetClinic.pincode);
    setAddressId(targetClinic.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Name cannot be empty", "error");
      return;
    }

    setIsSaving(true);
    try {
      // Serialize structured address into the JSON format expected by backend ecosystem
      const hasAnyAddress = addressStreet.trim() || addressCity.trim() || addressState.trim() || addressPincode.trim();
      let serializedAddress: string | null = null;
      if (hasAnyAddress) {
        serializedAddress = JSON.stringify([
          {
            type: addressType || 'Home',
            street: addressStreet.trim(),
            city: addressCity.trim(),
            state: addressState.trim(),
            pincode: addressPincode.trim(),
            id: addressId || Date.now().toString(),
          }
        ]);
      }

      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        gender: gender || null,
        dob: dob || null,
        address: serializedAddress,
        designation: designation.trim() || null,
        bio: bio.trim() || null,
        ...(isDoctor || isNurse ? {
          licenseNumber: licenseNumber.trim() || null,
          specialization: specialization.trim() || null,
          qualification: qualification.trim() || null,
          experienceYears: experience ? Number(experience) : null,
          ...(isDoctor ? { consultationFee: consultationFee ? Number(consultationFee) : null } : {}),
        } : {}),
      };

      const updated = await userApi.updateMe(payload);

      setProfile(updated);
      setName(updated.name || '');
      setPhone(updated.phone || '');
      setGender(updated.gender || '');

      let formattedDob = updated.dob || '';
      if (formattedDob.includes('T')) {
        formattedDob = formattedDob.split('T')[0];
      }
      setDob(formattedDob);

      const updatedAddr = parseRawAddress(updated.address);
      setAddressStreet(updatedAddr.street);
      setAddressCity(updatedAddr.city);
      setAddressState(updatedAddr.state);
      setAddressPincode(updatedAddr.pincode);
      setAddressType(updatedAddr.type || 'Home');
      setAddressId(updatedAddr.id);

      setDesignation(updated.designation || '');
      setBio(updated.bio || '');
      setLicenseNumber(updated.licenseNumber || '');
      setSpecialization(updated.specialization || '');
      setQualification(updated.qualification || '');
      setExperience(updated.experienceYears !== null && updated.experienceYears !== undefined ? String(updated.experienceYears) : '');
      setConsultationFee(updated.consultationFee !== null && updated.consultationFee !== undefined ? String(updated.consultationFee) : '');

      // Immediately synchronize local auth context
      if (updateUser) {
        updateUser(updated);
      }

      toast("Profile updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast(err?.message || "Failed to update profile. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md pt-4 pb-3 px-4 border-b border-border flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-xs text-muted">Update your personal and clinical details</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-center mt-3">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4">
              <Skeleton className="w-32 h-5 rounded-lg" />
              <Skeleton className="w-full h-11 rounded-xl" />
              <Skeleton className="w-full h-11 rounded-xl" />
              <Skeleton className="w-full h-11 rounded-xl" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 bg-red-50/70 border border-red-200/80 rounded-2xl flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Unable to Load Profile</h3>
            <p className="text-xs text-gray-600">{error}</p>
            <button
              type="button"
              onClick={fetchUserProfile}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Edit Form */}
        {!isLoading && profile && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Avatar Header */}
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="relative">
                <div className={cn("w-24 h-24 rounded-full flex items-center justify-center border-4 border-surface shadow-md overflow-hidden", primaryBgSoft, primaryText)}>
                  <User className="w-12 h-12" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1B5DF1] border border-blue-200 uppercase tracking-wider">
                    {profile.role?.toLowerCase().replace('_', ' ')}
                  </span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                    profile.active !== false 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", profile.active !== false ? "bg-emerald-500" : "bg-red-500")} />
                    {profile.active !== false ? "Active Account" : "Inactive Account"}
                  </span>
                  {profile.department?.name && (
                    <span className="text-xs font-medium text-muted">
                      • {profile.department.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information Card */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1B5DF1]" />
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground/80">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. John Doe" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted" /> Email Address
                  </label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    disabled 
                    className="bg-gray-100 dark:bg-gray-800/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-muted cursor-not-allowed select-none font-medium" 
                  />
                  <span className="text-[10px] text-muted">Managed by hospital administration</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted" /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted" /> Date of Birth
                  </label>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium"
                  />
                </div>

                {/* Structured Address Fields */}
                <div className="flex flex-col gap-3 md:col-span-2 pt-3 border-t border-border/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1B5DF1]" />
                      Clinic / Residential Address
                    </label>
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-border/60">
                      <button
                        type="button"
                        onClick={handleSwitchToHome}
                        className={cn(
                          "px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                          addressType === 'Home' 
                            ? "bg-surface text-[#1B5DF1] shadow-xs font-bold" 
                            : "text-muted hover:text-foreground"
                        )}
                      >
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToClinic}
                        className={cn(
                          "px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                          addressType === 'Clinic' 
                            ? "bg-surface text-[#1B5DF1] shadow-xs font-bold" 
                            : "text-muted hover:text-foreground"
                        )}
                      >
                        Clinic / Work
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[11px] font-semibold text-muted">Street / Building / Plot No.</label>
                      <input 
                        type="text" 
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        placeholder="e.g. Plot No. 42, Health City, Road No. 1" 
                        className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted">City / Town</label>
                      <input 
                        type="text" 
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        placeholder="e.g. Hyderabad / Adoni" 
                        className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted">State</label>
                      <input 
                        type="text" 
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                        placeholder="e.g. Telangana / Andhra Pradesh" 
                        className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted">PIN Code</label>
                      <input 
                        type="text" 
                        value={addressPincode}
                        onChange={(e) => setAddressPincode(e.target.value)}
                        placeholder="e.g. 500034" 
                        maxLength={10}
                        className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium font-mono" 
                      />
                    </div>

                    {/* Clean Human-Readable Address Preview */}
                    {(addressStreet || addressCity || addressState || addressPincode) && (
                      <div className="flex flex-col gap-1 justify-center">
                        <label className="text-[11px] font-semibold text-muted">Formatted Address</label>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-border/80 text-xs text-foreground font-medium truncate">
                          {[addressStreet, addressCity, addressState, addressPincode].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Professional Details */}
            {isDoctor && (
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#1B5DF1]" />
                    Professional & Clinical Details
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted" /> Clinical Designation
                    </label>
                    <input 
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Consultant / Specialist" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-muted" /> Medical License Number
                    </label>
                    <input 
                      type="text" 
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. TSMC-44921 / MCI-88320" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-muted" /> Primary Specialization
                    </label>
                    <input 
                      type="text" 
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. General Medicine, Cardiology" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> Educational Qualification
                    </label>
                    <input 
                      type="text" 
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. MBBS, MD (General Medicine)" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted" /> Clinical Experience (Years)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="70"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 10" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-muted" /> Consultation Fee (₹)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="50"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder="e.g. 500" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> About Doctor / Bio
                    </label>
                    <textarea 
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief description about your clinical practice, expertise, and patient approach..."
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nurse Professional Details */}
            {isNurse && (
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#1B5DF1]" />
                    Nursing Credentials
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted" /> Designation
                    </label>
                    <input 
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Staff Nurse / Senior Nurse" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-muted" /> Nursing License Number
                    </label>
                    <input 
                      type="text" 
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. RN-12345" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-muted" /> Specialization
                    </label>
                    <input 
                      type="text" 
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Home Care, ICU, Pediatric" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> Qualification
                    </label>
                    <input 
                      type="text" 
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. B.Sc Nursing, GNM" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted" /> Experience (Years)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="50"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 5" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> About / Bio
                    </label>
                    <textarea 
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief description about your nursing experience and specialization..."
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Receptionist Professional Details */}
            {isReceptionist && (
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#1B5DF1]" />
                    Front Desk & Professional Details
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted" /> Designation
                    </label>
                    <input 
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Front Office Executive / Senior Receptionist" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> About / Front Desk Notes
                    </label>
                    <textarea 
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief notes about your front desk responsibilities, shift schedule, or administrative focus..."
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hospital & Department Affiliation */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2.5">
                <Building2 className="w-4 h-4 text-[#1B5DF1]" />
                Facility Affiliation
              </h3>
              {profile.hospital ? (
                <>
                  <div className="flex items-center justify-between text-sm py-1">
                    <span className="text-muted font-medium">Hospital</span>
                    <span className="font-bold text-foreground">{profile.hospital.name}</span>
                  </div>
                  {profile.department && (
                    <div className="flex items-center justify-between text-sm py-1 border-t border-border/50">
                      <span className="text-muted font-medium">Assigned Department</span>
                      <span className="font-bold text-[#1B5DF1]">{profile.department.name}</span>
                    </div>
                  )}
                  {profile.hospital.city && (
                    <div className="flex items-center justify-between text-sm py-1 border-t border-border/50">
                      <span className="text-muted font-medium">Location</span>
                      <span className="font-medium text-foreground">{profile.hospital.city}, {profile.hospital.state}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted py-1">No hospital currently associated or not provided.</p>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2 pb-16">
              <button 
                type="submit"
                disabled={isSaving}
                className={cn(
                  "w-full text-white font-bold rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer text-sm", 
                  primaryColor
                )}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

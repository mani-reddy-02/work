import { useState, useRef } from 'react';
import { X, Check, Camera, Sparkles, Upload } from 'lucide-react';
import { profileApi } from '../lib/profileApi';
import { updateGlobalProfile } from '../lib/profile';

// 5 Male and 5 Female high-resolution (512x512) modern 3D healthcare avatars
export const MALE_AVATARS = Array.from({ length: 5 }, (_, i) => `/avatars/male_${i + 1}.png`);
export const FEMALE_AVATARS = Array.from({ length: 5 }, (_, i) => `/avatars/female_${i + 1}.png`);

/**
 * Returns a stable, deterministic avatar path based on gender and name
 */
export function getGenderAvatar(name?: string, gender?: string): string {
  const normGender = (gender || '').trim().toLowerCase();
  const isFemale = normGender === 'female' || normGender === 'f' || normGender === 'woman';
  const isMale = normGender === 'male' || normGender === 'm' || normGender === 'man';

  const cleanName = (name || '').trim();
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const positiveHash = Math.abs(hash);

  if (isFemale) {
    const idx = (positiveHash % 5) + 1;
    return `/avatars/female_${idx}.png`;
  }

  if (isMale) {
    const idx = (positiveHash % 5) + 1;
    return `/avatars/male_${idx}.png`;
  }

  // Fallback if gender is unspecified: deterministically pick male or female
  if (positiveHash % 2 === 0) {
    const idx = (positiveHash % 5) + 1;
    return `/avatars/male_${idx}.png`;
  } else {
    const idx = (positiveHash % 5) + 1;
    return `/avatars/female_${idx}.png`;
  }
}

export interface UserAvatarProps {
  name?: string;
  gender?: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({
  name,
  gender,
  avatar,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Ensure any out-of-bounds legacy avatar paths are cleanly ignored
  const isLegacyInvalid =
    typeof avatar === 'string' &&
    (avatar.startsWith('/avatars/') || avatar.startsWith('avatars/')) &&
    !MALE_AVATARS.includes(avatar) &&
    !FEMALE_AVATARS.includes(avatar);

  // Filter out empty strings, null, legacy invalid paths, or placeholder Unsplash stock images
  const isCustomValid = 
    !imgError &&
    !!avatar && 
    typeof avatar === 'string' && 
    avatar.trim() !== '' && 
    !isLegacyInvalid &&
    !avatar.includes('images.unsplash.com/photo-1599566150163-29194dcaad36');

  // Resolve final avatar: either user's uploaded avatar or deterministic gender avatar
  const avatarSrc = isCustomValid ? avatar : getGenderAvatar(name, gender);

  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  return (
    <img
      src={avatarSrc}
      alt={name || 'Profile Avatar'}
      onError={() => {
        if (isCustomValid) {
          setImgError(true);
        }
      }}
      className={`rounded-full object-cover select-none shrink-0 ${sizeClasses[size]} ${className}`}
    />
  );
}

/**
 * Avatar Picker Modal allowing users to choose an avatar from the gender collection or upload their own
 */
export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  userName,
  userGender,
  onSelectAvatar,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  userName?: string;
  userGender?: string;
  onSelectAvatar?: (url: string) => void;
}) {
  const normGender = (userGender || '').trim().toLowerCase();
  const initialTab = normGender === 'female' || normGender === 'f' ? 'female' : 'male';
  const [activeTab, setActiveTab] = useState<'male' | 'female'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentEffective = currentAvatar || getGenderAvatar(userName, userGender);
  const avatars = activeTab === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  const handleChoose = async (url: string) => {
    setIsSaving(true);
    updateGlobalProfile({ avatar: url });
    await profileApi.updateProfile({ avatar: url });
    setIsSaving(false);
    if (onSelectAvatar) onSelectAvatar(url);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      handleChoose(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Choose Avatar</h3>
              <p className="text-xs text-slate-500">Pick an avatar based on your preference</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gender Toggle Tabs */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('male')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'male'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Male Avatars ({MALE_AVATARS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('female')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'female'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Female Avatars ({FEMALE_AVATARS.length})
            </button>
          </div>
        </div>

        {/* Avatars Grid */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3.5">
            {avatars.map((url, idx) => {
              const isSelected = currentEffective === url;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleChoose(url)}
                  className={`relative aspect-square rounded-2xl p-1 transition-all group hover:scale-105 active:scale-95 cursor-pointer ${isSelected
                      ? 'ring-3 ring-blue-600 bg-blue-50/50 shadow-md'
                      : 'hover:bg-slate-50 border border-slate-100 hover:border-slate-200'
                    }`}
                >
                  <img
                    src={url}
                    alt={`Avatar ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer with Custom Photo Upload */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Upload Photo from Device
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserAvatar;
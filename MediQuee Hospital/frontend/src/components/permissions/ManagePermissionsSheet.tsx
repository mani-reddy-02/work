import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { adminApi } from '../../services/adminApi';

interface ManagePermissionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  roleName: string | null;
  onSuccess: () => void;
}

export function ManagePermissionsSheet({ isOpen, onClose, role, roleName, onSuccess }: ManagePermissionsSheetProps) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && role) {
      fetchPermissions();
    }
  }, [isOpen, role]);

  const fetchPermissions = async () => {
    if (!role) return;
    setIsLoading(true);
    try {
      const data = await adminApi.getPermissions(role);
      setPermissions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setPermissions(prev => prev.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p));
  };

  const handleSave = async () => {
    if (!role) return;
    setIsSaving(true);
    try {
      const payload: Record<string, boolean> = {};
      permissions.forEach(p => { payload[p.key] = p.enabled; });
      await adminApi.updatePermissions(role, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by module
  const grouped = permissions.reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-4 flex flex-col h-full bg-surface max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-foreground">Manage {roleName} Permissions</h2>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          {isLoading ? (
            <div className="flex justify-center p-8 text-muted">Loading...</div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(grouped).map(([moduleName, perms]) => (
                <div key={moduleName} className="flex flex-col gap-3">
                  <h3 className="font-bold text-foreground border-b border-border pb-2">{moduleName}</h3>
                  <div className="flex flex-col gap-2">
                    {(perms as any[]).map((p: any) => (
                      <div key={p.key} onClick={() => handleToggle(p.key)} className="flex items-start justify-between cursor-pointer p-3 rounded-xl border border-border hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="font-semibold text-foreground">{p.name}</span>
                          <span className="text-sm text-muted">{p.description}</span>
                        </div>
                        <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${p.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${p.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold border border-border text-foreground/80 bg-surface hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

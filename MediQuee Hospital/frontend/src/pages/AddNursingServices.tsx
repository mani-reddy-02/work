import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  HeartHandshake, 
  Search, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Clock, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  IndianRupee, 
  MapPin, 
  AlertCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { nurseApi, type HospitalNursingOfferingItem } from "@/services/nurseApi";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

interface ServiceSelectionState {
  selected: boolean;
  price: number;
  duration?: string;
  serviceArea?: string;
}

export function AddNursingServices() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [services, setServices] = useState<HospitalNursingOfferingItem[]>([]);
  const [selections, setSelections] = useState<Record<string, ServiceSelectionState>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Fetch all available nursing services from central catalog with current hospital offering status
  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await nurseApi.getHospitalOfferings();
      setServices(res.services);

      // Initialize selection map from existing hospital offerings
      const initialMap: Record<string, ServiceSelectionState> = {};
      res.services.forEach((s) => {
        initialMap[s.id] = {
          selected: Boolean(s.isOffered),
          price: s.price ?? s.basePrice ?? 0,
          duration: s.customDuration || s.duration || "Per Visit",
          serviceArea: s.serviceArea || "",
        };
      });
      setSelections(initialMap);
    } catch (err: any) {
      console.error("Failed to load nursing services catalog:", err);
      toast(err?.message || "Failed to load services. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [services]);

  // Toggle selection for a service
  const toggleSelect = (serviceId: string) => {
    setSelections((prev) => {
      const current = prev[serviceId] || { selected: false, price: 0 };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          selected: !current.selected,
        },
      };
    });
  };

  // Update custom price for a service
  const updatePrice = (serviceId: string, price: number) => {
    setSelections((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { selected: true, price: 0 }),
        price: isNaN(price) ? 0 : price,
      },
    }));
  };

  // Select all in current filtered view
  const handleSelectAll = () => {
    setSelections((prev) => {
      const next = { ...prev };
      filteredServices.forEach((s) => {
        const curr = next[s.id] || { selected: false, price: s.basePrice };
        next[s.id] = { ...curr, selected: true };
      });
      return next;
    });
  };

  // Deselect all in current filtered view
  const handleDeselectAll = () => {
    setSelections((prev) => {
      const next = { ...prev };
      filteredServices.forEach((s) => {
        const curr = next[s.id] || { selected: false, price: s.basePrice };
        next[s.id] = { ...curr, selected: false };
      });
      return next;
    });
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedCategory !== "ALL" && s.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    });
  }, [services, selectedCategory, searchQuery]);

  const selectedCount = useMemo(() => {
    return Object.values(selections).filter((s) => s.selected).length;
  }, [selections]);

  // Save selection to backend in real-time
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const offeringsToSave = services.map((s) => {
        const state = selections[s.id];
        return {
          serviceId: s.id,
          available: Boolean(state?.selected),
          price: state?.price && state.price > 0 ? state.price : s.basePrice,
          duration: state?.duration || s.duration,
          serviceArea: state?.serviceArea || undefined,
        };
      });

      await nurseApi.saveOfferings({
        offerings: offeringsToSave,
      });

      toast(`Nursing services updated successfully! (${selectedCount} active offerings)`, "success");
      navigate("/profile/nursing-services");
    } catch (err: any) {
      console.error("Failed to save nursing offerings:", err);
      toast(err?.message || "Failed to save nursing services. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/40">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Add Nursing Services
                </h1>
                <p className="text-xs text-muted">
                  Select which admin-verified nursing services your hospital provides
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/30">
              {selectedCount} Selected
            </span>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Services</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full space-y-5">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/70 via-blue-50/40 to-transparent dark:from-teal-950/20 dark:via-blue-950/10 border border-teal-100 dark:border-teal-900/40 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80 leading-relaxed">
            <span className="font-bold text-foreground">Admin-Approved Nursing Catalog: </span>
            Select the services your clinical nursing staff can deliver at patients&apos; homes. You can also customize your hospital&apos;s offering price for each service. All changes sync in real-time.
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search services by name, category, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-gray-50/80 dark:bg-gray-800/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-surface border border-border text-muted hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Loading / Empty / List */}
        {isLoading ? (
          <div className="p-16 text-center bg-surface rounded-2xl border border-border">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Loading services catalog...</h3>
            <p className="text-xs text-muted mt-1">Connecting to live Supabase database</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-16 text-center bg-surface rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 text-muted">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No nursing services match</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No services match "${searchQuery}". Try a different keyword.`
                : "No services found in this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const state = selections[service.id] || {
                selected: false,
                price: service.basePrice,
              };
              const isSelected = state.selected;

              return (
                <div
                  key={service.id}
                  onClick={() => toggleSelect(service.id)}
                  className={cn(
                    "group relative rounded-2xl p-5 border transition-all cursor-pointer select-none flex flex-col justify-between",
                    isSelected
                      ? "bg-teal-50/20 dark:bg-teal-950/15 border-teal-500 shadow-sm ring-2 ring-teal-500/20"
                      : "bg-surface border-border hover:border-gray-300 dark:hover:border-gray-700 shadow-2xs hover:shadow-sm"
                  )}
                >
                  <div>
                    {/* Top Row: Icon, Titles & Checkbox */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-teal-100/70 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700"
                              : "bg-gray-50 dark:bg-gray-800 text-muted border-border"
                          )}
                        >
                          <HeartHandshake className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm leading-snug">
                              {service.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-800 text-muted px-1.5 py-0.5 rounded border border-border">
                              {service.code}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-muted block mt-0.5">
                            {service.category || "General Care"}
                          </span>
                        </div>
                      </div>

                      {/* Custom Checkbox */}
                      <div
                        className={cn(
                          "w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0",
                          isSelected
                            ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                            : "border-gray-300 dark:border-gray-600 bg-surface group-hover:border-gray-400"
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted mt-3 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Pricing and Details Configuration */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-3 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2 text-muted">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{service.duration || "12 / 24 Hours"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted">Hospital Rate:</span>
                      <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-border rounded-lg px-2 py-1 focus-within:ring-1 focus-within:ring-teal-500">
                        <span className="text-xs text-muted mr-1 font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={state.price}
                          onChange={(e) => updatePrice(service.id, parseFloat(e.target.value))}
                          className="w-16 bg-transparent text-xs font-bold text-foreground focus:outline-none"
                        />
                      </div>
                      <span className="text-[10px] text-muted">
                        (Base ₹{service.basePrice})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-lg py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-bold text-foreground">
              {selectedCount} {selectedCount === 1 ? "service" : "services"} selected
            </span>
            <span className="text-xs text-muted hidden sm:inline">
              will be offered by your hospital
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Selections...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Nursing Services</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddNursingServices;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  HeartHandshake, 
  Search, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Building2, 
  ShieldCheck, 
  Info,
  Clock,
  Sparkles,
  ArrowLeft,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { nurseApi, type HospitalNursingOfferingItem } from "@/services/nurseApi";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

export function HomeNursingServices() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [services, setServices] = useState<HospitalNursingOfferingItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [offeredCount, setOfferedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"ALL" | "OFFERED" | "NOT_OFFERED">("ALL");
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);

  // Fetch hospital nursing offerings
  const fetchOfferings = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);

      const res = await nurseApi.getHospitalOfferings();
      setServices(res.services);
      setTotalCount(res.totalCount);
      setOfferedCount(res.offeredCount);
    } catch (err: any) {
      console.error("Failed to load nursing offerings:", err);
      toast(err?.message || "Failed to load nursing services. Please try again.", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  // Handle Select / Deselect Toggle
  const handleToggleOffering = async (service: HospitalNursingOfferingItem) => {
    const nextState = !service.isOffered;
    setTogglingServiceId(service.id);

    // Optimistic UI update
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, isOffered: nextState } : s))
    );
    setOfferedCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await nurseApi.toggleOffering({
        serviceId: service.id,
        available: nextState,
      });

      if (nextState) {
        toast(`"${service.name}" is now offered by your hospital.`, "success");
      } else {
        toast(
          `"${service.name}" deselected. Existing patient bookings remain safe.`,
          "info"
        );
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isOffered: !nextState } : s))
      );
      setOfferedCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
      toast(err?.message || "Failed to update offering status.", "error");
    } finally {
      setTogglingServiceId(null);
    }
  };

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Filter mode check
      if (filterMode === "OFFERED" && !s.isOffered) return false;
      if (filterMode === "NOT_OFFERED" && s.isOffered) return false;

      // Search query check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q))
      );
    });
  }, [services, filterMode, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Home Nursing Services
                </h1>
                <p className="text-xs text-muted">
                  Select and manage nursing service offerings provided by your hospital
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchOfferings(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-muted hover:text-foreground hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Available Central Catalogue
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-foreground">
                {isLoading ? "..." : totalCount}
              </span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                Admin Managed
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Verified nursing services defined centrally by MediQuee
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Services Offered by Your Hospital
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-600">
                {isLoading ? "..." : offeredCount}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Active Offerings
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Patients in your area can discover and book these services
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Historical Integrity
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Protected Records
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Deselecting an offering preserves past visits and completed payouts without breaking data
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search services by name, description, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-gray-50/70 border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterMode("ALL")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                filterMode === "ALL"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface border border-border text-muted hover:text-foreground hover:bg-gray-50"
              )}
            >
              All Services ({services.length})
            </button>
            <button
              onClick={() => setFilterMode("OFFERED")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                filterMode === "OFFERED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-surface border border-border text-muted hover:text-foreground hover:bg-gray-50"
              )}
            >
              Offered ({offeredCount})
            </button>
            <button
              onClick={() => setFilterMode("NOT_OFFERED")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                filterMode === "NOT_OFFERED"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-surface border border-border text-muted hover:text-foreground hover:bg-gray-50"
              )}
            >
              Not Offered ({Math.max(0, services.length - offeredCount)})
            </button>
          </div>
        </div>

        {/* Services List / Cards */}
        {isLoading ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Loading nursing services...</h3>
            <p className="text-xs text-muted mt-1">
              Synchronizing central catalogue with hospital offerings
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-16 text-center bg-surface rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-muted">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No services found</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No nursing services match "${searchQuery}". Try a different keyword.`
                : "No nursing services match the selected filter."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const isToggling = togglingServiceId === service.id;

              return (
                <div
                  key={service.id}
                  className={cn(
                    "bg-surface rounded-2xl p-5 border transition-all flex flex-col justify-between",
                    service.isOffered
                      ? "border-emerald-300 dark:border-emerald-800 shadow-sm ring-1 ring-emerald-500/10"
                      : "border-border shadow-2xs hover:border-gray-300"
                  )}
                >
                  <div>
                    {/* Card Top: Icon, Title, Status & Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {service.iconUrl ? (
                            <img
                              src={service.iconUrl}
                              alt={service.name}
                              className="w-7 h-7 object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <HeartHandshake className="w-6 h-6 text-primary" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm">
                              {service.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold bg-gray-100 text-muted px-1.5 py-0.5 rounded border border-border">
                              {service.code}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-muted block mt-0.5">
                            {service.category || "Home Nursing"}
                          </span>
                        </div>
                      </div>

                      {/* Selection Toggle Control */}
                      <div className="flex flex-col items-end">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={service.isOffered}
                            disabled={isToggling}
                            onChange={() => handleToggleOffering(service)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <span
                          className={cn(
                            "text-[10px] font-bold mt-1 uppercase tracking-wider",
                            service.isOffered ? "text-emerald-600" : "text-muted"
                          )}
                        >
                          {service.isOffered ? "Offered" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted mt-3 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{service.customDuration || service.duration || "Per Visit"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted">Base Rate:</span>
                      <span className="font-bold text-foreground">
                        ₹{(service.price || service.basePrice || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeNursingServices;

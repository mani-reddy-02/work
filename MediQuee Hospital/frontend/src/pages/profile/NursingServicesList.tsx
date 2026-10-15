import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  HeartHandshake, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { nurseApi, type HospitalNursingOfferingItem } from "@/services/nurseApi";
import { useToast } from "@/context/ToastContext";
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export function NursingServicesList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allServices, setAllServices] = useState<HospitalNursingOfferingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [serviceToDelete, setServiceToDelete] = useState<HospitalNursingOfferingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch offerings from backend in real-time
  const fetchServices = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);

      const res = await nurseApi.getHospitalOfferings();
      setAllServices(res.services);
    } catch (err: any) {
      console.error("Failed to fetch hospital nursing services:", err);
      toast(err?.message || "Failed to load offered services. Please try again.", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filter only those services that the hospital has actually added / is offering
  const offeredServices = useMemo(() => {
    return allServices.filter((s) => s.isOffered);
  }, [allServices]);

  // Filter based on search query
  const filteredOffered = useMemo(() => {
    if (!searchQuery.trim()) return offeredServices;
    const q = searchQuery.toLowerCase().trim();
    return offeredServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [offeredServices, searchQuery]);

  // Real-time Delete offering handler
  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      setIsDeleting(true);
      await nurseApi.deleteOffering(serviceToDelete.id);

      // Real-time local state update
      setAllServices((prev) =>
        prev.map((s) => (s.id === serviceToDelete.id ? { ...s, isOffered: false } : s))
      );

      toast(`"${serviceToDelete.name}" removed from hospital nursing offerings.`, "success");
      setServiceToDelete(null);
    } catch (err: any) {
      console.error("Failed to remove nursing offering:", err);
      toast(err?.message || "Failed to remove offering. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics calculation
  const stats = useMemo(() => {
    const count = offeredServices.length;
    const avgPrice = count > 0 
      ? Math.round(offeredServices.reduce((sum, s) => sum + (s.price || s.basePrice || 0), 0) / count)
      : 0;
    const categoriesCount = new Set(offeredServices.map((s) => s.category).filter(Boolean)).size;
    return { count, avgPrice, categoriesCount };
  }, [offeredServices]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="p-2 -ml-2 text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/40">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground tracking-tight">
                    Nursing Services
                  </h1>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200">
                    {stats.count} Active
                  </span>
                </div>
                <p className="text-xs text-muted">
                  View and manage nursing services provided by your hospital
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchServices(true)}
              disabled={isRefreshing}
              className="p-2 text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Refresh Real-time Data"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-teal-600")} />
            </button>

            <button
              onClick={() => navigate("/add-nursing-services")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Services</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Offered Services
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {isLoading ? "..." : stats.count}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md">
                Live on MediQuee
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Services discoverable and bookable by patients
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Avg. Offering Rate
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {isLoading ? "..." : `₹${stats.avgPrice.toLocaleString("en-IN")}`}
              </span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 px-2 py-0.5 rounded-md">
                Hospital Pricing
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Average pricing across active nursing offerings
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Categories Covered
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {isLoading ? "..." : stats.categoriesCount}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-2 py-0.5 rounded-md">
                Clinical Care
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Spans General, Elderly, Post-Op, and ICU care
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {offeredServices.length > 0 && (
          <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search your offered nursing services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-gray-50/80 dark:bg-gray-800/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
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

            <button
              onClick={() => navigate("/add-nursing-services")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-xs font-semibold text-foreground border border-border rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Services</span>
            </button>
          </div>
        )}

        {/* Content State */}
        {isLoading ? (
          <div className="p-16 text-center bg-surface rounded-2xl border border-border">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Loading nursing services...</h3>
            <p className="text-xs text-muted mt-1">Fetching live offerings from database</p>
          </div>
        ) : offeredServices.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/30 flex items-center justify-center mx-auto mb-4 text-teal-600">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Nursing Services Added Yet</h3>
            <p className="text-sm text-muted max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              Your hospital hasn&apos;t added any home nursing services yet. Select from the admin-verified catalog to begin accepting patient home nursing requests.
            </p>
            <button
              onClick={() => navigate("/add-nursing-services")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Nursing Services</span>
            </button>
          </div>
        ) : filteredOffered.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center">
            <AlertCircle className="w-8 h-8 text-muted mx-auto mb-2" />
            <h3 className="text-base font-bold text-foreground">No matching services</h3>
            <p className="text-xs text-muted mt-1">
              No offered nursing services match &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-foreground rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffered.map((service) => (
              <div
                key={service.id}
                className="bg-surface rounded-2xl p-5 border border-border shadow-2xs hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon, Title & Delete Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 flex items-center justify-center shrink-0 text-teal-600 dark:text-teal-400">
                        <HeartHandshake className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm">
                            {service.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-800 text-muted px-1.5 py-0.5 rounded border border-border">
                            {service.code}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-muted block mt-0.5">
                          {service.category || "Home Care"}
                        </span>
                      </div>
                    </div>

                    {/* Delete / Remove Action */}
                    <button
                      onClick={() => setServiceToDelete(service)}
                      className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                      title={`Delete "${service.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted mt-3 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Card Footer: Live Status, Duration & Rate */}
                <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Offering
                    </span>
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted" />
                      {service.customDuration || service.duration || "Per Visit"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-right">
                    <span className="text-[11px] text-muted">Hospital Rate:</span>
                    <span className="font-bold text-foreground text-sm">
                      ₹{(service.price || service.basePrice || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Bottom Sheet for Deletion */}
      {serviceToDelete && (
        <ConfirmationSheet
          isOpen={Boolean(serviceToDelete)}
          onClose={() => setServiceToDelete(null)}
          title={`Remove "${serviceToDelete.name}"?`}
          description="Are you sure you want to remove this nursing service from your hospital offerings? Patients in your area will no longer be able to book new visits for it. Past completed records remain intact."
          confirmLabel={isDeleting ? "Removing..." : "Delete Service"}
          cancelLabel="Keep Service"
          isDestructive={true}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

export default NursingServicesList;

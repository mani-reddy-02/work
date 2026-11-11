import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { VerificationPendingShield } from "../verification/VerificationPendingShield";

export function VerifiedFacilityRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Super admins or users without hospital affiliation bypass
  if (!user?.hospital) {
    return <Outlet />;
  }

  const vStatus = user.hospital.verificationStatus;
  const isApproved = vStatus === 'APPROVED' || vStatus === 'VERIFIED';

  if (!isApproved) {
    return <VerificationPendingShield />;
  }

  return <Outlet />;
}


import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingFormValues } from "./onboarding/schema";
import { OnboardingLayout } from "./onboarding/OnboardingLayout";
import { SuccessScreen } from "./onboarding/SuccessScreen";
import { authApi } from "@/services/authApi";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

// Shared Steps
import { Step1Account } from "./onboarding/steps/shared/Step1Account";
import { Step2BusinessType } from "./onboarding/steps/shared/Step2BusinessType";
import { Step4Location } from "./onboarding/steps/shared/Step4Location";
import { StepAdmin } from "./onboarding/steps/shared/StepAdmin";
import { StepReview } from "./onboarding/steps/shared/StepReview";

// Hospital Steps
import { Step3Hospital } from "./onboarding/steps/hospital/Step3Hospital";
import { Step5HospitalServices } from "./onboarding/steps/hospital/Step5HospitalServices";
import { Step6Departments } from "./onboarding/steps/hospital/Step6Departments";
import { Step7Verification } from "./onboarding/steps/hospital/Step7Verification";

// Laboratory Steps
import { Step3Laboratory } from "./onboarding/steps/laboratory/Step3Laboratory";
import { Step5LabServices } from "./onboarding/steps/laboratory/Step5LabServices";
import { Step6LabDepartments } from "./onboarding/steps/laboratory/Step6LabDepartments";
import { Step7LabTests } from "./onboarding/steps/laboratory/Step7LabTests";
import { Step8Verification } from "./onboarding/steps/laboratory/Step8Verification";

const DRAFT_KEY = "mediquee_onboarding_draft";

const getInitialValues = () => {
  const saved = localStorage.getItem(DRAFT_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return {};
    }
  }
  return {};
};

export function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Initialize form with local storage draft if available
  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: getInitialValues()
  });

  const { watch, trigger, getValues, setValue } = methods;
  const businessType = watch("businessType.businessType");
  const phoneValue = watch("account.phone");

  // Step 1 WhatsApp OTP State
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [otpNotice, setOtpNotice] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // OTP Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  // If user modifies phone number after sending/verifying, reset verification state
  useEffect(() => {
    const cleanCurrent = (phoneValue || "").replace(/\D/g, "");
    if (verifiedPhone && cleanCurrent !== verifiedPhone) {
      setIsPhoneVerified(false);
      setIsOtpSent(false);
      setVerifiedPhone("");
      setValue("account.otp", "");
    }
  }, [phoneValue, verifiedPhone, setValue]);

  // Handle Send WhatsApp OTP
  const handleSendOtp = async (): Promise<boolean> => {
    setOtpError("");
    setOtpNotice("");

    // Validate account fields first
    const isStep1Valid = await trigger([
      "account.name",
      "account.email",
      "account.phone",
      "account.password",
      "account.confirmPassword"
    ]);
    if (!isStep1Valid) return false;

    const currentPhone = getValues("account.phone");
    const cleanPhone = (currentPhone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast("Please enter a valid 10-digit mobile number", "error");
      return false;
    }

    setIsSendingOtp(true);
    const res = await authApi.sendWhatsAppOtp(cleanPhone);
    setIsSendingOtp(false);

    if (res.success) {
      setIsOtpSent(true);
      setOtpTimer(60);
      setOtpNotice(res.message || "OTP sent successfully to your WhatsApp number!");
      toast("WhatsApp OTP sent successfully!", "success");
      setTimeout(() => {
        const el = document.getElementById("whatsapp-otp-input");
        if (el) el.focus();
      }, 100);
      return true;
    } else {
      setOtpError(res.error || "Failed to send WhatsApp OTP. Please verify your phone number.");
      toast(res.error || "Failed to send WhatsApp OTP", "error");
      return false;
    }
  };

  // Handle Verify WhatsApp OTP
  const handleVerifyOtp = async (codeToVerify?: string): Promise<boolean> => {
    const code = (codeToVerify !== undefined ? codeToVerify : otpCode).trim();
    setOtpError("");
    const currentPhone = getValues("account.phone");
    const cleanPhone = (currentPhone || "").replace(/\D/g, "");

    if (!code || code.length < 4) {
      setOtpError("Please enter the 6-digit WhatsApp OTP");
      return false;
    }

    setIsVerifyingOtp(true);
    const res = await authApi.verifyWhatsAppOtp(cleanPhone, code);
    setIsVerifyingOtp(false);

    if (res.success) {
      setIsPhoneVerified(true);
      setVerifiedPhone(cleanPhone);
      setValue("account.otp", code);
      setOtpError("");
      setOtpNotice("WhatsApp verified successfully!");
      toast("Mobile number verified via WhatsApp!", "success");

      // Auto-advance to Step 2
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    } else {
      setOtpError(res.error || "Invalid or expired OTP. Please verify and try again.");
      toast(res.error || "Invalid or expired OTP", "error");
      return false;
    }
  };

  // Handle Changing Phone Number
  const handleChangePhone = () => {
    setIsOtpSent(false);
    setIsPhoneVerified(false);
    setOtpCode("");
    setOtpError("");
    setOtpNotice("");
    setVerifiedPhone("");
    setValue("account.otp", "");
  };

  // Save draft on change (excluding files which can't be easily serialized)
  useEffect(() => {
    const subscription = watch((value: any) => {
      // Create a copy without file objects to save to localStorage
      const draftToSave = { ...value };
      delete draftToSave.hospitalVerification;
      delete draftToSave.labVerification;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));
    }) as any;
    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, [watch]);

  // Determine flow configuration
  const isHospital = businessType === "hospital";
  
  // Hospital: 6 steps total (Account, BusinessType, HospitalInfo, Location, Verification, Review)
  // Lab: 10 steps total
  const totalSteps = businessType ? (isHospital ? 6 : 10) : 2; 

  const handleNext = async () => {
    // Step 1: Enforce WhatsApp OTP verification before advancing to Step 2
    if (currentStep === 1) {
      const isStep1Valid = await trigger([
        "account.name",
        "account.email",
        "account.phone",
        "account.password",
        "account.confirmPassword",
      ]);
      if (!isStep1Valid) return;

      // If already verified, advance to Step 2
      if (isPhoneVerified) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // If OTP has not been sent yet, trigger WhatsApp OTP dispatch
      if (!isOtpSent) {
        await handleSendOtp();
        return;
      }

      // If OTP has been sent, verify OTP before advancing
      const verified = await handleVerifyOtp();
      if (verified) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    let fieldsToValidate: string[] = [];

    // Map step to required validation fields
    if (currentStep === 2) fieldsToValidate = ["businessType"];
    else if (currentStep === 3) fieldsToValidate = [isHospital ? "hospitalInfo" : "labInfo"];
    else if (currentStep === 4) fieldsToValidate = [isHospital ? "hospitalLocation" : "labLocation"];
    else if (isHospital) {
      if (currentStep === 5) fieldsToValidate = ["hospitalVerification"];
    } else {
      if (currentStep === 5) fieldsToValidate = ["labServices"];
      else if (currentStep === 6) fieldsToValidate = ["labDepartments"];
      else if (currentStep === 7) fieldsToValidate = ["labTests"];
      else if (currentStep === 8) fieldsToValidate = ["labVerification"];
      else if (currentStep === 9) fieldsToValidate = ["labAdmin"];
    }

    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Final Submission
        onSubmit(getValues());
      }
    }
  };

  const handleBack = () => {
    // If in OTP verification view on Step 1, go back to editing account fields
    if (currentStep === 1 && isOtpSent && !isPhoneVerified) {
      setIsOtpSent(false);
      setOtpCode("");
      setOtpError("");
      setOtpNotice("");
      return;
    }

    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToStep = (stepName: string) => {
    const mapHospital: Record<string, number> = { account: 1, info: 3, location: 4, verification: 5 };
    const mapLab: Record<string, number> = { account: 1, info: 3, location: 4, services: 5, departments: 6, tests: 7, verification: 8, admin: 9 };
    const target = isHospital ? mapHospital[stepName] : mapLab[stepName];
    if (target) {
      setCurrentStep(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      const response = await authApi.register(data);
      // Clear draft only once the backend has accepted the registration.
      localStorage.removeItem(DRAFT_KEY);

      // Auto-login and redirect to dashboard
      login(response.token, response.role);
      
      if (response.role === 'lab') navigate("/lab");
      else if (response.role === 'doctor') navigate("/doctor");
      else if (response.role === 'nurse') navigate("/nurse");
      else if (response.role === 'receptionist') navigate("/receptionist");
      else navigate("/dashboard");
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to submit registration', 'error');
    }
  };

  // We are keeping isSuccess logic for safety, but the user is immediately redirected above.
  if (isSuccess) {
    return <SuccessScreen businessType={businessType as "hospital" | "laboratory"} />;
  }

  // Render appropriate step
  const renderStep = () => {
    // Shared Steps
    if (currentStep === 1) {
      return (
        <Step1Account 
          isOtpSent={isOtpSent}
          isPhoneVerified={isPhoneVerified}
          isSendingOtp={isSendingOtp}
          isVerifyingOtp={isVerifyingOtp}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          otpTimer={otpTimer}
          otpError={otpError}
          otpNotice={otpNotice}
          onSendOtp={handleSendOtp}
          onVerifyOtp={handleVerifyOtp}
          onChangePhone={handleChangePhone}
        />
      );
    }
    if (currentStep === 2) return <Step2BusinessType />;
    
    if (isHospital) {
      // Hospital Flow (Simplified 6 steps)
      if (currentStep === 3) return <Step3Hospital />;
      if (currentStep === 4) return <Step4Location />;
      if (currentStep === 5) return <Step7Verification />;
      if (currentStep === 6) return <StepReview onEditStep={jumpToStep} />;
    } else {
      // Laboratory Flow
      if (currentStep === 3) return <Step3Laboratory />;
      if (currentStep === 4) return <Step4Location />;
      if (currentStep === 5) return <Step5LabServices />;
      if (currentStep === 6) return <Step6LabDepartments />;
      if (currentStep === 7) return <Step7LabTests />;
      if (currentStep === 8) return <Step8Verification />;
      if (currentStep === 9) return <StepAdmin />;
      if (currentStep === 10) return <StepReview onEditStep={jumpToStep} />;
    }

    return null;
  };

  const isFinalStep = currentStep === totalSteps;
  const isNextDisabled = (currentStep === 2 && !businessType) || (currentStep === 1 && (isSendingOtp || isVerifyingOtp));

  const getNextLabel = () => {
    if (isFinalStep) return "Complete Registration";
    if (currentStep === 1) {
      if (isSendingOtp) return "Sending WhatsApp OTP...";
      if (isVerifyingOtp) return "Verifying OTP...";
      if (isOtpSent && !isPhoneVerified) return "Verify & Continue";
      return "Continue";
    }
    return "Continue";
  };

  return (
    <FormProvider {...methods}>
      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        isNextDisabled={isNextDisabled}
        showBack={currentStep > 1 || (currentStep === 1 && isOtpSent && !isPhoneVerified)}
      >
        {renderStep()}
      </OnboardingLayout>
    </FormProvider>
  );
}

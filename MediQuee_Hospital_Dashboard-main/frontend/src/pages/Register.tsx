import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingFormValues } from "./onboarding/schema";
import { OnboardingLayout } from "./onboarding/OnboardingLayout";
import { SuccessScreen } from "./onboarding/SuccessScreen";

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
import { Step6Verification } from "./onboarding/steps/laboratory/Step6Verification";

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

  // Initialize form with local storage draft if available
  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: getInitialValues()
  });

  const { watch, trigger, getValues } = methods;
  const businessType = watch("businessType.businessType");

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
  
  // Hospital: 9 steps total
  // Lab: 8 steps total
  const totalSteps = businessType ? (isHospital ? 9 : 8) : 2; 

  const handleNext = async () => {
    let fieldsToValidate: string[] = [];

    // Map step to required validation fields
    if (currentStep === 1) fieldsToValidate = ["account"];
    else if (currentStep === 2) fieldsToValidate = ["businessType"];
    else if (currentStep === 3) fieldsToValidate = [isHospital ? "hospitalInfo" : "labInfo"];
    else if (currentStep === 4) fieldsToValidate = [isHospital ? "hospitalLocation" : "labLocation"];
    else if (currentStep === 5) fieldsToValidate = [isHospital ? "hospitalServices" : "labServices"];
    else if (isHospital && currentStep === 6) fieldsToValidate = ["hospitalDepartments"];
    else if (isHospital && currentStep === 7) fieldsToValidate = ["hospitalVerification"];
    else if (!isHospital && currentStep === 6) fieldsToValidate = ["labVerification"];
    else if (isHospital && currentStep === 8) fieldsToValidate = ["hospitalAdmin"];
    else if (!isHospital && currentStep === 7) fieldsToValidate = ["labAdmin"];

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
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToStep = (stepName: string) => {
    const mapHospital: Record<string, number> = { account: 1, info: 3, location: 4, services: 5, departments: 6, verification: 7, admin: 8 };
    const mapLab: Record<string, number> = { account: 1, info: 3, location: 4, services: 5, verification: 6, admin: 7 };
    const target = isHospital ? mapHospital[stepName] : mapLab[stepName];
    if (target) {
      setCurrentStep(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    console.log("Form Submitted:", data);
    // Clear draft
    localStorage.removeItem(DRAFT_KEY);
    
    // Registration submitted. User must await admin verification before login.
    setIsSuccess(true);
  };

  if (isSuccess) {
    return <SuccessScreen businessType={businessType as "hospital" | "laboratory"} />;
  }

  // Render appropriate step
  const renderStep = () => {
    // Shared Steps
    if (currentStep === 1) return <Step1Account />;
    if (currentStep === 2) return <Step2BusinessType />;
    
    if (isHospital) {
      // Hospital Flow
      if (currentStep === 3) return <Step3Hospital />;
      if (currentStep === 4) return <Step4Location />;
      if (currentStep === 5) return <Step5HospitalServices />;
      if (currentStep === 6) return <Step6Departments />;
      if (currentStep === 7) return <Step7Verification />;
      if (currentStep === 8) return <StepAdmin />;
      if (currentStep === 9) return <StepReview onEditStep={jumpToStep} />;
    } else {
      // Laboratory Flow
      if (currentStep === 3) return <Step3Laboratory />;
      if (currentStep === 4) return <Step4Location />;
      if (currentStep === 5) return <Step5LabServices />;
      if (currentStep === 6) return <Step6Verification />;
      if (currentStep === 7) return <StepAdmin />;
      if (currentStep === 8) return <StepReview onEditStep={jumpToStep} />;
    }

    return null;
  };

  const isFinalStep = currentStep === totalSteps;
  const isNextDisabled = currentStep === 2 && !businessType;

  return (
    <FormProvider {...methods}>
      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={isFinalStep ? "Complete Registration" : "Continue"}
        isNextDisabled={isNextDisabled}
        showBack={currentStep > 1}
      >
        {renderStep()}
      </OnboardingLayout>
    </FormProvider>
  );
}

import { useFormContext } from "react-hook-form";
import { DocumentUploadCard } from "../../../../components/ui/DocumentUploadCard";
import type { OnboardingFormValues } from "../../schema";

export function Step6Verification() {
  const { watch, setValue, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const files = watch("labVerification");
  const entityErrors = errors.labVerification;

  const handleFileChange = (field: keyof NonNullable<OnboardingFormValues["labVerification"]>, file: File | null) => {
    setValue(`labVerification.${field}`, file, { shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Verify your laboratory</h2>
        <p className="text-[14px] text-[#667085]">Upload applicable registration and certification documents to help us verify your laboratory.</p>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-[12px] font-black text-gray-400 tracking-widest uppercase ml-1">Required Documents</h3>
        
        <DocumentUploadCard
          id="registrationCertificate"
          title="Laboratory Registration Certificate"
          description="Official document proving laboratory registration."
          requirement="REQUIRED"
          value={files?.registrationCertificate}
          onChange={(file) => handleFileChange('registrationCertificate', file)}
          error={entityErrors?.registrationCertificate?.message as string}
        />

        <DocumentUploadCard
          id="clinicalEstablishment"
          title="Applicable Healthcare Registration"
          description="Registration document applicable to the laboratory or healthcare establishment."
          requirement="REQUIRED"
          value={files?.clinicalEstablishment}
          onChange={(file) => handleFileChange('clinicalEstablishment', file)}
          error={entityErrors?.clinicalEstablishment?.message as string}
        />
      </div>

      <hr className="border-gray-100" />

      <div className="flex flex-col gap-4">
        <h3 className="text-[12px] font-black text-gray-400 tracking-widest uppercase ml-1">Optional / If Applicable</h3>
        
        <DocumentUploadCard
          id="nabl"
          title="NABL Accreditation Certificate"
          description="National Accreditation Board for Testing and Calibration Laboratories."
          requirement="OPTIONAL"
          value={files?.nabl}
          onChange={(file) => handleFileChange('nabl', file)}
        />

        <DocumentUploadCard
          id="nabh"
          title="NABH Accreditation"
          description="National Accreditation Board for Hospitals & Healthcare Providers."
          requirement="OPTIONAL"
          value={files?.nabh}
          onChange={(file) => handleFileChange('nabh', file)}
        />

        <DocumentUploadCard
          id="bioWaste"
          title="Biomedical Waste Authorization"
          description="Authorization for handling biomedical waste."
          requirement="IF APPLICABLE"
          value={files?.bioWaste}
          onChange={(file) => handleFileChange('bioWaste', file)}
        />

        <DocumentUploadCard
          id="stateLicense"
          title="State Laboratory License"
          description="Required by certain state health departments."
          requirement="IF APPLICABLE"
          value={files?.stateLicense}
          onChange={(file) => handleFileChange('stateLicense', file)}
        />

        <DocumentUploadCard
          id="pharmacyLicense"
          title="Pharmacy License"
          description="If dispensing medications or specific supplies."
          requirement="IF APPLICABLE"
          value={files?.pharmacyLicense}
          onChange={(file) => handleFileChange('pharmacyLicense', file)}
        />

        <DocumentUploadCard
          id="gst"
          title="GST Registration Certificate"
          description="Goods and Services Tax registration."
          requirement="OPTIONAL"
          value={files?.gst}
          onChange={(file) => handleFileChange('gst', file)}
        />

        <DocumentUploadCard
          id="pan"
          title="PAN / Business Tax Document"
          description="Permanent Account Number or relevant tax document."
          requirement="OPTIONAL"
          value={files?.pan}
          onChange={(file) => handleFileChange('pan', file)}
        />

        <DocumentUploadCard
          id="otherCertifications"
          title="Other Accreditation / Certification"
          description="Any other relevant diagnostic certifications."
          requirement="OPTIONAL"
          value={files?.otherCertifications}
          onChange={(file) => handleFileChange('otherCertifications', file)}
        />
      </div>

      <p className="text-[12px] text-gray-500 text-center px-4 mt-2 mb-4">
        Your documents are used only for laboratory verification and account setup.
      </p>
    </div>
  );
}

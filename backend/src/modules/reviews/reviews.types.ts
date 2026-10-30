export type ReviewTargetType = 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';

export type ReviewBookingType = 
  | 'OP_BOOKING' 
  | 'VIDEO_CONSULTATION' 
  | 'LAB_BOOKING' 
  | 'HOME_SAMPLE' 
  | 'HOME_NURSING';

export type ReviewStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'FLAGGED' 
  | 'UNDER_REVIEW' 
  | 'REMOVED';

export type ResponseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface DoctorRatingDimensions {
  medicalCommunication: number;
  professionalBehaviour: number;
  consultationExperience: number;
  timeAndPunctuality: number;
  overallDoctorExperience: number;
}

export interface HospitalRatingDimensions {
  staffBehaviour: number;
  cleanlinessAndEnvironment: number;
  waitingTimeAndCoordination: number;
  facilitiesAndAccessibility: number;
  overallHospitalExperience: number;
}

export interface LaboratoryRatingDimensions {
  sampleCollectionExperience: number;
  staffBehaviour: number;
  servicePunctuality: number;
  reportDeliveryExperience: number;
  overallLaboratoryExperience: number;
}

export type CategoryRatings = 
  | DoctorRatingDimensions 
  | HospitalRatingDimensions 
  | LaboratoryRatingDimensions 
  | Record<string, number>;

export interface SubmitReviewDto {
  bookingId: string;
  bookingType: ReviewBookingType;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number; // 1 to 5
  categoryRatings: Record<string, number>;
  title?: string;
  comment?: string;
  serviceSpecificFeedback?: Record<string, any>;
  isAnonymous?: boolean;
  guidelinesAcknowledged?: boolean;
}

export interface EditReviewDto {
  rating?: number;
  categoryRatings?: Record<string, number>;
  title?: string;
  comment?: string;
  serviceSpecificFeedback?: Record<string, any>;
  isAnonymous?: boolean;
}

export interface ReviewResponseDto {
  response: string;
}

export interface ReviewReportDto {
  reason: string;
  details?: string;
}

export interface AdminModerationDto {
  action: 'APPROVE' | 'REJECT' | 'FLAG' | 'REMOVE';
  reason?: string;
}

export interface AdminResponseModerationDto {
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

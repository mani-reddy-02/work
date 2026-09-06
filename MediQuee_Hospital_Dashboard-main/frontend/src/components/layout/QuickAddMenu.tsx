import { Building2, UserPlus, FlaskConical, Stethoscope, UserCog, ChevronRight, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { BottomSheet } from "../ui/BottomSheet"
import { useAuth } from "@/context/AuthContext"

type QuickAddMenuProps = {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddMenu({ isOpen, onClose }: QuickAddMenuProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => {
      navigate(path);
    }, 150); // wait for bottom sheet animation
  }

  const { role } = useAuth();

  let options: any[] = [];

  if (role === 'admin') {
    options = [
      {
        title: "Add Department",
        description: "Create new department in your hospital",
        icon: Building2,
        path: "/add-department",
        color: "text-blue-600 bg-blue-50 border-blue-100"
      },
      {
        title: "Add Doctor",
        description: "Add doctor with specialization & availability",
        icon: UserPlus,
        path: "/add-doctor",
        color: "text-emerald-600 bg-emerald-50 border-emerald-100"
      },
      {
        title: "Add Lab",
        description: "Add laboratory and its services",
        icon: FlaskConical,
        path: "/add-lab",
        color: "text-purple-600 bg-purple-50 border-purple-100"
      },
      {
        title: "Add Nurse",
        description: "Add nurse for home nursing & assignments",
        icon: Stethoscope,
        path: "/add-nurse",
        color: "text-orange-600 bg-orange-50 border-orange-100"
      },
      {
        title: "Add Receptionist",
        description: "Add receptionist and front office staff",
        icon: UserCog,
        path: "/add-receptionist",
        color: "text-pink-600 bg-pink-50 border-pink-100"
      }
    ];
  } else if (role === 'receptionist') {
    options = [
      {
        title: "Register Patient",
        description: "Register a new patient",
        icon: UserPlus,
        path: "/receptionist/check-in", 
        color: "text-blue-600 bg-blue-50 border-blue-100"
      },
      {
        title: "Book Appointment",
        description: "Schedule a new appointment",
        icon: Calendar,
        path: "/receptionist/book-appointment", 
        color: "text-emerald-600 bg-emerald-50 border-emerald-100"
      }
    ];
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-5 pt-1">
        <div className="px-1">
          <h2 className="text-[20px] font-bold text-[#172033]">Quick Add</h2>
          <p className="text-[14px] text-[#667085]">What would you like to add?</p>
        </div>

        <div className="flex flex-col bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          {options.map((opt, idx) => (
            <button 
              key={idx}
              onClick={() => handleNavigate(opt.path)} 
              className="flex items-center gap-3 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors interactive-element text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${opt.color}`}>
                <opt.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <h3 className="font-semibold text-[15px] text-[#172033]">{opt.title}</h3>
                <p className="text-[12px] text-[#667085]">{opt.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#98A2B3]" />
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}

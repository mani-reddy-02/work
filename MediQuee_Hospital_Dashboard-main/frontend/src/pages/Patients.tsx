import { Search, Filter, Phone, Calendar, User } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export function Patients() {
  const navigate = useNavigate();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const patients = [
    { id: 1, name: "Rahul Sharma", age: "45 Y", gender: "Male", phone: "+91 98765 43210", lastVisit: "12 May 2025" },
    { id: 2, name: "Priya Patel", age: "32 Y", gender: "Female", phone: "+91 87654 32109", lastVisit: "10 May 2025" },
    { id: 3, name: "Amit Kumar", age: "28 Y", gender: "Male", phone: "+91 76543 21098", lastVisit: "08 May 2025" },
    { id: 4, name: "Sneha Reddy", age: "50 Y", gender: "Female", phone: "+91 65432 10987", lastVisit: "05 May 2025" },
    { id: 5, name: "Vikram Singh", age: "62 Y", gender: "Male", phone: "+91 54321 09876", lastVisit: "01 May 2025" },
  ];

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-80px)] pb-24">
      {/* Search and Filter */}
      <div className="px-4 pt-2 pb-2 bg-white sticky top-0 z-40">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Search patients by name or ID..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-gray-400"
            />
          </div>
          <button className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Patient List */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="px-4 py-4 flex flex-col gap-3"
      >
        {patients.map((patient) => (
          <motion.div 
            key={patient.id}
            variants={item}
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800 truncate">{patient.name}</h3>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">ID: #{patient.id}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{patient.age}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{patient.gender}</span>
                </div>
                
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {patient.lastVisit}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

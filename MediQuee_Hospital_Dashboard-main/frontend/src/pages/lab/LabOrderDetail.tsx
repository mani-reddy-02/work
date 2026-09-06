import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, User, Phone, Upload, Eye, Share2, FlaskConical, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { StatusBadge } from "@/components/lab/LabUI"
import { cn } from "@/lib/utils"

// Mock order data — replace with API call
const mockOrders: Record<string, {
  id: string; patient: string; phone: string; test: string[]; sample: string;
  sampleStatus: 'pending' | 'collected' | 'processing' | 'ready' | 'delivered';
  reportStatus: 'pending' | 'ready' | 'delivered'; amount: string; date: string; time: string;
}> = {
  'MQ-10284': { id: 'MQ-10284', patient: 'Ramesh Kumar', phone: '+91 98765 43210', test: ['CBC', 'Lipid Profile'], sample: 'Blood', sampleStatus: 'processing', reportStatus: 'pending', amount: '₹850', date: '14 Aug 2026', time: '10:30 AM' },
  'MQ-10285': { id: 'MQ-10285', patient: 'Priya Sharma', phone: '+91 87654 32109', test: ['Thyroid Profile (T3, T4, TSH)'], sample: 'Blood', sampleStatus: 'ready', reportStatus: 'ready', amount: '₹650', date: '14 Aug 2026', time: '11:15 AM' },
  'MQ-10286': { id: 'MQ-10286', patient: 'Mohammed Ali', phone: '+91 76543 21098', test: ['Urine Routine', 'Urine Culture'], sample: 'Urine', sampleStatus: 'pending', reportStatus: 'pending', amount: '₹500', date: '14 Aug 2026', time: '12:00 PM' },
}

export function LabOrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const order = mockOrders[id ?? '']

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[16px] font-semibold text-[#172033]">Order not found</p>
        <button onClick={() => navigate(-1)} className="text-primary font-semibold">Go Back</button>
      </div>
    )
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <p className="text-[13px] font-bold text-[#667085] uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">{children}</div>
    </div>
  )

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#667085]">{label}</span>
      <span className="text-[14px] font-semibold text-[#172033]">{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Order Details</h1>
        <div className="ml-auto">
          <StatusBadge status={order.sampleStatus} size="md" />
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-5 md:pt-8 pb-24 w-full max-w-5xl mx-auto">

        {/* Order ID Banner */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] md:text-[13px] text-primary font-semibold">Order ID</p>
            <p className="text-[18px] md:text-[20px] font-bold text-primary">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] md:text-[13px] text-[#667085]">Date</p>
            <p className="text-[14px] md:text-[15px] font-semibold text-[#172033]">{order.date} · {order.time}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            {/* Patient */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <Section title="Patient">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[15px] md:text-[17px] font-bold text-[#172033]">{order.patient}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
                      <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#98A2B3]" />
                      <span className="text-[13px] md:text-[14px] text-[#667085]">{order.phone}</span>
                    </div>
                  </div>
                </div>
              </Section>
            </motion.div>

            {/* Tests */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Section title="Tests">
                {order.test.map(t => (
                  <div key={t} className="flex items-center gap-3 md:gap-4 py-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FlaskConical className="w-4 h-4 md:w-5 md:h-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-[14px] md:text-[15px] font-semibold text-[#172033]">{t}</span>
                  </div>
                ))}
              </Section>
            </motion.div>
            
            {/* Amount (Moved to left col on desktop) */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <Section title="Payment">
                <Row label="Total Amount" value={<span className="text-[16px] md:text-[18px] font-bold text-[#172033]">{order.amount}</span>} />
                <Row label="Status" value={<span className="text-emerald-600 font-semibold">Paid</span>} />
              </Section>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
            {/* Sample & Report */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <Section title="Sample & Report">
                <Row label="Sample Type" value={order.sample} />
                <Row label="Sample Status" value={<StatusBadge status={order.sampleStatus} />} />
                <Row label="Report Status" value={
                  order.reportStatus === 'ready'
                    ? <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Ready</span>
                    : <span className="text-[#98A2B3]">Pending</span>
                } />
              </Section>
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-2 md:gap-3 mt-1 lg:mt-0">
              {order.reportStatus !== 'ready' && order.reportStatus !== 'delivered' ? (
                <button
                  onClick={() => navigate('/lab/upload-report')}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
                >
                  <Upload className="w-5 h-5 md:w-6 md:h-6" />
                  Upload Report
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/lab/report/${order.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm transition-colors hover:bg-blue-700"
                >
                  <Eye className="w-5 h-5 md:w-6 md:h-6" />
                  View Report
                </button>
              )}
              <button className={cn(
                "w-full flex items-center justify-center gap-2 bg-white border border-gray-200/60 text-[#172033] font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm transition-colors hover:bg-gray-50",
                (order.reportStatus !== 'ready' && order.reportStatus !== 'delivered') && "opacity-40 pointer-events-none"
              )}>
                <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                Share Report
              </button>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  )
}

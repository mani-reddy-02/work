import re

filepath = 'mediquee admin/src/pages/HomeNursingDetails.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """          {/* Payment Status & Financials */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Payment Status</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {booking.paymentStatus}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Gross Service Amount</span>
                <span className="font-medium text-slate-900">₹{booking.totalAmount || 0}</span>
              </div>
              
              {booking.mediqueeCommissionPercentage !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Admin Commission ({booking.mediqueeCommissionPercentage}%)</span>
                  <span className="font-medium text-slate-900 text-rose-600">₹{booking.mediqueeAmount || 0}</span>
                </div>
              )}
              
              {booking.hospitalSharePercentage !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Provider Share ({booking.hospitalSharePercentage}%)</span>
                  <span className="font-medium text-slate-900 text-emerald-600">₹{booking.hospitalAmount || 0}</span>
                </div>
              )}
              
              {booking.paymentMethod && (
                <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-900">{booking.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>"""

content = re.sub(
    r'<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">\s*<div className="flex justify-between items-center">\s*<h3 className="text-lg font-bold text-slate-900">Payment Status</h3>\s*<span className={`px-2 py-1 text-xs font-semibold rounded-full \$\{booking\.paymentStatus === \'PAID\' \? \'bg-emerald-100 text-emerald-800\' : \'bg-amber-100 text-amber-800\'\}`}>\s*\{booking\.paymentStatus\}\s*</span>\s*</div>\s*</div>',
    replacement,
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched HomeNursingDetails.tsx with financial block")

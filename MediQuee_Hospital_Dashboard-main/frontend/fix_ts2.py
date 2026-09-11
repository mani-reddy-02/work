import os
import re

errors = """
src/components/lab/LabHeader.tsx(1,37): error TS6133: 'LogOut' is declared but its value is never read.
src/components/lab/LabQuickAddMenu.tsx(2,27): error TS6133: 'ClipboardList' is declared but its value is never read.
src/components/lab/LabQuickAddMenu.tsx(2,51): error TS6133: 'Home' is declared but its value is never read.
src/components/layout/BottomNav.tsx(2,57): error TS6133: 'Clock' is declared but its value is never read.
src/components/layout/Header.tsx(1,16): error TS6133: 'LogOut' is declared but its value is never read.
src/components/layout/Header.tsx(1,24): error TS6133: 'CheckCircle2' is declared but its value is never read.
src/components/layout/Header.tsx(4,1): error TS6133: 'useState' is declared but its value is never read.
src/pages/Appointments.tsx(1,36): error TS6133: 'ChevronDown' is declared but its value is never read.
src/pages/Appointments.tsx(1,60): error TS6133: 'Plus' is declared but its value is never read.
src/pages/Appointments.tsx(1,82): error TS6133: 'CheckCircle2' is declared but its value is never read.
src/pages/Appointments.tsx(1,96): error TS6133: 'Clock' is declared but its value is never read.
src/pages/doctor/Availability.tsx(1,16): error TS6133: 'Clock' is declared but its value is never read.
src/pages/doctor/Availability.tsx(4,1): error TS6133: 'cn' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,10): error TS6133: 'Clock' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,17): error TS6133: 'Users' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,24): error TS6133: 'ChevronRight' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,38): error TS6133: 'Activity' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,48): error TS6133: 'Calendar' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,58): error TS6133: 'RotateCw' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,68): error TS6133: 'CheckCircle2' is declared but its value is never read.
src/pages/doctor/DoctorDashboard.tsx(1,102): error TS6133: 'Play' is declared but its value is never read.
src/pages/doctor/DoctorOPs.tsx(1,36): error TS6133: 'ChevronDown' is declared but its value is never read.
src/pages/doctor/DoctorOPs.tsx(1,60): error TS6133: 'Plus' is declared but its value is never read.
src/pages/doctor/DoctorOPs.tsx(1,82): error TS6133: 'CheckCircle2' is declared but its value is never read.
src/pages/doctor/DoctorOPs.tsx(1,96): error TS6133: 'Clock' is declared but its value is never read.
src/pages/doctor/VideoConsultations.tsx(1,36): error TS6133: 'ChevronDown' is declared but its value is never read.
src/pages/doctor/VideoConsultations.tsx(1,77): error TS6133: 'Settings' is declared but its value is never read.
src/pages/doctor/VideoConsultations.tsx(1,87): error TS6133: 'Play' is declared but its value is never read.
src/pages/doctor/VideoConsultations.tsx(39,21): error TS6133: 'setVideoList' is declared but its value is never read.
src/pages/doctor/VideoDetailModal.tsx(2,45): error TS6133: 'AlertTriangle' is declared but its value is never read.
src/pages/doctor/VideoDetailModal.tsx(3,1): error TS6133: 'cn' is declared but its value is never read.
src/pages/nurse/NurseCalendar.tsx(2,22): error TS6133: 'CalendarIcon' is declared but its value is never read.
src/pages/nurse/NurseCalendar.tsx(2,44): error TS6133: 'Clock' is declared but its value is never read.
src/pages/nurse/NurseCalendar.tsx(7,10): error TS6133: 'currentDate' is declared but its value is never read.
src/pages/nurse/NurseCalendar.tsx(7,23): error TS6133: 'setCurrentDate' is declared but its value is never read.
src/pages/nurse/NurseDashboard.tsx(2,10): error TS6133: 'Home' is declared but its value is never read.
src/pages/nurse/NurseDashboard.tsx(2,24): error TS6133: 'Phone' is declared but its value is never read.
src/pages/nurse/NurseDashboard.tsx(2,51): error TS6133: 'Bell' is declared but its value is never read.
src/pages/nurse/NurseDashboard.tsx(2,57): error TS6133: 'Play' is declared but its value is never read.
src/pages/receptionist/QueueScreen.tsx(1,20): error TS6133: 'useEffect' is declared but its value is never read.
src/pages/receptionist/QueueScreen.tsx(3,10): error TS6133: 'ArrowRight' is declared but its value is never read.
src/pages/receptionist/ReceptionistAppointments.tsx(1,36): error TS6133: 'ChevronLeft' is declared but its value is never read.
src/pages/receptionist/ReceptionistAppointments.tsx(1,49): error TS6133: 'ChevronRight' is declared but its value is never read.
src/pages/receptionist/ReceptionistAppointments.tsx(1,63): error TS6133: 'User' is declared but its value is never read.
src/pages/receptionist/ReceptionistAppointments.tsx(41,28): error TS6133: 'setAppointmentsList' is declared but its value is never read.
"""

def main():
    pattern = re.compile(r"^(src/[a-zA-Z0-9_/\-\.]+)\((\d+),\d+\): error TS6133: '([^']+)' is declared")
    
    fixes = {}
    for line in errors.strip().split('\n'):
        m = pattern.match(line.strip())
        if m:
            filepath, line_num, var_name = m.groups()
            line_num = int(line_num) - 1 # 0-indexed
            if filepath not in fixes:
                fixes[filepath] = []
            fixes[filepath].append((line_num, var_name))
            
    for filepath, edits in fixes.items():
        full_path = os.path.join("d:/MediQuee Hospital/frontend", filepath)
        if not os.path.exists(full_path):
            continue
            
        with open(full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for line_num, var_name in edits:
            line_str = lines[line_num]
            
            # Simple replace: try removing it with comma
            line_str = re.sub(r'\b' + re.escape(var_name) + r'\b\s*,\s*', '', line_str)
            # Try removing it at the end of the list
            line_str = re.sub(r',\s*\b' + re.escape(var_name) + r'\b', '', line_str)
            # Try removing it if it's the only one inside braces
            line_str = re.sub(r'\{\s*\b' + re.escape(var_name) + r'\b\s*\}', '{}', line_str)
            # Try removing it if it's the only one import
            line_str = re.sub(r'import\s+\b' + re.escape(var_name) + r'\b\s+from', 'import from', line_str)
            
            # Handle state setters
            if var_name.startswith('set'):
                line_str = re.sub(r'\b' + re.escape(var_name) + r'\b', '_' + var_name, line_str)
            elif var_name == 'currentDate':
                 line_str = re.sub(r'\b' + re.escape(var_name) + r'\b', '_' + var_name, line_str)
            elif var_name == 'cn' and 'import cn from' not in line_str:
                 # some files have import { cn } from "@/lib/utils"
                 pass
            
            lines[line_num] = line_str
            
        # Write back
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
            
    print("Done fixing unused vars.")

if __name__ == "__main__":
    main()

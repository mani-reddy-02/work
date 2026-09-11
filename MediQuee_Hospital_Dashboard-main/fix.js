const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(__dirname, 'frontend', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(fullPath, content);
}

replaceInFile('src/components/appointments/AppointmentDetailModal.tsx', [
    [/Calendar, Clock, /, 'Calendar, '],
]);

replaceInFile('src/components/ui/ConfirmationSheet.tsx', [
    [/import React, \{ useState, useEffect \} from 'react';?/, 'import { useState, useEffect } from "react";'],
    [/import React from ['"]react['"];?\n?/, ''],
]);

replaceInFile('src/components/ui/EmptyState.tsx', [
    [/import React from ['"]react['"];?\n?/, ''],
    [/import \{ LucideIcon \} from ['"]lucide-react['"];?/, 'import type { LucideIcon } from "lucide-react";'],
]);

replaceInFile('src/context/AuthContext.tsx', [
    [/import \{ createContext, useContext, useState, ReactNode \} from 'react'/, 'import { createContext, useContext, useState, type ReactNode } from "react"'],
]);

replaceInFile('src/context/ThemeContext.tsx', [
    [/import \{ createContext, useContext, useEffect, useState, ReactNode \} from "react"/, 'import { createContext, useContext, useEffect, useState, type ReactNode } from "react"'],
]);

replaceInFile('src/context/ToastContext.tsx', [
    [/import React, \{ createContext, useContext, useState, ReactNode \} from 'react'/, 'import { createContext, useContext, useState, type ReactNode } from "react"'],
]);

replaceInFile('src/pages/AddDepartment.tsx', [
    [/const onSubmit = async \(data: DepartmentFormValues\) => \{/, 'const onSubmit = async (_data: DepartmentFormValues) => {'],
]);

replaceInFile('src/pages/AddDoctor.tsx', [
    [/const onSubmit = async \(data: DoctorFormValues\) => \{/, 'const onSubmit = async (_data: DoctorFormValues) => {'],
]);

replaceInFile('src/pages/AddLab.tsx', [
    [/const onSubmit = async \(data: LabFormValues\) => \{/, 'const onSubmit = async (_data: LabFormValues) => {'],
]);

replaceInFile('src/pages/AddNurse.tsx', [
    [/const onSubmit = async \(data: NurseFormValues\) => \{/, 'const onSubmit = async (_data: NurseFormValues) => {'],
    [/homeNursing: z.boolean\(\).default\(false\),/, 'homeNursing: z.boolean().optional(),'],
]);

replaceInFile('src/pages/AddReceptionist.tsx', [
    [/const onSubmit = async \(data: ReceptionistFormValues\) => \{/, 'const onSubmit = async (_data: ReceptionistFormValues) => {'],
]);

replaceInFile('src/pages/Appointments.tsx', [
    [/import \{ Search, Filter, Stethoscope, Video, Home, FlaskConical, TestTube, Calendar, ChevronDown, MoreVertical, Trash2 \} from "lucide-react"/, 'import { Search, Filter, Stethoscope, Video, Home, FlaskConical, TestTube, Calendar, ChevronDown, Trash2 } from "lucide-react"'],
]);

replaceInFile('src/pages/Login.tsx', [
    [/const onSubmit = async \(data: LoginFormValues\) => \{/, 'const onSubmit = async (_data: LoginFormValues) => {'],
]);

replaceInFile('src/pages/PatientDetail.tsx', [
    [/import \{ ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, Activity, FileText, Download, ChevronRight \} from "lucide-react"/, 'import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, Activity, Download, ChevronRight } from "lucide-react"'],
]);

replaceInFile('src/pages/Payouts.tsx', [
    [/import \{ Calendar, ChevronDown, Download, Filter, Search, ArrowRight, ArrowUpRight, CheckCircle2, Clock \} from "lucide-react"/, 'import { Calendar, Download, Filter, Search, ArrowUpRight, CheckCircle2, Clock } from "lucide-react"'],
]);

replaceInFile('src/pages/Register.tsx', [
    [/import \{ useState \} from "react"/, ''],
]);

replaceInFile('src/pages/Settings.tsx', [
    [/import \{ Settings as SettingsIcon, Bell, Shield, Key, Globe, Moon, ChevronRight, Save \} from "lucide-react"/, 'import { Settings as SettingsIcon, Bell, Shield, Key, Globe, Moon, Save } from "lucide-react"'],
]);

console.log("Fixes applied");

const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

const updateServices = () => {
  const adminService = `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const adminService = {
  getAdminDashboardStats: async (token: string) => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/admin/stats\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: null };
    }
  },
  getRevenueAnalytics: async (token: string) => {
    return { success: true, data: [] };
  }
};
`;
  fs.writeFileSync(path.join(srcDir, 'services', 'adminService.ts'), adminService);

  const userService = `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const userService = {
  getUsers: async (token: string) => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/admin/users\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  }
};
`;
  fs.writeFileSync(path.join(srcDir, 'services', 'userService.ts'), userService);

  const hospitalService = `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const hospitalService = {
  getHospitals: async (token: string) => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/admin/hospitals\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  }
};
`;
  fs.writeFileSync(path.join(srcDir, 'services', 'hospitalService.ts'), hospitalService);

  const verificationService = `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const verificationService = {
  getVerificationRequests: async (token: string) => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/admin/hospital-requests\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  }
};
`;
  fs.writeFileSync(path.join(srcDir, 'services', 'verificationService.ts'), verificationService);
};

const updateComponents = () => {
  // Update Users.tsx
  const usersPath = path.join(srcDir, 'pages', 'Users.tsx');
  let usersCode = fs.readFileSync(usersPath, 'utf8');
  if (!usersCode.includes('userService')) {
    usersCode = usersCode.replace(
      "import KpiCard from '../components/ui/KpiCard';",
      "import KpiCard from '../components/ui/KpiCard';\nimport { userService } from '../services/userService';"
    );
    usersCode = usersCode.replace(
      /const res = await fetch\(.*?\}\);/s,
      "const res = await userService.getUsers(token);"
    );
    usersCode = usersCode.replace(/if \(res\.ok\) \{\s*const json = await res\.json\(\);\s*if/s, "const json = res;\n        if");
    usersCode = usersCode.replace(/const json = await res\.json\(\);/, "");
    fs.writeFileSync(usersPath, usersCode);
  }

  // Update Hospitals.tsx
  const hospitalsPath = path.join(srcDir, 'pages', 'Hospitals.tsx');
  let hospitalsCode = fs.readFileSync(hospitalsPath, 'utf8');
  if (!hospitalsCode.includes('hospitalService')) {
    hospitalsCode = hospitalsCode.replace(
      "import KpiCard from '../components/ui/KpiCard';",
      "import KpiCard from '../components/ui/KpiCard';\nimport { hospitalService } from '../services/hospitalService';"
    );
    hospitalsCode = hospitalsCode.replace(
      /const res = await fetch\(.*?\}\);/s,
      "const res = await hospitalService.getHospitals(token);"
    );
    hospitalsCode = hospitalsCode.replace(/if \(res\.ok\) \{\s*const json = await res\.json\(\);\s*if/s, "const json = res;\n        if");
    hospitalsCode = hospitalsCode.replace(/const json = await res\.json\(\);/, "");
    fs.writeFileSync(hospitalsPath, hospitalsCode);
  }

  // Update Verification.tsx
  const verificationPath = path.join(srcDir, 'pages', 'Verification.tsx');
  let verifCode = fs.readFileSync(verificationPath, 'utf8');
  if (!verifCode.includes('verificationService')) {
    verifCode = verifCode.replace(
      "import { ShieldCheck, ShieldAlert, FileText, Check, X, AlertCircle } from 'lucide-react';",
      "import { ShieldCheck, ShieldAlert, FileText, Check, X, AlertCircle } from 'lucide-react';\nimport { verificationService } from '../services/verificationService';\nimport { useAdminAuth } from '../contexts/AuthContext';"
    );
    verifCode = verifCode.replace(
      "const Verification: React.FC = () => {",
      "const Verification: React.FC = () => {\n  const { token } = useAdminAuth();"
    );
    
    // add useEffect to fetch verification
    verifCode = verifCode.replace(
      /const \[requests\] = useState<VerificationRequest\[\]>\(\[\]\);/,
      \`const [requests, setRequests] = useState<VerificationRequest[]>([]);
  
  useEffect(() => {
    const fetchReqs = async () => {
      if (!token) return;
      const res = await verificationService.getVerificationRequests(token);
      if (res.success && Array.isArray(res.data)) {
        setRequests(res.data);
      }
    };
    fetchReqs();
  }, [token]);\`
    );
    fs.writeFileSync(verificationPath, verifCode);
  }
};

updateServices();
updateComponents();
console.log('Update finished.');

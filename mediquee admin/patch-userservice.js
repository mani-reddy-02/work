import fs from 'fs';
import path from 'path';

const file = path.join(__dirname, 'src/services/userService.ts');
let content = fs.readFileSync(file, 'utf8');

const updatedFunc = `  getUsers: async (token: string, filters?: any) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.role) params.append('role', filters.role);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.ageMin) params.append('ageMin', filters.ageMin);
        if (filters.ageMax) params.append('ageMax', filters.ageMax);
        if (filters.city) params.append('city', filters.city);
        if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      }
      const queryStr = params.toString() ? \`?\${params.toString()}\` : '';
      const res = await fetch(\`\${API_BASE_URL}/admin/users\${queryStr}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },`;

content = content.replace(/getUsers:\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?catch\s*\([^)]*\)\s*\{\s*console\.error[^}]*\}\s*\},/, updatedFunc);

fs.writeFileSync(file, content);
console.log('userService patched');

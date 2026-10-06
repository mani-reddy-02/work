const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/services/userService.ts');
let content = fs.readFileSync(file, 'utf8');

const newMethod = `
  getPatientFilters: async (token: string) => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/admin/patients/filters\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: { cities: [], hospitals: [] } };
    }
  }
};`;

content = content.replace(/};\s*$/, newMethod);
fs.writeFileSync(file, content);
console.log('userService filters added');

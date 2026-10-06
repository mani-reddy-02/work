const fs = require('fs');

let path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\(value: number\)/g, '(value: any)');
fs.writeFileSync(path, content);
console.log('Fixed Dashboard.tsx');

path = 'src/pages/SettlementDetails.tsx';
if (fs.existsSync(path)) {
  content = fs.readFileSync(path, 'utf8');
  content = content.replace(/s =>/g, '(s: any) =>');
  fs.writeFileSync(path, content);
  console.log('Fixed SettlementDetails.tsx');
}

import re

filepath = 'mediquee admin/src/services/adminService.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_methods = """  getPendingVerifications: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/verifications/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (err) {
      console.error('Error fetching pending verifications:', err);
      return { success: false, message: 'Network Error' };
    }
  },

  updateVerificationStatus: async (token: string, type: string, id: string, payload: { status: string, cancellationReason?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/verifications/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('Error updating verification status:', err);
      return { success: false, message: 'Network Error' };
    }
  },
"""

pattern = r'export const adminService = \{'
content = re.sub(pattern, "export const adminService = {\n" + new_methods, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated adminService.ts")

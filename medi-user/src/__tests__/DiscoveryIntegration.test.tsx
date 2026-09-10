import { describe, it, expect, vi } from 'vitest';
import { hospitalApi, doctorApi, departmentApi, laboratoryApi } from '../lib/hospitalApi';

describe('Discovery APIs in medi-user', () => {
  it('hospitalApi.getHospitals formats hospitals correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'hosp-123',
            name: 'Apollo Hospitals',
            city: 'Hyderabad',
            area: 'Jubilee Hills',
            addressLine1: 'Road No. 72',
            contactPhone: '+91 40 2360 7777',
            departments: ['Cardiology', 'Neurology'],
            services: ['op_consultation', 'lab_tests']
          }
        ]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await hospitalApi.getHospitals({ search: 'Apollo' });
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data![0].name).toBe('Apollo Hospitals');
    expect(res.data![0].address).toContain('Road No. 72, Jubilee Hills, Hyderabad');
    expect(res.data![0].services).toContain('lab_tests');
  });

  it('hospitalApi.getHospital details by ID', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'hosp-123',
          name: 'Apollo Hospitals',
          city: 'Hyderabad',
          departments: ['Cardiology']
        }
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await hospitalApi.getHospital('hosp-123');
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('hosp-123');
  });

  it('hospitalApi.getHospitalDepartments returns department list', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { id: 'dept-1', name: 'Cardiology', specialtyId: 'spec-1', doctorCount: 3 }
        ]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await hospitalApi.getHospitalDepartments('hosp-123');
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data![0].name).toBe('Cardiology');
  });

  it('doctorApi.getDoctors filters by department and hospital', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'doc-1',
            name: 'Dr. Rajesh Kumar',
            specialization: 'Cardiology',
            hospitalId: 'hosp-123',
            departmentId: 'dept-1'
          }
        ]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await doctorApi.getDoctors({ hospitalId: 'hosp-123', departmentId: 'dept-1' });
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data![0].specialization).toBe('Cardiology');
  });

  it('doctorApi.getAvailability retrieves time slots', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          doctorId: 'doc-1',
          date: '2026-11-01',
          allSlots: ['09:00 AM', '10:00 AM'],
          availableSlots: ['10:00 AM'],
          bookedSlots: ['09:00 AM']
        }
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await doctorApi.getAvailability('doc-1', '2026-11-01');
    expect(res.success).toBe(true);
    expect(res.data?.availableSlots).toContain('10:00 AM');
    expect(res.data?.bookedSlots).toContain('09:00 AM');
  });

  it('departmentApi.getDepartments and getDepartmentDoctors work', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ id: 'dept-1', name: 'General Medicine', hospitalName: 'SM Hospital' }]
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ id: 'doc-1', name: 'Doctor1', department: 'General Medicine' }]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const deptsRes = await departmentApi.getDepartments();
    expect(deptsRes.success).toBe(true);
    expect(deptsRes.data![0].name).toBe('General Medicine');

    const docsRes = await departmentApi.getDepartmentDoctors('dept-1');
    expect(docsRes.success).toBe(true);
    expect(docsRes.data![0].name).toBe('Doctor1');
  });

  it('laboratoryApi.getLaboratories returns real laboratory entries', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'lab-1',
            name: 'SM Hospital Diagnostics',
            city: 'Mantralayam',
            location: 'Mantralayam, Andhra Pradesh',
            services: ['lab_tests'],
            price: '₹499',
            time: 'Within 24 Hours',
            rating: 4.8
          }
        ]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await laboratoryApi.getLaboratories({ search: 'SM' });
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data![0].name).toBe('SM Hospital Diagnostics');
    expect(res.data![0].price).toBe('₹499');
  });
});

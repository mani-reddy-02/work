const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'backend/src/modules/laboratories/laboratories.controller.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const newFunction = `
export const getLaboratoryAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dateQuery = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    const lab = await prisma.lab.findUnique({
      where: { id }
    });

    if (!lab) {
      return res.status(404).json({ success: false, error: 'Lab not found' });
    }

    const schedules = await prisma.labSchedule.findMany({
      where: { labId: id }
    });

    // Helper to generate dates for next 14 days
    const availableDates = [];
    let targetDate = null;
    const now = new Date();
    
    // Parse target date if provided
    if (dateQuery) {
      const parts = dateQuery.split('-');
      if (parts.length === 3) {
        targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }

    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      
      const scheduleForDay = schedules.find(s => s.dayOfWeek.toLowerCase() === dayName.toLowerCase());
      
      if (scheduleForDay && scheduleForDay.isAvailable) {
        const dateStr = \`\${d.getFullYear()}-\${(d.getMonth() + 1).toString().padStart(2, '0')}-\${d.getDate().toString().padStart(2, '0')}\`;
        
        let label = '';
        if (i === 0) label = \`Today, \${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\`;
        else if (i === 1) label = \`Tomorrow, \${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\`;
        else label = \`\${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}\`;
        
        availableDates.push({ date: dateStr, label });
        
        if (!targetDate && availableDates.length === 1) {
           targetDate = new Date(d); // default to first available
        }
      }
    }

    let slots: any[] = [];
    
    if (targetDate) {
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = schedules.find(s => s.dayOfWeek.toLowerCase() === dayName.toLowerCase());
      
      if (schedule && schedule.isAvailable) {
        // Physical Lab Slots
        let currentMinutes = 0;
        const [startH, startM] = (schedule.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (schedule.endTime || '17:00').split(':').map(Number);
        
        currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = schedule.slotDurationMinutes || 30;
        
        while (currentMinutes + duration <= endMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 === 0 ? 12 : h % 12;
          const timeStr = \`\${displayH.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')} \${ampm}\`;
          slots.push({ time: timeStr, status: 'available', type: 'LAB' });
          currentMinutes += duration;
        }

        // We can just merge or provide them. The frontend does not distinguish type in the basic view, 
        // but if it does, it's fine. We'll return physical lab slots. Home slots could be handled if required.
      }
    }

    res.json({
      success: true,
      data: {
        availableDates,
        slots
      }
    });
  } catch (error) {
    next(error);
  }
};
`;

content = content.replace(/export const getLaboratoryAvailability = async.*?catch \(error\) {\s*next\(error\);\s*}\s*};/s, newFunction);

fs.writeFileSync(targetFile, content);
console.log('Updated getLaboratoryAvailability');

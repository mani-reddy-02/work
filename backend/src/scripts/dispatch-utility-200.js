const fs = require('fs');
const path = require('path');
const dotenv = require('d:/work/backend/node_modules/dotenv');
dotenv.config({ path: 'd:/work/backend/.env' });

const { PrismaClient } = require('d:/work/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneNumberId) {
    console.error('ERROR: Missing WhatsApp credentials in backend/.env!');
    process.exit(1);
  }

  // Load contacts
  const csvPath = 'd:/work/contacts_friends_200.csv';
  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: Contacts file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(Boolean).slice(1);
  const contacts = lines.slice(0, 200).map(line => {
    const parts = line.split(',');
    const sNo = parts[0];
    const phone = parts[parts.length - 2].trim();
    const name = parts.slice(1, parts.length - 2).join(',').replace(/^"|"$/g, '').trim();
    return { sNo, name, phone };
  });

  console.log('====================================================');
  console.log('  MediQuee Meta WhatsApp Utility Template Dispatch  ');
  console.log('====================================================');
  console.log(`Template      : op_appointment_confirmed (UTILITY)`);
  console.log(`Language      : en`);
  console.log(`Addressing    : Valued Patient`);
  console.log(`Total Contacts: ${contacts.length}`);
  console.log('====================================================\n');

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  let successCount = 0;
  let failureCount = 0;
  const dispatchResults = [];

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const index = i + 1;
    const recipientPhone = `91${contact.phone.replace(/^91/, '')}`;
    const refCode = `OP-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'template',
      template: {
        name: 'op_appointment_confirmed',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Valued Patient' },
              { type: 'text', text: refCode },
              { type: 'text', text: 'MediQuee Healthcare' },
              { type: 'text', text: 'General Consultation' },
              { type: 'text', text: '14 Nov 2026' },
              { type: 'text', text: '10:30 AM' },
              { type: 'text', text: 'Confirmed' }
            ]
          }
        ]
      }
    };

    let sentSuccessfully = false;
    let providerMsgId = null;
    let errorDetail = null;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();

      if (res.ok && resData.messages && resData.messages[0] && resData.messages[0].id) {
        sentSuccessfully = true;
        providerMsgId = resData.messages[0].id;
      } else {
        errorDetail = resData.error ? `Meta Error (${resData.error.code}): ${resData.error.message}` : `HTTP ${res.status}`;
      }
    } catch (netErr) {
      errorDetail = `Network error: ${netErr.message}`;
    }

    // Log to PostgreSQL database
    try {
      await prisma.whatsAppMessageLog.create({
        data: {
          messageType: 'TIER_UPGRADE_BATCH',
          recipient: recipientPhone,
          providerMessageId: providerMsgId,
          deliveryStatus: sentSuccessfully ? 'SENT' : 'FAILED',
          errorDetails: errorDetail,
          attempts: 1
        }
      });
    } catch (dbErr) {
      console.warn(`[DB Warn] Could not log message to DB: ${dbErr.message}`);
    }

    if (sentSuccessfully) {
      successCount++;
      console.log(`[${index}/${contacts.length}] ✓ ${recipientPhone} (${contact.name}): SENT [${providerMsgId}]`);
      dispatchResults.push({ index, phone: recipientPhone, name: contact.name, status: 'SENT', msgId: providerMsgId });
    } else {
      failureCount++;
      console.warn(`[${index}/${contacts.length}] ✗ ${recipientPhone} (${contact.name}): FAILED (${errorDetail})`);
      dispatchResults.push({ index, phone: recipientPhone, name: contact.name, status: 'FAILED', error: errorDetail });

      // If hit daily tier limit or account restriction error, break early
      if (errorDetail && (errorDetail.includes('131056') || errorDetail.includes('130429') || errorDetail.includes('limit reached'))) {
        console.error('\n[ABORT] Meta Messaging Limit reached! Halting further dispatches to protect account standing.');
        break;
      }
    }

    // 300ms pause between dispatches for safe rate-limiting
    if (i < contacts.length - 1) {
      await sleep(300);
    }
  }

  console.log('\n====================================================');
  console.log('                 DISPATCH COMPLETE                  ');
  console.log('====================================================');
  console.log(`Total Processed  : ${dispatchResults.length}`);
  console.log(`Delivered (SENT) : ${successCount}`);
  console.log(`Failed           : ${failureCount}`);
  console.log('====================================================\n');

  // Save report
  const reportPath = 'd:/work/dispatch_report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    template: 'op_appointment_confirmed',
    totalProcessed: dispatchResults.length,
    success: successCount,
    failure: failureCount,
    details: dispatchResults
  }, null, 2), 'utf8');
  console.log(`Detailed report saved to: ${reportPath}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

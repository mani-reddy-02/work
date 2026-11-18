import { ExotelClient } from '../modules/exotel';
import { env } from '../config/env';

async function verifyLiveExotelHost() {
  console.log('================================================================');
  console.log('=== SAFE READ-ONLY EXOTEL ACCOUNT & NUMBER VERIFICATION ===');
  console.log('=== (Zero calls placed, zero SMS sent, zero charges incurred) ===');
  console.log('================================================================\n');

  console.log(`Configured Account SID: ${env.EXOTEL_ACCOUNT_SID ? env.EXOTEL_ACCOUNT_SID.slice(0, 3) + '...' + env.EXOTEL_ACCOUNT_SID.slice(-3) : 'Not set'}`);
  console.log(`Configured Virtual Number: ${env.EXOTEL_CALLER_ID || 'Not set'}`);
  console.log(`Configured Subdomain in .env: ${env.EXOTEL_SUBDOMAIN || 'Not set'}\n`);

  console.log('--- Testing Configured Host via ExotelClient.verifyApiHost() ---');
  const configuredResult = await ExotelClient.verifyApiHost();
  console.log('Configured Host Result:');
  console.log('  Tested Host:', configuredResult.testedHost);
  console.log('  Is Verified:', configuredResult.isVerified);
  console.log('  Status Code:', configuredResult.statusCode);
  console.log('  Friendly Name / Summary:', configuredResult.friendlyName);
  console.log('  Status:', configuredResult.status);
  if (configuredResult.error) {
    console.log('  Error:', configuredResult.error);
  }

  console.log('\n--- Testing Alternative Cluster (api.in.exotel.com) ---');
  const indiaResult = await ExotelClient.verifyApiHost('api.in.exotel.com');
  console.log('India Cluster Result:');
  console.log('  Tested Host:', indiaResult.testedHost);
  console.log('  Is Verified:', indiaResult.isVerified);
  console.log('  Status Code:', indiaResult.statusCode);
  console.log('  Error:', indiaResult.error);

  console.log('\n================================================================');
}

verifyLiveExotelHost();



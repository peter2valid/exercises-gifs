import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...\n');
console.log('URL:', url?.substring(0, 50) + '...');
console.log('Key length:', key?.length || 0);

if (!url || !key) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

try {
  const response = await fetch(url + '/rest/v1/', {
    headers: { 
      apikey: key,
      Authorization: 'Bearer ' + key
    }
  });
  
  console.log('✓ Connection status:', response.status, response.statusText);
  
  if (response.ok) {
    console.log('✅ Supabase connection is working!\n');
  }
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  console.error('\nTroubleshooting:');
  console.error('1. Check if you have internet connection');
  console.error('2. Verify NEXT_PUBLIC_SUPABASE_URL in .env.local');
  console.error('3. Check if Supabase project is active');
}

const API_URL = 'http://localhost:5000/api/v1';

async function seedData() {
  console.log('Seeding standard test accounts...');

  const accounts = [
    {
      full_name: 'Admin User',
      email: 'admin@joineazy.local',
      password: 'Password123!',
      role: 'admin',
      student_id: 'ADMIN001'
    },
    {
      full_name: 'Test Student One',
      email: 'student1@joineazy.local',
      password: 'Password123!',
      role: 'student',
      student_id: 'STU001'
    },
    {
      full_name: 'Test Student Two',
      email: 'student2@joineazy.local',
      password: 'Password123!',
      role: 'student',
      student_id: 'STU002'
    }
  ];

  for (const acc of accounts) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc)
      });
      if (response.ok) {
        console.log(`✅ Registered ${acc.email} (${acc.role})`);
      } else if (response.status === 409) {
        console.log(`⚠️ ${acc.email} already exists.`);
      } else {
        const error = await response.text();
        console.error(`❌ Error registering ${acc.email}:`, response.status, error);
      }
    } catch (e) {
      console.error(`❌ Network error for ${acc.email}:`, e.message);
    }
  }

  console.log('\nSeed process complete. Standardized accounts for testing:');
  console.table(accounts.map(a => ({ Email: a.email, Password: a.password, Role: a.role })));
}

seedData();

const API_URL = 'http://localhost:5000/api/v1';

async function seedData() {
  console.log('Seeding dashboard smoke-test student accounts...');

  const accounts = Array.from({ length: 7 }, (_, index) => ({
    full_name: `Student ${index + 1}`,
    email: `s${index + 1}@test.com`,
    password: 'Test@1234',
    student_id: `S00${index + 1}`,
  }));

  for (const account of accounts) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });

      if (response.ok) {
        console.log(`Registered ${account.email}`);
      } else if (response.status === 409) {
        console.log(`${account.email} already exists.`);
      } else {
        const error = await response.text();
        console.error(
          `Error registering ${account.email}:`,
          response.status,
          error
        );
      }
    } catch (error) {
      console.error(`Network error for ${account.email}:`, error.message);
    }
  }

  console.log('\nSeed process complete. Student accounts for prompt-based smoke tests:');
  console.table(
    accounts.map((account) => ({
      Email: account.email,
      Password: account.password,
    }))
  );
  console.log('Admin account for protected admin routes: admin@joineazy.com / Admin@123');
}

seedData();

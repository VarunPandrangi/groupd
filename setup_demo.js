const API_URL = 'http://localhost:5000/api/v1';

async function setup() {
  try {
    // 1. Get tokens
    const studentRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@joineazy.local', password: 'Password123!' })
    });
    const { data: { token: studentToken } } = await studentRes.json();

    const adminRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@joineazy.local', password: 'Password123!' })
    });
    const { data: { token: adminToken } } = await adminRes.json();

    // 2. Student creates a group
    console.log('Creating group for student...');
    const groupRes = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ name: 'Demo Team Alpha', description: 'Test group for submission demo' })
    });
    let groupId;
    if (groupRes.ok) {
        const groupData = await groupRes.json();
        groupId = groupData.data.id;
    } else {
        // Find the group if it already exists
        const myGroupRes = await fetch(`${API_URL}/groups/my-group`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const myGroupData = await myGroupRes.json();
        groupId = myGroupData.data.id;
    }

    // 3. Admin creates an assignment for that group
    console.log('Creating assignment mapped to group', groupId, '...');
    const date = new Date();
    date.setDate(date.getDate() + 7);
    
    await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Project Submission Demo',
        description: 'Please upload your final zip file.',
        due_date: date.toISOString(),
        onedrive_link: 'https://onedrive.live.com/demo',
        target_groups: [groupId]
      })
    });

    console.log('Setup complete! Student1 is ready to submit.');
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setup();

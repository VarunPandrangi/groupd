const API_URL = 'http://localhost:5000/api/v1';

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ??
      data?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(`${method} ${path} failed: ${message}`);
  }

  return data;
}

async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  return data.data.accessToken;
}

async function setup() {
  try {
    const studentToken = await login('s1@groupd.com', 'test@123');
    const adminToken = await login('admin@groupd.com', 'test@123');

    console.log('Resolving a student group for the demo...');
    let group =
      (
        await apiRequest('/groups/my-group', {
          token: studentToken,
        })
      ).data.group ?? null;

    if (!group) {
      group = (
        await apiRequest('/groups', {
          method: 'POST',
          token: studentToken,
          body: {
            name: 'Demo Team Alpha',
            description: 'Test group for submission demo',
          },
        })
      ).data.group;
      console.log(`Created group ${group.name} (${group.id}).`);
    } else {
      console.log(`Using existing group ${group.name} (${group.id}).`);
    }

    console.log('Checking for an existing demo assignment...');
    const assignmentsResponse = await apiRequest('/assignments', {
      token: adminToken,
    });
    const existingAssignment = (assignmentsResponse.data ?? []).find(
      (assignment) => assignment.title === 'Project Submission Demo'
    );

    let assignmentId;
    if (existingAssignment) {
      assignmentId = existingAssignment.id;
      console.log(
        `Using existing assignment Project Submission Demo (${assignmentId}).`
      );
    } else {
      console.log('Creating an assignment mapped to that group...');
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const assignmentResponse = await apiRequest('/assignments', {
        method: 'POST',
        token: adminToken,
        body: {
          title: 'Project Submission Demo',
          description: 'Please upload your final zip file.',
          due_date: dueDate.toISOString(),
          onedrive_link: 'https://onedrive.live.com/demo',
          assign_to: 'specific',
          group_ids: [group.id],
        },
      });

      assignmentId = assignmentResponse.data.assignment.id;
      console.log(`Created assignment ${assignmentId}.`);
    }

    console.log('Setup complete.');
    console.log('Student dashboard user: s1@groupd.com / test@123');
    console.log('Admin dashboard user: admin@groupd.com / test@123');
    console.log(`Group ID: ${group.id}`);
    console.log(`Assignment ID: ${assignmentId}`);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exitCode = 1;
  }
}

setup();

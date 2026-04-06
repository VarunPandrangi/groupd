import api from './api';

export async function getMyGroup() {
  const { data } = await api.get('/groups/my-group');
  return data.data.group;
}

export async function createGroup(payload) {
  const { data } = await api.post('/groups', payload);
  return data.data.group;
}

export async function addMember(payload) {
  const { data } = await api.post('/groups/members', payload);
  return data.data.group;
}

export async function removeMember(memberId) {
  const { data } = await api.delete(`/groups/members/${memberId}`);
  return data.data.group;
}

export async function leaveGroup() {
  const { data } = await api.post('/groups/leave');
  return data.data.group;
}

export async function deleteGroup() {
  await api.delete('/groups');
  return null;
}

export async function getAllGroups(page = 1, limit = 10) {
  const { data } = await api.get('/groups', {
    params: { page, limit },
  });

  return {
    groups: data.data,
    pagination: data.pagination,
  };
}

export async function getGroupDetail(groupId) {
  const { data } = await api.get(`/groups/${groupId}`);
  return data.data.group;
}

export async function getAllGroupsForAdmin(limit = 100) {
  const groups = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getAllGroups(page, limit);
    groups.push(...response.groups);
    totalPages = response.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return groups;
}

const groupService = {
  getMyGroup,
  createGroup,
  addMember,
  removeMember,
  leaveGroup,
  deleteGroup,
  getAllGroups,
  getAllGroupsForAdmin,
  getGroupDetail,
};

export default groupService;

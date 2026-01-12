const csv = (value) =>
  value
    ? String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch (error) {
      // fall back
    }
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [String(value)];
};

export function normalizeUser(data = {}) {
  const roleIds = csv(data.roleId);
  const roleNames = csv(data.roleName);
  const postIds = csv(data.postId);
  const postNames = csv(data.postName);

  return {
    id: data.id,
    tenantId: data.tenantId,
    tenantName: data.tenantName,
    account: data.account,
    name: data.name,
    realName: data.realName,
    avatar: data.avatar || '',
    email: data.email || '',
    phone: data.phone || '',
    sex: data.sex,
    sexName: data.sexName,
    birthday: data.birthday || null,
    jobnum: data.jobnum || null,
    position: data.position || null,
    joinedDate: data.joinedDate || null,
    terminationDate: data.terminationDate || null,
    deptId: data.deptId || null,
    deptName: data.deptName || '',
    leaderId: data.leaderId || null,
    ehrLeaderId: data.ehrLeaderId || null,
    ehrSourceId: data.ehrSourceId || null,
    outType: data.outType || null,
    roleIds,
    roleNames,
    postIds,
    postNames,
    userType: data.userType,
    userTypeName: data.userTypeName,
    status: data.status,
    isDeleted: data.isDeleted === 1,
    isActive: data.status === 1 && data.isDeleted !== 1,
    code: data.code,
    country: data.country,
    rankWeight: data.rankWeight,
    dutyId: data.dutyId,
    dutyName: data.dutyName,
    pwStatus: data.pwStatus,
    roleStatus: data.roleStatus,
    personRoleId: data.personRoleId,
    userExt: data.userExt,
    createUser: data.createUser,
    createDept: data.createDept,
    createTime: data.createTime,
    updateUser: data.updateUser,
    updateTime: data.updateTime,
    userId: data.id,
    username: data.account,
    real_name: data.realName,
    points: toNumber(data.points),
    leaveDateCount: toNumber(data.leaveDateCount),
    travelDateCount: toNumber(data.travelDateCount),
    overDateCount: toNumber(data.overDateCount),
    joinDateCount: toNumber(data.joinDateCount),
    punchCardDetail: toArray(data.punchCardDetail),
  };
}

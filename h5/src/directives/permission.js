// import { Directive } from 'vue';
/**
 * 按钮权限控制指令  v-permission="{ id: '按钮id', ...ortherProps }"
 */
import { useUserStore } from '@/store/user';

const getPermissionState = () => {
  const userStore = useUserStore();
  return {
    permission: userStore.permission || {},
    btnPermission: userStore.btnPermission || {},
    deptInfo: userStore.deptInfo || {},
    userInfo: userStore.userInfo || {},
  };
};

/** 数据按钮 */
const isDataButton = (permissionObj) => {
  return permissionObj?.btnType === 'DC_MENU_BTN_TYPE_DATA';
};

/** 部门数据权限 */
const isDeptDataButton = (permissionObj) => {
  return permissionObj?.dataPromissionType?.indexOf('DC_MENU_DATA_PROMISSION_TYPE_DEPT') > -1;
};

/** 自有数据权限 */
const isSelfButton = (permissionObj) => {
  return permissionObj?.dataPromissionType?.indexOf('DC_MENU_DATA_PROMISSION_TYPE_SELF') > -1;
};

/** 当前部门可用 */
const isCurrentDept = (permissionObj) => {
  return (
    isDataButton(permissionObj) &&
    isDeptDataButton(permissionObj) &&
    permissionObj.dataPromissionDeptType === 'DC_MENU_PROMISSION_DEPT_TYPE_CURRENT'
  );
};

/** 当前部门和子部门可用 */
const isDeptDeepMode = (permissionObj) => {
  return (
    isDataButton(permissionObj) &&
    isDeptDataButton(permissionObj) &&
    permissionObj.dataPromissionDeptType === 'DC_MENU_PROMISSION_DEPT_TYPE_2'
  );
};

/** 判断是否有权限 */
export const hasPermissionCommon = (id, dataRow) => {
  const { permission, btnPermission, userInfo, deptInfo } = getPermissionState();
  const permissionObj = btnPermission?.[id];
  if (!permissionObj) {
    return !!permission[id];
  } else if (isDataButton(permissionObj)) {
    // 数据级别鉴权
    let isSelf = false;
    let isCurrentDeptRow = false;
    let isParenDeptRow = false;
    const row = dataRow || null;
    // 自有数据鉴权
    if (isSelfButton(permissionObj)) {
      if (!row) {
        console.error('数据鉴权需要绑定行数据： row属性');
        return false;
      } else {
        isSelf = !!(row?.createUser && userInfo?.user_id && row?.createUser === userInfo?.user_id);
      }
    }
    if (isCurrentDept(permissionObj)) {
      if (!row) {
        console.error('数据鉴权需要绑定行数据： row属性');
        return false;
      } else {
        isCurrentDeptRow = !!(
          row?.createDept &&
          deptInfo?.self &&
          deptInfo?.self?.includes?.(row?.createDept)
        );
      }
    } else if (isDeptDeepMode(permissionObj)) {
      if (!row) {
        console.error('数据鉴权需要绑定行数据： row属性');
      } else {
        isCurrentDeptRow = !!(
          row?.createDept &&
          deptInfo?.self &&
          deptInfo?.self?.includes?.(row?.createDept)
        );
        isParenDeptRow = !!(
          row?.createDept &&
          deptInfo?.parent &&
          deptInfo?.parent?.includes?.(row?.createDept)
        );
      }
    }
    return !!(isSelf || isCurrentDeptRow || isParenDeptRow);
  }
};

const checkBtnAuth = (el, binding = {}) => {
  const { value } = binding;
  if (!value) {
    return;
  }
  const { permission, btnPermission, userInfo, deptInfo } = getPermissionState();

  // console.log(
  //   'userPermission',
  //   permission,
  //   'btnPermission',
  //   btnPermission,
  //   'userInfo',
  //   userInfo,
  //   'deptInfo',
  //   deptInfo
  // );
  const permissionObj = btnPermission?.[value?.id];
  console.log(btnPermission, 'btnPermission');
  // 非按钮级数据权限
  if (!permissionObj) {
    // 看当前角色是否有权限，没有就隐藏了
    el.style.display = permission[value?.id] ? 'inline-block' : 'none';
    el.dataset.hasPermission = (!!permission[value?.id]).toString();
  } else if (isDataButton(permissionObj)) {
    // 数据级别鉴权
    let isSelf = false;
    let isCurrentDeptRow = false;
    let isParenDeptRow = false;
    const row = value?.row || {};
    // 自有数据鉴权
    if (isSelfButton(permissionObj)) {
      if (!row) {
        console.error('数据鉴权需要绑定行数据： row属性');
      } else {
        isSelf = !!(row?.createUser && userInfo?.user_id && row?.createUser === userInfo?.user_id);
      }
    }
    if (isCurrentDept(permissionObj)) {
      if (!row) {
        console.error('数据鉴权需要绑定行数据： row属性');
      } else {
        isCurrentDeptRow = !!(
          row?.createDept &&
          deptInfo?.self &&
          deptInfo?.self?.includes?.(row?.createDept)
        );
      }
    } else if (isDeptDeepMode(permissionObj)) {
      if (!row) {
        console.error('数据鉴权需要绑定行数据： row属性');
      } else {
        isCurrentDeptRow = !!(
          row?.createDept &&
          deptInfo?.self &&
          deptInfo?.self?.includes?.(row?.createDept)
        );
        isParenDeptRow = !!(
          row?.createDept &&
          deptInfo?.parent &&
          deptInfo?.parent?.includes?.(row?.createDept)
        );
      }
    }

    el.style.display = isSelf || isCurrentDeptRow || isParenDeptRow ? 'inline-block' : 'none';
    el.dataset.hasPermission = (!!(isSelf || isCurrentDeptRow || isParenDeptRow)).toString();
  }
};

const permissionDirective /*: Directive */ = {
  mounted(el, binding = {}) {
    console.log(el, binding);
    checkBtnAuth(el, binding);
  },

  updated(el, binding = {}) {
    checkBtnAuth(el, binding);
  },
};

export default permissionDirective;

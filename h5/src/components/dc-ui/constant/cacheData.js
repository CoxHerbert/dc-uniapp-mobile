import request from '@/axios';

export default {
  outboundOrder: {
    url: '/blade-bip/dc-wms-out-stock/select-data',
    defaultLabel: 'outStockCode',
    defaultLabelName: '出库单号',
    title: '出库单选择',
    placeholder: '请输入出库单号选择',
    submitTitle: '出库单',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-wms-out-stock/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '出库单号',
        prop: 'outStockCode',
      },
      {
        label: '单据状态',
        prop: 'outStockStatus',
        dictData: 'DC_WMS_OUT_STATUS',
        component: 'dc-dict',
      },
      {
        label: '出库类型',
        prop: 'outStockType',
        dictData: 'DC_WMS_OUT_TYPE_WMS',
        component: 'dc-dict',
      },
      {
        label: '申请人',
        prop: 'applicantId',
        component: 'dc-view',
        objectName: 'user',
      },
      {
        label: '负责人',
        prop: 'processingPersonnel',
        component: 'dc-view',
        objectName: 'user',
      },
      // {
      //   label: '仓库',
      //   prop: 'warehouseName',
      // },
    ],
  },
  processModel: {
    // url: '/blade-bip/CrmCustomerArea/select-data',
    defaultLabel: 'modelKey',
    defaultLabelName: '模型key',
    title: '流程模型选择',
    placeholder: '请输入流程模型选择',
    submitTitle: '流程模型',
    dialogGet: (params) => {
      return new Promise((resolve, reject) => {
        request({
          url: '/blade-workflow/design/model/list',
          method: 'get',
          params,
        })
          .then((res) => {
            const { code } = res.data;
            if (code === 200) {
              res.data.data.records = res.data.data.records.map((row) => {
                return {
                  ...row,
                  id: row.modelKey,
                  id_: row.id,
                };
              });
              resolve(res);
            } else {
              reject(res);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    column: [
      {
        label: '名称',
        prop: 'name',
      },
      {
        label: '版本',
        prop: 'version',
      },
      {
        label: 'key',
        prop: 'modelKey',
      },
      {
        label: 'serviceCallback',
        prop: 'serviceCallback',
      },
    ],
  },
  // 采购申请单
  purchaseRequest: {
    url: '/blade-bip/ScmPurchaseRequest/select-data',
    defaultLabel: 'no',
    defaultLabelName: '采购申请单',
    title: '采购申请单',
    placeholder: '请输入采购申请单',
    submitTitle: '采购申请单',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/ScmPurchaseRequest/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '组织',
        prop: 'orgId',
        dictData: 'SCMORG_LIST_CACHE',
        component: 'dc-dict',
      },
      {
        label: '采购订单编号',
        prop: 'no',
      },
      {
        label: '采购类型',
        prop: 'billtypeDict',
        dictData: 'DC_PURCHASE_REQUEST_DICT',
        component: 'dc-dict',
      },
      {
        label: '申请日期',
        prop: 'applicationDate',
      },
      {
        label: '申请人',
        prop: 'applicationUserId',
        component: 'dc-view',
        objectName: 'user',
      },
    ],
  },
  // 供应商
  scmSupplier: {
    url: '/blade-bip/ScmSupplier/select-data',
    defaultLabel: 'supplierName',
    defaultLabelName: '供应商',
    title: '供应商',
    placeholder: '请输入供应商',
    submitTitle: '供应商',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/ScmSupplier/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '供应商名称',
        prop: 'supplierName',
      },
      {
        label: '供应商编码',
        prop: 'supplierNo',
      },
      {
        label: '签约开始日期',
        prop: 'startDate',
      },
      {
        label: '签约结束日期',
        prop: 'endDate',
      },
    ],
  },
  // SIP创建，新增界面使用
  materialListByMtoNo: {
    url: '/blade-pda/common/material-search',
    defaultLabel: 'fname',
    defaultLabelName: '物料名称',
    title: '物料选择',
    placeholder: '请输入物料编码',
    submitTitle: '物料',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/SipOrder/mto-material-query',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '专案号',
        prop: 'mtoNo',
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入专案号',
        },
      },
      {
        label: '物料名称',
        prop: 'fname',
        minWidth: 200,
        tooltip: true,
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入专案号',
        },
      },
      {
        label: '物料编码',
        prop: 'fnumber',
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入专案号',
        },
      },
      {
        label: '规格',
        prop: 'fspecification',
      },
    ],
  },
  stockMaterialList: {
    url: '/blade-pda/common/material-search',
    defaultLabel: 'materialNumber',
    defaultLabelName: '物料名称',
    title: '物料选择',
    placeholder: '请输入物料编码',
    submitTitle: '物料',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc/mes/forward/stock-material-list',
        method: 'get',
        params,
      });
    },
    rowKey: 'erpId',
    search: {
      config: {
        orgId: {
          label: '组织',
          paramKey: 'orgId',
          type: 'dc-select',
          props: {
            objectName: 'org',
            placeholder: '请选择',
          },
        },
      },
    },
    column: [
      {
        label: '物料编码',
        prop: 'materialNumber',
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入专案号',
        },
      },
      {
        label: '物料名称',
        prop: 'materialName',
        minWidth: 200,
        tooltip: true,
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入物料名称',
        },
      },
      {
        label: '计划跟踪号',
        prop: 'mtoNo',
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入计划跟踪号',
        },
      },
      {
        label: '所属组织',
        prop: 'orgId',
        component: 'dc-view',
        objectName: 'org',
        width: 200,
      },
      {
        label: '当前库存',
        prop: 'currentQty',
      },
    ],
  },
  SnCheckMaterial: {
    url: '/blade-pda/common/material-search',
    defaultLabel: 'fname',
    defaultLabelName: '物料',
    title: '物料选择',
    placeholder: '请输入物料名称查询选择',
    submitTitle: '物料',
    dialogGet: (params) => {
      return request({
        url: '/blade-pda/common/material-search',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '物料名称',
        prop: 'fname',
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入物料名称',
        },
      },
      {
        label: '物料编码',
        prop: 'fnumber',
        width: 90,
        search: true,
        searchProps: {
          is: 'input',
          placeholder: '请输入物料编码',
        },
      },
      {
        label: '规格型号',
        prop: 'fspecification',
      },
      {
        label: '组织编码',
        prop: 'fuseorgid',
        type: 'dc-view',
        objectName: 'org',
        search: true,
        searchProps: {
          is: 'wf-select-dialog',
          objectName: 'org',
          placeholder: '请选择组织',
        },
      },
      {
        label: '分组名称',
        prop: 'groupname',
      },
    ],
  },
  // erp物料(执行单编辑专用)
  erpMeterial: {
    url: '/blade-bip/ScmMaterial/select-data',
    defaultLabel: 'fnumber',
    defaultLabelName: '物料编码',
    title: '物料选择',
    placeholder: '请输入物料编码查询选择',
    submitTitle: '物料选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc/erp/select/materials',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '物料名称',
        prop: 'fname',
        overHidden: true,
        search: true,
      },
      {
        label: '物料编码',
        prop: 'fnumber',
        overHidden: true,
        width: 90,
        search: true,
      },
      {
        label: '规格型号',
        prop: 'fspecification',
        overHidden: true,
      },
      {
        label: '组织',
        prop: 'fuseOrgId',
        overHidden: true,
        search: false,
      },
    ],
  },
  // scm物料
  scmMaterial: {
    url: '/blade-bip/ScmMaterial/select-data',
    defaultLabel: 'materialName',
    defaultLabelName: '物料',
    title: '物料选择',
    placeholder: '请输入物料名称查询选择',
    submitTitle: '物料',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/ScmMaterial/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '物料名称',
        prop: 'materialName',
        overHidden: true,
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '物料编码',
        prop: 'materialNumber',
        overHidden: true,
        width: 90,
        search: true,
        searchProps: {
          is: 'input',
        },
      },

      {
        label: '规格型号',
        prop: 'specification',
        overHidden: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '品牌',
        prop: 'brand',
        overHidden: true,
        search: false,
      },
    ],
  },

  scmOrg: {
    url: '/blade-bip/ScmOrg/select-data',
    defaultLabel: 'orgName',
    defaultLabelName: 'scm组织',
    title: 'SCM组织选择',
    placeholder: '请输入组织名称查询选择',
    submitTitle: 'SCM组织',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/ScmOrg/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'orgName',
        label: '组织名称',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'orgCode',
        label: '组织编码',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },

  projectSettingTemplate: {
    url: '/blade-bip/dc-pdp-func-user-config/select-data',
    defaultLabel: 'configName',
    defaultLabelName: '配置名称',
    title: '配置模板选择',
    placeholder: '请输入配置模板',
    submitTitle: '配置模板',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-pdp-func-user-config/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '配置名称',
        prop: 'configName',
      },
      {
        label: '配置编码',
        prop: 'configCode',
      },
      {
        label: '绑定角色',
        prop: 'bindField',
        dictData: 'DC_PMS_PROJECT_ROLE',
        multiple: true,
        component: 'dc-dict',
      },
    ],
  },

  machineConfig: {
    url: '/blade-bip/MachineConfig/select-data',
    defaultLabel: 'machineIp',
    defaultLabelName: '机台名称',
    title: '机台名称',
    placeholder: '请输入机台名称',
    submitTitle: '机台名称',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/delivered-item/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '机台名称',
        prop: 'machineName',
      },
    ],
  },
  // 评审的关联任务
  unfinishedTasks: {
    url: '/blade-bip/plan-item/select-data',
    defaultLabel: 'planName',
    defaultLabelName: '计划名称',
    title: '计划选择',
    placeholder: '请输入计划名称',
    submitTitle: '计划名称选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/plan-item/unfinished-tasks',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '计划名称',
        prop: 'planName',
      },
      {
        label: '项目名称',
        prop: 'projectName',
      },
      {
        label: '项目编码',
        prop: 'projectCode',
      },
    ],
  },
  // 可行性报告
  demandCode: {
    url: '/blade-bip/dc-fea/select-data',
    defaultLabel: 'feaName',
    defaultLabelName: '报告名称',
    title: '可行性报告选择',
    placeholder: '请输入报告名称查询选择',
    submitTitle: '可行新报告',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-fea/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '评估名称',
        prop: 'feaName',
      },
    ],
  },
  //自动化铭牌
  nameplateCustomer: {
    url: '/blade-bip/DcNameplateCustomer/select-data',
    defaultLabel: 'nameplateNameCustomer',
    defaultLabelName: '客户铭牌',
    title: '客户铭牌选择',
    placeholder: '请输入客户铭牌查询选择',
    submitTitle: '客户铭牌',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/Nameplate/queryNameplateCustomerList',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '铭牌模板客户名',
        prop: 'customerName',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '模版名',
        prop: 'nameplateNameCustomer',
      },
      {
        label: '铭牌模版大小',
        prop: 'nameplateSizeName',
        type: 'dict',
        dictData: 'DC_NAMEPLATE_SIZE',
        component: 'dc-dict',
      },
      // {
      //   label: '铭牌模版大小',
      //   prop: 'nameplateSizeName',
      // },
    ],
  },
  customer: {
    url: '/blade-bip/customer/select-data',
    defaultLabel: 'fullname',
    defaultLabelName: '客户名称',
    title: '商机选择',
    placeholder: '请输入客户名称查询选择',
    submitTitle: '客户',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/customer/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '客户名称',
        prop: 'fullname',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },
  cmSelector: {
    url: '/blade-bip/customer/select-data',
    defaultLabel: 'fullname',
    defaultLabelName: '厂商名称',
    title: 'CM厂商选择',
    placeholder: '请输入厂商名称查询选择',
    submitTitle: 'CM厂商',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/customer/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: 'CM厂商名称',
        prop: 'fullname',
      },
      {
        label: 'CM厂商编码',
        prop: 'cmCode',
      },
    ],
  },

  user: {
    url: '/blade-bip/bip-blade-user/select-data',
    defaultLabel: 'realName',
    defaultLabelName: '姓名',
    title: '人员选择',
    placeholder: '请输入人员姓名查询选择',
    submitTitle: '用户',
    dialogGet: (params) => {
      return request({
        url: '/blade-system/user/page',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '姓名',
        prop: 'realName',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '工号',
        prop: 'account',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '岗位',
        prop: 'postName',
        type: 'rowText',
      },
      {
        label: '部门',
        prop: 'deptName',
        type: 'rowText',
      },
    ],
  },
  company: {
    url: '/blade-bip/LaborCompany/select-data',
    defaultLabel: 'name',
    defaultLabelName: '公司名称',
    title: '公司名称',
  },
  dept: {
    url: '/blade-bip/bip-blade-dept/select-data',
    defaultLabel: 'deptName',
    defaultLabelName: '部门名称',
    title: '部门选择',
    placeholder: '请输入部门名称查询选择',
    submitTitle: '部门',
    callBack: (res) => {
      return {
        records: res.data.data,
        total: 0,
      };
    },
    dialogGet: (params) => {
      return request({
        url: '/blade-system/dept/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '部门名称',
        prop: 'deptName',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },
  customerContact: {
    url: '/blade-bip/customer-contacts/select-data',
    defaultLabel: 'contactsName',
    defaultLabelName: '联系人姓名',
    title: '客户联系人选择',
    placeholder: '请输入客户联系人姓名查询选择',
    submitTitle: '客户联系人',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/customer-contacts/list',
        method: 'get',
        params,
      });
    },
    dialogRemove: (params) => {
      return request({
        url: '/blade-bip/customer-contacts/remove',
        method: 'delete',
        params,
      });
    },
    dialogCreate: (data) => {
      return request({
        url: '/blade-bip/customer-contacts/submit',
        method: 'post',
        data,
      });
    },
    dialogEdit: (data) => {
      return request({
        url: '/blade-bip/customer-contacts/submit',
        method: 'post',
        data,
      });
    },
    column: [
      {
        label: '联系人姓名',
        prop: 'contactsName',
      },
      {
        label: '联系方式',
        prop: 'contactsPhoneNumber',
      },
      {
        label: '部门',
        prop: 'contactsDeptName',
      },
      {
        label: '职务',
        prop: 'contactsPost',
      },
    ],
  },
  foundry: {
    url: '/blade-bip/foundry/select-data',
    defaultLabel: 'foundryName',
    defaultLabelName: '代工厂名称',
    title: '代工厂选择',
    placeholder: '请输入代工厂名称查询选择',
    submitTitle: '代工厂',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/foundry/list',
        method: 'get',
        params,
      });
    },
    dialogRemove: (ids) => {
      return request({
        url: `/blade-bip/foundry/remove?ids=${ids}`,
        method: 'delete',
      });
    },
    dialogCreate: (data) => {
      return request({
        url: '/blade-bip/foundry/submit',
        method: 'post',
        data,
      });
    },
    dialogEdit: (data) => {
      return request({
        url: '/blade-bip/foundry/submit',
        method: 'post',
        data,
      });
    },
    column: [
      {
        label: '代工厂',
        prop: 'foundryName',
      },
      {
        label: '代工说明',
        prop: 'foundryDesc',
      },
    ],
  },
  org: {
    url: '/blade-bip/org/select-data',
    defaultLabel: 'orgName',
    defaultLabelName: '组织名称',
    title: '组织名称选择',
    placeholder: '请输入组织名称查询选择',
    submitTitle: '组织',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/org/list-cache',
        method: 'get',
        params,
      });
    },
    callBack: (res) => {
      return {
        records: res.data.data,
        total: 0,
      };
    },
    column: [
      {
        label: '组织名称',
        prop: 'orgName',
      },
    ],
  },
  processCorrelation: {
    url: '/blade-bip/process-correlation/select-data',
    defaultLabel: 'businessTypeName',
    defaultLabelName: '业务类型名称',
    title: '业务类型选择',
    placeholder: '请输入业务类型名称查询选择',
    submitTitle: '业务类型',
  },
  pmsFileManager: {
    url: '/blade-bip/pms-file-manager/select-data',
    defaultLabel: 'sourceFileName',
    defaultLabelName: '文件名称',
    title: '文件选择',
    placeholder: '请输入文件名称查询选择',
  },
  opps: {
    url: '/blade-bip/opps/select-data',
    defaultLabel: 'oppsName',
    defaultLabelName: '商机名称',
    title: '商机选择',
    placeholder: '请输入商机名称查询选择',
    submitTitle: '商机',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/opps/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '商机名称',
        prop: 'oppsName',
      },
      {
        label: '商机状态',
        prop: 'oppsStatusId',
        dictData: 'DC_CRM_OPPS_STATUS',
        component: 'dc-dict',
      },
      {
        label: '商机级别',
        prop: 'oppsLevelId',
        dictData: 'DC_CRM_OPPS_LEVEL',
        component: 'dc-dict',
      },
      {
        label: '商机名称',
        prop: 'oppsName',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '商机客户',
        prop: 'customerId',
        component: 'dc-view',
        objectName: 'customer',
      },
      {
        label: 'BD',
        prop: 'bdUserId',
        component: 'dc-view',
        objectName: 'user',
      },
      {
        label: 'TPM',
        prop: 'tpmUserId',
        component: 'dc-view',
        objectName: 'user',
      },
      {
        label: '登记时间',
        prop: 'createTime',
      },
      {
        label: '预计成交日期',
        prop: 'oppsExpectedTransactionDate',
      },
      {
        label: '登记人',
        prop: 'createUser',
        component: 'dc-view',
        objectName: 'user',
      },
      {
        label: '所属组织',
        prop: 'oppsOrgId',
        component: 'dc-view',
        objectName: 'org',
      },
    ],
  },
  project: {
    url: '/blade-bip/project/select-data',
    defaultLabel: 'projectName',
    defaultLabelName: '项目名称',
    title: '项目选择',
    placeholder: '请输入项目名称查询选择',
    submitTitle: '项目',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/project/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '项目名称',
        prop: 'projectName',
      },
    ],
  },
  projectDelivered: {
    url: '/blade-bip/project/select-data',
    defaultLabel: 'projectName',
    defaultLabelName: '项目名称',
    title: '项目选择',
    placeholder: '请输入项目名称查询选择',
    submitTitle: '项目',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/delivered/find-project-delivered',
        method: 'GET',
        params,
      });
    },
    column: [
      {
        label: '项目名称',
        prop: 'projectName',
      },
    ],
  },

  projectConfig: {
    url: '/blade-bip/mmr-project-config/select-data',
    defaultLabel: 'projectName',
    defaultLabelName: '项目名称',
    title: '项目选择',
    placeholder: '请输入项目名称查询选择',
    submitTitle: '项目',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/mmr-project-config/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '项目名称',
        prop: 'projectName',
      },
      {
        label: '项目编码',
        prop: 'projectCode',
      },
    ],
  },
  /** 创建现场计划单>项目选择 */
  pdpProject: {
    url: '/blade-bip/project/select-data',
    defaultLabel: 'projectName',
    defaultLabelName: '项目名称',
    title: '项目选择',
    placeholder: '请输入项目名称查询选择',
    submitTitle: '项目',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/project/find-project-vo',
        method: 'GET',
        params,
      });
    },
    column: [
      {
        label: '项目名称',
        prop: 'projectName',
      },
      {
        label: '项目编码',
        prop: 'projectCode',
      },
      {
        label: '所属组织',
        prop: 'orgId',
        component: 'dc-view',
        objectName: 'org',
      },
      {
        label: '终端客户代码',
        prop: 'customerCode',
      },
      {
        label: '设备种类',
        prop: 'quipmentDictId',
        dictData: 'DC_PMS_PROJECT_QIOPMENT',
        // 有可能有多个
        multiple: true,
        component: 'dc-dict',
      },
    ],
  },

  erpFnumber: {
    url: '/blade-bip/dc-erp-warehouse-keeper/select-data',
    defaultLabel: 'erpFnumber',
    defaultLabelName: 'ERP人员',
    title: 'ERP人员选择',
    placeholder: '请输入ERP人员查询选择',
    submitTitle: 'ERP人员',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-erp-warehouse-keeper/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '用户工号',
        prop: 'erpFnumber',
      },
      {
        label: '人员名称',
        prop: 'realName',
      },
    ],
  },

  erpRealName: {
    url: '/blade-bip/dc-erp-warehouse-keeper/select-data',
    defaultLabel: 'realName',
    defaultLabelName: 'ERP人员',
    title: 'ERP人员选择',
    placeholder: '请输入ERP人员查询选择',
    submitTitle: 'ERP人员',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-erp-warehouse-keeper/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '用户工号',
        prop: 'erpFnumber',
      },
      {
        label: '人员名称',
        prop: 'realName',
      },
    ],
  },

  stationConfig: {
    url: '/blade-bip/mmr-station-config/select-data',
    defaultLabel: 'stationName',
    defaultLabelName: '驻地名称',
    title: '驻地选择',
    placeholder: '请输入驻地名称查询选择',
    submitTitle: '驻地',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/mmr-station-config/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '驻地名称',
        prop: 'stationName',
      },
      {
        label: '驻地编码',
        prop: 'stationCode',
      },
    ],
  },

  planItem: {
    url: '/blade-bip/plan-item/select-data',
    defaultLabel: 'planName',
    defaultLabelName: '计划名称',
    title: '计划选择',
    placeholder: '请输入计划名称查询选择',
    submitTitle: '计划',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/plan-item/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '计划',
        prop: 'planName',
      },
    ],
  },
  customerRlist: {
    url: '/blade-bip/customer-rlist/select-data',
    defaultLabel: 'rlistName',
    defaultLabelName: '客户需求名称',
    title: '客户需求选择',
    placeholder: '请输入客户需求名称查询选择',
    submitTitle: '客户需求',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/customer-rlist/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '需求编码',
        prop: 'rlistCode',
      },
      {
        label: '需求名称',
        prop: 'rlistName',
      },
      {
        label: '需求版本',
        prop: 'updateVersion',
      },
      {
        label: '客户',
        prop: 'customerName',
      },
      {
        label: '商机',
        prop: 'oppsName',
      },
    ],
  },
  deliveredItem: {
    url: '/blade-bip/delivered-item/select-data',
    defaultLabel: 'mtoNo',
    defaultLabelName: '专案号',
    title: '专案选择',
    placeholder: '请输入专案号查询选择',
    submitTitle: '专案',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/delivered-item/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '专案号',
        prop: 'mtoNo',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '成品名称',
        prop: 'name',
      },
      {
        label: '成品码',
        prop: 'number',
      },
    ],
  },
  scmPurchaseOrder: {
    // url: '/blade-bip/ScmPurchaseOrder/list',
    defaultLabel: 'no',
    defaultLabelName: '采购订单',
    title: '采购订单选择',
    placeholder: '请输入订单编号查询选择',
    submitTitle: '采购订单',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/ScmPurchaseOrder/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '订单编号',
        prop: 'no',
      },
      {
        label: '流程状态',
        prop: 'processStatus',
      },
      {
        label: '采购日期',
        prop: 'purchaseDate',
      },
      {
        label: '采购员',
        prop: 'purchaserId',
        component: 'dc-view',
        objectName: 'user',
      },
    ],
  },
  // 根据供应商ID获取库存单明细行
  scmInStockDetailList: {
    defaultLabel: 'productName',
    defaultLabelName: '物料名称',
    title: '供应商库存单明细选择',
    placeholder: '请输入商品名称查询选择',
    submitTitle: '库存列表',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/scm-in-stock-detail/find-po-detail-by-supplier-id',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'productName',
        label: '物料名称',
      },
      {
        prop: 'productCode',
        label: '物料编码',
      },
      {
        prop: 'brand',
        label: '品牌',
      },
      {
        prop: 'productUnit',
        label: '库存单位',
      },
      {
        prop: 'productQty',
        label: '采购数量',
      },
      {
        prop: 'productSpec',
        label: '规格型号',
      },
    ],
  },
  warehouse: {
    url: '/blade-bip/dc-wms-warehouse/select-data',
    defaultLabel: 'warehouseName',
    defaultLabelName: '仓库',
    title: '仓库选择',
    placeholder: '请输入仓库名称查询选择',
    submitTitle: '仓库',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-wms-warehouse/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '仓库编号',
        prop: 'warehouseCode',
        width: 100,
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '仓库名称',
        prop: 'warehouseName',
        width: 160,
      },
      {
        label: '仓库类型',
        prop: 'stockType',
        dictData: 'DC_WMS_STOCK_TYPE',
        type: 'dict',
        component: 'dc-dict',
        width: 90,
      },
      {
        label: '仓库地址',
        prop: 'warehouseAddress',
      },
      {
        label: '区域',
        prop: 'warehouseRegion',
        width: 100,
      },
      // {
      //   label: '联系方式',
      //   prop: 'warehouseContactPhone',
      // },
      {
        label: '仓库负责人',
        prop: 'warehouseSupervisor',
        component: 'dc-view',
        objectName: 'user',
        width: 160,
      },
    ],
  },

  warehouseLocation: {
    url: '/blade-bip/dc-wms-warehouse-location/select-data',
    defaultLabel: 'locationName',
    defaultLabelName: '库位',
    title: '库位选择',
    placeholder: '请输入库位名称查询选择',
    submitTitle: '库位',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-wms-warehouse-location/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '仓库名称',
        prop: 'warehouseId',
        component: 'dc-view',
        objectName: 'warehouse',
      },
      {
        label: '库位名称',
        prop: 'locationName',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '过道编号',
        prop: 'locationAisle',
      },
      {
        label: '货架编号',
        prop: 'locationRack',
      },
      {
        label: '层号',
        prop: 'locationLevel',
      },
      {
        label: '归属组织',
        prop: 'orgId',
        component: 'dc-view',
        objectName: 'org',
      },
    ],
  },

  warehouseCount: {
    url: '/blade-bip/dc-wms-product/select-data',
    defaultLabel: 'productName',
    defaultLabelName: '库存',
    title: '库存选择',
    placeholder: '请输入物料名称查询选择',
    submitTitle: '库存',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-wms-common/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '物料名称',
        prop: 'productName',
        objectName: 'productName',
      },
      {
        label: '物料编码',
        prop: 'productCode',
      },
      {
        label: '规格型号',
        prop: 'productSpec',
      },
      {
        label: '计划跟踪号',
        prop: 'mtoNo',
      },
      {
        label: '数量',
        prop: 'number',
      },
      {
        label: '单位',
        prop: 'unit',
      },
      {
        label: '仓库名称',
        prop: 'warehouseId',
        component: 'dc-view',
        objectName: 'warehouse',
      },
      {
        label: '库位编码',
        prop: 'locationId',
        component: 'dc-view',
        objectName: 'warehouseLocation',
      },
    ],
  },

  dcWmsProduct: {
    url: '/blade-bip/dc-wms-product/select-data',
    defaultLabel: 'productName',
    defaultLabelName: '产品名称',
    title: '产品选择',
    placeholder: '请输入产品名称查询选择',
    submitTitle: '产品',
    column: [
      {
        label: '产品名称',
        prop: 'productName',
      },
      {
        label: '归属组织',
        prop: 'orgId',
        component: 'dc-view',
        objectName: 'org',
      },
      {
        label: '库位名称',
        prop: 'locationId',
        component: 'dc-view',
        objectName: 'warehouseLocation',
      },
    ],
  },
  cargoOwner: {
    url: '/blade-bip/dc-wms-cargo-owner/select-data',
    defaultLabel: 'cargoOwnerName',
    defaultLabelName: '货主名称',
    title: '货主选择',
    placeholder: '请输入货主名称查询选择',
    submitTitle: '货主',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-wms-cargo-owner/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '货主名称',
        prop: 'cargoOwnerName',
      },
      {
        label: '货主编码',
        prop: 'cargoOwnerCode',
      },
      {
        label: '仓库名称',
        prop: 'warehouseId',
        component: 'dc-view',
        objectName: 'warehouse',
      },
      {
        label: '库位名称',
        prop: 'locationId',
        component: 'dc-view',
        objectName: 'warehouseLocation',
      },
      {
        label: '归属组织',
        prop: 'orgId',
        component: 'dc-view',
        objectName: 'org',
      },
    ],
  },
  mmrPlanOrder: {
    url: '/blade-bip/mmr-plan-order/select-data',
    defaultLabel: 'lineCode',
    defaultLabelName: '现场计划单',
    title: '现场计划单选择',
    placeholder: '请输入现场计划单查询选择',
    submitTitle: '现场计划单',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/mmr-plan-order/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '计划单号',
        prop: 'lineCode',
        overHidden: true,
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '客户产品',
        prop: 'customerProductName',
        overHidden: true,
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '厂区',
        prop: 'customerName',
        overHidden: true,
        search: true,
      },
      {
        label: '创建人',
        prop: 'createUserName',
        overHidden: true,
        search: true,
      },
    ],
  },
  pdpCustomerArea: {
    url: '/blade-bip/CrmCustomerArea/select-data',
    defaultLabel: 'areaName',
    defaultLabelName: '厂区',
    title: '厂区选择',
    placeholder: '请输入厂区查询选择',
    submitTitle: '厂区',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/CrmCustomerArea/list',
        method: 'get',
        params,
      });
    },
    dialogRemove: (params) => {
      return request({
        url: `/blade-bip/CrmCustomerArea/remove`,
        method: 'delete',
        params,
      });
    },
    dialogCreate: (data) => {
      return request({
        url: '/blade-bip/CrmCustomerArea/submit',
        method: 'post',
        data,
      });
    },
    dialogEdit: (data) => {
      return request({
        url: '/blade-bip/CrmCustomerArea/submit',
        method: 'post',
        data,
      });
    },
    column: [
      // {
      //   label: '客户名称',
      //   prop: 'customerId',
      // },
      {
        label: '厂区编码',
        prop: 'factoryCode',
        rules: [
          {
            required: true,
            message: '请输入厂区编码',
            trigger: ['blur', 'change', 'update:modelValue'],
          },
        ],
      },
      {
        label: '区域名称',
        prop: 'areaName',
        formProp: 'areaCode',
        formSlot: true,
        rules: [
          {
            required: true,
            message: '请选择区域名称',
            trigger: ['blur', 'change', 'update:modelValue'],
          },
        ],
      },
      {
        label: '详细地址',
        prop: 'address',
        rules: [
          {
            required: true,
            message: '请输入详细地址',
            trigger: ['blur', 'change', 'update:modelValue'],
          },
        ],
      },
    ],
  },
  CrmCustomerArea: {
    url: '/blade-bip/CrmCustomerArea/select-data',
    defaultLabel: 'areaName',
    defaultLabelName: '厂区',
    title: '厂区选择',
    placeholder: '请输入厂区查询选择',
    submitTitle: '厂区',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/CrmCustomerArea/list',
        method: 'get',
        params,
      });
    },
    dialogRemove: (params) => {
      return request({
        url: `/blade-bip/CrmCustomerArea/remove`,
        method: 'delete',
        params,
      });
    },
    dialogCreate: (data) => {
      return request({
        url: '/blade-bip/CrmCustomerArea/submit',
        method: 'post',
        data,
      });
    },
    dialogEdit: (data) => {
      return request({
        url: '/blade-bip/CrmCustomerArea/submit',
        method: 'post',
        data,
      });
    },
    column: [
      {
        label: '客户名称',
        prop: 'customerId',
      },
      {
        label: '厂区编码',
        prop: 'factoryCode',
      },
      {
        label: '区域名称',
        prop: 'areaName',
      },
      {
        label: '详细地址',
        prop: 'address',
      },
    ],
  },
  CompleteMtoNo: {
    url: '/blade-erp/feign/client/mtono/select-search',
    defaultLabel: 'billNo',
    defaultLabelName: '专案号',
    title: '成品专案选择',
    placeholder: '请输入专案号查询选择',
    submitTitle: '专案',
    dialogGet: (params) => {
      return request({
        url: '/blade-erp/feign/client/mtono/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '专案号',
        prop: 'billNo',
        search: true,
        type: 'input',
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '成品名称',
        prop: 'name',
      },
      {
        label: '成品码',
        prop: 'number',
      },
      {
        label: '项目名称',
        prop: 'projectName',
      },
    ],
  },
  WireBomList: {
    defaultLabel: 'bomNo',
    defaultLabelName: 'BOM编码',
    title: 'BOM选择',
    placeholder: '请输入BOM编码查询选择',
    submitTitle: 'BOM',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/WireBom/bom-list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'bomNo',
        type: 'rowText',
        label: '编码',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'name',
        type: 'rowText',
        label: '名称',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'bomVersion',
        type: 'rowText',
        label: 'bom版本',
      },
      {
        prop: 'auditStatus',
        type: 'rowText',
        label: '审核状态',
      },
    ],
  },
  Material: {
    defaultLabel: 'fnumber',
    defaultLabelName: '物料名称',
    title: '物料选择',
    placeholder: '请输入物料名称查询选择',
    submitTitle: '物料',
    dialogGet: (params) => {
      return request({
        url: '/api/blade-pda/common/material-search-new',
        method: 'get',
        params,
      });
    },
    search: {
      config: {
        fuseorgid: {
          label: '所属组织',
          paramKey: 'fuseorgid',
          type: 'dc-select',
          props: {
            objectName: 'org',
            placeholder: '请选择',
          },
        },
        fnumber: {
          type: 'input',
          label: '物料编码',
          paramKey: 'fnumber',
          placeholder: `请输入物料编码`,
        },
        fname: {
          type: 'input',
          label: '物料名称',
          paramKey: 'fname',
          placeholder: `请输入物料名称`,
        },
      },
      params: {
        fuseorgid: '100006',
        FNUMBER: '',
        FNAME: '',
        FSPECIFICATION: '',
      },
    },
    column: [
      {
        prop: 'fnumber',
        label: '物料编码',
      },
      {
        prop: 'fname',
        label: '物料名称',
      },
      {
        prop: 'fspecification',
        label: '规格型号',
      },
      {
        prop: 'groupname',
        label: '分组名称',
      },
    ],
  },
  wireExecute: {
    defaultLabel: 'no',
    defaultLabelName: '线材执行单号',
    title: '线材执行单选择',
    placeholder: '请输入线材执行单号查询选择',
    submitTitle: '线材执行单',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/WireExecute/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'auditStatus',
        label: '审核状态',
        type: 'rowText',
      },
      {
        prop: 'no',
        label: '执行单号',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'mtoNo',
        label: '专案号',
        type: 'rowText',
      },
      {
        prop: 'projectName',
        label: '项目名称',
        type: 'rowText',
      },
      {
        prop: 'bomNo',
        label: 'bom编码',
        type: 'rowText',
      },
      {
        prop: 'materialName',
        label: '物料编码',
        type: 'rowText',
      },
      {
        prop: 'materialName',
        label: '物料名称',
        type: 'rowText',
      },
      {
        prop: 'qty',
        label: '加工件数',
        type: 'rowText',
      },
      {
        prop: 'bomVersion',
        label: 'bom版本',
        type: 'rowText',
      },
    ],
  },
  exchangeRate: {
    url: '/blade-bip/dc-scm-exchange-rate/select-data',
    defaultLabel: 'currency',
    defaultLabelName: '币种',
    title: '汇率选择',
    placeholder: '请输入币种查询选择',
    submitTitle: '汇率',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-scm-exchange-rate/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'currency',
        label: '币种',
        type: 'dict',
        dictData: 'DC_SCM_EXCHANGE_RATE',
        search: true,
        component: 'dc-dict',
        searchProps: {
          is: 'select',
        },
      },
      {
        prop: 'exchangeRate',
        label: '汇率',
        type: 'rowText',
      },
    ],
  },
  erpCustomer: {
    defaultLabel: 'customerFName',
    defaultLabelName: '客户名称',
    title: 'erp客户选择',
    placeholder: '请输入币种查询选择',
    submitTitle: '客户',
    dialogGet: (params) => {
      return request({
        url: '/blade-erp/pro/erp-customer-list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'FOrgId',
        label: '组织',
        type: 'dc-view',
        objectName: 'org',
      },
      {
        prop: 'customerFName',
        label: '客户名称',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'customerFNumber',
        label: '客户编码',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },
  erpProject: {
    defaultLabel: 'fName',
    defaultLabelName: '项目名称',
    title: '项目选择',
    placeholder: '请输入项目名称查询选择',
    submitTitle: '项目',
    dialogGet: (params) => {
      return request({
        url: '/blade-erp/pro/project-name-list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'fName',
        label: '项目名称',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'fNumber',
        label: '项目编码',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },
  erpSaleOrder: {
    defaultLabel: 'fName',
    defaultLabelName: '销售订单',
    title: '销售订单选择',
    placeholder: '请输入销售订单查询选择',
    submitTitle: '销售订单',
    dialogGet: (params) => {
      return request({
        url: '/blade-erp/pro/sale-order-list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'materialName',
        label: '物料名称',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'materialNumber',
        label: '物料编码',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        prop: 'projectCode',
        label: '专案号',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },
  OutsourceStepPrice: {
    defaultLabel: 'price',
    defaultLabelName: '阶梯价格',
    title: '阶梯价格选择',
    placeholder: '请输入阶梯价格查询选择',
    submitTitle: '阶梯价格',
    dialogGet: (params) => {
      return request({
        url: `/blade-bip/OutsourceStepPrice/list`,
        method: 'get',
        params,
      });
    },
    column: [
      {
        prop: 'price',
        label: '阶梯价格',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },
  erpPrdMoMaterial: {
    defaultLabel: 'materialName',
    defaultLabelName: '物料名称',
    title: '专案物料选择',
    placeholder: '专案物料查询选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-erp/v-prd-mo-material/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '计划跟踪号',
        prop: 'motno',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '物料编码',
        prop: 'materialCode',
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '物料名称',
        prop: 'materialName',
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '规格型号',
        prop: 'specification',
      },
      {
        label: '数量',
        prop: 'qty',
      },
    ],
  },

  floorleaderdevice: {
    url: '/blade-bip/smart-box/select-data',
    defaultLabel: 'smartboxBswz',
    defaultLabelName: '设备名称',
    title: '设备列表选择',
    placeholder: '设备列表查询选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/smart-box/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '租户ID',
        prop: 'tenantId',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '部署位置',
        prop: 'smartboxBswz',
        searchProps: {
          is: 'input',
        },
      },
      {
        label: 'DRI主键',
        prop: 'smartboxDriUsername',
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '存放地点',
        prop: 'smartboxCfddCode',
      },
      {
        label: '装备区域',
        prop: 'smartboxZpqyCode',
      },
    ],
  },
  dcFea: {
    url: '/blade-bip/dc-fea/select-data',
    defaultLabel: 'feaName',
    defaultLabelName: '评估名称',
    title: '评估名称选择',
    placeholder: '评估名称查询选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc-fea/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '评估名称',
        prop: 'feaName',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
    ],
  },
  workGroup: {
    url: '/blade-bip/mps/work-group/get-work-group-list',
    defaultLabel: 'workGroupName',
    defaultLabelName: '生产组名称',
    title: '生产组选择',
    placeholder: '生产组名称查询选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/mps/work-group/list',
        method: 'get',
        params,
      });
    },
    rowKey: 'workGroupCode',
    column: [
      {
        label: '生产组名称',
        prop: 'workGroupName',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '负责人',
        prop: 'chargePerson',
      },
      {
        label: '编制人力',
        prop: 'manpowerQuantity',
      },
      {
        label: '劳务人力',
        prop: 'laborManpowerQuantity',
      },
      {
        label: '标准工时',
        prop: 'standardWorkingHours',
        transVal(scope) {
          return scope.row.standardWorkingHours + 'h';
        },
      },
    ],
  },
  workList: {
    url: '/blade-bip/mps/work-group/get-work-group-list',
    defaultLabel: 'prdMoFbillno',
    defaultLabelName: '生产退料名称',
    title: '生产退料选择',
    placeholder: '生产退料名称查询选择',
    dialogGet: (data) => {
      return request({
        url: '/blade-bip/DcReturn/queryErpMoList',
        method: 'post',
        data,
      });
    },
    rowKey: 'prdMoFid',
    defaultParams: {
      prdMoFmtono: 'YCF2507123',
      prdMoNumber: 'MO250802539',
    },
    column: [
      {
        label: '生产订单编号',
        prop: 'prdMoFbillno',
        type: 'rowText',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '计划跟踪号',
        prop: 'prdMoFmtono',

        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '物料编码',
        prop: 'prdMoFmaterialNumber',
      },
      {
        label: '成品名称',
        prop: 'prdMoFname',
      },
      {
        label: '库位名称',
        prop: 'stockLocName',
      },
      {
        label: '库位编码',
        prop: 'stockLocCode',
      },
    ],
  },
  rawList: {
    defaultLabel: 'materialName',
    defaultLabelName: '原材料名称',
    title: '原材料选择',
    placeholder: '原材料名称查询选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc/mops/plan/get-raw-list',
        method: 'get',
        params,
      });
    },
    rowKey: 'id',
    column: [
      {
        label: '物料名称',
        prop: 'materialName',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '物料编码',
        prop: 'materialNumber',
        search: true,
        searchProps: {
          is: 'input',
        },
      },
      {
        label: '规格型号',
        prop: 'specification',
      },
      {
        label: '形状',
        prop: 'shapeType',
      },
      {
        label: '材质',
        prop: 'quality',
      },
    ],
  },
  purchaseRepuestOrder: {
    defaultLabel: 'name',
    defaultLabelName: '部门',
    title: '部门查询',
    placeholder: '部门查询选择',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/dc/mops/plan/erp-dept-list',
        method: 'get',
        params,
      });
    },
    rowKey: 'id',
    search: {
      config: {
        orgId: {
          label: '组织',
          paramKey: 'orgId',
          type: 'dc-select',
          props: {
            objectName: 'org',
            placeholder: '请选择',
          },
        },
        name: {
          label: '名称',
          paramKey: 'name',
          type: 'input',
          props: {
            placeholder: '请输入',
          },
        },
      },
    },
    column: [
      {
        label: '编码',
        prop: 'code',
      },
      {
        label: '名称',
        prop: 'name',
      },
      {
        label: '组织',
        prop: 'orgId',
        component: 'dc-view',
        objectName: 'org',
      },
      {
        label: '全称',
        prop: 'fullName',
      },
    ],
  },

  deptNew: {
    url: '/blade-bip/DcStaffLoanDept/select-data',
    defaultLabel: 'deptName',
    defaultLabelName: '部门名称',
    title: '部门选择',
    placeholder: '请输入部门名称选择',
    submitTitle: '部门',
    dialogGet: (params) => {
      return request({
        url: '/blade-bip/DcStaffLoanDept/list',
        method: 'get',
        params,
      });
    },
    column: [
      {
        label: '部门名称',
        prop: 'deptName',
      },

      {
        label: '部门审核人工号',
        prop: 'deptAuditorNo',
      },
      {
        label: '部门审核人名称',
        prop: 'deptAuditorName',
      },
    ],
  },
};

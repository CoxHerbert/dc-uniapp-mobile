<template>
  <div class="recruit-onboarding-self">
    <!-- <van-nav-bar
      :title="t('recruit.onboarding.selfForm.title')"
      left-arrow
      @click-left="handleBack"
    /> -->

    <div class="recruit-onboarding-self__body">
      <van-form ref="formRef" :show-error="false" @submit="handleSubmit">
        <section class="section">
          <div class="section__header">
            <header class="section__title">
              {{ t('recruit.onboarding.selfForm.sections.personal') }}
            </header>
            <LanguageSelector
              variant="compact"
              trigger-class="section__language-trigger"
              :title="t('recruit.onboarding.selfForm.fields.language')"
              :cancel-text="t('login.language.cancel')"
            />
          </div>
          <van-cell-group inset>
            <van-field
              name="avatarId"
              :label="t('recruit.onboarding.selfForm.fields.avatarId')"
              :rules="[
                {
                  validator: () => !!form.avatarId,
                  message: t('recruit.onboarding.selfForm.validation.avatarId'),
                },
              ]"
            >
              <template #input>
                <div class="uploader-inline" :class="{ 'is-readonly': isReadonly }">
                  <DcUploader
                    v-model="avatarModel"
                    :multiple="false"
                    :deletable="!isReadonly"
                    :disabled="isReadonly"
                    :show-type-hint="false"
                    :placeholder="t('recruit.onboarding.selfForm.placeholders.avatarId')"
                    accept="image/*"
                    @change="onUploaderChange('avatarId', $event)"
                  />
                </div>
              </template>
            </van-field>

            <van-field
              v-model="form.name"
              name="name"
              :label="t('recruit.onboarding.selfForm.fields.name')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.input')"
              :readonly="isReadonly"
              :rules="[
                { required: true, message: t('recruit.onboarding.selfForm.validation.name') },
              ]"
            />
            <van-field
              v-model="form.age"
              name="age"
              type="number"
              :label="t('recruit.onboarding.selfForm.fields.age')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.input')"
              :readonly="isReadonly"
              :rules="[
                { required: true, message: t('recruit.onboarding.selfForm.validation.age') },
              ]"
            />
            <van-field
              v-model="form.cardNo"
              name="cardNo"
              :label="t('recruit.onboarding.selfForm.fields.cardNo')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.input')"
              :readonly="isReadonly"
              :rules="[
                { required: true, message: t('recruit.onboarding.selfForm.validation.cardNo') },
              ]"
            />

            <van-field
              name="idCardFront"
              :label="t('recruit.onboarding.selfForm.fields.idCardFront')"
              :rules="[
                {
                  validator: () => !!form.idCardFront,
                  message: t('recruit.onboarding.selfForm.validation.idCardFront'),
                },
              ]"
            >
              <template #input>
                <div class="uploader-inline" :class="{ 'is-readonly': isReadonly }">
                  <DcUploader
                    v-model="idCardFrontModel"
                    :multiple="false"
                    :deletable="!isReadonly"
                    :disabled="isReadonly"
                    :show-type-hint="false"
                    accept="image/*"
                    :placeholder="t('recruit.onboarding.selfForm.placeholders.idCardFront')"
                    @change="onUploaderChange('idCardFront', $event)"
                  />
                </div>
              </template>
            </van-field>

            <van-field
              name="idCardBack"
              :label="t('recruit.onboarding.selfForm.fields.idCardBack')"
              :rules="[
                {
                  validator: () => !!form.idCardBack,
                  message: t('recruit.onboarding.selfForm.validation.idCardBack'),
                },
              ]"
            >
              <template #input>
                <div class="uploader-inline" :class="{ 'is-readonly': isReadonly }">
                  <DcUploader
                    v-model="idCardBackModel"
                    :multiple="false"
                    :deletable="!isReadonly"
                    :disabled="isReadonly"
                    :show-type-hint="false"
                    accept="image/*"
                    :placeholder="t('recruit.onboarding.selfForm.placeholders.idCardBack')"
                    @change="onUploaderChange('idCardBack', $event)"
                  />
                </div>
              </template>
            </van-field>

            <van-field
              v-model="form.mobile"
              name="mobile"
              type="tel"
              :label="t('recruit.onboarding.selfForm.fields.mobile')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.input')"
              :readonly="isReadonly"
              :rules="[
                { required: true, message: t('recruit.onboarding.selfForm.validation.mobile') },
              ]"
            />
            <van-field
              v-model="form.passportNumber"
              name="passportNumber"
              :label="t('recruit.onboarding.selfForm.fields.passportNumber')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.input')"
              :readonly="isReadonly"
              :rules="[
                {
                  required: true,
                  message: t('recruit.onboarding.selfForm.validation.passportNumber'),
                },
              ]"
            />
            <van-field
              name="nation"
              :model-value="displayLabel(form.nation, nationalityColumns)"
              :label="t('recruit.onboarding.selfForm.fields.nation')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.select')"
              is-link
              readonly
              :rules="[
                {
                  validator: () => !!form.nation,
                  message: t('recruit.onboarding.selfForm.validation.nation'),
                },
              ]"
              @click="openPicker('nation')"
            />
            <van-field
              v-model="form.address"
              name="address"
              :label="t('recruit.onboarding.selfForm.fields.address')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.input')"
              :readonly="isReadonly"
              :rules="[
                { required: true, message: t('recruit.onboarding.selfForm.validation.address') },
              ]"
            />
            <van-field
              name="education"
              :model-value="displayLabel(form.education, educationColumns)"
              :label="t('recruit.onboarding.selfForm.fields.education')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.select')"
              is-link
              readonly
              :rules="[
                {
                  validator: () => !!form.education,
                  message: t('recruit.onboarding.selfForm.validation.education'),
                },
              ]"
              @click="openPicker('education')"
            />
            <van-field
              v-model="form.graduateSchool"
              name="graduateSchool"
              :label="t('recruit.onboarding.selfForm.fields.graduateSchool')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.input')"
              :readonly="isReadonly"
              :rules="[
                {
                  required: true,
                  message: t('recruit.onboarding.selfForm.validation.graduateSchool'),
                },
              ]"
            />
          </van-cell-group>
        </section>

        <section class="section">
          <header class="section__title mb8">
            {{ t('recruit.onboarding.selfForm.sections.work') }}
          </header>
          <van-cell-group inset>
            <van-field
              name="companyId"
              :model-value="form.companyDict"
              :label="t('recruit.onboarding.selfForm.fields.company')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.select')"
              is-link
              readonly
              :rules="[
                {
                  validator: () => !!form.companyId,
                  message: t('recruit.onboarding.selfForm.validation.company'),
                },
              ]"
              @click="openPicker('company')"
            />
            <van-field
              name="jobGradeDictCode"
              :model-value="form.positionDict"
              :label="t('recruit.onboarding.selfForm.fields.position')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.select')"
              is-link
              readonly
              :rules="[
                {
                  validator: () => !!form.jobGradeDictCode,
                  message: t('recruit.onboarding.selfForm.validation.position'),
                },
              ]"
              @click="openPicker('position')"
            />
            <van-field
              name="workYear"
              :model-value="displayLabel(form.workYear, workYearColumns)"
              :label="t('recruit.onboarding.selfForm.fields.workYear')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.select')"
              is-link
              readonly
              :rules="[
                {
                  validator: () => !!form.workYear,
                  message: t('recruit.onboarding.selfForm.validation.workYear'),
                },
              ]"
              @click="openPicker('workYear')"
            />
            <van-field
              name="isAccommodation"
              :model-value="displayLabel(form.isAccommodation, accommodationColumns)"
              :label="t('recruit.onboarding.selfForm.fields.isAccommodation')"
              :placeholder="t('recruit.onboarding.selfForm.placeholders.select')"
              is-link
              readonly
              :rules="[
                {
                  validator: () => !!form.isAccommodation,
                  message: t('recruit.onboarding.selfForm.validation.isAccommodation'),
                },
              ]"
              @click="openPicker('accommodation')"
            />
          </van-cell-group>
        </section>

        <van-field name="__dummy" class="hidden-field" />
      </van-form>
    </div>

    <footer v-if="!isReadonly" class="recruit-onboarding-self__footer">
      <van-button type="primary" block round :loading="submitting" @click="submitForm">
        {{ t('recruit.onboarding.selfForm.actions.submit') }}
      </van-button>
    </footer>

    <van-popup v-model:show="showPicker.nation" position="bottom">
      <van-picker
        :columns="nationPickerColumns"
        @cancel="showPicker.nation = false"
        @confirm="({ selectedOptions }) => onPickerConfirm('nation', selectedOptions)"
      />
    </van-popup>
    <van-popup v-model:show="showPicker.education" position="bottom">
      <van-picker
        :columns="educationColumns"
        @cancel="showPicker.education = false"
        @confirm="({ selectedOptions }) => onPickerConfirm('education', selectedOptions)"
      />
    </van-popup>
    <van-popup v-model:show="showPicker.workYear" position="bottom">
      <van-picker
        :columns="workYearColumns"
        @cancel="showPicker.workYear = false"
        @confirm="({ selectedOptions }) => onPickerConfirm('workYear', selectedOptions)"
      />
    </van-popup>
    <van-popup v-model:show="showPicker.accommodation" position="bottom">
      <van-picker
        :columns="accommodationColumns"
        @cancel="showPicker.accommodation = false"
        @confirm="({ selectedOptions }) => onPickerConfirm('accommodation', selectedOptions)"
      />
    </van-popup>
    <van-popup v-model:show="showPicker.company" position="bottom">
      <van-picker
        :columns="companyColumns"
        @cancel="showPicker.company = false"
        @confirm="({ selectedOptions }) => onPickerConfirm('company', selectedOptions)"
      />
    </van-popup>
    <van-popup v-model:show="showPicker.position" position="bottom">
      <van-picker
        :columns="positionColumns"
        @cancel="showPicker.position = false"
        @confirm="({ selectedOptions }) => onPickerConfirm('position', selectedOptions)"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { showToast } from 'vant';
import Api from '@/api';
import { useUserStore } from '@/store/user';
import { useDictStore } from '@/store/dict';
import DcUploader from '@/components/dc-ui/components/Uploader/index.vue';
import { goBackOrHome } from '@/utils/navigation';
import {
  EDUCATION_OPTIONS,
  WORK_YEAR_OPTIONS,
  ACCOMMODATION_OPTIONS,
  NATIONALITY_OPTIONS,
} from './options';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const userStore = useUserStore();
const dictStore = useDictStore();

const handleBack = () => {
  goBackOrHome(router);
};

const formRef = ref();
const submitting = ref(false);

const form = reactive({
  id: null,
  avatarId: '',
  name: 'zn b',
  age: '18',
  cardNo: '330225199907304839',
  idCardFront: '',
  idCardBack: '',
  mobile: '15824423899',
  nation: '汉族',
  address: '测试街道',
  education: '初中及以下',
  graduateSchool: '小学生',
  passportNumber: 'huzhao001',
  companyId: '1901902647122264066',
  companyDict: '昌科',
  jobGradeDictCode: '0',
  positionDict: '钳工',
  workYear: '1年以下',
  isAccommodation: '是',
  applyStatus: '',
});

const avatarModel = ref('');
const idCardFrontModel = ref('');
const idCardBackModel = ref('');

const showPicker = reactive({
  nation: false,
  education: false,
  workYear: false,
  accommodation: false,
  company: false,
  position: false,
});

const companyOptions = ref([]);
const positionOptions = ref([]);

const mode = computed(() => String(route.query?.mode || '').toLowerCase());
const isReadonly = computed(() => mode.value === 'look' || mode.value === 'view');
const isReapply = computed(() => mode.value === 'reapply');

const educationColumns = computed(() =>
  EDUCATION_OPTIONS.map((item) => ({ text: t(item.labelKey), value: item.value }))
);
const workYearColumns = computed(() =>
  WORK_YEAR_OPTIONS.map((item) => ({ text: t(item.labelKey), value: item.value }))
);
const accommodationColumns = computed(() =>
  ACCOMMODATION_OPTIONS.map((item) => ({ text: t(item.labelKey), value: item.value }))
);
const nationalityColumns = computed(() =>
  NATIONALITY_OPTIONS.map((item) => ({ text: item.value, value: item.value }))
);
const nationPickerColumns = computed(() => nationalityColumns.value);

const companyColumns = computed(() =>
  companyOptions.value.map((item) => ({
    text: item.label || item.name || item.text,
    value: item.value || item.id,
  }))
);
const positionColumns = computed(() =>
  positionOptions.value.map((item) => ({ text: item.label || item.name, value: item.value }))
);

const ensureUserInfo = async () => {
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo();
    } catch (err) {
      console.error('Failed to fetch user info', err);
    }
  }
  return userStore.userInfo;
};

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.list)) return payload.list;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const loadCompanyList = async () => {
  try {
    const res = await Api.recruit.onboarding.getLaborCompanyList({ current: 1, size: 500 });
    const payload = res?.data?.data || res?.data || {};
    const list = extractList(payload);
    companyOptions.value = list.map((item) => ({
      label: item?.name || item?.label || item?.dictValue,
      value: item?.id || item?.value || item?.dictKey,
    }));
  } catch (err) {
    console.error('Failed to load labor companies', err);
  }
};

const loadPositionOptions = async () => {
  try {
    const list = await dictStore.get('DC_LABOR_POSITION');
    positionOptions.value = (list || []).map((item) => ({
      label: item.label,
      value: item.value,
    }));
  } catch (err) {
    console.error('Failed to load labor positions', err);
  }
};

const syncUploaderFromForm = () => {
  avatarModel.value = form.avatarId || '';
  idCardFrontModel.value = form.idCardFront || '';
  idCardBackModel.value = form.idCardBack || '';
};

const loadLaborRegisterDetail = async () => {
  const userInfo = await ensureUserInfo();
  const createUser = userInfo?.userId || userInfo?.id;
  if (!createUser) return;

  try {
    const res = await Api.recruit.onboarding.getLaborRegisterDetail({ createUser });
    const payload = res?.data?.data || res?.data || null;
    if (payload) {
      Object.assign(form, payload);
      if (isReapply.value) {
        form.id = null;
        form.applyStatus = '';
      }
      const company = companyOptions.value.find(
        (item) => String(item.value) === String(form.companyId)
      );
      form.companyDict = company?.label || payload.companyDict || '';
      const position = positionOptions.value.find(
        (item) => String(item.value) === String(form.jobGradeDictCode)
      );
      form.positionDict = position?.label || payload.positionDict || '';
      syncUploaderFromForm();
    }
  } catch (err) {
    console.error('Failed to load labor register detail', err);
  }
};

const openPicker = (type) => {
  if (isReadonly.value) return;
  showPicker[type] = true;
};

const onPickerConfirm = (type, selectedOptions = []) => {
  const option = selectedOptions?.[0];
  if (!option) {
    showPicker[type] = false;
    return;
  }
  const { value, text } = option;
  if (type === 'company') {
    form.companyId = value;
    form.companyDict = text;
  } else if (type === 'position') {
    form.jobGradeDictCode = value;
    form.positionDict = text;
  } else if (type === 'education') {
    form.education = value;
  } else if (type === 'workYear') {
    form.workYear = value;
  } else if (type === 'accommodation') {
    form.isAccommodation = value;
  } else if (type === 'nation') {
    form.nation = value;
  }
  showPicker[type] = false;
};

const displayLabel = (value, columns) => {
  const col = (columns || []).find((item) => String(item.value) === String(value));
  return col ? col.text : value;
};

const onUploaderChange = (key, files) => {
  const first = Array.isArray(files) ? files[0] : files;
  const link = first?.link || first?.path || '';
  form[key] = link;
};

watch(
  () => form.avatarId,
  (val) => {
    if (!val) avatarModel.value = '';
  }
);
watch(
  () => form.idCardFront,
  (val) => {
    if (!val) idCardFrontModel.value = '';
  }
);
watch(
  () => form.idCardBack,
  (val) => {
    if (!val) idCardBackModel.value = '';
  }
);

const submitForm = () => {
  if (isReadonly.value) return;
  formRef.value?.submit();
};

const handleSubmit = async () => {
  if (isReadonly.value) return;
  const userInfo = await ensureUserInfo();
  const oauthId = userInfo?.oauthId || userInfo?.oauth_id;
  const userId = userInfo?.userId || userInfo?.id;
  if (!userId) {
    showToast(t('recruit.onboarding.selfForm.messages.missingUser'));
    return;
  }

  const payload = {
    ...form,
    oauthId,
    userId,
  };

  if (!payload.applyStatus) {
    payload.applyStatus = '待初试';
  }

  submitting.value = true;
  try {
    if (payload.id) {
      await Api.recruit.onboarding.updateLaborRegister(payload);
      showToast(t('recruit.onboarding.selfForm.messages.updateSuccess'));
      router.replace({ name: 'recruit-onboarding-audit-result' });
    } else {
      await Api.recruit.onboarding.createLaborRegister(payload);
      showToast(t('recruit.onboarding.selfForm.messages.createSuccess'));
      router.replace({ name: 'recruit-onboarding-success' });
    }
  } catch (err) {
    console.error('Failed to submit onboarding form', err);
    showToast(err?.message || t('common.errors.system'));
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadCompanyList(), loadPositionOptions()]);
  await loadLaborRegisterDetail();
  if (isReadonly.value) {
    syncUploaderFromForm();
  }
});
</script>

<style scoped lang="scss">
.recruit-onboarding-self {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 12px 80px;
    box-sizing: border-box;
    .mb8 {
      margin-bottom: 8px;
    }
    :deep(.van-cell-group) {
      margin: 0;
    }
  }

  &__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px);
    background: #fff;
    box-shadow: 0 -4px 12px rgba(31, 41, 55, 0.1);
  }
}

.section {
  margin-bottom: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 8px 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin: 0;
    flex: 1;
  }

  :deep(.section__language-trigger) {
    margin: 0;
    font-size: 12px;
    color: #2563ff;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 4px 12px rgba(37, 99, 255, 0.18);
    flex-shrink: 0;
  }
}

.uploader-inline {
  width: 100%;
  &.is-readonly {
    pointer-events: none;
  }

  :deep(.dc-uploader) {
    width: 100%;
  }
}

.hidden-field {
  display: none;
}
</style>

<template>
  <div class="page mine">
    <div class="top-bg"></div>
    <van-nav-bar :title="t('me.navTitle')" :border="false" class="mine-nav" safe-area-inset-top />
    <section class="profile-card">
      <div class="bg-index bg-index-2"></div>
      <div class="bg-index bg-index-1"></div>

      <!-- 合并后的容器：profile-top + stats -->
      <div class="profile-meta">
        <div class="profile-top">
          <div class="userinfo-wrap">
            <div class="userinfo-wrap-left">
              <div class="avatar-and-userinfo">
                <img
                  class="avatar"
                  :src="user.avatar || defaultAvatar"
                  alt="avatar"
                  @error="onAvatarError"
                />
                <div class="col">
                  <span class="name">{{
                    user.realName || user.name || user.username || t('me.profile.unnamed')
                  }}</span>
                  <span class="uid">{{ user.account || '-' }}</span>
                </div>
              </div>

              <!-- ✨ 角色标签：超过4个显示“展开/收起” -->
              <div v-if="roleTags.length" class="tags" :class="{ 'is-expanded': tagsExpanded }">
                <span v-for="(tag, idx) in displayRoleTags" :key="idx" class="tag">{{ tag }}</span>

                <!-- 展开/收起切换按钮（仅当超过最大显示数时出现） -->
                <button v-if="hasMoreTags" type="button" class="tag tag-toggle" @click="toggleTags">
                  <span>{{ tagsExpanded ? '收起' : '展开' }}</span>
                  <van-icon :name="tagsExpanded ? 'arrow-up' : 'arrow-down'" size="12" />
                </button>
              </div>
            </div>

            <div class="points-card" @click="navigateToRoute('mePoints')">
              <span class="points-label">{{ t('me.dashboard.pointsLabel') }}</span>
              <span class="points-val">{{ stats.pointsDisplay }}</span>
            </div>
          </div>
        </div>

        <div class="stats">
          <button
            v-for="metric in metrics"
            :key="metric.key"
            type="button"
            class="stat"
            @click="navigateToRoute(metric.routeName)"
          >
            <span class="stat-label">{{ metric.label }}</span>
            <span class="stat-num">{{ metric.display }}</span>
          </button>
        </div>
      </div>

      <!-- ✅ 红框样式：胶囊条 + 右侧白色斜切缺口 -->
      <div class="join-strip">
        <span class="join-strip-text">{{ joinDaysText }}</span>
      </div>
    </section>

    <section class="card punch-card" @click="navigateToRoute('mePunch')">
      <div class="card-title-row">
        <span class="card-title">{{ t('me.dashboard.todayPunch.title') }}</span>
      </div>
      <div v-if="punchRecords.length" class="timeline">
        <div v-for="(time, index) in punchRecords" :key="index" class="tl-item">
          <div class="tl-left">
            <span class="dot done"></span>
            <span v-if="index !== punchRecords.length - 1" class="line"></span>
          </div>
          <div class="tl-content">
            <div class="tl-title">{{ t('me.dashboard.todayPunch.timeLabel') }}</div>
            <div class="tl-time">{{ time }}</div>
          </div>
        </div>
      </div>
      <div v-else class="timeline-empty">{{ t('me.dashboard.todayPunch.empty') }}</div>
    </section>

    <section class="card func-card">
      <div class="card-title-row">
        <span class="card-title">{{ t('me.dashboard.functions.title') }}</span>
      </div>
      <div class="func-grid">
        <div
          v-for="item in functionItems"
          :key="item.key"
          class="func-item"
          @click="handleFunction(item)"
        >
          <img class="func-icon" :src="item.icon" :alt="item.label" loading="lazy" />
          <span class="func-text">{{ item.label }}</span>
        </div>
      </div>
    </section>

    <LanguageSelector />

    <van-cell-group inset class="mt12">
      <van-cell :title="t('me.cells.position')" :value="postText" />
      <van-cell :title="t('me.cells.role')" :value="roleText" />
      <van-cell :title="t('me.cells.joinedDate')" :value="joinedDateText" />
      <van-cell :title="t('me.cells.email')" :value="user.email || '-'" />
    </van-cell-group>

    <van-cell-group inset class="mt12">
      <van-cell :title="t('me.actions.settings')" is-link @click="goToSettings" />
      <van-cell :title="t('me.actions.changePassword')" is-link @click="openPwdPopup" />
      <van-cell :title="t('me.actions.logout')" is-link @click="confirmLogout" />
    </van-cell-group>

    <van-popup
      v-model:show="pwd.show"
      position="bottom"
      round
      closeable
      :style="{ height: 'auto' }"
    >
      <div class="sheet">
        <div class="sheet-title">{{ t('me.form.title') }}</div>
        <van-form ref="pwdFormRef" @submit="submitChangePwd">
          <van-field
            v-model="pwd.oldPassword"
            type="password"
            :label="t('me.form.oldPassword.label')"
            :placeholder="t('me.form.oldPassword.placeholder')"
            :rules="[{ required: true, message: t('me.form.oldPassword.placeholder') }]"
            clearable
          />
          <van-field
            v-model="pwd.newPassword"
            type="password"
            :label="t('me.form.newPassword.label')"
            :placeholder="t('me.form.newPassword.placeholder')"
            :rules="[
              { required: true, message: t('me.form.newPassword.placeholder') },
              { validator: validateNewPwd, message: t('me.validation.newPassword') },
            ]"
            clearable
          />
          <van-field
            v-model="pwd.confirmPassword"
            type="password"
            :label="t('me.form.confirmPassword.label')"
            :placeholder="t('me.form.confirmPassword.placeholder')"
            :rules="[
              { validator: validateConfirmPwd, message: t('me.validation.confirmPassword') },
            ]"
            clearable
          />
          <div class="action">
            <van-button type="default" block class="mr8" @click="pwd.show = false">{{
              t('me.form.cancel')
            }}</van-button>
            <van-button type="primary" block native-type="submit" :loading="pwd.loading">{{
              t('me.form.confirm')
            }}</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Api from '@/api';

const { proxy } = getCurrentInstance();
const workTimeIcon = proxy.$assetUrl('/images/me/worktime.svg');
const punchRecordIcon = proxy.$assetUrl('/images/me/card.svg');
const router = useRouter();
const auth = useAuthStore();
const userStore = useUserStore();
const { t } = useI18n();

const user = computed(() => userStore.userInfo || {});
const userH5 = ref({});

const stats = computed(() => {
  const info = userH5.value || {};
  const toNumber = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : 0;
  };
  const rawPunches = Array.isArray(info.punchCardDetail) ? info.punchCardDetail : [];
  const punches = rawPunches.map((item) => String(item));
  const points = toNumber(info.points);

  return {
    points,
    pointsDisplay: points.toLocaleString(),
    leaveDays: toNumber(info.leaveDateCount),
    travelDays: toNumber(info.travelDateCount),
    overtimeHours: toNumber(info.overDateCount),
    joinDays: toNumber(info.joinDateCount),
    punchRecords: punches,
  };
});

const joinDaysText = computed(() =>
  t('me.dashboard.joinDays', { days: stats.value.joinDays || 0 })
);

const metrics = computed(() => [
  {
    key: 'leave',
    label: t('me.dashboard.metrics.leave'),
    value: stats.value.leaveDays,
    display: stats.value.leaveDays.toLocaleString(),
    // routeName: 'meLeave',
  },
  {
    key: 'travel',
    label: t('me.dashboard.metrics.travel'),
    value: stats.value.travelDays,
    display: stats.value.travelDays.toLocaleString(),
    // routeName: 'meTravel',
  },
  {
    key: 'overtime',
    label: t('me.dashboard.metrics.overtime'),
    value: stats.value.overtimeHours,
    display: stats.value.overtimeHours.toLocaleString(),
    // routeName: 'meOvertime',
  },
]);

const punchRecords = computed(() => stats.value.punchRecords || []);

const functionItems = computed(() => [
  {
    key: 'workTime',
    label: t('me.dashboard.functions.items.workTime'),
    icon: workTimeIcon,
    routeName: 'meWorkTime',
  },
  {
    key: 'punchRecord',
    label: t('me.dashboard.functions.items.punchRecord'),
    icon: punchRecordIcon,
    // routeName: 'mePunchRecord',
  },
]);

function navigateToRoute(name) {
  if (!name) return;
  if (typeof router.hasRoute === 'function' && !router.hasRoute(name)) return;
  router.push({ name });
}

function goToSettings() {
  router.push({ name: 'settings' });
}
function handleFunction(item) {
  if (item) navigateToRoute(item.routeName);
}

const toArrayValue = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((i) => String(i).trim()).filter(Boolean);
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};
const toNiceText = (v) => toArrayValue(v).join('、') || '';

const roleTags = computed(() => {
  const tags = toArrayValue(user.value.roleNames);
  return tags.length ? tags : toArrayValue(user.value.roleName);
});
const roleText = computed(
  () => toNiceText(user.value.roleNames) || toNiceText(user.value.roleName) || '-'
);
const postText = computed(
  () => toNiceText(user.value.postNames) || toNiceText(user.value.postName) || '-'
);
const joinedDateText = computed(() =>
  user.value.joinedDate ? String(user.value.joinedDate).split(' ')[0] : '-'
);

const defaultAvatar = proxy.$assetUrl('/images/logo.png');
const onAvatarError = (e) => (e.target.src = defaultAvatar);

/** ===== 角色标签展开/收起（阈值=4） ===== */
const tagsExpanded = ref(false);
const MAX_VISIBLE_TAGS = 3; // 仅改这一行为 4
const hasMoreTags = computed(() => roleTags.value.length > MAX_VISIBLE_TAGS);
const displayRoleTags = computed(() =>
  tagsExpanded.value ? roleTags.value : roleTags.value.slice(0, MAX_VISIBLE_TAGS)
);
function toggleTags() {
  tagsExpanded.value = !tagsExpanded.value;
}
/** ===== /角色标签展开/收起 ===== */

const pwd = reactive({
  show: false,
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  loading: false,
});
const pwdFormRef = ref();

function openPwdPopup() {
  pwd.show = true;
}
function validateNewPwd(v) {
  return String(v || '').length >= 6;
}
function validateConfirmPwd(v) {
  return v === pwd.newPassword && !!v;
}

async function submitChangePwd() {
  if (!validateNewPwd(pwd.newPassword)) return showToast(t('me.validation.newPassword'));
  if (!validateConfirmPwd(pwd.confirmPassword))
    return showToast(t('me.validation.confirmPassword'));
  try {
    pwd.loading = true;
    await userStore.changePassword({ oldPassword: pwd.oldPassword, newPassword: pwd.newPassword });
    showToast(t('me.toast.changePasswordSuccess'));
    pwd.show = false;
    pwd.oldPassword = '';
    pwd.newPassword = '';
    pwd.confirmPassword = '';
  } catch (err) {
    showToast(err?.message || t('me.toast.changePasswordFail'));
  } finally {
    pwd.loading = false;
  }
}

async function confirmLogout() {
  try {
    await showConfirmDialog({
      title: t('me.dialog.logoutTitle'),
      message: t('me.dialog.logoutMessage'),
      confirmButtonText: t('me.form.confirm'),
      cancelButtonText: t('me.form.cancel'),
    });
    await doLogout();
  } catch {}
}

async function doLogout(force = false) {
  auth.logout();
  router.replace(force ? { path: '/login', query: { relogin: 1 } } : { path: '/login' });
}

onMounted(() => {
  Api.user.getH5UserInfo().then((res) => {
    const { code, data } = res.data;
    if (code === 200) userH5.value = data;
  });
});
</script>

<style lang="scss" scoped>
$primary: #3060ed;
$text-main: #1f2b3d;
$text-sub: #8c9aaf;
$shadow-card: 0 12px 36px rgba(25, 81, 230, 0.08);

.page.mine {
  position: relative;
  margin: 0 auto;
  max-width: 750px;
  padding: 0 0 120px;
  padding-bottom: calc(120px + constant(safe-area-inset-bottom));
  padding-bottom: calc(120px + env(safe-area-inset-bottom));
  background: #f6f7fb;

  .top-bg {
    position: absolute;
    inset: 0 0 auto 0;
    height: 240px;
    background: linear-gradient(
      180deg,
      $primary 0%,
      rgba(48, 96, 237, 0.3) 64%,
      rgba(48, 96, 237, 0) 100%
    );
    z-index: 0;
  }

  .mine-nav {
    background: transparent;
    color: #fff;
    --van-nav-bar-title-text-color: #fff;
    --van-nav-bar-icon-color: #fff;
    --van-nav-bar-text-color: #fff;
  }

  .profile-card {
    position: relative;
    margin: 40px 12px 0;
    background: #fff;
    border-radius: 12px;
    box-shadow: $shadow-card;
    z-index: 1;

    .bg-index {
      position: absolute;
      top: -12px;
      left: 0;
      width: calc(100% - 16px);
      height: 230px;
      background: rgba(255, 255, 255, 0.35);
      border-radius: 12px;
      transform-origin: center;

      &-1 {
        z-index: -1;
        transform: rotate(-4deg);
      }
      &-2 {
        z-index: -2;
        transform: rotate(-8deg);
      }
    }

    .profile-meta {
      padding: 20px;
      padding-bottom: 0;
      display: grid;
      grid-template-rows: auto auto;

      .profile-top {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .userinfo-wrap {
          display: flex;
          align-items: stretch;
          gap: 16px;

          .userinfo-wrap-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;

            .avatar-and-userinfo {
              display: flex;
              align-items: center;
              gap: 12px;

              .avatar {
                width: 44px;
                height: 44px;
                border-radius: 9px;
                object-fit: cover;
                border: 1px solid #dadbe0;
                background: #f2f3f5;
              }

              .col {
                display: flex;
                flex-direction: column;
                gap: 6px;
                .name {
                  font-size: 18px;
                  font-weight: 700;
                  color: $text-main;
                }
                .uid {
                  font-size: 13px;
                  color: $text-sub;
                }
              }
            }

            /* ===== 角色标签（支持展开/收起） ===== */
            .tags {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              .tag {
                padding: 4px 10px;
                border-radius: 12px;
                background: #baccff;
                color: $primary;
                font-size: 12px;
                line-height: 1;
              }
              .tag-toggle {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: rgba(48, 96, 237, 0.12);
                border: 1px solid rgba(48, 96, 237, 0.25);
              }
            }
            /* ===== /角色标签 ===== */
          }

          .points-card {
            width: 66px;
            min-width: 66px;
            height: 66px;
            border-radius: 12px;
            background: $primary;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border: none;
            cursor: pointer;
            .points-label {
              font-size: 12px;
              opacity: 0.85;
            }
            .points-val {
              font-size: 24px;
              font-weight: 700;
            }
          }
        }
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 0;

        .stat {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 16px 0;
          background: transparent;
          border-radius: 16px;
          border: none;
          color: $text-main;
          cursor: pointer;
          .stat-label {
            font-size: 13px;
            color: $text-sub;
            text-align: center;
          }
          .stat-num {
            font-size: 26px;
            font-weight: 700;
          }
        }
      }
    }

    /* ===== 红框样式：join-strip ===== */
    .join-strip {
      position: relative;
      width: 100%;
      height: 30px;
      overflow: hidden;
      background-image: url('/public/images/me/join-strip.svg');
      background-repeat: no-repeat;
      background-size: cover;
      border-radius: 0 0 12px 12px;

      .join-strip-tail {
        position: absolute;
        right: 6px;
        top: 0;
        width: 14px;
        height: 100%;
        border-top-right-radius: 12px;
        border-bottom-right-radius: 12px;
        z-index: 3;
        pointer-events: none;
      }

      .join-strip-text {
        position: relative;
        z-index: 4;
        height: 100%;
        padding: 0 24px;
        display: flex;
        align-items: center;
        color: #fff;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    /* ===== /join-strip ===== */
  }

  .card {
    position: relative;
    margin: 12px;
    background: #fff;
    border-radius: 12px;
    box-shadow: $shadow-card;
    padding: 20px 24px;
  }
  .punch-card {
    cursor: pointer;
  }

  .card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-main;
    }
    .arrow {
      color: #c5ccda;
    }
  }

  .timeline {
    margin-top: 16px;

    .tl-item {
      display: flex;
      gap: 12px;
      & + .tl-item {
        margin-top: 12px;
      }

      .tl-left {
        display: flex;
        flex-direction: column;
        align-items: center;
        .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1d65f3;
          border: 4px solid #b4cdff;
          box-sizing: border-box;
        }
        .line {
          flex: 1;
          width: 2px;
          margin-top: 6px;
          border-left: 1px dashed #bbbbbb;
        }
      }

      .tl-content {
        flex: 1;
        .tl-title {
          font-size: 13px;
          color: #5f6b7a;
        }
        .tl-time {
          margin-top: 4px;
          font-size: 16px;
          color: $text-main;
          font-weight: 500;
        }
      }
    }

    .timeline-empty {
      margin-top: 16px;
      font-size: 13px;
      color: #9aa2b1;
    }
  }

  .func-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;

    .func-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      border-radius: 16px;
      border: none;
      cursor: pointer;
      .func-icon {
        width: 28px;
        height: 28px;
        color: $primary;
        object-fit: contain;
      }
      .func-text {
        font-size: 14px;
        color: #353638;
      }
    }
  }

  .mt12 {
    margin: 12px 16px 0;
  }

  .sheet {
    padding: 16px;
    .sheet-title {
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .action {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 16px 0 8px;
      .mr8 {
        margin-right: 0;
      }
    }
  }
}

button {
  font: inherit;
  border: none;
  padding: 0;
}
</style>

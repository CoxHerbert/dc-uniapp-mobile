<template>
  <div class="wf-map-dialog">
    <header class="wf-map-dialog__header">
      <button type="button" class="wf-map-dialog__back" @click="handleClose">
        <van-icon name="arrow-left" />
      </button>
      <h2 class="wf-map-dialog__title">选择地址</h2>
      <button type="button" class="wf-map-dialog__reset" @click="handleClear">清空</button>
    </header>
    <van-search
      v-model="searchValue"
      placeholder="搜索地点"
      :show-action="false"
      shape="round"
      @search="handleSearch"
      @update:model-value="handleSearchInput"
      @clear="handleSearchClear"
    />
    <section class="wf-map-dialog__body">
      <div class="wf-map-dialog__map">
        <div ref="mapEl" class="wf-map-dialog__map-canvas"></div>
        <div class="wf-map-dialog__cursor">
          <img :src="locationIcon" alt="location" />
        </div>
        <button type="button" class="wf-map-dialog__current" @click="useCurrentLocation">
          <img :src="currentIcon" alt="current" />
        </button>
        <div v-if="!mapReady" class="wf-map-dialog__loading">
          <van-loading size="24px" />
        </div>
      </div>
      <div v-if="list.length" class="wf-map-dialog__list">
        <div
          v-for="(item, index) in list"
          :key="item.id || index"
          :class="['wf-map-dialog__item', { 'wf-map-dialog__item--active': index === current }]"
          @click="onSelect(index)"
        >
          <div class="wf-map-dialog__item-main">
            <p class="wf-map-dialog__item-title">{{ item.title }}</p>
            <p class="wf-map-dialog__item-address">{{ item.address }}</p>
          </div>
          <van-icon
            :name="index === current ? 'success' : 'circle'"
            class="wf-map-dialog__item-icon"
          />
        </div>
      </div>
      <div v-else class="wf-map-dialog__empty">暂无地点数据</div>
    </section>
    <footer class="wf-map-dialog__footer">
      <van-button type="primary" block @click="handleSubmit">确定</van-button>
    </footer>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Search, Button, Loading, Icon, showToast } from 'vant';
import jsonp from '../../../util/jsonp.js';
import md5 from 'md5';

let tMapLoader;

function loadTMapScript(key) {
  if (typeof window === 'undefined') return Promise.reject(new Error('window is undefined'));
  if (window.TMap) return Promise.resolve(window.TMap);
  if (tMapLoader) return tMapLoader;
  tMapLoader = new Promise((resolve, reject) => {
    const callbackName = `tMapInit_${Date.now()}`;
    window[callbackName] = () => {
      resolve(window.TMap);
      delete window[callbackName];
    };
    const script = document.createElement('script');
    script.src = `https://map.qq.com/api/gljs?v=1.exp&libraries=service&key=${key}&callback=${callbackName}`;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('地图脚本加载失败'));
    };
    document.head.appendChild(script);
  });
  return tMapLoader;
}

export default defineComponent({
  name: 'WfMapDialog',
  components: {
    [Search.name]: Search,
    [Button.name]: Button,
    [Loading.name]: Loading,
    [Icon.name]: Icon,
  },
  props: {
    show: Boolean,
    value: {
      type: [String, Array],
      default: '',
    },
    mapKey: {
      type: String,
      required: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
  },
  emits: ['confirm', 'clear', 'close'],
  data() {
    return {
      latitude: 39.903811,
      longitude: 116.397915,
      map: null,
      mapReady: false,
      searchValue: '',
      list: [],
      current: -1,
      result: [],
    };
  },
  computed: {
    locationIcon() {
      return new URL('../images/location.png', import.meta.url).href;
    },
    currentIcon() {
      return new URL('../images/current.png', import.meta.url).href;
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.$nextTick(() => {
          this.ensureMap();
        });
      }
    },
    value: {
      handler(val) {
        this.applyValue(val);
      },
      immediate: true,
    },
  },
  methods: {
    ensureMap() {
      if (this.mapReady) {
        this.syncCenter();
        return;
      }
      loadTMapScript(this.mapKey)
        .then((TMap) => {
          const center = new TMap.LatLng(this.latitude, this.longitude);
          this.map = new TMap.Map(this.$refs.mapEl, {
            center,
            zoom: 16,
            viewMode: '2D',
          });
          this.map.on('dragend', this.handleCenterChange);
          this.map.on('zoomend', this.handleCenterChange);
          this.mapReady = true;
          this.syncCenter();
        })
        .catch((error) => {
          showToast({ message: error.message || '地图初始化失败', type: 'fail' });
          this.handleClose();
        });
    },
    syncCenter() {
      if (!this.map || !this.mapReady) return;
      if (this.result.length === 3) {
        this.updateMapCenter(Number(this.result[1]), Number(this.result[0]));
      } else {
        this.useCurrentLocation();
      }
    },
    updateMapCenter(lat, lng) {
      if (!this.map) return;
      const TMap = window.TMap;
      const center = new TMap.LatLng(lat, lng);
      this.map.setCenter(center);
      this.fetchAddress(lat, lng);
    },
    handleCenterChange() {
      if (!this.map) return;
      const center = this.map.getCenter();
      const lat = center.getLat();
      const lng = center.getLng();
      this.fetchAddress(lat, lng);
    },
    fetchAddress(lat, lng) {
      this.latitude = lat;
      this.longitude = lng;
      jsonp(
        `https://apis.map.qq.com${this.sign('/ws/geocoder/v1/', {
          key: this.mapKey,
          location: `${lat},${lng}`,
          coord_type: 5,
          get_poi: 0,
          output: 'jsonp',
        })}`
      )
        .then((res) => {
          if (res.status === 0) {
            this.searchValue = res.result.formatted_addresses.recommend;
            this.result = [lng, lat, this.searchValue];
            this.current = -1;
          } else {
            showToast({ message: res.message || '定位失败', type: 'fail' });
          }
        })
        .catch((err) => {
          showToast({ message: err || '定位失败', type: 'fail' });
        });
    },
    useCurrentLocation() {
      if (!navigator.geolocation) {
        showToast({ message: '浏览器不支持定位', type: 'fail' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          this.updateMapCenter(latitude, longitude);
        },
        () => {
          showToast({ message: '获取定位失败', type: 'fail' });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    },
    handleSearchInput(val) {
      this.searchValue = val;
      if (!val) {
        this.list = [];
        this.current = -1;
      }
    },
    handleSearchClear() {
      this.searchValue = '';
      this.list = [];
      this.current = -1;
    },
    handleSearch(value) {
      const keyword = value || this.searchValue;
      if (!keyword) {
        this.list = [];
        return;
      }
      jsonp(
        `https://apis.map.qq.com${this.sign('/ws/place/v1/search', {
          keyword,
          key: this.mapKey,
          boundary: `nearby(${this.latitude},${this.longitude},1000,1)`,
          orderby: '_distance',
          page_size: 20,
          page_index: 1,
          output: 'jsonp',
        })}`
      )
        .then((res) => {
          if (res.status === 0) {
            this.list = res.data || [];
            if (!this.searchValue && this.list.length > 0) {
              this.searchValue = this.list[0].title;
            }
          } else {
            showToast({ message: res.message || '搜索失败', type: 'fail' });
          }
        })
        .catch((err) => {
          showToast({ message: err || '搜索失败', type: 'fail' });
        });
    },
    onSelect(index) {
      const data = this.list[index];
      if (!data) return;
      this.current = index;
      const { lat, lng } = data.location;
      this.result = [lng, lat, data.title];
      this.searchValue = data.title;
      this.updateMapCenter(lat, lng);
    },
    handleSubmit() {
      if (this.result.length !== 3) {
        showToast({ message: '请选择一个地址', type: 'fail' });
        return;
      }
      this.$emit('confirm', this.result.join(','));
    },
    handleClear() {
      this.list = [];
      this.current = -1;
      this.result = [];
      this.searchValue = '';
      this.$emit('clear');
    },
    handleClose() {
      this.$emit('close');
    },
    applyValue(val) {
      if (!val) {
        this.result = [];
        this.searchValue = '';
        return;
      }
      const value = Array.isArray(val) ? val : (val + '').split(',');
      if (value.length === 3) {
        this.result = [value[0], value[1], value[2]];
        this.searchValue = value[2];
        this.latitude = Number(value[1]);
        this.longitude = Number(value[0]);
        if (this.mapReady) {
          this.updateMapCenter(this.latitude, this.longitude);
        }
      }
    },
    sign(path, data) {
      let url = `${path}?`;
      const keys = Object.keys(data).sort();
      keys.forEach((key, index) => {
        url += `${index === 0 ? '' : '&'}${key}=${data[key]}`;
      });
      const sign = md5(url + this.secretKey);
      return `${url}&sig=${sign}`;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-map-dialog {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;

  &__header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  &__back,
  &__reset {
    background: none;
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    color: #1989fa;
  }

  &__back {
    display: flex;
    align-items: center;
    color: #323233;
  }

  &__title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  &__reset {
    color: #ee0a24;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__map {
    position: relative;
    flex: 1;
    min-height: 280px;
    background: #f7f8fa;

    &-canvas {
      position: absolute;
      inset: 0;
    }
  }

  &__cursor {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -100%);
    z-index: 2;
    pointer-events: none;

    img {
      width: 34px;
      height: 34px;
    }
  }

  &__current {
    position: absolute;
    bottom: 16px;
    right: 16px;
    border: none;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 2;

    img {
      width: 28px;
      height: 28px;
    }
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    z-index: 3;
  }

  &__list {
    max-height: 260px;
    overflow-y: auto;
    border-top: 1px solid #f5f5f5;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5;

    &-main {
      flex: 1;
      margin-right: 12px;
      min-width: 0;
    }

    &-title {
      font-size: 15px;
      margin: 0 0 4px;
      font-weight: 500;
      color: #323233;
    }

    &-address {
      font-size: 13px;
      margin: 0;
      color: #969799;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-icon {
      font-size: 18px;
      color: #1989fa;
    }
  }

  &__item--active {
    background: #ecf9ff;
  }

  &__empty {
    padding: 16px;
    text-align: center;
    color: #969799;
    font-size: 14px;
  }

  &__footer {
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 1px solid #f0f0f0;
  }
}
</style>

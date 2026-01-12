<template>
  <div class="wf-map">
    <van-field
      v-model="address"
      readonly
      is-link
      :placeholder="getPlaceholder(column)"
      :disabled="disabled"
      @click="openPopup"
    />
    <van-popup
      v-model:show="showPopup"
      position="bottom"
      teleport="body"
      class="wf-map__popup"
      :overlay="true"
      @opened="handlePopupOpened"
    >
      <MapDialog
        :show="showPopup"
        :value="text"
        :map-key="mapKey"
        :secret-key="secretKey"
        @confirm="handleConfirm"
        @clear="handleClear"
        @close="closePopup"
      />
    </van-popup>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Field, Popup } from 'vant';
import Props from '../../mixins/props.js';
import MapDialog from './components/map.vue';

export default defineComponent({
  name: 'WfMap',
  components: {
    [Field.name]: Field,
    [Popup.name]: Popup,
    MapDialog,
  },
  mixins: [Props],
  data() {
    return {
      address: '',
      showPopup: false,
      mapKey: 'IQ2BZ-5FERX-VVJ4O-ZO7P3-H37Y7-KNBK3',
      secretKey: 'xsGMIxWGg8hDrwT6npENPBL3PpvhjIG',
    };
  },
  methods: {
    initValue() {
      if (this.text && this.text.length > 0) {
        const arr = (this.text + '').split(',');
        if (arr.length === 3) {
          this.address = arr[2];
        } else {
          this.address = '';
        }
      } else {
        this.address = '';
      }
    },
    openPopup() {
      if (this.disabled) return;
      this.showPopup = true;
    },
    closePopup() {
      this.showPopup = false;
    },
    handlePopupOpened() {
      this.$nextTick(() => {
        this.$emit('popup-opened');
      });
    },
    handleConfirm(value) {
      this.text = value;
      this.closePopup();
    },
    handleClear() {
      this.text = '';
      this.address = '';
      this.closePopup();
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-map {
  width: 100%;

  &__popup {
    height: 100vh;
  }
}
</style>

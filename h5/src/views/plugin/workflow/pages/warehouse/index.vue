<template>
    <div class="home-container">
        <div class="scan-container">
            <van-field v-model="qrCodeResult" label="扫码结果" placeholder="请扫描二维码" clearable />
            <van-button class="scan-button" type="primary" @click="handleScan">扫码</van-button>
        </div>
        <div v-if="isReaderVisible" class="scanner-wrapper">
            <div id="reader"></div>
        </div>
    </div>
</template>
<script>
import { defineComponent } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';

export default defineComponent({
    name: 'WorkflowWarehousePage',
    data() {
        return {
            qrCodeResult: '',
            isReaderVisible: false,
            scanner: null,
        };
    },
    beforeUnmount() {
        this.teardownScanner();
    },
    methods: {
        async handleScan() {
            this.isReaderVisible = true;
            this.$nextTick(async () => {
                if (!this.scanner) {
                    this.scanner = new Html5Qrcode('reader');
                }
                try {
                    await this.scanner.start(
                        { facingMode: 'environment' },
                        { fps: 15 },
                        (decodedText) => {
                            this.qrCodeResult = decodedText;
                            this.stopScan();
                        },
                        (error) => {
                            console.log('扫描失败:', error);
                        }
                    );
                } catch (err) {
                    console.error('获取摄像头失败:', err);
                    this.isReaderVisible = false;
                }
            });
        },
        stopScan() {
            if (!this.scanner) {
                this.isReaderVisible = false;
                return;
            }
            this.scanner
                .stop()
                .then(() => {
                    this.isReaderVisible = false;
                })
                .catch((err) => console.error('停止扫码失败:', err));
        },
        teardownScanner() {
            if (this.scanner) {
                try {
                    this.scanner.stop();
                } catch (error) {
                    console.warn('停止扫码异常', error);
                }
                this.scanner.clear();
                this.scanner = null;
            }
        },
    },
});
</script>

<style scoped>
.scan-container {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 20px;
}

.scan-button {
    flex-shrink: 0;
}

.scanner-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
}

#reader {
    width: 100%;
    height: 100%;
}
</style>

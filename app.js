import { useMembers } from './composables/useMembers.js';
import { useQueue } from './composables/useQueue.js';
import { useMatch } from './composables/useMatch.js';
import { useCourt } from './composables/useCourt.js';
import { useHistory } from './composables/useHistory.js';

const { createApp, ref, onMounted } = window.Vue;

createApp({
    // ลงทะเบียน View Components ให้ app.js รู้จัก
    components: window.VueComponents,

    setup() {
        const currentScreen = ref('home');

        // State สำหรับ Custom Confirm & Alert Modal
        const confirmModal = ref({
            show: false,
            title: '',
            message: '',
            type: 'danger', // danger, warning, info
            confirmText: 'ตกลง',
            cancelText: 'ยกเลิก',
            isAlert: false,
            onConfirm: null
        });

        const openConfirm = (options) => {
            confirmModal.value = {
                show: true,
                title: options.title || 'ยืนยันการทำรายการ',
                message: options.message || '',
                type: options.type || 'danger',
                confirmText: options.confirmText || 'ตกลง',
                cancelText: options.cancelText || 'ยกเลิก',
                isAlert: options.isAlert || false,
                onConfirm: options.onConfirm || null
            };
        };

        const closeConfirm = () => {
            confirmModal.value.show = false;
            setTimeout(() => {
                confirmModal.value.onConfirm = null;
            }, 200);
        };

        const executeConfirm = () => {
            if (confirmModal.value.onConfirm) {
                confirmModal.value.onConfirm();
            }
            closeConfirm();
        };

        // State สำหรับ Toast Notification
        const toast = ref({ show: false, message: '' });
        let toastTimer = null;
        const showToast = (message) => {
            toast.value.message = message;
            toast.value.show = true;
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.value.show = false;
            }, 2000);
        };

        // --- เรียกใช้งาน Composables ต่างๆ ---
        const membersModule = useMembers(showToast, openConfirm);

        const queueModule = useQueue(membersModule.members, showToast);

        const matchModule = useMatch(
            queueModule.activePlayers,
            queueModule.isEvenMode,
            queueModule.waitingQueue,
            queueModule.waitingPairQueue,
            queueModule.unpairedPlayers,
            null, // จะผูก courts ในภายหลัง
            showToast,
            openConfirm
        );

        const courtModule = useCourt(
            queueModule.activePlayers,
            queueModule.isEvenMode,
            queueModule.getNextQueueNumber,
            queueModule.sortedSummaryPlayers,
            queueModule.selectedPlayerIds,
            queueModule.allSessionPlayers,
            currentScreen,
            showToast,
            openConfirm
        );

        // เชื่อม courts ให้ matchModule ใช้งานได้
        const matchModuleWithCourts = useMatch(
            queueModule.activePlayers,
            queueModule.isEvenMode,
            queueModule.waitingQueue,
            queueModule.waitingPairQueue,
            queueModule.unpairedPlayers,
            courtModule.courts,
            showToast,
            openConfirm
        );

        const historyModule = useHistory(showToast, openConfirm);

        // ตัวช่วยเรียก confirmCheckin พร้อมส่ง currentScreen
        const confirmCheckin = () => {
            queueModule.confirmCheckin(currentScreen);
        };

        onMounted(() => {
            membersModule.fetchMembers();
            historyModule.fetchHistories();
        });

        return {
            currentScreen,
            toast,
            confirmModal,
            closeConfirm,
            executeConfirm,
            ...membersModule,
            ...queueModule,
            ...matchModuleWithCourts,
            ...courtModule,
            ...historyModule,
            confirmCheckin
        };
    }
}).mount('#app');
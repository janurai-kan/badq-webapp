import { db } from '../firebase-config.js';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { ref } = window.Vue;

export function useHistory(showToast, openConfirm) {
    const histories = ref([]);
    const showHistoryModal = ref(false);
    const selectedHistory = ref(null);

    // แปลงรูปแบบวันที่และเวลา
    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate();
        return date.toLocaleString('th-TH', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // ดึงข้อมูลประวัติการเล่นทั้งหมดจาก Firestore
    const fetchHistories = () => {
        const q = query(collection(db, "session_history"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            histories.value = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        });
    };

    // เปิด Modal ดูรายชื่อผู้เล่นในประวัติ
    const viewHistoryPlayers = (history) => {
        selectedHistory.value = history;
        showHistoryModal.value = true;
    };

    // ปิด Modal ประวัติ
    const closeHistoryModal = () => {
        showHistoryModal.value = false;
        selectedHistory.value = null;
    };

    // ลบประวัติรายการที่เลือก
    const deleteHistory = (id) => {
        openConfirm({
            title: 'ลบประวัติการเล่น?',
            message: 'คุณต้องการลบประวัติรายการนี้ใช่หรือไม่?',
            type: 'danger',
            confirmText: 'ลบข้อมูล',
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, "session_history", id));
                    showToast('ลบประวัติสำเร็จ');
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    // ลบประวัติทั้งหมด
    const deleteAllHistory = () => {
        openConfirm({
            title: 'ลบประวัติทั้งหมด?',
            message: 'ยืนยันการลบประวัติการเล่น "ทั้งหมด" ใช่หรือไม่? (ไม่สามารถกู้คืนได้)',
            type: 'danger',
            confirmText: 'ลบทิ้งทั้งหมด',
            onConfirm: async () => {
                try {
                    for (const h of histories.value) {
                        await deleteDoc(doc(db, "session_history", h.id));
                    }
                    showToast('ลบประวัติทั้งหมดสำเร็จ');
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    return {
        histories,
        showHistoryModal,
        selectedHistory,
        formatDate,
        fetchHistories,
        viewHistoryPlayers,
        closeHistoryModal,
        deleteHistory,
        deleteAllHistory
    };
}
import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { ref } = window.Vue;

export function useCourt(activePlayers, isEvenMode, getNextQueueNumber, sortedSummaryPlayers, selectedPlayerIds, allSessionPlayers, currentScreen, showToast, openConfirm) {
    const shuttlecockCount = ref(0);

    const courts = ref([
        {id: 'court_1', name: 'สนาม 1', status: 'idle', players: []},
        {id: 'court_2', name: 'สนาม 2', status: 'idle', players: []}
    ]);

    // ปรับจำนวนลูกแบดมินตัน
    const updateShuttlecock = (val) => {
        if (shuttlecockCount.value + val >= 0) shuttlecockCount.value += val;
    };

    // ล้างตัวผู้เล่นออกจากสนาม (เปลี่ยนตัว)
    const clearCourt = (courtIdx) => {
        const court = courts.value[courtIdx];
        court.players.forEach(p => {
            const target = activePlayers.value.find(ap => ap.id === p.id);
            if (target) target.status = 'waiting';
        });
        court.players = [];
        court.status = 'idle';
    };

    // ยกเลิกเกมในสนาม
    const cancelMatch = (courtIdx) => {
        const court = courts.value[courtIdx];
        openConfirm({
            title: `ยกเลิกการแข่ง ${court.name}?`,
            message: 'ผู้เล่นจะกลับเข้าคิวรอโดยไม่นับสถิติเกม คุณต้องการยกเลิกใช่หรือไม่?',
            type: 'warning',
            confirmText: 'ยกเลิกเกม',
            onConfirm: () => {
                clearCourt(courtIdx);
                showToast(`ยกเลิกการแข่งขันบน ${court.name} เรียบร้อยแล้ว`);
            }
        });
    };

    // เริ่มเกมในสนาม
    const startMatch = (courtIdx) => {
        const court = courts.value[courtIdx];
        if (court.players.length === 4) {
            court.status = 'playing';
            court.players.forEach(p => {
                const target = activePlayers.value.find(ap => ap.id === p.id);
                if (target) target.status = 'playing';
            });
            showToast(`${court.name} เริ่มเกมแล้ว`);
        }
    };

    // จบเกมในสนาม และส่งผู้เล่นกลับเข้าคิวรอ
    const finishMatch = (courtIdx) => {
        const court = courts.value[courtIdx];

        if (isEvenMode.value && court.players.length === 4) {
            let p1 = court.players[0];
            let p2 = court.players[1];
            let p3 = court.players[2];
            let p4 = court.players[3];

            let t1 = activePlayers.value.find(ap => ap.id === p1.id);
            let t2 = activePlayers.value.find(ap => ap.id === p2.id);
            if (t1) {
                t1.gameCount += 1;
                t1.pairGameCount = (t1.pairGameCount || 0) + 1;
                t1.status = 'waiting';
                t1.queuedAt = getNextQueueNumber();
            }
            if (t2) {
                t2.gameCount += 1;
                t2.pairGameCount = (t2.pairGameCount || 0) + 1;
                t2.status = 'waiting';
                t2.queuedAt = getNextQueueNumber();
            }

            let t3 = activePlayers.value.find(ap => ap.id === p3.id);
            let t4 = activePlayers.value.find(ap => ap.id === p4.id);
            if (t3) {
                t3.gameCount += 1;
                t3.pairGameCount = (t3.pairGameCount || 0) + 1;
                t3.status = 'waiting';
                t3.queuedAt = getNextQueueNumber();
            }
            if (t4) {
                t4.gameCount += 1;
                t4.pairGameCount = (t4.pairGameCount || 0) + 1;
                t4.status = 'waiting';
                t4.queuedAt = getNextQueueNumber();
            }
        } else {
            court.players.forEach(p => {
                const target = activePlayers.value.find(ap => ap.id === p.id);
                if (target) {
                    target.gameCount += 1;
                    target.status = 'waiting';
                    target.queuedAt = getNextQueueNumber();
                }
            });
        }

        court.players = [];
        court.status = 'idle';
        showToast(`${court.name} จบเกมแล้ว กรุณากดหาคู่ลงเล่นคิวถัดไป`);
    };

    // จบกิจกรรมประจำวัน (บันทึกประวัติ และรีเซ็ต Session)
    const endDaySession = () => {
        openConfirm({
            title: 'จบกิจกรรมวันนี้?',
            message: 'ข้อมูลการเล่นจะถูกบันทึกลงประวัติและล้างสถิติสำหรับวันนี้ คุณต้องการทำต่อใช่หรือไม่?',
            type: 'info',
            confirmText: 'จบกิจกรรม',
            onConfirm: async () => {
                if (sortedSummaryPlayers.value.length > 0) {
                    try {
                        const historyData = {
                            createdAt: serverTimestamp(),
                            shuttlecockCount: shuttlecockCount.value,
                            playerCount: sortedSummaryPlayers.value.length,
                            players: sortedSummaryPlayers.value.map(p => ({
                                name: p.name,
                                gameCount: p.gameCount,
                                isLeftEarly: !activePlayers.value.some(ap => ap.id === p.id)
                            }))
                        };
                        await addDoc(collection(db, "session_history"), historyData);
                    } catch (e) {
                        console.error(e);
                        openConfirm({
                            title: 'เกิดข้อผิดพลาด',
                            message: 'เกิดข้อผิดพลาดในการบันทึกประวัติ',
                            type: 'danger',
                            confirmText: 'ตกลง',
                            isAlert: true
                        });
                        return;
                    }
                }

                selectedPlayerIds.value = [];
                activePlayers.value = [];
                allSessionPlayers.value = [];
                shuttlecockCount.value = 0;
                courts.value.forEach(c => {
                    c.players = [];
                    c.status = 'idle';
                });
                currentScreen.value = 'home';
                showToast('บันทึกและจบกิจกรรมวันนี้เรียบร้อยแล้ว');
            }
        });
    };

    return {
        shuttlecockCount,
        courts,
        updateShuttlecock,
        clearCourt,
        cancelMatch,
        startMatch,
        finishMatch,
        endDaySession
    };
}
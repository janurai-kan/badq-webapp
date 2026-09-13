import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { ref } = window.Vue;

export function useCourt(activePlayers, isEvenMode, getNextQueueNumber, sortedSummaryPlayers, selectedPlayerIds, allSessionPlayers, currentScreen, showToast, openConfirm) {
    const shuttlecockCount = ref(0);

    const courts = ref([
        {id: 'court_1', name: 'สนาม 1', status: 'idle', players: []},
        {id: 'court_2', name: 'สนาม 2', status: 'idle', players: []}
    ]);

    const updateShuttlecock = (val) => {
        if (shuttlecockCount.value + val >= 0) shuttlecockCount.value += val;
    };

    const clearCourt = (courtIdx) => {
        const court = courts.value[courtIdx];
        court.players.forEach(p => {
            const target = activePlayers.value.find(ap => ap.id === p.id);
            if (target) target.status = 'waiting';
        });
        court.players = [];
        court.status = 'idle';
    };

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

    const finishMatch = (courtIdx) => {
        const court = courts.value[courtIdx];

        // 1. ดึงตัวผู้เล่นในสนามเทียบกับ activePlayers
        let targets = court.players.map(p => activePlayers.value.find(ap => ap.id === p.id)).filter(Boolean);

        // 2. สับเปลี่ยนลำดับ (Shuffle) ผู้เล่นที่จบเกมก่อนไปต่อท้ายคิว
        for (let i = targets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [targets[i], targets[j]] = [targets[j], targets[i]];
        }

        // 3. แจกคิวและอัปเดตสถิติตามลำดับใหม่ที่สุ่มแล้ว
        if (isEvenMode.value && court.players.length === 4) {
            targets.forEach(t => {
                t.gameCount += 1;
                t.pairGameCount = (t.pairGameCount || 0) + 1;
                t.status = 'waiting';
                t.queuedAt = getNextQueueNumber();
            });
        } else {
            targets.forEach(t => {
                t.gameCount += 1;
                t.status = 'waiting';
                t.queuedAt = getNextQueueNumber();
            });
        }

        court.players = [];
        court.status = 'idle';
        showToast(`${court.name} จบเกมแล้ว (ผู้เล่นถูกสุ่มลำดับต่อท้ายคิว)`);
    };

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
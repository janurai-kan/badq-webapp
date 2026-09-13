const { ref } = window.Vue;

export function useMatch(activePlayers, isEvenMode, waitingQueue, waitingPairQueue, unpairedPlayers, courts, showToast, openConfirm) {
    // State สำหรับ Modal จับคู่ผู้เล่น (โหมดคู่)
    const showPairModal = ref(false);
    const manualPairMode = ref(false);
    const tempSelectedPair = ref([]);

    // State สำหรับ Modal หาคู่ลงสนาม (Court Match)
    const showMatchModal = ref(false);
    const targetCourtIndex = ref(null);
    const manualMatchMode = ref(false);
    const tempSelectedPlayers = ref([]);
    const tempSelectedPairKeys = ref([]);

    // --- ระบบจับคู่ผู้เล่น (Pairing Management) ---
    const openPairModal = () => {
        showPairModal.value = true;
        manualPairMode.value = false;
        tempSelectedPair.value = [];
    };

    const closePairModal = () => {
        showPairModal.value = false;
    };

    // สุ่มจับคู่อัตโนมัติ
    const autoPair = () => {
        let available = activePlayers.value.filter(p => p.partnerId === null && p.status === 'waiting');
        available.sort(() => Math.random() - 0.5);

        for (let i = 0; i < available.length - 1; i += 2) {
            let p1 = available[i];
            let p2 = available[i + 1];
            p1.partnerId = p2.id;
            p2.partnerId = p1.id;
            p1.pairGameCount = 0;
            p2.pairGameCount = 0;
        }
        closePairModal();
        showToast('สุ่มจับคู่ผู้เล่นเรียบร้อยแล้ว');
    };

    // ยืนยันการจับคู่เอง (Manual Pair)
    const confirmManualPair = () => {
        if (tempSelectedPair.value.length === 2) {
            let p1 = activePlayers.value.find(p => p.id === tempSelectedPair.value[0]);
            let p2 = activePlayers.value.find(p => p.id === tempSelectedPair.value[1]);
            p1.partnerId = p2.id;
            p2.partnerId = p1.id;
            p1.pairGameCount = 0;
            p2.pairGameCount = 0;
            closePairModal();
            showToast(`จับคู่ ${p1.name} & ${p2.name} สำเร็จ`);
        }
    };

    // ละลายคู่ทั้งหมด
    const dissolvePairs = () => {
        openConfirm({
            title: 'ละลายคู่ทั้งหมด?',
            message: 'คุณต้องการละลายคู่ทั้งหมดใช่หรือไม่? (สถิติเกมรายบุคคลยังอยู่ แต่จะรีเซ็ตจำนวนรอบคู่เป็น 0)',
            type: 'warning',
            confirmText: 'ละลายคู่',
            onConfirm: () => {
                activePlayers.value.forEach(p => {
                    p.partnerId = null;
                    p.pairGameCount = 0;
                });
                showToast('ละลายคู่ผู้เล่นและรีเซ็ตสถิติรอบคู่เป็น 0 แล้ว');
            }
        });
    };

    // --- ระบบจัดคนลงสนาม (Court Matching) ---
    const openMatchModal = (index) => {
        targetCourtIndex.value = index;
        showMatchModal.value = true;
        manualMatchMode.value = false;
        tempSelectedPlayers.value = [];
        tempSelectedPairKeys.value = [];
    };

    const closeMatchModal = () => {
        showMatchModal.value = false;
    };

    // สุ่มจัดลงสนามอัตโนมัติ (Auto Match)
    const autoMatch = () => {
        const court = courts.value[targetCourtIndex.value];

        const shuffleArray = (array) => {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        if (isEvenMode.value) {
            const pairs = waitingPairQueue.value;
            if (pairs.length >= 2) {
                const guaranteedPairs = [pairs[0]];
                const remainingPoolSize = Math.min(2, pairs.length - 1);
                const pool = pairs.slice(1, 1 + remainingPoolSize);
                const shuffledPool = shuffleArray(pool);
                const randomPairs = shuffledPool.slice(0, 1);
                const selectedPairs = [...guaranteedPairs, ...randomPairs];

                const selected = [
                    selectedPairs[0].player1, selectedPairs[0].player2,
                    selectedPairs[1].player1, selectedPairs[1].player2
                ];

                court.players = selected;
                selected.forEach(p => p.status = 'court_assigned');
                closeMatchModal();
                showToast(`จัด 2 คู่ลง ${court.name} เรียบร้อย`);
            } else {
                openConfirm({
                    title: 'ไม่สามารถจัดคู่ได้',
                    message: 'คู่ที่รอคิวมีไม่ถึง 2 คู่ หรือยังไม่ได้จับคู่ผู้เล่น กรุณาจับคู่ผู้เล่นก่อนครับ',
                    type: 'warning',
                    confirmText: 'เข้าใจแล้ว',
                    isAlert: true
                });
            }
        } else {
            const available = waitingQueue.value;
            if (available.length >= 4) {
                const guaranteedPlayers = available.slice(0, 2);
                const remainingPoolSize = Math.min(4, available.length - 2);
                const pool = available.slice(2, 2 + remainingPoolSize);
                const shuffledPool = shuffleArray(pool);
                const randomPlayers = shuffledPool.slice(0, 2);
                const selected = [...guaranteedPlayers, ...randomPlayers];

                court.players = selected;
                selected.forEach(p => p.status = 'court_assigned');
                closeMatchModal();
                showToast(`จัดผู้เล่นลง ${court.name} เรียบร้อย`);
            } else {
                openConfirm({
                    title: 'ไม่สามารถจัดคิวได้',
                    message: 'ผู้เล่นที่รอคิวมีไม่ถึง 4 คน',
                    type: 'warning',
                    confirmText: 'เข้าใจแล้ว',
                    isAlert: true
                });
            }
        }
    };

    // ยืนยันการเลือก 2 คู่ลงสนามด้วยตัวเอง (Manual Pair Match)
    const confirmManualPairMatch = () => {
        if (tempSelectedPairKeys.value.length === 2) {
            const court = courts.value[targetCourtIndex.value];
            const pair1 = waitingPairQueue.value.find(p => p.key === tempSelectedPairKeys.value[0]);
            const pair2 = waitingPairQueue.value.find(p => p.key === tempSelectedPairKeys.value[1]);
            if (pair1 && pair2) {
                const selected = [pair1.player1, pair1.player2, pair2.player1, pair2.player2];
                court.players = selected;
                selected.forEach(p => p.status = 'court_assigned');
                closeMatchModal();
                showToast(`จับคู่ลง ${court.name} เรียบร้อยแล้ว`);
            }
        }
    };

    // ยืนยันการเลือกผู้เล่น 4 คนลงสนามด้วยตัวเอง (Manual Match)
    const confirmManualMatch = () => {
        if (tempSelectedPlayers.value.length === 4) {
            const court = courts.value[targetCourtIndex.value];
            const selected = tempSelectedPlayers.value.map(id => activePlayers.value.find(p => p.id === id));
            court.players = selected;
            selected.forEach(p => p.status = 'court_assigned');
            closeMatchModal();
            showToast(`จับคู่ลง ${court.name} เรียบร้อยแล้ว`);
        }
    };

    return {
        showPairModal,
        manualPairMode,
        tempSelectedPair,
        showMatchModal,
        targetCourtIndex,
        manualMatchMode,
        tempSelectedPlayers,
        tempSelectedPairKeys,
        openPairModal,
        closePairModal,
        autoPair,
        confirmManualPair,
        dissolvePairs,
        openMatchModal,
        closeMatchModal,
        autoMatch,
        confirmManualPairMatch,
        confirmManualMatch
    };
}
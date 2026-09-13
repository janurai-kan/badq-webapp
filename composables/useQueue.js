const { ref, computed } = window.Vue;

export function useQueue(members, showToast) {
    // State สำหรับผู้เล่นใน Session ปัจจุบัน
    const selectedPlayerIds = ref([]);
    const activePlayers = ref([]);
    const allSessionPlayers = ref([]);

    // ตัวแปรนับลำดับคิว (ใช้สำหรับจัดคิวแบบ FIFO ใครค่าน้อย = รอนานสุด)
    let queueCounter = 0;

    // State สำหรับ Modal ข้อมูลคิว
    const showQueueInfoModal = ref(false);

    // State สำหรับ Reorder Queue Modal
    const showReorderModal = ref(false);
    const tempReorderQueue = ref([]);
    const draggedIndex = ref(null);
    const targetDropIndex = ref(null);
    const isHandlePressed = ref(false);

    // คำนวณโหมดการเล่น (คู่/คี่)
    const isEvenMode = computed(() => {
        if (activePlayers.value.length === 0 && selectedPlayerIds.value.length > 0) {
            return selectedPlayerIds.value.length % 2 === 0;
        }
        return activePlayers.value.length > 0 && activePlayers.value.length % 2 === 0;
    });

    // ยืนยันการเช็กชื่อเข้าสู่ Session
    const confirmCheckin = (currentScreenRef) => {
        let shuffledIds = [...selectedPlayerIds.value];
        for (let i = shuffledIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
        }

        activePlayers.value = shuffledIds.map(id => {
            const existingPlayer = activePlayers.value.find(p => p.id === id) || allSessionPlayers.value.find(p => p.id === id);

            if (existingPlayer) {
                if (existingPlayer.queuedAt === undefined) existingPlayer.queuedAt = queueCounter++;
                return existingPlayer;
            }

            const m = members.value.find(item => item.id === id);
            const newPlayer = {
                id: m.id,
                name: m.name,
                gameCount: 0,
                status: 'waiting',
                partnerId: null,
                pairGameCount: 0,
                queuedAt: queueCounter++
            };

            allSessionPlayers.value.push(newPlayer);
            return newPlayer;
        });

        activePlayers.value.forEach(ap => {
            if (!allSessionPlayers.value.some(sp => sp.id === ap.id)) {
                allSessionPlayers.value.push(ap);
            }
        });

        allSessionPlayers.value.forEach(p => {
            p.partnerId = null;
            p.pairGameCount = 0;
        });

        if (currentScreenRef) currentScreenRef.value = 'dashboard';
        showToast('อัปเดตรายชื่อผู้เล่นเรียบร้อยแล้ว (รีเซ็ตสถานะคู่ กรุณาจับคู่ใหม่)');
    };

    // คิวรอเล่น (โหมดคี่ - รายบุคคล)
    const waitingQueue = computed(() => {
        return activePlayers.value
            .filter(p => p.status === 'waiting')
            .sort((a, b) => (a.queuedAt || 0) - (b.queuedAt || 0));
    });

    // คิวรอเล่น (โหมดคู่ - รายคู่)
    const waitingPairQueue = computed(() => {
        if (!isEvenMode.value) return [];
        const waiting = activePlayers.value.filter(p => p.status === 'waiting');
        const pairedIds = new Set();
        const pairs = [];

        waiting.forEach(p => {
            if (p.partnerId && !pairedIds.has(p.id)) {
                const partner = waiting.find(x => x.id === p.partnerId);
                if (partner && !pairedIds.has(partner.id)) {
                    pairedIds.add(p.id);
                    pairedIds.add(partner.id);
                    const pairKey = [p.id, partner.id].sort().join('_');
                    const pairQueuedAt = Math.max(p.queuedAt || 0, partner.queuedAt || 0);

                    pairs.push({
                        key: pairKey,
                        player1: p,
                        player2: partner,
                        pairGameCount: p.pairGameCount || 0,
                        totalGames: p.gameCount + partner.gameCount,
                        pairQueuedAt: pairQueuedAt
                    });
                }
            }
        });
        return pairs.sort((a, b) => a.pairQueuedAt - b.pairQueuedAt);
    });

    // จำนวนผู้เล่นที่มีคู่แล้ว
    const pairedCount = computed(() => {
        return activePlayers.value.filter(p => p.partnerId !== null).length;
    });

    // ผู้เล่นที่ยังไม่มีคู่
    const unpairedPlayers = computed(() => {
        return activePlayers.value
            .filter(p => p.partnerId === null && p.status === 'waiting')
            .sort((a, b) => b.gameCount - a.gameCount);
    });

    // สรุปผู้เล่นใน Session สำหรับหน้า Summary
    const sortedSummaryPlayers = computed(() => {
        return allSessionPlayers.value
            .filter(p => p.gameCount > 0 || activePlayers.value.some(ap => ap.id === p.id))
            .sort((a, b) => b.gameCount - a.gameCount);
    });

    // Helper สำหรับการเพิ่ม queueCounter จาก Composable อื่น
    const getNextQueueNumber = () => queueCounter++;

    // --- ระบบจัดลำดับคิวใหม่ (Reorder Queue) ---
    const openReorderModal = () => {
        if (isEvenMode.value) {
            tempReorderQueue.value = [...waitingPairQueue.value];
        } else {
            tempReorderQueue.value = [...waitingQueue.value];
        }
        showReorderModal.value = true;
    };

    const closeReorderModal = () => {
        showReorderModal.value = false;
        tempReorderQueue.value = [];
        draggedIndex.value = null;
        targetDropIndex.value = null;
        isHandlePressed.value = false;
    };

    // ลากวาง Desktop (Mouse)
    const onDragStart = (e, index) => {
        if (!isHandlePressed.value) {
            e.preventDefault();
            return;
        }
        draggedIndex.value = index;
        targetDropIndex.value = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex.value !== null && targetDropIndex.value !== index) {
            targetDropIndex.value = index;
        }
    };

    const onDrop = (e, index) => {
        if (draggedIndex.value !== null && targetDropIndex.value !== null && draggedIndex.value !== targetDropIndex.value) {
            const item = tempReorderQueue.value.splice(draggedIndex.value, 1)[0];
            tempReorderQueue.value.splice(targetDropIndex.value, 0, item);
        }
        draggedIndex.value = null;
        targetDropIndex.value = null;
        isHandlePressed.value = false;
    };

    // ลากวาง Mobile (Touch)
    const onTouchStart = (e, index) => {
        const handle = e.target.closest('.drag-handle');
        if (handle) {
            isHandlePressed.value = true;
            draggedIndex.value = index;
            targetDropIndex.value = index;
        }
    };

    const onTouchMove = (e) => {
        if (!isHandlePressed.value || draggedIndex.value === null) return;
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (target) {
            const dropZone = target.closest('.reorder-item');
            if (dropZone && dropZone.dataset.index !== undefined) {
                const hoverIndex = parseInt(dropZone.dataset.index);
                if (targetDropIndex.value !== hoverIndex) {
                    targetDropIndex.value = hoverIndex;
                }
            }
        }
    };

    const onTouchEnd = () => {
        if (draggedIndex.value !== null && targetDropIndex.value !== null && draggedIndex.value !== targetDropIndex.value) {
            const item = tempReorderQueue.value.splice(draggedIndex.value, 1)[0];
            tempReorderQueue.value.splice(targetDropIndex.value, 0, item);
        }
        draggedIndex.value = null;
        targetDropIndex.value = null;
        isHandlePressed.value = false;
    };

    const saveReorderedQueue = () => {
        tempReorderQueue.value.forEach((item) => {
            const qNum = queueCounter++;
            if (isEvenMode.value) {
                const p1 = activePlayers.value.find(p => p.id === item.player1.id);
                const p2 = activePlayers.value.find(p => p.id === item.partnerId || p.id === item.player2.id);
                if (p1) p1.queuedAt = qNum;
                if (p2) p2.queuedAt = qNum;
            } else {
                const p = activePlayers.value.find(p => p.id === item.id);
                if (p) p.queuedAt = qNum;
            }
        });
        closeReorderModal();
        showToast('อัปเดตลำดับคิวใหม่เรียบร้อยแล้ว');
    };

    return {
        selectedPlayerIds,
        activePlayers,
        allSessionPlayers,
        isEvenMode,
        confirmCheckin,
        waitingQueue,
        waitingPairQueue,
        pairedCount,
        unpairedPlayers,
        sortedSummaryPlayers,
        getNextQueueNumber,
        showQueueInfoModal,
        showReorderModal,
        tempReorderQueue,
        draggedIndex,
        targetDropIndex,
        isHandlePressed,
        openReorderModal,
        closeReorderModal,
        onDragStart,
        onDragOver,
        onDrop,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        saveReorderedQueue
    };
}
import {db} from './firebase-config.js';
import {
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const {createApp, ref, computed, onMounted} = Vue;

createApp({
    setup() {
        const currentScreen = ref('home');
        const members = ref([]);
        const histories = ref([]);
        const newMemberName = ref('');
        const loading = ref(true);
        const editingId = ref(null);
        const editName = ref('');
        const selectedPlayerIds = ref([]);
        const activePlayers = ref([]);
        const allSessionPlayers = ref([]);
        const shuttlecockCount = ref(0);

        // [แก้ไขจุดที่พัง] ประกาศ state ที่ขาดหายไป
        const showQueueInfoModal = ref(false);

        // ตัวแปรนับลำดับคิว (ใช้สำหรับจัดคิวแบบ FIFO ใครค่าน้อย = รอนานสุด)
        let queueCounter = 0;

        const courts = ref([
            {id: 'court_1', name: 'สนาม 1', status: 'idle', players: []},
            {id: 'court_2', name: 'สนาม 2', status: 'idle', players: []}
        ]);

        // Modals State
        const showMatchModal = ref(false);
        const targetCourtIndex = ref(null);
        const manualMatchMode = ref(false);
        const tempSelectedPlayers = ref([]);
        const tempSelectedPairKeys = ref([]);

        const showPairModal = ref(false);
        const manualPairMode = ref(false);
        const tempSelectedPair = ref([]);

        // Reorder Queue Modal State
        const showReorderModal = ref(false);
        const tempReorderQueue = ref([]);
        const draggedIndex = ref(null);
        const targetDropIndex = ref(null); // เก็บตำแหน่งที่กำลังลอยไปทับเพื่อทำช่องว่างเว้นรอ
        const isHandlePressed = ref(false);

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

        // --- ระบบลากวางสำหรับ Desktop (Mouse) ---
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
                targetDropIndex.value = index; // อัปเดตตำแหน่งที่ลอยไปทับเพื่อขยับการ์ดเว้นช่อง
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

        // --- ระบบลากวางสำหรับ Mobile (Touch) ---
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

        // History Modal State
        const showHistoryModal = ref(false);
        const selectedHistory = ref(null);

        const toast = ref({show: false, message: ''});
        let toastTimer = null;
        const showToast = (message) => {
            toast.value.message = message;
            toast.value.show = true;
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.value.show = false;
            }, 5000);
        };

        const formatDate = (timestamp) => {
            if (!timestamp) return '-';
            const date = timestamp.toDate();
            return date.toLocaleString('th-TH', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        };

        const fetchMembers = () => {
            const q = query(collection(db, "members"), orderBy("createdAt", "asc"));
            onSnapshot(q, (snapshot) => {
                members.value = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                loading.value = false;
            });
        };

        const fetchHistories = () => {
            const q = query(collection(db, "session_history"), orderBy("createdAt", "desc"));
            onSnapshot(q, (snapshot) => {
                histories.value = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            });
        };

        const addMember = async () => {
            if (!newMemberName.value.trim()) return;
            try {
                await addDoc(collection(db, "members"), {
                    name: newMemberName.value.trim(),
                    createdAt: serverTimestamp(),
                    isActive: true
                });
                newMemberName.value = '';
                showToast('เพิ่มรายชื่อสำเร็จ');
            } catch (error) {
                console.error(error);
            }
        };

        const startEdit = (member) => {
            editingId.value = member.id;
            editName.value = member.name;
        };
        const cancelEdit = () => {
            editingId.value = null;
            editName.value = '';
        };

        const saveEdit = async (id) => {
            if (!editName.value.trim()) return;
            try {
                await updateDoc(doc(db, "members", id), {name: editName.value.trim()});
                cancelEdit();
                showToast('แก้ไขรายชื่อสำเร็จ');
            } catch (error) {
                console.error(error);
            }
        };

        const deleteMember = async (id) => {
            if (confirm("คุณต้องการลบรายชื่อนี้ใช่หรือไม่?")) {
                try {
                    await deleteDoc(doc(db, "members", id));
                    showToast('ลบรายชื่อสำเร็จ');
                } catch (error) {
                    console.error(error);
                }
            }
        };

        const viewHistoryPlayers = (history) => {
            selectedHistory.value = history;
            showHistoryModal.value = true;
        };
        const closeHistoryModal = () => {
            showHistoryModal.value = false;
            selectedHistory.value = null;
        };

        const deleteHistory = async (id) => {
            if (confirm("คุณต้องการลบประวัติรายการนี้ใช่หรือไม่?")) {
                try {
                    await deleteDoc(doc(db, "session_history", id));
                    showToast('ลบประวัติสำเร็จ');
                } catch (error) {
                    console.error(error);
                }
            }
        };

        const deleteAllHistory = async () => {
            if (confirm("ยืนยันการลบประวัติการเล่น 'ทั้งหมด' ใช่หรือไม่? (ไม่สามารถกู้คืนได้)")) {
                try {
                    for (const h of histories.value) {
                        await deleteDoc(doc(db, "session_history", h.id));
                    }
                    showToast('ลบประวัติทั้งหมดสำเร็จ');
                } catch (error) {
                    console.error(error);
                }
            }
        };

        const isEvenMode = computed(() => {
            if (currentScreen.value === 'checkin') {
                return selectedPlayerIds.value.length > 0 && selectedPlayerIds.value.length % 2 === 0;
            }
            return activePlayers.value.length > 0 && activePlayers.value.length % 2 === 0;
        });

        const confirmCheckin = () => {
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

            currentScreen.value = 'dashboard';
            showToast('อัปเดตรายชื่อผู้เล่นเรียบร้อยแล้ว (รีเซ็ตสถานะคู่ กรุณาจับคู่ใหม่)');
        };

        const updateShuttlecock = (val) => {
            if (shuttlecockCount.value + val >= 0) shuttlecockCount.value += val;
        };

        const waitingQueue = computed(() => {
            return activePlayers.value
                .filter(p => p.status === 'waiting')
                .sort((a, b) => (a.queuedAt || 0) - (b.queuedAt || 0));
        });

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

        const pairedCount = computed(() => {
            return activePlayers.value.filter(p => p.partnerId !== null).length;
        });

        const unpairedPlayers = computed(() => {
            return activePlayers.value
                .filter(p => p.partnerId === null && p.status === 'waiting')
                .sort((a, b) => b.gameCount - a.gameCount);
        });

        const sortedSummaryPlayers = computed(() => {
            return allSessionPlayers.value
                .filter(p => p.gameCount > 0 || activePlayers.value.some(ap => ap.id === p.id))
                .sort((a, b) => b.gameCount - a.gameCount);
        });

        const openPairModal = () => {
            showPairModal.value = true;
            manualPairMode.value = false;
            tempSelectedPair.value = [];
        };
        const closePairModal = () => {
            showPairModal.value = false;
        };

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

        const dissolvePairs = () => {
            if (confirm("คุณต้องการละลายคู่ทั้งหมดใช่หรือไม่? (สถิติจำนวนเกมรายบุคคลยังอยู่ แต่จะรีเซ็ตจำนวนรอบของคู่เป็น 0)")) {
                activePlayers.value.forEach(p => {
                    p.partnerId = null;
                    p.pairGameCount = 0;
                });
                showToast('ละลายคู่ผู้เล่นและรีเซ็ตสถิติรอบคู่เป็น 0 แล้ว');
            }
        };

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
                    alert('คู่ที่รอคิวมีไม่ถึง 2 คู่ หรือยังไม่ได้จับคู่ผู้เล่น');
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
                    alert('ผู้เล่นที่รอคิวมีไม่ถึง 4 คน');
                }
            }
        };

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
            if (confirm(`คุณต้องการยกเลิกการแข่งขันบน ${court.name} ใช่หรือไม่? (ผู้เล่นจะกลับเข้าคิวรอโดยไม่นับสถิติเกม)`)) {
                clearCourt(courtIdx);
                showToast(`ยกเลิกการแข่งขันบน ${court.name} เรียบร้อยแล้ว`);
            }
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
                    t1.queuedAt = queueCounter++;
                }
                if (t2) {
                    t2.gameCount += 1;
                    t2.pairGameCount = (t2.pairGameCount || 0) + 1;
                    t2.status = 'waiting';
                    t2.queuedAt = queueCounter++;
                }

                let t3 = activePlayers.value.find(ap => ap.id === p3.id);
                let t4 = activePlayers.value.find(ap => ap.id === p4.id);
                if (t3) {
                    t3.gameCount += 1;
                    t3.pairGameCount = (t3.pairGameCount || 0) + 1;
                    t3.status = 'waiting';
                    t3.queuedAt = queueCounter++;
                }
                if (t4) {
                    t4.gameCount += 1;
                    t4.pairGameCount = (t4.pairGameCount || 0) + 1;
                    t4.status = 'waiting';
                    t4.queuedAt = queueCounter++;
                }
            } else {
                court.players.forEach(p => {
                    const target = activePlayers.value.find(ap => ap.id === p.id);
                    if (target) {
                        target.gameCount += 1;
                        target.status = 'waiting';
                        target.queuedAt = queueCounter++;
                    }
                });
            }

            court.players = [];
            court.status = 'idle';
            showToast(`${court.name} จบเกมแล้ว กรุณากดหาคู่ลงเล่นคิวถัดไป`);
        };

        const endDaySession = async () => {
            if (confirm("คุณต้องการจบกิจกรรมวันนี้ใช่หรือไม่? ข้อมูลการเล่นจะถูกบันทึกลงประวัติและล้างสถิติสำหรับวันนี้")) {
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
                        alert("เกิดข้อผิดพลาดในการบันทึกประวัติ");
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
        };

        onMounted(() => {
            fetchMembers();
            fetchHistories();
        });

        return {
            currentScreen,
            members,
            histories,
            newMemberName,
            loading,
            editingId,
            editName,
            toast,
            selectedPlayerIds,
            activePlayers,
            allSessionPlayers,
            shuttlecockCount,
            courts,
            waitingQueue,
            waitingPairQueue,
            sortedSummaryPlayers,
            isEvenMode,
            pairedCount,
            unpairedPlayers,
            showMatchModal,
            manualMatchMode,
            tempSelectedPlayers,
            tempSelectedPairKeys,
            showPairModal,
            manualPairMode,
            tempSelectedPair,
            showQueueInfoModal,
            showReorderModal,
            tempReorderQueue,
            draggedIndex,
            targetDropIndex,
            isHandlePressed,
            openReorderModal,
            closeReorderModal,
            saveReorderedQueue,
            onDragStart,
            onDragOver,
            onDrop,
            onTouchStart,
            onTouchMove,
            onTouchEnd,
            showHistoryModal,
            selectedHistory,
            formatDate,
            viewHistoryPlayers,
            closeHistoryModal,
            deleteHistory,
            deleteAllHistory,
            addMember,
            startEdit,
            cancelEdit,
            saveEdit,
            deleteMember,
            confirmCheckin,
            updateShuttlecock,
            openPairModal,
            closePairModal,
            autoPair,
            confirmManualPair,
            dissolvePairs,
            openMatchModal,
            closeMatchModal,
            autoMatch,
            confirmManualPairMatch,
            confirmManualMatch,
            clearCourt,
            cancelMatch,
            startMatch,
            finishMatch,
            endDaySession
        };
    }
}).mount('#app');
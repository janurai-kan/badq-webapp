export default {
    name: 'DashboardView',
    props: {
        shuttlecockCount: { type: Number, required: true },
        isEvenMode: { type: Boolean, required: true },
        pairedCount: { type: Number, required: true },
        activePlayers: { type: Array, required: true },
        courts: { type: Array, required: true },
        waitingPairQueue: { type: Array, required: true },
        waitingQueue: { type: Array, required: true }
    },
    emits: [
        'update-shuttlecock',
        'open-pair-modal',
        'dissolve-pairs',
        'change-screen',
        'open-match-modal',
        'start-match',
        'clear-court',
        'finish-match',
        'cancel-match',
        'show-queue-info',
        'open-reorder-modal'
    ],
    template: /* html */`
    <main class="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        <!-- การ์ดนับลูกแบดมินตัน -->
        <div class="bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between shadow shrink-0">
            <div class="flex items-center gap-2">
                <span class="text-xl">🏸</span>
                <div>
                    <span class="text-xs text-slate-400 block">จำนวนลูกแบดที่ใช้</span>
                    <span class="text-lg font-bold text-amber-400">{{ shuttlecockCount }} <span
                            class="text-xs text-slate-300">ลูก</span></span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button @click="$emit('update-shuttlecock', -1)"
                        class="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-lg">-
                </button>
                <button @click="$emit('update-shuttlecock', 1)"
                        class="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-lg">+
                </button>
            </div>
        </div>

        <!-- แถบระบบจับคู่ (แสดงเฉพาะโหมดคู่) -->
        <div v-if="isEvenMode"
             class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center shrink-0">
            <div>
                <span class="text-xs text-emerald-800 font-bold block">ระบบจับคู่</span>
                <span class="text-xs text-slate-600">จับคู่แล้ว: {{ pairedCount }}/{{ activePlayers.length }} คน</span>
            </div>
            <div class="flex gap-2">
                <button @click="$emit('open-pair-modal')"
                        class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg shadow">
                    👥 จับคู่ผู้เล่น
                </button>
                <button @click="$emit('dissolve-pairs')"
                        class="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-3 py-2 rounded-lg border border-rose-300">
                    💧 ละลายคู่
                </button>
            </div>
        </div>

        <!-- แถบสรุปจำนวนคนและปุ่มนำทาง -->
        <div class="flex justify-between items-center shrink-0">
            <span class="text-xs text-slate-500">ผู้เล่นวันนี้: <strong>{{ activePlayers.length }} คน</strong></span>
            <div class="flex gap-2">
                <button @click="$emit('change-screen', 'checkin')"
                        class="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg font-medium text-slate-700">
                    ➕ เช็กชื่อเพิ่ม/ออก
                </button>
                <button @click="$emit('change-screen', 'summary')"
                        class="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">
                    📊 สรุปผล
                </button>
            </div>
        </div>

        <!-- แสดงผลสถานะสนาม 1 และ 2 -->
        <div class="space-y-3 shrink-0">
            <div v-for="(court, index) in courts" :key="court.id"
                 class="border-2 border-indigo-200 rounded-xl p-3 bg-indigo-50/30">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-indigo-900 text-sm">{{ court.name }}</span>
                    <span :class="court.status === 'playing' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'"
                          class="text-xs px-2 py-0.5 rounded font-bold">{{ court.status === 'playing' ? 'กำลังแข่ง' : 'ว่าง'
                        }}</span>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div v-for="(player, pIdx) in (court.players.length ? court.players : [null,null,null,null])"
                         :key="pIdx"
                         class="p-2 rounded border text-center text-xs font-semibold shadow-sm relative overflow-hidden transition"
                         :class="[court.players.length === 4 ? (pIdx < 2 ? 'bg-blue-50/80 border-blue-200 text-blue-900' : 'bg-orange-50/80 border-orange-200 text-orange-900') : 'bg-white border-slate-200 text-slate-700']">
                        <span v-if="court.players.length === 4"
                              class="absolute top-0.5 left-1 text-[9px] font-bold opacity-60 uppercase"
                              :class="pIdx < 2 ? 'text-blue-600' : 'text-orange-600'">{{ pIdx < 2 ? 'ทีม A' : 'ทีม B'
                            }}</span>
                        <span class="block mt-1">{{ player ? player.name : '—' }}</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button v-if="court.players.length === 0" @click="$emit('open-match-modal', index)"
                            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg shadow">
                        🔍 หาคู่ลงเล่น
                    </button>
                    <template v-else-if="court.status === 'idle'">
                        <button @click="$emit('start-match', index)"
                                class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg shadow">
                            ▶️ เริ่มเกม
                        </button>
                        <button @click="$emit('clear-court', index)"
                                class="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-lg shadow-sm">
                            🔄 เปลี่ยนตัว
                        </button>
                    </template>
                    <template v-else>
                        <button @click="$emit('finish-match', index)"
                                class="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-lg shadow">
                            ⏹️ จบเกม (+1 สถิติ)
                        </button>
                        <button @click="$emit('cancel-match', index)"
                                class="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-lg shadow-sm">
                            🚫 ยกเลิก
                        </button>
                    </template>
                </div>
            </div>
        </div>

        <!-- รายการคิวรอเล่น -->
        <div class="mt-2 shrink-0 pb-4">
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-slate-700">คิวรอเล่น ({{ isEvenMode ? 'จัดตามคู่' : 'จัดตามบุคคล' }})</h3>
                    <button @click="$emit('show-queue-info')"
                            class="text-slate-400 hover:text-indigo-600 transition text-sm" title="เงื่อนไขการจัดคิว">ℹ️
                    </button>
                </div>
                <button @click="$emit('open-reorder-modal')"
                        class="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-1.5 rounded-lg transition shadow-sm">
                    🔄 จัดคิวเอง
                </button>
            </div>

            <!-- คิวโหมดคู่ -->
            <div v-if="isEvenMode" class="bg-slate-50 border rounded-xl p-3 space-y-1.5">
                <div v-for="(pair, idx) in waitingPairQueue" :key="pair.key"
                     class="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                    <div class="flex items-center gap-2">
                        <span v-if="idx === 0"
                              class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">⭐ การันตี</span>
                        <span v-else-if="idx > 0 && idx <= 2"
                              class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">🎲 สุ่มคิว</span>
                        <span v-else
                              class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">⏳ ลำดับที่ {{ idx + 1
                            }}</span>
                        <span class="font-bold text-indigo-900">{{ pair.player1.name }} & {{ pair.player2.name }}</span>
                    </div>
                    <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">เล่นรอบนี้: {{ pair.pairGameCount
                        }} เกม</span>
                </div>
                <div v-if="waitingPairQueue.length === 0" class="text-center py-3 text-slate-400 text-xs">ไม่มีคู่รอคิว (หรือยังไม่ได้จับคู่)
                </div>
            </div>

            <!-- คิวโหมดคี่ -->
            <div v-else class="bg-slate-50 border rounded-xl p-3 space-y-1.5">
                <div v-for="(player, idx) in waitingQueue" :key="player.id"
                     class="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                    <div class="flex items-center gap-2">
                        <span v-if="idx < 2"
                              class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">⭐ การันตี</span>
                        <span v-else-if="idx >= 2 && idx < 6"
                              class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">🎲 สุ่มคิว</span>
                        <span v-else
                              class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">⏳ ลำดับที่ {{ idx + 1
                            }}</span>
                        <span class="font-medium text-slate-800">{{ player.name }}</span>
                    </div>
                    <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">เล่นไป {{ player.gameCount
                        }} เกม</span>
                </div>
                <div v-if="waitingQueue.length === 0" class="text-center py-3 text-slate-400 text-xs">
                    ไม่มีผู้เล่นรอคิว
                </div>
            </div>
        </div>
    </main>
    `
};
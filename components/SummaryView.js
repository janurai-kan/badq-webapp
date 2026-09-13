export default {
    name: 'SummaryView',
    props: {
        shuttlecockCount: { type: Number, required: true },
        sortedSummaryPlayers: { type: Array, required: true },
        activePlayers: { type: Array, required: true }
    },
    emits: [
        'change-screen',
        'end-day-session'
    ],
    template: /* html */`
    <main class="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
        <!-- Header & ปุ่มย้อนกลับ -->
        <div class="flex justify-between items-center shrink-0">
            <h2 class="text-xl font-bold text-slate-700">สรุปผลกิจกรรมวันนี้</h2>
            <button @click="$emit('change-screen', 'dashboard')"
                    class="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium">
                ← กลับหน้าสนาม
            </button>
        </div>

        <!-- การ์ดสรุปลูกแบดมินตัน -->
        <div class="bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow shrink-0">
            <div>
                <span class="text-xs text-slate-400 block">ลูกแบดมินตันที่ใช้ทั้งหมด</span>
                <span class="text-2xl font-black text-amber-400">{{ shuttlecockCount }} <span
                        class="text-sm font-normal text-slate-300">ลูก</span></span>
            </div>
            <span class="text-3xl">🏸</span>
        </div>

        <!-- ตารางรายชื่อผู้เล่นและสถิติเกม -->
        <div class="bg-white border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
            <div class="bg-indigo-50 p-3 border-b border-indigo-100 font-bold text-indigo-900 text-sm flex justify-between shrink-0">
                <span>รายชื่อผู้เล่นที่ลงเล่นวันนี้ ({{ sortedSummaryPlayers.length }} คน)</span>
                <span>จำนวนเกมที่เล่น</span>
            </div>
            <ul class="divide-y divide-slate-100 overflow-y-auto flex-1">
                <li v-for="player in sortedSummaryPlayers" :key="player.id"
                    class="p-3 flex justify-between items-center text-sm">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-slate-800">{{ player.name }}</span>
                        <span v-if="!activePlayers.some(ap => ap.id === player.id)"
                              class="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">กลับก่อน</span>
                    </div>
                    <span class="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-xs">{{ player.gameCount
                        }} เกม</span>
                </li>
                <li v-if="sortedSummaryPlayers.length === 0" class="p-6 text-center text-slate-400 text-sm">
                    ยังไม่มีข้อมูลการแข่งขันวันนี้
                </li>
            </ul>
        </div>

        <!-- ปุ่มจบกิจกรรม -->
        <div class="pt-2 border-t shrink-0">
            <button @click="$emit('end-day-session')"
                    class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow transition text-center">
                🏁 จบกิจกรรมวันนี้ (ล้างและบันทึกสถิติ)
            </button>
        </div>
    </main>
    `
};
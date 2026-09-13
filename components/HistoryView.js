export default {
    name: 'HistoryView',
    props: {
        histories: { type: Array, required: true },
        formatDate: { type: Function, required: true } // เพิ่ม Prop นี้
    },
    emits: [
        'delete-all-history',
        'delete-history',
        'view-history-players'
    ],
    template: /* html */`
    <main class="p-4 flex-1 flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-slate-700">ประวัติข้อมูลการเล่น</h2>
            <button v-if="histories.length > 0" @click="$emit('delete-all-history')"
                    class="text-xs bg-rose-100 hover:bg-rose-200 text-rose-600 px-3 py-1.5 rounded-lg font-bold transition border border-rose-200">
                🗑️ ลบประวัติทั้งหมด
            </button>
        </div>

        <div v-if="histories.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400">
            <span class="text-4xl mb-2">📭</span>
            <p>ยังไม่มีข้อมูลการเล่นที่จบไปแล้ว</p>
        </div>

        <div v-else class="space-y-3 overflow-y-auto pb-4">
            <div v-for="h in histories" :key="h.id"
                 class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                <div class="flex justify-between items-start mb-3 pb-3 border-b border-slate-100">
                    <div>
                        <!-- เรียกใช้ formatDate(h.createdAt) โดยตรง -->
                        <span class="block text-sm font-bold text-indigo-900">📅 {{ formatDate(h.createdAt) }}</span>
                    </div>
                    <button @click="$emit('delete-history', h.id)" class="text-slate-300 hover:text-rose-500 transition text-lg">
                        🗑️
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div class="flex flex-col items-center justify-center border-r border-slate-200">
                        <span class="text-xs text-slate-500 mb-1">ลูกแบดทั้งหมด</span>
                        <span class="font-bold text-amber-500 text-lg">{{ h.shuttlecockCount }} <span
                                class="text-xs text-slate-600 font-normal">ลูก</span></span>
                    </div>
                    <div class="flex flex-col items-center justify-center">
                        <span class="text-xs text-slate-500 mb-1">จำนวนผู้เล่น</span>
                        <span class="font-bold text-emerald-600 text-lg">{{ h.playerCount }} <span
                                class="text-xs text-slate-600 font-normal">คน</span></span>
                    </div>
                </div>
                <button @click="$emit('view-history-players', h)"
                        class="w-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold py-2 rounded-lg text-xs transition border border-slate-200 hover:border-indigo-200">
                    📋 ดูรายชื่อผู้เล่น
                </button>
            </div>
        </div>
    </main>
    `
};
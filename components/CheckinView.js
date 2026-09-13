export default {
    name: 'CheckinView',
    props: {
        members: { type: Array, required: true },
        selectedPlayerIds: { type: Array, required: true }
    },
    emits: ['update:selectedPlayerIds'],
    computed: {
        localSelectedPlayerIds: {
            get() {
                return this.selectedPlayerIds;
            },
            set(val) {
                this.$emit('update:selectedPlayerIds', val);
            }
        }
    },
    template: /* html */`
    <main class="p-4 flex-1 flex flex-col overflow-hidden">
        <h2 class="text-xl font-bold mb-2 text-slate-700 shrink-0">เช็กชื่อผู้เล่นวันนี้</h2>

        <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex justify-between items-center shrink-0">
            <div>
                <span class="text-xs text-indigo-600 font-semibold block">จำนวนผู้เล่นวันนี้</span>
                <span class="text-2xl font-black text-indigo-900">{{ selectedPlayerIds.length }} <span
                        class="text-sm font-normal text-slate-600">คน</span></span>
            </div>
            <div class="text-right">
                <span class="text-xs text-slate-500 block">โหมดการจัดคิว</span>
                <span v-if="selectedPlayerIds.length === 0"
                      class="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">ยังไม่เลือก</span>
                <span v-else-if="selectedPlayerIds.length % 2 === 0"
                      class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">โหมดคู่</span>
                <span v-else class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold">โหมดคี่</span>
            </div>
        </div>

        <p v-if="selectedPlayerIds.length < 8"
           class="text-xs text-rose-500 font-bold mb-3 bg-rose-50 p-2 rounded border border-rose-200 shrink-0">⚠️
            ต้องมีผู้เล่นอย่างน้อย 8 คน ถึงจะสามารถเริ่มจัดคิวได้</p>

        <div class="flex-1 overflow-y-auto pr-1 mb-2">
            <div class="space-y-2">
                <label v-for="member in members" :key="member.id"
                       class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition"
                       :class="selectedPlayerIds.includes(member.id) ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700'">
                    <span>{{ member.name }}</span>
                    <input type="checkbox" :value="member.id" v-model="localSelectedPlayerIds"
                           class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500">
                </label>
            </div>
        </div>
    </main>
    `
};
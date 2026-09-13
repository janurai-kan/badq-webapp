export default {
    name: 'RosterView',
    props: {
        members: { type: Array, required: true },
        loading: { type: Boolean, required: true },
        newMemberName: { type: String, required: true },
        editingId: { type: String, default: null },
        editName: { type: String, default: '' }
    },
    emits: [
        'update:newMemberName',
        'update:editName',
        'add-member',
        'start-edit',
        'cancel-edit',
        'save-edit',
        'delete-member'
    ],
    template: /* html */`
    <main class="p-4 flex-1 flex flex-col overflow-hidden">
        <h2 class="text-xl font-bold text-slate-700 mb-4 shrink-0">รายชื่อสมาชิกทั้งหมด</h2>

        <form @submit.prevent="$emit('add-member')" class="flex gap-2 mb-6 shrink-0">
            <input :value="newMemberName" 
                   @input="$emit('update:newMemberName', $event.target.value)"
                   type="text" 
                   placeholder="ใส่ชื่อเล่น..."
                   class="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   required>
            <button type="submit" :disabled="loading"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:bg-slate-400">
                + เพิ่ม
            </button>
        </form>

        <div v-if="loading" class="text-center py-4 text-slate-500 shrink-0">กำลังโหลดข้อมูล...</div>

        <div v-else class="flex-1 overflow-y-auto pr-1">
            <ul class="space-y-2">
                <li v-for="member in members" :key="member.id"
                    class="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    <template v-if="editingId !== member.id">
                        <span class="font-medium text-slate-700">{{ member.name }}</span>
                        <div class="flex gap-2">
                            <button @click="$emit('start-edit', member)"
                                    class="text-slate-400 hover:text-indigo-600 text-sm font-medium px-2 py-1">แก้ไข
                            </button>
                            <button @click="$emit('delete-member', member.id)"
                                    class="text-slate-400 hover:text-red-600 text-sm font-medium px-2 py-1">ลบ
                            </button>
                        </div>
                    </template>
                    <template v-else>
                        <input :value="editName" 
                               @input="$emit('update:editName', $event.target.value)"
                               type="text"
                               class="border border-indigo-400 rounded px-2 py-1 flex-1 mr-2 text-sm focus:outline-none"
                               @keyup.enter="$emit('save-edit', member.id)">
                        <div class="flex gap-1">
                            <button @click="$emit('save-edit', member.id)"
                                    class="bg-emerald-600 text-white text-xs px-2 py-1 rounded">บันทึก
                            </button>
                            <button @click="$emit('cancel-edit')" class="bg-slate-300 text-slate-700 text-xs px-2 py-1 rounded">
                                ยกเลิก
                            </button>
                        </div>
                    </template>
                </li>
            </ul>
        </div>
    </main>
    `
};
import { db } from '../firebase-config.js';
import {
    collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { ref } = window.Vue;

export function useMembers(showToast, openConfirm) {
    const members = ref([]);
    const loading = ref(true);
    const newMemberName = ref('');
    const editingId = ref(null);
    const editName = ref('');

    // ดึงข้อมูลสมาชิกทั้งหมด
    const fetchMembers = () => {
        const q = query(collection(db, "members"), orderBy("createdAt", "asc"));
        onSnapshot(q, (snapshot) => {
            members.value = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            loading.value = false;
        });
    };

    // เพิ่มสมาชิกใหม่
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

    // เริ่มแก้ไขชื่อ
    const startEdit = (member) => {
        editingId.value = member.id;
        editName.value = member.name;
    };

    // ยกเลิกการแก้ไข
    const cancelEdit = () => {
        editingId.value = null;
        editName.value = '';
    };

    // บันทึกการแก้ไข
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

    // ลบสมาชิก
    const deleteMember = (id) => {
        openConfirm({
            title: 'ลบรายชื่อผู้เล่น?',
            message: 'คุณต้องการลบรายชื่อนี้ใช่หรือไม่?',
            type: 'danger',
            confirmText: 'ลบรายชื่อ',
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, "members", id));
                    showToast('ลบรายชื่อสำเร็จ');
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    return {
        members,
        loading,
        newMemberName,
        editingId,
        editName,
        fetchMembers,
        addMember,
        startEdit,
        cancelEdit,
        saveEdit,
        deleteMember
    };
}
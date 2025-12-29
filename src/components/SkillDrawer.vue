<script setup>
    import { ref, watch } from 'vue'
    
    const props = defineProps(['isOpen', 'nodeData'])
    // 🔥 新增 'delete-node' 事件
    const emit = defineEmits(['close', 'update-node', 'delete-node'])
    
    const noteContent = ref('')
    const isSaving = ref(false)
    const isDeleting = ref(false)
    
    const API_BASE = 'https://life-skill-tree.zeabur.app'
    
    watch(() => props.nodeData, (newData) => {
      if (newData) {
        noteContent.value = newData.note || ''
      }
    })
    
    async function saveNote() {
      if (!props.nodeData) return
      isSaving.value = true
      try {
        const res = await fetch(`${API_BASE}/api/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: props.nodeData.id, text: noteContent.value })
        })
        const data = await res.json()
        if (data.success) {
          emit('update-node', data.node)
          alert('笔记已保存 📝')
        }
      } catch (e) { alert('保存失败') } 
      finally { isSaving.value = false }
    }
    
    // 🔥 新增：删除功能
    async function deleteSkill() {
      if (!confirm(`确定要彻底删除 "${props.nodeData.label}" 吗？此操作不可恢复！`)) return
    
      isDeleting.value = true
      try {
        const res = await fetch(`${API_BASE}/api/nodes/${props.nodeData.id}`, {
          method: 'DELETE'
        })
        const data = await res.json()
        if (data.success) {
          emit('delete-node', props.nodeData.id) // 通知父组件移除节点
          alert('已删除 🗑️')
        } else {
          alert('删除失败')
        }
      } catch (e) { alert('请求出错') }
      finally { isDeleting.value = false }
    }
    </script>
    
    <template>
      <div v-if="isOpen" class="overlay" @click="$emit('close')"></div>
      <div class="drawer" :class="{ 'open': isOpen }">
        <div v-if="nodeData" class="drawer-content">
          
          <header class="drawer-header">
            <img :src="nodeData.icon" class="header-icon" alt="icon" />
            <div class="header-text">
              <h2>{{ nodeData.label }}</h2>
              <span class="status-badge" :class="nodeData.state">
                {{ nodeData.state === 'active' ? '✨ 已掌握' : '🔒 未解锁' }}
              </span>
            </div>
            <button class="close-btn" @click="$emit('close')">×</button>
          </header>
    
          <hr class="divider" />
    
          <div class="notes-area">
            <h3>📚 学习笔记</h3>
            <textarea v-model="noteContent" placeholder="在此输入笔记..." class="note-input"></textarea>
          </div>
    
          <div class="actions">
            <button class="action-btn danger" @click="deleteSkill" :disabled="isDeleting">
              {{ isDeleting ? '删除中...' : '🗑️ 删除节点' }}
            </button>
            
            <button class="action-btn primary" @click="saveNote" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '💾 保存笔记' }}
            </button>
          </div>
    
        </div>
      </div>
    </template>
    
    <style scoped>
    /* 保持原有样式，仅新增 danger 按钮样式 */
    .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); z-index: 99; backdrop-filter: blur(2px); }
    .drawer { position: fixed; top: 0; right: -400px; bottom: 0; width: 350px; background: #1a1a1a; border-left: 1px solid #333; z-index: 100; transition: right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: -5px 0 30px rgba(0,0,0,0.8); color: #fff; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; }
    .drawer.open { right: 0; }
    .drawer-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
    .header-icon { width: 48px; height: 48px; }
    .header-text h2 { margin: 0; font-size: 1.2rem; }
    .close-btn { margin-left: auto; background: none; border: none; color: #666; font-size: 28px; cursor: pointer; line-height: 1; }
    .close-btn:hover { color: #fff; }
    .divider { border: 0; border-top: 1px solid #333; margin: 0; }
    .status-badge { display: inline-block; margin-top: 5px; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .status-badge.active { background: rgba(66, 184, 131, 0.15); color: #42b883; border: 1px solid #42b883; }
    .status-badge.inactive { background: #333; color: #888; border: 1px solid #555; }
    .notes-area { margin-top: 20px; flex-grow: 1; display: flex; flex-direction: column; }
    .notes-area h3 { margin-bottom: 10px; font-size: 1rem; color: #ccc; }
    .note-input { width: 100%; flex-grow: 1; min-height: 200px; background: #222; border: 1px solid #444; color: #ddd; padding: 12px; border-radius: 8px; resize: none; font-family: inherit; box-sizing: border-box; font-size: 14px; line-height: 1.5; }
    .note-input:focus { outline: none; border-color: #42b883; }
    .actions { margin-top: 20px; display: flex; gap: 10px; }
    .action-btn { flex: 1; padding: 12px; border-radius: 6px; border: none; cursor: pointer; background: #333; color: #fff; font-weight: bold; transition: all 0.2s; }
    .action-btn.primary { background: #42b883; color: #000; }
    /* 🔥 红色删除按钮 */
    .action-btn.danger { background: #333; color: #ff4d4d; border: 1px solid #552222; }
    .action-btn.danger:hover { background: #552222; }
    .action-btn:hover { transform: translateY(-2px); opacity: 0.9; }
    </style>
<script setup>
  import { ref, onMounted } from 'vue'
  import { VueFlow, useVueFlow } from '@vue-flow/core'
  import { Background } from '@vue-flow/background'
  import { Controls } from '@vue-flow/controls'
  import SkillNode from './components/SkillNode.vue'
  import SkillDrawer from './components/SkillDrawer.vue'
  
  import '@vue-flow/core/dist/style.css'
  import '@vue-flow/controls/dist/style.css'
  
  const nodeTypes = { skill: SkillNode }
  const isDrawerOpen = ref(false)
  const selectedNode = ref(null)
  
  // 🔗 你的云端地址
  const API_BASE = 'https://life-skill-tree.zeabur.app'
  
  const nodes = ref([])
  const edges = ref([]) // 暂时不自动存连线，先存节点
  
  // 1. 加载数据
  async function fetchNodes() {
    try {
      const res = await fetch(`${API_BASE}/api/nodes`)
      const dbNodes = await res.json()
      
      // 把数据库的数据转换成 VueFlow 格式
      nodes.value = dbNodes.map(n => ({
        id: n.id,
        type: 'skill',
        position: { x: n.x || Math.random() * 400, y: n.y || Math.random() * 400 },
        data: { ...n }
      }))
    } catch (e) { console.error('加载失败', e) }
  }
  
  onMounted(fetchNodes)
  
  // 2. 点击节点
  const { onNodeClick, findNode } = useVueFlow()
  
  onNodeClick(async (event) => {
    // 点击时，先打开抽屉
    const node = findNode(event.node.id)
    selectedNode.value = { ...node.data, id: node.id }
    isDrawerOpen.value = true
    
    // 然后尝试切换状态 (如果不希望点击就切换，可以把下面这段删掉，只在抽屉里操作)
    // 这里保留原逻辑：点击即切换
    try {
      const res = await fetch(`${API_BASE}/api/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.node.id })
      })
      const data = await res.json()
      if (data.success) {
         node.data = { ...node.data, state: data.node.state }
         selectedNode.value = { ...node.data, id: node.id }
      }
    } catch (e) { console.error(e) }
  })
  
  // 🔥 3. 新增节点 (Creat New)
  async function createNode() {
    const name = prompt('请输入新技能的名字：', '新技能')
    if (!name) return
  
    try {
      const res = await fetch(`${API_BASE}/api/nodes/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: name,
          x: 100 + Math.random() * 200, // 随机位置，避免重叠
          y: 100 + Math.random() * 200
        })
      })
      const data = await res.json()
      if (data.success) {
        // 添加到界面上
        nodes.value.push({
          id: data.node.id,
          type: 'skill',
          position: { x: data.node.x, y: data.node.y },
          data: data.node
        })
      }
    } catch (e) { alert('创建失败') }
  }
  
  // 🔥 4. 处理删除事件 (从抽屉传出来的)
  function handleNodeDelete(deletedId) {
    // 从界面移除
    nodes.value = nodes.value.filter(n => n.id !== deletedId)
    isDrawerOpen.value = false // 关掉抽屉
  }
  
  function handleNodeUpdate(updatedNode) {
    const node = findNode(updatedNode.id)
    if (node) node.data = { ...node.data, ...updatedNode }
    selectedNode.value = updatedNode
  }
  </script>
  
  <template>
    <div class="dnd-flow">
      <div class="top-bar">
        <button class="add-btn" @click="createNode">➕ 添加新技能</button>
      </div>
  
      <VueFlow v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes" fit-view-on-init class="basic-flow">
        <Background pattern-color="#444" :gap="25" />
        <Controls />
      </VueFlow>
      
      <SkillDrawer 
        :is-open="isDrawerOpen" 
        :node-data="selectedNode" 
        @close="isDrawerOpen = false" 
        @update-node="handleNodeUpdate" 
        @delete-node="handleNodeDelete"
      />
    </div>
  </template>
  
  <style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #111; font-family: 'Arial', sans-serif; }
  #app { width: 100vw; height: 100vh; }
  .dnd-flow, .basic-flow { height: 100%; width: 100%; position: relative; }
  
  /* 🔥 新增：顶部悬浮按钮样式 */
  .top-bar { position: absolute; top: 20px; left: 20px; z-index: 10; }
  .add-btn {
    background: #42b883; color: #000; border: none; padding: 10px 20px;
    border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    transition: all 0.2s;
  }
  .add-btn:hover { transform: scale(1.05); background: #3aa876; }
  </style>
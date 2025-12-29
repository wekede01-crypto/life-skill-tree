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
  
  const API_BASE = 'https://life-skill-tree.zeabur.app'
  
  const nodes = ref([])
  const edges = ref([])
  
  // 1. 获取所有数据 (节点 + 连线)
  async function fetchData() {
    try {
      const res = await fetch(`${API_BASE}/api/data`)
      const data = await res.json()
      
      nodes.value = data.nodes.map(n => ({
        id: n.id, type: 'skill', position: { x: n.x, y: n.y }, data: { ...n }
      }))
      
      // 转换连线数据
      edges.value = data.edges.map(e => ({
        id: e.id, source: e.source, target: e.target, 
        animated: true, style: { stroke: '#555', strokeWidth: 2 } 
      }))
    } catch (e) { console.error('加载失败', e) }
  }
  
  onMounted(fetchData)
  
  // 2. VueFlow 核心钩子
  const { onConnect, addEdges, onEdgeClick } = useVueFlow()
  
  // 🔥 监听连线事件 (一松手就保存)
  onConnect(async (params) => {
    // 先在前端画出来 (这就是所谓的"乐观更新"，让用户感觉不到延迟)
    const tempId = `temp-${Date.now()}`
    addEdges([{ ...params, id: tempId, animated: true, style: { stroke: '#555' } }])
  
    try {
      const res = await fetch(`${API_BASE}/api/edges/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: params.source, target: params.target })
      })
      const data = await res.json()
      if (!data.success) {
        // 如果后端失败了，这里应该回滚(为了简单暂时省略)
        alert('连线保存失败')
      }
    } catch (e) { alert('网络错误') }
  })
  
  // 🔥 监听连线点击 (双击删除)
  // VueFlow 默认没有 onEdgeDoubleClick，我们用单击+确认框来删除
  onEdgeClick(async (event) => {
    const edgeId = event.edge.id
    const confirmDelete = confirm('⚡️ 要断开这条连线吗？')
    if (!confirmDelete) return
  
    // 前端移除
    edges.value = edges.value.filter(e => e.id !== edgeId)
  
    // 后端移除
    try {
      await fetch(`${API_BASE}/api/edges/${edgeId}`, { method: 'DELETE' })
    } catch (e) { console.error('删除连线失败') }
  })
  
  // 3. 节点交互逻辑 (保持不变)
  const { onNodeClick, findNode } = useVueFlow()
  onNodeClick(async (event) => {
    const node = findNode(event.node.id)
    selectedNode.value = { ...node.data, id: node.id }
    isDrawerOpen.value = true
    
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
  
  async function createNode() {
    const name = prompt('✨ 新技能名称：', '新技能')
    if (!name) return
  
    try {
      const res = await fetch(`${API_BASE}/api/nodes/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: name, x: Math.random() * 200, y: Math.random() * 200 })
      })
      const data = await res.json()
      if (data.success) {
        nodes.value.push({ id: data.node.id, type: 'skill', position: { x: data.node.x, y: data.node.y }, data: data.node })
      }
    } catch (e) { alert('创建失败') }
  }
  
  function handleNodeDelete(deletedId) {
    nodes.value = nodes.value.filter(n => n.id !== deletedId)
    // 还要把连着这个节点的线也删了
    edges.value = edges.value.filter(e => e.source !== deletedId && e.target !== deletedId)
    isDrawerOpen.value = false
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
  
      <VueFlow 
        v-model:nodes="nodes" 
        v-model:edges="edges" 
        :node-types="nodeTypes" 
        fit-view-on-init 
        class="basic-flow"
      >
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
  /* 保持原有样式 */
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #111; font-family: 'Arial', sans-serif; }
  #app { width: 100vw; height: 100vh; }
  .dnd-flow, .basic-flow { height: 100%; width: 100%; position: relative; }
  .top-bar { position: absolute; top: 20px; left: 20px; z-index: 10; }
  .add-btn { background: #42b883; color: #000; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: all 0.2s; }
  .add-btn:hover { transform: scale(1.05); background: #3aa876; }
  
  /* 🔥 连线样式微调：让线看起来更科技感 */
  .vue-flow__edge-path { stroke-width: 2px; stroke: #666; }
  .vue-flow__edge:hover .vue-flow__edge-path { stroke: #42b883; stroke-width: 3px; cursor: pointer; }
  </style>
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
  
  // 1. 获取所有数据
  async function fetchData() {
    try {
      const res = await fetch(`${API_BASE}/api/data`)
      const data = await res.json()
      
      nodes.value = data.nodes.map(n => ({
        id: n.id, type: 'skill', position: { x: n.x, y: n.y }, data: { ...n }
      }))
      
      edges.value = data.edges.map(e => ({
        id: e.id, source: e.source, target: e.target, 
        animated: true, style: { stroke: '#555', strokeWidth: 2 } 
      }))
    } catch (e) { console.error('加载失败', e) }
  }
  
  onMounted(fetchData)
  
  // 2. 引入 VueFlow 核心功能 (用来添加连线)
  const { addEdges } = useVueFlow()
  
  // 🔥 修复点：把连线逻辑提取成一个独立函数
  async function onConnectHandler(params) {
    console.log('🔗 尝试连线:', params) // 调试日志
  
    // 1. 乐观更新：先在界面上画出来
    const tempId = `temp-${Date.now()}`
    const newEdge = { 
      ...params, 
      id: tempId, 
      animated: true, 
      style: { stroke: '#555', strokeWidth: 2 } 
    }
    
    // 手动添加到 edges 数组，确保界面立即反应
    edges.value.push(newEdge) 
  
    // 2. 发送给后端
    try {
      const res = await fetch(`${API_BASE}/api/edges/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: params.source, target: params.target })
      })
      const data = await res.json()
      
      if (data.success) {
        console.log('✅ 连线保存成功')
        // 可选：用真实 ID 替换临时 ID (这里简单起见就不替换了，下次刷新就是真实的)
      } else {
        alert('连线保存失败')
        // 回滚：从数组里删掉刚才那条线
        edges.value = edges.value.filter(e => e.id !== tempId)
      }
    } catch (e) { 
      console.error(e)
      alert('网络错误')
      edges.value = edges.value.filter(e => e.id !== tempId)
    }
  }
  
  // 🔥 修复点：连线点击逻辑
  async function onEdgeClickHandler(event) {
    const edgeId = event.edge.id
    console.log('点击连线:', edgeId)
  
    const confirmDelete = confirm('⚡️ 要断开这条连线吗？')
    if (!confirmDelete) return
  
    // 前端移除
    edges.value = edges.value.filter(e => e.id !== edgeId)
  
    // 后端移除
    try {
      await fetch(`${API_BASE}/api/edges/${edgeId}`, { method: 'DELETE' })
    } catch (e) { console.error('删除连线失败') }
  }
  
  // 节点点击逻辑
  const { findNode } = useVueFlow() // findNode 还是可以用 hook 拿到的
  
  async function onNodeClickHandler(event) {
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
         // 更新本地数据
         const nodeIndex = nodes.value.findIndex(n => n.id === event.node.id)
         if(nodeIndex > -1) {
           nodes.value[nodeIndex].data = { ...nodes.value[nodeIndex].data, state: data.node.state }
         }
         selectedNode.value = { ...node.data, id: node.id, state: data.node.state }
      }
    } catch (e) { console.error(e) }
  }
  
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
    edges.value = edges.value.filter(e => e.source !== deletedId && e.target !== deletedId)
    isDrawerOpen.value = false
  }
  
  function handleNodeUpdate(updatedNode) {
      const index = nodes.value.findIndex(n => n.id === updatedNode.id)
      if (index !== -1) {
          nodes.value[index].data = { ...nodes.value[index].data, ...updatedNode }
      }
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
        @connect="onConnectHandler"
        @edge-click="onEdgeClickHandler"
        @node-click="onNodeClickHandler"
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
  
  /* 连线样式 */
  .vue-flow__edge-path { stroke-width: 2px; stroke: #666; }
  .vue-flow__edge:hover .vue-flow__edge-path { stroke: #42b883; stroke-width: 3px; cursor: pointer; }
  </style>
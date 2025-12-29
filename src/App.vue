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
  
  // 节点数据
  const nodes = ref([
    { id: 'root', type: 'skill', position: { x: 300, y: 0 }, data: { label: '我的数字帝国', state: 'active', isRoot: true, icon: 'https://api.iconify.design/noto:crown.svg', note: '' } },
    { id: 'amz', type: 'skill', position: { x: 100, y: 150 }, data: { label: '亚马逊运营', state: 'inactive', icon: 'https://api.iconify.design/ri:amazon-fill.svg?color=%23FF9900', note: '' } },
    { id: 'amz-data', type: 'skill', position: { x: 0, y: 300 }, data: { label: '选品分析', state: 'inactive', icon: 'https://cdn.simpleicons.org/googleanalytics/white', note: '' } },
    { id: 'amz-ads', type: 'skill', position: { x: 200, y: 300 }, data: { label: '广告投放', state: 'inactive', icon: 'https://cdn.simpleicons.org/googleads/4285F4', note: '' } },
    { id: 'tech', type: 'skill', position: { x: 500, y: 150 }, data: { label: '全栈开发', state: 'inactive', icon: 'https://cdn.simpleicons.org/apple/white', note: '' } },
    { id: 'python', type: 'skill', position: { x: 400, y: 300 }, data: { label: 'Python 爬虫', state: 'inactive', icon: 'https://cdn.simpleicons.org/python/3776AB', note: '' } },
    { id: 'vue', type: 'skill', position: { x: 600, y: 300 }, data: { label: 'Vue3 前端', state: 'inactive', icon: 'https://cdn.simpleicons.org/vuedotjs/42b883', note: '' } },
    { id: 'node', type: 'skill', position: { x: 500, y: 450 }, data: { label: 'Node 后端', state: 'inactive', icon: 'https://cdn.simpleicons.org/nodedotjs/339933', note: '' } },
  ])
  
  const edges = ref([
    { id: 'e1', source: 'root', target: 'amz', animated: true, style: { stroke: '#FF9900', strokeWidth: 2 } },
    { id: 'e2', source: 'root', target: 'tech', animated: true, style: { stroke: '#42b883', strokeWidth: 2 } },
    { id: 'e3', source: 'amz', target: 'amz-data', style: { stroke: '#555' } },
    { id: 'e4', source: 'amz', target: 'amz-ads', style: { stroke: '#555' } },
    { id: 'e5', source: 'tech', target: 'python', style: { stroke: '#555' } },
    { id: 'e6', source: 'tech', target: 'vue', style: { stroke: '#555' } },
    { id: 'e7', source: 'tech', target: 'node', style: { stroke: '#555' } },
  ])
  
  const { onNodeClick, findNode } = useVueFlow()
  
  function syncNodeData(dbNode) {
    const node = findNode(dbNode.id)
    if (!node) return
    node.data = { ...node.data, state: dbNode.state, note: dbNode.note || '' }
  }
  
  onMounted(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/nodes')
      const dbNodes = await res.json()
      dbNodes.forEach(dbNode => syncNodeData(dbNode))
    } catch (e) {
      console.error('后端连接失败', e)
    }
  })
  
  // 🔥 修复点 1：更新数据时，也要把 ID 塞进去
  function handleNodeUpdate(updatedNode) {
    syncNodeData(updatedNode)
    const node = findNode(updatedNode.id)
    if (node) {
      // 手动合并 ID，确保 Drawer 能拿到 id
      selectedNode.value = { ...node.data, id: node.id }
    }
  }
  
  onNodeClick(async (event) => {
    if (event.node.id === 'root') return
    try {
      const res = await fetch('http://localhost:3000/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.node.id })
      })
      const data = await res.json()
      if (data.success) {
        syncNodeData(data.node)
        
        // 🔥 修复点 2：打开侧边栏时，把 node.id 也塞进 selectedNode
        // 之前是：selectedNode.value = findNode(event.node.id).data (这里面没有 id)
        // 现在改成：
        const node = findNode(event.node.id)
        selectedNode.value = { ...node.data, id: node.id }
        
        isDrawerOpen.value = true
      }
    } catch (e) { console.error(e) }
  })
  </script>
  
  <template>
    <div class="dnd-flow">
      <VueFlow v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes" fit-view-on-init class="basic-flow">
        <Background pattern-color="#444" :gap="25" />
        <Controls />
      </VueFlow>
      <SkillDrawer :is-open="isDrawerOpen" :node-data="selectedNode" @close="isDrawerOpen = false" @update-node="handleNodeUpdate" />
    </div>
  </template>
  
  <style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #111; font-family: 'Arial', sans-serif; }
  #app { width: 100vw; height: 100vh; }
  .dnd-flow, .basic-flow { height: 100%; width: 100%; position: relative; }
  </style>
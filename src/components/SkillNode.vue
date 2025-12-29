<script setup>
    import { Handle, Position } from '@vue-flow/core'
    import { computed } from 'vue'
    const props = defineProps(['data', 'selected'])
    const isLit = computed(() => props.data.state === 'active')
    </script>
    
    <template>
      <div class="skill-node-wrapper">
        <Handle type="target" :position="Position.Top" class="handle-dot" />
        <div class="skill-circle" :class="{ 'is-lit': isLit, 'is-root': data.isRoot }">
          <img :src="data.icon" class="skill-icon" alt="icon" />
        </div>
        <div class="skill-label" :class="{ 'text-lit': isLit }">{{ data.label }}</div>
        <Handle type="source" :position="Position.Bottom" class="handle-dot" />
      </div>
    </template>
    
    <style scoped>
    .skill-node-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; }
    .skill-circle { width: 60px; height: 60px; border-radius: 50%; background: #2a2a2a; border: 2px solid #555; display: flex; align-items: center; justify-content: center; transition: all 0.4s; cursor: pointer; position: relative; overflow: hidden; }
    .skill-icon { width: 32px; height: 32px; opacity: 0.5; filter: grayscale(100%); transition: all 0.3s; }
    .skill-circle.is-lit { background: #202020; border-color: #fff; box-shadow: 0 0 20px rgba(66, 184, 131, 0.6); transform: scale(1.1); }
    .skill-circle.is-lit .skill-icon { opacity: 1; filter: grayscale(0%); transform: scale(1.1); }
    .skill-circle.is-root { width: 80px; height: 80px; border-color: #8A2BE2; box-shadow: 0 0 15px #8A2BE2; }
    .skill-circle.is-root.is-lit { box-shadow: 0 0 30px #8A2BE2; }
    .skill-label { margin-top: 8px; font-size: 12px; color: #777; font-weight: bold; text-align: center; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; transition: color 0.3s; }
    .text-lit { color: #fff; text-shadow: 0 0 5px rgba(255,255,255,0.5); }
    .handle-dot { background: transparent !important; border: none !important; }
    </style>
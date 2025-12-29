<script setup>
    import { Handle, Position } from '@vue-flow/core'
    
    defineProps(['data'])
    </script>
    
    <template>
      <div class="skill-node" :class="data.state">
        <Handle type="target" :position="Position.Top" />
        
        <div class="icon-wrapper">
          <img :src="data.icon" class="node-icon" alt="icon" />
        </div>
        <div class="label">{{ data.label }}</div>
    
        <Handle type="source" :position="Position.Bottom" />
      </div>
    </template>
    
    <style scoped>
    .skill-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 80px;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .icon-wrapper {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #2a2a2a;
      border: 2px solid #555;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      transition: all 0.3s;
    }
    
    .node-icon {
      width: 32px;
      height: 32px;
      opacity: 0.5;
      transition: all 0.3s;
    }
    
    .label {
      margin-top: 8px;
      color: #888;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
    }
    
    /* 激活状态样式 */
    .skill-node.active .icon-wrapper {
      border-color: #42b883;
      box-shadow: 0 0 15px rgba(66, 184, 131, 0.6);
      background: rgba(66, 184, 131, 0.1);
    }
    
    .skill-node.active .node-icon {
      opacity: 1;
      transform: scale(1.1);
    }
    
    .skill-node.active .label {
      color: #42b883;
    }
    </style>
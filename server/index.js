const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// 🔥 数据库连接 (已包含你的账号密码)
const MONGO_URI = "mongodb+srv://wekede01_db_user:nVZGtvKqeMpSwDLj@cluster0.pjgojjd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 连接数据库
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Cloud 连接成功'))
    .catch(err => console.error('❌ MongoDB 连接失败:', err));

// 定义数据模型
const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true }, // 技能名字
    state: { type: String, default: 'inactive' }, // 激活状态
    note: { type: String, default: '' }, // 笔记
    x: { type: Number, default: 0 }, // X坐标
    y: { type: Number, default: 0 }, // Y坐标
    icon: { type: String, default: 'https://api.iconify.design/ri:checkbox-blank-circle-line.svg' } // 图标
});
const NodeModel = mongoose.model('Node', NodeSchema);

// 默认初始数据 (重置时使用)
const INITIAL_NODES = [
    { id: 'root', label: '我的数字帝国', state: 'active', x: 0, y: 0, icon: 'https://api.iconify.design/noto:crown.svg' },
    { id: 'tech', label: '全栈开发', state: 'inactive', x: 0, y: 150, icon: 'https://api.iconify.design/logos:chrome.svg' },
    { id: 'design', label: 'UI设计', state: 'inactive', x: -150, y: 150, icon: 'https://api.iconify.design/logos:figma.svg' },
    { id: 'ai', label: '人工智能', state: 'inactive', x: 150, y: 150, icon: 'https://api.iconify.design/logos:openai-icon.svg' }
];

// --- API 接口 ---

// 1. 获取所有节点
app.get('/api/nodes', async (req, res) => {
    try {
        const nodes = await NodeModel.find();
        res.json(nodes);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. 切换激活状态
app.post('/api/toggle', async (req, res) => {
    const { id } = req.body;
    try {
        const node = await NodeModel.findOne({ id });
        if (node) {
            node.state = node.state === 'active' ? 'inactive' : 'active';
            await node.save();
            res.json({ success: true, node });
        } else { res.json({ success: false }); }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. 保存笔记
app.post('/api/note', async (req, res) => {
    const { id, text } = req.body;
    try {
        const updatedNode = await NodeModel.findOneAndUpdate({ id }, { note: text }, { new: true });
        res.json({ success: true, node: updatedNode });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. 新增节点 (上帝模式: 创造)
app.post('/api/nodes/add', async (req, res) => {
    const { label, x, y } = req.body;
    const newId = 'node-' + Date.now();
    try {
        const newNode = await NodeModel.create({
            id: newId,
            label,
            x,
            y,
            state: 'inactive',
            // 随机分配一个图标
            icon: 'https://api.iconify.design/fluent-emoji:sparkles.svg' 
        });
        res.json({ success: true, node: newNode });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. 删除节点 (上帝模式: 毁灭)
app.delete('/api/nodes/:id', async (req, res) => {
    try {
        await NodeModel.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🔥 6. 核按钮: 重置数据库 (修复界面混乱专用)
app.get('/api/reset', async (req, res) => {
    try {
        await NodeModel.deleteMany({});
        await NodeModel.insertMany(INITIAL_NODES);
        res.send('<h1>✅ 数据库重置成功！</h1><p>请回到 Vercel 刷新页面。</p>');
    } catch (e) { res.status(500).send('重置失败: ' + e.message); }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
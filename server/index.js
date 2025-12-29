const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// 🔥 数据库连接 (保持你的账号密码)
const MONGO_URI = "mongodb+srv://wekede01_db_user:nVZGtvKqeMpSwDLj@cluster0.pjgojjd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Cloud 连接成功'))
    .catch(err => console.error('❌ MongoDB 连接失败:', err));

// --- 模型定义 ---

// 1. 节点模型
const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    state: { type: String, default: 'inactive' },
    note: { type: String, default: '' },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    icon: { type: String, default: '' }
});
const NodeModel = mongoose.model('Node', NodeSchema);

// 🔥 2. 连线模型 (新增)
const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    source: { type: String, required: true }, // 起点 ID
    target: { type: String, required: true }  // 终点 ID
});
const EdgeModel = mongoose.model('Edge', EdgeSchema);

// --- 初始数据 ---
const INITIAL_NODES = [
    { id: 'root', label: '我的数字帝国', state: 'active', x: 0, y: 0, icon: 'https://api.iconify.design/noto:crown.svg' },
    { id: 'tech', label: '全栈开发', state: 'inactive', x: 0, y: 150, icon: 'https://api.iconify.design/logos:chrome.svg' },
    { id: 'design', label: 'UI设计', state: 'inactive', x: -150, y: 150, icon: 'https://api.iconify.design/logos:figma.svg' },
    { id: 'ai', label: '人工智能', state: 'inactive', x: 150, y: 150, icon: 'https://api.iconify.design/logos:openai-icon.svg' }
];

// 默认连线: 从 Root 连向三个子节点
const INITIAL_EDGES = [
    { id: 'e1', source: 'root', target: 'tech' },
    { id: 'e2', source: 'root', target: 'design' },
    { id: 'e3', source: 'root', target: 'ai' }
];

// --- API 接口 ---

// 获取所有数据 (节点 + 连线)
app.get('/api/data', async (req, res) => {
    try {
        const nodes = await NodeModel.find();
        const edges = await EdgeModel.find();
        res.json({ nodes, edges });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 节点相关 API
app.post('/api/nodes/add', async (req, res) => {
    const { label, x, y } = req.body;
    const newId = 'node-' + Date.now();
    try {
        const newNode = await NodeModel.create({
            id: newId, label, x, y, state: 'inactive',
            icon: 'https://api.iconify.design/fluent-emoji:sparkles.svg'
        });
        res.json({ success: true, node: newNode });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/toggle', async (req, res) => { /* 保持切换逻辑 */
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

app.post('/api/note', async (req, res) => { /* 保持笔记逻辑 */
    const { id, text } = req.body;
    try {
        const updatedNode = await NodeModel.findOneAndUpdate({ id }, { note: text }, { new: true });
        res.json({ success: true, node: updatedNode });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/nodes/:id', async (req, res) => {
    try {
        await NodeModel.deleteOne({ id: req.params.id });
        // 删节点时，顺便把连着它的线也删了，防止悬空
        await EdgeModel.deleteMany({ $or: [{ source: req.params.id }, { target: req.params.id }] });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🔥 连线相关 API (新增)
app.post('/api/edges/add', async (req, res) => {
    const { source, target } = req.body;
    const newId = `e-${source}-${target}`; // 生成唯一ID
    try {
        const newEdge = await EdgeModel.create({ id: newId, source, target });
        res.json({ success: true, edge: newEdge });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/edges/:id', async (req, res) => {
    try {
        await EdgeModel.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🔥 核按钮: 重置一切 (节点+连线)
app.get('/api/reset', async (req, res) => {
    try {
        await NodeModel.deleteMany({});
        await EdgeModel.deleteMany({});
        await NodeModel.insertMany(INITIAL_NODES);
        await EdgeModel.insertMany(INITIAL_EDGES);
        res.send('<h1>✅ 世界已重置</h1><p>节点和连线已恢复默认。</p>');
    } catch (e) { res.status(500).send('重置失败: ' + e.message); }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
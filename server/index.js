const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// 🔥 修正后的数据库连接地址 (已填入你的真实账号密码)
const MONGO_URI = "mongodb+srv://wekede01_db_user:nVZGtvKqeMpSwDLj@cluster0.pjgojjd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// 允许跨域访问 (解决 CORS 问题)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 连接 MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Cloud 连接成功'))
    .catch(err => console.error('❌ MongoDB 连接失败:', err));

// 定义数据结构
const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    state: { type: String, default: 'inactive' },
    note: { type: String, default: '' }
});
const NodeModel = mongoose.model('Node', NodeSchema);

// 初始数据
const INITIAL_NODES = [
    { id: 'root', state: 'active', note: '' },
    { id: 'amz', state: 'inactive', note: '' },
    { id: 'amz-data', state: 'inactive', note: '' },
    { id: 'amz-ads', state: 'inactive', note: '' },
    { id: 'tech', state: 'inactive', note: '' },
    { id: 'python', state: 'inactive', note: '' },
    { id: 'vue', state: 'inactive', note: '' },
    { id: 'node', state: 'inactive', note: '' }
];

// 初始化数据库
async function initDb() {
    try {
        const count = await NodeModel.countDocuments();
        if (count === 0) {
            console.log('正在初始化云端数据...');
            await NodeModel.insertMany(INITIAL_NODES);
            console.log('初始化完成');
        }
    } catch (e) {
        console.error('初始化数据失败:', e);
    }
}
mongoose.connection.once('open', initDb);

// --- API 接口 ---

app.get('/api/nodes', async (req, res) => {
    try {
        const nodes = await NodeModel.find();
        res.json(nodes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/toggle', async (req, res) => {
    const { id } = req.body;
    try {
        const node = await NodeModel.findOne({ id });
        if (node) {
            node.state = node.state === 'active' ? 'inactive' : 'active';
            await node.save();
            res.json({ success: true, node });
        } else {
            res.json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/note', async (req, res) => {
    const { id, text } = req.body;
    try {
        const updatedNode = await NodeModel.findOneAndUpdate(
            { id }, 
            { note: text },
            { new: true }
        );
        res.json({ success: true, node: updatedNode });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
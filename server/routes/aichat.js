const express = require('express');


const router = express.Router();


const OLLAMA_URL = 'http://localhost:11434/api/generate';
// 🔧 可修改为你已安装的模型，如 'qwen2.5:7b', 'llama3.1:8b' 等
const MODEL = 'qwen2.5-coder:7b';

/**
 * 调用 Ollama API
 * @param {string} prompt - 用户提示词
 * @param {string} systemPrompt - 系统提示（可选）
 * @returns {Promise<string>} 模型回复
 */
async function callOllama(prompt, systemPrompt = '') {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL,
            prompt: fullPrompt,
            stream: false,
            options: { temperature: 0.8, max_tokens: 1024 }
        })
    });
    if (!response.ok) {
        throw new Error(`Ollama 请求失败: ${response.status}`);
    }
    const data = await response.json();
    return data.response.trim();
}

// ------------------------- 1. 生成角色 -------------------------
router.post('/api/generate-characters', async (req, res) => {
    const { n } = req.body;
    const prompt = `请生成 ${n} 个普通现实角色，每个角色包含：姓名、年龄、职业、性格(10字内)、生活习惯(10字内)。用 JSON 数组格式返回，不要有其他解释。示例：[{"name":"李芳华","age":52,"job":"退休收银员","personality":"热心八卦嗓门亮","habit":"早晚遛狗跳广场舞"}]`;
    try {
        const result = await callOllama(prompt, '你是一个角色生成助手，只输出JSON数组。');
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        const characters = JSON.parse(jsonMatch ? jsonMatch[0] : result);
        res.json({ characters });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '角色生成失败：' + err.message });
    }
});

// ------------------------- 2. 生成场景 -------------------------
router.post('/api/generate-scene', async (req, res) => {
    const { characters } = req.body;
    const charDesc = characters.map(c => `${c.name}（${c.job}，${c.personality}）`).join('；');
    const prompt = `下面是一组人物：${charDesc}。请为他们生成一个日常生活中可能发生的、有讨论价值的具体场景（例如在小区门口讨论垃圾分类、在办公室讨论加班等）。场景需包含地点、大概事件起因。输出纯文本，不超过150字。`;
    try {
        const scene = await callOllama(prompt, '你是一个场景创意助手。');
        res.json({ scene });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '场景生成失败：' + err.message });
    }
});

// ------------------------- 3. 自动发言（下一句） -------------------------
router.post('/api/next-message', async (req, res) => {
    const { characters, scene, history, currentCharacterIndex } = req.body;
    const currentChar = characters[currentCharacterIndex];
    if (!currentChar) {
        return res.status(400).json({ error: '无效的角色索引' });
    }
    let systemPrompt = `你正在扮演一个真实聊天场景中的角色。场景：${scene}\n`;
    systemPrompt += `你的角色设定：姓名：${currentChar.name}，年龄：${currentChar.age}，职业：${currentChar.job}，性格：${currentChar.personality}，生活习惯：${currentChar.habit}。\n`;
    systemPrompt += `请严格以该角色的口吻、性格说话，回复口语化、自然，长度1-2句话。不要重复别人的话，不要评价自己是AI。`;
    let context = '';
    if (history && history.length > 0) {
        context = '对话历史：\n' + history.map(msg => `${msg.role}：${msg.content}`).join('\n') + '\n';
    }
    const userPrompt = `${context}现在轮到${currentChar.name}发言，请直接输出他/她说的话（不要加名字前缀，只输出内容）：`;
    try {
        const reply = await callOllama(userPrompt, systemPrompt);
        res.json({ message: reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '发言生成失败：' + err.message });
    }
});

// ------------------------- 4. 用户插话 + AI 回应 -------------------------
router.post('/api/user-interject', async (req, res) => {
    try {
        const { characters, scene, history, currentCharacterIndex, userRole, userMessage } = req.body;
        const userMsgObj = { role: userRole, content: userMessage };
        const newHistory = [...(history || []), userMsgObj];
        const nextChar = characters[currentCharacterIndex];
        if (!nextChar) {
            return res.json({ message: null, newHistory, nextIndex: 0 });
        }
        let systemPrompt = `你正在扮演一个真实聊天场景中的角色。场景：${scene}\n`;
        systemPrompt += `你的角色设定：姓名：${nextChar.name}，年龄：${nextChar.age}，职业：${nextChar.job}，性格：${nextChar.personality}，生活习惯：${nextChar.habit}。\n`;
        systemPrompt += `请严格以该角色的口吻、性格说话，回复口语化、自然，长度1-2句话。不要重复别人的话。`;
        let context = '';
        if (newHistory.length > 0) {
            context = '对话历史：\n' + newHistory.map(msg => `${msg.role}：${msg.content}`).join('\n') + '\n';
        }
        const userPrompt = `${context}现在轮到${nextChar.name}发言，请直接输出他/她说的话（不要加名字前缀，只输出内容）：`;
        const reply = await callOllama(userPrompt, systemPrompt);
        const aiMsgObj = { role: nextChar.name, content: reply };
        const finalHistory = [...newHistory, aiMsgObj];
        const nextIndex = (currentCharacterIndex + 1) % characters.length;
        res.json({
            userMessage: userMsgObj,
            aiMessage: aiMsgObj,
            newHistory: finalHistory,
            nextIndex
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '插话处理失败：' + err.message });
    }
});


module.exports = router;
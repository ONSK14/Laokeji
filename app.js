// 全局变量和常量
const DEFAULT_API_KEY = 'sk-4dd324d0fdf849ebbec7e4692fde112a';
const DEFAULT_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';

let currentAPISettings = {
    apiKey: DEFAULT_API_KEY,
    apiUrl: DEFAULT_API_URL,
    model: DEFAULT_MODEL
};

let conversationHistory = [];
let currentAIRole = null;
let currentUserRole = null;

// 侧边栏功能
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// 角色管理
function openNewRoleModal(type) {
    const modal = document.getElementById('new-role-modal');
    modal.style.display = 'block';
    modal.setAttribute('data-role-type', type);
}

function closeNewRoleModal() {
    const modal = document.getElementById('new-role-modal');
    modal.style.display = 'none';
}

function saveNewRole() {
    const type = document.getElementById('new-role-modal').getAttribute('data-role-type');
    const name = document.getElementById('role-name').value;
    const gender = document.getElementById('role-gender').value;
    const description = document.getElementById('role-description').value;

    if (!name || !gender) {
        alert('请填写必要信息');
        return;
    }

    const role = { name, gender, description };
    const roleKey = type === 'ai' ? 'aiRoles' : 'userRoles';
    
    let roles = JSON.parse(localStorage.getItem(roleKey) || '[]');
    roles.push(role);
    localStorage.setItem(roleKey, JSON.stringify(roles));

    // 更新角色列表并选择新建的角色
    updateRoleList(type);
    closeNewRoleModal();
}

function updateRoleList(type) {
    const roleKey = type === 'ai' ? 'aiRoles' : 'userRoles';
    const listId = type === 'ai' ? 'ai-role-list' : 'user-role-list';
    const roleList = document.getElementById(listId);
    const roles = JSON.parse(localStorage.getItem(roleKey) || '[]');

    roleList.innerHTML = '';
    roles.forEach((role, index) => {
        const roleElement = document.createElement('div');
        roleElement.textContent = role.name;
        roleElement.onclick = () => selectRole(type, index);
        roleList.appendChild(roleElement);
    });
}

function selectRole(type, index) {
    const roleKey = type === 'ai' ? 'aiRoles' : 'userRoles';
    const roles = JSON.parse(localStorage.getItem(roleKey) || '[]');
    const selectedRole = roles[index];

    if (type === 'ai') {
        currentAIRole = selectedRole;
        document.getElementById('current-ai-role').textContent = selectedRole.name;
    } else {
        currentUserRole = selectedRole;
        document.getElementById('current-user-role').textContent = selectedRole.name;
    }

    toggleSidebar(); // 关闭侧边栏
}

// API设置
function saveAPISettings() {
    const apiKey = document.getElementById('api-key').value || DEFAULT_API_KEY;
    const apiUrl = document.getElementById('api-url').value || DEFAULT_API_URL;
    const apiModel = document.getElementById('api-model').value || DEFAULT_MODEL;

    currentAPISettings = { apiKey, apiUrl, model: apiModel };
    alert('API设置已保存');
    toggleSidebar();
}

// 聊天功能
async function sendMessage() {
    const messageInput = document.getElementById('user-message');
    const message = messageInput.value.trim();

    if (!message) return;

    // 检查是否选择了角色
    if (!currentAIRole || !currentUserRole) {
        alert('请先选择AI和用户角色');
        return;
    }

    // 构建系统提示词和消息
    const systemPrompt = `你是${currentAIRole.name}，性别是${currentAIRole.gender}。${currentAIRole.description}。`;
    const userPrompt = `用户是${currentUserRole.name}，性别是${currentUserRole.gender}。`;

    // 在聊天界面显示用户消息
    displayMessage('user', message);
    messageInput.value = '';

    try {
        const response = await fetchAIResponse(systemPrompt, userPrompt, message);
        displayMessage('ai', response);
    } catch (error) {
        displayMessage('ai', '抱歉，发生了错误：' + error.message);
    }
}

async function fetchAIResponse(systemPrompt, userPrompt, userMessage) {
    const messages = [
        { role: 'system', content: systemPrompt + userPrompt },
        { role: 'user', content: userMessage }
    ];

    const response = await fetch(currentAPISettings.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentAPISettings.apiKey}`
        },
        body: JSON.stringify({
            model: currentAPISettings.model,
            messages: messages
        })
    });

    if (!response.ok) {
        throw new Error('API请求失败');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function displayMessage(type, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${type}-message`);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);

    // 自动滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 保存消息到对话历史
    conversationHistory.push({ type, message });

    // 限制历史记录数量
    if (conversationHistory.length > 50) {
        conversationHistory.shift();
    }
}

// 下载聊天记录
function downloadChatHistory() {
    const roleNames = currentAIRole && currentUserRole 
        ? `${currentAIRole.name} 与 ${currentUserRole.name} 的聊天记录` 
        : '聊天记录';

    const formattedHistory = conversationHistory.map(msg => 
        msg.type === 'ai' 
            ? `${currentAIRole.name}：${msg.message}` 
            : `${currentUserRole.name}：${msg.message}`
    ).join('\n');

    const blob = new Blob([formattedHistory], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${roleNames}_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
}

// 清除聊天记录
function clearChatHistory() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    conversationHistory = [];
}

// 初始化
function initApp() {
    // 初始化角色列表
    updateRoleList('ai');
    updateRoleList('user');

    // 监听页面加载
    window.addEventListener('load', () => {
        // 可以在这里添加初始化逻辑
    });
}

// 启动应用
initApp();

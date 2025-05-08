document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const domainInput = document.getElementById('domain');
  const groupNameInput = document.getElementById('group-name');
  const groupColorSelect = document.getElementById('group-color');
  const addGroupButton = document.getElementById('add-group');
  const groupListDiv = document.getElementById('group-list');
  const successMessage = document.getElementById('success-message');
  
  // 加载已保存的分组配置
  loadGroups();
  
  // 添加分组按钮点击事件
  addGroupButton.addEventListener('click', function() {
    const domain = domainInput.value.trim();
    const groupName = groupNameInput.value.trim();
    const groupColor = groupColorSelect.value;
    
    if (!domain || !groupName) {
      alert('请输入域名和分组名称');
      return;
    }
    
    // 添加新分组配置
    addGroupConfig(domain, groupName, groupColor);
    
    // 清空输入框
    domainInput.value = '';
    groupNameInput.value = '';
    groupColorSelect.value = 'blue';
  });
  
  // 加载已保存的分组配置
  function loadGroups() {
    chrome.storage.sync.get('tabGroups', function(data) {
      const groups = data.tabGroups || [];
      
      // 清空分组列表
      groupListDiv.innerHTML = '';
      
      if (groups.length === 0) {
        groupListDiv.innerHTML = '<p>暂无分组配置</p>';
        return;
      }
      
      // 显示所有分组配置
      groups.forEach(function(group, index) {
        addGroupToList(group, index);
      });
    });
  }
  
  // 将分组配置添加到列表中显示
  function addGroupToList(group, index) {
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.innerHTML = `
      <div><strong>域名:</strong> ${group.domain}</div>
      <div><strong>分组名称:</strong> ${group.name}</div>
      <div><strong>分组颜色:</strong> ${getColorName(group.color)}</div>
      <div class="group-controls">
        <button class="delete-group" data-index="${index}">删除</button>
      </div>
    `;
    
    groupListDiv.appendChild(groupItem);
    
    // 添加删除按钮事件
    groupItem.querySelector('.delete-group').addEventListener('click', function() {
      deleteGroup(parseInt(this.getAttribute('data-index')));
    });
  }
  
  // 添加新分组配置
  function addGroupConfig(domain, name, color) {
    chrome.storage.sync.get('tabGroups', function(data) {
      const groups = data.tabGroups || [];
      
      // 添加新分组
      groups.push({
        domain: domain,
        name: name,
        color: color
      });
      
      // 保存配置
      chrome.storage.sync.set({tabGroups: groups}, function() {
        // 显示成功消息
        successMessage.style.display = 'block';
        setTimeout(function() {
          successMessage.style.display = 'none';
        }, 2000);
        
        // 重新加载分组列表
        loadGroups();
      });
    });
  }
  
  // 删除分组配置
  function deleteGroup(index) {
    chrome.storage.sync.get('tabGroups', function(data) {
      const groups = data.tabGroups || [];
      
      // 删除指定索引的分组
      groups.splice(index, 1);
      
      // 保存配置
      chrome.storage.sync.set({tabGroups: groups}, function() {
        // 重新加载分组列表
        loadGroups();
      });
    });
  }
  
  // 获取颜色名称
  function getColorName(color) {
    const colorMap = {
      'blue': '蓝色',
      'red': '红色',
      'yellow': '黄色',
      'green': '绿色',
      'grey': '灰色',
      'pink': '粉色',
      'purple': '紫色',
      'cyan': '青色',
      'orange': '橙色',
      'brown': '棕色',
      'black': '黑色',
      'white': '白色',
      'lime': '青柠色',
      'teal': '鸭绿色',
      'indigo': '靛蓝色',
      'violet': '紫罗兰色',
      'coral': '珊瑚色',
      'magenta': '品红色',
      'olive': '橄榄色',
      'navy': '海军蓝'
    };
    
    return colorMap[color] || color;
  }
}); 
// 监听标签创建事件
chrome.tabs.onCreated.addListener(function(tab) {
  // 新标签页可能没有URL，需要等待它加载
  if (tab.url && tab.url !== 'chrome://newtab/') {
    checkAndGroupTab(tab);
  }
});

// 监听标签更新事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // 仅当URL完成加载时处理
  if (changeInfo.status === 'complete' && tab.url && tab.url !== 'chrome://newtab/') {
    checkAndGroupTab(tab);
  }
});

// 检查并分组标签
function checkAndGroupTab(tab) {
  // 从URL提取域名
  let domain = extractDomain(tab.url);
  if (!domain) return;
  
  // 获取配置
  chrome.storage.sync.get('tabGroups', function(data) {
    const groups = data.tabGroups || [];
    
    // 查找匹配的分组配置
    const matchingGroup = findMatchingGroup(domain, groups);
    if (!matchingGroup) return;
    
    // 处理标签分组
    handleTabGrouping(tab, matchingGroup);
  });
}

// 从URL提取域名
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    // 获取主域名部分 (例如 "google.com" 而不是 "www.google.com")
    let domain = urlObj.hostname;
    
    // 移除 'www.' 前缀
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch (e) {
    return null;
  }
}

// 查找匹配的分组配置
function findMatchingGroup(domain, groups) {
  // 查找完全匹配或部分匹配的配置
  return groups.find(group => {
    // 提取配置中的域名（可能包含通配符或子域名）
    const configDomain = group.domain.trim().toLowerCase();
    
    // 完全匹配
    if (domain === configDomain) {
      return true;
    }
    
    // 检查域名是否包含配置的域名（对于子域名情况）
    if (domain.endsWith('.' + configDomain)) {
      return true;
    }
    
    // 检查配置是否使用通配符（例如 *.google.com）
    if (configDomain.startsWith('*.') && domain.endsWith(configDomain.substring(2))) {
      return true;
    }
    
    return false;
  });
}

// 处理标签分组
function handleTabGrouping(tab, groupConfig) {
  // 查找所有标签
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    // 查找相同域名的标签
    const domain = extractDomain(tab.url);
    const tabsToGroup = tabs.filter(t => {
      if (!t.url) return false;
      const tabDomain = extractDomain(t.url);
      return tabDomain === domain || 
             tabDomain?.endsWith('.' + domain) || 
             domain?.endsWith('.' + tabDomain);
    }).map(t => t.id);
    
    // 查找这些标签是否已经在分组中
    checkExistingGroups(tabsToGroup, groupConfig);
  });
}

// 检查现有分组
function checkExistingGroups(tabIds, groupConfig) {
  if (tabIds.length === 0) return;
  
  // 获取所有标签的分组信息
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    // 查找已存在的相关分组
    const existingGroupIds = new Set();
    tabs.forEach(tab => {
      if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && 
          tabIds.includes(tab.id)) {
        existingGroupIds.add(tab.groupId);
      }
    });
    
    if (existingGroupIds.size > 0) {
      // 已有分组，将所有标签移到第一个分组
      const targetGroupId = existingGroupIds.values().next().value;
      moveTabsToGroup(tabIds, targetGroupId);
    } else {
      // 没有现有分组，创建新分组
      createNewGroup(tabIds, groupConfig);
    }
  });
}

// 将标签移动到现有分组
function moveTabsToGroup(tabIds, groupId) {
  chrome.tabs.group({tabIds: tabIds, groupId: groupId}, function() {
    // 标签已添加到现有分组
  });
}

// 创建新分组
function createNewGroup(tabIds, groupConfig) {
  chrome.tabs.group({tabIds: tabIds}, function(groupId) {
    // 设置分组标题和颜色
    chrome.tabGroups.update(groupId, {
      title: groupConfig.name,
      color: groupConfig.color
    });
  });
} 
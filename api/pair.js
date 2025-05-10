import request from '@/utils/request'

/**
 * 获取所有可选队友数据列表
 * @param {Object} params 查询参数 {pageNo, pageSize}
 * @returns {Promise} 返回请求Promise
 */
export function getOpponentsList(params) {
  // 构造查询参数，确保depart_ids存在
  const queryParams = {
    pageNo: params.pageNo || 1,
    pageSize: params.pageSize || 10,
    depart_ids: params.depart_ids || '1' // 确保是字符串形式
  };

  return request({
    url: '/pair/chooselist',
    method: 'post',
    params: queryParams // 作为URL查询参数传递
  })
}

/**
 * 添加对弈关系
 * @param {Object} data 对弈关系数据
 * @returns {Promise} 返回请求Promise
 */
export function addChessFriendPair(data) {
  return request({
    url: '/pair/chessFriendPair/add',
    method: 'post',
    data: data
  }).then(response => {
    // 记录返回的完整响应
    console.log('addChessFriendPair响应:', response);

    // 如果success为true但返回的result是字符串，说明没有正确的ID
    if (response.success && typeof response.result === 'string' && !response.result.match(/^[0-9]+$/)) {
      console.error('警告：addChessFriendPair返回了非ID格式的result:', response.result);

      // 使用额外的请求查询最新的邀请
      return listLatestInvitation(data.sourceUserId).then(latestRes => {
        if (latestRes.success && latestRes.result && latestRes.result.records && latestRes.result.records.length > 0) {
          // 获取最新的邀请ID
          const latestInvite = latestRes.result.records[0];
          console.log('查询到最新邀请:', latestInvite);

          // 使用查询到的邀请构造新的响应
          response.result = latestInvite;
          return response;
        }
        return response;
      }).catch(err => {
        console.error('查询最新邀请失败:', err);
        return response;
      });
    }

    return response;
  });
}

/**
 * 查询最新的邀请记录
 * @param {String} userId 用户ID
 * @returns {Promise} 返回请求Promise
 */
export function listLatestInvitation(userId) {
  return request({
    url: '/pair/chessFriendPair/list',
    method: 'get',
    params: {
      sourceUserId: userId,
      pageNo: 1,
      pageSize: 1,
      sortField: 'createTime',
      sortOrder: 'desc'
    }
  });
}

/**
 * 查询对弈关系列表
 * @param {Object} query 查询参数
 * @returns {Promise} 返回请求Promise
 */
export function listChessFriendPair(query) {
  return request({
    url: '/pair/chessFriendPair/list',
    method: 'get',
    params: query
  })
}

/**
 * 查询待接受的邀请
 * @param {String} userId 当前用户ID
 * @returns {Promise} 返回请求Promise
 */
export function queryPendingInvitations(userId) {
  return request({
    url: '/pair/chessFriendPair/queryPendingInvitations',
    method: 'get',
    params: { userId }
  })
}

/**
 * 响应邀请（接受或拒绝）
 * @param {String} id 邀请ID
 * @param {Number} status 状态：1-接受，2-拒绝
 * @returns {Promise} 返回请求Promise
 */
export function respondInvitation(id, status) {
  return request({
    url: '/pair/chessFriendPair/respondInvitation',
    method: 'post',
    params: { id, status }
  })
}

/**
 * 查询邀请状态
 * @param {String} sourceUserId 发起邀请用户ID
 * @param {String} acceptUserId 接受邀请用户ID
 * @returns {Promise} 返回请求Promise
 */
export function getInvitationStatus(sourceUserId, acceptUserId) {
  console.log('调用getInvitationStatus API，参数:', { sourceUserId, acceptUserId });

  // 检查参数有效性
  if (!sourceUserId || !acceptUserId) {
    console.error('无效的参数:', { sourceUserId, acceptUserId });
    return Promise.reject(new Error('无效的用户ID参数'));
  }

  return request({
    url: '/pair/chessFriendPair/getInvitationStatus',
    method: 'get',
    params: { sourceUserId, acceptUserId }
  })
}

/**
 * 取消邀请
 * @param {String} id 邀请ID
 * @returns {Promise} 返回请求Promise
 */
export function cancelInvitation(id) {
  console.log('调用cancelInvitation API，参数ID:', id);

  // 检查ID是否为纯数字
  if (typeof id === 'string' && !id.match(/^[0-9]+$/)) {
    console.error('无效的邀请ID格式:', id);
    return Promise.reject(new Error('无效的邀请ID格式'));
  }

  // 确保id是字符串类型
  const inviteId = String(id);

  return request({
    url: '/pair/chessFriendPair/cancelInvitation',
    method: 'post',
    data: { id: inviteId }
  })
}

/**
 * 清理用户发出的未响应邀请
 * @param {String} userId 用户ID
 * @returns {Promise} 返回请求Promise
 */
export function clearPendingInvitations(userId) {
  console.log('清理用户未响应邀请，用户ID:', userId);

  return request({
    url: '/pair/chessFriendPair/clearPendingInvitations',
    method: 'post',
    data: { userId }
  })
}

// 根据邀请ID获取游戏ID
export function getGameIdByInviteId(sourceInviteId) {
  return request({
    url: '/game/chessGame/getGameIdByInviteId',
    method: 'get',
    params: { sourceInviteId }
  });
} 
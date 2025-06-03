import request from '@/utils/request'

/**
 * 获取玩家积分信息
 * @param {String} userId 用户ID
 * @returns {Promise}
 */
export function getPlayerRating(userId) {
  return request({
    url: `/score/player/${userId}`,
    method: 'get'
  })
}

/**
 * 批量获取玩家积分信息
 * @param {Array} userIds 用户ID数组
 * @returns {Promise}
 */
export function getBatchPlayerRatings(userIds) {
  return request({
    url: '/score/players/batch',
    method: 'post',
    data: { userIds }
  })
}

/**
 * 获取玩家在线状态
 * @param {String} userId 用户ID
 * @returns {Promise}
 */
export function getPlayerOnlineStatus(userId) {
  return request({
    url: `/system/user/online-status/${userId}`,
    method: 'get'
  })
}

/**
 * 批量获取玩家在线状态
 * @param {Array} userIds 用户ID数组
 * @returns {Promise}
 */
export function getBatchPlayerOnlineStatus(userIds) {
  return request({
    url: '/system/user/online-status/batch',
    method: 'post',
    data: { userIds }
  })
}

/**
 * 获取玩家详细信息（包含积分、在线状态等）
 * @param {String} userId 用户ID
 * @returns {Promise}
 */
export function getPlayerDetailInfo(userId) {
  return request({
    url: `/system/user/detail/${userId}`,
    method: 'get'
  })
}

/**
 * 搜索玩家
 * @param {Object} params 搜索参数 {keyword, pageNo, pageSize}
 * @returns {Promise}
 */
export function searchPlayers(params) {
  return request({
    url: '/system/user/search',
    method: 'get',
    params: params
  })
}

/**
 * 获取热门玩家列表
 * @param {Object} params 查询参数 {pageNo, pageSize}
 * @returns {Promise}
 */
export function getPopularPlayers(params) {
  return request({
    url: '/system/user/popular',
    method: 'get',
    params: params
  })
}
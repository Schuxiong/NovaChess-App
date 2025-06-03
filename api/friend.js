import request from '@/utils/request'

/**
 * 获取可选队友列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getFriendChooseList(params) {
  return request({
    url: '/pair/chooselist',
    method: 'post',
    data: params
  })
}

/**
 * 获取好友列表（基于部门）
 * @param {Object} params 查询参数 {depart_ids, pageNo, pageSize}
 * @returns {Promise}
 */
export function getFriendList(params) {
  return request({
    url: '/pair/chooselist',
    method: 'post',
    params: {
      depart_ids: Array.isArray(params.depart_ids) ? params.depart_ids.join(',') : params.depart_ids,
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 10
    }
  })
}

/**
 * 搜索好友
 * @param {Object} params 搜索参数 {depart_ids, username, pageNo, pageSize}
 * @returns {Promise}
 */
export function searchFriends(params) {
  return request({
    url: '/pair/chooselist',
    method: 'post',
    params: {
      depart_ids: Array.isArray(params.depart_ids) ? params.depart_ids.join(',') : params.depart_ids,
      username: params.username,
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 10
    }
  })
}
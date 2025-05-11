import request from '@/utils/request'

/**
 * 获取玩家积分列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getPlayerScoreList(params) {
  return request({
    url: '/score/chessPlayerScore/list',
    method: 'get',
    params
  })
}

/**
 * 根据ID查询玩家积分
 * @param {String} id 玩家积分ID
 * @returns {Promise}
 */
export function getPlayerScoreById(id) {
  return request({
    url: '/score/chessPlayerScore/queryById',
    method: 'get',
    params: { id }
  })
}

/**
 * 添加玩家积分
 * @param {Object} data 积分数据
 * @returns {Promise}
 */
export function addPlayerScore(data) {
  return request({
    url: '/score/chessPlayerScore/add',
    method: 'post',
    data
  })
}

/**
 * 更新玩家积分
 * @param {Object} data 积分数据
 * @returns {Promise}
 */
export function updatePlayerScore(data) {
  return request({
    url: '/score/chessPlayerScore/edit',
    method: 'put',
    data
  })
}

/**
 * 删除玩家积分
 * @param {String} id 积分ID
 * @returns {Promise}
 */
export function deletePlayerScore(id) {
  return request({
    url: '/score/chessPlayerScore/delete',
    method: 'delete',
    params: { id }
  })
}

/**
 * 获取积分记录列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getPlayerScoreRecordList(params) {
  return request({
    url: '/score/chessPlayerScoreRecord/list',
    method: 'get',
    params
  })
}

/**
 * 根据ID查询积分记录
 * @param {String} id 记录ID
 * @returns {Promise}
 */
export function getPlayerScoreRecordById(id) {
  return request({
    url: '/score/chessPlayerScoreRecord/queryById',
    method: 'get',
    params: { id }
  })
}

/**
 * 添加积分记录
 * @param {Object} data 记录数据
 * @returns {Promise}
 */
export function addPlayerScoreRecord(data) {
  return request({
    url: '/score/chessPlayerScoreRecord/add',
    method: 'post',
    data
  })
}

/**
 * 更新积分记录
 * @param {Object} data 记录数据
 * @returns {Promise}
 */
export function updatePlayerScoreRecord(data) {
  return request({
    url: '/score/chessPlayerScoreRecord/edit',
    method: 'put',
    data
  })
}

/**
 * 删除积分记录
 * @param {String} id 记录ID
 * @returns {Promise}
 */
export function deletePlayerScoreRecord(id) {
  return request({
    url: '/score/chessPlayerScoreRecord/delete',
    method: 'delete',
    params: { id }
  })
} 
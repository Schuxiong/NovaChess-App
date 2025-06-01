import request from '@/utils/request'

/**
 * 游戏初始化
 * @param {Object} data 初始化数据
 * @returns {Promise} 返回请求Promise
 */
export function initGame(data) {
  return request({
    url: '/game/chessGame/init',
    method: 'post',
    data
  })
}

/**
 * 用户进入游戏
 * @returns {Promise} 返回请求Promise
 */
export function enterGame() {
  return request({
    url: '/game/chessGame/enter',
    method: 'post'
  })
}

/**
 * 行棋操作
 * @param {Object} data 行棋数据
 * @returns {Promise} 返回请求Promise
 */
export function moveChess(data) {
  return request({
    url: '/game/chessMove/move',
    method: 'post',
    data
  })
}

/**
 * 获取棋局动作列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回请求Promise
 */
export function getChessMovesHistory(params) {
  return request({
    url: '/game/chessMove/list',
    method: 'get',
    params
  })
}

/**
 * 更新游戏状态
 * @param {Object} data 游戏数据
 * @returns {Promise} 返回请求Promise
 */
export function updateGameStatus(data) {
  return request({
    url: '/game/chessGame/edit',
    method: 'put',
    data
  })
}

/**
 * 获取对局回放记录
 * @param {String} gameId 游戏ID
 * @returns {Promise}
 */
export function getGameReplayRecords(gameId) {
  return request({
    url: `/game/chessGame/replay/${gameId}`,
    method: 'get'
  })
}

/**
 * 获取历史对局列表
 * @param {Object} params 查询参数 {pageNo, pageSize, ...}
 * @returns {Promise}
 */
export function getHistoryGamesList(params) {
  return request({
    url: '/game/chessGame/list',
    method: 'get',
    params
  })
}
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
    url: `/game/chessGame/replay/complete/${gameId}`,
    method: 'get'
  })
}

/**
 * 获取历史对局列表（包含积分信息）
 * @param {Object} params 查询参数 {pageNo, pageSize, gameState, gameType, blackPlayAccount, whitePlayAccount}
 * @returns {Promise} 返回对局列表，每个对局包含blackPlayerScore和whitePlayerScore字段
 */
export function getHistoryGamesList(params) {
  return request({
    url: '/game/chessGame/list',
    method: 'get',
    params: {
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 10,
      gameState: params.gameState, // 游戏状态筛选
      gameType: params.gameType,   // 游戏类型筛选
      blackPlayAccount: params.blackPlayAccount, // 黑方账号筛选
      whitePlayAccount: params.whitePlayAccount, // 白方账号筛选
      ...params
    }
  })
}

/**
 * 获取我的对局历史
 * @param {Object} params 查询参数 {pageNo, pageSize, userId}
 * @returns {Promise}
 */
export function getMyGameHistory(params) {
  return request({
    url: '/game/chessGame/list',
    method: 'get',
    params: {
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 10,
      ...params
    }
  })
}

/**
 * 发起和棋请求
 * @param {String} gameId 游戏ID
 * @returns {Promise} 返回请求Promise
 */
export function requestDraw(gameId) {
  return request({
    url: `/game/chessGame/draw/request/${gameId}`,
    method: 'post'
  })
}

/**
 * 响应和棋请求
 * @param {String} gameId 游戏ID
 * @param {Boolean} accept 是否接受和棋
 * @returns {Promise} 返回请求Promise
 */
export function respondDraw(gameId, accept) {
  return request({
    url: `/game/chessGame/draw/respond/${gameId}?accept=${accept}`,
    method: 'post'
  })
}

/**
 * 获取和棋请求状态
 * @param {String} gameId 游戏ID
 * @returns {Promise} 返回请求Promise
 */
export function getDrawStatus(gameId) {
  return request({
    url: `/game/chessGame/draw/status/${gameId}`,
    method: 'get'
  })
}

/**
 * 取消和棋请求
 * @param {String} gameId 游戏ID
 * @returns {Promise} 返回请求Promise
 */
export function cancelDrawRequest(gameId) {
  return request({
    url: `/game/chessGame/draw/cancel/${gameId}`,
    method: 'post'
  })
}

/**
 * 投降
 * @param {String} gameId 游戏ID
 * @returns {Promise} 返回请求Promise
 */
export function quitGame(gameId) {
  return request({
    url: `/game/chessGame/quit/${gameId}`,
    method: 'post'
  })
}
import request from '@/utils/request'

// 课程管理API

/**
 * 获取课程列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回请求Promise
 */
export function getCourseList(params) {
  return request({
    url: '/course/chessCourse/list',
    method: 'get',
    params
  })
}

/**
 * 添加课程
 * @param {Object} data 课程数据
 * @returns {Promise} 返回请求Promise
 */
export function addCourse(data) {
  return request({
    url: '/course/chessCourse/add',
    method: 'post',
    data
  })
}

/**
 * 编辑课程
 * @param {Object} data 课程数据
 * @returns {Promise} 返回请求Promise
 */
export function updateCourse(data) {
  return request({
    url: '/course/chessCourse/edit',
    method: 'post',
    data
  })
}

/**
 * 删除课程
 * @param {String|Number} id 课程ID
 * @returns {Promise} 返回请求Promise
 */
export function deleteCourse(id) {
  return request({
    url: '/course/chessCourse/delete',
    method: 'delete',
    params: { id }
  })
}

/**
 * 批量删除课程
 * @param {Array} ids 课程ID数组
 * @returns {Promise} 返回请求Promise
 */
export function batchDeleteCourse(ids) {
  return request({
    url: '/course/chessCourse/deleteBatch',
    method: 'delete',
    data: ids
  })
}

/**
 * 获取课程详情
 * @param {String|Number} id 课程ID
 * @returns {Promise} 返回请求Promise
 */
export function getCourseDetail(id) {
  return request({
    url: '/course/chessCourse/queryById',
    method: 'get',
    params: { id }
  })
}

// 课程步骤管理API

/**
 * 获取步骤列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回请求Promise
 */
export function getCourseStepList(params) {
  return request({
    url: '/course/chessCourseStep/list',
    method: 'get',
    params
  })
}

/**
 * 添加步骤
 * @param {Object} data 步骤数据
 * @returns {Promise} 返回请求Promise
 */
export function addCourseStep(data) {
  return request({
    url: '/course/chessCourseStep/add',
    method: 'post',
    data
  })
}

/**
 * 编辑步骤
 * @param {Object} data 步骤数据
 * @returns {Promise} 返回请求Promise
 */
export function updateCourseStep(data) {
  return request({
    url: '/course/chessCourseStep/edit',
    method: 'post',
    data
  })
}

/**
 * 删除步骤
 * @param {String|Number} id 步骤ID
 * @returns {Promise} 返回请求Promise
 */
export function deleteCourseStep(id) {
  return request({
    url: '/course/chessCourseStep/delete',
    method: 'delete',
    params: { id }
  })
}

/**
 * 批量删除步骤
 * @param {Array} ids 步骤ID数组
 * @returns {Promise} 返回请求Promise
 */
export function batchDeleteCourseStep(ids) {
  return request({
    url: '/course/chessCourseStep/deleteBatch',
    method: 'delete',
    data: ids
  })
}

/**
 * 获取步骤详情
 * @param {String|Number} id 步骤ID
 * @returns {Promise} 返回请求Promise
 */
export function getCourseStepDetail(id) {
  return request({
    url: '/course/chessCourseStep/queryById',
    method: 'get',
    params: { id }
  })
}

// 棋盘设置管理API

/**
 * 获取棋盘设置列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回请求Promise
 */
export function getBoardSetupList(params) {
  return request({
    url: '/course/chessBoardSetup/list',
    method: 'get',
    params
  })
}

/**
 * 添加棋盘设置
 * @param {Object} data 棋盘设置数据
 * @returns {Promise} 返回请求Promise
 */
export function addBoardSetup(data) {
  return request({
    url: '/course/chessBoardSetup/add',
    method: 'post',
    data
  })
}

/**
 * 编辑棋盘设置
 * @param {Object} data 棋盘设置数据
 * @returns {Promise} 返回请求Promise
 */
export function updateBoardSetup(data) {
  return request({
    url: '/course/chessBoardSetup/edit',
    method: 'post',
    data
  })
}

/**
 * 删除棋盘设置
 * @param {String|Number} id 棋盘设置ID
 * @returns {Promise} 返回请求Promise
 */
export function deleteBoardSetup(id) {
  return request({
    url: '/course/chessBoardSetup/delete',
    method: 'delete',
    params: { id }
  })
}

/**
 * 批量删除棋盘设置
 * @param {Array} ids 棋盘设置ID数组
 * @returns {Promise} 返回请求Promise
 */
export function batchDeleteBoardSetup(ids) {
  return request({
    url: '/course/chessBoardSetup/deleteBatch',
    method: 'delete',
    data: ids
  })
}

/**
 * 获取棋盘设置详情
 * @param {String|Number} id 棋盘设置ID
 * @returns {Promise} 返回请求Promise
 */
export function getBoardSetupDetail(id) {
  return request({
    url: '/course/chessBoardSetup/queryById',
    method: 'get',
    params: { id }
  })
}
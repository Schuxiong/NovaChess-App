<template>
  <view class="rules-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <!-- 棋盘区域 -->
    <view class="chess-board-area">
      <chess-board
        ref="chessBoard"
        :board-state="boardState"
        :selected-position="selectedPosition"
        :valid-moves="validMoves"
        :last-move="lastMove"
        :current-player="currentPlayer"
        :play-as="'white'"
        :interactive="true"
        @cell-click="handleCellClick"
      />
      
      <!-- 课程完成弹窗 -->
      <view v-if="showCompletionModal" class="lesson-completion-modal">
        <view class="modal-content">
          <view class="close-btn" @click="showCompletionModal = false">
            <text class="iconfont icon-close"></text>
          </view>
          <view class="completion-title">课程完成</view>
          <view class="medal-icon">
            <image src="/static/images/learn/medal.png" mode="aspectFit"></image>
          </view>
          <view class="progress-text">课程学习完成！</view>
          <view class="continue-btn" @click="goBack">
            <text>返回课程列表</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 教学卡片区域 -->
    <view class="teaching-card">
      <!-- 标题区 -->
      <view class="card-header">
        <view class="back-btn" @click="goBack">
          <text class="iconfont icon-left"></text>
        </view>
        <view class="title">
          <text>{{ courseInfo.title || '自定义课程' }}</text>
        </view>
        <view class="sound-btn" @click="toggleSound">
          <text class="iconfont" :class="isSoundOn ? 'icon-sound' : 'icon-sound-off'"></text>
        </view>
      </view>
      
      <!-- 教练指导区 -->
      <view class="coach-guidance">
        <view class="avatar">
          <image :src="currentRobotAvatar" mode="aspectFit"></image>
        </view>
        <view class="message-bubble" :class="{'error-message': currentMessage.isError}">
          <text>{{ currentMessage.text }}</text>
        </view>
      </view>
      
      <!-- 进度条 -->
      <view class="progress-section">
        <text class="progress-text">挑战 {{ currentStep }}/{{ totalSteps }}</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{width: `${(currentStep / totalSteps) * 100}%`}"></view>
        </view>
      </view>
      
      <!-- 按钮区 -->
      <view class="button-section">
        <view v-if="showHintBtn" class="hint-btn" @click="showHint">
          <text class="iconfont icon-lightbulb"></text>
          <text>提示</text>
        </view>
        
        <view v-if="actionState === 'initial'" class="action-btn primary-btn" @click="startLesson">
          <text>学一下！</text>
        </view>
        
        <view v-if="actionState === 'retry'" class="action-btn error-btn" @click="retryStep">
          <text>重试</text>
        </view>
        
        <view v-if="actionState === 'next'" class="action-btn primary-btn" @click="nextStep">
          <text>下一步</text>
          <text class="iconfont icon-right"></text>
        </view>
        
        <view v-if="actionState === 'next-lesson'" class="action-btn primary-btn" @click="completeLesson">
          <text>完成课程</text>
          <text class="iconfont icon-double-right"></text>
        </view>
      </view>
    </view>
    
    <!-- 底部导航栏 -->
    <tab-bar active-tab="learn"></tab-bar>
  </view>
</template>

<script>
import ChessBoard from '@/components/chess/ChessBoard.vue'
import TopSpacing from '@/components/TopSpacing.vue'
import TabBar from '@/components/TabBar.vue'
import { getCourseDetail } from '@/api/course'
import { getInitialChessboard, getPieceType, getPieceColor, getValidMoves } from '@/utils/chess/cheesLogic.js'

export default {
  components: {
    ChessBoard,
    TopSpacing,
    TabBar
  },
  data() {
    return {
      statusBarHeight: 0,
      courseInfo: {},
      courseId: '',
      
      // 棋盘状态
      boardState: (() => {
        const board = []
        for (let row = 0; row < 8; row++) {
          board[row] = []
          for (let col = 0; col < 8; col++) {
            board[row][col] = null
          }
        }
        return board
      })(),
      selectedPosition: null,
      validMoves: [],
      lastMove: null,
      currentPlayer: 'white',
      
      // 课程进度
      currentStep: 0,
      totalSteps: 0,
      actionState: 'initial', // initial, retry, next, next-lesson
      showHintBtn: false,
      
      // 消息和UI状态
      currentMessage: {
        text: '加载课程中...',
        isError: false
      },
      showCompletionModal: false,
      
      // 音效和头像
      isSoundOn: true,
      audioContext: null,
      normalRobotAvatar: 'https://pic1.imgdb.cn/item/67f3eb4ce381c3632beea0b4.png',
      errorRobotAvatar: 'https://pic1.imgdb.cn/item/67f3eb4ce381c3632beea0b4.png',
      currentRobotAvatar: 'https://pic1.imgdb.cn/item/67f3eb4ce381c3632beea0b4.png'
    }
  },
  onLoad(options) {
    this.courseId = options.id || ''
    this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
    
    if (this.courseId) {
      this.loadCourseDetail()
    } else {
      this.currentMessage = {
        text: '课程ID不存在，请返回重新选择课程',
        isError: true
      }
    }
    
    this.initAudioContext()
  },
  methods: {
    // 加载课程详情
    async loadCourseDetail() {
      try {
        const response = await getCourseDetail(this.courseId)
        
        if (response.code === 200 && response.result) {
          this.courseInfo = response.result
          
          // 处理默认图标
          if (!this.courseInfo.icon) {
            this.courseInfo.icon = 'https://pic1.imgdb.cn/item/67f3eb4ce381c3632beea0b4.png'
          }
          
          // 初始化课程
          this.initCourse()
        } else {
          this.currentMessage = {
            text: response.message || '加载课程失败，请重试',
            isError: true
          }
        }
      } catch (error) {
        console.error('加载课程详情失败:', error)
        this.currentMessage = {
          text: '网络错误，请检查网络连接后重试',
          isError: true
        }
      }
    },
    
    // 初始化课程
    initCourse() {
      if (!this.courseInfo.steps || this.courseInfo.steps.length === 0) {
        this.currentMessage = {
          text: '该课程暂无学习内容，请联系管理员',
          isError: true
        }
        return
      }
      
      // 计算总步骤数
      this.totalSteps = this.courseInfo.steps.filter(step => step.type === 'task').length
      this.currentStep = 0
      
      // 初始化棋盘
      this.initBoard()
      
      // 显示初始消息
      this.showInitialMessage()
    },
    
    // 初始化棋盘
    initBoard() {
      // 创建空棋盘
      this.boardState = getInitialChessboard()
      
      const initialStep = this.courseInfo.steps[0]
      const boardSetup = initialStep && initialStep.boardSetup || {}
      
      // 如果需要清空棋盘
      if (boardSetup.clear) {
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            this.boardState[row][col] = null
          }
        }
      }
      
      // 如果有指定的棋子，放置它们
      if (boardSetup.pieces) {
        boardSetup.pieces.forEach(item => {
          this.boardState[item.position.row][item.position.col] = item.piece
        })
      }
    },
    
    // 初始化音频上下文
    initAudioContext() {
      this.audioContext = uni.createInnerAudioContext()
      this.audioContext.src = '/static/audio/move.mp3'
      this.audioContext.autoplay = false
    },
    
    // 切换声音开关
    toggleSound() {
      this.isSoundOn = !this.isSoundOn
      uni.showToast({
        title: this.isSoundOn ? '声音已开启' : '声音已关闭',
        icon: 'none',
        duration: 1500
      })
    },
    
    // 播放音效
    playSound(type = 'move') {
      if (!this.isSoundOn) return
      
      const soundMap = {
        move: '/static/audio/move.mp3',
        correct: '/static/audio/correct.mp3',
        error: '/static/audio/error.mp3',
        complete: '/static/audio/complete.mp3'
      }
      
      this.audioContext.src = soundMap[type] || soundMap.move
      this.audioContext.play()
    },
    
    // 显示初始消息
    showInitialMessage() {
      const initialStep = this.courseInfo.steps[0]
      this.currentMessage = {
        text: initialStep.message || '欢迎学习本课程！',
        isError: false
      }
      this.actionState = 'initial'
      this.currentRobotAvatar = this.normalRobotAvatar
    },
    
    // 开始课程
    startLesson() {
      this.playSound('move')
      this.goToNextTaskStep()
    },
    
    // 前往下一个任务步骤
    goToNextTaskStep() {
      let nextStepIndex = -1
      let taskCount = 0
      
      for (let i = 0; i < this.courseInfo.steps.length; i++) {
        const step = this.courseInfo.steps[i]
        if (step.type === 'task') {
          taskCount++
          if (taskCount > this.currentStep) {
            nextStepIndex = i
            break
          }
        }
      }
      
      if (nextStepIndex !== -1) {
        const nextStep = this.courseInfo.steps[nextStepIndex]
        this.currentMessage = {
          text: nextStep.message || '请按照指示完成操作',
          isError: false
        }
        this.currentRobotAvatar = this.normalRobotAvatar
        this.actionState = ''
        this.showHintBtn = true
      } else {
        this.showConclusion()
      }
    },
    
    // 显示结论
    showConclusion() {
      const conclusionStep = this.courseInfo.steps.find(step => step.type === 'conclusion')
      
      if (conclusionStep) {
        this.currentMessage = {
          text: conclusionStep.message || '恭喜！您已完成本课程的学习！',
          isError: false
        }
        this.currentRobotAvatar = this.normalRobotAvatar
        this.actionState = 'next-lesson'
        this.showHintBtn = false
      }
      
      this.playSound('complete')
      
      setTimeout(() => {
        this.showCompletionModal = true
      }, 1500)
    },
    
    // 处理棋盘点击
    handleCellClick(position) {
      if (this.actionState === 'initial' || this.actionState === 'next-lesson') {
        return
      }
      
      if (this.selectedPosition) {
        if (this.selectedPosition.row === position.row && this.selectedPosition.col === position.col) {
          this.selectedPosition = null
          this.validMoves = []
          return
        }
        
        const isValidMove = this.validMoves.some(
          move => move.row === position.row && move.col === position.col
        )
        
        if (isValidMove) {
          this.movePiece(this.selectedPosition, position)
        } else {
          const clickedPiece = this.boardState[position.row][position.col]
          if (clickedPiece && getPieceColor(clickedPiece) === this.currentPlayer) {
            this.selectPiece(position)
          }
        }
      } else {
        const clickedPiece = this.boardState[position.row][position.col]
        if (clickedPiece && getPieceColor(clickedPiece) === this.currentPlayer) {
          this.selectPiece(position)
        }
      }
    },
    
    // 选择棋子
    selectPiece(position) {
      this.selectedPosition = position
      this.validMoves = getValidMoves(this.boardState, position.row, position.col)
      this.playSound('move')
    },
    
    // 移动棋子
    movePiece(from, to) {
      const activeTaskIndex = this.findActiveTaskIndex()
      if (activeTaskIndex === -1) return
      
      const activeTask = this.courseInfo.steps[activeTaskIndex]
      
      // 坐标转换：ChessBoard组件传来的坐标需要转换为标准坐标系
      // ChessBoard的坐标系是从上到下0-7，标准坐标系是从下到上0-7
      const standardFrom = {
        row: 7 - from.row,
        col: from.col
      }
      const standardTo = {
        row: 7 - to.row,
        col: to.col
      }
      
      // 调试信息
      console.log('ChessBoard坐标:', { from, to })
      console.log('转换后标准坐标:', { from: standardFrom, to: standardTo })
      console.log('期望移动:', activeTask.expectedMove)
      
      const isExpectedMove = 
        activeTask.expectedMove &&
        standardFrom.row === activeTask.expectedMove.from.row && 
        standardFrom.col === activeTask.expectedMove.from.col && 
        standardTo.row === activeTask.expectedMove.to.row && 
        standardTo.col === activeTask.expectedMove.to.col
      
      if (isExpectedMove) {
        const piece = this.boardState[from.row][from.col]
        this.boardState[to.row][to.col] = piece
        this.boardState[from.row][from.col] = null
        
        this.lastMove = { from, to }
        this.playSound('correct')
        
        this.currentMessage = {
          text: activeTask.correctMessage || '正确！继续下一步',
          isError: false
        }
        this.currentRobotAvatar = this.normalRobotAvatar
        
        this.selectedPosition = null
        this.validMoves = []
        this.currentStep++
        
        setTimeout(() => {
          this.actionState = 'next'
        }, 500)
      } else {
        this.playSound('error')
        
        this.currentMessage = {
          text: activeTask.errorMessage || '不正确，请重试',
          isError: true
        }
        this.currentRobotAvatar = this.errorRobotAvatar
        this.actionState = 'retry'
        
        this.selectedPosition = null
        this.validMoves = []
      }
    },
    
    // 找到当前活动的任务索引
    findActiveTaskIndex() {
      let taskCount = 0
      
      for (let i = 0; i < this.courseInfo.steps.length; i++) {
        const step = this.courseInfo.steps[i]
        if (step.type === 'task') {
          taskCount++
          if (taskCount === this.currentStep + 1) {
            return i
          }
        }
      }
      
      return -1
    },
    
    // 显示提示
    showHint() {
      const activeTaskIndex = this.findActiveTaskIndex()
      if (activeTaskIndex !== -1) {
        const activeTask = this.courseInfo.steps[activeTaskIndex]
        if (activeTask.hintMessage) {
          this.currentMessage = {
            text: activeTask.hintMessage,
            isError: false
          }
        }
      }
    },
    
    // 重试步骤
    retryStep() {
      this.goToNextTaskStep()
    },
    
    // 下一步
    nextStep() {
      this.goToNextTaskStep()
    },
    
    // 完成课程
    completeLesson() {
      this.showCompletionModal = true
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
.rules-container {
  min-height: 100vh;
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  padding-bottom: 30rpx;
}

.chess-board-area {
  position: relative;
  width: 100%;
  padding: 20rpx;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  min-height: 750rpx;
  transform: translateZ(0);
}

/* 课程完成弹窗 */
.lesson-completion-modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  
  .modal-content {
    background-color: #212121;
    border-radius: 20rpx;
    padding: 40rpx;
    width: 80%;
    max-width: 600rpx;
    position: relative;
    
    .close-btn {
      position: absolute;
      right: 20rpx;
      top: 20rpx;
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .iconfont {
        color: #ffffff;
        font-size: 40rpx;
      }
    }
    
    .completion-title {
      color: #ffffff;
      font-size: 40rpx;
      font-weight: bold;
      margin-bottom: 30rpx;
      text-align: center;
    }
    
    .medal-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 30rpx;
      
      image {
        width: 150rpx;
        height: 150rpx;
      }
    }
    
    .progress-text {
      color: #ffffff;
      font-size: 32rpx;
      margin-bottom: 30rpx;
      text-align: center;
    }
    
    .continue-btn {
      background-color: #8BC34A;
      border-radius: 40rpx;
      padding: 20rpx;
      text-align: center;
      
      text {
        color: #ffffff;
        font-size: 32rpx;
      }
    }
  }
}

/* 教学卡片区域 */
.teaching-card {
  background-color: rgba(33, 33, 33, 0.9);
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  margin: 0rpx 20rpx;
  flex: 1;
  z-index: 10;
}

/* 卡片标题区 */
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  
  .back-btn, .sound-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      color: #ffffff;
      font-size: 40rpx;
    }
  }
  
  .title {
    flex: 1;
    text-align: center;
    
    text {
      color: #ffffff;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
}

/* 教练指导区 */
.coach-guidance {
  display: flex;
  align-items: flex-start;
  margin: 45rpx auto;
  
  .avatar {
    width: 120rpx;
    height: 120rpx;
    margin-right: 20rpx;
    
    image {
      width: 100%;
      height: 100%;
      border-radius: 40rpx;
    }
  }
  
  .message-bubble {
    flex: 1;
    background-color: #4A4A4A;
    border-radius: 20rpx;
    padding: 30rpx;
    position: relative;
    
    &:before {
      content: '';
      position: absolute;
      left: -15rpx;
      top: 20rpx;
      border-width: 10rpx;
      border-style: solid;
      border-color: transparent #4A4A4A transparent transparent;
    }
    
    text {
      color: #ffffff;
      font-size: 32rpx;
      font-weight: bold;
      line-height: 1.4;
    }
  }
  
  .error-message {
    background-color: rgba(229, 57, 53, 0.8);
    
    &:before {
      border-color: transparent rgba(229, 57, 53, 0.8) transparent transparent;
    }
  }
}

/* 进度条区域 */
.progress-section {
  margin: 30rpx auto;
  
  .progress-text {
    color: #ffffff;
    font-size: 28rpx;
    font-weight: bold;
    padding: 10rpx 20rpx;
    margin-bottom: 10rpx;
  }
  
  .progress-bar {
    height: 15rpx;
    margin: 10rpx 0rpx;
    background-color: rgba(74, 74, 74, 0.5);
    border-radius: 10rpx;
    overflow: hidden;
    position: relative;
    
    .progress-fill {
      height: 100%;
      background-color: #8BC34A;
      border-radius: 10rpx;
      transition: width 0.5s ease;
    }
  }
}

/* 按钮区域 */
.button-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30rpx;
  gap: 20rpx;
  
  .hint-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10rpx;
    padding: 20rpx 40rpx;
    flex: 1;
    max-width: 200rpx;
    
    .iconfont {
      color: #ffffff;
      font-size: 32rpx;
      margin-right: 10rpx;
    }
    
    text {
      color: #ffffff;
      font-size: 32rpx;
    }
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10rpx;
    padding: 20rpx 30rpx;
    flex: 2;
    
    text {
      font-size: 36rpx;
      font-weight: bold;
    }
    
    .iconfont {
      margin-left: 10rpx;
    }
  }
  
  .primary-btn {
    background-color: #8BC34A;
    
    text {
      color: #ffffff;
    }
  }
  
  .error-btn {
    background-color: rgba(229, 57, 53, 0.8);
    
    text {
      color: #ffffff;
    }
  }
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  
  .back-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      color: #ffffff;
      font-size: 44rpx;
    }
  }
  
  .title {
    flex: 1;
    text-align: center;
    
    text {
      color: #ffffff;
      font-size: 44rpx;
      font-weight: bold;
    }
  }
  
  .header-right {
    width: 80rpx;
  }
}

/* 加载状态 */
.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    color: #ffffff;
    font-size: 32rpx;
  }
}

/* 课程内容 */
.course-content {
  flex: 1;
  padding: 0 30rpx;
  margin-bottom: 120rpx;
}

/* 课程信息卡片 */
.course-info-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  .course-header {
    display: flex;
    align-items: flex-start;
    
    .course-icon {
      width: 120rpx;
      height: 120rpx;
      border-radius: 16rpx;
      margin-right: 30rpx;
    }
    
    .course-meta {
      flex: 1;
      
      .course-title {
        color: #ffffff;
        font-size: 40rpx;
        font-weight: bold;
        margin-bottom: 15rpx;
        display: block;
      }
      
      .course-desc {
        color: rgba(255, 255, 255, 0.8);
        font-size: 28rpx;
        line-height: 1.5;
        margin-bottom: 20rpx;
        display: block;
      }
      
      .course-tags {
        display: flex;
        gap: 15rpx;
        
        .category-tag {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 24rpx;
          padding: 8rpx 16rpx;
          border-radius: 12rpx;
        }
        
        .steps-tag {
          background: rgba(102, 126, 234, 0.3);
          color: #ffffff;
          font-size: 24rpx;
          padding: 8rpx 16rpx;
          border-radius: 12rpx;
        }
      }
    }
  }
}

/* 步骤区域 */
.steps-section {
  margin-bottom: 40rpx;
  
  .section-title {
    margin-bottom: 30rpx;
    
    text {
      color: #ffffff;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
  
  .steps-list {
    .step-item {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      display: flex;
      align-items: center;
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      
      &:active {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(0.98);
      }
      
      .step-number {
        width: 60rpx;
        height: 60rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 30rpx;
        
        text {
          color: #ffffff;
          font-size: 28rpx;
          font-weight: bold;
        }
      }
      
      .step-content {
        flex: 1;
        
        .step-title {
          color: #ffffff;
          font-size: 32rpx;
          font-weight: bold;
          margin-bottom: 8rpx;
          display: block;
        }
        
        .step-desc {
          color: rgba(255, 255, 255, 0.7);
          font-size: 26rpx;
          line-height: 1.4;
          margin-bottom: 8rpx;
          display: block;
        }
        
        .step-type {
          color: rgba(102, 126, 234, 0.8);
          font-size: 24rpx;
          display: block;
        }
      }
      
      .step-arrow {
        .iconfont {
          color: rgba(255, 255, 255, 0.5);
          font-size: 28rpx;
        }
      }
    }
  }
  
  .empty-steps {
    text-align: center;
    padding: 80rpx 40rpx;
    
    text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 28rpx;
    }
  }
}

/* 开始学习区域 */
.start-learning-section {
  .start-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    padding: 32rpx;
    border-radius: 50rpx;
    text-align: center;
    font-size: 36rpx;
    font-weight: bold;
    box-shadow: 0 12rpx 24rpx rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.4);
    }
    
    text {
      color: #ffffff;
    }
  }
}

/* 错误状态 */
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 60rpx;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 40rpx;
    opacity: 0.6;
  }
  
  .error-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 32rpx;
    text-align: center;
    margin-bottom: 60rpx;
  }
  
  .back-btn-error {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    padding: 24rpx 48rpx;
    border-radius: 50rpx;
    font-size: 32rpx;
    
    text {
      color: #ffffff;
    }
  }
}
</style>
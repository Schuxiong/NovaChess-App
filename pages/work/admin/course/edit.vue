<template>
  <view class="course-edit-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="iconfont icon-left"></text>
      </view>
      <view class="title">
        <text>{{ isEdit ? '编辑课程' : '新建课程' }}</text>
      </view>
      <view class="header-right">
        <view class="save-btn" @click="saveCourse">
          <text>保存</text>
        </view>
      </view>
    </view>
    
    <!-- 主要内容区域 -->
    <view class="main-content">
      <!-- 左侧表单区域 -->
      <scroll-view class="form-container" scroll-y="true" enable-back-to-top="true">
        <!-- 基本信息 -->
        <view class="form-section">
          <view class="section-title">
            <text class="iconfont icon-info"></text>
            <text>基本信息</text>
          </view>
          
          <view class="form-item">
            <text class="label">课程ID</text>
            <input 
              type="text" 
              placeholder="输入英文ID，如king-moves" 
              v-model="course.id"
              :focus="!isEdit"
            />
            <text class="tip">用于系统识别课程，建议使用英文</text>
          </view>
          
          <view class="form-item">
            <text class="label">课程标题</text>
            <input 
              type="text" 
              placeholder="输入课程标题" 
              v-model="course.title"
            />
          </view>
          
          <view class="form-item">
            <text class="label">课程描述</text>
            <textarea 
              placeholder="描述此课程内容和学习收获" 
              v-model="course.description"
              maxlength="200"
            ></textarea>
            <text class="count">{{ course.description.length }}/200</text>
          </view>
          
          <view class="form-item">
            <text class="label">课程分类</text>
            <view class="select-box">
              <picker 
                mode="selector" 
                :range="categories" 
                range-key="label"
                :value="categoryIndex"
                @change="onCategoryChange"
              >
                <view class="picker-value">
                  <text>{{ categories[categoryIndex].label }}</text>
                  <text class="iconfont icon-down"></text>
                </view>
              </picker>
            </view>
          </view>
          
          <view class="form-item">
            <text class="label">课程图标</text>
            <view class="icon-picker">
              <view class="icon-preview">
                <image 
                  :src="course.icon || defaultIcon" 
                  mode="aspectFit"
                ></image>
              </view>
              <view class="icon-actions">
                <view class="icon-btn" @click="chooseIcon">
                  <text class="iconfont icon-image"></text>
                  <text>选择图片</text>
                </view>
                <view class="icon-btn" @click="useDefaultIcon">
                  <text class="iconfont icon-refresh"></text>
                  <text>使用默认</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 步骤列表 -->
        <view class="form-section">
          <view class="section-title">
            <text class="iconfont icon-steps"></text>
            <text>课程步骤</text>
            <view class="add-btn" @click="addStep">
              <text class="iconfont icon-add"></text>
              <text>添加步骤</text>
            </view>
          </view>
          
          <view 
            class="step-item"
            v-for="(step, index) in course.steps" 
            :key="index"
            :style="{ animationDelay: index * 0.05 + 's' }"
            :class="{ 'active-step': currentEditingStep === index }"
            @click="loadStepToBoard(index)"
          >
            <view class="step-header">
              <view class="step-title">
                <text>步骤 {{ index + 1 }}</text>
                <view class="step-indicator" v-if="currentEditingStep === index">
                  <text class="iconfont icon-edit"></text>
                  <text>正在编辑</text>
                </view>
              </view>
              <view class="step-actions">
                <view class="action-btn up-btn" @click.stop="moveStepUp(index)" v-if="index > 0">
                  <text class="iconfont icon-up">上移</text>
                </view>
                <view class="action-btn down-btn" @click.stop="moveStepDown(index)" v-if="index < course.steps.length - 1">
                  <text class="iconfont icon-down">下移</text>
                </view>
                <view class="action-btn delete-btn" @click.stop="removeStep(index)">
                  <text class="iconfont icon-delete">删除</text>
                </view>
              </view>
            </view>
            
            <view class="form-item">
              <text class="label">步骤类型</text>
              <view class="select-box">
                <picker 
                  mode="selector" 
                  :range="stepTypes" 
                  range-key="label"
                  :value="getStepTypeIndex(step.type)"
                  @change="onStepTypeChangeHandler($event, index)"
                >
                  <view class="picker-value">
                    <text>{{ getStepTypeLabel(step.type) }}</text>
                    <text class="iconfont icon-down"></text>
                  </view>
                </picker>
              </view>
            </view>
            
            <view class="form-item">
              <text class="label">提示消息</text>
              <textarea 
                placeholder="输入该步骤中显示的提示消息" 
                v-model="step.message"
                maxlength="200"
              ></textarea>
            </view>
            
            <!-- 棋盘设置 -->
            <view class="form-item board-config">
              <text class="label">棋盘设置</text>
              <view class="checkbox-item" @click="toggleBoardClear(index)">
                <view class="custom-checkbox" :class="{ checked: step.boardSetup && step.boardSetup.clear }">
                  <text class="checkmark" v-if="step.boardSetup && step.boardSetup.clear">✓</text>
                </view>
                <text class="checkbox-label">清空棋盘</text>
              </view>
              
              <text class="board-tip">若不清空，将保持上一步骤的棋盘状态</text>
            </view>
            
            <!-- 不同步骤类型的特定配置 -->
            <view class="step-type-config" v-if="step.type === 'task'">
              <view class="config-title">任务步骤特定设置</view>
              
              <view class="form-item">
                <text class="label">期望移动</text>
                <view class="move-inputs-improved">
                  <view class="move-input-group">
                    <text class="group-label">从</text>
                    <view class="chess-position-selectors">
                      <picker 
                        :value="getColumnIndex(step.expectedMove.from.col)"
                        :range="columnOptions"
                        @change="updateMoveFromColumn($event, index)"
                        class="position-picker"
                      >
                        <view class="picker-display">
                          <text>{{ getColumnLetter(step.expectedMove.from.col) }}</text>
                          <text class="picker-arrow">▼</text>
                        </view>
                      </picker>
                      <picker 
                        :value="getRowIndex(step.expectedMove.from.row)"
                        :range="rowOptions"
                        @change="updateMoveFromRow($event, index)"
                        class="position-picker"
                      >
                        <view class="picker-display">
                          <text>{{ step.expectedMove.from.row + 1 }}</text>
                          <text class="picker-arrow">▼</text>
                        </view>
                      </picker>
                    </view>
                  </view>
                  <view class="move-arrow">
                    <text class="iconfont icon-right">→</text>
                  </view>
                  <view class="move-input-group">
                    <text class="group-label">到</text>
                    <view class="chess-position-selectors">
                      <picker 
                        :value="getColumnIndex(step.expectedMove.to.col)"
                        :range="columnOptions"
                        @change="updateMoveToColumn($event, index)"
                        class="position-picker"
                      >
                        <view class="picker-display">
                          <text>{{ getColumnLetter(step.expectedMove.to.col) }}</text>
                          <text class="picker-arrow">▼</text>
                        </view>
                      </picker>
                      <picker 
                        :value="getRowIndex(step.expectedMove.to.row)"
                        :range="rowOptions"
                        @change="updateMoveToRow($event, index)"
                        class="position-picker"
                      >
                        <view class="picker-display">
                          <text>{{ step.expectedMove.to.row + 1 }}</text>
                          <text class="picker-arrow">▼</text>
                        </view>
                      </picker>
                    </view>
                  </view>
                </view>
                <view class="move-tip">
                  <text class="iconfont icon-info">ℹ</text>
                  <text>选择起始位置和目标位置（列：A-H，行：1-8）</text>
                </view>
              </view>
              
              <view class="form-item">
                <text class="label">正确提示</text>
                <textarea 
                  placeholder="正确移动后显示的消息" 
                  v-model="step.correctMessage"
                ></textarea>
              </view>
              
              <view class="form-item">
                <text class="label">错误提示</text>
                <textarea 
                  placeholder="错误移动后显示的消息" 
                  v-model="step.errorMessage"
                ></textarea>
              </view>
              
              <view class="form-item">
                <text class="label">提示信息</text>
                <textarea 
                  placeholder="用户点击提示按钮时显示的消息" 
                  v-model="step.hintMessage"
                ></textarea>
              </view>
            </view>
          </view>
          
          <!-- 无步骤提示 -->
          <view class="empty-steps" v-if="course.steps.length === 0">
            <image src="/static/images/empty.png" mode="aspectFit"></image>
            <text>尚未添加任何步骤</text>
            <view class="add-step-btn" @click="addStep">
              <text class="iconfont icon-add"></text>
              <text>添加第一个步骤</text>
            </view>
          </view>
        </view>
        
        <!-- 棋盘预览按钮 -->
        <view class="preview-btn-container">
          <view class="preview-btn" @click="openBoardPreview">
            <text class="iconfont icon-chess">♔</text>
            <text>棋盘预览</text>
          </view>
          <view class="current-step-info" v-if="currentEditingStep !== null">
            <text class="step-info">正在编辑: 步骤 {{ currentEditingStep + 1 }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 步骤预览弹窗 -->
    <view class="board-preview-modal" v-if="showBoardPreview" @click="closeBoardPreview">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">步骤预览</text>
          <view class="modal-close" @click="closeBoardPreview">
            <text class="iconfont icon-close">×</text>
          </view>
        </view>
        
        <view class="modal-body">
          <!-- 当前步骤信息 -->
          <view class="step-preview-info" v-if="currentEditingStep !== null">
            <view class="step-header">
              <text class="step-number">步骤 {{ currentEditingStep + 1 }}</text>
              <view class="step-type-badge" :class="course.steps[currentEditingStep].type">
                <text>{{ getStepTypeLabel(course.steps[currentEditingStep].type) }}</text>
              </view>
            </view>
            
            <view class="step-content">
              <view class="step-message" v-if="course.steps[currentEditingStep].message">
                <text class="message-label">步骤说明：</text>
                <text class="message-text">{{ course.steps[currentEditingStep].message }}</text>
              </view>
              
              <view class="step-hints" v-if="course.steps[currentEditingStep].correctHint || course.steps[currentEditingStep].wrongHint">
                <view class="hint-item" v-if="course.steps[currentEditingStep].correctHint">
                  <text class="hint-label correct">正确提示：</text>
                  <text class="hint-text">{{ course.steps[currentEditingStep].correctHint }}</text>
                </view>
                <view class="hint-item" v-if="course.steps[currentEditingStep].wrongHint">
                  <text class="hint-label wrong">错误提示：</text>
                  <text class="hint-text">{{ course.steps[currentEditingStep].wrongHint }}</text>
                </view>
              </view>
              
              <view class="expected-move" v-if="course.steps[currentEditingStep].expectedMove">
                <text class="move-label">期望移动：</text>
                <text class="move-text">
                  {{ getColumnLetter(course.steps[currentEditingStep].expectedMove.from.col) }}{{ course.steps[currentEditingStep].expectedMove.from.row + 1 }} → 
                  {{ getColumnLetter(course.steps[currentEditingStep].expectedMove.to.col) }}{{ course.steps[currentEditingStep].expectedMove.to.row + 1 }}
                </text>
              </view>
            </view>
          </view>
          
          <!-- 配置提示 -->
          <view class="config-tips" v-if="isBoardConfigMode">
            <view class="tips-content">
              <text class="tips-icon">💡</text>
              <text class="tips-text">拖拽棋子到目标位置，或点击空格放置新棋子</text>
              <view class="exit-config-btn" @click="exitConfigMode">
                <text>完成配置</text>
              </view>
            </view>
          </view>
          
          <!-- 棋盘组件（可编辑模式） -->
          <view class="board-wrapper">
            <chess-board
              :board-state="previewBoardState"
              :selected-position="selectedBoardPosition"
              :valid-moves="[]"
              :last-move="null"
              :current-player="'white'"
              :play-as="'white'"
              :interactive="true"
              :config-mode="isBoardConfigMode"
              @board-ready="onBoardReady"
              @cell-click="handleBoardClick"
              @piece-drag-move="handlePieceDragMove"
            ></chess-board>
          </view>
          
          <!-- 棋盘下方的棋子选择器 -->
          <view v-if="isBoardConfigMode" class="piece-selector-bottom">
            <view class="selector-title">
              <text>选择棋子类型</text>
            </view>
            
            <!-- 第一行：白方棋子 -->
            <view class="piece-row">
              <view class="piece-option" @click="directPlacePiece('white-king')">
                <image class="piece-icon" src="/static/images/match/pieces/white-king.png" mode="aspectFit"></image>
                <text class="piece-name">白王</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('white-queen')">
                <image class="piece-icon" src="/static/images/match/pieces/white-queen.png" mode="aspectFit"></image>
                <text class="piece-name">白后</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('white-rook')">
                <image class="piece-icon" src="/static/images/match/pieces/white-rook.png" mode="aspectFit"></image>
                <text class="piece-name">白车</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('white-bishop')">
                <image class="piece-icon" src="/static/images/match/pieces/white-bishop.png" mode="aspectFit"></image>
                <text class="piece-name">白象</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('white-knight')">
                <image class="piece-icon" src="/static/images/match/pieces/white-knight.png" mode="aspectFit"></image>
                <text class="piece-name">白马</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('white-pawn')">
                <image class="piece-icon" src="/static/images/match/pieces/white-pawn.png" mode="aspectFit"></image>
                <text class="piece-name">白兵</text>
              </view>
              <view class="piece-option remove-option" @click="directRemovePiece()">
                <text class="remove-icon">🗑️</text>
                <text class="piece-name">移除</text>
              </view>
            </view>
            
            <!-- 第二行：黑方棋子 -->
            <view class="piece-row">
              <view class="piece-option" @click="directPlacePiece('black-king')">
                <image class="piece-icon" src="/static/images/match/pieces/black-king.png" mode="aspectFit"></image>
                <text class="piece-name">黑王</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('black-queen')">
                <image class="piece-icon" src="/static/images/match/pieces/black-queen.png" mode="aspectFit"></image>
                <text class="piece-name">黑后</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('black-rook')">
                <image class="piece-icon" src="/static/images/match/pieces/black-rook.png" mode="aspectFit"></image>
                <text class="piece-name">黑车</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('black-bishop')">
                <image class="piece-icon" src="/static/images/match/pieces/black-bishop.png" mode="aspectFit"></image>
                <text class="piece-name">黑象</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('black-knight')">
                <image class="piece-icon" src="/static/images/match/pieces/black-knight.png" mode="aspectFit"></image>
                <text class="piece-name">黑马</text>
              </view>
              <view class="piece-option" @click="directPlacePiece('black-pawn')">
                <image class="piece-icon" src="/static/images/match/pieces/black-pawn.png" mode="aspectFit"></image>
                <text class="piece-name">黑兵</text>
              </view>
              <view class="piece-option" style="visibility: hidden;">
                <!-- 占位元素，保持对齐 -->
              </view>
            </view>
          </view>
          
          <!-- 无步骤提示 -->
           <view class="no-step-tip" v-if="currentEditingStep === null">
             <text class="tip-text">请先选择一个步骤进行预览</text>
           </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue'
import ChessBoard from '@/components/chess/ChessBoard.vue'
import { checkRole } from '@/utils/permission'
import { getCourseDetail, addCourse, updateCourse, getCourseStepList, addCourseStep, updateCourseStep, deleteCourseStep, getBoardSetupList, addBoardSetup, updateBoardSetup, deleteBoardSetup } from '@/api/course'

export default {
  components: {
    TopSpacing,
    ChessBoard
  },
  data() {
    return {
      statusBarHeight: 0,
      isEdit: false,
      courseId: '',
      defaultIcon: 'https://pic1.imgdb.cn/item/67f3d0a2e381c3632bee955e.png',
      showBoardPreview: false,
      columnOptions: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      rowOptions: ['1', '2', '3', '4', '5', '6', '7', '8'],
      course: {
        id: '',
        title: '',
        description: '',
        icon: '',
        category: 'basic',
        steps: []
      },
      categories: [
        { value: 'basic', label: '基础' },
        { value: 'advanced', label: '进阶' },
        { value: 'strategy', label: '策略' }
      ],
      stepTypes: [
        { value: 'intro', label: '介绍' },
        { value: 'task', label: '任务' },
        { value: 'demo', label: '演示' }
      ],
      pieceTypes: [
        { value: 'white-king', label: '白王' },
        { value: 'white-queen', label: '白后' },
        { value: 'white-rook', label: '白车' },
        { value: 'white-bishop', label: '白象' },
        { value: 'white-knight', label: '白马' },
        { value: 'white-pawn', label: '白兵' },
        { value: 'black-king', label: '黑王' },
        { value: 'black-queen', label: '黑后' },
        { value: 'black-rook', label: '黑车' },
        { value: 'black-bishop', label: '黑象' },
        { value: 'black-knight', label: '黑马' },
        { value: 'black-pawn', label: '黑兵' }
      ],
      // 棋盘预览相关数据
      previewBoardState: [],
      selectedBoardPosition: null,
      showPieceSelector: false,
      currentEditingStep: null,
      isBoardConfigMode: false,
      availablePieces: [
        { value: 'white-king', label: '白王' },
        { value: 'white-queen', label: '白后' },
        { value: 'white-rook', label: '白车' },
        { value: 'white-bishop', label: '白象' },
        { value: 'white-knight', label: '白马' },
        { value: 'white-pawn', label: '白兵' },
        { value: 'black-king', label: '黑王' },
        { value: 'black-queen', label: '黑后' },
        { value: 'black-rook', label: '黑车' },
        { value: 'black-bishop', label: '黑象' },
        { value: 'black-knight', label: '黑马' },
        { value: 'black-pawn', label: '黑兵' }
      ]
    }
  },
  computed: {
    categoryIndex() {
      return this.categories.findIndex(item => item.value === this.course.category) || 0
    }
  },
  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
    
    // 检查管理员权限
    if (!this.checkAdminPermission()) {
      uni.showToast({
        title: '无权访问管理界面',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    // 判断编辑模式
    this.isEdit = options.mode === 'edit'
    
    if (this.isEdit && options.id) {
      this.courseId = options.id
      this.loadCourseData(this.courseId)
    }
    
    // 初始化棋盘
    this.initializeBoard()
  },
  
  beforeDestroy() {
    // 清理资源
    this.course = {
      id: '',
      title: '',
      description: '',
      category: 'basic',
      icon: '',
      steps: []
    }
  },
  methods: {
    // 检查管理员权限（临时修改为允许所有人访问）
    checkAdminPermission() {
      // 临时返回true，允许所有人访问管理界面进行测试
      return true
      // 原代码：return checkRole(['admin'])
    },
    
    // 初始化棋盘
    initializeBoard() {
      // 创建8x8的空棋盘
      this.previewBoardState = Array(8).fill(null).map(() => Array(8).fill(null))
      
      // 设置初始棋盘状态（标准开局）
      this.resetBoard()
    },
    
    // 重置棋盘到标准开局
    resetBoard() {
      const initialBoard = [
        ['black-rook', 'black-knight', 'black-bishop', 'black-queen', 'black-king', 'black-bishop', 'black-knight', 'black-rook'],
        ['black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn'],
        ['white-rook', 'white-knight', 'white-bishop', 'white-queen', 'white-king', 'white-bishop', 'white-knight', 'white-rook']
      ]
      
      this.previewBoardState = initialBoard.map(row => [...row])
      this.updateCurrentStepBoard()
    },
    
    // 清空棋盘
    clearBoard() {
      console.log('clearBoard called');
      this.previewBoardState = Array(8).fill(null).map(() => Array(8).fill(null));
      this.isBoardConfigMode = true;
      console.log('previewBoardState cleared:', this.previewBoardState);
      console.log('进入棋盘配置模式');
      this.updateCurrentStepBoard();
      console.log('updateCurrentStepBoard called');
    },
    
    // 处理棋盘点击
    handleBoardClick(cellData) {
      if (!this.isBoardConfigMode) return;
      
      const { row, col } = cellData;
      this.selectedBoardPosition = { row, col };
      
      console.log(`选择棋盘位置: (${row},${col})，请在下方选择棋子类型`);
    },
    
    // 处理棋子拖拽移动
    handlePieceDragMove(dragData) {
      if (!this.isBoardConfigMode) return;
      
      const { piece, from, to } = dragData;
      
      // 清除原位置的棋子
      this.previewBoardState[from.row][from.col] = null;
      
      // 在新位置放置棋子
      this.previewBoardState[to.row][to.col] = piece;
      
      // 更新棋盘状态
      this.updateCurrentStepBoard();
      
      console.log(`棋子拖拽移动: ${piece} 从 (${from.row},${from.col}) 到 (${to.row},${to.col})`);
    },
    
    // 关闭棋子选择器
    closePieceSelector() {
      this.showPieceSelector = false
      this.selectedBoardPosition = null
    },
    
    // 直接放置棋子（新的交互方式）
    directPlacePiece(pieceType) {
      if (!this.isBoardConfigMode || !this.selectedBoardPosition) {
        uni.showToast({
          title: '请先点击棋盘上的位置',
          icon: 'none'
        });
        return;
      }
      
      const { row, col } = this.selectedBoardPosition;
      if (this.previewBoardState[row] && this.previewBoardState[row][col] !== undefined) {
        this.previewBoardState[row][col] = pieceType;
        this.updateCurrentStepBoard();
        this.selectedBoardPosition = null; // 清除选择状态
        
        console.log(`直接放置棋子: ${pieceType} 在位置 (${row},${col})`);
      }
    },
    
    // 直接移除棋子（新的交互方式）
    directRemovePiece() {
      if (!this.isBoardConfigMode || !this.selectedBoardPosition) {
        uni.showToast({
          title: '请先点击棋盘上的位置',
          icon: 'none'
        });
        return;
      }
      
      const { row, col } = this.selectedBoardPosition;
      if (this.previewBoardState[row] && this.previewBoardState[row][col] !== undefined) {
        const removedPiece = this.previewBoardState[row][col];
        this.previewBoardState[row][col] = null;
        this.updateCurrentStepBoard();
        this.selectedBoardPosition = null; // 清除选择状态
        
        console.log(`直接移除棋子: ${removedPiece} 从位置 (${row},${col})`);
      }
    },
    
    // 放置棋子
    placePiece(pieceType) {
      if (!this.isBoardConfigMode || !this.selectedBoardPosition) return;
      
      const { row, col } = this.selectedBoardPosition
      this.previewBoardState[row][col] = pieceType
      this.updateCurrentStepBoard()
      this.closePieceSelector()
      
      console.log(`放置棋子: ${pieceType} 在位置 (${row},${col})`);
    },
    
    // 移除棋子
    removePiece() {
      if (!this.isBoardConfigMode || !this.selectedBoardPosition) return;
      
      const { row, col } = this.selectedBoardPosition
      const removedPiece = this.previewBoardState[row][col]
      this.previewBoardState[row][col] = null
      this.updateCurrentStepBoard()
      this.closePieceSelector()
      
      console.log(`移除棋子: ${removedPiece} 从位置 (${row},${col})`);
    },
    
    // 退出配置模式
    exitConfigMode() {
      this.isBoardConfigMode = false;
      this.selectedBoardPosition = null;
      this.showPieceSelector = false;
      console.log('退出棋盘配置模式');
      
      uni.showToast({
        title: '棋盘配置完成',
        icon: 'success'
      });
    },
    
    // 更新当前步骤的棋盘配置
    updateCurrentStepBoard() {
      if (this.currentEditingStep !== null && this.course.steps[this.currentEditingStep]) {
        const step = this.course.steps[this.currentEditingStep]
        if (!step.boardSetup) {
          step.boardSetup = { clear: true, pieces: [] }
        }
        
        // 将棋盘状态转换为pieces数组
        step.boardSetup.pieces = []
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if (this.previewBoardState[row][col]) {
              step.boardSetup.pieces.push({
                piece: this.previewBoardState[row][col],
                position: { row, col }
              })
            }
          }
        }
      }
    },
    
    // 加载步骤到棋盘预览
    loadStepToBoard(stepIndex) {
      this.currentEditingStep = stepIndex
      const step = this.course.steps[stepIndex]
      
      if (step && step.boardSetup) {
        if (step.boardSetup.clear) {
          // 清空棋盘
          this.previewBoardState = Array(8).fill(null).map(() => Array(8).fill(null))
        }
        
        // 放置棋子
        if (step.boardSetup.pieces) {
          step.boardSetup.pieces.forEach(piece => {
            if (piece.position && piece.position.row >= 0 && piece.position.row < 8 && 
                piece.position.col >= 0 && piece.position.col < 8) {
              this.previewBoardState[piece.position.row][piece.position.col] = piece.piece
            }
          })
        }
      }
    },
    
    // 棋盘准备就绪
    onBoardReady() {
      console.log('棋盘组件已准备就绪')
    },
    
    // 加载课程数据
    loadCourseData(courseId) {
      uni.showLoading({
        title: '加载中...'
      });
      
      getCourseDetail(courseId).then(res => {
        if (res.success && res.result) {
          // 更新课程数据
          this.course = res.result;
          
          // 如果没有步骤数据，初始化为空数组
          if (!this.course.steps) {
            this.course.steps = [];
          }
          
          // 更新分类索引
          this.categoryIndex = this.categories.findIndex(item => item.value === this.course.category);
          if (this.categoryIndex === -1) this.categoryIndex = 0;
        } else {
          uni.showToast({
            title: '获取课程数据失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('获取课程数据失败', err);
        uni.showToast({
          title: '获取课程数据失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    // 获取步骤类型索引
    getStepTypeIndex(type) {
      return this.stepTypes.findIndex(item => item.value === type) || 0
    },
    
    // 获取步骤类型标签
    getStepTypeLabel(type) {
      const stepType = this.stepTypes.find(item => item.value === type)
      return stepType ? stepType.label : '未知类型'
    },
    
    // 步骤类型变更处理
    onStepTypeChangeHandler(e, index) {
      const typeIndex = e.detail.value
      const newType = this.stepTypes[typeIndex].value
      
      // 更新步骤类型
      this.course.steps[index].type = newType
      
      // 根据类型初始化必要字段
      if (newType === 'task' && !this.course.steps[index].expectedMove) {
        this.course.steps[index].expectedMove = {
          from: { row: 0, col: 0 },
          to: { row: 0, col: 0 }
        }
        this.course.steps[index].correctMessage = ''
        this.course.steps[index].errorMessage = ''
        this.course.steps[index].hintMessage = ''
      }
    },
    
    // 分类变更
    onCategoryChange(e) {
      const index = e.detail.value
      this.course.category = this.categories[index].value
    },
    
    // 打开棋盘预览弹窗
    openBoardPreview() {
      this.showBoardPreview = true
    },
    
    // 关闭棋盘预览弹窗
    closeBoardPreview() {
      this.showBoardPreview = false
    },
    
    // 获取列字母
    getColumnLetter(col) {
      return String.fromCharCode(97 + col).toUpperCase() // a=0 -> A, b=1 -> B, etc.
    },
    
    // 获取列索引
    getColumnIndex(col) {
      return col // 直接返回数字索引
    },
    
    // 获取行索引
    getRowIndex(row) {
      return row // 直接返回数字索引
    },
    
    // 更新移动起始列
    updateMoveFromColumn(e, stepIndex) {
      const columnIndex = e.detail.value
      this.course.steps[stepIndex].expectedMove.from.col = columnIndex
    },
    
    // 更新移动起始行
    updateMoveFromRow(e, stepIndex) {
      const rowIndex = e.detail.value
      this.course.steps[stepIndex].expectedMove.from.row = rowIndex
    },
    
    // 更新移动目标列
    updateMoveToColumn(e, stepIndex) {
      const columnIndex = e.detail.value
      this.course.steps[stepIndex].expectedMove.to.col = columnIndex
    },
    
    // 更新移动目标行
    updateMoveToRow(e, stepIndex) {
      const rowIndex = e.detail.value
      this.course.steps[stepIndex].expectedMove.to.row = rowIndex
    },
    
    // 选择图标
    chooseIcon() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.course.icon = res.tempFilePaths[0]
          
          // 实际开发中，这里应该上传图片到服务器，然后设置返回的URL
          uni.showToast({
            title: '图片已选择',
            icon: 'success'
          })
        }
      })
    },
    
    // 使用默认图标
    useDefaultIcon() {
      this.course.icon = this.defaultIcon
      uni.showToast({
        title: '已使用默认图标',
        icon: 'success'
      })
    },
    
    // 添加步骤
    addStep() {
      // 添加一个新步骤
      const newStep = {
        type: 'intro',
        message: '',
        boardSetup: {
          clear: false,
          pieces: []
        },
        courseId: this.course.id // 关联到当前课程
      };
      
      // 如果是新建课程，直接添加到本地数组
      if (!this.isEdit || !this.course.id) {
        this.course.steps.push(newStep);
        // 自动选择新添加的步骤进行编辑
        this.loadStepToBoard(this.course.steps.length - 1);
        return;
      }
      
      // 如果是编辑现有课程，调用API
      uni.showLoading({ title: '添加中...' });
      
      addCourseStep(newStep).then(res => {
        if (res.success && res.result) {
          // 添加成功，将返回的步骤（包含ID）添加到列表
          this.course.steps.push(res.result);
          // 自动选择新添加的步骤进行编辑
          this.loadStepToBoard(this.course.steps.length - 1);
          uni.showToast({
            title: '添加步骤成功',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: '添加步骤失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('添加步骤失败', err);
        uni.showToast({
          title: '添加步骤失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    // 删除步骤
    removeStep(index) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除步骤${index + 1}吗？`,
        success: (res) => {
          if (res.confirm) {
            const step = this.course.steps[index];
            
            // 如果删除的是当前编辑的步骤，清除编辑状态
            if (this.currentEditingStep === index) {
              this.currentEditingStep = null;
              this.clearBoard();
            } else if (this.currentEditingStep > index) {
              // 如果删除的步骤在当前编辑步骤之前，需要调整索引
              this.currentEditingStep--;
            }
            
            // 如果是新建课程或步骤没有ID，直接从数组中移除
            if (!this.isEdit || !step.id) {
              this.course.steps.splice(index, 1);
              return;
            }
            
            // 如果是编辑现有课程，调用API删除
            uni.showLoading({ title: '删除中...' });
            
            deleteCourseStep(step.id).then(res => {
              if (res.success) {
                // 删除成功，从数组中移除
                this.course.steps.splice(index, 1);
                uni.showToast({
                  title: '删除步骤成功',
                  icon: 'success'
                });
              } else {
                uni.showToast({
                  title: res.message || '删除步骤失败',
                  icon: 'none'
                });
              }
            }).catch(err => {
              console.error('删除步骤失败', err);
              uni.showToast({
                title: '删除步骤失败',
                icon: 'none'
              });
            }).finally(() => {
              uni.hideLoading();
            });
          }
        }
      });
    },
    
    // 移动步骤位置
    moveStepUp(index) {
      if (index > 0) {
        const temp = this.course.steps[index];
        this.course.steps[index] = this.course.steps[index - 1];
        this.course.steps[index - 1] = temp;
        
        // 更新当前编辑步骤的索引
        if (this.currentEditingStep === index) {
          this.currentEditingStep = index - 1;
        } else if (this.currentEditingStep === index - 1) {
          this.currentEditingStep = index;
        }
        
        // 强制更新数组引用以触发视图更新
        this.course.steps = [...this.course.steps];
      }
    },
    
    moveStepDown(index) {
      if (index < this.course.steps.length - 1) {
        const temp = this.course.steps[index];
        this.course.steps[index] = this.course.steps[index + 1];
        this.course.steps[index + 1] = temp;
        
        // 更新当前编辑步骤的索引
        if (this.currentEditingStep === index) {
          this.currentEditingStep = index + 1;
        } else if (this.currentEditingStep === index + 1) {
          this.currentEditingStep = index;
        }
        
        // 强制更新数组引用以触发视图更新
        this.course.steps = [...this.course.steps];
      }
    },
    
    // 切换棋盘清空状态
    toggleBoardClear(stepIndex) {
      console.log('toggleBoardClear called with stepIndex:', stepIndex);
      const step = this.course.steps[stepIndex];
      if (!step.boardSetup) {
        step.boardSetup = { clear: false, pieces: [] };
      }
      step.boardSetup.clear = !step.boardSetup.clear;
      console.log('step.boardSetup.clear is now:', step.boardSetup.clear);
      
      // 如果设置为清空，清除现有棋子配置
      if (step.boardSetup.clear) {
        step.boardSetup.pieces = [];
        console.log('Cleared pieces array');
        // 如果这是当前编辑的步骤，也清空预览棋盘
        if (this.currentEditingStep === stepIndex) {
          console.log('Clearing preview board for current editing step');
          this.clearBoard();
        }
      }
      
      // 强制更新视图
      this.$forceUpdate();
    },
    
    // 保存课程
    saveCourse() {
      // 表单验证
      if (!this.course.id) {
        uni.showToast({
          title: '请输入课程ID',
          icon: 'none'
        })
        return
      }
      
      if (!this.course.title) {
        uni.showToast({
          title: '请输入课程标题',
          icon: 'none'
        })
        return
      }
      
      if (!this.course.description) {
        uni.showToast({
          title: '请输入课程描述',
          icon: 'none'
        })
        return
      }
      
      if (this.course.steps.length === 0) {
        uni.showToast({
          title: '请至少添加一个步骤',
          icon: 'none'
        })
        return
      }
      
      uni.showLoading({
        title: '保存中...'
      });
      
      // 根据是否是编辑模式选择API
      const savePromise = this.isEdit ? updateCourse(this.course) : addCourse(this.course);
      
      savePromise.then(res => {
        if (res.success) {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || '保存失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('保存课程失败', err);
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    // 返回上一页
    goBack() {
      uni.showModal({
        title: '确认返回',
        content: '您有未保存的更改，确定要离开吗？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    },
    
    // 将行列坐标转换为国际象棋记号
    getChessNotation(position) {
      if (!position || position.row === undefined || position.col === undefined) {
        return ''
      }
      
      // 将数字行列转换为字母数字格式
      // 列：0-7 对应 a-h
      // 行：0-7 对应 8-1（棋盘显示是倒序的）
      const colLetter = String.fromCharCode(97 + parseInt(position.col)) // a-h
      const rowNumber = 8 - parseInt(position.row) // 8-1
      
      return colLetter + rowNumber
    },
    
    // 将国际象棋记号转换为行列坐标
    parseChessNotation(notation) {
      if (!notation || notation.length < 2) {
        return { row: 0, col: 0 }
      }
      
      const cleanNotation = notation.toLowerCase().trim()
      const colLetter = cleanNotation.charAt(0)
      const rowNumber = parseInt(cleanNotation.charAt(1))
      
      // 验证输入格式
      if (colLetter < 'a' || colLetter > 'h' || rowNumber < 1 || rowNumber > 8) {
        return { row: 0, col: 0 }
      }
      
      // 转换为数字坐标
      const col = colLetter.charCodeAt(0) - 97 // a-h 对应 0-7
      const row = 8 - rowNumber // 8-1 对应 0-7
      
      return { row, col }
    },
    
    // 更新移动起始位置
    updateMoveFrom(event, stepIndex) {
      const notation = event.detail.value
      const position = this.parseChessNotation(notation)
      
      if (this.course.steps[stepIndex] && this.course.steps[stepIndex].expectedMove) {
        this.course.steps[stepIndex].expectedMove.from = position
      }
    },
    
    // 更新移动目标位置
    updateMoveTo(event, stepIndex) {
      const notation = event.detail.value
      const position = this.parseChessNotation(notation)
      
      if (this.course.steps[stepIndex] && this.course.steps[stepIndex].expectedMove) {
        this.course.steps[stepIndex].expectedMove.to = position
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.course-edit-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1E3A50 0%, #27496D 100%);
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
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
    .save-btn {
      padding: 12rpx 30rpx;
      background-color: #8BC34A;
      border-radius: 30rpx;
      
      text {
        color: #ffffff;
        font-size: 28rpx;
        font-weight: bold;
      }
    }
  }
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex: 1;
  height: calc(100vh - 120rpx);
}

/* 表单容器 */
.form-container {
  flex: 1;
  padding: 0 30rpx 30rpx;
 
}

/* 棋盘预览容器 */
.board-preview-container {
  width: 40%;
  min-width: 400rpx;
  background: linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%);
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  padding: 30rpx;
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .preview-title {
      color: #FFFFFF;
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .preview-controls {
      display: flex;
      gap: 15rpx;
      
      .control-btn {
        display: flex;
        align-items: center;
        padding: 10rpx 20rpx;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 20rpx;
        border: 1px solid rgba(255, 255, 255, 0.2);
        
        .iconfont {
          color: #FFFFFF;
          font-size: 24rpx;
          margin-right: 8rpx;
        }
        
        text {
          color: #FFFFFF;
          font-size: 24rpx;
        }
      }
    }
  }
  
  .board-wrapper {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    margin-bottom: 30rpx;
  }
  
  .piece-selector {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .selector-content {
      background-color: rgba(0, 0, 0, 0.95);
      border-radius: 20rpx;
      padding: 40rpx;
      max-width: 90%;
      max-height: 80%;
      border: 2px solid rgba(139, 195, 74, 0.3);
      
      .selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;
        
        text {
          color: #8BC34A;
          font-size: 32rpx;
          font-weight: bold;
        }
        
        .close-btn {
          width: 60rpx;
          height: 60rpx;
          background-color: rgba(255, 87, 34, 0.2);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          
          .iconfont {
            color: #FF5722;
            font-size: 28rpx;
          }
        }
      }
      
      .piece-grid {
        .piece-section {
          margin-bottom: 30rpx;
          
          .section-title {
            color: #8BC34A;
            font-size: 26rpx;
            font-weight: bold;
            margin-bottom: 20rpx;
            display: block;
          }
          
          .piece-row {
            display: flex;
            flex-wrap: wrap;
            gap: 15rpx;
            
            .piece-option {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 15rpx;
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: 15rpx;
              border: 2px solid transparent;
              min-width: 100rpx;
              transition: all 0.3s ease;
              
              &:active {
                transform: scale(0.95);
                border-color: rgba(139, 195, 74, 0.8);
              }
              
              .piece-icon {
                width: 50rpx;
                height: 50rpx;
                margin-bottom: 8rpx;
              }
              
              .piece-name {
                color: #FFFFFF;
                font-size: 20rpx;
                text-align: center;
              }
              
              &.remove-option {
                background-color: rgba(255, 87, 34, 0.2);
                
                .iconfont {
                  color: #FF5722;
                  font-size: 30rpx;
                  margin-bottom: 8rpx;
                }
              }
            }
          }
        }
      }
    }
  }
  
  .current-step-info {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 15rpx;
    padding: 20rpx;
    border: 2px solid rgba(139, 195, 74, 0.3);
    
    .step-info-header {
      margin-bottom: 15rpx;
      
      text {
        color: #8BC34A;
        font-size: 26rpx;
        font-weight: bold;
      }
    }
    
    .step-info-content {
      .step-type {
        color: #DDDDDD;
        font-size: 24rpx;
        margin-bottom: 10rpx;
        display: block;
      }
      
      .step-message {
        color: #AAAAAA;
        font-size: 22rpx;
        line-height: 1.4;
        display: block;
      }
    }
  }
}

/* 表单区块 */
.form-section {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10rpx);
  
  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    text {
      color: #EEE;
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .iconfont {
      color: #2196F3;
      font-size: 36rpx;
      margin-right: 10rpx;
    }
    
    .add-btn {
      margin-left: auto;
      display: flex;
      align-items: center;
      padding: 10rpx 20rpx;
      background-color: #8BC34A;
      border-radius: 30rpx;
      
      text {
        color: #ffffff;
        font-size: 24rpx;
        font-weight: normal;
      }
      
      .iconfont {
        color: #ffffff;
        font-size: 24rpx;
        margin-right: 5rpx;
      }
    }
  }
}

/* 表单项样式 */
.form-item {
  margin-bottom: 30rpx;
  
  .label {
    display: block;
    color: #EEE;
    font-size: 28rpx;
    height: auto;
    font-weight: bold;
    margin-bottom: 15rpx;
  }
  
  input, textarea, .select-box {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 10rpx;
    padding: 20rpx;
    box-sizing: border-box;
    font-size: 28rpx;
    color: #EEE;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  input {
    height: 80rpx;
  }
  
  textarea {
    height: 150rpx;
    line-height: 1.5;
  }
  
  .tip, .count {
    display: block;
    color: #999999;
    font-size: 24rpx;
    margin-top: 10rpx;
  }
  
  .count {
    text-align: right;
  }
  
  .select-box {
    position: relative;
    
    .picker-value {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .iconfont {
        color: #999999;
        font-size: 28rpx;
      }
    }
  }
  
  &.board-config {
    .checkbox-item {
      display: flex;
      align-items: center;
      margin-bottom: 15rpx;
      cursor: pointer;
      user-select: none;
      
      .custom-checkbox {
        width: 40rpx;
        height: 40rpx;
        border: 2rpx solid rgba(255, 255, 255, 0.3);
        border-radius: 6rpx;
        margin-right: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;
        
        &.checked {
          background: #4CAF50;
          border-color: #4CAF50;
          box-shadow: 0 0 10rpx rgba(76, 175, 80, 0.3);
        }
        
        .checkmark {
          color: #ffffff;
          font-size: 24rpx;
          font-weight: bold;
        }
      }
      
      .checkbox-label {
        color: #EEEEEE;
        font-size: 28rpx;
        flex: 1;
      }
      
      &:hover .custom-checkbox {
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.1);
      }
      
      &:active .custom-checkbox {
        transform: scale(0.95);
      }
    }
    
    .board-tip {
      color: #999999;
      font-size: 24rpx;
    }
  }
}

/* 简化的棋盘配置提示 */


/* 图标选择器 */
.icon-picker {
  display: flex;
  align-items: center;
  
  .icon-preview {
    width: 120rpx;
    height: 120rpx;
    background-color: #f5f5f5;
    border-radius: 20rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 30rpx;
    overflow: hidden;
    
    image {
      width: 80rpx;
      height: 80rpx;
    }
  }
  
  .icon-actions {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .icon-btn {
      display: flex;
      align-items: center;
      padding: 15rpx 0;
      
      .iconfont {
        color: #2196F3;
        font-size: 28rpx;
        margin-right: 10rpx;
      }
      
      text {
        color: #EEE;
        font-size: 26rpx;
      }
    }
  }
}

/* 步骤项样式 */
.step-item {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20rpx);
  border: 2px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8rpx);
  
  &:hover {
    border-color: rgba(139, 195, 74, 0.3);
    transform: translateY(-5rpx);
  }
  
  &.active-step {
    border-color: rgba(139, 195, 74, 0.6);
    background-color: rgba(139, 195, 74, 0.1);
    box-shadow: 0 0 20rpx rgba(139, 195, 74, 0.3);
  }
  
  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .step-title {
      display: flex;
      align-items: center;
      gap: 15rpx;
      
      text {
        color: #EEE;
        font-size: 28rpx;
        font-weight: bold;
      }
      
      .step-indicator {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 5rpx 15rpx;
        background-color: rgba(139, 195, 74, 0.2);
        border-radius: 20rpx;
        border: 1px solid rgba(139, 195, 74, 0.4);
        
        .iconfont {
          color: #8BC34A;
          font-size: 20rpx;
        }
        
        text {
          color: #8BC34A;
          font-size: 20rpx;
          font-weight: normal;
        }
      }
    }
    
    .step-actions {
      display: flex;
      
      .action-btn {
        width: 60rpx;
        height: 60rpx;
        border-radius: 10rpx;
        padding: 10rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: 10rpx;
        
        .iconfont {
          font-size: 28rpx;
        }
        
        &.up-btn {
          background-color: rgba(33, 150, 243, 0.1);
          
          .iconfont {
            font-size: 20rpx;
            font-weight: bold;
            color: #EEE;
          }
        }
        
        &.down-btn {
          background-color: rgba(33, 150, 243, 0.1);
          
          .iconfont {
            font-size: 20rpx;
            font-weight: bold;
            color: #EEE;
          }
        }
        
        &.delete-btn {
          background-color: rgba(255, 87, 34, 0.1);
          
          .iconfont {
            font-size: 20rpx;
            font-weight: bold;
            color: #a73c3c;
          }
        }
      }
    }
  }
  
  .step-type-config {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1px dashed #e0e0e0;
    
    .config-title {
      color: #2196F3;
      font-size: 26rpx;
      font-weight: bold;
      margin-bottom: 20rpx;
    }
    
    .move-inputs-improved {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 15rpx;
      padding: 20rpx;
      border: 2px solid rgba(33, 150, 243, 0.2);
      
      .move-input-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .group-label {
          color: #2196F3;
          font-size: 24rpx;
          font-weight: bold;
          margin-bottom: 10rpx;
        }
        
        .chess-input {
          width: 120rpx;
          height: 60rpx;
          text-align: center;
          background-color: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(33, 150, 243, 0.3);
          border-radius: 10rpx;
          color: #FFFFFF;
          font-size: 28rpx;
          font-weight: bold;
          text-transform: lowercase;
          
          &:focus {
            border-color: #2196F3;
            background-color: rgba(33, 150, 243, 0.1);
          }
        }
      }
      
      .move-arrow {
        margin: 0 20rpx;
        
        .iconfont {
          color: #8BC34A;
          font-size: 32rpx;
          font-weight: bold;
        }
      }
    }
    
    .move-tip {
      display: flex;
      align-items: center;
      margin-top: 15rpx;
      padding: 15rpx;
      background-color: rgba(33, 150, 243, 0.1);
      border-radius: 10rpx;
      border: 1px solid rgba(33, 150, 243, 0.2);
      
      .iconfont {
        color: #2196F3;
        font-size: 24rpx;
        margin-right: 10rpx;
      }
      
      text {
        color: #BBBBBB;
        font-size: 22rpx;
        line-height: 1.4;
      }
    }
  }
}

/* 无步骤状态 */
.empty-steps {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
    opacity: 0.7;
  }
  
  text {
    color: #999999;
    font-size: 28rpx;
    margin-bottom: 30rpx;
  }
  
  .add-step-btn {
    display: flex;
    align-items: center;
    padding: 15rpx 40rpx;
    background-color: #8BC34A;
    border-radius: 40rpx;
    
    text {
      color: #ffffff;
      font-size: 26rpx;
      margin-bottom: 0;
    }
    
    .iconfont {
      color: #ffffff;
      font-size: 26rpx;
      margin-right: 10rpx;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 棋盘预览按钮样式 */
.preview-btn-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.preview-btn {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 15px 25px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.preview-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.preview-btn text:first-child {
  font-size: 20px;
  color: #fff;
}

.preview-btn text:last-child {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.preview-btn-container .current-step-info {
  padding: 10px 15px;
  background: rgba(139, 195, 74, 0.2);
  border-radius: 6px;
  text-align: center;
}

.preview-btn-container .step-info {
  color: #8bc34a;
  font-size: 12px;
  font-weight: 500;
}

/* 棋盘预览弹窗样式 */
.board-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-close text {
  color: #fff;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
}

/* 步骤预览信息样式 */
.step-preview-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.step-number {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
}

.step-type-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  color: #ffffff;
  font-weight: 500;
}

.step-type-badge.move {
  background: #4CAF50;
}

.step-type-badge.setup {
  background: #2196F3;
}

.step-type-badge.question {
  background: #FF9800;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-message {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-label {
  color: #4CAF50;
  font-size: 14px;
  font-weight: bold;
}

.message-text {
  color: #ffffff;
  font-size: 15px;
  line-height: 1.5;
}

.step-hints {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hint-label {
  font-size: 14px;
  font-weight: bold;
}

.hint-label.correct {
  color: #4CAF50;
}

.hint-label.wrong {
  color: #f44336;
}

.hint-text {
  color: #ffffff;
  font-size: 15px;
  line-height: 1.5;
}

.expected-move {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.move-label {
  color: #2196F3;
  font-size: 14px;
  font-weight: bold;
}

.move-text {
  color: #ffffff;
  font-size: 15px;
  font-family: monospace;
  background: rgba(33, 150, 243, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(33, 150, 243, 0.2);
}

/* 无步骤提示样式 */
.no-step-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  text-align: center;
}

/* 下拉选择器样式 */
.chess-position-selectors {
  display: flex;
  gap: 10px;
}

.position-picker {
  flex: 1;
}

.picker-display {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.picker-display:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(139, 195, 74, 0.5);
}

.picker-arrow {
  color: #8bc34a;
  font-size: 12px;
  margin-left: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95%;
  }
  
  .chess-position-selectors {
    flex-direction: column;
    gap: 8px;
  }
  
  .preview-btn-container {
    padding: 15px;
  }
  
  .preview-btn {
    padding: 12px 20px;
  }
}

/* 配置提示样式 */
.config-tips {
  width: 100%;
  max-width: 600rpx;
  margin-bottom: 20rpx;
  
  .tips-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.2));
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 15rpx;
    padding: 20rpx;
    backdrop-filter: blur(10rpx);
    
    .tips-icon {
      font-size: 32rpx;
      margin-right: 15rpx;
    }
    
    .tips-text {
      color: #E8F5E8;
      font-size: 26rpx;
      font-weight: 500;
      text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
      flex: 1;
    }
    
    .exit-config-btn {
      background: linear-gradient(135deg, #4CAF50, #8BC34A);
      border-radius: 20rpx;
      padding: 10rpx 20rpx;
      margin-left: 20rpx;
      cursor: pointer;
      transition: all 0.3s ease;
      
      text {
        color: #ffffff;
        font-size: 24rpx;
        font-weight: 600;
      }
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
}

/* 棋盘下方的棋子选择器样式 */
.piece-selector-bottom {
  margin-top: 20rpx;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12rpx;
  border: 2rpx solid #e0e0e0;
  
  .selector-title {
    text-align: center;
    margin-bottom: 15rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
  }
  
  .piece-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15rpx;
    flex-wrap: nowrap;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .piece-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80rpx;
    height: 80rpx;
    padding: 8rpx;
    border: 2rpx solid #ddd;
    border-radius: 8rpx;
    background: #fff;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      border-color: #4CAF50;
      background: #f8fff8;
      transform: translateY(-2rpx);
    }
    
    &:active {
      transform: translateY(0);
      background: #e8f5e8;
    }
    
    &.remove-option {
      border-color: #ff6b6b;
      background: #fff5f5;
      
      &:hover {
        border-color: #ff5252;
        background: #ffebee;
      }
      
      .piece-name {
        color: #ff6b6b;
      }
    }
  }
  
  .piece-icon {
    width: 40rpx;
    height: 40rpx;
    margin-bottom: 4rpx;
  }
  
  .piece-name {
    font-size: 20rpx;
    color: #666;
    text-align: center;
    line-height: 1;
  }
  
  .remove-icon {
    font-size: 32rpx;
    margin-bottom: 4rpx;
  }
}
</style>
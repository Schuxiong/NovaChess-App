<!-- components/chess/ChessBoard.vue -->
<template>
  <view class="chess-board">
    <view class="board">
      <view v-for="(row, rowIndex) in 8" :key="rowIndex" class="board-row">
        <view 
          v-for="(col, colIndex) in 8" 
          :key="cellKeys[`${getBoardRow(rowIndex)}-${getBoardCol(colIndex)}`] || `${rowIndex}-${colIndex}`" 
          class="board-cell"
          :class="{ 
            'light': (rowIndex + colIndex) % 2 === 0, 
            'dark': (rowIndex + colIndex) % 2 === 1,
            'selected': selectedPosition && selectedPosition.row === getBoardRow(rowIndex) && selectedPosition.col === getBoardCol(colIndex),
            'valid-move': isValidMovePosition(getBoardRow(rowIndex), getBoardCol(colIndex)),
            'last-move-from': lastMove && lastMove.from.row === getBoardRow(rowIndex) && lastMove.from.col === getBoardCol(colIndex),
            'last-move-to': lastMove && lastMove.to.row === getBoardRow(rowIndex) && lastMove.to.col === getBoardCol(colIndex),
            'castling-indicator': isCastlingPosition(getBoardRow(rowIndex), getBoardCol(colIndex)),
            'en-passant-target': isEnPassantPosition(getBoardRow(rowIndex), getBoardCol(colIndex)) === 'target',
            'en-passant-captured': isEnPassantPosition(getBoardRow(rowIndex), getBoardCol(colIndex)) === 'captured',
            'checkmate-highlight': isCheckmated && isKingPosition(getBoardRow(rowIndex), getBoardCol(colIndex)),
            'config-mode': configMode,
            'drop-target': dragOverCell && dragOverCell.row === getBoardRow(rowIndex) && dragOverCell.col === getBoardCol(colIndex)
          }"
          @click="handleCellClick(getBoardRow(rowIndex), getBoardCol(colIndex))"
        >
          <!-- 左侧坐标 -->
          <text v-if="colIndex === 0" class="coordinate row-coordinate">{{ getRowCoordinate(rowIndex) }}</text>
          
          <!-- 底部坐标 -->
          <text v-if="rowIndex === 7" class="coordinate col-coordinate">{{ getColCoordinate(colIndex) }}</text>
          
          <image 
            v-if="boardState[getBoardRow(rowIndex)][getBoardCol(colIndex)]" 
            :src="'/static/images/match/pieces/' + boardState[getBoardRow(rowIndex)][getBoardCol(colIndex)] + '.png'" 
            class="chess-piece" 
            mode="aspectFit"
            :class="{ 
              'animate-piece': animatingPiece && animatingPiece.row === getBoardRow(rowIndex) && animatingPiece.col === getBoardCol(colIndex),
              'checkmate-piece': isCheckmated && isKingPosition(getBoardRow(rowIndex), getBoardCol(colIndex)),
              'draggable-piece': configMode
            }"
            @touchstart="handleTouchStart($event, getBoardRow(rowIndex), getBoardCol(colIndex))"
            @touchmove="handleTouchMove($event)"
            @touchend="handleTouchEnd($event)"
          ></image>
        </view>
      </view>
    </view>
    
    <!-- 升变选择弹窗 -->
    <view v-if="showPromotionDialog" class="promotion-dialog">
      <view class="promotion-title">选择升变棋子</view>
      <view class="promotion-options">
        <view 
          v-for="piece in promotionOptions" 
          :key="piece" 
          class="promotion-option"
          @click="selectPromotionPiece(piece)"
        >
          <image :src="'/static/images/match/pieces/' + currentPlayer + '-' + piece + '.png'" mode="aspectFit"></image>
        </view>
      </view>
    </view>
    
    <!-- 将军/将杀动画 -->
    <view v-if="showCheckmateAnimation" class="checkmate-animation">
      <text class="checkmate-text">{{ checkmateText }}</text>
    </view>
    
    <!-- 游戏结束胜负标注 -->
    <view v-if="gameEnded && gameResult" class="game-result-overlay">
      <view class="game-result-text">{{ gameResult }}</view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    boardState: {
      type: Array,
      required: true
    },
    selectedPosition: {
      type: Object,
      default: null
    },
    validMoves: {
      type: Array,
      default: () => []
    },
    rows: {
      type: Array,
      default: () => ['1', '2', '3', '4', '5', '6', '7', '8']
    },
    columns: {
      type: Array,
      default: () => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    },
    lastMove: {
      type: Object,
      default: null
    },
    currentPlayer: {
      type: String,
      default: 'white'
    },
    playAs: {
      type: String,
      default: 'white'
    },
    isCheckmated: {
      type: Boolean,
      default: false
    },
    checkmateColor: {
      type: String,
      default: ''
    },
    interactive: {
      type: Boolean,
      default: false
    },
    configMode: {
      type: Boolean,
      default: false
    },
    gameResult: {
      type: String,
      default: ''
    },
    gameEnded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      animatingPiece: null,        // 记录正在动画的棋子
      soundEnabled: true,          // 声音开关
      showPromotionDialog: false,  // 是否显示升变选择弹窗
      promotionPosition: null,     // 需要升变的位置
      pendingMove: null,           // 等待升变确认的移动
      promotionOptions: ['queen', 'rook', 'bishop', 'knight'], // 可选的升变棋子
      specialMoves: {              // 特殊走法标记
        castling: [],              // 王车易位可能的目标位置
        enPassant: null            // 吃过路兵可能的目标位置
      },
      audioContexts: {             // 音频上下文对象
        move: null,
        capture: null,
        castle: null,
        check: null,
        promote: null,
        checkmate: null
      },
      showCheckmateAnimation: false, // 是否显示将军/将杀动画
      checkmateText: '',           // 将军/将杀文本
      draggedPiece: null,          // 正在拖拽的棋子信息
      dragOverCell: null,          // 拖拽悬停的格子
      dragStartPosition: null,     // 拖拽开始的位置
      isDragging: false,           // 是否正在拖拽
      cellKeys: {}                 // 用于优化渲染的单元格key
    }
  },
  created() {
    // 初始化音频上下文
    this.initAudioContexts();
    // 初始化棋盘单元格key
    this.generateBoardKeys();
  },
  methods: {
    // 初始化音频上下文
    initAudioContexts() {
      const audioSources = {
        move: '/static/audio/move.mp3',
        capture: '/static/audio/capture.mp3',
        castle: '/static/audio/move.mp3',
        check: '/static/audio/move.mp3',
        promote: '/static/audio/move.mp3',
        checkmate: '/static/audio/move.mp3'
      };
      
      // 创建音频上下文
      Object.keys(audioSources).forEach(type => {
        const audioContext = uni.createInnerAudioContext();
        audioContext.src = audioSources[type];
        audioContext.autoplay = false;
        this.audioContexts[type] = audioContext;
      });
    },
    
    // 生成棋盘单元格key，用于优化渲染
    generateBoardKeys() {
      this.cellKeys = {};
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.boardState && this.boardState[row] && this.boardState[row][col] ? this.boardState[row][col] : 'empty';
          this.cellKeys[`${row}-${col}`] = `${row}-${col}-${piece}`;
        }
      }
    },
    
    // 根据执棋颜色获取实际棋盘行（如果玩家执黑，棋盘需要翻转）
    getBoardRow(visualRow) {
      return this.playAs === 'black' ? 7 - visualRow : visualRow;
    },
    
    // 根据执棋颜色获取实际棋盘列（如果玩家执黑，棋盘需要翻转）
    getBoardCol(visualCol) {
      return this.playAs === 'black' ? 7 - visualCol : visualCol;
    },
    
    // 获取行坐标显示
    getRowCoordinate(visualRow) {
      return this.rows[this.playAs === 'black' ? visualRow : 7 - visualRow];
    },
    
    // 获取列坐标显示
    getColCoordinate(visualCol) {
      return this.columns[this.playAs === 'black' ? 7 - visualCol : visualCol];
    },
    
    // 检查是否是王的位置（用于将军/将杀高亮）
    isKingPosition(row, col) {
      const piece = this.boardState[row][col];
      return piece && piece.endsWith('king') && piece.startsWith(this.checkmateColor);
    },
    
    handleCellClick(row, col) {
      if (this.interactive || this.configMode) {
        this.$emit('cell-click', { row, col });
      }
    },
    
    // 触摸开始（替代拖拽开始）
    handleTouchStart(event, row, col) {
      if (!this.configMode) return;
      
      const piece = this.boardState[row][col];
      if (!piece) return;
      
      event.preventDefault();
      
      this.draggedPiece = piece;
      this.dragStartPosition = { row, col };
      this.isDragging = true;
      
      console.log(`开始拖拽棋子: ${piece} 从位置 (${row},${col})`);
    },
    
    // 触摸移动（替代拖拽悬停）
    handleTouchMove(event) {
      if (!this.configMode || !this.isDragging) return;
      
      event.preventDefault();
      
      // 获取触摸位置
      const touch = event.touches[0];
      if (!touch) return;
      
      // 这里可以添加视觉反馈，比如显示拖拽的棋子跟随手指
      console.log('拖拽中...');
    },
    
    // 触摸结束（替代拖拽放下）
    handleTouchEnd(event) {
      if (!this.configMode || !this.isDragging) return;
      
      event.preventDefault();
      
      // 获取触摸结束位置
      const touch = event.changedTouches[0];
      if (!touch) {
        this.resetDragState();
        return;
      }
      
      // 通过坐标计算目标格子
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!targetElement) {
        this.resetDragState();
        return;
      }
      
      // 查找最近的棋盘格子
      const cellElement = targetElement.closest('.board-cell');
      if (!cellElement) {
        this.resetDragState();
        return;
      }
      
      // 获取目标位置（这里需要根据实际DOM结构来计算）
      // 简化处理：直接通过点击事件来处理放置
      console.log('拖拽结束，请点击目标位置完成移动');
      
      this.resetDragState();
    },
    
    // 重置拖拽状态
    resetDragState() {
      this.draggedPiece = null;
      this.dragStartPosition = null;
      this.dragOverCell = null;
      this.isDragging = false;
    },
    
    isValidMovePosition(row, col) {
      return this.validMoves.some(move => move.row === row && move.col === col);
    },
    
    // 检查是否是王车易位的目标位置
    isCastlingPosition(row, col) {
      return this.specialMoves.castling.some(pos => pos.row === row && pos.col === col);
    },
    
    // 检查是否是吃过路兵的目标位置
    isEnPassantPosition(row, col) {
      // 添加调试信息
      if (this.specialMoves.enPassant) {
        console.log('验证吃过路兵 - 检查位置:', { row, col }, 
          '目标位置:', this.specialMoves.enPassant,
          '被吃棋子位置:', this.specialMoves.enPassant.capturedPiecePos);
      }
      
      // 检查是否是吃过路兵的目标位置
      const isTargetPosition = this.specialMoves.enPassant && 
             this.specialMoves.enPassant.row === row && 
             this.specialMoves.enPassant.col === col;
      
      // 检查是否是被吃掉的棋子位置
      const isCapturedPosition = this.specialMoves.enPassant && 
             this.specialMoves.enPassant.capturedPiecePos && 
             this.specialMoves.enPassant.capturedPiecePos.row === row && 
             this.specialMoves.enPassant.capturedPiecePos.col === col;
      
      // 返回更详细的分类，使模板可以使用不同的CSS类
      if (isTargetPosition) return 'target';
      if (isCapturedPosition) return 'captured';
      return false;
    },
    
    // 播放移动音效
    playMoveSound(moveType) {
      if (!this.soundEnabled) return;
      
      try {
        const audioType = {
          'move': 'move',
          'capture': 'capture',
          'castle': 'castle',
          'check': 'check',
          'promote': 'promote',
          'checkmate': 'checkmate'
        }[moveType] || 'move';
        
        const audioContext = this.audioContexts[audioType];
        if (audioContext) {
          audioContext.stop(); // 停止当前播放
          audioContext.seek(0); // 重置播放位置
          audioContext.play(); // 播放音频
        }
      } catch (error) {
        console.error('播放音效失败:', error);
      }
    },
    
    // 执行移动动画并播放相应音效
    animateMove(from, to, moveType) {
      // 设置正在动画的棋子
      this.animatingPiece = to;
      
      // 播放对应音效
      this.playMoveSound(moveType);
      
      // 动画结束后清除标记
      setTimeout(() => {
        this.animatingPiece = null;
      }, 300);
    },
    
    // 显示将军/将杀动画
    showCheckmate(isCheckmate, loserColor) {
      // 确定被将死的棋手是否是玩家
      const isPlayerLosing = loserColor === this.playAs;
      
      // 根据玩家输赢设置文本
      this.checkmateText = isCheckmate ? 
        (isPlayerLosing ? '将杀！你失败了！' : '将杀！你胜利了！') : 
        '将军！';
      
      this.showCheckmateAnimation = true;
      this.playMoveSound(isCheckmate ? 'checkmate' : 'check');
      
      // 动画结束后隐藏
      setTimeout(() => {
        this.showCheckmateAnimation = false;
      }, 2000);
    },
    
    // 处理升变相关逻辑
    checkForPromotion(move) {
      // 检查是否是兵到达底线
      const piece = this.boardState[move.from.row][move.from.col];
      const isPawn = piece && piece.endsWith('pawn');
      const isWhitePawnAtTop = piece === 'white-pawn' && move.to.row === 0;
      const isBlackPawnAtBottom = piece === 'black-pawn' && move.to.row === 7;
      
      if (isPawn && (isWhitePawnAtTop || isBlackPawnAtBottom)) {
        // 记录升变位置和待处理的移动
        this.promotionPosition = move.to;
        this.pendingMove = move;
        this.showPromotionDialog = true;
        return true;
      }
      
      return false;
    },
    
    // 选择升变棋子
    selectPromotionPiece(pieceType) {
      if (!this.pendingMove || !this.promotionPosition) return;
      
      // 隐藏升变弹窗
      this.showPromotionDialog = false;
      
      // 发出包含升变信息的移动事件
      this.$emit('promotion-move', {
        from: this.pendingMove.from,
        to: this.pendingMove.to,
        promoteTo: pieceType
      });
      
      // 播放升变音效
      this.playMoveSound('promote');
      
      // 清除临时数据
      this.pendingMove = null;
      this.promotionPosition = null;
    },
    
    // 设置王车易位的可能位置
    setCastlingPositions(positions) {
      this.specialMoves.castling = positions || [];
    },
    
    // 设置吃过路兵的目标位置
    setEnPassantPosition(position) {
      // 记录之前的状态用于调试
      const oldPosition = this.specialMoves.enPassant;
      
      // 更新状态
      this.specialMoves.enPassant = position;
      
      // 添加详细的调试信息
      console.log(`===== 设置过路兵位置 =====`);
      if (position) {
        console.log(`- 新的过路兵位置: { row: ${position.row}, col: ${position.col}, captureColor: ${position.captureColor} }`);
        if (position.capturedPiecePos) {
          console.log(`- 可被吃掉的棋子位置: { row: ${position.capturedPiecePos.row}, col: ${position.capturedPiecePos.col} }`);
        }
      } else {
        console.log(`- 清除过路兵位置`);
      }
      
      if (oldPosition) {
        console.log(`- 原过路兵位置: { row: ${oldPosition.row}, col: ${oldPosition.col}, captureColor: ${oldPosition.captureColor} }`);
      } else {
        console.log(`- 之前无过路兵位置`);
      }
    },
    
    // 清除所有高亮效果
    clearHighlights() {
      // 清除特殊移动标记
      this.specialMoves.castling = [];
      this.specialMoves.enPassant = null;
      
      // 清除升变相关状态
      this.showPromotionDialog = false;
      this.pendingMove = null;
      this.promotionPosition = null;
      
      // 清除动画状态
      this.animatingPiece = null;
      this.showCheckmateAnimation = false;
      
      console.log(`===== 结束设置过路兵位置 =====`);
    }
  },
  mounted() {
    // 初始化时发送事件通知父组件棋盘已准备好
    this.$emit('board-ready');
  },
  beforeDestroy() {
    // 释放音频资源
    Object.values(this.audioContexts).forEach(context => {
      if (context) {
        context.destroy();
      }
    });
  },
  // 监听lastMove变化,自动播放移动音效
  watch: {
    // 优化棋盘状态监听，避免整个棋盘重新渲染
     boardState: {
       handler(newBoard, oldBoard) {
         if (!oldBoard || !newBoard) {
           // 初始化时生成棋盘key
           this.generateBoardKeys();
           return;
         }
         
         // 比较新旧棋盘状态，只更新变化的位置
         const changedPositions = [];
         for (let row = 0; row < 8; row++) {
           for (let col = 0; col < 8; col++) {
             if (newBoard[row][col] !== oldBoard[row][col]) {
               changedPositions.push({ row, col, piece: newBoard[row][col] });
               // 更新对应位置的key，基于棋子内容
               const piece = newBoard[row][col] || 'empty';
               this.$set(this.cellKeys, `${row}-${col}`, `${row}-${col}-${piece}`);
             }
           }
         }
         
         // 如果有位置发生变化，触发局部更新事件
         if (changedPositions.length > 0) {
           console.log('棋盘位置变化:', changedPositions.length, '个位置');
           this.$emit('board-changed', changedPositions);
         }
       },
       deep: true // 需要深度监听二维数组
     },
    
    lastMove(newMove, oldMove) {
      if (!newMove || (oldMove && 
          newMove.from.row === oldMove.from.row && 
          newMove.from.col === oldMove.from.col && 
          newMove.to.row === oldMove.to.row && 
          newMove.to.col === oldMove.to.col)) {
        return;
      }
      
      // 确定移动类型并播放相应音效
      let moveType = 'move';
      
      // 判断是否为特殊移动
      if (newMove.isCastling) {
        moveType = 'castle';
      } else if (newMove.isEnPassant) {
        moveType = 'capture';
      } else if (newMove.isPromotion) {
        moveType = 'promote';
      } else if (newMove.captured) {
        moveType = 'capture';
        
        // 检查是否吃掉了王（游戏结束）
        if (newMove.captured.endsWith('king')) {
          moveType = 'checkmate';
        }
      } else if (newMove.isCheck) {
        moveType = 'check';
      }
      
      this.animateMove(newMove.from, newMove.to, moveType);
    },
    
    // 监听是否将军/将杀
    isCheckmated(newValue) {
      if (newValue) {
        this.showCheckmate(true, this.checkmateColor);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chess-board {
  position: relative;
  width: 700rpx;
  height: 700rpx;
  margin: 10rpx auto;
  transform: scale(1); /* 添加transform确保小程序渲染正确 */
  
  // 棋盘本体
  .board {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #b58863;
    border: 8rpx solid #604020;
    overflow: hidden;
    box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.4); /* 添加阴影增强视觉效果 */
    
    .board-row {
      display: flex;
      height: 12.5%;
      width: 100%;
      
      .board-cell {
        width: 12.5%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        
        &.light {
          background-color: #f0d9b5;
        }
        
        &.dark {
          background-color: #b58863;
        }
        
        &.selected {
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(106, 176, 76, 0.5);
            z-index: 1;
          }
        }
        
        &.valid-move {
          cursor: pointer;
          
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40%;
            height: 40%;
            border-radius: 50%;
            background-color: rgba(106, 176, 76, 0.5);
            transform: translate(-50%, -50%);
            z-index: 1;
          }
        }
        
        // 特殊移动标识符
        &.castling-indicator::after,
        &.en-passant-target::after,
        &.en-passant-captured::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40%;
          height: 40%;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }
        
        &.castling-indicator::after {
          background-color: rgba(255, 165, 0, 0.5); // 橙色标识王车易位
        }
        
        &.en-passant-target::after {
          background-color: rgba(255, 0, 0, 0.6); // 红色标识吃过路兵目标位置
          animation: pulse-en-passant 1.5s infinite alternate;
          width: 45%;
          height: 45%;
          border: 2rpx solid rgba(255, 255, 255, 0.8);
        }
        
        &.en-passant-captured::after {
          background-color: rgba(255, 0, 0, 0.3); // 淡红色标识被吃掉的棋子位置
          width: 70%;
          height: 70%;
          border: 2rpx dashed rgba(255, 255, 255, 0.6);
          animation: rotation 8s linear infinite;
        }
        
        // 上一步移动起点和终点的高亮
        &.last-move-from, &.last-move-to {
          position: relative;
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 0, 0.3);
            z-index: 1;
          }
        }
        
        // 将军/将杀高亮
        &.checkmate-highlight {
          position: relative;
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 0, 0, 0.4);
            z-index: 1;
            animation: pulse 1s infinite alternate;
          }
        }
        
        .coordinate {
          position: absolute;
          font-size: 20rpx;
          font-weight: bold;
          z-index: 2;
        }
        
        .row-coordinate {
          left: 4rpx;
          top: 4rpx;
          color: #555;
        }
        
        .col-coordinate {
          right: 4rpx;
          bottom: 4rpx;
          color: #555;
        }
        
        .chess-piece {
          width: 80%; /* 调整棋子大小比例 */
          height: 80%;
          z-index: 2;
          transition: all 0.2s ease;
          
          &:hover {
            transform: scale(1.1);
          }
          
          // 移动动画
          &.animate-piece {
            animation: piece-animation 0.3s ease;
          }
          
          // 将杀棋子动画
          &.checkmate-piece {
            animation: checkmate-piece-animation 1s infinite alternate;
          }
          
          // 可拖拽棋子样式
          &.draggable-piece {
            cursor: grab;
            
            &:active {
              cursor: grabbing;
              opacity: 0.7;
            }
          }
        }
        
        // 配置模式样式
        &.config-mode {
          cursor: pointer;
          
          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
        }
        
        // 拖拽目标样式
        &.drop-target {
          background-color: rgba(76, 175, 80, 0.3) !important;
          border: 2rpx dashed #4CAF50;
          
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60%;
            height: 60%;
            border: 2rpx solid #4CAF50;
            border-radius: 50%;
            background-color: rgba(76, 175, 80, 0.2);
            z-index: 1;
          }
        }
      }
    }
  }
  
  // 升变选择弹窗
  .promotion-dialog {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 20rpx;
    padding: 30rpx;
    z-index: 100;
    
    .promotion-title {
      color: #fff;
      font-size: 28rpx;
      text-align: center;
      margin-bottom: 20rpx;
    }
    
    .promotion-options {
      display: flex;
      justify-content: space-between;
      
      .promotion-option {
        width: 100rpx;
        height: 100rpx;
        margin: 0 10rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 10rpx;
        cursor: pointer;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        image {
          width: 80%;
          height: 80%;
        }
      }
    }
  }
  
  // 将军/将杀动画
  .checkmate-animation {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    
    .checkmate-text {
      color: #f5a623;
      font-size: 48rpx;
      font-weight: bold;
      text-align: center;
      text-shadow: 0 0 10rpx rgba(0, 0, 0, 0.5);
      animation: checkmate-text-animation 0.5s ease;
    }
  }
  
  .game-result-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    pointer-events: none;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    
    .game-result-text {
      color: #ffffff;
      font-size: 40rpx;
      font-weight: bold;
      text-align: center;
      padding: 20rpx 40rpx;
      background-color: rgba(0, 0, 0, 0.8);
      border-radius: 20rpx;
      text-shadow: 0 0 10rpx rgba(0, 0, 0, 0.8);
      animation: game-result-animation 0.8s ease;
    }
  }
}

@keyframes piece-animation {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes checkmate-piece-animation {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes checkmate-text-animation {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse-en-passant {
  0% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes rotation {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes game-result-animation {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
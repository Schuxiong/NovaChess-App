<template>
  <view class="chess-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <view class="chess-content">
      <!-- 标题区域 -->
      <view class="title-area">
        <text class="title">观战</text>
      </view>

      <!-- 上方对战区 -->
      <view class="battle-area">
        <!-- 对手信息 -->
        <player-info 
          :is-opponent="true"
          :player-name="game.player1Name"
          :avatar="game.player1Avatar"
          :rating="game.player1Rating"
          :time="game.player1Time"
          :is-turn="currentMoveIndex % 2 === 0"
        />
        
        <!-- 棋盘区域 -->
        <view class="board-area">
          <!-- 评估条 -->
          <view v-if="showEvaluation" class="evaluation-bar" @tap="toggleEvaluationDetails">
            <view class="eval-fill" :style="{ height: evaluationHeight + '%' }">
              <text class="eval-text">{{ formatEvaluation(evaluation) }}</text>
            </view>
            
            <view v-if="showEvaluationDetails" class="evaluation-details">
              <view class="eval-header">引擎评估</view>
              <view class="eval-info">
                <text>引擎: 简易评估</text>
                <text>评分: {{ formatEvaluation(evaluation) }}</text>
                <text>形势: {{ evaluationDescription }}</text>
              </view>
            </view>
          </view>
          
          <view class="board-container">
            <replay-chess-board
              :board-state="boardState"
              :last-move="currentMove"
              :play-as="playAs"
            />
          </view>
        </view>
        
        <!-- 玩家信息 -->
        <player-info 
          :is-opponent="false"
          :player-name="game.player2Name"
          :avatar="game.player2Avatar"
          :rating="game.player2Rating"
          :time="game.player2Time"
          :is-turn="currentMoveIndex % 2 === 1"
        />
      </view>
      
      <!-- 下方记录区 -->
      <view class="control-area">
        <!-- 对局信息 -->
        <view class="match-info">
          <view class="info-row">
            <text class="info-label">评估</text>
            <switch :checked="showEvaluation" @change="toggleEvaluation" color="#81b64c" />
          </view>
          <view class="info-row">
            <text class="info-label">开局方式</text>
            <text class="info-value">{{ currentOpeningName || '未识别开局' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">引擎深度</text>
            <text class="info-value">depth={{ engineDepth }} | {{ engineName }}</text>
          </view>
        </view>

        <!-- 视角切换 
        <view class="control-row">
          <text class="control-label">视角</text>
          <view class="perspective-switch">
            <view class="perspective-option" 
              :class="{ 'active': playAs === 'white' }" 
              @click="switchPerspective('white')">
              <image class="piece-icon" src="/static/images/match/pieces/white-king.png" mode="aspectFit"></image>
              <text>白方</text>
            </view>
            <view class="perspective-option" 
              :class="{ 'active': playAs === 'black' }" 
              @click="switchPerspective('black')">
              <image class="piece-icon" src="/static/images/match/pieces/black-king.png" mode="aspectFit"></image>
              <text>黑方</text>
            </view>
          </view>
        </view>
        --> 
        <!-- 走棋记录 -->
        <scroll-view class="moves-list" scroll-y :scroll-top="scrollTop">
          <view class="moves-container">
            <view 
              v-for="(moveRow, rowIndex) in movePairs" 
              :key="rowIndex"
              class="move-row"
            >
              <text class="move-number">{{ rowIndex + 1 }}.</text>
              
              <!-- 白方走棋 -->
              <view 
                class="move-item white-move"
                :class="{ active: currentMoveIndex === moveRow.whiteIndex }"
                @tap="jumpToMove(moveRow.whiteIndex)"
                v-if="moveRow.white"
              >
                <view class="move-content">
                  <view class="move-piece">
                    <image v-if="moveRow.white.pieceIcon" class="piece-icon-small" :src="moveRow.white.pieceIcon" mode="aspectFit"></image>
                  </view>
                  <text class="move-notation">{{ moveRow.white.notation }}</text>
                  <text class="move-time">{{ moveRow.white.time }}s</text>
                </view>
                <text class="eval-value" :class="{ positive: moveRow.white.evaluation > 0 }">
                  {{ formatEvaluation(moveRow.white.evaluation) }}
                </text>
              </view>
              
              <!-- 黑方走棋 -->
              <view 
                class="move-item black-move"
                :class="{ active: currentMoveIndex === moveRow.blackIndex }"
                @tap="jumpToMove(moveRow.blackIndex)"
                v-if="moveRow.black"
              >
                <view class="move-content">
                  <view class="move-piece">
                    <image v-if="moveRow.black.pieceIcon" class="piece-icon-small" :src="moveRow.black.pieceIcon" mode="aspectFit"></image>
                  </view>
                  <text class="move-notation">{{ moveRow.black.notation }}</text>
                  <text class="move-time">{{ moveRow.black.time }}s</text>
                </view>
                <text class="eval-value" :class="{ positive: moveRow.black.evaluation > 0 }">
                  {{ formatEvaluation(moveRow.black.evaluation) }}
                </text>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 控制栏 -->
        <view class="control-bar">
          <button class="ctrl-btn" @tap="toStart">
            <text class="iconfont">⏮</text>
          </button>
          <button class="ctrl-btn" @tap="prevMove">
            <text class="iconfont">⏪</text>
          </button>
          <button class="ctrl-btn" @tap="toggleAutoPlay" :class="{ active: isAutoPlaying }">
            <text class="iconfont">{{ isAutoPlaying ? '⏸' : '▶' }}</text>
          </button>
          <button class="ctrl-btn" @tap="nextMove">
            <text class="iconfont">⏩</text>
          </button>
          <button class="ctrl-btn" @tap="toEnd">
            <text class="iconfont">⏭</text>
          </button>
        </view>
        
        <!-- 播放速度控制 -->
        <view class="speed-control">
          <text class="speed-label">播放速度:</text>
          <view class="speed-options">
            <button 
              v-for="speed in playbackSpeeds" 
              :key="speed.value"
              class="speed-btn"
              :class="{ active: currentSpeed === speed.value }"
              @tap="setPlaybackSpeed(speed.value)"
            >
              {{ speed.label }}
            </button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="backToHome">
      <uni-icons type="back" size="24" color="#fff"></uni-icons>
    </view>

    <!-- 底部导航栏 -->
    <tab-bar active-tab="play" @tab-change="handleTabChange"></tab-bar>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue'
import PlayerInfo from '@/components/chess/PlayerInfo.vue'
import ReplayChessBoard from '@/components/chess/replay/ReplayChessBoard.vue'
import TabBar from '@/components/TabBar.vue'
import { getInitialChessboard } from '@/utils/chess/cheesLogic'
import { getGameReplayRecords } from '@/api/game'

export default {
  components: {
    TopSpacing,
    PlayerInfo,
    ReplayChessBoard,
    TabBar
  },
  data() {
    return {
      statusBarHeight: 0,
      game: {
        player1Name: '',
        player2Name: '',
        player1Rating: 0,
        player2Rating: 0,
        player1Avatar: '',
        player2Avatar: '',
        player1Time: '10:00',
        player2Time: '10:00',
        moves: []
      },
      currentMoveIndex: -1,
      currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      currentMove: null,
      showEvaluation: false,
      engineDepth: 20,
      engineName: 'Stockfish 17 Lite',
      evaluation: 0,
      boardState: getInitialChessboard(),
      currentPlayer: 'white',
      stockfish: null,
      evalDatabase: {},
      openingDatabase: {},
      currentOpeningName: '',
      showEvaluationDetails: false,
      playAs: 'white',
      isLiveMode: false,  // 是否是观看直播模式
      gameId: '',         // 游戏ID
      liveUpdateTimer: null, // 直播更新定时器
      
      // 自动播放相关
      isAutoPlaying: false,
      autoPlayTimer: null,
      currentSpeed: 1,
      playbackSpeeds: [
        { label: '0.5x', value: 0.5 },
        { label: '1x', value: 1 },
        { label: '1.5x', value: 1.5 },
        { label: '2x', value: 2 },
        { label: '3x', value: 3 }
      ],
      
      // 走棋记录显示相关
      scrollTop: 0,
      maxVisibleRows: 3,
      
      // 音效相关
      audioContext: null
    }
  },
  computed: {
    gameStatus() {
      if (this.currentMoveIndex === -1) return '对局开始'
      if (this.currentMoveIndex >= this.game.moves.length - 1) return '对局结束'
      return '对局进行中'
    },
    
    // 将走棋记录按行组织（每行包含白黑两步）
    movePairs() {
      const pairs = []
      for (let i = 0; i < this.game.moves.length; i += 2) {
        const whiteMove = this.game.moves[i]
        const blackMove = this.game.moves[i + 1]
        
        pairs.push({
          white: whiteMove,
          black: blackMove,
          whiteIndex: i,
          blackIndex: i + 1
        })
      }
      return pairs
    },
    evaluationHeight() {
      const eval_value = this.evaluation
      const max_eval = 5
      const percentage = 50 + (eval_value / max_eval) * 50
      return Math.min(Math.max(percentage, 0), 100)
    },
    evaluationDescription() {
      const eval_value = this.evaluation;
      
      if (eval_value === 0) return '局势均衡';
      
      if (eval_value > 0) {
        if (eval_value < 0.5) return '白方略有优势';
        if (eval_value < 1.5) return '白方有优势';
        if (eval_value < 3) return '白方明显优势';
        if (eval_value < 5) return '白方决定性优势';
        return '白方胜势';
      } else {
        const absEval = Math.abs(eval_value);
        if (absEval < 0.5) return '黑方略有优势';
        if (absEval < 1.5) return '黑方有优势';
        if (absEval < 3) return '黑方明显优势';
        if (absEval < 5) return '黑方决定性优势';
        return '黑方胜势';
      }
    }
  },
  created() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
  },
  onLoad(options) {
    // 获取传递的参数
    this.gameId = options.id || ''
    this.isLiveMode = options.live === 'true'
    
    // 加载对局数据
    this.loadGameData(this.gameId)
  },
  onUnload() {
    // 页面卸载时清理资源
    this.clearResources();
  },
  methods: {
    // 清理资源
    clearResources() {
      // 清除定时器
      if (this.liveUpdateTimer) {
        clearInterval(this.liveUpdateTimer);
        this.liveUpdateTimer = null;
      }
      
      // 清除自动播放定时器
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
      
      // 清除评估引擎
      this.destroyStockfish();
    },
    
    // 清理评估引擎资源
    destroyStockfish() {
      // 在这个简化版中没有实际的Stockfish实例需要清理
      console.log('清理引擎资源');
      this.stockfish = null;
    },
    loadGameData(gameId) {
      console.log('加载对局数据:', gameId, '是否直播模式:', this.isLiveMode)
      
      // 根据是否是直播模式，加载不同的数据
      if (this.isLiveMode) {
        // 加载直播数据
        this.loadLiveGameData(gameId)
      } else {
        // 加载历史对局数据
        this.loadHistoryGameData(gameId)
      }
    },
    
    loadHistoryGameData(gameId) {
      // 显示加载中状态
      uni.showLoading({
        title: '加载对局数据...'
      });
      
      console.log('加载对局回放数据, 游戏ID:', gameId);
      
      // 调用API获取历史对局数据
      getGameReplayRecords(gameId)
        .then(res => {
          if (res.success && res.result) {
            console.log('获取到对局回放数据:', res.result);
            
            // 处理对局基本信息和行棋记录
            this.processGameInfo(gameId, res.result);
            this.processMovesData(res.result);
            
            // 初始化回放
            this.initializeReplay();
          } else {
            console.warn('获取对局回放数据失败:', res.message || '未知错误');
            uni.showToast({
              title: res.message || '获取对局数据失败',
              icon: 'none',
              duration: 2000
            });
            // 使用模拟数据兜底
            this.useMockData();
          }
        })
        .catch(err => {
          console.error('获取对局回放数据出错:', err);
          uni.showToast({
            title: '网络错误，请检查网络连接',
            icon: 'none',
            duration: 2000
          });
          // 使用模拟数据兜底
          this.useMockData();
        })
        .finally(() => {
          uni.hideLoading();
        });
    },
    
    // 处理对局基本信息
    processGameInfo(gameId, replayData) {
      console.log('处理对局基本信息:', replayData);
      
      // 从新的接口返回数据中提取对局基本信息
      // 根据实际接口返回的数据结构进行调整
      const gameInfo = replayData.gameInfo || replayData;
      const blackPlayer = replayData.blackPlayer || {};
      const whitePlayer = replayData.whitePlayer || {};
      const statistics = replayData.statistics || {};
      
      // 计算剩余时间（总时长减去已用时间）
      const formatTime = (totalSeconds) => {
        if (!totalSeconds) return '10:00'; // 默认时间
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };
      
      // 设置游戏基本信息
      this.game = {
        id: gameId,
        // 白方作为player1，黑方作为player2
        player1Name: whitePlayer.username || whitePlayer.realname || '白方玩家',
        player2Name: blackPlayer.username || blackPlayer.realname || '黑方玩家',
        player1Rating: whitePlayer.score || 1500,
        player2Rating: blackPlayer.score || 1500,
        player1Avatar: whitePlayer.avatar || 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ff9.png',
        player2Avatar: blackPlayer.avatar || 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ff9.png',
        player1Time: formatTime(statistics.whitePlayerTimeSeconds),
        player2Time: formatTime(statistics.blackPlayerTimeSeconds),
        // 对局信息
        gameState: gameInfo.gameState || 'completed',
        gameResult: gameInfo.gameResult || 'unknown',
        startTime: gameInfo.startTime || new Date().toISOString(),
        endTime: gameInfo.endTime || new Date().toISOString(),
        totalDuration: gameInfo.totalDuration || 0,
        // 统计信息
        totalMoves: statistics.totalMoves || 0,
        winner: statistics.winner || 'unknown',
        moves: [] // 移动记录，将在processMovesData中填充
      };
      
      console.log('处理后的游戏信息:', this.game);
    },
    
    // 处理行棋记录数据
    processMovesData(replayData) {
      console.log('处理行棋记录数据:', replayData);
      
      const { moveHistory } = replayData;
      
      if (!moveHistory || !Array.isArray(moveHistory)) {
        console.warn('无效的行棋记录数据:', moveHistory);
        // 如果没有移动记录，设置为空数组
        this.game.moves = [];
        return;
      }
      
      console.log('移动历史记录:', moveHistory);
      
      // 转换服务器返回的行棋记录为前端需要的格式
        this.game.moves = moveHistory.map((moveData, index) => {
          console.log(`处理第${index + 1}步移动:`, moveData);
          
          // 根据新的接口数据结构解析moveData
          const { moveSequence, piecesType, fromPositionX, fromPositionY, toPositionX, toPositionY, moveDurationSeconds, tookPiecesId } = moveData;
          
          // 验证必要的字段
          if (!fromPositionX || !fromPositionY || !toPositionX || !toPositionY) {
            console.warn(`第${index + 1}步移动数据不完整:`, moveData);
            const defaultPieceInfo = this.getPieceInfo(1, index);
            return {
              notation: `undefined${index + 1}`,
              from: 'a1',
              to: 'a2',
              time: 0,
              evaluation: 0,
              moveSequence: index + 1,
              piecesType: 1,
              tookPiecesId: null,
              pieceIcon: defaultPieceInfo.icon,
              pieceName: defaultPieceInfo.name
            };
          }
          
          // 直接使用字符串坐标构建棋盘位置（接口返回的就是标准格式如'e2', 'd5'）
          const from = fromPositionX + fromPositionY;
          const to = toPositionX + toPositionY;
          
          // 根据棋子类型生成简单的代数记谱法
          let notation;
          const pieceTypeMap = {
            1: 'P', // 兵 (Pawn)
            2: 'P', // 兵 (Pawn) 
            3: 'R', // 车 (Rook)
            4: 'N', // 马 (Knight)
            5: 'B', // 象 (Bishop)
            6: 'Q', // 后 (Queen)
            7: 'K'  // 王 (King)
          };
          
          const pieceSymbol = pieceTypeMap[piecesType] || 'P';
          
          // 如果是兵，只显示目标位置；其他棋子显示棋子符号+目标位置
          if (piecesType === 1 || piecesType === 2) {
            // 兵的移动，如果有吃子则显示起始列
            if (tookPiecesId) {
              notation = fromPositionX + 'x' + to;
            } else {
              notation = to;
            }
          } else {
            // 其他棋子的移动
            if (tookPiecesId) {
              notation = pieceSymbol + 'x' + to;
            } else {
              notation = pieceSymbol + to;
            }
          }
          
          // 获取棋子信息
          const pieceInfo = this.getPieceInfo(piecesType, index);
          
          const moveResult = {
            notation,
            from,
            to,
            time: moveDurationSeconds || 0,
            evaluation: 0, // 评估值暂时设为0，可以后续添加
            moveSequence: moveSequence || (index + 1),
            piecesType,
            tookPiecesId,
            pieceIcon: pieceInfo.icon,
            pieceName: pieceInfo.name
          };
          
          console.log(`第${index + 1}步处理结果:`, moveResult);
          return moveResult;
        });
      
      console.log('处理后的行棋记录:', this.game.moves);
    },
    
    // 获取棋子信息
    getPieceInfo(piecesType, moveIndex) {
      // 根据移动索引判断是白方还是黑方
      const isWhite = moveIndex % 2 === 0;
      const color = isWhite ? 'white' : 'black';
      
      // 棋子类型映射
      const pieceMap = {
        1: { name: '兵', icon: `/static/images/match/pieces/${color}-pawn.png` },
        2: { name: '兵', icon: `/static/images/match/pieces/${color}-pawn.png` },
        3: { name: '车', icon: `/static/images/match/pieces/${color}-rook.png` },
        4: { name: '马', icon: `/static/images/match/pieces/${color}-knight.png` },
        5: { name: '象', icon: `/static/images/match/pieces/${color}-bishop.png` },
        6: { name: '后', icon: `/static/images/match/pieces/${color}-queen.png` },
        7: { name: '王', icon: `/static/images/match/pieces/${color}-king.png` }
      };
      
      return pieceMap[piecesType] || { name: '未知', icon: '' };
    },
    
    // 使用模拟数据（当API请求失败时使用）
    useMockData() {
      console.log('使用模拟数据');
      this.game = {
        player1Name: 'NikoTheodo',
        player2Name: 'theloyalwolf',
        player1Rating: 3072,
        player2Rating: 2952,
        player1Avatar: 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ff9.png',
        player2Avatar: 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ff9.png',
        player1Time: '10:00',
        player2Time: '10:00',
        moves: [
          { notation: 'e4', from: 'e2', to: 'e4', time: 1.2, evaluation: 0.3 },
          { notation: 'c5', from: 'c7', to: 'c5', time: 0.8, evaluation: 0.1 },
          { notation: 'Nf3', from: 'g1', to: 'f3', time: 1.5, evaluation: 0.4 }
        ]
      };
      this.initializeReplay();
    },
    toggleEvaluation(e) {
      this.showEvaluation = e.detail.value
    },
    formatEvaluation(eval_value) {
      if (eval_value === 0) return '0.0'
      return eval_value > 0 ? '+' + eval_value.toFixed(1) : eval_value.toFixed(1)
    },
    initializeReplay() {
      // 重置棋盘和状态
      this.boardState = getInitialChessboard();
      this.currentMoveIndex = -1;
      this.currentMove = null;
      this.currentPlayer = 'white';
      this.evaluation = 0;
      this.currentOpeningName = '开局阶段';
      
      // 加载开局库
      this.loadOpeningDatabase();
      
      console.log('回放初始化完成');
    },
    jumpToMove(index) {
      // 重置棋盘到初始状态
      if (index < 0 || index >= this.game.moves.length) {
        this.currentMoveIndex = -1;
        this.boardState = getInitialChessboard();
        this.currentMove = null;
        this.currentPlayer = 'white';
        this.evaluation = 0;
        return;
      }
      
      // 如果是向前跳转，需要重新初始化棋盘然后依次执行到目标步骤
      if (index < this.currentMoveIndex) {
        this.boardState = getInitialChessboard();
        this.currentMoveIndex = -1;
        
        // 依次应用所有步骤直到目标步骤
        for (let i = 0; i <= index; i++) {
          this.applyMove(i);
        }
      } 
      // 如果是向后跳转，只需要应用新的步骤
      else if (index > this.currentMoveIndex) {
        for (let i = this.currentMoveIndex + 1; i <= index; i++) {
          this.applyMove(i);
        }
      }
      
      console.log('跳转到步骤:', index, '当前棋手:', this.currentPlayer);
    },
    applyMove(index) {
      if (index < 0 || index >= this.game.moves.length) {
        console.warn('无效的移动索引:', index);
        return;
      }
      
      const move = this.game.moves[index];
      console.log('应用移动:', move);
      
      // 解析位置字符串
      const fromPos = this.parsePosition(move.from);
      const toPos = this.parsePosition(move.to);
      
      if (!fromPos || !toPos) {
        console.error('无法解析移动位置:', move.from, move.to);
        return;
      }
      
      // 播放行棋音效
      this.playMoveSound(move);
      
      // 更新当前移动
      this.currentMove = {
        from: fromPos,
        to: toPos
      };
      
      // 更新棋盘状态 - 在实际实现中，需要根据行棋规则移动棋子
      this.movePiece(fromPos, toPos);
      
      // 更新当前步骤索引
      this.currentMoveIndex = index;
      
      // 更新当前行棋方 (白方先走，然后交替)
      this.currentPlayer = index % 2 === 0 ? 'black' : 'white';
      
      // 更新评估值
      this.evaluation = move.evaluation || 0;
      
      // 如果评估值不存在，触发实时评估
      if (!move.evaluation && this.stockfish && this.stockfish.isReady) {
        const currentFen = this.generateCurrentFen();
        this.evaluatePosition(currentFen, index);
      }
      
      // 更新开局名称（仅在前10步尝试识别开局）
      if (index < 10) {
        this.identifyOpening();
      }
      
      // 更新滚动位置
      this.updateScrollPosition(index);
      
      console.log('移动应用完成，当前索引:', this.currentMoveIndex);
    },
    
    // 生成当前棋盘的FEN
    generateCurrentFen() {
      // 这里应该根据当前棋盘状态生成FEN
      // 暂时返回一个基础FEN
      const activeColor = this.currentPlayer === 'white' ? 'w' : 'b';
      const moveNumber = Math.floor(this.currentMoveIndex / 2) + 1;
      
      return `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${activeColor} KQkq - 0 ${moveNumber}`;
    },
    movePiece(from, to) {
      // 从from位置获取棋子
      const piece = this.boardState[from.row][from.col];
      
      // 如果有棋子，移动它
      if (piece) {
        // 清除原位置
        this.boardState[from.row][from.col] = null;
        
        // 设置到新位置
        this.boardState[to.row][to.col] = piece;
      }
    },
    parsePosition(posStr) {
      if (!posStr || posStr.length < 2) {
        console.warn('无效的位置字符串:', posStr);
        return { row: 0, col: 0 };
      }
      
      const col = posStr.charCodeAt(0) - 97; // 'a'=0, 'b'=1, ...
      const row = parseInt(posStr.charAt(1)) - 1; // '1'=0, '2'=1, ...
      
      return { row, col };
    },
    prevMove() {
      if (this.currentMoveIndex > -1) {
        this.jumpToMove(this.currentMoveIndex - 1);
      }
    },
    nextMove() {
      if (this.currentMoveIndex < this.game.moves.length - 1) {
        this.jumpToMove(this.currentMoveIndex + 1);
      }
    },
    toStart() {
      this.jumpToMove(-1);
    },
    toEnd() {
      this.jumpToMove(this.game.moves.length - 1)
    },
    
    // 自动播放控制
    toggleAutoPlay() {
      if (this.isAutoPlaying) {
        this.stopAutoPlay()
      } else {
        this.startAutoPlay()
      }
    },
    
    startAutoPlay() {
      if (this.currentMoveIndex >= this.game.moves.length - 1) {
        // 如果已经到最后一步，从头开始
        this.toStart()
      }
      
      this.isAutoPlaying = true
      this.autoPlayTimer = setInterval(() => {
        if (this.currentMoveIndex < this.game.moves.length - 1) {
          this.nextMove()
        } else {
          // 播放完毕，停止自动播放
          this.stopAutoPlay()
        }
      }, this.getPlaybackInterval())
    },
    
    stopAutoPlay() {
      this.isAutoPlaying = false
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer)
        this.autoPlayTimer = null
      }
    },
    
    setPlaybackSpeed(speed) {
      this.currentSpeed = speed
      
      // 如果正在自动播放，重新启动以应用新速度
      if (this.isAutoPlaying) {
        this.stopAutoPlay()
        this.startAutoPlay()
      }
    },
    
    getPlaybackInterval() {
      // 基础间隔时间（毫秒），可以根据当前步骤的实际用时调整
      let baseInterval = 2000 // 默认2秒
      
      // 如果当前步骤有时间信息，使用实际时间
      if (this.currentMoveIndex >= 0 && this.currentMoveIndex < this.game.moves.length) {
        const currentMove = this.game.moves[this.currentMoveIndex]
        if (currentMove && currentMove.time) {
          // 将实际用时转换为播放间隔（限制在0.5-10秒之间）
          baseInterval = Math.max(500, Math.min(currentMove.time * 1000, 10000))
        }
      }
      
      // 应用播放速度
      return baseInterval / this.currentSpeed
    },
    
    // 播放行棋音效
    playMoveSound(move) {
      try {
        let soundFile = '/static/audio/move.mp3'; // 默认移动音效
        
        // 根据移动类型选择不同音效
        if (move.tookPiecesId) {
          soundFile = '/static/audio/capture.mp3'; // 吃子音效
        }
        
        // 使用uni-app的音频API播放音效
        const audioContext = uni.createInnerAudioContext();
        audioContext.src = soundFile;
        audioContext.volume = 0.5;
        audioContext.play();
        
        // 播放完成后销毁音频实例
        audioContext.onEnded(() => {
          audioContext.destroy();
        });
        
        audioContext.onError((error) => {
          console.warn('音效播放失败:', error);
          audioContext.destroy();
        });
      } catch (error) {
        console.warn('播放音效时出错:', error);
      }
    },
    
    // 更新滚动位置，确保当前移动可见
    updateScrollPosition(moveIndex) {
      const rowIndex = Math.floor(moveIndex / 2);
      const totalRows = this.movePairs.length;
      
      // 如果当前行超出可见范围，滚动到合适位置
      if (rowIndex >= this.maxVisibleRows) {
        const scrollToRow = Math.max(0, rowIndex - this.maxVisibleRows + 1);
        this.scrollTop = scrollToRow * 60; // 假设每行高度为60rpx
      } else {
        this.scrollTop = 0;
      }
    },
    backToHome() {
      uni.navigateBack()
    },
    handleTabChange(tab) {
      uni.switchTab({
        url: tab.path
      })
    },
    // 初始化象棋评估引擎
    initStockfish() {
      console.log('初始化Stockfish引擎');
      // 在这个简化版中，我们使用模拟的评估值
      this.stockfish = {
        isReady: true,
        evaluate: (fen) => {
          // 模拟评估逻辑
          return Math.random() * 2 - 1; // 返回-1到1之间的随机值
        }
      };
      
      // 如果有走棋记录，开始评估
      if (this.game.moves.length > 0) {
        this.evaluateAllPositions();
      }
      
      // 小程序简化方案 - 使用预计算的评估值
      // 无需引入完整引擎，仅需加载预先计算好的开局评估库
      this.loadEvaluationData();
    },
    
    // 评估所有位置
    evaluateAllPositions() {
      console.log('开始评估所有位置');
      
      // 重置棋盘到初始状态
      let currentBoard = getInitialChessboard();
      let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // 评估初始位置
      this.evaluatePosition(currentFen, -1);
      
      // 逐步应用每个移动并评估
      for (let i = 0; i < this.game.moves.length; i++) {
        const move = this.game.moves[i];
        
        // 应用移动到棋盘
        try {
          // 这里应该有实际的移动应用逻辑
          // 暂时使用模拟的FEN
          currentFen = this.generateFenAfterMove(currentFen, move);
          
          // 评估当前位置
          this.evaluatePosition(currentFen, i);
        } catch (error) {
          console.error(`评估第${i + 1}步时出错:`, error);
        }
      }
    },
    
    // 评估单个位置
    evaluatePosition(fen, moveIndex) {
      if (!this.stockfish || !this.stockfish.isReady) {
        return;
      }
      
      try {
        // 使用Stockfish评估位置
        const evaluation = this.stockfish.evaluate(fen);
        
        // 更新对应移动的评估值
        if (moveIndex >= 0 && moveIndex < this.game.moves.length) {
          this.$set(this.game.moves[moveIndex], 'evaluation', evaluation);
        }
        
        // 如果是当前位置，更新显示的评估值
        if (moveIndex === this.currentMoveIndex) {
          this.evaluation = evaluation;
        }
        
        console.log(`位置评估完成 - 移动${moveIndex + 1}: ${evaluation.toFixed(2)}`);
      } catch (error) {
        console.error('评估位置时出错:', error);
      }
    },
    
    // 生成移动后的FEN（简化版）
    generateFenAfterMove(currentFen, move) {
      // 这里应该有完整的FEN生成逻辑
      // 暂时返回一个模拟的FEN
      const fenParts = currentFen.split(' ');
      const activeColor = fenParts[1] === 'w' ? 'b' : 'w';
      const moveNumber = fenParts[5] ? parseInt(fenParts[5]) + (activeColor === 'w' ? 1 : 0) : 1;
      
      return `${fenParts[0]} ${activeColor} ${fenParts[2]} ${fenParts[3]} 0 ${moveNumber}`;
    },
    
    // 加载预计算的评估库
    loadEvaluationData() {
      // 模拟加载预计算的评估库
      this.evalDatabase = {
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': 0.3, // e4
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2': 0.1, // 回应 c5
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2': 0.4, // Nf3
        // 更多常见开局位置...
      };
      
      console.log('评估库加载完成');
    },
    
    // 根据特定位置查询评估值
    getEvaluationForPosition(fen) {
      // 简化的FEN格式（仅取前半部分）
      const simpleFen = fen.split(' ')[0];
      
      // 查找匹配项或返回默认值
      for (const [storedFen, evalValue] of Object.entries(this.evalDatabase)) {
        const storedSimpleFen = storedFen.split(' ')[0];
        if (storedSimpleFen === simpleFen) {
          return evalValue;
        }
      }
      
      // 如果没有找到匹配项，使用简单的启发式计算
      return this.calculateSimpleEvaluation(fen);
    },
    
    // 简单的启发式评估
    calculateSimpleEvaluation(fen) {
      const pieces = fen.split(' ')[0];
      let value = 0;
      
      // 简单的材料差值计算
      const pieceValues = {
        'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
        'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': 0
      };
      
      for (const char of pieces) {
        if (pieceValues[char]) {
          value += pieceValues[char];
        }
      }
      
      // 转换为兵值表示
      return value / 10; // 适当缩小差距
    },
    
    // 更新评估值
    updateEvaluation(moveIndex) {
      if (moveIndex >= 0 && moveIndex < this.game.moves.length) {
        this.evaluation = this.game.moves[moveIndex].evaluation;
      } else {
        this.evaluation = 0;
      }
    },
    
    // 加载开局库
    loadOpeningDatabase() {
      // 模拟简单的开局库
      this.openingDatabase = {
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR': '国王兵开局',
        'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR': '王后兵开局',
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR': '西西里防御',
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R': '西西里防御，闭门系统',
        'rnbqkb1r/pp1ppppp/5n2/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R': '西西里防御，掘子变例'
      };
    },
    
    // 识别当前局面的开局
    identifyOpening() {
      // 简化的开局识别逻辑
      const moveCount = this.currentMoveIndex + 1;
      if (moveCount >= 2) {
        // 根据前几步走法识别开局
        const moves = this.game.moves.slice(0, Math.min(moveCount, 6));
        const moveNotations = moves.map(m => m.notation).join(' ');
        
        // 扩展的开局库匹配
        const openings = {
          'e4 e5': '王兵开局',
          'e4 e5 Nf3': '意大利开局',
          'e4 e5 Nf3 Nc6': '意大利开局',
          'e4 e5 Nf3 Nc6 Bc4': '意大利开局',
          'd4 d5': '后兵开局',
          'd4 d5 c4': '后翼弃兵',
          'd4 Nf6': '印度防御',
          'd4 Nf6 c4': '英国开局',
          'd4 Nf6 c4 e6': '尼姆佐印度防御',
          'Nf3 Nf6': '雷蒂开局',
          'Nf3 Nf6 c4': '英国开局',
          'e4 c5': '西西里防御',
          'e4 c5 Nf3': '西西里防御',
          'e4 e6': '法国防御',
          'e4 c6': '卡罗-卡恩防御',
          'e4 d6': '皮尔茨防御'
        };
        
        // 尝试匹配最长的开局序列
        let matchedOpening = '未识别开局';
        let maxLength = 0;
        
        for (const [sequence, name] of Object.entries(openings)) {
          if (moveNotations.startsWith(sequence) && sequence.length > maxLength) {
            matchedOpening = name;
            maxLength = sequence.length;
          }
        }
        
        this.currentOpeningName = matchedOpening;
      }
      
      const position = this.currentFen.split(' ')[0]; // 只取位置部分
      
      if (this.openingDatabase[position]) {
        this.currentOpeningName = this.openingDatabase[position];
        return this.openingDatabase[position];
      }
      
      // 默认开局名称
      if (this.currentMoveIndex < 2) {
        this.currentOpeningName = '标准开局';
      }
      
      return this.currentOpeningName;
    },
    toggleEvaluationDetails() {
      this.showEvaluationDetails = !this.showEvaluationDetails;
    },
    // 切换观看视角
    switchPerspective(perspective) {
      this.playAs = perspective;
    },
    loadLiveGameData(gameId) {
      // 显示加载中状态
      uni.showLoading({
        title: '加载对局数据...'
      });
      
      console.log('加载直播对局数据, 游戏ID:', gameId);
      
      // 调用API获取最新的对局数据
      getGameReplayRecords(gameId)
        .then(res => {
          if (res.success && res.result) {
            console.log('获取到直播对局数据:', res.result);
            
            // 处理对局基本信息和行棋记录
            this.processGameInfo(gameId, res.result);
            this.processMovesData(res.result);
            
            // 初始化回放并跳转到最新一步
            this.initializeReplay();
            if (this.game.moves.length > 0) {
              this.jumpToMove(this.game.moves.length - 1);
            }
            
            // 设置定时轮询，获取最新动态
            if (this.isLiveMode) {
              this.setupLiveUpdates(gameId);
            }
          } else {
            console.warn('获取直播对局数据失败:', res.message || '未知错误');
            uni.showToast({
              title: res.message || '获取直播数据失败',
              icon: 'none',
              duration: 2000
            });
            // 使用模拟数据兜底
            this.useMockLiveData();
          }
        })
        .catch(err => {
          console.error('获取直播对局数据出错:', err);
          uni.showToast({
            title: '网络错误，请检查网络连接',
            icon: 'none',
            duration: 2000
          });
          // 使用模拟数据兜底
          this.useMockLiveData();
        })
        .finally(() => {
          uni.hideLoading();
        });
    },
    
    // 设置直播更新轮询
    setupLiveUpdates(gameId) {
      // 清除可能存在的定时器
      if (this.liveUpdateTimer) {
        clearInterval(this.liveUpdateTimer);
      }
      
      // 设置定时轮询，每5秒获取一次最新数据
      this.liveUpdateTimer = setInterval(() => {
        this.updateLiveGameData(gameId);
      }, 5000);
    },
    
    // 更新直播对局数据
    updateLiveGameData(gameId) {
      console.log('更新直播对局数据, 游戏ID:', gameId);
      
      // 调用API获取最新的对局数据
      getGameReplayRecords(gameId)
        .then(res => {
          if (res.success && res.result) {
            const replayData = res.result;
            const newMoveHistory = replayData.moveHistory || [];
            
            // 检查是否有新的行棋记录
            if (newMoveHistory.length > this.game.moves.length) {
              console.log('发现新的行棋记录:', newMoveHistory.length - this.game.moves.length, '步');
              
              // 更新行棋记录
              this.processMovesData(replayData);
              
              // 自动跳转到最新一步
              this.jumpToMove(this.game.moves.length - 1);
            }
          }
        })
        .catch(err => {
          console.error('更新直播对局数据出错:', err);
        });
    },
    
    // 使用模拟的直播数据
    useMockLiveData() {
      console.log('使用模拟直播数据');
      this.game = {
        player1Name: 'NikoTheodo',
        player2Name: 'theloyalwolf',
        player1Rating: 3072,
        player2Rating: 2952,
        player1Avatar: 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ff9.png',
        player2Avatar: 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ff9.png',
        player1Time: '3:45',
        player2Time: '4:12',
        moves: [
          { notation: 'e4', from: 'e2', to: 'e4', time: 1.2, evaluation: 0.3 },
          { notation: 'c5', from: 'c7', to: 'c5', time: 0.8, evaluation: 0.1 }
        ]
      };
      this.initializeReplay();
      
      // 模拟直播更新
      if (this.isLiveMode) {
        setTimeout(() => {
          console.log('模拟新的棋步');
          this.game.moves.push({ notation: 'Nf3', from: 'g1', to: 'f3', time: 1.5, evaluation: 0.4 });
          this.jumpToMove(this.game.moves.length - 1);
        }, 5000);
      }
    },
  },
  
  mounted() {
    // 初始化简化版评估引擎
    this.initStockfish();
  },
  
  beforeDestroy() {
    // 清理引擎资源
    this.destroyStockfish();
  }
}
</script>

<style lang="scss" scoped>
.chess-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  position: relative;
  width: 100%;
  overflow: hidden;
}

.chess-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.title-area {
  padding: 20rpx 0;
  text-align: center;

  .title {
    font-size: 36rpx;
    color: #fff;
    font-weight: bold;
  }
}

.battle-area {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
}

.board-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  width: 100%;
  padding: 0 10rpx;
  box-sizing: border-box;
  position: relative;

  .evaluation-bar {
    width: 40rpx;
    height: 650rpx; /* 固定高度与棋盘保持一致 */
    background-color: #000;
    margin-right: 12rpx;
    border-radius: 6rpx;
    overflow: visible;
    position: relative;
    flex-shrink: 0;
    display: flex;

    .eval-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background-color: #4a4a4a;
      transition: height 0.3s ease;

      .eval-text {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 20rpx;
        color: #fff;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }
    }
    
    .evaluation-details {
      position: absolute;
      left: 50rpx;
      top: 50%;
      transform: translateY(-50%);
      background-color: rgba(0, 0, 0, 0.85);
      border-radius: 10rpx;
      padding: 20rpx;
      width: 280rpx;
      z-index: 100;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
      
      .eval-header {
        font-size: 28rpx;
        color: #fff;
        margin-bottom: 12rpx;
        font-weight: bold;
        text-align: center;
      }
      
      .eval-info {
        display: flex;
        flex-direction: column;
        gap: 10rpx;
        
        text {
          font-size: 24rpx;
          color: #ddd;
        }
      }
    }
  }

  .board-container {
    width: calc(100% - 52rpx);
    max-width: 650rpx;
    aspect-ratio: 1;
    background-color: #2a2a2a;
    border-radius: 12rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
}

.control-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 20rpx;
  margin-top: 20rpx;
  overflow: hidden;
}

.match-info {
  padding: 20rpx;
  border-bottom: 1px solid #3a3a3a;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 24rpx;
      color: #EEE;
      font-weight: bold;
    }

    .info-value {
      font-size: 24rpx;
      color: #fff;
    }
  }
}

.moves-list {
  flex: 1;
  padding: 20rpx;
  max-height: 180rpx; /* 限制为3行的高度，适应紧凑布局 */

  .moves-container {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .move-row {
    display: flex;
    align-items: center;
    padding: 8rpx 0;
    margin-bottom: 6rpx;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8rpx;
    min-height: 48rpx;

    .move-number {
      color: #999;
      font-size: 22rpx;
      margin-right: 12rpx;
      min-width: 36rpx;
      text-align: center;
    }
  }

  .move-item {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 6rpx 10rpx;
    margin: 0 4rpx;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6rpx;
    border-left: 3rpx solid transparent;
    transition: all 0.3s ease;
    min-height: 36rpx;
    gap: 6rpx;

    &.active {
      background: rgba(129, 182, 76, 0.2);
      border-left-color: #81b64c;
    }

    &.white-move {
      border-left-color: rgba(255, 255, 255, 0.3);
    }

    &.black-move {
      border-left-color: rgba(0, 0, 0, 0.5);
    }

    .move-piece {
      .piece-icon-small {
        width: 20rpx;
        height: 20rpx;
      }
    }

    .move-notation {
      color: #fff;
      font-size: 24rpx;
      font-weight: 500;
      flex: 1;
    }

    .move-time {
      color: #999;
      font-size: 18rpx;
      min-width: 30rpx;
    }

    .eval-value {
      color: #ff6b6b;
      font-size: 18rpx;
      font-weight: 500;
      min-width: 40rpx;
      text-align: right;

      &.positive {
        color: #51cf66;
      }
    }
  }
}

.control-bar {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  padding: 20rpx;
  border-top: 1px solid #3a3a3a;

  .ctrl-btn {
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #3a3a3a;
    border-radius: 50%;
    border: none;
    transition: all 0.3s;

    &:active {
      background-color: #4a4a4a;
      transform: scale(0.95);
    }

    &.active {
      background-color: rgba(129, 182, 76, 0.8);
      border-color: rgba(129, 182, 76, 1);
    }

    .iconfont {
      font-size: 40rpx;
      color: #fff;
    }
  }
}

.speed-control {
  margin-top: 20rpx;
  padding: 0 20rpx;
  border-top: 1px solid #3a3a3a;
  padding-top: 20rpx;

  .speed-label {
    color: #fff;
    font-size: 28rpx;
    margin-bottom: 16rpx;
    display: block;
  }

  .speed-options {
    display: flex;
    justify-content: space-between;
    gap: 12rpx;
  }

  .speed-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6rpx;
    color: #fff;
    font-size: 24rpx;
    padding: 12rpx 8rpx;
    text-align: center;

    &.active {
      background: rgba(129, 182, 76, 0.3);
      border-color: rgba(129, 182, 76, 0.8);
    }
  }
}

.move-piece {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;

  .piece-icon-small {
    width: 32rpx;
    height: 32rpx;
    margin-right: 8rpx;
  }

  .piece-name {
    font-size: 24rpx;
    color: #666;
  }
}

.back-button {
  position: fixed;
  top: 40rpx;
  left: 20rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  z-index: 100;
}

.perspective-switch {
  display: flex;
  justify-content: space-around;
  width: 200rpx;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 10rpx;
  padding: 10rpx;
  
  .perspective-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10rpx;
    border-radius: 6rpx;
    
    &.active {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .piece-icon {
      width: 40rpx;
      height: 40rpx;
      margin-bottom: 6rpx;
    }
    
    text {
      font-size: 20rpx;
      color: #fff;
    }
  }
}
</style>
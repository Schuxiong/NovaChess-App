<template>
  <view class="chess-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <view class="chess-content">
    <!-- 上方对战区 -->
    <view class="battle-area">
      <!-- 对手信息 -->
        <player-info 
          :is-opponent="true"
          :player-name="opponentName"
          :avatar="opponentAvatar"
          :time="formatTime(opponentTimeRemaining)"
          :is-turn="(playAs === 'white' && currentPlayer === 'black') || (playAs === 'black' && currentPlayer === 'white')"
        />
        
        <!-- 棋盘区 -->
        <view class="board-container">
          <chess-board
            ref="chessBoard"
            :board-state="chessboard"
            :selected-position="selectedPosition"
            :valid-moves="validMoves"
            :last-move="lastMove"
            :current-player="currentPlayer"
            :play-as="playAs"
            :is-checkmated="isCheckmated"
            :checkmate-color="checkmateColor"
            :game-result="gameResult"
            :game-ended="gameEnded"
            :interactive="true"
            @cell-click="handleCellClick"
            @promotion-move="handlePromotion"
            :key="JSON.stringify(chessboard)"
          />
        </view>
      
      <!-- 玩家信息 -->
        <player-info 
          :is-opponent="false"
          :player-name="playerName"
          :avatar="playerAvatar"
          flag="https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee9012.png"
          :time="formatTime(playerTimeRemaining)"
          :is-turn="(playAs === 'white' && currentPlayer === 'white') || (playAs === 'black' && currentPlayer === 'black')"
        />
    </view>
    
    <!-- 下方操作区 -->
    <view class="control-area">
      <!-- 主标签功能面板 -->
        <game-tabs
          :active-tab="activeTab"
          :tabs="currentTabList"
          @tab-change="switchTab"
        />
        
        <!-- 根据不同标签页显示不同内容 -->
        <view>
          <new-game-tab
            v-if="activeTab === 'newGame'"
            :time-control="timeControl"
            :game-mode="gameMode"
            :play-as="playAs"
            :show-more-options="showMoreOptions"
            :matching="matching"
            ref="newGameTabRef"
            @toggle-more-options="toggleMoreOptions"
            @select-game-mode="selectMode"
            @select-time="selectTime"
            @select-play-as="selectPlayAs"
            @start-game="startGame"
            @cancel-matching="cancelMatching"
            @play-with-friend="playWithFriend"
            @play-ladder="playLeaderboard"
            @invite-friend="inviteFriend"
            @invite-accepted="handleInviteAccepted"
          />
          
          <games-tab
            v-if="activeTab === 'games'"
            :games-list="gamesList"
            :user-id="currentUserId"
          />
          
          <player-tab
            v-if="activeTab === 'players'"
            :players-list="playersList"
            @invite-friend="inviteFriend"
            @share-invite-link="shareInviteLink"
          />
          
          <match-tab
            v-if="activeTab === 'match'"
            :time-control="timeControl"
            :game-mode="gameMode"
            :play-as="playAs"
            :move-history="formattedMoveHistory"
            :opening-name="currentOpening"
            :player-name="playerName"
            :opponent-name="opponentName"
            :game-result="gameResult"
            :is-leaderboard-mode="isLeaderboardMode"
            @offer-draw="offerDraw"
            @resign="resignGame"
            @send-message="sendChatMessage"
            @request-new-game="startNewGame"
          />
        </view>
      </view>
      
      <!-- 测试按钮 - 用于开始对战并显示对战Tab -->
      </view>
      
    <!-- 添加返回首页按钮 -->
    <view class="back-button" @click="backToHome">
      <uni-icons type="back" size="24" color="#fff"></uni-icons>
    </view>
    
    <!-- 胜利弹窗 -->
    <uni-popup ref="victoryPopup" type="center" background-color="#333" @close="handleResultClose">
      <view class="result-popup victory-popup">
        <view class="result-icon">
          <image src="/static/images/match/gold_trophy.png" mode="aspectFit"></image>
        </view>
        <view class="result-title">比赛胜出！</view>
        <view class="result-description">你"将死"了对手</view>
        
        <!-- 天梯赛积分变化 -->
        <view v-if="isLeaderboardMode" class="rating-display">
          <text class="rating-label">当前积分</text>
          <view class="rating-value-container">
            <text class="rating-value">{{ ratingChange ? ratingChange.before : playerRating }}</text>
            <text v-if="ratingChange && ratingChange.change > 0" class="rating-change positive">+ {{ ratingChange.change }}</text>
            <text v-else-if="ratingChange && ratingChange.change < 0" class="rating-change negative">{{ ratingChange.change }}</text>
            <text v-else-if="ratingChange" class="rating-change neutral">{{ ratingChange.change }}</text>
          </view>
        </view>
        
        <view class="result-actions">
          <view class="action-btn primary-btn" @click="handleSummary">总结比赛</view>
          <view class="action-btn secondary-btn" @click="handleNewGame">新的一局</view>
        </view>
        <view class="popup-close" @click="closeResultPopup">
          <uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
        </view>
      </view>
    </uni-popup>
    
    <!-- 失败弹窗 -->
    <uni-popup ref="defeatPopup" type="center" background-color="#333" @close="handleResultClose">
      <view class="result-popup defeat-popup">
        <view class="result-title">遗憾告负...</view>
        <view class="result-description">你被"将死"了</view>
        
        <!-- 天梯赛积分变化 -->
        <view v-if="isLeaderboardMode" class="rating-display">
          <text class="rating-label">当前积分</text>
          <view class="rating-value-container">
            <text class="rating-value">{{ ratingChange ? ratingChange.before : playerRating }}</text>
            <text v-if="ratingChange && ratingChange.change > 0" class="rating-change positive">+ {{ ratingChange.change }}</text>
            <text v-else-if="ratingChange && ratingChange.change < 0" class="rating-change negative">{{ ratingChange.change }}</text>
            <text v-else-if="ratingChange" class="rating-change neutral">{{ ratingChange.change }}</text>
          </view>
        </view>
        
        <view class="result-actions">
          <view class="action-btn primary-btn" @click="handleRematch">再战一局</view>
          <view class="action-btn secondary-btn" @click="backToHome">回到首页</view>
        </view>
        <view class="popup-close" @click="closeResultPopup">
          <uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
        </view>
      </view>
    </uni-popup>
    
    <!-- 和棋弹窗 -->
    <uni-popup ref="drawPopup" type="center" background-color="#333" @close="handleResultClose">
      <view class="result-popup draw-popup">
        <view class="result-title">和棋</view>
        <view class="result-description">{{ gameResult || "双方同意和棋" }}</view>
        
        <!-- 天梯赛积分变化 -->
        <view v-if="isLeaderboardMode" class="rating-display">
          <text class="rating-label">当前积分</text>
          <view class="rating-value-container">
            <text class="rating-value">{{ ratingChange ? ratingChange.before : playerRating }}</text>
            <text v-if="ratingChange && ratingChange.change > 0" class="rating-change positive">+ {{ ratingChange.change }}</text>
            <text v-else-if="ratingChange && ratingChange.change < 0" class="rating-change negative">{{ ratingChange.change }}</text>
            <text v-else-if="ratingChange" class="rating-change neutral">{{ ratingChange.change }}</text>
          </view>
        </view>
        
        <view class="result-actions">
          <view class="action-btn primary-btn" @click="handleRematch">再战一局</view>
          <view class="action-btn secondary-btn" @click="backToHome">回到首页</view>
        </view>
        <view class="popup-close" @click="closeResultPopup">
          <uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
        </view>
      </view>
    </uni-popup>
    
    <!-- 对局总结弹窗 -->
    <uni-popup ref="summaryPopup" type="center" background-color="#333">
      <view class="summary-popup">
        <view class="summary-header">
          <view class="summary-title">对局总结</view>
          <view class="popup-close" @click="closeSummaryPopup">
            <uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
          </view>
        </view>
        
        <view class="summary-content">
          <view v-if="summaryLoading" class="summary-loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">AI正在分析对局...</text>
          </view>
          
          <summary-display v-else :summary-content="summaryContent" />
        </view>
        
        <view class="summary-actions">
          <view class="action-btn secondary-btn" @click="closeSummaryPopup">关闭</view>
          <view class="action-btn primary-btn" @click="handleNewGame">新的一局</view>
        </view>
      </view>
    </uni-popup>
    
    <!-- 引入通用底部导航栏 -->
    <tab-bar active-tab="play" @tab-change="handleTabChange"></tab-bar>
    
    <!-- 邀请弹窗 -->
    <invitation-popup 
      ref="invitationPopup"
      :inviter="currentInviter"
      @accept="handleAcceptInvitation"
      @decline="handleDeclineInvitation"
      @close="handleInvitationClose"
    />
    
    <!-- 匹配状态弹窗 -->
    <matching-status-popup 
      ref="matchingStatusPopup"
      :opponent="selectedOpponent || selectedFriend"
      :invite-id="pendingInviteId"
      :time-control="timeControl"
      :play-as="playAs"
      @cancel="handleCancelInvite"
      @close="handleMatchingPopupClose"
    />
  </view>
</template>

<script>
// 导入通用导航栏组件
import TabBar from '@/components/TabBar.vue';
// 导入自定义组件
import ChessBoard from '@/components/chess/ChessBoard.vue';
import PlayerInfo from '@/components/chess/PlayerInfo.vue';
import GameTabs from '@/components/chess/GameTabs.vue';
import NewGameTab from '@/components/chess/tabs/NewGameTab.vue';
import GamesTab from '@/components/chess/tabs/GamesTab.vue';
import PlayerTab from '@/components/chess/tabs/PlayerTab.vue';
import MatchTab from '@/components/chess/tabs/MatchTab.vue';
import InvitationPopup from '@/components/chess/InvitationPopup.vue';
import TopSpacing from '@/components/TopSpacing.vue'
import MatchingStatusPopup from '@/components/chess/MatchingStatusPopup.vue';
import SummaryDisplay from '@/components/chess/SummaryDisplay.vue';

// 导入国际象棋逻辑
import { 
  getInitialChessboard, 
  getValidMoves, 
  getPieceColor, 
  getPieceType,
  recordMove,
  isKingInCheck,
  canCastle,
  getCastlingMoves,
  calculateAlgebraicNotation,
  chessBoardState
} from '@/utils/chess/cheesLogic';

// 导入对弈关系API
import { queryPendingInvitations, respondInvitation, addChessFriendPair, listChessFriendPair, cancelInvitation, clearPendingInvitations, getInvitationStatus, getGameIdByInviteId } from '@/api/pair';
// 导入游戏相关API
import { initGame, moveChess, getChessMovesHistory, updateGameStatus, enterGame, requestDraw, respondDraw, getDrawStatus, cancelDrawRequest, quitGame } from '@/api/game';
// 导入用户API
import { getUserData, getUserList } from '@/api/system/user';
// 导入积分相关API
import { updatePlayerScore, addPlayerScoreRecord, getPlayerScoreList } from '@/api/score';

// 导入WebSocket服务
import { connectWebSocket, subscribeToTopic, sendMessage, disconnectWebSocket, unsubscribeFromTopic } from '@/utils/websocket.js';

export default {
  components: {
    TabBar,
    ChessBoard,
    PlayerInfo,
    GameTabs,
    NewGameTab,
    GamesTab,
    PlayerTab,
    MatchTab,
    InvitationPopup,
    TopSpacing,
    MatchingStatusPopup,
    SummaryDisplay
  },
  data() {
    return {
      columns: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      rows: ['8', '7', '6', '5', '4', '3', '2', '1'],
      showMoreOptions: false,
      activeTab: 'newGame', // 当前激活的标签: 'newGame', 'games', 'players'
      tabList: [
        { value: 'newGame', label: '新游戏', icon: 'https://pic1.imgdb.cn/item/67f3c61ee381c3632bee901f.png' },
        { value: 'games', label: '对局', icon: 'https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee900f.png' },
        { value: 'players', label: '玩家', icon: 'https://pic1.imgdb.cn/item/67f3c61ee381c3632bee9021.png' },
        { value: 'match', label: '对战', icon: 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ffa.png' } // 对战标签使用attack.png图标
      ],
      selectedPosition: null, // 选中的棋子位置 {row, col}
      validMoves: [], // 当前选中棋子的有效移动位置 [{row, col}]
      currentPlayer: 'white', // 当前玩家，'white'或'black'
      gameStarted: false, // 游戏是否已开始
      gameMode: 'standard', // 游戏模式: 'standard', 'quick'
      timeControl: '10 min', // 时间控制
      playAs: 'white', // 玩家执子颜色: 'white', 'black', 'random' - 默认为白色
      playerTimeRemaining: 600, // 玩家剩余时间（秒）
      opponentTimeRemaining: 600, // 对手剩余时间（秒）
      playerTimer: null, // 玩家计时器
      opponentTimer: null, // 对手计时器
      moveStartTime: null, // 记录当前回合开始时间
      playerName: '', // 玩家名称
      opponentName: '', // 初始显示空
      playerAvatar: '/static/images/match/avatar-user.png', // 玩家头像
      opponentAvatar: '/static/images/match/avatar-default.png', // 对手头像
      gameResult: '', // 游戏结果
      gameEnded: false, // 游戏是否结束
      gamesList: [],
      playersList: [],
      // 棋盘状态，使用二维数组表示
      chessboard: getInitialChessboard(),
      moveHistory: [], // 移动历史记录
      formattedMoveHistory: [], // 格式化后的移动历史
      initialBoardState: null, // 记录初始棋盘状态用于重置
      matching: false, // 是否正在匹配中
      lastMove: null, // 新增的lastMove属性
      specialMoves: {  // 特殊移动
        castling: [],  // 王车易位
        enPassant: null, // 吃过路兵
        promotion: {   // 兵升变
          pendingMove: null,
          showDialog: false
        }
      },
      currentOpening: 'Anglo-Scandinavian Defense',
      isCheckmated: false,  // 是否将杀状态
      checkmateColor: '',   // 被将杀的颜色
      
      // 当前邀请者信息
      currentInviter: {
        id: 0,
        name: '',
        rating: 0,
        avatar: '',
        timeControl: '10 min'
      },
      selectedOpponent: null, // 从对手列表中选择的对手
      selectedFriend: {       // 从好友列表中选择的好友
        id: 0,
        userName: '',
        rating: 0,
        avatar: '',
        badge: ''
      },
      isLeaderboardMode: false,
      opponentRating: 0,
      playerRating: 335,
      ratingChange: null,
      statusBarHeight: 0,
      pendingInvitations: [], // 待接受的邀请列表
      invitationTimer: null, // 轮询邀请的定时器
      currentInviteInfo: null, // 当前邀请的其他信息（如执棋颜色）
      invitationShown: false, // 是否已显示邀请弹窗
      lastShownInviteId: '', // 最后显示的邀请ID
      
      // 游戏联调相关数据
      currentUserId: '', // 当前用户ID
      currentUserAccount: '', // 当前用户账号
      currentGameId: '', // 当前游戏ID
      pollingGameMovesTimer: null, // 轮询行棋动作的定时器
      lastMoveId: '', // 最后一次行棋ID
      pendingInviteId: null, // 当前正在等待的游戏邀请ID
      inviteStatusTimer: null, // 轮询邀请状态的定时器
      inviteTimeoutTimer: null, // 轮询邀请超时的定时器
      
      // WebSocket 相关状态
      webSocketService: {
        stompClient: null,
        gameSubscription: null,
        gameIdForSubscription: null 
      },
      enPassantTarget: null, // 新增：记录可被吃过路兵的目标格
      movedPieces: new Set(), // 记录已移动的棋子
      
      // 对局总结相关
      summaryLoading: false,
      summaryContent: ''
    }
  },
  computed: {
    // 计算当前显示的标签列表
    currentTabList() {
      // 如果游戏未开始，只显示前三个标签
      return this.gameStarted 
        ? this.tabList 
        : this.tabList.filter(tab => tab.value !== 'match');
    }
  },
  created() {
    // 保存初始棋盘状态
    this.initialBoardState = JSON.parse(JSON.stringify(this.chessboard));
    
    // 获取当前用户信息
    this.getCurrentUserInfo();
  },
  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
    
    // 页面加载时的处理
    if (options && options.mode) {
      // 如果是从邀请好友入口进入
      if (options.mode === 'invite' || options.mode === 'friends') {
        // 通过 setTimeout 确保界面完全渲染后再执行
        setTimeout(() => {
          this.activeTab = 'newGame';
          
          // 延迟300ms后自动触发好友邀请界面
          setTimeout(() => {
            if (this.$refs.newGameTabRef) {
              this.$refs.newGameTabRef.onPlayWithFriend();
            } else {
              this.playWithFriend();
            }
          }, 300);
        }, 100);
      }
      // 如果是从天梯赛入口进入
      else if (options.mode === 'ladder') {
        // 延迟执行以确保组件加载完成
        setTimeout(() => {
          this.activeTab = 'newGame';
          this.playLeaderboard();
        }, 100);
      }
    }
    
    // 处理邀请链接参数
    if (options && options.invitation) {
      try {
        // 尝试直接解析
        const inviter = JSON.parse(decodeURIComponent(options.invitation));
        setTimeout(() => {
          this.showInvitation(inviter);
        }, 1000);
      } catch (e) {
        console.error('解析邀请参数失败', e);
      }
    }
    
    // 清理可能存在的旧邀请
    this.cleanupOldInvitations();
  },
  mounted() {
    // 监听棋盘准备好的事件
    this.$on('board-ready', this.handleBoardReady);
    
    // 监听兵升变事件
    this.$on('promotion-move', this.handlePromotion);
    
    // 初始化邀请监听器
    // this.simulateInvitationListener(); // 已移除模拟方法
    
    // 监控棋盘数据变化
    this.$watch('chessboard', (newBoard, oldBoard) => {
      console.log('棋盘数据已变化，新棋盘中的棋子数量:');
      let count = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (newBoard[i][j] !== null) {
            count++;
          }
        }
      }
      console.log(`棋盘上有${count}个棋子`);
    }, { deep: true });
  },
  onReady() {
    //console.log('页面就绪，启动邀请轮询');
    
    // 清理旧邀请并启动轮询
    this.cleanupOldInvitations().then(() => {
      // 启动轮询邀请的定时器
      this.startPollingInvitations();
    });
  },
  beforeDestroy() {
    // 移除事件监听
    this.$off('board-ready');
    this.$off('promotion-move');
    
    // 停止轮询
    this.stopPollingInvitations();
    // this.stopPollingGameMoves(); // 将通过WebSocket处理行棋
    
    // 关闭WebSocket连接
    this.disconnectWebSocketInternal();
  },
  methods: {
    // 格式化时间显示
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    },
    
    // 处理底部导航栏的标签变化
    handleTabChange(tab) {
      console.log('导航到', tab);
      // 如有需要可以在这里添加其他逻辑
    },
    
    // 切换标签页
    switchTab(tab) {
      this.activeTab = tab;
    },
    
    // 切换显示更多选项
    toggleMoreOptions() {
      this.showMoreOptions = !this.showMoreOptions;
    },
    
    // 开始游戏
    startGame(opponent) {
      this.gameStarted = true;
      this.matching = true;
      
      // 重置棋盘到初始状态
      this.resetBoard();
      
      // 如果有选中的对手，直接显示对手信息
      if (opponent) {
        this.opponentName = opponent.userName || '等待对手加入';
        this.opponentAvatar = opponent.avatar || '/static/images/match/avatar-default.png';
        
        // 这里可以使用选中的对手ID进行实际匹配
        console.log('选中的对手信息:', opponent);
        
        // 模拟后端返回匹配结果
        setTimeout(() => {
          // 匹配成功，获取执棋方
          this.matching = false;
          
          // 假设接口返回的执棋方信息
          const matchResult = {
            success: true,
            playerColor: Math.random() < 0.5 ? 'white' : 'black', // 随机分配颜色
            opponentName: opponent.userName, 
            opponentRating: opponent.rating || 0
          };
          
          if (matchResult.success) {
            // 设置玩家执棋方
            this.playAs = matchResult.playerColor;
            
            // 更新对手信息
            this.opponentName = matchResult.opponentName;
            
            // 切换到对战标签
            this.activeTab = 'match';
            
            // 按规则白方先行，开始白方计时
            this.startWhiteTimer();
            
            uni.showToast({
              title: `匹配成功，您执${this.playAs === 'white' ? '白' : '黑'}子`,
              icon: 'none'
            });
          }
        }, 2000); // 模拟网络延迟
      } else {
      // 匹配开始时，显示等待对手加入
      this.opponentName = '等待对手加入';
      
      // 这里应该调用后端接口进行匹配，获取执棋方信息
      // 模拟后端返回匹配结果
      setTimeout(() => {
        // 模拟匹配成功，获取执棋方
        this.matching = false;
        
        // 假设接口返回的执棋方信息
        const matchResult = {
          success: true,
          playerColor: Math.random() < 0.5 ? 'white' : 'black', // 随机分配颜色
          opponentName: 'DIVAN90JAKKELD', // 从后端获取对手名称
          opponentRating: 2503
        };
        
        if (matchResult.success) {
          // 设置玩家执棋方
          this.playAs = matchResult.playerColor;
          
          // 更新对手信息
          this.opponentName = matchResult.opponentName;
          
          // 切换到对战标签
          this.activeTab = 'match';
          
          // 按规则白方先行，开始白方计时
          this.startWhiteTimer();
          
          uni.showToast({
            title: `匹配成功，您执${this.playAs === 'white' ? '白' : '黑'}子`,
            icon: 'none'
          });
        }
      }, 2000); // 模拟网络延迟
      }
    },
    
    // 重置棋盘
    resetBoard() {
      this.chessboard = getInitialChessboard();
      this.currentPlayer = 'white'; // 游戏总是从白方开始
      this.selectedPosition = null;
      this.validMoves = [];
      this.moveHistory = [];
      this.formattedMoveHistory = [];
      this.lastMove = null;
      this.gameResult = null;
      this.isCheckmated = false;
      this.checkmateColor = '';
      
      // 重置对手名称为等待状态
      if (!this.matching && !this.gameStarted) {
        this.opponentName = '等待对手加入';
      }
      
      // 重置计时器
      this.playerTimeRemaining = 600; // 10分钟
      this.opponentTimeRemaining = 600;
      this.stopAllTimers();
    },
    
    // 停止所有计时器
    stopAllTimers() {
      if (this.playerTimer) {
        clearInterval(this.playerTimer);
        this.playerTimer = null;
      }
      if (this.opponentTimer) {
        clearInterval(this.opponentTimer);
        this.opponentTimer = null;
      }
    },
    
    // 启动白方计时器
    startWhiteTimer() {
      this.moveStartTime = new Date();
      this.stopAllTimers();
      
      // 根据玩家执棋方启动相应计时器
      if (this.playAs === 'white') {
        this.startPlayerTimer();
      } else {
        this.startOpponentTimer();
      }
    },
    
    // 启动黑方计时器
    startBlackTimer() {
      this.moveStartTime = new Date();
      this.stopAllTimers();
      
      // 根据玩家执棋方启动相应计时器
      if (this.playAs === 'black') {
        this.startPlayerTimer();
      } else {
        this.startOpponentTimer();
      }
    },
    
    // 启动玩家计时器
    startPlayerTimer() {
      this.stopAllTimers();
      this.playerTimer = setInterval(() => {
        if (this.playerTimeRemaining > 0) {
          this.playerTimeRemaining--;
        } else {
          // 时间耗尽，判负
          this.handleTimeout('player');
        }
      }, 1000);
    },
    
    // 启动对手计时器
    startOpponentTimer() {
      this.stopAllTimers();
      this.opponentTimer = setInterval(() => {
        if (this.opponentTimeRemaining > 0) {
          this.opponentTimeRemaining--;
        } else {
          // 时间耗尽，判负
          this.handleTimeout('opponent');
        }
      }, 1000);
    },
    
    // 处理超时
    handleTimeout(player) {
      this.stopAllTimers();
      
      // 设置游戏结果
      if (player === 'player') {
        this.gameResult = `${this.opponentName} 胜出（超时）`;
      } else {
        this.gameResult = `${this.playerName} 胜出（超时）`;
      }
      
      // 处理游戏结束
      this.handleGameEnd(player === 'player' ? 'defeat' : 'victory');
    },
    
    // 计算用时
    calculateTimeSpent() {
      if (!this.moveStartTime) return '0.0s';
      const timeSpent = (new Date() - this.moveStartTime) / 1000;
      return timeSpent.toFixed(1) + 's';
    },
    
    // 开始游戏并显示对战Tab
    startMatchAndShowTab() {
      this.gameStarted = true;
      this.matching = false; // 直接进入对战状态，不显示匹配中
      
      // 模拟随机分配玩家执棋方
      this.playAs = Math.random() < 0.5 ? 'white' : 'black';
      
      // 模拟对手信息
      this.opponentName = 'DIVAN90JAKKELD';
      
      // 重置棋盘
      this.resetBoard();
      
      // 切换到对战标签
      this.activeTab = 'match';
      
      // 构造初始化游戏请求参数
      const holdChess = this.playAs === 'white' ? 2 : 1; // 1:黑 深色，2:白 浅色
      
      const gameInitData = {
        userId: this.currentUserId,
        userAccount: this.currentUserAccount,
        holdChess: holdChess
      };
      
      // 调用游戏初始化API
      initGame(gameInitData).then(res => {
        console.log('游戏初始化结果:', res);
        if (res.success && res.result) {
          // 保存游戏ID
          this.currentGameId = res.result.id || res.result;
          console.log('游戏已初始化，ID:', this.currentGameId);
          
          // 进入游戏
          enterGame().then(enterRes => {
            console.log('进入游戏结果:', enterRes);
            if (enterRes.success) {
              console.log('成功进入游戏');
              
              // 白子先行
              this.currentPlayer = 'white';
              this.startWhiteTimer();
              
              uni.showToast({
                title: `对战已开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
                icon: 'none'
              });
              
              // 如果是黑方，开始轮询对方行棋 - 改为WebSocket后，此处不再需要轮询
              // if (this.playAs === 'black') {
              //   this.startPollingGameMoves();
              // }
              
              // 初始化WebSocket连接
              if (this.currentGameId) {
                this.initWebSocket(this.currentGameId);
              }
            } else {
              uni.showToast({
                title: enterRes.message || '进入游戏失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error('进入游戏失败', err);
            uni.showToast({
              title: '进入游戏失败，请重试',
              icon: 'none'
            });
          });
        } else {
          uni.showToast({
            title: res.message || '游戏初始化失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('游戏初始化失败', err);
        uni.showToast({
          title: '游戏初始化失败，请重试',
          icon: 'none'
        });
      });
    },
    
    // 记录走棋历史
    recordMoveHistory(from, to, piece, captured) {
      const pieceType = getPieceType(piece);
      const pieceColor = getPieceColor(piece);
      
      // 计算代数记谱法表示
      const notation = this.calculateNotation(from, to, piece, captured);
      
      // 计算用时
      const timeSpent = this.calculateTimeSpent();
      
      // 更新格式化的历史记录
      if (pieceColor === 'white') {
        this.formattedMoveHistory.push({
          moveNumber: this.formattedMoveHistory.length + 1,
          white: {
            notation: notation,
            time: timeSpent,
            piece: piece
          },
          black: null
        });
      } else {
        const lastMove = this.formattedMoveHistory[this.formattedMoveHistory.length - 1];
        lastMove.black = {
          notation: notation,
          time: timeSpent,
          piece: piece
        };
      }
      
      // 限制只显示最近的8步记录
      if (this.formattedMoveHistory.length > 8) {
        this.formattedMoveHistory = this.formattedMoveHistory.slice(-8);
      }
    },
    
    // 计算代数记谱法
    calculateNotation(from, to, piece, captured) {
      return calculateAlgebraicNotation(from, to, piece, this.chessboard, captured);
    },
    
    /**
     * 处理用户走棋（前端全权处理所有规则和特殊走法，组装完整消息体）
     */
    movePiece(fromPos, toPos, promoteTo = null) {
      // 游戏状态校验
      if (!this.gameStarted || this.gameResult || this.isCheckmated ||
          (this.playAs === 'white' && this.currentPlayer !== 'white') ||
          (this.playAs === 'black' && this.currentPlayer !== 'black')) {
        console.log('无法走棋: 游戏未开始/已结束，或者不是您的回合');
        return false;
      }
      if (typeof fromPos !== 'string' || typeof toPos !== 'string') {
        console.error('无效的棋子位置格式:', fromPos, toPos);
        return false;
      }
      // 坐标转换
      const fromCol = this.columns.indexOf(fromPos[0].toLowerCase());
      const fromRow = 8 - parseInt(fromPos[1]);
      const toCol = this.columns.indexOf(toPos[0].toLowerCase());
      const toRow = 8 - parseInt(toPos[1]);
      if (fromCol === -1 || toCol === -1 || fromRow < 0 || fromRow > 7 || toRow < 0 || toRow > 7) {
        console.error('无效的棋子位置:', fromPos, toPos);
        return false;
      }
      // 获取棋子
      const piece = this.chessboard[fromRow][fromCol];
      if (!piece) {
        console.error('起始位置没有棋子:', fromPos);
        return false;
      }
      const pieceColor = piece.split('-')[0];
      if ((this.playAs === 'white' && pieceColor !== 'white') ||
          (this.playAs === 'black' && pieceColor !== 'black')) {
        console.error('无法移动对手的棋子');
        return false;
      }
      // 生成棋子唯一ID
      const chessPiecesId = this.getChessPieceUniqueId(fromRow, fromCol, piece);
      const piecesType = pieceColor === 'black' ? 1 : 2;
      // 记录被吃棋子ID和过路兵信息
      let tookPiecesId = null;
      let capturedPiece = null;
      let isEnPassant = false;
      let enPassantCapturedPos = null;
      
      // 判断是否吃子（包括吃过路兵）
      if (this.chessboard[toRow][toCol]) {
        capturedPiece = this.chessboard[toRow][toCol];
        tookPiecesId = this.getChessPieceUniqueId(toRow, toCol, capturedPiece);
      } else if (this.isEnPassantMove(piece, fromRow, fromCol, toRow, toCol)) {
        // 吃过路兵
        isEnPassant = true;
        const capturedRow = fromRow;
        const capturedCol = toCol;
        enPassantCapturedPos = { row: capturedRow, col: capturedCol };
        capturedPiece = this.chessboard[capturedRow][capturedCol];
        tookPiecesId = this.getChessPieceUniqueId(capturedRow, capturedCol, capturedPiece);
        
        // 立即从棋盘上移除被吃的兵
        this.chessboard[capturedRow][capturedCol] = null;
        console.log(`过路兵操作：移除位置(${capturedRow},${capturedCol})的棋子 ${capturedPiece}`);
      }
      // 判断升变
      let promotionPieceType = null;
      let isPromotion = false;
      if (promoteTo) {
        promotionPieceType = promoteTo.toUpperCase();
        isPromotion = true;
        this.chessboard[toRow][toCol] = `${pieceColor}-${promoteTo.toLowerCase()}`;
      } else {
        // 检查是否兵到底线自动升变
        if (piece.endsWith('pawn') && ((pieceColor === 'white' && toRow === 0) || (pieceColor === 'black' && toRow === 7))) {
          promotionPieceType = 'Q';
          isPromotion = true;
          this.chessboard[toRow][toCol] = `${pieceColor}-queen`;
        } else {
          this.chessboard[toRow][toCol] = piece;
        }
      }
      this.chessboard[fromRow][fromCol] = null;
      // 处理王车易位
      let isCastling = false;
      if (piece.endsWith('king') && Math.abs(fromCol - toCol) === 2) {
        isCastling = true;
        // 短易位
        if (toCol === 6) {
          // 右侧车移到王左边
          this.chessboard[fromRow][5] = this.chessboard[fromRow][7];
          this.chessboard[fromRow][7] = null;
        } else if (toCol === 2) {
          // 长易位
          this.chessboard[fromRow][3] = this.chessboard[fromRow][0];
          this.chessboard[fromRow][0] = null;
        }
      }
      // 步数与用时
      if (!this.moveSequence) this.moveSequence = 1;
      else this.moveSequence++;
      const moveDurationSeconds = this.calculateTimeSpentSeconds();
      // 组装完整消息体
      const moveRequest = {
        chessGameId: String(this.currentGameId),
        gameId: String(this.currentGameId), // 兼容
        userId: String(this.currentUserId),
        chessPiecesId,
        piecesType,
        fromPositionX: fromPos[0].toLowerCase(),
        fromPositionY: fromPos[1],
        toPositionX: toPos[0].toLowerCase(),
        toPositionY: toPos[1],
        fromPosition: fromPos,
        toPosition: toPos,
        promotionPieceType,
        moveSequence: this.moveSequence,
        moveDurationSeconds,
        tookPiecesId,
        type: 'MOVE',
        isCastling,
        isPromotion,
        isEnPassant, // 新增：标识是否为过路兵
        enPassantCapturedPos, // 新增：被吃掉的兵的位置
      };
      // 发送WebSocket
      if (this.webSocketService.stompClient && this.currentGameId) {
        try {
          // 如果是过路兵，打印详细信息
          if (isEnPassant) {
            console.log('发送过路兵移动到后端:', {
              isEnPassant,
              enPassantCapturedPos,
              tookPiecesId,
              capturedPiece
            });
          }
          
          sendMessage('/app/movepieces', moveRequest);
          this.playChessSound && this.playChessSound(capturedPiece ? 'capture' : 'move');
        } catch (error) {
          console.error('发送走棋消息失败:', error);
          uni.showToast({ title: '走棋失败，请重试', icon: 'none' });
          return false;
        }
      } else {
        console.error('WebSocket客户端未初始化或缺少游戏ID，无法发送走棋消息');
        uni.showToast({ title: '网络连接中断，请重新连接', icon: 'none' });
        return false;
      }
      // 切换回合
      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
      // 记录历史
      this.recordMoveHistory({ row: fromRow, col: fromCol }, { row: toRow, col: toCol }, piece, capturedPiece);
      // 检查结局
      this.checkGameOutcome();
      return true;
    },
    // 生成棋子唯一ID（建议每个棋子初始化时就有唯一ID，或用位置+类型拼接）
    getChessPieceUniqueId(row, col, piece) {
      if (!piece) return '';
      // 尽量保证唯一性：颜色-类型-行-列
      return `${piece}-${row}-${col}`;
    },
    // 判断是否吃过路兵
    isEnPassantMove(piece, fromRow, fromCol, toRow, toCol) {
      if (!piece || !piece.endsWith('pawn')) return false;
      // 只对兵有效，且目标格为空，且横向移动
      if (Math.abs(fromCol - toCol) === 1 && this.chessboard[toRow][toCol] === null) {
        // 白兵在5行，黑兵在4行
        if ((piece.startsWith('white') && fromRow === 3 && toRow === 2) ||
            (piece.startsWith('black') && fromRow === 4 && toRow === 5)) {
          return true;
        }
      }
      return false;
    },
    // 计算用时
    calculateTimeSpentSeconds() {
      if (!this.moveStartTime) return 0;
      // 返回精确到小数点后1位的秒数
      const timeSpent = (new Date() - this.moveStartTime) / 1000;
      return Math.round(timeSpent * 10) / 10;
    },
    
    // 播放棋子声音 (如果方法不存在，添加此方法)
    playChessSound(soundType) {
      // 检查是否有音效系统
      if (!this.chessAudio) {
        // 创建音频实例
        this.chessAudio = {};
      }
      
      let audioSrc = '';
      switch(soundType) {
        case 'move':
          audioSrc = '/static/audio/move.mp3';
          break;
        case 'capture':
          audioSrc = '/static/audio/capture.mp3';
          break;
        case 'check':
          audioSrc = '/static/audio/check.mp3';
          break;
        default:
          audioSrc = '/static/audio/move.mp3';
      }
      
      try {
        // 使用uniapp的音频API
        const audio = uni.createInnerAudioContext();
        audio.src = audioSrc;
        audio.play();
        
        // 播放完自动释放
        audio.onEnded(() => {
          audio.destroy();
        });
      } catch (e) {
        console.warn('播放音效失败:', e);
      }
    },
    
    // 检查游戏结局
    checkGameOutcome() {
      // 检查将军、将杀、逼和等
      const isCheck = isKingInCheck(this.chessboard, this.currentPlayer);
      
      if (isCheck) {
        // 检查是否有合法移动
        const hasLegalMove = this.hasAnyLegalMove();
        
        if (!hasLegalMove) {
          // 将杀
          this.handleCheckmate();
        } else {
          // 将军
          this.handleCheck();
        }
      } else {
        // 检查是否为逼和
        const hasLegalMove = this.hasAnyLegalMove();
        if (!hasLegalMove) {
          // 逼和
          this.handleStalemate();
        }
      }
    },
    
    // 检查当前玩家是否有任何合法移动
    hasAnyLegalMove() {
      // 遍历所有棋子，检查是否有合法移动
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.chessboard[row][col];
          if (piece && getPieceColor(piece) === this.currentPlayer) {
            const moves = getValidMoves(this.chessboard, row, col);
            if (moves.length > 0) {
              return true;
            }
          }
        }
      }
      return false;
    },
    
    // 处理将军情况
    handleCheck() {
      uni.showToast({
        title: '将军！',
        icon: 'none'
      });
    },
    
    // 处理将杀情况
    handleCheckmate() {
      this.stopAllTimers();
      // this.stopPollingGameMoves(); // 停止轮询行棋 - WebSocket会处理
      
      // 当前玩家（失败者）的颜色
      const loserColor = this.currentPlayer;
      
      // 获取胜利者颜色
      const winnerColor = loserColor === 'white' ? 'black' : 'white';
      
      // 确定玩家是否胜利
      const isPlayerWinner = winnerColor === this.playAs;
      
      // 设置结果消息
      this.gameResult = isPlayerWinner ? `${this.playerName} 胜出（将杀）` : `${this.opponentName} 胜出（将杀）`;
      
      // 记录将杀状态
      this.isCheckmated = true;
      this.checkmateColor = loserColor;
      
      // 设置游戏结束状态
      this.gameEnded = true;
      
      // 使用玩家视角显示将杀特效
      if (this.$refs.chessBoard) {
        this.$refs.chessBoard.showCheckmate(true, this.checkmateColor);
      }
      
      // 更新游戏状态
      this.updateGameStatusToServer(isPlayerWinner ? 1 : 2); // 1:胜，2:负
      
      // 处理游戏结束
      this.handleGameEnd(isPlayerWinner ? 'victory' : 'defeat');
    },
    
    // 处理逼和情况
    handleStalemate() {
      this.stopAllTimers();
      // this.stopPollingGameMoves(); // 停止轮询行棋 - WebSocket会处理
      
      this.gameResult = '和棋（逼和）';
      
      // 更新游戏状态
      this.updateGameStatusToServer(3); // 3:和
      
      // 处理游戏结束
      this.handleGameEnd('draw');
    },
    
    // 取消匹配
    cancelMatching() {
      this.gameStarted = false;
      this.matching = false;
      
      uni.showToast({
        title: '已取消匹配',
        icon: 'none'
      });
    },
    
    // 返回首页
    backToHome() {
      uni.switchTab({
        url: '/pages/index'
      });
    },
    
    // 选择游戏模式
    selectMode(mode) {
      this.gameMode = mode;
    },
    
    // 选择时间控制
    selectTime(time) {
      this.timeControl = time;
    },
    
    // 选择执子颜色
    selectPlayAs(color) {
      this.playAs = color;
    },
    
    // 与好友一起玩
    playWithFriend() {
      // 显示好友对战界面
      // 已通过NewGameTab内的showFriendsTab控制显示界面
      // 不需要做额外操作
    },
    
    // 处理邀请好友
    inviteFriend(user, inviteInfo) {
      // 邀请好友
      
      // 更新对手信息
      this.opponentName = user.name || user.userName || user.username;
      this.opponentAvatar = user.avatar || '/static/images/match/avatar-default.png';
      this.selectedOpponent = user;
      
      // 存储邀请的其他信息，如执棋颜色等
      this.currentInviteInfo = inviteInfo;
      
      // 获取当前用户ID
      if (!this.currentUserId) {
        uni.showToast({
          title: '用户未登录，无法发送邀请',
          icon: 'none'
        });
        return;
      }
      
      // 构造邀请数据
      const inviteData = {
        sourceUserId: this.currentUserId,
        sourceUserAccount: this.currentUserAccount,
        sourceOnePart: inviteInfo.playAs === 'white' ? 2 : 1, // 1:黑色，2:白色
        acceptUserId: user.id,
        acceptUserAccount: user.userName || user.username || user.name,
        acceptOnePart: inviteInfo.playAs === 'white' ? 1 : 2, // 对手执棋颜色相反
        timeControl: inviteInfo.timeControl || this.timeControl,
        timestamp: new Date().getTime() // 添加时间戳避免重复
      };
      
      // 先清理旧的邀请，再发送新邀请
      clearPendingInvitations(this.currentUserId).then(() => {
        // 调用添加对弈关系API
        return addChessFriendPair(inviteData);
      }).then(res => {
        if (res.success) {
      // 显示匹配中状态
      this.matching = true;
      
          // 从响应中提取邀请ID - 优先使用对象中的id属性
          let inviteId = null;
          
          if (res.result && typeof res.result === 'object' && res.result.id) {
            // 如果result是对象且包含id属性
            inviteId = res.result.id;
            // 从result对象中获取inviteId
          } else if (typeof res.result === 'string' && res.result.match(/^[0-9]+$/)) {
            // 如果result是纯数字字符串
            inviteId = res.result;
            // 从result字符串中获取inviteId
          } else {
            // 无法获取有效ID，尝试查询最新邀请
            console.error('无法从响应中获取有效的邀请ID:', res.result);
      uni.showToast({
              title: '邀请已发送，但无法获取邀请ID',
        icon: 'none'
      });
            this.matching = false;
            return;
          }
          
          this.pendingInviteId = inviteId;
          // 当前邀请ID已设置
          
          // 保存当前执棋颜色设置，供后续使用
          this.playAs = inviteInfo.playAs;
          
          uni.showToast({
            title: `邀请已发送给 ${user.name || user.userName || user.username}`,
            icon: 'none'
          });
          
          // 开始显示匹配中状态
          this.showMatchingStatus();
          
          // 可以启动轮询查询，确认对方是否接受了邀请
          this.startPollingInviteStatus(inviteId);
        } else {
          uni.showToast({
            title: res.message || '邀请发送失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('发送邀请失败', err);
        uni.showToast({
          title: '邀请发送失败，请稍后重试',
          icon: 'none'
        });
      });
    },
    
    // 显示匹配中状态
    showMatchingStatus() {
      // 切换到新游戏标签
      this.activeTab = 'newGame';
      
      // 显示匹配中状态
      this.gameStarted = true;
      this.matching = true;
      
      // 显示等待信息
      uni.showLoading({
        title: '等待对方接受邀请...',
        mask: true
      });
    },
    
    // 启动轮询邀请状态
    startPollingInviteStatus(inviteId) {
      if (!inviteId) return;
      
      // 确保ID是有效的数字字符串
      if (typeof inviteId !== 'string' || !inviteId.match(/^[0-9]+$/)) {
        console.error('无效的邀请ID格式:', inviteId);
        return;
      }
      
      // 保存邀请ID
      this.pendingInviteId = inviteId;
      
      // 清除可能的现有定时器
      if (this.inviteStatusTimer) {
        clearInterval(this.inviteStatusTimer);
      }
      
      // 每3秒查询一次邀请状态
      this.inviteStatusTimer = setInterval(() => {
        if (!this.currentUserId) {
          console.error('缺少当前用户ID，无法查询邀请状态');
          return;
        }
        
        // 查询邀请方和接收方之间的邀请状态
        // 获取接收方ID和当前用户ID
        const acceptUserId = this.selectedOpponent?.id;
        
        if (!acceptUserId) {
          console.error('缺少接收方ID，无法查询邀请状态');
          return;
        }
        
        // 调用修改后的getInvitationStatus API
        getInvitationStatus(this.currentUserId, acceptUserId).then(res => {
          console.log('获取邀请状态结果:', res);
          if (res.success && res.result) {
            // 添加2秒延迟后再获取游戏ID
            setTimeout(() => {
              this.getGameIdFromInvitation(res.result.inviteId);
            }, 3000);
            const invite = res.result;
            
            // 检查邀请状态 - 1或2都表示已接受，需要进入游戏
            if (invite.status === 1 || invite.status === 2) {
              // 对方接受了邀请，发起方直接进入游戏
              this.stopPollingInviteStatus();
              uni.hideLoading();
              
              this.matching = false;
              this.gameStarted = true;
              
              // 设置执棋颜色 - 使用之前设置的颜色
              // 重置棋盘
              this.resetBoard();
              
              // 切换到对战标签
              this.activeTab = 'match';
              
              // 更新对手信息
              if (invite.acceptUserInfo) {
                this.opponentName = invite.acceptUserInfo.realname || invite.acceptUserInfo.username || '对手';
                this.opponentAvatar = invite.acceptUserInfo.avatar || '/static/images/match/avatar-default.png';
              }
              
              // 新增：根据邀请ID获取游戏ID
              this.getGameIdFromInvitation(this.pendingInviteId).then(gameId => {
                if (gameId) {
                  console.log('已从邀请获取游戏ID:', gameId);
                  this.currentGameId = gameId;
              
              // 发起方直接进入游戏 - 游戏已由接收方初始化
              enterGame().then(enterRes => {
                console.log('发起方进入游戏结果:', enterRes);
                if (enterRes.success) {
                  console.log('发起方成功进入游戏');
                  
                  // 开始计时
                  this.startWhiteTimer();
                  
                      // 初始化WebSocket连接
                      this.initWebSocket(this.currentGameId);
                  
                  uni.showToast({
                    title: `对局已开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
                    icon: 'success'
                  });
                } else {
                  uni.showToast({
                    title: enterRes.message || '进入游戏失败',
                    icon: 'none'
                  });
                }
              }).catch(err => {
                console.error('进入游戏失败', err);
                uni.showToast({
                  title: '进入游戏失败，请重试',
                  icon: 'none'
                });
                  });
                } else {
                  console.error('无法获取游戏ID，无法建立WebSocket连接');
                  uni.showToast({
                    title: '无法建立实时连接，请重试',
                    icon: 'none'
                  });
                }
              });
            } else if (invite.status === 3) {
              // 对方拒绝了邀请
              this.stopPollingInviteStatus();
              uni.hideLoading();
              
              this.matching = false;
              this.gameStarted = false;
              
              uni.showToast({
                title: '对方拒绝了您的邀请',
                icon: 'none'
              });
            }
            // 其他状态继续等待
          }
        }).catch(err => {
          console.error('查询邀请状态失败', err);
          
          // 兼容旧方式 - 如果上面的方法失败，尝试使用list查询
          const params = { id: inviteId };
          listChessFriendPair(params).then(res => {
            if (res.success && res.result && res.result.records && res.result.records.length > 0) {
              const invite = res.result.records[0];
              
              // 检查邀请状态
              // 假设状态: 0-待处理, 1-已接受, 2-已拒绝
              if (invite.inviteStatus === 1) {
                // 对方接受了邀请，发起方直接进入游戏
                this.stopPollingInviteStatus();
                uni.hideLoading();
                
                this.matching = false;
                this.gameStarted = true;
                
                // 设置执棋颜色
                this.playAs = invite.sourceOnePart === 2 ? 'white' : 'black';
                
                // 重置棋盘
                this.resetBoard();
                
                // 切换到对战标签
                this.activeTab = 'match';
                
                // 发起方直接进入游戏 - 游戏已由接收方初始化
                enterGame().then(enterRes => {
                  console.log('发起方进入游戏结果:', enterRes);
                  if (enterRes.success) {
                    console.log('发起方成功进入游戏');
                    
                    // 开始计时
                    this.startWhiteTimer();
                    
                    // 如果是黑方，开始轮询对方行棋 - 改为WebSocket后，此处不再需要轮询
                    // if (this.playAs === 'black') {
                    //   this.startPollingGameMoves();
                    // }
                    
                    // 初始化WebSocket连接
                    if (this.currentGameId) {
                      this.initWebSocket(this.currentGameId);
                    }
                    
                    uni.showToast({
                      title: `对局已开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
                      icon: 'success'
                    });
                  } else {
                    uni.showToast({
                      title: enterRes.message || '进入游戏失败',
                      icon: 'none'
                    });
                  }
                }).catch(err => {
                  console.error('进入游戏失败', err);
                  uni.showToast({
                    title: '进入游戏失败，请重试',
                    icon: 'none'
                  });
                });
              } else if (invite.inviteStatus === 2) {
                // 对方拒绝了邀请
                this.stopPollingInviteStatus();
                uni.hideLoading();
                
                this.matching = false;
                this.gameStarted = false;
                
                uni.showToast({
                  title: '对方拒绝了您的邀请',
                  icon: 'none'
                });
              }
              // 其他状态继续等待
            }
          });
        });
      }, 3000);
    },
    
    // 停止轮询邀请状态
    stopPollingInviteStatus() {
      if (this.inviteStatusTimer) {
        clearInterval(this.inviteStatusTimer);
        this.inviteStatusTimer = null;
      }
      
      if (this.inviteTimeoutTimer) {
        clearTimeout(this.inviteTimeoutTimer);
        this.inviteTimeoutTimer = null;
      }
    },
    
    // 处理接受邀请
    handleAcceptInvitation(inviter) {
      console.log('接受邀请:', inviter);
      
      // 调用接受邀请API
      respondInvitation(inviter.inviteId, 1).then(res => {
        if (res.success) {
          // 更新对手信息
          this.opponentName = inviter.name || inviter.sourceUserAccount || '对手';
          this.opponentAvatar = inviter.avatar || '/static/images/match/avatar-default.png';
          if (inviter.timeControl) {
            this.timeControl = inviter.timeControl;
          }
          
          // 设置执棋颜色 - 根据acceptOnePart确定
          if (inviter.acceptOnePart === 1) { // 1表示黑色
            this.playAs = 'black';
          } else if (inviter.acceptOnePart === 2) { // 2表示白色
            this.playAs = 'white';
          } else if (inviter.playAs === 'white') { // 如果邀请者执白，您执黑
            this.playAs = 'black';
          } else if (inviter.playAs === 'black') { // 如果邀请者执黑，您执白
            this.playAs = 'white';
          } else {
            // 默认随机
            this.playAs = Math.random() < 0.5 ? 'white' : 'black';
          }
          
          // 重置棋盘、开始游戏
          this.resetBoard();
          this.gameStarted = true;
          this.matching = false;
          this.gameResult = null;
          this.isCheckmated = false;
          this.checkmateColor = '';
          
          // 切换到对战标签
          this.activeTab = 'match';
          
          // 作为接收方，初始化游戏
          // 构造初始化游戏请求参数
          const holdChess = this.playAs === 'white' ? 2 : 1; // 1:黑 深色，2:白 浅色
          
          const gameInitData = {
            userId: inviter.id || inviter.sourceUserId,
            userAccount: inviter.name || inviter.sourceUserAccount,
            holdChess: inviter.sourceOnePart || holdChess,
            sourceInviteId: inviter.inviteId,
            sourceUserId: inviter.id || inviter.sourceUserId
          };
          
          // 调用游戏初始化API - 接收方初始化后不需要再调用enter
          initGame(gameInitData).then(initRes => {
            console.log('游戏初始化结果:', initRes);
            if (initRes.success && initRes.result) {
              // 保存游戏ID - 更健壮的提取方式
              let extractedGameId = null;
              if (initRes.result && typeof initRes.result === 'object' && initRes.result.gameId) { // 检查 initRes.result.gameId
                extractedGameId = String(initRes.result.gameId); // 从 initRes.result.gameId 提取
              } else if (initRes.result && typeof initRes.result === 'string') {
                // 如果initRes.result本身就是ID字符串
                extractedGameId = initRes.result;
              }
              this.currentGameId = extractedGameId;
              console.log('接收方成功初始化游戏，ID:', this.currentGameId);
              
              // 开始计时
              this.startWhiteTimer();
              
              // 初始化WebSocket连接
              if (this.currentGameId) {
                const gameIdStr = this.currentGameId; // currentGameId 已经是字符串或null
                this.initWebSocket(gameIdStr);
                
                // 发送一个GAME_START事件到WebSocket以通知发起方
                const destination = `/app/game/start/${gameIdStr}`;
                sendMessage(destination, {
                  gameId: gameIdStr,
                  userId: this.currentUserId,
                  playerName: this.playerName,
                  playerColor: this.playAs
                });

                uni.showToast({
                  title: `对局已开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
                  icon: 'success'
                });
              } else {
                // 如果无法获取有效的gameId
                console.error('接收方未能从 initGame 响应中获取有效的游戏ID:', initRes.result);
                uni.showToast({
                  title: '游戏创建失败，无法获取ID',
                  icon: 'none'
                });
              }
            } else {
              uni.showToast({
                title: initRes.message || '游戏初始化失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error('游戏初始化失败', err);
            uni.showToast({
              title: '游戏初始化失败，请重试',
              icon: 'none'
            });
          });
        } else {
          uni.showToast({
            title: res.message || '接受邀请失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('接受邀请失败', err);
        uni.showToast({
          title: '接受邀请失败，请稍后重试',
          icon: 'none'
        });
      });
    },
    
    // 初始化游戏
    initializeGame(opponentId) {
      // 构造初始化游戏请求参数
      const holdChess = this.playAs === 'white' ? 2 : 1; // 1:黑 深色，2:白 浅色
      
      const gameInitData = {
        userId: this.currentUserId,
        userAccount: this.currentUserAccount,
        holdChess: holdChess
      };
      
      // 调用游戏初始化API
      initGame(gameInitData).then(res => {
        console.log('游戏初始化结果:', res);
        if (res.success && res.result) {
          // 保存游戏ID
          this.currentGameId = res.result.id || res.result;
          console.log('游戏已初始化，ID:', this.currentGameId);
      
      // 进入游戏
      enterGame().then(enterRes => {
        console.log('进入游戏结果:', enterRes);
        if (enterRes.success) {
          console.log('成功进入游戏');
          
          // 开始计时
          this.startWhiteTimer();
          
          // 如果是黑方，开始轮询对方行棋 - 改为WebSocket后，此处不再需要轮询
          // if (this.playAs === 'black') {
          //   this.startPollingGameMoves();
          // }
          
          // 初始化WebSocket连接
          if (this.currentGameId) {
            this.initWebSocket(this.currentGameId);
          }
        } else {
          uni.showToast({
            title: enterRes.message || '进入游戏失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('进入游戏失败', err);
        uni.showToast({
          title: '进入游戏失败，请重试',
          icon: 'none'
        });
      });
        } else {
      uni.showToast({
            title: res.message || '游戏初始化失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('游戏初始化失败', err);
        uni.showToast({
          title: '游戏初始化失败，请重试',
          icon: 'none'
        });
      });
    },
    
    // 应用对方行棋到棋盘
    applyOpponentMove(moveData) {
      // 解析行棋数据
      const fromRow = 8 - parseInt(moveData.fromPositionY);
      const fromCol = this.columns.indexOf(moveData.fromPositionX.toLowerCase());
      const toRow = 8 - parseInt(moveData.toPositionY);
      const toCol = this.columns.indexOf(moveData.toPositionX.toLowerCase());
      
      // 检查位置是否有效
      if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
          toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
        console.error('行棋位置无效:', moveData);
        return;
      }
      
      console.log('应用对方行棋:', 
        `从 ${moveData.fromPositionX}${moveData.fromPositionY} 到 ${moveData.toPositionX}${moveData.toPositionY}`);
      
      // 执行移动
      this.movePiece(fromRow, fromCol, toRow, toCol);
    },
    
    // 发送行棋到服务器
    sendMoveToServer(fromRow, fromCol, toRow, toCol, pieceMoved, moveInfo = {}) {
      // 转换位置格式
      const fromX = this.columns[fromCol]; // a-h
      const fromY = 8 - fromRow; // 1-8
      const toX = this.columns[toCol]; // a-h
      const toY = 8 - toRow; // 1-8
      
      // 构造行棋数据 - 结构需与后端 /app/movepieces (或/app/game/move/{gameId}) 期望的一致
      // 参考 websocket业务流程.md, 可能需要 ChatChessMoveRequestVO 结构
      // ChatChessMoveRequestVO: { gameId, userId, fromPosition, toPosition, promotionPieceType }
      // 当前的 moveDataPayload 更像 ChessGameRecord (用于HTTP API)
      // 我们先发送一个更接近 ChatChessMoveRequestVO 的简化结构，您需要和后端确认
      
      const clientMovePayload = {
        gameId: this.currentGameId,
        userId: this.currentUserId,
        fromPosition: `${fromX}${fromY}`, // e.g., "e2"
        toPosition: `${toX}${toY}`,     // e.g., "e4"
        promotionPieceType: moveInfo.promoteTo ? moveInfo.promoteTo.toUpperCase() : null // e.g., "Q" or null
        // 其他如 isCastling, isEnPassant 等信息，服务器应能自行推断或客户端明确发送
      };
      
      console.log('通过WebSocket发送行棋意图:', clientMovePayload);
      
      // 通过WebSocket发送消息 - 目标地址也需要和后端确认
      // websocket业务流程.md 提及 /app/movepieces
      // WebChessSocketConfig.java 提及 /app/game/move/{gameId}
      // 保持使用 /app/game/move/{gameId} 以与之前代码和配置一致
      const destination = `/app/game/move/${this.currentGameId}`; 
      sendMessage(destination, clientMovePayload);
    },
    
    // 为棋子生成一个简易ID（如果后端没有返回）
    generatePieceId(piece) {
      if (!piece) return '';
      const prefix = piece.color === 'white' ? 'w' : 'b';
      const type = piece.type.charAt(0);
      const timestamp = new Date().getTime();
      return `${prefix}${type}_${timestamp}`;
    },
    
    // 更新游戏状态到服务器
    updateGameStatusToServer(result) {
      if (!this.currentGameId) return;
      
      // 构造更新数据
      const updateData = {
        id: this.currentGameId,
        gameState: result // 1:胜，2:负，3:和
      };
      
      // 调用更新API
      updateGameStatus(updateData).then(res => {
        console.log('游戏状态更新结果:', res);
      }).catch(err => {
        console.error('更新游戏状态失败', err);
      });
    },
    
    // 显示胜负结果弹窗
    showResultPopup(result) {
      switch(result) {
        case 'victory':
          this.$refs.victoryPopup.open('center');
          break;
        case 'defeat':
          this.$refs.defeatPopup.open('center');
          break;
        case 'draw':
          this.$refs.drawPopup.open('center');
          break;
      }
    },
    
    // 关闭结果弹窗
    closeResultPopup() {
      this.$refs.victoryPopup.close();
      this.$refs.defeatPopup.close();
      this.$refs.drawPopup.close();
    },
    
    // 处理比赛总结按钮
    async handleSummary() {
      this.closeResultPopup();
      
      // 显示总结弹窗
      this.$refs.summaryPopup.open('center');
      this.summaryLoading = true;
      this.summaryContent = '';
      
      try {
        // 导入总结服务
        const { generateGameSummary } = await import('@/utils/gameSummaryService.js');
        
        // 准备对局数据
        const gameData = {
          moveHistory: this.formattedMoveHistory,
          finalBoardState: this.chessboard,
          gameResult: this.gameResult,
          playerName: this.playerName,
          opponentName: this.opponentName,
          playAs: this.playAs,
          timeControl: this.timeControl,
          gameMode: this.gameMode,
          isLeaderboardMode: this.isLeaderboardMode,
          ratingChange: this.ratingChange
        };
        
        // 调用AI生成总结
        const summary = await generateGameSummary(gameData, 'deepseek-V3');
        this.summaryContent = summary;
        
      } catch (error) {
        console.error('生成对局总结失败:', error);
        this.summaryContent = '对局总结生成失败，请稍后重试。\n\n错误信息：' + error.message;
      } finally {
        this.summaryLoading = false;
      }
    },
    
    // 处理新的一局按钮
    handleNewGame() {
      this.closeResultPopup();
      this.closeSummaryPopup();
      this.startNewGame();
    },
    
    // 关闭总结弹窗
    closeSummaryPopup() {
      this.$refs.summaryPopup.close();
    },
    
    // 处理结果弹窗关闭
    handleResultClose() {
      console.log('结果弹窗已关闭');
    },
    
    // 处理游戏结束后的操作
    handleGameEnd(result) {
      // 停止计时器
      this.stopAllTimers();
      
      // 设置游戏结束状态和结果（如果还没有设置的话）
      this.gameEnded = true;
      if (!this.gameResult) {
        switch(result) {
          case 'victory':
            this.gameResult = `${this.playerName} 获胜`;
            break;
          case 'defeat':
            this.gameResult = `${this.opponentName} 获胜`;
            break;
          case 'draw':
            this.gameResult = '和棋';
            break;
          default:
            this.gameResult = '游戏结束';
        }
      }
      
      // 如果是天梯赛模式，先显示积分结算
      if (this.isLeaderboardMode) {
        // 延迟显示弹窗，给用户足够时间看到棋盘最终状态
        setTimeout(() => {
          this.showLeaderboardResult(result);
        }, 1500);
      } else {
        // 非天梯赛模式，调用积分接口但不变更积分
        setTimeout(async () => {
          try {
            // 调用积分接口，积分变化为0
            await this.updatePlayerScoreInGame(0, result);
          } catch (error) {
            console.warn('普通对战积分记录失败:', error);
          }
          // 显示普通结果弹窗
          this.showResultPopup(result);
        }, 1000);
      }
    },
    
    // 处理投降消息
    handleGameQuitMessage(message) {
      const { playerId, playerName, gameId, gameState } = message;
      
      // 更新游戏状态
      if (gameState) {
        this.gameState = gameState;
      }
      
      // 判断是否是自己投降
      const currentUser = uni.getStorageSync('userInfo');
      if (currentUser && playerId === currentUser.id) {
        // 自己投降
        this.handleGameEnd('defeat');
        
        uni.showToast({
          title: '您已投降',
          icon: 'none'
        });
      } else {
        // 对手投降，我方获胜
        this.handleGameEnd('victory');
        
        uni.showToast({
          title: `${playerName || '对手'}投降，您获胜！`,
          icon: 'success'
        });
      }
    },
    
    // 处理和棋请求消息
    handleDrawRequestMessage(message) {
      console.log('处理和棋请求消息:', message);
      const { requestUserId, targetUserId, requestUser } = message;
      
      // 获取当前用户信息
      const currentUser = uni.getStorageSync('userInfo');
      if (!currentUser) {
        console.error('无法获取当前用户信息');
        return;
      }
      
      console.log('当前用户ID:', currentUser.id, '目标用户ID:', targetUserId, '请求用户ID:', requestUserId);
      
      // 只有目标用户才显示和棋请求弹窗
      if (currentUser.id === targetUserId) {
        console.log('显示和棋请求弹窗');
        uni.showModal({
          title: '和棋请求',
          content: `${requestUser || '对手'}请求和棋，是否同意？`,
          confirmText: '同意',
          cancelText: '拒绝',
          success: (res) => {
            if (res.confirm) {
              // 同意和棋
              this.acceptDrawRequest(requestUserId);
            } else {
              // 拒绝和棋
              this.rejectDrawRequest(requestUserId);
            }
          }
        });
      } else {
        console.log('当前用户不是目标用户，不显示弹窗');
      }
    },
    
    // 处理和棋被接受消息
    handleDrawAcceptedMessage(message) {
      // 更新游戏状态
      if (message.gameState) {
        this.gameState = message.gameState;
      }
      
      // 游戏结束，平局
      this.handleGameEnd('draw');
      
      uni.showToast({
        title: '对方同意和棋',
        icon: 'success'
      });
    },
    
    // 处理游戏超时消息
    handleGameTimeoutMessage(message) {
      const { timeoutPlayerId, winnerPlayerId, gameId } = message;
      
      const currentUser = uni.getStorageSync('userInfo');
      if (currentUser) {
        if (timeoutPlayerId === currentUser.id) {
          // 自己超时
          this.handleGameEnd('defeat');
          
          uni.showToast({
            title: '您超时了，对手获胜',
            icon: 'none'
          });
        } else {
          // 对手超时
          this.handleGameEnd('victory');
          
          uni.showToast({
            title: '对手超时，您获胜！',
            icon: 'success'
          });
        }
      }
    },
    
    // 同意和棋请求
     async acceptDrawRequest(requestPlayerId) {
       try {
         // 通过HTTP接口响应和棋请求
         const response = await respondDraw(this.currentGameId, true);
         
         if (response && response.success) {
           console.log('同意和棋请求已发送:', response);
           uni.showToast({
             title: '已同意和棋',
             icon: 'success'
           });
         } else {
           throw new Error(response?.message || '同意和棋请求失败');
         }
       } catch (error) {
         console.error('同意和棋请求失败:', error);
         uni.showToast({
           title: error.message || '同意和棋请求失败',
           icon: 'error'
         });
       }
     },
     
     // 拒绝和棋请求
     async rejectDrawRequest(requestPlayerId) {
       try {
         // 通过HTTP接口响应和棋请求
         const response = await respondDraw(this.currentGameId, false);
         
         if (response && response.success) {
           console.log('拒绝和棋请求已发送:', response);
           uni.showToast({
             title: '已拒绝和棋',
             icon: 'success'
           });
         } else {
           throw new Error(response?.message || '拒绝和棋请求失败');
         }
       } catch (error) {
         console.error('拒绝和棋请求失败:', error);
         uni.showToast({
           title: error.message || '拒绝和棋请求失败',
           icon: 'error'
         });
       }
     },
    
    // 显示天梯赛结果
    async showLeaderboardResult(result) {
      try {
        // 计算积分变化
        let pointsChange = 0;
        
        if (result === 'victory') {
          // 胜利获得积分，基础15分加上根据对手积分的额外加成
          const basePoints = 15;
          const difficultyBonus = Math.max(0, Math.floor((this.opponentRating - this.playerRating) / 100));
          pointsChange = basePoints + difficultyBonus;
        } else if (result === 'defeat') {
          // 失败扣除积分，基础10分减去根据对手积分的减免
          const basePoints = -10;
          const difficultyBonus = Math.min(5, Math.max(0, Math.floor((this.opponentRating - this.playerRating) / 150)));
          pointsChange = basePoints + difficultyBonus;
        } else {
          // 和棋，积分变化根据双方积分差计算
          const ratingDiff = this.opponentRating - this.playerRating;
          if (ratingDiff > 100) {
            // 如果对手积分明显高，和棋算小胜，加少量分
            pointsChange = 5;
          } else if (ratingDiff < -100) {
            // 如果对手积分明显低，和棋算小负，减少量分
            pointsChange = -3;
          } else {
            // 实力相当，和棋不变分或微调
            pointsChange = Math.floor(Math.random() * 3) - 1; // -1到1之间的随机数
          }
        }
        
        // 设置积分变化数据
        this.ratingChange = {
          before: this.playerRating,
          after: this.playerRating + pointsChange,
          change: pointsChange
        };
        
        // 调用积分结算接口
        await this.updatePlayerScoreInGame(pointsChange, result);
        
        // 显示普通结果弹窗，结果弹窗中已包含积分显示
        this.showResultPopup(result);
        
      } catch (error) {
        console.error('积分结算失败:', error);
        // 即使积分结算失败，也要显示游戏结果
        this.showResultPopup(result);
      }
    },
    
    // 提出和棋
    async offerDraw() {
      if (!this.currentGameId) {
        uni.showToast({
          title: '游戏ID不存在',
          icon: 'error'
        });
        return;
      }
      
      uni.showModal({
        title: '和棋请求',
        content: '你确定要提出和棋吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              // 通过HTTP接口发送和棋请求
              const response = await requestDraw(this.currentGameId);
              
              if (response && response.success) {
                console.log('和棋请求已发送:', response);
                uni.showToast({
                  title: '和棋请求已发送',
                  icon: 'success'
                });
              } else {
                throw new Error(response?.message || '和棋请求发送失败');
              }
            } catch (error) {
              console.error('发送和棋请求失败:', error);
              uni.showToast({
                title: error.message || '发送和棋请求失败',
                icon: 'error'
              });
            }
          }
        }
      });
    },
    
    // 认输
    async resignGame() {
      if (!this.currentGameId) {
        uni.showToast({
          title: '游戏ID不存在',
          icon: 'error'
        });
        return;
      }
      
      uni.showModal({
        title: '投降确认',
        content: '你确定要投降吗？投降后游戏将立即结束。',
        success: async (res) => {
          if (res.confirm) {
            try {
              // 通过HTTP接口发送投降请求
              const response = await quitGame(this.currentGameId);
              
              if (response && response.success) {
                console.log('投降请求已发送:', response);
                
                this.stopAllTimers();
                this.gameResult = `${this.opponentName} 胜出（投降）`;
                
                // 处理游戏结束
                this.handleGameEnd('defeat');
                
                uni.showToast({
                  title: '已投降',
                  icon: 'success'
                });
              } else {
                throw new Error(response?.message || '投降失败');
              }
            } catch (error) {
              console.error('投降失败:', error);
              uni.showToast({
                title: error.message || '投降失败',
                icon: 'error'
              });
            }
          }
        }
      });
    },
    
    // 发送聊天消息
    sendChatMessage(message) {
      console.log('发送聊天消息:', message);
      // 实际项目中应发送消息给服务器
    },
    
    // 开始新游戏
    startNewGame() {
      // 重置对局状态
      this.resetBoard();
      this.gameStarted = true;
      this.matching = false;
      this.gameResult = null;
      this.isCheckmated = false;
      this.checkmateColor = '';
      
      // 随机分配执棋方
      this.playAs = Math.random() < 0.5 ? 'white' : 'black';
      
      // 开始计时（白方先行）
      this.startWhiteTimer();
      
      uni.showToast({
        title: `新对局已开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
        icon: 'none'
      });
    },
    
    // 参加天梯赛
    async playLeaderboard() {
      // 进入天梯赛匹配
      
      try {
        // 设置为天梯赛模式
        this.isLeaderboardMode = true;
        
        // 显示匹配状态
        this.matching = true;
        this.opponentName = '正在匹配对手...';
        
        // 使用默认配置：10分钟、标准模式、随机执子
        this.timeControl = '10 min';
        this.gameMode = 'standard';
        this.playAs = 'random';
        
        // 重置棋盘到初始状态
        this.resetBoard();
        
        // 获取当前用户的积分信息
        await this.getCurrentPlayerScore();
        
        // 获取在线玩家列表并进行匹配
        await this.findLeaderboardOpponent();
        
      } catch (error) {
        console.error('天梯赛匹配失败:', error);
        uni.showToast({
          title: '匹配失败，请重试',
          icon: 'none'
        });
        this.matching = false;
        this.isLeaderboardMode = false;
      }
    },
    
    // 获取当前玩家积分
    async getCurrentPlayerScore() {
      try {
        const response = await getPlayerScoreList({
          userId: this.currentUserId,
          pageNo: 1,
          pageSize: 1
        });
        
        if (response.success && response.result && response.result.records.length > 0) {
          this.playerRating = response.result.records[0].score || 600;
        } else {
          // 如果没有积分记录，使用默认初始积分600
          this.playerRating = 600;
        }
      } catch (error) {
        console.error('获取玩家积分失败:', error);
        this.playerRating = 600; // 使用默认积分
      }
    },
    
    // 匹配天梯赛对手
    async findLeaderboardOpponent() {
      try {
        let availableOpponents = [];
        
        // 首先尝试从在线用户列表获取对手
        try {
          const onlineUsersResponse = await getUserList({
            pageNo: 1,
            pageSize: 50 // 获取前50个在线用户
          });
          
          if (onlineUsersResponse.success && onlineUsersResponse.result && onlineUsersResponse.result.records) {
            // 过滤掉当前用户
            const onlineUsers = onlineUsersResponse.result.records.filter(user => 
              user.id !== this.currentUserId
            );
            
            // 为在线用户获取积分信息
            for (const user of onlineUsers) {
              try {
                const scoreResponse = await getPlayerScoreList({
                  userId: user.id,
                  pageNo: 1,
                  pageSize: 1
                });
                
                if (scoreResponse.success && scoreResponse.result && scoreResponse.result.records.length > 0) {
                  availableOpponents.push({
                    userId: user.id,
                    userAccount: user.username || user.realname || `玩家${user.id}`,
                    score: scoreResponse.result.records[0].score || 600,
                    isOnline: true
                  });
                } else {
                  // 如果没有积分记录，使用默认积分
                  availableOpponents.push({
                    userId: user.id,
                    userAccount: user.username || user.realname || `玩家${user.id}`,
                    score: 600,
                    isOnline: true
                  });
                }
              } catch (scoreError) {
                console.warn('获取用户积分失败:', scoreError);
                // 使用默认积分
                availableOpponents.push({
                  userId: user.id,
                  userAccount: user.username || user.realname || `玩家${user.id}`,
                  score: 600,
                  isOnline: true
                });
              }
            }
          }
        } catch (onlineError) {
          console.warn('获取在线用户失败，回退到积分列表匹配:', onlineError);
        }
        
        // 如果在线用户列表为空，回退到从积分列表中选择对手
        if (availableOpponents.length === 0) {
          const response = await getPlayerScoreList({
            pageNo: 1,
            pageSize: 100 // 获取前100名玩家
          });
          
          if (response.success && response.result && response.result.records.length > 0) {
            // 过滤掉当前用户，获取可匹配的对手列表
            availableOpponents = response.result.records.filter(player => 
              player.userId !== this.currentUserId
            ).map(player => ({
              ...player,
              isOnline: false
            }));
          }
        }
        
        if (availableOpponents.length === 0) {
          throw new Error('暂无可匹配的对手');
        }
        
        // 从可用对手中随机选择一个
        const randomIndex = Math.floor(Math.random() * availableOpponents.length);
        const selectedOpponent = availableOpponents[randomIndex];
        
        // 设置匹配状态和对手信息
        this.matching = false;
        this.opponentName = selectedOpponent.userAccount || `玩家${selectedOpponent.userId}`;
        this.opponentAvatar = selectedOpponent.avatar || '/static/images/match/avatar-default.png';
        this.opponentRating = selectedOpponent.score || 600;
        
        // 随机分配执棋方
        this.playAs = Math.random() < 0.5 ? 'white' : 'black';
        
        // 开始游戏
        this.gameStarted = true;
        
        // 切换到对战标签
        this.activeTab = 'match';
        
        // 按规则白方先行，开始白方计时
        this.startWhiteTimer();
        
        const onlineStatus = selectedOpponent.isOnline ? '(在线)' : '(离线)';
        uni.showToast({
          title: `天梯赛开始${onlineStatus}，您执${this.playAs === 'white' ? '白' : '黑'}子`,
          icon: 'none'
        });
        
      } catch (error) {
        console.error('匹配对手失败:', error);
        throw error;
      }
    },
    
    // 处理邀请弹窗关闭
    handleInvitationClose() {
      // 邀请弹窗关闭
      this.invitationShown = false;
    },
    
    // 处理取消邀请
    handleCancelInvite() {
      if (!this.pendingInviteId) return;
      
      // 取消邀请
      
      // 确保ID是有效的数字字符串
      if (typeof this.pendingInviteId !== 'string' || !this.pendingInviteId.match(/^[0-9]+$/)) {
        console.error('无效的邀请ID格式:', this.pendingInviteId);
        
        // 如果ID无效，尝试清理所有邀请
        if (this.currentUserId) {
          clearPendingInvitations(this.currentUserId).then(() => {
      this.matching = false;
            this.gameStarted = false;
            this.pendingInviteId = null;
            this.stopPollingInviteStatus();
            
            uni.showToast({
              title: '已清理所有邀请',
              icon: 'none'
            });
          }).catch(e => {
            console.error('清理邀请失败:', e);
          });
        }
        
        return;
      }
      
      // 调用取消邀请API
      cancelInvitation(this.pendingInviteId).then(res => {
        console.log('取消邀请结果:', res);
        if (res.success) {
          // 停止匹配状态
          this.matching = false;
          this.gameStarted = false;
          this.pendingInviteId = null;
          
          // 停止轮询
          this.stopPollingInviteStatus();
      
      uni.showToast({
            title: '已取消邀请',
        icon: 'none'
          });
        } else {
          // 如果取消失败，尝试清理所有待处理邀请
          if (this.currentUserId) {
            clearPendingInvitations(this.currentUserId).then(() => {
              this.matching = false;
              this.gameStarted = false;
              this.pendingInviteId = null;
              this.stopPollingInviteStatus();
              
              uni.showToast({
                title: '已清理所有邀请',
                icon: 'none'
              });
            }).catch(e => {
              console.error('清理邀请失败:', e);
              uni.showToast({
                title: '操作失败，请稍后重试',
                icon: 'none'
              });
            });
          } else {
            uni.showToast({
              title: res.message || '取消邀请失败',
              icon: 'none'
            });
          }
        }
      }).catch(err => {
        console.error('取消邀请失败:', err);
        uni.showToast({
          title: '操作失败，请稍后重试',
          icon: 'none'
        });
      });
    },
    
    // 处理匹配弹窗关闭
    handleMatchingPopupClose() {
      // 匹配弹窗关闭
    },
    
    // 获取当前用户信息
    getCurrentUserInfo() {
      getUserData().then(res => {
        if (res.success && res.result) {
          const userData = res.result;
          this.currentUserId = userData.id;
          this.currentUserAccount = userData.username || userData.account || userData.userAccount;
          this.playerName = userData.realname || userData.username || '我';
          // 设置玩家头像
          this.playerAvatar = userData.avatar || '/static/images/match/avatar-user.png';
          
          // 将完整的用户信息存储到本地
          uni.setStorageSync('userId', userData.id);
          uni.setStorageSync('userInfo', userData);
          console.log('获取到用户数据并存储到本地:', userData);
        }
      }).catch(err => {
        console.error('获取用户信息失败', err);
        // 使用缓存中的用户ID
        const userId = uni.getStorageSync('userId');
        const userInfo = uni.getStorageSync('userInfo');
        if (userId) {
          this.currentUserId = userId;
        }
        if (userInfo) {
          console.log('使用缓存的用户信息:', userInfo);
          // 从缓存中获取头像
          this.playerAvatar = userInfo.avatar || '/static/images/match/avatar-user.png';
        }
      });
    },
    
    // 处理拒绝邀请
    handleDeclineInvitation(inviter) {
      console.log('拒绝邀请:', inviter);
      
      // 调用拒绝邀请API
      respondInvitation(inviter.inviteId, 2).then(res => {
        if (res.success) {
      uni.showToast({
            title: '已拒绝邀请',
        icon: 'none'
          });
        } else {
          uni.showToast({
            title: res.message || '拒绝邀请失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('拒绝邀请失败', err);
        uni.showToast({
          title: '操作失败，请稍后重试',
          icon: 'none'
        });
      });
    },
    
    // 显示邀请弹窗
    showInvitation(inviter) {
      // 避免重复显示相同的邀请
      if (this.invitationShown && inviter.inviteId === this.lastShownInviteId) {
        console.log('相同的邀请已经在显示中，跳过');
        return;
      }
      
      // 记录当前显示的邀请
      this.currentInviter = inviter;
      this.invitationShown = true;
      this.lastShownInviteId = inviter.inviteId;
      
      console.log('显示邀请弹窗:', inviter);
      this.$refs.invitationPopup.open();
    },
    
    // 棋盘准备好的处理
    handleBoardReady() {
      // 可以在这里进行初始化工作
      console.log('棋盘已准备好');
    },
    
    // 处理兵升变
    handlePromotion(move) {
      const { from, to, promoteTo } = move;
      // 完成升变后再走棋并发送
      this.doMoveAndSend(from, to, promoteTo);
    },
    
    // 本地走棋并发送WebSocket
    doMoveAndSend(from, to, promoteTo = null) {
      // 1. 本地走棋、动画、音效
      const fromPos = this.columns[from.col] + (8 - from.row);
      const toPos = this.columns[to.col] + (8 - to.row);
      // 先本地处理所有规则和特殊走法
      this.movePieceLocal(from, to, promoteTo);
      // 2. 组装消息体并发送
      this.sendMoveToServerFull(from, to, promoteTo);
      // 3. 切换回合、历史、结局等
      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
      this.recordMoveHistory(from, to, this.chessboard[to.row][to.col], null); // captured已在movePieceLocal处理
      this.checkGameOutcome();
      // 清除路径提示
      if (this.$refs.chessBoard && typeof this.$refs.chessBoard.clearPathHighlights === 'function') {
        this.$refs.chessBoard.clearPathHighlights(); 
      } else {
        console.warn('ChessBoard component or clearPathHighlights method not found.');
      }
    },
    // 本地走棋（只更新棋盘和播放音效/动画，不发消息）
    movePieceLocal(from, to, promoteTo = null) {
      const piece = this.chessboard[from.row][from.col];
      let capturedPiece = null;
      let isEnPassant = false;

      // 检查是否为吃过路兵
      if (piece.endsWith('pawn') && 
          this.enPassantTarget && 
          to.row === this.enPassantTarget.row && 
          to.col === this.enPassantTarget.col && 
          Math.abs(from.col - to.col) === 1 && 
          this.chessboard[to.row][to.col] === null) {
        isEnPassant = true;
        const capturedPawnRow = from.row; 
        const capturedPawnCol = to.col;   
        capturedPiece = this.chessboard[capturedPawnRow][capturedPawnCol]; 
        this.$set(this.chessboard[capturedPawnRow], capturedPawnCol, null); 
        this.playChessSound && this.playChessSound('capture');
        this.enPassantTarget = null; 
      } else if (this.chessboard[to.row][to.col]) {
        capturedPiece = this.chessboard[to.row][to.col];
        this.playChessSound && this.playChessSound('capture');
      } else {
        this.playChessSound && this.playChessSound('move');
      }

      // 更新棋盘上的棋子位置 (先移动棋子，再处理特殊逻辑如升变和易位)
      this.$set(this.chessboard[to.row], to.col, piece);
      this.$set(this.chessboard[from.row], from.col, null);
      
      // 重要：调用recordMove来正确处理过路兵状态
      const moveInfo = {
        isEnPassant: isEnPassant,
        capturedPiecePos: isEnPassant ? { row: from.row, col: to.col } : null,
        isPromotion: !!promoteTo,
        promoteTo: promoteTo
      };
      recordMove(this.chessboard, from, to, moveInfo);

      // 兵升变
      if (promoteTo) {
        this.$set(this.chessboard[to.row], to.col, `${getPieceColor(piece)}-${promoteTo.toLowerCase()}`);
      } else if (piece.endsWith('pawn') && ((piece.startsWith('white') && to.row === 0) || (piece.startsWith('black') && to.row === 7))) {
        this.$set(this.chessboard[to.row], to.col, `${getPieceColor(piece)}-queen`); 
      }

      // 王车易位
      if (piece.endsWith('king') && Math.abs(from.col - to.col) === 2) {
        const kingId = this.getChessPieceUniqueId(from.row, from.col, piece); // 王移动前的位置
        this.movedPieces.add(kingId); // 标记王已移动

        let rook, rookOriginalCol, rookTargetCol, rookId;
        if (to.col === 6) { // 短易位 (kingside)
          rookOriginalCol = 7;
          rookTargetCol = 5;
        } else if (to.col === 2) { // 长易位 (queenside)
          rookOriginalCol = 0;
          rookTargetCol = 3;
        }
        rook = this.chessboard[from.row][rookOriginalCol]; // 获取对应车
        if (rook) {
          rookId = this.getChessPieceUniqueId(from.row, rookOriginalCol, rook); // 车移动前的位置
          this.$set(this.chessboard[from.row], rookTargetCol, rook); // 移动车
          this.$set(this.chessboard[from.row], rookOriginalCol, null);
          this.movedPieces.add(rookId); // 标记车已移动
        }
      } else if (piece.endsWith('king') || piece.endsWith('rook')) {
          // 如果王或车进行了普通移动，也标记为已移动
          const movedPieceId = this.getChessPieceUniqueId(from.row, from.col, piece); // 使用移动前的位置和棋子
          this.movedPieces.add(movedPieceId);
      }

      // 维护enPassantTarget
      if (piece.endsWith('pawn') && Math.abs(from.row - to.row) === 2) {
        this.enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
      } else if (!isEnPassant) { // 只有在不是吃过路兵的情况下才清除，因为吃过路兵时已经清除了
        this.enPassantTarget = null;
      }
    },
    // 组装完整消息体并发送
    sendMoveToServerFull(from, to, promoteTo = null) {
      // 发送时用移动后的piece信息，但使用移动前的位置来生成ID
      const piece = this.chessboard[to.row][to.col];
      const pieceColor = getPieceColor(piece);
      const chessPiecesId = this.getChessPieceUniqueId(from.row, from.col, piece);
      const piecesType = pieceColor === 'black' ? 1 : 2;
      let tookPiecesId = null;
      let isEnPassant = false;
      // 吃过路兵
      if (piece.endsWith('pawn') && Math.abs(from.col - to.col) === 1 && this.enPassantTarget && to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
        isEnPassant = true;
        const capturedRow = from.row;
        const capturedCol = to.col;
        tookPiecesId = this.getChessPieceUniqueId(capturedRow, capturedCol, this.chessboard[capturedRow][capturedCol]);
      } else if (this.chessboard[to.row][to.col]) {
        tookPiecesId = this.getChessPieceUniqueId(to.row, to.col, this.chessboard[to.row][to.col]);
      }
      let promotionPieceType = null;
      let isPromotion = false;
      if (promoteTo) {
        promotionPieceType = promoteTo.toUpperCase();
        isPromotion = true;
      } else if (piece.endsWith('pawn') && ((pieceColor === 'white' && to.row === 0) || (pieceColor === 'black' && to.row === 7))) {
        promotionPieceType = 'Q';
        isPromotion = true;
      }
      let isCastling = false;
      if (piece.endsWith('king') && Math.abs(from.col - to.col) === 2) {
        isCastling = true;
      }
      if (!this.moveSequence) this.moveSequence = 1;
      else this.moveSequence++;
      const moveDurationSeconds = this.calculateTimeSpentSeconds();
      const fromPos = this.columns[from.col] + (8 - from.row);
      const toPos = this.columns[to.col] + (8 - to.row);
      const moveRequest = {
        chessGameId: String(this.currentGameId),
        gameId: String(this.currentGameId),
        userId: String(this.currentUserId),
        chessPiecesId,
        piecesType,
        fromPositionX: fromPos[0].toLowerCase(),
        fromPositionY: fromPos[1],
        toPositionX: toPos[0].toLowerCase(),
        toPositionY: toPos[1],
        fromPosition: fromPos,
        toPosition: toPos,
        promotionPieceType,
        moveSequence: this.moveSequence,
        moveDurationSeconds,
        tookPiecesId,
        type: 'MOVE',
        isCastling,
        isPromotion,
        isEnPassant,
      };
      if (this.webSocketService.stompClient && this.currentGameId) {
        try {
          sendMessage('/app/movepieces', moveRequest);
        } catch (error) {
          console.error('发送走棋消息失败:', error);
          uni.showToast({ title: '走棋失败，请重试', icon: 'none' });
        }
      } else {
        console.error('WebSocket客户端未初始化或缺少游戏ID，无法发送走棋消息');
        uni.showToast({ title: '网络连接中断，请重新连接', icon: 'none' });
      }
    },
    
    // 处理棋盘格子点击
    handleCellClick(position) {
      // 如果游戏未开始或已结束，不处理点击
      if (!this.gameStarted || this.gameResult || this.isCheckmated) {
        return;
      }
      const { row, col } = position;
      const piece = this.chessboard[row][col];
      // 已选中棋子，尝试移动
      if (this.selectedPosition) {
        if (this.selectedPosition.row === row && this.selectedPosition.col === col) {
          this.selectedPosition = null;
          this.validMoves = [];
          return;
        }
        const validMove = this.validMoves.find(move => move.row === row && move.col === col);
        if (validMove) {
          // 检查是否兵升变
          const from = this.selectedPosition;
          const to = { row, col };
          const movingPiece = this.chessboard[from.row][from.col];
          if (movingPiece && movingPiece.endsWith('pawn') && ((movingPiece.startsWith('white') && to.row === 0) || (movingPiece.startsWith('black') && to.row === 7))) {
            // 弹出升变弹窗，等待用户选择
            this.$refs.chessBoard.pendingMove = { from, to };
            this.$refs.chessBoard.promotionPosition = to;
            this.$refs.chessBoard.showPromotionDialog = true;
            // 交互完成后会触发handlePromotion
            return;
          }
          // 非升变，直接本地走棋并发送
          this.doMoveAndSend(from, to);
          this.selectedPosition = null;
          this.validMoves = [];
          return;
        }
        if (piece && getPieceColor(piece) === this.currentPlayer) {
          this.selectPiece(row, col);
          return;
        }
        this.selectedPosition = null;
        this.validMoves = [];
      } else if (piece && getPieceColor(piece) === this.currentPlayer) {
        this.selectPiece(row, col);
      }
    },
    
    // 选择棋子
    selectPiece(row, col) {
      const piece = this.chessboard[row][col]; 
      if (!piece) {
        this.selectedPosition = null;
        this.validMoves = [];
        return; 
      }

      // 确保执白方只能控制白色棋子，执黑方只能控制黑色棋子
      // 注意：currentPlayer的检查已在handleCellClick中完成
      if (this.playAs === 'white' && getPieceColor(piece) !== 'white') {
        console.log("执白方只能控制白色棋子");
        this.selectedPosition = null; // 清除选择
        this.validMoves = [];      // 清除合法移动
        if (this.$refs.chessBoard) {
          this.$refs.chessBoard.clearHighlights(); // 清除棋盘高亮
        }
        return;
      }
      if (this.playAs === 'black' && getPieceColor(piece) !== 'black') {
        console.log("执黑方只能控制黑色棋子");
        this.selectedPosition = null; // 清除选择
        this.validMoves = [];      // 清除合法移动
        if (this.$refs.chessBoard) {
          this.$refs.chessBoard.clearHighlights(); // 清除棋盘高亮
        }
        return;
      }

      this.selectedPosition = { row, col };
      // 获取有效移动
      this.validMoves = getValidMoves(this.chessboard, row, col);
      
      // 检查是否有特殊移动
      this.checkForSpecialMoves(row, col);
    },
    
    // 检查特殊移动（王车易位、吃过路兵等）
    checkForSpecialMoves(row, col) {
      const piece = this.chessboard[row][col];
      const pieceType = getPieceType(piece);
      const pieceColor = getPieceColor(piece);
      
      // 通知棋盘组件清空之前的特殊移动标记
      this.$refs.chessBoard?.setCastlingPositions([]);
      this.$refs.chessBoard?.setEnPassantPosition(null);
      
      // 检查王车易位
      if (pieceType === 'king') {
        // 找出有效移动中的王车易位
        const castlingMoves = getCastlingMoves(this.chessboard, row, col, pieceColor);
        if (castlingMoves.length > 0) {
          this.$refs.chessBoard?.setCastlingPositions(castlingMoves);
        }
      }
      
      // 检查吃过路兵
      if (pieceType === 'pawn') {
        // 找出有效移动中的吃过路兵
        const enPassantMove = this.validMoves.find(move => move.isEnPassant);
        if (enPassantMove) {
          console.log('找到吃过路兵移动:', enPassantMove);
          // 传递完整的过路兵信息，包括目标位置和被吃掉的棋子位置
          this.$refs.chessBoard?.setEnPassantPosition({
            row: enPassantMove.row,
            col: enPassantMove.col,
            capturedPiecePos: enPassantMove.capturedPiecePos // 添加被吃掉的棋子位置信息
          });
          
          // 吃过路兵详情
          console.log('吃过路兵详情 - 当前位置:', {row, col}, 
            '目标位置:', {row: enPassantMove.row, col: enPassantMove.col}, 
            '被吃棋子位置:', enPassantMove.capturedPiecePos);
        } else {
          console.log('当前棋子没有吃过路兵的移动');
        }
      }
    },
    
    // 分享邀请链接
    shareInviteLink(friend) {
      // 生成邀请链接
      const inviteCode = this.generateInviteCode();
      let inviteLink = `app://chess/invitation?code=${inviteCode}`;
      
      // 如果有好友信息，添加到链接中
      if (friend && friend.id) {
        inviteLink += `&friend=${friend.name}`;
      }
      
      uni.showModal({
        title: '分享邀请链接',
        content: `邀请链接已生成: ${inviteLink}\n\n您可以复制此链接分享给好友`,
        confirmText: '复制链接',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.setClipboardData({
              data: inviteLink,
              success: () => {
      uni.showToast({
                  title: '链接已复制到剪贴板',
                  icon: 'success'
                });
              }
            });
          }
        }
      });
    },
    
    // 生成随机邀请码
    generateInviteCode() {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    },
    
    // 开始轮询查询待接受的邀请
    startPollingInvitations() {
      // 清除可能的现有定时器
      if (this.invitationTimer) {
        clearInterval(this.invitationTimer);
      }
      
      // 设置定时器，每5秒查询一次
      this.invitationTimer = setInterval(() => {
        this.checkPendingInvitations();
      }, 5000);
      
      // 立即执行一次
      this.checkPendingInvitations();
    },
    
    // 停止轮询
    stopPollingInvitations() {
      if (this.invitationTimer) {
        clearInterval(this.invitationTimer);
        this.invitationTimer = null;
      }
    },
    
    // 查询待接受的邀请
    checkPendingInvitations() {
      // 获取当前用户ID - 尝试多种可能的键名
      let userId = uni.getStorageSync('userId');
      
      // 如果找不到userId，尝试其他可能的键名
      if (!userId) {
        const possibleKeys = ['user_id', 'id', 'uid', 'user_uid', 'userInfo'];
        for (const key of possibleKeys) {
          const value = uni.getStorageSync(key);
          if (value) {
            // 如果找到userInfo对象，尝试从中提取ID
            if (key === 'userInfo' && typeof value === 'object') {
              userId = value.id || value.userId || value.uid || '';
            } else {
              userId = value;
            }
            
            console.log(`找到用户ID，使用键: ${key}, 值: ${userId}`);
            break;
          }
        }
      }
      
      // 存储信息
      //console.log('当前存储的所有键值:');
      try {
        const storageInfo = uni.getStorageInfoSync();
        if (storageInfo && storageInfo.keys) {
          storageInfo.keys.forEach(key => {
            const value = uni.getStorageSync(key);
            //console.log(`Key: ${key}, Value:`, value);
          });
        }
      } catch (error) {
        console.error('获取存储信息失败:', error);
      }
      
      if (!userId) {
        console.log('未找到有效的用户ID，不查询邀请');
        return;
      }
      
      //console.log('正在查询待接受的邀请...', '用户ID:', userId);
      queryPendingInvitations(userId).then(res => {
        //console.log('查询邀请结果:', res);
        if (res.success && res.result) {
          this.pendingInvitations = Array.isArray(res.result) ? res.result : [];
          //console.log('获取到待接受邀请:', this.pendingInvitations.length, '个');
          
          // 如果有待接受的邀请，且当前没有显示邀请弹窗也没有对局进行中
          if (this.pendingInvitations.length > 0 && !this.invitationShown && !this.gameStarted) {
            // 获取第一个邀请
            const invitation = this.pendingInvitations[0];
            //console.log('处理邀请:', invitation);
            
            if (!invitation.id) {
              console.warn('邀请缺少ID，无法显示');
              return;
            }
            
            // 构造邀请者信息 - 适配API返回的数据格式
            const inviter = {
              id: invitation.sourceUserId,
              name: invitation.sourceUserAccount,
              inviteId: invitation.id,
              sourceOnePart: invitation.sourceOnePart, // 1：黑色；2: 白色
              acceptOnePart: invitation.acceptOnePart, // 1：黑色；2: 白色
              timeControl: invitation.timeControl || this.timeControl
            };
      
            // 显示邀请弹窗
            this.showInvitation(inviter);
      
            // 如果有多个邀请，记录在日志中
            if (this.pendingInvitations.length > 1) {
              console.log(`还有 ${this.pendingInvitations.length - 1} 个待处理的邀请`);
            }
          } else if (this.pendingInvitations.length === 0) {
           // console.log('没有待处理的邀请');
          } else if (this.invitationShown) {
            console.log('邀请弹窗已显示，不再显示新邀请');
          } else if (this.gameStarted) {
            console.log('游戏已开始，忽略新邀请');
          }
        }
      }).catch(err => {
        console.error('查询待接受邀请失败', err);
      });
    },
    
    // 处理邀请被接受
    handleInviteAccepted(inviteInfo) {
      console.log('邀请已被接受:', inviteInfo);
      
      // 停止匹配状态
      this.matching = false;
      this.gameStarted = true;
      
      // 获取对手ID和邀请ID
      const { inviteId, opponentId } = inviteInfo;
      
      // 切换到对战标签
      this.activeTab = 'match';
      
      // 重置棋盘
      this.resetBoard();
      
      // 发起方直接进入游戏 - 游戏已由接收方初始化
      enterGame().then(enterRes => {
        console.log('发起方进入游戏结果:', enterRes);
        if (enterRes.success) {
          console.log('发起方成功进入游戏');
          
          // 开始计时
          this.startWhiteTimer();
          
          // 如果是黑方，开始轮询对方行棋 - 改为WebSocket后，此处不再需要轮询
          // if (this.playAs === 'black') {
          //   this.startPollingGameMoves();
          // }
          
          // 初始化WebSocket连接
          if (this.currentGameId) {
            this.initWebSocket(this.currentGameId);
          }
          
          uni.showToast({
            title: `对局已开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: enterRes.message || '进入游戏失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('进入游戏失败', err);
        uni.showToast({
          title: '进入游戏失败，请重试',
          icon: 'none'
        });
      });
    },
    
    // 清理旧的邀请
    cleanupOldInvitations() {
      // 获取当前用户ID
      const userId = this.currentUserId || uni.getStorageSync('userId');
      if (!userId) {
       // console.log('未找到用户ID，跳过清理邀请');
        return Promise.resolve();
      }
      
      //console.log('清理旧邀请，用户ID:', userId);
      return clearPendingInvitations(userId).then(() => {
       // console.log('成功清理旧邀请');
      }).catch(err => {
        //console.error('清理旧邀请失败:', err);
      });
    },
    
    // WebSocket相关方法
    initWebSocket(gameId) {
      if (!gameId) {
        console.error('初始化WebSocket失败: 缺少游戏ID');
        return;
      }
      
      // 确保gameId是字符串类型
      const gameIdStr = String(gameId);
      
      if (!this.currentUserId) {
        console.error('初始化WebSocket失败: 缺少用户ID');
        return;
      }
      
      // 如果已经有连接，先断开
      if (this.webSocketService.stompClient) {
        try {
          disconnectWebSocket();
          console.log('断开现有WebSocket连接');
        } catch (e) {
          console.warn('断开WebSocket时出错:', e);
        }
      }
      
      // 清除现有订阅
      this.webSocketService.gameSubscription = null;
      
      // 连接WebSocket
      console.log(`尝试连接WebSocket，用户ID: ${this.currentUserId}，游戏ID: ${gameIdStr}`);
      
      connectWebSocket(
        this.currentUserId,
        (client) => {
          console.log('WebSocket连接成功:', client);
          this.webSocketService.stompClient = client;
          
          // 保存当前订阅的游戏ID
          this.webSocketService.gameIdForSubscription = gameIdStr;
          
          // 订阅游戏主题以接收更新
          const gameTopic = `/topic/game/${gameIdStr}`;
          console.log(`订阅游戏主题: ${gameTopic}`);
          
          this.webSocketService.gameSubscription = subscribeToTopic(
            gameTopic,
            (message) => {
              console.log('【收到原始消息】:', JSON.stringify(message));
              console.log('收到游戏主题消息:', message);
              try {
                this.handleWebSocketMessage(message);
              } catch (e) {
                console.error('处理WebSocket消息时出错:', e, message);
              }
            }
          );
          
          // 订阅棋盘主题以接收棋盘状态
          const chessboardTopic = `/topic/chessboard`;
          console.log(`订阅棋盘主题: ${chessboardTopic}`);
          
          subscribeToTopic(
            chessboardTopic,
            (message) => {
              console.log('收到棋盘状态消息:', message);
              if (message && message.success !== false && message.result) {
                this.updateGameViewFromServer(message.result);
              }
            }
          );
          
          // 请求初始棋盘信息
          this.requestInitialChessboard(gameIdStr);
          
          // 发送PLAYER_JOIN消息通知其他玩家 (仅发送一次)
          console.log('向服务器发送玩家加入消息');
          const playerJoinMsg = {
            gameId: gameIdStr,
            userId: String(this.currentUserId),
            username: this.playerName || `玩家_${this.currentUserId}`,
            avatar: this.playerAvatar || '/static/images/match/avatar-user.png',
            playerColor: this.playAs // 确保 playAs 已经基于游戏分配设置
          };
          const destination = `/app/game/join/${gameIdStr}`; // PLAYER_JOIN 消息的目的地
          sendMessage(destination, playerJoinMsg);
          
          // 移除之前通过 setTimeout 多次发送 playerJoinMsg 和 GAME_START 的逻辑

        },
        (error) => {
          console.error('WebSocket连接错误:', error);
          uni.showToast({
            title: '连接实时服务失败，对局可能不会实时更新',
            icon: 'none',
            duration: 3000
          });
        }
      );
    },
    
    // 请求初始棋盘信息
    requestInitialChessboard(gameId) {
      if (!gameId || !this.webSocketService.stompClient) {
        console.error('请求初始棋盘失败: 缺少gameId或WebSocket未连接');
        return;
      }
      
      console.log(`请求初始棋盘信息，游戏ID: ${gameId}, 用户ID: ${this.currentUserId}`);
      
      try {
        sendMessage("/app/chessboard", {
          gameId: String(gameId),
          userId: String(this.currentUserId)
        });
      } catch (e) {
        console.error('请求初始棋盘信息失败:', e);
      }
    },
  
    handleWebSocketMessage(message) {
      console.log('WebSocket: 收到消息:', message);
      if (!message || typeof message !== 'object') {
          console.warn('WebSocket: 收到无效消息格式', message);
          return;
      }
  
      // 根据后端实际发送的消息类型进行处理
      switch (message.type) {
        case 'PLAYER_JOIN':
          console.log(`WebSocket: 玩家 ${message.payload.username} (ID: ${message.payload.userId}) 加入游戏 (gameId: ${this.currentGameId})`);
          // 更新对手信息等UI
          if (message.payload.userId !== this.currentUserId) {
              console.log('WebSocket: 对手加入游戏，更新对手信息', message.payload);
              // 更新对手名称和头像
              this.opponentName = message.payload.username || this.opponentName;
              this.opponentAvatar = message.payload.avatar || '/static/images/match/avatar-default.png'; 
              
              // 明确清除等待状态
              this.gameStarted = true;
              
              // 强制更新视图
              this.$nextTick(() => {
                console.log('WebSocket: 强制更新UI显示对手信息');
                this.$forceUpdate();
              });
              
              uni.showToast({ 
                title: `玩家 ${message.payload.username || '对手'} 已加入游戏`, 
                icon: 'none'
              });
          } else {
              console.log('WebSocket: 收到自己加入游戏的消息，忽略UI更新');
          }
          break;
          
        case 'MOVE_UPDATE':
          console.log('WebSocket: 收到走棋更新', message);
          if (message.payload) {
              const moveInfo = message.payload.moveInfo;
              const latestGameState = message.payload.latestGameState;
              const moveHistory = message.payload.moveHistory;
              
              if (moveInfo) {
                  console.log('收到走棋:', moveInfo);
                  // 从服务器接收到的行棋信息
                  
                  // 如果移动不是由当前用户发起的，则更新界面
                  if (moveInfo.playerId !== this.currentUserId) {
                      // 更新界面提示 - 对手已走棋
                      uni.showToast({
                          title: '对手已走棋，轮到您下棋',
                          icon: 'none'
                      });
                      
                      // 发出走棋声音
                      this.playChessSound('move');
                  }
              }
              
              // 无论谁走的棋，都使用服务器返回的最新游戏状态更新棋盘
              if (latestGameState) {
                  this.updateGameViewFromServer(latestGameState);
              }
              
              // 直接从payload中获取moveHistory并更新走棋历史
              if (moveHistory && Array.isArray(moveHistory)) {
                  console.log('WebSocket: 从payload中获取到moveHistory，开始更新走棋历史:', moveHistory);
                  // 获取chessPiecesList，优先从latestGameState，如果没有则从payload
                  const chessPiecesList = (latestGameState && latestGameState.chessPiecesList) || message.payload.chessPiecesList;
                  this.updateMoveHistoryFromServer(moveHistory, chessPiecesList);
              }
          }
          break;
          
        case 'game_quit':
          console.log('WebSocket: 收到投降消息', message);
          this.handleGameQuitMessage(message);
          break;
          
        case 'draw_request':
          console.log('WebSocket: 收到和棋请求', message);
          this.handleDrawRequestMessage(message);
          break;
          
        case 'draw_request_sent':
          console.log('WebSocket: 和棋请求已发送', message);
          uni.showToast({
            title: '和棋请求已发送',
            icon: 'success'
          });
          break;
          
        case 'draw_accepted':
          console.log('WebSocket: 和棋被接受', message);
          this.handleDrawAcceptedMessage(message);
          break;
          
        case 'draw_rejected':
          console.log('WebSocket: 和棋被拒绝', message);
          uni.showToast({
            title: '对方拒绝了和棋请求',
            icon: 'none'
          });
          break;
          
        case 'draw_request_cancelled':
          console.log('WebSocket: 和棋请求被取消', message);
          uni.showToast({
            title: message.message || '和棋请求已被取消',
            icon: 'none'
          });
          break;
          
        case 'game_timeout':
          console.log('WebSocket: 收到游戏超时消息', message);
          this.handleGameTimeoutMessage(message);
          break;
        
        case 'GAME_END':
          console.log('WebSocket: 收到游戏结束消息', message);
          if (message.payload) {
              const result = message.payload.result;
              const winner = message.payload.winner;
              const winType = message.payload.winType || 'CHECKMATE';
              
              // 更新游戏结果
              this.gameResult = result; // 例如 "WHITE_WIN", "BLACK_WIN", "DRAW"
              
              // 根据结果更新界面
              let resultText = '游戏结束: ';
              if (result === 'WHITE_WIN') {
                  resultText += '白方获胜';
                  if (this.playAs === 'white') {
                      resultText += ' - 恭喜您赢了!';
                  } else {
                      resultText += ' - 您输了';
                  }
              } else if (result === 'BLACK_WIN') {
                  resultText += '黑方获胜';
                  if (this.playAs === 'black') {
                      resultText += ' - 恭喜您赢了!';
                  } else {
                      resultText += ' - 您输了';
                  }
              } else if (result === 'DRAW') {
                  resultText += '平局';
              }
              
              // 显示结果
              uni.showModal({
                  title: '游戏结束',
                  content: resultText,
                  showCancel: false,
                  success: () => {
                      // 可以在这里添加游戏结束后的操作，如返回主页等
                  }
              });
              
              // 停止所有计时器
              this.stopTimers();
          }
          break;
          
        // 新增: 处理GAME_OVER消息
        case 'GAME_OVER': 
          console.log('WebSocket: 收到GAME_OVER消息', message);
          if (message.payload) {
              const winner = message.payload.winner; // "BLACK" 或 "WHITE"
              const reason = message.payload.reason; // "CHECKMATE", "RESIGNATION", "TIMEOUT" 等
              
              // 停止所有计时器
              this.stopAllTimers();
              
              // 设置游戏结束状态
              this.gameEnded = true;
              
              // 根据胜方决定结果类型
              let resultType = 'draw'; // 默认为和棋
              if (winner === 'WHITE' && this.playAs === 'white' || 
                  winner === 'BLACK' && this.playAs === 'black') {
                  resultType = 'victory';
                  this.gameResult = `${this.playerName} 胜出 (${this.getReasonText(reason)})`;
              } else if (winner !== 'DRAW') {
                  resultType = 'defeat';
                  this.gameResult = `${this.opponentName} 胜出 (${this.getReasonText(reason)})`;
              } else {
                  this.gameResult = '和棋';
              }
              
              // 显示棋盘结算样式
              if (this.$refs.chessBoard) {
                // 根据原因显示不同的棋盘效果
                if (reason === 'CHECKMATE') {
                  // 将杀：显示将杀动画，失败方为输家
                  const loserColor = winner === 'WHITE' ? 'black' : 'white';
                  this.isCheckmated = true;
                  this.checkmateColor = loserColor;
                  this.$refs.chessBoard.showCheckmate(true, loserColor);
                } else {
                  // 其他原因（投降、超时等）：显示一般的游戏结束效果
                  this.$refs.chessBoard.showCheckmate(false, winner === 'WHITE' ? 'black' : 'white');
                }
              }
              
              // 进行积分结算
              this.calculateScoreChange(resultType, winner, reason).then(() => {
                  // 显示结果弹窗
                  this.showResultPopup(resultType);
              });
          }
          break;
          
        default:
          console.log('WebSocket: 未处理的消息类型', message.type);
      }
    },

    disconnectWebSocketInternal() {
      if (this.webSocketService.stompClient) {
        console.log('WebSocket: Disconnecting...');
        // unsubscribeFromTopic 会处理单个订阅的取消
        // disconnectWebSocket 会取消所有订阅并关闭连接
        disconnectWebSocket(); 
        this.webSocketService.stompClient = null;
        this.webSocketService.gameSubscription = null;
        this.webSocketService.gameIdForSubscription = null;
        console.log('WebSocket: Disconnected and cleaned up.');
      }
    },
    
    // 新增：根据服务器的 ChessGameVO 更新前端视图
    updateGameViewFromServer(gameState) {
      if (!gameState) {
        console.error('updateGameViewFromServer: gameState is null or undefined');
        return;
      }
      console.log('[DEBUG] updateGameViewFromServer - Received gameState:', JSON.parse(JSON.stringify(gameState)));
      console.log(`[DEBUG] updateGameViewFromServer - Before update: this.playAs=${this.playAs}, this.currentPlayer=${this.currentPlayer}`);

      // 1. 更新棋盘 (this.chessboard)
      // 根据实际的后端数据结构处理棋盘数据
      let boardUpdated = false;
      let oldBoard = JSON.stringify(this.chessboard); // 保存更新前的棋盘状态
      
      // 尝试从各种可能的字段获取棋盘数据
      if (gameState.boardVO && Array.isArray(gameState.boardVO)) {
        // 如果有标准格式的boardVO
        this.updateBoardFromBoardVO(gameState.boardVO);
        boardUpdated = true;
      } else if (gameState.pieces && Array.isArray(gameState.pieces)) {
        // 尝试从pieces数组更新棋盘
        this.updateBoardFromPieces(gameState.pieces);
        boardUpdated = true;
      } else if (gameState.boardLayout && Array.isArray(gameState.boardLayout)) {
        // 尝试从boardLayout更新棋盘
        this.updateBoardFromBoardLayout(gameState.boardLayout);
        boardUpdated = true;
      } else if (gameState.chess && gameState.chess.pieces) {
        // 尝试从嵌套的chess.pieces字段更新
        this.updateBoardFromPieces(gameState.chess.pieces);
        boardUpdated = true;
      } else if (gameState.chessBoard) {
        // 尝试从chessBoard字段更新
        this.updateBoardFromChessBoard(gameState.chessBoard);
        boardUpdated = true;
      } else if (gameState.chessPiecesList && Array.isArray(gameState.chessPiecesList)) {
        // 新增：处理后端返回的chessPiecesList格式
        this.updateBoardFromChessPiecesList(gameState.chessPiecesList);
        boardUpdated = true;
      } else {
        console.warn('无法从服务器数据中找到有效的棋盘信息:', gameState);
      }
      
      if (!boardUpdated) {
        console.warn('无法更新棋盘，未找到兼容的棋盘数据结构');
      } else {
        // 棋盘更新后，验证数据
        console.log('棋盘更新前的状态:', oldBoard);
        console.log('棋盘更新后的状态:', JSON.stringify(this.chessboard));
        
        // 验证是否有棋子
        let pieceCount = 0;
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            if (this.chessboard[i][j] !== null) {
              pieceCount++;
            }
          }
        }
        console.log(`最终棋盘上有${pieceCount}个棋子`);
        
        // 手动触发组件更新
        this.$nextTick(() => {
          if (this.$refs.chessBoard) {
            console.log('正在通知棋盘组件更新...');
            this.$refs.chessBoard.$forceUpdate();
          } else {
            console.error('找不到棋盘组件引用!');
          }
        });
      }

      // 2. 更新当前行棋方 (this.currentPlayer)
      // 处理currentTurn为数值的情况(1表示黑，2表示白)
      if (typeof gameState.currentTurn === 'number') {
        switch (gameState.currentTurn) {
          case 1:
            this.currentPlayer = 'black';
            break;
          case 2:
            this.currentPlayer = 'white';
            break;
          default:
            console.warn('未知的currentTurn值:', gameState.currentTurn);
        }
      } else if (typeof gameState.currentTurn === 'string') {
        // 如果是字符串格式，按原逻辑处理
        this.currentPlayer = gameState.currentTurn.toLowerCase();
      } else if (gameState.currentHoldChess) {
        // 尝试从currentHoldChess获取行棋方(1黑2白)
        this.currentPlayer = gameState.currentHoldChess === 1 ? 'black' : 'white';
      } else {
        console.warn('无法确定当前行棋方，无法从currentTurn或currentHoldChess获取信息');
      }
      
      // 重要：在this.currentPlayer更新后同步过路兵状态到cheesLogic.js
      this.syncEnPassantStateToLogic(gameState);

      // 3. 更新上一部棋 (this.lastMove) - 用于棋盘高亮
      if (gameState.lastMoveVO) {
        this.updateLastMoveFromVO(gameState.lastMoveVO);
      } else if (gameState.lastMove) {
        this.updateLastMoveFromVO(gameState.lastMove);
      }

      // 4. 更新游戏结果/状态
      this.updateGameStatusFromState(gameState);
      
      // 5. 更新计时器
      this.updateTimersFromState(gameState);
      
      // 6. 更新走棋历史记录
      if (gameState.moveHistory && Array.isArray(gameState.moveHistory)) {
        this.updateMoveHistoryFromServer(gameState.moveHistory, gameState.chessPiecesList);
      }
      
      // Mark game as started if it wasn't already by client logic
      if (!this.gameStarted && (gameState.gameStatus === 'ONGOING' || gameState.gameStatus === 1 || this.isCheckmated || this.gameResult)) {
          this.gameStarted = true;
      }
      
      // Force re-render if needed, though Vue should be reactive
      this.$forceUpdate();

      // 新增：处理轮到谁行棋的提示
      this.checkPlayerTurn(gameState);

      console.log(`[DEBUG] updateGameViewFromServer - After update: this.playAs=${this.playAs}, this.currentPlayer=${this.currentPlayer}`);
    },
    
    // 同步过路兵状态到cheesLogic.js
    syncEnPassantStateToLogic(gameState) { // gameState might be stale or not what's expected for currentPlayer logic here
      console.log(`[DEBUG syncEnPassantStateToLogic] Received gameState.currentTurn: ${gameState ? gameState.currentTurn : 'N/A'}, this.currentPlayer: ${this.currentPlayer}`);
      console.log('===== 同步过路兵状态到逻辑层 =====');
      console.log('Current this.chessboard state:', JSON.parse(JSON.stringify(this.chessboard)));
      
      // 首先检查是否有本地过路兵状态
      if (this.enPassantTarget) {
        console.log('- 发现本地过路兵状态，同步到逻辑层:', this.enPassantTarget);
        
        // 根据过路兵目标位置推断过路兵状态
        const enPassantRow = this.enPassantTarget.row;
        const enPassantCol = this.enPassantTarget.col;
        
        // 确定可以吃过路兵的颜色（与刚移动的兵颜色相反）
        let captureColor = null;
        const pawnRow = enPassantRow === 2 ? 3 : 4; // 过路兵目标在第3行时，兵在第4行；目标在第6行时，兵在第5行
        const pawnPiece = this.chessboard[pawnRow][enPassantCol];
        
        if (pawnPiece && getPieceType(pawnPiece) === 'pawn') {
          const pawnColor = getPieceColor(pawnPiece);
          captureColor = pawnColor === 'white' ? 'black' : 'white';
          
          console.log(`- 检测到过路兵: 位置(${pawnRow},${enPassantCol}), 颜色${pawnColor}, 可被${captureColor}吃掉`);
          
          // 设置过路兵状态
          chessBoardState.enPassant = {
            row: enPassantRow,
            col: enPassantCol,
            captureColor: captureColor
          };
          
          console.log('- 已设置过路兵状态:', chessBoardState.enPassant);
        } else {
          console.log('- 未找到对应的兵，清除过路兵状态');
          chessBoardState.enPassant = null;
        }
      } else {
        // 如果没有本地过路兵状态，尝试从棋盘状态推断
        console.log('- 无本地过路兵状态，尝试从棋盘状态推断');
        
        // 检查是否有可能的过路兵情况
        // 白兵在第4行，黑兵在旁边的第4行，说明黑兵可能刚刚走了双格
        // 黑兵在第5行，白兵在旁边的第5行，说明白兵可能刚刚走了双格
        let foundEnPassant = false;
        
        // 检查白兵是否可以吃过路兵（黑兵在第4行）
        // Use this.currentPlayer which should be correctly set by updateGameViewFromServer
        if (this.currentPlayer === 'white') {
          console.log('[DEBUG EnPassant Logic] Current player is WHITE, checking for black pawns on row 3 (0-indexed)');
          for (let col = 0; col < 8; col++) {
            const piece = this.chessboard[3][col]; // Correctly check row 3 for black pawns
            console.log(`[DEBUG EnPassant White] Checking col ${col} on row 3: piece is ${piece}, pieceType: ${getPieceType(piece)}, pieceColor: ${getPieceColor(piece)}`);

            if (piece && getPieceType(piece) === 'pawn' && getPieceColor(piece) === 'black') {
              console.log(`[DEBUG EnPassant White] Found black pawn at (3, ${col}). Checking neighbors on row 3.`);
              const leftNeighbor = col > 0 ? this.chessboard[3][col-1] : 'N/A';
              const rightNeighbor = col < 7 ? this.chessboard[3][col+1] : 'N/A';
              const leftCondition = col > 0 && this.chessboard[3][col-1] && getPieceType(this.chessboard[3][col-1]) === 'pawn' && getPieceColor(this.chessboard[3][col-1]) === 'white';
              const rightCondition = col < 7 && this.chessboard[3][col+1] && getPieceType(this.chessboard[3][col+1]) === 'pawn' && getPieceColor(this.chessboard[3][col+1]) === 'white';
              console.log(`[DEBUG EnPassant White] Left neighbor (3, ${col-1}): ${leftNeighbor}, Condition: ${leftCondition}`);
              console.log(`[DEBUG EnPassant White] Right neighbor (3, ${col+1}): ${rightNeighbor}, Condition: ${rightCondition}`);
              
              if (leftCondition || rightCondition) {
                const enPassantRow = 2; // Target row for white capturing en passant
                const enPassantCol = col;
                console.log(`- 推断出可能的过路兵: 黑兵在(3,${col}), 目标位置(${enPassantRow},${enPassantCol}), 可被white吃掉`);
                chessBoardState.enPassant = {
                  row: enPassantRow,
                  col: enPassantCol,
                  captureColor: 'white'
                };
                console.log('- 已设置推断的过路兵状态:', chessBoardState.enPassant);
                foundEnPassant = true;
                break;
              } else {
                console.log(`[DEBUG EnPassant White] No white pawn found next to black pawn at (3, ${col})`);
              }
            }
          }
        } 
        // 检查黑兵是否可以吃过路兵（白兵在第5行）
        // Use this.currentPlayer which should be correctly set by updateGameViewFromServer
        else if (this.currentPlayer === 'black') {
          console.log('[DEBUG EnPassant Logic] Current player is BLACK, checking for white pawns on row 4 (0-indexed)');
          for (let col = 0; col < 8; col++) {
            const piece = this.chessboard[4][col];
            console.log(`[DEBUG EnPassant Black] Checking col ${col}: piece is ${piece}, pieceType: ${getPieceType(piece)}, pieceColor: ${getPieceColor(piece)}`);

            if (piece && getPieceType(piece) === 'pawn' && getPieceColor(piece) === 'white') {
              console.log(`[DEBUG EnPassant Black] Found white pawn at (4, ${col}). Checking neighbors.`);
              const leftNeighbor = col > 0 ? this.chessboard[4][col-1] : 'N/A';
              const rightNeighbor = col < 7 ? this.chessboard[4][col+1] : 'N/A';
              const leftCondition = col > 0 && this.chessboard[4][col-1] && getPieceType(this.chessboard[4][col-1]) === 'pawn' && getPieceColor(this.chessboard[4][col-1]) === 'black';
              const rightCondition = col < 7 && this.chessboard[4][col+1] && getPieceType(this.chessboard[4][col+1]) === 'pawn' && getPieceColor(this.chessboard[4][col+1]) === 'black';
              console.log(`[DEBUG EnPassant Black] Left neighbor (4, ${col-1}): ${leftNeighbor}, Condition: ${leftCondition}`);
              console.log(`[DEBUG EnPassant Black] Right neighbor (4, ${col+1}): ${rightNeighbor}, Condition: ${rightCondition}`);
              
              if (leftCondition || rightCondition) {
                const enPassantRow = 5;
                const enPassantCol = col;
                console.log(`- 推断出可能的过路兵: 白兵在(4,${col}), 目标位置(${enPassantRow},${enPassantCol}), 可被black吃掉`);
                chessBoardState.enPassant = {
                  row: enPassantRow,
                  col: enPassantCol,
                  captureColor: 'black'
                };
                console.log('- 已设置推断的过路兵状态:', chessBoardState.enPassant);
                foundEnPassant = true;
                break;
              } else {
                console.log(`[DEBUG EnPassant Black] No black pawn found next to white pawn at (4, ${col})`);
              }
            }
          }
        }
        
        // 如果没有找到可能的过路兵情况，清除过路兵状态
        if (!foundEnPassant) {
          console.log('- 未推断出过路兵状态，清除逻辑层过路兵状态');
          chessBoardState.enPassant = null;
        }
      }
      
      console.log('===== 过路兵状态同步完成 =====');
    },
    
    // 新增: 判断当前轮次并显示对应提示
    checkPlayerTurn(gameState) {
      if (!gameState) return;
      console.log('[DEBUG] checkPlayerTurn - Received gameState:', JSON.parse(JSON.stringify(gameState)));
      
      // 获取当前用户的棋子颜色和当前轮次
      // gameState.currentHoldChess: 1表示黑，2表示白
      // gameState.currentTurn: 1表示黑，2表示白
      const myActualHoldChess = gameState.currentUserId === this.currentUserId ? gameState.currentHoldChess : (gameState.currentHoldChess === 1 ? 2 : 1);
      const myChessColor = myActualHoldChess === 1 ? 'black' : 'white';
      const currentTurnColor = gameState.currentTurn === 1 ? 'black' : 'white';
      
      // 判断是否是当前用户的回合
      const isMyTurn = currentTurnColor === myChessColor;
      
      console.log(`[DEBUG] checkPlayerTurn - My User ID: ${this.currentUserId}, GameState User ID: ${gameState.currentUserId}`);
      console.log(`[DEBUG] checkPlayerTurn - GameState: currentHoldChess=${gameState.currentHoldChess} (1黑2白), currentTurn=${gameState.currentTurn} (1黑2白)`);
      console.log(`[DEBUG] checkPlayerTurn - Deduced: myActualHoldChess=${myActualHoldChess} (1黑2白) -> myChessColor='${myChessColor}', currentTurnColor='${currentTurnColor}', isMyTurn=${isMyTurn}`);
      
      // 显示对应提示
      if (isMyTurn) {
        // 是当前用户的回合，显示轮到您行棋的提示
        uni.showToast({
          title: '轮到您行棋',
          icon: 'none',
          duration: 1500
        });
        
        // 启动玩家计时器
        if (myChessColor === 'white') {
          this.startWhiteTimer();
        } else {
          this.startBlackTimer();
        }
      } else {
        // 不是当前用户的回合，显示等待对手行棋的提示
        uni.showToast({
          title: '等待对手行棋',
          icon: 'none',
          duration: 1500
        });
        
        // 启动对手计时器
        if (currentTurnColor === 'white') {
          this.startWhiteTimer();
        } else {
          this.startBlackTimer();
        }
      }
      
      // 更新playAs属性，确保与服务器保持一致
      this.playAs = myChessColor;
    },
    
    // 从boardVO更新棋盘
    updateBoardFromBoardVO(boardVO) {
      // 假设boardVO是一个8x8二维数组
      try {
        this.chessboard = JSON.parse(JSON.stringify(boardVO));
        return true;
      } catch (e) {
        console.error('解析boardVO时出错:', e);
        return false;
      }
    },
    
    // 从棋子列表更新棋盘 
    updateBoardFromPieces(pieces) {
      try {
        // 创建空棋盘
        const newBoard = [];
        for (let i = 0; i < 8; i++) {
          newBoard[i] = Array(8).fill(null);
        }
        
        // 填充棋子
        pieces.forEach(p => {
          // 假设格式为 {position: "e4", type: "PAWN", color: "WHITE"}
          if (p.position && p.position.length >= 2) {
            const col = this.columns.indexOf(p.position.charAt(0).toLowerCase());
            const row = 8 - parseInt(p.position.charAt(1));
            
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
              newBoard[row][col] = {
                type: p.type.toLowerCase(),
                color: p.color.toLowerCase(),
                id: `${p.color.charAt(0).toLowerCase()}${p.type.charAt(0).toUpperCase()}_${p.position}`
              };
            }
          }
        });
        
        this.chessboard = newBoard;
        return true;
      } catch (e) {
        console.error('从pieces更新棋盘时出错:', e);
        return false;
      }
    },
    
    // 从boardLayout更新棋盘
    updateBoardFromBoardLayout(boardLayout) {
      try {
        // 假设boardLayout是二维数组，例如[["bR","bN",...],...]
        const newBoard = boardLayout.map(row => row.map(cell => {
          if (!cell || cell === '') return null;
          
          const color = cell.charAt(0) === 'w' ? 'white' : 'black';
          const typeChar = cell.charAt(1);
          let type = '';
          
          switch(typeChar) {
            case 'P': type = 'pawn'; break;
            case 'R': type = 'rook'; break;
            case 'N': type = 'knight'; break;
            case 'B': type = 'bishop'; break;
            case 'Q': type = 'queen'; break;
            case 'K': type = 'king'; break;
            default: return null;
          }
          
          return { 
            type, 
            color, 
            id: `${color.charAt(0)}${type.charAt(0).toUpperCase()}_${Math.random().toString(36).substring(2, 8)}`
          };
        }));
        
        this.chessboard = newBoard;
        return true;
      } catch (e) {
        console.error('从boardLayout更新棋盘时出错:', e);
        return false;
      }
    },
    
    // 从chessBoard更新棋盘(可能是FEN字符串或其他格式)
    updateBoardFromChessBoard(chessBoard) {
      try {
        // 如果是字符串，可能是FEN表示法
        if (typeof chessBoard === 'string') {
          // 简化的FEN解析，仅展示思路
          const fenRows = chessBoard.split(' ')[0].split('/');
          const newBoard = [];
          
          for (let i = 0; i < 8; i++) {
            const boardRow = [];
            let j = 0;
            for (let c of fenRows[i]) {
              if (c >= '1' && c <= '8') {
                // 数字表示连续的空格
                const emptyCount = parseInt(c);
                for (let k = 0; k < emptyCount; k++) {
                  boardRow.push(null);
                }
                j += emptyCount;
              } else {
                // 字母表示棋子
                const isUpper = c === c.toUpperCase();
                const color = isUpper ? 'white' : 'black';
                let type = '';
                
                switch(c.toUpperCase()) {
                  case 'P': type = 'pawn'; break;
                  case 'R': type = 'rook'; break;
                  case 'N': type = 'knight'; break;
                  case 'B': type = 'bishop'; break;
                  case 'Q': type = 'queen'; break;
                  case 'K': type = 'king'; break;
                }
                
                boardRow.push({
                  type,
                  color,
                  id: `${color.charAt(0)}${type.charAt(0).toUpperCase()}_${i}_${j}`
                });
                j++;
              }
            }
            newBoard.push(boardRow);
          }
          
          this.chessboard = newBoard;
          return true;
        } else if (typeof chessBoard === 'object') {
          // 其他可能的对象格式...
          console.warn('未知的chessBoard对象格式:', chessBoard);
          return false;
        }
        
        return false;
      } catch (e) {
        console.error('从chessBoard更新棋盘时出错:', e);
        return false;
      }
    },
    
    // 更新最后一步棋
    updateLastMoveFromVO(lastMoveVO) {
      try {
        if (lastMoveVO.fromPosition && lastMoveVO.toPosition) {
          // 格式为"e2"的情况
          if (typeof lastMoveVO.fromPosition === 'string' && lastMoveVO.fromPosition.length >= 2) {
            const fromCol = this.columns.indexOf(lastMoveVO.fromPosition.charAt(0).toLowerCase());
            const fromRow = 8 - parseInt(lastMoveVO.fromPosition.charAt(1));
            const toCol = this.columns.indexOf(lastMoveVO.toPosition.charAt(0).toLowerCase());
            const toRow = 8 - parseInt(lastMoveVO.toPosition.charAt(1));
            
            if (fromCol >= 0 && toCol >= 0) {
              this.lastMove = {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                piece: lastMoveVO.pieceMoved ? {
                  type: lastMoveVO.pieceMoved.type?.toLowerCase() || '',
                  color: lastMoveVO.pieceMoved.color?.toLowerCase() || ''
                } : { type: '', color: '' }
              };
            }
          } 
          // 其他格式的处理...
        }
      } catch (e) {
        console.error('更新lastMove时出错:', e);
        this.lastMove = null;
      }
    },
    
    // 更新游戏状态
    updateGameStatusFromState(gameState) {
      try {
        // 游戏状态可能是字符串或数字
        if (gameState.gameStatus) {
          const status = gameState.gameStatus;
          
          // 如果是数字格式
          if (typeof status === 'number') {
            switch(status) {
              case 1: // 假设1表示进行中
                this.isCheckmated = false;
                this.checkmateColor = '';
                this.gameResult = null;
                break;
              case 2: // 假设2表示白方胜
                this.isCheckmated = true;
                this.checkmateColor = 'black'; // 黑方被将死
                this.gameResult = `${this.playAs === 'white' ? this.playerName : this.opponentName} 胜出 (将杀)`;
                this.handleGameEnd(this.playAs === 'white' ? 'victory' : 'defeat');
                break;
              case 3: // 假设3表示黑方胜
                this.isCheckmated = true;
                this.checkmateColor = 'white'; // 白方被将死
                this.gameResult = `${this.playAs === 'black' ? this.playerName : this.opponentName} 胜出 (将杀)`;
                this.handleGameEnd(this.playAs === 'black' ? 'victory' : 'defeat');
                break;
              case 4: // 假设4表示和棋
                this.gameResult = '和棋';
                this.handleGameEnd('draw');
                break;
            }
          } else if (typeof status === 'string') {
            // 原来的字符串处理逻辑
            switch(status) {
              case 'ONGOING':
                this.isCheckmated = false;
                this.checkmateColor = '';
                this.gameResult = null;
                break;
              case 'CHECKMATE_WHITE_WINS':
                this.isCheckmated = true;
                this.checkmateColor = 'black'; // 黑方被将死
                this.gameResult = `${this.playAs === 'white' ? this.playerName : this.opponentName} 胜出 (将杀)`;
                this.handleGameEnd(this.playAs === 'white' ? 'victory' : 'defeat');
                break;
              case 'CHECKMATE_BLACK_WINS':
                this.isCheckmated = true;
                this.checkmateColor = 'white'; // 白方被将死
                this.gameResult = `${this.playAs === 'black' ? this.playerName : this.opponentName} 胜出 (将杀)`;
                this.handleGameEnd(this.playAs === 'black' ? 'victory' : 'defeat');
                break;
              case 'STALEMATE':
                this.gameResult = '和棋 (逼和)';
                this.handleGameEnd('draw');
                break;
            }
          }
        }
      } catch (e) {
        console.error('更新游戏状态时出错:', e);
      }
    },
    
    // 更新计时器
    updateTimersFromState(gameState) {
      try {
        // 如果游戏结束，停止所有计时器
        if (this.isCheckmated || this.gameResult) {
          this.stopAllTimers();
          return;
        }
        
        // 根据当前行棋方启动对应的计时器
        // Use this.currentPlayer which should be correctly set by updateGameViewFromServer
        if (this.currentPlayer === 'white') {
          this.startWhiteTimer();
        } else if (this.currentPlayer === 'black') {
          this.startBlackTimer();
        }
        
        // 如果服务器提供了剩余时间信息，更新计时器
        if (gameState.whiteTimeRemaining) {
          this.playerTimeRemaining = this.playAs === 'white' ? gameState.whiteTimeRemaining : this.playerTimeRemaining;
          this.opponentTimeRemaining = this.playAs === 'black' ? gameState.whiteTimeRemaining : this.opponentTimeRemaining;
        }
        
        if (gameState.blackTimeRemaining) {
          this.playerTimeRemaining = this.playAs === 'black' ? gameState.blackTimeRemaining : this.playerTimeRemaining;
          this.opponentTimeRemaining = this.playAs === 'white' ? gameState.blackTimeRemaining : this.opponentTimeRemaining;
        }
      } catch (e) {
        console.error('更新计时器时出错:', e);
      }
    },
    
    // 新增：根据邀请ID获取游戏ID的方法
    getGameIdFromInvitation(inviteId) {
      if (!inviteId) {
        console.error('获取游戏ID失败：inviteId为空');
        return Promise.resolve(null);
      }
      
      console.log('尝试从邀请ID获取游戏ID:', inviteId);
      return getGameIdByInviteId(inviteId).then(res => {
        if (res.success && res.result) {
          // 根据API返回格式提取gameId
          const gameId = res.result.id || res.result;
          console.log('成功获取到游戏ID:', gameId);
          return gameId;
        } else {
          console.error('获取游戏ID失败:', res.message);
          return null;
        }
      }).catch(err => {
        console.error('获取游戏ID异常:', err);
        return null;
      });
    },
    
    // 新增：从chessPiecesList更新棋盘
    updateBoardFromChessPiecesList(chessPiecesList) {
      try {
        // 创建空棋盘
        const newBoard = [];
        for (let i = 0; i < 8; i++) {
          newBoard[i] = Array(8).fill(null);
        }
        
        console.log('开始从chessPiecesList填充棋盘，共有棋子:', chessPiecesList.length);
        
        // 遍历棋子列表填充棋盘
        chessPiecesList.forEach(piece => {
          if (piece.positionX && piece.positionY) {
            // 确保字母大小写匹配
            const positionX = piece.positionX.toLowerCase();
            const col = this.columns.indexOf(positionX);
            // 国际象棋棋盘的行号是从底部开始的，8对应索引0
            const row = 8 - parseInt(piece.positionY);
            
            console.log(`处理棋子: ${piece.chessPiecesName}, 颜色: ${piece.piecesType}, 位置: ${positionX}${piece.positionY} -> 行${row}列${col}`);
            
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
              // 根据piecesType确定棋子颜色：1为黑色，2为白色
              const color = piece.piecesType === 1 ? 'black' : 'white';
              
              // 将chessPiecesName转换为前端使用的type小写格式
              let type = '';
              switch(piece.chessPiecesName.toLowerCase()) {
                case 'king': type = 'king'; break;
                case 'queen': type = 'queen'; break;
                case 'rook': type = 'rook'; break;
                case 'bishop': type = 'bishop'; break;
                case 'knight': type = 'knight'; break;
                case 'pawn': type = 'pawn'; break;
                default: type = piece.chessPiecesName.toLowerCase();
              }
              
              // 修改：使用ChessBoard组件期望的字符串格式，而不是对象
              newBoard[row][col] = `${color}-${type}`;
              
              // 棋子信息
              console.log(`放置棋子: ${newBoard[row][col]} 在位置 [${row}][${col}]`);
            } else {
              console.error(`棋子位置超出棋盘范围: ${positionX}${piece.positionY} -> 行${row}列${col}`);
            }
          } else {
            console.warn('棋子缺少位置信息:', piece);
          }
        });
        
        // 检查棋盘是否正确填充
        let pieceCount = 0;
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            if (newBoard[i][j] !== null) {
              pieceCount++;
            }
          }
        }
        console.log(`棋盘填充完成，共放置${pieceCount}个棋子，预期应有${chessPiecesList.length}个`);
        
        // 确认this.columns的值
        console.log('columns数组:', this.columns);
        
        this.chessboard = newBoard;
        console.log('成功从chessPiecesList更新棋盘');
        return true;
      } catch (e) {
        console.error('从chessPiecesList更新棋盘时出错:', e);
        return false;
      }
    },
    
    // 新增：从服务器更新走棋历史记录
    updateMoveHistoryFromServer(serverMoveHistory, chessPiecesList = null) {
      try {
        console.log('开始更新走棋历史，服务器数据:', serverMoveHistory);
        
        // 清空现有的走棋历史
        this.moveHistory = [];
        this.formattedMoveHistory = [];
        
        // 按照createTime排序，确保走棋顺序正确
        const sortedMoves = serverMoveHistory.sort((a, b) => {
          return new Date(a.createTime) - new Date(b.createTime);
        });
        
        console.log('排序后的走棋历史:', sortedMoves);
        
        // 创建棋子ID到棋子信息的映射
        const pieceMap = new Map();
        if (chessPiecesList && Array.isArray(chessPiecesList)) {
          chessPiecesList.forEach(piece => {
            pieceMap.set(piece.id, piece);
          });
        }
        
        // 将服务器的走棋记录转换为前端格式
        sortedMoves.forEach((move, index) => {
          // 转换棋子类型
          const pieceTypeMap = {
            1: 'black', // 黑方
            2: 'white'  // 白方
          };
          
          const color = pieceTypeMap[move.piecesType] || 'white';
          
          // 根据chessPiecesId获取棋子类型
          let pieceType = 'pawn'; // 默认为兵
          if (move.chessPiecesId && pieceMap.has(move.chessPiecesId)) {
            const pieceInfo = pieceMap.get(move.chessPiecesId);
            const chessPiecesName = pieceInfo.chessPiecesName.toLowerCase();
            switch(chessPiecesName) {
              case 'king': pieceType = 'king'; break;
              case 'queen': pieceType = 'queen'; break;
              case 'rook': pieceType = 'rook'; break;
              case 'bishop': pieceType = 'bishop'; break;
              case 'knight': pieceType = 'knight'; break;
              case 'pawn': pieceType = 'pawn'; break;
              default: pieceType = 'pawn';
            }
          }
          
          // 构造走法字符串
          const fromPos = `${move.fromPositionX}${move.fromPositionY}`;
          const toPos = `${move.toPositionX}${move.toPositionY}`;
          const moveNotation = `${fromPos}-${toPos}`;
          
          // 计算用时（使用moveDurationSeconds字段）
          let timeUsed = '00:00';
          if (move.moveDurationSeconds) {
            // 如果是浮点数，直接显示秒数格式（如"6.7s"）
            if (move.moveDurationSeconds < 60) {
              timeUsed = `${move.moveDurationSeconds}s`;
            } else {
              // 超过60秒时，转换为mm:ss.x格式
              const minutes = Math.floor(move.moveDurationSeconds / 60);
              const seconds = (move.moveDurationSeconds % 60).toFixed(1);
              timeUsed = `${minutes.toString().padStart(2, '0')}:${seconds.padStart(4, '0')}`;
            }
          } else if (move.createTime) {
            // 如果没有moveDurationSeconds，使用默认值
            timeUsed = '00:05';
          }
          
          // 添加到原始走棋历史
          this.moveHistory.push({
            id: move.id,
            from: { x: move.fromPositionX, y: move.fromPositionY },
            to: { x: move.toPositionX, y: move.toPositionY },
            piece: { type: pieceType, color: color },
            captured: move.tookPiecesId ? true : false,
            time: timeUsed,
            createTime: move.createTime
          });
          
          // 构造格式化的走棋历史（用于显示）
          // 简化逻辑：按照走棋顺序分配，每两步为一个回合
          const isWhiteMove = (color === 'white');
          
          // 计算回合数：白方走棋时回合数向上取整，黑方走棋时回合数向下取整
          let moveNumber;
          if (isWhiteMove) {
            // 白方走棋：1,3,5,7... -> 回合 1,2,3,4...
            moveNumber = Math.floor(index / 2) + 1;
          } else {
            // 黑方走棋：2,4,6,8... -> 回合 1,2,3,4...
            moveNumber = Math.floor((index + 1) / 2);
          }
          
          // 查找或创建对应回合的记录
          let roundRecord = this.formattedMoveHistory.find(record => record.moveNumber === moveNumber);
          if (!roundRecord) {
            roundRecord = {
              moveNumber: moveNumber,
              white: null,
              black: null
            };
            this.formattedMoveHistory.push(roundRecord);
          }
          
          // 构造走法显示对象
          const moveDisplay = {
            notation: moveNotation,
            piece: `${color}-${pieceType}`,
            time: timeUsed,
            captured: move.tookPiecesId ? true : false
          };
          
          // 根据颜色分配到对应位置
          if (isWhiteMove) {
            roundRecord.white = moveDisplay;
          } else {
            roundRecord.black = moveDisplay;
          }
        });
        
        // 按回合号排序
        this.formattedMoveHistory.sort((a, b) => a.moveNumber - b.moveNumber);
        
        console.log('更新后的格式化走棋历史:', this.formattedMoveHistory);
        
        // 强制更新MatchTab组件
        this.$nextTick(() => {
          this.$forceUpdate();
        });
        
      } catch (error) {
        console.error('更新走棋历史时出错:', error);
      }
    },
    
    // 新增: 获取对应中文原因
    getReasonText(reason) {
      const reasonMap = {
        'CHECKMATE': '将杀',
        'RESIGNATION': '认输',
        'TIMEOUT': '超时',
        'STALEMATE': '逼和',
        'DRAW_AGREEMENT': '和棋协议',
        'FIFTY_MOVE_RULE': '五十回合规则',
        'THREEFOLD_REPETITION': '三次重复'
      };
      return reasonMap[reason] || reason;
    },
    
    // 新增: 计算积分变化
    calculateScoreChange(resultType, winner, reason) {
      // 如果不是排位赛，不计算积分
      if (!this.isLeaderboardMode) {
        return Promise.resolve();
      }
      
      // 根据结果类型计算积分变化
      let scoreChange = 0;
      
      switch(resultType) {
        case 'victory':
          // 胜利基础分15分，根据对手积分可能有额外加成
          const baseWinPoints = 15;
          const difficultyBonus = Math.max(0, Math.floor((this.opponentRating - this.playerRating) / 100));
          scoreChange = baseWinPoints + difficultyBonus;
          break;
          
        case 'defeat':
          // 失败基础扣10分，根据对手积分可能有减免
          const baseLossPoints = -10;
          const skillGap = Math.min(5, Math.max(0, Math.floor((this.opponentRating - this.playerRating) / 150)));
          scoreChange = baseLossPoints + skillGap; // 负数表示减分
          break;
          
        case 'draw':
          // 和棋积分变化较小
          const ratingDiff = this.opponentRating - this.playerRating;
          if (ratingDiff > 100) {
            // 如果对手积分明显高，和棋算小胜，加少量分
            scoreChange = 5;
          } else if (ratingDiff < -100) {
            // 如果对手积分明显低，和棋算小负，减少量分
            scoreChange = -3;
          } else {
            // 实力相当，和棋不变分或微调
            scoreChange = Math.floor(Math.random() * 3) - 1; // -1到1之间的随机数
          }
          break;
      }
      
      // 保存当前分数和变化
      this.ratingChange = {
        before: this.playerRating,
        after: this.playerRating + scoreChange,
        change: scoreChange
      };
      
      // 调用积分更新API
      return this.updatePlayerScoreInGame(scoreChange, resultType);
    },
    
    // 游戏结算时更新玩家积分
    async updatePlayerScoreInGame(scoreChange, gameResult) {
      if (!this.currentUserId) {
        console.error('无法更新积分: 缺少用户ID');
        return;
      }
      
      try {
        // 1. 更新玩家总积分
        const scoreUpdateData = {
          userId: this.currentUserId,
          userAccount: this.currentUserAccount,
          score: this.playerRating + scoreChange
        };
        
        const updateRes = await updatePlayerScore(scoreUpdateData);
        
        if (updateRes.success) {
          console.log('积分更新成功:', updateRes);
          
          // 2. 添加积分变化记录
          const scoreRecordData = {
            chessPlayerId: this.currentUserId,
            chessGameId: this.currentGameId || 'ladder_' + Date.now(), // 如果没有游戏ID，生成一个临时ID
            score: scoreChange,
            gameResult: gameResult, // 记录游戏结果
            opponentName: this.opponentName,
            opponentRating: this.opponentRating
          };
          
          const recordRes = await addPlayerScoreRecord(scoreRecordData);
          
          if (recordRes.success) {
            console.log('积分记录添加成功:', recordRes);
            
            // 更新本地积分显示
            this.playerRating += scoreChange;
            
          } else {
            console.error('积分记录添加失败:', recordRes.message);
          }
          
        } else {
          console.error('积分更新失败:', updateRes.message);
          throw new Error(updateRes.message);
        }
        
      } catch (error) {
        console.error('积分结算过程中发生错误:', error);
        throw error;
      }
    },
    
    // 新增: 更新玩家积分（保留原有方法用于其他场景）
    updatePlayerScore(scoreChange) {
      if (!this.currentUserId || !this.currentGameId) {
        console.error('无法更新积分: 缺少用户ID或游戏ID');
        return Promise.resolve();
      }
      
      // 1. 更新玩家总积分
      const scoreUpdateData = {
        userId: this.currentUserId,
        userAccount: this.currentUserAccount,
        score: this.playerRating + scoreChange
      };
      
      // 2. 添加积分变化记录
      const scoreRecordData = {
        chessPlayerId: this.currentUserId,
        chessGameId: this.currentGameId,
        score: scoreChange
      };
      
      return new Promise((resolve, reject) => {
        // 1. 先更新积分总数
        updatePlayerScore(scoreUpdateData)
          .then(res => {
            if (res.success) {
              console.log('积分更新成功:', res);
              
              // 2. 添加积分记录
              return addPlayerScoreRecord(scoreRecordData);
            } else {
              console.error('积分更新失败:', res.message);
              return Promise.reject(res.message);
            }
          })
          .then(recordRes => {
            if (recordRes.success) {
              console.log('积分记录添加成功:', recordRes);
              
              // 更新本地积分显示
              this.playerRating += scoreChange;
              
              resolve();
            } else {
              console.error('积分记录添加失败:', recordRes.message);
              reject(recordRes.message);
            }
          })
          .catch(err => {
            console.error('积分处理出错:', err);
            // 即使有错误也继续显示结果界面
            resolve();
          });
      });
    },
    
    // 处理再战一局按钮
    handleRematch() {
      // 关闭结果弹窗
      this.closeResultPopup();
      
      // 如果是好友对战模式
      if (this.selectedOpponent) {
        // 延迟一下再邀请
        setTimeout(() => {
          if (this.selectedOpponent) {
            // 交换黑白棋色再邀请
            const newPlayAs = this.playAs === 'white' ? 'black' : 'white';
            
            // 构造邀请信息
            const inviteInfo = {
              timeControl: this.timeControl,
              playAs: newPlayAs,
              gameMode: this.gameMode
            };
            
            // 重新邀请同一位好友
            this.inviteFriend(this.selectedOpponent, inviteInfo);
          }
        }, 300);
      } 
      // 如果是天梯赛模式
      else if (this.isLeaderboardMode) {
        // 重置界面并启动新的天梯匹配
        this.resetForNewGame();
        setTimeout(() => {
          this.playLeaderboard();
        }, 300);
      } 
      // 普通匹配模式
      else {
        // 重置界面并启动新的匹配
        this.resetForNewGame();
        this.startGame();
      }
    },

    // 重置界面为新游戏状态
    resetForNewGame() {
      // 关闭结果弹窗
      this.closeResultPopup();
      
      // 清除游戏结果和将军标记
      this.gameResult = null;
      this.isCheckmated = false;
      this.checkmateColor = '';
      
      // 重置棋盘
      this.resetBoard();
      
      // 重置计时器
      this.playerTimeRemaining = 600; // 10分钟
      this.opponentTimeRemaining = 600;
      
      // 停止所有计时器
      this.stopAllTimers();
      
      // 重置WebSocket
      this.disconnectWebSocketInternal();
      
      // 切换到新游戏标签页
      this.activeTab = 'newGame';
      this.gameStarted = false;
    },
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/chess/chess-common.scss";

// 对战区域样式
.battle-area {
  display: flex;
  flex-direction: column;
  padding: 20rpx 10rpx;
  
  .board-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20rpx 0;
  }
}

// 返回按钮
.back-button {
  position: fixed;
  top: 40rpx;
  left: 20rpx;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
  z-index: 999;
}



// 添加胜负弹窗样式
.result-popup {
  width: 550rpx;
  padding: 40rpx 20rpx;
  border-radius: 20rpx;
  position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
  
  
  .result-icon {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 20rpx;
    
    image {
      width: 100%;
      height: 100%;
    }
  }
  
  .result-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #fff;
        margin-bottom: 10rpx;
      }
      
  .result-description {
    font-size: 30rpx;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 30rpx;
  }
  
  .result-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    
    .action-btn {
      height: 80rpx;
      line-height: 80rpx;
      text-align: center;
      border-radius: 10rpx;
      font-size: 28rpx;
      margin-bottom: 16rpx;
    }
    
    .primary-btn {
      background-color: #81B64C;
      color: #fff;
    }
    
    .secondary-btn {
      background-color: #555;
      color: #fff;
    }
  }
  
  .popup-close {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    width: 60rpx;
    height: 60rpx;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.victory-popup {
  background-color: rgba(0, 0, 0, 0.85);
  .result-title {
    color: #81B64C
  }
}

.defeat-popup {
  background-color: rgba(0, 0, 0, 0.85);
  
  .result-title {
    color: #999;
  }
}

.draw-popup {
  background-color: rgba(0, 0, 0, 0.85);
  .result-title {
    color: #EEE;
  }
}

// 天梯赛结果弹窗中的积分变化样式
.rating-display {
  margin: 20rpx 0;
  background-color: #333a46;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  width: 80%;
}

.rating-label {
  font-size: 26rpx;
  color: #b0b8c8;
  margin-bottom: 12rpx;
  display: block;
}

.rating-value-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rating-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
}

.rating-change {
  margin-left: 16rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.rating-change.positive {
  background-color: #4caf50;
  color: #ffffff;
}

.rating-change.negative {
  background-color: #f44336;
  color: #ffffff;
}

.rating-change.neutral {
  background-color: #607d8b;
  color: #ffffff;
}

/* 再战一局按钮 */
.action-btn.primary-btn {
  background-color: #4e8ef7;
  border: none;
}

/* 回到首页按钮 */
.action-btn.secondary-btn {
  background-color: #333a46;
  border: 1px solid #4e8ef7;
}

/* 对局总结弹窗样式 */
.summary-popup {
  width: 90vw;
  max-width: 500px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 20rpx;
  padding: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  
  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 40rpx 50rpx 30rpx;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .summary-title {
      font-size: 40rpx;
      font-weight: bold;
      color: #fff;
    }
    
    .popup-close {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      
      &:active {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(0.95);
      }
    }
  }
  
  .summary-content {
    flex: 1;
    padding: 40rpx 50rpx;
    min-height: 600rpx;
    max-height: 50vh;
    
    .summary-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400rpx;
      
      .loading-spinner {
        width: 80rpx;
        height: 80rpx;
        border: 6rpx solid rgba(255, 255, 255, 0.3);
        border-top: 6rpx solid #4CAF50;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 30rpx;
      }
      
      .loading-text {
        color: #fff;
        font-size: 32rpx;
        opacity: 0.8;
      }
    }
  }
  
  .summary-actions {
    display: flex;
    gap: 30rpx;
    padding: 30rpx 50rpx 50rpx;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    .action-btn {
      flex: 1;
      padding: 24rpx 40rpx;
      border-radius: 24rpx;
      text-align: center;
      font-size: 32rpx;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &.primary-btn {
        background-color: #4e8ef7;
        color: #fff;
        
        &:active {
          transform: scale(0.95);
          background-color: #3d7ae6;
        }
      }
      
      &.secondary-btn {
        background-color: #333a46;
        color: #fff;
        border: 1px solid #4e8ef7;
        
        &:active {
          background-color: #2a3138;
          transform: scale(0.95);
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
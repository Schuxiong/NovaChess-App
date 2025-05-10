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
            avatar="/static/images/match/avatar-default.png"
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
              @cell-click="handleCellClick"
              @promotion-move="handlePromotion"
            />
          </view>
        
        <!-- 玩家信息 -->
          <player-info 
            :is-opponent="false"
            :player-name="playerName"
            avatar="/static/images/match/avatar-user.png"
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
        <view class="debug-tools" v-if="!gameStarted">
          <view class="start-match-btn" @click="startMatchAndShowTab">开始对战</view>
          <view class="test-invitation-btn" @click="testInvitation('LucTestAccount')">测试邀请弹窗</view>
          <view class="gen-url-btn" @click="generateTestInvitationUrl">生成测试URL</view>
          <view class="set-test-id-btn" @click="setTestUserIdAndQuery">使用测试ID查询邀请</view>
        </view>
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
              <text class="rating-value">{{ ratingChange ? ratingChange.before : 335 }}</text>
              <text v-if="ratingChange" class="rating-change positive">+ {{ ratingChange.change }}</text>
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
              <text class="rating-value">{{ ratingChange ? ratingChange.before : 335 }}</text>
              <text v-if="ratingChange" class="rating-change negative">{{ ratingChange.change }}</text>
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
      
      <!-- 和棋弹窗 -->
      <uni-popup ref="drawPopup" type="center" background-color="#333" @close="handleResultClose">
        <view class="result-popup draw-popup">
          <view class="result-title">和棋</view>
          <view class="result-description">这把是平局</view>
          
          <!-- 天梯赛积分变化 -->
          <view v-if="isLeaderboardMode" class="rating-display">
            <text class="rating-label">当前积分</text>
            <view class="rating-value-container">
              <text class="rating-value">{{ ratingChange ? ratingChange.before : 335 }}</text>
              <text v-if="ratingChange" class="rating-change" :class="{'positive': ratingChange && ratingChange.change > 0, 'negative': ratingChange && ratingChange.change < 0}">
                {{ ratingChange && ratingChange.change > 0 ? '+' : '' }}{{ ratingChange ? ratingChange.change : 0 }}
              </text>
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
    calculateAlgebraicNotation
  } from '@/utils/chess/cheesLogic';
  
  // 导入对弈关系API
  import { queryPendingInvitations, respondInvitation, addChessFriendPair, listChessFriendPair, cancelInvitation, clearPendingInvitations, getInvitationStatus, getGameIdByInviteId } from '@/api/pair';
  // 导入游戏相关API
  import { initGame, moveChess, getChessMovesHistory, updateGameStatus, enterGame } from '@/api/game';
  // 导入用户API
  import { getUserData } from '@/api/system/user';
  
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
      MatchingStatusPopup
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
        gameResult: null, // 游戏结果
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
      
      // 模拟监听好友邀请
      this.simulateInvitationListener();
    },
    onReady() {
      console.log('页面就绪，启动邀请轮询');
      
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
       * 处理用户走棋
       */
      movePiece(fromPos, toPos, promoteTo = null) {
        // 如果游戏未开始或已结束，或者不是当前玩家的回合，不允许走棋
        if (!this.gameStarted || this.gameResult || this.isCheckmated ||
            (this.playAs === 'white' && this.currentPlayer !== 'white') ||
            (this.playAs === 'black' && this.currentPlayer !== 'black')) {
          console.log('无法走棋: 游戏未开始/已结束，或者不是您的回合');
          return false;
        }
        
        // 从位置字符串解析行列
        const fromCol = this.columns.indexOf(fromPos[0]);
        const fromRow = 8 - parseInt(fromPos[1]);
        const toCol = this.columns.indexOf(toPos[0]);
        const toRow = 8 - parseInt(toPos[1]);
        
        if (fromCol === -1 || toCol === -1 || fromRow < 0 || fromRow > 7 || toRow < 0 || toRow > 7) {
          console.error('无效的棋子位置:', fromPos, toPos);
          return false;
        }
        
        // 获取要移动的棋子
        const piece = this.chessboard[fromRow][fromCol];
        
        if (!piece) {
          console.error('起始位置没有棋子:', fromPos);
          return false;
        }
        
        // 检查是否是当前玩家的棋子
        const pieceColor = getPieceColor(piece);
        if ((this.playAs === 'white' && pieceColor !== 'white') ||
            (this.playAs === 'black' && pieceColor !== 'black')) {
          console.error('无法移动对手的棋子');
          return false;
        }
        
        // 这里逻辑调整：
        // 1. 构建移动信息
        // 2. 通过WebSocket发送移动请求
        // 3. 不再直接更新本地棋盘，等待服务器确认后更新
        
        // 构建移动信息
        const moveInfo = {
          fromPosition: fromPos,
          toPosition: toPos,
          promoteTo: promoteTo,
          playerId: this.currentUserId,
          playerName: this.playerName || `玩家_${this.currentUserId}`,
          gameId: this.currentGameId
        };
        
        console.log('发送走棋信息:', moveInfo);
        
        // 通过WebSocket发送移动消息
        if (this.webSocketService.stompClient && this.currentGameId) {
          // 棋盘移动的声音
          this.playChessSound('move');
          
          // 发送移动消息到服务器
          const destination = `/app/game/move/${this.currentGameId}`;
          
          sendMessage(destination, moveInfo)
            .then(() => {
              console.log('走棋消息发送成功');
            })
            .catch(error => {
              console.error('发送走棋消息失败:', error);
              uni.showToast({
                title: '走棋失败，请重试',
                icon: 'none'
              });
            });
            
          return true;
        } else {
          console.error('WebSocket客户端未初始化或缺少游戏ID，无法发送走棋消息');
          uni.showToast({
            title: '网络连接中断，请重新连接',
            icon: 'none'
          });
          return false;
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
        console.log('显示好友对战界面');
        // 已通过NewGameTab内的showFriendsTab控制显示界面
        // 不需要做额外操作
      },
      
      // 处理邀请好友
      inviteFriend(user, inviteInfo) {
        console.log('邀请好友：', user, inviteInfo);
        
        // 更新对手信息
        this.opponentName = user.name || user.userName || user.username;
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
              console.log('从result对象中获取inviteId:', inviteId);
            } else if (typeof res.result === 'string' && res.result.match(/^[0-9]+$/)) {
              // 如果result是纯数字字符串
              inviteId = res.result;
              console.log('从result字符串中获取inviteId:', inviteId);
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
            console.log('当前邀请ID已设置为:', this.pendingInviteId);
            
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
                // 保存游戏ID
                this.currentGameId = initRes.result.id || initRes.result;
                console.log('接收方成功初始化游戏，ID:', this.currentGameId);
                
                // 开始计时
                this.startWhiteTimer();
                
                // 初始化WebSocket连接
                if (this.currentGameId) {
                  this.initWebSocket(this.currentGameId);
                  
                  // 发送一个GAME_START事件到WebSocket以通知发起方
                  const destination = `/app/game/start/${this.currentGameId}`;
                  sendMessage(destination, {
                    gameId: this.currentGameId,
                    userId: this.currentUserId,
                    playerName: this.playerName,
                    playerColor: this.playAs
                  });
                }
                
                uni.showToast({
                  title: `对局已开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
                  icon: 'success'
                });
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
      
      // 开始轮询游戏行棋
      startPollingGameMoves() {
        // // 清除可能的现有定时器
        // if (this.pollingGameMovesTimer) {
        //   clearInterval(this.pollingGameMovesTimer);
        // }
        
        // // 设置定时器，每2秒查询一次
        // this.pollingGameMovesTimer = setInterval(() => {
        //   this.checkGameMoves();
        // }, 2000);
        
        // // 立即执行一次
        // this.checkGameMoves();
        console.log("startPollingGameMoves 已被WebSocket取代，不再执行。");
      },
      
      // 停止轮询游戏行棋
      stopPollingGameMoves() {
        // if (this.pollingGameMovesTimer) {
        //   clearInterval(this.pollingGameMovesTimer);
        //   this.pollingGameMovesTimer = null;
        // }
        console.log("stopPollingGameMoves 已被WebSocket取代，不再执行。");
      },
      
      // 查询游戏行棋
      checkGameMoves() {
        // if (!this.currentGameId) {
        //   console.log('没有游戏ID，不查询行棋');
        //   return;
        // }
        
        // // 构造查询参数
        // const params = {
        //   chessGameId: this.currentGameId,
        //   pageNo: 1,
        //   pageSize: 50
        // };
        
        // // 调用行棋列表API
        // getChessMovesHistory(params).then(res => {
        //   if (res.success && res.result && res.result.records) {
        //     const moves = res.result.records;
        //     console.log('获取到行棋记录:', moves.length, '条');
            
        //     if (moves.length > 0) {
        //       // 排序确保按时间顺序
        //       moves.sort((a, b) => {
        //         const timeA = new Date(a.createTime || 0).getTime();
        //         const timeB = new Date(b.createTime || 0).getTime();
        //         return timeA - timeB;
        //       });
              
        //       // 获取最新的行棋
        //       const latestMove = moves[moves.length - 1];
              
        //       // 如果有新的行棋且不是自己的行棋
        //       if (latestMove.id !== this.lastMoveId) {
        //         console.log('发现新的行棋:', latestMove);
        //         this.lastMoveId = latestMove.id;
                
        //         // 如果是对方行棋且当前是对方回合
        //         const isMoveByOpponent = latestMove.createBy !== this.currentUserId;
        //         const isOpponentTurn = (this.playAs === 'white' && this.currentPlayer === 'black') ||
        //                               (this.playAs === 'black' && this.currentPlayer === 'white');
                
        //         if (isMoveByOpponent && isOpponentTurn) {
        //           // 应用对方的行棋到棋盘
        //           this.applyOpponentMove(latestMove);
        //         }
        //       }
        //     }
        //   }
        // }).catch(err => {
        //   console.error('查询行棋记录失败', err);
        // });
        console.log("checkGameMoves 已被WebSocket取代，不再执行。");
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
      handleSummary() {
        this.closeResultPopup();
        // 这里可以添加跳转到比赛总结页面的逻辑
        uni.showToast({
          title: '查看比赛总结',
          icon: 'none'
        });
      },
      
      // 处理新的一局按钮
      handleNewGame() {
        this.closeResultPopup();
        this.startNewGame();
      },
      
      // 处理结果弹窗关闭
      handleResultClose() {
        console.log('结果弹窗已关闭');
      },
      
      // 处理游戏结束后的操作
      handleGameEnd(result) {
        // 停止计时器
        this.stopAllTimers();
        
        // 如果是天梯赛模式，先显示积分结算
        if (this.isLeaderboardMode) {
          // 延迟显示弹窗，给用户足够时间看到棋盘最终状态
          setTimeout(() => {
            this.showLeaderboardResult(result);
          }, 1500);
        } else {
          // 非天梯赛模式，直接显示普通结果弹窗
          setTimeout(() => {
            this.showResultPopup(result);
          }, 1000);
        }
      },
      
      // 显示天梯赛结果
      showLeaderboardResult(result) {
        // 计算积分变化
        let pointsChange = 0;
        
        if (result === 'victory') {
          // 胜利获得积分，基础15分加上根据对手积分的额外加成
          const basePoints = 15;
          const difficultyBonus = Math.max(0, Math.floor((this.opponentRating - 335) / 100));
          pointsChange = basePoints + difficultyBonus;
        } else if (result === 'defeat') {
          // 失败扣除积分，基础10分减去根据对手积分的减免
          const basePoints = -10;
          const difficultyBonus = Math.min(5, Math.max(0, Math.floor((this.opponentRating - 335) / 150)));
          pointsChange = basePoints + difficultyBonus;
        } else {
          // 和棋，积分变化较小
          pointsChange = Math.floor(Math.random() * 5) - 2; // -2到2之间的随机数
        }
        
        // 更新积分（实际应用中应该发送到服务器保存）
        this.playerRating = 335 + pointsChange;
        
        // 设置积分变化数据
        this.ratingChange = {
          before: 335,
          after: this.playerRating,
          change: pointsChange
        };
        
        // 显示普通结果弹窗，结果弹窗中已包含积分显示
        this.showResultPopup(result);
      },
      
      // 提出和棋
      offerDraw() {
        uni.showModal({
          title: '和棋请求',
          content: '你确定要提出和棋吗？',
          success: (res) => {
            if (res.confirm) {
              // 这里模拟对手接受和棋请求
              setTimeout(() => {
                this.stopAllTimers();
                this.gameResult = '和棋（双方同意）';
                
                // 处理游戏结束
                this.handleGameEnd('draw');
              }, 1000);
            }
          }
        });
      },
      
      // 认输
      resignGame() {
        uni.showModal({
          title: '认输确认',
          content: '你确定要认输吗？',
          success: (res) => {
            if (res.confirm) {
              this.stopAllTimers();
              this.gameResult = `${this.opponentName} 胜出（认输）`;
              
              // 处理游戏结束
              this.handleGameEnd('defeat');
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
      playLeaderboard() {
        console.log('进入天梯赛匹配');
        
        // 设置为天梯赛模式
        this.isLeaderboardMode = true;
        
        // 直接进入匹配状态
        this.gameStarted = true;
        this.matching = true;
        
        // 使用默认配置：10分钟、标准模式、随机执子
        this.timeControl = '10 min';
        this.gameMode = 'standard';
        this.playAs = 'random';
        
        // 重置棋盘到初始状态
        this.resetBoard();
        
        // 匹配开始时，显示等待对手加入
        this.opponentName = '等待对手加入';
        
        // 模拟匹配过程
        setTimeout(() => {
          // 模拟匹配成功
          this.findLeaderboardOpponent();
        }, 3000);
      },
      
      // 匹配天梯赛对手
      findLeaderboardOpponent() {
        // 模拟从后端获取对手信息
        const opponentList = [
          { name: 'GrandMaster2000', rating: 2356 },
          { name: 'ChessWizard', rating: 1987 },
          { name: 'KnightRider', rating: 1876 },
          { name: 'QueenDomination', rating: 2145 },
          { name: 'BishopAttack', rating: 1756 }
        ];
        
        // 随机选择一个对手
        const randomOpponent = opponentList[Math.floor(Math.random() * opponentList.length)];
        
        // 设置匹配状态和对手信息
        this.matching = false;
        this.opponentName = randomOpponent.name;
        this.opponentRating = randomOpponent.rating;
        
        // 随机分配执棋方
        this.playAs = Math.random() < 0.5 ? 'white' : 'black';
        
        // 切换到对战标签
        this.activeTab = 'match';
        
        // 按规则白方先行，开始白方计时
        this.startWhiteTimer();
        
        uni.showToast({
          title: `天梯赛开始，您执${this.playAs === 'white' ? '白' : '黑'}子`,
          icon: 'none'
        });
      },
      
      // 测试邀请弹窗 (仅用于开发测试)
      testInvitation(userName = '') {
        const testInviter = {
          id: Math.floor(Math.random() * 1000) + 1,
          name: userName || `Player${Math.floor(Math.random() * 1000)}`,
          rating: Math.floor(Math.random() * 1500) + 1000,
          avatar: '/static/images/match/avatar-default.png',
          timeControl: ['5 min', '10 min', '15 min'][Math.floor(Math.random() * 3)],
          inviteId: 'test-invite-' + Math.random().toString(36).substring(2, 10),
          playAs: Math.random() < 0.5 ? 'white' : 'black'
        };
        
        this.showInvitation(testInviter);
      },
      
      // 模拟监听好友邀请
      simulateInvitationListener() {
        // 这里在实际应用中应该使用WebSocket等实时通讯技术
        // 用于接收服务器推送的好友邀请
        
        // 模拟接收URL参数中的邀请
        const query = uni.getStorageSync('pending_invitation');
        if (query) {
          uni.removeStorageSync('pending_invitation');
          
          // 解析邀请信息并显示弹窗
          try {
            const inviter = JSON.parse(query);
            setTimeout(() => {
              this.showInvitation(inviter);
              }, 1000);
          } catch (e) {
            console.error('无效的邀请信息', e);
            }
          }
        
        // 增加一个测试按钮点击事件
        uni.$on('test_invitation', (data) => {
          this.showInvitation(data.inviter);
        });
      },
      
      // 生成测试邀请URL (仅用于开发测试)
      generateTestInvitationUrl() {
        const testInviter = {
          id: Math.floor(Math.random() * 1000) + 1,
          name: 'LucTestAccount',
          rating: 236,
          avatar: '/static/images/match/avatar-default.png',
          timeControl: '10 min',
          inviteId: 'test-invite-' + Math.random().toString(36).substring(2, 10),
          playAs: Math.random() < 0.5 ? 'white' : 'black'
        };
        
        // 将邀请信息转为URL参数
        const invitationParam = encodeURIComponent(JSON.stringify(testInviter));
        const url = `/pages/play/match/index?invitation=${invitationParam}`;
        
        // 复制到剪贴板
        uni.setClipboardData({
          data: url,
          success: () => {
            uni.showToast({
              title: '测试URL已复制到剪贴板，可在新窗口打开',
              icon: 'none',
              duration: 2000
            });
          }
        });
        
        // 同时存储到本地缓存，用于模拟接收邀请
        uni.setStorageSync('pending_invitation', JSON.stringify(testInviter));
        
        return url;
      },
      
      // 调试功能 - 手动设置用户ID并查询邀请
      setTestUserIdAndQuery() {
        // 使用默认测试用户ID或从配置中获取
        const testUserId = '1714471285016895490'; // 使用已知的有效用户ID
        
        // 存储测试用户ID
        uni.setStorageSync('userId', testUserId);
        console.log('已设置测试用户ID:', testUserId);
        
        // 强制查询一次邀请
        this.checkPendingInvitations();
        
        uni.showToast({
          title: '已使用测试ID查询邀请',
          icon: 'none'
        });
      },
      
      // 处理邀请弹窗关闭
      handleInvitationClose() {
        console.log('邀请弹窗关闭');
        this.invitationShown = false;
      },
      
      // 处理取消邀请
      handleCancelInvite() {
        if (!this.pendingInviteId) return;
        
        console.log('取消邀请，ID:', this.pendingInviteId);
        
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
        console.log('匹配弹窗关闭');
      },
      
      // 获取当前用户信息
      getCurrentUserInfo() {
        getUserData().then(res => {
          if (res.success && res.result) {
            const userData = res.result;
            this.currentUserId = userData.id;
            this.currentUserAccount = userData.username || userData.account || userData.userAccount;
            this.playerName = userData.realname || userData.username || '我';
            
            // 将用户ID存储到本地
            uni.setStorageSync('userId', userData.id);
            console.log('获取到用户数据:', userData);
          }
        }).catch(err => {
          console.error('获取用户信息失败', err);
          // 使用缓存中的用户ID
          const userId = uni.getStorageSync('userId');
          if (userId) {
            this.currentUserId = userId;
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
        // 完成升变
        this.movePiece(from.row, from.col, to.row, to.col, { 
          promoteTo: promoteTo,
          isPromotion: true
        });
      },
      
      // 处理棋盘格子点击
      handleCellClick(position) {
        const { row, col } = position;
        const piece = this.chessboard[row][col];
        
        // 如果已经选中棋子，尝试移动
        if (this.selectedPosition) {
          // 如果点击的是同一个位置，取消选择
          if (this.selectedPosition.row === row && this.selectedPosition.col === col) {
            this.selectedPosition = null;
            this.validMoves = [];
            return;
          }
          
          // 如果点击的是有效移动位置，执行移动
          const validMove = this.validMoves.find(move => move.row === row && move.col === col);
          if (validMove) {
            // 检查是否有特殊移动属性
            const moveInfo = {};
            
            if (validMove.isCastling) {
              moveInfo.isCastling = true;
              moveInfo.rookFrom = validMove.rookFrom;
              moveInfo.rookTo = validMove.rookTo;
            } else if (validMove.isEnPassant) {
              moveInfo.isEnPassant = true;
              moveInfo.capturedPiecePos = validMove.capturedPiecePos;
              console.log('执行吃过路兵移动，被吃子位置:', validMove.capturedPiecePos);
            }
            
            // 执行移动
            this.movePiece(this.selectedPosition.row, this.selectedPosition.col, row, col, moveInfo);
            this.selectedPosition = null;
            this.validMoves = [];
            return;
          }
          
          // 如果点击的是同颜色的其他棋子，更新选择
          if (piece && getPieceColor(piece) === this.currentPlayer) {
            this.selectPiece(row, col);
            return;
          }
          
          // 否则，取消选择
          this.selectedPosition = null;
          this.validMoves = [];
        } 
        // 如果没有选中棋子，且点击了当前玩家的棋子，选中它
        else if (piece && getPieceColor(piece) === this.currentPlayer) {
          this.selectPiece(row, col);
        }
      },
      
      // 选择棋子
      selectPiece(row, col) {
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
            
            // 详细调试信息
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
        
        // 打印当前存储的所有键值对，帮助调试
        console.log('当前存储的所有键值:');
        try {
          const storageInfo = uni.getStorageInfoSync();
          if (storageInfo && storageInfo.keys) {
            storageInfo.keys.forEach(key => {
              const value = uni.getStorageSync(key);
              console.log(`Key: ${key}, Value:`, value);
            });
          }
        } catch (error) {
          console.error('获取存储信息失败:', error);
        }
        
        if (!userId) {
          console.log('未找到有效的用户ID，不查询邀请');
          return;
        }
        
        console.log('正在查询待接受的邀请...', '用户ID:', userId);
        queryPendingInvitations(userId).then(res => {
          console.log('查询邀请结果:', res);
          if (res.success && res.result) {
            this.pendingInvitations = Array.isArray(res.result) ? res.result : [];
            console.log('获取到待接受邀请:', this.pendingInvitations.length, '个');
            
            // 如果有待接受的邀请，且当前没有显示邀请弹窗也没有对局进行中
            if (this.pendingInvitations.length > 0 && !this.invitationShown && !this.gameStarted) {
              // 获取第一个邀请
              const invitation = this.pendingInvitations[0];
              console.log('处理邀请:', invitation);
              
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
              console.log('没有待处理的邀请');
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
          console.log('未找到用户ID，跳过清理邀请');
          return Promise.resolve();
        }
        
        console.log('清理旧邀请，用户ID:', userId);
        return clearPendingInvitations(userId).then(() => {
          console.log('成功清理旧邀请');
        }).catch(err => {
          console.error('清理旧邀请失败:', err);
        });
      },
      
      // WebSocket相关方法
      initWebSocket(gameId) {
        if (!gameId) {
          console.error('初始化WebSocket失败: 缺少游戏ID');
          return;
        }
        
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
        console.log(`尝试连接WebSocket，用户ID: ${this.currentUserId}，游戏ID: ${gameId}`);
        
        connectWebSocket(
          this.currentUserId,
          (client) => {
            console.log('WebSocket连接成功:', client);
            this.webSocketService.stompClient = client;
            
            // 保存当前订阅的游戏ID
            this.webSocketService.gameIdForSubscription = gameId;
            
            // 订阅游戏主题以接收更新
            const gameTopic = `/topic/game/${gameId}`;
            
            console.log(`订阅游戏主题: ${gameTopic}`);
            
            this.webSocketService.gameSubscription = subscribeToTopic(
              gameTopic,
              (message) => {
                try {
                  // 尝试解析消息
                  const data = JSON.parse(message.body);
                  console.log('WebSocket收到消息:', data);
                  
                  // 处理消息
                  this.handleWebSocketMessage(data);
                } catch (e) {
                  console.error('处理WebSocket消息时出错:', e, message);
                }
              }
            );
            
            // 发送PLAYER_JOINED消息通知其他玩家
            console.log('向服务器发送玩家加入消息');
            
            const destination = `/app/game/join/${gameId}`;
            sendMessage(destination, {
              gameId: gameId,
              userId: this.currentUserId,
              username: this.playerName || '玩家_' + this.currentUserId,
              playerColor: this.playAs
            });
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
    
      handleWebSocketMessage(message) {
        console.log('WebSocket: 收到消息:', message);
        if (!message || typeof message !== 'object') {
            console.warn('WebSocket: 收到无效消息格式', message);
            return;
        }
    
        // 根据后端实际发送的消息类型进行处理
        switch (message.type) {
          case 'PLAYER_JOINED':
            console.log(`WebSocket: 玩家 ${message.username} (ID: ${message.userId}) 加入游戏 ${message.gameId}`);
            // 更新对手信息等UI
            if (message.userId !== this.currentUserId) {
                this.opponentName = message.username || this.opponentName; // 更新对手名称
                uni.showToast({ title: `玩家 ${message.username || '对手'} 加入游戏`, icon: 'none' });
                
                // 重要：收到对手加入的通知，清除等待状态
                if (this.gameStarted) {
                    this.$nextTick(() => {
                      // 通知组件更新UI状态
                      this.$forceUpdate();
                    });
                }
            }
            break;
            
          case 'GAME_START': // 处理游戏开始消息
            console.log('WebSocket: 收到游戏开始消息', message);
            if (message.payload && message.payload.gameId) {
                // 确认双方都已就绪
                this.gameStarted = true;
                // 如果有初始游戏状态，更新棋盘
                if (message.payload.initialGameState) {
                    this.updateGameViewFromServer(message.payload.initialGameState);
                }
                
                // 清除等待状态，强制更新UI
                this.$nextTick(() => {
                    this.$forceUpdate();
                });
                
                uni.showToast({ title: '对局已开始，双方都已就绪', icon: 'success' });
            }
            break;
            
          case 'MOVE_UPDATE':
            console.log('WebSocket: 收到走棋更新', message);
            if (message.payload) {
                const moveInfo = message.payload.moveInfo;
                const latestGameState = message.payload.latestGameState;
                
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
            }
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
        console.log('Updating game view from server state:', gameState);

        // 1. 更新棋盘 (this.chessboard)
        //    您需要根据 ChessGameVO 的实际结构来转换。
        //    假设 gameState.board (或 gameState.chessPieces) 是一个描述棋盘的对象或数组
        //    例如: gameState.chessPieces = [{ piece: 'ROOK_WHITE', position: 'a1' }, ...]
        //    或者 gameState.board = [ ['r','n','b','q','k','b','n','r'], ..., ['P','P',...] ] (fen-like row)
        //    这里需要一个转换函数将服务器的棋盘表示映射到前端的 this.chessboard 格式
        
        if (gameState.boardVO && Array.isArray(gameState.boardVO)) { // 假设 boardVO 是二维数组
            const newBoard = getInitialChessboard(); // Start with an empty board structure
            const serverBoard = gameState.boardVO; // e.g. [ ["bR", "bN", ...], ..., ["wP", "wP", ...] ]
                                                // or serverBoard could be a list of piece objects with positions
            
            // 假设服务器的 gameState.boardVO 是一个8x8的二维数组，
            // 其中包含的元素是类似 "wP" (白兵), "bR" (黑车), "" (空格) 的字符串
            // 或者更可能是包含棋子对象的列表，如 [{type: 'ROOK', color: 'BLACK', position: 'a8'}, ...]
            // 您需要根据实际的 ChessGameVO.boardVO 结构来填充 this.chessboard
            // 以下是一个示例性的转换，假设 gameState.boardVO 是一个棋子对象列表：
            if (Array.isArray(gameState.pieces)) { // 假设 gameState.pieces 是 [{ type, color, position (e.g. 'e4')}]
                const boardFromPieces = getInitialChessboard(); // Get a clean board
                gameState.pieces.forEach(p => {
                    const col = this.columns.indexOf(p.position.charAt(0).toLowerCase());
                    const row = 8 - parseInt(p.position.charAt(1));
                    if (row >=0 && row < 8 && col >=0 && col < 8) {
                        boardFromPieces[row][col] = { 
                            type: p.type.toLowerCase(), // 'pawn', 'rook', etc.
                            color: p.color.toLowerCase(), // 'white', 'black'
                            id: `${p.color.charAt(0).toLowerCase()}${p.type.charAt(0).toUpperCase()}_${p.position}` // simple id
                        };
                    }
                });
                this.chessboard = boardFromPieces;
            } else if (Array.isArray(gameState.boardLayout)) { // 假设是二维数组 "wP", "bR"
                 // 需要将 "wP" 转换为 { type: 'pawn', color: 'white', id: ... }
                 const parsedBoard = gameState.boardLayout.map(r => r.map(cell => {
                     if (!cell || cell.trim() === '') return null;
                     const color = cell.charAt(0) === 'w' ? 'white' : 'black';
                     const typeStr = cell.substring(1);
                     let type = '';
                     switch(typeStr) {
                         case 'P': type = 'pawn'; break;
                         case 'R': type = 'rook'; break;
                         case 'N': type = 'knight'; break;
                         case 'B': type = 'bishop'; break;
                         case 'Q': type = 'queen'; break;
                         case 'K': type = 'king'; break;
                         default: return null;
                     }
                     return { type, color, id: `${color.charAt(0)}${type.charAt(0).toUpperCase()}_${Math.random()}` }; // Placeholder ID
                 }));
                 this.chessboard = parsedBoard;
            } else {
                 console.warn("ChessGameVO.boardVO or .pieces not in expected format, board not updated from WebSocket.");
                 // Fallback or error: maybe request full board again if possible
            }
        } else {
            console.warn('ChessGameVO does not contain boardVO or it is not an array. Board not updated.');
        }

        // 2. 更新当前行棋方 (this.currentPlayer)
        //    假设 gameState.currentTurn 是 'WHITE' 或 'BLACK' (字符串)
        //    或者 gameState.currentTurnPlayerId
        if (gameState.currentTurn) { // 'WHITE' or 'BLACK'
          this.currentPlayer = gameState.currentTurn.toLowerCase();
        } else if (gameState.currentPlayerId) {
            // Map ID to color if necessary, e.g., if player1 is white and player2 is black
            // This depends on how player IDs and colors are associated in your game state
            // For now, let's assume a direct mapping if not 'WHITE'/'BLACK'
            // this.currentPlayer = (gameState.currentPlayerId === this.playerInfo.id) ? this.playAs : (this.playAs === 'white' ? 'black' : 'white');
            console.warn("currentPlayerId received, but logic to map to 'white'/'black' is needed based on game setup.");
        } else {
            console.warn('Current turn info missing in gameState.');
        }

        // 3. 更新上一部棋 (this.lastMove) - 用于棋盘高亮
        //    假设 gameState.lastMove = { from: 'e2', to: 'e4', piece: { type: 'PAWN', color: 'WHITE' } }
        if (gameState.lastMoveVO) { // Renamed from lastMove to lastMoveVO to match server side potential naming
          const fromCol = this.columns.indexOf(gameState.lastMoveVO.fromPosition.charAt(0).toLowerCase());
          const fromRow = 8 - parseInt(gameState.lastMoveVO.fromPosition.charAt(1));
          const toCol = this.columns.indexOf(gameState.lastMoveVO.toPosition.charAt(0).toLowerCase());
          const toRow = 8 - parseInt(gameState.lastMoveVO.toPosition.charAt(1));
          
          this.lastMove = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { // Assuming piece details are part of lastMoveVO or can be inferred
              type: gameState.lastMoveVO.pieceMoved?.type?.toLowerCase() || '',
              color: gameState.lastMoveVO.pieceMoved?.color?.toLowerCase() || ''
            }
          };
        } else {
          this.lastMove = null; // Clear if no last move info
        }

        // 4. 更新游戏结果/状态 (this.gameResult, this.isCheckmated, this.checkmateColor)
        if (gameState.gameStatus) { // e.g., "ONGOING", "CHECKMATE_WHITE_WINS", "STALEMATE"
            switch (gameState.gameStatus) {
                case 'CHECKMATE_WHITE_WINS':
                    this.isCheckmated = true;
                    this.checkmateColor = 'black'; // Black is checkmated
                    this.gameResult = `${this.playAs === 'white' ? this.playerName : this.opponentName} 胜出 (将杀)`;
                    this.handleGameEnd(this.playAs === 'white' ? 'victory' : 'defeat');
                    break;
                case 'CHECKMATE_BLACK_WINS':
                    this.isCheckmated = true;
                    this.checkmateColor = 'white'; // White is checkmated
                    this.gameResult = `${this.playAs === 'black' ? this.playerName : this.opponentName} 胜出 (将杀)`;
                    this.handleGameEnd(this.playAs === 'black' ? 'victory' : 'defeat');
                    break;
                case 'STALEMATE':
                    this.gameResult = '和棋 (逼和)';
                    this.handleGameEnd('draw');
                    break;
                case 'ONGOING':
                    this.isCheckmated = false;
                    this.checkmateColor = '';
                    this.gameResult = null;
                    break;
                // Add cases for resign, timeout, draw offers etc. if server sends them
                default:
                    console.log("Received game status:", gameState.gameStatus);
            }
        }
        
        // 5. 更新是否将军状态 (如果 ChessBoard 组件需要)
        if (typeof gameState.isCheck !== 'undefined' && this.$refs.chessBoard) {
            // this.$refs.chessBoard.showKingInCheck(gameState.isCheck, this.currentPlayer); // Example
            if(gameState.isCheck) {
                uni.showToast({ title: '将军!', icon: 'none', duration: 1500 });
            }
        }

        // 6. 启动/切换计时器
        if (!this.isCheckmated && this.gameResult === null) { // Only if game is ongoing
            if (this.currentPlayer === 'white') {
                this.startWhiteTimer();
            } else if (this.currentPlayer === 'black') {
                this.startBlackTimer();
            }
        } else {
            this.stopAllTimers(); // Stop timers if game has ended
        }
        
        // 7. 乐观更新的棋谱记录校正（如果需要）
        // 如果之前是乐观记录棋谱，这里可以根据权威的 gameState.moveHistory 来校正
        // this.formattedMoveHistory = parseAndFormatMoveHistory(gameState.moveHistory);
        // For now, we assume recordMoveHistory in movePiece was optimistic and might be slightly off
        // until the server state (which might contain full history) is processed.
        // A simple approach: if this update corresponds to a move just made by the local player,
        // ensure the last entry in formattedMoveHistory is correct.
        // Or, if gameState includes a full formatted history, use that.
        if (gameState.lastMoveVO && this.formattedMoveHistory.length > 0) {
            const lastRecordedMove = this.formattedMoveHistory[this.formattedMoveHistory.length - 1];
            const serverNotation = gameState.lastMoveVO.notation; // Assuming server sends notation

            if (serverNotation) {
                if (this.currentPlayer === 'black' && lastRecordedMove.white) { // Server just sent white's move
                    // lastRecordedMove.white.notation = serverNotation;
                     // It's more complex because current player is now black, meaning white just moved.
                } else if (this.currentPlayer === 'white' && lastRecordedMove.black) { // Server just sent black's move
                    // lastRecordedMove.black.notation = serverNotation;
                }
                 // This needs careful handling of whose move it was.
                 // For simplicity, let's re-record based on current player *before* this update.
                 // The this.currentPlayer is already updated to the *next* player.
                 // So if current is black, white just moved.
                 
                 const pieceColorThatMoved = this.currentPlayer === 'white' ? 'black' : 'white';
                 
                 // Re-calculate notation and update based on server's move.
                 // This is complex; a simpler way is if the server sends the full notation directly.
                 // Or if server sends the move that was just made, re-calculate based on that.
                 // For now, leave the optimistic notation from recordMoveHistory
                 // unless server explicitly provides full history or corrected notation.
            }
        }

        // Mark game as started if it wasn't already by client logic
        if (!this.gameStarted && (gameState.gameStatus === 'ONGOING' || this.isCheckmated || this.gameResult)) {
            this.gameStarted = true;
        }
        
        // Force re-render if needed, though Vue should be reactive
        this.$forceUpdate();
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
  
  // 测试按钮样式
  .debug-tools {
    margin-top: 20rpx;
    padding: 20rpx;
    display: flex;
    justify-content: center;
    
    .start-match-btn, .test-invitation-btn, .gen-url-btn, .set-test-id-btn {
      background-color: #81B64C;
      color: #fff;
      font-size: 28rpx;
      padding: 20rpx 40rpx;
      border-radius: 10rpx;
      box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
      margin: 0 10rpx;
      
      &:active {
        opacity: 0.8;
      }
    }
    
    .test-invitation-btn {
      background-color: #2196F3;
    }
    
    .gen-url-btn {
      background-color: #FF9800;
    }
    
    .set-test-id-btn {
      background-color: #2196F3;
    }
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
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
    margin: 20rpx 0 30rpx;
    padding: 20rpx;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10rpx;
    
    .rating-label {
      font-size: 30rpx;
      color: #AAAAAA;
      margin-bottom: 10rpx;
    }
    
    .rating-value-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .rating-value {
      font-size: 60rpx;
      font-weight: bold;
      color: #FFFFFF;
    }
    
    .rating-change {
      font-size: 52rpx;
      font-weight: bold;
      margin-left: 15rpx;
      
      &.positive {
        color: #81B64C;
      }
      
      &.negative {
        color: #E53935;
      }
    }
  }
  </style>
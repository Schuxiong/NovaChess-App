<!-- components/chess/tabs/GamesTab.vue -->
<template>
  <view class="tab-content">
    <!-- 子选项卡 -->
    <view class="sub-tabs">
      <view class="sub-tab" 
        :class="{ 'active': activeSubTab === 'history' }" 
        @click="switchSubTab('history')">
        <text class="sub-tab-text">对局历史</text>
      </view>
      <view class="sub-tab" 
        :class="{ 'active': activeSubTab === 'watch' }" 
        @click="switchSubTab('watch')">
        <text class="sub-tab-text">观看比赛</text>
      </view>
    </view>
    
    <!-- 搜索框 -->
    <view class="search-bar">
      <image class="search-icon" src="/static/images/match/search.png" mode="aspectFit"></image>
      <input class="search-input" placeholder="通过名称搜索对局" placeholder-style="color: rgba(255,255,255,0.5);" />
    </view>
    
    <!-- 对局历史列表 -->
    <view v-if="activeSubTab === 'history'" class="games-list">
      <view v-if="isLoading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="historyGames.length === 0" class="empty-container">
        <text class="empty-text">暂无对局记录</text>
      </view>
      <view 
        v-else
        v-for="(game, index) in historyGames" 
        :key="index" 
        class="game-item"
        @click="gotoReplay(game.id)"
      >
        <view class="time-icon">
          <image class="clock-icon" src="https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee9011.png" mode="aspectFit"></image>
        </view>
        <view class="game-info">
          <view class="players-info">
            <text class="player-name">{{game.player1Name || game.player1 || '玩家1'}} ({{game.player1Rating || game.rating1 || '?'}})</text>
            <text class="vs-text">{{getGameResult(game)}}</text>
            <text class="player-name">{{game.player2Name || game.player2 || '玩家2'}} ({{game.player2Rating || game.rating2 || '?'}})</text>
          </view>
          <view class="game-date">
            <text class="date-text">{{formatGameDate(game.createTime || game.endTime)}}</text>
          </view>
        </view>
        <view class="game-duration">
          <text class="duration-text">{{game.duration || '10 min'}}</text>
        </view>
      </view>
    </view>
    
    <!-- 观看比赛列表 -->
    <view v-if="activeSubTab === 'watch'" class="games-list">
      <view v-if="isLoadingLive" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="liveGames.length === 0" class="empty-container">
        <text class="empty-text">暂无直播对局</text>
      </view>
      <view 
        v-else
        v-for="(game, index) in liveGames" 
        :key="index" 
        class="game-item"
        @click="watchLive(game.id)"
      >
        <view class="time-icon">
          <image class="clock-icon" src="https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee9011.png" mode="aspectFit"></image>
        </view>
        <view class="game-info">
          <view class="player-row">
            <text class="player-name">{{game.player1Name || game.player1}} ({{game.player1Rating || game.rating1}})</text>
            <image class="flag" :src="game.flag1" mode="aspectFit"></image>
          </view>
          <view class="player-row">
            <text class="player-name">{{game.player2Name || game.player2}} ({{game.player2Rating || game.rating2}})</text>
            <image class="flag" :src="game.flag2" mode="aspectFit"></image>
          </view>
        </view>
        <view class="game-duration">
          <text class="duration-text">{{game.duration || '进行中'}}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getChessMovesHistory } from '@/api/game';
import { getHistoryGamesList } from '../../../api/game';

export default {
  props: {
    gamesList: {
      type: Array,
      default: () => []
    },
    userId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activeSubTab: 'history', // 默认显示对局历史
      historyGames: [],
      liveGames: [],
      isLoading: false,
      isLoadingLive: false,
      mockHistoryGames: [
        { 
          id: '1001', 
          player1: 'lucasshanchuxiong', 
          rating1: '221', 
          player2: 'dawas39', 
          rating2: '410', 
          score: '0-1', 
          duration: '10 min' 
        },
        { 
          id: '1002', 
          player1: 'Wang_JB', 
          rating1: '1530', 
          player2: 'GrandMaster2023', 
          rating2: '1498', 
          score: '1-0', 
          duration: '15 min' 
        },
        { 
          id: '1003', 
          player1: 'ChessMaster88', 
          rating1: '1842', 
          player2: 'theloyalwolf', 
          rating2: '1820', 
          score: '½-½', 
          duration: '5 min' 
        }
      ],
      mockLiveGames: [
        { 
          id: '2001', 
          player1: 'rekonwa', 
          rating1: '2390', 
          player2: 'EdwardWarren1926', 
          rating2: '2388', 
          flag1: '/static/images/match/flag-pl.png', 
          flag2: '/static/images/match/flag-us.png', 
          duration: '10 min' 
        },
        { 
          id: '2002', 
          player1: 'Orosz_Milos_Mark', 
          rating1: '2383', 
          player2: 'vibhoor', 
          rating2: '2370', 
          flag1: '/static/images/match/flag-hu.png', 
          flag2: '/static/images/match/flag-in.png', 
          duration: '10 min' 
        },
        { 
          id: '2003', 
          player1: 'NikoTheodo', 
          rating1: '2390', 
          player2: 'theloyalwolf', 
          rating2: '2388', 
          flag1: '/static/images/match/flag-pl.png', 
          flag2: '/static/images/match/flag-us.png', 
          duration: '10 min' 
        }
      ]
    }
  },
  created() {
    // 初始时加载对局历史
    this.loadUserGames();
  },
  watch: {
    userId(newVal) {
      if (newVal) {
        this.loadUserGames();
      }
    }
  },
  methods: {
    // 切换子标签页
    switchSubTab(tab) {
      this.activeSubTab = tab;
      if (tab === 'history' && this.historyGames.length === 0) {
        this.loadUserGames();
      } else if (tab === 'watch' && this.liveGames.length === 0) {
        this.loadLiveGames();
      }
    },
    
    // 加载用户对局历史
    loadUserGames() {
      this.isLoading = true;
      
      // 构造查询参数
      const params = {
        pageNo: 1,
        pageSize: 20
      };
      
      // 如果有用户ID，添加到查询参数
      if (this.userId) {
        // 这里需要根据后端API调整查询参数
        // 可能是userId, playerId或者其他字段
        params.userId = this.userId;
      }
      
      // 调用API获取用户对局历史
      getHistoryGamesList(params)
        .then(res => {
          if (res.success && res.result && res.result.records) {
            // 将数据处理为标准格式
            this.historyGames = this.processGamesData(res.result.records);
            console.log('加载历史对局成功:', this.historyGames.length, '条记录');
          } else {
            console.warn('加载历史对局返回无效数据:', res);
            // 使用模拟数据兜底
            this.historyGames = this.mockHistoryGames;
          }
        })
        .catch(err => {
          console.error('加载历史对局失败:', err);
          // 使用模拟数据兜底
          this.historyGames = this.mockHistoryGames;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    
    // 加载直播对局列表
    loadLiveGames() {
      this.isLoadingLive = true;
      
      // TODO: 添加加载直播对局的API调用
      // 目前使用模拟数据
      setTimeout(() => {
        this.liveGames = this.mockLiveGames;
        this.isLoadingLive = false;
      }, 500);
    },
    
    // 处理对局数据格式
    processGamesData(records) {
      if (!records || !Array.isArray(records)) return [];
      
      return records.map(record => {
        // 根据新的数据结构处理，包含积分信息
        const processedGame = {
          id: record.id || '',
          player1Name: record.whitePlayAccount || '白方玩家',
          player2Name: record.blackPlayAccount || '黑方玩家',
          player1Rating: record.whitePlayerScore || '?', // 白方积分
          player2Rating: record.blackPlayerScore || '?', // 黑方积分
          gameState: record.gameState || 0, // 1:进行中 2:白胜 3:黑胜 4:和棋等
          gameType: record.gameType || 1,
          currentTurn: record.currentTurn || 1, // 1:白方 2:黑方
          createTime: record.createTime || '',
          updateTime: record.updateTime || '',
          // 添加积分变化信息（如果后端提供）
          whiteScoreChange: record.whiteScoreChange || 0,
          blackScoreChange: record.blackScoreChange || 0
        };
        
        // 计算游戏时长
        processedGame.duration = this.calculateGameDuration(record.createTime, record.updateTime, record.gameState);
        
        return processedGame;
      });
    },
    
    // 获取对局结果显示文本
    getGameResult(game) {
      // 根据gameState显示不同的结果
      switch(game.gameState) {
        case 1: // 进行中
          return '进行中';
        case 2: // 白胜
          return '1-0';
        case 3: // 黑胜
          return '0-1';
        case 4: // 和棋
          return '½-½';
        case 0: // 未开始
          return '未开始';
        default:
          return game.score || '-';
      }
    },
    
    // 格式化对局日期
    formatGameDate(timestamp) {
      if (!timestamp) return '未知时间';
      
      // 处理字符串格式的时间戳 "2025-05-31 22:38:36"
      const date = new Date(timestamp.replace(/-/g, '/'));
      if (isNaN(date.getTime())) return '未知时间';
      
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // 计算游戏时长
    calculateGameDuration(createTime, updateTime, gameState) {
      if (!createTime) return '未知';
      
      // 如果游戏还在进行中，使用当前时间
      const endTime = (gameState === 1 || !updateTime) ? new Date() : new Date(updateTime.replace(/-/g, '/'));
      const startTime = new Date(createTime.replace(/-/g, '/'));
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return '未知';
      }
      
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      
      if (durationMinutes < 1) {
        return '< 1 min';
      } else if (durationMinutes < 60) {
        return `${durationMinutes} min`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return `${hours}h ${minutes}m`;
      }
    },
    
    // 跳转到回放界面
    gotoReplay(id) {
      if (!id) {
        uni.showToast({
          title: '无效的对局ID',
          icon: 'none'
        });
        return;
      }
      
      uni.navigateTo({
        url: `/pages/play/replay/index?id=${id}`
      });
    },
    
    // 跳转到观看直播界面
    watchLive(id) {
      if (!id) {
        uni.showToast({
          title: '无效的对局ID',
          icon: 'none'
        });
        return;
      }
      
      uni.navigateTo({
        url: `/pages/play/replay/index?id=${id}&live=true`
      });
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../../../styles/chess/chess-common.scss";

// 子选项卡
.sub-tabs {
  display: flex;
  width:100%;
  margin: 0 auto;
  justify-content: space-around;
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
  margin-bottom: 30rpx;
  
  .sub-tab {
    padding: 20rpx 30rpx 40rpx 30rpx;
    flex: 1;
    text-align: center;
    position: relative;
    
    .sub-tab-text {
      color: rgba(255, 255, 255, 0.5);
      font-size: 28rpx;
      font-weight: bold;
      margin-bottom: 20rpx
    }
    
    &.active {
      .sub-tab-text {
        color: #fff;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 4rpx;
        background-color: #fff;
      }
    }
  }
}

// 搜索栏
.search-bar {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  padding: 15rpx 20rpx;
  margin: 0 auto 30rpx;
  width: 100%;
  
  .search-icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 10rpx;
  }
  
  .search-input {
    flex: 1;
    color: #fff;
    font-size: 28rpx;
  }
}

// 对局列表
.games-list {
  width: 100%;
  margin: 0 auto;

  .loading-container,
  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200rpx;

    .loading-text,
    .empty-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 28rpx;
    }
  }
  
  .game-item {
    display: flex;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.4);
    padding: 20rpx;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    
    .time-icon {
      width: 60rpx;
      height: 60rpx;
      background-color: #2d2d2d;
      border-radius: 30rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 20rpx;
      
      .clock-icon {
        width: 36rpx;
        height: 36rpx;
      }
    }
    
    .game-info {
      flex: 1;
      
      .players-info {
        display: flex;
        align-items: center;
        margin-bottom: 6rpx;
        
        .player-name {
          color: #fff;
          font-size: 24rpx;
          max-width: 280rpx;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .vs-text {
          color: #aaa;
          font-size: 22rpx;
          margin: 0 15rpx;
        }
      }
      
      .game-date {
        .date-text {
          color: #aaa;
          font-size: 20rpx;
        }
      }
      
      .player-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .player-name {
          color: #fff;
          font-size: 24rpx;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .flag {
          width: 30rpx;
          height: 20rpx;
          border-radius: 2rpx;
        }
      }
    }
    
    .game-duration {
      background-color: rgba(129, 182, 76, 0.2);
      padding: 8rpx 16rpx;
      border-radius: 6rpx;
      
      .duration-text {
        color: #81B64C;
        font-size: 22rpx;
      }
    }
  }
}
</style>
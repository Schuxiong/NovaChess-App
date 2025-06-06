<!-- components/chess/tabs/NewGameTab.vue (继续) -->
<template>
  <view class="tab-content" @click="closeDropdown">
    <!-- 判断是否显示好友tab -->
    <view v-if="showFriendsTab">
      <friends-tab 
        @back="showFriendsTab = false"
        @select-friend="onSelectFriend"
        @share-invite-link="onShareInviteLink"
      />
    </view>
    
    <!-- 判断是否显示好友游戏设置界面 -->
    <view v-else-if="showFriendGameSettings">
      <view class="friend-game-settings">
        <!-- 返回按钮和标题 -->
        <view class="friend-header">
          <view class="back-button" @click="showFriendGameSettings = false; showFriendsTab = true;">
            <uni-icons type="left" size="20" color="#AAAAAA"></uni-icons>
          </view>
          <view class="title">
            <text class="title-text">和Ta玩</text>
          </view>
        </view>
        
        <!-- 选择的好友信息 -->
        <view class="selected-friend">
          <image class="friend-avatar" :src="selectedFriend.avatar" mode="aspectFit"></image>
          <view class="friend-info">
            <text class="friend-name">{{ selectedFriend.userName }}</text>
            <text class="friend-rating">({{ selectedFriend.rating }})</text>
          </view>
        </view>
        
        <!-- 时间选择模块 -->
        <view class="time-selector">
          <image class="clock-icon" src="https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee9011.png" mode="aspectFit"></image>
          <text class="time-text">10 min</text>
        </view>
        
        <!-- 游戏模式选择 -->
        <view class="game-mode-section">
          <view class="mode-card">
            <image class="mode-icon" src="/static/images/match/pieces/black-pawn.png" mode="aspectFit"></image>
            <text class="mode-text">标准模式</text>
          </view>
        </view>
        
        <!-- I play as 选择 -->
        <view class="play-as-section">
          <text class="section-title">I play as</text>
          <view class="colors-wrapper">
            <view class="color-option" :class="{ selected: playAs === 'white' }" @click="onSelectPlayAs('white')">
              <view class="white-piece"></view>
            </view>
            <view class="color-option" :class="{ selected: playAs === 'random' }" @click="onSelectPlayAs('random')">
              <view class="random-piece">
                <text class="random-text">?</text>
              </view>
            </view>
            <view class="color-option" :class="{ selected: playAs === 'black' }" @click="onSelectPlayAs('black')">
              <view class="black-piece"></view>
            </view>
          </view>
        </view>
        
        <!-- 开玩按钮 -->
        <view class="play-button" @click="onInviteFriend">
          <text class="button-text">开玩!</text>
        </view>
      </view>
    </view>
    
    <!-- 判断是否正在匹配中 -->
    <view v-else-if="matching">
      <!-- 匹配中状态卡片 -->
      <view class="matching-card-inline">
        <!-- 如果是好友对战模式，显示好友头像 -->
        <image v-if="selectedFriend.id > 0" class="friend-avatar" :src="selectedFriend.avatar" mode="aspectFit"></image>
        <image v-else class="piece-icon" src="/static/images/match/pieces/white-pawn.png" mode="aspectFit"></image>
        
        <view class="matching-time">10 min</view>
        <view class="matching-status">等待加入...</view>
        <view class="cancel-button" @click="onCancelMatching">取消</view>
      </view>

      <!-- 如果是好友对战，显示邀请链接 -->
      <view v-if="selectedFriend.id > 0" class="invite-link-container" @click="onShareInviteLink">
        <view class="invite-link-button">
          <uni-icons type="link" size="20" color="#EEEEEE"></uni-icons>
          <text class="invite-link-text">发出邀请链接</text>
          <uni-icons type="redo-filled" size="20" color="#AAAAAA"></uni-icons>
        </view>
      </view>
      
      <!-- 如果是天梯赛，显示段位积分信息 -->
      <view v-if="isLeaderboardMode" class="leaderboard-stats">
        <view class="stat-item">
          <image class="trophy-icon" src="https://pic1.imgdb.cn/item/67f352a90ba3d5a1d7ef1418.png" mode="aspectFit"></image>
          <text class="stat-label">场次</text>
          <text class="stat-value">129</text>
        </view>
        <view class="stat-item">
          <image class="points-icon" src="/static/images/match/points.png" mode="aspectFit"></image>
          <text class="stat-label">积分</text>
          <text class="stat-value">335</text>
        </view>
        <view class="stat-item">
          <image class="winrate-icon" src="/static/images/match/winrate.png" mode="aspectFit"></image>
          <text class="stat-label">胜率</text>
          <text class="stat-value">50.5%</text>
        </view>
      </view>
    </view>

    <!-- 未匹配状态时显示游戏设置选项 -->
    <view v-else>
      <!-- 判断是否展开更多选项 -->
      <view v-if="showMoreOptions">
        <!-- 游戏模式选择 -->
        <view class="game-mode-section">
          <view class="mode-card">
            <image class="mode-icon" src="/static/images/match/pieces/black-pawn.png" mode="aspectFit"></image>
            <text class="mode-text">标准模式</text>
          </view>
        </view>
        
        <!-- 指定对手 -->
        <view class="option-section">
          <view class="opponent-selector" @click.stop>
            <input 
              class="opponent-input" 
              placeholder="输入或选择对手" 
              placeholder-style="color: rgba(255,255,255,0.5);" 
              v-model="opponentSearchText"
              @focus="onOpponentInputFocus"
              @input="showOpponentDropdown = true"
              @click.stop
            />
            <view class="dropdown-icon" @click="showOpponentDropdown = !showOpponentDropdown">
              <uni-icons type="arrow-down" size="18" color="#AAAAAA"></uni-icons>
            </view>
            <!-- 下拉列表 -->
            <view class="opponent-dropdown" v-if="showOpponentDropdown">
              <view v-if="loading" class="loading-item">加载中...</view>
              <view v-else-if="filteredOpponents().length === 0" class="no-data-item">无匹配对手</view>
              <scroll-view scroll-y style="max-height: 300rpx;">
                <view 
                  v-for="(item, index) in filteredOpponents()" 
                  :key="index" 
                  class="opponent-item"
                  @click="selectOpponent(item)"
                >
                  <image 
                    class="opponent-avatar" 
                    :src="item.avatar || '/static/images/match/avatar-default.png'" 
                    mode="aspectFit"
                  ></image>
                  <view class="opponent-info">
                    <!-- 显示调试数据方便排查问题 -->
                    <text class="opponent-name">{{ item.userName || '未知用户' }} (ID: {{ item.id }})</text>
                    <text v-if="item.rating" class="opponent-rating">({{ item.rating }})</text>
                  </view>
                </view>
              </scroll-view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 时间选择模块 -->
      <view class="time-selector">
        <image class="clock-icon" src="https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee9011.png" mode="aspectFit"></image>
        <text class="time-text">10 min</text>
      </view>
      
      <!-- I play as 选择 -->
      <view v-if="showMoreOptions" class="play-as-section">
        <text class="section-title">I play as</text>
        <view class="colors-wrapper">
          <view class="color-option" :class="{ selected: playAs === 'white' }" @click="onSelectPlayAs('white')">
            <view class="white-piece"></view>
          </view>
          <view class="color-option" :class="{ selected: playAs === 'random' }" @click="onSelectPlayAs('random')">
            <view class="random-piece">
              <text class="random-text">?</text>
            </view>
          </view>
          <view class="color-option" :class="{ selected: playAs === 'black' }" @click="onSelectPlayAs('black')">
            <view class="black-piece"></view>
          </view>
        </view>
      </view>

      <!-- 开玩按钮 -->
      <view class="play-button" @click="startGame">
        <text class="button-text">开玩!</text>
      </view>
      
      <!-- 展开更多 -->
      <view class="expand-more" @click="onToggleMoreOptions">
        <text class="expand-text">{{ showMoreOptions ? '收起选项' : '展开更多' }}</text>
        <text class="expand-icon" :style="{ transform: showMoreOptions ? 'rotate(90deg)' : 'rotate(0)' }"> ▽ </text>
      </view>
      
      <!-- 社交按钮: 和好友一起玩/天梯赛 -->
      <view class="social-buttons">
        <!-- 和好友一起玩 -->
        <view class="social-button" @click="onPlayWithFriend">
          <image class="button-icon" src="https://pic1.imgdb.cn/item/67f3c61ee381c3632bee9022.png" mode="aspectFit"></image>
          <text class="button-text">和好友一起玩</text>
        </view>
        
        <!-- 天梯赛 -->
        <view class="social-button" @click="onPlayLadder">
          <image class="button-icon" src="https://pic1.imgdb.cn/item/67f3c61ee381c3632bee9020.png" mode="aspectFit"></image>
          <text class="button-text">天梯赛</text>
        </view>
      </view>
    </view>
    
    <!-- 时间选择弹出层 -->
    <uni-popup ref="timePopup" type="center">
      <view class="popup-content">
        <view class="popup-title">选择时间控制</view>
        <view class="popup-options">
          <view class="popup-option" :class="{ 'selected': timeControl === '10 min' }" @click="onSelectTime('10 min')">
            <text class="option-text">10 min</text>
          </view>
          <view class="popup-option" :class="{ 'selected': timeControl === '15 min' }" @click="onSelectTime('15 min')">
            <text class="option-text">15 min</text>
          </view>
          <view class="popup-option" :class="{ 'selected': timeControl === '30 min' }" @click="onSelectTime('30 min')">
            <text class="option-text">30 min</text>
          </view>
        </view>
        <view class="popup-close" @click="closeTimePopup">确定</view>
      </view>
    </uni-popup>
    
    <!-- 模式选择弹出层 -->
    <uni-popup ref="modePopup" type="center">
      <view class="popup-content">
        <view class="popup-title">选择游戏模式</view>
        <view class="popup-options">
          <view class="popup-option" :class="{ 'selected': gameMode === 'standard' }" @click="onSelectMode('standard')">
            <image class="option-icon" src="/static/images/match/pieces/black-pawn.png" mode="aspectFit"></image>
            <text class="option-text">标准模式</text>
          </view>
          <view class="popup-option" :class="{ 'selected': gameMode === 'quick' }" @click="onSelectMode('quick')">
            <image class="option-icon" src="/static/images/match/pieces/black-knight.png" mode="aspectFit"></image>
            <text class="option-text">快速模式</text>
          </view>
        </view>
        <view class="popup-close" @click="closeModePopup">确定</view>
      </view>
    </uni-popup>
    
    <!-- 匹配状态弹窗 -->
    <matching-status-popup 
      ref="matchingStatusPopup"
      :opponent="selectedOpponent || selectedFriend"
      :inviteId="currentInviteId"
      :time-control="timeControl"
      :play-as="playAs"
      v-if="showMatchingPopup"
      @cancel="handleCancelInvite"
      @close="handleMatchingPopupClose"
    />
  </view>
</template>

<script>
import uniPopup from '@/components/uni-popup/uni-popup.vue';
import FriendsTab from './FriendsTab.vue';
import MatchingStatusPopup from '../MatchingStatusPopup.vue';
import { getOpponentsList, addChessFriendPair, getInvitationStatus, cancelInvitation, clearPendingInvitations } from '@/api/pair';

export default {
  components: {
    uniPopup,
    FriendsTab,
    MatchingStatusPopup
  },
  props: {
    timeControl: {
      type: String,
      default: '10 min'
    },
    gameMode: {
      type: String,
      default: 'standard'
    },
    playAs: {
      type: String,
      default: 'random'
    },
    showMoreOptions: {
      type: Boolean,
      default: false
    },
    matching: {
      type: Boolean,
      default: false
    },
    isLeaderboardMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showFriendsTab: false,
      showFriendGameSettings: false,
      selectedFriend: {
        id: 0,
        userName: '',
        rating: 0,
        avatar: '',
        badge: ''
      },
      opponentsList: [],
      opponentSearchText: '',
      showOpponentDropdown: false,
      selectedOpponent: null,
      loading: false,
      
      // 添加邀请相关状态
      currentInviteId: '', // 当前邀请ID
      inviteStatusTimer: null, // 查询邀请状态的定时器
      inviteStatus: 0, // 0-待接受, 1-已接受, 2-已拒绝
      showMatchingPopup: false, // 是否显示匹配弹窗
      inviteStatusErrorCount: undefined, // 用于记录查询失败次数
    }
  },
  methods: {
    onToggleMoreOptions() {
      this.$emit('toggle-more-options');
    },
    
    startGame() {
      // 如果有选中的对手，发送邀请
      if (this.selectedOpponent) {
        console.log('邀请对手:', this.selectedOpponent);
        
        // 获取当前用户ID
        const userId = uni.getStorageSync('userId') || '';
        if (!userId) {
          uni.showToast({
            title: '用户未登录，无法发送邀请',
            icon: 'none'
          });
          return;
        }
        
        // 确定发起方执棋颜色
        const sourceOnePart = this.playAs === 'black' ? 1 : (this.playAs === 'white' ? 2 : (Math.random() < 0.5 ? 1 : 2));
        // 设置接受方执棋颜色（与发起方相反）
        const acceptOnePart = sourceOnePart === 1 ? 2 : 1;
        
        // 添加时间戳，避免邀请数据重复
        const inviteData = {
          sourceUserId: userId,
          sourceUserAccount: uni.getStorageSync('username') || '',
          sourceOnePart: sourceOnePart,
          acceptUserId: this.selectedOpponent.id,
          acceptUserAccount: this.selectedOpponent.userName || '',
          acceptOnePart: acceptOnePart,
          inviteStatus: 0, // 0-待接受
          timestamp: new Date().getTime() // 添加时间戳
        };
        
        // 先清理旧的邀请，再发送新邀请
        clearPendingInvitations(userId).then(() => {
          // 发送邀请请求到后端
          return addChessFriendPair(inviteData);
        }).then(res => {
          if (res.success) {
            // 邀请发送成功
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
              return;
            }
            
            this.currentInviteId = inviteId;
            console.log('当前邀请ID已设置为:', this.currentInviteId);
            
            // 显示匹配弹窗
            this.showMatchingPopup = true;
            this.$nextTick(() => {
              this.$refs.matchingStatusPopup.open();
            });
            
            // 开始轮询邀请状态
            this.startPollingInviteStatus();
            
            // 通知父组件处理邀请
            this.$emit('invite-friend', this.selectedOpponent, {
              sourceOnePart,
              acceptOnePart,
              inviteId: this.currentInviteId
            });
          } else {
            uni.showToast({
              title: res.message || '邀请发送失败',
              icon: 'none'
            });
          }
        }).catch(err => {
          console.error('发送邀请失败:', err);
          uni.showToast({
            title: '邀请发送失败，请稍后重试',
            icon: 'none'
          });
        });
      } else if (this.opponentSearchText) {
        // 如果只输入了文本但没有从列表选中对手，提示用户
        uni.showToast({
          title: '请从列表中选择一个有效的对手',
          icon: 'none'
        });
      } else {
        // 没有选择对手，提示
        uni.showToast({
          title: '请先选择一个对手',
          icon: 'none'
        });
      }
    },
    
    // 开始轮询邀请状态
    startPollingInviteStatus() {
      if (!this.currentInviteId) return;
      
      // 清除可能的现有定时器
      this.stopPollingInviteStatus();
      
      // 每3秒查询一次邀请状态
      this.inviteStatusTimer = setInterval(() => {
        this.queryInviteStatus();
      }, 3000);
      
      // 立即执行一次
      this.queryInviteStatus();
    },
    
    // 停止轮询邀请状态
    stopPollingInviteStatus() {
      if (this.inviteStatusTimer) {
        clearInterval(this.inviteStatusTimer);
        this.inviteStatusTimer = null;
      }
    },
    
    // 查询邀请状态
    queryInviteStatus() {
      if (!this.currentInviteId) return;
      
      console.log('开始查询邀请状态，ID:', this.currentInviteId);
      
      // 确保ID是有效的数字
      if (typeof this.currentInviteId !== 'string' || !this.currentInviteId.match(/^[0-9]+$/)) {
        console.error('无效的邀请ID格式:', this.currentInviteId);
        this.stopPollingInviteStatus();
        return;
      }
      
      getInvitationStatus(this.currentInviteId).then(res => {
        console.log('邀请状态查询结果:', res);
        if (res.success && res.result) {
          // 更新邀请状态
          this.inviteStatus = res.result.inviteStatus;
          
          // 根据状态处理
          if (this.inviteStatus === 1) {
            // 对方接受了邀请
            this.stopPollingInviteStatus();
            this.showMatchingPopup = false;
            this.$refs.matchingStatusPopup?.close();
            
            // 通知父组件处理接受邀请
            this.$emit('invite-accepted', {
              inviteId: this.currentInviteId,
              opponentId: this.selectedOpponent?.id || (this.selectedFriend?.id > 0 ? this.selectedFriend.id : 0)
            });
            
            uni.showToast({
              title: '对方接受了邀请，即将开始对局',
              icon: 'none'
            });
          } else if (this.inviteStatus === 2) {
            // 对方拒绝了邀请
            this.stopPollingInviteStatus();
            this.showMatchingPopup = false;
            this.$refs.matchingStatusPopup?.close();
            
            uni.showToast({
              title: '对方拒绝了邀请',
              icon: 'none'
            });
          }
          // 状态为0时继续等待
        } else {
          console.error('查询邀请状态失败:', res.message);
          // 如果多次查询失败，尝试停止轮询
          if (this.inviteStatusErrorCount === undefined) {
            this.inviteStatusErrorCount = 1;
          } else {
            this.inviteStatusErrorCount++;
          }
          
          // 连续失败3次后停止轮询
          if (this.inviteStatusErrorCount >= 3) {
            console.log('连续查询失败超过3次，停止轮询');
            this.stopPollingInviteStatus();
            uni.showToast({
              title: '查询邀请状态失败，请重试',
              icon: 'none'
            });
          }
        }
      }).catch(err => {
        console.error('查询邀请状态失败:', err);
      });
    },
    
    // 取消邀请
    handleCancelInvite(inviteId) {
      console.log('取消邀请:', inviteId || this.currentInviteId);
      
      // 优先使用传入的inviteId，否则使用当前保存的ID
      const id = inviteId || this.currentInviteId;
      
      if (!id) {
        console.error('没有有效的邀请ID，无法取消邀请');
        return;
      }
      
      cancelInvitation(id).then(res => {
        console.log('取消邀请结果:', res);
        if (res.success) {
          // 停止轮询
          this.stopPollingInviteStatus();
          this.showMatchingPopup = false;
          this.$refs.matchingStatusPopup?.close();
          
          uni.showToast({
            title: '已取消邀请',
            icon: 'none'
          });
          
          // 通知父组件
          this.$emit('cancel-matching');
        } else {
          uni.showToast({
            title: res.message || '取消邀请失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('取消邀请失败:', err);
        uni.showToast({
          title: '操作失败，请稍后重试',
          icon: 'none'
        });
      });
    },
    
    onCancelMatching() {
      // 如果有邀请ID，先尝试取消邀请
      if (this.currentInviteId) {
        this.handleCancelInvite();
      } else {
      this.$emit('cancel-matching');
      }
    },
    
    showModeSelector() {
      // 已禁用模式选择功能
      // this.$refs.modePopup.open();
    },
    
    closeModePopup() {
      this.$refs.modePopup.close();
    },
    
    onSelectMode(mode) {
      // 固定为标准模式，不允许修改
      this.$emit('select-game-mode', 'standard');
      this.closeModePopup();
    },
    
    showTimeSelector() {
      // 已禁用时间选择功能
      // this.$refs.timePopup.open('center');
    },
    
    closeTimePopup() {
      this.$refs.timePopup.close();
    },
    
    onSelectTime(time) {
      // 固定为10min，不允许修改
      this.$emit('select-time', '10 min');
      this.closeTimePopup();
    },
    
    onSelectPlayAs(color) {
      this.$emit('select-play-as', color);
    },
    
    // 处理选择好友
    onSelectFriend(user) {
      console.log('选择用户', user);
      this.selectedFriend = user;
      this.showFriendsTab = false;
      this.showFriendGameSettings = true;
    },
    
    // 处理邀请好友
    onInviteFriend() {
      console.log('邀请用户', this.selectedFriend);
      
      // 获取当前用户ID
      const userId = uni.getStorageSync('userId') || '';
      if (!userId) {
        uni.showToast({
          title: '用户未登录，无法发送邀请',
          icon: 'none'
        });
        return;
      }
      
      // 确定发起方执棋颜色
      const sourceOnePart = this.playAs === 'black' ? 1 : (this.playAs === 'white' ? 2 : (Math.random() < 0.5 ? 1 : 2));
      // 设置接受方执棋颜色（与发起方相反）
      const acceptOnePart = sourceOnePart === 1 ? 2 : 1;
      
      // 添加时间戳，避免邀请数据重复
      const inviteData = {
        sourceUserId: userId,
        sourceUserAccount: uni.getStorageSync('username') || '',
        sourceOnePart: sourceOnePart,
        acceptUserId: this.selectedFriend.id,
        acceptUserAccount: this.selectedFriend.userName || this.selectedFriend.name || '',
        acceptOnePart: acceptOnePart,
        inviteStatus: 0, // 0-待接受
        timestamp: new Date().getTime() // 添加时间戳
      };
      
      // 先清理旧的邀请，再发送新邀请
      clearPendingInvitations(userId).then(() => {
        // 发送邀请请求到后端
        return addChessFriendPair(inviteData);
      }).then(res => {
        if (res.success) {
          // 发送邀请成功
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
            return;
          }
          
          this.currentInviteId = inviteId;
          console.log('当前邀请ID已设置为:', this.currentInviteId);
          
          // 显示匹配弹窗
      this.showFriendGameSettings = false;
          this.showMatchingPopup = true;
          this.$nextTick(() => {
            this.$refs.matchingStatusPopup.open();
          });
          
          // 开始轮询邀请状态
          this.startPollingInviteStatus();
          
          // 通知父组件处理邀请
          this.$emit('invite-friend', this.selectedFriend, {
            sourceOnePart: sourceOnePart,
            acceptOnePart: acceptOnePart,
            inviteId: this.currentInviteId
          });
        } else {
          uni.showToast({
            title: res.message || '发送邀请失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('发送邀请失败', err);
        uni.showToast({
          title: '发送邀请失败，请稍后重试',
          icon: 'none'
        });
      });
    },
    
    // 处理链接邀请
    onShareInviteLink() {
      console.log('分享邀请链接');
      this.$emit('share-invite-link', this.selectedFriend);
    },
    
    onPlayWithFriend() {
      this.showFriendsTab = true;
      this.$emit('play-with-friend');
    },
    
    onPlayLadder() {
      this.$emit('play-ladder');
    },
    
    // 处理匹配弹窗关闭
    handleMatchingPopupClose() {
      this.showMatchingPopup = false;
    },
    
    // 获取对手列表
    fetchOpponentsList() {
      this.loading = true;
      getOpponentsList({
        pageNo: 1,
        pageSize: 20
      }).then(res => {
        console.log('获取对手列表响应:', res);
        if (res.success && res.result) {
          // 直接使用result数组，而不是寻找result.records
          this.opponentsList = Array.isArray(res.result) ? res.result : [];
          console.log('对手列表处理后数据:', this.opponentsList);
          
          // 如果遇到数据结构问题，尝试转换数据
          if (this.opponentsList.length > 0 && !this.opponentsList[0].userName) {
            this.opponentsList = this.opponentsList.map(item => ({
              id: item.id,
              userName: item.userName || item.username || '',
              rating: item.rating || 0,
              avatar: item.avatar || '/static/images/match/avatar-default.png'
            }));
            console.log('对手列表数据转换后:', this.opponentsList);
          }
        } else {
          const errorMsg = res.message || '获取对手列表失败';
          console.error('获取对手列表失败:', errorMsg);
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
      }).catch(err => {
        console.error('获取对手列表请求异常:', err);
        uni.showToast({
          title: '网络请求异常，请检查网络连接',
          icon: 'none',
          duration: 2000
        });
      }).finally(() => {
        this.loading = false;
      });
    },
    
    // 选择对手
    selectOpponent(opponent) {
      console.log('选择对手:', opponent);
      
      // 确保对手数据格式一致
      this.selectedOpponent = {
        id: opponent.id,
        userName: opponent.userName || opponent.username || '未知用户',
        rating: opponent.rating || 0,
        avatar: opponent.avatar || '/static/images/match/avatar-default.png'
      };
      
      this.opponentSearchText = this.selectedOpponent.userName;
      this.showOpponentDropdown = false;
      
      // 显示选择成功提示
      uni.showToast({
        title: `已选择对手: ${this.selectedOpponent.userName}`,
        icon: 'none',
        duration: 1500
      });
    },
    
    // 搜索对手
    onOpponentInputFocus() {
      if (!this.opponentsList.length) {
        this.fetchOpponentsList();
      }
      this.showOpponentDropdown = true;
    },
    
    // 过滤对手列表
    filteredOpponents() {
      // 调试输出
      console.log('过滤前的对手列表:', this.opponentsList);
      
      if (!this.opponentSearchText) {
        return this.opponentsList;
      }
      
      const searchText = this.opponentSearchText.toLowerCase();
      // 更灵活地处理各种可能的字段名
      const filtered = this.opponentsList.filter(item => {
        // 尝试多种可能的字段名
        const userName = item.userName || item.username || '';
        const result = userName.toLowerCase().includes(searchText);
        console.log(`对手 ${JSON.stringify(item)} 是否匹配 "${searchText}": ${result}`);
        return result;
      });
      
      console.log('过滤后的对手列表:', filtered);
      return filtered;
    },
    
    // 点击外部区域关闭下拉框
    closeDropdown() {
      this.showOpponentDropdown = false;
    }
  },
  mounted() {
    // 只有在展开更多选项时才初始化加载对手列表
    if (this.showMoreOptions) {
      this.fetchOpponentsList();
    }
  },
  beforeDestroy() {
    // 清除定时器
    this.stopPollingInviteStatus();
  },
  watch: {
    // 监听showMoreOptions变化，在展开更多选项时加载对手列表
    showMoreOptions(newVal) {
      if (newVal && this.opponentsList.length === 0) {
        this.fetchOpponentsList();
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* 直接引入公共样式 */
@import "../../../styles/chess/chess-common.scss";

// 好友游戏设置界面
.friend-game-settings {
  padding: 20rpx;
  
  .friend-header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .back-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .title {
      flex: 1;
      text-align: center;
      
      .title-text {
        font-size: 36rpx;
        color: #FFFFFF;
        font-weight: bold;
      }
    }
  }
  
  .selected-friend {
    display: flex;
    align-items: center;
    flex-direction: column;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10rpx;
    padding: 20rpx;
    margin: 30rpx auto;
    width: 95%;
    
    .friend-avatar {
      width: 150rpx;
      height: 150rpx;
      border-radius: 50rpx;
      margin: 40rpx;
    }
    
    .friend-info {
      flex: 1;
      
      .friend-name {
        font-size: 36rpx;
        color: #FFFFFF;
        font-weight: bold;
        margin-bottom: 8rpx;
      }
      
      .friend-rating {
        font-size: 28rpx;
        color: #AAAAAA;
      }
    }
  }
}

// 匹配中状态卡片（内嵌版本）
.matching-card-inline {
  width: 95%;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20rpx auto 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);
  
  .piece-icon {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 30rpx;
  }
  
  .friend-avatar {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 30rpx;
    border-radius: 60rpx;
  }
  
  .matching-time {
    font-size: 40rpx;
    font-weight: bold;
    color: #EEEEEE;
    margin-bottom: 20rpx;
  }
  
  .matching-status {
    font-size: 32rpx;
    color: #555;
    font-weight: bold;
    margin-bottom: 40rpx;
  }
  
  .cancel-button {
    width: 80%;
    padding: 20rpx 0;
    background-color: #fff;
    color: #333;
    border-radius: 10rpx;
    font-size: 32rpx;
    text-align: center;
  }
}

// 游戏模式选择部分
.game-mode-section {
  margin: 20rpx 0;
  align-items: center;
  justify-content: center;
  display: flex;
}

.mode-card {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  width: 95%;
  padding: 25rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  
  .mode-icon {
    width: 60rpx;
    height: 60rpx;
    margin-right: 20rpx;
  }
  
  .mode-text {
    flex: 1;
    font-size: 32rpx;
    color: #EEEEEE;
    font-weight: bold;
  }
  
  .mode-arrow {
    font-size: 32rpx;
    color: #999;
    transform: rotate(-90deg);
  }
}

// 指定对手
.opponent-selector {
  position: relative;
  width: 100%;
}
  
  .opponent-input {
    width: 100%;
    color: #EEEEEE !important;
    background-color: transparent;
  padding: 10rpx 60rpx 10rpx 10rpx;
    font-weight: bold;
    font-size: 32rpx;
}

.dropdown-icon {
  position: absolute;
  right: 10rpx;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.opponent-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #2a2a2a;
  border-radius: 0 0 10rpx 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
  z-index: 10;
  max-height: 300rpx;
  overflow-y: auto;
}

.opponent-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid #3a3a3a;
}

.opponent-item:active {
  background-color: #3a3a3a;
}

.opponent-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.opponent-info {
  display: flex;
  flex-direction: row;
  align-items: center;
    }

.opponent-name {
  font-size: 28rpx;
  color: #EEEEEE;
}

.opponent-rating {
  font-size: 24rpx;
  color: #AAAAAA;
  margin-left: 10rpx;
}

.loading-item, .no-data-item {
  padding: 20rpx;
  text-align: center;
  color: #AAAAAA;
  font-size: 28rpx;
}

// 时间选择模块
.time-selector {
  display: flex;
  width: 95%; 
 
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  padding: 25rpx;
  margin: 20rpx auto;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  
  .clock-icon {
    width: 60rpx;
    height: 60rpx;
    margin-right: 20rpx;
  }
  
  .time-text {
    flex: 1;
    color: #EEEEEE;
    font-weight: bold;
    font-size: 32rpx;
  }
  
  .dropdown-icon {
    color: #999;
    font-size: 32rpx;
    transform: rotate(-90deg);
  }
}

// 选择颜色
.play-as-section {
  margin: 20rpx auto;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  align-items: center;
  justify-content: center;
  display: flex;
  width: 95%;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  
  .section-title {
    color: #EEE;
    font-size: 32rpx;
    font-weight: bold;
    margin: 10rpx 0;
    text-align: center;
  }
  
  .colors-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
    
    .color-option {
      width: 90rpx;
      height: 90rpx;
      margin: 0 20rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 10rpx;
      border: 4rpx solid transparent;
      
      &.selected {
        border-color: #81B64C;
      }
      
      .white-piece, .black-piece, .random-piece {
        width: 90%;
        height: 90%;
        border-radius: 50%;
      }
      
      .white-piece {
        background-color: white;
        border: 2rpx solid #ccc;
      }
      
      .black-piece {
        background-color: black;
      }
      
      .random-piece {
        background: linear-gradient(to right, white 0%, white 50%, black 50%, black 100%);
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        
        .random-text {
          position: absolute;
          font-size: 40rpx;
          font-weight: bold;
          color: #444;
        }
      }
    }
  }
}

// 开玩按钮
.play-button {
  background-color: #81B64C;
  border-radius: 10rpx;
  width: 95%;
  padding: 30rpx 0;
  margin: 30rpx 0;
  text-align: center;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
  
  .button-text {
    color: white;
    font-size: 40rpx;
    font-weight: bold;
  }
}

// 展开更多
.expand-more {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 30rpx 0 50rpx 0;
  
  .expand-text {
    color: #eeeeee6d;
    font-size: 28rpx;
    font-weight: bold;
    margin-right: 10rpx;
  }
  
  .expand-icon {
    color: white;
    font-size: 28rpx;
    transition: transform 0.3s;
  }
}

// 社交按钮样式（好友游戏和天梯赛）
.social-button {
  display: flex;
  align-items: center;
  width: 95%;
  padding: 30rpx;
  margin: 20rpx auto;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  
  .button-icon {
    width: 60rpx;
    height: 60rpx;
    margin-right: 20rpx;
  }
  
  .button-text {
    flex: 1;
    font-weight: bold;
    font-size: 34rpx;
    color: #fff;
    text-align: center;
  }
}

.invite-link-container {
  width: 95%;
  margin: 20rpx auto;
  
  .invite-link-button {
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10rpx;
    padding: 25rpx;
    
    .invite-link-text {
      flex: 1;
      margin-left: 20rpx;
      color: #EEEEEE;
      font-size: 28rpx;
      text-align: center;
    }
  }
}

.leaderboard-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  margin-bottom: 30rpx;
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .trophy-icon, .points-icon, .winrate-icon {
      width: 60rpx;
      height: 60rpx;
      margin-bottom: 10rpx;
    }
    
    .stat-label {
      font-size: 28rpx;
      color: #AAAAAA;
    }
    
    .stat-value {
      font-size: 32rpx;
      font-weight: bold;
      color: #FFFFFF;
    }
  }
}

// 添加回被删除的option-section样式
.option-section {
  margin: 20rpx auto;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  padding: 20rpx;
  width: 95%;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(255, 255, 255, 0.1);
}
</style>
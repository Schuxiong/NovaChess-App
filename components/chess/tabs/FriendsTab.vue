<!-- components/chess/tabs/FriendsTab.vue -->
<template>
  <view class="friends-tab">
    <!-- 返回和标题区域 -->
    <view class="header">
      <view class="back-button" @click="onBack">
        <uni-icons type="left" size="20" color="#AAAAAA"></uni-icons>
      </view>
      <view class="title">
        <image class="handshake-icon" src="https://pic1.imgdb.cn/item/67f3c61ee381c3632bee9022.png" mode="aspectFit"></image>
        <text class="title-text">和好友一起玩！</text>
      </view>
    </view>

    <!-- 搜索区域 -->
    <view class="search-container">
      <view class="search-box">
        <uni-icons type="search" size="18" color="#AAAAAA"></uni-icons>
        <input 
          class="search-input" 
          type="text" 
          placeholder="通过名称搜索好友" 
          placeholder-style="color: rgba(255,255,255,0.5);"
          v-model="searchQuery"
          @input="onSearch"
        />
      </view>
    </view>

    <!-- 搜索结果区域 -->
    <view class="search-results">
      <view class="result-header">
        <text class="result-title">查找到的用户</text>
        <text class="result-count">{{ searchResults.length }}</text>
      </view>
      
      <!-- 用户列表 -->
      <view class="user-list">
        <view 
          v-for="(user, index) in searchResults" 
          :key="index" 
          class="user-item"
          @click="inviteFriend(user)"
        >
          <image class="user-avatar" :src="user.avatar" mode="aspectFit"></image>
          <view class="user-info">
            <text class="user-name">{{ user.userName }}</text>
            <text class="user-rating">({{ user.rating }})</text>
          </view>
          <image v-if="user.badge" class="user-badge" :src="user.badge" mode="aspectFit"></image>
        </view>
      </view>
    </view>

    <!-- 链接邀请区域 -->
    <view class="invite-link-container" @click="shareInviteLink">
      <view class="invite-link-button">
        <uni-icons type="link" size="20" color="#EEEEEE"></uni-icons>
        <text class="invite-link-text">通过链接邀请好友加入</text>
        <uni-icons type="more-filled" size="20" color="#AAAAAA"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script>
import { getFriendList, searchFriends } from '@/api/friend'
import { getUserData } from '@/api/system/user'

export default {
  name: 'FriendsTab',
  data() {
    return {
      searchQuery: '',
      searchResults: [], // 搜索结果列表
      friendsList: [], // 好友列表
      isSearching: false, // 是否正在搜索
      currentUser: null // 当前用户信息
    }
  },
  methods: {
    // 返回上一页
    onBack() {
      this.$emit('back');
    },
    
    // 搜索用户
    async onSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = [...this.friendsList];
        return;
      }
      
      this.isSearching = true;
      try {
        const response = await searchFriends({
          depart_ids: this.currentUser?.departIds || [],
          username: this.searchQuery,
          pageNo: 1,
          pageSize: 20
        });
        
        if (response && response.result && response.result.records) {
          this.searchResults = response.result.records.map(user => ({
            id: user.id,
            userName: user.username || user.realname,
            rating: user.rating || 1200,
            avatar: user.avatar || '/static/images/match/avatar-default.png',
            badge: user.isVip ? '/static/images/match/badge-red.png' : ''
          }));
        }
      } catch (error) {
        console.error('搜索用户失败:', error);
        uni.showToast({
          title: '搜索失败',
          icon: 'none'
        });
      } finally {
        this.isSearching = false;
      }
    },
    
    // 邀请好友
    inviteFriend(user) {
      console.log('选择好友:', user.userName);
      this.$emit('select-friend', user);
    },
    
    // 分享邀请链接
    shareInviteLink() {
      console.log('分享邀请链接');
      this.$emit('share-invite-link');
    },
    
    // 加载好友列表
    async loadFriendsList() {
      try {
        console.log('开始加载好友列表...');
        
        // 首先尝试从store获取用户信息
        const userInfo = this.$store.state.user;
        console.log('Store用户信息:', userInfo);
        
        // 如果store中没有用户信息，尝试获取用户信息
        if (!userInfo.token) {
          console.warn('用户未登录，无法获取好友列表');
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          });
          return;
        }
        
        // 如果store中没有详细用户信息，先获取用户信息
        if (!userInfo.name) {
          console.log('获取用户详细信息...');
          await this.$store.dispatch('GetInfo');
        }
        
        // 构建请求参数 - 如果用户部门ID为空，默认使用[1]
         let departIds = [];
         
         // 尝试从多个可能的字段获取部门ID
         if (userInfo.departIds && userInfo.departIds.length > 0) {
           departIds = userInfo.departIds;
         } else if (userInfo.depart_ids && userInfo.depart_ids.length > 0) {
           departIds = userInfo.depart_ids;
         } else {
           // 如果部门ID为空，默认设置为[1]
           departIds = [1];
         }
         
         const requestParams = {
           depart_ids: departIds,
           pageNo: 1,
           pageSize: 50
         };
        console.log('请求参数:', requestParams);
        
        const response = await getFriendList(requestParams);
        console.log('API响应:', response);
        
        // 根据实际API响应结构处理数据
        // API返回格式: {success: true, result: [{id: "xxx", userName: "xxx"}, ...]}
        if (response && response.result && Array.isArray(response.result)) {
          this.friendsList = response.result.map(user => ({
            id: user.id,
            userName: user.userName || user.username || user.realname,
            rating: user.score || user.rating || 1200,
            avatar: user.avatar || '/static/images/match/avatar-default.png',
            badge: user.isVip ? '/static/images/match/badge-red.png' : ''
          }));
          
          console.log('处理后的好友列表:', this.friendsList);
          
          // 初始化搜索结果为好友列表
          this.searchResults = [...this.friendsList];
        } else {
          console.log('响应数据格式不正确或无数据:', response);
          this.friendsList = [];
          this.searchResults = [];
        }
      } catch (error) {
        console.error('加载好友列表失败:', error);
        uni.showToast({
          title: '加载好友列表失败',
          icon: 'none'
        });
      }
    }
  },
  
  mounted() {
    this.loadFriendsList();
  }
}
</script>

<style lang="scss" scoped>
.friends-tab {
  padding: 20rpx;
  color: #EEEEEE;
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;
    
    .back-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .title {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .handshake-icon {
        width: 40rpx;
        height: 40rpx;
        margin-right: 10rpx;
      }
      
      .title-text {
        font-size: 36rpx;
        font-weight: bold;
        color: #FFFFFF;
      }
    }
  }
  
  .search-container {
    margin-bottom: 30rpx;
    
    .search-box {
      display: flex;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8rpx;
      padding: 20rpx;
      
      .search-input {
        flex: 1;
        height: 60rpx;
        margin-left: 20rpx;
        color: #FFFFFF;
        font-size: 28rpx;
      }
    }
  }
  
  .search-results {
    margin-bottom: 30rpx;
    
    .result-header {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      
      .result-title {
        font-size: 28rpx;
        color: #AAAAAA;
      }
      
      .result-count {
        margin-left: 20rpx;
        font-size: 28rpx;
        color: #FFFFFF;
      }
    }
    
    .user-list {
      .user-item {
        display: flex;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
        
        .user-avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: 40rpx;
          margin-right: 20rpx;
        }
        
        .user-info {
          flex: 1;
          
          .user-name {
            font-size: 32rpx;
            color: #FFFFFF;
            margin-bottom: 5rpx;
          }
          
          .user-rating {
            font-size: 24rpx;
            color: #AAAAAA;
          }
        }
        
        .user-badge {
          width: 40rpx;
          height: 40rpx;
        }
      }
    }
  }
  
  .invite-link-container {
    margin-top: 30rpx;
    
    .invite-link-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8rpx;
      padding: 30rpx 20rpx;
      
      .invite-link-text {
        flex: 1;
        margin-left: 20rpx;
        font-size: 28rpx;
        color: #EEEEEE;
      }
    }
  }
}
</style>
<template>
  <view class="mail-container">
    <!-- 收件列表页 - 默认显示 -->
    <view class="inbox-page" v-if="currentPage === 'inbox'">
      <view class="inbox-header">
        <view class="new-message" @click="showNewMessage">
          <text>+ New Message</text>
        </view>
        <view class="inbox-tabs">
          <view class="tab active">
            <text>收件</text>
            <text class="tab-subtitle">Inbox</text>
          </view>
          <view class="tab">
            <text>未读</text>
            <text class="tab-subtitle">Unread</text>
          </view>
        </view>
      </view>
      
      <view class="message-list">
        <view class="message-item" v-for="(item, index) in chatSessions" :key="index" @click="openChat(item)">
          <image class="avatar" :src="item && item.avatar ? item.avatar : '/static/images/mail/default-avatar.png'" mode="aspectFill"></image>
          <view class="message-content">
            <view class="message-sender">{{item.username}}</view>
            <view class="message-brief">{{item.lastMessage}}</view>
          </view>
          <view class="message-time">{{formatTime(item.lastMessageTime)}}</view>
        </view>
      </view>
      
      <view class="all-messages">
        <text>All Messages</text>
      </view>
    </view>
    
    <!-- 聊天详情页 -->
    <view class="chat-page" v-if="currentPage === 'chat'">
      <view class="chat-header">
        <view class="back-btn" @click="backToInbox">
          <text class="back-icon">←</text>
        </view>
        <view class="chat-title">
          <text>和{{currentChat}}的聊天</text>
        </view>
        <view class="delete-chat" @click="deleteChat">
          <text>删除聊天</text>
        </view>
      </view>
      
      <view class="chat-messages" style="height: 70vh; overflow-y: auto; -webkit-overflow-scrolling: touch;">
        <view class="chat-message" v-for="(item, index) in chatMessagesSorted" :key="index"
          :class="{'my-message': item.esSenderName === userInfo.username, 'other-message': item.esSenderName !== userInfo.username}">
          <view v-if="item.esSenderName !== userInfo.username" class="message-row left">
            <image class="avatar" :src="item.esSenderAvatar || item.esReceiverAvatar || item.avatar || '/static/images/mail/default-avatar.png'" mode="aspectFill"></image>
            <view class="message-info">
              <view class="message-sender-time">
                <text class="sender">{{item.esSenderName}}</text>
                <text class="time">{{formatTime(item.esSendTime)}}</text>
              </view>
              <view class="message-bubble">
                <text class="message-text">{{item.esContent}}</text>
              </view>
            </view>
          </view>
          <view v-else class="message-row right">
            <view class="message-info">
              <view class="message-sender-time">
                <text class="sender">{{item.esSenderName}}</text>
                <text class="time">{{formatTime(item.esSendTime)}}</text>
              </view>
              <view class="message-bubble">
                <text class="message-text">{{item.esContent}}</text>
              </view>
            </view>
            <image class="avatar" :src="item.esSenderAvatar || (item && item.avatar) || '/static/images/mail/avatar1.png'" mode="aspectFill"></image>
          </view>
        </view>
        <view id="chat-bottom"></view>
      </view>
      
      <view class="message-input-area">
        <view class="format-icons">
          <text class="format-icon">⊞</text>
          <text class="format-icon">⎘</text>
          <text class="format-icon">☺</text>
          <text class="format-icon">B</text>
          <text class="format-icon">I</text>
          <text class="format-icon">⎆</text>
          <text class="format-icon">⋮⋮</text>
        </view>
        <view class="input-box">
          <textarea class="message-input" placeholder="输入要发送的消息" v-model="messageText"></textarea>
        </view>
        <view class="send-btn" @click="sendMessage">
          <text>发送</text>
        </view>
      </view>
    </view>
    
    <!-- 新消息发送页 -->
    <view class="new-message-page" v-if="currentPage === 'new'">
      <view class="new-message-header">
        <view class="back-btn" @click="backToInbox">
          <text class="back-icon">←</text>
        </view>
        <view class="page-title">
          <text>发送新消息</text>
        </view>
      </view>
      
      <view class="recipient-input">
        <text class="to-label">To:</text>
        <input type="text" placeholder="—" v-model="recipient" />
      </view>
      
      <view class="message-input-area">
        <view class="format-icons">
          <text class="format-icon">⊞</text>
          <text class="format-icon">⎘</text>
          <text class="format-icon">☺</text>
          <text class="format-icon">B</text>
          <text class="format-icon">I</text>
          <text class="format-icon">⎆</text>
          <text class="format-icon">⋮⋮</text>
        </view>
        <view class="input-box">
          <textarea class="message-input" placeholder="输入要发送的消息" v-model="newMessageText"></textarea>
        </view>
        <view class="send-btn" @click="sendNewMessage">
          <text>发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { sendChatMessage, getChatHistory, getMessageList, getChatSessions } from '@/api/mail'
import { getUserData } from '@/api/system/user'

export default {
  data() {
    return {
      currentPage: 'inbox', // 'inbox', 'chat', 'new'
      currentChat: '',
      messageText: '',
      recipient: '',
      newMessageText: '',
      messages: [],
      chatMessages: [],
      chatSessions: [],
      userInfo: null, // 存储用户信息
      // 新增排序后的聊天消息
      chatMessagesSorted: []
    }
  },
  created() {
    this.getUserInfo()
  },
  methods: {
    // 获取用户信息
    async getUserInfo() {
      try {
        const res = await getUserData()
        if (res.success) {
          console.log('获取用户信息成功:', res.result)
          // 由于store中没有SET_USERINFO mutation，需要使用现有的mutations
          // 存储用户名到store中
          this.$store.commit('SET_NAME', res.result.username || res.result.realname || '')
          // 存储头像到store中
          if (res.result.avatar) {
            this.$store.commit('SET_AVATAR', res.result.avatar)
          }
          // 将用户信息保存到本地变量中
          this.userInfo = res.result
          // 获取用户信息后再加载聊天会话
          this.loadChatSessions()
        } else {
          console.error('获取用户信息失败:', res)
          uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.showToast({
          title: '获取用户信息失败，请重新登录',
          icon: 'none'
        })
      }
    },
    
    // 显示新消息页面
    showNewMessage() {
      this.currentPage = 'new';
      this.recipient = '';
      this.newMessageText = '';
    },
    
    // 打开聊天详情
    async openChat(item) {
      this.currentPage = 'chat';
      this.currentChat = item.username;
      this.messageText = '';
      // 查找当前会话的用户ID
      const chatUserId = item && item.userId ? item.userId : null;
      await this.loadChatMessages(chatUserId);
    },
    
    // 加载聊天会话列表
    async loadChatSessions() {
      try {
        if (!this.userInfo || !this.userInfo.username) {
          console.error('本地用户信息不存在:', this.userInfo);
          uni.showToast({
            title: '用户信息未获取，请重新登录',
            icon: 'none'
          });
          return;
        }
        console.log('使用用户ID加载聊天会话:', this.userInfo.id);
        const res = await getChatSessions({
          userId: this.userInfo.id || this.userInfo.userId
        });
        // 按用户分组，获取每个用户的最新一条消息
        const groupedMessages = {};
        (res.result?.records || []).forEach(item => {
          const otherUser = item.esSenderName === this.userInfo.username ? item.esReceiverName : item.esSenderName;
          const otherUserId = item.esSenderName === this.userInfo.username ? item.esReceiverId : item.esSenderId;
          if (!groupedMessages[otherUser] || new Date(item.esSendTime) > new Date(groupedMessages[otherUser].esSendTime)) {
            groupedMessages[otherUser] = {...item, userId: otherUserId};
          }
        });
        this.chatSessions = Object.values(groupedMessages).map(item => ({
          username: item.esSenderName === this.userInfo.username ? item.esReceiverName : item.esSenderName,
          userId: item.esSenderName === this.userInfo.username ? item.esReceiverId : item.esSenderId,
          lastMessage: item.esContent || '',
          lastMessageTime: item.esSendTime || new Date().toISOString(),
          avatar: item.esSenderAvatar || item.esReceiverAvatar || item.avatar || '/static/images/mail/default-avatar.png'
        }));
      } catch (error) {
        console.error('加载聊天会话列表失败', error);
        uni.showToast({
          title: '加载会话失败',
          icon: 'none'
        });
      }
    },
    
    // 加载消息列表
    async loadMessages() {
      try {
        const res = await getMessageList({});
        this.messages = (res.result.records || []).map(item => ({
          ...item,
          esSenderName: item.esSenderName || item.createBy || '系统消息',
          esContent: item.esContent || '无内容',
          avatar: item.avatar || '/static/images/mail/default-avatar.png',
          esSendTime: item.esSendTime || new Date().toISOString()
        }));
      } catch (error) {
        console.error('加载消息列表失败', error);
        if(error.response && error.response.status === 500) {
          uni.showToast({
            title: '服务器错误，请稍后再试',
            icon: 'none'
          });
        } else {
          uni.showToast({
            title: '加载消息失败，请检查网络',
            icon: 'none'
          });
        }
      }
    },
    
    // 加载聊天记录
    async loadChatMessages(receiverId) {
      try {
        if (!this.userInfo || !this.userInfo.id) {
          console.error('加载聊天记录时用户信息不存在');
          uni.showToast({
            title: '用户信息未获取，请重新登录',
            icon: 'none'
          });
          return;
        }
        console.log('加载与用户的聊天记录:', receiverId);
        const res = await getChatHistory(
          this.userInfo.id,
          receiverId
        );
        // 兼容不同返回结构，确保为数组
        let chatList = [];
        if (Array.isArray(res.result)) {
          chatList = res.result;
        } else if (res.result && Array.isArray(res.result.records)) {
          chatList = res.result.records;
        } else {
          chatList = [];
        }
        this.chatMessages = chatList.map(item => {
          if (!item) {
            return {
              esSenderName: '系统消息',
              esContent: '无内容',
              avatar: '/static/images/mail/default-avatar.png',
              esSendTime: new Date().toISOString()
            };
          }
          return {
            ...item,
            esSenderName: item.esSenderName || item.createBy || '系统消息',
            esContent: item.esContent || '无内容',
            avatar: item.avatar || '/static/images/mail/default-avatar.png',
            esSendTime: item.esSendTime || new Date().toISOString()
          };
        });
        // 按时间正序排序（最早在上，最新在下）
        this.chatMessagesSorted = [...this.chatMessages].sort((a, b) => new Date(a.esSendTime) - new Date(b.esSendTime));
      } catch (error) {
        console.error('加载聊天记录失败', error);
      }
    },
    
    // 返回收件箱
    backToInbox() {
      this.currentPage = 'inbox';
    },
    
    // 发送消息
    async sendMessage() {
      if (!this.messageText.trim()) {
        uni.showToast({
          title: '消息不能为空',
          icon: 'none'
        });
        return;
      }
      console.log('准备发送消息给:', this.currentChat, '内容:', this.messageText);
      try {
        const res = await sendChatMessage({
          esReceiver: this.currentChat,
          esContent: this.messageText,
          esSenderName: this.userInfo.username,
          esReceiverName: this.currentChat,
          esSenderId: this.userInfo.id || this.userInfo.userId
        });
        console.log('消息发送成功:', res);
        uni.showToast({
          title: '消息已发送',
          icon: 'none'
        });
        // 立即刷新聊天记录和会话列表，确保最新消息即时展示
        await this.loadChatMessages(this.chatSessions.find(item => item.username === this.currentChat)?.userId);
        await this.loadChatSessions();
        this.messageText = '';
        this.$nextTick(() => {
          const el = document.getElementById('chat-bottom');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
      } catch (error) {
        console.error('消息发送失败:', error);
        uni.showToast({
          title: '发送失败',
          icon: 'none'
        });
      }
    },
    // 发送新消息
    async sendNewMessage() {
      if (!this.recipient.trim()) {
        uni.showToast({
          title: '请输入收件人',
          icon: 'none'
        });
        return;
      }
      if (!this.newMessageText.trim()) {
        uni.showToast({
          title: '消息不能为空',
          icon: 'none'
        });
        return;
      }
      try {
        const res = await sendChatMessage({
          esReceiver: this.recipient,
          esContent: this.newMessageText,
          esSenderName: this.userInfo.username,
          esReceiverName: this.recipient,
          esSenderId: this.userInfo.id || this.userInfo.userId
        });
        uni.showToast({
          title: '消息已发送',
          icon: 'none'
        });
        // 新消息发送后刷新会话列表
        await this.loadChatSessions();
        this.newMessageText = '';
        this.backToInbox();
      } catch (error) {
        console.error('消息发送失败:', error);
        uni.showToast({
          title: '发送失败',
          icon: 'none'
        });
      }
    },
    
    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    // 删除聊天
    deleteChat() {
      uni.showModal({
        title: '提示',
        content: '确定要删除此聊天吗？',
        success: (res) => {
          if (res.confirm) {
            // 这里应该有删除聊天的逻辑
            uni.showToast({
              title: '聊天已删除',
              icon: 'none'
            });
            this.backToInbox();
          }
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.mail-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  box-sizing: border-box;
  padding: 20rpx 30rpx 40rpx;
}

// 收件列表页样式
.inbox-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  
  .inbox-header {
    display: flex;
    flex-direction: column;
    padding: 20rpx 10rpx 30rpx;
    
    .new-message {
      color: white;
      font-size: 32rpx;
      margin-bottom: 30rpx;
      background-color: rgba(40, 25, 12, 0.7);
      padding: 16rpx 30rpx;
      border-radius: 40rpx;
      align-self: flex-start;
      display: flex;
      align-items: center;
      transition: all 0.3s;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
      
      &:active {
        transform: scale(0.98);
        opacity: 0.9;
      }
    }
    
    .inbox-tabs {
      display: flex;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      margin-bottom: 10rpx;
      
      .tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rpx 40rpx;
        color: rgba(255, 255, 255, 0.7);
        font-size: 32rpx;
        position: relative;
        transition: all 0.3s;
        
        &.active {
          color: white;
          font-weight: bold;
          
          &:after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 20%;
            width: 60%;
            height: 4rpx;
            background-color: #81B64C;
            border-radius: 4rpx;
          }
        }
        
        .tab-subtitle {
          font-size: 24rpx;
          color: rgba(204, 204, 204, 0.8);
          margin-top: 8rpx;
        }
      }
    }
  }
  
  .message-list {
    flex: 1;
    padding: 0 10rpx;
    
    .message-item {
      display: flex;
      align-items: center;
      background-color: rgba(40, 25, 12, 0.7);
      border-radius: 16rpx;
      padding: 24rpx;
      margin: 20rpx 0;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
      
      &:active {
        transform: translateY(2rpx);
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
      }
      
      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 6rpx;
        background-color: #81B64C;
      }
      
      .avatar {
        width: 90rpx;
        height: 90rpx;
        border-radius: 45rpx;
        margin-right: 24rpx;
        border: 2rpx solid rgba(255, 255, 255, 0.3);
      }
      
      .message-content {
        flex: 1;
        
        .message-sender {
          color: white;
          font-size: 36rpx;
          margin-bottom: 8rpx;
          font-weight: 500;
        }
        
        .message-brief {
          color: rgba(204, 204, 204, 0.9);
          font-size: 32rpx;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 400rpx;
        }
      }
      
      .message-time {
        color: rgba(204, 204, 204, 0.7);
        font-size: 26rpx;
        align-self: flex-start;
        margin-top: 6rpx;
      }
    }
  }
  
  .all-messages {
    display: flex;
    justify-content: center;
    padding: 30rpx 0;
    
    text {
      color: white;
      font-size: 32rpx;
      background-color: rgba(40, 25, 12, 0.5);
      padding: 16rpx 40rpx;
      border-radius: 40rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
    }
  }
}

// 聊天详情页样式
.chat-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 40rpx 28rpx 40rpx;
    background: linear-gradient(90deg, rgba(40,25,12,0.95) 0%, rgba(129,182,76,0.18) 100%);
    border-bottom: 2rpx solid #81B64C;
    border-radius: 0 0 32rpx 32rpx;
    box-shadow: 0 8rpx 24rpx rgba(129,182,76,0.08);
    position: relative;
    z-index: 2;
    .back-btn {
      padding: 10rpx;
      background: rgba(255,255,255,0.08);
      border-radius: 50%;
      transition: background 0.2s;
      &:active {
        background: rgba(129,182,76,0.18);
      }
      .back-icon {
        font-size: 40rpx;
        color: #fff;
        font-weight: bold;
      }
    }
    .chat-title {
      color: #fff;
      font-size: 40rpx;
      font-weight: 700;
      letter-spacing: 2rpx;
      text-shadow: 0 2rpx 8rpx rgba(129,182,76,0.12);
      flex: 1;
      text-align: center;
    }
    .delete-chat {
      color: #ff4d4f;
      font-size: 32rpx;
      background: rgba(255,77,79,0.08);
      border-radius: 24rpx;
      padding: 8rpx 24rpx;
      font-weight: 500;
      transition: background 0.2s;
      &:active {
        background: rgba(255,77,79,0.18);
      }
    }
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20rpx 0 20rpx 0;
    display: flex;
    flex-direction: column;
    .chat-message {
      margin-bottom: 24rpx;
      display: flex;
      flex-direction: column;
      &.my-message {
        align-items: flex-end;
      }
      &.other-message {
        align-items: flex-start;
      }
      .message-row {
        display: flex;
        align-items: flex-end;
        &.left {
          flex-direction: row;
        }
        &.right {
          flex-direction: row;
          justify-content: flex-end;
        }
      }
      .avatar {
        width: 70rpx;
        height: 70rpx;
        border-radius: 50%;
        margin: 0 16rpx;
        border: 2rpx solid rgba(255,255,255,0.3);
      }
      .message-info {
        max-width: 60vw;
        display: flex;
        flex-direction: column;
      }
      .message-sender-time {
        display: flex;
        align-items: center;
        margin-bottom: 4rpx;
        .sender {
          font-size: 26rpx;
          color: #888;
          margin-right: 12rpx;
        }
        .time {
          font-size: 22rpx;
          color: #bbb;
        }
      }
      .message-bubble {
        background-color: #fff;
        color: #222;
        border-radius: 24rpx;
        padding: 18rpx 28rpx;
        font-size: 32rpx;
        box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
        margin-top: 2rpx;
        word-break: break-all;
      }
      &.my-message .message-bubble {
        background-color: #81B64C;
        color: #fff;
        border-bottom-right-radius: 8rpx;
        border-bottom-left-radius: 24rpx;
        border-top-right-radius: 24rpx;
        border-top-left-radius: 24rpx;
      }
      &.other-message .message-bubble {
        background-color: #fff;
        color: #222;
        border-bottom-left-radius: 8rpx;
        border-bottom-right-radius: 24rpx;
        border-top-right-radius: 24rpx;
        border-top-left-radius: 24rpx;
      }
    }
  }
}

.message-input-area {
    padding: 20rpx;
    background-color: rgba(40, 25, 12, 0.7);
    border-radius: 16rpx;
    margin-top: 20rpx;
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);
    
    .format-icons {
      display: flex;
      padding: 10rpx 0;
      flex-wrap: wrap;
      
      .format-icon {
        color: rgba(255, 255, 255, 0.8);
        font-size: 32rpx;
        margin-right: 30rpx;
        margin-bottom: 10rpx;
        transition: all 0.2s;
        
        &:active {
          color: white;
          transform: scale(1.1);
        }
      }
    }
    
    .input-box {
      background-color: rgba(40, 25, 12, 0.5);
      border-radius: 16rpx;
      padding: 16rpx;
      margin: 16rpx 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      .message-input {
        width: 100%;
        height: 150rpx;
        color: white;
        font-size: 32rpx;
        line-height: 1.4;
      }
    }
    
    .send-btn {
      background-color: #81B64C;
      color: white;
      text-align: center;
      padding: 18rpx 0;
      border-radius: 40rpx;
      font-size: 32rpx;
      margin-top: 16rpx;
      font-weight: 500;
      letter-spacing: 2rpx;
      box-shadow: 0 4rpx 12rp
    }
  }
// 新消息发送页样式
.new-message-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  
  .new-message-header {
    display: flex;
    align-items: center;
    padding: 30rpx 20rpx;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(40, 25, 12, 0.7);
    border-radius: 16rpx 16rpx 0 0;
    margin-bottom: 10rpx;
    
    .back-btn {
      padding: 12rpx;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 50%;
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .back-icon {
        color: white;
        font-size: 40rpx;
      }
    }
    
    .page-title {
      flex: 1;
      text-align: center;
      color: white;
      font-size: 36rpx;
      font-weight: 500;
    }
  }

  .recipient-input {
    display: flex;
    align-items: center;
    background-color: rgba(40, 25, 12, 0.7);
    padding: 24rpx 30rpx;
    border-radius: 0 0 16rpx 16rpx;
    margin-bottom: 20rpx;
    
    .to-label {
      color: white;
      font-size: 32rpx;
      margin-right: 20rpx;
      font-weight: 500;
    }
    
    input {
      flex: 1;
      color: white;
      font-size: 32rpx;
      height: 60rpx;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8rpx;
      padding: 0 20rpx;
    }
  }
  
  .message-input-area {
    padding: 20rpx;
    background-color: rgba(40, 25, 12, 0.7);
    margin-top: 0;
    flex: 1;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    
    .format-icons {
      display: flex;
      padding: 10rpx 0;
      flex-wrap: wrap;
      
      .format-icon {
        color: rgba(255, 255, 255, 0.8);
        font-size: 32rpx;
        margin-right: 30rpx;
        margin-bottom: 10rpx;
        transition: all 0.2s;
        
        &:active {
          color: white;
          transform: scale(1.1);
        }
      }
    }
  }
    .input-box {
      background-color: rgba(40, 25, 12, 0.5);
      border-radius: 16rpx;
      padding: 16rpx;
      margin: 16rpx 0;
      flex: 1;
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      .message-input {
        width: 100%;
        height: 300rpx;
        color: white;
        font-size: 32rpx;
        line-height: 1.4;
      }
    }
    
    .send-btn {
      background-color: #81B64C;
      color: white;
      text-align: center;
      padding: 18rpx 0;
      border-radius: 40rpx;
      font-size: 32rpx;
      margin-top: 16rpx;
      font-weight: 500;
      letter-spacing: 2rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
    }
  }

</style>

formatTime(timeStr) {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} 
  ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
}
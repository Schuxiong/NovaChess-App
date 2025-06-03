# WebSocket 调用说明文档

## 概述

本文档详细说明了象棋游戏中投降和和棋功能的 WebSocket 实时通知机制。这些功能通过 WebSocket 实现双向实时通信，确保所有相关玩家能够及时收到游戏状态变化的通知。

## WebSocket 连接配置

### 连接地址
```javascript
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'http://47.111.122.119:8080/ws' 
  : 'http://localhost:8080/ws';
```

### 连接方式
使用 SockJS + STOMP 协议进行连接：

```javascript
import { connectWebSocket, subscribeToTopic, sendMessage, disconnectWebSocket } from '@/utils/websocket.js';

// 连接 WebSocket
connectWebSocket(
  userId,
  (client) => {
    console.log('WebSocket连接成功:', client);
    // 订阅游戏频道
    subscribeToTopic(
      `/topic/game/${gameId}`,
      (message) => {
        handleWebSocketMessage(message);
      }
    );
  },
  (error) => {
    console.error('WebSocket连接错误:', error);
  }
);
```

## 投降功能 WebSocket 通知

### 触发方式
当玩家调用投降接口时：
```
POST /api/game/chessGame/quit/{gameId}
```

### WebSocket 通知消息格式

#### 发送给对手的消息
```json
{
  "type": "game_quit",
  "gameId": "game123",
  "quitPlayer": "black",
  "winner": "white",
  "message": "黑方退出游戏",
  "gameState": 7
}
```

#### 发送给投降方的确认消息
```json
{
  "type": "game_quit",
  "gameId": "game123",
  "quitPlayer": "black",
  "winner": "white",
  "message": "您已投降",
  "gameState": 7
}
```

### 字段说明
- `type`: 消息类型，固定为 "game_quit"
- `gameId`: 游戏ID
- `quitPlayer`: 投降的玩家（"black" 或 "white"）
- `winner`: 获胜方（"black" 或 "white"）
- `message`: 描述信息
- `gameState`: 游戏状态（7=黑方投降，8=白方投降）

## 和棋功能 WebSocket 通知

### 1. 发起和棋请求

#### 触发方式
```
POST /api/game/chessGame/draw/request/{gameId}
```

#### WebSocket 通知消息

**发送给目标玩家（收到和棋请求）：**
```json
{
  "type": "draw_request",
  "gameId": "game123",
  "requestUserId": "user1",
  "requestUserAccount": "player1",
  "targetUserId": "user2",
  "targetUserAccount": "player2",
  "requestId": "draw123",
  "message": "player1 发起了和棋请求"
}
```

**发送给请求方（确认请求已发送）：**
```json
{
  "type": "draw_request_sent",
  "gameId": "game123",
  "message": "和棋请求已发送"
}
```

### 2. 响应和棋请求

#### 触发方式
```
POST /api/game/chessGame/draw/respond/{gameId}?accept=true/false
```

#### WebSocket 通知消息

**接受和棋请求：**
```json
{
  "type": "draw_accepted",
  "gameId": "game123",
  "message": "和棋请求已被接受，游戏结束",
  "gameState": 5
}
```

**拒绝和棋请求：**
```json
{
  "type": "draw_rejected",
  "gameId": "game123",
  "message": "和棋请求已被拒绝"
}
```

### 3. 取消和棋请求

#### 触发方式
```
DELETE /api/game/chessGame/draw/cancel/{gameId}
```

#### WebSocket 通知消息
```json
{
  "type": "draw_request_cancelled",
  "gameId": "game123",
  "message": "player1 取消了和棋请求"
}
```

## 超时流局 WebSocket 通知

### 触发方式
```
POST /api/game/chessGame/timeout/{gameId}
```

### WebSocket 通知消息
```json
{
  "type": "game_timeout",
  "gameId": "game123",
  "message": "游戏超时，流局",
  "gameState": 6
}
```

## 前端 WebSocket 消息处理示例

### Vue.js 组合式 API 示例

```javascript
import { ref, onMounted, onUnmounted } from 'vue'
import { connectWebSocket, subscribeToTopic, disconnectWebSocket } from '@/utils/websocket.js'

export default {
  setup() {
    const gameEnded = ref(false)
    const gameEndMessage = ref('')
    const drawRequest = ref(null)
    const webSocketConnected = ref(false)
    
    // WebSocket 消息处理函数
    const handleWebSocketMessage = (message) => {
      console.log('收到 WebSocket 消息:', message)
      
      switch (message.type) {
        case 'game_quit':
          gameEnded.value = true
          gameEndMessage.value = `${message.quitPlayer === 'black' ? '黑方' : '白方'} 已投降，${message.winner === 'black' ? '黑方' : '白方'} 获胜`
          drawRequest.value = null // 清除和棋请求状态
          alert(gameEndMessage.value)
          break
          
        case 'game_timeout':
          gameEnded.value = true
          gameEndMessage.value = '游戏超时，流局'
          drawRequest.value = null
          alert(gameEndMessage.value)
          break
          
        case 'draw_request':
          // 收到和棋请求，刷新状态
          getDrawStatus()
          alert(`${message.requestUserAccount} 发起了和棋请求`)
          break
          
        case 'draw_request_sent':
          // 和棋请求已发送确认
          getDrawStatus()
          break
          
        case 'draw_accepted':
          gameEnded.value = true
          gameEndMessage.value = '双方同意和棋，游戏结束'
          drawRequest.value = null
          alert(gameEndMessage.value)
          break
          
        case 'draw_rejected':
          drawRequest.value = null
          alert('对方拒绝了和棋请求')
          break
          
        case 'draw_request_cancelled':
          drawRequest.value = null
          alert(message.message)
          break
          
        default:
          console.log('未处理的消息类型:', message.type)
      }
    }
    
    // 初始化 WebSocket 连接
    const initWebSocket = (gameId, userId) => {
      connectWebSocket(
        userId,
        (client) => {
          console.log('WebSocket 连接成功')
          webSocketConnected.value = true
          
          // 订阅游戏频道
          subscribeToTopic(
            `/topic/game/${gameId}`,
            handleWebSocketMessage
          )
        },
        (error) => {
          console.error('WebSocket 连接失败:', error)
          webSocketConnected.value = false
        }
      )
    }
    
    // 获取和棋请求状态
    const getDrawStatus = async () => {
      try {
        const response = await fetch(`/api/game/chessGame/draw/status/${gameId}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        })
        const result = await response.json()
        if (result.success) {
          drawRequest.value = result.result
        }
      } catch (error) {
        console.error('获取和棋状态失败:', error)
      }
    }
    
    // 组件卸载时断开连接
    onUnmounted(() => {
      if (webSocketConnected.value) {
        disconnectWebSocket()
      }
    })
    
    return {
      gameEnded,
      gameEndMessage,
      drawRequest,
      webSocketConnected,
      initWebSocket,
      handleWebSocketMessage
    }
  }
}
```

### JavaScript/TypeScript 示例

```javascript
class ChessGameWebSocket {
  constructor(gameId, userId) {
    this.gameId = gameId
    this.userId = userId
    this.stompClient = null
    this.gameSubscription = null
  }
  
  // 连接 WebSocket
  connect() {
    return new Promise((resolve, reject) => {
      connectWebSocket(
        this.userId,
        (client) => {
          this.stompClient = client
          this.subscribeToGame()
          resolve(client)
        },
        (error) => {
          reject(error)
        }
      )
    })
  }
  
  // 订阅游戏频道
  subscribeToGame() {
    if (this.stompClient) {
      this.gameSubscription = subscribeToTopic(
        `/topic/game/${this.gameId}`,
        (message) => {
          this.handleMessage(message)
        }
      )
    }
  }
  
  // 处理 WebSocket 消息
  handleMessage(message) {
    console.log('收到消息:', message)
    
    // 触发自定义事件
    const event = new CustomEvent('chessGameMessage', {
      detail: message
    })
    document.dispatchEvent(event)
    
    // 根据消息类型处理
    switch (message.type) {
      case 'game_quit':
        this.handleGameQuit(message)
        break
      case 'draw_request':
        this.handleDrawRequest(message)
        break
      case 'draw_accepted':
        this.handleDrawAccepted(message)
        break
      case 'draw_rejected':
        this.handleDrawRejected(message)
        break
      case 'draw_request_cancelled':
        this.handleDrawCancelled(message)
        break
      case 'game_timeout':
        this.handleGameTimeout(message)
        break
    }
  }
  
  // 处理投降消息
  handleGameQuit(message) {
    const winnerText = message.winner === 'black' ? '黑方' : '白方'
    const quitPlayerText = message.quitPlayer === 'black' ? '黑方' : '白方'
    alert(`${quitPlayerText} 已投降，${winnerText} 获胜`)
  }
  
  // 处理和棋请求
  handleDrawRequest(message) {
    const confirmed = confirm(`${message.requestUserAccount} 发起了和棋请求，是否接受？`)
    if (confirmed) {
      this.respondDraw(true)
    } else {
      this.respondDraw(false)
    }
  }
  
  // 处理和棋被接受
  handleDrawAccepted(message) {
    alert('双方同意和棋，游戏结束')
  }
  
  // 处理和棋被拒绝
  handleDrawRejected(message) {
    alert('对方拒绝了和棋请求')
  }
  
  // 处理和棋请求被取消
  handleDrawCancelled(message) {
    alert(message.message)
  }
  
  // 处理游戏超时
  handleGameTimeout(message) {
    alert('游戏超时，流局')
  }
  
  // 响应和棋请求
  async respondDraw(accept) {
    try {
      const response = await fetch(`/api/game/chessGame/draw/respond/${this.gameId}?accept=${accept}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      if (!result.success) {
        alert('操作失败: ' + result.message)
      }
    } catch (error) {
      console.error('响应和棋请求失败:', error)
      alert('网络错误，请重试')
    }
  }
  
  // 断开连接
  disconnect() {
    if (this.stompClient) {
      disconnectWebSocket()
      this.stompClient = null
      this.gameSubscription = null
    }
  }
}

// 使用示例
const gameWebSocket = new ChessGameWebSocket('game123', 'user456')
gameWebSocket.connect().then(() => {
  console.log('WebSocket 连接成功')
}).catch((error) => {
  console.error('WebSocket 连接失败:', error)
})

// 监听自定义事件
document.addEventListener('chessGameMessage', (event) => {
  console.log('收到游戏消息:', event.detail)
})
```

## 注意事项

### 1. 连接管理
- 确保在游戏开始时建立 WebSocket 连接
- 游戏结束或页面卸载时及时断开连接
- 处理连接断开和重连逻辑

### 2. 消息处理
- 所有 WebSocket 消息都是异步的，需要正确处理
- 建议在收到通知后重新获取游戏状态以确保数据一致性
- 对于关键操作（如投降、和棋），建议显示确认对话框

### 3. 错误处理
- 处理 WebSocket 连接失败的情况
- 处理消息格式错误或缺失字段的情况
- 提供用户友好的错误提示

### 4. 安全考虑
- 确保 WebSocket 连接使用正确的认证机制
- 验证消息来源和内容的合法性
- 避免在客户端存储敏感信息

### 5. 性能优化
- 避免重复订阅同一个频道
- 及时清理不需要的订阅
- 合理处理消息频率，避免界面卡顿

## WebSocket 消息类型汇总

| 消息类型 | 描述 | 触发条件 |
|---------|------|----------|
| `game_quit` | 玩家投降 | 调用投降接口 |
| `game_timeout` | 游戏超时 | 调用超时接口 |
| `draw_request` | 和棋请求 | 发起和棋请求 |
| `draw_request_sent` | 和棋请求已发送 | 和棋请求发送确认 |
| `draw_accepted` | 和棋被接受 | 接受和棋请求 |
| `draw_rejected` | 和棋被拒绝 | 拒绝和棋请求 |
| `draw_request_cancelled` | 和棋请求被取消 | 取消和棋请求 |
| `GAME_OVER` | 游戏正常结束 | 吃王等正常结束 |
| `MOVE_UPDATE` | 行棋更新 | 玩家行棋 |
| `PLAYER_JOIN` | 玩家加入 | 玩家加入游戏 |

## 技术支持

如果在使用过程中遇到问题，请检查：
1. WebSocket 服务器是否正常运行
2. 网络连接是否稳定
3. 认证令牌是否有效
4. 游戏ID和用户ID是否正确

更多技术细节请参考相关接口文档和源代码。
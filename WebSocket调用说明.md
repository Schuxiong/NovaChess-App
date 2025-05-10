
好的，这是关于您后端 WebSocket 设计的详细说明，以及前端 Vue2-uniapp 项目如何调用此服务的指南。我们将参考您提供的链接，并结合您后端 STOMP over WebSocket 的实际情况进行说明。

## 后端 WebSocket 设计概述

您的后端采用 Spring WebSocket 构建，并使用 STOMP 协议在 WebSocket 之上进行消息传递。主要配置和组件如下：

1.  **WebSocket 配置 (`WebChessSocketConfig.java`)**:
    *   通过 `@EnableWebSocketMessageBroker` 注解启用 STOMP 支持。
    *   注册 STOMP 端点：客户端将连接到 `/ws`。该端点还配置了 `withSockJS()`，以提供备选连接方案，增强兼容性。
    *   配置消息代理（Message Broker）:
        *   `registry.enableSimpleBroker("/topic")`: 定义了消息代理的前缀。客户端将订阅以此开头的目标（例如 `/topic/game/{gameId}`）来接收消息。
        *   `registry.setApplicationDestinationPrefixes("/app")`: 定义了应用目标的前缀。客户端发送给服务器处理的消息，其目标将以此开头（例如 `/app/game/move/{gameId}`）。

2.  **消息处理控制器**:
    *   **`ChessMoveWebsocketController.java`**: 包含处理客户端发送的棋步等游戏相关消息的方法。这些方法通常使用 `@MessageMapping` 注解（例如 `@MessageMapping("/game/move/{gameId}")`），这意味着发送到 `/app/game/move/{gameId}` 的消息会由相应方法处理。
    *   该控制器使用 `SimpMessagingTemplate` 将游戏更新（如棋步）广播给订阅了特定游戏主题（如 `/topic/game/{gameId}`）的客户端。
    *   **`ChessGameController.java`**: 在玩家通过 HTTP POST 请求成功进入游戏后（`gameEnter` 方法），也会使用 `SimpMessagingTemplate` 向 `/topic/game/{gameId}` 发送一个 "PLAYER_JOINED" 类型的消息，通知其他客户端有新玩家加入。

## 前端 uniapp 调用 WebSocket 服务指南

由于后端使用的是 STOMP over WebSocket (并启用了 SockJS)，前端直接使用 uniapp 的原生 `uni.connectSocket` API 来处理 STOMP 协议会比较复杂。推荐使用专门的 STOMP 客户端库，如 `stompjs` (配合 `sockjs-client` 使用，因为后端配置了 SockJS)。

以下是前端接入的步骤和建议：

### 1. 安装所需库

在您的 uniapp 项目中，您可能需要通过 npm 或 yarn 安装 `sockjs-client` 和 `@stomp/stompjs`：

```bash
npm install sockjs-client @stomp/stompjs
# 或者
yarn add sockjs-client @stomp/stompjs
```

### 2. 封装 WebSocket 服务

建议在 uniapp 项目中创建一个专门的 WebSocket 服务模块（例如 `utils/websocket.js` 或集成到 Vuex store 中，类似您提供的参考链接中的做法）。

```javascript
// utils/websocket.js (示例)
import SockJS from 'sockjs-client/dist/sockjs.min.js'; // 根据实际安装路径调整
import { Client } from '@stomp/stompjs';

let stompClient = null;
let subscriptions = {}; // 用于存储订阅，方便后续取消

const WEBSOCKET_URL = 'YOUR_BACKEND_BASE_URL/ws'; // 替换为您的后端实际地址，例如 http://localhost:8080/ws

export function connectWebSocket(userId, onConnectedCallback, onErrorCallback) {
  if (stompClient && stompClient.connected) {
    console.log('WebSocket 已连接');
    if (onConnectedCallback) onConnectedCallback();
    return;
  }

  // 1. 创建 SockJS 连接
  const socket = new SockJS(WEBSOCKET_URL);

  // 2. 创建 STOMP 客户端实例
  stompClient = new Client({
    webSocketFactory: () => socket, // 将 SockJS 实例作为 WebSocket 工厂
    connectHeaders: {
      // 可以添加认证相关的头，例如 token
      // login: 'user',
      // passcode: 'password',
      // Authorization: 'Bearer your_jwt_token'
    },
    debug: function (str) {
      console.log('STOMP Debug: ' + str);
    },
    reconnectDelay: 5000, // 自动重连延迟（毫秒）
    heartbeatIncoming: 4000, // 期望从服务器接收心跳的间隔
    heartbeatOutgoing: 4000, // 向服务器发送心跳的间隔
  });

  // 3. STOMP 连接成功回调
  stompClient.onConnect = (frame) => {
    console.log('STOMP 连接成功:', frame);
    if (onConnectedCallback) onConnectedCallback(stompClient);
    // 可以在这里进行一些全局订阅，或者由调用方在回调中处理
  };

  // 4. STOMP 错误回调
  stompClient.onStompError = (frame) => {
    console.error('STOMP Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
    if (onErrorCallback) onErrorCallback(frame);
  };

  stompClient.onWebSocketError = (error) => {
    console.error('WebSocket Error', error);
    if (onErrorCallback) onErrorCallback(error);
  };

  // 5. 激活连接
  stompClient.activate();
}

// 订阅主题
export function subscribeToTopic(topic, callback) {
  if (stompClient && stompClient.connected) {
    console.log(`尝试订阅: ${topic}`);
    const subscription = stompClient.subscribe(topic, (message) => {
      let parsedMessage = {};
      try {
        parsedMessage = JSON.parse(message.body);
      } catch (e) {
        console.error('无法解析收到的消息体:', message.body, e);
        parsedMessage = message.body; // 作为原始字符串处理
      }
      if (callback) callback(parsedMessage);
    });
    subscriptions[topic] = subscription; // 保存订阅对象，方便取消
    return subscription;
  } else {
    console.error('STOMP 未连接，无法订阅 ' + topic);
    return null;
  }
}

// 取消订阅
export function unsubscribeFromTopic(topic) {
  if (subscriptions[topic]) {
    subscriptions[topic].unsubscribe();
    delete subscriptions[topic];
    console.log(`已取消订阅: ${topic}`);
  } 
}

// 发送消息
export function sendMessage(destination, body) {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: destination, // 例如: /app/game/move/{gameId}
      body: JSON.stringify(body), // 消息体通常是 JSON 字符串
      // headers: { priority: '9' } // 可选的 STOMP 消息头
    });
  } else {
    console.error('STOMP 未连接，无法发送消息到 ' + destination);
  }
}

// 关闭连接
export function disconnectWebSocket() {
  if (stompClient) {
    // 取消所有订阅
    Object.keys(subscriptions).forEach(topic => {
      subscriptions[topic].unsubscribe();
    });
    subscriptions = {};
    stompClient.deactivate();
    stompClient = null;
    console.log('STOMP 连接已关闭');
  }
}

// 获取 STOMP 客户端实例 (谨慎使用，尽量通过封装的方法操作)
export function getStompClient() {
  return stompClient;
}

```

### 3. 在 Vue 组件中使用

在需要使用 WebSocket 的 Vue 组件中（例如游戏对战页面）：

```vue
<script>
import {
  connectWebSocket,
  subscribeToTopic,
  sendMessage,
  disconnectWebSocket,
  unsubscribeFromTopic
} from '@/utils/websocket.js'; // 假设路径正确

export default {
  data() {
    return {
      gameId: null, // 从路由参数或状态管理获取
      userId: null, // 当前用户ID
      gameSubscription: null
    };
  },
  onLoad(options) {
    this.gameId = options.gameId; // 假设 gameId 通过页面参数传递
    this.userId = uni.getStorageSync('userId'); // 假设 userId 存储在本地

    this.connectAndSubscribe();
  },
  onUnload() {
    // 页面卸载时取消订阅并断开连接
    if (this.gameSubscription) {
        // stompjs v5+ 的 unsubscribe 是在 subscription 对象上的方法
        // this.gameSubscription.unsubscribe(); // 或者通过封装的 unsubscribeFromTopic
        unsubscribeFromTopic(`/topic/game/${this.gameId}`);
    }
    // 根据需要决定是否在页面卸载时断开全局连接
    // disconnectWebSocket(); 
  },
  methods: {
    connectAndSubscribe() {
      connectWebSocket(
        this.userId,
        (stompClientInstance) => {
          // 连接成功后的回调
          console.log('WebSocket 连接成功，准备订阅游戏主题');
          this.subscribeToGameEvents();
        },
        (error) => {
          // 连接失败后的回调
          console.error('WebSocket 连接失败:', error);
          uni.showToast({
            title: '实时服务连接失败',
            icon: 'none'
          });
        }
      );
    },

    subscribeToGameEvents() {
      if (!this.gameId) return;
      const topic = `/topic/game/${this.gameId}`;
      this.gameSubscription = subscribeToTopic(topic, (message) => {
        console.log(`收到来自 ${topic} 的消息:`, message);
        // 根据 message.type 处理不同类型的游戏事件
        if (message.type === 'PLAYER_JOINED') {
          uni.showToast({
            title: `玩家 ${message.username} 加入了游戏！`,
            icon: 'none'
          });
          // 更新游戏内玩家列表等UI
        } else if (message.type === 'MOVE_MADE') {
          // 处理棋步更新
          // message.moveData 包含了棋步信息
          this.updateBoard(message.moveData);
        } else if (message.type === 'GAME_STATE_UPDATE'){
          // 处理完整的游戏状态更新
          this.updateGameState(message.gameState);
        }
        // ... 其他消息类型处理
      });
    },

    handlePlayerMove(moveData) {
      if (!this.gameId) return;
      // 前端玩家走棋后，通过 WebSocket 发送棋步信息
      // 后端 ChessMoveWebsocketController 中 @MessageMapping("/game/move/{gameId}") 会接收
      const destination = `/app/game/move/${this.gameId}`;
      sendMessage(destination, {
        userId: this.userId,
        move: moveData, // 例如: { from: 'e2', to: 'e4', piece: 'P' }
        // 其他需要传递的信息
      });
    },
    
    updateBoard(moveData) {
        // 根据接收到的棋步数据更新前端棋盘UI
        console.log('更新棋盘:', moveData);
    },

    updateGameState(gameState) {
        // 根据接收到的完整游戏状态更新前端UI
        console.log('更新游戏状态:', gameState);
    }
  }
};
</script>
```

### 4. 关键点说明

*   **连接地址**：`WEBSOCKET_URL` 应指向您后端 `/ws` 端点，例如 `http://your-domain.com/api/ws` 或 `ws://your-domain.com/api/ws` (如果直接使用 WebSocket 而非 SockJS HTTP 升级，但 SockJS 通常更健壮)。由于 `sockjs-client` 通常需要 HTTP URL，所以使用 `http://` 或 `https://`。
*   **STOMP 客户端库**：`@stomp/stompjs` (v5+) 是一个流行的 STOMP 客户端，它支持通过 `webSocketFactory` 传入自定义的 WebSocket 实现（这里是 SockJS）。
*   **订阅目标 (`/topic/...`)**：前端通过 `stompClient.subscribe('/topic/game/' + this.gameId, callback)` 来接收特定游戏房间的消息。后端通过 `SimpMessagingTemplate.convertAndSend('/topic/game/' + gameId, messagePayload)` 来广播消息。
*   **发送目标 (`/app/...`)**：前端通过 `stompClient.publish({ destination: '/app/game/move/' + this.gameId, body: JSON.stringify(payload) })` 来发送消息给服务器处理。后端对应的方法使用 `@MessageMapping` (例如 `@MessageMapping("/game/move/{gameId}")`) 来接收。
*   **消息格式**：前后端需要约定好消息体的 JSON 结构。例如，加入游戏的通知可以包含 `{ type: 'PLAYER_JOINED', userId: '...', username: '...' }`，棋步消息可以包含 `{ type: 'MOVE_MADE', moveData: { ... } }`。
*   **心跳**：`stompjs` 客户端库通常会自动处理 STOMP 级别的心跳，以保持连接活跃。配置中的 `heartbeatIncoming` 和 `heartbeatOutgoing` 用于此目的。
*   **错误处理与重连**：`stompjs` 提供了错误回调和重连机制 (`reconnectDelay`)。
*   **生命周期管理**：在组件创建/加载时建立连接和订阅，在组件销毁/卸载时取消订阅并根据需要断开连接，以避免内存泄漏和不必要的通信。

这份指南应该能帮助您的前端 AI 助手理解如何与后端 WebSocket 服务进行集成。请务必根据项目的实际情况调整 URL、消息结构和错误处理逻辑。
当前模型请求量过大，请求排队约 1 位，请稍候或切换至其他模型问答体验更流畅。
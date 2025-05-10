
好的，我来为您详细说明一下当前后端的设计以及前端Vue2项目如何调用这些服务。

### 后端系统设计概述

您的后端系统基于 **Jeecg-Boot** 框架，这是一个基于 Spring Boot 的快速开发平台。核心业务逻辑主要集中在 `jeecg-module-chess` 模块中，用于处理象棋游戏的邀请、对局管理和实时对战功能。

#### 1. 主要业务模块与控制器

*   **邀请管理 (`ChessFriendPairController.java`)**: 
    *   负责处理用户之间的对战邀请，包括发起邀请、接受/拒绝邀请、查询邀请列表等。
    *   对应的实体是 `ChessFriendPair.java`。
*   **对局管理 (`ChessGameController.java`)**: 
    *   负责游戏的创建（初始化）、玩家进入对局、获取对局状态（包括棋盘和棋子信息）等。
    *   对应的核心实体有 `ChessGame.java` (对局信息), `ChessPlayer.java` (玩家在对局中的信息), `ChessPieces.java` (棋子信息)。
*   **实时对战与消息通知 (`ChessMoveWebsocketController.java` 和 WebSocket 配置):
    *   使用 Spring WebSocket 和 STOMP协议 实现实时通信，例如棋步的发送与广播、玩家加入对局的通知。
    *   `WebChessSocketConfig.java` 配置了 WebSocket 的端点和消息代理。
    *   `SimpMessagingTemplate` 被用于在后端主动向客户端发送消息。

#### 2. 核心业务流程

1.  **发起邀请**: 用户A通过前端调用邀请接口，向用户B发起对战邀请。后端在 `chess_friend_pair` 表创建一条邀请记录。
2.  **接受邀请**: 用户B在其邀请列表中看到邀请，选择接受。后端更新 `chess_friend_pair` 表中对应邀请的状态。
3.  **初始化游戏 (`init`)**: 邀请被接受后，通常由邀请方（或接受方，根据前端设计）调用游戏初始化接口。此接口会：
    *   创建一个新的游戏记录 (`chess_game` 表)。
    *   根据邀请信息，确定黑白双方玩家 (`black_play_id`, `white_play_id` 等字段，存储实际用户ID)。
    *   关联邀请ID (`source_invite_id`) 到游戏记录中。
    *   初始化棋盘布局，并将棋子信息存入 `chess_pieces` 表，与 `chess_game` 表通过 `game_id` 关联。
    *   返回游戏ID等信息给调用方。
4.  **进入游戏 (`enter`)**: 双方玩家分别调用进入游戏接口。
    *   后端会校验玩家是否有权进入该游戏（基于用户ID或邀请ID）。
    *   当有玩家成功进入游戏时，后端会通过 WebSocket (例如发送到 `/topic/game/{gameId}` 主题) 通知对局中的其他玩家，告知有新玩家加入。
5.  **进行对战**: 
    *   玩家在前端移动棋子。
    *   前端将棋步信息通过 WebSocket 发送到后端指定的 STOMP 端点 (例如 `/app/game/move/{gameId}`，由 `ChessMoveWebsocketController` 处理)。
    *   后端处理棋步：校验合法性、更新棋盘状态 (`chess_pieces` 表)、更新对局状态 (`chess_game` 表，如当前轮到谁)。
    *   后端通过 WebSocket 将更新后的棋盘状态和对局信息广播给所有在该对局中的玩家 (通常是发送到 `/topic/game/{gameId}` 主题)。
6.  **获取游戏状态**: 前端也可以通过HTTP接口 (如 `getChessGameChessPieces`) 主动拉取当前完整的游戏状态，包括所有棋子位置和对局信息。

### 前端 Vue2 项目调用指南

您的前端项目可以使用标准的 HTTP客户端 (如 `axios`) 和 WebSocket客户端 (如 `stompjs` 配合 `sockjs-client`) 来与后端交互。

#### 1. HTTP API 调用 (使用 `axios` 示例)

**通用配置**: 
通常需要在 `axios` 实例中配置 `baseURL` 指向您的后端服务地址，并处理认证（例如，在请求头中携带 JWT Token）。

```javascript
// main.js 或封装的 request.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // 替换为您的后端地址
  headers: {
    'Content-Type': 'application/json',
    // 'X-Access-Token': 'YOUR_JWT_TOKEN' // 根据后端认证机制添加
  }
});

// 拦截器，用于统一处理Token或错误
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // 假设Token存储在localStorage
  if (token) {
    config.headers['X-Access-Token'] = token;
  }
  return config;
});

export default apiClient;
```

**具体接口调用示例**:

*   **发起邀请 (`POST /chess/chessFriendPair/add`)**
    ```javascript
    // services/pairService.js (示例)
    import apiClient from './apiClient';

    export const addPairInvite = (inviteData) => {
      // inviteData 结构: { acceptUserId: 'xxx', acceptUserAccount: 'yyy', ... }
      return apiClient.post('/chess/chessFriendPair/add', inviteData);
    };
    ```

*   **获取我的邀请列表 (`GET /chess/chessFriendPair/list`)**
    ```javascript
    // services/pairService.js
    export const getMyInvites = (params) => {
      // params: { pageNo: 1, pageSize: 10, column: 'createTime', order: 'desc', ... }
      return apiClient.get('/chess/chessFriendPair/list', { params });
    };
    ```

*   **接受/拒绝邀请 (`PUT /chess/chessFriendPair/edit`)**
    ```javascript
    // services/pairService.js
    export const updateInviteStatus = (inviteUpdateData) => {
      // inviteUpdateData: { id: 'invite_id', inviteStatus: 'accepted'/'rejected', ... }
      return apiClient.put('/chess/chessFriendPair/edit', inviteUpdateData);
    };
    ```

*   **初始化游戏 (`POST /game/chessGame/init`)**
    ```javascript
    // services/gameService.js
    import apiClient from './apiClient';

    export const initGame = (initData) => {
      // initData: { userId: "邀请方用户ID", userAccount: "邀请方账号", holdChess: 1 or 2, sourceInviteId: "邀请记录ID" }
      return apiClient.post('/game/chessGame/init', initData);
    };
    ```
    *响应示例*: `{ success: true, result: { gameId: "xxx", ... } }`

*   **进入游戏 (`POST /game/chessGame/enter`)**
    ```javascript
    // services/gameService.js
    export const enterGame = (enterData) => {
      // enterData (可选，如果有邀请ID): { inviteId: "邀请记录ID" }
      // 如果没有 inviteId，后端会尝试根据当前登录用户查找可进入的游戏
      return apiClient.post('/game/chessGame/enter', enterData);
    };
    ```
    *响应示例*: `{ success: true, result: [{ gameId: "xxx", blackPlayAccount: "p1", whitePlayAccount: "p2", ... }] }`

*   **获取游戏棋盘和棋子信息 (`GET /game/chessGame/getChessGameChessPieces`)**
    ```javascript
    // services/gameService.js
    export const getGameDetails = (gameId) => {
      return apiClient.get('/game/chessGame/getChessGameChessPieces', { params: { chessGameId: gameId } });
    };
    ```
    *响应示例*: `{ success: true, result: { chessGameId: "xxx", chessPiecesList: [ ...棋子对象... ], currentTurn: 1, ... } }`

#### 2. WebSocket 通信 (使用 `stompjs` 和 `sockjs-client` 示例)

**安装依赖**:
`npm install stompjs sockjs-client --save`

**封装 WebSocket 服务**: 
```javascript
// services/websocketService.js
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
let reconnectTimeout = null;
const SOCKET_URL = 'http://localhost:8080/ws'; // 后端WebSocket端点

const connect = (gameId, onMessageReceived, onPlayerJoined) => {
  const socket = new SockJS(SOCKET_URL);
  stompClient = Stomp.over(socket);

  stompClient.connect({}, (frame) => {
    console.log('Connected to WebSocket: ' + frame);
    clearTimeout(reconnectTimeout); // 清除重连定时器

    // 订阅游戏棋步更新和通用游戏消息
    stompClient.subscribe(`/topic/game/${gameId}`, (message) => {
      const payload = JSON.parse(message.body);
      if (payload.type === 'PLAYER_JOINED') {
        if (onPlayerJoined) {
          onPlayerJoined(payload); // 处理玩家加入通知
        }
      } else {
        if (onMessageReceived) {
          onMessageReceived(payload); // 处理棋步更新等其他消息
        }
      }
    });

  }, (error) => {
    console.error('WebSocket connection error:', error);
    // 尝试重连
    reconnectTimeout = setTimeout(() => connect(gameId, onMessageReceived, onPlayerJoined), 5000);
  });
};

const disconnect = () => {
  if (stompClient !== null) {
    stompClient.disconnect(() => {
      console.log('Disconnected from WebSocket');
    });
    stompClient = null;
  }
  clearTimeout(reconnectTimeout);
};

const sendMove = (gameId, moveData) => {
  if (stompClient && stompClient.connected) {
    // moveData 结构: { source: 'e2', target: 'e4', piece: 'PAWN', gameId: gameId, userId: 'currentUser' }
    // 具体结构根据 ChessMoveWebsocketController 的 @MessageMapping("/game/move/{gameId}") 方法的参数决定
    stompClient.send(`/app/game/move/${gameId}`, {}, JSON.stringify(moveData));
  } else {
    console.error('Cannot send move, WebSocket not connected.');
  }
};

export {
  connect,
  disconnect,
  sendMove
};
```

**在Vue组件中使用**: 
```vue
<template>
  <div>
    <!-- 棋盘UI -->
  </div>
</template>

<script>
import { connect, disconnect, sendMove } from '@/services/websocketService';
import { getGameDetails } from '@/services/gameService'; // 假设有此服务

export default {
  data() {
    return {
      gameId: null, // 从路由参数或API获取
      chessPieces: [],
      currentTurn: null,
      // ...其他游戏状态
    };
  },
  async created() {
    this.gameId = this.$route.params.gameId; // 假设从路由获取gameId
    await this.fetchGameDetails();
    this.setupWebSocket();
  },
  beforeDestroy() {
    disconnect();
  },
  methods: {
    async fetchGameDetails() {
      try {
        const response = await getGameDetails(this.gameId);
        if (response.data.success) {
          this.chessPieces = response.data.result.chessPiecesList;
          this.currentTurn = response.data.result.currentTurn;
          // ...更新其他状态
        }
      } catch (error) {
        console.error('Error fetching game details:', error);
      }
    },
    setupWebSocket() {
      connect(
        this.gameId,
        (payload) => { // onMessageReceived - 处理棋步更新等
          console.log('Game update received:', payload);
          // payload 可能是整个游戏状态 ChessGameVO，或只是棋步信息
          // 根据后端 ChessMoveWebsocketController 发送的内容更新棋盘
          this.chessPieces = payload.chessPiecesList; 
          this.currentTurn = payload.currentTurn;
          // ...更新其他相关UI
        },
        (payload) => { // onPlayerJoined - 处理玩家加入通知
          console.log('Player joined:', payload);
          // payload: { type: "PLAYER_JOINED", userId: "xxx", username: "yyy", gameId: "zzz" }
          // 可以在UI上提示 "玩家xxx已加入游戏"
          // 可能需要重新获取玩家列表或更新对局信息
        }
      );
    },
    handlePieceMove(source, target, piece) {
      const moveData = {
        source: source,       // 例如 "e2"
        target: target,       // 例如 "e4"
        piece: piece,         // 例如 "ROOK"
        gameId: this.gameId,
        userId: this.currentUser.id // 当前登录用户的ID
      };
      sendMove(this.gameId, moveData);
    }
  }
};
</script>
```

#### 3. 注意事项

*   **认证与授权**: 确保所有需要登录的接口都正确传递了认证凭证（如 `X-Access-Token`）。WebSocket连接时，也可以通过STOMP头传递认证信息，后端在连接握手时进行验证（具体实现看 `WebChessSocketConfig` 和相关拦截器）。
*   **错误处理**: 对API调用和WebSocket通信进行充分的错误处理和用户提示。
*   **状态同步**: 仔细考虑HTTP拉取数据和WebSocket推送数据之间的状态同步问题，避免数据不一致。
*   **参数结构**: 前端发送给后端的请求体或参数，务必与后端Controller方法定义的DTO或参数注解（如 `@RequestBody`, `@RequestParam`）相匹配。

这份说明应该能帮助您的前端AI助手理解后端设计并进行有效的API调用。如果需要针对特定接口或流程的更详细说明，请随时提出。

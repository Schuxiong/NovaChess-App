// utils/websocket.js (示例)
import SockJS from 'sockjs-client/dist/sockjs.min.js'; // 根据实际安装路径调整
import { Client } from '@stomp/stompjs';

let stompClient = null;
let subscriptions = {}; // 用于存储订阅，方便后续取消

const WEBSOCKET_URL = 'http://localhost:8080/ws'; // 替换为您的后端WebSocket服务地址

export function connectWebSocket(userId, onConnectedCallback, onErrorCallback) {
  if (stompClient && stompClient.connected) {
    console.log('WebSocket 已连接');
    if (onConnectedCallback) onConnectedCallback(stompClient);
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
      // userId: userId // Możesz chcieć przekazać userId w nagłówkach, jeśli backend tego oczekuje
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

  stompClient.onWebSocketClose = () => {
    console.log('WebSocket 连接已关闭');
    // Można tu dodać logikę ponownego połączenia lub powiadomienia użytkownika
  };

  // 5. 激活连接
  stompClient.activate();
}

// 订阅主题
export function subscribeToTopic(topic, callback) {
  if (stompClient && stompClient.connected) {
    console.log(`尝试订阅: ${topic}`);
    if (subscriptions[topic]) {
      console.log(`已订阅 ${topic}, 取消旧的再重新订阅`);
      subscriptions[topic].unsubscribe();
    }
    const subscription = stompClient.subscribe(topic, (message) => {
      let parsedMessage = {};
      try {
        console.log(`收到原始消息(${topic}):`, message.body);
        parsedMessage = JSON.parse(message.body);
      } catch (e) {
        console.error('无法解析收到的消息体:', message.body, e);
        parsedMessage = message.body; // 作为原始字符串处理
      }
      if (callback) callback(parsedMessage);
    });
    subscriptions[topic] = subscription; // 保存订阅对象，方便取消
    console.log(`订阅成功: ${topic}, 订阅ID: ${subscription.id}`);
    return subscription;
  } else {
    console.error('STOMP 未连接，无法订阅 ' + topic);
    // 尝试重新连接
    console.log('尝试重新连接WebSocket...');
    if (stompClient) {
      stompClient.activate();
      // 设置一个延迟任务，尝试在连接后订阅
      setTimeout(() => {
        if (stompClient && stompClient.connected) {
          console.log(`重新连接后尝试订阅: ${topic}`);
          subscribeToTopic(topic, callback);
        }
      }, 2000);
    }
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
    try {
      stompClient.publish({
        destination: destination, // 例如: /app/game/move/{gameId}
        body: JSON.stringify(body), // 消息体通常是 JSON 字符串
        // headers: { priority: '9' } // 可选的 STOMP 消息头
      });
      console.log(`STOMP 消息已发送到 ${destination}:`, body);
      return true;
    } catch (e) {
      console.error(`发送消息到 ${destination} 失败:`, e);
      return false;
    }
  } else {
    console.error('STOMP 未连接，无法发送消息到 ' + destination);

    // 尝试重新连接
    if (stompClient) {
      console.log('尝试重新连接WebSocket并在连接后发送消息...');
      stompClient.activate();
      // 设置一个延迟任务，尝试在连接后发送
      setTimeout(() => {
        if (stompClient && stompClient.connected) {
          console.log(`重新连接后尝试发送到: ${destination}`);
          sendMessage(destination, body);
        }
      }, 2000);
    }

    return false;
  }
}

// 关闭连接
export function disconnectWebSocket() {
  if (stompClient) {
    // 取消所有订阅
    Object.keys(subscriptions).forEach(topic => {
      if (subscriptions[topic]) {
        try {
          subscriptions[topic].unsubscribe();
        } catch (e) {
          console.error(`取消订阅 ${topic} 失败:`, e);
        }
      }
    });
    subscriptions = {};

    if (stompClient.connected) {
      stompClient.deactivate(); // Deactivate will close the websocket connection.
    }
    stompClient = null; // Clear the client instance for re-connection.
    console.log('STOMP 连接已关闭并清理完毕');
  }
}

// 获取 STOMP 客户端实例 (谨慎使用，尽量通过封装的方法操作)
export function getStompClient() {
  return stompClient;
} 
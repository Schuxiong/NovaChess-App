import request from '@/utils/request'

// 发送私聊消息
export function sendChatMessage(data) {
  if (!data.esReceiver) {
    console.error('Missing required field: esReceiver', data);
    throw new Error('接收方用户名不能为空');
  }
  
  console.log('Sending chat message:', {
    receiver: data.esReceiver,
    content: data.esContent,
    senderName: data.esSenderName,
    receiverName: data.esReceiverName
  });
  
  return request({
    url: '/sys/message/sysMessage/sendChatMessage',
    method: 'post',
    data: {
      ...data,
      esSenderName: data.esSenderName || '',
      esReceiverName: data.esReceiverName || ''
    }
  }).then(res => {
    console.log('Chat message sent successfully:', {
      result: res.result,
      message: res.message
    });
    return res;
  }).catch(err => {
    console.error('Failed to send chat message:', {
      error: err.message,
      requestData: data
    });
    throw err;
  })
}

// 获取聊天记录
export function getChatHistory(senderId, receiverId, pageNo = 1, pageSize = 20) {
  console.log('Getting chat history:', {senderId, receiverId, pageNo, pageSize});
  return request({
    url: '/sys/message/sysMessage/getChatHistory',
    method: 'get',
    params: {
      senderId,
      receiverId,
      pageNo,
      pageSize
    }
  }).then(res => {
    console.log('Chat history retrieved successfully:', res);
    return res;
  }).catch(err => {
    console.error('Failed to get chat history:', err);
    throw err;
  })
}

// 分页查询消息列表
export function getMessageList(query, pageNo = 1, pageSize = 10) {
  console.log('Getting message list:', {query, pageNo, pageSize});
  return request({
    url: '/sys/message/sysMessage/list',
    method: 'get',
    params: {
      sysMessage: query,
      pageNo,
      pageSize
    }
  }).then(res => {
    console.log('Message list retrieved successfully:', res);
    return res;
  }).catch(err => {
    console.error('Failed to get message list:', err);
    throw err;
  })
}

// 获取聊天会话列表
export function getChatSessions(params) {
  if (!params.userId) {
    console.error('Missing required field: userId', params);
    throw new Error('用户ID不能为空');
  }
  
  console.log('Getting chat sessions by userId:', params.userId);
  return request({
    url: '/sys/message/sysMessage/getChatSessions',
    method: 'get',
    params: {
      userId: params.userId
    }
  }).then(res => {
    console.log('Chat sessions retrieved successfully:', res);
    return res;
  }).catch(err => {
    console.error('Failed to get chat sessions:', err);
    throw err;
  })
}
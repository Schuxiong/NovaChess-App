// 对局总结服务
// 直接使用deepseekService中的配置和方法
import { 
  getNextMove, 
  getCurrentModel, 
  setModel, 
  checkApiAvailability
} from '@/pages/play/robot/utils/deepseekService.js';

// DeepSeek API配置（与deepseekService.js保持一致）
const DEEPSEEK_API_KEY = 'sk-5486de373f5a4abcb0419a64206a8101';
const KIMI_API_KEY = 'sk-K4fasuaFPYpM3zzxcLVJtsZjZ0uDOLUvzm11jF3yNhEp70f0';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

// 模型配置（与deepseekService.js保持一致）
const MODELS = {
  'deepseek-V3': {
    name: 'deepseek-chat',
    apiKey: DEEPSEEK_API_KEY,
    apiUrl: DEEPSEEK_API_URL
  },
  'deepseek-R1': {
    name: 'deepseek-reasoner',
    apiKey: DEEPSEEK_API_KEY,
    apiUrl: DEEPSEEK_API_URL
  },
  'kimi': {
    name: 'moonshot-v1-8k',
    apiKey: KIMI_API_KEY,
    apiUrl: KIMI_API_URL
  }
};

// API配置（兼容旧版本）
const API_CONFIGS = {
  deepseek: {
    url: DEEPSEEK_API_URL,
    key: DEEPSEEK_API_KEY,
    model: 'deepseek-chat'
  },
  'deepseek-V3': {
    url: DEEPSEEK_API_URL,
    key: DEEPSEEK_API_KEY,
    model: 'deepseek-chat'
  },
  'deepseek-R1': {
    url: DEEPSEEK_API_URL,
    key: DEEPSEEK_API_KEY,
    model: 'deepseek-reasoner'
  },
  kimi: {
    url: KIMI_API_URL, 
    key: KIMI_API_KEY,
    model: 'moonshot-v1-8k'
  }
};

/**
 * 将棋盘状态转换为FEN表示法
 * @param {Array} boardState 棋盘状态二维数组
 * @returns {String} FEN字符串
 */
function boardToFEN(boardState) {
  let fen = '';

  for (let row = 0; row < 8; row++) {
    let emptyCount = 0;

    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];

      if (!piece) {
        emptyCount++;
      } else {
        // 如果之前有空格，先添加数字
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }

        // 添加棋子字符
        const pieceType = piece.split('-')[1];
        const pieceColor = piece.split('-')[0];

        let pieceChar = '';

        switch (pieceType) {
          case 'pawn': pieceChar = 'p'; break;
          case 'knight': pieceChar = 'n'; break;
          case 'bishop': pieceChar = 'b'; break;
          case 'rook': pieceChar = 'r'; break;
          case 'queen': pieceChar = 'q'; break;
          case 'king': pieceChar = 'k'; break;
        }

        // 白棋用大写字母
        if (pieceColor === 'white') {
          pieceChar = pieceChar.toUpperCase();
        }

        fen += pieceChar;
      }
    }

    // 如果行末有空格，添加数字
    if (emptyCount > 0) {
      fen += emptyCount;
    }

    // 除了最后一行外，每行用/分隔
    if (row < 7) {
      fen += '/';
    }
  }

  // 为完整的FEN添加额外信息
  fen += ' w KQkq - 0 1';

  return fen;
}

/**
 * 将棋局历史转换为代数记谱法列表
 * @param {Array} moveHistory 走棋历史记录
 * @returns {String} 代数记谱法的移动列表
 */
function formatMoveHistory(moveHistory) {
  let formattedHistory = '';

  moveHistory.forEach((move, index) => {
    // 每两步一组，白棋先行
    if (index % 2 === 0) {
      formattedHistory += `${Math.floor(index / 2) + 1}. `;
    }

    formattedHistory += `${move.notation} `;
  });

  return formattedHistory;
}

/**
 * 构建对局总结的提示词
 * @param {Object} gameData 对局数据
 * @returns {Array} 提示词消息数组
 */
function buildSummaryPrompt(gameData) {
  const { 
    moveHistory, 
    finalBoardState, 
    gameResult, 
    playerName, 
    opponentName, 
    playAs, 
    timeControl,
    gameMode,
    isLeaderboardMode,
    ratingChange 
  } = gameData;

  const fenString = boardToFEN(finalBoardState);
  const historyNotation = formatMoveHistory(moveHistory);
  
  return [
    {
      role: "system",
      content: `你是一位专业的国际象棋教练和分析师，具有深厚的象棋理论知识和丰富的教学经验。你擅长分析棋局，识别关键时刻，评估走法质量，并为棋手提供有价值的改进建议。

你的分析风格：
1. 客观公正，既指出优秀走法也指出失误
2. 教育性强，解释背后的战术和战略原理
3. 建设性，提供具体的改进建议
4. 易懂，用通俗的语言解释复杂的概念

请为这局国际象棋对局提供专业的总结分析。`
    },
    {
      role: "user",
      content: `请分析以下国际象棋对局：

**对局信息：**
- 玩家：${playerName}（执${playAs === 'white' ? '白' : '黑'}棋）vs ${opponentName}
- 时间控制：${timeControl}
- 游戏模式：${gameMode}${isLeaderboardMode ? '（天梯赛）' : ''}
- 对局结果：${gameResult}
${ratingChange ? `- 积分变化：${ratingChange.change > 0 ? '+' : ''}${ratingChange.change}（${ratingChange.before} → ${ratingChange.after}）` : ''}

**走棋记录：**
${historyNotation}

**最终局面FEN：**
${fenString}

请提供一份详细的对局总结，包括：

1. **开局分析**：评估开局选择和前10-15步的质量
2. **中局要点**：识别关键的战术时刻和转折点
3. **关键失误**：指出双方的重要失误及正确走法
4. **优秀走法**：赞扬精彩的战术或战略决策
5. **结局分析**：分析游戏是如何结束的
6. **学习建议**：为${playerName}提供具体的改进建议
7. **总体评价**：对这局棋的整体水平和精彩程度评分（1-10分）

请用中文回答，语言要专业但易懂，适合象棋爱好者阅读。`
    }
  ];
}

/**
 * 调用AI API生成对局总结
 * @param {Object} gameData 对局数据
 * @param {String} preferredModel 首选模型 ('deepseek', 'deepseek-V3', 'deepseek-R1', 'kimi')
 * @returns {Promise<String>} 对局总结文本
 */
export async function generateGameSummary(gameData, preferredModel = 'deepseek-V3') {
  const messages = buildSummaryPrompt(gameData);
  
  // 定义模型尝试顺序
  const modelPriority = [preferredModel];
  
  // 添加备用模型
  const allModels = ['deepseek-V3', 'deepseek-R1', 'deepseek', 'kimi'];
  allModels.forEach(model => {
    if (model !== preferredModel && !modelPriority.includes(model)) {
      modelPriority.push(model);
    }
  });
  
  // 依次尝试每个模型
  for (let i = 0; i < modelPriority.length; i++) {
    const currentModel = modelPriority[i];
    try {
      console.log(`尝试使用${currentModel}模型生成对局总结...`);
      const result = await callAIAPI(messages, currentModel);
      console.log(`${currentModel}模型成功生成对局总结`);
      return result;
    } catch (error) {
      console.warn(`使用${currentModel}模型失败:`, error.message);
      
      // 如果不是最后一个模型，继续尝试下一个
      if (i < modelPriority.length - 1) {
        console.log(`尝试下一个模型: ${modelPriority[i + 1]}`);
        continue;
      }
    }
  }
  
  // 所有模型都失败
  console.error('所有AI模型都失败');
  throw new Error('AI分析服务暂时不可用，请稍后重试');
}

/**
 * 调用指定的AI API
 * @param {Array} messages 消息数组
 * @param {String} modelName 模型名称
 * @returns {Promise<String>} AI响应文本
 */
function callAIAPI(messages, modelName) {
  const config = API_CONFIGS[modelName];
  if (!config) {
    throw new Error(`未知的模型: ${modelName}`);
  }

  // 根据模型类型调整请求参数
  const requestData = {
    model: config.model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000
  };

  // 对于deepseek-R1模型，使用deepseek-reasoner
  if (modelName === 'deepseek-R1') {
    requestData.model = 'deepseek-reasoner';
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: config.url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      data: requestData,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`${modelName.toUpperCase()} API请求失败: ${res.statusCode}`));
          return;
        }

        try {
          const data = res.data;
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            reject(new Error(`${modelName.toUpperCase()} API响应格式错误`));
            return;
          }
          
          const aiResponse = data.choices[0].message.content;
          if (!aiResponse || aiResponse.trim() === '') {
            reject(new Error(`${modelName.toUpperCase()} API返回空响应`));
            return;
          }
          
          resolve(aiResponse);
        } catch (error) {
          console.error(`解析${modelName.toUpperCase()} AI响应失败:`, error);
          reject(new Error(`无法解析${modelName.toUpperCase()} AI的响应: ${error.message}`));
        }
      },
      fail: (err) => {
        console.error(`${modelName.toUpperCase()} API请求失败:`, err);
        reject(new Error(`${modelName.toUpperCase()} API网络请求失败: ${err.errMsg || '未知错误'}`));
      }
    });
  });
}

/**
 * 检查AI API是否可用
 * @param {String} modelName 模型名称
 * @returns {Promise<Boolean>} 是否可用
 */
export async function checkAIAvailability(modelName) {
  const config = API_CONFIGS[modelName];
  if (!config) {
    return false;
  }

  // 根据模型类型调整请求参数
  const requestData = {
    model: config.model,
    messages: [{ role: 'user', content: 'ping' }],
    temperature: 0.1,
    max_tokens: 1
  };

  // 对于deepseek-R1模型，使用deepseek-reasoner
  if (modelName === 'deepseek-R1') {
    requestData.model = 'deepseek-reasoner';
  }

  return new Promise((resolve) => {
    uni.request({
      url: config.url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      data: requestData,
      success: (res) => {
        resolve(res.statusCode === 200);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 获取所有可用的AI模型
 * @returns {Promise<Array>} 可用模型列表
 */
export async function getAvailableModels() {
  const models = [];
  
  // 定义模型显示名称映射
  const modelDisplayNames = {
    'deepseek': 'DeepSeek Chat',
    'deepseek-V3': 'DeepSeek V3',
    'deepseek-R1': 'DeepSeek R1',
    'kimi': 'Kimi'
  };
  
  for (const modelName in API_CONFIGS) {
    const isAvailable = await checkAIAvailability(modelName);
    models.push({
      name: modelName,
      displayName: modelDisplayNames[modelName] || modelName,
      available: isAvailable
    });
  }
  
  return models;
}
// DeepSeek API服务
const DEEPSEEK_API_KEY = 'sk-5486de373f5a4abcb0419a64206a8101';
const KIMI_API_KEY = 'sk-K4fasuaFPYpM3zzxcLVJtsZjZ0uDOLUvzm11jF3yNhEp70f0';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

// 模型配置
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

// 默认使用的模型
let currentModel = 'deepseek';

// 检查API可用性状态
let apiAvailabilityChecked = {
  'deepseek': false,
  'deepseekR1': false,
  'kimi': false
};
let isApiAvailable = {
  'deepseek': false,
  'deepseekR1': false,
  'kimi': false
};

/**
 * 设置当前使用的模型
 * @param {String} modelId 模型ID ('deepseek' 或 'kimi')
 * @returns {Boolean} 是否设置成功
 */
export function setModel(modelId) {
  if (MODELS[modelId]) {
    currentModel = modelId;
    return true;
  }
  return false;
}

/**
 * 获取当前使用的模型ID
 * @returns {String} 当前模型ID
 */
export function getCurrentModel() {
  return currentModel;
}

/**
 * 获取所有可用模型列表
 * @returns {Array} 模型列表
 */
export function getAvailableModels() {
  return Object.keys(MODELS).map(id => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1), // 首字母大写
    available: isApiAvailable[id]
  }));
}

/**
 * 检查API域名是否已配置为合法域名
 * @param {String} modelId 模型ID
 * @returns {Promise<boolean>} API是否可用
 */
export async function checkApiAvailability(modelId = currentModel) {
  // 如果已经检查过，直接返回结果
  if (apiAvailabilityChecked[modelId]) {
    return isApiAvailable[modelId];
  }

  const model = MODELS[modelId];
  if (!model) {
    console.error(`未找到模型配置: ${modelId}`);
    return false;
  }

  // 直接尝试主API接口的POST请求检测可用性
  return new Promise((resolve) => {
    try {
      uni.request({
        url: model.apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`
        },
        data: {
          model: model.name,
          messages: [{role: 'user', content: 'ping'}],
          temperature: 0.1,
          max_tokens: 1
        },
        success: (res) => {
          if (res.statusCode === 200) {
            apiAvailabilityChecked[modelId] = true;
            isApiAvailable[modelId] = true;
            resolve(true);
          } else {
            apiAvailabilityChecked[modelId] = true;
            isApiAvailable[modelId] = false;
            resolve(false);
          }
        },
        fail: (err) => {
          apiAvailabilityChecked[modelId] = true;
          isApiAvailable[modelId] = false;
          resolve(false);
        }
      });
    } catch (error) {
      apiAvailabilityChecked[modelId] = true;
      isApiAvailable[modelId] = false;
      resolve(false);
    }
  });
}

/**
 * 检查所有可用的模型API
 * @returns {Promise<Object>} 各模型的可用状态
 */
export async function checkAllModelsAvailability() {
  const results = {};
  for (const modelId in MODELS) {
    results[modelId] = await checkApiAvailability(modelId);
  }
  return results;
}

// 不同级别机器人的提示词
const ROBOT_PROMPTS = {
  'master': {
    systemPrompt: `你是一位象棋大师，精通国际象棋的策略和技巧。你的风格是偏重于战术交换和防守。
你对开局理论有深入的理解，特别擅长处理复杂的中盘局面和精确计算。`,
    personality: '稳健、谨慎、善于防守',
    level: '中高级'
  },
  'professor': {
    systemPrompt: `你是一位象棋教授，拥有扎实的理论基础和丰富的教学经验。你的风格是注重棋局的平衡和发展。
你会关注棋子的协调性，确保每一步棋都有战略意义。你喜欢解释每一步背后的思考过程，帮助对手理解棋局。`,
    personality: '严谨、善于分析、关注棋子发展',
    level: '高级'
  },
  'champion': {
    systemPrompt: `你是一位地区冠军，擅长进攻性的下法。你注重棋局的攻势和快速的行动。
你偏好牺牲交换来获取攻击机会，敢于冒险，追求主动权。你的目标是快速破坏对手的防御体系，直捣王城。`,
    personality: '进取、直接、喜欢攻击',
    level: '高级'
  },
  'grandmaster': {
    systemPrompt: `你是一位特级大师，对国际象棋有着深刻的理解。你的下棋风格灵活多变，能够根据局势调整策略。
你精通各类开局，中盘处理精确，残局技术精湛。你能够预见多步之后的局面，并为此制定长远计划。
你知道什么时候该进攻，什么时候该防守，什么时候该交换，什么时候该牺牲。`,
    personality: '灵活、全面、策略多变',
    level: '特级'
  },
  'legend': {
    systemPrompt: `你是一位传奇棋手，拥有创新的下棋风格和独特的见解。你往往能发现常人想不到的着法。
你可以打破常规，创造出震撼棋坛的非凡局面。你的每一步棋都充满创意和深度，迫使对手思考和适应你的非常规思维。
你对局面的评估超越了传统的物质价值观念，能发现潜藏的战术和战略机会。`,
    personality: '创新、不按常理出牌、出人意料',
    level: '传奇'
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

  // 为完整的FEN添加额外信息（假设白方先行，双方均可王车易位，无吃过路兵，无半回合计数器）
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
 * 构建增强的提示词
 * @param {Object} robotPrompt 机器人提示词配置
 * @param {String} fenString FEN字符串
 * @param {String} historyNotation 历史走法
 * @param {String} robotColor 机器人棋子颜色
 * @param {Number} thinkingDepth 思考深度 (1-5)
 * @returns {Array} 提示词消息数组
 */
function buildEnhancedPrompt(robotPrompt, fenString, historyNotation, robotColor, thinkingDepth = 3) {
  // 根据思考深度调整提示词
  let thinkingInstructions = '';

  switch (thinkingDepth) {
    case 1: // 浅显
      thinkingInstructions = `
请快速思考，提供一个合理的走法。不需要详细分析，简单提供一步有效的棋。
你的思考过程应当简短，重点在于移动的合法性和基本战术。`;
      break;
    case 2: // 普通
      thinkingInstructions = `
请分析当前局面，考虑几步可能的走法，并选择一个合理的走法。
包括基本的战术考虑和对对手可能回应的简单预判。`;
      break;
    case 3: // 深入
      thinkingInstructions = `
请系统分析当前局面，评估多种可能的走法及其后果。
分析应包括战术机会、防御需求和中期棋局展望。
尝试预见对手的回应并做出相应的计划。`;
      break;
    case 4: // 精细
      thinkingInstructions = `
请进行深入细致的局面分析，全面评估多种走法及其变化线路。
你的分析应包括子力价值、位置优劣、战术机会、防御需求和长期战略考量。
预判对手的多种可能回应，并制定2-3步的具体计划。
注意识别关键的战术点和潜在的战略主题。`;
      break;
    case 5: // 极致
      thinkingInstructions = `
请进行极其深入和全面的局面分析，模拟大师级的思考过程。
详细评估至少5种最佳候选走法，分析每种走法的至少3步以后的变化。
你的分析应包括:
1. 详细的子力价值评估
2. 位置特点和弱点
3. 时间（攻击速度）考量
4. 空间控制评估
5. 王安全评估
6. 中残局转换的长期战略预判

考虑形势下的具体计算，提供精确的变化和评估。
如同顶级棋手一样准确计算多步之后的局面。`;
      break;
  }

  return [
    {
      role: "system",
      content: `${robotPrompt.systemPrompt}
你是一个专业的国际象棋AI助手，具有以下特点和能力：

1. 你对国际象棋规则和理论有深刻理解
2. 你能够分析当前局面并识别最佳走法
3. 你熟悉各种开局理论和战术模式
4. 你能够识别潜在的威胁和机会
5. 你有着${robotPrompt.personality}的下棋风格

你正在与人类玩家对弈国际象棋。请基于当前局面，提供合法且符合你风格的走法。`
    },
    {
      role: "user",
      content: `当前棋局FEN: ${fenString}
历史走法: ${historyNotation}
你执${robotColor === 'white' ? '白' : '黑'}棋。现在轮到你走棋。

${thinkingInstructions}

请严格按照以下步骤思考：
1. 分析当前局面的特点（布局、子力优劣、威胁等）
2. 考虑可能的走法及其后果
3. 评估每种走法的优劣
4. 选择最符合你风格的走法

你的回复必须是以下JSON格式:
{
  "思考": "你的思考过程（包括局面分析、可能的走法评估）",
  "走法": "使用代数记谱法表示的走法，如e2e4、g8f6等",
  "消息": "给人类玩家的简短消息（1-2句话，可以包含战术提示或友好交流）"
}

只返回这个JSON格式的回复，不要有任何其他多余的内容。确保走法合法，格式正确。`
    }
  ];
}

/**
 * 尝试使用可用的模型API获取下一步棋
 * @param {String} robotId 机器人ID
 * @param {Array} boardState 当前棋盘状态
 * @param {Array} moveHistory 走棋历史
 * @param {String} playerColor 玩家颜色
 * @param {Object} aiParams 可选的AI参数配置 
 * @returns {Promise<Object>} 包含下一步移动和消息的对象
 */
export async function getNextMove(robotId, boardState, moveHistory, playerColor, aiParams = {}) {
  // 首先尝试当前设置的模型
  try {
    const result = await tryGetNextMoveWithModel(robotId, boardState, moveHistory, playerColor, currentModel, aiParams);
    return result;
  } catch (error) {
    console.warn(`使用${currentModel}模型获取下一步失败，尝试备用模型...`, error);

    // 如果当前模型失败，尝试其他可用模型
    for (const modelId in MODELS) {
      if (modelId !== currentModel) {
        try {
          const result = await tryGetNextMoveWithModel(robotId, boardState, moveHistory, playerColor, modelId, aiParams);
          return result;
        } catch (modelError) {
          console.error(`使用${modelId}模型也失败:`, modelError);
        }
      }
    }

    // 如果所有模型都失败，抛出错误
    throw new Error('所有模型API均不可用或请求失败');
  }
}

/**
 * 使用指定模型尝试获取下一步棋
 * @param {String} robotId 机器人ID
 * @param {Array} boardState 当前棋盘状态
 * @param {Array} moveHistory 走棋历史
 * @param {String} playerColor 玩家颜色
 * @param {String} modelId 模型ID
 * @param {Object} aiParams AI参数配置
 * @returns {Promise<Object>} 包含下一步移动和消息的对象
 */
async function tryGetNextMoveWithModel(robotId, boardState, moveHistory, playerColor, modelId, aiParams = {}) {
  try {
    // 检查API是否可用
    const apiAvailable = await checkApiAvailability(modelId);
    if (!apiAvailable) {
      throw new Error(`${modelId.toUpperCase()} API未配置或不可用`);
    }

    const robotPrompt = ROBOT_PROMPTS[robotId];
    if (!robotPrompt) {
      throw new Error('未找到对应机器人的提示词配置');
    }

    // 将棋盘转换为FEN
    const fenString = boardToFEN(boardState);

    // 将历史移动转换为代数记谱法
    const historyNotation = formatMoveHistory(moveHistory);

    // 确定机器人执子颜色
    const robotColor = playerColor === 'white' ? 'black' : 'white';

    // 构建增强的提示词
    const messages = buildEnhancedPrompt(robotPrompt, fenString, historyNotation, robotColor, aiParams.thinkingDepth || 3);

    // 获取模型配置
    const model = MODELS[modelId];

    // 设置默认参数
    const temperature = aiParams.temperature !== undefined ? aiParams.temperature : 0.7;
    const maxTokens = aiParams.maxTokens || 800;

    // 构建请求参数
    const requestData = {
      model: modelId === 'deepseek-R1' ? 'deepseek-reasoner' : model.name,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    };

    // 使用uni.request替代wx.request
    return new Promise((resolve, reject) => {
      uni.request({
        url: model.apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`
        },
        data: requestData,
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`${modelId.toUpperCase()} API请求失败: ${res.statusCode}`));
            return;
          }

          try {
            const data = res.data;
            const aiResponse = data.choices[0].message.content;

            // 解析JSON响应
            const parsedResponse = JSON.parse(aiResponse);

            // 将代数记谱法转换为行列坐标
            const moveNotation = parsedResponse.走法;
            const fromCol = moveNotation.charCodeAt(0) - 97; // 'a'的ASCII码是97
            const fromRow = 8 - parseInt(moveNotation[1]);
            const toCol = moveNotation.charCodeAt(2) - 97;
            const toRow = 8 - parseInt(moveNotation[3]);

            // 检查是否有升变
            let promotion = null;
            if (moveNotation.length > 4) {
              const promotionPiece = moveNotation[4];
              switch (promotionPiece) {
                case 'q': promotion = 'queen'; break;
                case 'r': promotion = 'rook'; break;
                case 'b': promotion = 'bishop'; break;
                case 'n': promotion = 'knight'; break;
              }
            }

            resolve({
              from: { row: fromRow, col: fromCol },
              to: { row: toRow, col: toCol },
              promotion: promotion,
              message: parsedResponse.消息,
              thoughts: parsedResponse.思考,
              modelUsed: modelId, // 添加使用的模型信息
              parameters: { // 返回使用的参数
                temperature: temperature,
                maxTokens: maxTokens,
                thinkingDepth: aiParams.thinkingDepth || 3
              }
            });
          } catch (error) {
            console.error(`解析${modelId.toUpperCase()} AI响应失败:`, error);
            reject(new Error(`无法解析${modelId.toUpperCase()} AI的响应`));
          }
        },
        fail: (err) => {
          console.error(`${modelId.toUpperCase()} API请求失败:`, err);
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error(`${modelId.toUpperCase()} API调用失败:`, error);
    throw error;
  }
}
// DeepSeek API服务
const DEEPSEEK_API_KEY = 'sk-02404221901c4cfe82f7c44f2804c50a';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 不同级别机器人的提示词
const ROBOT_PROMPTS = {
  'master': {
    systemPrompt: '你是一位象棋大师，精通国际象棋的策略和技巧。你的风格是偏重于战术交换和防守。',
    personality: '稳健、谨慎、善于防守',
    level: '中高级'
  },
  'professor': {
    systemPrompt: '你是一位象棋教授，拥有扎实的理论基础和丰富的教学经验。你的风格是注重棋局的平衡和发展。',
    personality: '严谨、善于分析、关注棋子发展',
    level: '高级'
  },
  'champion': {
    systemPrompt: '你是一位地区冠军，擅长进攻性的下法。你注重棋局的攻势和快速的行动。',
    personality: '进取、直接、喜欢攻击',
    level: '高级'
  },
  'grandmaster': {
    systemPrompt: '你是一位特级大师，对国际象棋有着深刻的理解。你的下棋风格灵活多变，能够根据局势调整策略。',
    personality: '灵活、全面、策略多变',
    level: '特级'
  },
  'legend': {
    systemPrompt: '你是一位传奇棋手，拥有创新的下棋风格和独特的见解。你往往能发现常人想不到的着法。',
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
 * 使用DeepSeek API获取下一步棋
 * @param {String} robotId 机器人ID
 * @param {Array} boardState 当前棋盘状态
 * @param {Array} moveHistory 走棋历史
 * @param {String} playerColor 玩家颜色
 * @returns {Promise<Object>} 包含下一步移动和消息的对象
 */
export async function getNextMove(robotId, boardState, moveHistory, playerColor) {
  try {
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

    // 构建提示词
    const messages = [
      {
        role: "system",
        content: `${robotPrompt.systemPrompt}
你正在与人类玩家对弈国际象棋。
当前棋局FEN: ${fenString}
历史走法: ${historyNotation}
你执${robotColor === 'white' ? '白' : '黑'}棋。现在轮到你走棋。

请分析棋局状态，然后提供你的下一步走法。
你的回复必须是以下JSON格式:
{
  "思考": "你的思考过程（简短分析局势）",
  "走法": "使用代数记谱法表示的走法，如e2e4、g8f6等",
  "消息": "给人类玩家的简短消息（1-2句话）"
}

只返回这个JSON格式的回复，不要有任何其他多余的内容。`
      }
    ];

    // 调用DeepSeek API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 解析JSON响应
    try {
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

      return {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        promotion: promotion,
        message: parsedResponse.消息,
        thoughts: parsedResponse.思考
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new Error('无法解析AI的响应');
    }
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw error;
  }
} 
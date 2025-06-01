import config from '@/config'

/**
 * 获取API基础URL
 */
const apiBaseUrl = config.baseUrl;

/**
 * 将棋盘状态转换为FEN表示法
 * @param {Array} boardState 棋盘状态二维数组
 * @returns {String} FEN字符串
 */
export function boardToFEN(boardState) {
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

  // 添加当前行棋方 (默认白方)
  fen += ' w';

  // 添加王车易位权限 (默认所有可能)
  fen += ' KQkq';

  // 添加吃过路兵目标格 (默认无)
  fen += ' -';

  // 添加半回合计数器和全回合计数
  fen += ' 0 1';

  return fen;
}

/**
 * 评估当前棋局
 * @param {Array} boardState 棋盘状态
 * @param {Object} options 评估选项
 * @returns {Promise} 返回评估结果的Promise
 */
export async function evaluatePosition(boardState, options = {}) {
  try {
    // 将棋盘状态转换为FEN表示法
    const fen = boardToFEN(boardState);

    // 确定使用哪个API端点
    let url = `${apiBaseUrl}/chess/stockfish/evaluate?fen=${encodeURIComponent(fen)}`;

    // 如果指定了深度
    if (options.depth) {
      url = `${apiBaseUrl}/chess/stockfish/evaluate/depth/${options.depth}?fen=${encodeURIComponent(fen)}`;
    }
    // 如果指定了时间
    else if (options.timeMs) {
      url = `${apiBaseUrl}/chess/stockfish/evaluate/time/${options.timeMs}?fen=${encodeURIComponent(fen)}`;
    }

    // 发送请求
    const response = await uni.request({
      url,
      method: 'GET'
    });

    // 如果请求成功
    if (response.statusCode === 200) {
      return response.data;
    } else {
      throw new Error(`请求失败: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('评估棋局时出错:', error);
    throw error;
  }
}

/**
 * 获取最佳走法
 * @param {Array} boardState 棋盘状态
 * @returns {Promise} 返回最佳走法的Promise
 */
export async function getBestMove(boardState) {
  try {
    // 将棋盘状态转换为FEN表示法
    const fen = boardToFEN(boardState);

    // 构造API请求
    const url = `${apiBaseUrl}/chess/stockfish/best-move?fen=${encodeURIComponent(fen)}`;

    // 发送请求
    const response = await uni.request({
      url,
      method: 'GET'
    });

    // 如果请求成功
    if (response.statusCode === 200) {
      return response.data;
    } else {
      throw new Error(`请求失败: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('获取最佳走法时出错:', error);
    throw error;
  }
}

/**
 * 格式化评估分数
 * @param {Number} score 评估分数
 * @returns {String} 格式化后的字符串
 */
export function formatEvaluation(score) {
  if (score === 0) return '0.0';
  return score > 0 ? '+' + score.toFixed(1) : score.toFixed(1);
}

/**
 * 获取评估描述
 * @param {Number} evaluation 评估分数
 * @returns {String} 评估描述
 */
export function getEvaluationDescription(evaluation) {
  if (evaluation === 0) return '局势均衡';

  if (evaluation > 0) {
    if (evaluation < 0.5) return '白方略有优势';
    if (evaluation < 1.5) return '白方有优势';
    if (evaluation < 3) return '白方明显优势';
    if (evaluation < 5) return '白方决定性优势';
    return '白方胜势';
  } else {
    const absEval = Math.abs(evaluation);
    if (absEval < 0.5) return '黑方略有优势';
    if (absEval < 1.5) return '黑方有优势';
    if (absEval < 3) return '黑方明显优势';
    if (absEval < 5) return '黑方决定性优势';
    return '黑方胜势';
  }
}
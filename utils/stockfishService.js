// utils/stockfishService.js
// 注意：请将下面的 STOCKFISH_API_BASE_URL 替换为您的实际后端API地址
const STOCKFISH_API_BASE_URL = 'http://localhost:8080'; // 例如: 'http://localhost:8000/api'

/**
 * 将棋盘状态（二维数组）转换为 FEN 字符串。
 * 这是一个基础的实现，可能需要根据您的具体棋子表示和游戏逻辑进行调整，
 * 特别是关于王车易位、吃过路兵、半回合数和总回合数的精确处理。
 * @param {Array<Array<String|null>>} boardState - 8x8 棋盘数组
 * @param {String} currentPlayer - 当前行棋方 ('white' 或 'black')
 * @param {Object} castlingRights - 王车易位权利 (例如：{ whiteKingSide: true, whiteQueenSide: false, ... })
 * @param {Object|null} enPassantTarget - 吃过路兵的目标格 (例如：{ row: 2, col: 4 } 表示 e6)
 * @param {Number} halfMoveClock - 从上次吃子或兵移动以来的半回合数
 * @param {Number} fullMoveNumber - 总回合数
 * @returns {String} FEN 字符串
 */
export function boardToFEN(boardState, currentPlayer, castlingRights, enPassantTarget, halfMoveClock, fullMoveNumber) {
  let fen = '';
  // 1. Piece placement
  for (let i = 0; i < 8; i++) {
    let emptySquares = 0;
    for (let j = 0; j < 8; j++) {
      const piece = boardState[i][j];
      if (piece) {
        if (emptySquares > 0) {
          fen += emptySquares;
          emptySquares = 0;
        }
        let pieceChar = '';
        const color = piece.startsWith('white') ? 'w' : 'b';
        const type = piece.split('-')[1];
        switch (type) {
          case 'king': pieceChar = 'k'; break;
          case 'queen': pieceChar = 'q'; break;
          case 'rook': pieceChar = 'r'; break;
          case 'bishop': pieceChar = 'b'; break;
          case 'knight': pieceChar = 'n'; break;
          case 'pawn': pieceChar = 'p'; break;
        }
        fen += (color === 'w' ? pieceChar.toUpperCase() : pieceChar);
      } else {
        emptySquares++;
      }
    }
    if (emptySquares > 0) {
      fen += emptySquares;
    }
    if (i < 7) {
      fen += '/';
    }
  }

  // 2. Active color
  fen += ` ${currentPlayer === 'white' ? 'w' : 'b'}`;

  // 3. Castling availability
  let castlingStr = "";
  if (castlingRights) { // 确保 castlingRights 对象存在
    if (castlingRights.whiteKingSide) castlingStr += "K";
    if (castlingRights.whiteQueenSide) castlingStr += "Q";
    if (castlingRights.blackKingSide) castlingStr += "k";
    if (castlingRights.blackQueenSide) castlingStr += "q";
  }
  fen += ` ${castlingStr || "-"}`;

  // 4. En passant target square
  if (enPassantTarget && enPassantTarget.row !== null && enPassantTarget.col !== null) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    // FEN 中的 en passant 是兵跳过后的格子，而不是兵本身的位置
    // 如果白兵从第2行跳到第4行，目标是第3行；黑兵从第7行跳到第5行，目标是第6行。
    const rank = currentPlayer === 'white' ? (8 - (enPassantTarget.row + 1)) : (8 - (enPassantTarget.row - 1));
    fen += ` ${files[enPassantTarget.col]}${rank}`;
  } else {
    fen += " -";
  }

  // 5. Halfmove clock
  fen += ` ${halfMoveClock}`;

  // 6. Fullmove number
  fen += ` ${fullMoveNumber}`;

  return fen;
}


/**
 * 调用 Stockfish API 评估棋局 (指定深度)
 * @param {string} fen - 棋局的FEN表示
 * @param {number} depth - 分析深度
 * @returns {Promise<Object>} Stockfish评估结果
 */
export async function evaluateBoardByDepth(fen, depth) {
  if (!STOCKFISH_API_BASE_URL || STOCKFISH_API_BASE_URL === 'YOUR_STOCKFISH_API_ENDPOINT') {
    console.warn('Stockfish API base URL is not configured in utils/stockfishService.js');
    // 返回一个模拟的失败或默认值，以避免应用崩溃
    return Promise.reject(new Error('Stockfish API not configured'));
  }
  try {
    const response = await uni.request({
      url: `${STOCKFISH_API_BASE_URL}/chess/stockfish/evaluate/depth/${depth}?fen=${encodeURIComponent(fen)}`,
      method: 'GET',
    });

    if (response[0]) { // uni.request 在成功时返回 [null, res] 或 [err, null]
      throw new Error(response[0].errMsg || 'Network request failed');
    }

    const res = response[1];

    if (res.statusCode === 200) {
      return res.data;
    } else {
      console.error('Stockfish API Error:', res);
      throw new Error(`Stockfish API returned status ${res.statusCode}`);
    }
  } catch (error) {
    console.error('Error calling Stockfish API:', error);
    throw error;
  }
} 
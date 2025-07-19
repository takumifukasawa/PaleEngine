export interface ShaderError {
    line: number;
    column?: number;
    message: string;
    type: 'error' | 'warning';
    originalMessage: string;
}

export interface ParsedShaderError {
    errors: ShaderError[];
    summary: string;
    hasErrors: boolean;
}

/**
 * GLSLエラーメッセージをパースして構造化されたエラー情報を返す
 */
export function parseShaderError(errorMessage: string): ParsedShaderError {
    const lines = errorMessage.split('\n');
    const errors: ShaderError[] = [];
    
    for (const line of lines) {
        if (line.trim() === '') continue;
        
        const error = parseErrorLine(line);
        if (error) {
            errors.push(error);
        }
    }
    
    return {
        errors,
        summary: createErrorSummary(errors),
        hasErrors: errors.some(e => e.type === 'error')
    };
}

/**
 * 単一のエラー行をパースする
 */
function parseErrorLine(line: string): ShaderError | null {
    // WebGLエラーの一般的なパターン
    // ERROR: 0:123: 'undeclared identifier' : message
    // ERROR: 0:123: message
    // WARNING: 0:123: message
    
    const patterns = [
        /^(ERROR|WARNING):\s*\d+:(\d+):\s*(.+)$/,
        /^(ERROR|WARNING):\s*(\d+):\s*(.+)$/,
        /^ERROR:\s*(.+)$/,
        /^WARNING:\s*(.+)$/
    ];
    
    for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
            const type = match[1]?.toLowerCase() as 'error' | 'warning' || 'error';
            const lineNumber = match[2] ? parseInt(match[2], 10) : 0;
            const message = match[3] || match[1] || line;
            
            return {
                line: lineNumber,
                message: translateErrorMessage(message),
                type,
                originalMessage: line
            };
        }
    }
    
    // パターンにマッチしない場合はそのまま返す
    return {
        line: 0,
        message: translateErrorMessage(line),
        type: 'error',
        originalMessage: line
    };
}

/**
 * エラーメッセージを日本語に翻訳/改善する
 */
function translateErrorMessage(message: string): string {
    const translations: { [key: string]: string } = {
        'undeclared identifier': '未定義の識別子',
        'syntax error': '構文エラー',
        'type mismatch': '型の不一致',
        'undeclared function': '未定義の関数',
        'missing return statement': 'return文がありません',
        'invalid assignment': '無効な代入',
        'division by zero': 'ゼロで割っています',
        'out of bounds': '配列の範囲外アクセス',
        'compilation failed': 'コンパイルに失敗しました',
        'link failed': 'リンクに失敗しました'
    };
    
    let translatedMessage = message;
    
    // 完全一致での翻訳
    for (const [eng, jp] of Object.entries(translations)) {
        if (message.toLowerCase().includes(eng)) {
            translatedMessage = translatedMessage.replace(new RegExp(eng, 'gi'), jp);
        }
    }
    
    return translatedMessage;
}

/**
 * エラーの要約を作成する
 */
function createErrorSummary(errors: ShaderError[]): string {
    if (errors.length === 0) {
        return 'エラーはありません';
    }
    
    const errorCount = errors.filter(e => e.type === 'error').length;
    const warningCount = errors.filter(e => e.type === 'warning').length;
    
    let summary = '';
    if (errorCount > 0) {
        summary += `エラー: ${errorCount}件`;
    }
    if (warningCount > 0) {
        if (summary) summary += ', ';
        summary += `警告: ${warningCount}件`;
    }
    
    return summary;
}

/**
 * エラーを見やすい形式でフォーマットする
 */
export function formatShaderError(parsedError: ParsedShaderError): string {
    if (parsedError.errors.length === 0) {
        return 'エラーはありません';
    }
    
    let formatted = `${parsedError.summary}\n\n`;
    
    parsedError.errors.forEach((error) => {
        const prefix = error.type === 'error' ? '❌' : '⚠️';
        const lineInfo = error.line > 0 ? ` (行 ${error.line})` : '';
        formatted += `${prefix} ${error.message}${lineInfo}\n`;
    });
    
    return formatted;
}
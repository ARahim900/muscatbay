
interface PapaParseConfig {
  delimiter?: string;
  newline?: string;
  quoteChar?: string;
  escapeChar?: string;
  header?: boolean;
  dynamicTyping?: boolean;
  preview?: number;
  encoding?: string;
  worker?: boolean;
  comments?: boolean | string;
  download?: boolean;
  skipEmptyLines?: boolean | 'greedy';
  fastMode?: boolean;
  withCredentials?: boolean;
  transform?: (value: string, field: string) => any;
  transformHeader?: (header: string, index: number) => string;
}

interface PapaParseResult<T = any> {
  data: T[];
  errors: Array<{
    type: string;
    code: string;
    message: string;
    row: number;
  }>;
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

interface PapaParseInstance {
  parse(input: string | File, config?: PapaParseConfig): PapaParseResult;
  unparse(data: any, config?: any): string;
}

interface Window {
  Papa: PapaParseInstance;
}

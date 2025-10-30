// ----------------------------
// Types
// ----------------------------

export type SelectorType = 'id' | 'class' | 'tag' | 'xpath';

export type DataType = 'text' | 'html' | 'value' | 'default' | 'attribute';

export interface BaseStep {
  id: string;
  description?: string;
  object_type?: SelectorType;
  object?: string;
  action: 'navigate' | 'input' | 'click' | 'data' | 'scroll' | 'reload' | 'eventBaseDownload' | 'foreach' | 'open' | 'savePDF' | 'printToPDF' | 'downloadPDF' | 'downloadFile';
  value?: string;
  key?: string; // property key when collecting data
  data_type?: DataType;
  wait?: number; // optional wait in ms after performing the step
  terminateonerror?: boolean;
  subSteps?: BaseStep[]; // for foreach/open
  autoScroll?: boolean; // for foreach action - controls automatic scrolling (default: true)
}

export interface PaginationConfig {
  /** Strategy to move between pages */
  strategy: 'next' | 'scroll';

  /** For strategy='next' */
  nextButton?: {
    object_type: SelectorType;
    object: string;
    wait?: number; // wait after clicking next
  };

  /** For strategy='scroll' */
  scroll?: {
    offset?: number; // pixels to scroll each time, defaults to window.innerHeight
    delay?: number; // delay after scroll before collecting data (ms)
  };

  /** Maximum number of pages/scroll iterations to perform (safety guard). Omit for unlimited */
  maxPages?: number;
  paginationFirst?: boolean; // <--- added
  paginateAllFirst?: boolean; // <--- added
}

export interface TabTemplate {
  tab: string;

  /** Steps executed ONCE before pagination loop (e.g., perform initial search) */
  initSteps?: BaseStep[];

  /** Steps executed for EVERY page/scroll iteration (including first). */
  perPageSteps?: BaseStep[]; // if omitted, will fallback to legacy 'steps'

  /** Legacy single steps array (deprecated) */
  steps?: BaseStep[];

  /** Optional pagination instructions for this tab */
  pagination?: PaginationConfig;
}

export interface RunOptions {
  browser?: import('playwright').LaunchOptions;
  contextOptions?: import('playwright').BrowserContextOptions;
  /** Callback function to receive results as they're processed */
  onResult?: (result: Record<string, any>, index: number) => void | Promise<void>;
}

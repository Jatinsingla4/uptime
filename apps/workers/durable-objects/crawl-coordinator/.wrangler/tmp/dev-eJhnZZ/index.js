var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-ez2NH0/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.0.2_unenv@2.0.0-rc.14_workerd@1.20250718.0/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.0.2_unenv@2.0.0-rc.14_workerd@1.20250718.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260417.1/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// ../../../../node_modules/.pnpm/unenv@2.0.0-rc.14/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// ../../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.0.2_unenv@2.0.0-rc.14_workerd@1.20250718.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260417.1/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// ../../../../packages/shared/src/ulid.ts
var ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
var ENCODING_LEN = ENCODING.length;
var TIME_LEN = 10;
var RANDOM_LEN = 16;
function encodeTime(now, len) {
  let str = "";
  let time3 = now;
  for (let i = len - 1; i >= 0; i--) {
    str = ENCODING[time3 % ENCODING_LEN] + str;
    time3 = Math.floor(time3 / ENCODING_LEN);
  }
  return str;
}
__name(encodeTime, "encodeTime");
function encodeRandom(len) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => ENCODING[b % ENCODING_LEN]).join("");
}
__name(encodeRandom, "encodeRandom");
function ulid(seedTime) {
  const ms = seedTime ?? Date.now();
  return encodeTime(ms, TIME_LEN) + encodeRandom(RANDOM_LEN);
}
__name(ulid, "ulid");

// ../../../../packages/shared/src/ssrf.ts
function normalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (url.protocol === "http:" && url.port === "80" || url.protocol === "https:" && url.port === "443") {
    url.port = "";
  }
  url.searchParams.sort();
  return url.toString();
}
__name(normalizeUrl, "normalizeUrl");

// ../../../../packages/db/src/queries/crawls.ts
function rowToJob(row) {
  let stats = null;
  if (row.stats_json) {
    try {
      stats = JSON.parse(row.stats_json);
    } catch {
    }
  }
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    trigger: row.trigger,
    stats,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorMessage: row.error_message,
    createdAt: row.created_at
  };
}
__name(rowToJob, "rowToJob");
function rowToResult(row) {
  let redirectChain = [];
  try {
    redirectChain = JSON.parse(row.redirect_chain_json);
  } catch {
  }
  return {
    id: row.id,
    jobId: row.job_id,
    url: row.url,
    urlHash: row.url_hash,
    parentUrl: row.parent_url,
    depth: row.depth,
    statusCode: row.status_code,
    statusCategory: row.status_category,
    responseTimeMs: row.response_time_ms,
    contentType: row.content_type,
    redirectChain,
    errorReason: row.error_reason,
    scannedAt: row.scanned_at
  };
}
__name(rowToResult, "rowToResult");
var crawlsQueries = {
  async listByProject(db, projectId, limit = 20, cursor) {
    let query = "SELECT * FROM crawl_jobs WHERE project_id = ?";
    const bindings = [projectId];
    if (cursor) {
      query += " AND created_at < ?";
      bindings.push(parseInt(cursor, 10));
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    bindings.push(limit + 1);
    const { results } = await db.prepare(query).bind(...bindings).all();
    const hasMore = results.length > limit;
    const items = results.slice(0, limit).map(rowToJob);
    const result = { items };
    if (hasMore)
      result.nextCursor = String(items[items.length - 1].createdAt);
    return result;
  },
  async getById(db, id) {
    const row = await db.prepare("SELECT * FROM crawl_jobs WHERE id = ?").bind(id).first();
    return row ? rowToJob(row) : null;
  },
  async countRunning(db, projectId) {
    const row = await db.prepare("SELECT COUNT(*) as cnt FROM crawl_jobs WHERE project_id = ? AND status IN ('queued', 'running')").bind(projectId).first();
    return row?.cnt ?? 0;
  },
  async create(db, data) {
    const now = Date.now();
    await db.prepare(
      "INSERT INTO crawl_jobs (id, project_id, status, trigger, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(data.id, data.projectId, "queued", data.trigger, now).run();
    return {
      id: data.id,
      projectId: data.projectId,
      status: "queued",
      trigger: data.trigger,
      stats: null,
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
      createdAt: now
    };
  },
  async updateStatus(db, id, status, extra) {
    const now = Date.now();
    const isTerminal = status === "completed" || status === "failed" || status === "cancelled";
    await db.prepare(
      `UPDATE crawl_jobs SET
           status = ?,
           stats_json = COALESCE(?, stats_json),
           error_message = COALESCE(?, error_message),
           started_at = CASE WHEN status = 'queued' AND ? = 'running' THEN ? ELSE started_at END,
           finished_at = CASE WHEN ? THEN ? ELSE finished_at END
         WHERE id = ?`
    ).bind(
      status,
      extra?.stats ? JSON.stringify(extra.stats) : null,
      extra?.errorMessage ?? null,
      status,
      now,
      isTerminal ? 1 : 0,
      now,
      id
    ).run();
  },
  // ─── Results ─────────────────────────────────────────────────────────────
  async insertResultBatch(db, results) {
    if (results.length === 0)
      return;
    const statements = results.map(
      (r) => db.prepare(
        `INSERT OR IGNORE INTO crawl_results
            (id, job_id, url, url_hash, parent_url, depth, status_code,
             status_category, response_time_ms, content_type,
             redirect_chain_json, error_reason, scanned_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        r.id,
        r.jobId,
        r.url,
        r.urlHash,
        r.parentUrl ?? null,
        r.depth,
        r.statusCode ?? null,
        r.statusCategory,
        r.responseTimeMs ?? null,
        r.contentType ?? null,
        JSON.stringify(r.redirectChain),
        r.errorReason ?? null,
        r.scannedAt
      )
    );
    await db.batch(statements);
  },
  async listResults(db, jobId, opts) {
    const limit = opts.limit ?? 50;
    let query = "SELECT * FROM crawl_results WHERE job_id = ?";
    const bindings = [jobId];
    if (opts.statusCategory) {
      query += " AND status_category = ?";
      bindings.push(opts.statusCategory);
    }
    if (opts.cursor) {
      query += " AND scanned_at > ?";
      bindings.push(parseInt(opts.cursor, 10));
    }
    query += " ORDER BY scanned_at ASC LIMIT ?";
    bindings.push(limit + 1);
    const { results } = await db.prepare(query).bind(...bindings).all();
    const hasMore = results.length > limit;
    const items = results.slice(0, limit).map(rowToResult);
    const resultObj = { items };
    if (hasMore)
      resultObj.nextCursor = String(items[items.length - 1].scannedAt);
    return resultObj;
  },
  async getBrokenLinks(db, jobId) {
    const { results } = await db.prepare(
      "SELECT * FROM crawl_results WHERE job_id = ? AND status_category IN ('client_error','server_error','network_error') ORDER BY scanned_at ASC LIMIT 1000"
    ).bind(jobId).all();
    return results.map(rowToResult);
  }
};

// src/broadcast.ts
var BroadcastManager = class {
  sessions = /* @__PURE__ */ new Map();
  ringBuffer = [];
  // Throttling for page.scanned events
  scannedBuffer = [];
  scannedFlushTimer = null;
  lastProgressBroadcast = 0;
  addSession(sessionId, ws) {
    this.sessions.set(sessionId, { ws, sessionId });
  }
  removeSession(sessionId) {
    this.sessions.delete(sessionId);
  }
  sessionCount() {
    return this.sessions.size;
  }
  broadcast(event) {
    if (this.ringBuffer.length >= 500) {
      this.ringBuffer.shift();
    }
    this.ringBuffer.push({ eventId: event.eventId, event });
    const payload = JSON.stringify(event);
    const dead = [];
    for (const [id, session] of this.sessions) {
      try {
        if (session.ws.bufferedAmount ?? 0 > 1e6) {
          session.ws.close(1011, "Send buffer full");
          dead.push(id);
          continue;
        }
        session.ws.send(payload);
      } catch {
        dead.push(id);
      }
    }
    for (const id of dead)
      this.sessions.delete(id);
  }
  // Throttled page.scanned — batches up to 10/sec
  bufferPageScanned(url, statusCode, responseTimeMs) {
    this.scannedBuffer.push({ url, statusCode, responseTimeMs });
    if (!this.scannedFlushTimer) {
      this.scannedFlushTimer = setTimeout(() => {
        this.flushScannedBuffer();
      }, 100);
    }
  }
  flushScannedBuffer() {
    this.scannedFlushTimer = null;
    if (this.scannedBuffer.length === 0)
      return;
    const items = this.scannedBuffer.splice(0);
    this.broadcast({
      type: "page.scanned.batch",
      items,
      eventId: crypto.randomUUID()
    });
  }
  // Progress — max 1/sec
  broadcastProgress(scanned, total) {
    const now = Date.now();
    if (now - this.lastProgressBroadcast < 1e3)
      return;
    this.lastProgressBroadcast = now;
    this.broadcast({
      type: "progress",
      scanned,
      total,
      percent: total > 0 ? Math.round(scanned / total * 100) : 0,
      eventId: crypto.randomUUID()
    });
  }
  // Replay events from lastEventId for reconnecting clients
  replaySince(sessionId, lastEventId) {
    const session = this.sessions.get(sessionId);
    if (!session)
      return;
    if (!lastEventId)
      return;
    const idx = this.ringBuffer.findIndex((e) => e.eventId === lastEventId);
    if (idx === -1)
      return;
    const toReplay = this.ringBuffer.slice(idx + 1);
    for (const { event } of toReplay) {
      try {
        session.ws.send(JSON.stringify(event));
      } catch {
        this.sessions.delete(sessionId);
        break;
      }
    }
  }
};
__name(BroadcastManager, "BroadcastManager");

// src/state.ts
var FRONTIER_SPILL_THRESHOLD = 5e4;
var BATCH_SIZE = 10;
var HEARTBEAT_INTERVAL_MS = 3e4;
var STALE_TIMEOUT_MS = 5 * 60 * 1e3;
function initStats() {
  return { scanned: 0, broken: 0, redirects: 0, avgResponseMs: 0, totalPages: 0 };
}
__name(initStats, "initStats");
function updateAvgMs(current, newMs) {
  if (current.scanned === 0)
    return newMs;
  return Math.round((current.avgResponseMs * (current.scanned - 1) + newMs) / current.scanned);
}
__name(updateAvgMs, "updateAvgMs");

// src/index.ts
var CrawlCoordinator = class {
  state;
  env;
  broadcast;
  // In-memory working sets (replicated to DO storage on writes)
  visited = /* @__PURE__ */ new Set();
  // url hashes
  frontier = [];
  inFlight = /* @__PURE__ */ new Map();
  // taskId → url
  jobStats = initStats();
  jobStatus = "queued";
  config = null;
  jobId = "";
  projectId = "";
  seedUrl = "";
  initialized = false;
  pendingResults = [];
  constructor(state, env2) {
    this.state = state;
    this.env = env2;
    this.broadcast = new BroadcastManager();
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }
    switch (url.pathname) {
      case "/init":
        return this.handleInit(request);
      case "/report":
        return this.handleReport(request);
      case "/cancel":
        return this.handleCancel();
      case "/status":
        return this.handleStatus();
      default:
        return new Response("Not Found", { status: 404 });
    }
  }
  // ─── alarm ──────────────────────────────────────────────────────────────────
  async alarm() {
    const now = Date.now();
    const updatedAt = await this.state.storage.get("updatedAt") ?? 0;
    if (this.jobStatus === "running" && now - updatedAt > STALE_TIMEOUT_MS) {
      await this.markFailed("Crawl stale \u2014 coordinator timed out");
      return;
    }
    if (this.jobStatus === "running" || this.jobStatus === "queued") {
      await this.state.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
    }
  }
  // ─── Init ────────────────────────────────────────────────────────────────────
  async handleInit(request) {
    if (this.initialized) {
      return Response.json({ error: "Already initialized" }, { status: 409 });
    }
    const body = await request.json();
    this.jobId = body.jobId;
    this.seedUrl = body.seedUrl;
    this.config = body.config;
    this.jobStatus = "running";
    this.initialized = true;
    const now = Date.now();
    await this.state.storage.put({
      jobId: this.jobId,
      seedUrl: this.seedUrl,
      config: this.config,
      status: "running",
      stats: initStats(),
      startedAt: now,
      updatedAt: now
    });
    await this.state.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
    await crawlsQueries.updateStatus(this.env.DB, this.jobId, "running");
    const hash = await hashUrl(normalizeUrl(body.seedUrl));
    this.visited.add(hash);
    this.frontier.push({ url: body.seedUrl, depth: 0, parentUrl: null });
    await this.enqueueNextBatch();
    return Response.json({ ok: true });
  }
  // ─── Report task result ──────────────────────────────────────────────────────
  async handleReport(request) {
    const result = await request.json();
    const processed = await this.state.storage.get(`task:${result.taskId}`);
    if (processed)
      return Response.json({ ok: true, duplicate: true });
    await this.state.storage.put(`task:${result.taskId}`, true);
    this.inFlight.delete(result.taskId);
    if (!result.blocked && result.statusCode !== null) {
      const category = categorize(result.statusCode, result.redirectChain.length, result.errorReason);
      this.jobStats.scanned++;
      if (category === "client_error" || category === "server_error" || category === "network_error") {
        this.jobStats.broken++;
      }
      if (category === "redirect") {
        this.jobStats.redirects++;
      }
      this.jobStats.avgResponseMs = updateAvgMs(this.jobStats, result.responseTimeMs);
      const dbResult = {
        id: ulid(),
        jobId: result.jobId,
        url: result.url,
        urlHash: await hashUrl(normalizeUrl(result.url)),
        parentUrl: null,
        // set by task message
        depth: 0,
        // retrieved from inFlight metadata
        statusCode: result.statusCode,
        statusCategory: category,
        responseTimeMs: result.responseTimeMs,
        contentType: result.contentType,
        redirectChain: result.redirectChain,
        errorReason: result.errorReason,
        scannedAt: Date.now()
      };
      this.pendingResults.push(dbResult);
      if (this.pendingResults.length >= 50) {
        await this.flushResults();
      }
      this.broadcast.bufferPageScanned(result.url, result.statusCode, result.responseTimeMs);
      if (category === "client_error" || category === "server_error") {
        this.broadcast.broadcast({
          type: "link.broken",
          url: result.url,
          parentUrl: null,
          statusCode: result.statusCode,
          errorReason: result.errorReason,
          eventId: crypto.randomUUID()
        });
      }
      if (this.config && this.visited.size + this.frontier.length < this.config.maxPages) {
        for (const link of result.discoveredLinks) {
          await this.maybeAddToFrontier(link, result.url);
        }
      }
    }
    this.broadcast.broadcastProgress(
      this.jobStats.scanned,
      this.visited.size + this.frontier.length
    );
    await this.state.storage.put("updatedAt", Date.now());
    await this.state.storage.put("stats", this.jobStats);
    await this.enqueueNextBatch();
    if (this.frontier.length === 0 && this.inFlight.size === 0) {
      await this.markCompleted();
    }
    return Response.json({ ok: true });
  }
  // ─── Cancel ──────────────────────────────────────────────────────────────────
  async handleCancel() {
    this.jobStatus = "cancelled";
    await this.state.storage.put("status", "cancelled");
    await this.flushResults();
    this.broadcast.broadcast({ type: "crawl.cancelled", eventId: crypto.randomUUID() });
    return Response.json({ ok: true });
  }
  // ─── Status ───────────────────────────────────────────────────────────────────
  async handleStatus() {
    return Response.json({
      jobId: this.jobId,
      status: this.jobStatus,
      stats: this.jobStats,
      frontierSize: this.frontier.length,
      inFlightSize: this.inFlight.size,
      visitedCount: this.visited.size
    });
  }
  // ─── WebSocket ───────────────────────────────────────────────────────────────
  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    const sessionId = ulid();
    this.broadcast.addSession(sessionId, server);
    const url = new URL(request.url);
    const lastEventId = url.searchParams.get("lastEventId") ?? void 0;
    server.send(JSON.stringify({
      type: "snapshot",
      stats: this.jobStats,
      status: this.jobStatus,
      eventId: crypto.randomUUID()
    }));
    if (lastEventId) {
      this.broadcast.replaySince(sessionId, lastEventId);
    }
    server.addEventListener("close", () => {
      this.broadcast.removeSession(sessionId);
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  // ─── Helpers ─────────────────────────────────────────────────────────────────
  async maybeAddToFrontier(url, parentUrl) {
    if (!this.config)
      return;
    let normalized;
    try {
      normalized = normalizeUrl(url);
    } catch {
      return;
    }
    if (this.config.sameOrigin) {
      try {
        const base = new URL(this.seedUrl).origin;
        const target = new URL(normalized).origin;
        if (base !== target)
          return;
      } catch {
        return;
      }
    }
    const hash = await hashUrl(normalized);
    if (this.visited.has(hash))
      return;
    this.visited.add(hash);
    if (this.visited.size >= this.config.maxPages)
      return;
    if (this.frontier.length >= FRONTIER_SPILL_THRESHOLD) {
      await this.env.DB.prepare("INSERT OR IGNORE INTO crawl_frontier (id, job_id, url, url_hash, depth, parent_url, created_at) VALUES (?,?,?,?,?,?,?)").bind(ulid(), this.jobId, normalized, hash, 0, parentUrl, Date.now()).run();
      return;
    }
    this.frontier.push({ url: normalized, depth: 0, parentUrl });
  }
  async enqueueNextBatch() {
    if (this.jobStatus !== "running")
      return;
    if (!this.config)
      return;
    const toEnqueue = this.frontier.splice(0, BATCH_SIZE);
    if (toEnqueue.length === 0)
      return;
    const messages = toEnqueue.map((item) => {
      const taskId = ulid();
      this.inFlight.set(taskId, item.url);
      const msg = {
        taskId,
        jobId: this.jobId,
        url: item.url,
        depth: item.depth,
        parentUrl: item.parentUrl,
        coordinatorId: this.state.id.toString()
      };
      return msg;
    });
    await this.env.CRAWL_TASKS.sendBatch(
      messages.map((m) => ({ body: m }))
    );
  }
  async flushResults() {
    if (this.pendingResults.length === 0)
      return;
    const toFlush = this.pendingResults.splice(0);
    await crawlsQueries.insertResultBatch(this.env.DB, toFlush);
  }
  async markCompleted() {
    await this.flushResults();
    this.jobStatus = "completed";
    this.jobStats.totalPages = this.visited.size;
    await crawlsQueries.updateStatus(this.env.DB, this.jobId, "completed", { stats: this.jobStats });
    await this.state.storage.put("status", "completed");
    this.broadcast.broadcast({
      type: "crawl.completed",
      summary: this.jobStats,
      eventId: crypto.randomUUID()
    });
  }
  async markFailed(message) {
    await this.flushResults();
    this.jobStatus = "failed";
    await crawlsQueries.updateStatus(this.env.DB, this.jobId, "failed", { errorMessage: message });
    await this.state.storage.put("status", "failed");
    this.broadcast.broadcast({
      type: "crawl.failed",
      error: message,
      eventId: crypto.randomUUID()
    });
  }
};
__name(CrawlCoordinator, "CrawlCoordinator");
async function hashUrl(url) {
  const encoder = new TextEncoder();
  const data = encoder.encode(url.toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
__name(hashUrl, "hashUrl");
function categorize(statusCode, redirectCount, errorReason) {
  if (errorReason === "redirect_loop")
    return "network_error";
  if (errorReason)
    return "network_error";
  if (statusCode >= 200 && statusCode < 300)
    return "ok";
  if (statusCode >= 300 && statusCode < 400)
    return "redirect";
  if (statusCode >= 400 && statusCode < 500)
    return "client_error";
  if (statusCode >= 500)
    return "server_error";
  return "network_error";
}
__name(categorize, "categorize");
var src_default = {
  fetch() {
    return new Response("CrawlCoordinator \u2014 use via DO binding", { status: 400 });
  }
};

// ../../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260417.1/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260417.1/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-ez2NH0/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260417.1/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-ez2NH0/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  CrawlCoordinator,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

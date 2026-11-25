// Bridge Firebase auth to the planner, whose state lives in index.html's script scope.
let resolveDayflowReady;
let plannerApi = null;
const dayflowReady = new Promise((resolve) => {
  resolveDayflowReady = resolve;
});

window.dayflow = {
  ready: dayflowReady,
  attach(api) {
    plannerApi = api;
    resolveDayflowReady();
  },
  load(data) {
    if (!plannerApi) throw new Error("日序資料介面尚未初始化。");
    return plannerApi.load(data);
  },
  snapshot() {
    if (!plannerApi) throw new Error("日序資料介面尚未初始化。");
    return plannerApi.snapshot();
  },
};

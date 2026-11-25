// Expose the planner's data to the Firebase authentication module.
// The methods run after index.html has initialized its top-level data variables.
window.dayflow = {
  load(data) {
    events = Array.isArray(data.events) ? data.events : [];
    tasks = Array.isArray(data.tasks) ? data.tasks : [];
    categories = Array.isArray(data.categories) && data.categories.length
      ? data.categories
      : ["工作", "個人", "學習", "生活"];
    events = events.map((event) => ({
      ...event,
      date: event.date || iso(TODAY),
      id: event.id || `e-${Math.random().toString(36).slice(2, 9)}`,
    }));
    refreshCategories();
    render();
  },
  snapshot() {
    return { events, tasks, categories };
  },
};

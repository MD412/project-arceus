# Active Context - Project Arceus

**Last Updated:** October 21, 2025 @ 12:00 AM  
**Branch:** `main`  
**Status:** 🔄 Language support in progress - search UX redesign needed

---

## 🎯 Current Status

Marathon session - 3 features:
- ✅ Set name display (SHIPPED - all cards show readable names)
- ✅ Database cleanup (SHIPPED - legacy tables removed)
- 🔄 Language support (foundation built, search needs redesign)

**Critical Discovery:**
- JP card search broken: Users can't find Japanese versions
- Need language filter in CardSearchInput
- This blocks full Japanese card support

---

## 📖 Quick Links

- **📋 [Latest Handoff (Oct 21, 12:00 AM)](./handoffs/2025/10-october/context_handoff_20251021_0000.md)** ← **START HERE**
- **📋 [Session Summary](./summaries/2025/10-october/session_summary_20251020_extended.md)** ← **Quick Overview**
- **📋 [Japanese Card Support Plan](./japanese-card-support-plan.md)** ← **Language feature roadmap**
- **📋 [CSS Debugging Protocol](./css-debugging-protocol.md)** ← **Use `/debug-css` for hard CSS issues**
- **📂 [Organization Guide](./ORGANIZATION.md)**
- **⌨️ [Commands](./COMMAND_REFERENCE.md)**

> Forward-looking priorities live in the latest handoff's "What's Next."

---

## 🔴 Priority

1. **Redesign search with language filter** - Add language toggle to CardSearchInput (critical for JP support)
2. **Complete language handler wiring** - Connect dropdown to API, test persistence
3. **Rebuild LanguageSelect component** - Deleted for redesign, needs new approach
4. **Test Scan tab UX** - From Oct 17 session (still deferred)

---

## 🚫 Deferred (Don't Touch Yet)

- ❌ Manual DevTools responsive testing
- ❌ Live worker validation  
- ❌ Trace ID propagation
- ❌ Search component consolidation
- ❌ Performance profiling
- ❌ Card size slider (see `docs/future-features/card-size-slider.md`)

---

**Previous handoff:** [October 20, 11:59 PM](./handoffs/2025/10-october/context_handoff_20251020_2359.md)  
**Next steps:** Redesign search with language filter, wire handlers, rebuild UI

**Note:** ✅ Set names shipped! 🇯🇵 JP search needs language filter for full support.

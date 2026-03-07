//! Lightweight system performance stats.
//!
//! Provides system-wide CPU and RAM usage. GPU monitoring is documented
//! as future work due to platform-specific complexity.
//!
//! # Privacy
//! Only system-wide metrics are collected — no per-process stats.

use serde::Serialize;
use sysinfo::{CpuRefreshKind, RefreshKind, System};
use std::sync::Mutex;

/// System performance snapshot.
#[derive(Debug, Clone, Serialize)]
pub struct PerformanceStats {
    /// System-wide CPU usage percentage (0.0 - 100.0).
    pub cpu_pct: f32,
    /// RAM currently used, in megabytes.
    pub ram_used_mb: u64,
    /// Total system RAM, in megabytes.
    pub ram_total_mb: u64,
}

/// Managed wrapper so sysinfo::System persists across calls
/// (required for accurate CPU measurements which need delta between refreshes).
pub struct ManagedSystem {
    inner: Mutex<System>,
}

impl Default for ManagedSystem {
    fn default() -> Self {
        Self {
            inner: Mutex::new(System::new_with_specifics(
                RefreshKind::new()
                    .with_cpu(CpuRefreshKind::new().with_cpu_usage())
                    .with_memory(sysinfo::MemoryRefreshKind::everything()),
            )),
        }
    }
}

/// Get current system performance stats.
///
/// CPU usage requires two successive refreshes to compute a delta.
/// On the first call, CPU may report 0% — this is expected.
#[tauri::command]
pub fn get_performance_stats(sys: tauri::State<'_, ManagedSystem>) -> PerformanceStats {
    let mut system = sys.inner.lock().unwrap_or_else(|e| e.into_inner());

    system.refresh_cpu_usage();
    system.refresh_memory();

    let cpu_pct = system.global_cpu_info().cpu_usage();
    let ram_used_mb = system.used_memory() / (1024 * 1024);
    let ram_total_mb = system.total_memory() / (1024 * 1024);

    PerformanceStats {
        cpu_pct,
        ram_used_mb,
        ram_total_mb,
    }
}

// =============================================================================
// GPU monitoring — Future Work
// =============================================================================
//
// GPU usage requires platform-specific and vendor-specific APIs:
//
// Windows:
//   - NVIDIA: NVML (nvidia-ml-sys crate) → nvmlDeviceGetUtilizationRates
//   - AMD: WMI queries or ADLX SDK
//   - Intel: igcl or WMI
//
// macOS:
//   - IOKit framework → IOServiceGetMatchingServices for GPU stats
//   - Metal performance counters (requires entitlements)
//
// Linux:
//   - NVIDIA: NVML (same as Windows)
//   - AMD: /sys/class/drm/card*/device/gpu_busy_percent
//   - Intel: i915 perf counters via /sys/kernel/debug/dri/
//
// Recommendation: Start with NVML on Windows/Linux (covers ~70% of gamers),
// add AMD WMI next, then macOS IOKit.

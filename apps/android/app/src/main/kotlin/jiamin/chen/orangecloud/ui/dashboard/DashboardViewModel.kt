package jiamin.chen.orangecloud.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import jiamin.chen.orangecloud.core.auth.AuthRepository
import jiamin.chen.orangecloud.core.auth.AuthSessionMeta
import jiamin.chen.orangecloud.core.auth.Scopes
import jiamin.chen.orangecloud.core.network.ApiError
import jiamin.chen.orangecloud.core.system.AppPrefs
import jiamin.chen.orangecloud.core.system.UsagePlanPrefs
import jiamin.chen.orangecloud.data.model.Account
import jiamin.chen.orangecloud.data.model.AccountUsage
import jiamin.chen.orangecloud.data.model.AnalyticsTimeRange
import jiamin.chen.orangecloud.data.model.BillingCycle
import jiamin.chen.orangecloud.data.model.Zone
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import jiamin.chen.orangecloud.data.repository.AccountStore
import jiamin.chen.orangecloud.data.repository.AnalyticsRepository
import jiamin.chen.orangecloud.data.repository.StorageRepository
import jiamin.chen.orangecloud.data.repository.WorkerRepository
import jiamin.chen.orangecloud.data.repository.ZoneRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import androidx.glance.appwidget.updateAll
import jiamin.chen.orangecloud.core.widget.OrangeCloudWidget
import jiamin.chen.orangecloud.core.widget.WidgetSnapshot
import jiamin.chen.orangecloud.core.widget.WidgetSnapshotStore
import javax.inject.Inject

data class DashboardUiState(
    val accounts: List<Account> = emptyList(),
    val selectedAccountId: String? = null,
    val accountName: String = "",
    val accountEmail: String = "",
    val zoneCount: String = "—",
    val workerCount: String = "—",
    val bucketCount: String = "—",
    val requestsToday: String = "—",
    val recentZones: List<Zone> = emptyList(),
    val isLoading: Boolean = false,
    val authSessions: List<AuthSessionMeta> = emptyList(),
    val currentAuthSessionId: String? = null,
    // 用量模块
    val usage: AccountUsage? = null,
    val usagePlan: UsagePlanPrefs = UsagePlanPrefs(),
    val usageLoading: Boolean = false,
    val usageLoadFailed: Boolean = false,
    val accountAnalyticsUnavailable: Boolean = false,
    val hasAccountAnalytics: Boolean = false,
)

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class DashboardViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val accountStore: AccountStore,
    private val authRepository: AuthRepository,
    private val zoneRepository: ZoneRepository,
    private val workerRepository: WorkerRepository,
    private val storageRepository: StorageRepository,
    private val analyticsRepository: AnalyticsRepository,
    private val appPrefs: AppPrefs,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState(isLoading = true))
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    // 用量：账号级会话缓存（切回同账号即时回显）+ 加载/不可用惰性标记
    private val usageCache = mutableMapOf<String, AccountUsage>()
    private var usageLoadedForAccount: String? = null
    private var analyticsUnavailableForAccount: String? = null
    private var usageJob: Job? = null

    init {
        viewModelScope.launch {
            accountStore.accounts.collect { list -> _uiState.update { it.copy(accounts = list) } }
        }
        viewModelScope.launch {
            accountStore.selectedAccountId.collect { id ->
                // 切账号时清掉上一个账号的用量快照，避免旧数字在新账号加载期间残留
                _uiState.update {
                    it.copy(
                        selectedAccountId = id,
                        usage = null,
                        usageLoadFailed = false,
                        accountAnalyticsUnavailable = false,
                    )
                }
            }
        }
        // 登录身份列表 / 当前身份：头像菜单「登录身份」段的数据源
        viewModelScope.launch {
            authRepository.state.collect { auth ->
                _uiState.update {
                    it.copy(authSessions = auth.sessions, currentAuthSessionId = auth.currentSessionId)
                }
            }
        }
        // 身份切换后整页重刷（AccountStore 已重置账号作用域）；只认 id 变化，label 重命名等不触发
        viewModelScope.launch {
            authRepository.state
                .filter { it.isReady }
                .map { it.currentSessionId }
                .distinctUntilChanged()
                .drop(1)
                .collect { if (it != null) refresh() }
        }
        // 域名计数 / 最近访问：持续观察 Room 缓存（切账号自动切流）。
        // refreshZones 写入缓存后这里会自动更新——修复冷启动一次性读空缓存恒显 0 的问题。
        viewModelScope.launch {
            accountStore.selectedAccountId
                .flatMapLatest { id -> if (id == null) flowOf(emptyList()) else zoneRepository.observeZones(id) }
                .collect { zones ->
                    _uiState.update { it.copy(zoneCount = zones.size.toString(), recentZones = zones.take(4)) }
                }
        }
        // 用量套餐设置：随账号切流，仅驱动菜单显示（改动由 setter 主动触发重载，避免切账号双刷）。
        viewModelScope.launch {
            accountStore.selectedAccountId
                .flatMapLatest { id -> if (id == null) flowOf(UsagePlanPrefs()) else appPrefs.usagePlan(id) }
                .collect { plan -> _uiState.update { it.copy(usagePlan = plan) } }
        }
        // 桌面小组件快照：账号总览（账号名 / 今日请求 / 域名数）变化即写入并刷新 Glance。
        viewModelScope.launch {
            uiState
                .map { Triple(it.accountName, it.requestsToday, it.zoneCount) }
                .distinctUntilChanged()
                .collect { (name, requests, zones) ->
                    WidgetSnapshotStore.write(context, WidgetSnapshot(name, requests, zones))
                    runCatching { OrangeCloudWidget().updateAll(context) }
                }
        }
        refresh()
    }

    fun selectAccount(accountId: String) {
        accountStore.select(accountId)
        refresh()
    }

    /** 切换登录身份（头像菜单「登录身份」段）；账号作用域重置与重刷由观察者链完成 */
    fun switchAuthSession(sessionId: String) {
        authRepository.switchSession(sessionId)
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                accountStore.ensureLoaded()
                val accountId = accountStore.selectedAccountId.value
                val account = accountStore.selectedAccount
                val email = authRepository.state.value.currentSession?.label.orEmpty()
                _uiState.update {
                    it.copy(accountName = account?.name.orEmpty(), accountEmail = email)
                }
                if (accountId == null) {
                    _uiState.update { it.copy(isLoading = false) }
                    return@launch
                }

                // 先网络刷新域名缓存（zoneCount / recentZones 由 init 的持续观察自动反映）。
                // 放在读取派生数据之前，确保今日请求量基于最新域名集计算，而非冷启动的空缓存。
                runCatching { zoneRepository.refreshZones(accountId) }
                val zones = zoneRepository.observeZones(accountId).first()

                // 各项计数独立 best-effort（缺 scope / 出错不互相拖累）
                val workers = async { runCatching { workerRepository.refreshWorkers(accountId) }.getOrNull() }
                val buckets = async {
                    if (authRepository.hasScope(Scopes.R2_READ)) {
                        runCatching { storageRepository.listBuckets(accountId).size }.getOrNull()
                    } else null
                }
                val requests = async { sumRequests(zones) }

                workers.await()
                val workerList = workerRepository.observeWorkers(accountId).first()
                _uiState.update { it.copy(workerCount = workerList.size.toString()) }
                buckets.await()?.let { count -> _uiState.update { st -> st.copy(bucketCount = count.toString()) } }
                requests.await()?.let { req -> _uiState.update { st -> st.copy(requestsToday = req) } }
            } catch (e: Exception) {
                // 顶层失败不致命，保留已有数据
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
        loadUsage()
    }

    // MARK: - 用量模块

    /**
     * 加载账号用量：Workers 主查询（authz = 整账号无账户级数据权限即降级停发其余），
     * R2 / CPU / D1 / KV 独立合并，能显示多少显示多少（对齐 iOS performLoadUsage）。
     */
    fun loadUsage(force: Boolean = false) {
        usageJob?.cancel()
        usageJob = viewModelScope.launch {
            // 冷启动竞态修复：refresh() 同步调进来时账号索引可能还没从磁盘加载完，
            // selectedAccountId 为 null 曾直接 return → hasAccountAnalytics 停在默认 false，
            // 锁卡「需要流量分析权限」常驻（真机实证：scope 授权齐全仍被误挡）。
            // 先 ensureLoaded 再取账号，门控判定与加载全部进协程。
            accountStore.ensureLoaded()
            val accountId = accountStore.selectedAccountId.value ?: return@launch
            val hasScope = authRepository.hasScope(Scopes.ACCOUNT_ANALYTICS_READ)
            _uiState.update { it.copy(hasAccountAnalytics = hasScope) }
            if (!hasScope) return@launch

            usageCache[accountId]?.let { cached ->
                if (_uiState.value.usage == null) _uiState.update { it.copy(usage = cached) }
            }
            if (!force && usageLoadedForAccount == accountId) return@launch
            if (!force && analyticsUnavailableForAccount == accountId) {
                _uiState.update { it.copy(accountAnalyticsUnavailable = true, usageLoading = false) }
                return@launch
            }

            _uiState.update { it.copy(usageLoading = true, usageLoadFailed = false, accountAnalyticsUnavailable = false) }
            // 内存无缓存时先从磁盘回显上次快照，网络回来再覆盖（对齐 iOS UsageCache 落盘）
            if (usageCache[accountId] == null) {
                appPrefs.loadUsageCache(accountId)?.let { disk ->
                    usageCache[accountId] = disk
                    if (_uiState.value.usage == null) _uiState.update { it.copy(usage = disk) }
                }
            }
            val plan = appPrefs.usagePlan(accountId).first()
            val periodStart = if (plan.workersPaid || plan.billingDay != 1) BillingCycle.periodStart(plan.billingDay) else null

            val workers = try {
                analyticsRepository.accountWorkersUsage(accountId, periodStart)
            } catch (e: CancellationException) {
                throw e
            } catch (e: ApiError.Cloudflare) {
                if (isAuthz(e)) {
                    analyticsUnavailableForAccount = accountId
                    _uiState.update {
                        it.copy(accountAnalyticsUnavailable = true, usage = null, usageLoading = false, usageLoadFailed = false)
                    }
                    return@launch
                }
                null
            } catch (e: Exception) {
                null
            }
            analyticsUnavailableForAccount = null

            var usage = workers ?: AccountUsage()
            var anyData = workers != null

            runCatching { analyticsRepository.accountR2Usage(accountId, periodStart) }.getOrNull()?.let { r2 ->
                usage = usage.copy(
                    r2ClassAMonth = r2.classA, r2ClassBMonth = r2.classB,
                    r2StorageBytes = r2.storageBytes, r2ObjectCount = r2.objectCount,
                )
                anyData = true
            }
            runCatching { analyticsRepository.workersCpuTotals(accountId, periodStart) }.getOrNull()?.let { (month, today) ->
                usage = usage.copy(cpuTimeMonthUs = month, cpuTimeTodayUs = today)
            }
            runCatching { analyticsRepository.d1Usage(accountId, periodStart) }.getOrNull()?.let { d1 ->
                usage = usage.copy(d1Usage = d1); anyData = true
            }
            if (authRepository.hasScope(Scopes.D1_READ)) {
                runCatching { storageRepository.listDatabases(accountId) }.getOrNull()?.let { dbs ->
                    usage = usage.copy(d1StorageBytes = dbs.sumOf { it.fileSize ?: 0L }); anyData = true
                }
            }
            runCatching { analyticsRepository.kvUsage(accountId, periodStart) }.getOrNull()?.let { kv ->
                usage = usage.copy(kvUsage = kv); anyData = true
            }
            runCatching { analyticsRepository.kvStorageBytes(accountId) }.getOrNull()?.let { bytes ->
                usage = usage.copy(kvStorageBytes = bytes); anyData = true
            }

            if (anyData) {
                usageCache[accountId] = usage
                usageLoadedForAccount = accountId
                appPrefs.saveUsageCache(accountId, usage)   // 落盘供下次冷启动/切回即时回显
                _uiState.update {
                    it.copy(usage = usage, usageLoading = false, usageLoadFailed = false, accountAnalyticsUnavailable = false)
                }
            } else {
                _uiState.update { it.copy(usageLoading = false, usageLoadFailed = true) }
            }
        }
    }

    fun setUsageWorkersPaid(paid: Boolean) {
        val id = accountStore.selectedAccountId.value ?: return
        viewModelScope.launch { appPrefs.setUsageWorkersPaid(id, paid); loadUsage(force = true) }
    }

    fun setUsageR2Paid(paid: Boolean) {
        val id = accountStore.selectedAccountId.value ?: return
        viewModelScope.launch { appPrefs.setUsageR2Paid(id, paid); loadUsage(force = true) }
    }

    fun setUsageBillingDay(day: Int) {
        val id = accountStore.selectedAccountId.value ?: return
        viewModelScope.launch { appPrefs.setUsageBillingDay(id, day); loadUsage(force = true) }
    }

    /** GraphQL 账户级 authz 错误识别（免费账号账户级数据集常被 authz 挡）。 */
    private fun isAuthz(e: ApiError.Cloudflare): Boolean {
        val msg = e.errors.joinToString(" ") { it.message }.lowercase()
        return "authz" in msg || "not authorized" in msg || "unauthorized" in msg ||
            "permission" in msg || "authentication" in msg
    }

    /** 今日请求总数 = 各域名 24h 请求之和（best-effort，缺 analytics scope 返回 null）。 */
    private suspend fun sumRequests(zones: List<Zone>): String? {
        if (!authRepository.hasScope(Scopes.ANALYTICS_READ) || zones.isEmpty()) return null
        return try {
            var total = 0L
            for (zone in zones.take(12)) {
                val points = runCatching { analyticsRepository.zoneTraffic(zone.id, AnalyticsTimeRange.LAST_24H) }.getOrNull()
                total += points?.sumOf { it.requests.toLong() } ?: 0L
            }
            formatCount(total)
        } catch (e: Exception) {
            null
        }
    }

    private fun formatCount(n: Long): String = when {
        n >= 1_000_000 -> "%.2fM".format(n / 1_000_000.0)
        n >= 1_000 -> "%.1fK".format(n / 1_000.0)
        else -> n.toString()
    }
}

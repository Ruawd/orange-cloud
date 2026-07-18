package jiamin.chen.orangecloud.ui.storage

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material.icons.outlined.TableRows
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import jiamin.chen.orangecloud.R
import jiamin.chen.orangecloud.core.design.SkyBackground
import jiamin.chen.orangecloud.core.design.SkyHeader
import jiamin.chen.orangecloud.core.design.onSky
import jiamin.chen.orangecloud.core.design.rememberSkyPhase
import jiamin.chen.orangecloud.core.design.theme.OcOrange
import jiamin.chen.orangecloud.data.model.D1Database
import jiamin.chen.orangecloud.data.model.tailDisplayText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun D1DatabaseListScreen(
    onBack: () -> Unit,
    onOpenDatabase: (id: String, name: String) -> Unit,
    viewModel: D1DatabaseListViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val opState by viewModel.opState.collectAsStateWithLifecycle()
    val phase = rememberSkyPhase()
    val onSky = phase.onSky
    val snackbarHostState = remember { SnackbarHostState() }
    var showCreate by remember { mutableStateOf(false) }
    var toDelete by remember { mutableStateOf<D1Database?>(null) }
    val createSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val createdMsg = stringResource(R.string.d1_created)
    val deletedMsg = stringResource(R.string.dns_deleted)
    val errMsg = stringResource(R.string.error_generic)

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                D1DbEvent.Created -> { showCreate = false; snackbarHostState.showSnackbar(createdMsg) }
                D1DbEvent.Deleted -> { toDelete = null; snackbarHostState.showSnackbar(deletedMsg) }
                is D1DbEvent.Error -> snackbarHostState.showSnackbar(event.message ?: errMsg)
            }
        }
    }

    SkyBackground(phase = phase) {
        Box(Modifier.fillMaxSize().systemBarsPadding()) {
            Column(Modifier.fillMaxSize()) {
                SkyHeader(
                    title = stringResource(R.string.storage_d1),
                    onSky = onSky,
                    isLoading = state.isLoading,
                    onRefresh = { viewModel.load() },
                    onBack = onBack,
                    titleSize = 22,
                    backDescription = stringResource(R.string.common_back),
                    refreshDescription = stringResource(R.string.common_refresh),
                )
                StorageListBody(state, onSky, Icons.Outlined.Storage, stringResource(R.string.d1_empty), { viewModel.load() }) { db ->
                    val subtitle = listOfNotNull(
                        db.fileSize?.let { formatBytes(it) },
                        db.numTables?.let { stringResource(R.string.d1_tables, it) },
                    ).joinToString(" · ").ifEmpty { null }
                    StorageRow(
                        Icons.Outlined.Storage,
                        db.name,
                        subtitle,
                        onClick = { onOpenDatabase(db.uuid, db.name) },
                        onLongClick = if (viewModel.canWrite) ({ toDelete = db }) else null,
                    )
                }
            }
            if (viewModel.canWrite) {
                FloatingActionButton(
                    onClick = { showCreate = true },
                    containerColor = OcOrange,
                    contentColor = Color.White,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
                ) {
                    Icon(Icons.Outlined.Add, contentDescription = stringResource(R.string.d1_create_title))
                }
            }
            SnackbarHost(snackbarHostState, modifier = Modifier.align(Alignment.BottomCenter))
        }
    }

    if (showCreate) {
        D1CreateSheet(
            isCreating = opState.isCreating,
            sheetState = createSheetState,
            onCreate = { name, hint -> viewModel.create(name, hint) },
            onDismiss = { showCreate = false },
        )
    }
    toDelete?.let { db ->
        D1DeleteDialog(
            database = db,
            isDeleting = opState.isDeleting,
            onConfirm = { viewModel.delete(db) },
            onDismiss = { toDelete = null },
        )
    }
}

@Composable
fun D1QueryScreen(
    onBack: () -> Unit,
    onOpenTable: (table: String) -> Unit,
    viewModel: D1QueryViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val phase = rememberSkyPhase()
    val onSky = phase.onSky
    var sql by rememberSaveable { mutableStateOf("SELECT name FROM sqlite_master WHERE type='table';") }
    var toDropTable by remember { mutableStateOf<String?>(null) }
    val snackbarHostState = remember { SnackbarHostState() }
    val droppedMsg = stringResource(R.string.d1_table_dropped)
    val errMsg = stringResource(R.string.error_generic)

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                D1QueryEvent.TableDropped -> { toDropTable = null; snackbarHostState.showSnackbar(droppedMsg) }
                is D1QueryEvent.Error -> snackbarHostState.showSnackbar(event.message ?: errMsg)
            }
        }
    }

    SkyBackground(phase = phase) {
        Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().systemBarsPadding()) {
            SkyHeader(
                title = viewModel.databaseName.ifBlank { stringResource(R.string.storage_d1) },
                onSky = onSky,
                isLoading = state.isRunning,
                onRefresh = { viewModel.run(sql) },
                onBack = onBack,
                titleSize = 22,
                backDescription = stringResource(R.string.common_back),
            )
            Column(
                modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (state.missingScope) {
                    Text(stringResource(R.string.scope_missing), color = onSky.copy(alpha = 0.8f), fontSize = 14.sp)
                    return@Column
                }

                // 表清单：点按进入表浏览器（浏览/编辑行），对齐 iOS D1QueryView 的「表」岛
                if (!state.tablesLoaded || state.tables.isNotEmpty()) {
                    Text(
                        stringResource(R.string.d1_tables_section),
                        color = onSky.copy(alpha = 0.85f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    if (!state.tablesLoaded) {
                        CircularProgressIndicator(Modifier.height(20.dp).width(20.dp), strokeWidth = 2.dp, color = onSky)
                    } else {
                        state.tables.forEach { table ->
                            StorageRow(
                                Icons.Outlined.TableRows,
                                table,
                                onClick = { onOpenTable(table) },
                                onLongClick = if (state.canWrite) ({ toDropTable = table }) else null,
                            )
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                }

                OutlinedTextField(
                    value = sql,
                    onValueChange = { sql = it },
                    label = { Text(stringResource(R.string.d1_sql)) },
                    textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace),
                    modifier = Modifier.fillMaxWidth().height(140.dp),
                )
                Button(
                    onClick = { viewModel.run(sql) },
                    enabled = !state.isRunning && sql.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = OcOrange, contentColor = Color.White),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (state.isRunning) {
                        CircularProgressIndicator(Modifier.height(18.dp).width(18.dp), strokeWidth = 2.dp, color = Color.White)
                        Spacer(Modifier.width(8.dp))
                    }
                    Text(stringResource(R.string.d1_run))
                }
                state.error?.let {
                    Text(it, color = Color(0xFFE5484D), fontSize = 13.sp, fontFamily = FontFamily.Monospace)
                }
                if (state.columns.isNotEmpty()) {
                    ResultsTable(state.columns, state.results.firstOrNull()?.results.orEmpty())
                } else if (state.results.isNotEmpty() && state.error == null) {
                    val meta = state.results.first().meta
                    Text(
                        stringResource(R.string.d1_ok, meta?.changes ?: 0),
                        color = onSky.copy(alpha = 0.85f),
                        fontSize = 13.sp,
                    )
                }
            }
        }
            SnackbarHost(snackbarHostState, modifier = Modifier.align(Alignment.BottomCenter))
        }
    }

    toDropTable?.let { table ->
        D1DropTableDialog(
            tableName = table,
            isDeleting = state.droppingTable == table,
            onConfirm = { viewModel.dropTable(table) },
            onDismiss = { toDropTable = null },
        )
    }
}

@Composable
private fun ResultsTable(
    columns: List<String>,
    rows: List<Map<String, kotlinx.serialization.json.JsonElement>>,
) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.horizontalScroll(rememberScrollState()).padding(12.dp)) {
            Row {
                columns.forEach { col ->
                    Text(
                        col,
                        modifier = Modifier.width(140.dp).padding(end = 8.dp, bottom = 6.dp),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
            rows.take(200).forEach { row ->
                Row {
                    columns.forEach { col ->
                        Text(
                            row[col]?.tailDisplayText() ?: "",
                            modifier = Modifier.width(140.dp).padding(end = 8.dp, bottom = 4.dp),
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            maxLines = 1,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

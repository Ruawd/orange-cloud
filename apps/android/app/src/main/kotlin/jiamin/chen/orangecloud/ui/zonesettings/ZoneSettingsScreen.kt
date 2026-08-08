package jiamin.chen.orangecloud.ui.zonesettings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import jiamin.chen.orangecloud.R
import jiamin.chen.orangecloud.core.design.SkyBackground
import jiamin.chen.orangecloud.core.design.SkyEmptyState
import jiamin.chen.orangecloud.core.design.SkyHeader
import jiamin.chen.orangecloud.core.design.onSky
import jiamin.chen.orangecloud.core.design.rememberSkyPhase

@Composable
fun ZoneSettingsScreen(
    onBack: () -> Unit,
    viewModel: ZoneSettingsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val phase = rememberSkyPhase()
    val onSky = phase.onSky
    val snackbarHostState = remember { SnackbarHostState() }
    var confirmPurge by remember { mutableStateOf(false) }
    // 非空即待确认的暂停操作：true = 暂停，false = 恢复
    var confirmPause by remember { mutableStateOf<Boolean?>(null) }
    var purgeUrlOpen by remember { mutableStateOf(false) }
    val purgedMsg = stringResource(R.string.zs_purged)
    val genericErr = stringResource(R.string.error_generic)

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                ZoneSettingsEvent.Purged -> snackbarHostState.showSnackbar(purgedMsg)
                is ZoneSettingsEvent.Error -> snackbarHostState.showSnackbar(event.message ?: genericErr)
            }
        }
    }

    SkyBackground(phase = phase) {
        Box(Modifier.fillMaxSize().systemBarsPadding()) {
            Column(Modifier.fillMaxSize()) {
                SkyHeader(
                    title = stringResource(R.string.zs_title),
                    onSky = onSky,
                    isLoading = state.isLoading,
                    onRefresh = { viewModel.load() },
                    onBack = onBack,
                    titleSize = 22,
                    backDescription = stringResource(R.string.common_back),
                    refreshDescription = stringResource(R.string.common_refresh),
                )
                Column(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    // 暂停只依赖 zone.write，缺 zone-settings.read 时本页也保留它
                    ToggleCard(
                        title = stringResource(R.string.zs_pause),
                        subtitle = stringResource(R.string.zs_pause_desc),
                        checked = state.paused,
                        enabled = state.canPause && !state.isTogglingPause,
                        onChange = { on -> confirmPause = on },
                    )
                    if (state.missingScope) {
                        Box(Modifier.weight(1f)) {
                            SkyEmptyState(
                                Icons.Outlined.Settings,
                                stringResource(R.string.scope_missing), onSky, stringResource(R.string.common_refresh),
                            ) { viewModel.load() }
                        }
                    } else {
                        ToggleCard(
                            title = stringResource(R.string.zs_dev_mode),
                            subtitle = stringResource(R.string.zs_dev_mode_desc),
                            checked = state.developmentMode,
                            enabled = state.canWrite,
                            onChange = viewModel::setDevelopmentMode,
                        )
                        ToggleCard(
                            title = stringResource(R.string.zs_under_attack),
                            subtitle = stringResource(R.string.zs_under_attack_desc),
                            checked = state.underAttack,
                            enabled = state.canWrite,
                            onChange = viewModel::setUnderAttack,
                        )
                        if (state.canPurge) {
                            OutlinedButton(
                                onClick = { confirmPurge = true },
                                enabled = !state.isPurging,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                if (state.isPurging) {
                                    CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                                    Spacer(Modifier.width(8.dp))
                                }
                                Text(stringResource(R.string.zs_purge))
                            }
                            OutlinedButton(
                                onClick = { purgeUrlOpen = true },
                                enabled = !state.isPurging,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text(stringResource(R.string.zs_purge_url))
                            }
                        }
                    }
                }
            }
            SnackbarHost(snackbarHostState, modifier = Modifier.align(Alignment.BottomCenter))
        }
    }

    if (confirmPurge) {
        AlertDialog(
            onDismissRequest = { confirmPurge = false },
            title = { Text(stringResource(R.string.zs_purge_confirm_title)) },
            text = { Text(stringResource(R.string.zs_purge_confirm_msg)) },
            confirmButton = {
                TextButton(onClick = { confirmPurge = false; viewModel.purgeCache() }) {
                    Text(stringResource(R.string.zs_purge), color = Color(0xFFE5484D))
                }
            },
            dismissButton = { TextButton(onClick = { confirmPurge = false }) { Text(stringResource(R.string.dns_cancel)) } },
        )
    }

    confirmPause?.let { willPause ->
        AlertDialog(
            onDismissRequest = { confirmPause = null },
            title = {
                Text(stringResource(if (willPause) R.string.zs_pause_confirm_title else R.string.zs_resume_confirm_title))
            },
            text = {
                Text(
                    stringResource(
                        if (willPause) R.string.zs_pause_confirm_msg else R.string.zs_resume_confirm_msg,
                        state.zoneName,
                    ),
                )
            },
            confirmButton = {
                TextButton(onClick = { confirmPause = null; viewModel.setPaused(willPause) }) {
                    Text(
                        stringResource(if (willPause) R.string.zs_pause_confirm else R.string.zs_resume_confirm),
                        color = if (willPause) Color(0xFFE5484D) else Color.Unspecified,
                    )
                }
            },
            dismissButton = { TextButton(onClick = { confirmPause = null }) { Text(stringResource(R.string.dns_cancel)) } },
        )
    }

    if (purgeUrlOpen) {
        PurgeByUrlDialog(
            zoneName = state.zoneName,
            onDismiss = { purgeUrlOpen = false },
            onPurge = { urls -> purgeUrlOpen = false; viewModel.purgeFiles(urls) },
        )
    }
}

@Composable
private fun PurgeByUrlDialog(
    zoneName: String,
    onDismiss: () -> Unit,
    onPurge: (List<String>) -> Unit,
) {
    var text by remember { mutableStateOf("") }
    val urls = remember(text) {
        text.split('\n').map { it.trim() }.filter { it.isNotEmpty() }
    }
    val overLimit = urls.size > ZoneSettingsViewModel.MAX_PURGE_URLS
    val valid = urls.isNotEmpty() && !overLimit &&
        urls.all { it.startsWith("http://") || it.startsWith("https://") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.zs_purge_url)) },
        text = {
            Column {
                Text(
                    stringResource(R.string.zs_purge_url_hint, ZoneSettingsViewModel.MAX_PURGE_URLS, zoneName),
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.size(8.dp))
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 4,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        autoCorrectEnabled = false,
                        capitalization = KeyboardCapitalization.None,
                    ),
                )
                if (urls.isNotEmpty()) {
                    Text(
                        "${urls.size} / ${ZoneSettingsViewModel.MAX_PURGE_URLS}",
                        fontSize = 12.sp,
                        color = if (overLimit) Color(0xFFE5484D) else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onPurge(urls) }, enabled = valid) {
                Text(stringResource(R.string.zs_purge))
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.dns_cancel)) } },
    )
}

@Composable
private fun ToggleCard(title: String, subtitle: String, checked: Boolean, enabled: Boolean, onChange: (Boolean) -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                Text(subtitle, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.width(12.dp))
            Switch(checked = checked, onCheckedChange = onChange, enabled = enabled)
        }
    }
}

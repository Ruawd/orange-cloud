package jiamin.chen.orangecloud.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Cloudflare Snippet（zone 级边缘 JS）。id 用 snippet_name。 */
@Serializable
data class Snippet(
    @SerialName("snippet_name") val snippetName: String,
    @SerialName("created_on") val createdOn: String? = null,
    @SerialName("modified_on") val modifiedOn: String? = null,
)

/** Snippet 触发规则（snippet_rules）。响应 result 形态不固定，仓库容错解码。 */
@Serializable
data class SnippetRule(
    val id: String? = null,
    @SerialName("snippet_name") val snippetName: String = "",
    val expression: String = "",
    val description: String? = null,
    val enabled: Boolean? = null,
)

/**
 * snippet_rules 回写用的单条规则（不含服务端分配的 id）。
 * PUT 是「整组替换」：调用方必须带上 zone 下全部规则，漏传即删除。
 */
@Serializable
data class SnippetRuleInput(
    @SerialName("snippet_name") val snippetName: String,
    val expression: String,
    val description: String? = null,
    val enabled: Boolean = true,
)

/** PUT /zones/{id}/snippets/snippet_rules 的请求体。 */
@Serializable
data class SnippetRulesUpdate(val rules: List<SnippetRuleInput>)

/** 已有规则转回写体（可覆盖 enabled）。 */
fun SnippetRule.toInput(enabled: Boolean? = null): SnippetRuleInput = SnippetRuleInput(
    snippetName = snippetName,
    expression = expression,
    description = description,
    enabled = enabled ?: this.enabled ?: true,
)

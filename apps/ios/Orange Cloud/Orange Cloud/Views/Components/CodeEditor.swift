//
//  CodeEditor.swift
//  Orange Cloud
//
//  代码文本框：UITextView 承载正文，正文不进 SwiftUI 的视图更新。
//
//  为什么不用 TextEditor：SwiftUI 的 TextEditor 每次按键都要把整段 String 过一遍
//  视图更新，再叠上 wrangler 打包产物常见的「整个文件就一两行」——TextKit 对超长行
//  断行是病态复杂度，二者叠加会直接钉死主线程（用户反馈 NodeWarden 实测卡死）。
//  故：① UITextView 自己持有正文，SwiftUI 只在提交时取值；
//      ② 关掉自动换行改横向滚动，超长行不再参与断行计算。
//
//  注意：本组件只解决「编辑器本身」的开销，不解决超大文本的加载成本。
//  数百 KB 以上的脚本请在调用方先判定为只读（见 WorkerUploadViewModel.SourceIssue）。
//

import SwiftUI
import UIKit

struct CodeEditor: UIViewRepresentable {

    @Binding var text: String
    var isEnabled: Bool = true

    /// 行容器宽度：给足横向空间让长行不折行，又不至于用 .greatestFiniteMagnitude 触发布局异常
    private static let unwrappedWidth: CGFloat = 100_000

    func makeUIView(context: Context) -> UITextView {
        // TextKit 1：不换行这条路径在 TextKit 1 上行为确定，且超长行不会走 TextKit 2 的分段布局
        let view = UITextView(usingTextLayoutManager: false)
        view.delegate = context.coordinator
        view.font = UIFont.monospacedSystemFont(ofSize: UIFont.preferredFont(forTextStyle: .callout).pointSize,
                                                weight: .regular)
        view.autocapitalizationType = .none
        view.autocorrectionType = .no
        view.spellCheckingType = .no
        view.smartQuotesType = .no
        view.smartDashesType = .no
        view.smartInsertDeleteType = .no
        view.backgroundColor = .clear
        view.textColor = .label
        // 代码恒定 LTR：阿拉伯语等 RTL 语言下不镜像（SwiftUI 的 layoutDirection 管不到 UIView）
        view.semanticContentAttribute = .forceLeftToRight
        view.textAlignment = .left
        view.textContainerInset = UIEdgeInsets(top: 8, left: 0, bottom: 8, right: 0)
        view.textContainer.lineFragmentPadding = 0

        // 不折行 + 横向滚动
        view.textContainer.widthTracksTextView = false
        view.textContainer.lineBreakMode = .byClipping
        view.textContainer.size = CGSize(width: Self.unwrappedWidth, height: .greatestFiniteMagnitude)
        view.isScrollEnabled = true
        view.alwaysBounceVertical = true
        view.showsHorizontalScrollIndicator = true

        view.text = text
        context.coordinator.lastKnownText = text
        return view
    }

    func updateUIView(_ view: UITextView, context: Context) {
        // 只在外部真的换了内容时回写，避免把用户正在输入的正文冲掉
        if context.coordinator.lastKnownText != text {
            context.coordinator.lastKnownText = text
            if view.text != text { view.text = text }
        }
        view.isEditable = isEnabled
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(text: $text)
    }

    final class Coordinator: NSObject, UITextViewDelegate {
        private let text: Binding<String>
        /// 最近一次同步过的正文：用于区分「外部改了」和「用户在打字」
        var lastKnownText: String = ""

        init(text: Binding<String>) {
            self.text = text
        }

        func textViewDidChange(_ textView: UITextView) {
            let value = textView.text ?? ""
            lastKnownText = value
            text.wrappedValue = value
        }
    }
}

# Orange Cloud Unlocked IPA

这里用于保存 [chen2he/orange-cloud](https://github.com/chen2he/orange-cloud) 自编译解锁版 IPA。

构建时添加：

```bash
OTHER_SWIFT_FLAGS='$(inherited) -D OPENSOURCE_UNLOCKED'
SWIFT_ACTIVE_COMPILATION_CONDITIONS='$(inherited) OPENSOURCE_UNLOCKED'
```

Release 里的 IPA 是 unsigned，需要自行自签。

## 本地 macOS 构建

```bash
scripts/build-unlocked-ipa-macos.sh
```

> 说明：当前 token 没有 GitHub `workflow` scope，不能提交 Actions workflow 文件，所以本仓库不含 `.github/workflows`。

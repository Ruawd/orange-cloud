# fastlane 商店元数据（Android / Google Play）

## 用法

```bash
brew install fastlane          # 或 gem install fastlane
cd apps/android
export SUPPLY_JSON_KEY="…service-account.json"
fastlane metadata   # 只推商店文案 + 版本说明 + 截图，不传二进制
fastlane deploy track:internal   # 传 AAB + 元数据 + 截图到指定轨道（internal/alpha/beta/production）
```

## 注意

- 元数据在 `metadata/android/<locale>/`，版本说明在 `changelogs/<versionCode>.txt`。
- 截图已就绪（`phoneScreenshots`）；icon / featureGraphic 暂缺，放好 `metadata/android/<locale>/images/` 后把 `Fastfile` 里的 `skip_upload_images` 改 `false`。
- `deploy` 传到 `production` 轨道后会自动回调官网 `/api/play/release`，翻出该版本更新历史（Play 无发布 webhook，故主动通知），需环境变量 `PLAY_RELEASE_SECRET`（与 Worker secret 同值）。

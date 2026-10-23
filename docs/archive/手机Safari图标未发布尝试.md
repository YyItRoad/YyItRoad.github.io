# 手机 Safari 图标未发布尝试

日期：2026-10-23。用户明确搁置后，本次收尾撤回未提交、未部署的图标路径尝试，保留最后发布版本。原因未确认，不继续排查。

尝试仅将六页 Apple 图标查询参数路径替换为同内容的新文件名。新旧 PNG 完全相同，删除重复副本；如需恢复，可用根目录 Apple PNG 复制。以下补丁仅用于历史溯源，不作为继续执行授权。

```diff
diff --git "a/site/docs/Safari\346\224\266\350\227\217\344\270\216\344\270\273\345\261\217\345\271\225\345\233\276\346\240\207\351\200\202\351\205\215.md" "b/site/docs/Safari\346\224\266\350\227\217\344\270\216\344\270\273\345\261\217\345\271\225\345\233\276\346\240\207\351\200\202\351\205\215.md"
index eca36ca..9cfb998 100644
--- "a/site/docs/Safari\346\224\266\350\227\217\344\270\216\344\270\273\345\261\217\345\271\225\345\233\276\346\240\207\351\200\202\351\205\215.md"
+++ "b/site/docs/Safari\346\224\266\350\227\217\344\270\216\344\270\273\345\261\217\345\271\225\345\233\276\346\240\207\351\200\202\351\205\215.md"
@@ -39,3 +39,11 @@ PNG 为 180 × 180、不透明深蓝底。山形直接读取 `assets/js/icons.js
 - 六页在根路径和独立子目录下的所有图标引用均返回正常，Apple PNG 仍为同一文件。

 本次补充旨在消除普通 PNG/ICO 缺失，不能代替 iPhone 收藏界面的实际确认；未要求清除全部 Safari 数据。
+
+## 2026-10-23 手机收藏仍显示字母的定位尝试
+
+用户确认 Mac Safari 收藏正常，手机 Safari 27.0.1 收藏仍显示 Y；手机能够直接打开根目录 Apple PNG。截图中两条主页收藏均为字母占位，旧加解密工具收藏也为文字占位。
+
+已核对宝塔：www 已绑定，证书覆盖主域名及 www；301 仅匹配 www 并保留路径与参数。主域名四种声明图标在 iPhone Safari 请求头下均返回正确文件。以上不构成手机收藏后台已成功获取或更新图标的证据，确切根因仍未确认。
+
+本次仅尝试改变 Apple 图标资源的完整路径：六页引用不含查询参数的 `apple-touch-icon-mountain-c788445f035f.png`，与现有根目录 Apple PNG 逐字节相同，避免仅改变查询参数不足以触发重新发现的可能。保留 `apple-touch-icon.png` 作为标准根路径回退，原 SVG、PNG/ICO、品牌和其他图标不变。不调整 Nginx 或用户浏览器数据。上线后仍需手机实机反馈，不能将此定位尝试宣称为已确认修复。
diff --git a/site/index.html b/site/index.html
index 8c021e1..8020c98 100644
--- a/site/index.html
+++ b/site/index.html
@@ -10,7 +10,7 @@
 <link rel="icon" href="favicon.ico?v=c3321b6805ff" type="image/x-icon" sizes="16x16 32x32 48x48">
 <link rel="icon" href="assets/images/favicon.svg?v=mountain-v1" type="image/svg+xml" sizes="any">
 <link rel="icon" href="favicon.png?v=9028db5620ce" type="image/png" sizes="64x64">
-<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png?v=c788445f035f">
+<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-mountain-c788445f035f.png">
 <link rel="stylesheet" href="assets/css/tokens.css?v=557f606094be">
 <link rel="stylesheet" href="assets/css/main.css?v=60c6a6358d90">
 <script src="assets/js/theme.js?v=de001c41dd2d">
diff --git a/site/m.html b/site/m.html
index 7a181ac..76cd818 100644
--- a/site/m.html
+++ b/site/m.html
@@ -6,7 +6,7 @@
 <link rel="icon" href="favicon.ico?v=c3321b6805ff" type="image/x-icon" sizes="16x16 32x32 48x48">
 <link rel="icon" href="assets/images/favicon.svg?v=mountain-v1" type="image/svg+xml" sizes="any">
 <link rel="icon" href="favicon.png?v=9028db5620ce" type="image/png" sizes="64x64">
-<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png?v=c788445f035f">
+<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-mountain-c788445f035f.png">
 <meta http-equiv="refresh" content="0;url=tools/crypto.html">
 <title>加密工具已搬家 · YangYang.fun
 </title>
diff --git a/site/tools/crypto.html b/site/tools/crypto.html
index f35da6d..6e1029a 100644
--- a/site/tools/crypto.html
+++ b/site/tools/crypto.html
@@ -10,7 +10,7 @@
 <link rel="icon" href="../favicon.ico?v=c3321b6805ff" type="image/x-icon" sizes="16x16 32x32 48x48">
 <link rel="icon" href="../assets/images/favicon.svg?v=mountain-v1" type="image/svg+xml" sizes="any">
 <link rel="icon" href="../favicon.png?v=9028db5620ce" type="image/png" sizes="64x64">
-<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png?v=c788445f035f">
+<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon-mountain-c788445f035f.png">
 <link rel="stylesheet" href="../assets/css/tokens.css?v=557f606094be">
 <link rel="stylesheet" href="../assets/css/tools.css?v=5bdbd5b6fb20">
 <script src="../assets/js/theme.js?v=de001c41dd2d">
diff --git a/site/tools/encoder.html b/site/tools/encoder.html
index a2015fa..07dbe21 100644
--- a/site/tools/encoder.html
+++ b/site/tools/encoder.html
@@ -10,7 +10,7 @@
 <link rel="icon" href="../favicon.ico?v=c3321b6805ff" type="image/x-icon" sizes="16x16 32x32 48x48">
 <link rel="icon" href="../assets/images/favicon.svg?v=mountain-v1" type="image/svg+xml" sizes="any">
 <link rel="icon" href="../favicon.png?v=9028db5620ce" type="image/png" sizes="64x64">
-<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png?v=c788445f035f">
+<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon-mountain-c788445f035f.png">
 <link rel="stylesheet" href="../assets/css/tokens.css?v=557f606094be">
 <link rel="stylesheet" href="../assets/css/tools.css?v=5bdbd5b6fb20">
 <script src="../assets/js/theme.js?v=de001c41dd2d">
diff --git a/site/tools/json.html b/site/tools/json.html
index 554f097..1aee923 100644
--- a/site/tools/json.html
+++ b/site/tools/json.html
@@ -10,7 +10,7 @@
 <link rel="icon" href="../favicon.ico?v=c3321b6805ff" type="image/x-icon" sizes="16x16 32x32 48x48">
 <link rel="icon" href="../assets/images/favicon.svg?v=mountain-v1" type="image/svg+xml" sizes="any">
 <link rel="icon" href="../favicon.png?v=9028db5620ce" type="image/png" sizes="64x64">
-<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png?v=c788445f035f">
+<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon-mountain-c788445f035f.png">
 <link rel="stylesheet" href="../assets/css/tokens.css?v=557f606094be">
 <link rel="stylesheet" href="../assets/css/tools.css?v=5bdbd5b6fb20">
 <script src="../assets/js/theme.js?v=de001c41dd2d">
diff --git a/site/tools/timestamp.html b/site/tools/timestamp.html
index daab373..a8bd460 100644
--- a/site/tools/timestamp.html
+++ b/site/tools/timestamp.html
@@ -10,7 +10,7 @@
 <link rel="icon" href="../favicon.ico?v=c3321b6805ff" type="image/x-icon" sizes="16x16 32x32 48x48">
 <link rel="icon" href="../assets/images/favicon.svg?v=mountain-v1" type="image/svg+xml" sizes="any">
 <link rel="icon" href="../favicon.png?v=9028db5620ce" type="image/png" sizes="64x64">
-<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png?v=c788445f035f">
+<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon-mountain-c788445f035f.png">
 <link rel="stylesheet" href="../assets/css/tokens.css?v=557f606094be">
 <link rel="stylesheet" href="../assets/css/tools.css?v=5bdbd5b6fb20">
 <script src="../assets/js/theme.js?v=de001c41dd2d">
```

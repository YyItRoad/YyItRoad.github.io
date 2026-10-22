#!/usr/bin/env bash
# 通过既有部署账号执行；只处理已核对的站点目录与私有备份。
set -Eeuo pipefail
operation=${1:?}
release_id=${2:?}
expected_sha=${3:?}
expected_manifest=${4:?}
[[ "$release_id" =~ ^[0-9]+-[0-9]+$ ]]
[[ "$expected_sha" =~ ^[0-9a-f]{40}$ ]]
[[ "$expected_manifest" =~ ^[0-9a-f]{64}$ ]]
webroot=/www/wwwroot/yangyang.fun
stage="$webroot/__deploy-test"
test -d "$webroot"
test "$(readlink -f "$webroot")" = "$webroot"
test ! -L "$stage"
test "$(readlink -f "$stage")" = "$stage"
command -v python3 >/dev/null
command -v rsync >/dev/null
backup_base="$HOME/yangyang-fun-backups"
test ! -L "$backup_base"
case "$(readlink -f "$HOME")/yangyang-fun-backups" in "$webroot"|"$webroot"/*) exit 1;; esac
backup_dir="$backup_base/$release_id"
protected=(--exclude='/__deploy-test/' --exclude='/.well-known/' --exclude='/.user.ini' --exclude='/.htaccess' --exclude='/404.html')

restore() {
  test -s "$backup_dir/previous-index.sha256"
  test -s "$backup_dir/content/index.html"
  rsync -a --checksum --delete --delay-updates "${protected[@]}" "$backup_dir/content/" "$webroot/"
  actual=$(sha256sum "$webroot/index.html" | cut -d ' ' -f 1)
  test "$actual" = "$(cat "$backup_dir/previous-index.sha256")"
  echo '旧站已从本次私有备份恢复，首页哈希一致。'
}
if [ "$operation" = rollback ]; then
  restore
  exit 0
fi
test "$operation" = promote

# 源文件清单必须和 GitHub 中已验收版本生成的清单字节一致。
python3 - "$stage" "$expected_sha" "$expected_manifest" <<'PY'
import hashlib, json, sys
from pathlib import Path, PurePosixPath
root = Path(sys.argv[1])
manifest_bytes = (root / 'deployment-manifest.json').read_bytes()
assert hashlib.sha256(manifest_bytes).hexdigest() == sys.argv[3], '隔离清单与已验收源码不同'
manifest = json.loads(manifest_bytes)
assert manifest['commit'] == sys.argv[2]
assert (root / 'deployment-version.txt').read_text().strip() == sys.argv[2]
actual = set()
for p in root.rglob('*'):
    assert not p.is_symlink(), '隔离资源不能含符号链接'
    if p.is_file(): actual.add(p.relative_to(root).as_posix())
assert actual == set(manifest['files']) | {'deployment-manifest.json'}, '隔离目录有额外或缺失文件'
for rel, expected in manifest['files'].items():
    path = PurePosixPath(rel)
    assert not path.is_absolute() and '..' not in path.parts
    assert hashlib.sha256((root / rel).read_bytes()).hexdigest() == expected, rel
print('已验收源文件验证通过：', len(manifest['files']))
PY

required_kb=$(du -sk --exclude=__deploy-test "$webroot" | cut -f 1)
available_kb=$(df -Pk "$HOME" | awk 'END {print $4}')
test "$available_kb" -gt "$((required_kb * 2 + 10240))"
install -d -m 700 "$backup_base"
test ! -e "$backup_dir"
install -d -m 700 "$backup_dir"
rsync -a --exclude='/__deploy-test/' "$webroot/" "$backup_dir/content/"
sha256sum "$webroot/index.html" | cut -d ' ' -f 1 > "$backup_dir/previous-index.sha256"
test "$(sha256sum "$backup_dir/content/index.html" | cut -d ' ' -f 1)" = "$(cat "$backup_dir/previous-index.sha256")"
printf '%s\n' "$expected_sha" > "$backup_dir/approved-source.txt"

# 保护项按名称、类型、权限与文件哈希记录，发布后再次比较。
protect_state() {
  python3 - "$webroot" <<'PY'
import hashlib, json, stat, sys
from pathlib import Path
root = Path(sys.argv[1]); state = {}
for name in ['__deploy-test', '.well-known', '.user.ini', '.htaccess', '404.html']:
    target = root / name
    if not target.exists() and not target.is_symlink(): continue
    paths = [target] + (list(target.rglob('*')) if target.is_dir() and not target.is_symlink() else [])
    for p in paths:
        meta = p.lstat()
        value = {'mode': stat.S_IMODE(meta.st_mode), 'type': stat.S_IFMT(meta.st_mode)}
        if p.is_symlink(): value['link'] = str(p.readlink())
        elif p.is_file(): value['sha256'] = hashlib.sha256(p.read_bytes()).hexdigest()
        state[p.relative_to(root).as_posix()] = value
print(json.dumps(state, sort_keys=True))
PY
}
protect_state > "$backup_dir/protected-before.json"
echo "私有备份已完成：\$HOME/yangyang-fun-backups/$release_id/content"
du -sk "$backup_dir/content"
changed=0
on_error() {
  code=$?
  trap - ERR
  if [ "$changed" = 1 ]; then
    echo '发布校验失败，自动恢复旧站。'
    restore || echo '自动恢复失败，需要检查本次私有备份。'
  fi
  exit "$code"
}
trap on_error ERR
changed=1
rsync -a --checksum --delete --delay-updates "${protected[@]}" "$stage/" "$webroot/"
python3 - "$webroot" "$expected_sha" "$expected_manifest" <<'PY'
import hashlib, json, sys
from pathlib import Path
root = Path(sys.argv[1]); content = (root / 'deployment-manifest.json').read_bytes()
assert hashlib.sha256(content).hexdigest() == sys.argv[3]
manifest = json.loads(content)
assert manifest['commit'] == sys.argv[2]
assert (root / 'deployment-version.txt').read_text().strip() == sys.argv[2]
for rel, expected in manifest['files'].items():
    assert hashlib.sha256((root / rel).read_bytes()).hexdigest() == expected, rel
print('正式根目录文件哈希通过：', len(manifest['files']))
PY
protect_state > "$backup_dir/protected-after.json"
cmp "$backup_dir/protected-before.json" "$backup_dir/protected-after.json"
echo '证书目录、站点配置、404 页面与隔离目录均保持不变。'
echo "正式发布源码版本：$expected_sha"
trap - ERR

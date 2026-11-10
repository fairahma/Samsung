"""Build a TizenBrew source ZIP and explicitly unsigned standalone widget."""
from pathlib import Path
import json
import zipfile
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent
out = root.parent
metadata = json.loads((root / 'package.json').read_text(encoding='utf-8'))
ET.parse(root / 'config.xml')
assert (root / metadata['appPath']).is_file()
assert (root / metadata['serviceFile']).is_file()
module_files = [root / name for name in ['package.json', 'service.js', 'config.xml', 'icon.png', 'README.md', 'TESTING.md', 'build.py']]
app_files = sorted((root / 'app').glob('*'))
with zipfile.ZipFile(out / 'Cinema-TV-S95B-TizenBrew.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in module_files + app_files:
        archive.write(file, file.relative_to(root).as_posix())
with zipfile.ZipFile(out / 'Cinema-TV-S95B-UNSIGNED.wgt', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in [root / 'config.xml', root / 'icon.png'] + app_files:
        archive.write(file, file.relative_to(root).as_posix())
print('Built TizenBrew module ZIP and UNSIGNED Samsung widget. This command packages files only.')

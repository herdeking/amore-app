import json

ONESIGNAL_APP_ID = 'd4895865-ee18-4353-9acc-015c888135cd'

# Add plugin to app.json
with open('/data/data/com.termux/files/home/amore-app/app.json', 'r') as f:
    d = json.load(f)

plugins = d['expo']['plugins']
has_os = any('onesignal' in str(p).lower() for p in plugins)
if not has_os:
    plugins.insert(1, ['onesignal-expo-plugin', {'mode': 'production'}])
    d['expo']['plugins'] = plugins
    with open('/data/data/com.termux/files/home/amore-app/app.json', 'w') as f:
        json.dump(d, f, indent=2)
    print('✅ OneSignal plugin added to app.json')
else:
    print('ℹ️ Already in plugins')

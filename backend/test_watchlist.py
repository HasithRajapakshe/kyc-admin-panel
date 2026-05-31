import urllib.request
import urllib.error

req = urllib.request.Request(
    'http://localhost:8000/api/watchlist',
    data=b'{"nic_number": "123", "reason": "test"}',
    headers={'Content-Type': 'application/json', 'Cookie': 'access_token=YOUR_TOKEN'},
    method='POST'
)
try:
    print(urllib.request.urlopen(req).read())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read())

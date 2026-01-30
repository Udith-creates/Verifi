const https = require('https');

const options = {
    hostname: 'api.github.com',
    path: '/repos/iden3/circom/releases/latest',
    headers: { 'User-Agent': 'node.js' }
};

https.get(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const asset = json.assets.find(a => a.name.includes('windows') && a.name.includes('amd64'));
            if (asset) {
                console.log(asset.browser_download_url);
            } else {
                console.log("No windows asset found");
                console.log("Available assets:", json.assets.map(a => a.name));
            }
        } catch (e) {
            console.log("Error parsing JSON");
        }
    });
}).on('error', (e) => {
    console.error(e);
});

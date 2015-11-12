var rest_1 = require('../../utils/rest');
function createHost(client, config) {
    return rest_1.basicRestCall(client, '/manage/v2/hosts', "createHost/" + config['host-name'], 'POST', config, {
        'Content-Type': 'application/json'
    });
}
exports.createHost = createHost;
//# sourceMappingURL=createHost.js.map
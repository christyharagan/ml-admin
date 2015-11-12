var rest_1 = require('../../utils/rest');
function getHost(client, name) {
    return rest_1.basicRestCall(client, "/manage/v2/hosts/" + name + "?format=json", "getHost/" + name);
}
exports.getHost = getHost;
//# sourceMappingURL=getHost.js.map
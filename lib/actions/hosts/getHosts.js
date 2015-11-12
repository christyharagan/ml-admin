var rest_1 = require('../../utils/rest');
function getHosts(client) {
    return rest_1.basicRestCall(client, "/manage/v2/hosts?format=json", "getHosts");
}
exports.getHosts = getHosts;
//# sourceMappingURL=getHosts.js.map
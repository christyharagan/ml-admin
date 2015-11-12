var rest_1 = require('../../utils/rest');
function deleteHost(client, name) {
    return rest_1.basicRestCall(client, "/manage/v2/hosts/" + name + "?format=json", "deleteHost/" + name, 'DELETE');
}
exports.deleteHost = deleteHost;
//# sourceMappingURL=deleteHost.js.map
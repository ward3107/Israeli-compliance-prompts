/* Online builds load only the public source catalog. The portable build replaces
 * this file with an embedded catalog so file:// needs no fetch or local server. */
(function (host) {
  'use strict';
  var pending;
  host.ToolkitSource = {
    load: function () {
      if (!pending) pending = fetch('toolkit.json', {cache:'no-cache'}).then(function (response) {
        if (!response.ok) throw new Error('Toolkit unavailable');
        return response.json();
      });
      return pending;
    }
  };
})(window);

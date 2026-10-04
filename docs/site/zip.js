/* ZIP store format: UTF-8 names, CRC32 and no external dependency. */
(function (host) {
  'use strict';
  var encoder = new TextEncoder();
  function crc(bytes) {
    var value = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) {
      value ^= bytes[i];
      for (var bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    }
    return (value ^ 0xffffffff) >>> 0;
  }
  function header(size) { var bytes = new Uint8Array(size); return [bytes, new DataView(bytes.buffer)]; }
  host.ToolkitZip = function (files) {
    var chunks = [], directory = [], offset = 0, count = 0;
    var paths = Object.keys(files), seen = new Set();
    if (paths.length > 2000) throw new Error('Too many archive entries');
    paths.sort().forEach(function (path) {
      // ZIPs are extracted on Windows as well as POSIX. Reject aliases,
      // drive paths, traversal, control characters and reserved filenames.
      if (!path || /[\\:\u0000-\u001f\u007f]/.test(path) || path.split('/').some(function (part) {
        return !part || part === '.' || part === '..' || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part);
      }) || seen.has(path.toLowerCase()) || typeof files[path] !== 'string') throw new Error('Invalid archive path or content');
      seen.add(path.toLowerCase());
      var name = encoder.encode(path), data = encoder.encode(files[path]), sum = crc(data);
      if (name.length > 1024 || data.length > 10 * 1024 * 1024 || offset + data.length > 32 * 1024 * 1024) throw new Error('Archive size limit exceeded');
      var local = header(30), central = header(46), l = local[1], c = central[1];
      l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true); l.setUint16(12, 33, true);
      l.setUint32(14, sum, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, name.length, true);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true); c.setUint16(14, 33, true);
      c.setUint32(16, sum, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      chunks.push(local[0], name, data); directory.push(central[0], name); offset += 30 + name.length + data.length; count++;
    });
    var dirLength = directory.reduce(function (size, bytes) { return size + bytes.length; }, 0), end = header(22), e = end[1];
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, count, true); e.setUint16(10, count, true); e.setUint32(12, dirLength, true); e.setUint32(16, offset, true);
    return new Blob(chunks.concat(directory, [end[0]]), { type: 'application/zip' });
  };
})(typeof window === 'undefined' ? globalThis : window);

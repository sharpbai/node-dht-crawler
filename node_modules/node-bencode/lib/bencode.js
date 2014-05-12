// BitTorrent metainfo files (.torrent) are encoded using bencoding -
// https://wiki.theory.org/BitTorrentSpecification#Bencoding
//
// This library provides a few functions for encoding and decoding bencoded
// inputs.
//

var q = require('q');

var Bencode = {};

Bencode.decode = function(buffer) {
  return Bencode.parse(Bencode.tokenize(buffer)).shift();
};

Bencode.encode = function(input) {
  if (input instanceof Buffer) {
    return Buffer.concat([ Buffer(input.length.toString() + ':'), input ]);

  } else if (typeof(input) === 'object' && (input instanceof Array)) {
    return Buffer.concat([
        Buffer('l'),
        Buffer.concat(input.map(Bencode.encode)),
        Buffer('e')
    ]);

  } else if(typeof(input) === 'object') {
    var bufs = Object.keys(input).sort().map(function(k) {
      var b = Buffer.concat([
        Bencode.encode(k),
        Bencode.encode(input[k])
      ]);
      return b;
    });
    return Buffer.concat([ Buffer('d'), Buffer.concat(bufs), Buffer('e') ]);

  } else if (typeof(input) === 'string') {
    return Buffer(input.length.toString() + ':' + input);

  } else if (typeof(input) === 'number') {
    return Buffer('i' + input + 'e');

  }
};

Bencode.tokenize = function(buffer) {
  var ACCEPT = 0, STRING = 1, INTEGER = 2, LIST = 3, DICT = 4;
  var pos = 0, state = ACCEPT;

  var tokens = [];

  while (pos < buffer.length) {
    switch (state) {
      case ACCEPT:
        var chr = String.fromCharCode(buffer[pos]);
        if (chr.match(/\d/)) state = STRING;
        if (chr === 'i') state = INTEGER;
        if (chr === 'l') state = LIST;
        if (chr === 'd') state = DICT;
        if (chr === 'e') {
          tokens.push(chr);
          pos++;
          continue;
        }
        if (! state) return tokens;
        break;

      case STRING:
        var tokenizeStr = function(buffer) {
          var strlen = 0;
          for (var i = 0; i < buffer.length; i++) {
            var c = String.fromCharCode(buffer[i]);
            if (! c.match(/\d/)) break;
            strlen = parseInt(strlen.toString() + c, 10);
          }

          var start = strlen.toString().length + 1; // after '[num]:'
          var string = buffer.slice(start, start + strlen);
          return ['s', string];
        };

        var strToken = tokenizeStr(buffer.slice(pos));
        tokens = tokens.concat(strToken);
        pos += (strToken[1].length.toString().length + 1 + strToken[1].length);
        state = ACCEPT;
        break;

      case INTEGER:
        var tokenizeInt = function(buffer) {
          var integer = 0;
          for (var i = 0; i < buffer.length; i++) {
            var c = String.fromCharCode(buffer[i]);
            if (c.match(/\d/)) integer = parseInt(integer.toString() + c, 10);
            if (c === 'e') break;
          }
          return ['i', integer];
        };

        var intToken = tokenizeInt(buffer.slice(pos));
        tokens = tokens.concat(intToken);
        pos += (1 + intToken[1].toString().length + 1);
        state = ACCEPT;
        break;

      case LIST:
      case DICT:
        var start = String.fromCharCode(buffer[pos]);
        tokens.push(start);
        pos++;
        state = ACCEPT;
        break;
    }
  }
  return tokens;
};

Bencode.parse = function(tokens) {
  var ACCEPT = 0, STRING = 1, INTEGER = 2, LIST = 3, DICT = 4;
  var pos = 0, state = ACCEPT;

  var output = [];

  while (pos < tokens.length) {
    switch (state) {
      case ACCEPT:
        if (tokens[pos] === 's') state = STRING;
        if (tokens[pos] === 'i') state = INTEGER;
        if (tokens[pos] === 'l') state = LIST;
        if (tokens[pos] === 'd') state = DICT;
        if (tokens[pos] === 'e') pos++;
        break;

      case STRING:
        pos++;
        var string = tokens[pos];
        output.push(string);
        pos++;
        state = ACCEPT;
        break;

      case INTEGER:
        pos++;
        var integer = parseInt(tokens[pos], 10);
        output.push(integer);
        pos++;
        state = ACCEPT;
        break;

      case LIST:
        pos++;

        var end = pos;
        var inner = [];
        for (var i = pos; i < tokens.length; i++) {
          if (tokens[i] === 'e' && !inner.length) end = i;
          if (tokens[i] === 'd' || tokens[i] === 'l') inner.push(tokens[i]);
          if (tokens[i] === 'e') inner.pop();
        }

        var listTokens = tokens.slice(pos, end);
        var list = Bencode.parse(listTokens);

        output.push(list);
        state = ACCEPT;
        pos += (end - pos);
        break;

      case DICT:
        pos++;

        var end = pos;
        var inner = [];
        for (var i = pos; i < tokens.length; i++) {
          if (tokens[i] === 'e' && !inner.length) end = i;
          if (tokens[i] === 'd' || tokens[i] === 'l') inner.push(tokens[i]);
          if (tokens[i] === 'e') inner.pop();
        }

        var dictTokens = tokens.slice(pos, end);
        var entries = Bencode.parse(dictTokens);

        var dict = {};
        while (entries.length) {
          var pair = entries.splice(0, 2);
          dict[pair[0]] = pair[1];
        }
        output.push(dict);
        state = ACCEPT;
        pos += (end - pos);
        break;
    }
  }

  return output;
};

module.exports = Bencode;


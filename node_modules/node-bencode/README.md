node-bencode
============

Small node.js library for encoding and decoding with [Bencode][].

[Bencode]: https://wiki.theory.org/BitTorrentSpecification#Bencoding

# examples

```js
var Bencode = require('node-bencode');

var thing = {
  a: Buffer('hello world'),
  b: [1,[2],3,4],
  c: {one: Buffer('ONE'), two: [Buffer('TWO'), 3]}
};

var buffer = Bencode.encode(thing);
console.log(buffer.toString());
// d1:a11:hello world1:bli1eli2eei3ei4ee1:cd3:one3:ONE3:twol3:TWOi3eeee

var json = Bencode.decode(buffer);
console.log(json);
// { a: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>,
//  b: [ 1, [ 2 ], 3, 4 ],
//  c: { one: <Buffer 4f 4e 45>, two: [ <Buffer 54 57 4f>, 3 ] } 

var rebencoded = Bencode.encode(json);
console.log(rebencoded.toString());
// d1:a11:hello world1:bli1eli2eei3ei4ee1:cd3:one3:ONE3:twol3:TWOi3eeee
```

# license

MIT

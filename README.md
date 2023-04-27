# hot-hypermedia-server
Simple live reload server for hypermedia dev

Project adapted from: https://github.com/1wheel/hot-server

No config [hot-hypermedia-server](https://github.com/DevGrammo/hot-hypermedia-server) for hypermedia: `htmx` and `hyperscript` friendly.

## Instructions & Usage

This `hot-server` extends https://github.com/1wheel/hot-server. 

Save changes to `*.js` or `*.hs` or `*.css` and they'll be injected via a websocket without a full refresh.

### additional features
- `_hyperscript` files are now reloadable;
- It is possible to include a new list of comma separated directories to watch. On changes
from those directories the `document` will emit the event `codereloaded`. Listen to this event 
to implement a custom reload logic. The event can be interecepted with `htmx` using e.g. `hx-trigger` and `hx-on`, `hyperscript` ..;
- The server accepts POST requests at `/`. The `document` will emit the event
`codereloaded` including the request's body into the event's detail. Listen to this event to 
implement a custom reload logic. 
```
<body _="on codereload from document call alert('reload')">
...
</body>
```
### Usage 
Download the repo, then 
```
yarn add path-to-project
```
From your working dir: 
```
yarn hypermedia-hot-server --dir=your-dir  --codereload=your-src-to-watch
```

Default port is 3989; `hypermedia-hot-server --port=4444` sets the port.

`hypermedia-hot-server --dir=build` sets the directory to serve. 

`hypermedia-hot-server --codereload=dir1,dir2` sets the src directory to watch. Changes will dispatch the event `coreload` on document.

`hot-server --ignore=data-raw` skips watching a folder.

`hot-server --consoleclear` runs `console.clear()` after js files are changed.

`hot-server --cert=../../cert/localhost.pem` passes in a [certificate](https://web.dev/how-to-use-local-https/) and enables https. 

Credits to [@1wheel](https://github.com/1wheel) for the base server

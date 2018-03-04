module.exports = function() {
  return function(deck) {
    var clients = [],
      silence = false,
      broadcast = function() {
        if (!silence)
          clients.forEach(function(client) {
            client.postMessage(['CURSOR', (deck.slide() + 1) + '.' + deck.bullet()].join(' '), '*');
          });
      },
      hasStep = function(slide, step) {
        return deck.bullets(slide).length > step;
      },
      navigateTo = function(cursor) {
        var slide, step;
        if (cursor.indexOf('.') !== -1) {
          var cursorv = cursor.split('.', 2).map(function(n) { return ~~n; });
          slide = cursorv[0] - 1;
          step = cursorv[1];
        }
        else {
          slide = ~~cursor - 1;
          step = 0;
        }
        if (step > 0 && !hasStep(slide, step)) {
          slide += 1;
          step = 0;
        }
        if (slide < 0) slide = 0;
        else if (slide >= deck.slides.length) {
          slide = deck.slides.length - 1;
        }
        if (slide === deck.slide() && step === deck.bullet()) return;
        silence = true;
        deck.slide(slide, { preview: true });
        deck.bullet(step);
        silence = false;
        broadcast();
      },
      onMessage = function(e) {
        var argv = e.data.split(' ');
        var client = e.source;
        switch (argv[0]) {
          case 'REGISTER':
            clients.push(client);
            client.postMessage(['REGISTERED', encodeURIComponent(document.title || 'Untitled'), deck.slides.length].join(' '), '*');
            if (argv[1]) navigateTo(argv[1]);
            else broadcast();
            break;
          case 'FORWARD':
            deck.next();
            break;
          case 'BACK':
            deck.prev();
            break;
          case 'START':
            deck.slide(0, { preview: true });
            break;
          case 'END':
            deck.slide(deck.slides.length - 1, { preview: true });
            break;
          case 'SET_CURSOR':
            navigateTo(argv[1] || '1');
            break;
          case 'GET_NOTES':
            var node = deck.slides[deck.slide()].querySelector('[role=note],[role=notes]'),
              content = node ? encodeURIComponent(node.innerHTML) : '';
            client.postMessage(['NOTES', content].join(' '), '*');
            break;
          case 'TOGGLE_OVERVIEW':
            deck.fire("overview");
            break;
          case 'TOGGLE_CONTENT':
            deck.fire("blackout");
            break;
        }
      };
    deck.on('activate', broadcast);
    deck.on('activateBullet', broadcast);
    deck.on('destroy', function() {
      removeEventListener('message', onMessage, false);
    });
    addEventListener('message', onMessage, false);
  };
};

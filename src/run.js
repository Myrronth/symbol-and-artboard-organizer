import sketch from 'sketch'

const horizontalGap = 50;
const verticalGap = 100;
const symbolArtboardGap = 500;

function orderArtboards(artboardProxies, page) {
  artboardProxies = artboardProxies.sort((artboardProxy1, artboardProxy2) => {
      if(artboardProxy1.identifier < artboardProxy2.identifier) {
          return -1;
      } else if(artboardProxy1.identifier > artboardProxy2.identifier) {
          return 1;
      } else {
          return artboardProxy1.artboard.name().localeCompare(artboardProxy2.artboard.name());
      }
  });

  var x = 0;
  var y = 0;
  var maxHeight = 0;
  var lastArtboardProxy = null;

  artboardProxies.forEach(function(artboardProxy) {
      var artboard = artboardProxy.artboard;
      var scope = artboardProxy.scope;

      if(lastArtboardProxy) {
          if(lastArtboardProxy.scope != scope && lastArtboardProxy.artboard.name != scope) {
              x = 0;
              y += maxHeight + verticalGap;

              maxHeight = 0;
          } else {
              x += lastArtboardProxy.artboard.frame.width + horizontalGap;
              y = lastArtboardProxy.artboard.frame.y;
          }
      } else {
          x = 0;
          y = 0;
      }

      artboard.frame.x = x;
      artboard.frame.y = y;

      maxHeight = Math.max(maxHeight, artboardProxy.artboard.frame.height);
      lastArtboardProxy = artboardProxy;
  });

  artboardProxies.reverse().forEach(artboardProxy => {
      var artboard = artboardProxy.artboard;

      artboard.sketchObject.moveToLayer_beforeLayer(page.sketchObject, null);
      artboard.sketchObject.select_byExpandingSelection(false, true);
  });
}

function orderSymbols(symbolProxies, page, hasArtboards) {
  symbolProxies = symbolProxies.sort((symbolProxy1, symbolProxy2) => {
      return symbolProxy1.symbol.name.localeCompare(symbolProxy2.symbol.name);
  });

  var x = 0;
  var y = 0;
  var maxWidth = 0;
  var maxHeight = 0;
  var lastSymbolProxy = null;

  symbolProxies.forEach(symbolProxy => {
      var symbol = symbolProxy.symbol;
      var scope = symbolProxy.scope;

      if(lastSymbolProxy) {
          if(lastSymbolProxy.scope != scope && lastSymbolProxy.symbol.name != scope) {
              x = symbolProxy.x = x + maxWidth + verticalGap;
              y = symbolProxy.y = 0;
              maxWidth = 0;
          } else {
              x = symbolProxy.x = lastSymbolProxy.x;
              y = symbolProxy.y = y + lastSymbolProxy.symbol.frame.height + horizontalGap;
          }
      } else {
          x = symbolProxy.x = 0;
          y = symbolProxy.y = 0;
      }

      lastSymbolProxy = symbolProxy;
      maxWidth = Math.max(maxWidth, symbol.frame.width);

      if(hasArtboards) {
          maxHeight = Math.max(maxHeight, y + symbol.frame.height);
      } else {
          symbol.frame.x = x;
          symbol.frame.y = y;
      }
  });

  if(hasArtboards) {
      symbolProxies.forEach(symbolProxy => {
          var symbol = symbolProxy.symbol;
          var x = symbolProxy.x;
          var y = symbolProxy.y - maxHeight - symbolArtboardGap;

          symbol.frame.x = x;
          symbol.frame.y = y;
      });
  }

  symbolProxies.reverse().forEach(symbolProxy => {
      var symbol = symbolProxy.symbol;

      symbol.sketchObject.moveToLayer_beforeLayer(page.sketchObject, null);
      symbol.sketchObject.select_byExpandingSelection(false, true);
  });
}

export default function() {
  const doc = sketch.getSelectedDocument()
  const page = doc.selectedPage
  const layers = page.layers
  const artboards = layers.filter(layer => layer.type == 'Artboard')
  const symbols = layers.filter(layer => layer.type == 'SymbolMaster')

  const artboardProxies = artboards.map(artboard => {
    var identifier = "";
    var scopesAndName = artboard.name.split('/');
    var scopes = scopesAndName.slice(0, scopesAndName.length - 1);
    var depth = scopes.length;

    scopesAndName.forEach(scope => {
        scope = scope.trim();
        var match = scope.match(/([0-9]{2}).*/);
        identifier += match ? match[1] : scope;
    });

    identifier += "00".repeat(Math.max(0, 2 - depth));

    return {
      identifier: identifier,
      scope: scopes.join('/').trim(),
      artboard: artboard
    }
  })

  const symbolProxies = symbols.map(symbol => {
    var scopesAndName = symbol.name.split('/');
    var scopes = scopesAndName.slice(0, scopesAndName.length - 1);

    return {
      identifier: symbol.name,
      scope: scopes.join('/').trim(),
      symbol: symbol
    }
  })

  orderSymbols(symbolProxies, page, artboards.length > 0)
  orderArtboards(artboardProxies, page)
}

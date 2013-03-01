// ==UserScript==
// @id             bozofilter@danguyf
// @name           iitc: Bozo Filter
// @version        0.1
// @description    Hide public COMM tab posts by bozos.
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @grant          GM_getValue
// @grant          GM_setValue
// ==/UserScript==

function wrapper() {

// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function')
  window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.bozoFilter = function() {};

window.plugin.bozoFilter.bozoPatterns = [];

// get bozo list from localStorage
var bozoList = null;
if ( typeof(Storage) !== "undefined" )  bozoList = localStorage.IITCbozoList;
if (bozoList === null)  bozoList = 'verity,beckysupeepants,daisyduke';  // some default trolls
window.plugin.bozoFilter.bozoList = bozoList.split(',');

window.plugin.bozoFilter.filterBozos = function(data) {
  console.log('Checking for bozos: ' + window.plugin.bozoFilter.getBozoList() );

  $.each(chat._publicData, function(ind, payload) {
    // check to see if this is PLAYER_GENERATED, i.e. not auto, and that we haven't modified it already
    if (payload[1] === false) {
      var newMsg = payload[2];
      var nick = "";
      var isBozo = false;
      for (var i=0; i < window.plugin.bozoFilter.bozoList.length; i++) {
        var bozo = window.plugin.bozoFilter.bozoList[i];

        // check for bozo
        if ( window.plugin.bozoFilter.bozoPatterns[bozo].test(newMsg) ) {
          isBozo = true;
          nick = bozo;
          break;
        }
      }

      markAt = newMsg.indexOf('<mark');

      // find the nick if it wasn't a bozo
      if (!isBozo) {
        nickStartAt = newMsg.indexOf('>', markAt) + 1;
        nickEndAt = newMsg.indexOf('</mark>', nickStartAt);
        nick = newMsg.substring(nickStartAt, nickEndAt);
      }

      // check contents of last <td></td>
      var startsAt = newMsg.lastIndexOf('<td>');
      startsAt += 4;
      var endsAt = newMsg.indexOf('</td>', startsAt);
      var thisTXT = newMsg.substring(startsAt, endsAt);

      if (newMsg.indexOf('class="bozo') == -1) {
        // wrap existing msg in <span class="original-[nick]">
        var newTXT = '<span class="original-' + nick + '"';
        if (isBozo)  newTXT += ' style="display: none;"';
        newTXT += '>' + thisTXT + '</span>';

        // add bozo msg
        newTXT += '<span class="bozo-' + nick + '" style="color: #666;';
        if (!isBozo)  newTXT += ' display: none;';
        newTXT += '">This user is a bozo.</span>';

        // put it all back together
        newMsg = newMsg.substring(0, startsAt) + newTXT + newMsg.substr(endsAt);

        // stick the controls in after the name
        newMsg = newMsg.substring(0, markAt) + '<span class="controls-' + nick + '" title="Toggle bozo filtering" style="color: ' + (isBozo ? '#8C3131;' : '#555;') + ' cursor: pointer;" onclick="window.plugin.bozoFilter.toggleBozo(\'' + nick + '\');">&#8856;</span> ' + newMsg.substr(markAt);
      } else if (isBozo) {
        // flip display if necessary
        newMsg = newMsg.replace('original-' + nick + '">', 'original-' + nick + '" style="display: none;">');
        newMsg = newMsg.replace('bozo-' + nick + '" style="color: #666; display: none;">', 'bozo-' + nick + '" style="color: #666;">');
        newMsg = newMsg.replace('#555;', '#8C3131;');
      } else {
        // flip display if necessary
        newMsg = newMsg.replace('original-' + nick + '" style="display: none;">', 'original-' + nick + '">');
        newMsg = newMsg.replace('bozo-' + nick + '" style="color: #666;">', 'bozo-' + nick + '" style="color: #666; display: none;">');
        newMsg = newMsg.replace('#8C3131;', '#555;');
      }

      //console.log(newMsg);
      chat._publicData[ind] = [ payload[0], payload[1], newMsg, payload[3] ];
    }
  });
}

function refreshBozo() {
    for (var i=0; i < window.plugin.bozoFilter.bozoList.length; i++) {
      var bozo = window.plugin.bozoFilter.bozoList[i];
      $("span.original-" + bozo).hide();
      $("span.bozo-" + bozo).show();
    }
}

window.plugin.bozoFilter.toggleBozo = function(bozo) {
  var isVisible = $("span.original-" + bozo).is(':visible');

  if (!isVisible) {
    window.plugin.bozoFilter.removeBozo(bozo);
    $("span.controls-" + bozo).css('color', '#555');
  } else {
    window.plugin.bozoFilter.addBozo(bozo);
    $("span.controls-" + bozo).css('color', '#8C3131');
  }

  $("span.original-" + bozo).toggle();
  $("span.bozo-" + bozo).toggle();

  window.plugin.bozoFilter.filterBozos();
  localStorage.IITCbozoList = window.plugin.bozoFilter.getBozoList();
}

window.plugin.bozoFilter.getBozoList = function() {
  return window.plugin.bozoFilter.bozoList.join(',');
}

window.plugin.bozoFilter.addBozo = function(bozo) {
  if ( window.plugin.bozoFilter.bozoList.indexOf(bozo) == -1 )  window.plugin.bozoFilter.bozoList.push(bozo);

  var patt = new RegExp("<mark [^>]*>" + bozo + "</mark>");
  window.plugin.bozoFilter.bozoPatterns[bozo] = patt;

  //console.log('bozoList: ' + window.plugin.bozoFilter.getBozoList() );
}

window.plugin.bozoFilter.removeBozo = function(bozo) {
  var bozoAt = window.plugin.bozoFilter.bozoList.indexOf(bozo);
  window.plugin.bozoFilter.bozoList.splice(bozoAt, 1);

  //console.log('bozoList: ' + window.plugin.bozoFilter.getBozoList() );
}

window.plugin.bozoFilter.setup = function() {
  for (var i=0; i < window.plugin.bozoFilter.bozoList.length; i++) {
    var bozo = window.plugin.bozoFilter.bozoList[i];
    var patt = new RegExp("<mark [^>]*>" + bozo + "</mark>");
    window.plugin.bozoFilter.bozoPatterns[bozo] = patt;
  }

  window.addHook('publicChatDataAvailable', window.plugin.bozoFilter.filterBozos);
}
var setup = window.plugin.bozoFilter.setup;

// PLUGIN END //////////////////////////////////////////////////////////
if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}

} // wrapper end

// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);

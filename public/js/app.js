$(document).ready(function () {

  // TODO: populate page with scraped headlines
  // use the materialize CSS cards
  $.getJSON("/scrape/left", function(data) {
    for(i=0 ; i < data.length ; i++) {
      var matCard = '<div class="col s12 m7">';
      matCard += '<h2 class="header">' + data[i].title + '</h2>';
      matCard += '<div class="card horizontal"><div class="card-stacked">';
      matCard += '<div class="card-content"><p>' + data[i].link + '</p></div>';
      $("#left-cards").append(matCard);
    };
  });

  $.getJSON("/scrape/right", function(data) {
    for(i=0 ; i < data.length ; i++) {
      var matCard = '<div class="col s12 m7">';
      matCard += '<h2 class="header">' + data[i].title + '</h2>';
      matCard += '<div class="card horizontal"><div class="card-stacked">';
      matCard += '<div class="card-content"><p>' + data[i].link + '</p></div>';
      $("#right-cards").append(matCard);
    };
  });
  // TODO: add a button to switch from left, center, and right bias

});

/* 
<div class="col s12 m7">
  <h2 class="header">Horizontal Card</h2>
  <div class="card horizontal">
    <div class="card-stacked">
      <div class="card-content">
        <p>I am a very simple card. I am good at containing small bits of information.</p>
      </div>
      <div class="card-action">
        <a href="#">This is a link</a>
      </div>
    </div>
  </div>
</div> */
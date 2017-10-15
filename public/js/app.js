$(document).ready(function() {
  // jQuery function so certain classes work on dynamic elements
  $("#modal1").modal();


  $(document).on("click", "#modal1", function() {
    var thisId = $(this).attr("data-id");
    console.log(thisId);

  });
});
